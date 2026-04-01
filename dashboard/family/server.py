"""
MERIDIAN v0.1 — Sartor Family Dashboard Backend
FastAPI server on port 5055
"""

import os
import re
import json
import asyncio
import subprocess
import platform
from datetime import datetime, date
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
import anthropic

app = FastAPI(title="MERIDIAN", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Paths
BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent.parent
SARTOR_DIR = REPO_ROOT / "sartor"
MEMORY_DIR = SARTOR_DIR / "memory"
TASKS_DIR = SARTOR_DIR / "tasks"
COSTS_FILE = SARTOR_DIR / "costs.json"
HOME_DIR = Path.home()
REPO_TASKS_DIR = REPO_ROOT / "tasks"
WORK_DIR = REPO_ROOT / "work"
DATA_DIR = REPO_ROOT / "data"

# ── Claude API Setup ──────────────────────────────────────────────────────────

_claude_client = None
_active_claude_sessions = 0
MAX_CLAUDE_SESSIONS = 2
CLAUDE_MODEL = "claude-sonnet-4-6"
CLAUDE_MAX_TOKENS = 4096
TOOL_LOOP_LIMIT = 10

ALLOWED_DIRS = [
    str(SARTOR_DIR.resolve()),
    str(BASE_DIR.parent.parent.resolve()),  # Sartor-claude-network root
]


def get_claude_client():
    global _claude_client
    if _claude_client is not None:
        return _claude_client
    creds_path = HOME_DIR / ".claude" / ".credentials.json"
    try:
        creds = json.loads(creds_path.read_text(encoding="utf-8"))
        token = creds["claudeAiOauth"]["accessToken"]
        _claude_client = anthropic.Anthropic(auth_token=token)
        return _claude_client
    except Exception as e:
        print(f"Failed to load Claude credentials: {e}")
        return None


def _path_allowed(filepath: str) -> bool:
    try:
        resolved = str(Path(filepath).resolve())
        return any(resolved.startswith(d) for d in ALLOWED_DIRS)
    except Exception:
        return False


CLAUDE_TOOLS = [
    {
        "name": "read_file",
        "description": "Read the contents of a file. Restricted to Sartor project directories.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or relative file path"}
            },
            "required": ["path"],
        },
    },
    {
        "name": "search_files",
        "description": "Search for text content across files using grep. Restricted to Sartor directories.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Text or regex pattern to search for"},
                "directory": {"type": "string", "description": "Directory to search in (defaults to sartor/)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "list_directory",
        "description": "List files and directories. Restricted to Sartor directories.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Directory path to list"}
            },
            "required": ["path"],
        },
    },
]


def execute_tool(name: str, input_data: dict) -> str:
    try:
        if name == "read_file":
            filepath = input_data["path"]
            if not _path_allowed(filepath):
                return f"Error: Access denied. Path must be within Sartor project directories."
            p = Path(filepath)
            if not p.exists():
                return f"Error: File not found: {filepath}"
            content = p.read_text(encoding="utf-8", errors="replace")
            if len(content) > 30000:
                content = content[:30000] + "\n... (truncated at 30000 chars)"
            return content

        elif name == "search_files":
            query = input_data["query"]
            directory = input_data.get("directory", str(SARTOR_DIR))
            if not _path_allowed(directory):
                return "Error: Access denied. Directory must be within Sartor project directories."
            try:
                result = subprocess.run(
                    ["grep", "-r", "-n", "-i", "--include=*.md", "--include=*.json",
                     "--include=*.py", "--include=*.txt", query, directory],
                    capture_output=True, text=True, timeout=10
                )
                output = result.stdout
                if not output:
                    return f"No matches found for '{query}' in {directory}"
                if len(output) > 15000:
                    output = output[:15000] + "\n... (truncated)"
                return output
            except subprocess.TimeoutExpired:
                return "Error: Search timed out"
            except FileNotFoundError:
                # grep not available on Windows, use findstr
                try:
                    result = subprocess.run(
                        ["findstr", "/s", "/i", "/n", query, str(Path(directory) / "*.*")],
                        capture_output=True, text=True, timeout=10, shell=True
                    )
                    output = result.stdout
                    if not output:
                        return f"No matches found for '{query}'"
                    if len(output) > 15000:
                        output = output[:15000] + "\n... (truncated)"
                    return output
                except Exception as e:
                    return f"Error searching: {e}"

        elif name == "list_directory":
            dirpath = input_data["path"]
            if not _path_allowed(dirpath):
                return "Error: Access denied. Path must be within Sartor project directories."
            p = Path(dirpath)
            if not p.is_dir():
                return f"Error: Not a directory: {dirpath}"
            entries = []
            for item in sorted(p.iterdir()):
                prefix = "[DIR] " if item.is_dir() else "      "
                entries.append(f"{prefix}{item.name}")
            return "\n".join(entries) if entries else "(empty directory)"

        else:
            return f"Error: Unknown tool '{name}'"
    except Exception as e:
        return f"Error executing {name}: {e}"


