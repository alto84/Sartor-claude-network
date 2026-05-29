#!/usr/bin/env python3
"""hours-log-extract.py — nightly cron to extract Solar Inference LLC material-participation
hours from Claude Code session jsonls, for IRC §469 substantiation.

§469 RATIONALE (why human_interactive_hours is the tax-defensible figure)
------------------------------------------------------------------------
The material-participation tests of Treas. Reg. §1.469-5T require ALTON's OWN
participation — his personal, regular, continuous, substantial involvement. An
autonomous agent acting on its own (a scheduled-task fire, a peer-machine Claude
running unattended, a subagent spawned to research a sub-question) is NOT Alton's
participation and must not be counted toward the 100/500-hour tests.

The original v0 of this script classified sessions purely by `cwd` and summed the
active-typing intervals of EVERY session under ~/.claude/projects, including:
  - subagent traces (isSidechain == true),
  - peer-machine Claude sessions mirrored onto Rocinante by the "Sartor Peer
    Sessions Mirror" scheduled task (rtxserver / gpuserver1 auto-spawns & wake-ups),
  - scheduled-task / `claude -p` programmatic runs that fire on a cron with no human
    at the keyboard.
The smoking gun was a run of CSV rows spanning exactly 07:30:01 -> 23:30:01 EDT
(scheduled-task fire window) with little or no interactive content — bot activity
booked as Alton's participation hours. That is precisely the kind of inflation an
IRS examiner would disallow, and worse, it would taint the credibility of the
defensible hours too.

THE FIX: a new column `human_interactive_hours` computed over ONLY the surviving
human-interactive solar_inference sessions, after three exclusion layers:
  1. Drop sidechain events (isSidechain == true) — subagent traces, never Alton.
  2. Drop peer-mirrored sessions — session-ids listed in the peer mirror's
     `.peer-manifest.json` are rtxserver/gpuserver1 Claude conversations, not Alton.
  3. Drop automated/scheduled-origin sessions — require at least one GENUINE
     human-typed free-text user message in the session (see is_human_text()).
     A session whose user-turns are all synthetic tool-results, slash-command
     payloads, system-reminders, hook output, or programmatic SDK prompts is bot
     activity and contributes zero human hours.
`human_interactive_hours` is the figure to hand the CPA / defend in an audit.

SCHEMA / BACKWARD COMPATIBILITY
-------------------------------
The CSV schema is preserved for downstream consumers. The legacy columns
(solar_inference_hours, general_sartor_hours, total_active_hours, session_count,
first_msg_local, last_msg_local) are computed exactly as before, over ALL sessions
(unfiltered), so existing readers see identical continuity. ONE new column is
appended at the right end — `human_interactive_hours` — per the design doc's
"add columns at the right end only; old readers ignore unknown trailing columns"
rule. New column order:

    date,solar_inference_hours,general_sartor_hours,total_active_hours,
    session_count,first_msg_local,last_msg_local,human_interactive_hours

PRESERVED-GOOD methodology (unchanged from v0):
  - Walk ~/.claude/projects/**/*.jsonl, idempotent re-read + re-write.
  - Gaps under THRESHOLD (30 min) count as ACTIVE time toward the earlier message's
    day; gaps >= 30 min split sessions (operator stepped away).
  - UNION of intervals across concurrent sessions — parallel subagents / overlapping
    sessions don't double-count wall time (the May-2 "$13K-burn" fanout was 9.32h
    actual, not 80h).
  - Sub-intervals split at local-TZ midnight so each lands wholly in one date.

TWO additional correctness fixes that fell out of this work:
  - File-type guard (_is_session_line): rglob('*.jsonl') also matched NON-session files
    under the projects tree — memory-pipeline logs at .meta/curator-log.jsonl and
    extractor-log.jsonl (which append at the curator/extractor cron times 07:30 / 23:30 ET)
    plus research probe/corpus artifacts and subagent workflow journals. Those .meta logs
    were the TRUE source of the 07:30:01->23:30:01 first/last_msg bounds. We now skip any
    .jsonl that has no genuine session-transcript line.
  - Merge-preservation (load_existing_rows): Claude Code rotates transcripts, so current
    data only reaches back ~7 weeks. A naive full clobber would erase the Jan-Mar §469
    history (which the design doc says is unbackfillable). We recompute every date the scan
    covers (idempotent for the live window) and PRESERVE prior rows for older dates, with a
    BLANK human_interactive_hours for those (it cannot be recomputed — we never fabricate).

Idempotent: re-running over the same frozen data produces the same output (only the open,
still-growing current day changes between runs). Safe nightly.
"""
import csv
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from collections import defaultdict

