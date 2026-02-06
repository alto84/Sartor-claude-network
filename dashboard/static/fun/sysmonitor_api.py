#!/usr/bin/env python3
"""System Monitor API - Serves real-time system stats for the screensaver dashboard.
Runs on port 5002. Refreshes stats every ~1 second.
"""

import json
import os
import re
import subprocess
import threading
import time
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Cached stats - updated by background thread
# ---------------------------------------------------------------------------
_stats = {}
_lock = threading.Lock()

# Previous CPU jiffies for delta calculation
_prev_cpu_times = None

# Previous network counters for throughput calculation
_prev_net = None
_prev_net_time = None


def _parse_nvidia_smi():
    """Query GPU stats via nvidia-smi."""
    try:
        out = subprocess.check_output(
            ["nvidia-smi",
             "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,name",
             "--format=csv,noheader,nounits"],
            text=True, timeout=5
        ).strip()
        parts = [p.strip() for p in out.split(",")]
        return {
            "utilization": int(parts[0]),
            "memory_used": int(parts[1]),
            "memory_total": int(parts[2]),
            "temperature": int(parts[3]),
            "name": parts[4] if len(parts) > 4 else "GPU",
        }
    except Exception as e:
        return {"utilization": 0, "memory_used": 0, "memory_total": 32768,
                "temperature": 0, "name": "RTX 5090", "error": str(e)}


def _parse_proc_stat():
    """Read per-thread CPU utilization from /proc/stat (delta-based)."""
    global _prev_cpu_times
    try:
        with open("/proc/stat") as f:
            lines = f.readlines()

        current = {}
        for line in lines:
            if line.startswith("cpu") and line[3] != " ":
                parts = line.split()
                idx = int(parts[0][3:])
                vals = list(map(int, parts[1:9]))
                idle = vals[3] + vals[4]
                total = sum(vals)
                current[idx] = (idle, total)

        threads_count = len(current)
        per_thread = [0.0] * threads_count

        if _prev_cpu_times is not None and len(_prev_cpu_times) == len(current):
            for idx in sorted(current.keys()):
                prev_idle, prev_total = _prev_cpu_times[idx]
                cur_idle, cur_total = current[idx]
                d_total = cur_total - prev_total
                d_idle = cur_idle - prev_idle
                if d_total > 0:
                    per_thread[idx] = round((1.0 - d_idle / d_total) * 100, 1)

        _prev_cpu_times = current

        overall = sum(per_thread) / max(len(per_thread), 1)
        return {
            "overall": round(overall, 1),
            "threads": per_thread,
            "name": _get_cpu_name(),
            "threads_count": threads_count,
        }
    except Exception as e:
        return {"overall": 0, "threads": [0]*32, "name": "i9-14900K",
                "threads_count": 32, "error": str(e)}


_cpu_name_cache = None
def _get_cpu_name():
    global _cpu_name_cache
    if _cpu_name_cache:
        return _cpu_name_cache
    try:
        with open("/proc/cpuinfo") as f:
            for line in f:
                if line.startswith("model name"):
                    name = line.split(":", 1)[1].strip()
                    name = re.sub(r"\(R\)|\(TM\)", "", name)
                    name = re.sub(r"\s+", " ", name).strip()
                    _cpu_name_cache = name
                    return name
    except Exception:
        pass
    _cpu_name_cache = "i9-14900K"
    return _cpu_name_cache


def _get_ram():
    """RAM stats via psutil."""
    try:
        import psutil
        vm = psutil.virtual_memory()
        return {
            "used_gb": round(vm.used / (1024**3), 1),
            "total_gb": round(vm.total / (1024**3), 1),
            "percent": round(vm.percent, 1),
        }
    except Exception as e:
        return {"used_gb": 0, "total_gb": 128, "percent": 0, "error": str(e)}


def _get_network():
    """Network throughput (Mbps) via psutil, delta-based."""
    global _prev_net, _prev_net_time
    try:
        import psutil
        counters = psutil.net_io_counters()
        now = time.time()
        rx_mbps = 0.0
        tx_mbps = 0.0
        if _prev_net is not None:
            dt = now - _prev_net_time
            if dt > 0:
                rx_mbps = round(((counters.bytes_recv - _prev_net[0]) * 8) / (dt * 1e6), 2)
                tx_mbps = round(((counters.bytes_sent - _prev_net[1]) * 8) / (dt * 1e6), 2)
        _prev_net = (counters.bytes_recv, counters.bytes_sent)
        _prev_net_time = now
        return {"rx_mbps": rx_mbps, "tx_mbps": tx_mbps}
    except Exception as e:
        return {"rx_mbps": 0, "tx_mbps": 0, "error": str(e)}


def _get_claude_status():
    """Detect running Claude Code processes."""
    try:
        out = subprocess.check_output(
            ["bash", "-c", "ps aux | grep -i claude | grep -v grep || true"],
            text=True, timeout=5
        ).strip()
        if not out:
            return {"active": False, "agents": [], "process_count": 0}

        lines = out.strip().split("\n")
        agents = []
        for line in lines:
            if "claude" in line.lower():
                parts = line.split()
                pid = parts[1] if len(parts) > 1 else "?"
                if "subagent" in line.lower() or "agent-" in line.lower():
                    agents.append({"type": "subagent", "pid": pid})
                else:
                    agents.append({"type": "orchestrator", "pid": pid})
        return {
            "active": len(agents) > 0,
            "agents": agents,
            "process_count": len(agents),
        }
    except Exception:
        return {"active": False, "agents": [], "process_count": 0}


def _get_system_info():
    """Hostname and uptime."""
    try:
        hostname = os.uname().nodename
    except Exception:
        hostname = "gpuserver1"

    try:
        with open("/proc/uptime") as f:
            secs = float(f.read().split()[0])
        days = int(secs // 86400)
        hours = int((secs % 86400) // 3600)
        mins = int((secs % 3600) // 60)
        uptime = f"{days}d {hours}h {mins}m"
    except Exception:
        uptime = "unknown"

    return {"hostname": hostname, "uptime": uptime}


def _collect_stats():
    """Collect all stats into the cached dict."""
    gpu = _parse_nvidia_smi()
    cpu = _parse_proc_stat()
    ram = _get_ram()
    net = _get_network()
    claude = _get_claude_status()
    system = _get_system_info()

    with _lock:
        _stats.update({
            "gpu": gpu,
            "cpu": cpu,
            "ram": ram,
            "network": net,
            "claude": claude,
            "system": system,
            "timestamp": time.time(),
        })


def _background_collector():
    """Background thread that refreshes stats every 1s."""
    while True:
        try:
            _collect_stats()
        except Exception as e:
            print(f"[sysmonitor] Collection error: {e}")
        time.sleep(1)


@app.route("/stats")
def stats():
    with _lock:
        return jsonify(_stats)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    _collect_stats()
    t = threading.Thread(target=_background_collector, daemon=True)
    t.start()
    print("[sysmonitor] API starting on port 5002...")
    app.run(host="0.0.0.0", port=5002, debug=False)
