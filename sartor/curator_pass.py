"""Curator pass: drain inbox entries from peer machines and write receipts.

Implements master plan §5.1 cron #4, §5.4 receipts, §13 EX-4. Runs on Rocinante
twice daily (07:30 and 19:30 ET). Pure Python, no LLM in v0.1 — the verify
phase is mechanical (schema check + path routing), not semantic.

The whole point of this script is the **receipt mechanism**: gpuserver1 has been
writing entries to its inbox and never knowing whether they were read. After
this runs, every drained entry has a receipt file the source machine can grep
for. Closes the feedback loop the Operating Agreement §2.2 promised.

Run as:
    python -m sartor.curator_pass [--dry-run] [--max-drain N] [--inbox-root PATH]

Exit codes:
    0  success (even if 0 entries drained)
    1  fatal error (corrupted state, IO failure, etc.)
    2  conflicts detected — entries flagged but not drained, human review needed
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import time
import traceback
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
MEMORY_ROOT = REPO_ROOT / "sartor" / "memory"
INBOX_ROOT = MEMORY_ROOT / "inbox"
META_DIR = MEMORY_ROOT / ".meta"
CURATOR_LOG = META_DIR / "curator-log.jsonl"
CURATOR_VERSION = "0.1"
CURATOR_NAME = "rocinante-curator"

REQUIRED_FIELDS = ("id", "origin", "created", "target", "operation")

RESERVED_DIRS = frozenset({".receipts", ".drained", ".conflicts", "_processed", "_flagged", "_curator_staging"})

URGENT_PRIORITIES = frozenset({"p0", "p1"})
ROUTINE_TYPES = frozenset({"routine", "report", "completion_report", "heartbeat"})


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class InboxEntry:
    path: Path
    source_machine: str
    frontmatter: dict
    body: str
    raw: str

    @property
    def entry_id(self) -> str:
        return str(self.frontmatter.get("id") or self.path.stem)

    @property
    def priority(self) -> str:
        return str(self.frontmatter.get("priority", "p2")).lower()

    @property
    def entry_type(self) -> str:
        return str(self.frontmatter.get("type", "event")).lower()

    @property
    def operation(self) -> str:
        return str(self.frontmatter.get("operation", "append")).lower()

    @property
    def target(self) -> str:
        return str(self.frontmatter.get("target", "")).strip()

    @property
    def severity(self) -> str:
        return str(self.frontmatter.get("severity", "")).lower()

    @property
    def category(self) -> str:
        return str(self.frontmatter.get("category", "")).lower()

    @property
    def entity(self) -> str:
        return str(self.frontmatter.get("entity", "")).strip()

    @property
    def escalate(self) -> bool:
        return bool(self.frontmatter.get("escalate"))

    def classify(self) -> str:
        """Return 'urgent' | 'event' | 'routine'."""
        if self.escalate:
            return "urgent"
        if self.priority in URGENT_PRIORITIES:
            return "urgent"
        if self.severity in {"high", "critical", "urgent"}:
            return "urgent"
        if self.entry_type in ROUTINE_TYPES:
            return "routine"
        return "event"

    def hash(self) -> str:
        return hashlib.sha256(self.raw.encode("utf-8")).hexdigest()


@dataclass
class DrainResult:
    entry: InboxEntry
    destination: Path
    action: str
    classification: str
    drained_to: Path | None = None
    receipt_path: Path | None = None
    error: str | None = None


@dataclass
class RunStats:
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    drained: list[DrainResult] = field(default_factory=list)
    flagged: list[tuple[Path, str]] = field(default_factory=list)
    conflicts: list[dict] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    skipped: int = 0
    runtime_ms: int = 0

    @property
    def num_drained(self) -> int:
        return len(self.drained)

    @property
    def num_conflicts(self) -> int:
        return len(self.conflicts)

    @property
    def num_errors(self) -> int:
        return len(self.errors)


# ---------------------------------------------------------------------------
# Frontmatter parsing
# ---------------------------------------------------------------------------


def parse_entry(path: Path, source_machine: str) -> InboxEntry | None:
    """Read an inbox entry. Returns None if it has no frontmatter at all."""
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        return None
    if not raw.startswith("---"):
        return None
    parts = raw.split("---", 2)
    if len(parts) < 3:
        return None
    try:
        fm = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        return None
    if not isinstance(fm, dict):
        return None
    body = parts[2].lstrip("\n")
    return InboxEntry(
        path=path,
        source_machine=source_machine,
        frontmatter=fm,
        body=body,
        raw=raw,
    )


def validate_schema(entry: InboxEntry) -> list[str]:
    """Return a list of missing required fields. Empty list = valid."""
    return [f for f in REQUIRED_FIELDS if not entry.frontmatter.get(f)]


# ---------------------------------------------------------------------------
# Inbox walking
# ---------------------------------------------------------------------------


def discover_machines(inbox_root: Path) -> list[Path]:
    """List per-machine subdirs, ignoring reserved/meta dirs."""
    if not inbox_root.exists():
        return []
    out = []
    for child in sorted(inbox_root.iterdir()):
        if not child.is_dir():
            continue
        if child.name in RESERVED_DIRS:
            continue
        out.append(child)
    return out


def walk_inbox(inbox_root: Path) -> Iterable[InboxEntry]:
    """Yield every parseable inbox entry across all peer machines.

    Skips reserved subdirs (_processed/, _flagged/, .receipts/, .drained/, .meta/).
    """
    for machine_dir in discover_machines(inbox_root):
        for path in _iter_entry_files(machine_dir):
            entry = parse_entry(path, machine_dir.name)
            if entry is None:
                continue
            yield entry


def _iter_entry_files(machine_dir: Path) -> Iterable[Path]:
    """Recursively yield .md files inside a machine inbox dir, skipping reserved subdirs."""
    for path in machine_dir.rglob("*.md"):
        rel_parts = path.relative_to(machine_dir).parts
        if any(p in RESERVED_DIRS for p in rel_parts[:-1]):
            continue
        if path.name in RESERVED_DIRS:
            continue
        yield path


# ---------------------------------------------------------------------------
# Routing & destination resolution
# ---------------------------------------------------------------------------


def resolve_destination(entry: InboxEntry) -> Path:
    """Map an entry's `target:` (or category) to a real canonical file path.

    Rules (in order):
    - target == "inbox-only" → routes to a per-machine `inbox-only-log.md` next to the source
    - target is an absolute path → use as-is
    - target starts with "sartor/" → resolve relative to repo root
    - target contains a "/" → resolve relative to memory root
    - target ends in .md → treat as memory-root-relative
    - else (bare hub name like "MACHINES.md" or "TAXES") → look up in memory root
    - if category is set and target is empty → use category-routing fallback
    """
    target = entry.target

    if target == "inbox-only":
        return INBOX_ROOT / entry.source_machine / "_inbox-only-log.md"

    if not target and entry.category:
        target = _category_to_target(entry.category)

    if not target:
        return INBOX_ROOT / entry.source_machine / "_unrouted-log.md"

    p = Path(target)
    if p.is_absolute():
        return p
    if target.startswith("sartor/"):
        return REPO_ROOT / target
    if "/" in target:
        return MEMORY_ROOT / target
    if not target.lower().endswith(".md"):
        target = target + ".md"
    return MEMORY_ROOT / target


def _category_to_target(category: str) -> str:
    table = {
        "machines": "MACHINES.md",
        "machine": "MACHINES.md",
        "gpu": "MACHINES.md",
        "taxes": "TAXES.md",
        "tax": "TAXES.md",
        "family": "FAMILY.md",
        "business": "BUSINESS.md",
        "alton": "ALTON.md",
        "self": "SELF.md",
        "projects": "PROJECTS.md",
        "project": "PROJECTS.md",
        "learnings": "LEARNINGS.md",
        "procedures": "PROCEDURES.md",
        "astrazeneca": "ASTRAZENECA.md",
    }
    return table.get(category, "")


# ---------------------------------------------------------------------------
# Conflict detection
# ---------------------------------------------------------------------------


def detect_conflicts(entries: list[InboxEntry]) -> tuple[list[InboxEntry], list[dict]]:
    """Partition entries into (clean, conflicts).

    A conflict is two+ entries from different source machines that target the
    same canonical file AND share a non-empty `entity:` field. Conflicting
    entries are *excluded* from the clean list and returned in the conflict
    descriptors instead.
    """
    by_key: dict[tuple[str, str], list[InboxEntry]] = defaultdict(list)
    for e in entries:
        if not e.entity:
            continue
        dest = resolve_destination(e)
        key = (str(dest), e.entity)
        by_key[key].append(e)

    conflict_ids: set[int] = set()
    conflicts: list[dict] = []
    for (dest, entity), group in by_key.items():
        machines = {e.source_machine for e in group}
        if len(machines) > 1:
            for e in group:
                conflict_ids.add(id(e))
            conflicts.append(
                {
                    "destination": dest,
                    "entity": entity,
                    "entries": [
                        {
                            "id": e.entry_id,
                            "source_machine": e.source_machine,
                            "path": str(e.path),
                            "hash": e.hash(),
                        }
                        for e in group
                    ],
                }
            )

    clean = [e for e in entries if id(e) not in conflict_ids]
    return clean, conflicts


# ---------------------------------------------------------------------------
# Prioritization
# ---------------------------------------------------------------------------


_CLASS_RANK = {"urgent": 0, "event": 1, "routine": 2}


def prioritize(entries: list[InboxEntry], max_drain: int) -> list[InboxEntry]:
    """Sort entries urgent → event → routine, then by created timestamp ascending.

    If staleness scoring of the *target* file is available, urgent entries
    targeting more-stale hubs win the tiebreak. Falls back gracefully if
    staleness import or scoring fails.
    """
    staleness_score = _try_load_staleness()

    def stale_bonus(e: InboxEntry) -> float:
        if staleness_score is None:
            return 0.0
        try:
            dest = resolve_destination(e)
            if not dest.exists():
                return 0.0
            return -float(staleness_score(dest).score)
        except Exception:
            return 0.0

    def sort_key(e: InboxEntry):
        return (
            _CLASS_RANK.get(e.classify(), 9),
            stale_bonus(e),
            str(e.frontmatter.get("created", "")),
            e.entry_id,
        )

    return sorted(entries, key=sort_key)[:max_drain]


def _try_load_staleness():
    try:
        from sartor.staleness import score_file  # type: ignore
        return score_file
    except Exception:
        try:
            sys.path.insert(0, str(REPO_ROOT / "sartor"))
            from staleness import score_file  # type: ignore
            return score_file
        except Exception:
            return None


# ---------------------------------------------------------------------------
# Drain + receipt I/O
# ---------------------------------------------------------------------------


def append_to_destination(dest: Path, entry: InboxEntry, dry_run: bool) -> str:
    """Append a stub block referencing the entry. Returns the action verb.

    Action is `appended_block` if dest existed, `created_stub` if dest is new.
    Append-only: never modifies existing content.
    """
    existed = dest.exists()
    if dry_run:
        return "would_append" if existed else "would_create_stub"

    dest.parent.mkdir(parents=True, exist_ok=True)
    block = _format_drain_block(entry)

    if existed:
        with dest.open("a", encoding="utf-8") as f:
            f.write(block)
        return "appended_block"

    stub = _format_stub_header(entry) + block
    dest.write_text(stub, encoding="utf-8")
    return "created_stub"


def _format_stub_header(entry: InboxEntry) -> str:
    today = datetime.now(timezone.utc).date().isoformat()
    title = entry.target or entry.entity or entry.entry_id
    return (
        f"---\n"
        f"type: stub\n"
        f"created_by: {CURATOR_NAME}\n"
        f"created: {today}\n"
        f"updated: {today}\n"
        f"---\n\n"
        f"# {title}\n\n"
        f"_Stub created by curator on {today} from inbox entry "
        f"`{entry.entry_id}` (origin: {entry.source_machine}). "
        f"Awaiting human curation._\n\n"
    )


def _format_drain_block(entry: InboxEntry) -> str:
    when = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return (
        f"\n<!-- curator-drained {when} from {entry.source_machine} entry={entry.entry_id} -->\n"
        f"## Inbox entry: {entry.entry_id}\n\n"
        f"- Source machine: `{entry.source_machine}`\n"
        f"- Created: {entry.frontmatter.get('created', 'unknown')}\n"
        f"- Operation: {entry.operation}\n"
        f"- Priority: {entry.priority}\n"
        f"- Drained: {when}\n\n"
        f"{entry.body.strip()}\n\n"
        f"<!-- /curator-drained -->\n"
    )


def move_to_drained(entry: InboxEntry, dry_run: bool) -> Path:
    today = datetime.now(timezone.utc).date().isoformat()
    drained_dir = INBOX_ROOT / ".drained" / today / entry.source_machine
    target = drained_dir / entry.path.name
    if dry_run:
        return target
    drained_dir.mkdir(parents=True, exist_ok=True)
    if target.exists():
        target = drained_dir / f"{entry.path.stem}.{int(time.time()*1000)}{entry.path.suffix}"
    shutil.move(str(entry.path), str(target))
    return target


def write_receipt(
    entry: InboxEntry,
    destination: Path,
    action: str,
    status: str,
    dry_run: bool,
    error: str | None = None,
) -> Path:
    today = datetime.now(timezone.utc).date().isoformat()
    receipts_dir = INBOX_ROOT / entry.source_machine / ".receipts" / today
    receipt_path = receipts_dir / f"{entry.path.name}.receipt.yml"

    payload = {
        "received_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "received_by": CURATOR_NAME,
        "status": status,
        "destination": str(destination.relative_to(REPO_ROOT))
        if _is_under(destination, REPO_ROOT)
        else str(destination),
        "action": action,
        "hash": entry.hash(),
        "entry_id": entry.entry_id,
        "curator_version": CURATOR_VERSION,
    }
    if error:
        payload["error"] = error

    if dry_run:
        return receipt_path

    receipts_dir.mkdir(parents=True, exist_ok=True)
    receipt_path.write_text(
        yaml.safe_dump(payload, sort_keys=False, default_flow_style=False),
        encoding="utf-8",
    )
    return receipt_path


def write_conflict_record(conflict: dict, dry_run: bool) -> Path:
    today = datetime.now(timezone.utc).date().isoformat()
    safe_entity = "".join(c if c.isalnum() or c in "-_" else "_" for c in conflict["entity"])
    out_dir = INBOX_ROOT / ".conflicts"
    path = out_dir / f"{today}_{safe_entity}.md"
    if dry_run:
        return path
    out_dir.mkdir(parents=True, exist_ok=True)
    lines = [
        "---",
        f"type: conflict",
        f"created: {today}",
        f"entity: {conflict['entity']}",
        f"destination: {conflict['destination']}",
        "status: pending_human_review",
        "---",
        "",
        f"# Conflict: {conflict['entity']}",
        "",
        f"Two or more peer machines wrote conflicting entries about `{conflict['entity']}` ",
        f"targeting `{conflict['destination']}`. The curator has flagged both and ",
        "did NOT drain either. Resolve manually.",
        "",
        "## Conflicting entries",
        "",
    ]
    for e in conflict["entries"]:
        lines.append(f"- `{e['id']}` from **{e['source_machine']}** at `{e['path']}` (sha256 `{e['hash'][:12]}`)")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def _is_under(p: Path, root: Path) -> bool:
    try:
        p.resolve().relative_to(root.resolve())
        return True
    except (ValueError, OSError):
        return False


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------


def append_log_line(stats: RunStats, dry_run: bool) -> None:
    line = {
        "timestamp": stats.started_at.isoformat(timespec="seconds"),
        "num_drained": stats.num_drained,
        "num_conflicts": stats.num_conflicts,
        "num_errors": stats.num_errors,
        "num_flagged": len(stats.flagged),
        "num_skipped": stats.skipped,
        "runtime_ms": stats.runtime_ms,
        "dry_run": dry_run,
        "curator_version": CURATOR_VERSION,
    }
    if dry_run:
        return
    META_DIR.mkdir(parents=True, exist_ok=True)
    with CURATOR_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line) + "\n")


# ---------------------------------------------------------------------------
# Main pass
# ---------------------------------------------------------------------------


def run_pass(
    inbox_root: Path = INBOX_ROOT,
    *,
    dry_run: bool = False,
    max_drain: int = 100,
    verbose: bool = False,
) -> RunStats:
    """Execute one curator pass. Returns RunStats with full counts.

    Pure function over the filesystem: in dry-run mode no path is touched
    outside of returning the *would-be* destinations in the stats object.
    """
    t0 = time.monotonic()
    stats = RunStats()

    # Phase 1 — discover and parse
    raw_files: list[Path] = []
    parsed: list[InboxEntry] = []
    for machine_dir in discover_machines(inbox_root):
        for path in _iter_entry_files(machine_dir):
            raw_files.append(path)
            entry = parse_entry(path, machine_dir.name)
            if entry is None:
                stats.flagged.append((path, "unparseable: missing/invalid frontmatter"))
                continue
            missing = validate_schema(entry)
            if missing:
                stats.flagged.append((path, f"missing required fields: {','.join(missing)}"))
                continue
            parsed.append(entry)

    if verbose:
        print(f"[curator] discovered {len(raw_files)} files, {len(parsed)} valid", file=sys.stderr)

    # Phase 2 — conflict detection
    clean, conflicts = detect_conflicts(parsed)
    for c in conflicts:
        record_path = write_conflict_record(c, dry_run)
        stats.conflicts.append({**c, "record_path": str(record_path)})
        for e_descriptor in c["entries"]:
            for e in parsed:
                if e.entry_id == e_descriptor["id"]:
                    write_receipt(
                        e,
                        Path(c["destination"]),
                        action="conflict_flagged",
                        status="conflict",
                        dry_run=dry_run,
                        error=f"conflict with {len(c['entries']) - 1} peer entries on entity={c['entity']}",
                    )
                    break

    # Phase 3 — prioritize
    queued = prioritize(clean, max_drain=max_drain)
    if len(clean) > max_drain:
        stats.skipped = len(clean) - max_drain
        if verbose:
            print(f"[curator] capping drain at {max_drain}; {stats.skipped} deferred", file=sys.stderr)

    # Phase 4 — drain + receipt
    for entry in queued:
        try:
            destination = resolve_destination(entry)
            action = append_to_destination(destination, entry, dry_run)
            drained_to = move_to_drained(entry, dry_run)
            receipt_path = write_receipt(
                entry,
                destination,
                action=action,
                status="drained",
                dry_run=dry_run,
            )
            stats.drained.append(
                DrainResult(
                    entry=entry,
                    destination=destination,
                    action=action,
                    classification=entry.classify(),
                    drained_to=drained_to,
                    receipt_path=receipt_path,
                )
            )
            if verbose:
                marker = "[DRY] " if dry_run else ""
                print(
                    f"{marker}drained {entry.entry_id} ({entry.classify()}) → {destination} [{action}]",
                    file=sys.stderr,
                )
        except Exception as exc:
            err = f"{entry.entry_id}: {exc}"
            stats.errors.append(err)
            try:
                write_receipt(
                    entry,
                    resolve_destination(entry),
                    action="error",
                    status="error",
                    dry_run=dry_run,
                    error=str(exc),
                )
            except Exception:
                pass
            if verbose:
                print(f"[curator] ERROR {err}", file=sys.stderr)
                traceback.print_exc(file=sys.stderr)

    stats.runtime_ms = int((time.monotonic() - t0) * 1000)
    append_log_line(stats, dry_run)
    return stats


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="curator_pass",
        description="Drain inbox entries from peer machines and write receipts.",
    )
    p.add_argument("--dry-run", action="store_true", help="Print actions without touching files.")
    p.add_argument("--max-drain", type=int, default=100, help="Cap entries drained per run (default 100).")
    p.add_argument("--inbox-root", type=Path, default=None, help="Override inbox root (for tests).")
    p.add_argument("-v", "--verbose", action="store_true")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    inbox_root = args.inbox_root or INBOX_ROOT
    if not inbox_root.exists():
        print(f"curator_pass: inbox root not found: {inbox_root}", file=sys.stderr)
        return 1

    try:
        stats = run_pass(
            inbox_root=inbox_root,
            dry_run=args.dry_run,
            max_drain=args.max_drain,
            verbose=args.verbose,
        )
    except Exception as exc:
        print(f"curator_pass: fatal error: {exc}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return 1

    summary = {
        "drained": stats.num_drained,
        "conflicts": stats.num_conflicts,
        "errors": stats.num_errors,
        "flagged": len(stats.flagged),
        "skipped": stats.skipped,
        "runtime_ms": stats.runtime_ms,
        "dry_run": args.dry_run,
    }
    print(json.dumps(summary, indent=2))

    if stats.num_errors:
        return 1
    if stats.num_conflicts:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