# Configuration
SESSIONS_DIR = Path.home() / ".claude" / "projects"
# Peer-mirror manifest: maps mirrored session-id -> origin peer (rtxserver/gpuserver1).
# Written by the "Sartor Peer Sessions Mirror" scheduled task (CLAUDE.md). The mirrored
# .jsonl files live in the SAME projects dir as Alton's own, so without this we'd count
# peer-machine Claude time as Alton's. NOTE: the file carries a UTF-8 BOM — read utf-8-sig.
PEER_MANIFEST = (
    Path.home() / ".claude" / "projects"
    / "C--Users-alto8-Sartor-claude-network" / ".peer-manifest.json"
)
OUT_CSV = Path(r"C:\Users\alto8\Sartor-claude-network\sartor\memory\business\hours-log\all-hours.csv")
TZ_OFFSET = timezone(timedelta(hours=-4), name="EDT")  # bucket dates by EDT
THRESHOLD = timedelta(minutes=30)
LOG_FILE = Path(r"C:\Users\alto8\backups\hours-log.log")

# Automated / non-human user-message markers. A user-role message whose string content
# starts with one of these wrappers is NOT Alton typing free text — it is a slash-command
# payload, the caveat banner Claude Code injects around local commands, a system reminder,
# tool/hook/bash output replayed as a user turn, or a sub-task notification.
_AUTO_PREFIX_RE = re.compile(
    r"^\s*<(?:local-command-caveat|command-name|command-message|command-args"
    r"|system-reminder|bash-stdout|bash-stderr|bash-input"
    r"|task-notification|user-prompt-submit-hook|user-memory-input"
    r"|post-tool-use-hook|pre-tool-use-hook)\b",
    re.IGNORECASE,
)
# Programmatic SDK prompts that show up via `claude -p` automation (skill-evolution
# scoring, research-nightly-cron). These are bot-issued, not Alton-typed.
_AUTO_CONTENT_PREFIXES = (
    "You are scoring a language model",
    "Wake-up from Rocinante",          # peer relay wake-ups (belt-and-suspenders w/ manifest)
    "[Request interrupted",
)


def log(msg: str):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        f.write(f"{ts} {msg}\n")


