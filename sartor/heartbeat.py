#!/usr/bin/env python3
"""
Sartor Heartbeat Engine -- KAIROS-inspired autonomous tick system.

Runs as a scheduled task on Rocinante (Windows) or via cron on gpuserver1 (Linux).
Each invocation is one "tick" -- the engine checks what needs doing and acts.

Usage:
    python heartbeat.py                 # Run one tick cycle
    python heartbeat.py --status        # Show heartbeat status
    python heartbeat.py --dry-run       # Show what would run without executing
    python heartbeat.py --health-only   # Just run health checks, no task execution
    python heartbeat.py --verbose       # Extra logging output
"""

import argparse
import csv
import json
import os
import platform
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

# Import the scheduled executor for proper cron-based task discovery
try:
    from scheduled_executor import get_due_tasks as _executor_get_due_tasks
except ImportError:
    from sartor.scheduled_executor import get_due_tasks as _executor_get_due_tasks

# Import observer runner for inline sentinel/auditor checks
try:
    from run_observers import run_all_observers as _run_observers
except ImportError:
    try:
        from sartor.run_observers import run_all_observers as _run_observers
    except ImportError:
        _run_observers = None

# Import trajectory logger for post-execution logging
try:
    from trajectory import log_action as _log_trajectory
except ImportError:
    _log_trajectory = None

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SARTOR_DIR = Path(__file__).resolve().parent
REPO_DIR = SARTOR_DIR.parent
DATA_DIR = REPO_DIR / "data"
MEMORY_DIR = SARTOR_DIR / "memory"
DAILY_DIR = MEMORY_DIR / "daily"
HEARTBEAT_LOG = DATA_DIR / "heartbeat-log.csv"
LOCK_FILE = DATA_DIR / ".heartbeat.lock"
COSTS_JSON = SARTOR_DIR / "costs.json"
SCHEDULED_TASKS_DIR = REPO_DIR / ".claude" / "scheduled-tasks"

# Budget / timing constants
COST_LIMIT = 5.00           # Daily budget in USD
MIN_TICK_INTERVAL_MIN = 25  # Minimum minutes between ticks

# SSH target for health checks
GPU_HOST = "alton@192.168.1.100"
SSH_TIMEOUT = 10

HEARTBEAT_LOG_HEADER = ["timestamp", "task_name", "status", "duration_s", "model", "cost"]

VERBOSE = False


