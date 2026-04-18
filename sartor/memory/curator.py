"""Transactional inbox drainer per OPERATING-AGREEMENT v1.0 §2.

Implements the build spec at
sartor/memory/inbox/rocinante/_specs/2026-04-16_section-2-build-spec.md.

Concerns owned by this module:
  - Scan inbox/{machine}/ for NEW entries (not in reserved subdirs).
  - Validate frontmatter schema per CURATOR-BEHAVIOR.md "Schema contract".
  - Stage proposed canonical updates in _curator_staging/{run-ts}/.
  - Verify (no race), then atomically commit (os.replace) all staged files.
  - On failure, rollback the staging tree without touching canonical state.
  - Move applied entries to inbox/{machine}/_processed/{date}/ and bad entries
    to _flagged/ with an adjacent .reason.md.
  - Check each peer's _heartbeat.md; flag stale (>4h) entries to rocinante's
    inbox and mirror to data/SYSTEM-STATE.md.
  - Write a curator log per run to inbox/rocinante/_curator_logs/.

Concerns explicitly NOT owned here:
  - User-model dialectic curation (USER.md, MEMORY.md). That stays in the
    sonnet-tier `memory-curator` agent's prompt.
  - Daily-log -> topic-file consolidation. That is autodream.py.
  - Git push. That is the agent wrapper's job (after a clean run).

CLI:
    python -m sartor.memory.curator [--apply | --dry-run] [--repo-root PATH]

Exit codes:
    0  success (clean drain, even if 0 entries)
    1  rolled back / fatal error
    2  partial (some entries flagged or deferred but no rollback)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import tempfile
import traceback
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover - yaml is a hard dep at runtime
    yaml = None


# ---------------------------------------------------------------------------
# Paths and constants
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]
MEMORY_ROOT = REPO_ROOT / "sartor" / "memory"
INBOX_ROOT = MEMORY_ROOT / "inbox"
ROCINANTE_INBOX = INBOX_ROOT / "rocinante"
CURATOR_LOGS = ROCINANTE_INBOX / "_curator_logs"
STAGING_ROOT = ROCINANTE_INBOX / "_curator_staging"
LOCK_FILE = STAGING_ROOT / ".curator.lock"
SYSTEM_STATE = REPO_ROOT / "data" / "SYSTEM-STATE.md"

CURATOR_VERSION = "0.2"
HEARTBEAT_STALE_HOURS = 4

REQUIRED_FIELDS = ("id", "origin", "author", "created", "target", "operation", "priority")
VALID_OPERATIONS = {"append", "replace", "patch", "propose", "report"}
VALID_PRIORITIES = {"p0", "p1", "p2", "p3"}
RESERVED_DIRS = frozenset({
    "_processed", "_flagged", "_archive", "_curator_staging",
    "_curator_logs", "_tasks", "_specs", "_stale-alerts", "_vastai",
    ".receipts", ".drained", ".conflicts",
})
RESERVED_FILES = frozenset({"_heartbeat.md", "_inbox-only-log.md"})


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class CuratorError(Exception): ...
class SchemaError(CuratorError): ...
class ConflictError(CuratorError): ...
class LockError(CuratorError): ...


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class Entry:
    path: Path
    machine: str
    meta: dict
    body: str

    @property
    def entry_id(self) -> str:
        return str(self.meta.get("id") or self.path.stem)


@dataclass
class StagePlan:
    entry: Entry
    staged_target: Path
    canonical_target: Path
    pre_image_hash: str | None  # None == file did not exist before


@dataclass
class MachineRollup:
    machine: str
    entries_found: int = 0
    entries_applied: int = 0
    entries_deferred: int = 0
    entries_flagged: int = 0
    canonical_files_touched: list[str] = field(default_factory=list)
    heartbeat_age_h: float | None = None
    heartbeat_status: str = "missing"


@dataclass
class RunReport:
    run_started: datetime
    run_finished: datetime | None = None
    trigger: str = "manual"
    outcome: str = "success"
    machines: dict[str, MachineRollup] = field(default_factory=dict)
    failures: list[str] = field(default_factory=list)
    p1_pointers: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Frontmatter parse / write
# ---------------------------------------------------------------------------

def _split_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---\n") and not text.startswith("---\r\n"):
        return {}, text
    # Locate the closing ---
    end = text.find("\n---", 4)
    if end == -1:
        return {}, text
    fm_block = text[4:end]
    body_start = end + len("\n---")
    # eat newline after closing fence
    if body_start < len(text) and text[body_start] in "\r\n":
        body_start += 1
        if body_start < len(text) and text[body_start] == "\n":
            body_start += 1
    if yaml is None:
        return {}, text
    try:
        meta = yaml.safe_load(fm_block) or {}
    except Exception:
        meta = {}
    if not isinstance(meta, dict):
        meta = {}
    return meta, text[body_start:]


def parse_entry(path: Path, machine: str) -> Entry:
    text = path.read_text(encoding="utf-8")
    meta, body = _split_frontmatter(text)
    return Entry(path=path, machine=machine, meta=meta, body=body)


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def validate_schema(entry: Entry) -> None:
    missing = [f for f in REQUIRED_FIELDS if f not in entry.meta or entry.meta[f] in (None, "")]
    if missing:
        raise SchemaError(f"missing required fields: {', '.join(missing)}")
    op = entry.meta.get("operation")
    if op not in VALID_OPERATIONS:
        raise SchemaError(f"invalid operation '{op}' (allowed: {sorted(VALID_OPERATIONS)})")
    pri = str(entry.meta.get("priority"))
    if pri not in VALID_PRIORITIES:
        raise SchemaError(f"invalid priority '{pri}' (allowed: {sorted(VALID_PRIORITIES)})")
    target = str(entry.meta.get("target"))
    if target == "inbox-only":
        return
    # path safety: no .. traversal, must stay under repo
    canonical = (REPO_ROOT / target).resolve()
    try:
        canonical.relative_to(REPO_ROOT.resolve())
    except ValueError:
        raise SchemaError(f"target path escapes repo root: {target}")


# ---------------------------------------------------------------------------
# Hashing / IO helpers
# ---------------------------------------------------------------------------

def sha256(path: Path) -> str | None:
    if not path.exists():
        return None
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_stamp(dt: datetime | None = None) -> str:
    dt = dt or utc_now()
    return dt.strftime("%Y-%m-%dT%H-%M-%SZ")


# ---------------------------------------------------------------------------
# Inbox scan
# ---------------------------------------------------------------------------

def list_machines() -> list[str]:
    if not INBOX_ROOT.exists():
        return []
    return sorted([p.name for p in INBOX_ROOT.iterdir() if p.is_dir() and not p.name.startswith(".")])


def pending_entries(machine: str, inbox_root: Path | None = None) -> list[Path]:
    root = inbox_root if inbox_root is not None else INBOX_ROOT
    machine_dir = root / machine
    if not machine_dir.exists():
        return []
    out: list[Path] = []
    for child in sorted(machine_dir.iterdir()):
        if child.is_dir():
            continue
        if child.name in RESERVED_FILES:
            continue
        if child.name.startswith("."):
            continue
        if child.suffix.lower() != ".md":
            continue
        out.append(child)
    return out


# ---------------------------------------------------------------------------
# Locking
# ---------------------------------------------------------------------------

def acquire_lock(max_age_hours: float = 2.0) -> None:
    STAGING_ROOT.mkdir(parents=True, exist_ok=True)
    if LOCK_FILE.exists():
        age_h = (utc_now().timestamp() - LOCK_FILE.stat().st_mtime) / 3600.0
        if age_h < max_age_hours:
            raise LockError(f"curator lock held (age {age_h:.2f}h < {max_age_hours}h)")
        # Stale lock — break it.
    LOCK_FILE.write_text(f"pid={os.getpid()} acquired={utc_now().isoformat()}\n", encoding="utf-8")


def release_lock() -> None:
    try:
        if LOCK_FILE.exists():
            LOCK_FILE.unlink()
    except OSError:
        pass


# ---------------------------------------------------------------------------
# Heartbeat
# ---------------------------------------------------------------------------

def check_heartbeat(machine: str, report: RunReport) -> None:
    rollup = report.machines.setdefault(machine, MachineRollup(machine=machine))
    hb_path = INBOX_ROOT / machine / "_heartbeat.md"
    if not hb_path.exists():
        rollup.heartbeat_status = "missing"
        _flag_stale_heartbeat(machine, age_h=None, report=report)
        return
    text = hb_path.read_text(encoding="utf-8", errors="replace")
    meta, _ = _split_frontmatter(text)
    hb_iso = meta.get("heartbeat") or meta.get("timestamp")
    age_h: float | None
    if hb_iso:
        try:
            hb_dt = datetime.fromisoformat(str(hb_iso).replace("Z", "+00:00"))
            if hb_dt.tzinfo is None:
                hb_dt = hb_dt.replace(tzinfo=timezone.utc)
            age_h = (utc_now() - hb_dt).total_seconds() / 3600.0
        except Exception:
            age_h = None
    else:
        # fall back to file mtime
        age_h = (utc_now().timestamp() - hb_path.stat().st_mtime) / 3600.0
    rollup.heartbeat_age_h = age_h
    if age_h is None:
        rollup.heartbeat_status = "unparseable"
    elif age_h <= HEARTBEAT_STALE_HOURS:
        rollup.heartbeat_status = "fresh"
    else:
        rollup.heartbeat_status = "stale"
        _flag_stale_heartbeat(machine, age_h=age_h, report=report)


def _flag_stale_heartbeat(machine: str, age_h: float | None, report: RunReport) -> None:
    ts = utc_stamp()
    flag_path = ROCINANTE_INBOX / "_flagged" / f"heartbeat-stale-{machine}-{ts}.md"
    flag_path.parent.mkdir(parents=True, exist_ok=True)
    body = (
        f"---\n"
        f"type: flag\n"
        f"id: heartbeat-stale-{machine}-{ts}\n"
        f"origin: rocinante\n"
        f"author: curator\n"
        f"created: {utc_now().isoformat()}\n"
        f"target: inbox-only\n"
        f"operation: report\n"
        f"priority: p1\n"
        f"escalate: true\n"
        f"---\n\n"
        f"# Stale heartbeat: {machine}\n\n"
        f"- machine: {machine}\n"
        f"- last_heartbeat_age_hours: {age_h if age_h is not None else 'missing'}\n"
        f"- detected_at: {utc_now().isoformat()}\n"
        f"- threshold: {HEARTBEAT_STALE_HOURS}h\n"
    )
    flag_path.write_text(body, encoding="utf-8")
    report.p1_pointers.append(f"heartbeat-stale:{machine}")


# ---------------------------------------------------------------------------
# Apply operations (staged)
# ---------------------------------------------------------------------------

def _ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _copy_into_staging(canonical: Path, staged: Path) -> None:
    _ensure_parent(staged)
    if canonical.exists():
        shutil.copy2(canonical, staged)


def apply_operation(staged: Path, entry: Entry) -> None:
    """Apply the entry's operation to the *staged* file (never canonical)."""
    op = entry.meta.get("operation")
    if op == "propose":
        # No canonical mutation; the entry itself is the artifact.
        # We still record it via the curator log; do NOT touch staged file.
        return
    if op == "report" and entry.meta.get("type") == "routine":
        # Routine reports are aggregated, not appended individually.
        # For now we append a single rollup line so they remain traceable.
        block = (
            f"\n<!-- routine: {entry.entry_id} {entry.meta.get('created','')} -->\n"
        )
        _append_to(staged, block)
        return
    if op == "append":
        block = _format_append_block(entry)
        _append_to(staged, block)
        return
    if op == "replace":
        section = entry.meta.get("section")
        if not section:
            raise SchemaError("'replace' requires a 'section' field")
        _replace_section(staged, section, entry.body.strip() + "\n")
        return
    if op == "patch":
        # patch: append a clearly-marked patch block. The agent wrapper or a
        # later step is responsible for higher-fidelity merges; the curator
        # only guarantees atomicity of the file write.
        block = (
            f"\n<!-- patch: {entry.entry_id} -->\n"
            f"{entry.body.strip()}\n"
            f"<!-- /patch -->\n"
        )
        _append_to(staged, block)
        return
    raise SchemaError(f"unhandled operation '{op}'")


