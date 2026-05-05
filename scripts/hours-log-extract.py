#!/usr/bin/env python3
"""hours-log-extract.py — nightly cron to extract Solar Inference LLC material-participation hours
from Claude Code session jsonls.

Methodology (CPA-defensible):
  - Walk ~/.claude/projects/**/*.jsonl
  - For each message-pair within a session, compute the gap.
  - Gaps under THRESHOLD_MIN (30 min) count as ACTIVE time toward the day of the
    earlier message. Gaps >= 30 min are treated as paused (operator stepped away).
  - Aggregate active time per calendar date (in TZ_OFFSET below) and per session-cwd.
  - Append/update daily rows in sartor/memory/business/hours-log/all-hours.csv.

This is "active typing time across substantive sessions" — not "wall-clock duration".
A long-running session with a 2-hour gap mid-stream contributes only the active intervals.

Classification (v0 — refine later):
  - cwd contains "Sartor-claude-network" → "solar_inference" (LLC infrastructure work)
  - any other cwd                        → "general_sartor"  (admin work; may or may not be LLC)

Idempotent: re-running over the same data produces the same output. Safe to run nightly.
"""
import csv
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from collections import defaultdict

# Configuration
SESSIONS_DIR = Path.home() / ".claude" / "projects"
OUT_CSV = Path(r"C:\Users\alto8\Sartor-claude-network\sartor\memory\business\hours-log\all-hours.csv")
TZ_OFFSET = timezone(timedelta(hours=-4), name="EDT")  # bucket dates by EDT
THRESHOLD = timedelta(minutes=30)
LOG_FILE = Path(r"C:\Users\alto8\backups\hours-log.log")


def log(msg: str):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        f.write(f"{ts} {msg}\n")


def parse_session(jsonl_path: Path):
    """Yield (timestamp, cwd) for each message line. Skip malformed."""
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
                ts_s = obj.get("timestamp")
                if not ts_s:
                    continue
                try:
                    ts = datetime.fromisoformat(ts_s.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    continue
                cwd = obj.get("cwd") or ""
                yield (ts, cwd)
    except OSError:
        return


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

    # Per-date interval lists (split at midnight, classified)
    # day_intervals[date] = {"solar_inference": [(start, end), ...], "general_sartor": [...], "all": [...]}
    day_intervals = defaultdict(lambda: {"solar_inference": [], "general_sartor": [], "all": []})
    day_sessions = defaultdict(set)
    day_bounds = {}  # date -> (first_ts, last_ts) in local TZ

    jsonl_files = list(SESSIONS_DIR.rglob("*.jsonl"))
    log(f"scanning {len(jsonl_files)} session files")

    for f in jsonl_files:
        sid = f.stem
        items = list(parse_session(f))
        if not items:
            continue
        # Build raw intervals with category
        for start_ts, end_ts, category in session_active_intervals(items):
            # Split at midnight so each sub-interval is wholly within one local date
            for sub_start, sub_end, date_local in split_interval_at_midnight(start_ts, end_ts):
                day_intervals[date_local][category].append((sub_start, sub_end))
                day_intervals[date_local]["all"].append((sub_start, sub_end))
                day_sessions[date_local].add(sid)
        # Track first/last per local-date for the bounds column
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

    # Compute merged-interval-union seconds per (date, category)
    def total_seconds(intervals):
        merged = merge_intervals(intervals)
        return sum((e - s).total_seconds() for s, e in merged)

    day_seconds = {}
    for d, cat_map in day_intervals.items():
        for cat in ("solar_inference", "general_sartor", "all"):
            day_seconds[(d, cat)] = total_seconds(cat_map[cat])

    all_dates = sorted(set(d for (d, _) in day_seconds.keys()) | set(day_bounds.keys()))

    # Existing CSV — read, then re-write fully (idempotent)
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    rows_out = []
    rows_out.append([
        "date",
        "solar_inference_hours",
        "general_sartor_hours",
        "total_active_hours",
        "session_count",
        "first_msg_local",
        "last_msg_local",
    ])
    total_si = 0.0
    total_gs = 0.0
    total_all = 0.0
    for d in all_dates:
        si = day_seconds.get((d, "solar_inference"), 0.0) / 3600.0
        gs = day_seconds.get((d, "general_sartor"), 0.0) / 3600.0
        # total_active is the UNION across categories — accurate keyboard time
        all_h = day_seconds.get((d, "all"), 0.0) / 3600.0
        n_sess = len(day_sessions.get(d, set()))
        bounds = day_bounds.get(d)
        first_s = bounds[0].strftime("%H:%M:%S") if bounds else ""
        last_s = bounds[1].strftime("%H:%M:%S") if bounds else ""
        rows_out.append([
            d,
            f"{si:.2f}",
            f"{gs:.2f}",
            f"{all_h:.2f}",
            str(n_sess),
            first_s,
            last_s,
        ])
        total_si += si
        total_gs += gs
        total_all += all_h

    with open(OUT_CSV, "w", encoding="utf-8", newline="") as out:
        w = csv.writer(out)
        w.writerows(rows_out)

    log(f"wrote {len(rows_out) - 1} day-rows to {OUT_CSV}")
    log(f"totals: solar_inference={total_si:.1f}h, general_sartor={total_gs:.1f}h, total_active={total_all:.1f}h")
    print(f"hours-log: {len(rows_out) - 1} days, {total_si:.1f}h Solar Inference, {total_gs:.1f}h general, {total_all:.1f}h total active (union)")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"ERR: {type(e).__name__}: {e}")
        raise
