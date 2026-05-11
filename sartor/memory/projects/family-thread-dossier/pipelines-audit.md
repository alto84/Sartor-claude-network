---
entity: pipelines-audit
type: audit
updated: 2026-05-02
updated_by: pipelines-auditor
related: [family-thread-longrunning, family-memory-fixup, memory-cartography]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Pipelines audit — what touches family/* (2026-05-02)

Audit-only pass. Inventory of skills, agents, scheduled tasks, slash commands, hooks, and Windows scheduled tasks; identification of which actively read/write under `sartor/memory/family/` and `FAMILY.md`; gap analysis vs. the `family-memory-fixup` plan.

## Top-line findings

1. **Only ONE skill writes to `family/*`**: `personal-data-gather` (cron, every 4h). It is the entire write-side of the family layer.
2. **Two skills/agents READ `family/*`**: `morning-briefing` (skill, daily 6:30 AM) and `family-scheduler` (agent, on-demand). Plus `todo-sync` (cron, nightly) reads callouts via grep.
3. **The `family-memory-fixup` plan (2026-04-25) was never executed.** None of its Phase 0/1/2 deliverables shipped. Files have grown SINCE that plan was written: active-todos.md 847→1,311 lines, family-calendar.md 485→579, FAMILY.md 354→385. The diagnosed pathology is worsening.
4. **No agent/skill/cron is responsible for *pruning* family/*.** The fixup plan named this gap (Phase 2.3 weekly family-pruning pass); it was never built.
5. **No `family-status` slash command exists.** `family-today` exists but only reads Google Calendar, not the family/ wiki layer.

---

## Inventory

### A. Skills (`C:\Users\alto8\Sartor-claude-network\.claude\skills\`) — 26 total

| Skill | Family-relevance | Reads/Writes family/* | Last-mod |
|---|---|---|---|
| `morning-briefing` | **HIGH** | READS family/active-todos.md, family/family-calendar.md, FAMILY.md, family/disney-july-2026.md, family/{vayu,vishala,vasu}.md | 2026-04-10 |
| `travel-planning` | **MED** | Reads FAMILY context for trip logistics for family of 5 | 2026-04-01 |
| `daily-household-health` | LOW (machine fleet, not family) | No | 2026-04-25 |
| `tax-estimate` | LOW (mentions family in JFM) | No direct family/ I/O | 2026-04-07 |
| `task-review` | LOW (Google Tasks, not wiki) | No | 2026-04-01 |
| `complex-project`, `multi-agent-orchestration`, `research-effort`, `deep-research` | NONE | No | various |
| `gpu-fleet-check`, `gpu-pricing-optimizer`, `vastai-market-scan`, `weekly-financial-summary`, `market-snapshot`, `options-analysis`, `nonprofit-deadline-scan` | NONE | No | various |
| `alton-voice`, `interior-report-discipline`, `chrome-automation`, `mcp-server-development`, `distributed-systems-debugging`, `peer-comms`, `safety-research-wiki`, `build-llm-wiki`, `evidence-based-validation`, `skill-improvement-tracker` | NONE | No | various |

**Skills total touching family/: 1 high-relevance read (morning-briefing), 1 medium (travel-planning).**

### B. Agents (`C:\Users\alto8\Sartor-claude-network\.claude\agents\`) — 21 total

| Agent | Family-relevance | Touches family/* | Last-mod | Model |
|---|---|---|---|---|
| `family-scheduler` | **HIGH** | Reads family calendar via Google Calendar MCP; reads FAMILY.md context | 2026-04-19 | sonnet |
| `travel-planner` | **MED** | Reads FAMILY for family-of-5 logistics | 2026-04-12 | sonnet |
| `memory-curator` | **MED** (writes potentially via inbox drains; per fixup plan, drains had been inlined into FAMILY.md) | Writes (curator drains target FAMILY.md per fixup memo) | 2026-04-18 | sonnet |
| `wiki-reader` | LOW (general memory query) | Reads any memory file including family | 2026-04-19 | sonnet |
| `auditor`, `critic`, `sentinel` | LOW (system-wide review) | May read family/ as part of audit | various | various |
| `gpu-ops`, `gpu-pricing`, `nonprofit-admin`, `nonprofit-compliance`, `financial-analyst`, `tax-strategist`, `research-agent`, `writing-agent`, `meta-agent`, `skill-reflector`, `session-searcher`, `peer-coordinator`, `wellness-checker`, `self-steward` | NONE | No | various |

**Agents touching family/: 1 high (family-scheduler), 1 med (travel-planner), 1 med-with-write (memory-curator drains).**

### C. Scheduled tasks (`C:\Users\alto8\Sartor-claude-network\.claude\scheduled-tasks\`) — 11 total

| Task | Cadence | Family-relevance | Action on family/ | Health |
|---|---|---|---|---|
| `personal-data-gather` | (SKILL.md says every 4h — see ERRATA below) | **HIGH** | **WRITES family-calendar.md, active-todos.md, FAMILY.md, family/{kid}.md**; primary write-side | **DEGRADED + NO RUNTIME** — fixup memo §2.1 pathologies still apply. **ERRATA 2026-05-02:** "every 4h" is the SKILL.md's stated intention. Verified via exhaustive `schtasks /query /fo LIST` scan + filesystem search — there is NO scheduled task and NO runtime executor (no python file, no `.claude/skills/personal-data-gather/`, no scripts/wrapper.cmd). Invocation is ad-hoc by Claude sessions reading the SKILL.md prompt — ~2 sessions/day per `sartor/memory/log.md`, not 6 cycles/day. cron-engineer's F1 design (`cron-uplift-F1-personal-data-gather-v2-design.md`) builds the missing runtime + adds discipline rules. |
| `morning-briefing` | daily 6:30 AM | **HIGH** | READS family/active-todos.md, family/family-calendar.md, FAMILY.md (section "Open Action Items" — which fixup plan wants to prune) | LIKELY HEALTHY (last-mod 2026-04-10) but COUPLED to current FAMILY.md structure; would BREAK if Phase 1.2 of fixup runs without lockstep update (called out in fixup §Risks) |
| `nightly-memory-curation` | nightly 11 PM | **MED** | Inbox drains land in FAMILY.md per fixup memo (creates the `<!-- curator-drained -->` blocks bloating FAMILY.md from ~150 to 354) | DRIFT — drain target should be `family/_history/inbox-drains-{YYYY-MM}.md` per fixup §2.2; not done |
| `todo-sync` | nightly | **MED** | READS callouts (`> [!deadline]`, `> [!blocker]`, `> [!todo]`) from sartor/memory/ — including family/active-todos.md — and creates Google Tasks | LIKELY HEALTHY but unverified |
| `wiki-reindex` | nightly | LOW | Reads all sartor/memory/ for indexes; no targeted family logic | LIKELY HEALTHY |
| `daily-household-health` | daily 5:30 AM | NONE (machine fleet) | No | HEALTHY |
| `gpu-utilization-check` | every 4h | NONE | No | — |
| `market-close-summary` | weekdays 4:30 PM | NONE | No | — |
| `weekly-financial-summary` | Fri 6 PM | NONE | No | — |
| `weekly-nonprofit-review` | Sun 9 AM | NONE | No | — |
| `weekly-skill-evolution` | Sun 3 AM | NONE | No | — |

**Crons touching family/: 1 writer (gather, DEGRADED), 1 reader (briefing, COUPLED), 1 writer-via-drain (curator, DRIFTED), 1 reader (todo-sync, LIKELY OK).**

### D. Slash commands (`C:\Users\alto8\Sartor-claude-network\.claude\commands\`) — 9 total

| Command | One-line purpose | Family? |
|---|---|---|
| `/bootstrap` | Read CLAUDE.md + memory INDEX to come up to speed | indirect |
| `/morning` | Run morning-briefing skill | YES (via skill) |
| `/family-today` | Google Calendar today only — does NOT read family/ wiki | weak — calendar only, no wiki |
| `/curate` | Trigger memory-curator agent | indirect (drains touch FAMILY.md) |
| `/reflect` | Trigger skill-reflector agent | no |
| `/gpu-status` | gpu-fleet-check skill | no |
| `/markets` | market-snapshot skill | no |
| `/nonprofit-status` | nonprofit-deadline-scan skill | no |
| `/research` | research-effort skill | no |

**No `/family-status`, no `/family-triage`, no `/family-week`.** `/family-today` exists but is calendar-only, NOT a wiki-aware family snapshot.

### E. Hooks (`.claude/settings.json`)

Project-level hooks fire on session lifecycle:
- `SessionStart`: `inject-user-context.sh` (memory injection)
- Tool use guards: `validate-command.sh`, `financial-data-gate.sh`, `no-secrets-in-output.sh`, `audit-logger.sh`, `loop-detection.sh`
- Trajectory: `log-trajectory.sh`, `finalize-session-trajectory.sh`
- Skill reflection: `should-reflect.sh`

**None of these are family-specific.** The `financial-data-gate.sh` and `no-secrets-in-output.sh` may incidentally protect against leaking children's PII (per CLAUDE.md Domain 3 constraint), but no hook specifically validates family/ writes.

### F. Windows Scheduled Tasks (relevant)

| Task | Cadence | Relevance |
|---|---|---|
| `SartorMorningBriefing` | daily 6:30 AM | Wraps `morning-briefing` cron — family-affecting (READ) |
| `SartorCuratorPass` | daily ~7:30 PM | Wraps `nightly-memory-curation` — family-affecting (WRITE via drain) |
| `SartorGmailScan` | daily 10 PM (and 4 duplicate triggers) | May feed gather pipeline — family-affecting (indirect WRITE) — **5 instances, possibly duplicated tasks** |
| `SartorConversationExtract` | daily 11:30 PM | Memory layer; may write to family/ via drain |
| `SartorImprovementLoop` | daily 8 PM | Skill-evolution; not family |
| `SartorHeartbeat` | (Next: N/A — disabled?) | Heartbeat dead; per MEMORY.md 2026-04-19, was rebuilt but may have re-stalled |
| `Sartor Memory Mirror` | nightly 3:30 AM | Git mirror — touches everything |
| `Sartor Peer Creds Sync` | every 4h | Not family |
| `UniFi Daily Backup` | daily 3 AM | Not family |
| `PushPeerCredentials` | every 4h | Not family |

**5 SartorGmailScan instances** is a smell — possibly leftover duplicate registrations from gather-pipeline iterations. Worth investigating in a later turn.

---

## Read/write map for family/* (consolidated)

### Writers (mutating family/* and FAMILY.md)
1. **`personal-data-gather` cron** — every 4h. Primary write-side. Append-only "Latest from gather" sections; current pathology source.
2. **`memory-curator` agent** (via `nightly-memory-curation` cron) — drains family-relevant inbox proposals INTO FAMILY.md as `<!-- curator-drained -->` blocks. Per fixup plan §2.2, drain target should be redirected to `family/_history/`.
3. **Alton + ad-hoc Claude sessions** — manual edits.

### Readers
1. **`morning-briefing` skill / cron** — reads active-todos.md, family-calendar.md, FAMILY.md, disney-july-2026.md, per-kid pages.
2. **`family-scheduler` agent** — reads FAMILY context + Google Calendar MCP.
3. **`travel-planner` agent** — reads FAMILY for trip logistics.
4. **`todo-sync` cron** — greps `> [!todo]`, `> [!deadline]`, `> [!blocker]` callouts (touches family/active-todos.md as a major source).
5. **`wiki-reader` agent** — generic, may read family/ on query.
6. **`wiki-reindex` cron** — reads everything for index regeneration.

---

## Health assessment per pipeline

| Pipeline | Status | Evidence |
|---|---|---|
| `personal-data-gather` | **DEGRADED** | Diagnosed in 2026-04-25 fixup memo §2.1; not fixed. Files have grown since: active-todos +464 lines, family-calendar +94 lines, FAMILY.md +31 lines. Append-not-replace, cadence-too-high, debate-with-itself, no privacy filter for Aneeta solo events. |
| `nightly-memory-curation` | **DRIFTED** | Drain target inlining into FAMILY.md per fixup §2.2; should redirect to `family/_history/`. |
| `morning-briefing` | **HEALTHY but COUPLED** | Reads working today; would break if FAMILY.md structure pruned without lockstep update. |
| `todo-sync` | **LIKELY HEALTHY** | Last-mod 2026-04-10; nightly cadence; no fixup-memo flags against it. Unverified, but no diagnosed pathology. |
| `family-scheduler` agent | **LIKELY HEALTHY** | Reads Google Calendar primarily; family wiki reads are bounded. |
| `wiki-reindex` | **HEALTHY** | Per-machine reindexes; no family-specific issues. |
| `daily-household-health`, gpu-* tasks | **NOT IN SCOPE** for family. |

---

## Gaps — what should exist but doesn't

### G1. **Weekly family-pruning skill/cron** (Phase 2.3 of fixup plan)
- **Purpose:** Sundays. Curator-or-Alton reviews active-todos.md, marks closed items, ages stale ones (>30d no activity), archives weekly _history/ additions.
- **Substrate:** `.claude/skills/family-weekly-triage/` + `.claude/scheduled-tasks/weekly-family-triage/` (Sun 5 PM ET, after wiki-reindex but before the new week).
- **Output:** Brief report — N items closed, M items stale, K added this week. Posted to daily log.
- **Dependency:** Requires fixup Phase 1 (active-todos.md triage to ~250 lines) for the pass to be tractable.

### G2. **`/family-status` slash command** (or `/family-week`)
- **Purpose:** A single command that surfaces the wiki-aware family snapshot — active-todos this week, calendar next 14 days, deadline-approaching callouts, kid-specific medical/school items needing attention. Distinct from `/family-today` (calendar-only) and `/morning` (5-domain firehose).
- **Substrate:** `.claude/commands/family-status.md` invoking a thin family-snapshot skill.
- **Why it matters:** Provides a fast in-thread query for Alton when family work is the active context (this thread). Right now you have to wait for morning-briefing or run `/morning` (which is a 5-domain output for a family-only question).

### G3. **`/family-triage` slash command** (manual variant of G1)
- **Purpose:** On-demand version of weekly triage. "Run this when I have 10 minutes to clean."
- **Substrate:** `.claude/commands/family-triage.md` invoking the same triage skill as G1.
- **Why it matters:** This thread's whole point is keeping the family layer healthy. Expose the action behind a command.

### G4. **`family-curator` sub-agent** (or extension to `memory-curator`)
- **Purpose:** Family-specific drain target enforcement. When draining from inbox, route family-relevant content to `family/_history/inbox-drains-{YYYY-MM}.md`, never inline into FAMILY.md. Per fixup §2.2.
- **Substrate:** Extend `memory-curator.md` agent OR fork a `family-curator.md` agent. Lighter option: parameterize memory-curator with a per-domain drain map.

### G5. **`personal-data-gather` v2** (Phase 2.1 of fixup plan, never executed)
- **Purpose:** Fix the diagnosed degradation:
  - Drop cadence from every-4h to once-daily morning.
  - No-change-silent rule (no diff → no write).
  - Time-correction protocol (one annotated entry, no debates).
  - Privacy filter: Aneeta solo events excluded from family-calendar.md.
  - Replace-don't-append for calendar tables.
- **Substrate:** Edit existing `personal-data-gather/SKILL.md`.

### G6. **Family-write hook** (defensive)
- **Purpose:** PreToolUse hook that intercepts Write/Edit on `sartor/memory/FAMILY.md` and `sartor/memory/family/*` and validates against:
  - Frontmatter preservation (per `feedback_preserve_frontmatter.md`).
  - The CONVENTIONS.md schema (Phase 1.1 of fixup, also not built yet).
  - Size cap (FAMILY.md > 200 lines triggers warning per fixup §3 validation).
- **Substrate:** `scripts/home-agent/governance/family-write-validator.sh` registered in `.claude/settings.json` PreToolUse hooks.

### G7. **`family-memory-fixup-executor` orchestrator** (one-shot, not recurring)
- **Purpose:** Execute the unbuilt 2026-04-25 plan end-to-end. Phase 0 (urgent items) is past; Phases 1+2 still applicable.
- **Substrate:** A `complex-project` invocation OR a `/execute-family-fixup` slash command that walks the plan with checkpoints.
- **Why it matters:** This is the highest-leverage missing pipeline. The plan exists; nothing has executed it.

### G8. **Sole-parent / dual-parent state awareness**
- **Purpose:** When Aneeta is traveling (RRE, work trips), the morning-briefing and family-scheduler should know Alton is solo and surface logistics differently. Currently `family/sole-parent-window-2026-04-29.md` is a one-shot file; no general pipeline.
- **Substrate:** Add a `family/parent-state.md` (current state: dual / sole-alton / sole-aneeta) updated by gather; readers branch on state.

---

## Concrete pipelines I'd build, ranked by leverage

| Rank | Item | Effort | Impact | Dependency |
|---:|---|---|---|---|
| 1 | **G7 — execute family-memory-fixup plan** (Phases 1+2) | 1-2 days of session work | Unblocks every other fix; stops file growth; enables G1+G2+G3+G6 | None — plan is ratified-pending |
| 2 | **G2 — `/family-status` slash command** | 1 hour | Immediate in-thread leverage for THIS thread | None |
| 3 | **G1+G3 — weekly + on-demand family-triage** | 2 hours | Closes the no-pruning gap | G7 (so triage has a tractable file to triage) |
| 4 | **G5 — gather v2** | 1 hour | Stops the active accretion source | G7 (fixup §2.1 is part of it) |
| 5 | **G4 — curator drain redirect** | 30 min | Stops FAMILY.md bloat | G7 (fixup §2.2) |
| 6 | **G8 — parent-state awareness** | 2 hours | Reduces solo-parent surprise (Aneeta travel) | None |
| 7 | **G6 — family-write validator hook** | 1 hour | Defensive, catches regressions | G7 (CONVENTIONS.md needs to exist) |

---

## Recommended next moves for this thread

1. **Don't build new pipelines first.** G7 (execute the fixup plan) is precondition to G1/G3/G6. Otherwise we'd be building cron jobs that operate on broken substrate.
2. **Fast win: G2 — `/family-status` slash command.** Cheap, useful immediately for this thread, no dependencies.
3. **Defer G1/G3 triage skill until after G7** — otherwise it would triage 1,311-line file with mixed layers.
4. **`SartorGmailScan` 5-instance duplicate count is suspicious** — worth a Windows Task Scheduler cleanup pass.
5. **`SartorHeartbeat` next-run = N/A** — heartbeat is silent again per pre-2026-04-19 problem; verify it's actually firing.

---

## History

- 2026-05-02 — initial audit by `pipelines-auditor` agent in family-thread session. Audit-only; no skills/agents/crons modified. Findings sent to team-lead in ≤400-word reply.
