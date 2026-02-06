#!/usr/bin/env python3
"""Sartor Morning Brief Generator - concise daily briefing from local data.

Usage:
    CLI:    python3 brief.py             # today's brief
            python3 brief.py --yesterday # yesterday's brief
    Import: from brief import generate_brief; text = generate_brief()
"""
import argparse, json, re, subprocess, sys
from datetime import date, datetime, timedelta
from pathlib import Path

SARTOR = Path(__file__).resolve().parent
MEMORY, DAILY = SARTOR / "memory", SARTOR / "memory" / "daily"
TASKS_FILE, PROJECTS_FILE = SARTOR / "tasks" / "ACTIVE.md", MEMORY / "PROJECTS.md"
COSTS_JSON, TAX_DEADLINE = SARTOR / "costs.json", date(2026, 4, 15)

def _run(cmd, timeout=5):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout).stdout.strip()
    except Exception: return ""

def _rf(p):
    try: return p.read_text(encoding="utf-8")
    except Exception: return ""

def _system_stats():
    s = {}
    raw = _run(["uptime", "-s"])
    if raw:
        try:
            d = datetime.now() - datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")
            s["uptime"] = f"{d.days}d {d.seconds//3600}h" if d.days else f"{d.seconds//3600}h"
        except ValueError: s["uptime"] = "unknown"
    else: s["uptime"] = "unknown"
    raw = _run(["df", "-h", "--output=pcent,avail", "/home"])
    if raw:
        parts = raw.splitlines()[-1].split()
        if parts: s["disk_pct"] = parts[0]
    raw = _run(["nvidia-smi", "--query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total,name",
                 "--format=csv,noheader,nounits"])
    if raw:
        p = [x.strip() for x in raw.split(",")]
        if len(p) >= 5: s["gpu_temp"], s["gpu_name"] = f"{p[0]}\u00b0C", p[4]
    return s

def _parse_tasks(text):
    r = {"in_progress": [], "pending": [], "completed_today": []}
    sec, cur = None, []
    def flush():
        nonlocal cur
        if cur and sec in r: r[sec].append("\n".join(cur))
        cur = []
    for line in text.splitlines():
        st = line.strip()
        if st.startswith("## "):
            flush()
            lo = st.lower()
            sec = ("in_progress" if "in progress" in lo else
                   "completed_today" if "completed" in lo else
                   "pending" if "pending" in lo else None)
        elif st.startswith("- ["):
            flush()
            m = re.search(r"\*\*(.+?)\*\*", st)
            cur = [m.group(1) if m else st[6:]]
        elif st.startswith("- ") and cur:
            cur.append(st)
    flush()
    return r

def _project_summaries(text):
    skip = {"Key Facts", "Open Questions", "Related", "History"}
    out, name, status, desc = [], None, "", ""
    for line in text.splitlines():
        if line.startswith("## "):
            if name and (status or desc):
                out.append((name, f"{status} - {desc}" if status and desc else status or desc))
            h = line[3:].strip()
            name, status, desc = (None, "", "") if h in skip else (h, "", "")
        elif name:
            st = line.strip()
            if st.startswith("- **Status:**"): status = st.split("**Status:**")[1].strip()
            elif st.startswith("- **Description:**"): desc = st.split("**Description:**")[1].strip()
    if name and (status or desc):
        out.append((name, f"{status} - {desc}" if status and desc else status or desc))
    return out

def _yesterday_notes(text):
    bullets, active = [], False
    for line in text.splitlines():
        st = line.strip()
        if st.startswith("## "):
            active = st[3:].lower() in ("completed", "decisions made", "insights")
        elif st.startswith("### "): active = False
        elif active and st.startswith("- "):
            item = st[2:].strip()
            bullets.append(item[:117] + "..." if len(item) > 120 else item)
    return bullets[:8]

def _cost_summary():
    s = {"today": 0.0, "week": 0.0, "limit": 5.0}
    try: data = json.loads(_rf(COSTS_JSON))
    except Exception: return s
    s["limit"] = data.get("daily_limit", 5.0)
    today_s, week_ago = datetime.now().strftime("%Y-%m-%d"), (datetime.now() - timedelta(days=7)).isoformat()
    for c in data.get("calls", []):
        ts, cost = c.get("timestamp", ""), c.get("cost", 0.0)
        if ts.startswith(today_s): s["today"] += cost
        if ts >= week_ago: s["week"] += cost
    return {k: round(v, 4) if k != "limit" else v for k, v in s.items()}

