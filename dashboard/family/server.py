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
import secrets
from datetime import datetime, date
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
import anthropic

# ── Auth ──────────────────────────────────────────────────────────────────────

_MERIDIAN_DEV = os.environ.get("MERIDIAN_DEV", "") == "1"
_http_basic = HTTPBasic(auto_error=not _MERIDIAN_DEV)

def _load_password() -> str:
    secrets_path = Path(__file__).resolve().parent.parent.parent / ".secrets" / "meridian-password.txt"
    try:
        return secrets_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        raise RuntimeError(f"meridian-password.txt not found at {secrets_path}")

_MERIDIAN_PASSWORD: str = _load_password()


def require_auth(credentials: HTTPBasicCredentials = Depends(_http_basic)) -> str:
    if _MERIDIAN_DEV:
        return "dev"
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )
    correct_username = secrets.compare_digest(credentials.username.encode(), b"alton")
    correct_password = secrets.compare_digest(
        credentials.password.encode(), _MERIDIAN_PASSWORD.encode()
    )
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

app = FastAPI(title="MERIDIAN", version="0.1.0", dependencies=[Depends(require_auth)])
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


@app.get("/meridian-theme.css")
async def serve_theme_css():
    css_path = BASE_DIR / "meridian-theme.css"
    try:
        return HTMLResponse(content=css_path.read_text(encoding="utf-8"), media_type="text/css")
    except Exception:
        return HTMLResponse(content="/* not found */", media_type="text/css", status_code=404)


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
            "dashboard": {"port": 5000, "name": "Sartor Dashboard", "note": "May be down on gpuserver1"},
            "gateway": {"port": 5001, "name": "Gateway API", "note": "May be down on gpuserver1"},
            "safety": {"port": 8000, "name": "Safety Research"},
            "meridian": {"port": 5055, "name": "MERIDIAN"},
        },
    }


# ── GET /api/costs ─────────────────────────────────────────────────────────────