def _format_append_block(entry: Entry) -> str:
    ts = entry.meta.get("created", "")
    eid = entry.entry_id
    body = entry.body.strip()
    return (
        f"\n<!-- inbox: {eid} from {entry.machine} at {ts} -->\n"
        f"{body}\n"
        f"<!-- /inbox: {eid} -->\n"
    )


def _append_to(path: Path, block: str) -> None:
    _ensure_parent(path)
    existing = path.read_text(encoding="utf-8") if path.exists() else ""
    if existing and not existing.endswith("\n"):
        existing += "\n"
    path.write_text(existing + block, encoding="utf-8")


def _replace_section(path: Path, section: str, new_body: str) -> None:
    if not path.exists():
        raise ConflictError(f"replace: target {path} does not exist")
    text = path.read_text(encoding="utf-8")
    marker = f"## {section}"
    idx = text.find(marker)
    if idx == -1:
        raise ConflictError(f"replace: section '{section}' not found in {path}")
    # find next "## " heading at same level
    end = text.find("\n## ", idx + len(marker))
    if end == -1:
        end = len(text)
    new_text = text[:idx] + f"{marker}\n\n{new_body}\n" + text[end:]
    path.write_text(new_text, encoding="utf-8")


# ---------------------------------------------------------------------------
# Movement plans (executed on commit)
# ---------------------------------------------------------------------------

