---
type: research
phase: explore
updated: 2026-04-12
author: dashboard-scout
task: 11
---

# Phase 1F — Dashboard Scout: Memory Viz Layer

## Executive Summary

**Don't build a new dashboard. Extend MERIDIAN.** It already runs on `localhost:5055` (FastAPI + uvicorn, single ~1357 LOC `dashboard/family/server.py`), it already has `/api/memory-graph` and `/api/memory-health` endpoints, and `dashboard/family/index.html` already renders a D3 force-directed graph of `sartor/memory/*.md` colored by cluster and faded by decay tier. Roughly 60% of the work in the task brief is already shipped. The remaining 40% — staleness heatmap, recent ingestions, cron health, inbox backlog, search-with-Obsidian-handoff — is ~400 LOC of additive endpoints + ~200 LOC of HTML/JS, all in files MERIDIAN already owns. A new Flask/FastAPI/HTMX app would duplicate the WebSocket plumbing, the Claude credential handling, the family/tasks/GPU panels, and the read_file_safe helpers, and would force Alton to remember which dashboard hosts what. The "too many moving parts" concern points hard at consolidation.

## What Exists

### MERIDIAN (`dashboard/family/server.py`, port 5055) — the answer
- **Stack:** FastAPI 1357 LOC, single file. Uvicorn. Anthropic SDK with Claude credentials lifted from `~/.claude/.credentials.json`. WebSocket terminal at `/ws/claude` running an agentic tool loop (read_file/search_files/list_directory). CORS open. No auth — localhost-only.
- **Frontend:** `dashboard/family/index.html`, 3239 LOC of vanilla HTML/CSS/JS + D3.js. No build step. Polls REST endpoints, opens WebSocket for chat.
- **PID 3404 mystery:** that's a Node process — almost certainly `next dev` for the unrelated Next.js app at `dashboard/` root, *not* MERIDIAN. MERIDIAN is the Python uvicorn process. The task brief conflates them.
- **Existing memory endpoints (already shipped):**
  - `GET /api/memory-graph` — nodes (file + section sub-nodes), links from `[[wikilinks]]` + `[markdown](file.md)` + plain stem references, cluster colors, tier overlay from `sartor/memory/decay.py`. Returns `{nodes, links, clusters}`.
  - `GET /api/memory-health` — per-file `{name, size, age_days, tier, score}` plus `{tier_counts, last_autodream, daily_log_count}`. Pulls from `sartor/memory/.meta/consolidation-log.md`.
  - `GET /api/heartbeat-live` — last 10 entries from `data/heartbeat-log.csv` for cron run history.
  - `GET /api/observer-report` — sentinel/auditor/critic latest entries from `data/observer-log.jsonl`.
- **Existing frontend graph (already shipped):** D3 force simulation with zoom, cluster legend, file-size radius scale, tier opacity (`ACTIVE 1.0 → ARCHIVE 0.25`), section toggle, tooltips with previews. ~250 LOC starting at index.html:2975.

### Sartor Network Dashboard (`dashboard/app.py`) — sibling, not target
- Flask + Flask-SocketIO, ~756 LOC. Imports `gateway.Gateway` and `memory_local_first.LocalFirstMemory` from `.claude/skills/openclaw-patterns/`. Has `/api/memory/search`, `/api/memory/recent`, `/api/memory` POST. Different vault model (older `data/dashboard-memory/`, not `sartor/memory/`). Probably stale — no evidence Alton uses it. Worth checking if it's still running before tearing it down.

### Next.js dashboard (`dashboard/` root, `package.json`, `app/`)
- Next 16, React 19, Firebase, NextAuth, Radix UI, Tailwind, recharts, framer-motion. Routes: `/family`, `/tasks`, `/vault`, `/servers`, `/safety`, `/profile`, `/settings`, `/onboarding`. **This is the Node process at PID 3404.** It's a separate, much heavier "personal portal" that Alton was building for cross-device access. It is NOT MERIDIAN. Touching it is out of scope and dangerous (Firebase auth flows, in-progress migrations).

### gpuserver1 gpu-dashboard (`/home/alton/Sartor-claude-network/dashboard/gpu-dashboard/`)
- **Doesn't exist as source.** Only artifact present: `__pycache__/app.cpython-310.pyc`. Whatever app was there was removed; the bytecode is orphaned. Either it was never pushed or it was rm'd. Either way, no live source to model after.
- The actual GPU panel for MERIDIAN comes from `dashboard/family/server.py` lines 1054–1217 (`/api/gpu/status`, `/api/gpu/rental`, `/api/gpu/command`) which SSH into gpuserver1 directly. So GPU visibility is *already* in MERIDIAN.

### Skills with dashboard hooks
- `.claude/skills/openclaw-patterns/` — `gateway.py`, `memory_local_first.py`. Used by the Flask app. Not used by MERIDIAN. Has a `HeartbeatScheduler`.
- `.claude/skills/agent-coordinator/`, `agent-introspection/`, `long-running-harness/` — agent-side, not dashboard-side.
- No `*dashboard*` skill exists.

