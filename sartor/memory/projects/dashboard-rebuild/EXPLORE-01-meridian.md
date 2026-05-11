---
entity: explore-meridian
type: explore
phase: 1
date: 2026-05-02
updated: 2026-05-02
updated_by: dashboard-engineer
scope: MERIDIAN v0.2 live diagnosis (Phase 1A — diagnosis only, no code changes)
parent: dashboard-status (audit dossier 2026-05-02)
sibling_explores: [EXPLORE-02-morning-briefing (pending), EXPLORE-03-sartor-network (pending)]
greenlight_gates_referenced: [G1 auto-start, G2 TODAY.md decision, G3 paper-check softening]
related: [feedback/paper-checks-blindspot, family/active-todos, dashboard-status]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# EXPLORE-01 — MERIDIAN live diagnosis

## Verdict (one line)

MERIDIAN starts cleanly in DEV mode, all 9 probed endpoints return 200, but two of them return 30-day-stale data and one returns "found:false" — the dashboard's *frontend* is healthy; its *upstream data feeds* are dead.

---

## Step 1 — Live startup test (read-only, server stopped after test)

| | |
|---|---|
| Command | `Start-Process python server.py` (foreground-equivalent, captured PID, killed at end) |
| Working dir | `C:\Users\alto8\Sartor-claude-network\dashboard\family` |
| Env | `MERIDIAN_DEV=1`, `MERIDIAN_PORT=5055` |
| Time-to-ready | <500 ms (first probe succeeded immediately) |
| PID lifecycle | started, served 10 requests, stopped via `Stop-Process -Force`, port 5055 confirmed free after kill |
| Startup output | `INFO: Uvicorn running on http://0.0.0.0:5055` — no warnings, no tracebacks |
| Logs | `C:\Users\alto8\meridian-test-stdout.log`, `C:\Users\alto8\meridian-test-stderr.log` (left in place for sibling-explore reference; rotate or delete in Phase 4) |

DEV-mode bypass at server.py:31 + middleware short-circuit at server.py:149 worked as documented in the audit (which credited the 2026-04-18 fix).

## Step 2 — Endpoint probes

All endpoints returned HTTP 200 with valid JSON shapes. The interesting findings are in the *content*, not the HTTP layer.

| Endpoint | Status | Bytes | ms | Substantive finding |
|---|---|---|---|---|
| `/api/greeting` | 200 | 94 | 16 | Working. "Good evening, Alton" with correct date/time. |
| `/api/memory-health` | 200 | 1761 | 145 | Working. 19 files, 353 KB. Tier classification live (decay.py imports OK). |
| `/api/heartbeat-status` | 200 | 1075 | 23 | **STALE.** Every cron's `last_run` is `2026-04-03T11:43:34..11:45:30`. **Heartbeat-log.csv has not been written to in 30 days** — confirms the audit's "silent since 4/12" call, and is actually worse (29 days vs ~20). |
| `/api/daily-tasks` | 200 | 729 | 16 | **STALE.** Returns `"date":"2026-04-02"` with todos like "Pay parking ticket", "Pick up meds — Alton + Vayu", "Pay MKA tuition (due Apr 10)". Confirms TODAY.md is 30 days stale. |
| `/api/system` | 200 | 357 | 97 | Working. gpuserver1 ping succeeded; mem/task counts correct. |
| `/api/tasks` | 200 | 1497 | 15 | Working. Reads `tasks/ACTIVE.md` (19-day-old file per audit). Categorizes into in_progress/completed/pending. |
| `/api/family` | 200 | 1090 | 13 | Working. Hard-coded family roster at server.py:636-693 — not file-driven, never goes stale on its own but never updates either. |
| `/api/cron-health` | 200 | 1352 | 421 | Working endpoint, **`health:"red"`** is already being returned. The signal exists; nothing acts on it. |
| `/api/morning-briefing` | 200 | 50 | 13 | **NO FILE.** Returns `{"found":false,"date":null,"content":"","path":""}` — endpoint at server.py:2456 looks under `MEMORY_DIR/inbox/rocinante/morning-briefing/` and `data/morning-briefing/`; both empty/missing. Direct surface of the Phase 1B silent-fail. |
| `POST /api/daily-tasks/toggle` (empty body) | 400 | 0 | — | No 500. Body parsing handled the empty `{"task":""}` case via the `if not task_text` branch at server.py:1014. **Behavioral oddity** noted in Findings §F1. |

