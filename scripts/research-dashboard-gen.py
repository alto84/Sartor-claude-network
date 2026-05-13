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
MACHINE_DIR = REPO_ROOT / "sartor" / "memory" / "machines" / "rtxpro6000server"
OUT_FILE = RESEARCH_DIR / "dashboard.html"

PE_DIR = RESEARCH_DIR / "persona-engineering"
PV_DIR = RESEARCH_DIR / "pharmacovigilance"
CCP_HARNESS_DIR = RESEARCH_DIR / "ccp-alignment" / "eval-harness-2026-05-04"

NIGHTLY_GLOB = re.compile(r"(\d{4}-\d{2}-\d{2}T\d{4}Z)_research-nightly-(\w+)\.md$")


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

def collect_nightly_phone_homes(limit_days: int = 7) -> list[dict]:
    """Return one row per nightly run (most recent first)."""
    rows = []
    if not INBOX_DIR.exists():
        return rows
    for p in sorted(INBOX_DIR.iterdir()):
        m = NIGHTLY_GLOB.search(p.name)
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

def collect_pharmacovigilance() -> dict:
    kg_root = PV_DIR / "safety-knowledge-graph"
    counts = {"adverse-events": 0, "mitigations": 0, "trials": 0, "models": 0, "data-sources": 0}
    if kg_root.exists():
        for kind in counts.keys():
            d = kg_root / kind
            if d.exists():
                counts[kind] = sum(1 for p in d.glob("*.md") if p.name != "README.md")
    readme = safe_read(kg_root / "README.md")
    readme_head = "\n".join(readme.splitlines()[:20])
    return {
        "counts": counts,
        "readme_head": readme_head,
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
@media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
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

def render_nightly_table(rows: list[dict]) -> str:
    if not rows:
        return '<p class="dim">No nightly phone-homes found in inbox. Nightly cron may not be installed yet.</p>'
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

def render_program_cards(pe: dict, ccp: dict, pv: dict) -> str:
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
    pv_counts = pv.get("counts", {})
    pv_html = '<table style="margin:0">'
    for k, v in pv_counts.items():
        pv_html += f'<tr><td class="dim">{html.escape(k)}</td><td class="num mono">{v}</td></tr>'
    pv_html += '</table>'

    return f"""
<div class="grid">
  <div class="card">
    <h3>persona-engineering</h3>
    <div>Latest experiment:</div>
    {pe_exp_html}
    <div class="dim" style="margin-top:0.6em">RESEARCH-PLAN updated: <span class="mono">{html.escape(pe.get("plan_updated", "?"))}</span> by <span class="mono">{html.escape(pe.get("plan_updated_by", "?"))}</span></div>
  </div>
  <div class="card">
    <h3>ccp-alignment</h3>
    {ccp_html}
  </div>
  <div class="card">
    <h3>pharmacovigilance</h3>
    <div>safety-knowledge-graph nodes by type:</div>
    {pv_html}
  </div>
</div>
"""

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

def render_html(
    nightly_rows: list[dict],
    pe: dict,
    ccp: dict,
    pv: dict,
    passoffs: list[dict],
    commits: list[dict],
    snapshot: dict,
    loop_reports: list[dict],
) -> str:
    last_proposed = ""
    for r in nightly_rows:
        proposed = r["fm"].get("proposed_for_tonight")
        if proposed:
            last_proposed = proposed
            break

    return f"""<!doctype html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="60">
<title>Sartor Research Dashboard</title>
<style>{CSS}</style>
</head><body>
<h1>Sartor Research Dashboard</h1>
<div class="stamp">Generated {html.escape(local_now())} local · {html.escape(utc_now())} · auto-reload 60s · regenerated every 30 min by Sartor Research Dashboard scheduled task</div>

{render_status_lights(nightly_rows, snapshot)}

<h2>rtxserver peer self-loop — last 10 wake reports</h2>
<p class="dim">ScheduleWakeup-driven; fragile (lost on peer-service restart). The nightly cron backstops this.</p>
{render_loop_reports(loop_reports)}

<h2>Nightly cron — last 14 phone-homes</h2>
{render_nightly_table(nightly_rows)}

<h2>Per-program state</h2>
{render_program_cards(pe, ccp, pv)}

<h2>Persona-engineering — RESEARCH-LOG tail (last 30 lines)</h2>
<pre>{html.escape(pe.get("log_tail", "(no log)"))}</pre>

<h2>ccp-alignment — eval-harness-2026-05-04 notes (last 25 lines)</h2>
<pre>{html.escape(ccp.get("notes_tail", "(no notes)"))}</pre>

<h2>Open PASSOFF packets</h2>
{render_passoffs(passoffs)}

<h2>Recent commits to sartor/memory/research/ (last 7 days)</h2>
{render_recent_commits(commits)}

<h2>What rtxserver proposed for a future GPU-allowed night</h2>
<div class="card">{html.escape(last_proposed) if last_proposed else '<span class="dim">No proposal in the most recent phone-home(s).</span>'}</div>

<h2 class="dim">Diagnostics</h2>
<table>
<tr><td class="dim">Working tree:</td><td class="mono">{html.escape(str(REPO_ROOT))}</td></tr>
<tr><td class="dim">Nightly phone-homes scanned:</td><td class="mono num">{len(nightly_rows)}</td></tr>
<tr><td class="dim">Commits scanned (7d):</td><td class="mono num">{len(commits)}</td></tr>
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

    nightly = collect_nightly_phone_homes()
    pe = collect_persona_engineering()
    ccp = collect_ccp_alignment()
    pv = collect_pharmacovigilance()
    commits = git_log_research(days=7)
    passoffs = collect_open_passoffs()
    snapshot = collect_rtxserver_status()
    loop_reports = collect_loop_reports()

    html_out = render_html(nightly, pe, ccp, pv, passoffs, commits, snapshot, loop_reports)
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(html_out, encoding="utf-8")
    print(f"wrote {OUT_FILE} ({len(html_out)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
