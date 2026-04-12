---
title: MERIDIAN Dashboard Audit
type: project
project: hermes-dashboard-upgrade
created: 2026-04-11
updated: 2026-04-11
---

# MERIDIAN Dashboard Audit

Full read-only audit of `dashboard/family/server.py` (~1803 LOC) and `dashboard/family/index.html` (~4030 LOC) as of 2026-04-11.

---

## Feature Inventory Table

| Feature | Location | Preserve? | Notes |
|---------|----------|-----------|-------|
| HTTP Basic Auth (alton/password) | server.py:20-50 | YES | Added recently tonight; reads from `.secrets/meridian-password.txt`; `MERIDIAN_DEV=1` bypasses |
| FastAPI app-wide auth dependency | server.py:50 | YES | `dependencies=[Depends(require_auth)]` on the app object -- applies to ALL routes |
| CORS middleware (allow all) | server.py:51 | YES | Wide open; intentional for LAN use |
| Greeting endpoint | server.py:277 | YES | Time-of-day salutation + date |
| Family member cards | server.py:297 | YES | 5 members + 3 cats; birthday countdown; age computed live |
| Deadlines tracker | server.py:360 | YES | Hardcoded list; urgency coloring (red <14d, amber <30d, blue else) |
| Task parser (ACTIVE.md) | server.py:390 | YES | Reads `sartor/tasks/ACTIVE.md`; in-progress / pending / completed |
| System status (ping + file counts) | server.py:429 | YES | Pings 192.168.1.100; counts memory and task .md files |
| API cost tracker | server.py:477 | YES | Reads `sartor/costs.json` + `data/heartbeat-log.csv`; daily/weekly/monthly aggregation |
| Career tracker | server.py:548 | YES | Hardcoded; promotion status, bonus, engagements |
| Finances endpoint | server.py:575 | YES | Reads `dashboard/family/finances.json`; all financial data there |
| Quick Links | server.py:587 | YES | Hardcoded list of 10 links |
| Daily Tasks (TODAY.md) | server.py:607 | YES | Reads `tasks/TODAY.md`; section-aware parser |
| Daily Tasks toggle (POST) | server.py:655 | YES | Mutates TODAY.md; moves task between sections; appends log entry |
| Work Streams | server.py:755 | YES | Reads `work/*/status.md`; parses ## Current State, open issues |
| Heartbeat status | server.py:806 | YES | Reads `data/heartbeat-log.csv`; 10 known task names |
| Memory health | server.py:858 | YES | Globs `sartor/memory/*.md`; integrates `decay.py` scores; tier counts |
| Observer report | server.py:911 | YES | Reads `data/observer-log.jsonl`; sentinel/auditor/critic; `docs/proposed-fixes.md` |
| WebSocket /ws/claude | server.py:944 | YES | Claude Sonnet 4-6; streaming; tool-use loop (max 10); 3 tools; max 2 concurrent sessions |
| GPU status (SSH + ping) | server.py:1086 | YES | Pings + SSH echos; checks services via curl over SSH |
| GPU rental widget | server.py:1132 | YES | Proxies from gpuserver1:5060 (Sartor GPU dashboard); rental log, earnings |
| GPU command executor | server.py:1183 | YES | Allowlist of 8 SSH commands; whitelist only |
| Memory graph | server.py:1222 | YES | D3 force-directed; nodes = .md files + section headings; edges = wiki/md/plain links |
| Heartbeat live (last 10 ticks) | server.py:1359 | YES | Reads `data/heartbeat-log.csv`; returns last 10 lines |
| Memory recent (24h activity) | server.py:1392 | YES | Curator log, extractor log, inbox drain dirs; 60s TTL cache |
| Cron health | server.py:1487 | YES | 6 cron defs; heartbeat CSV + curator JSONL; SSH to gpuserver1 for sartor-heartbeat.json; 120s TTL |
| Inbox status | server.py:1604 | YES | Globs `sartor/memory/inbox/*/`; skips internal dirs; frontmatter check |
| Memory search | server.py:1660 | YES | BM25 via `sartor/memory/search.py`; falls back to grep; 60s TTL cache |
| Obsidian open (POST) | server.py:1748 | YES | Proxies to Obsidian Local REST API at 127.0.0.1:27124; reads from `.secrets/obsidian-api-key.txt` |
| Claude tools (read_file, search_files, list_directory) | server.py:103 | YES | Read-only; ALLOWED_DIRS sandboxing |