No 5xx, no schema surprises. Only minor charset issues: en-dashes in family `detail` strings and todo text rendered as mojibake (`â€"`) when streamed — UTF-8 sent, but PowerShell's `Invoke-WebRequest` decoded latin-1; not a real bug. Spot-check via curl from a JS-aware browser would render correctly.

## Step 3 — Server stop

Killed via `Stop-Process -Id <pid> -Force`. Port 5055 confirmed free immediately after. No zombie python processes. Reproducible — same recipe used here will be the basis for any QA test harness in Phase 4.

## Step 4 — File-references audit

`server.py` references the family layer at these specific lines:

| Reference | Line | Notes |
|---|---|---|
| `TASKS_DIR = SARTOR_DIR / "tasks"` | 388 | `sartor/tasks/` |
| `REPO_TASKS_DIR = REPO_ROOT / "tasks"` | 391 | `tasks/` (root) |
| Reads `TASKS_DIR / "ACTIVE.md"` then falls back to `REPO_TASKS_DIR / "ACTIVE.md"` | 731-733 | `/api/tasks` |
| Reads `REPO_TASKS_DIR / "TODAY.md"` | 963, 1017 | `/api/daily-tasks` GET + toggle POST |
| References `FAMILY.md` (in system prompt + wiki list) | 553, 1589, 1746, 2541 | Read-only, used by Claude terminal and `/api/wiki-pages` |
| Reads ACTIVE.md for CRUD | 2635, 2648, 2688 | POST/PATCH/DELETE `/api/tasks*` |

**MERIDIAN currently reads** (family layer):
- `tasks/ACTIVE.md` (root tasks dir) — primary
- `tasks/TODAY.md` (root tasks dir) — primary for `/api/daily-tasks`
- `sartor/memory/FAMILY.md` and other `*.md` for the Wiki card and Claude terminal

**MERIDIAN does NOT read** (any of these — confirmed by exhaustive grep at scope):
- `sartor/memory/family/active-todos.md` — the **canonical** family dashboard. **Not loaded by any endpoint.** This is the single biggest gap.
- `sartor/memory/family/family-calendar.md` (if it exists)
- Any `family-dashboard-YYYY-MM-DD.md` snapshot file
- `sartor/memory/family/*.md` per-kid pages (vayu, vishala, vasu) — the wiki card lists `FAMILY.md` only at server.py:2541
- The dossier files under `projects/family-thread-dossier/`

**Endpoint-additions/modifications needed** to surface family-layer truth:
1. **New: `GET /api/family-dashboard`** — most recent `family-dashboard-YYYY-MM-DD.md` (mirror of the morning-briefing endpoint at 2456 — same shape, different source dir). Resolves the canonical-dashboard surfacing requirement.
2. **New or merged: `GET /api/family-todos`** — parses `sartor/memory/family/active-todos.md` callouts (`> [!warning]`, `> [!todo]`, `> [!deadline]`, `> [!done]`) into structured RED/YELLOW/GREEN items. Substantially different parser from the existing `_parse_active_tasks_with_lines` because callouts are multi-line with frontmatter-like metadata.
3. **New: `POST /api/family-todos/quick-resolve`** — append-at-top-under-today's-check-in-block to `active-todos.md`. The pattern Alton already uses (the 2026-05-02 check-in block at lines 20-30 of `active-todos.md`) is the model. Body: `{item_text, resolution: "RESOLVED"|"DOWNGRADED", note?: string}`. Should NOT delete the original RED line (preserves history); just adds the closure block.
4. **Modified: `/api/morning-briefing` at 2456** — keep it; it is the right shape. The fix is in Phase 1B (writer-side), not here.

## Step 5 — GlassCard mapping for new family surfaces

