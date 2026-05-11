---
entity: explore-inrepo-dashboard
type: explore
phase: 1
date: 2026-05-02
updated: 2026-05-02
updated_by: dashboard-engineer
scope: in-repo `Sartor-claude-network/dashboard/` divergent-fork triage (Phase 1D — diagnosis only, no disposition action)
parent: EXPLORE-03-sartor-network ("CRITICAL FINDING" surfaced this)
sibling_explores: [EXPLORE-01-meridian (complete), EXPLORE-02-briefing (complete), EXPLORE-03-sartor-network (complete)]
greenlight_gates_referenced: [G3 archive-vs-delete, extended to in-repo fork]
related: [memory-system-v2/06-dashboard-scout, memory-system-v2/10-MASTER-PLAN, hermes-dashboard-upgrade/02-meridian-audit]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# EXPLORE-04 — in-repo `dashboard/` divergent-fork triage

## Verdict (one paragraph)

**Two distinct artifacts coexist under `Sartor-claude-network/dashboard/`** and they need separate dispositions. (1) **Flask `dashboard/app.py`** (26.7 KB, 640 lines, Feb 6) is the in-repo divergent fork I flagged in EXPLORE-03 — substantively grown from the loose `sartor-dashboard-backend/app.py` (added 9 `/api/sartor/*` endpoints, Gmail/Calendar imports, second WebSocket broadcaster), but still broken-on-import via `from gateway` and `from memory_local_first` against the same `openclaw-patterns/` skill that was archived 2026-04-19. **Disposition was already approved**: `memory-system-v2/10-MASTER-PLAN.md:441` Q3 explicitly said "YES, retire it before the Memory tab ships." Never executed. **Recommendation: ARCHIVE per the existing approval.** (2) **The Next.js "Sartor Family Dashboard" / "Nestly"** that surrounds it (~50K LOC TypeScript across `app/` `components/` `lib/` `hooks/` `app/api/`; 13 routes, 11 Next.js API routes; Firebase/NextAuth/Radix/Tailwind 4/recharts/framer-motion; **last touched 2026-02-07 — only 4 days before `dashboard/app.py` mtime, and very active right up to that point**) is a **completely separate project** that the prior `06-dashboard-scout.md` correctly tagged as "out of scope and dangerous (Firebase auth flows, in-progress migrations)." **Recommendation: KEEP, do not touch.** Conflating them would have been the wrong call.

## Step 1 — `dashboard/app.py` audit (vs the loose version)

`Sartor-claude-network/dashboard/app.py` (26,748 bytes, 640 lines, mtime 2026-02-06) — a clear ancestor-relative of `C:\Users\alto8\sartor-dashboard-backend\app.py` (13,756 B, 335 lines). The first ~270 lines are nearly identical to the loose version (same broken imports at lines 19-24, same `/api/status`, `/api/agents`, `/api/memory/*`, `/api/log`, `/api/browser/*`).

**What's added (the 305-line delta, all between lines 266-694):**

| Endpoint | Source it reads | Notes |
|---|---|---|
| `GET /lab` | `static/fun/index.html` | "Creative Lab" page; matches the link in EXPLORE-03 §F1 |
| `GET /api/gpu` (extended) | `nvidia-smi` w/ power.draw, clocks, fan, pstate | More detailed than the loose version's basic GPU metrics |
| `GET /brief` + `GET /api/brief` | `sartor/memory/daily/{today}-brief.md` (with yesterday fallback) | **Reads the Sartor memory layer.** Different briefing path than morning_briefing.py uses (`inbox/rocinante/morning-briefing/`); points at a now-stale daily/ pattern that the audit confirmed has no current writer |
| `GET /api/sartor/status` | `sartor/memory/daily/{today}.md`, `sartor/costs.json`, `sartor/tasks/ACTIVE.md` | Cycles count, cost summary, task counts |
| `GET /api/sartor/tasks` | `sartor/tasks/ACTIVE.md` | Raw markdown |
| `GET /api/sartor/search?q=` | `sartor/memory/search.py` BM25 | **Subprocess into the canonical Sartor memory search.** This is the one piece worth flagging as having current value (search.py is still live) |
| `GET /api/sartor/calendar` | `from google_calendar import get_upcoming_events` | Imports `sartor/google_calendar.py`. Wrapped in `try: GOOGLE_AVAILABLE = True` |
| `GET /api/sartor/email` | `from google_gmail import get_recent_messages, get_unread_count` | Same |
| `GET /api/sartor/cron-log` | `sartor/memory/daily/{today}.md` | Parses `### HH:MM Cycle` headers. Pattern that turned out not to be how cron logs are kept now |
| `GET /api/sartor/agents` | `subprocess ps aux` for "claude" | **Linux-only** (`ps aux`); fails silently on Rocinante (Windows) |
| `socketio.on('search_sartor_memory')` | `sartor/memory/search.py` | WebSocket variant of the BM25 wrapper |
| `sartor_status_broadcaster()` thread | Same as `/api/sartor/status` + file mtime change detection on ACTIVE.md and daily log | Second background broadcaster, runs every 15s |