---

## Endpoint Catalog

| Method | Path | Description | Data Source |
|--------|------|-------------|-------------|
| GET | / | Serves index.html | `dashboard/family/index.html` |
| GET | /api/greeting | Time-of-day greeting | Computed from system clock |
| GET | /api/family | 5 members + 3 cats with birthdays/ages | Hardcoded in server.py |
| GET | /api/deadlines | Upcoming deadlines with urgency | Hardcoded in server.py |
| GET | /api/tasks | Active task list | `sartor/tasks/ACTIVE.md` |
| GET | /api/system | GPU server ping + file counts | ping subprocess + filesystem glob |
| GET | /api/costs | API cost aggregation | `sartor/costs.json` + `data/heartbeat-log.csv` |
| GET | /api/career | Career / promotion status | Hardcoded in server.py |
| GET | /api/finances | Financial snapshot | `dashboard/family/finances.json` |
| GET | /api/links | Quick links list | Hardcoded in server.py |
| GET | /api/daily-tasks | TODAY.md parsed tasks | `tasks/TODAY.md` |
| POST | /api/daily-tasks/toggle | Toggle task done/undone | Mutates `tasks/TODAY.md` |
| GET | /api/work-status | Work stream summaries | `work/*/status.md` |
| GET | /api/heartbeat-status | Scheduled task last-run status | `data/heartbeat-log.csv` |
| GET | /api/heartbeat-live | Last 10 heartbeat ticks | `data/heartbeat-log.csv` |
| GET | /api/memory-health | Memory file tier counts + decay scores | `sartor/memory/*.md` + `sartor/memory/decay.py` |
| GET | /api/memory-graph | Nodes + links for D3 graph | `sartor/memory/*.md` (wiki/md/plain link parsing) |
| GET | /api/memory-recent | 24h memory activity | curator-log.jsonl, extractor-log.jsonl, inbox drain dirs |
| GET | /api/cron-health | Cron job health with last-run + color | heartbeat CSV, curator JSONL, SSH to gpuserver1 |
| GET | /api/inbox-status | Per-machine pending inbox files | `sartor/memory/inbox/*/` |
| GET | /api/memory-search | BM25 / grep memory search | `sartor/memory/search.py` + grep fallback |
| POST | /api/obsidian/open | Open file in Obsidian | Obsidian Local REST API (127.0.0.1:27124) |
| GET | /api/observer-report | Observer health (sentinel/auditor/critic) | `data/observer-log.jsonl` + `docs/proposed-fixes.md` |
| GET | /api/gpu/status | gpuserver1 ping + SSH + service check | subprocess SSH + ping |
| GET | /api/gpu/rental | GPU utilization + vast.ai rental status | Proxies gpuserver1:5060 |
| POST | /api/gpu/command | Run allowlisted SSH command on gpuserver1 | subprocess SSH |
| WS | /ws/claude | Streaming Claude terminal | Anthropic SDK; OAuth from ~/.claude/.credentials.json |

---

## Frontend Component Map

### Layout Structure
- **Header** (sticky): Logo, live clock, gpuserver1 status dot, theme toggle
- **Greeting Bar**: Time-of-day text + date from /api/greeting
- **Urgency Bar**: Top-5 deadline pills (red/amber/blue)
- **Memory Graph** (top panel, always visible): D3 force-directed graph, 520px tall, separate from Memory Tab graph
- **Main Grid** (1.5fr / 1fr two-column):
  - Left stack: Family, Finances, Daily Tasks, Work Streams, Active Tasks, Deadlines
  - Right stack: Quick Links, System Status, Heartbeat, Memory Health (sidebar widget), Observer Status, Career Tracker, API Cost Tracker, GPU Server Control
- **Memory Tab** (below main grid): 6 sub-tabs
- **Claude Terminal** (collapsible, below Memory Tab): WebSocket chat
- **Footer**: Version + last-update timestamp