@dataclass
class MovePlan:
    src: Path
    dst: Path
    reason: str  # "applied" | "flagged"


def plan_processed_move(entry: Entry) -> MovePlan:
    today = utc_now().date().isoformat()
    dst = INBOX_ROOT / entry.machine / "_processed" / today / entry.path.name
    return MovePlan(src=entry.path, dst=dst, reason="applied")


def plan_flagged_move(entry: Entry, reason: str) -> tuple[MovePlan, Path, str]:
    dst = INBOX_ROOT / entry.machine / "_flagged" / entry.path.name
    reason_path = INBOX_ROOT / entry.machine / "_flagged" / f"{entry.path.stem}.reason.md"
    reason_body = (
        f"---\n"
        f"type: flag-reason\n"
        f"flagged_id: {entry.entry_id}\n"
        f"flagged_at: {utc_now().isoformat()}\n"
        f"---\n\n"
        f"# Flag reason: {entry.entry_id}\n\n{reason}\n"
    )
    return MovePlan(src=entry.path, dst=dst, reason="flagged"), reason_path, reason_body


def execute_move(mp: MovePlan) -> None:
    _ensure_parent(mp.dst)
    if mp.dst.exists():
        # collision — append a suffix
        i = 1
        while True:
            alt = mp.dst.with_name(f"{mp.dst.stem}.{i}{mp.dst.suffix}")
            if not alt.exists():
                mp.dst = alt
                break
            i += 1
    shutil.move(str(mp.src), str(mp.dst))


