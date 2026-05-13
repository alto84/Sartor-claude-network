#!/usr/bin/env python3
"""
research-dashboard-gen.py — emit sartor/memory/research/dashboard.html

Reads:
  - sartor/memory/inbox/rocinante/*research-nightly*.md  (phone-homes from rtxserver)
  - sartor/memory/research/persona-engineering/RESEARCH-LOG.md
  - sartor/memory/research/persona-engineering/experiments/*.md
  - sartor/memory/research/ccp-alignment/eval-harness-2026-05-04/notes.md
  - sartor/memory/research/pharmacovigilance/safety-knowledge-graph/
  - git log --since=7d -- sartor/memory/research/
  - sartor/memory/machines/rtxpro6000server/  (peer/rental status)

Writes:
  - sartor/memory/research/dashboard.html

Design doc: sartor/memory/projects/research-nightly-cron-2026-05-12.md
"""

from __future__ import annotations

import datetime as dt
import html
import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
RESEARCH_DIR = REPO_ROOT / "sartor" / "memory" / "research"
INBOX_DIR = REPO_ROOT / "sartor" / "memory" / "inbox" / "rocinante"
DAILY_REPORTS_DIR = REPO_ROOT / "sartor" / "memory" / "daily"
MACHINE_DIR = REPO_ROOT / "sartor" / "memory" / "machines" / "rtxpro6000server"
GOAL_FILE = RESEARCH_DIR / "GOAL.md"
OUT_FILE = RESEARCH_DIR / "dashboard.html"

PE_DIR = RESEARCH_DIR / "persona-engineering"
CCP_HARNESS_DIR = RESEARCH_DIR / "ccp-alignment" / "eval-harness-2026-05-04"

# Phone-homes from the cron wrapper (process-level events: started/completed/skipped/failed)
DAILY_PHONE_HOME_GLOB = re.compile(r"(\d{4}-\d{2}-\d{2}T\d{4}Z)_research-daily-(\w+)\.md$")
# Substantive daily reports written by the Claude session itself
DAILY_REPORT_GLOB = re.compile(r"^research-(\d{4}-\d{2}-\d{2})\.md$")


# ---- helpers ---------------------------------------------------------------

def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

def local_now() -> str:
    return dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S %Z").strip()

def safe_read(path: Path, max_bytes: int = 200_000) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")[:max_bytes]
    except FileNotFoundError:
        return ""
    except Exception as e:
        return f"[read-error: {e}]"

def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 4)
    if end < 0:
        return {}, text
    fm_text = text[4:end]
    body = text[end + 4:]
    fm: dict = {}
    for line in fm_text.splitlines():
        if ":" in line and not line.lstrip().startswith("#"):
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip()
    return fm, body