**Things shared with loose version that stay broken:**
- Same `from gateway import Gateway, AgentStatus` at line 23 — resolves against `<dir>/../.claude/skills/openclaw-patterns/` which doesn't exist (archived 2026-04-19)
- Same `from memory_local_first import LocalFirstMemory, HeartbeatScheduler` at line 24 — same archived dir
- Same Linux-only `/proc/loadavg`, `/proc/cpuinfo`, `/proc/stat`, `/proc/meminfo` paths in CPU/RAM metrics — fails silently on Rocinante

**Net:** the in-repo fork is the loose dashboard plus a Sartor-memory-aware bolt-on that was started ~Feb 6 and abandoned. Three of its endpoints (`/api/sartor/calendar`, `/api/sartor/email`, `/api/sartor/search`) point at things that ARE still live (Google MCP, Sartor BM25 search), but the routing layer can't start because of the same import bug.

## Step 2 — `dashboard/` directory inventory (excluding `dashboard/family/`)

Top-level files (21 total, ~922 KB excluding generated artifacts):

| File | Size | Purpose |
|---|---|---|
| `package.json` | 1.8 KB | Next.js project manifest (see Step 3) |
| `package-lock.json` | 519 KB | npm lockfile (auto-generated) |
| `tsconfig.json` | 700 B | TypeScript config |
| `tsconfig.tsbuildinfo` | 341 KB | TS build cache (auto-generated) |
| `next-env.d.ts` | 247 B | Next.js type declarations |
| `next.config.ts` | 140 B | Next.js config |
| `middleware.ts` | 1.1 KB | Next.js middleware |
| `eslint.config.mjs` | 483 B | ESLint config |
| `postcss.config.mjs` | 101 B | PostCSS config |
| `tailwind.config.ts` | 14 KB | Tailwind v4 config |
| `components.json` | 469 B | shadcn/ui config |
| `jest.config.js` | 1.1 KB | Jest test config |
| `jest.setup.ts` | 967 B | Jest setup |
| `.env.example` | 9.9 KB | Env-var template (safe to read; documented examples) |
| `.env.local` | **4.5 KB** | **NOT READ** (per task constraint — see Step 3) |
| `.gitignore` | 718 B | Standard |
| `app.py` | 27 KB | Flask dashboard (the in-repo fork; see Step 1) |
| `progress.txt` | 286 B | Ralph-loop progress tracker |
| `RALPH-PROMPT.md` | 2 KB | Ralph-loop iteration prompt |
| `RALPH-README.md` | 5.4 KB | Ralph-loop methodology doc |
| `README.md` | 8.1 KB | "Sartor Family Dashboard / Nestly" intro |

Subdirectories (excluding `family/` which is MERIDIAN):