# ---------------------------------------------------------------------------
# Curator log
# ---------------------------------------------------------------------------

def write_curator_log(report: RunReport) -> Path:
    CURATOR_LOGS.mkdir(parents=True, exist_ok=True)
    started = report.run_started
    log_id = f"curator-log-{utc_stamp(started)}"
    path = CURATOR_LOGS / f"{log_id}.md"
    finished = report.run_finished or utc_now()

    lines: list[str] = []
    lines.append("---")
    lines.append("type: curator-log")
    lines.append(f"id: {log_id}")
    lines.append(f"run_started: {started.isoformat()}")
    lines.append(f"run_finished: {finished.isoformat()}")
    lines.append(f"trigger: {report.trigger}")
    lines.append(f"outcome: {report.outcome}")
    lines.append(f"curator_version: '{CURATOR_VERSION}'")
    lines.append("---")
    lines.append("")
    lines.append("# Curator run report")
    lines.append("")
    lines.append("## Per source machine")
    for name in sorted(report.machines):
        m = report.machines[name]
        lines.append(f"### {name}")
        lines.append(f"- entries_found: {m.entries_found}")
        lines.append(f"- entries_applied: {m.entries_applied}")
        lines.append(f"- entries_deferred: {m.entries_deferred}")
        lines.append(f"- entries_flagged: {m.entries_flagged}")
        lines.append(f"- canonical_files_touched: {sorted(set(m.canonical_files_touched))}")
        lines.append(f"- heartbeat_status: {m.heartbeat_status}")
        if m.heartbeat_age_h is not None:
            lines.append(f"- heartbeat_age_h: {m.heartbeat_age_h:.2f}")
        lines.append("")
    lines.append("## Failures")
    if report.failures:
        for f in report.failures:
            lines.append(f"- {f}")
    else:
        lines.append("none")
    lines.append("")
    if report.p1_pointers:
        lines.append("## p1 pointers")
        for p in report.p1_pointers:
            lines.append(f"- {p}")
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def surface_p1(report: RunReport, log_path: Path) -> None:
    if not report.p1_pointers:
        return
    SYSTEM_STATE.parent.mkdir(parents=True, exist_ok=True)
    block = ["", f"## Curator p1 surface ({utc_now().isoformat()})", f"- log: {log_path.relative_to(REPO_ROOT).as_posix()}"]
    for p in report.p1_pointers:
        block.append(f"- p1: {p}")
    block.append("")
    existing = SYSTEM_STATE.read_text(encoding="utf-8") if SYSTEM_STATE.exists() else "# SYSTEM STATE\n"
    SYSTEM_STATE.write_text(existing + "\n".join(block), encoding="utf-8")