def _log(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


def _vlog(msg: str):
    if VERBOSE:
        _log(msg)


# ---------------------------------------------------------------------------
# Cross-platform file locking
# ---------------------------------------------------------------------------

class FileLock:
    """Cross-platform exclusive file lock. Windows uses msvcrt, Linux uses fcntl."""

    def __init__(self, path: Path):
        self.path = path
        self._fd = None

    def acquire(self) -> bool:
        """Try to acquire the lock. Returns True on success, False if already locked."""
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            self._fd = open(self.path, "w")
            if platform.system() == "Windows":
                import msvcrt
                msvcrt.locking(self._fd.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self._fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self._fd.write(str(os.getpid()))
            self._fd.flush()
            return True
        except (IOError, OSError):
            if self._fd:
                try:
                    self._fd.close()
                except Exception:
                    pass
                self._fd = None
            return False

    def release(self):
        if self._fd:
            try:
                if platform.system() == "Windows":
                    import msvcrt
                    self._fd.seek(0)
                    try:
                        msvcrt.locking(self._fd.fileno(), msvcrt.LK_UNLCK, 1)
                    except Exception:
                        pass
                else:
                    import fcntl
                    fcntl.flock(self._fd, fcntl.LOCK_UN)
                self._fd.close()
            except Exception:
                pass
            finally:
                self._fd = None
            try:
                self.path.unlink(missing_ok=True)
            except Exception:
                pass

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.release()


# ---------------------------------------------------------------------------
# Gate Checks (cheapest first, KAIROS pattern)
# ---------------------------------------------------------------------------

def check_budget() -> dict:
    """Gate 1: Is there budget remaining for today?"""
    try:
        if not COSTS_JSON.exists():
            return {"ok": True, "spent": 0.0, "limit": COST_LIMIT, "remaining": COST_LIMIT}

        data = json.loads(COSTS_JSON.read_text(encoding="utf-8"))
        limit = data.get("daily_limit", COST_LIMIT)

        today_str = datetime.now().strftime("%Y-%m-%d")
        spent = sum(
            c.get("cost", 0.0)
            for c in data.get("calls", [])
            if c.get("timestamp", "").startswith(today_str)
        )
        spent = round(spent, 6)
        remaining = round(limit - spent, 6)

        return {
            "ok": remaining > 0.10,  # Keep a small buffer
            "spent": spent,
            "limit": limit,
            "remaining": remaining,
        }
    except Exception as e:
        return {"ok": False, "spent": 0.0, "limit": COST_LIMIT, "remaining": 0.0,
                "error": str(e)}


def check_time_since_last() -> dict:
    """Gate 2: Has enough time passed since the last tick?"""
    try:
        if not HEARTBEAT_LOG.exists():
            return {"ok": True, "minutes_since": None, "last_tick": None}

        last_ts = None
        with open(HEARTBEAT_LOG, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                ts = row.get("timestamp", "")
                if ts and ts != "timestamp":
                    last_ts = ts

        if not last_ts:
            return {"ok": True, "minutes_since": None, "last_tick": None}

        last_dt = datetime.fromisoformat(last_ts)
        elapsed = (datetime.now() - last_dt).total_seconds() / 60.0
        return {
            "ok": elapsed >= MIN_TICK_INTERVAL_MIN,
            "minutes_since": round(elapsed, 1),
            "last_tick": last_ts,
        }
    except Exception as e:
        return {"ok": True, "minutes_since": None, "last_tick": None, "error": str(e)}


def check_lock() -> dict:
    """Gate 3: Is another heartbeat instance running?"""
    if not LOCK_FILE.exists():
        return {"ok": True}

    # On Windows, stale lock files happen if the process was killed
    # Check if the PID in the lock file is still alive
    try:
        pid_text = LOCK_FILE.read_text(encoding="utf-8").strip()
        if pid_text.isdigit():
            pid = int(pid_text)
            if platform.system() == "Windows":
                import ctypes
                PROCESS_QUERY_INFORMATION = 0x0400
                handle = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_INFORMATION, False, pid)
                if handle == 0:
                    # Process doesn't exist -- stale lock
                    LOCK_FILE.unlink(missing_ok=True)
                    return {"ok": True, "note": "Removed stale lock"}
                else:
                    ctypes.windll.kernel32.CloseHandle(handle)
                    return {"ok": False, "locked_by_pid": pid}
            else:
                try:
                    os.kill(pid, 0)
                    return {"ok": False, "locked_by_pid": pid}
                except ProcessLookupError:
                    LOCK_FILE.unlink(missing_ok=True)
                    return {"ok": True, "note": "Removed stale lock"}
        else:
            # Malformed lock file -- remove it
            LOCK_FILE.unlink(missing_ok=True)
            return {"ok": True, "note": "Removed malformed lock"}
    except Exception as e:
        return {"ok": True, "error": str(e)}


# ---------------------------------------------------------------------------
# Health Checks
# ---------------------------------------------------------------------------

def _ssh(cmd: str, timeout: int = SSH_TIMEOUT) -> tuple[bool, str]:
    """Run a command on gpuserver1 via SSH. Returns (success, output)."""
    try:
        result = subprocess.run(
            ["ssh", "-o", "ConnectTimeout=10", "-o", "BatchMode=yes",
             "-o", "StrictHostKeyChecking=no", GPU_HOST, cmd],
            capture_output=True, text=True, timeout=timeout
        )
        return result.returncode == 0, (result.stdout + result.stderr).strip()
    except subprocess.TimeoutExpired:
        return False, "SSH timeout"
    except FileNotFoundError:
        return False, "ssh not found in PATH"
    except Exception as e:
        return False, str(e)


def health_check_gpuserver1() -> dict:
    """Check if gpuserver1 is reachable via SSH."""
    ok, out = _ssh("echo ok", timeout=SSH_TIMEOUT)
    return {
        "name": "gpuserver1",
        "status": "ok" if (ok and "ok" in out) else "error",
        "message": "Reachable" if (ok and "ok" in out) else f"Unreachable: {out[:100]}",
    }


def health_check_vastai() -> dict:
    """Check vast.ai listing status via SSH to gpuserver1."""
    ok, out = _ssh("~/.local/bin/vastai show machines 2>&1", timeout=SSH_TIMEOUT)
    if not ok:
        return {"name": "vastai", "status": "error", "message": f"SSH failed: {out[:100]}"}

    lines = out.strip().splitlines()
    if len(lines) < 2:
        return {"name": "vastai", "status": "warning", "message": "No machine data returned"}

    # Look for machine 52271 in output
    for line in lines[1:]:
        if "52271" in line:
            if any(s in line.lower() for s in ("listed", "online", "verified")):
                return {"name": "vastai", "status": "ok", "message": f"Machine 52271 active"}
            else:
                return {"name": "vastai", "status": "warning",
                        "message": f"Machine 52271 status: {line[:80]}"}

    return {"name": "vastai", "status": "warning",
            "message": "Machine 52271 not found in output"}


def health_check_disk() -> dict:
    """Check disk space on gpuserver1."""
    ok, out = _ssh("df -h /home --output=pcent,avail 2>/dev/null | tail -1", timeout=SSH_TIMEOUT)
    if not ok:
        return {"name": "disk", "status": "error", "message": f"SSH failed: {out[:100]}"}

    parts = out.strip().split()
    if not parts:
        return {"name": "disk", "status": "unknown", "message": "No disk data"}

    pct_str = parts[0].replace("%", "")
    try:
        pct = int(pct_str)
        if pct >= 90:
            avail = parts[1] if len(parts) > 1 else "?"
            return {"name": "disk", "status": "warning",
                    "message": f"Disk {pct}% used, {avail} free -- low space"}
        return {"name": "disk", "status": "ok", "message": f"Disk {pct}% used"}
    except ValueError:
        return {"name": "disk", "status": "unknown",
                "message": f"Could not parse disk usage: {out[:60]}"}


def health_check_gpu() -> dict:
    """Check GPU temperature on gpuserver1."""
    ok, out = _ssh(
        "nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total "
        "--format=csv,noheader,nounits 2>&1",
        timeout=SSH_TIMEOUT
    )
    if not ok:
        return {"name": "gpu", "status": "error", "message": f"SSH failed: {out[:100]}"}

    parts = [p.strip() for p in out.split(",")]
    if len(parts) < 2:
        return {"name": "gpu", "status": "unknown", "message": f"No GPU data: {out[:60]}"}

    try:
        temp = int(parts[0])
        util = int(parts[1])
        msg = f"{temp}C, {util}% utilization"
        if len(parts) >= 4:
            msg += f", {parts[2]}/{parts[3]} MiB VRAM"
        if temp > 85:
            return {"name": "gpu", "status": "warning",
                    "message": f"GPU temp critical: {msg}"}
        return {"name": "gpu", "status": "ok", "message": msg}
    except (ValueError, IndexError):
        return {"name": "gpu", "status": "unknown",
                "message": f"Could not parse GPU data: {out[:80]}"}


def health_check_memory_freshness() -> dict:
    """Check if memory system has been updated recently (within 48h)."""
    try:
        if not DAILY_DIR.exists():
            return {"name": "memory", "status": "warning",
                    "message": "Daily memory directory missing"}

        daily_files = sorted(DAILY_DIR.glob("*.md"), reverse=True)
        # Filter out brief files -- look for actual log files (YYYY-MM-DD.md)
        log_files = [f for f in daily_files
                     if len(f.stem) == 10 and f.stem[4] == "-" and f.stem[7] == "-"]

        if not log_files:
            return {"name": "memory", "status": "warning",
                    "message": "No daily log files found"}

        newest = log_files[0]
        try:
            newest_date = datetime.strptime(newest.stem, "%Y-%m-%d")
        except ValueError:
            return {"name": "memory", "status": "unknown",
                    "message": f"Could not parse date from {newest.name}"}

        age_h = (datetime.now() - newest_date).total_seconds() / 3600
        if age_h > 48:
            return {"name": "memory", "status": "warning",
                    "message": f"Memory last updated {age_h:.0f}h ago (stale)"}
        return {"name": "memory", "status": "ok",
                "message": f"Memory updated {age_h:.0f}h ago ({newest.stem})"}
    except Exception as e:
        return {"name": "memory", "status": "error", "message": str(e)}


def run_all_health_checks() -> list[dict]:
    """Run all health checks concurrently and return list of result dicts."""
    import threading

    results = []
    lock = threading.Lock()

    checks = [
        health_check_gpuserver1,
        health_check_vastai,
        health_check_disk,
        health_check_gpu,
        health_check_memory_freshness,
    ]

    def run_check(fn):
        try:
            r = fn()
        except Exception as e:
            r = {"name": fn.__name__, "status": "error", "message": str(e)}
        with lock:
            results.append(r)

    threads = [threading.Thread(target=run_check, args=(c,)) for c in checks]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=SSH_TIMEOUT + 5)

    return results


# ---------------------------------------------------------------------------
# Scheduled Task Discovery
# ---------------------------------------------------------------------------

def _parse_skill_frontmatter(path: Path) -> dict:
    """Parse YAML frontmatter from a SKILL.md file."""
    try:
        content = path.read_text(encoding="utf-8")
        if not content.startswith("---"):
            return {}
        end = content.find("---", 3)
        if end == -1:
            return {}
        fm_text = content[3:end].strip()
        result = {}
        for line in fm_text.splitlines():
            if ":" in line:
                k, _, v = line.partition(":")
                result[k.strip()] = v.strip()
        result["_body"] = content[end + 3:].strip()
        return result
    except Exception:
        return {}


def _parse_schedule_string(schedule: str) -> str | None:
    """
    Parse a human-readable schedule description like 'Daily, 6:30 AM ET' and
    return a cron-style string for comparison, or None if unparseable.
    For our purposes, just return the raw string -- the executor compares wall time.
    """
    return schedule if schedule else None


def get_due_scheduled_tasks(now: datetime | None = None) -> list[dict]:
    """
    Scan .claude/scheduled-tasks/ for tasks due now using the scheduled_executor
    module which has proper cron parsing and last-run tracking.

    Returns list of dicts with: name, model, prompt, schedule_str, skill_path
    """
    # Use the scheduled_executor's get_due_tasks which handles:
    # - Proper cron expression matching
    # - "never run" tasks always being due
    # - Last-run tracking from heartbeat-log.csv
    executor_due = _executor_get_due_tasks(
        scheduled_tasks_dir=SCHEDULED_TASKS_DIR,
        heartbeat_log_path=HEARTBEAT_LOG,
    )

    due = []
    for task in executor_due:
        skill_path = SCHEDULED_TASKS_DIR / task["name"] / "SKILL.md"
        due.append({
            "name": task["name"],
            "model": task.get("model", "sonnet"),
            "prompt": task.get("instructions", ""),
            "schedule_str": task.get("cron", ""),
            "skill_path": str(skill_path),
            "task_dir": task["name"],
        })

    return due


# ---------------------------------------------------------------------------
# Task Execution
# ---------------------------------------------------------------------------

def execute_task(prompt: str, task_name: str = "heartbeat-task",
                 model: str = "sonnet", timeout: int = 300) -> dict:
    """
    Execute a task prompt via `claude --print -p` subprocess.

    Returns dict with: success, output, duration_s, model, cost, error
    """
    start = time.time()
    result = {
        "task_name": task_name,
        "model": model,
        "success": False,
        "output": "",
        "duration_s": 0.0,
        "cost": 0.0,
        "error": None,
    }

    # Map friendly model names to claude CLI model flags
    model_flags = {
        "haiku":  "claude-haiku-4-5-20251001",
        "sonnet": "claude-sonnet-4-6",
        "opus":   "claude-opus-4-6",
    }
    model_id = model_flags.get(model.lower(), model_flags["sonnet"])

    try:
        # On Windows, find claude via npm global path or use shell=True
        claude_cmd = "claude"
        if platform.system() == "Windows":
            npm_claude = Path(os.environ.get("APPDATA", "")) / "npm" / "claude.cmd"
            if npm_claude.exists():
                claude_cmd = str(npm_claude)

        cmd = [claude_cmd, "--print", "--model", model_id, "-p", prompt]
        _vlog(f"Executing: {task_name} (model={model}, timeout={timeout}s)")
        _vlog(f"  Claude binary: {claude_cmd}")

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(REPO_DIR),
            shell=(platform.system() == "Windows"),
        )
        result["output"] = proc.stdout
        result["success"] = proc.returncode == 0
        if proc.stderr:
            result["output"] += f"\n\n--- STDERR ---\n{proc.stderr}"

    except subprocess.TimeoutExpired:
        result["error"] = f"Task timed out after {timeout}s"
        result["output"] = result["error"]
    except FileNotFoundError:
        result["error"] = "claude CLI not found in PATH"
        result["output"] = result["error"]
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"
        result["output"] = result["error"]

    result["duration_s"] = round(time.time() - start, 2)

    # Rough cost estimate based on output length (no actual token counts here)
    # Use conservative 2000 input tokens + output length / 4
    estimated_output_tokens = max(100, len(result["output"]) // 4)
    PRICING = {
        "haiku":  {"input": 0.25, "output": 1.25},
        "sonnet": {"input": 3.00, "output": 15.00},
        "opus":   {"input": 15.00, "output": 75.00},
    }
    p = PRICING.get(model.lower(), PRICING["sonnet"])
    result["cost"] = round(
        (2000 * p["input"] + estimated_output_tokens * p["output"]) / 1_000_000, 6
    )

    return result


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def _ensure_csv_header():
    """Create heartbeat-log.csv with header if it doesn't exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not HEARTBEAT_LOG.exists():
        with open(HEARTBEAT_LOG, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(HEARTBEAT_LOG_HEADER)


def write_heartbeat_csv(task_name: str, status: str, duration_s: float,
                        model: str, cost: float):
    """Append one row to heartbeat-log.csv for dashboard consumption."""
    _ensure_csv_header()
    ts = datetime.now().isoformat(timespec="seconds")
    try:
        with open(HEARTBEAT_LOG, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([ts, task_name, status, f"{duration_s:.2f}", model, f"{cost:.6f}"])
    except Exception as e:
        _log(f"WARNING: Could not write heartbeat CSV: {e}")


def write_daily_log(message: str):
    """Append a timestamped message to today's daily markdown log."""
    DAILY_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")
    daily_file = DAILY_DIR / f"{today}.md"

    if not daily_file.exists():
        daily_file.write_text(f"# Daily Log - {today}\n\n", encoding="utf-8")

    ts = datetime.now().strftime("%H:%M")
    try:
        with open(daily_file, "a", encoding="utf-8") as f:
            f.write(f"- [{ts}] {message}\n")
    except Exception as e:
        _log(f"WARNING: Could not write daily log: {e}")


# ---------------------------------------------------------------------------
# Main Tick Cycle
# ---------------------------------------------------------------------------

def run_tick(dry_run: bool = False, health_only: bool = False) -> int:
    """
    One heartbeat tick. The KAIROS pattern:
      1. Gate checks (budget, time, lock)
      2. Health checks (SSH, vast.ai, disk, GPU, memory)
      3. Scheduled task scan
      4. Pick highest priority task
      5. Execute
      6. Log results
      7. Self-assess

    Returns exit code: 0 = success, 1 = gated/error
    """
    _log("Heartbeat tick starting")

    # --- Gate 1: Budget ---
    budget = check_budget()
    _vlog(f"Budget: ${budget['spent']:.4f} spent, ${budget['remaining']:.4f} remaining")
    if not budget["ok"]:
        msg = f"Budget gate: ${budget['spent']:.4f} spent of ${budget['limit']:.2f} limit. Skipping tick."
        _log(msg)
        write_heartbeat_csv("budget-gate", "skipped", 0.0, "none", 0.0)
        write_daily_log(f"Heartbeat skipped: budget exhausted (${budget['spent']:.4f}/${budget['limit']:.2f})")
        return 1

    # --- Gate 2: Time since last tick (skip for health-only and dry-run) ---
    timing = check_time_since_last()
    _vlog(f"Timing: {timing.get('minutes_since')} min since last tick")
    if not timing["ok"] and not health_only and not dry_run:
        mins = timing.get("minutes_since", 0)
        _log(f"Timing gate: only {mins:.1f}min since last tick (min={MIN_TICK_INTERVAL_MIN}min). Skipping.")
        return 1

    # --- Gate 3: Lock check ---
    lock_status = check_lock()
    if not lock_status["ok"]:
        pid = lock_status.get("locked_by_pid", "?")
        _log(f"Lock gate: another instance running (PID {pid}). Skipping tick.")
        return 1

    # Acquire lock
    lock = FileLock(LOCK_FILE)
    if not lock.acquire():
        _log("Could not acquire lock file. Another instance may have just started.")
        return 1

    try:
        return _tick_body(dry_run=dry_run, health_only=health_only, budget=budget)
    finally:
        lock.release()


def _tick_body(dry_run: bool, health_only: bool, budget: dict) -> int:
    """Core tick logic, called with lock held."""

    tick_start = time.time()

    # --- Step 2: Health Checks ---
    _log("Running health checks...")
    health_results = run_all_health_checks()

    issues = [r for r in health_results if r["status"] in ("error", "warning")]
    ok_checks = [r for r in health_results if r["status"] == "ok"]

    _vlog(f"Health: {len(ok_checks)} ok, {len(issues)} issues")
    for r in health_results:
        icon = {"ok": "+", "warning": "!", "error": "X", "unknown": "?"}.get(r["status"], "?")
        _vlog(f"  [{icon}] {r['name']}: {r['message']}")

    # Log health summary to daily log
    health_summary_parts = []
    for r in health_results:
        health_summary_parts.append(f"{r['name']}={r['status']}")
    write_daily_log(f"Heartbeat health: {', '.join(health_summary_parts)}")

    # Log health tick to CSV
    health_duration = round(time.time() - tick_start, 2)
    write_heartbeat_csv(
        "health-check",
        "ok" if not issues else "warning",
        health_duration,
        "none",
        0.0
    )

    # Log health trajectory
    if _log_trajectory is not None:
        try:
            _log_trajectory(
                task_name="health-check",
                action="health-scan",
                tool="ssh+local",
                input_summary=f"Ran {len(health_results)} health checks",
                output_summary=", ".join(health_summary_parts),
                duration_ms=int(health_duration * 1000),
                status="ok" if not issues else "warning",
            )
        except Exception:
            pass

    # Surface critical health issues
    for issue in issues:
        _log(f"  HEALTH ISSUE [{issue['status'].upper()}] {issue['name']}: {issue['message']}")

    # --- Step 2b: Observer Checks (sentinel + quick auditor) ---
    if _run_observers is not None:
        _log("Running observer checks...")
        try:
            observer_results = _run_observers()
            obs_pass = sum(1 for r in observer_results if r.get("status") == "pass")
            obs_warn = sum(1 for r in observer_results if r.get("status") == "warn")
            obs_fail = sum(1 for r in observer_results if r.get("status") == "fail")
            _vlog(f"Observers: {obs_pass} pass, {obs_warn} warn, {obs_fail} fail")
            if obs_fail > 0:
                for r in observer_results:
                    if r.get("status") == "fail":
                        _log(f"  OBSERVER FAIL [{r.get('observer')}/{r.get('check')}]: {r.get('detail')}")
        except Exception as e:
            _log(f"  WARNING: Observer checks failed: {e}")
    else:
        _vlog("Observer module not available, skipping")

    if health_only:
        _log("Health-only mode. Done.")
        return 0

    # --- Step 3: Scan for scheduled tasks ---
    _log("Scanning for scheduled tasks...")
    due_tasks = get_due_scheduled_tasks()
    _vlog(f"Found {len(due_tasks)} due task(s)")

    # --- Step 4: Pick highest priority task ---
    # Priority order: morning-briefing > gpu check > others
    PRIORITY_ORDER = {
        "morning-briefing": 0,
        "gpu-utilization-check": 1,
        "personal-data-gather": 2,
        "nightly-memory-curation": 3,
        "market-close-summary": 4,
        "self-improvement-loop": 5,
        "weekly-financial-summary": 6,
        "weekly-nonprofit-review": 7,
        "weekly-skill-evolution": 8,
    }
    due_tasks.sort(key=lambda t: PRIORITY_ORDER.get(t["name"], 99))

    if not due_tasks:
        _log("No scheduled tasks due. Tick complete.")
        write_heartbeat_csv("idle", "ok", round(time.time() - tick_start, 2), "none", 0.0)
        return 0

    task = due_tasks[0]
    _log(f"Selected task: {task['name']} (model={task['model']})")

    if dry_run:
        _log(f"[DRY RUN] Would execute: {task['name']}")
        _log(f"  Schedule: {task['schedule_str']}")
        _log(f"  Prompt preview: {task['prompt'][:150]}...")
        write_heartbeat_csv(task["name"], "dry-run", 0.0, task["model"], 0.0)
        return 0

    # --- Step 5: Execute ---
    _log(f"Executing task: {task['name']}")
    result = execute_task(
        prompt=task["prompt"],
        task_name=task["name"],
        model=task["model"],
        timeout=300,
    )

    status = "ok" if result["success"] else "error"
    _log(f"Task {task['name']}: {status} ({result['duration_s']:.1f}s)")

    # --- Step 5b: Save task output to reports ---
    if result["success"] and result["output"].strip():
        reports_dir = REPO_DIR / "reports" / "daily"
        reports_dir.mkdir(parents=True, exist_ok=True)
        today = datetime.now().strftime("%Y-%m-%d")
        report_file = reports_dir / f"{today}-{task['name']}.md"
        try:
            ts = datetime.now().strftime("%Y-%m-%d %H:%M")
            report_content = f"# {task['name']} - {ts}\n\n{result['output']}\n"
            report_file.write_text(report_content, encoding="utf-8")
            _vlog(f"  Output saved to {report_file}")
        except Exception as e:
            _log(f"  WARNING: Could not save report: {e}")

    # --- Step 6: Log results ---
    write_heartbeat_csv(
        task["name"],
        status,
        result["duration_s"],
        task["model"],
        result["cost"],
    )

    outcome = "completed" if result["success"] else f"FAILED: {result.get('error', 'unknown')}"
    write_daily_log(
        f"Heartbeat executed {task['name']} -- {outcome} "
        f"({result['duration_s']:.1f}s, ~${result['cost']:.4f})"
    )

    if not result["success"] and result.get("error"):
        _log(f"  Error: {result['error']}")

    # --- Step 6b: Trajectory logging ---
    if _log_trajectory is not None:
        try:
            _log_trajectory(
                task_name=task["name"],
                action="execute",
                tool="claude-cli",
                input_summary=task["prompt"][:500] if task.get("prompt") else "",
                output_summary=result["output"][:500] if result.get("output") else "",
                duration_ms=int(result["duration_s"] * 1000),
                status=status,
                error=result.get("error", "") or "",
            )
            _vlog(f"  Trajectory logged for {task['name']}")
        except Exception as e:
            _vlog(f"  WARNING: trajectory logging failed: {e}")
    else:
        _vlog("  Trajectory module not available, skipping")

    # --- Step 7: Self-assess ---
    # If there were health issues, include them in a follow-up note
    if issues:
        issues_text = "; ".join(f"{r['name']}: {r['message']}" for r in issues)
        write_daily_log(f"Heartbeat health alerts: {issues_text}")

    _log(f"Tick complete. Duration: {time.time() - tick_start:.1f}s")
    return 0 if result["success"] else 1


# ---------------------------------------------------------------------------
# Status Display
# ---------------------------------------------------------------------------

def show_status():
    """Show current heartbeat status from the CSV log."""
    print("=" * 70)
    print("  SARTOR HEARTBEAT STATUS")
    print("=" * 70)

    # Budget
    budget = check_budget()
    print(f"\n  Budget:")
    print(f"    Today:     ${budget['spent']:.4f} / ${budget['limit']:.2f}")
    print(f"    Remaining: ${budget['remaining']:.4f}")
    if budget.get("error"):
        print(f"    Error:     {budget['error']}")

    # Last tick timing
    timing = check_time_since_last()
    print(f"\n  Last Tick:")
    if timing.get("last_tick"):
        print(f"    Time:      {timing['last_tick']}")
        print(f"    Elapsed:   {timing['minutes_since']:.1f} min ago")
        ready = "ready" if timing["ok"] else f"too soon (min={MIN_TICK_INTERVAL_MIN}min)"
        print(f"    Status:    {ready}")
    else:
        print(f"    Status:    No prior ticks recorded")

    # Lock status
    lock_status = check_lock()
    print(f"\n  Lock:")
    if lock_status.get("locked_by_pid"):
        print(f"    Status:    LOCKED (PID {lock_status['locked_by_pid']})")
    else:
        print(f"    Status:    free")

    # Recent log entries
    if not HEARTBEAT_LOG.exists():
        print(f"\n  Log: No heartbeat log found at {HEARTBEAT_LOG}")
    else:
        print(f"\n  Recent log entries ({HEARTBEAT_LOG.name}):")
        print(f"  {'Timestamp':<20} {'Task':<35} {'Status':<8} {'Dur(s)':<8} {'Model':<8} {'Cost'}")
        print(f"  {'-'*20} {'-'*35} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
        try:
            rows = []
            with open(HEARTBEAT_LOG, "r", newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rows.append(row)
            for row in rows[-10:]:
                ts = row.get("timestamp", "")[:19]
                name = row.get("task_name", "")[:35]
                status = row.get("status", "")[:8]
                dur = row.get("duration_s", "")[:7]
                model = row.get("model", "")[:7]
                cost = row.get("cost", "")
                print(f"  {ts:<20} {name:<35} {status:<8} {dur:<8} {model:<8} {cost}")
        except Exception as e:
            print(f"  Error reading log: {e}")

    # Due tasks right now
    due = get_due_scheduled_tasks()
    print(f"\n  Scheduled tasks due now: {len(due)}")
    for t in due:
        print(f"    - {t['name']} ({t['schedule_str']}, model={t['model']})")

    print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Sartor Heartbeat Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python heartbeat.py               Run one tick cycle
  python heartbeat.py --status      Show heartbeat status
  python heartbeat.py --dry-run     Show what would run, no execution
  python heartbeat.py --health-only Run health checks only
  python heartbeat.py --verbose     Verbose logging
        """,
    )
    parser.add_argument("--status", action="store_true",
                        help="Show heartbeat status from log")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would run without executing")
    parser.add_argument("--health-only", action="store_true",
                        help="Run health checks only, no task execution")
    parser.add_argument("--verbose", action="store_true",
                        help="Extra logging output")
    args = parser.parse_args()

    global VERBOSE
    VERBOSE = args.verbose

    if args.status:
        show_status()
        return

    sys.exit(run_tick(dry_run=args.dry_run, health_only=args.health_only))


if __name__ == "__main__":
    main()