def build_system_prompt() -> str:
    today = date.today()
    return f"""You are Claude, the Sartor family's AI assistant, embedded in the MERIDIAN dashboard.
Today is {today.strftime('%A, %B %d, %Y')}.

Family members:
- Alton Sartor (age 41) — Medical Director, AI Innovation & Validation at AstraZeneca. Head of household.
- Aneeta Sartor (age 45) — Medical Director at Neurvati (anti-seizure medication). Wife.
- Vayu Sartor (age 10) — MKA, Grade 5. Son.
- Vishala Sartor (age 8) — MKA, Grade 3. Daughter.
- Vasu Sartor (age 4) — Pre-K. Son.
- Cats: Loki, Ghosty, Pickle

You have read-only tools to access Sartor project files:
- Memory files: {MEMORY_DIR}/ (SELF.md, ALTON.md, FAMILY.md, MACHINES.md, PROJECTS.md, BUSINESS.md, ASTRAZENECA.md, TAXES.md, PROCEDURES.md, LEARNINGS.md)
- Task files: {TASKS_DIR}/ (ACTIVE.md, BACKLOG.md, COMPLETED.md)
- Project root: {BASE_DIR.parent.parent}/

Be warm, concise, and helpful. Use markdown formatting. When asked about family info, tasks, or projects, use your tools to read the relevant files."""


def build_gpu_system_prompt() -> str:
    return build_system_prompt() + """

You also have context about the GPU server setup:
- gpuserver1 is at 192.168.1.100 (RTX 5090, 128GB RAM, Ubuntu 22.04)
- It runs on Vast.ai and needs to be re-listed after reboots
- SSH access: ssh alton@192.168.1.100
- Services: Dashboard (port 5000), Gateway API (port 5001), Safety Research (port 8000)
"""


