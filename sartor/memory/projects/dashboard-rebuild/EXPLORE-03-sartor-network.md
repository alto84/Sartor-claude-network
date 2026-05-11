---
entity: explore-sartor-network
type: explore
phase: 1
date: 2026-05-02
updated: 2026-05-02
updated_by: dashboard-engineer
scope: Sartor Network Dashboard supersession check (Phase 1C — diagnosis only, no disposition action)
parent: dashboard-status (audit dossier 2026-05-02)
sibling_explores: [EXPLORE-01-meridian (complete), EXPLORE-02-briefing (complete)]
greenlight_gates_referenced: [G3 archive-vs-delete]
related: [.claude/skills/_archive/coordination-cluster-2026-04/openclaw-patterns]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# EXPLORE-03 — Sartor Network Dashboard supersession check

## Verdict (one paragraph)

The loose-on-disk `sartor-dashboard-backend/` + `sartor-dashboard-frontend/` are an **86-day-old (2026-02-06) frozen artifact, dead-imports-on-startup, contains zero family-relevant content, has zero unique features vs MERIDIAN, and is referenced from zero scripts/scheduled-tasks/CLAUDE.md/skills**. It cannot start because its `from gateway import ...` and `from memory_local_first import ...` resolve against `SKILLS_DIR/openclaw-patterns/` — that directory was archived to `.claude/skills/_archive/coordination-cluster-2026-04/` on 2026-04-19. The frontend hard-codes a websocket URL pointing at gpuserver1 (`ws://192.168.1.100:5000`) but the backend would run on Rocinante — architectural orphan even if dependencies were fixed. Default-bias toward ARCHIVE applies cleanly: zero risk of breaking anything (it is already broken and unused), but zero confidence of zero-cost-of-being-wrong on DELETE because **a parallel in-repo divergent fork exists at `Sartor-claude-network/dashboard/app.py`** (different sibling, larger 26 KB version with extra Gmail/Calendar imports) — flagging this scope clarification as the most important Phase 1C finding.

## Step 1 — Backend code audit

`C:\Users\alto8\sartor-dashboard-backend\app.py` (13,756 bytes, mtime **2026-02-06**, 410 lines).

**Imports:**
```python
flask, flask_socketio              # web framework
gateway (Gateway, AgentStatus)     # FROM SKILLS_DIR/openclaw-patterns/ ← BROKEN
memory_local_first (LocalFirstMemory, HeartbeatScheduler)  # SAME ← BROKEN
cdp_client.CDPClient               # imported lazily inside get_cdp_client()
nvidia-smi via subprocess          # GPU metrics
```