### Obsidian research (`sartor/memory/reference/obsidian-control-research.md`)
- 151 markdown files / 6 MB vault, small.
- Recommends Obsidian Local REST API plugin (`127.0.0.1:27124`, bearer token, ~17 endpoints) plus optional `mcp-obsidian` MCP wrapper. PATCH supports surgical edits relative to headings/blocks/frontmatter. `/open/{path}` focuses Alton's running Obsidian window.
- This is **load-bearing** for dashboard design: clicking a node should open the note in Obsidian via `/open/{path}`, not render markdown in-dashboard. Dashboard owns *aggregate views*; Obsidian owns *single-note editing*.

## Memory Viz Data Model

What needs to be queryable from the dashboard:

| View | Source of Truth | Endpoint | Status |
|---|---|---|---|
| Graph (nodes=files, edges=links) | `sartor/memory/*.md` + `decay.py` | `/api/memory-graph` | exists |
| Per-file staleness | `decay.py` `compute_all_scores()` | `/api/memory-health` | exists |
| Tier counts (ACTIVE/WARM/COLD/FORGOTTEN/ARCHIVE) | derived | `/api/memory-health` | exists |
| Recent ingestions (24h) | `sartor/memory/daily/*.md` mtimes + `inbox/*/` | `/api/memory-recent` | **new** |
| Cron health (last/next/status) | `data/heartbeat-log.csv` + `.claude/scheduled-tasks/` manifest | `/api/cron-health` | partial — extend `/api/heartbeat-live` |
| Inbox backlog per machine | `sartor/memory/inbox/{hostname}/*.md` counts | `/api/inbox-status` | **new** |
| Search | `sartor/memory/search.py` (BM25) | `/api/memory-search?q=` | **new** but trivial wrapper |
| Open in Obsidian | Obsidian Local REST API `PUT /open/{path}` | client-side fetch | **new** plumbing |
| Conversation-mined facts (from task #10) | wherever miner writes | `/api/memory-pending` | **new**, blocked on phase 1E shape |

Decay tiers and cluster colors are already canonical in `decay.py` and `_CLUSTER_MAP` at top of `server.py`. Reuse, don't redefine.

## Wireframe — MERIDIAN "Memory" Tab

```
┌─ MERIDIAN ──────────────────────────────────────────────────────┐
│  Family · Tasks · GPU · Career · Finances · [Memory] · Briefing │
├─────────────────────────────────────────────────────────────────┤
│  HEALTH STRIP (always visible at top)                            │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐  │
│  │ ACTIVE  │  WARM   │  COLD   │FORGOTTEN│ ARCHIVE │  TOTAL  │  │
│  │   23    │   41    │   58    │   19    │   10    │  151    │  │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘  │
│  Last autodream: 2026-04-09  ·  Daily logs: 87  ·  Vault 6.0MB  │
├─────────────────────────────────────────────────────────────────┤
│  [Graph] [Heatmap] [Recent] [Crons] [Inbox] [Search]   ⌕ ___    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────────────────────┐  ┌──────────────────┐  │
│   │                                   │  │ SELECTED NODE    │  │
│   │     ⬤ ⬤   ⬤                       │  │ ──────────────── │  │
│   │   ⬤ ╲ ╱ ⬤                         │  │ FAMILY.md        │  │
│   │     ⬤───⬤                         │  │ tier: ACTIVE     │  │
│   │   ╱     ╲                         │  │ score: 0.92      │  │
│   │  ⬤       ⬤                        │  │ age: 0.4 days    │  │
│   │     (D3 force graph,              │  │ size: 4.1 KB     │  │
│   │      colored by cluster,          │  │ links: 12 in/out │  │
│   │      faded by tier)               │  │                  │  │
│   │                                   │  │ [Open in         │  │
│   │                                   │  │  Obsidian ↗]     │  │
│   └───────────────────────────────────┘  │ [Refresh decay]  │  │
│                                          └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

Heatmap view: a rectangle per file, area proportional to size, fill = decay score (red=stale → green=fresh), grouped by `_CLUSTER_MAP`. One glance answers "which cluster is rotting?"

Recent view: ordered list of files modified in last 24h, with diff snippet (line count changed), tagged by source (`daily/`, `inbox/{host}/`, manual edit).

Cron view: table — name | schedule | last run | status | next run | last error. Sourced from heartbeat CSV joined against `.claude/scheduled-tasks/` manifests.

Inbox view: per-host card showing pending file count, oldest pending item age, link to drain (curator-only).

Search: BM25 wrapper around `sartor/memory/search.py`. Results show snippet + cluster + tier badge. Click → `PUT http://127.0.0.1:27124/open/{path}` (proxied through MERIDIAN to avoid CORS + cert issues).

## Recommended Implementation Path

**Attach to MERIDIAN. One sub-tab. Five new endpoints. No new processes.**

Phases:

1. **Memory tab scaffold** (1h, ~80 LOC HTML/JS) — add tab nav to index.html, wire to existing `/api/memory-graph` and `/api/memory-health`, move existing graph code into the tab.
2. **Health strip + heatmap view** (1h, ~120 LOC) — sum tiers from existing endpoint, render rect grid colored by score. Pure client-side reuse.
3. **`/api/memory-recent` endpoint + view** (1h, ~80 LOC) — `glob` mtimes, diff against git if available, return last 24h.
4. **`/api/cron-health` extension + view** (1.5h, ~120 LOC) — parse `.claude/scheduled-tasks/*.md` for schedule, join against heartbeat CSV, compute next-run from cron expr.
5. **`/api/inbox-status` + view** (45min, ~60 LOC) — directory walk, count + oldest mtime per host.
6. **`/api/memory-search` wrapper + Obsidian open proxy** (1h, ~100 LOC) — subprocess call to `sartor/memory/search.py`, plus a `POST /api/obsidian/open` that does the bearer-token call to Obsidian REST API server-side. This avoids embedding the Obsidian token in client JS.
7. **Polish: tooltip diffs, empty states, refresh button, dark mode parity** (1h).

**Total: ~7.25h, ~560 new LOC, zero new processes, zero new deps.** D3 is already loaded. No HTMX needed — vanilla fetch matches the rest of MERIDIAN.

Blocked-on-others items deferred:
- Conversation-mined facts UI waits on phase 1E miner output shape.
- Cron canonical list waits on phase 1D inventory.

## Integration with Obsidian MCP

Division of labor:

- **Dashboard owns:** aggregate views, decay scores, link topology, cron/inbox status, search results, recent activity. Anything that needs to look across many files at once.
- **Obsidian owns:** reading a single note in full, editing a note, navigating backlinks, writing new notes. Anything where Alton would want the live editor, plugins, and rendered preview.
- **Handoff:** every node and search result in MERIDIAN has an "Open in Obsidian" affordance. Server-side proxy at `POST /api/obsidian/open` calls `127.0.0.1:27124/open/{path}` with the bearer token from a config file (not in client JS, not in git).
- **Don't render markdown in MERIDIAN.** Tempting but wrong. The whole point of running Obsidian is its renderer, plugins, and graph. Duplicating it splits Alton's attention. Tooltip previews (first 500 chars) are fine; full notes go to Obsidian.
- **MCP wrapper is orthogonal.** `mcp-obsidian` MCP is for Claude (the agent) to read/write notes. The dashboard talks to Obsidian REST directly because the dashboard is a web service, not an MCP client.

## Risks and Open Questions

- **Decay scoring is the load-bearing assumption.** Everything (graph fading, heatmap fill, tier strip) routes through `sartor/memory/decay.py`. If Phase 2 changes the tier model, the dashboard follows automatically — but it means the dashboard's value tracks the quality of decay scoring. If decay is naive, the heatmap is theater.
- **Section sub-nodes blow up the graph.** With ~150 files and ~20 sections each, the section toggle hits ~3000 nodes. Force simulation gets sluggish. Recommend defaulting OFF and adding a node-cap warning.
- **Wikilink resolution is fuzzy.** The current regex resolves `[[FAMILY]]` against any file whose stem upper-cases to `FAMILY`. With 151 files this collides occasionally — graph edges may be wrong. Worth a pass to use the exact resolver from `sartor/memory/search.py` if it has one.
- **Plain-stem reference matching is noisy.** server.py:1303-1307 adds an edge whenever any other file's stem appears in another file's text. For a stem like `SELF` this creates phantom links. Recommend dropping that branch and trusting only `[[wikilinks]]` and explicit markdown links.
- **The Sartor Network Dashboard (`dashboard/app.py`) overlaps.** It has its own `/api/memory/search` and `/api/memory/recent`. If it's still running, the team has two dashboards already. Recommend: confirm with Alton whether to deprecate it before adding more memory features to MERIDIAN. Otherwise we recreate the "too many moving parts" problem we're trying to solve.
- **`gpu-dashboard` orphaned bytecode on gpuserver1.** Either restore from git (if it was deleted) or delete the `__pycache__/`. Currently it's a confusing artifact in any directory listing.
- **Auth.** MERIDIAN binds `0.0.0.0:5055` with no auth. On a flat home LAN with kids' devices and Aneeta's work laptop, that's fine *only* if no sensitive content is exposed. Memory tab will surface FAMILY.md, ALTON.md, finances cluster, etc. Recommend either binding to 127.0.0.1 *or* adding a single shared password before shipping the memory tab. Don't ship it open.
- **PID 3404 hypothesis correction.** The task brief asserts PID 3404 ≈ MERIDIAN. The repo evidence says PID 3404 is `next dev` for the Next.js portal (also under `dashboard/`), and MERIDIAN is a separate uvicorn process. Worth confirming with `Get-Process -Id 3404 | Select Path` before any plan acts on this.

## Bottom Line

MERIDIAN is the right host. Sixty percent of the memory viz layer is already built and Alton may not realize it. Wire up a tab, add five small endpoints, proxy Obsidian opens, and ship. Total ~7 hours, ~560 LOC, no new processes, fewer moving parts than today (because the deprecated Flask `dashboard/app.py` should retire as part of this).
