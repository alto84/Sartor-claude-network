---
name: memory-system-uplift-2026-05-06-PLAN
description: Plan for uplifting the Sartor memory + information system into a cohesive 5-layer architecture (CLAUDE.md → family wiki → deep memory → source-doc index → activity stream/dashboard). Includes formal Gmail/Drive ingest evaluation, observer-led inspector team, scoping decisions Alton needs to make before Phase 1 dispatch.
type: project-plan
status: pending-alton-greenlight
date: 2026-05-06
priority: large
---

# Memory System Uplift — Plan

## Mission

Articulated by Alton 2026-05-06: tighten the Sartor memory + information system into a cohesive layered architecture. Today the system is functional but not cohesive — memories get written into odd places and lost; CLAUDE.md, family wiki candidates, deep memory, and source documents don't form a clean hierarchy. Plus formal evaluation of Gmail/Drive ingest. Plus dashboard-aware cron jobs that surface fresh inputs (email/financial/experiments). Texts deferred (no MCP).

## What we have today (factual snapshot)

### Identity layer
`CLAUDE.md` (~400 lines): identity, household, 5 domains, agent/skill/cron tables, infrastructure, git topology. Auto-injected with `data/USER.md`, `data/MEMORY.md`, all `feedback/*.md`.

### Memory tree (`sartor/memory/`)
- Top-level entity files: ALTON, FAMILY, BUSINESS, TAXES, MACHINES, PROJECTS, ASTRAZENECA, SELF, LEARNINGS, PROCEDURES
- Indexes: MEMORY.md (hand-curated, **currently 29 KB > 24.4 KB warning threshold**), INDEX.md (auto), QUICK-REFERENCE.md
- Reference files: `reference_home_network`, `reference_memory_server`, `reference_anthropic_shares`, `reference_scheduled_tasks`
- Topic dirs: research/, projects/, daily/, inbox/, machines/, family/, hearth/, feedback/, reference/, business/

### Three competing "family" locations
- `sartor/memory/FAMILY.md` — entity file
- `sartor/memory/family/` (10 files) — operational: kids profiles, calendar, vendors, todos, trips
- `sartor/memory/hearth/` (23 files) — philosophical: character, creed, founding, growth, voice, integration

These have plausibly distinct jobs but the boundary isn't documented. Likely source of "memories get written into odd places."

### Wiki tooling
`wiki.py`, `wiki-reader` agent, `wiki-reindex` task (declared, wiring uncertain), `build-llm-wiki` skill, `data/graph.jsonl` (typed wikilink edges, 21 seeded Apr 18, freshness unknown).

### Curation
`memory-curator` agent + `nightly-memory-curation` task + `SartorCuratorPass` 2× daily. Auditor / critic / sentinel agents for review.

### Information ingest
- `SartorGmailScan` every 4 h via `personal-data-gather` skill — effectiveness unmeasured
- `SartorConversationExtract` nightly — feeds `inbox/.../proposed-memories/<date>/`
- Drive: read-only MCP, **no scheduled ingest**
- Texts: no integration

### Dashboard
MERIDIAN at localhost:5055, FastAPI + uvicorn + WebSocket Claude terminal. Hermes-upgrade project exists. Not currently fed by an activity stream.

### Source documents
- `sartor/memory/source-documents/` does **not exist**
- Scattered across ~/Downloads, OneDrive\backups, OneDrive\Documents, OneDrive\Pictures
- One known indexed bundle: `OneDrive\backups\anthropic-shares-2026-05\Anthropic-shares-2025-2026.zip` (8 PDFs, indexed by `reference_anthropic_shares.md`)

## Friction points (hypotheses; inspectors verify)