### Cards / Panels
| Card | API Source | Interactive |
|------|-----------|-------------|
| Family | /api/family | No |
| Finances | /api/finances | Yes — expandable category rows, income/expense drill-down |
| Daily Tasks | /api/daily-tasks | Yes — checkboxes call /api/daily-tasks/toggle |
| Work Streams | /api/work-status | No |
| Active Tasks | /api/tasks | No |
| Deadlines | /api/deadlines | No |
| Quick Links | /api/links | Yes — open in new tab |
| System Status | /api/system | No |
| Heartbeat | /api/heartbeat-status + /api/heartbeat-live | No |
| Memory Health (sidebar) | /api/memory-health | No |
| Observer Status | /api/observer-report | No |
| Career Tracker | /api/career | No |
| API Cost Tracker | /api/costs | No |
| GPU Server Control | /api/gpu/status + /api/gpu/rental + /api/gpu/command | Yes — 8 command buttons, rental widget |

### Memory Tab (6 sub-panels)
| Sub-tab | API | Key Features |
|---------|-----|-------------|
| Graph | /api/memory-graph | D3 force-directed (duplicate of top graph, but with Obsidian open button in tooltip) |
| Heatmap | /api/memory-health | Cluster x tier grid (rows=cluster, cols=ACTIVE/WARM/COLD/FORGOTTEN/ARCHIVE) |
| Recent | /api/memory-recent | 24h activity feed; click-to-open-in-Obsidian |
| Crons | /api/cron-health | Table with health dot + last-run + status |
| Inbox | /api/inbox-status | Per-machine cards with pending count, oldest age, flagged count |
| Search | /api/memory-search | Debounced (300ms) BM25 search; click-to-open-in-Obsidian |

**Health Strip** (always visible above tabs): ACTIVE / WARM / COLD / FORGOTTEN / ARCHIVE / Total counts from /api/memory-health

---

## D3 Memory Graph Configuration

Two independent graph instances share nearly identical code (top panel `renderGraph()` and Memory Tab `renderMemGraph()`):

- **Library**: D3 v7 (CDN: d3js.org/d3.v7.min.js)
- **Layout**: Force simulation
  - forceLink: distance 80 (weight>0.5) or 140; strength = weight*0.5
  - forceManyBody: file nodes -200, section nodes -50
  - forceCenter: container center
  - forceCollide: radius = radiusScale(size)+4 for file nodes, 10 for sections
- **Node types**:
  - `file`: radius 10-32 (linear scale on file size); color by cluster; opacity by tier
  - `section`: radius 4; same cluster color
- **Tier opacity**: ACTIVE=1.0, WARM=0.85, COLD=0.6, FORGOTTEN=0.4, ARCHIVE=0.25
- **Cluster colors**: family=#3b82f6, business=#22c55e, taxes=#ef4444, career=#a855f7, personal=#f59e0b, projects=#14b8a6
- **Edges**: wiki links (weight=1.0), markdown links (weight=0.7), plain name references (weight=0.4), section edges (weight=0.3)
- **Interactions**: zoom (0.3x-4x), drag nodes, hover tooltip (title+tier+score+preview), click to pin tooltip
- **Sections toggle**: `showSections` / `_memShowSections` bool; hides section sub-nodes when false
- **Memory Tab graph extra**: Obsidian open button in tooltip; `window._memCurrentNode` tracks hovered node

**Key difference**: Top-panel graph has NO Obsidian open button; Memory Tab graph does.

---

## CSS / Theming Analysis

- **Approach**: All inline in `<style>` block (single ~2100-line CSS block). No external stylesheet.
- **Variables**: CSS custom properties on `:root` for all colors, font stacks, radius, shadow.
- **Dark theme** (default): `--bg: #0f1117`, `--bg-card: #1a1d27`, `--text: #e4e4e7`, `--accent: #6366f1`
- **Light theme**: toggled via `data-theme="light"` on `<html>`; overrides all variables. State persisted in `localStorage('meridian-theme')`.
- **Font**: `Segoe UI / system-ui` body, `Cascadia Code / Fira Code / Consolas` mono.
- **Responsive**: Single breakpoint at 1200px — main grid collapses to 1 column.
- **Animation**: `pulse` keyframe on status dot and rented GPU badge; `hbPulse` on heartbeat indicator.
- **No external CSS frameworks** (no Tailwind, Bootstrap, etc.).

---

## JavaScript Patterns