def _gateway_status():
    text = _rf(DAILY / f"{date.today().isoformat()}.md")
    cycles = re.findall(r"### (\d{2}:\d{2}) Cycle\n- Status: (\w+)", text)
    if cycles:
        return {"running": True, "cycles": len(cycles),
                "last_time": cycles[-1][0], "last_status": cycles[-1][1]}
    return {"running": False, "cycles": 0, "last_time": None, "last_status": None}

def _mem_stats():
    files = list(MEMORY.rglob("*.md"))
    return len(files), round(sum(f.stat().st_size for f in files if f.exists()) / 1024, 1)

def generate_brief(target_date=None):
    """Generate the morning brief for the given date (default: today)."""
    td = target_date or date.today()
    ds = td.strftime("%B %d, %Y").replace(" 0", " ")
    tasks = _parse_tasks(_rf(TASKS_FILE))
    costs, ss = _cost_summary(), _system_stats()
    projects = _project_summaries(_rf(PROJECTS_FILE))
    yn = _yesterday_notes(_rf(DAILY / f"{(td - timedelta(days=1)).isoformat()}.md"))
    gw, (mf, mk) = _gateway_status(), _mem_stats()

    L = [f"# Morning Brief - {ds} ({td.strftime('%A')})", "",
         "## At a Glance",
         f"- **Days to tax deadline:** {(TAX_DEADLINE - td).days}",
         f"- **Active tasks:** {len(tasks['pending'])} pending, {len(tasks['in_progress'])} in progress",
         f"- **API costs:** ${costs['today']:.2f} today, ${costs['week']:.2f} this week (limit: ${costs['limit']:.0f}/day)"]
    sp = [f"gpuserver1 up {ss['uptime']}" if ss.get("uptime") else None,
          f"GPU {ss['gpu_temp']}" if ss.get("gpu_temp") else None,
          f"disk {ss['disk_pct']} used" if ss.get("disk_pct") else None]
    sp = [x for x in sp if x]
    L.append(f"- **System:** {', '.join(sp)}" if sp else "- **System:** stats unavailable")

    L += ["", "## Tasks"]
    if tasks["in_progress"]:
        L.append("### In Progress")
        for t in tasks["in_progress"]:
            tl = t.split("\n"); title = tl[0]
            st = next((re.sub(r"^-\s*", "", x).strip() for x in tl[1:] if "Status:" in x), "")
            L.append(f"- {title} -- {st}" if st else f"- {title}")
    if tasks["pending"]:
        L.append("### Coming Up")
        for t in tasks["pending"]: L.append(f"- {t.split(chr(10))[0]}")
    if tasks["completed_today"]:
        L.append("### Completed Yesterday")
        for t in tasks["completed_today"]: L.append(f"- {t.split(chr(10))[0]}")
    if projects:
        L += ["", "## Projects"]
        for n, s in projects: L.append(f"- **{n}:** {s}")
    if yn:
        L += ["", "## Notes from Yesterday"]
        for note in yn[:5]: L.append(f"- {note}")
    L += ["", "## Sartor Status",
          f"- Gateway cron: {'running' if gw['running'] else 'not running'} ({gw['cycles']} cycles today)"]
    if gw["last_time"]: L.append(f"- Last cycle: {gw['last_time']} - {gw['last_status']}")
    L.append(f"- Memory files: {mf} files, {mk} KB total")

    # Google integrations (optional - works without auth)
    try:
        from google_integrations import get_google_context
        gc = get_google_context()
        if gc["status"] == "connected":
            today_events = [e for e in gc["calendar_events"]
                           if e["start"].startswith(td.isoformat())]
            L += ["", "## Calendar"]
            if today_events:
                for ev in today_events:
                    t = ev["start"].split("T")[1][:5] if "T" in ev["start"] else "all-day"
                    loc = f" ({ev['location']})" if ev.get("location") else ""
                    L.append(f"- {t} {ev['summary']}{loc}")
            else:
                L.append("- No events today")
            unread = gc["email_summary"].get("unread_count", 0)
            L += ["", "## Email", f"- **Unread:** {unread}"]
    except Exception:
        pass  # Brief works fine without Google auth

    return "\n".join(L) + "\n"

def main():
    ap = argparse.ArgumentParser(description="Sartor Morning Brief Generator")
    ap.add_argument("--yesterday", action="store_true", help="Show yesterday's brief")
    ap.add_argument("--no-save", action="store_true", help="Print only, don't save")
    args = ap.parse_args()
    target = date.today() - timedelta(days=1) if args.yesterday else date.today()
    brief = generate_brief(target)
    if not args.no_save:
        DAILY.mkdir(parents=True, exist_ok=True)
        out = DAILY / f"{target.isoformat()}-brief.md"
        out.write_text(brief, encoding="utf-8")
        print(f"Brief saved to {out}", file=sys.stderr)
    print(brief)

if __name__ == "__main__":
    main()
