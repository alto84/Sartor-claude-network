"""Weekly improvement loop — self-detection, proposal writing, snapshot.

Implements master plan §10 + §13 EX-10. Runs weekly on Sunday 20:00 ET
via Windows Scheduled Task on Rocinante.

Each run:
1. Staleness trend line — compare tier distribution to last week's snapshot.
2. Extraction miss rate — compare proposals_written vs candidates_found.
3. Curator receipt timeouts — scan inboxes for entries older than 48h without receipt.
4. Propose improvements — append flagged issues to data/IMPROVEMENT-QUEUE.md.
5. Morning briefing integration — write summary to rocinante inbox for curator drain.
6. Snapshot — persist current metrics for next week's comparison.

Run as:
    python -m sartor.improvement_loop [--dry-run] [-v]

Exit codes:
    0  success
    1  fatal error
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import traceback
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
MEMORY_ROOT = REPO_ROOT / "sartor" / "memory"
META_DIR = MEMORY_ROOT / ".meta"
CURATOR_LOG = META_DIR / "curator-log.jsonl"
EXTRACTOR_LOG = META_DIR / "extractor-log.jsonl"
SNAPSHOT_DIR = META_DIR / "improvement-snapshots"
INBOX_ROOT = MEMORY_ROOT / "inbox"
IMPROVEMENT_QUEUE = REPO_ROOT / "data" / "IMPROVEMENT-QUEUE.md"
BRIEFING_DIR = INBOX_ROOT / "rocinante" / "improvement-summary"

LOOP_VERSION = "0.1"

# How far back to look for log entries (7 days).
LOOKBACK_DAYS = 7

# Extraction miss-rate threshold: flag if ratio dropped >20% week-over-week.
MISS_RATE_DROP_THRESHOLD = 0.20

# Receipt timeout: flag inbox entries older than 48h without receipt.
RECEIPT_TIMEOUT_HOURS = 48


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class Flag:
    signal: str
    severity: str  # low, medium, high
    detail: str
    proposed_fix: str
    estimated_effort: str


@dataclass
class TierDistribution:
    fresh: int = 0
    stale: int = 0
    rotten: int = 0
    neutral: int = 0
    historical: int = 0


@dataclass
class ExtractionStats:
    sessions_scanned: int = 0
    candidates_found: int = 0
    proposals_written: int = 0
    hit_rate: float = 0.0


@dataclass
class ReceiptHealth:
    total_inbox_entries: int = 0
    entries_without_receipt: int = 0
    timed_out: list[dict] = field(default_factory=list)


@dataclass
class LoopResult:
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    flags: list[Flag] = field(default_factory=list)
    tier_dist: TierDistribution = field(default_factory=TierDistribution)
    extraction_stats: ExtractionStats = field(default_factory=ExtractionStats)
    receipt_health: ReceiptHealth = field(default_factory=ReceiptHealth)
    runtime_ms: int = 0


# ---------------------------------------------------------------------------
# Step 1: Staleness trend line
# ---------------------------------------------------------------------------


def _score_all_hub_files() -> TierDistribution:
    """Score all .md files in memory root, return tier counts."""
    try:
        from sartor.staleness import MEMORY_ROOT as MR, load_oracles, score_file
    except ImportError:
        sys.path.insert(0, str(REPO_ROOT / "sartor"))
        from staleness import MEMORY_ROOT as MR, load_oracles, score_file  # type: ignore

    oracles = load_oracles()
    dist = TierDistribution()
    for md in MR.rglob("*.md"):
        score = score_file(md, oracles, inbound_links=0)
        tier = score.tier
        if tier == "fresh":
            dist.fresh += 1
        elif tier == "stale":
            dist.stale += 1
        elif tier == "rotten":
            dist.rotten += 1
        elif tier == "historical":
            dist.historical += 1
        else:
            dist.neutral += 1
    return dist


def _load_last_snapshot() -> dict | None:
    """Load the most recent snapshot JSON from the snapshots directory."""
    if not SNAPSHOT_DIR.exists():
        return None
    snapshots = sorted(SNAPSHOT_DIR.glob("*.json"))
    if not snapshots:
        return None
    try:
        return json.loads(snapshots[-1].read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def check_staleness_trend(result: LoopResult, verbose: bool = False) -> None:
    """Compare current tier distribution against last week's snapshot."""
    dist = _score_all_hub_files()
    result.tier_dist = dist

    if verbose:
        print(
            f"[loop] tiers: fresh={dist.fresh} stale={dist.stale} "
            f"rotten={dist.rotten} neutral={dist.neutral} historical={dist.historical}",
            file=sys.stderr,
        )

    prev = _load_last_snapshot()
    if prev is None:
        if verbose:
            print("[loop] no prior snapshot — skipping trend comparison", file=sys.stderr)
        return

    prev_tiers = prev.get("tier_distribution", {})
    prev_rotten = prev_tiers.get("rotten", 0)
    prev_fresh = prev_tiers.get("fresh", 0)

    if dist.rotten > prev_rotten:
        result.flags.append(Flag(
            signal="staleness_regression",
            severity="high",
            detail=(
                f"Rotten count increased: {prev_rotten} -> {dist.rotten} "
                f"(+{dist.rotten - prev_rotten} files crossed the rotten threshold)."
            ),
            proposed_fix=(
                "Run curator pass on the newly-rotten files. "
                "Check if last_verified fields need backfill or if oracles are stale."
            ),
            estimated_effort="30min manual review + targeted hub edits",
        ))

    if dist.fresh < prev_fresh:
        result.flags.append(Flag(
            signal="freshness_decline",
            severity="medium",
            detail=(
                f"Fresh count decreased: {prev_fresh} -> {dist.fresh} "
                f"({prev_fresh - dist.fresh} files fell out of fresh tier)."
            ),
            proposed_fix=(
                "Review recently-stale files. Likely candidates: high-volatility hubs "
                "or files whose oracles report entity-stale."
            ),
            estimated_effort="20min review",
        ))