def read_file_safe(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def parse_birthday_countdown(month: int, day: int) -> int:
    today = date.today()
    bday_this_year = date(today.year, month, day)
    if bday_this_year < today:
        bday_this_year = date(today.year + 1, month, day)
    return (bday_this_year - today).days


def compute_age(birth_year: int, birth_month: int, birth_day: int) -> int:
    today = date.today()
    age = today.year - birth_year
    if (today.month, today.day) < (birth_month, birth_day):
        age -= 1
    return age


# ── GET / ──────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = BASE_DIR / "index.html"
    try:
        return HTMLResponse(content=index_path.read_text(encoding="utf-8"))
    except Exception:
        return HTMLResponse(content="<h1>index.html not found</h1>", status_code=404)


# ── GET /api/greeting ──────────────────────────────────────────────────────────

@app.get("/api/greeting")
async def greeting():
    now = datetime.now()
    hour = now.hour
    if hour < 12:
        period = "Good morning"
    elif hour < 17:
        period = "Good afternoon"
    else:
        period = "Good evening"
    return {
        "greeting": f"{period}, Alton",
        "date": now.strftime("%A, %B %d, %Y"),
        "time": now.strftime("%I:%M %p"),
        "hour": hour,
    }


# ── GET /api/family ────────────────────────────────────────────────────────────

@app.get("/api/family")
async def family():
    members = [
        {
            "name": "Alton",
            "role": "Head of Household",
            "detail": "Medical Director, AI Innovation & Validation — AstraZeneca",
            "birthday_month": 9,
            "birthday_day": 20,
            "birth_year": 1984,
        },
        {
            "name": "Aneeta",
            "role": "Wife",
            "detail": "Medical Director at Neurvati (anti-seizure medication)",
            "birthday_month": 10,
            "birthday_day": 20,
            "birth_year": 1980,
        },
        {
            "name": "Vayu",
            "role": "Son",
            "detail": "MKA — Grade 5",
            "birthday_month": 8,
            "birthday_day": 14,
            "birth_year": 2015,
        },
        {
            "name": "Vishala",
            "role": "Daughter",
            "detail": "MKA — Grade 3",
            "birthday_month": 7,
            "birthday_day": 29,
            "birth_year": 2017,
        },
        {
            "name": "Vasu",
            "role": "Son",
            "detail": "Pre-K",
            "birthday_month": 1,
            "birthday_day": 14,
            "birth_year": 2022,
        },
    ]
    for m in members:
        m["birthday_countdown"] = parse_birthday_countdown(m["birthday_month"], m["birthday_day"])
        if m["birth_year"]:
            m["age"] = compute_age(m["birth_year"], m["birthday_month"], m["birthday_day"])
        else:
            m["age"] = None
        m["birthday_str"] = date(2000, m["birthday_month"], m["birthday_day"]).strftime("%B %d")

    cats = [
        {"name": "Loki", "type": "Cat"},
        {"name": "Ghosty", "type": "Cat"},
        {"name": "Pickle", "type": "Cat"},
    ]
    return {"members": members, "cats": cats}


# ── GET /api/deadlines ─────────────────────────────────────────────────────────

@app.get("/api/deadlines")
async def deadlines():
    today = date.today()
    items = [
        {"date": "2026-04-15", "title": "Personal 1040 filing deadline", "category": "tax"},
        {"date": "2026-04-15", "title": "NJ-1065 (if applicable)", "category": "tax"},
        {"date": "2026-05-15", "title": "Form 990 (Sante Total)", "category": "tax"},
        {"date": "2026-07-04", "title": "Solar roof in-service deadline (ITC eligibility)", "category": "finance"},
        {"date": "2026-07-29", "title": "Vishala's Birthday (9th)", "category": "family"},
        {"date": "2026-08-14", "title": "Vayu's Birthday (11th)", "category": "family"},
        {"date": "2026-08-24", "title": "Vast.ai listing expiry", "category": "business"},
        {"date": "2026-09-15", "title": "Form 1065 extension deadline (Solar Inference LLC)", "category": "tax"},
        {"date": "2026-09-20", "title": "Alton's Birthday (42nd)", "category": "family"},
        {"date": "2026-10-20", "title": "Aneeta's Birthday (46th)", "category": "family"},
        {"date": "2027-01-14", "title": "Vasu's Birthday (5th)", "category": "family"},
    ]
    result = []
    for item in items:
        d = date.fromisoformat(item["date"])
        days = (d - today).days
        if days < 0:
            continue
        urgency = "red" if days < 14 else "amber" if days < 30 else "blue"
        result.append({**item, "days_remaining": days, "urgency": urgency})
    result.sort(key=lambda x: x["days_remaining"])
    return {"deadlines": result}


# ── GET /api/tasks ─────────────────────────────────────────────────────────────

@app.get("/api/tasks")
async def tasks():
    content = read_file_safe(TASKS_DIR / "ACTIVE.md")
    if not content:
        return {"in_progress": [], "completed": [], "pending": []}

    in_progress = []
    completed = []
    pending = []
    current_section = None

    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("## In Progress"):
            current_section = "in_progress"
        elif stripped.startswith("## Completed"):
            current_section = "completed"
        elif stripped.startswith("## Pending"):
            current_section = "pending"
        elif stripped.startswith("- ["):
            # Extract task title
            match = re.match(r"- \[(.)\] \*\*(.+?)\*\*\s*[-–—]?\s*(.*)", stripped)
            if match:
                checked = match.group(1).lower() == "x"
                title = match.group(2)
                desc = match.group(3).strip()
                task = {"title": title, "description": desc, "done": checked}
                if current_section == "in_progress":
                    in_progress.append(task)
                elif current_section == "completed":
                    completed.append(task)
                elif current_section == "pending":
                    pending.append(task)

    return {"in_progress": in_progress, "completed": completed, "pending": pending}


# ── GET /api/system ────────────────────────────────────────────────────────────

@app.get("/api/system")
async def system_status():
    # Ping gpuserver1
    gpu_online = False
    try:
        if platform.system() == "Windows":
            result = subprocess.run(
                ["ping", "-n", "1", "-w", "2000", "192.168.1.100"],
                capture_output=True, text=True, timeout=5
            )
        else:
            result = subprocess.run(
                ["ping", "-c", "1", "-W", "2", "192.168.1.100"],
                capture_output=True, text=True, timeout=5
            )
        gpu_online = result.returncode == 0
    except Exception:
        gpu_online = False

    # Memory file count
    mem_count = 0
    try:
        mem_count = len(list(MEMORY_DIR.glob("*.md")))
    except Exception:
        pass

    # Task file count
    task_count = 0
    try:
        task_count = len(list(TASKS_DIR.glob("*.md")))
    except Exception:
        pass

    return {
        "gpuserver1": {"online": gpu_online, "host": "192.168.1.100"},
        "memory_files": mem_count,
        "task_files": task_count,
        "services": {
            "dashboard": {"port": 5000, "name": "Sartor Dashboard"},
            "gateway": {"port": 5001, "name": "Gateway API"},
            "safety": {"port": 8000, "name": "Safety Research"},
            "meridian": {"port": 5055, "name": "MERIDIAN"},
        },
    }


# ── GET /api/costs ─────────────────────────────────────────────────────────────

@app.get("/api/costs")
async def costs():
    try:
        with open(COSTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return {"daily_limit": 5.0, "spent_today": 0.0, "calls_today": 0, "last_reset": None}

    calls = data.get("calls", [])
    today_str = date.today().isoformat()

    # Compute today's spend
    spent_today = 0.0
    calls_today = 0
    spent_week = 0.0
    spent_month = 0.0
    today = date.today()

    for c in calls:
        try:
            ts = datetime.fromisoformat(c["timestamp"]).date()
            cost = c.get("cost", 0)
            delta = (today - ts).days
            if delta == 0:
                spent_today += cost
                calls_today += 1
            if delta < 7:
                spent_week += cost
            if delta < 30:
                spent_month += cost
        except Exception:
            continue

    return {
        "daily_limit": data.get("daily_limit", 5.0),
        "spent_today": round(spent_today, 4),
        "spent_week": round(spent_week, 4),
        "spent_month": round(spent_month, 4),
        "calls_today": calls_today,
        "total_calls": len(calls),
        "last_reset": data.get("last_reset"),
    }


# ── GET /api/career ────────────────────────────────────────────────────────────

@app.get("/api/career")
async def career():
    return {
        "current_title": "Medical Director, AI Innovation and Validation",
        "division": "Global Patient Safety, AstraZeneca",
        "location": "Delaware (remote 2 days/week from Montclair, NJ)",
        "promotion": {
            "title": "Senior Medical Director, AI Innovation and Validation",
            "location": "NYC (Empire State Building)",
            "salary_range": "$288,059 - $432,089",
            "status": "Posting closed Feb 16, 2026 — Awaiting decision",
        },
        "bonus": {
            "title": "AZ March Bonus",
            "date": "2026-03-15",
            "days_remaining": (date(2026, 3, 15) - date.today()).days,
        },
        "engagements": [
            "OpenAI Red Teaming Network member",
            "Anthropic partnership lead at AZ",
            "Google Cancer AI Symposium participant",
        ],
    }


# ── GET /api/finances ──────────────────────────────────────────────────────

@app.get("/api/finances")
async def finances():
    fin_path = BASE_DIR / "finances.json"
    try:
        with open(fin_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"error": "finances.json not found"}


# ── GET /api/links ─────────────────────────────────────────────────────────────

@app.get("/api/links")
async def links():
    return {
        "links": [
            {"name": "Gmail", "url": "https://mail.google.com", "icon": "mail"},
            {"name": "Google Calendar", "url": "https://calendar.google.com", "icon": "calendar"},
            {"name": "GitHub", "url": "https://github.com/alto84", "icon": "code"},
            {"name": "Safety Dashboard", "url": "http://192.168.1.100:8000", "icon": "shield"},
            {"name": "Claude.ai", "url": "https://claude.ai", "icon": "brain"},
            {"name": "LinkedIn", "url": "https://www.linkedin.com", "icon": "briefcase"},
            {"name": "Weather", "url": "https://weather.gov", "icon": "cloud"},
            {"name": "AZ Internal", "url": "https://astrazeneca.net", "icon": "building"},
            {"name": "Sartor Dashboard", "url": "http://192.168.1.100:5000", "icon": "monitor"},
            {"name": "Gateway API", "url": "http://192.168.1.100:5001", "icon": "server"},
        ]
    }


# ── GET /api/daily-tasks ──────────────────────────────────────────────────────

@app.get("/api/daily-tasks")
async def daily_tasks():
    today_file = REPO_TASKS_DIR / "TODAY.md"
    content = read_file_safe(today_file)
    if not content:
        return {"date": date.today().isoformat(), "todo": [], "completed": [], "log": []}

    todo = []
    completed = []
    log = []
    current_section = None
    parsed_date = date.today().isoformat()

    for line in content.splitlines():
        stripped = line.strip()
        # Extract date from H1 heading
        if stripped.startswith("# Daily Tasks"):
            m = re.search(r"(\d{4}-\d{2}-\d{2})", stripped)
            if m:
                parsed_date = m.group(1)
        elif stripped.startswith("## To Do"):
            current_section = "todo"
        elif stripped.startswith("## Completed"):
            current_section = "completed"
        elif stripped.startswith("## Log"):
            current_section = "log"
        elif current_section == "todo" and stripped.startswith("- [ ]"):
            todo.append(stripped[len("- [ ]"):].strip())
        elif current_section == "completed" and stripped.startswith("- [x]"):
            completed.append(stripped[len("- [x]"):].strip())
        elif current_section == "log" and stripped.startswith("- "):
            log.append(stripped[2:].strip())

    return {"date": parsed_date, "todo": todo, "completed": completed, "log": log}


# ── POST /api/daily-tasks/toggle ──────────────────────────────────────────────

@app.post("/api/daily-tasks/toggle")
async def toggle_daily_task(body: dict):
    task_text = body.get("task", "").strip()
    done = bool(body.get("done", False))

    if not task_text:
        return JSONResponse(status_code=400, content={"error": "task field required"})

    today_file = REPO_TASKS_DIR / "TODAY.md"
    content = read_file_safe(today_file)
    if not content:
        return JSONResponse(status_code=404, content={"error": "TODAY.md not found"})

    lines = content.splitlines()
    new_lines = []
    found = False
    removed_line = None
    current_section = None

    # First pass: find and remove the task from its current location
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("## To Do"):
            current_section = "todo"
        elif stripped.startswith("## Completed"):
            current_section = "completed"
        elif stripped.startswith("## Log"):
            current_section = "log"

        if not found:
            if done and current_section == "todo" and stripped == f"- [ ] {task_text}":
                found = True
                removed_line = f"- [x] {task_text}"
                continue  # skip this line (will re-insert in Completed)
            elif not done and current_section == "completed" and stripped == f"- [x] {task_text}":
                found = True
                removed_line = f"- [ ] {task_text}"
                continue

        new_lines.append(line)

    if not found:
        return JSONResponse(status_code=404, content={"error": f"Task not found: {task_text}"})

    # Second pass: insert in target section and add log entry
    target_section = "## Completed" if done else "## To Do"
    log_entry = f"- {datetime.now().strftime('%I:%M %p')} -- {'Completed' if done else 'Reopened'}: {task_text}"
    final_lines = []
    in_target = False

    for line in new_lines:
        final_lines.append(line)
        stripped = line.strip()
        if stripped == target_section:
            in_target = True
        elif in_target and (stripped.startswith("## ") or stripped == ""):
            if stripped.startswith("## "):
                in_target = False
            elif stripped == "" and in_target:
                final_lines.insert(len(final_lines) - 1, removed_line)
                in_target = False

    # If target section was at end of file without trailing blank line
    if in_target:
        final_lines.append(removed_line)

    # Add log entry in Log section
    log_final = []
    in_log = False
    inserted_log = False
    for line in final_lines:
        log_final.append(line)
        if line.strip() == "## Log":
            in_log = True
        elif in_log and not inserted_log:
            log_final.append(log_entry)
            inserted_log = True
            in_log = False

    if not inserted_log:
        log_final.append("")
        log_final.append("## Log")
        log_final.append(log_entry)

    try:
        today_file.write_text("\n".join(log_final), encoding="utf-8")
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    return {"ok": True, "task": task_text, "done": done}


# ── GET /api/work-status ──────────────────────────────────────────────────────

@app.get("/api/work-status")
async def work_status():
    streams = []
    if not WORK_DIR.is_dir():
        return {"streams": streams}

    for subdir in sorted(WORK_DIR.iterdir()):
        if not subdir.is_dir():
            continue
        status_file = subdir / "status.md"
        if not status_file.exists():
            continue

        content = read_file_safe(status_file)
        state = ""
        issues = 0
        last_updated = ""

        in_state_section = False
        state_lines = []

        for line in content.splitlines():
            stripped = line.strip()
            if stripped.startswith("## Last Updated"):
                m = re.search(r"(\d{4}-\d{2}-\d{2})", stripped)
                if m:
                    last_updated = m.group(1)
            elif stripped == "## Current State":
                in_state_section = True
            elif in_state_section and stripped.startswith("## "):
                in_state_section = False
            elif in_state_section and stripped:
                state_lines.append(stripped)

            if stripped.startswith("- [ ]"):
                issues += 1

        state = " ".join(state_lines).strip()

        streams.append({
            "name": subdir.name,
            "state": state,
            "issues": issues,
            "last_updated": last_updated,
        })

    return {"streams": streams}


# ── GET /api/heartbeat-status ─────────────────────────────────────────────────

_HEARTBEAT_TASKS = [
    {"name": "morning-briefing", "frequency": "Daily 6:30 AM"},
    {"name": "gpu-check", "frequency": "Every 4h"},
    {"name": "market-close-summary", "frequency": "Weekdays 4:30 PM"},
    {"name": "nightly-memory-curation", "frequency": "Daily 11:00 PM"},
    {"name": "weekly-financial-summary", "frequency": "Sundays 8:00 AM"},
    {"name": "weekly-nonprofit-review", "frequency": "Sundays 9:00 AM"},
    {"name": "weekly-skill-evolution", "frequency": "Saturdays 10:00 AM"},
]

@app.get("/api/heartbeat-status")
async def heartbeat_status():
    log_file = DATA_DIR / "heartbeat-log.csv"
    last_runs = {}

    if log_file.exists():
        content = read_file_safe(log_file)
        for line in content.splitlines():
            parts = line.split(",", 3)
            if len(parts) < 3:
                continue
            ts_str, name, status = parts[0].strip(), parts[1].strip(), parts[2].strip()
            # Keep only the most recent entry per task
            if name not in last_runs or ts_str > last_runs[name]["last_run"]:
                last_runs[name] = {"last_run": ts_str, "status": status}

    tasks_out = []
    for task_def in _HEARTBEAT_TASKS:
        name = task_def["name"]
        if name in last_runs:
            tasks_out.append({
                "name": name,
                "last_run": last_runs[name]["last_run"],
                "status": last_runs[name]["status"],
                "frequency": task_def["frequency"],
            })
        else:
            tasks_out.append({
                "name": name,
                "last_run": None,
                "status": "never_run",
                "frequency": task_def["frequency"],
            })

    return {"tasks": tasks_out}


# ── WebSocket /ws/claude ──────────────────────────────────────────────────────

@app.websocket("/ws/claude")
async def ws_claude(ws: WebSocket):
    global _active_claude_sessions
    await ws.accept()

    if _active_claude_sessions >= MAX_CLAUDE_SESSIONS:
        await ws.send_json({"type": "error", "content": "Max concurrent sessions reached. Try again later."})
        await ws.close()
        return

    _active_claude_sessions += 1
    messages = []

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            if data.get("type") == "clear":
                messages = []
                await ws.send_json({"type": "cleared"})
                continue

            if data.get("type") != "chat":
                continue

            prompt = data.get("prompt", "").strip()
            if not prompt:
                continue

            messages.append({"role": "user", "content": prompt})

            client = get_claude_client()
            if not client:
                await ws.send_json({"type": "error", "content": "Claude API not configured. Check credentials."})
                continue

            # Tool use loop
            tool_iterations = 0
            while tool_iterations < TOOL_LOOP_LIMIT:
                tool_iterations += 1
                assistant_text = ""
                tool_uses = []

                try:
                    with client.messages.stream(
                        model=CLAUDE_MODEL,
                        max_tokens=CLAUDE_MAX_TOKENS,
                        system=build_system_prompt(),
                        tools=CLAUDE_TOOLS,
                        messages=messages,
                    ) as stream:
                        for event in stream:
                            if event.type == "content_block_start":
                                if event.content_block.type == "tool_use":
                                    tool_uses.append({
                                        "id": event.content_block.id,
                                        "name": event.content_block.name,
                                        "input_json": "",
                                    })
                                    await ws.send_json({
                                        "type": "tool_start",
                                        "name": event.content_block.name,
                                    })
                            elif event.type == "content_block_delta":
                                if hasattr(event.delta, "text"):
                                    assistant_text += event.delta.text
                                    await ws.send_json({
                                        "type": "text_delta",
                                        "content": event.delta.text,
                                    })
                                elif hasattr(event.delta, "partial_json"):
                                    if tool_uses:
                                        tool_uses[-1]["input_json"] += event.delta.partial_json

                    # Build the full assistant message content
                    assistant_content = []
                    if assistant_text:
                        assistant_content.append({"type": "text", "text": assistant_text})
                    for tu in tool_uses:
                        try:
                            inp = json.loads(tu["input_json"]) if tu["input_json"] else {}
                        except json.JSONDecodeError:
                            inp = {}
                        assistant_content.append({
                            "type": "tool_use",
                            "id": tu["id"],
                            "name": tu["name"],
                            "input": inp,
                        })

                    messages.append({"role": "assistant", "content": assistant_content})

                    if not tool_uses:
                        # No tools requested — done
                        break

                    # Execute tools and feed results back
                    tool_results = []
                    for tu in tool_uses:
                        try:
                            inp = json.loads(tu["input_json"]) if tu["input_json"] else {}
                        except json.JSONDecodeError:
                            inp = {}
                        result_text = execute_tool(tu["name"], inp)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tu["id"],
                            "content": result_text,
                        })
                        # Send tool result to frontend for display
                        preview = result_text[:500] + ("..." if len(result_text) > 500 else "")
                        await ws.send_json({
                            "type": "tool_result",
                            "name": tu["name"],
                            "content": preview,
                        })

                    messages.append({"role": "user", "content": tool_results})

                except anthropic.APIError as e:
                    await ws.send_json({"type": "error", "content": f"API error: {e.message}"})
                    break
                except Exception as e:
                    await ws.send_json({"type": "error", "content": f"Error: {str(e)}"})
                    break

            await ws.send_json({"type": "done"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "content": f"Connection error: {str(e)}"})
        except Exception:
            pass
    finally:
        _active_claude_sessions -= 1