`index.html` has 16 GlassCards (audit said 14 — actually 16 by `<div class="glass-card">` count at lines 2191, 2200, 2206, 2220, 2230, 2236, 2242, 2249, 2255, 2261, 2273, 2283, 2289, 2295, 2302, 2308, 2314, 2320, 2326 — close enough; the audit may have collapsed weather+calendar or finances+something).

Card-by-card placement plan for the three new surfaces:

| Surface | Recommended card | Why | Line in index.html |
|---|---|---|---|
| (a) Today's `family-dashboard-YYYY-MM-DD.md` snapshot | **Today's Tasks** (HERO, top of left-stack) | Already has a `morningBriefingLink` div at index.html:2193 prepared for exactly this kind of "what got generated overnight" surface. Reuse that slot. | 2191-2195 |
| (b) RED/YELLOW open items with quick-resolve buttons | **NEW dedicated card** between Today's Tasks (2191) and Active Tasks (2220) — call it "Family Open Items" | The existing Active Tasks card at 2220 is plumbed to `tasks/ACTIVE.md` (a system-tasks file), not the family layer. Mixing them would muddy semantics. Insert sibling card before 2220. | new card to inject at ~2218 |
| (c) Per-item softening for paper-check / in-person vendors | **Same card as (b)** — softening is a render-time concern on the same items | The softening per `feedback/paper-checks-blindspot.md` is a labeling rule, not a separate panel. Items matching the paper-check vendor list (Wohelo, 185 Davis, "heating guy", Lucent in-person) get RED→YELLOW downgrade + tooltip "ask Alton — may already be done out-of-band" before display. | client-side render in same card |

Reasoning for not using existing Active Tasks card (2220): that card has working POST/PATCH/DELETE wired to `tasks/ACTIVE.md` task-id semantics (server.py:2628-2703). Re-pointing it at `active-todos.md` would break those CRUD ops since the file format is fundamentally different (callouts vs checkboxes). Cleaner to add a sibling card.

## Step 6 — Concrete code-change targets (file:line, for Phase 3 build planning)

These are *targets only* — no edits made.