# ---------------------------------------------------------------------------
# Step 2: Extraction miss rate
# ---------------------------------------------------------------------------


def _read_log_entries(path: Path, since: datetime) -> list[dict]:
    """Read JSONL log entries from `path` that are at or after `since`."""
    if not path.exists():
        return []
    entries = []
    since_str = since.isoformat()
    try:
        for line in path.read_text(encoding="utf-8").strip().splitlines():
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            ts = entry.get("timestamp", "")
            if ts >= since_str:
                entries.append(entry)
    except OSError:
        pass
    return entries


def check_extraction_miss_rate(result: LoopResult, verbose: bool = False) -> None:
    """Compare extraction hit rate to previous week."""
    now = datetime.now(timezone.utc)
    this_week = _read_log_entries(EXTRACTOR_LOG, now - timedelta(days=LOOKBACK_DAYS))
    last_week = [
        e for e in _read_log_entries(
            EXTRACTOR_LOG, now - timedelta(days=LOOKBACK_DAYS * 2)
        )
        if e.get("timestamp", "") < (now - timedelta(days=LOOKBACK_DAYS)).isoformat()
    ]

    def _agg(entries: list[dict]) -> tuple[int, int, int]:
        cand = sum(e.get("candidates_found", 0) for e in entries)
        prop = sum(e.get("proposals_written", 0) for e in entries)
        sess = sum(e.get("sessions_scanned", 0) for e in entries)
        return cand, prop, sess

    cand_this, prop_this, sess_this = _agg(this_week)
    cand_last, prop_last, _ = _agg(last_week)

    rate_this = prop_this / cand_this if cand_this > 0 else 0.0
    rate_last = prop_last / cand_last if cand_last > 0 else 0.0

    result.extraction_stats = ExtractionStats(
        sessions_scanned=sess_this,
        candidates_found=cand_this,
        proposals_written=prop_this,
        hit_rate=round(rate_this, 4),
    )

    if verbose:
        print(
            f"[loop] extraction: {cand_this} candidates, {prop_this} proposals, "
            f"rate={rate_this:.2%} (prev={rate_last:.2%})",
            file=sys.stderr,
        )

    if rate_last > 0 and rate_this > 0:
        drop = (rate_last - rate_this) / rate_last
        if drop > MISS_RATE_DROP_THRESHOLD:
            result.flags.append(Flag(
                signal="extraction_miss_rate_increase",
                severity="medium",
                detail=(
                    f"Extraction hit rate dropped {drop:.0%} week-over-week: "
                    f"{rate_last:.2%} -> {rate_this:.2%}. "
                    f"Candidates={cand_this}, proposals={prop_this}."
                ),
                proposed_fix=(
                    "Check if new session formats are causing parse failures. "
                    "Review extractor-log.jsonl for elevated dropped_over_cap or dedup counts."
                ),
                estimated_effort="1h extractor pattern review",
            ))

    # Also check: are proposals being drained by curator?
    curator_entries = _read_log_entries(CURATOR_LOG, now - timedelta(days=LOOKBACK_DAYS))
    total_drained = sum(e.get("num_drained", 0) for e in curator_entries)
    if prop_this > 0 and total_drained == 0 and len(curator_entries) > 0:
        result.flags.append(Flag(
            signal="proposals_not_drained",
            severity="medium",
            detail=(
                f"Extractor wrote {prop_this} proposals this week but curator "
                f"drained 0 entries across {len(curator_entries)} runs."
            ),
            proposed_fix=(
                "Verify proposed-memories entries have valid frontmatter schema. "
                "Check curator inbox walking for rocinante/proposed-memories path inclusion."
            ),
            estimated_effort="30min curator debugging",
        ))


