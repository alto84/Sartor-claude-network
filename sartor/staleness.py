"""Staleness scoring for the Sartor memory wiki.

Implements master plan §3 (memory-system-v2). Pure library — no CLI, no cron.
Consumed by EX-4 curator-pass.py and EX-5 stale-detect.sh.

Scoring (master plan §3.2):

    staleness_score = w1 * age_since_verified
                    + w2 * is_canonical_hub
                    + w3 * inbound_link_count
                    + w4 * declared_volatility
                    - w5 * recent_edit_proximity

Plus an entity-freshness multiplier from oracles.yml (§3.3): when an oracle
reports the underlying entity is fresh, the score is dampened; when stale or
missing-oracle, it is amplified or unchanged.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field as dc_field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Literal

import yaml


REPO_ROOT = Path(__file__).resolve().parent.parent
MEMORY_ROOT = REPO_ROOT / "sartor" / "memory"
ORACLES_PATH = MEMORY_ROOT / ".meta" / "oracles.yml"

CANONICAL_HUBS = frozenset({
    "ALTON.md",
    "FAMILY.md",
    "MACHINES.md",
    "BUSINESS.md",
    "TAXES.md",
    "ASTRAZENECA.md",
    "MASTERPLAN.md",
    "MASTERPLAN-VISIONARY.md",
    "PROCEDURES.md",
    "PROJECTS.md",
    "LEARNINGS.md",
    "SELF.md",
    "MEMORY.md",
    "reference/MULTI-MACHINE-MEMORY.md",
})

HISTORICAL_PATH_MARKERS = ("/archive/", "/daily/", "/snapshots/", "/inbox/")

W_AGE = 1.0
W_HUB = 20.0
W_INBOUND = 2.0
VOLATILITY_WEIGHT = {"high": 30.0, "med": 10.0, "medium": 10.0, "low": 0.0}
W_RECENT_EDIT = 1.0
RECENT_EDIT_CAP = 14

STALE_THRESHOLD = 60.0
ROTTEN_THRESHOLD = 120.0

Tier = Literal["fresh", "stale", "rotten", "historical", "neutral"]
OracleStatus = Literal["fresh", "stale", "missing", "unknown", "n/a"]


@dataclass
class StalenessScore:
    path: str
    score: float
    tier: Tier
    age_days: int | None
    last_verified: str | None
    oracle_status: OracleStatus
    reasons: list[str] = dc_field(default_factory=list)


@dataclass
class OracleEntry:
    name: str
    source: str
    path: str | None = None
    field: str | None = None
    shell: str | None = None
    parser: str | None = None
    max_age_days: int | None = None
    cache_sec: int | None = None
    applies_to: list[str] = dc_field(default_factory=list)


OracleMap = dict[str, OracleEntry]


_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_frontmatter(text: str) -> dict | None:
    """Return YAML frontmatter as a dict, or None if missing/malformed."""
    m = _FRONTMATTER_RE.match(text)
    if not m:
        return None
    try:
        data = yaml.safe_load(m.group(1))
    except yaml.YAMLError:
        return None
    return data if isinstance(data, dict) else None


def _coerce_date(value) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
            try:
                return datetime.strptime(value.strip(), fmt).date()
            except ValueError:
                continue
    return None


def _today() -> date:
    return datetime.now(timezone.utc).date()


def _hub_key(path: Path) -> str | None:
    """Return the canonical-hub key for a path, or None."""
    try:
        rel = path.resolve().relative_to(MEMORY_ROOT.resolve())
    except (ValueError, OSError):
        return None
    rel_str = rel.as_posix()
    if rel_str in CANONICAL_HUBS:
        return rel_str
    return None


def _is_historical(path: Path) -> bool:
    p = path.as_posix()
    return any(marker in p for marker in HISTORICAL_PATH_MARKERS)


def load_oracles(oracle_path: Path | None = None) -> OracleMap:
    """Read oracles.yml and return a name → OracleEntry map.

    Returns an empty map if the file is absent — staleness scoring still
    functions, just without entity-freshness signals.
    """
    path = oracle_path or ORACLES_PATH
    if not path.exists():
        return {}
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    entries = raw.get("oracles") or raw.get("entities") or raw
    out: OracleMap = {}
    if not isinstance(entries, dict):
        return out
    for name, body in entries.items():
        if not isinstance(body, dict):
            continue
        out[name] = OracleEntry(
            name=name,
            source=str(body.get("source", "unknown")),
            path=body.get("path"),
            field=body.get("field"),
            shell=body.get("shell"),
            parser=body.get("parser"),
            max_age_days=body.get("max_age_days"),
            cache_sec=body.get("cache_sec"),
            applies_to=list(body.get("applies_to") or []),
        )
    return out


def _check_oracle(entry: OracleEntry) -> tuple[OracleStatus, str]:
    """Lightweight oracle check — only handles `frontmatter`/`file` sources.

    `command`/`ssh` oracles are deferred to the curator-pass runtime which
    can shell out safely. This library returns "unknown" for those rather
    than executing arbitrary commands at scoring time.
    """
    if entry.source in ("frontmatter", "file"):
        if not entry.path:
            return "missing", f"oracle {entry.name}: no path"
        target = REPO_ROOT / entry.path
        if not target.exists():
            return "missing", f"oracle {entry.name}: target {entry.path} not found"
        text = target.read_text(encoding="utf-8", errors="replace")
        fm = parse_frontmatter(text)
        if not fm:
            return "missing", f"oracle {entry.name}: target has no frontmatter"
        field_name = entry.field or "updated"
        d = _coerce_date(fm.get(field_name))
        if d is None:
            return "missing", f"oracle {entry.name}: field {field_name} missing/malformed"
        age = (_today() - d).days
        max_age = entry.max_age_days or 30
        if age > max_age:
            return "stale", f"oracle {entry.name}: {field_name} is {age}d old (max {max_age})"
        return "fresh", f"oracle {entry.name}: {field_name} is {age}d old (within {max_age})"
    return "unknown", f"oracle {entry.name}: source {entry.source} deferred to runtime"


def _oracle_for(path: Path, oracles: OracleMap) -> OracleEntry | None:
    """Find the first oracle whose `applies_to` matches this file path."""
    try:
        rel = path.resolve().relative_to(REPO_ROOT.resolve()).as_posix()
    except (ValueError, OSError):
        rel = path.as_posix()
    for entry in oracles.values():
        for pat in entry.applies_to:
            if pat in rel:
                return entry
    return None


def _inbound_link_count(path: Path) -> int:
    """Cheap inbound-link estimate by basename grep across the memory tree.

    Not exact (no anchor handling), but good enough for the log10 term.
    """
    stem = path.stem
    if not stem or len(stem) < 3:
        return 0
    pattern = re.compile(r"\[\[" + re.escape(stem) + r"(?:\||\]|#)")
    count = 0
    for md in MEMORY_ROOT.rglob("*.md"):
        if md == path:
            continue
        try:
            text = md.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        count += len(pattern.findall(text))
    return count


def classify_tier(score: float) -> Tier:
    if score < STALE_THRESHOLD:
        return "fresh"
    if score < ROTTEN_THRESHOLD:
        return "stale"
    return "rotten"


def score_file(
    path: str | Path,
    oracles: OracleMap | None = None,
    *,
    inbound_links: int | None = None,
) -> StalenessScore:
    """Score a single memory file. Always returns a StalenessScore — never raises
    on missing/malformed frontmatter; degrades to a `neutral` tier instead."""
    p = Path(path)
    rel = p.as_posix()
    reasons: list[str] = []

    if not p.exists():
        return StalenessScore(
            path=rel,
            score=0.0,
            tier="neutral",
            age_days=None,
            last_verified=None,
            oracle_status="n/a",
            reasons=["file not found"],
        )

    if _is_historical(p):
        return StalenessScore(
            path=rel,
            score=0.0,
            tier="historical",
            age_days=None,
            last_verified=None,
            oracle_status="n/a",
            reasons=["path matches archive/daily/snapshot/inbox marker"],
        )

    text = p.read_text(encoding="utf-8", errors="replace")
    fm = parse_frontmatter(text)

    if fm is None:
        reasons.append("no frontmatter — neutral score")
        return StalenessScore(
            path=rel,
            score=0.0,
            tier="neutral",
            age_days=None,
            last_verified=None,
            oracle_status="n/a",
            reasons=reasons,
        )

    today = _today()
    last_verified_raw = fm.get("last_verified")
    next_review_raw = fm.get("next_review")
    updated_raw = fm.get("updated")

    last_verified_date = _coerce_date(last_verified_raw) or _coerce_date(next_review_raw)
    if last_verified_date is None:
        last_verified_date = _coerce_date(updated_raw)
        if last_verified_date is not None:
            reasons.append("no last_verified — falling back to `updated`")
    if last_verified_date is None:
        reasons.append("no datable frontmatter — neutral score")
        return StalenessScore(
            path=rel,
            score=0.0,
            tier="neutral",
            age_days=None,
            last_verified=None,
            oracle_status="n/a",
            reasons=reasons,
        )

    age_days = max((today - last_verified_date).days, 0)
    score = W_AGE * age_days
    reasons.append(f"+{W_AGE * age_days:.1f} from age ({age_days}d since verified)")

    hub_key = _hub_key(p)
    if hub_key:
        score += W_HUB
        reasons.append(f"+{W_HUB:.0f} canonical hub ({hub_key})")

    if inbound_links is None:
        try:
            inbound_links = _inbound_link_count(p)
        except OSError:
            inbound_links = 0
    if inbound_links > 0:
        bump = W_INBOUND * math.log10(inbound_links + 1) * 10
        score += bump
        reasons.append(f"+{bump:.1f} from {inbound_links} inbound wikilinks")

    volatility = (fm.get("volatility") or "").strip().lower()
    if volatility in VOLATILITY_WEIGHT:
        v_bump = VOLATILITY_WEIGHT[volatility]
        score += v_bump
        if v_bump:
            reasons.append(f"+{v_bump:.0f} declared volatility={volatility}")

    updated_date = _coerce_date(updated_raw)
    if updated_date is not None:
        edit_age = max((today - updated_date).days, 0)
        if edit_age < RECENT_EDIT_CAP:
            relief = W_RECENT_EDIT * (RECENT_EDIT_CAP - edit_age)
            score -= relief
            reasons.append(f"-{relief:.1f} recent edit proximity ({edit_age}d since updated)")

    oracle_status: OracleStatus = "n/a"
    oracle_entry = _oracle_for(p, oracles or {})
    if oracle_entry:
        status, msg = _check_oracle(oracle_entry)
        oracle_status = status
        reasons.append(msg)
        if status == "fresh":
            score *= 0.5
            reasons.append("x0.5 oracle reports entity fresh")
        elif status == "stale":
            score *= 1.5
            reasons.append("x1.5 oracle reports entity stale")

    tier = classify_tier(score)
    return StalenessScore(
        path=rel,
        score=round(score, 2),
        tier=tier,
        age_days=age_days,
        last_verified=last_verified_date.isoformat() if last_verified_date else None,
        oracle_status=oracle_status,
        reasons=reasons,
    )