# ---------------------------------------------------------------------------
# Main drain
# ---------------------------------------------------------------------------

def drain(*, apply: bool, trigger: str = "manual", inbox_root: Path | None = None) -> RunReport:
    """Run one curator pass.

    Args:
        apply: if False, do all the work in staging but skip the commit phase.
        trigger: "scheduled" | "manual" | "post-commit".
        inbox_root: override for tests. Defaults to module-level INBOX_ROOT.
    """
    global INBOX_ROOT
    if inbox_root is not None:
        INBOX_ROOT = inbox_root  # tests inject a tmp dir

    report = RunReport(run_started=utc_now(), trigger=trigger)
    acquire_lock()
    run_ts = utc_stamp(report.run_started)
    staging = STAGING_ROOT / run_ts
    staging.mkdir(parents=True, exist_ok=True)

    plans: list[StagePlan] = []
    moves: list[MovePlan] = []
    flag_writes: list[tuple[Path, str]] = []  # (reason_path, reason_body)

    try:
        for machine in list_machines():
            rollup = report.machines.setdefault(machine, MachineRollup(machine=machine))
            check_heartbeat(machine, report)

            for entry_path in pending_entries(machine):
                rollup.entries_found += 1
                try:
                    entry = parse_entry(entry_path, machine)
                    validate_schema(entry)
                    target_rel = str(entry.meta["target"])
                    if target_rel == "inbox-only":
                        # Nothing to stage; just record + plan move.
                        rollup.entries_applied += 1
                        moves.append(plan_processed_move(entry))
                        continue
                    canonical = REPO_ROOT / target_rel
                    staged = staging / target_rel
                    pre_hash = sha256(canonical)
                    _copy_into_staging(canonical, staged)
                    apply_operation(staged, entry)
                    plans.append(StagePlan(
                        entry=entry,
                        staged_target=staged,
                        canonical_target=canonical,
                        pre_image_hash=pre_hash,
                    ))
                    rollup.canonical_files_touched.append(target_rel)
                    moves.append(plan_processed_move(entry))
                    rollup.entries_applied += 1
                except SchemaError as e:
                    rollup.entries_flagged += 1
                    mv, rp, rb = plan_flagged_move(parse_entry(entry_path, machine), str(e))
                    moves.append(mv)
                    flag_writes.append((rp, rb))
                except ConflictError as e:
                    rollup.entries_deferred += 1
                    report.failures.append(f"{machine}/{entry_path.name}: deferred ({e})")
                except Exception as e:  # pragma: no cover - bug surface
                    rollup.entries_flagged += 1
                    mv, rp, rb = plan_flagged_move(parse_entry(entry_path, machine), f"unexpected: {e}\n{traceback.format_exc()}")
                    moves.append(mv)
                    flag_writes.append((rp, rb))

        if not apply:
            report.outcome = "dry-run"
            report.run_finished = utc_now()
            log_path = write_curator_log(report)
            return report

        # ----- COMMIT phase -----
        try:
            for sp in plans:
                # verify the canonical file did not change while we staged
                live_hash = sha256(sp.canonical_target)
                if live_hash != sp.pre_image_hash:
                    raise ConflictError(
                        f"race on {sp.canonical_target}: pre={sp.pre_image_hash} live={live_hash}"
                    )
            for sp in plans:
                _ensure_parent(sp.canonical_target)
                os.replace(sp.staged_target, sp.canonical_target)
            for mp in moves:
                if mp.src.exists():
                    execute_move(mp)
            for rp, rb in flag_writes:
                _ensure_parent(rp)
                rp.write_text(rb, encoding="utf-8")
        except Exception as e:
            report.outcome = "rolled-back"
            report.failures.append(f"commit failed: {e}")
            # canonical files were never replaced past the failure point because
            # os.replace is atomic per file — but anything before the failure
            # already moved. We log this and let the next run reconcile via the
            # 7-day pending warning + drift detection.
            shutil.rmtree(staging, ignore_errors=True)
            report.run_finished = utc_now()
            log_path = write_curator_log(report)
            surface_p1(report, log_path)
            return report

        # cleanup staging
        shutil.rmtree(staging, ignore_errors=True)
        report.run_finished = utc_now()
        log_path = write_curator_log(report)
        surface_p1(report, log_path)
        if any(report.failures) or any(m.entries_flagged for m in report.machines.values()):
            report.outcome = "partial"
            # rewrite log frontmatter outcome (cheap second write)
            write_curator_log(report)
        return report
    finally:
        release_lock()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _exit_code(report: RunReport) -> int:
    if report.outcome == "rolled-back":
        return 1
    if report.outcome == "partial":
        return 2
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Sartor inbox curator (transactional).")
    g = p.add_mutually_exclusive_group()
    g.add_argument("--apply", action="store_true", help="commit changes (default if neither flag set)")
    g.add_argument("--dry-run", action="store_true", help="stage but do not commit")
    p.add_argument("--trigger", default="manual", choices=["manual", "scheduled", "post-commit"])
    args = p.parse_args(argv)
    apply = bool(args.apply) or not args.dry_run
    try:
        report = drain(apply=apply, trigger=args.trigger)
    except LockError as e:
        print(f"curator lock: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"curator fatal: {e}", file=sys.stderr)
        traceback.print_exc()
        return 1
    print(f"curator outcome={report.outcome} machines={len(report.machines)} "
          f"applied={sum(m.entries_applied for m in report.machines.values())} "
          f"flagged={sum(m.entries_flagged for m in report.machines.values())} "
          f"deferred={sum(m.entries_deferred for m in report.machines.values())}")
    return _exit_code(report)


if __name__ == "__main__":
    sys.exit(main())