| Dir | Files | Size | Latest mtime | Purpose |
|---|---|---|---|---|
| `node_modules/` | 51,772 | 641 MB | 2026-02-07 | npm deps (regenerable; should be in .gitignore) |
| `.next/` | 5,527 | 564 MB | 2026-02-07 | Next.js build cache (regenerable; should be in .gitignore) |
| `app/` | 29 | 416 KB | 2026-02-07 | Next.js App-Router routes — 13 page routes + 11 API routes |
| `components/` | 101 | 1.0 MB | 2026-02-07 | React components |
| `lib/` | 24 | 292 KB | 2026-02-07 | TypeScript utilities |
| `hooks/` | 9 | 90 KB | 2026-01-18 | React custom hooks |
| `static/` | 26 | 16.3 MB | 2026-02-06 | Flask app's static assets (loose dashboard era) |
| `public/` | 11 | 14 KB | 2026-01-15 | Next.js public static (favicons, logos) |
| `styles/` | 1 | 14.7 KB | 2026-01-15 | Global CSS |
| `scripts/` | 5 | 11 KB | 2026-01-15 | Build/utility scripts |
| `docs/` | 1 | 8.3 KB | 2026-01-15 | Doc |
| `types/` | 1 | 1.5 KB | 2026-01-15 | TS type defs |
| `.claude/` | 1 | 2 KB | 2026-01-15 | Claude config local to this project |