@app.get("/api/costs")
async def costs():
    # Load costs.json
    try:
        with open(COSTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = {"daily_limit": 5.0, "calls": [], "last_reset": None}

    calls = data.get("calls", [])
    today_val = date.today()

    # Compute from costs.json
    spent_today = 0.0
    calls_today = 0
    spent_week = 0.0
    spent_month = 0.0

    for c in calls:
        try:
            ts = datetime.fromisoformat(c["timestamp"]).date()
            cost = c.get("cost", 0)
            delta = (today_val - ts).days
            if delta == 0:
                spent_today += cost
                calls_today += 1
            if delta < 7:
                spent_week += cost
            if delta < 30:
                spent_month += cost
        except Exception:
            continue

    # Also aggregate costs from heartbeat-log.csv
    heartbeat_log = DATA_DIR / "heartbeat-log.csv"
    heartbeat_costs_today = 0.0
    heartbeat_costs_week = 0.0
    heartbeat_costs_month = 0.0
    heartbeat_calls = 0
    if heartbeat_log.exists():
        for line in read_file_safe(heartbeat_log).splitlines():
            parts = line.split(",")
            if len(parts) < 6 or parts[0].strip() == "timestamp":
                continue
            try:
                ts = datetime.fromisoformat(parts[0].strip()).date()
                cost = float(parts[5].strip())
                delta = (today_val - ts).days
                heartbeat_calls += 1
                if delta == 0:
                    heartbeat_costs_today += cost
                if delta < 7:
                    heartbeat_costs_week += cost
                if delta < 30:
                    heartbeat_costs_month += cost
            except (ValueError, IndexError):
                continue

    return {
        "daily_limit": data.get("daily_limit", 5.0),
        "spent_today": round(spent_today + heartbeat_costs_today, 4),
        "spent_week": round(spent_week + heartbeat_costs_week, 4),
        "spent_month": round(spent_month + heartbeat_costs_month, 4),
        "calls_today": calls_today,
        "total_calls": len(calls) + heartbeat_calls,
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
            "status": "paid",
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
        return {"date": date.today().isoformat(), "todos": [], "completed": [], "log": []}

    todos = []
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
        # Match all task-bearing sections (To Do, Urgent, This Week, etc.)
        elif stripped.startswith("## Completed"):
            current_section = "completed"
        elif stripped.startswith("## Log"):
            current_section = "log"
        elif stripped.startswith("## "):
            # Any other H2 section (Urgent, This Week, To Do, etc.) is a todo section
            current_section = "todo"
        elif current_section == "todo" and stripped.startswith("- [ ]"):
            text = re.sub(r'\[.*?\]\(.*?\)', lambda m: m.group(0).split(']')[0][1:], stripped[len("- [ ]"):].strip())
            todos.append({"text": text, "done": False})
        elif current_section == "todo" and stripped.startswith("- [x]"):
            text = re.sub(r'\[.*?\]\(.*?\)', lambda m: m.group(0).split(']')[0][1:], stripped[len("- [x]"):].strip())
            todos.append({"text": text, "done": True})
        elif current_section == "completed" and stripped.startswith("- [x]"):
            text = re.sub(r'\[.*?\]\(.*?\)', lambda m: m.group(0).split(']')[0][1:], stripped[len("- [x]"):].strip())
            completed.append({"text": text, "done": True})
        elif current_section == "completed" and stripped.startswith("- [ ]"):
            text = re.sub(r'\[.*?\]\(.*?\)', lambda m: m.group(0).split(']')[0][1:], stripped[len("- [ ]"):].strip())
            completed.append({"text": text, "done": False})
        elif current_section == "log" and stripped.startswith("- "):
            log.append(stripped[2:].strip())

    return {"date": parsed_date, "todos": todos, "completed": completed, "log": log}


# ── POST /api/daily-tasks/toggle ──────────────────────────────────────────────

@app.post("/api/daily-tasks/toggle")
async def toggle_daily_task(body: dict):
    task_text = body.get("task", body.get("text", "")).strip()
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
        if stripped.startswith("## Completed"):
            current_section = "completed"
        elif stripped.startswith("## Log"):
            current_section = "log"
        elif stripped.startswith("## "):
            current_section = "todo"

        if not found:
            # Match task text ignoring markdown link suffixes
            bare_line = re.sub(r'\s*[-—]\s*\[.*?\]\(.*?\)', '', stripped)
            if done and current_section == "todo" and bare_line == f"- [ ] {task_text}":
                found = True
                removed_line = f"- [x] {task_text}"
                continue
            elif done and current_section == "todo" and stripped.startswith("- [ ]") and task_text in stripped:
                found = True
                removed_line = stripped.replace("- [ ]", "- [x]", 1)
                continue
            elif not done and current_section == "completed" and stripped.startswith("- [x]") and task_text in stripped:
                found = True
                removed_line = stripped.replace("- [x]", "- [ ]", 1)
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
    {"name": "gpu-utilization-check", "frequency": "Every 4h"},
    {"name": "market-close-summary", "frequency": "Weekdays 4:30 PM"},
    {"name": "nightly-memory-curation", "frequency": "Daily 11:00 PM"},
    {"name": "weekly-financial-summary", "frequency": "Sundays 8:00 AM"},
    {"name": "weekly-nonprofit-review", "frequency": "Sundays 9:00 AM"},
    {"name": "weekly-skill-evolution", "frequency": "Saturdays 10:00 AM"},
    {"name": "personal-data-gather", "frequency": "Daily"},
    {"name": "self-improvement-loop", "frequency": "On demand"},
    {"name": "health-check", "frequency": "Every run"},
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


# ── GET /api/memory-health ────────────────────────────────────────────────────

@app.get("/api/memory-health")
async def memory_health():
    memory_dir = REPO_ROOT / "sartor" / "memory"
    meta_dir = memory_dir / ".meta"

    # Use the decay system for tier classification
    try:
        import sys
        sys.path.insert(0, str(memory_dir))
        from decay import compute_all_scores, get_health_summary
        decay_scores = compute_all_scores()
    except Exception:
        decay_scores = {}

    files = []
    for f in sorted(memory_dir.glob("*.md")):
        stat = f.stat()
        age_days = (datetime.now().timestamp() - stat.st_mtime) / 86400
        entry = decay_scores.get(f.name, {})
        tier = entry.get("tier", "COLD")
        score = entry.get("score", 0.0)
        files.append({
            "name": f.name,
            "size": stat.st_size,
            "age_days": round(age_days, 1),
            "tier": tier,
            "score": round(score, 4),
        })

    consolidation_log = meta_dir / "consolidation-log.md"
    last_dream = None
    if consolidation_log.exists():
        content = consolidation_log.read_text(encoding="utf-8", errors="replace")
        dates = re.findall(r'\d{4}-\d{2}-\d{2}', content)
        if dates:
            last_dream = dates[-1]

    tiers = {"ACTIVE": 0, "WARM": 0, "COLD": 0, "FORGOTTEN": 0, "ARCHIVE": 0}
    for f in files:
        tiers[f["tier"]] = tiers.get(f["tier"], 0) + 1

    return {
        "file_count": len(files),
        "total_size_kb": sum(f["size"] for f in files) // 1024,
        "files": files,
        "tiers": tiers,
        "last_autodream": last_dream,
        "daily_log_count": len(list((memory_dir / "daily").glob("*.md"))) if (memory_dir / "daily").exists() else 0
    }


# ── GET /api/observer-report ──────────────────────────────────────────────────

@app.get("/api/observer-report")
async def observer_report():
    log_path = REPO_ROOT / "data" / "observer-log.jsonl"

    entries = {"sentinel": None, "auditor": None, "critic": None}
    if log_path.exists():
        for line in log_path.read_text(encoding="utf-8", errors="replace").strip().split("\n"):
            if line.strip():
                try:
                    entry = json.loads(line)
                    observer = entry.get("observer", "")
                    if observer in entries:
                        entries[observer] = entry
                except json.JSONDecodeError:
                    pass

    fixes_path = REPO_ROOT / "docs" / "proposed-fixes.md"
    pending_fixes = 0
    if fixes_path.exists():
        content = fixes_path.read_text(encoding="utf-8", errors="replace")
        pending_fixes = content.count("- [ ]")

    return {
        "observers": entries,
        "pending_fixes": pending_fixes,
        "status": "healthy" if all(
            e and e.get("failed", 0) == 0 for e in entries.values() if e
        ) else "issues" if any(entries.values()) else "no_data"
    }


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


@app.get("/api/gpu/rental")
async def gpu_rental():
    """
    Proxy data from the gpuserver1 dashboard at http://192.168.1.100:5060.
    Returns rental status, GPU activity, and recent rental log for the home dashboard widget.
    """
    import urllib.request
    import urllib.error

    base = "http://192.168.1.100:5060"
    out = {"online": False, "gpu": None, "vastai": None, "rentals": []}

    def fetch_json(path: str, timeout: int = 4):
        try:
            with urllib.request.urlopen(f"{base}{path}", timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            return None

    gpu = fetch_json("/api/gpu")
    vastai = fetch_json("/api/vastai")

    if gpu is None and vastai is None:
        return out

    out["online"] = True
    if gpu:
        out["gpu"] = {
            "util_pct": gpu.get("utilization_pct"),
            "mem_used_mb": gpu.get("memory_used_mb"),
            "mem_total_mb": gpu.get("memory_total_mb"),
            "temp_c": gpu.get("temperature_c"),
            "power_w": gpu.get("power_draw_w"),
            "name": gpu.get("gpu_name"),
        }
    if vastai:
        out["vastai"] = {
            "machine_status": vastai.get("machine_status"),
            "is_rented": vastai.get("is_rented"),
            "current_rental": vastai.get("current_rental"),
            "hourly_rate": vastai.get("hourly_rate"),
            "earnings_today": vastai.get("earnings_today"),
            "earnings_week": vastai.get("earnings_week"),
            "earnings_month": vastai.get("earnings_month"),
            "reliability": vastai.get("reliability"),
        }
        out["rentals"] = (vastai.get("rental_log") or [])[-5:]

    return out


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


# ── GET /api/memory-graph ─────────────────────────────────────────────────────

_CLUSTER_MAP = {
    "FAMILY.md": "family",
    "ALTON.md": "personal",
    "SELF.md": "personal",
    "BUSINESS.md": "business",
    "MACHINES.md": "business",
    "TAXES.md": "taxes",
    "ASTRAZENECA.md": "career",
    "PROJECTS.md": "projects",
    "MASTERPLAN.md": "projects",
    "MASTERPLAN-VISIONARY.md": "projects",
    "LEARNINGS.md": "projects",
    "PROCEDURES.md": "business",
    "INDEX.md": "projects",
}

_CLUSTER_COLORS = {
    "family": "#3b82f6",
    "business": "#22c55e",
    "taxes": "#ef4444",
    "career": "#a855f7",
    "personal": "#f59e0b",
    "projects": "#14b8a6",
}


@app.get("/api/memory-graph")
async def memory_graph():
    memory_dir = REPO_ROOT / "sartor" / "memory"
    nodes = []
    links = []
    file_contents = {}

    # Load decay scores for tier info
    try:
        import sys
        sys.path.insert(0, str(memory_dir))
        from decay import compute_all_scores
        decay_scores = compute_all_scores()
    except Exception:
        decay_scores = {}

    # Read all .md files
    for f in sorted(memory_dir.glob("*.md")):
        content = read_file_safe(f)
        file_contents[f.name] = content
        stat = f.stat()
        decay_entry = decay_scores.get(f.name, {})

        cluster = _CLUSTER_MAP.get(f.name, "projects")
        nodes.append({
            "id": f.name,
            "label": f.stem,
            "type": "file",
            "size": stat.st_size,
            "cluster": cluster,
            "color": _CLUSTER_COLORS.get(cluster, "#6366f1"),
            "tier": decay_entry.get("tier", "COLD"),
            "score": decay_entry.get("score", 0.0),
            "preview": content[:500] if content else "",
        })

        # Extract section headings as sub-nodes
        for line in content.splitlines():
            m = re.match(r'^##\s+(.+)', line)
            if m:
                heading = m.group(1).strip()
                sub_id = f"{f.name}::{heading}"
                nodes.append({
                    "id": sub_id,
                    "label": heading,
                    "type": "section",
                    "size": 200,
                    "cluster": cluster,
                    "color": _CLUSTER_COLORS.get(cluster, "#6366f1"),
                    "tier": decay_entry.get("tier", "COLD"),
                    "score": 0,
                    "preview": "",
                })
                links.append({
                    "source": f.name,
                    "target": sub_id,
                    "weight": 0.3,
                })

    # Extract [[wiki links]] between files
    node_ids = {n["id"] for n in nodes}
    file_names = {f.stem.upper(): f.name for f in memory_dir.glob("*.md")}

    for fname, content in file_contents.items():
        # Match [[Link]] patterns
        wiki_links = re.findall(r'\[\[([^\]]+)\]\]', content)
        for link_text in wiki_links:
            # Try to resolve to a file
            target = None
            link_upper = link_text.strip().upper().replace(" ", "")
            for stem_upper, full_name in file_names.items():
                if link_upper == stem_upper or link_upper == stem_upper.replace(".MD", ""):
                    target = full_name
                    break
            if target and target != fname:
                links.append({"source": fname, "target": target, "weight": 1.0})

        # Also look for markdown links to other memory files
        md_links = re.findall(r'\[.*?\]\(([^)]+\.md)\)', content)
        for md_link in md_links:
            target_name = Path(md_link).name
            if target_name in file_contents and target_name != fname:
                links.append({"source": fname, "target": target_name, "weight": 0.7})

        # Look for plain references to other file names
        for other_fname in file_contents:
            if other_fname != fname:
                stem = Path(other_fname).stem
                if stem in content and len(stem) > 3:
                    links.append({"source": fname, "target": other_fname, "weight": 0.4})

    # Deduplicate links
    seen = set()
    deduped_links = []
    for link in links:
        key = (link["source"], link["target"])
        if key not in seen:
            seen.add(key)
            deduped_links.append(link)

    return {
        "nodes": nodes,
        "links": deduped_links,
        "clusters": _CLUSTER_COLORS,
    }


# ── GET /api/heartbeat-live ──────────────────────────────────────────────────

@app.get("/api/heartbeat-live")
async def heartbeat_live():
    log_file = DATA_DIR / "heartbeat-log.csv"
    if not log_file.exists():
        return {"last_tick": None, "recent": []}

    content = read_file_safe(log_file)
    lines = [l for l in content.splitlines() if l.strip() and not l.startswith("timestamp")]
    # Get last 10 entries
    recent_lines = lines[-10:] if len(lines) > 10 else lines
    recent = []
    last_tick = None
    for line in reversed(recent_lines):
        parts = line.split(",")
        if len(parts) >= 3:
            ts = parts[0].strip()
            name = parts[1].strip()
            status = parts[2].strip()
            recent.append({"timestamp": ts, "task": name, "status": status})
            if last_tick is None:
                last_tick = ts

    return {"last_tick": last_tick, "recent": recent}


# ── GET /api/memory-recent ───────────────────────────────────────────────────

_MEMORY_RECENT_CACHE: dict = {}
_MEMORY_RECENT_CACHE_TS: float = 0.0
_MEMORY_RECENT_CACHE_TTL = 60.0

import time as _time

@app.get("/api/memory-recent")
async def memory_recent():
    global _MEMORY_RECENT_CACHE, _MEMORY_RECENT_CACHE_TS
    now = _time.monotonic()
    if now - _MEMORY_RECENT_CACHE_TS < _MEMORY_RECENT_CACHE_TTL and _MEMORY_RECENT_CACHE:
        return _MEMORY_RECENT_CACHE

    cutoff = datetime.now().timestamp() - 86400  # 24h
    entries = []

    # Recent from curator-log.jsonl
    curator_log = MEMORY_DIR / ".meta" / "curator-log.jsonl"
    if curator_log.exists():
        for line in read_file_safe(curator_log).splitlines():
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
                ts = rec.get("timestamp", "")
                if ts:
                    try:
                        t = datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
                        if t >= cutoff:
                            entries.append({
                                "timestamp": ts,
                                "source_machine": "rocinante",
                                "destination": "curator",
                                "action": rec.get("action", "curator-run"),
                                "entity": rec.get("file", ""),
                            })
                    except ValueError:
                        pass
            except json.JSONDecodeError:
                pass

    # Recent from extractor-log.jsonl
    extractor_log = MEMORY_DIR / ".meta" / "extractor-log.jsonl"
    if extractor_log.exists():
        for line in read_file_safe(extractor_log).splitlines():
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
                ts = rec.get("timestamp", "")
                if ts:
                    try:
                        t = datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
                        if t >= cutoff:
                            entries.append({
                                "timestamp": ts,
                                "source_machine": "rocinante",
                                "destination": "extractor",
                                "action": "extract",
                                "entity": f"{rec.get('proposals_written', 0)} proposals",
                            })
                    except ValueError:
                        pass
            except json.JSONDecodeError:
                pass

    # Recent drained files from inbox
    inbox_dir = MEMORY_DIR / "inbox"
    if inbox_dir.exists():
        for machine_dir in inbox_dir.iterdir():
            if not machine_dir.is_dir() or machine_dir.name.startswith("."):
                continue
            machine = machine_dir.name
            # Check _processed / _archive subdirs for recently drained items
            for drain_dir_name in ("_processed", "_archive", "_curator_logs"):
                drain_dir = machine_dir / drain_dir_name
                if not drain_dir.is_dir():
                    continue
                for f in drain_dir.iterdir():
                    if not f.is_file():
                        continue
                    try:
                        mtime = f.stat().st_mtime
                        if mtime >= cutoff:
                            entries.append({
                                "timestamp": datetime.fromtimestamp(mtime).isoformat(),
                                "source_machine": machine,
                                "destination": "memory",
                                "action": "drained",
                                "entity": f.name,
                            })
                    except OSError:
                        pass

    entries.sort(key=lambda x: x["timestamp"], reverse=True)
    result = {"entries": entries[:50], "total": len(entries)}
    _MEMORY_RECENT_CACHE = result
    _MEMORY_RECENT_CACHE_TS = now
    return result


# ── GET /api/cron-health ─────────────────────────────────────────────────────

_CRON_HEALTH_CACHE: dict = {}
_CRON_HEALTH_CACHE_TS: float = 0.0
_CRON_HEALTH_CACHE_TTL = 120.0

_SCHEDULED_TASKS_DIR = REPO_ROOT / ".claude" / "scheduled-tasks"

_CRON_DEFS = [
    {"name": "morning-briefing",      "machine": "rocinante", "schedule": "0 6 * * *",  "interval_h": 24},
    {"name": "nightly-memory-curation","machine": "rocinante","schedule": "0 23 * * *", "interval_h": 24},
    {"name": "gpu-utilization-check", "machine": "rocinante", "schedule": "0 */4 * * *","interval_h": 4},
    {"name": "market-close-summary",  "machine": "rocinante", "schedule": "30 16 * * 1-5","interval_h": 24},
    {"name": "weekly-financial-summary","machine":"rocinante","schedule": "0 6 * * 0",  "interval_h": 168},
    {"name": "wiki-reindex",          "machine": "rocinante", "schedule": "0 2 * * *",  "interval_h": 24},
]


@app.get("/api/cron-health")
async def cron_health():
    global _CRON_HEALTH_CACHE, _CRON_HEALTH_CACHE_TS
    now = _time.monotonic()
    if now - _CRON_HEALTH_CACHE_TS < _CRON_HEALTH_CACHE_TTL and _CRON_HEALTH_CACHE:
        return _CRON_HEALTH_CACHE

    # Build last-run map from heartbeat-log.csv
    heartbeat_log = DATA_DIR / "heartbeat-log.csv"
    last_runs: dict[str, dict] = {}
    if heartbeat_log.exists():
        for line in read_file_safe(heartbeat_log).splitlines():
            parts = line.split(",", 4)
            if len(parts) < 3 or parts[0].strip() == "timestamp":
                continue
            ts_str = parts[0].strip()
            name = parts[1].strip()
            status = parts[2].strip()
            log_tail = parts[4].strip() if len(parts) > 4 else ""
            if name not in last_runs or ts_str > last_runs[name]["last_run"]:
                last_runs[name] = {"last_run": ts_str, "last_status": status, "last_log_tail": log_tail}

    # Also check curator-log.jsonl for nightly-memory-curation
    curator_log = MEMORY_DIR / ".meta" / "curator-log.jsonl"
    if curator_log.exists():
        lines = [l for l in read_file_safe(curator_log).splitlines() if l.strip()]
        if lines:
            try:
                last = json.loads(lines[-1])
                ts = last.get("timestamp", "")
                if ts and ("nightly-memory-curation" not in last_runs or ts > last_runs["nightly-memory-curation"]["last_run"]):
                    last_runs["nightly-memory-curation"] = {
                        "last_run": ts,
                        "last_status": "ok",
                        "last_log_tail": f"facts_written={last.get('facts_written', '?')} files_updated={last.get('files_updated', '?')}",
                    }
            except (json.JSONDecodeError, KeyError):
                pass

    # Try gpuserver1 heartbeat via SSH
    gpu_heartbeat = None
    try:
        res = subprocess.run(
            ["ssh", "-o", "ConnectTimeout=3", "-o", "StrictHostKeyChecking=no",
             "alton@192.168.1.100", "cat /home/alton/sartor-heartbeat.json 2>/dev/null || echo null"],
            capture_output=True, text=True, timeout=6
        )
        if res.returncode == 0 and res.stdout.strip() not in ("null", ""):
            gpu_heartbeat = json.loads(res.stdout.strip())
    except Exception:
        pass

    now_ts = datetime.now().timestamp()
    crons = []
    for cdef in _CRON_DEFS:
        name = cdef["name"]
        machine = cdef["machine"]
        interval_h = cdef["interval_h"]
        lr = last_runs.get(name)
        last_run = lr["last_run"] if lr else None
        last_status = lr["last_status"] if lr else "never_run"
        last_log_tail = lr["last_log_tail"] if lr else ""

        # Compute health color
        color = "grey"
        if last_run:
            try:
                lr_ts = datetime.fromisoformat(last_run.replace("Z", "+00:00")).timestamp()
                age_h = (now_ts - lr_ts) / 3600
                if age_h <= interval_h * 1.1:
                    color = "green"
                elif age_h <= interval_h * 2.0:
                    color = "yellow"
                else:
                    color = "red"
                if last_status not in ("ok", "success", ""):
                    color = "red"
            except ValueError:
                color = "grey"

        crons.append({
            "name": name,
            "machine": machine,
            "schedule": cdef["schedule"],
            "last_run": last_run,
            "last_status": last_status,
            "last_log_tail": last_log_tail,
            "health": color,
            "gpu_heartbeat": gpu_heartbeat if machine == "gpuserver1" else None,
        })

    result = {"crons": crons, "gpu_heartbeat": gpu_heartbeat}
    _CRON_HEALTH_CACHE = result
    _CRON_HEALTH_CACHE_TS = now
    return result


# ── GET /api/inbox-status ────────────────────────────────────────────────────

@app.get("/api/inbox-status")
async def inbox_status():
    inbox_dir = MEMORY_DIR / "inbox"
    machines = []
    skip_dirs = {".drained", ".receipts", "_archive", "_processed", "_flagged", "_curator_logs", "_curator_staging"}

    if not inbox_dir.exists():
        return {"machines": machines}

    for machine_dir in sorted(inbox_dir.iterdir()):
        if not machine_dir.is_dir() or machine_dir.name.startswith("."):
            continue
        machine = machine_dir.name
        pending_files = []
        flagged = 0

        for item in machine_dir.iterdir():
            if item.name.startswith("_") or item.name in skip_dirs or item.is_dir():
                continue
            if not item.is_file():
                continue
            try:
                mtime = item.stat().st_mtime
                # Check for missing schema fields (simple heuristic: no frontmatter)
                content = read_file_safe(item)
                has_frontmatter = content.startswith("---")
                pending_files.append({"name": item.name, "mtime": mtime, "has_frontmatter": has_frontmatter})
                if not has_frontmatter:
                    flagged += 1
            except OSError:
                pass

        pending_files.sort(key=lambda x: x["mtime"])
        count = len(pending_files)
        oldest_age_h = None
        newest_ts = None
        if pending_files:
            oldest_age_h = round((datetime.now().timestamp() - pending_files[0]["mtime"]) / 3600, 1)
            newest_ts = datetime.fromtimestamp(pending_files[-1]["mtime"]).isoformat()

        machines.append({
            "machine": machine,
            "pending_count": count,
            "oldest_age_h": oldest_age_h,
            "newest_entry_ts": newest_ts,
            "flagged_count": flagged,
        })

    return {"machines": machines}


# ── GET /api/memory-search ───────────────────────────────────────────────────

_SEARCH_CACHE: dict[str, tuple[float, list]] = {}
_SEARCH_CACHE_TTL = 60.0

@app.get("/api/memory-search")
async def memory_search(q: str = ""):
    q = q.strip()
    if not q:
        return {"hits": [], "query": ""}

    now = _time.monotonic()
    cache_key = q.lower()
    if cache_key in _SEARCH_CACHE:
        ts, hits = _SEARCH_CACHE[cache_key]
        if now - ts < _SEARCH_CACHE_TTL:
            return {"hits": hits, "query": q}

    hits = []

    # Try sartor/memory/search.py BM25 first
    search_script = MEMORY_DIR / "search.py"
    if search_script.exists():
        try:
            res = subprocess.run(
                ["python", str(search_script), q],
                capture_output=True, text=True, timeout=10,
                cwd=str(MEMORY_DIR)
            )
            if res.returncode == 0:
                for line in res.stdout.splitlines()[:20]:
                    line = line.strip()
                    if not line:
                        continue
                    # Try to parse "path:line: snippet" format
                    m = re.match(r"^(.+?):(\d+):\s*(.*)", line)
                    if m:
                        hits.append({
                            "path": m.group(1).strip(),
                            "line": int(m.group(2)),
                            "snippet": m.group(3).strip()[:200],
                        })
                    else:
                        hits.append({"path": line, "line": 0, "snippet": ""})
        except Exception:
            pass

    # Fallback: grep/findstr over memory .md files
    if not hits:
        try:
            if platform.system() == "Windows":
                result = subprocess.run(
                    ["grep", "-r", "-n", "-i", "--include=*.md", q, str(MEMORY_DIR)],
                    capture_output=True, text=True, timeout=10
                )
            else:
                result = subprocess.run(
                    ["grep", "-r", "-n", "-i", "--include=*.md", q, str(MEMORY_DIR)],
                    capture_output=True, text=True, timeout=10
                )
            for line in (result.stdout or "").splitlines()[:20]:
                # Parse grep output: filepath:lineno:content
                m = re.match(r"^(.+?):(\d+):\s*(.*)", line)
                if m:
                    rel_path = str(Path(m.group(1)).relative_to(MEMORY_DIR)) if str(m.group(1)).startswith(str(MEMORY_DIR)) else m.group(1)
                    hits.append({
                        "path": rel_path,
                        "line": int(m.group(2)),
                        "snippet": m.group(3).strip()[:200],
                    })
        except Exception:
            pass

    _SEARCH_CACHE[cache_key] = (now, hits)
    return {"hits": hits[:20], "query": q}


# ── POST /api/obsidian/open ──────────────────────────────────────────────────

_OBSIDIAN_API_KEY: str | None = None

def _load_obsidian_key() -> str | None:
    global _OBSIDIAN_API_KEY
    if _OBSIDIAN_API_KEY is not None:
        return _OBSIDIAN_API_KEY
    key_path = REPO_ROOT / ".secrets" / "obsidian-api-key.txt"
    try:
        _OBSIDIAN_API_KEY = key_path.read_text(encoding="utf-8").strip()
        return _OBSIDIAN_API_KEY
    except FileNotFoundError:
        return None


@app.post("/api/obsidian/open")
async def obsidian_open(body: dict):
    import urllib.request
    import urllib.error
    import ssl

    path = body.get("path", "").strip()
    if not path:
        return JSONResponse(status_code=400, content={"error": "path required"})

    # Reject paths outside sartor/memory vault
    if ".." in path or path.startswith("/"):
        return JSONResponse(status_code=400, content={"error": "invalid path"})

    key = _load_obsidian_key()
    if not key:
        return JSONResponse(status_code=500, content={"error": "obsidian-api-key.txt not found in .secrets/"})

    # Check if path exists locally (optional guard)
    local_path = REPO_ROOT / path
    if not local_path.exists():
        return JSONResponse(status_code=404, content={"error": f"path not found in vault: {path}"})

    # Forward to Obsidian Local REST API
    import urllib.parse
    encoded_path = urllib.parse.quote(path, safe="")
    url = f"https://127.0.0.1:27124/open/{encoded_path}"
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(url, method="POST")
        req.add_header("Authorization", f"Bearer {key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Content-Length", "0")
        with urllib.request.urlopen(req, timeout=4, context=ctx) as resp:
            return {"ok": True, "status": resp.status, "path": path}
    except urllib.error.URLError as e:
        reason = str(e.reason)
        if "refused" in reason.lower() or "connect" in reason.lower():
            return JSONResponse(
                status_code=503,
                content={"error": "Obsidian Local REST API is not reachable. Open the sartor/memory vault in Obsidian first."}
            )
        return JSONResponse(status_code=502, content={"error": f"Obsidian proxy error: {reason}"})
    except Exception as e:
        return JSONResponse(status_code=502, content={"error": f"Obsidian proxy error: {e}"})


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print("MERIDIAN v0.1 — Starting on http://localhost:5055")
    uvicorn.run(app, host="0.0.0.0", port=5055)
