# OpenClaw-Inspired Patterns

**Purpose:** Architectural patterns borrowed from OpenClaw for enhanced multi-agent coordination.

## Key Patterns Integrated

### 1. Gateway Control Plane (`gateway.py`)
Single coordination point for agent sessions, task routing, and event streaming.
Replace distributed agent coordination with one authoritative hub.

### 2. Local-First Memory (`memory_local_first.py`)
Markdown files as source of truth with hybrid BM25 search.
Human-readable, editable, portable, auditable.
Includes session compaction/flush for context overflow resilience.

### 3. Heartbeat/Proactive Pattern
Agents periodically check a lightweight checklist file to determine if action is needed.
Enables background monitoring without constant API calls.

### 4. Session Compaction with Memory Flush
Before context overflow, persist important facts to disk.
Preserves continuity across sessions.

## Usage

### Gateway
```python
from gateway import Gateway, AgentStatus

gw = Gateway()
gw.register_agent("researcher", capabilities=["web_search", "read_files"])
gw.register_agent("implementer", capabilities=["write_files", "run_tests"])

task_id = gw.submit_task("web_search", {"query": "OpenClaw"}, source_agent="orchestrator")
gw.process_queue()  # Routes to best available agent
```

### Local-First Memory
```python
from memory_local_first import LocalFirstMemory

mem = LocalFirstMemory("./memory/")
mem.store("gpu_setup", "RTX 5090 with 32GB VRAM, CUDA 12.8", tags=["hardware", "gpu"])
results = mem.search("GPU memory")
mem.flush_session(["User prefers headless Chrome", "CDP port 9223 is standard"])
```

### Heartbeat
```python
from memory_local_first import HeartbeatScheduler

scheduler = HeartbeatScheduler("./heartbeat.md", interval=300)
scheduler.register_check("disk_space", lambda: os.statvfs("/").f_bavail > 1000)
scheduler.register_check("gpu_temp", lambda: get_gpu_temp() < 80)
results = scheduler.run_checks()
```

## OpenClaw Concepts Reference

| OpenClaw Concept | Sartor Equivalent | Status |
|-----------------|-------------------|--------|
| Gateway | `gateway.py` | Integrated |
| Pi Runtime | Claude Code agents | Native |
| Skills (SKILL.md) | `.claude/skills/` | Already exists |
| Local-First Memory | `memory_local_first.py` | Integrated |
| Heartbeat | `HeartbeatScheduler` | Integrated |
| Session Compaction | `flush_session()` | Integrated |
| Channel Adapters | Not yet | Future work |
| ClawHub Registry | Not yet | Future work |

## Sources
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw Architecture Deep Dive](https://rajvijayaraj.substack.com/p/openclaw-architecture-a-deep-dive)
- [DigitalOcean Guide](https://www.digitalocean.com/resources/articles/what-is-openclaw)