def load_peer_session_ids() -> set:
    """Return the set of session-ids the peer-mirror brought in from rtxserver/gpuserver1.

    Defensive: missing file, bad JSON, or BOM all degrade gracefully to an empty set
    (i.e. no peer exclusion) rather than crashing the nightly run."""
    if not PEER_MANIFEST.exists():
        log(f"peer manifest missing: {PEER_MANIFEST} (no peer exclusion this run)")
        return set()
    try:
        # utf-8-sig tolerates the BOM the mirror script writes.
        data = json.loads(PEER_MANIFEST.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as e:
        log(f"peer manifest unreadable ({type(e).__name__}); no peer exclusion this run")
        return set()
    if isinstance(data, dict):
        return set(data.keys())
    return set()


CSV_HEADER = [
    "date",
    "solar_inference_hours",
    "general_sartor_hours",
    "total_active_hours",
    "session_count",
    "first_msg_local",
    "last_msg_local",
    "human_interactive_hours",  # NEW: §469 tax-defensible figure (human-only solar)
]


def load_existing_rows() -> dict:
    """Return {date: row_list} from the existing CSV, so historical dates whose source
    .jsonl files have since been rotated out of ~/.claude/projects are PRESERVED rather
    than silently erased by the full re-write.

    Why this matters: Claude Code rotates session transcripts; current data only reaches
    back ~7 weeks. The CSV is the §469 RECORD (per system-design-2026-05-02.md, pre-window
    rows cannot be backfilled). A naive clobber would destroy the Jan-Mar history. We keep
    full-rewrite idempotency for the LIVE window and merge-protect older dates.

    Rows are normalized to the current 8-column schema; a legacy 7-column row gets an empty
    human_interactive_hours (it cannot be recomputed without the rotated-out transcripts —
    we write blank, not a fabricated number)."""
    if not OUT_CSV.exists():
        return {}
    out = {}
    try:
        with open(OUT_CSV, "r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or row[0] in ("date", ""):
                    continue
                # Pad/truncate to schema width; legacy 7-col rows get blank human col.
                r = list(row)
                while len(r) < len(CSV_HEADER):
                    r.append("")
                out[r[0]] = r[: len(CSV_HEADER)]
    except OSError:
        return {}
    return out


def is_human_text(content) -> bool:
    """True iff this user-message content is genuine human-typed free text.

    Heuristic (documented for §469 defensibility): the content must be a non-empty
    string that is NOT one of the automated wrappers (slash-command payload, local-
    command caveat banner, system-reminder, hook/bash/tool output replayed as a user
    turn, sub-task notification) and NOT a known programmatic SDK prompt. List-content
    user turns are synthetic tool_result carriers — never human free text — so they
    return False. Conservative by design: when in doubt we DON'T count it, which is the
    safe direction for a tax record (defend a smaller, real number)."""
    if not isinstance(content, str):
        return False
    t = content.strip()
    if not t:
        return False
    if _AUTO_PREFIX_RE.match(t):
        return False
    if any(t.startswith(p) for p in _AUTO_CONTENT_PREFIXES):
        return False
    return True


_SESSION_EVENT_TYPES = {"user", "assistant", "system", "summary", "permission-mode"}


def _is_session_line(obj: dict) -> bool:
    """A genuine Claude Code session transcript line carries a sessionId, or is one of
    the recognized session event types. Non-session .jsonl files under the projects tree
    (memory-pipeline logs at .meta/*-log.jsonl, research probe/corpus artifacts, peer-send
    logs, subagent workflow journals) have neither — they just happen to share the .jsonl
    extension and a `timestamp` field. The original rglob('*.jsonl') swept those in, and
    the .meta logs (which append at 07:30 / 23:30 ET, the curator/extractor cron times)
    were what set the bogus 07:30:01->23:30:01 first/last_msg bounds. Guard against them."""
    return bool(obj.get("sessionId")) or obj.get("type") in _SESSION_EVENT_TYPES


def parse_session(jsonl_path: Path):
    """Parse one session file. Returns (items, has_human).

    items: list of (timestamp, cwd) for NON-sidechain message lines — the time
           substrate. (Sidechain lines are dropped here so subagent traces never
           contribute intervals, matching the existing union-of-intervals model.)
    has_human: True if the session contains >=1 genuine human-typed free-text user
           message (used to drop automated/scheduled-origin sessions for the human col).
    A file that contains NO session-shaped lines (a .meta log, a research artifact, a
    workflow journal) is treated as not-a-session and yields ([], False) — it contributes
    nothing to intervals, bounds, or session_count. Malformed lines are skipped, never fatal."""
    items = []
    has_human = False
    looks_like_session = False
    try:
        with open(jsonl_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                # File-type guard: only count lines from genuine session transcripts.
                if not _is_session_line(obj):
                    continue
                looks_like_session = True
                # Exclusion layer 1: drop subagent (sidechain) events entirely.
                if obj.get("isSidechain"):
                    continue
                # Genuine-human detection (exclusion layer 3 input).
                if obj.get("type") == "user" and not has_human:
                    msg = obj.get("message")
                    if isinstance(msg, dict) and msg.get("role") == "user":
                        if is_human_text(msg.get("content")):
                            has_human = True
                ts_s = obj.get("timestamp")
                if not ts_s:
                    continue
                try:
                    ts = datetime.fromisoformat(ts_s.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    continue
                cwd = obj.get("cwd") or ""
                items.append((ts, cwd))
    except OSError:
        return [], False
    if not looks_like_session:
        return [], False
    return items, has_human


def classify_cwd(cwd: str) -> str:
    if not cwd:
        return "general_sartor"
    cwd_l = cwd.lower()
    if "sartor-claude-network" in cwd_l:
        return "solar_inference"
    return "general_sartor"


def session_active_intervals(timestamps_with_cwd):
    """Walk sorted message timestamps. Yield (start_ts, end_ts, category) tuples
    for each pairwise gap that's under THRESHOLD. Long gaps split sessions into
    separate intervals."""
    items = sorted(timestamps_with_cwd, key=lambda x: x[0])
    for i in range(len(items) - 1):
        ts_a, cwd_a = items[i]
        ts_b, _ = items[i + 1]
        gap = ts_b - ts_a
        if gap >= THRESHOLD:
            continue
        category = classify_cwd(cwd_a)
        yield (ts_a, ts_b, category)


def merge_intervals(intervals):
    """intervals: list of (start_ts, end_ts). Returns list of non-overlapping merged intervals."""
    if not intervals:
        return []
    sorted_iv = sorted(intervals, key=lambda x: x[0])
    merged = [sorted_iv[0]]
    for start, end in sorted_iv[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:
            # overlap — extend the last interval
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))
    return merged


def split_interval_at_midnight(start_ts, end_ts):
    """Yield sub-intervals split at local-TZ midnight boundaries.
    Each sub-interval is wholly within one local date."""
    cur = start_ts
    while cur < end_ts:
        local = cur.astimezone(TZ_OFFSET)
        # Next midnight in local TZ
        next_midnight_local = (local + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        next_midnight_utc = next_midnight_local.astimezone(timezone.utc)
        sub_end = min(end_ts, next_midnight_utc)
        yield (cur, sub_end, local.date().isoformat())
        cur = sub_end


def main():
    if not SESSIONS_DIR.exists():
        log(f"sessions dir missing: {SESSIONS_DIR}")
        sys.exit(1)

    peer_ids = load_peer_session_ids()

    # Per-date interval lists (split at midnight, classified).
    # Legacy categories (unfiltered, for schema continuity) + a human-only solar bucket.
    #   day_intervals[date] = {
    #     "solar_inference": [...], "general_sartor": [...], "all": [...],   # legacy
    #     "human_solar": [...],                                             # §469 figure
    #   }
    day_intervals = defaultdict(lambda: {
        "solar_inference": [], "general_sartor": [], "all": [], "human_solar": [],
    })
    day_sessions = defaultdict(set)
    day_bounds = {}  # date -> (first_ts, last_ts) in local TZ

    jsonl_files = list(SESSIONS_DIR.rglob("*.jsonl"))
    log(f"scanning {len(jsonl_files)} session files; {len(peer_ids)} peer sessions in manifest")

    n_human_sessions = 0
    n_peer_dropped = 0
    n_auto_dropped = 0

    for f in jsonl_files:
        sid = f.stem
        items, has_human = parse_session(f)
        if not items:
            continue

        # Exclusion layers 2 & 3 for the HUMAN column: peer-mirrored OR no human text.
        is_peer = sid in peer_ids
        human_eligible = (not is_peer) and has_human
        if is_peer:
            n_peer_dropped += 1
        elif not has_human:
            n_auto_dropped += 1
        else:
            n_human_sessions += 1

        # Build raw intervals with category.
        for start_ts, end_ts, category in session_active_intervals(items):
            for sub_start, sub_end, date_local in split_interval_at_midnight(start_ts, end_ts):
                # Legacy buckets — ALL sessions, unchanged behavior (schema continuity).
                day_intervals[date_local][category].append((sub_start, sub_end))
                day_intervals[date_local]["all"].append((sub_start, sub_end))
                day_sessions[date_local].add(sid)
                # Human-only solar bucket — surviving human-interactive solar sessions.
                if human_eligible and category == "solar_inference":
                    day_intervals[date_local]["human_solar"].append((sub_start, sub_end))

        # Track first/last per local-date for the bounds column (legacy: ALL sessions).
        for ts, _ in items:
            local = ts.astimezone(TZ_OFFSET)
            d = local.date().isoformat()
            if d not in day_bounds:
                day_bounds[d] = (local, local)
            else:
                lo, hi = day_bounds[d]
                if local < lo: lo = local
                if local > hi: hi = local
                day_bounds[d] = (lo, hi)

    # Compute merged-interval-union seconds per (date, category).
    def total_seconds(intervals):
        merged = merge_intervals(intervals)
        return sum((e - s).total_seconds() for s, e in merged)

    day_seconds = {}
    for d, cat_map in day_intervals.items():
        for cat in ("solar_inference", "general_sartor", "all", "human_solar"):
            day_seconds[(d, cat)] = total_seconds(cat_map[cat])

    scanned_dates = set(d for (d, _) in day_seconds.keys()) | set(day_bounds.keys())

    # Merge with existing CSV: freshly recompute every date the current scan covers
    # (idempotent for the live window); PRESERVE rows for older dates whose source .jsonl
    # files have rotated out of ~/.claude/projects (the §469 historical record).
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    existing = load_existing_rows()

    computed_rows = {}
    total_si = 0.0
    total_gs = 0.0
    total_all = 0.0
    total_human = 0.0
    for d in sorted(scanned_dates):
        si = day_seconds.get((d, "solar_inference"), 0.0) / 3600.0
        gs = day_seconds.get((d, "general_sartor"), 0.0) / 3600.0
        # total_active is the UNION across categories — accurate keyboard time
        all_h = day_seconds.get((d, "all"), 0.0) / 3600.0
        human_h = day_seconds.get((d, "human_solar"), 0.0) / 3600.0
        n_sess = len(day_sessions.get(d, set()))
        bounds = day_bounds.get(d)
        first_s = bounds[0].strftime("%H:%M:%S") if bounds else ""
        last_s = bounds[1].strftime("%H:%M:%S") if bounds else ""
        computed_rows[d] = [
            d,
            f"{si:.2f}",
            f"{gs:.2f}",
            f"{all_h:.2f}",
            str(n_sess),
            first_s,
            last_s,
            f"{human_h:.2f}",
        ]
        total_si += si
        total_gs += gs
        total_all += all_h
        total_human += human_h

    # Preserved historical rows: dates in the prior CSV that the current scan can't see.
    preserved = {d: r for d, r in existing.items() if d not in scanned_dates}
    n_preserved = len(preserved)

    all_dates = sorted(set(computed_rows) | set(preserved))
    rows_out = [CSV_HEADER]
    for d in all_dates:
        rows_out.append(computed_rows.get(d) or preserved[d])

    with open(OUT_CSV, "w", encoding="utf-8", newline="") as out:
        w = csv.writer(out)
        w.writerows(rows_out)

    log(f"wrote {len(rows_out) - 1} day-rows to {OUT_CSV} "
        f"({len(computed_rows)} recomputed, {n_preserved} preserved-historical)")
    log(f"sessions: {n_human_sessions} human-interactive, {n_peer_dropped} peer-dropped, "
        f"{n_auto_dropped} automated-dropped")
    log(f"totals: solar_inference={total_si:.1f}h, general_sartor={total_gs:.1f}h, "
        f"total_active={total_all:.1f}h, human_interactive={total_human:.1f}h")
    print(f"hours-log: {len(rows_out) - 1} days | {total_si:.1f}h solar (all), "
          f"{total_all:.1f}h total active (union) | {total_human:.1f}h HUMAN-interactive solar (§469) | "
          f"dropped {n_peer_dropped} peer + {n_auto_dropped} automated sessions")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"ERR: {type(e).__name__}: {e}")
        raise
