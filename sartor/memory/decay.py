#!/usr/bin/env python3
"""
Memory Decay System -- temporal relevance scoring for the Sartor memory wiki.

Based on the Mnemex formula:
  score(t) = (n_use)^0.6 * e^(-lambda * delta_t) * importance

Where:
  n_use     = number of times this memory has been accessed
  lambda    = ln(2) / half_life_days
  delta_t   = days since last access
  importance = base importance score (0.0-1.0)

Decay tiers:
  ACTIVE   (>= 0.65): Always surfaced in context injection
  WARM     (>= 0.30): In search results and briefings
  COLD     (>= 0.15): In search results, lower ranked
  FORGOTTEN(>= 0.05): Indexed but not surfaced unless queried
  ARCHIVE  (< 0.05):  Preserved, minimal score, never deleted
"""

import argparse
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path

META_DIR = Path(__file__).parent / ".meta"
DECAY_SCORES_FILE = META_DIR / "decay-scores.json"
ACCESS_LOG_FILE = META_DIR / "access-log.json"

MEMORY_DIR = Path(__file__).parent

# Tier thresholds
ACTIVE = 0.65
WARM = 0.30
COLD = 0.15
FORGOTTEN = 0.05

# Default importance by file type
DEFAULT_IMPORTANCE = {
    "ALTON.md": 1.0,
    "FAMILY.md": 1.0,
    "MACHINES.md": 0.8,
    "BUSINESS.md": 0.8,
    "TAXES.md": 0.7,
    "PROJECTS.md": 0.6,
    "LEARNINGS.md": 0.7,
    "PROCEDURES.md": 0.6,
    "ASTRAZENECA.md": 0.7,
    "SELF.md": 0.5,
    "MASTERPLAN.md": 0.4,
    "MASTERPLAN-VISIONARY.md": 0.4,
}

# Half-lives by content type
HALF_LIFE = {
    "core": 30.0,        # Core identity files (ALTON, FAMILY)
    "operational": 14.0, # Active operations (BUSINESS, MACHINES)
    "seasonal": 7.0,     # Time-sensitive (TAXES, PROJECTS)
    "daily": 3.0,        # Daily logs
    "snapshot": 7.0,     # Ingested snapshots
    "research": 14.0,    # Research notes
}

# Map files to half-life category
FILE_HALF_LIFE = {
    "ALTON.md": "core",
    "FAMILY.md": "core",
    "SELF.md": "core",
    "MACHINES.md": "operational",
    "BUSINESS.md": "operational",
    "ASTRAZENECA.md": "operational",
    "TAXES.md": "seasonal",
    "PROJECTS.md": "seasonal",
    "MASTERPLAN.md": "seasonal",
    "MASTERPLAN-VISIONARY.md": "seasonal",
    "LEARNINGS.md": "operational",
    "PROCEDURES.md": "operational",
}


def decay_score(last_accessed: str | None, n_accesses: int, importance: float = 0.5, half_life_days: float = 7.0) -> float:
    """Compute temporal relevance score using the Mnemex formula.

    score = (n_use)^0.6 * e^(-lambda * delta_t) * importance

    Args:
        last_accessed: ISO format datetime string, or None if never accessed.
        n_accesses: Number of times this file has been accessed.
        importance: Base importance weight (0.0-1.0).
        half_life_days: Half-life of decay in days.

    Returns:
        Score in range [0.0, 1.0].
    """
    if n_accesses == 0:
        # Never accessed: start at importance * 0.5 with default freshness
        n_accesses = 1
        delta_t = 0.0
    else:
        if last_accessed is None:
            delta_t = 0.0
        else:
            try:
                last_dt = datetime.fromisoformat(last_accessed)
                if last_dt.tzinfo is None:
                    last_dt = last_dt.replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                delta_t = max(0.0, (now - last_dt).total_seconds() / 86400.0)
            except (ValueError, TypeError):
                delta_t = 0.0

    lam = math.log(2) / max(half_life_days, 0.001)
    raw = (n_accesses ** 0.6) * math.exp(-lam * delta_t) * importance

    # Normalize: at n=1, delta_t=0, score = importance. Cap at 1.0.
    return min(1.0, raw)