1. **MEMORY.md overflow** — 29 KB > 24.4 KB; index entries truncated past line 200; pattern of writing 2-3 paragraph entries instead of one-line hooks
2. **Three family-wiki candidates** with no documented division of labor
3. **Reference files multiplying** without becoming a layer
4. **Wikilinks sparse** — graph.jsonl frozen at Apr 18 seed
5. **Source-document layer undeveloped** — no formal index outside the anthropic-shares bundle
6. **Gmail ingest effectiveness unmeasured** — 4h scan runs, no metrics
7. **Drive ingest absent** — MCP available, no scheduled reads
8. **Cron→dashboard pipe missing** — outputs land in files, dashboard doesn't surface them
9. **Multiple curator/agent overlap** — possibly consolidatable
10. **Inbox proposed-memories backlog** — extractor over-producing relative to curator throughput (53/58 item drains in April)

## Target end-state architecture

5 layers, each with one job. Information flows top → bottom in increasing detail.

| # | Layer | What lives there | Owner |
|---|---|---|---|
| 1 | **Identity** (`CLAUDE.md`) | Who I am, comm rules, 5 domains, index of agents/skills/crons. ~500 lines max. | Alton greenlight |
| 2 | **Family wiki** (consolidated `sartor/memory/family/INDEX.md` + topic files) | Tight navigable wiki: people, schools, healthcare, schedules, vendors, friends, recurring routines. One canonical place per fact. | Curator + manual |
| 3 | **Deep memory** (`sartor/memory/` topic files) | Domain knowledge, decisions, rationale. References family wiki + source docs by wikilink. | Curator + wiki-reader |
| 4 | **Source-doc index** (`sartor/memory/source-documents/INDEX.md` — to build) | Pointers to organized PDFs/tax/statements/contracts physically stored at canonical paths outside repo. Each entry: path, summary, date, vendor, related wikilinks. | New `source-doc-ingest` cron |
| 5 | **Activity stream** (`data/inbox-stream/` → MERIDIAN dashboard) | Live state: recent emails, transactions, experiments, peer status, todos, alerts. Time-ordered. Surfaces what's NEW. | Cron-fed; dashboard reads |

`hearth/` likely belongs at Layer 3 as the agent's identity/reflection deep-memory complement to ALTON/FAMILY/etc. The boundary between `family/` and `FAMILY.md` needs explicit articulation in Phase 1.

## Phase 0 — done today

- `Hidden = $true` on 10 Windows scheduled tasks (focus-stealing flashes stop)
- `reference_scheduled_tasks.md` — canonical fleet-wide cron inventory
- This planning doc

## Phase 1 — agent-team evaluation (proposed; needs greenlight)

5 inspector teammates parallel + 1 observer + synthesizer + critic + revise loop.

| Inspector | Owns | Deliverable |
|---|---|---|
| `inspector-architecture` | Memory tree shape, file-size distribution, dead zones, naming consistency, MEMORY.md overflow | `MEMORY-AUDIT.md` |
| `inspector-family-wiki` | Boundaries between `FAMILY.md` / `family/` / `hearth/`; recommend consolidated layout | `FAMILY-WIKI-AUDIT.md` |
| `inspector-gmail-drive` | What SartorGmailScan does in practice; sample outputs; family-relevance hit/miss; Drive ingest gap | `INGEST-AUDIT.md` |
| `inspector-source-docs` | Where source PDFs/statements live now; propose canonical organization + index format | `SOURCE-DOC-AUDIT.md` |
| `inspector-wikilinks-graph` | graph.jsonl freshness, wikilink coverage, broken-link rate, orphan rate | `LINKS-AUDIT.md` |

**Observer:** sonnet, separate context, watches inspectors as they land, surfaces gaps/contradictions/risks. Writes `OBSERVER-NOTES.md` continuously.

**Synthesizer:** fresh-context opus, takes 5 reports + observer notes, writes `PROPOSAL.md` with concrete actions ranked by ROI.

**Critic:** Cato-style prosecutor, fresh context, charges the proposal. Writes `PROPOSAL-CRITIQUE.md`.

**Revise:** synthesizer addresses each charge → `PROPOSAL-FINAL.md`.

