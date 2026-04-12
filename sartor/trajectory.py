#!/usr/bin/env python3
"""
Trajectory logging for the Sartor heartbeat system.

Writes JSONL entries to data/trajectories/{date}.jsonl.
Each entry captures one action (task execution, health check, etc.)
with enough context for the EVOLVE loop to diagnose patterns.

Usage:
    from trajectory import log_action
    log_action("morning-briefing", "execute", tool="claude", status="ok", duration_ms=12340)

    python trajectory.py --test   # write a test entry and verify
"""

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

SARTOR_DIR = Path(__file__).resolve().parent
REPO_DIR = SARTOR_DIR.parent
TRAJECTORIES_DIR = REPO_DIR / "data" / "trajectories"


def log_action(
    task_name: str,
    action: str,
    *,
    tool: str = "",
    input_summary: str = "",
    output_summary: str = "",
    duration_ms: int = 0,
    status: str = "ok",
    error: str = "",
) -> dict:
    """
    Append one trajectory entry to today's JSONL file.

    Returns the entry dict that was written.
    """
    TRAJECTORIES_DIR.mkdir(parents=True, exist_ok=True)

    today = datetime.now().strftime("%Y-%m-%d")
    trajectory_file = TRAJECTORIES_DIR / f"{today}.jsonl"

    entry = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "task_name": task_name,
        "action": action,
        "tool": tool,
        "input_summary": input_summary[:500],
        "output_summary": output_summary[:500],
        "duration_ms": duration_ms,
        "status": status,
        "error": error[:300] if error else "",
    }

    try:
        with open(trajectory_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"WARNING: trajectory log failed: {e}", file=sys.stderr)

    return entry


def _test():
    """Write a test entry and verify it was persisted."""
    entry = log_action(
        "trajectory-self-test",
        "test",
        tool="trajectory.py",
        input_summary="--test flag invoked",
        output_summary="test entry created",
        duration_ms=0,
        status="ok",
    )

    today = datetime.now().strftime("%Y-%m-%d")
    trajectory_file = TRAJECTORIES_DIR / f"{today}.jsonl"

    if not trajectory_file.exists():
        print("FAIL: trajectory file was not created")
        sys.exit(1)

    last_line = trajectory_file.read_text(encoding="utf-8").strip().splitlines()[-1]
    parsed = json.loads(last_line)

    if parsed["task_name"] != "trajectory-self-test":
        print(f"FAIL: unexpected task_name: {parsed['task_name']}")
        sys.exit(1)

    print(f"OK: test entry written to {trajectory_file}")
    print(f"    entry: {json.dumps(entry, indent=2)}")
    sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sartor trajectory logger")
    parser.add_argument("--test", action="store_true", help="Write a test entry and verify")
    args = parser.parse_args()

    if args.test:
        _test()
    else:
        parser.print_help()