- **No framework**: Vanilla JS throughout. Module-like structure via function scope.
- **Data flow**: `fetchJSON(path)` → API → DOM manipulation via `innerHTML` / `createElement`.
- **Security**: `escapeHTML()` used consistently before injecting user-visible strings. One exception: `renderMarkdown()` does not escape before inserting HTML (code block content is escaped, but bold/italic regex could be XSS vector if assistant output contains `**<script>**`).
- **Refresh**: `refreshAll()` runs on load and every 60s. GPU rental refreshes every 30s. Clock every 1s.
- **WebSocket**: Single shared `claudeWs`; reconnects lazily on send; cancel closes and nulls the socket.
- **Caching**: Server-side TTL caches for memory-recent (60s), cron-health (120s), memory-search (60s). No client-side cache.

---

## Things That Are Broken or Half-Implemented

1. **Top memory graph duplicates Memory Tab graph** — Both call `/api/memory-graph` independently. The top-panel graph (`graphData`, `graphSim`, `showSections`) and the Memory Tab graph (`_memGraphData`, `_memGraphSim`, `_memShowSections`) are entirely separate instances. This is redundant — the top panel appears to be a legacy holdover from before the Memory Tab was added. The Memory Tab graph is more feature-complete (has Obsidian open button).

2. **Markdown rendering XSS gap** — `renderMarkdown()` does not sanitize bold/italic patterns before setting innerHTML. If Claude returns content like `**<img onerror=...>**`, it would execute. Low practical risk (Claude output is controlled), but worth fixing in upgrade.

3. **GPU rental proxies gpuserver1:5060** — This port is a separate Sartor GPU dashboard that may or may not be running. `/api/gpu/rental` silently returns `{online: false}` if unreachable. No fallback to direct SSH.

4. **Career and deadlines are hardcoded** — Not driven by any file or API. Promotion status, salary range, bonus date are static strings in server.py. These will drift from reality unless manually updated.

5. **`start_dashboard` SSH command still references old Flask path** — `allowed_commands["start_dashboard"]` runs `flask --app sartor/dashboard/app run ...` which points to the deprecated `dashboard/app.py`.

6. **Cluster labels in top-panel D3 graph don't render correctly** — `clusterPositions` dict is populated but the centroid calculation is never used for rendering (the `clusterLabel` selection references `clusterCentroids` which is computed inside the `tick` callback, so they do render — but the initial setup creates an empty dict unnecessarily).

7. **No error feedback for toggle task failure** — `toggleTask()` catches errors silently and re-fetches regardless. If the toggle write fails, the UI refreshes and shows the old state without alerting the user.

---

## Redundant / Deprecated Items

- **`dashboard/app.py`** (Flask): Confirmed exists at `dashboard/app.py`. Deprecated as of tonight per the task brief. The `start_dashboard` GPU command still references it (see above).
- **Top-panel memory graph**: Functionally duplicate of Memory Tab Graph sub-panel. The Memory Tab version is superior (Obsidian integration). Recommend removing the top-panel graph in the upgrade and keeping only the Memory Tab.
- **`dashboard/family/brief.html`** and **`dashboard/static/`**: A separate `brief.html` exists in the family directory and there are CSS/JS directories under `dashboard/static/`. These appear to be from a prior dashboard iteration and are not referenced by `server.py`.

---

## Things That MUST Be Preserved

Priority order:

1. **Auth** — HTTPBasic with `secrets.compare_digest`, password from `.secrets/meridian-password.txt`, `MERIDIAN_DEV` bypass env var
2. **Memory Tab** — All 6 sub-panels: Graph, Heatmap, Recent, Crons, Inbox, Search
3. **Memory graph D3 visualization** — Tier coloring, cluster coloring, force simulation config, Obsidian open integration
4. **WebSocket Claude terminal at /ws/claude** — Streaming, tool-use loop, tool display blocks, new-conversation clear, max session guard
5. **All /api/* endpoints listed above** — Especially memory-graph, memory-health, memory-recent, cron-health, inbox-status, memory-search, obsidian/open, heartbeat-live, observer-report, greeting
6. **gpuserver1 SSH integration** — gpu/status, gpu/rental (5060 proxy), gpu/command allowlist
7. **Daily Tasks toggle** — The only write endpoint; mutates TODAY.md
8. **finances.json → Finances card** — All derived calculations (net worth, leverage, runway, savings rate, debt/assets, home equity, allocation bar) are computed client-side
9. **Theme persistence** via localStorage
10. **60s auto-refresh** + 30s GPU rental refresh cycle