# ---------------------------------------------------------------------------
# Step 3: Curator receipt timeouts
# ---------------------------------------------------------------------------


def _get_receipt_dirs(machine_dir: Path) -> set[str]:
    """Collect all receipt entry_id stems from .receipts/ under a machine dir."""
    receipts_root = machine_dir / ".receipts"
    if not receipts_root.exists():
        return set()
    stems = set()
    for receipt in receipts_root.rglob("*.receipt.yml"):
        # Receipt filename is {original}.md.receipt.yml -> stem is {original}.md
        name = receipt.name
        if name.endswith(".receipt.yml"):
            original = name[: -len(".receipt.yml")]
            stems.add(original)
    return stems


def check_receipt_timeouts(result: LoopResult, verbose: bool = False) -> None:
    """Scan inbox dirs for entries older than 48h without a matching receipt."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=RECEIPT_TIMEOUT_HOURS)

    if not INBOX_ROOT.exists():
        return

    health = ReceiptHealth()
    reserved = ("_", ".")

    for machine_dir in sorted(INBOX_ROOT.iterdir()):
        if not machine_dir.is_dir():
            continue
        if machine_dir.name.startswith(reserved):
            continue

        receipt_stems = _get_receipt_dirs(machine_dir)

        for md_file in machine_dir.rglob("*.md"):
            # Skip reserved subdirs
            rel_parts = md_file.relative_to(machine_dir).parts
            if any(p.startswith(reserved) for p in rel_parts[:-1]):
                continue
            if md_file.name.startswith(reserved):
                continue

            health.total_inbox_entries += 1

            # Check if receipt exists
            if md_file.name in receipt_stems:
                continue

            # Check file age
            try:
                mtime = datetime.fromtimestamp(md_file.stat().st_mtime, tz=timezone.utc)
            except OSError:
                continue

            if mtime < cutoff:
                age_hours = int((now - mtime).total_seconds() / 3600)
                health.entries_without_receipt += 1
                health.timed_out.append({
                    "source_machine": machine_dir.name,
                    "file": md_file.name,
                    "age_hours": age_hours,
                    "path": str(md_file),
                })

    result.receipt_health = health

    if verbose:
        print(
            f"[loop] receipts: {health.total_inbox_entries} inbox entries, "
            f"{health.entries_without_receipt} without receipt, "
            f"{len(health.timed_out)} timed out (>{RECEIPT_TIMEOUT_HOURS}h)",
            file=sys.stderr,
        )

    for item in health.timed_out:
        result.flags.append(Flag(
            signal="receipt_timeout",
            severity="high",
            detail=(
                f"Inbox entry '{item['file']}' from {item['source_machine']} "
                f"is {item['age_hours']}h old with no receipt. "
                f"Path: {item['path']}"
            ),
            proposed_fix=(
                "Run curator_pass manually to drain this entry. "
                "If the entry has schema errors, fix its frontmatter or flag it."
            ),
            estimated_effort="10min per entry",
        ))


# ---------------------------------------------------------------------------
# Step 4: Propose improvements
# ---------------------------------------------------------------------------


def _format_proposal(flag: Flag, date_str: str) -> str:
    """Format a single flag as an improvement proposal block."""
    return (
        f"\n## [{flag.severity.upper()}] {flag.signal} ({date_str})\n\n"
        f"**Date:** {date_str}\n"
        f"**Signal:** {flag.signal}\n"
        f"**Severity:** {flag.severity}\n"
        f"**Detail:** {flag.detail}\n"
        f"**Proposed fix:** {flag.proposed_fix}\n"
        f"**Estimated effort:** {flag.estimated_effort}\n"
    )


def write_proposals(result: LoopResult, dry_run: bool, verbose: bool = False) -> None:
    """Append flagged issues to IMPROVEMENT-QUEUE.md. Append-only."""
    if not result.flags:
        if verbose:
            print("[loop] no flags — nothing to append to improvement queue", file=sys.stderr)
        return

    date_str = result.started_at.strftime("%Y-%m-%d")
    blocks = []
    for flag in result.flags:
        blocks.append(_format_proposal(flag, date_str))

    payload = "\n".join(blocks)

    if verbose:
        print(f"[loop] appending {len(result.flags)} proposals to {IMPROVEMENT_QUEUE}", file=sys.stderr)

    if dry_run:
        return

    IMPROVEMENT_QUEUE.parent.mkdir(parents=True, exist_ok=True)
    with IMPROVEMENT_QUEUE.open("a", encoding="utf-8") as f:
        f.write(payload)


# ---------------------------------------------------------------------------
# Step 5: Morning briefing integration
# ---------------------------------------------------------------------------


def write_briefing_summary(result: LoopResult, dry_run: bool, verbose: bool = False) -> Path:
    """Write this week's top-3 improvements to a curator-compatible inbox entry."""
    date_str = result.started_at.strftime("%Y-%m-%d")
    out_path = BRIEFING_DIR / f"{date_str}.md"

    top_flags = sorted(
        result.flags,
        key=lambda f: {"high": 0, "medium": 1, "low": 2}.get(f.severity, 9),
    )[:3]

    lines = [
        "---",
        f"id: improvement-summary-{date_str}",
        "origin: rocinante",
        f"created: {date_str}",
        "target: inbox-only",
        "operation: append",
        "type: report",
        "priority: p2",
        "category: self-improvement",
        f"entity: improvement-loop-{date_str}",
        "---",
        "",
        f"# Improvement Loop Summary: {date_str}",
        "",
    ]

    if not top_flags:
        lines.append("No issues detected this week. All systems nominal.")
    else:
        lines.append(f"**{len(result.flags)} issues detected.** Top 3:")
        lines.append("")
        for i, flag in enumerate(top_flags, 1):
            lines.append(f"{i}. **[{flag.severity.upper()}] {flag.signal}** -- {flag.detail}")
            lines.append(f"   Fix: {flag.proposed_fix}")
            lines.append("")

    lines.extend([
        "",
        "## Metrics",
        "",
        f"- Staleness: fresh={result.tier_dist.fresh}, "
        f"stale={result.tier_dist.stale}, rotten={result.tier_dist.rotten}",
        f"- Extraction: {result.extraction_stats.candidates_found} candidates, "
        f"{result.extraction_stats.proposals_written} proposals "
        f"(rate={result.extraction_stats.hit_rate:.2%})",
        f"- Receipts: {result.receipt_health.total_inbox_entries} inbox entries, "
        f"{result.receipt_health.entries_without_receipt} without receipt",
        "",
    ])

    if verbose:
        print(f"[loop] briefing -> {out_path}", file=sys.stderr)

    if dry_run:
        return out_path

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path