def load_scores() -> dict:
    """Load decay scores from .meta/decay-scores.json."""
    META_DIR.mkdir(parents=True, exist_ok=True)
    if not DECAY_SCORES_FILE.exists():
        return {}
    try:
        return json.loads(DECAY_SCORES_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_scores(scores: dict) -> None:
    """Save decay scores to .meta/decay-scores.json."""
    META_DIR.mkdir(parents=True, exist_ok=True)
    DECAY_SCORES_FILE.write_text(
        json.dumps(scores, indent=2, sort_keys=True),
        encoding="utf-8",
    )


def load_access_log() -> dict:
    """Load access log from .meta/access-log.json."""
    META_DIR.mkdir(parents=True, exist_ok=True)
    if not ACCESS_LOG_FILE.exists():
        return {}
    try:
        return json.loads(ACCESS_LOG_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_access_log(log: dict) -> None:
    """Save access log to .meta/access-log.json."""
    META_DIR.mkdir(parents=True, exist_ok=True)
    ACCESS_LOG_FILE.write_text(
        json.dumps(log, indent=2, sort_keys=True),
        encoding="utf-8",
    )


def record_access(filename: str) -> None:
    """Record that a memory file was accessed. Updates access count and timestamp."""
    scores = load_scores()
    log = load_access_log()
    now_iso = datetime.now(timezone.utc).isoformat()

    # Update access log
    basename = Path(filename).name
    if basename not in log:
        log[basename] = {"accesses": [], "total_count": 0}
    log[basename]["accesses"].append(now_iso)
    log[basename]["total_count"] += 1
    # Keep last 50 access timestamps to avoid unbounded growth
    log[basename]["accesses"] = log[basename]["accesses"][-50:]

    # Update score entry
    key = str(Path(filename).resolve()) if Path(filename).is_absolute() else filename
    # Also track by basename for portability
    if key not in scores:
        key = basename
    if key not in scores:
        scores[key] = {
            "n_accesses": 0,
            "last_accessed": None,
            "importance": DEFAULT_IMPORTANCE.get(basename, 0.5),
            "half_life_days": HALF_LIFE.get(
                FILE_HALF_LIFE.get(basename, "operational"), 14.0
            ),
        }

    scores[key]["n_accesses"] = scores[key].get("n_accesses", 0) + 1
    scores[key]["last_accessed"] = now_iso

    # Recompute score
    scores[key]["score"] = decay_score(
        scores[key]["last_accessed"],
        scores[key]["n_accesses"],
        scores[key]["importance"],
        scores[key]["half_life_days"],
    )
    scores[key]["tier"] = get_tier(scores[key]["score"])

    save_scores(scores)
    save_access_log(log)


def compute_all_scores() -> dict:
    """Recompute decay scores for all memory files in sartor/memory/.

    Scans *.md files (including daily/), loads existing n_accesses and
    last_accessed from the score store, recomputes scores, and persists.
    """
    scores = load_scores()

    # Collect all .md files, excluding .meta/
    md_files: list[Path] = []
    for path in sorted(MEMORY_DIR.rglob("*.md")):
        if ".meta" in path.parts:
            continue
        md_files.append(path)

    updated: dict = {}
    for path in md_files:
        basename = path.name
        # Look up existing entry by basename (preferred) or full path
        existing = scores.get(basename) or scores.get(str(path.resolve())) or {}

        n_accesses = existing.get("n_accesses", 0)
        last_accessed = existing.get("last_accessed", None)

        # Use file mtime as a proxy for last_accessed if never recorded
        if last_accessed is None and n_accesses == 0:
            try:
                mtime = path.stat().st_mtime
                last_accessed = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
                n_accesses = 1
            except OSError:
                pass

        importance = DEFAULT_IMPORTANCE.get(basename, 0.5)
        hl_category = FILE_HALF_LIFE.get(basename, "daily" if "daily" in str(path) else "operational")
        hl_days = HALF_LIFE.get(hl_category, 7.0)

        score = decay_score(last_accessed, n_accesses, importance, hl_days)

        updated[basename] = {
            "path": str(path),
            "n_accesses": n_accesses,
            "last_accessed": last_accessed,
            "importance": importance,
            "half_life_days": hl_days,
            "score": round(score, 4),
            "tier": get_tier(score),
        }

    save_scores(updated)
    return updated


def get_tier(score: float) -> str:
    """Classify a score into a decay tier name."""
    if score >= ACTIVE:
        return "ACTIVE"
    elif score >= WARM:
        return "WARM"
    elif score >= COLD:
        return "COLD"
    elif score >= FORGOTTEN:
        return "FORGOTTEN"
    else:
        return "ARCHIVE"


def get_health_summary() -> dict:
    """Return a summary of memory health for dashboard use."""
    scores = load_scores()
    if not scores:
        scores = compute_all_scores()

    tier_counts = {"ACTIVE": 0, "WARM": 0, "COLD": 0, "FORGOTTEN": 0, "ARCHIVE": 0}
    total_size_bytes = 0
    stalest = None
    stalest_score = 1.0
    freshest = None
    freshest_score = 0.0

    for basename, entry in scores.items():
        tier = entry.get("tier", get_tier(entry.get("score", 0.0)))
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

        score = entry.get("score", 0.0)
        if score < stalest_score:
            stalest_score = score
            stalest = basename
        if score > freshest_score:
            freshest_score = score
            freshest = basename

        path = Path(entry.get("path", MEMORY_DIR / basename))
        try:
            total_size_bytes += path.stat().st_size
        except OSError:
            pass

    return {
        "total_files": len(scores),
        "total_size_kb": round(total_size_bytes / 1024, 1),
        "tier_counts": tier_counts,
        "stalest_file": stalest,
        "stalest_score": round(stalest_score, 4),
        "freshest_file": freshest,
        "freshest_score": round(freshest_score, 4),
    }


def cli() -> None:
    parser = argparse.ArgumentParser(description="Memory decay scoring for Sartor memory wiki.")
    parser.add_argument("--refresh", action="store_true", help="Recompute scores for all memory files.")
    parser.add_argument("--health", action="store_true", help="Show memory health summary.")
    parser.add_argument("--tier", metavar="TIER", help="Show files in a specific tier (ACTIVE/WARM/COLD/FORGOTTEN/ARCHIVE).")
    args = parser.parse_args()

    if args.refresh or not args.health and not args.tier:
        scores = compute_all_scores()
        print(f"Computed scores for {len(scores)} files:\n")
        col_w = 36
        print(f"  {'File':<{col_w}} {'Score':>7}  {'Tier':<10}  {'Accesses':>8}  Last Accessed")
        print("  " + "-" * 85)
        for basename, entry in sorted(scores.items(), key=lambda x: x[1]["score"], reverse=True):
            last = entry.get("last_accessed") or "never"
            if last != "never":
                try:
                    last = datetime.fromisoformat(last).strftime("%Y-%m-%d")
                except ValueError:
                    pass
            print(
                f"  {basename:<{col_w}} {entry['score']:>7.4f}  {entry['tier']:<10}  {entry['n_accesses']:>8}  {last}"
            )

    if args.health:
        summary = get_health_summary()
        print("Memory Health Summary")
        print("=" * 40)
        print(f"  Total files:    {summary['total_files']}")
        print(f"  Total size:     {summary['total_size_kb']} KB")
        print(f"  Tier distribution:")
        for tier, count in summary["tier_counts"].items():
            bar = "#" * count
            print(f"    {tier:<10} {count:>3}  {bar}")
        print(f"  Freshest: {summary['freshest_file']} ({summary['freshest_score']:.4f})")
        print(f"  Stalest:  {summary['stalest_file']} ({summary['stalest_score']:.4f})")

    if args.tier:
        tier_filter = args.tier.upper()
        scores = load_scores()
        if not scores:
            scores = compute_all_scores()
        matches = {k: v for k, v in scores.items() if v.get("tier") == tier_filter}
        if not matches:
            print(f"No files in tier: {tier_filter}")
        else:
            print(f"Files in tier {tier_filter}:")
            for basename, entry in sorted(matches.items(), key=lambda x: x[1]["score"], reverse=True):
                print(f"  {basename:<36} {entry['score']:.4f}")


if __name__ == "__main__":
    cli()