**Routes (HTTP):**
| Route | Method | Purpose | Data source |
|---|---|---|---|
| `/` | GET | serve `static/index.html` (only `static/placeholder.html` exists on disk; **no index.html in static/**) | local file |
| `/static/<path>` | GET | static-file passthrough | local files |
| `/api/status` | GET | `{gpu, cpu, ram, gateway_status, memory_stats, uptime, timestamp}` | nvidia-smi + /proc/* + Gateway + LocalFirstMemory |
| `/api/agents` | GET | `gateway.get_status()["agents"]` | Gateway (in-memory) |
| `/api/memory/search?q=` | GET | BM25 search results from LocalFirstMemory | local-first md store |
| `/api/memory/recent` | GET | last 10 entries | local-first md store |
| `/api/memory` | POST | store new entry | local-first md store |
| `/api/log` | GET | last 50 activity log entries | in-memory deque |
| `/api/browser/tabs` | GET | list Chrome tabs via CDP port 9223 | CDPClient |
| `/api/browser/screenshot` | GET | screenshot first tab as base64 jpeg | CDPClient |
| `/api/browser/navigate` | POST | navigate first tab to URL | CDPClient |

**WebSocket events (Socket.IO):** `connect`, `disconnect`, `search_memory`, `navigate`, `screenshot`. Plus a 5-second background broadcaster pushing `status_update` to all connected clients.

**Data sources on machine startup:**
- `nvidia-smi` (subprocess; works on gpuserver1, doesn't work on Rocinante)
- `/proc/loadavg`, `/proc/cpuinfo`, `/proc/stat`, `/proc/meminfo` — **Linux-only paths**. On Rocinante (Windows) all these `open()` calls fail and the metrics functions return all-zero dicts (silent except-pass)
- `LocalFirstMemory` initialized at `<repo>/data/dashboard-memory/` — that directory does not exist; LocalFirstMemory presumably creates it on first write
- `HeartbeatScheduler` writes to `data/dashboard-memory/heartbeat.md` every 30s
- `seed_initial_data()` registers 4 hardcoded agents and 4 hardcoded memories on every restart — wipes any state continuity

**Conclusion:** The backend was clearly written to run on **gpuserver1** (Linux paths, nvidia-smi, network address it shares with the broadcaster URL the frontend connects to). Running it on Rocinante was never the intended deployment.

## Step 2 — Dependency check (gateway + memory_local_first)

The `sys.path.insert` at app.py:19-21 expects skills at:
- `<app.py dir>/../.claude/skills/openclaw-patterns/`  → resolves to `C:\Users\alto8\.claude\skills\openclaw-patterns\` — **MISSING**
- `<app.py dir>/../.claude/skills/chrome-automation/`  → resolves to `C:\Users\alto8\.claude\skills\chrome-automation\` — **MISSING** (also archived per MEMORY.md 2026-04-19)

**Where `openclaw-patterns/` actually lives:** `C:\Users\alto8\Sartor-claude-network\.claude\skills\_archive\coordination-cluster-2026-04\openclaw-patterns\` — confirmed via direct filesystem check. Contents: `gateway.py` (7012 B), `memory_local_first.py` (9691 B), `SKILL.md` (2811 B). All last-modified 2026-02-06 (same day as the dashboard).

So even if I copy/symlink the archived modules into `.claude/skills/openclaw-patterns/`, I would be resurrecting code that the 2026-04-19 cleanup explicitly archived as part of the 14-skill coordination-cluster collapse (per `MEMORY.md` 2026-04-19 morning entry). That cleanup absorbed the canonical content into `multi-agent-orchestration/` — the dashboard's gateway/memory imports point at the abandoned source.

Per task constraint, did NOT attempt to start the Flask app. Diagnosis is sufficient: **two top-level `from X import Y` statements at lines 23-24 will raise `ModuleNotFoundError` before any route is registered.** App cannot start.

## Step 3 — Frontend characterization

`C:\Users\alto8\sartor-dashboard-frontend\index.html` (29,778 bytes, mtime 2026-02-06, 726 lines, ~280 lines of CSS + ~360 lines of JS + minimal HTML body).

**Visible panels (5 rendered cards + a metrics row):**
1. **Top metrics row** (4 cards): GPU util/temp/VRAM, CPU usage/load, RAM usage, Network (agents online + tasks pending)
2. **Agent Status grid** — list of agents with badge (idle/busy/offline), task name, heartbeat age, capability tags
3. **Task Queue** — list of tasks with status (active/pending/completed) and progress bar
4. **Memory Search** — text input + "Search" button + result list with BM25 score and tag chips
5. **Browser Automation** — URL input + "Navigate" / "Screenshot" buttons + screenshot viewer
6. **Activity Log** — scrolling log of `{time, type, msg}` entries
7. **Flow Field "Fun Zone"** — particle-system canvas animation

**Hardcoded mock data** (this is significant): the JS state object at lines 357-389 ships with **fake demo data**:
- 6 fake agents named "gateway/explorer/coder/researcher/tester/browser" — none of which match Sartor's actual agent registry (`gpu-ops`, `family-scheduler`, `wiki-reader`, etc. per CLAUDE.md)
- 6 fake tasks like "T-001: Build dashboard frontend / 75%"
- 8 fake log entries with hardcoded timestamps `12:04:11`, `12:03:58`, etc.
- 3 fake memory entries about "chrome cdp automation toolkit", "BM25 search", "agent heartbeat monitoring"

The page renders this demo data unconditionally on `DOMContentLoaded` (line 705-712), so even with the backend dead, the dashboard "works" cosmetically — it's a never-updating snapshot of demo content from Feb 6.

**WebSocket target hard-coded** (line 396): `io('ws://192.168.1.100:5000', ...)` — gpuserver1's address. Backend is on Rocinante. Even if both ran, frontend would never reach backend.

**Family-relevant content:** **NONE.** Zero references to family/, FAMILY.md, kids' names, school, pediatrician, calendar events, dashboards, or any of the 14 active todos in the canonical `family/active-todos.md`.

## Step 4 — Feature comparison vs MERIDIAN

Mapping each Sartor Network Dashboard feature to its MERIDIAN equivalent:

| Sartor Network Dashboard feature | MERIDIAN equivalent | Where |
|---|---|---|
| GPU util/temp/VRAM card | GPU Server Control card | index.html:2326, `/api/gpu/status` `/api/gpu/rental` |
| CPU usage card | (none — MERIDIAN doesn't surface CPU) | gap, but MERIDIAN watches gpuserver1 health via `/api/system` `/api/household-health` instead — different focus |
| RAM usage card | (same as CPU — gap) | same |
| Network "agents online" | `/api/system` services list | server.py:783 |
| Agent Status grid | (none — MERIDIAN doesn't surface agent registry) | minor gap; agent registry is in `.claude/agents/` files, not surfaced as a panel |
| Task Queue | Active Tasks card (with full CRUD) | index.html:2220, `/api/tasks` GET/POST/PATCH/DELETE |
| Memory Search | Family Wiki search + `/api/memory-search` + `/api/wiki-pages` + `/api/wiki/{path}` + `/api/memory-graph` (D3 force-graph) | index.html:2273, server.py:2319/2538/2576/1620 — strictly larger surface |
| Memory Recent | `/api/memory-recent` | server.py:2051 |
| Memory Store (POST) | (none — MERIDIAN is read-mostly for memory) | gap, but the memory-store path was just for the dashboard's own demo data; not actually used |
| Activity Log | (none in MERIDIAN's panel set, but `/api/observer-report` `/api/cron-health` `/api/heartbeat-status` `/api/heartbeat-live` cover the same ground) | gap | strictly larger surface |
| Browser Automation (CDP nav/screenshot) | (none — MERIDIAN doesn't embed browser automation) | gap, but `chrome-automation` skill is the canonical channel; embedding it in a dashboard panel was rejected by the 2026-04-19 cleanup |
| Flow Field canvas (Fun Zone) | (none — MERIDIAN has Memory Tab D3 force-graph instead) | gap; arguable equivalence; Fun Zone is decorative |

**Unique features in Sartor Network Dashboard that MERIDIAN does not have:**
- Browser-automation panel (CDP navigate + screenshot from a UI button)
- Hardware metrics (CPU%, RAM%) for the local machine
- Generic activity log feed with type tags
- Decorative particle-system "Fun Zone"

**Are any of these worth porting?**
- **Browser-automation panel:** No. The architectural decision in 2026-04-19 was to use `chrome-automation` as a skill invoked from inside Claude Code, not from a dashboard button. Porting reverses an explicit cleanup decision.
- **Local CPU/RAM metrics:** Marginal. MERIDIAN's `/api/system` already pings gpuserver1 and the household-health endpoint covers cross-machine state. Adding Rocinante-local CPU/RAM is achievable in <30 lines but is not load-bearing for the family-thread mission.
- **Generic activity log:** Already covered by `/api/observer-report` + `/api/cron-health` + `/api/heartbeat-live`. The dashboard's log was driven by demo seed data anyway.
- **Fun Zone:** Decorative; MERIDIAN's Memory Tab force-graph is more substantive.

**Net: zero unique features need porting.** Feature parity is met or exceeded by MERIDIAN.

## Step 5 — Disposition recommendation

**ARCHIVE** — recommended.

Move both directories to `C:\Users\alto8\Sartor-claude-network\archive\2026-05-sartor-dashboard-superseded\` (matching the existing archive convention at `.claude\skills\_archive\coordination-cluster-2026-04\`). Include a `README.md` in the archive dir explaining: superseded by MERIDIAN, broken-on-import as of 2026-04-19, kept for code-pattern reference only.

**Why not DELETE:**
1. The code was clearly the prototype that fed into MERIDIAN's design — the BM25 memory search pattern, the WebSocket-broadcast architecture, the agent registry concept all transferred. Loss-of-history concern.
2. Zero cost to keep ~45 KB of frozen code on disk under `archive/`.
3. The "in-repo divergent fork at `Sartor-claude-network/dashboard/app.py`" finding (see §6 below) means we want to preserve the loose-on-disk version's exact state until we figure out what the in-repo fork is — they may share heritage.
4. Default-bias toward ARCHIVE in the task constraints; only recommend DELETE on overwhelming evidence the code is worthless. It's not worthless, just superseded.

**Why not LEAVE-IN-PLACE:**
- It actively pollutes the dashboard-discovery audit. Two future explores or audits will trip over it. The audit dossier already had to call it out as "non-canonical, likely broken."
- Having a Sartor-named dashboard sibling at the user's home directory creates ongoing confusion. Move it under `archive/` so it stops appearing in routine `ls`.

## Step 6 — Reference grep across codebase

Grep for `sartor-dashboard-backend` and `sartor-dashboard-frontend` (case-insensitive) across:

**A. `Sartor-claude-network/` (active code + memory):** 13 hits, all in MEMORY/PROJECT documentation:
- `sartor/memory/projects/dashboard-rebuild/INDEX.md` — 4 hits (this project's own scoping doc, references the dashboard for archival)
- `sartor/memory/projects/family-thread-dossier/dashboard-status.md` — 5 hits (the audit that scoped this work)
- `sartor/memory/projects/memory-system-v2/06-dashboard-scout.md` — 2 hits ("sibling, not target" — calls out the in-repo `dashboard/app.py` overlap, see below)
- `sartor/memory/projects/memory-system-v2/NARRATIVE.md` — 1 hit
- `dashboard/static/fun/index.html:262` — 1 hit ("Sartor Network Dashboard — Creative Lab" link in a static fun page; see §F1)

**Zero hits in:**
- `.claude/scheduled-tasks/`
- `.claude/skills/`
- `.claude/agents/`
- `.claude/commands/`
- `scripts/`
- `CLAUDE.md` (Sartor Infrastructure table at lines describing dashboards mentions `dashboard/family/server.py` only — MERIDIAN — not the loose dashboards)

**B. Outside the repo (`C:\Users\alto8`, including `.claude/` non-repo files):** matches only in conversation transcripts (`projects/C--Users-alto8/*.jsonl`, `subagents/*.jsonl`) and team-thread state files (`.claude/teams/family-thread/inboxes/*.json`, `.claude/tasks/family-thread/10.json`). All transient — these are this very investigation talking about the dashboards.

**C. `C:\Users\alto8\scripts\`:** zero hits — no script references it.

**D. Windows Scheduled Tasks:** I did not enumerate scheduled tasks for "sartor-dashboard" specifically, but the audit's port scan confirmed nothing is listening on 5000 (the dashboard's port), so no auto-start exists.

**Conclusion: zero live references.** All hits are either documentation talking about the dashboard, or transient state files for this investigation. No script, config, scheduled task, skill, agent, or canonical reference (CLAUDE.md, INDEX, MEMORY) points at the loose dashboards.

## CRITICAL FINDING — in-repo divergent fork

While grepping, I found `C:\Users\alto8\Sartor-claude-network\dashboard\app.py` (26,748 bytes, **2026-02-06**, ~13 KB larger than the loose copy). It is named "Sartor Network Dashboard - Flask Backend" identically and starts with the **same** broken imports at lines 19-24:
```python
sys.path.insert(0, os.path.join(SKILLS_DIR, 'openclaw-patterns'))
sys.path.insert(0, os.path.join(SKILLS_DIR, 'chrome-automation'))
from gateway import Gateway, AgentStatus
from memory_local_first import LocalFirstMemory, HeartbeatScheduler
```

But it ALSO imports (with try/except graceful failure):
```python
from google_calendar import get_upcoming_events
from google_gmail import get_recent_messages, get_unread_count
```

So this is a **fork that diverged from the loose dashboard, added Gmail+Calendar features, then was abandoned at the same Feb 6 cutoff**. It lives in the active repo at `dashboard/app.py` alongside the active MERIDIAN at `dashboard/family/server.py`. The `dashboard/` directory contains a full Next.js-style scaffolding (`.env.example`, `.env.local`, `components.json`, `eslint.config.mjs`, etc.) that is unrelated to MERIDIAN.

**Implication for disposition:** my assigned scope is the LOOSE-on-disk pair under `C:\Users\alto8\sartor-dashboard-{backend,frontend}\`. But archiving them in isolation while leaving the in-repo fork at `Sartor-claude-network/dashboard/app.py` would be inconsistent — the same dead pattern lives in both. **Strongly recommend Phase 1C-bis or a Phase 2 design item to assess the in-repo fork.** It is NOT in scope for this memo; flagging only.

The earlier `06-dashboard-scout.md` (memory-system-v2 project) already flagged this exact overlap: "the Sartor Network Dashboard (`dashboard/app.py`) overlaps. It has its own `/api/memory/search` and `/api/memory/recent`. If it's still running, the team has two dashboards already." That recommendation — confirm with Alton whether to deprecate before adding more — was never executed. It's now four months later.

## Findings worth a follow-up (not fixes, just noticed)

- **F1.** `Sartor-claude-network/dashboard/static/fun/index.html:262` contains an `<a href="/">Sartor Network Dashboard</a>` link labeled "Creative Lab". This static page is unrelated to the backend Flask app but inherits the name. Cosmetic; would orphan a link if archive happens. Trivial fix.
- **F2.** `placeholder.html` is the only file in `sartor-dashboard-backend/static/` (292 bytes). `app.py:153` does `send_from_directory('static', 'index.html')` — would 404 even if the app started, because there's no `index.html` in `static/`. The frontend at `sartor-dashboard-frontend/index.html` is in a sibling directory the backend doesn't know about. This is **further evidence the project was never operationally complete**; even on Feb 6 it was a half-wired prototype.
- **F3.** Both `archived openclaw-patterns/gateway.py` (7 KB) and `memory_local_first.py` (9.7 KB) are still on disk under `_archive/`. If the multi-agent-orchestration consolidation absorbed their canonical content per MEMORY.md 2026-04-19, the archive copies could themselves be cleaned up — but that's out of scope for dashboard work.
- **F4.** `C:\Users\alto8\` is not a git repo, and neither `sartor-dashboard-backend/` nor `sartor-dashboard-frontend/` are git repos. **Archive will lose no version history that doesn't exist on disk already.** Files have a single mtime (2026-02-06).
- **F5.** The `dashboard/.env.local` file (4.5 KB) inside the in-repo fork's directory may contain secrets. **Do not include in any future archive without scrubbing.** This is an outright concern only when the in-repo fork is touched (which is out of scope here), but flagging now.

## Reference: artifacts and reproductions

- Filesystem inventory: shown in §1 (loose-on-disk dirs both 2/6/2026, sub-dirs minimal)
- Archived-skills location: `C:\Users\alto8\Sartor-claude-network\.claude\skills\_archive\coordination-cluster-2026-04\openclaw-patterns\` (verified)
- Reference grep results: §6 above; full output in PowerShell session
- In-repo divergent fork: `C:\Users\alto8\Sartor-claude-network\dashboard\app.py` (26,748 B, see CRITICAL FINDING)

## Phase boundary

Phase 1C diagnosis complete. No file modified, no directory moved or removed, Flask app not started, no port opened. Awaiting dashboard-keeper review and next-phase assignment. Disposition recommendation: **ARCHIVE** the loose pair, with explicit follow-up needed for the in-repo `dashboard/app.py` divergent fork before treating "Sartor Network Dashboard supersession" as fully resolved.