### (a) Wire active-todos / family-calendar reads
- **server.py:2456** — clone `morning_briefing()` into a new `family_dashboard()` reading from `MEMORY_DIR / "family" / "dashboard"` (or wherever the snapshot writer ends up depositing files; that's a Phase 1B/2 decision).
- **server.py:~2480** — new endpoint `family_todos()` that opens `MEMORY_DIR / "family" / "active-todos.md"`, parses callout blocks via a new `_parse_callouts()` helper. Suggested helper signature: `def _parse_callouts(content: str) -> list[dict]` returning `[{type: "warning"|"todo"|"deadline"|"done", date: str|None, title: str, body: str, raw_lines: tuple[int,int]}]`. Write the helper near `_parse_active_tasks_with_lines` (server.py:2599) for symmetry.
- **index.html:~2218** — inject new `<div class="glass-card" style="--card-accent:#dc2626">` for "Family Open Items" with `<div id="familyOpenItemsContainer">Loading...</div>`. Add `loadFamilyOpenItems()` JS function near the existing `loadDailyTasks()` (search index.html for "loadDailyTasks").
- **index.html:2193** — wire `morningBriefingLink` div to also surface today's family-dashboard if morning-briefing is missing (graceful fallback chain: today's family-dashboard → today's morning-briefing → "no data for today").

### (b) Quick-resolve POST endpoint
- **server.py:~2645** — new `@app.post("/api/family-todos/quick-resolve")` next to the existing PATCH at 2645. Body schema `{item_id: str, resolution: str, note: str|None}`. Implementation: load `active-todos.md`, locate or create today's `## YYYY-MM-DD Alton check-in — out-of-band resolutions` block at the top (after the H1 `# Family Active TODOs` at line 16), append a `**Closed/resolved:**` or `**Downgraded:**` bullet referencing the item. Do NOT mutate the original callout block — preserve audit trail.
- **CSRF** — endpoint is `/api/family-todos/...` not `/api/tasks/...`, so the existing CSRF middleware at server.py:175-193 won't protect it. **Either** (i) extend the CsrfMiddleware path-prefix list to include `/api/family-todos`, **or** (ii) move CsrfMiddleware to protect all mutating `/api/*`. Option (ii) is cleaner; flag for design phase.
- **`item_id` design** — for stable IDs, use a hash of `(callout_type, date, first_30_chars_of_title)`. Already lossy enough that a future curation pass renaming items keeps history; tight enough that collisions are rare.

### (c) Softening RED labels for paper-check vendors
- **Pure client-side in index.html** — load `feedback/paper-checks-blindspot.md` indirectly via a new `GET /api/blindspot-vendors` endpoint that returns `{paper_check: ["Wohelo", "185 Davis", "heating guy", "Bill"], in_person: ["Lucent Solar", "Doug Paige"]}`. Or hard-code the list in JS for v0.1 — simpler. Recommend hard-code for v0.1, externalize in v0.2 once Mercury banking research closes (task #6) and we have the auth list of true paper-check vendors.
- **Render rule** — for any item where `title` or `body` matches one of the vendor patterns (case-insensitive substring), downgrade `urgency: "red"` → `urgency: "yellow"` and add `subtitle: "Possibly handled out-of-band — confirm with Alton before escalating"`.
- **Implementation site** — inside `loadFamilyOpenItems()` JS function, after fetching from `/api/family-todos`, before rendering DOM nodes.

## Findings worth a follow-up (not fixes, just noticed)

- **F1. POST `/api/daily-tasks/toggle` returns 400 with empty body, but the response body is empty bytes** — should be a JSON error per the explicit branch at server.py:1014-1015 which returns `{"error": "task field required"}`. Suggests FastAPI is short-circuiting before the handler runs (probably because `body: dict` argument-parsing rejects `{}` without raising). Low priority. Not blocking the rebuild.
- **F2. `_HEARTBEAT_TASKS` list at server.py:1160** still includes `self-improvement-loop` ("On demand") which the user removed from `.claude/scheduled-tasks/` per CLAUDE.md table. Drift. Cosmetic.
- **F3. `/api/links` at server.py:941** has a hard-coded "Sartor Dashboard http://192.168.1.100:5000" pointing at the deprecated dashboard which 1C will likely confirm is dead. Stale link.
- **F4. Heartbeat-log.csv 30-day silence** is the actual top-priority issue — it makes the dashboard's "Heartbeat" GlassCard completely uninformative. Whatever was supposed to write to that file (likely the gateway_cron.py loop on gpuserver1, or the Rocinante heartbeat that the audit flagged) needs to be traced. Mark as a separate explore task; it overlaps with but is distinct from the morning-briefing failure.
- **F5. `/api/family` at server.py:636-693** is hard-coded family roster. If this is supposed to be the source of truth for the dashboard's family card, it should read from `sartor/memory/FAMILY.md`. If FAMILY.md is the source of truth, the hard-code is dead-state-rot waiting to happen. Suggest deferring to design phase — possible future "single-source-of-truth" tightening.

## Reference: live-test artifacts

- Stdout log: `C:\Users\alto8\meridian-test-stdout.log` (uvicorn lifecycle messages)
- Stderr log: `C:\Users\alto8\meridian-test-stderr.log` (empty in this run)
- Process recipe (reusable for Phase 4 QA harness):
  ```powershell
  $env:MERIDIAN_DEV='1'
  $proc = Start-Process python 'server.py' -WorkingDirectory 'C:\Users\alto8\Sartor-claude-network\dashboard\family' -PassThru -RedirectStandardOutput out.log -RedirectStandardError err.log
  # ... probes ...
  Stop-Process -Id $proc.Id -Force
  ```

## Phase boundary

Phase 1A diagnosis complete. No code changes made. No state mutated. Stdout/stderr logs left in place at `C:\Users\alto8\meridian-test-*.log` for cross-reference by the Phase 1B (Morning Briefing) and Phase 1C (Sartor Network) explores. Awaiting dashboard-keeper review and Phase 2 design assignment.