**Code-line totals (excluding `node_modules/`, `.next/`, `family/`):** 59,257 lines across 194 files. Breakdown:
- `.tsx`: 108 files / 35,414 lines (Next.js components/pages)
- `.ts`: 56 files / 14,998 lines (TypeScript modules + API routes)
- `.html`: 9 files / 4,404 lines (Flask app's static templates)
- `.css`: 3 files / 1,621 lines
- `.py`: 4 files / 1,365 lines (Flask `app.py` + helpers)
- `.md` / `.json` / `.js` / `.mjs`: 1,455 lines total

**Two clearly distinct projects sharing one parent dir:**
- ~50K lines of TypeScript Next.js (Nestly) — modern, active, family-product
- ~28 KB of Python Flask (`app.py` + 16 MB `static/`) — old, broken, deprecated

## Step 3 — `.env.local` handling (NOT READ)

Confirmed exists: `Sartor-claude-network/dashboard/.env.local`, 4,557 bytes, mtime 2026-01-25 14:24:58.

**Did not read.** Reading it would carry these risks:
1. Likely contains Firebase service-account JSON (per README's "Firebase Service Account key" prerequisite) — that's a credential class explicitly forbidden in CLAUDE.md Global Constraints.
2. Likely contains Google OAuth client_id/client_secret (per README mention of "Google Sign-In").
3. Likely contains Resend API key (per README mention of "magic link authentication").
4. May contain Cloudflare account credentials (per README mention of "MCP Gateway deployment").
5. Reading would put any/all of these into the Claude transcript, which is logged.

**Disposition implications:**
- ARCHIVE without scrubbing: leak risk if archive is ever pushed to git or shared.
- DELETE: irreversible if Alton needs the credentials again to re-spin Nestly.
- KEEP-IN-PLACE (the "do not touch the Next.js project" recommendation): no risk, file stays where Alton put it.

The KEEP recommendation for the Next.js project (Step 5) sidesteps this issue entirely. If `dashboard/app.py` is the only thing being archived, `.env.local` stays put.

## Step 4 — Family-content grep across `dashboard/` (excluding `family/`)

Patterns: `family/active-todos`, `family/family-calendar`, `FAMILY.md`, `sartor/memory/family`.

**Result: ZERO hits in `dashboard/app.py`. ZERO hits in `app/`, `components/`, `lib/`, `hooks/`, `static/`.**

The only hits in the entire `dashboard/` tree are inside `dashboard/family/` (MERIDIAN's home) — `server.py:553, 1589, 1746, 2581` and `index.html:4533`. Same finding as EXPLORE-03 for the loose pair: the in-repo fork is family-content-clean. The Next.js "Sartor Family Dashboard" project is named "family" but renders its own UI; it does NOT read the canonical `sartor/memory/family/active-todos.md`.

## Step 5 — Reference grep across the codebase for live `dashboard/app.py` references

This is the critical-for-Phase-3 step. Found **one live runtime reference** (vs EXPLORE-03's loose pair which had zero):

**`dashboard/family/server.py:1551` — MERIDIAN's GPU command allowed-list:**
```python
allowed_commands = {
    "start_dashboard": "cd ~/Sartor-claude-network && nohup python3 -m flask --app sartor/dashboard/app run --host 0.0.0.0 --port 5000 > /tmp/dashboard.log 2>&1 & echo started",
    ...
}
```

This is invoked by `/api/gpu/command` (server.py:1547) when the user clicks the **"Start Dashboard" button at `dashboard/family/index.html:2364`**:
```html
<button class="gpu-btn" onclick="gpuCmd('start_dashboard')">Start Dashboard</button>
```

The path `sartor/dashboard/app` (note: `sartor/dashboard/`, not `dashboard/`) is itself probably broken — the actual file is at `dashboard/app.py`, not `sartor/dashboard/app.py`. So this command has been broken at the path-resolution layer too, and the button has presumably been clicking-into-failure since 2026-02-06. Yet it's still in the allowlist. Was already flagged 2026-04-12 by `hermes-dashboard-upgrade/02-meridian-audit.md:190`; never fixed.

**Other references** (all in MEMORY/PROJECT documentation, no runtime impact):
- `memory-system-v2/06-dashboard-scout.md` — recommends deprecation
- `memory-system-v2/10-MASTER-PLAN.md:441` — **explicitly approves retirement** ("Q3: YES")
- `memory-system-v2/NARRATIVE.md:279` — confirms the Q3 answer
- `hermes-dashboard-upgrade/02-meridian-audit.md:190, 200` — flags the start_dashboard reference
- `MACHINES.md:124` — documents `start_dashboard` as one of the GPU commands
- This memo and EXPLORE-03

**Pre-archive cleanup needed (Phase 3 input):**
1. Remove `"start_dashboard"` from `dashboard/family/server.py:1551` `allowed_commands` dict
2. Remove the "Start Dashboard" button from `dashboard/family/index.html:2364`
3. Remove `start_dashboard` from `MACHINES.md:124` documentation
4. Update the static link at `dashboard/static/fun/index.html:262` (or move `static/` along with archive)

Same `dashboard/static/fun/` link from EXPLORE-03 §F1 lives inside this `dashboard/` tree; the loose dashboard's `sartor-dashboard-frontend/index.html` was a sibling of it. Archiving `app.py` should also archive `static/`.

## Step 6 — `memory-system-v2/06-dashboard-scout.md` re-read

Read end-to-end. Critical findings the prior scout had that I rediscovered:

- **They correctly identified all four artifacts**: MERIDIAN (FastAPI/uvicorn at port 5055), Sartor Network Dashboard / `dashboard/app.py` (Flask, "sibling, not target"), the Next.js portal (PID 3404 = `next dev`, "out of scope and dangerous"), and the orphaned `gpu-dashboard/` bytecode on gpuserver1.
- **They explicitly recommended deprecation of `dashboard/app.py`** before adding more memory features to MERIDIAN. The Master Plan ratified this as "Q3: YES" but it never executed.
- **Their PID-3404 correction** ("not MERIDIAN, that's `next dev` for the unrelated Next.js app") is the same conflation I almost made until reading their memo. Direct evidence: I had implied in EXPLORE-03 that the `dashboard/` parent was a "Next.js scaffolding wrapping `app.py`" — that's wrong. Next.js and Flask are two unrelated projects that happened to land in the same dir. The Flask `app.py` is older and was the original "Sartor Network Dashboard"; the Next.js project ("Sartor Family Dashboard"/"Nestly") was started later, in the same dir, and they don't share code (one's Python, the other's TypeScript).

**Does anything they noted change with current evidence?** Three updates:
1. **The Next.js project is more active than the scout knew on 2026-04-12.** They tagged it "in-progress migrations" — true; recent work continued through 2026-02-07 (the latest .tsx mtime is `app/safety/page.tsx` at 2026-02-07 8:05 PM). This *increases* the cost of accidentally touching it.
2. **The `start_dashboard` reference in MERIDIAN's allowed_commands** persisted even after the hermes-dashboard-upgrade audit flagged it. It is a real Phase-3 cleanup item, not a documentation-only loose end.
3. **The orphaned `gpu-dashboard/` bytecode** on gpuserver1 (scout's open question) is out of scope here but worth its own tiny task someday.

## Step 7 — Disposition recommendation

**For `dashboard/app.py` and its Flask-era satellites: ARCHIVE.**

Move `dashboard/app.py` to `archive/2026-05-sartor-dashboard-superseded/` (same archive bucket as the loose pair from EXPLORE-03). Include:
- `dashboard/app.py`
- `dashboard/static/` (Flask's static templates — 26 files / 16 MB; was the loose `sartor-dashboard-frontend/index.html`'s server-side counterpart)

Why ARCHIVE not DELETE:
- Disposition was already approved 4 months ago by `memory-system-v2/10-MASTER-PLAN.md:441` Q3 ("YES, retire it")
- 86-day-old broken-on-import frozen code; cannot start; zero family content; superseded by MERIDIAN
- Three of its `/api/sartor/*` endpoints touched still-live data sources (Sartor BM25 search, Google Calendar/Gmail) — design notes there could be useful as Phase-2 prior art for MERIDIAN's `/api/family-todos` design
- ~28 KB total preservation cost; consistent with EXPLORE-03's archive convention

**For the Next.js project: KEEP-IN-PLACE, do not touch.**

Leave everything else under `dashboard/` exactly where it is:
- `package.json`, `package-lock.json`, `tsconfig.*`, `next-env.d.ts`, `next.config.ts`, `middleware.ts`, all config files
- `.env.example`, `.env.local` (do NOT read, do NOT move)
- `app/` (29 files, Next.js routes), `components/` (101 files), `lib/`, `hooks/`, `public/`, `styles/`, `scripts/`, `docs/`, `types/`
- `node_modules/`, `.next/` (regenerable; whether they belong in git is a separate concern but out of scope here)
- `RALPH-PROMPT.md`, `RALPH-README.md`, `progress.txt`, `README.md`

Why KEEP-IN-PLACE:
- This is "Sartor Family Dashboard" / "Nestly" — a separate active project per its own README and the active mtimes through 2026-02-07
- 50K lines of TypeScript across 194 files; non-trivial work
- Firebase auth + NextAuth + multiple OAuth flows in `.env.local`; touching means risking authentication state
- The prior scout (06-dashboard-scout.md, 2026-04-12) explicitly said "out of scope and dangerous"
- It does NOT conflict with MERIDIAN — different stack (Next.js vs FastAPI), different port (`next dev` defaults to 3000, MERIDIAN is on 5055), different audience (Nestly is the cross-device family portal Alton was building, MERIDIAN is the desktop dashboard)
- Project frame for THIS project (dashboard-rebuild) is MERIDIAN cleanup + family layer wiring; it is NOT "consolidate all dashboards." The Next.js project is its own future decision

**Required Phase-3 cleanup before archiving `dashboard/app.py`:**

1. Edit `dashboard/family/server.py:1551` — remove the `"start_dashboard"` entry from `allowed_commands`
2. Edit `dashboard/family/index.html:2364` — remove the "Start Dashboard" button (or repoint to MERIDIAN's own start path if Alton wants the button)
3. Edit `MACHINES.md:124` — remove `start_dashboard` from documented GPU commands list
4. Update `dashboard/static/fun/index.html:262` static link (or archive `dashboard/static/` along with `app.py` so the link goes to a 404 we own)

After these four edits, `dashboard/app.py` and `dashboard/static/` can be moved to archive without breaking any live code path. The Next.js project's existence is unaffected — it doesn't import or reference `app.py` or `static/`.

## Step 8 — Phase-3 risk surface

**The Next.js project shares a parent dir with MERIDIAN at `dashboard/family/`.** Concerns:

| Risk | Severity | Mitigation |
|---|---|---|
| Accidentally moving `dashboard/family/` thinking it's part of the Next.js project | HIGH | Make the archive operation file-by-file, not directory-by-directory. Explicit allowlist: `app.py`, `static/`. NEVER `mv dashboard/* archive/`. |
| Accidentally `npm install` or `next build` in `dashboard/` while debugging would regenerate `node_modules/` and `.next/` after they were archived/cleared | MEDIUM | Treat `node_modules/` and `.next/` as out-of-scope — they're regenerable artifacts, not source. |
| Future `npm test` or Jest run picks up `app.py` or its imports | NONE | Jest config (`jest.config.js`) only matches `.ts`/`.tsx`/`.js`/`.jsx`; Python files are invisible to it. Confirmed in `jest.config.js`. |
| Touching `package.json` would require re-installing deps for the Next.js project | LOW | `package.json` is part of the KEEP set; archive operation does not touch it. |
| Tailwind config (`tailwind.config.ts`, 14 KB) might reference Flask app's static files | LOW | Worth confirming via grep before archive; if `tailwind.config.ts` has paths into `static/`, those need to be removed first. (Not done in this Phase-1 read; flag for Phase-2.) |
| Git operations: archiving means staging deletes for `app.py` + `static/` (~16 MB) | LOW | Standard git operation. Will show up as a large diff but cleanly traceable. |
| `start_dashboard` removal might break something else if any other allowed_commands entry depends on the Flask app having been started | NONE | Reviewed allowed_commands at server.py:1550-1561; entries are independent. |

**Cross-cutting:** Phase 2 design needs to specify "archive operates on these EXACT paths and these only:" rather than "archive `dashboard/app.py` and friends." Friends-list ambiguity here would be expensive.

## Findings worth a follow-up (not fixes, just noticed)

- **F1.** `dashboard/app.py:280-298` reads `sartor/memory/daily/{today}-brief.md` (with yesterday fallback). This is a **different briefing path** than `morning_briefing.py` writes to (`inbox/rocinante/morning-briefing/{today}.md`). Two competing briefing-file conventions live in the codebase; the Flask one is dead-but-pointing-at-something. Phase-2 design might want to standardize briefing-file path or document the divergence.
- **F2.** `dashboard/app.py:268` uses `SARTOR_MEMORY = SARTOR_DIR / "memory"` and `dashboard/family/server.py:387` uses `MEMORY_DIR = SARTOR_DIR / "memory"`. Same target. Convergent independent invention; nothing to fix, just noting that MERIDIAN and the dead Flask app saw the same path.
- **F3.** `RALPH-PROMPT.md` and `RALPH-README.md` document a "Ralph Wiggum loop" iteration methodology for the Next.js project — could be useful pattern for Phase-2 design (continuous-improvement loop on a shipped dashboard) but again, out of scope here.
- **F4.** `node_modules/` is **641 MB** and `.next/` is **564 MB**. They show up under git `status` if the `.gitignore` doesn't exclude them. `dashboard/.gitignore` exists (718 B); didn't read it but worth confirming both are excluded.
- **F5.** `app/api/safety/`, `app/safety/`, `lib/safety-data.ts`, `components/safety/*` — the most recently touched files in the Next.js project (2026-02-07 7-8 PM) are all SAFETY-related. Aligns with Alton's AstraZeneca AI Innovation & Validation work. The Next.js project was being actively used as a safety-research surface at the moment work paused.

## Reference: artifacts and reproductions

- File inventory: shown in Step 2 (top-level files + subdirs)
- app.py contents read in full (reading log, 640 lines) — same broken imports as loose version
- `.env.local` size confirmation only: 4,557 bytes. Not read.
- 06-dashboard-scout.md re-read: 152 lines, end-to-end
- start_dashboard reference grep: 1 live in code, 6 in documentation

## Phase boundary

Phase 1D diagnosis complete. No file modified, no directory moved or removed, no process started, **`.env.local` NOT read**.

**Disposition recommendation summary:**
- `dashboard/app.py` + `dashboard/static/` → **ARCHIVE** (already approved by memory-system-v2 Q3, never executed; this Phase 1D just re-confirms)
- Everything else under `dashboard/` (the Next.js "Sartor Family Dashboard"/"Nestly" project) → **KEEP-IN-PLACE, DO NOT TOUCH**
- 4 pre-archive cleanup edits required (server.py:1551, index.html:2364, MACHINES.md:124, static/fun link)

Awaiting dashboard-keeper review and Phase 2 design.