**Phase 1 deliverable to Alton:** `PROPOSAL-FINAL.md` + `OBSERVER-NOTES.md` + 5 audit files + critique. Decision-ready, no autonomous changes.

Estimated: 2-4 h wall-clock; ~$20-40 token-equivalent. Output is recommendations + evidence.

### Phase 1 hard constraints (will not be violated)

- No git push
- No memory edits beyond inspectors' own audit files (under `projects/memory-system-uplift-2026-05-06-WORK/`)
- No skill creation
- No cron changes
- No agent dispatch beyond the named team
- Drive writes: never; Gmail writes: never; Drive/Gmail reads: read-only audit only

## Phase 2 — implement on greenlight (waves)

Each wave is its own greenlight. No big-bang.

- **Wave A** Memory tree consolidation (collapse competing family-wiki dirs, fix MEMORY.md overflow, enforce one-line index entries)
- **Wave B** Source-doc index + canonical paths
- **Wave C** Gmail/Drive ingest improvements + new crons
- **Wave D** Dashboard wiring for activity stream
- **Wave E** Skill consolidation if redundancy surfaces

## Phase 3 — proposed new crons (anticipated outputs of Phase 1, surfaced now for transparency)

| Cron | Frequency | Purpose | Lands in |
|---|---|---|---|
| `gmail-family-relevance-scan` | every 4 h (replaces or augments SartorGmailScan) | Tagged search for family/financial/medical/school keywords; triaged findings | `data/inbox-stream/gmail-<date>.jsonl` |
| `drive-recent-changes-scan` | nightly | List recent Drive changes; diff against last scan | `data/inbox-stream/drive-<date>.jsonl` |
| `source-doc-ingest` | nightly | Watch ~/Downloads + OneDrive\backups for new PDFs/statements; route to canonical paths + update source-doc INDEX | `sartor/memory/source-documents/INDEX.md` |
| `experiments-watcher` | hourly | Pull peer experiments status into dashboard-readable stream | `data/inbox-stream/experiments-<date>.jsonl` |
| `texts-ingest` | deferred | Pending iCloud/SMS bridge research | — |
| `dashboard-refresh` | every 5 min | MERIDIAN reads activity-stream files + renders | (live) |

## Phase 4 — empirical re-evaluation (30 days post-implementation)

Compare Gmail/Drive ingest hit rate against 30-day baseline. Numerical comparison.

## Open scoping decisions for Alton

These determine Phase 1 dispatch shape. Need explicit answers (or "use your judgment, here's the constraint"):

1. **Phase 1 token budget** — $20-40 OK, or tighter / looser?
2. **Phase 1 output mode** — recommendations only, OR "build it on greenlight" for trivially safe items (file relocations, frontmatter additions)?
3. **Privacy floor on Gmail inspection** — OK for inspector to read sample SartorGmailScan outputs (personal Gmail) to evaluate effectiveness? Strict yes/no.
4. **Source-doc discovery scope** — OK to enumerate ~/Downloads, OneDrive, ~/Documents to find scattered PDFs (read-only listing, no downloads, no cloud calls)?
5. **Text-message integration** — keep deferred (no MCP), or include feasibility research?
6. **Dashboard target** — assume MERIDIAN at localhost:5055 as integration point, or open to redesign?
7. **Timeline** — push Phase 1 tonight (parallel-dispatch + ~3 h), or defer to a longer evening session?
8. **Observer model** — sonnet (cheaper, ~80% as good), or opus (the meta-reasoning catches more)?
9. **`hearth/` future** — Phase 1 inspector-family-wiki will surface this, but if you have a strong prior ("hearth/ is the agent's reflection space, leave alone" vs "fold into family/"), say so now.

## What I am asking for

A go/no-go on Phase 1 dispatch + answers to the 9 scoping questions. Once those land, I dispatch the team and surface PROPOSAL-FINAL.md when it lands.

If you'd rather I run Phase 1 in a smaller / different shape, say what to change.
