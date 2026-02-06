"""
Sartor Network Dashboard - Flask Backend
Combines OpenClaw gateway patterns with Sartor agent management.
"""

import os
import sys
import json
import time
import subprocess
import threading
from datetime import datetime
from pathlib import Path

from flask import Flask, send_from_directory, jsonify, request
from flask_socketio import SocketIO, emit

# Add skills to path
SKILLS_DIR = os.path.join(os.path.dirname(__file__), '..', '.claude', 'skills')
sys.path.insert(0, os.path.join(SKILLS_DIR, 'openclaw-patterns'))
sys.path.insert(0, os.path.join(SKILLS_DIR, 'chrome-automation'))

from gateway import Gateway, AgentStatus
from memory_local_first import LocalFirstMemory, HeartbeatScheduler

# Initialize Flask
app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'sartor-network-2026'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize Gateway
gateway = Gateway(port=5000)

# Initialize Memory
MEMORY_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'dashboard-memory')
memory = LocalFirstMemory(MEMORY_DIR)

# Initialize heartbeat scheduler
heartbeat = HeartbeatScheduler(
    os.path.join(MEMORY_DIR, 'heartbeat.md'),
    interval=30
)

# Activity log
activity_log = []
MAX_LOG_ENTRIES = 200

def log_activity(message, level="info"):
    """Add an activity log entry and broadcast it."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "message": message,
        "level": level,
    }
    activity_log.append(entry)
    if len(activity_log) > MAX_LOG_ENTRIES:
        activity_log.pop(0)
    socketio.emit('log_event', entry)


# ─── System Metrics ────────────────────────────────────────────

def get_gpu_metrics():
    """Get NVIDIA GPU metrics."""
    try:
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=name,temperature.gpu,memory.used,memory.total,utilization.gpu',
             '--format=csv,noheader,nounits'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            parts = [p.strip() for p in result.stdout.strip().split(',')]
            return {
                "name": parts[0],
                "temp": int(parts[1]),
                "vram_used": int(parts[2]),
                "vram_total": int(parts[3]),
                "utilization": int(parts[4]),
            }
    except Exception:
        pass
    return {"name": "Unknown", "temp": 0, "vram_used": 0, "vram_total": 0, "utilization": 0}


def get_cpu_metrics():
    """Get CPU metrics."""
    try:
        with open('/proc/loadavg') as f:
            load = f.read().split()
        with open('/proc/cpuinfo') as f:
            cores = sum(1 for line in f if line.startswith('processor'))
        # CPU usage from /proc/stat
        with open('/proc/stat') as f:
            cpu_line = f.readline().split()
        total = sum(int(x) for x in cpu_line[1:])
        idle = int(cpu_line[4])
        usage = round((1 - idle / total) * 100, 1) if total > 0 else 0
        return {
            "usage": usage,
            "cores": cores,
            "load_1m": float(load[0]),
            "load_5m": float(load[1]),
            "load_15m": float(load[2]),
        }
    except Exception:
        return {"usage": 0, "cores": 0, "load_1m": 0, "load_5m": 0, "load_15m": 0}


def get_ram_metrics():
    """Get RAM metrics."""
    try:
        with open('/proc/meminfo') as f:
            lines = f.readlines()
        info = {}
        for line in lines:
            parts = line.split()
            info[parts[0].rstrip(':')] = int(parts[1])
        total = info.get('MemTotal', 0) // 1024  # MB
        available = info.get('MemAvailable', 0) // 1024
        used = total - available
        return {"used_mb": used, "total_mb": total}
    except Exception:
        return {"used_mb": 0, "total_mb": 0}


def get_system_status():
    """Get full system status."""
    return {
        "gpu": get_gpu_metrics(),
        "cpu": get_cpu_metrics(),
        "ram": get_ram_metrics(),
        "gateway": gateway.get_status(),
        "memory_stats": memory.stats(),
        "uptime": time.time() - app_start_time,
        "timestamp": datetime.now().isoformat(),
    }


# ─── CDP Browser Integration ──────────────────────────────────

def get_cdp_client():
    """Get a CDP client instance."""
    try:
        from cdp_client import CDPClient
        return CDPClient(port=9223)
    except Exception:
        return None


# ─── Routes ────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)


@app.route('/api/status')
def api_status():
    return jsonify(get_system_status())


@app.route('/api/agents')
def api_agents():
    return jsonify(gateway.get_status()["agents"])


@app.route('/api/memory/search')
def api_memory_search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    results = memory.search(query, limit=10)
    entries = []
    for key, score in results:
        entry = memory.get(key)
        if entry:
            entries.append({
                "key": entry.key,
                "content": entry.content[:500],
                "tags": entry.tags,
                "score": round(score, 2),
                "timestamp": entry.timestamp,
            })
    return jsonify(entries)


@app.route('/api/memory/recent')
def api_memory_recent():
    entries = memory.get_recent(10)
    return jsonify([{
        "key": e.key,
        "content": e.content[:500],
        "tags": e.tags,
        "timestamp": e.timestamp,
    } for e in entries if e])


@app.route('/api/memory', methods=['POST'])
def api_memory_store():
    data = request.json
    memory.store(
        key=data.get('key', ''),
        content=data.get('content', ''),
        tags=data.get('tags', []),
        source=data.get('source', 'dashboard'),
    )
    return jsonify({"status": "ok"})


@app.route('/api/log')
def api_log():
    return jsonify(activity_log[-50:])


@app.route('/api/browser/tabs')
def api_browser_tabs():
    client = get_cdp_client()
    if not client:
        return jsonify({"error": "CDP not available"}), 503
    try:
        tabs = client.list_tabs()
        return jsonify([{
            "id": t["id"],
            "title": t.get("title", ""),
            "url": t.get("url", ""),
        } for t in tabs])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/browser/screenshot')
def api_browser_screenshot():
    client = get_cdp_client()
    if not client:
        return jsonify({"error": "CDP not available"}), 503
    try:
        tabs = client.list_tabs()
        if not tabs:
            return jsonify({"error": "No tabs open"}), 404
        b64 = client.screenshot(tabs[0]["id"], format="jpeg", quality=80)
        title = client.get_page_title(tabs[0]["id"])
        url = tabs[0].get("url", "")
        return jsonify({
            "image": b64,
            "title": title,
            "url": url,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/browser/navigate', methods=['POST'])
def api_browser_navigate():
    data = request.json
    url = data.get('url', '')
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    client = get_cdp_client()
    if not client:
        return jsonify({"error": "CDP not available"}), 503
    try:
        tabs = client.list_tabs()
        if not tabs:
            tab = client.new_tab(url)
            tab_id = tab["id"]
        else:
            tab_id = tabs[0]["id"]
            client.navigate(tab_id, url)
        log_activity(f"Navigated to: {url}", "info")
        return jsonify({"status": "ok", "tab_id": tab_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── WebSocket Events ─────────────────────────────────────────

@socketio.on('connect')
def handle_connect():
    log_activity("Dashboard client connected", "success")
    emit('status_update', get_system_status())


@socketio.on('disconnect')
def handle_disconnect():
    log_activity("Dashboard client disconnected", "warning")


@socketio.on('search_memory')
def handle_search_memory(data):
    query = data.get('query', '')
    results = memory.search(query, limit=10)
    entries = []
    for key, score in results:
        entry = memory.get(key)
        if entry:
            entries.append({
                "key": entry.key,
                "content": entry.content[:500],
                "tags": entry.tags,
                "score": round(score, 2),
            })
    emit('search_results', entries)


@socketio.on('navigate')
def handle_navigate(data):
    url = data.get('url', '')
    client = get_cdp_client()
    if client and url:
        try:
            tabs = client.list_tabs()
            if tabs:
                client.navigate(tabs[0]["id"], url)
                log_activity(f"Browser navigated to: {url}")
                emit('navigate_result', {"status": "ok"})
            else:
                emit('navigate_result', {"error": "No tabs"})
        except Exception as e:
            emit('navigate_result', {"error": str(e)})


@socketio.on('screenshot')
def handle_screenshot(data=None):
    client = get_cdp_client()
    if client:
        try:
            tabs = client.list_tabs()
            if tabs:
                b64 = client.screenshot(tabs[0]["id"], format="jpeg", quality=80)
                title = client.get_page_title(tabs[0]["id"])
                emit('screenshot_result', {"image": b64, "title": title})
        except Exception as e:
            emit('screenshot_result', {"error": str(e)})


# ─── Background Status Broadcaster ────────────────────────────

def status_broadcaster():
    """Periodically broadcast system status to all connected clients."""
    while True:
        time.sleep(5)
        try:
            status = get_system_status()
            socketio.emit('status_update', status)
        except Exception:
            pass


# ─── Seed Data ─────────────────────────────────────────────────

def seed_initial_data():
    """Seed the gateway and memory with initial data."""
    # Register some agents
    gateway.register_agent("orchestrator", capabilities=["coordinate", "delegate", "synthesize"])
    gateway.register_agent("researcher", capabilities=["web_search", "read_files", "analyze"])
    gateway.register_agent("implementer", capabilities=["write_code", "run_tests", "deploy"])
    gateway.register_agent("browser-agent", capabilities=["navigate", "screenshot", "scrape"])

    # Seed some memories
    memory.store("system_architecture",
        "Sartor Network: Multi-tier AI memory system with self-improving agents. "
        "Uses OpenClaw-inspired Gateway pattern for coordination, local-first markdown memory, "
        "and Chrome CDP for browser automation.",
        tags=["architecture", "system"])

    memory.store("gpu_server",
        "gpuserver1 (192.168.1.100): RTX 5090 32GB, i9-14900K 32 threads, 128GB RAM. "
        "Ubuntu 22.04, PyTorch 2.11+cu128, Chrome 144 headless on port 9223.",
        tags=["hardware", "infrastructure"])

    memory.store("openclaw_patterns",
        "Integrated patterns: 1) Gateway control plane, 2) Local-first markdown memory "
        "with BM25 search, 3) Heartbeat/proactive scheduler, 4) Session compaction flush.",
        tags=["openclaw", "patterns", "architecture"])

    memory.store("chrome_automation",
        "Two approaches: CDP direct (any machine, port 9223) and extension bridge "
        "(Windows, named pipe). CDP client in Python: cdp_client.py. "
        "Extension protocol: execute_tool method with tool+args params.",
        tags=["chrome", "automation", "tools"])

    log_activity("Dashboard initialized with seed data", "success")
    log_activity(f"Gateway: {len(gateway.agents)} agents registered", "info")
    log_activity(f"Memory: {memory.stats()['total_entries']} entries loaded", "info")


# ─── Main ──────────────────────────────────────────────────────

app_start_time = time.time()

if __name__ == '__main__':
    seed_initial_data()

    # Start background status broadcaster
    broadcaster = threading.Thread(target=status_broadcaster, daemon=True)
    broadcaster.start()

    log_activity("Sartor Dashboard starting on port 5000", "success")
    print("=" * 60)
    print("  Sartor Network Dashboard")
    print(f"  http://0.0.0.0:5000")
    print("=" * 60)

    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)
