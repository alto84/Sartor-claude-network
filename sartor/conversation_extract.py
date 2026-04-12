"""Conversation extractor v1 — recover lost facts from Claude Code session JSONLs.

Implements master plan §4 and EX-7. Runs nightly at 23:30 ET on Rocinante, scans
every session JSONL touched in the last 24h, extracts fact candidates per
user turn with recall-biased rules, classifies feedback, detects
structured-field updates, dedups against existing memory, and writes
curator-compatible inbox entries to
`sartor/memory/inbox/rocinante/proposed-memories/YYYY-MM-DD/`.

Run as:
    python -m sartor.conversation_extract [--since DATE] [--dry-run] [--cap N] [-v]

Exit codes:
    0  success (even if 0 proposals written)
    1  fatal error
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import traceback
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, Iterator

REPO_ROOT = Path(__file__).resolve().parent.parent
MEMORY_ROOT = REPO_ROOT / "sartor" / "memory"
INBOX_ROOT = MEMORY_ROOT / "inbox"
META_DIR = MEMORY_ROOT / ".meta"
EXTRACTOR_LOG = META_DIR / "extractor-log.jsonl"
PROPOSED_ROOT = INBOX_ROOT / "rocinante" / "proposed-memories"

SESSION_ROOTS = [
    Path("C:/Users/alto8/.claude/projects/C--Users-alto8"),
    Path("C:/Users/alto8/.claude/projects/C--Users-alto8-Sartor-claude-network"),
]

MIN_FILE_SIZE = 10 * 1024  # skip cron fragments under 10KB
DEFAULT_CAP = 20
EXTRACTOR_NAME = "rocinante-extractor"
EXTRACTOR_VERSION = "0.1"

# Noise prefixes / markers: skip user turns that are really tool output or system wrappers.
NOISE_PREFIXES = (
    "<tool_use",
    "<tool_result",
    "<task-notification>",
    "<local-command",
    "<command-name>",
    "<command-message>",
    "<command-args>",
    "<command-stdout>",
    "<command-stderr>",
    "<teammate-message",
    "<user-prompt-submit-hook>",
    "<system-reminder>",
    "[Request interrupted",
    "Caveat: The messages below",
)

CONTINUATION_MARKER = "This session is being continued from a previous conversation"


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class UserTurn:
    session_id: str
    turn_id: str
    timestamp: str
    text: str
    prior_context: str  # last 2 assistant turns (short)
    source_file: Path


@dataclass
class FactCandidate:
    text: str
    category: str  # numeric|proper_noun|save_verb|imperative|feedback_rule|feedback_permission|feedback_preference|structured_update
    subclass: str  # dollar, phone, dob, name, ...
    confidence: float
    turn: UserTurn
    entity: str = ""
    suggested_target: str = ""
    suggested_operation: str = "append"
    suggested_field: str = ""
    suggested_value: str = ""
    match_span: str = ""  # the matched substring

    def fingerprint(self) -> str:
        return hashlib.sha1(
            f"{self.category}|{self.subclass}|{self.match_span.lower()}|{self.entity.lower()}".encode("utf-8")
        ).hexdigest()[:12]


@dataclass
class ExtractStats:
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    sessions_scanned: int = 0
    sessions_skipped_small: int = 0
    turns_scanned: int = 0
    candidates_found: int = 0
    candidates_by_class: Counter = field(default_factory=Counter)
    proposals_written: int = 0
    dropped_over_cap: int = 0
    dedup_already_landed: int = 0
    dedup_partial: int = 0
    proposals_paths: list[Path] = field(default_factory=list)
    runtime_ms: int = 0
    errors: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Session discovery + turn iteration
# ---------------------------------------------------------------------------


def discover_sessions(since: datetime, roots: list[Path] | None = None) -> list[Path]:
    """Return JSONL files modified at or after `since`, ≥10KB."""
    roots = roots or SESSION_ROOTS
    out: list[Path] = []
    since_ts = since.timestamp()
    for root in roots:
        if not root.exists():
            continue
        for p in sorted(root.glob("*.jsonl")):
            try:
                st = p.stat()
            except OSError:
                continue
            if st.st_size < MIN_FILE_SIZE:
                continue
            if st.st_mtime < since_ts:
                continue
            out.append(p)
    return out


def iter_user_turns(path: Path) -> Iterator[UserTurn]:
    """Yield parsed user turns from a JSONL session file.

    Skips turns that are tool output / system-wrappers / continuation summaries.
    Also carries a small prior-assistant context window for co-reference.
    """
    session_id = path.stem[:18]
    prior_assistant: list[str] = []
    try:
        f = path.open("r", encoding="utf-8", errors="replace")
    except OSError:
        return
    with f:
        for line_no, line in enumerate(f):
            try:
                j = json.loads(line)
            except Exception:
                continue
            t = j.get("type")
            if t == "assistant":
                msg = j.get("message") or {}
                content = msg.get("content") if isinstance(msg, dict) else None
                txt = _extract_text(content)
                if txt:
                    prior_assistant.append(txt[:400])
                    if len(prior_assistant) > 2:
                        prior_assistant.pop(0)
                continue
            if t != "user":
                continue
            msg = j.get("message") or {}
            content = msg.get("content") if isinstance(msg, dict) else None
            text = _extract_text(content)
            if not text:
                continue
            stripped = text.lstrip()
            if _is_noise(stripped):
                continue
            yield UserTurn(
                session_id=session_id,
                turn_id=j.get("uuid", f"{path.stem}-{line_no}"),
                timestamp=j.get("timestamp", ""),
                text=text,
                prior_context="\n".join(prior_assistant[-2:]),
                source_file=path,
            )


def _extract_text(content) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for x in content:
            if isinstance(x, dict) and x.get("type") == "text":
                parts.append(x.get("text", ""))
        return "\n".join(parts)
    return ""


def _is_noise(stripped: str) -> bool:
    if not stripped:
        return True
    for prefix in NOISE_PREFIXES:
        if stripped.startswith(prefix):
            return True
    if CONTINUATION_MARKER in stripped[:200]:
        return True
    return False


# ---------------------------------------------------------------------------
# Per-turn fact extraction (recall-biased)
# ---------------------------------------------------------------------------


DOLLAR_RE = re.compile(r"\$\s?(\d{1,3}(?:[,\d]{0,6})(?:\.\d{1,2})?)(?:\s?(/hr|/mo|/yr|per hour|per month|per year|k|K))?")
PRICE_HIKE_RE = re.compile(
    r"(?:increas(?:e|ing)|rais(?:e|ing)|hik(?:e|ing)|bump(?:ing)?|mov(?:e|ing)\s+up)\s+(?:the\s+)?"
    r"(rental\s+)?price\s+(?:to|up to|to\s+be)\s*\$?\s?(\d+(?:\.\d{1,2})?)",
    re.IGNORECASE,
)
# Alternative price statement: "rental price is 0.35 per hour"
PRICE_SET_RE = re.compile(
    r"(?:rental\s+)?price\s+(?:to|is|at)\s*\$?\s?(\d+\.\d{1,2})\s*(?:/hr|per hour|/hour)?",
    re.IGNORECASE,
)

PHONE_RE = re.compile(r"\(\s*(\d{3})\s*\)\s*(\d{3})[-\s]?(\d{4})")
DOB_RE = re.compile(r"\b(\d{1,2})[\/\-](\d{1,2})[\/\-](19|20)(\d{2})\b")
# Short-form DOB: 9/20/84 — two-digit year. Only counted if nearby context
# (birthday|born|dob|birth) exists — verified in the extraction function.
DOB_SHORT_RE = re.compile(r"\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b")
ZIP_RE = re.compile(r"\b(\d{5})(?:-\d{4})?\b")
# Account number mentions: "ending in 1234", "account 1234", or the more
# vernacular "what account that is for 1640" — a trailing 4-digit suffix
# after the word "account" (with up to 40 chars of filler).
ACCOUNT_SUFFIX_RE = re.compile(
    r"\bending\s+in\s+(\d{3,6})\b|\baccount\s+(?:number\s+)?(\d{4})\b|"
    r"\baccount\s+(?:that\s+is\s+)?(?:for\s+)?(\d{4})\b",
    re.IGNORECASE,
)

SAVE_VERB_RE = re.compile(
    r"\b(save\s+(?:it|this|that)|"
    r"remember\s+(?:that|this)|"
    r"please\s+(?:remember|save|note|track)|"
    r"write\s+this\s+down|"
    r"add\s+(?:this|it)\s+to\s+(?:the\s+)?(?:memory|wiki|file)|"
    r"put\s+(?:this|it)\s+in\s+(?:the\s+)?(?:memory|wiki)|"
    r"store\s+(?:this|it)|"
    r"note\s+that|"
    r"track\s+this|"
    r"make\s+a\s+note)\b",
    re.IGNORECASE,
)

# Feedback — 3 classes
FEEDBACK_RULE_RE = re.compile(
    r"\b(from\s+now\s+on|always|never|don'?t\s+\w+\s+again|"
    r"stop\s+(?:doing|using|calling)|"
    r"whenever\s+you|"
    r"make\s+sure\s+(?:you|to)|"
    r"please\s+(?:always|never)|"
    r"going\s+forward)\b",
    re.IGNORECASE,
)
FEEDBACK_PERMISSION_RE = re.compile(
    r"\b(you\s+have\s+(?:full\s+)?permission|"
    r"you\s+can\s+.{3,40}\s+without\s+asking|"
    r"i\s+authorize|"
    r"i'?m\s+authorizing|"
    r"permission[,.]?\s+period|"
    r"go\s+ahead\s+without\s+asking|"
    r"(?:feel\s+)?free\s+to\s+\w+\s+(?:anything|whatever)|"
    r"don'?t\s+need\s+to\s+ask|"
    r"don'?t\s+ask\s+me\s+for\s+permission)\b",
    re.IGNORECASE,
)
FEEDBACK_PREFERENCE_RE = re.compile(
    r"\b(i\s+(?:do\s+)?tend\s+to\s+prefer|"
    r"i\s+prefer|"
    r"i\s+usually|"
    r"i\s+generally|"
    r"generally\s+i|"
    r"i\s+like\s+to\s+stay|"
    r"i'?d\s+like\s+(?:to|a)\s+(?:daily|weekly)|"
    r"i\s+want\s+to\s+make|"
    r"(?:i'?d|i\s+would)\s+prefer)\b",
    re.IGNORECASE,
)

# Proper-noun introduction patterns
PROPER_NOUN_INTRO_RE = re.compile(
    r"(?:^|[.!?]\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:,|—|-)\s*([^.!?\n]{4,80})",
)

# Imperative task batch ("pay X, pick up Y")
IMPERATIVE_TASK_RE = re.compile(
    r"\b(pay|pick\s+up|order|buy|book|schedule|reserve|call|email|text|file|submit|send|renew|"
    r"register|drop\s+off|pick\s+out|find)\s+([A-Za-z][A-Za-z0-9'\- ]{2,60})",
    re.IGNORECASE,
)

# Health/diagnosis language → FAMILY.md structured update
DIAGNOSIS_RE = re.compile(
    r"\b(lymphoma|cancer|diabetes|hypertension|arthritis|seizures?|chemo|chemotherapy|"
    r"dialysis|pregnant|in\s+remission|diagnosed\s+with\s+\w+|has\s+small[\s-]cell\s+lymphoma|"
    r"has\s+(?:a\s+)?(?:small[\s-]cell\s+)?lymphoma)\b",
    re.IGNORECASE,
)

# Acquisition / M&A
ACQUISITION_RE = re.compile(
    r"\b([A-Z][\w]+(?:\s+[A-Z][\w]+)?)\s+(?:acquir(?:es|ed)|buys|bought|purchased|purchases)\s+"
    r"(?:stealth\s+)?(?:[A-Z\w\-]+\s+)?([A-Z][\w\-]+(?:\s+[A-Z][\w\-]+)?)",
)
ACQUISITION_ALT_RE = re.compile(
    r"\b([A-Z][\w]+)\s+Buys?\s+(?:Stealth\s+)?(?:[\w\-]+\s+)?([A-Z][\w]+\s*[A-Z][\w]*)",
)

# WiFi / network credentials pattern
WIFI_PW_RE = re.compile(
    r"\b(?:wifi|wi-fi|network|password|passphrase)\s*[:=]?\s*([a-z0-9][a-z0-9\-_]{5,40})",
    re.IGNORECASE,
)

# Fleet expansion intent ("getting some more machines", "adding GPUs", "more servers")
FLEET_EXPAND_RE = re.compile(
    r"\b(get(?:ting)?\s+(?:some\s+)?more\s+(?:machines|servers|gpus|nodes)|"
    r"adding?\s+(?:another|more)\s+(?:machine|server|gpu|node)|"
    r"expand(?:ing)?\s+the\s+fleet|"
    r"more\s+(?:machines|gpus|servers))\b",
    re.IGNORECASE,
)

# Options-trading decision vocabulary: theta decay, roll up, let it decay, delta
OPTIONS_DECISION_RE = re.compile(
    r"\b(let\s+it\s+decay|"
    r"roll\s+(?:it|them)?\s*(?:up|out|up\s+and\s+out|down|forward)|"
    r"theta\s+(?:decay|gains?|positions?)|"
    r"decay\s+(?:a\s+bit|for\s+a\s+little)|"
    r"close\s+the\s+position|"
    r"assignment\s+risk)\b",
    re.IGNORECASE,
)

# Fiscal outlook / policy references — bonus expectation, tax reform bill
FISCAL_OUTLOOK_RE = re.compile(
    r"\b(huge\s+bonus|big\s+bonus|large\s+bonus|"
    r"big\s+beautiful\s+bill|"
    r"accelerated\s+(?:depreciation|pass[\s-]through)|"
    r"solar\s+ITC|ITC\s+(?:deduction|credit)|"
    r"expected\s+payout|expecting\s+(?:a\s+)?(?:large|huge|big)\s+payout|"
    r"tax\s+credit\s+for\s+the\s+solar)\b",
    re.IGNORECASE,
)

# Portfolio file references ("Portfolio_Positions_...csv", "my holdings file")
PORTFOLIO_REF_RE = re.compile(
    r"(Portfolio_Positions_[A-Za-z0-9_\-\.]+\.csv|"
    r"my\s+(?:holdings|positions)\s+file|"
    r"positions\s+csv|"
    r"portfolio\s+csv)",
    re.IGNORECASE,
)

# "Staying late", commute anchor
COMMUTE_ANCHOR_RE = re.compile(
    r"\b(staying\s+late(?:\s+frequently)?|"
    r"late\s+nights?\s+in\s+(?:NYC|New York|the office)|"
    r"commut(?:e|ing)\s+\d+\s+days)\b",
    re.IGNORECASE,
)

# Well-known proper nouns that should trigger structured-update detection
ENTITY_TRIGGERS = {
    "Loki": ("FAMILY.md", "family", "Loki"),
    "Ghosty": ("FAMILY.md", "family", "Ghosty"),
    "Pickle": ("FAMILY.md", "family", "Pickle"),
    "Alton": ("ALTON.md", "alton", "Alton"),
    "Aneeta": ("FAMILY.md", "family", "Aneeta"),
    "Vayu": ("FAMILY.md", "family", "Vayu"),
    "Vishala": ("FAMILY.md", "family", "Vishala"),
    "Vasu": ("FAMILY.md", "family", "Vasu"),
    "Miguel": ("people/miguel.md", "people", "Miguel"),
    "Coefficient": ("ASTRAZENECA.md", "astrazeneca", "Coefficient Bio"),
    "Verizon": ("reference/network.md", "reference", "Verizon"),
    "rental": ("MACHINES.md", "machines", "machine-52271"),
    "vast.ai": ("MACHINES.md", "machines", "machine-52271"),
    "RTX 6000": ("projects/rtx6000-workstation-build.md", "projects", "RTX 6000 build"),
    "RTX Pro 6000": ("projects/rtx6000-workstation-build.md", "projects", "RTX 6000 build"),
    "Schwab": ("TAXES.md", "taxes", "Schwab"),
    "Cenlar": ("BUSINESS.md", "business", "85 Stonebridge"),
    "Shellpoint": ("BUSINESS.md", "business", "85 Stonebridge"),
    "Leader Bank": ("BUSINESS.md", "business", "185 Davis"),
    "Delta Dental": ("FAMILY.md", "family", "insurance"),
    "Sante Total": ("business/sante-total.md", "business", "Sante Total"),
    "Chrome bridge": ("projects/chrome-bridge.md", "projects", "Chrome bridge"),
    "Chrome Bridge": ("projects/chrome-bridge.md", "projects", "Chrome bridge"),
    "CLAUDECODE": ("LEARNINGS.md", "learnings", "CLAUDECODE env var"),
    "MKA": ("FAMILY.md", "family", "MKA tuition"),
}


def extract_candidates(turn: UserTurn) -> list[FactCandidate]:
    """Apply all pattern families to a user turn. Returns a list of candidates.

    Recall-biased: same text may produce multiple candidates across different
    categories. Dedup happens downstream.
    """
    text = turn.text
    out: list[FactCandidate] = []

    # Fact 1: explicit price hike / set
    for m in PRICE_HIKE_RE.finditer(text):
        amount = m.group(2)
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 140),
            category="structured_update",
            subclass="rental_price",
            confidence=0.95,
            turn=turn,
            entity="machine-52271",
            suggested_target="MACHINES.md",
            suggested_operation="replace",
            suggested_field="gpu_rate",
            suggested_value=f"${amount}/hr",
            match_span=m.group(0),
        ))
    for m in PRICE_SET_RE.finditer(text):
        if PRICE_HIKE_RE.search(text):
            continue
        amount = m.group(1)
        if 0.05 <= float(amount) <= 5.0:
            out.append(FactCandidate(
                text=_window(text, m.start(), m.end(), 140),
                category="structured_update",
                subclass="rental_price",
                confidence=0.85,
                turn=turn,
                entity="machine-52271",
                suggested_target="MACHINES.md",
                suggested_operation="replace",
                suggested_field="gpu_rate",
                suggested_value=f"${amount}/hr",
                match_span=m.group(0),
            ))

    # Fact 2: dollar amounts with context
    for m in DOLLAR_RE.finditer(text):
        amt = m.group(0)
        # Skip if part of a price-hike that already matched
        if any(c.subclass == "rental_price" for c in out):
            continue
        ctx = _window(text, m.start(), m.end(), 100)
        out.append(FactCandidate(
            text=ctx,
            category="numeric",
            subclass="dollar_amount",
            confidence=0.7,
            turn=turn,
            suggested_target="inbox-only",
            suggested_operation="append",
            match_span=amt,
        ))

    # Fact 3: phone numbers
    for m in PHONE_RE.finditer(text):
        num = f"({m.group(1)}) {m.group(2)}-{m.group(3)}"
        ent = _nearest_name(text, m.start()) or ""
        target = "ALTON.md" if "alton" in ent.lower() else ("FAMILY.md" if ent else "ALTON.md")
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 80),
            category="numeric",
            subclass="phone",
            confidence=0.9,
            turn=turn,
            entity=ent,
            suggested_target=target,
            suggested_operation="replace",
            suggested_field="cell_phone",
            suggested_value=num,
            match_span=num,
        ))

    # Fact 4: dates of birth
    for m in DOB_RE.finditer(text):
        mo, d, century, yr = m.group(1), m.group(2), m.group(3), m.group(4)
        if int(mo) > 12 or int(d) > 31:
            continue
        full = f"{mo}/{d}/{century}{yr}"
        # DOB needs context — only count as DOB if nearby words include birthday|born|dob|birth
        around = _window(text, m.start(), m.end(), 120).lower()
        if not re.search(r"\b(birthday|born|dob|birth)\b", around):
            continue
        ent = _nearest_name(text, m.start()) or ""
        target = "ALTON.md" if "alton" in ent.lower() else "FAMILY.md"
        out.append(FactCandidate(
            text=around,
            category="structured_update",
            subclass="dob",
            confidence=0.9,
            turn=turn,
            entity=ent or "unknown-person",
            suggested_target=target,
            suggested_operation="replace",
            suggested_field="date_of_birth",
            suggested_value=full,
            match_span=full,
        ))

    # Fact 4b: short DOB (2-digit year: 9/20/84)
    if not any(c.subclass == "dob" for c in out):
        for m in DOB_SHORT_RE.finditer(text):
            mo, d, yr2 = m.group(1), m.group(2), m.group(3)
            if int(mo) > 12 or int(d) > 31:
                continue
            yr_int = int(yr2)
            century = "19" if yr_int >= 40 else "20"
            full = f"{mo}/{d}/{century}{yr2}"
            around = _window(text, m.start(), m.end(), 120).lower()
            if not re.search(r"\b(birthday|born|dob|birth|my\s+birthday)\b", around):
                continue
            ent = _nearest_name(text, m.start()) or ""
            target = "ALTON.md" if "alton" in ent.lower() else "FAMILY.md"
            out.append(FactCandidate(
                text=around,
                category="structured_update",
                subclass="dob",
                confidence=0.9,
                turn=turn,
                entity=ent or "unknown-person",
                suggested_target=target,
                suggested_operation="replace",
                suggested_field="date_of_birth",
                suggested_value=full,
                match_span=full,
            ))

    # Fact 5: save / remember verb
    for m in SAVE_VERB_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 180),
            category="save_verb",
            subclass="explicit_memorize",
            confidence=0.95,
            turn=turn,
            suggested_target="inbox-only",
            suggested_operation="append",
            match_span=m.group(0),
        ))

    # Fact 6: feedback — three classes
    for m in FEEDBACK_RULE_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 200),
            category="feedback_rule",
            subclass="rule",
            confidence=0.85,
            turn=turn,
            suggested_target="feedback/feedback_rule_{hash}.md",
            suggested_operation="append",
            match_span=m.group(0),
        ))
    for m in FEEDBACK_PERMISSION_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 200),
            category="feedback_permission",
            subclass="permission",
            confidence=0.9,
            turn=turn,
            suggested_target="feedback/feedback_permissions_{hash}.md",
            suggested_operation="append",
            match_span=m.group(0),
        ))
    for m in FEEDBACK_PREFERENCE_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 200),
            category="feedback_preference",
            subclass="preference",
            confidence=0.75,
            turn=turn,
            suggested_target="feedback/feedback_preferences_{hash}.md",
            suggested_operation="append",
            match_span=m.group(0),
        ))

    # Fact 7: imperative task batches (pay X, pick up Y)
    # Only attend if the sentence has 2+ imperative hits (Pattern 1)
    imperative_hits = list(IMPERATIVE_TASK_RE.finditer(text))
    if len(imperative_hits) >= 2:
        tasks = ", ".join(m.group(0) for m in imperative_hits[:5])
        out.append(FactCandidate(
            text=_window(text, imperative_hits[0].start(), imperative_hits[-1].end(), 240),
            category="imperative",
            subclass="task_batch",
            confidence=0.85,
            turn=turn,
            suggested_target="family/active-todos.md",
            suggested_operation="append",
            match_span=tasks,
        ))

    # Fact 8: diagnosis → structured update on a pet/person
    for m in DIAGNOSIS_RE.finditer(text):
        ent = _nearest_name(text, m.start(), window=80) or ""
        target = "FAMILY.md"
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 160),
            category="structured_update",
            subclass="health",
            confidence=0.9,
            turn=turn,
            entity=ent or "family-member",
            suggested_target=target,
            suggested_operation="replace",
            suggested_field="health",
            suggested_value=m.group(0).strip(),
            match_span=m.group(0),
        ))

    # Fact 9: WiFi / password
    if re.search(r"\b(wifi|wi-fi)\b", text, re.IGNORECASE):
        for m in WIFI_PW_RE.finditer(text):
            pw = m.group(1)
            if len(pw) < 4 or pw.lower() in ("password", "network", "wifi"):
                continue
            out.append(FactCandidate(
                text=_window(text, m.start(), m.end(), 120),
                category="numeric",
                subclass="wifi_password",
                confidence=0.9,
                turn=turn,
                entity="Verizon-WiFi",
                suggested_target="reference/network.md",
                suggested_operation="replace",
                suggested_field="wifi_password",
                suggested_value=pw,
                match_span=pw,
            ))

    # Fact 10: acquisition / M&A
    for m in ACQUISITION_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 200),
            category="proper_noun",
            subclass="acquisition",
            confidence=0.8,
            turn=turn,
            entity=f"{m.group(1)} → {m.group(2)}",
            suggested_target="ASTRAZENECA.md",
            suggested_operation="append",
            match_span=m.group(0),
        ))
    for m in ACQUISITION_ALT_RE.finditer(text):
        span = m.group(0)
        if any(c.subclass == "acquisition" for c in out):
            continue
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 200),
            category="proper_noun",
            subclass="acquisition",
            confidence=0.8,
            turn=turn,
            entity=f"{m.group(1)} → {m.group(2)}",
            suggested_target="ASTRAZENECA.md",
            suggested_operation="append",
            match_span=span,
        ))

    # Fact 11a: account suffix via looser pattern
    for m in ACCOUNT_SUFFIX_RE.finditer(text):
        suffix = m.group(1) or m.group(2) or (m.group(3) if m.lastindex >= 3 else "")
        if not suffix:
            continue
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 120),
            category="numeric",
            subclass="account_suffix",
            confidence=0.65,
            turn=turn,
            entity=f"account-{suffix}",
            suggested_target="TAXES.md",
            suggested_operation="append",
            match_span=suffix,
        ))

    # Fact 12: fleet expansion intent
    for m in FLEET_EXPAND_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 180),
            category="proper_noun",
            subclass="fleet_expansion",
            confidence=0.75,
            turn=turn,
            entity="Solar Inference fleet",
            suggested_target="business/rental-operations.md",
            suggested_operation="append",
            match_span=m.group(0),
        ))

    # Fact 13: options-trading decision
    for m in OPTIONS_DECISION_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 180),
            category="numeric",
            subclass="options_decision",
            confidence=0.7,
            turn=turn,
            entity="options-position",
            suggested_target="inbox-only",
            suggested_operation="append",
            match_span=m.group(0),
        ))

    # Fact 14: fiscal outlook / tax reform
    for m in FISCAL_OUTLOOK_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 200),
            category="numeric",
            subclass="fiscal_outlook",
            confidence=0.75,
            turn=turn,
            entity="2027 fiscal outlook",
            suggested_target="TAXES.md",
            suggested_operation="append",
            match_span=m.group(0),
        ))

    # Fact 15: portfolio file reference / theta analysis
    for m in PORTFOLIO_REF_RE.finditer(text):
        out.append(FactCandidate(
            text=_window(text, m.start(), m.end(), 140),
            category="proper_noun",
            subclass="portfolio_ref",
            confidence=0.7,
            turn=turn,
            entity="portfolio-snapshot",
            suggested_target="inbox-only",
            suggested_operation="append",
            match_span=m.group(0),
        ))

    # Fact 16: entity-trigger structured updates
    for trigger, (tgt, cat, entity) in ENTITY_TRIGGERS.items():
        if trigger.lower() in text.lower():
            idx = text.lower().find(trigger.lower())
            # Only produce candidate if the trigger has 40+ chars of context not already captured
            ctx = _window(text, idx, idx + len(trigger), 180)
            # Cheap filter: if the context barely has anything else, skip
            if len(ctx.strip()) < len(trigger) + 10:
                continue
            out.append(FactCandidate(
                text=ctx,
                category="proper_noun",
                subclass=f"entity_{trigger.replace(' ', '_').lower()}",
                confidence=0.7,
                turn=turn,
                entity=entity,
                suggested_target=tgt,
                suggested_operation="append",
                match_span=trigger,
            ))

    return out


def _window(text: str, start: int, end: int, radius: int) -> str:
    lo = max(0, start - radius)
    hi = min(len(text), end + radius)
    snippet = text[lo:hi].strip()
    return re.sub(r"\s+", " ", snippet)


def _nearest_name(text: str, pos: int, window: int = 120) -> str:
    """Return the nearest capitalized name-looking token within `window` chars."""
    lo = max(0, pos - window)
    hi = min(len(text), pos + window)
    chunk = text[lo:hi]
    m = re.findall(r"\b([A-Z][a-z]{2,15})\b", chunk)
    skip = {"The", "This", "That", "Here", "There", "Some", "Now", "Just", "Also", "When",
            "Just", "Like", "Pro", "Next", "Please", "Note", "Alton", "Aneeta"}
    # Prefer Alton/Aneeta explicitly when present
    for name in ("Alton", "Aneeta", "Vayu", "Vishala", "Vasu", "Loki", "Ghosty", "Pickle",
                 "Miguel", "Ilan"):
        if name in chunk:
            return name
    for name in m:
        if name not in skip:
            return name
    return ""


# ---------------------------------------------------------------------------
# Dedup against existing memory
# ---------------------------------------------------------------------------


_KEY_STRIP_RE = re.compile(
    r"^(?:has\s+|with\s+|a\s+|an\s+|the\s+|is\s+|are\s+|was\s+|were\s+|diagnosed\s+with\s+)+",
    re.IGNORECASE,
)


def _dedup_key(raw: str) -> str:
    return _KEY_STRIP_RE.sub("", raw.strip()).strip().lower()


def check_dedup(candidate: FactCandidate, memory_root: Path = MEMORY_ROOT) -> str:
    """Return one of: "new", "already_landed", "partial_update_proposed".

    Cheap grep of the key phrase across memory. A hit in a canonical hub = already_landed.
    A hit only in daily/ or active-todos = partial_update_proposed (the miner's "PARTIAL"
    bucket). Near-miss (entity found but value differs) = partial_update_proposed.
    """
    key = candidate.match_span.strip()
    if not key or len(key) < 3:
        return "new"
    key_lower = _dedup_key(key)
    if not memory_root.exists():
        return "new"

    hits_canonical = False
    hits_partial = False
    for md in memory_root.rglob("*.md"):
        rel_parts = md.relative_to(memory_root).parts
        if any(p.startswith((".", "_", "inbox")) for p in rel_parts):
            continue
        # Exclude meta-documentation about the memory system itself. The
        # conversation-loss catalog, master plan, ethnography, etc. all live
        # under `projects/memory-system-v2/` and describe *what's lost* — a
        # dedup grep there would false-positive every LOST entry.
        if rel_parts[:2] == ("projects", "memory-system-v2"):
            continue
        if rel_parts[:1] == ("reviews",):
            continue
        try:
            content = md.read_text(encoding="utf-8", errors="replace").lower()
        except OSError:
            continue
        if key_lower in content:
            if "daily" in rel_parts or "active-todos" in md.name.lower() or "snapshots" in rel_parts:
                hits_partial = True
            else:
                hits_canonical = True
                break

    # Structured-field updates: even if the key phrase appears, a changed value
    # is a partial update. If the value is present, it's already landed.
    if candidate.category == "structured_update" and candidate.suggested_field:
        tgt_content = _read_target(candidate, memory_root)
        val_key = _dedup_key(candidate.suggested_value or "")
        val_present = bool(val_key and val_key in tgt_content)
        if hits_canonical:
            if val_present:
                return "already_landed"
            return "partial_update_proposed" if candidate.suggested_value else "already_landed"
        if hits_partial:
            return "partial_update_proposed"
        return "new"

    if hits_canonical:
        return "already_landed"
    if hits_partial:
        return "partial_update_proposed"
    return "new"


def _read_target(candidate: FactCandidate, memory_root: Path = MEMORY_ROOT) -> str:
    target = candidate.suggested_target
    if not target or target == "inbox-only":
        return ""
    path = memory_root / target
    try:
        return path.read_text(encoding="utf-8", errors="replace").lower()
    except OSError:
        return ""


# ---------------------------------------------------------------------------
# Inbox proposal writer
# ---------------------------------------------------------------------------


def write_proposal(
    candidate: FactCandidate,
    status: str,
    out_root: Path = PROPOSED_ROOT,
    dry_run: bool = False,
) -> Path:
    now = datetime.now(timezone.utc)
    day_dir = out_root / now.date().isoformat()
    fp = candidate.fingerprint()
    batch_id = f"ce-{int(now.timestamp())}-{fp}"
    path = day_dir / f"{batch_id}.md"

    fm = {
        "id": batch_id,
        "origin": "rocinante",
        "author": EXTRACTOR_NAME,
        "created": now.isoformat(timespec="seconds"),
        "target": candidate.suggested_target,
        "operation": candidate.suggested_operation,
        "priority": "p2",
        "type": "event",
        "category": "proposed_memory",
        "source": "rocinante-extractor",
        "entity": candidate.entity or "",
        "confidence": round(candidate.confidence, 2),
        "extractor_class": candidate.category,
        "extractor_subclass": candidate.subclass,
        "dedup_status": status,
        "session_id": candidate.turn.session_id,
        "turn_id": candidate.turn.turn_id,
        "turn_timestamp": candidate.turn.timestamp,
    }
    if candidate.suggested_field:
        fm["field"] = candidate.suggested_field
    if candidate.suggested_value:
        fm["value"] = candidate.suggested_value

    body_lines = [
        f"# Proposed memory: {candidate.subclass}",
        "",
        f"- **Category:** `{candidate.category}` / `{candidate.subclass}`",
        f"- **Confidence:** {candidate.confidence:.2f}",
        f"- **Dedup status:** `{status}`",
        f"- **Suggested target:** `{candidate.suggested_target}`",
        f"- **Suggested operation:** `{candidate.suggested_operation}`",
    ]
    if candidate.suggested_field:
        body_lines.append(f"- **Field:** `{candidate.suggested_field}` → `{candidate.suggested_value}`")
    if candidate.entity:
        body_lines.append(f"- **Entity:** `{candidate.entity}`")
    body_lines += [
        "",
        "## Source quote",
        "",
        "> " + candidate.text.replace("\n", " ").strip()[:600],
        "",
        "## Match span",
        "",
        f"`{candidate.match_span[:200]}`",
        "",
        "## Session reference",
        "",
        f"- **session_id:** `{candidate.turn.session_id}`",
        f"- **turn_timestamp:** `{candidate.turn.timestamp}`",
        f"- **source_file:** `{candidate.turn.source_file.name}`",
        "",
        "## Proposed edit",
        "",
    ]
    if candidate.suggested_operation == "replace" and candidate.suggested_field:
        body_lines.append(
            f"Replace field `{candidate.suggested_field}` on entity `{candidate.entity}` "
            f"in `{candidate.suggested_target}` with value `{candidate.suggested_value}`."
        )
    elif candidate.suggested_operation == "append":
        body_lines.append(
            f"Append this fact to `{candidate.suggested_target}` under the section "
            f"relevant to `{candidate.entity or 'the matched entity'}`."
        )
    else:
        body_lines.append(f"Operation `{candidate.suggested_operation}` on `{candidate.suggested_target}`.")

    yaml_lines = ["---"]
    for k, v in fm.items():
        if v == "" or v is None:
            continue
        yaml_lines.append(f"{k}: {_yaml_scalar(v)}")
    yaml_lines.append("---")
    content = "\n".join(yaml_lines) + "\n\n" + "\n".join(body_lines) + "\n"

    if dry_run:
        return path

    day_dir.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path


def _yaml_scalar(v) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v)
    if any(ch in s for ch in ":#\n'\"[]{}") or s.strip() != s:
        return json.dumps(s)
    return s


# ---------------------------------------------------------------------------
# Run log
# ---------------------------------------------------------------------------


def append_run_log(stats: ExtractStats, dry_run: bool) -> None:
    line = {
        "timestamp": stats.started_at.isoformat(timespec="seconds"),
        "sessions_scanned": stats.sessions_scanned,
        "sessions_skipped_small": stats.sessions_skipped_small,
        "turns_scanned": stats.turns_scanned,
        "candidates_found": stats.candidates_found,
        "proposals_written": stats.proposals_written,
        "dropped_over_cap": stats.dropped_over_cap,
        "dedup_already_landed": stats.dedup_already_landed,
        "dedup_partial": stats.dedup_partial,
        "by_class": dict(stats.candidates_by_class),
        "runtime_ms": stats.runtime_ms,
        "dry_run": dry_run,
        "extractor_version": EXTRACTOR_VERSION,
    }
    if dry_run:
        return
    META_DIR.mkdir(parents=True, exist_ok=True)
    if not EXTRACTOR_LOG.exists():
        EXTRACTOR_LOG.touch()
    with EXTRACTOR_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line) + "\n")


# ---------------------------------------------------------------------------
# Main run pass
# ---------------------------------------------------------------------------


def run(
    *,
    since: datetime | None = None,
    cap: int = DEFAULT_CAP,
    dry_run: bool = False,
    verbose: bool = False,
    session_roots: list[Path] | None = None,
    out_root: Path = PROPOSED_ROOT,
    memory_root: Path = MEMORY_ROOT,
) -> ExtractStats:
    t0 = time.monotonic()
    stats = ExtractStats()

    if since is None:
        since = datetime.now(timezone.utc) - timedelta(days=1)

    sessions = discover_sessions(since, session_roots)
    stats.sessions_scanned = len(sessions)
    if verbose:
        print(f"[extract] {len(sessions)} sessions modified since {since.isoformat()}", file=sys.stderr)

    all_candidates: list[FactCandidate] = []
    seen_fingerprints: set[str] = set()
    for path in sessions:
        try:
            for turn in iter_user_turns(path):
                stats.turns_scanned += 1
                cands = extract_candidates(turn)
                for c in cands:
                    fp = c.fingerprint()
                    if fp in seen_fingerprints:
                        continue
                    seen_fingerprints.add(fp)
                    all_candidates.append(c)
                    stats.candidates_by_class[c.category] += 1
        except Exception as exc:
            stats.errors.append(f"{path.name}: {exc}")
            if verbose:
                traceback.print_exc(file=sys.stderr)

    stats.candidates_found = len(all_candidates)
    if verbose:
        print(f"[extract] {stats.candidates_found} unique candidates", file=sys.stderr)

    # Sort by (confidence desc, then category priority) before capping
    CLASS_PRIORITY = {
        "save_verb": 0,
        "structured_update": 1,
        "feedback_permission": 2,
        "feedback_rule": 3,
        "feedback_preference": 4,
        "numeric": 5,
        "imperative": 6,
        "proper_noun": 7,
    }
    all_candidates.sort(key=lambda c: (CLASS_PRIORITY.get(c.category, 9), -c.confidence))

    written = 0
    for c in all_candidates:
        if written >= cap:
            stats.dropped_over_cap += 1
            continue
        status = check_dedup(c, memory_root)
        if status == "already_landed":
            stats.dedup_already_landed += 1
            # Still write a lightweight no-op proposal so curator can verify / log.
            # But count it toward the cap.
        elif status == "partial_update_proposed":
            stats.dedup_partial += 1
        try:
            p = write_proposal(c, status, out_root=out_root, dry_run=dry_run)
            stats.proposals_paths.append(p)
            stats.proposals_written += 1
            written += 1
            if verbose:
                marker = "[DRY] " if dry_run else ""
                print(f"{marker}{c.category}/{c.subclass} ({status}) -> {p.name}", file=sys.stderr)
        except Exception as exc:
            stats.errors.append(f"write {c.subclass}: {exc}")
            if verbose:
                traceback.print_exc(file=sys.stderr)

    stats.runtime_ms = int((time.monotonic() - t0) * 1000)
    append_run_log(stats, dry_run)
    return stats


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="conversation_extract",
        description="Extract fact candidates from Claude Code session JSONLs.",
    )
    p.add_argument("--since", default=None, help="ISO date. Default: 24h ago.")
    p.add_argument("--cap", type=int, default=DEFAULT_CAP, help="Max proposals per run (default 20).")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("-v", "--verbose", action="store_true")
    return p


def _parse_since(s: str | None) -> datetime:
    if not s:
        return datetime.now(timezone.utc) - timedelta(days=1)
    # accept YYYY-MM-DD or ISO
    try:
        if len(s) == 10:
            return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        raise SystemExit(f"invalid --since: {s}")


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    since = _parse_since(args.since)
    try:
        stats = run(
            since=since,
            cap=args.cap,
            dry_run=args.dry_run,
            verbose=args.verbose,
        )
    except Exception as exc:
        print(f"conversation_extract: fatal: {exc}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return 1

    summary = {
        "sessions_scanned": stats.sessions_scanned,
        "turns_scanned": stats.turns_scanned,
        "candidates_found": stats.candidates_found,
        "proposals_written": stats.proposals_written,
        "dropped_over_cap": stats.dropped_over_cap,
        "dedup_already_landed": stats.dedup_already_landed,
        "dedup_partial": stats.dedup_partial,
        "by_class": dict(stats.candidates_by_class),
        "runtime_ms": stats.runtime_ms,
        "dry_run": args.dry_run,
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
