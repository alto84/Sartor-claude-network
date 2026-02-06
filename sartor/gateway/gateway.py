#!/usr/bin/env python3
"""
Sartor Gateway - Coordination hub for the Sartor system.

Provides a simple HTTP API for memory access, task management,
and system status. All operations are file-based (no databases).

Usage:
    python3 sartor/gateway/gateway.py

API:
    GET  /status              - System status
    GET  /memory              - List memory files
    GET  /memory/<filename>   - Read a memory file
    POST /memory/<filename>   - Append to a memory file
    GET  /tasks               - Get current task list from ACTIVE.md
    POST /tasks               - Add a new task to ACTIVE.md
    GET  /search?q=<query>    - Keyword search across all memory files
    GET  /daily               - Get today's daily log
    POST /daily               - Append to today's daily log
"""

import os
import sys
import datetime
import socket
from pathlib import Path

import yaml
from flask import Flask, jsonify, request, abort
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

GATEWAY_DIR = Path(__file__).resolve().parent
SARTOR_DIR = GATEWAY_DIR.parent
MEMORY_DIR = SARTOR_DIR / "memory"
TASKS_DIR = SARTOR_DIR / "tasks"
DAILY_DIR = MEMORY_DIR / "daily"
AGENTS_FILE = GATEWAY_DIR / "agents.yaml"

# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _read_file(path: Path) -> str:
    """Read a file and return its contents, or empty string if missing."""
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return ""


def _append_file(path: Path, content: str) -> None:
    """Append content to a file, creating parent dirs if needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(content)


def _list_md_files(directory: Path) -> list:
    """List all .md files in a directory (non-recursive)."""
    if not directory.is_dir():
        return []
    return sorted(p.name for p in directory.glob("*.md"))


def _load_agents() -> dict:
    """Load the agents.yaml registry."""
    if AGENTS_FILE.is_file():
        with open(AGENTS_FILE, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


def _today_str() -> str:
    """Return today's date as YYYY-MM-DD."""
    return datetime.date.today().isoformat()


def _daily_path(date_str: str | None = None) -> Path:
    """Return the path to a daily log file."""
    date_str = date_str or _today_str()
    return DAILY_DIR / f"{date_str}.md"

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/status", methods=["GET"])
def status():
    """System status: machines, agents, directory info."""
    registry = _load_agents()
    machines = registry.get("machines", {})
    agents = registry.get("agents", {})

    memory_files = _list_md_files(MEMORY_DIR)
    task_files = _list_md_files(TASKS_DIR)
    daily_files = sorted(
        p.name for p in DAILY_DIR.glob("*.md")
    ) if DAILY_DIR.is_dir() else []

    return jsonify({
        "hostname": socket.gethostname(),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "sartor_dir": str(SARTOR_DIR),
        "machines": list(machines.keys()),
        "agents": list(agents.keys()),
        "memory_files": memory_files,
        "task_files": task_files,
        "daily_logs": daily_files,
        "last_daily": daily_files[-1] if daily_files else None,
    })


@app.route("/memory", methods=["GET"])
def list_memory():
    """List all memory files."""
    files = _list_md_files(MEMORY_DIR)
    return jsonify({"files": files, "directory": str(MEMORY_DIR)})


@app.route("/memory/<filename>", methods=["GET"])
def read_memory(filename: str):
    """Read a single memory file."""
    if not filename.endswith(".md"):
        filename += ".md"
    path = MEMORY_DIR / filename
    if not path.is_file():
        abort(404, description=f"Memory file not found: {filename}")
    return jsonify({
        "filename": filename,
        "content": _read_file(path),
        "size": path.stat().st_size,
        "modified": datetime.datetime.fromtimestamp(
            path.stat().st_mtime, tz=datetime.timezone.utc
        ).isoformat(),
    })


