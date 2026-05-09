"""Launch a long-running python script as a fully-detached process so it
survives Bash harness turn boundaries on Windows.

Usage:
    python launch_detached.py <log_path> <script> [script args...]

Returns the PID of the detached worker. The parent exits immediately; the
child runs under its own process group with DETACHED_PROCESS +
CREATE_BREAKAWAY_FROM_JOB so the harness can't reap it.
"""
from __future__ import annotations

import subprocess
import sys


def main():
    if len(sys.argv) < 3:
        print("usage: launch_detached.py <log_path> <script> [args...]", file=sys.stderr)
        sys.exit(2)
    log_path = sys.argv[1]
    script = sys.argv[2]
    script_args = sys.argv[3:]
    py = sys.executable
    cmd = [py, "-u", script] + script_args
    flags = (
        subprocess.DETACHED_PROCESS
        | subprocess.CREATE_NEW_PROCESS_GROUP
        | subprocess.CREATE_BREAKAWAY_FROM_JOB
    )
    with open(log_path, "w", encoding="utf-8") as f:
        p = subprocess.Popen(
            cmd,
            stdout=f,
            stderr=subprocess.STDOUT,
            creationflags=flags,
            close_fds=True,
        )
    print(f"DETACHED PID={p.pid} log={log_path}")
    print(f"CMD={' '.join(cmd)}")


if __name__ == "__main__":
    main()