# ---------------------------------------------------------------------------
# Step 6: Snapshot
# ---------------------------------------------------------------------------


def write_snapshot(result: LoopResult, dry_run: bool, verbose: bool = False) -> Path:
    """Persist current metrics for next week's comparison."""
    date_str = result.started_at.strftime("%Y-%m-%d")
    out_path = SNAPSHOT_DIR / f"{date_str}.json"

    snapshot: dict[str, Any] = {
        "date": date_str,
        "timestamp": result.started_at.isoformat(timespec="seconds"),
        "tier_distribution": {
            "fresh": result.tier_dist.fresh,
            "stale": result.tier_dist.stale,
            "rotten": result.tier_dist.rotten,
            "neutral": result.tier_dist.neutral,
            "historical": result.tier_dist.historical,
        },
        "extraction": {
            "sessions_scanned": result.extraction_stats.sessions_scanned,
            "candidates_found": result.extraction_stats.candidates_found,
            "proposals_written": result.extraction_stats.proposals_written,
            "hit_rate": result.extraction_stats.hit_rate,
        },
        "receipt_health": {
            "total_inbox_entries": result.receipt_health.total_inbox_entries,
            "entries_without_receipt": result.receipt_health.entries_without_receipt,
            "timed_out_count": len(result.receipt_health.timed_out),
        },
        "flags_count": len(result.flags),
        "loop_version": LOOP_VERSION,
    }

    if verbose:
        print(f"[loop] snapshot -> {out_path}", file=sys.stderr)

    if dry_run:
        return out_path

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    return out_path


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------