@app.route("/memory/<filename>", methods=["POST"])
def append_memory(filename: str):
    """Append content to a memory file."""
    if not filename.endswith(".md"):
        filename += ".md"
    data = request.get_json(force=True)
    content = data.get("content", "")
    if not content:
        abort(400, description="Missing 'content' in request body")

    path = MEMORY_DIR / filename
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%d %H:%M UTC"
    )
    entry = f"\n\n<!-- appended {timestamp} -->\n{content}"
    _append_file(path, entry)
    return jsonify({"ok": True, "filename": filename, "appended_bytes": len(entry)})


@app.route("/tasks", methods=["GET"])
def get_tasks():
    """Get current tasks from ACTIVE.md."""
    path = TASKS_DIR / "ACTIVE.md"
    content = _read_file(path)
    return jsonify({"filename": "ACTIVE.md", "content": content})


@app.route("/tasks", methods=["POST"])
def add_task():
    """Add a new task to ACTIVE.md."""
    data = request.get_json(force=True)
    task = data.get("task", "")
    priority = data.get("priority", "medium")
    if not task:
        abort(400, description="Missing 'task' in request body")

    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%d %H:%M UTC"
    )
    entry = f"\n- [ ] **[{priority}]** {task}  *(added {timestamp})*"
    _append_file(TASKS_DIR / "ACTIVE.md", entry)
    return jsonify({"ok": True, "task": task, "priority": priority})


@app.route("/search", methods=["GET"])
def search():
    """Simple keyword search across all memory files."""
    query = request.args.get("q", "").strip().lower()
    if not query:
        abort(400, description="Missing query parameter 'q'")

    results = []
    for md_file in MEMORY_DIR.glob("*.md"):
        content = _read_file(md_file)
        lines = content.splitlines()
        matches = []
        for i, line in enumerate(lines, start=1):
            if query in line.lower():
                matches.append({"line": i, "text": line.strip()})
        if matches:
            results.append({
                "file": md_file.name,
                "match_count": len(matches),
                "matches": matches[:20],  # cap per file
            })

    # Also search daily logs
    if DAILY_DIR.is_dir():
        for md_file in sorted(DAILY_DIR.glob("*.md")):
            content = _read_file(md_file)
            lines = content.splitlines()
            matches = []
            for i, line in enumerate(lines, start=1):
                if query in line.lower():
                    matches.append({"line": i, "text": line.strip()})
            if matches:
                results.append({
                    "file": f"daily/{md_file.name}",
                    "match_count": len(matches),
                    "matches": matches[:20],
                })

    return jsonify({
        "query": query,
        "total_files": len(results),
        "results": results,
    })


@app.route("/daily", methods=["GET"])
def get_daily():
    """Get today's daily log."""
    date_str = request.args.get("date", _today_str())
    path = _daily_path(date_str)
    content = _read_file(path)
    return jsonify({
        "date": date_str,
        "filename": path.name,
        "exists": path.is_file(),
        "content": content,
    })


@app.route("/daily", methods=["POST"])
def append_daily():
    """Append an entry to today's daily log."""
    data = request.get_json(force=True)
    content = data.get("content", "")
    if not content:
        abort(400, description="Missing 'content' in request body")

    date_str = _today_str()
    path = _daily_path(date_str)

    # Create the file with a header if it doesn't exist yet
    if not path.is_file():
        DAILY_DIR.mkdir(parents=True, exist_ok=True)
        header = f"# Daily Log - {date_str}\n"
        path.write_text(header, encoding="utf-8")

    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M UTC")
    entry = f"\n- **{timestamp}** {content}"
    _append_file(path, entry)
    return jsonify({"ok": True, "date": date_str, "appended_bytes": len(entry)})


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"Sartor Gateway starting...")
    print(f"  Sartor dir : {SARTOR_DIR}")
    print(f"  Memory dir : {MEMORY_DIR}")
    print(f"  Tasks dir  : {TASKS_DIR}")
    print(f"  Agents file: {AGENTS_FILE}")
    print()
    app.run(host="0.0.0.0", port=5001, debug=True)