def git_log_research(days: int = 7) -> list[dict]:
    since = f"{days}.days"
    try:
        out = subprocess.check_output(
            ["git", "-C", str(REPO_ROOT), "log",
             f"--since={since}",
             "--pretty=format:%h|%ad|%an|%s",
             "--date=short",
             "--",
             "sartor/memory/research/"],
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except Exception:
        return []
    rows = []
    for line in out.splitlines():
        if "|" not in line:
            continue
        sha, date, author, *rest = line.split("|")
        msg = "|".join(rest) if rest else ""
        rows.append({"sha": sha, "date": date, "author": author, "msg": msg})
    return rows


# ---- collectors ------------------------------------------------------------

def collect_goal_state() -> dict:
    """Read sartor/memory/research/GOAL.md and extract the dashboard-relevant slices.

    The /goal skill maintains this file. We render its mission, decomposition status,
    tractable items, blocked items, open questions, and recent progress tail.
    """
    out: dict = {
        "present": False,
        "fm": {},
        "mission": "",
        "decomposition_raw": "",
        "tractable_raw": "",
        "blocked_gpu_raw": "",
        "blocked_human_raw": "",
        "open_questions_raw": "",
        "progress_entries": [],
        "updated": "?",
        "mtime_hours": None,
    }
    if not GOAL_FILE.exists():
        return out
    out["present"] = True
    try:
        mtime = dt.datetime.fromtimestamp(GOAL_FILE.stat().st_mtime, dt.timezone.utc)
        out["mtime_hours"] = (dt.datetime.now(dt.timezone.utc) - mtime).total_seconds() / 3600.0
    except Exception:
        pass

    text = safe_read(GOAL_FILE, max_bytes=400_000)
    fm, body = parse_frontmatter(text)
    out["fm"] = fm
    out["updated"] = fm.get("updated", "?")

    # Section splitter — markdown level-2 headers
    sections: dict[str, str] = {}
    current_key = None
    current_lines: list[str] = []
    for line in body.splitlines():
        if line.startswith("## "):
            if current_key is not None:
                sections[current_key] = "\n".join(current_lines).strip()
            current_key = line[3:].strip().lower()
            current_lines = []
        else:
            current_lines.append(line)
    if current_key is not None:
        sections[current_key] = "\n".join(current_lines).strip()

    out["mission"] = sections.get("the mission question", "")
    out["decomposition_raw"] = sections.get("decomposition", "")
    out["tractable_raw"] = sections.get("tractable now (cpu-only design work)", "")
    out["blocked_gpu_raw"] = sections.get("blocked on gpu (proposed for an alton-greenlit gpu session)", "")
    out["blocked_human_raw"] = sections.get("blocked on human", "")
    out["open_questions_raw"] = sections.get("open questions", "")

    # Recent progress entries — each is a sub-section under "Recent progress" delimited by "## " inside body.
    # GOAL.md uses level-2 headers for progress entries too (e.g., "## 2026-05-12 — rocinante (initial seed)").
    # We pick those that look like progress entries by date prefix.
    for key, sec_body in sections.items():
        m = re.match(r"^(\d{4}-\d{2}-\d{2})\s+[—-]\s+(.+)$", key)
        if not m:
            continue
        out["progress_entries"].append({
            "date": m.group(1),
            "author": m.group(2),
            "body": sec_body[:400],
        })
    # Most recent first
    out["progress_entries"].sort(key=lambda r: r["date"], reverse=True)
    return out

def parse_decomposition(decomp_raw: str) -> dict:
    """Count DONE / IN PROGRESS / NOT STARTED / READY tokens from the decomposition tree."""
    counts = {"DONE": 0, "IN PROGRESS": 0, "NOT STARTED": 0, "READY": 0, "CLOSED": 0}
    for line in decomp_raw.splitlines():
        upper = line.upper()
        if "DONE" in upper:
            counts["DONE"] += 1
        elif "IN PROGRESS" in upper:
            counts["IN PROGRESS"] += 1
        elif "NOT STARTED" in upper:
            counts["NOT STARTED"] += 1
        elif "READY FOR" in upper:
            counts["READY"] += 1
        elif "CLOSED" in upper:
            counts["CLOSED"] += 1
    return counts

def count_bullets(raw: str) -> int:
    return sum(1 for line in raw.splitlines() if line.lstrip().startswith("- "))

def collect_daily_phone_homes(limit_days: int = 14) -> list[dict]:
    """Return one row per cron-wrapper phone-home (started/completed/skipped/failed)."""
    rows = []
    if not INBOX_DIR.exists():
        return rows
    for p in sorted(INBOX_DIR.iterdir()):
        m = DAILY_PHONE_HOME_GLOB.search(p.name)
        if not m:
            continue
        ts, verb = m.group(1), m.group(2)
        try:
            date_part = ts[:10]
        except Exception:
            date_part = "?"
        text = safe_read(p)
        fm, body = parse_frontmatter(text)
        # First non-blank body line as headline
        headline = ""
        for line in body.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                headline = line[:200]
                break
        rows.append({
            "ts": ts,
            "date": date_part,
            "verb": verb,
            "headline": headline,
            "path": str(p.relative_to(REPO_ROOT)).replace("\\", "/"),
            "fm": fm,
        })
    # Most recent first
    rows.sort(key=lambda r: r["ts"], reverse=True)
    return rows[: limit_days * 4]  # cap to avoid runaway

def collect_daily_reports(limit: int = 14) -> list[dict]:
    """Substantive daily reports written by the Claude session itself."""
    rows = []
    if not DAILY_REPORTS_DIR.exists():
        return rows
    for p in sorted(DAILY_REPORTS_DIR.iterdir(), reverse=True):
        m = DAILY_REPORT_GLOB.match(p.name)
        if not m:
            continue
        date = m.group(1)
        text = safe_read(p, max_bytes=8000)
        fm, body = parse_frontmatter(text)
        first_para = ""
        in_section = False
        for line in body.splitlines():
            if line.startswith("## Mission") or line.startswith("## Picked"):
                in_section = True
                continue
            if in_section and line.strip() and not line.startswith("#"):
                first_para = line.strip()[:240]
                break
        rows.append({
            "date": date,
            "program": fm.get("program_advanced", "?"),
            "self_loop": fm.get("self_loop_status", "?"),
            "proposed_gpu": fm.get("proposed_for_gpu_session", ""),
            "preview": first_para,
            "size": p.stat().st_size,
            "path": str(p.relative_to(REPO_ROOT)).replace("\\", "/"),
        })
        if len(rows) >= limit:
            break
    return rows

def collect_persona_engineering() -> dict:
    log = safe_read(PE_DIR / "RESEARCH-LOG.md")
    log_tail = "\n".join(log.splitlines()[-30:]) if log else "(no RESEARCH-LOG)"

    plan_fm, _ = parse_frontmatter(safe_read(PE_DIR / "RESEARCH-PLAN.md"))

    experiments = []
    exp_dir = PE_DIR / "experiments"
    if exp_dir.exists():
        for p in sorted(exp_dir.glob("*.md"), key=lambda x: x.name):
            m = re.match(r"^(\d{3})_(\d{4}-\d{2}-\d{2})_(.+)\.md$", p.name)
            if not m:
                continue
            fm, _ = parse_frontmatter(safe_read(p))
            experiments.append({
                "ord": m.group(1),
                "date": m.group(2),
                "slug": m.group(3),
                "status": fm.get("status", "unknown"),
                "path": str(p.relative_to(REPO_ROOT)).replace("\\", "/"),
            })

    return {
        "log_tail": log_tail,
        "plan_updated": plan_fm.get("updated", "?"),
        "plan_updated_by": plan_fm.get("updated_by", "?"),
        "experiments": experiments,
        "latest_experiment": experiments[-1] if experiments else None,
    }

def collect_ccp_alignment() -> dict:
    notes = safe_read(CCP_HARNESS_DIR / "notes.md")
    notes_tail = "\n".join(notes.splitlines()[-25:]) if notes else "(no notes.md)"
    runs_dir = CCP_HARNESS_DIR / "runs"
    runs_count = 0
    if runs_dir.exists():
        runs_count = sum(1 for _ in runs_dir.iterdir())
    return {
        "notes_tail": notes_tail,
        "runs_count": runs_count,
        "harness_path": str(CCP_HARNESS_DIR.relative_to(REPO_ROOT)).replace("\\", "/"),
    }

def collect_loop_reports(limit: int = 10) -> list[dict]:
    """rtxserver peer Claude's ScheduleWakeup self-loop writes here."""
    rows = []
    loop_dir = REPO_ROOT / "sartor" / "memory" / "inbox" / "rtxpro6000server" / "loop-reports"
    if not loop_dir.exists():
        return rows
    files = sorted(loop_dir.glob("*.md"), reverse=True)[:limit]
    for p in files:
        m = re.match(r"^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})Z\.md$", p.name)
        if not m:
            continue
        date_part, hh, mm = m.group(1), m.group(2), m.group(3)
        ts = f"{date_part}T{hh}{mm}Z"
        text = safe_read(p, max_bytes=4000)
        first_h1 = ""
        first_summary = ""
        for line in text.splitlines():
            if line.startswith("# ") and not first_h1:
                first_h1 = line[2:].strip()
            elif line.strip() and not line.startswith("#") and not line.startswith("---") and not first_summary:
                first_summary = line.strip()[:180]
        rows.append({
            "ts": ts,
            "date": date_part,
            "h1": first_h1,
            "summary": first_summary,
            "size": p.stat().st_size,
            "path": str(p.relative_to(REPO_ROOT)).replace("\\", "/"),
        })
    return rows

def hours_since(ts_str: str) -> float | None:
    """Parse 'YYYY-MM-DDTHHMMZ' and return hours since now (UTC)."""
    m = re.match(r"^(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})Z$", ts_str)
    if not m:
        return None
    try:
        dts = dt.datetime(int(m.group(1)[:4]), int(m.group(1)[5:7]), int(m.group(1)[8:10]),
                          int(m.group(2)), int(m.group(3)), tzinfo=dt.timezone.utc)
    except Exception:
        return None
    delta = dt.datetime.now(dt.timezone.utc) - dts
    return delta.total_seconds() / 3600.0

def collect_rtxserver_status() -> dict:
    """Best-effort read of last gather_mirror status snapshot in inbox."""
    status_dir = REPO_ROOT / "sartor" / "memory" / "inbox" / "rtxpro6000server" / "status"
    latest = None
    if status_dir.exists():
        files = sorted(status_dir.glob("*.json"))
        if files:
            latest = files[-1]
    snapshot = {}
    if latest:
        try:
            snapshot = json.loads(safe_read(latest))
        except Exception:
            snapshot = {}
        snapshot["__source"] = str(latest.relative_to(REPO_ROOT)).replace("\\", "/")
    return snapshot

def collect_open_passoffs() -> list[dict]:
    rows = []
    for p in sorted(PE_DIR.glob("PASSOFF-*.md")):
        fm, _ = parse_frontmatter(safe_read(p))
        rows.append({
            "name": p.stem,
            "status": fm.get("status", "?"),
            "updated": fm.get("updated", "?"),
            "version": fm.get("version", "?"),
            "path": str(p.relative_to(REPO_ROOT)).replace("\\", "/"),
        })
    return rows


# ---- HTML rendering --------------------------------------------------------

CSS = """
body { font-family: -apple-system, "Segoe UI", sans-serif; margin: 1.5em; background: #0f172a; color: #e2e8f0; max-width: 1400px; }
h1 { color: #fff; margin: 0 0 0.2em 0; font-size: 1.6em; }
h2 { color: #fbbf24; border-bottom: 1px solid #334155; padding-bottom: 0.3em; margin-top: 2em; font-size: 1.15em; }
h3 { color: #fdba74; margin-top: 1.2em; font-size: 1em; }
.stamp { color: #94a3b8; font-size: 0.85em; margin-bottom: 1.5em; }
table { border-collapse: collapse; width: 100%; margin: 0.5em 0; font-size: 0.88em; }
th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #1e293b; vertical-align: top; }
th { background: #1e293b; color: #fbbf24; font-weight: normal; }
tr:hover { background: #1e293b; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.ok { color: #86efac; }
.warn { color: #fbbf24; }
.crit { color: #fca5a5; }
.dim { color: #64748b; }
.mono { font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; font-size: 0.85em; }
.pill { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 0.8em; }
.pill-ok { background: #065f46; color: #d1fae5; }
.pill-warn { background: #78350f; color: #fde68a; }
.pill-crit { background: #7f1d1d; color: #fecaca; }
.pill-skip { background: #1e3a8a; color: #dbeafe; }
.pill-dim { background: #334155; color: #cbd5e1; }
.grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.2em; }
.grid.two-col { grid-template-columns: 1fr 1fr; }
@media (max-width: 1100px) { .grid, .grid.two-col { grid-template-columns: 1fr; } }
.card { background: #1e293b; padding: 0.8em 1em; border-radius: 6px; }
.headline { color: #cbd5e1; }
pre { background: #0b1220; padding: 0.6em; border-radius: 4px; font-size: 0.78em; overflow-x: auto; color: #cbd5e1; max-height: 18em; }
a { color: #93c5fd; text-decoration: none; }
a:hover { text-decoration: underline; }
.lights { display: flex; gap: 1em; margin: 0.6em 0 1.2em 0; }
.light { padding: 0.3em 0.7em; border-radius: 6px; background: #1e293b; font-size: 0.85em; }
"""

def pill(verb: str) -> str:
    cls = "pill-dim"
    label = verb
    if verb == "completed":
        cls = "pill-ok"
        label = "FIRED"
    elif verb == "started":
        cls = "pill-warn"
        label = "STARTED"
    elif verb == "skipped":
        cls = "pill-skip"
        label = "SKIPPED"
    elif verb == "failed":
        cls = "pill-crit"
        label = "FAILED"
    elif verb == "yielded":
        cls = "pill-warn"
        label = "YIELDED"
    elif verb == "blocked":
        cls = "pill-crit"
        label = "BLOCKED"
    elif verb == "results":
        cls = "pill-ok"
        label = "RESULTS"
    return f'<span class="pill {cls}">{html.escape(label)}</span>'

def render_loop_reports(rows: list[dict]) -> str:
    if not rows:
        return '<p class="dim">No loop-reports in inbox/rtxpro6000server/loop-reports/. Peer self-loop may not have run.</p>'
    out = ['<table>',
           '<tr><th>UTC</th><th>age</th><th>headline</th><th>summary</th><th>file</th></tr>']
    for r in rows:
        age_h = hours_since(r["ts"])
        if age_h is None:
            age_cell = '<span class="dim">?</span>'
        elif age_h < 18:
            age_cell = f'<span class="pill pill-ok">{age_h:.0f}h ago</span>'
        elif age_h < 48:
            age_cell = f'<span class="pill pill-warn">{age_h:.0f}h ago</span>'
        else:
            age_cell = f'<span class="pill pill-crit">{age_h:.0f}h ago</span>'
        out.append(
            f'<tr>'
            f'<td class="mono">{html.escape(r["ts"])}</td>'
            f'<td>{age_cell}</td>'
            f'<td class="headline">{html.escape(r["h1"] or "(no h1)")}</td>'
            f'<td class="dim">{html.escape(r["summary"] or "")}</td>'
            f'<td class="mono"><a href="../../../{html.escape(r["path"])}">{html.escape(r["ts"])}.md</a></td>'
            f'</tr>'
        )
    out.append('</table>')
    return "".join(out)

def render_daily_phone_homes(rows: list[dict]) -> str:
    if not rows:
        return '<p class="dim">No daily phone-homes in inbox/rocinante/. Daily cron may not be installed yet.</p>'
    out = ['<table>',
           '<tr><th>UTC</th><th>verb</th><th>headline</th><th>file</th></tr>']
    for r in rows[:14]:
        out.append(
            f'<tr>'
            f'<td class="mono">{html.escape(r["ts"])}</td>'
            f'<td>{pill(r["verb"])}</td>'
            f'<td class="headline">{html.escape(r["headline"] or "(no headline)")}</td>'
            f'<td class="mono"><a href="../../../{html.escape(r["path"])}">{html.escape(r["path"].split("/")[-1])}</a></td>'
            f'</tr>'
        )
    out.append('</table>')
    return "".join(out)

def render_program_cards(pe: dict, ccp: dict) -> str:
    pe_exp = pe.get("latest_experiment")
    pe_exp_html = (
        f'<div class="mono">{html.escape(pe_exp["ord"])} · {html.escape(pe_exp["date"])} · '
        f'<span class="pill pill-dim">{html.escape(pe_exp["status"])}</span></div>'
        f'<div class="dim mono" style="margin-top:0.3em">{html.escape(pe_exp["slug"])}</div>'
        if pe_exp else '<div class="dim">no experiments on disk</div>'
    )
    ccp_html = (
        f'<div>Runs catalogued: <span class="mono">{ccp.get("runs_count", 0)}</span></div>'
        f'<div class="dim mono" style="margin-top:0.3em">harness: {html.escape(ccp.get("harness_path", ""))}</div>'
    )
    return f"""
<div class="grid two-col">
  <div class="card">
    <h3>persona-engineering</h3>
    <div class="dim" style="font-size:0.85em">implant household-loyalty as deeply-embodied trait (addition)</div>
    <div style="margin-top:0.6em">Latest experiment:</div>
    {pe_exp_html}
    <div class="dim" style="margin-top:0.6em">RESEARCH-PLAN updated: <span class="mono">{html.escape(pe.get("plan_updated", "?"))}</span> by <span class="mono">{html.escape(pe.get("plan_updated_by", "?"))}</span></div>
  </div>
  <div class="card">
    <h3>ccp-alignment</h3>
    <div class="dim" style="font-size:0.85em">override CCP-aligned baseline so Constitution can absorb (subtraction)</div>
    <div style="margin-top:0.6em">{ccp_html}</div>
  </div>
</div>
"""

def render_daily_reports(rows: list[dict]) -> str:
    if not rows:
        return '<p class="dim">No daily research reports at sartor/memory/daily/research-*.md yet. The daily cron may not be installed.</p>'
    out = ['<table>',
           '<tr><th>date</th><th>program</th><th>self-loop</th><th>preview</th><th>proposed-for-GPU</th><th>file</th></tr>']
    for r in rows:
        program_pill = {
            "ccp-alignment": '<span class="pill pill-warn">ccp-alignment</span>',
            "persona-engineering": '<span class="pill pill-ok">persona-engineering</span>',
            "both": '<span class="pill pill-ok">both</span>',
            "meta": '<span class="pill pill-dim">meta</span>',
        }.get(r["program"], f'<span class="pill pill-dim">{html.escape(r["program"])}</span>')
        loop = r["self_loop"]
        loop_pill = {
            "recent": '<span class="pill pill-ok">recent</span>',
            "stalled": '<span class="pill pill-crit">stalled</span>',
        }.get(loop, f'<span class="pill pill-dim">{html.escape(loop)}</span>')
        out.append(
            f'<tr>'
            f'<td class="mono">{html.escape(r["date"])}</td>'
            f'<td>{program_pill}</td>'
            f'<td>{loop_pill}</td>'
            f'<td class="dim" style="max-width:36em">{html.escape(r["preview"] or "(no preview)")}</td>'
            f'<td class="dim" style="max-width:24em">{html.escape(r["proposed_gpu"] or "")}</td>'
            f'<td class="mono"><a href="../../../{html.escape(r["path"])}">research-{html.escape(r["date"])}.md</a></td>'
            f'</tr>'
        )
    out.append('</table>')
    return "".join(out)

def render_passoffs(rows: list[dict]) -> str:
    if not rows:
        return '<p class="dim">No PASSOFF files found.</p>'
    out = ['<table>',
           '<tr><th>name</th><th>version</th><th>status</th><th>updated</th><th>file</th></tr>']
    for r in rows:
        status_pill = pill_status(r["status"])
        out.append(
            f'<tr>'
            f'<td class="mono">{html.escape(r["name"])}</td>'
            f'<td class="mono">{html.escape(r["version"])}</td>'
            f'<td>{status_pill}</td>'
            f'<td class="mono">{html.escape(r["updated"])}</td>'
            f'<td class="mono"><a href="../../../{html.escape(r["path"])}">{html.escape(r["name"])}.md</a></td>'
            f'</tr>'
        )
    out.append('</table>')
    return "".join(out)

def pill_status(status: str) -> str:
    s = status.lower()
    if "blocked" in s or "fail" in s:
        return f'<span class="pill pill-crit">{html.escape(status)}</span>'
    if "progress" in s or "planning" in s or "running" in s:
        return f'<span class="pill pill-warn">{html.escape(status)}</span>'
    if "complete" in s or "ready" in s or "fired" in s or "active" in s:
        return f'<span class="pill pill-ok">{html.escape(status)}</span>'
    return f'<span class="pill pill-dim">{html.escape(status)}</span>'

def render_recent_commits(rows: list[dict]) -> str:
    if not rows:
        return '<p class="dim">No commits to sartor/memory/research/ in the last 7 days.</p>'
    out = ['<table>',
           '<tr><th>sha</th><th>date</th><th>author</th><th>message</th></tr>']
    for r in rows[:40]:
        out.append(
            f'<tr>'
            f'<td class="mono">{html.escape(r["sha"])}</td>'
            f'<td class="mono">{html.escape(r["date"])}</td>'
            f'<td>{html.escape(r["author"])}</td>'
            f'<td class="headline">{html.escape(r["msg"])}</td>'
            f'</tr>'
        )
    out.append('</table>')
    return "".join(out)

def render_status_lights(nightly_rows: list[dict], snapshot: dict) -> str:
    last = nightly_rows[0] if nightly_rows else None
    light_last = '<span class="dim">no nightly fired yet</span>'
    if last:
        light_last = f'last nightly: {pill(last["verb"])} <span class="mono">{html.escape(last["ts"])}</span>'

    rental = snapshot.get("active_rental_container")
    light_rental = (
        f'<span class="pill pill-warn">rental active: {html.escape(str(rental))}</span>'
        if rental
        else '<span class="pill pill-ok">no active rental</span>'
    )

    heartbeat = snapshot.get("heartbeat_age_min")
    if heartbeat is None:
        light_hb = '<span class="dim">heartbeat unknown</span>'
    elif heartbeat < 300:
        light_hb = f'<span class="pill pill-ok">heartbeat {heartbeat}m old</span>'
    else:
        light_hb = f'<span class="pill pill-crit">heartbeat {heartbeat}m old</span>'

    return f'''
<div class="lights">
  <div class="light">{light_last}</div>
  <div class="light">{light_rental}</div>
  <div class="light">{light_hb}</div>
</div>
'''

def render_goal_card(goal: dict) -> str:
    if not goal.get("present"):
        return '<div class="card"><span class="dim">No sartor/memory/research/GOAL.md found. The /goal framework is not yet active.</span></div>'

    fm = goal["fm"]
    mtime_h = goal.get("mtime_hours")
    if mtime_h is None:
        freshness = '<span class="dim">freshness unknown</span>'
    elif mtime_h < 24:
        freshness = f'<span class="pill pill-ok">updated {mtime_h:.0f}h ago</span>'
    elif mtime_h < 72:
        freshness = f'<span class="pill pill-warn">updated {mtime_h:.0f}h ago</span>'
    else:
        freshness = f'<span class="pill pill-crit">updated {mtime_h:.0f}h ago — peer self-loop may be stalled</span>'

    counts = parse_decomposition(goal.get("decomposition_raw", ""))
    tractable_n = count_bullets(goal.get("tractable_raw", ""))
    blocked_gpu_n = count_bullets(goal.get("blocked_gpu_raw", ""))
    blocked_human_n = count_bullets(goal.get("blocked_human_raw", ""))
    open_q_n = count_bullets(goal.get("open_questions_raw", ""))

    mission_first = ""
    for line in goal.get("mission", "").splitlines():
        if line.strip().startswith(">"):
            mission_first = line.strip().lstrip(">").strip().strip("*").strip()
            break

    return f"""
<div class="card" style="margin-bottom:1.5em">
  <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:0.6em">
    <h3 style="margin:0;color:#fbbf24">Mission</h3>
    {freshness}
  </div>
  <div style="font-size:1.05em;color:#fff;margin-top:0.4em">{html.escape(mission_first or "(see GOAL.md)")}</div>
  <div class="dim" style="margin-top:0.4em">Substrate: <span class="mono">{html.escape(fm.get("substrate_current", "?"))}</span> · Target: <span class="mono">{html.escape(fm.get("target_identity", "?"))}</span> · Lines: <span class="mono">{html.escape(fm.get("lines_engaged", "?"))}</span></div>
  <table style="margin-top:0.8em">
    <tr>
      <th>decomposition</th>
      <th class="num">DONE</th>
      <th class="num">IN PROGRESS</th>
      <th class="num">NOT STARTED</th>
      <th class="num">READY</th>
      <th class="num">CLOSED</th>
    </tr>
    <tr>
      <td class="dim">node states</td>
      <td class="num mono ok">{counts["DONE"]}</td>
      <td class="num mono warn">{counts["IN PROGRESS"]}</td>
      <td class="num mono dim">{counts["NOT STARTED"]}</td>
      <td class="num mono ok">{counts["READY"]}</td>
      <td class="num mono dim">{counts["CLOSED"]}</td>
    </tr>
  </table>
  <table style="margin-top:0.8em">
    <tr>
      <th>work pool</th>
      <th class="num">items</th>
    </tr>
    <tr><td>Tractable now (peer picks from here)</td><td class="num mono ok">{tractable_n}</td></tr>
    <tr><td>Blocked on GPU (proposed for Alton-greenlit session)</td><td class="num mono warn">{blocked_gpu_n}</td></tr>
    <tr><td>Blocked on human</td><td class="num mono crit">{blocked_human_n}</td></tr>
    <tr><td>Open questions</td><td class="num mono dim">{open_q_n}</td></tr>
  </table>
  <div class="dim" style="margin-top:0.6em">Full state: <a href="../../research/GOAL.md" class="mono">sartor/memory/research/GOAL.md</a></div>
</div>
"""

def render_tractable_list(raw: str) -> str:
    if not raw.strip():
        return '<p class="dim">No tractable items in GOAL.md.</p>'
    out = ['<ul style="margin:0.4em 0;padding-left:1.4em">']
    for line in raw.splitlines():
        stripped = line.lstrip()
        if not stripped.startswith("- "):
            continue
        content = stripped[2:]
        # Bold up to first period; treat as headline
        m = re.match(r"\*\*([^*]+)\*\*\s*(.*)", content)
        if m:
            head = m.group(1)
            rest = m.group(2)
            out.append(f'<li><strong>{html.escape(head)}</strong> <span class="dim">{html.escape(rest[:220])}</span></li>')
        else:
            out.append(f'<li>{html.escape(content[:240])}</li>')
    out.append('</ul>')
    return "".join(out)

def render_progress_tail(entries: list[dict], limit: int = 8) -> str:
    if not entries:
        return '<p class="dim">No progress entries yet.</p>'
    out = ['<table>',
           '<tr><th>date</th><th>author</th><th>summary</th></tr>']
    for r in entries[:limit]:
        out.append(
            f'<tr>'
            f'<td class="mono">{html.escape(r["date"])}</td>'
            f'<td class="dim">{html.escape(r["author"])}</td>'
            f'<td>{html.escape(r["body"][:240])}</td>'
            f'</tr>'
        )
    out.append('</table>')
    return "".join(out)

def render_html(
    phone_homes: list[dict],
    daily_reports: list[dict],
    pe: dict,
    ccp: dict,
    passoffs: list[dict],
    commits: list[dict],
    snapshot: dict,
    loop_reports: list[dict],
    goal: dict,
) -> str:
    # Aggregate "proposed for GPU session" from all recent daily reports
    proposed_items = []
    for r in daily_reports[:5]:
        prop = r.get("proposed_gpu", "").strip()
        if prop and prop not in proposed_items:
            proposed_items.append(f'<li><span class="dim mono">{html.escape(r["date"])}:</span> {html.escape(prop)}</li>')

    return f"""<!doctype html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="60">
<title>Sartor Research Dashboard</title>
<style>{CSS}</style>
</head><body>
<h1>Sartor Research Dashboard</h1>
<div class="stamp">Generated {html.escape(local_now())} local · {html.escape(utc_now())} · auto-reload 60s · regenerated every 30 min by Sartor Research Dashboard scheduled task</div>

{render_status_lights(phone_homes, snapshot)}

{render_goal_card(goal)}

<h2>Tractable now — what the peer picks from each wake</h2>
{render_tractable_list(goal.get("tractable_raw", ""))}

<h2>GOAL.md progress tail</h2>
<p class="dim">Append-only entries the /goal skill writes after each wake's work. Newest first.</p>
{render_progress_tail(goal.get("progress_entries", []))}

<h2>rtxserver peer self-loop — last 10 wake reports</h2>
<p class="dim">ScheduleWakeup-driven loop-reports. /goal is the framework that drives these. Age pills surface drift (peer-service restarts can lose the in-session wakeup).</p>
{render_loop_reports(loop_reports)}

<h2>Cron backstop — last 14 phone-homes</h2>
<p class="dim">If the optional backstop cron is installed, wrapper-level events surface here. Empty = backstop not installed (the primary mechanism is /goal in the peer).</p>
{render_daily_phone_homes(phone_homes)}

<h2>Per-program state</h2>
{render_program_cards(pe, ccp)}

<h2>Persona-engineering — RESEARCH-LOG tail (last 30 lines)</h2>
<pre>{html.escape(pe.get("log_tail", "(no log)"))}</pre>

<h2>ccp-alignment — eval-harness-2026-05-04 notes (last 25 lines)</h2>
<pre>{html.escape(ccp.get("notes_tail", "(no notes)"))}</pre>

<h2>Open PASSOFF packets</h2>
{render_passoffs(passoffs)}

<h2>Recent commits to sartor/memory/research/ (last 14 days)</h2>
{render_recent_commits(commits)}

<h2>Proposed for an Alton-greenlit GPU session</h2>
<div class="card">{('<ul style="margin:0">' + "".join(proposed_items) + '</ul>') if proposed_items else '<span class="dim">No proposals yet — the daily cron hasn\'t fired.</span>'}</div>

<h2 class="dim">Diagnostics</h2>
<table>
<tr><td class="dim">Working tree:</td><td class="mono">{html.escape(str(REPO_ROOT))}</td></tr>
<tr><td class="dim">GOAL.md present:</td><td class="mono">{'yes' if goal.get('present') else 'no'}</td></tr>
<tr><td class="dim">GOAL.md age (hours):</td><td class="mono num">{(f"{goal['mtime_hours']:.1f}" if goal.get('mtime_hours') is not None else 'n/a')}</td></tr>
<tr><td class="dim">Loop-reports scanned:</td><td class="mono num">{len(loop_reports)}</td></tr>
<tr><td class="dim">Cron phone-homes scanned (backstop):</td><td class="mono num">{len(phone_homes)}</td></tr>
<tr><td class="dim">Commits scanned (14d):</td><td class="mono num">{len(commits)}</td></tr>
<tr><td class="dim">PASSOFFs scanned:</td><td class="mono num">{len(passoffs)}</td></tr>
<tr><td class="dim">rtxserver status snapshot source:</td><td class="mono">{html.escape(snapshot.get("__source", "(none)"))}</td></tr>
</table>
</body></html>
"""


# ---- main ------------------------------------------------------------------

def main() -> int:
    if not RESEARCH_DIR.exists():
        print(f"ERROR: research dir missing at {RESEARCH_DIR}", file=sys.stderr)
        return 1

    phone_homes = collect_daily_phone_homes()
    daily_reports = collect_daily_reports()
    pe = collect_persona_engineering()
    ccp = collect_ccp_alignment()
    commits = git_log_research(days=14)
    passoffs = collect_open_passoffs()
    snapshot = collect_rtxserver_status()
    loop_reports = collect_loop_reports()
    goal = collect_goal_state()

    html_out = render_html(phone_homes, daily_reports, pe, ccp, passoffs, commits, snapshot, loop_reports, goal)
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(html_out, encoding="utf-8")
    print(f"wrote {OUT_FILE} ({len(html_out)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