# ── GPU Server Control ────────────────────────────────────────────────────────

@app.get("/api/gpu/status")
async def gpu_status():
    """Check GPU server SSH connectivity and running services."""
    result = {"online": False, "ssh": False, "services": {}}
    try:
        if platform.system() == "Windows":
            ping = subprocess.run(
                ["ping", "-n", "1", "-w", "2000", "192.168.1.100"],
                capture_output=True, text=True, timeout=5
            )
        else:
            ping = subprocess.run(
                ["ping", "-c", "1", "-W", "2", "192.168.1.100"],
                capture_output=True, text=True, timeout=5
            )
        result["online"] = ping.returncode == 0
    except Exception:
        pass

    if result["online"]:
        try:
            ssh = subprocess.run(
                ["ssh", "-o", "ConnectTimeout=3", "-o", "StrictHostKeyChecking=no",
                 "alton@192.168.1.100", "echo ok"],
                capture_output=True, text=True, timeout=8
            )
            result["ssh"] = ssh.returncode == 0 and "ok" in ssh.stdout
        except Exception:
            pass

        if result["ssh"]:
            for svc, port in [("dashboard", 5000), ("gateway", 5001), ("safety", 8000)]:
                try:
                    check = subprocess.run(
                        ["ssh", "-o", "ConnectTimeout=3", "alton@192.168.1.100",
                         f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{port}/ 2>/dev/null || echo down"],
                        capture_output=True, text=True, timeout=10
                    )
                    output = check.stdout.strip()
                    result["services"][svc] = output not in ("down", "") and check.returncode == 0
                except Exception:
                    result["services"][svc] = False

    return result


@app.post("/api/gpu/command")
async def gpu_command(body: dict):
    """Execute a predefined command on gpuserver1 via SSH."""
    allowed_commands = {
        "start_dashboard": "cd ~/Sartor-claude-network && nohup python3 -m flask --app sartor/dashboard/app run --host 0.0.0.0 --port 5000 > /tmp/dashboard.log 2>&1 & echo started",
        "start_gateway": "cd ~/Sartor-claude-network && nohup python3 sartor/gateway/gateway.py > /tmp/gateway.log 2>&1 & echo started",
        "start_safety": "cd ~/safety-research-system && nohup python3 -m uvicorn src.api.app:app --host 0.0.0.0 --port 8000 > /tmp/safety.log 2>&1 & echo started",
        "check_gpu": "nvidia-smi --query-gpu=name,memory.total,memory.used,temperature.gpu,utilization.gpu --format=csv,noheader 2>/dev/null || echo 'nvidia-smi not available'",
        "check_disk": "df -h / /home 2>/dev/null | tail -n +2",
        "check_memory": "free -h | head -2",
        "list_processes": "ps aux --sort=-%mem | head -15",
        "uptime": "uptime",
    }

    cmd_name = body.get("command", "")
    if cmd_name not in allowed_commands:
        return JSONResponse(
            status_code=400,
            content={"error": f"Unknown command: {cmd_name}. Allowed: {list(allowed_commands.keys())}"}
        )

    try:
        result = subprocess.run(
            ["ssh", "-o", "ConnectTimeout=5", "-o", "StrictHostKeyChecking=no",
             "alton@192.168.1.100", allowed_commands[cmd_name]],
            capture_output=True, text=True, timeout=30
        )
        return {
            "command": cmd_name,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return JSONResponse(status_code=504, content={"error": "Command timed out"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print("MERIDIAN v0.1 — Starting on http://localhost:5055")
    uvicorn.run(app, host="0.0.0.0", port=5055)