def run_loop(*, dry_run: bool = False, verbose: bool = False) -> LoopResult:
    """Execute one improvement loop pass. Returns LoopResult."""
    t0 = time.monotonic()
    result = LoopResult()

    # Step 1: staleness trend
    check_staleness_trend(result, verbose=verbose)

    # Step 2: extraction miss rate
    check_extraction_miss_rate(result, verbose=verbose)

    # Step 3: receipt timeouts
    check_receipt_timeouts(result, verbose=verbose)

    # Step 4: propose improvements
    write_proposals(result, dry_run=dry_run, verbose=verbose)

    # Step 5: morning briefing integration
    write_briefing_summary(result, dry_run=dry_run, verbose=verbose)

    # Step 6: snapshot
    write_snapshot(result, dry_run=dry_run, verbose=verbose)

    result.runtime_ms = int((time.monotonic() - t0) * 1000)
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="improvement_loop",
        description="Weekly self-improvement loop: detect issues, propose fixes, snapshot.",
    )
    p.add_argument("--dry-run", action="store_true", help="Print actions without writing files.")
    p.add_argument("-v", "--verbose", action="store_true")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    try:
        result = run_loop(dry_run=args.dry_run, verbose=args.verbose)
    except Exception as exc:
        print(f"improvement_loop: fatal error: {exc}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return 1

    summary = {
        "flags": len(result.flags),
        "tier_distribution": {
            "fresh": result.tier_dist.fresh,
            "stale": result.tier_dist.stale,
            "rotten": result.tier_dist.rotten,
        },
        "extraction_hit_rate": result.extraction_stats.hit_rate,
        "receipt_timeouts": len(result.receipt_health.timed_out),
        "runtime_ms": result.runtime_ms,
        "dry_run": args.dry_run,
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
