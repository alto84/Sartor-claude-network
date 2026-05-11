---
name: LINKS-AUDIT
description: inspector-wikilinks-graph audit for the memory-system-uplift effort. Measures the link layer (typed wikilinks, plain wikilinks, graph.jsonl freshness, broken/orphan rates, hub/authority structure), tests the wiki-reader/wiki.py stack, and recommends whether typed wikilinks should be enforced.
type: audit
project: memory-system-uplift-2026-05-06
inspector: inspector-wikilinks-graph
date: 2026-05-06
status: complete
---

# Wikilinks-Graph Audit

## Headline

The typed-wikilink layer adopted on 2026-04-18 is **inert in practice**. After 18 days, only 3 of 353 in-scope memory files (0.8%) carry a typed wikilink, total typed edges are 9, and the seed of 21 has barely moved (24 today, 3 of which are false positives from a documentation example). The plain-wikilink layer is much healthier (41% file coverage, 1338 edges) but suffers from naming-convention drift that produces 53-57 broken links and 179 orphans even at the wiki-core scope. The `wiki-reindex` "scheduled task" exists as a SKILL.md only — it is **not wired to any Windows Scheduled Task**, has never written its own log file, and the on-disk indexes have not been refreshed since 2026-04-09 (28 days stale). The `wiki-reader` agent's underlying tool (`wiki.py`) is solid and produces clean structured output; the failure is upstream of the agent (stale indexes, no scheduling) and downstream of the spec (no enforcement of the typed-link convention).

The single highest-ROI fix is to **wire `wiki-reindex` to a Windows Scheduled Task tonight** (one PowerShell `Register-ScheduledTask` call). Typed-wikilink enforcement is not the right next move — the convention has not earned its place yet, only one author (the v0.3 seeder) has used it, and there is no consumer of `data/graph.jsonl` other than its own existence. Defer that question 30 days, after the wiki-reindex feedback loop is alive.

## §1 Methodology

Ran a custom read-only metrics script `audits/_metrics.py` against the live memory tree. Two scopes:

- **Broad scope** (excluding `archive/`, `indexes/`, `__pycache__/`, etc.): 756 .md files. Includes `daily/`, `inbox/`, `snapshots/`, `feedback/`, `family/`, `hearth/`, `research/`, all of it.
- **Wiki-core scope** (also excluding `daily/`, `inbox/`, `snapshots/` to match `wiki.py`'s own filter): 353 .md files.

For each file in scope:
- Parsed body with `re.compile(r"\[\[([^\[\]|#]+?)(?:\|[^\[\]]*)?(?:#[^\[\]]*)?\]\]")` for plain wikilinks (after stripping fenced + inline code blocks).
- Parsed body with `re.compile(r"\[\[([a-z][a-z0-9_]*):([^\]|]+?)(?:\|[^\]]+)?\]\]")` for typed wikilinks. Same regex `extract_graph.py` uses.
- Resolved each link target with a 4-level fallback resolver: (1) direct repo-relative path; (2) source-dir-relative (handles Obsidian's subdir-relative pattern like `[[adverse-events/CRS]]` from inside `safety-knowledge-graph/adverse-events/`); (3) `../` traversal; (4) basename fallback. Case-insensitive throughout. `.md` suffix optional.
- Built inbound-link map for orphan + hub detection.
- Built basename-collision map (same stem in multiple paths) to surface ambiguity that the resolver papers over.

Cross-checked findings against `wiki.py --health`, `wiki.py --backlinks`, `wiki.py --broken`, `wiki.py --tags`, `wiki.py --article` — three of which I ran live as proxy "wiki-reader" tests since the Task tool was not available.

Also re-ran `extract_graph.py` against the live corpus (the byte-identical output for the seed-vs-current comparison, plus 3 new false-positive edges from prose examples in `ARCHIVIST-NOTES.md`).

Re-running `extract_graph.py` did write `data/graph.jsonl`, but `data/` is gitignored so this had zero version-control impact. The script is deterministic — output bytes are stable for the same input.

## §2 Current state of `data/graph.jsonl`

| Metric | Value |
|---|---|
| Last on-disk mtime before this audit | 2026-04-18 13:45 (seed run, 18 days ago) |
| Edges at seed | 21 |
| Edges after re-extraction today | 24 |
| Net additions in 18 days | +3, all false positives (prose examples in `research/persona-engineering/ARCHIVIST-NOTES.md` lines 136, 155 — `[[supersedes:...]]` and `[[depends_on:...]]` are quoted as syntax illustrations, not real edges) |
| Real new typed edges added since seed | **0** |
| Files producing typed edges (broad scope) | 3 (`ALTON.md`, `BUSINESS.md`, `FAMILY.md`) — all from the original v0.3 seed |
| Distinct authors who have written typed wikilinks | 1 (the autodream/wikilinks-implementer seeder on Apr 18) |
| `data/` git-tracked? | No — gitignored. Graph is local-only artifact. |

The 24 edges break down by relation:

| Relation | Count |
|---|---|
| `parent_of` | 5 |
| `located_in` | 3 |
| `married_to` | 3 |
| `supersedes` | 3 (2 false-positive) |
| `works_at` | 3 |
| `depends_on` | 2 (1 false-positive) |
| `invested_in` | 2 |
| `owns` | 2 |
| `archived_from` | 1 |

Real edge count once false positives stripped: **21**. Identical to seed. The convention has gained literally zero new edges in 18 days of operation.

## §3 Coverage metrics

### Broad scope (756 files)

| Metric | Count | % |
|---|---|---|
| Files with at least one typed wikilink | 3 | 0.4% |
| Files with at least one plain wikilink (typed or untyped) | 158 | 20.9% |
| Total typed edges | 9 (de-duplicated per source/target) |  |
| Total plain edges | 1444 |  |

### Wiki-core scope (353 files — excludes daily/, inbox/, snapshots/)

| Metric | Count | % |
|---|---|---|
| Files with at least one typed wikilink | 3 | 0.8% |
| Files with at least one plain wikilink | 145 | 41.1% |
| Total typed edges | 9 |  |
| Total plain edges | 1338 |  |

Two observations:

1. **The plain wikilink layer is the real link layer.** It carries 148× more edges than the typed layer and reaches 41% of files in the wiki-core. This is what the wiki-reader agent's `wiki.py` queries actually traverse.
2. **Daily logs and inbox almost never link.** Broad-scope file-with-wikilink rate is 21% vs wiki-core 41% — daily logs and inbox files are append-only narrative and don't reach for `[[]]`. That's expected and probably correct: forcing wikilinks into daily logs would be busywork. Most of the 419 files added to broad-scope (756 - 353 = 403, plus 13 archive) are either daily logs, inbox proposals, or one-shot snapshots.

## §4 Broken links

Wiki-core scope produces **57 broken links** in the inspector's resolver and **42** in `wiki.py --broken`. The discrepancy is because `wiki.py` does not resolve typed wikilinks at all (it sees them as `rel:target` literal targets, all of which are "broken" — but it dedupes some). Both numbers are in the same order of magnitude. Three failure clusters dominate:

### Cluster A: `feedback/` naming-convention drift (≈25 broken links)

Files reference `[[feedback/paper-checks-blindspot]]` and `[[feedback/gather-respects-out-of-band-closures]]`. The actual filenames are `feedback/feedback_paper_checks_blindspot.md` and `feedback/feedback_gather_respects_out_of_band_closures.md`. Two simultaneous conventions:

- The aspirational convention (used in newer wikilinks): hyphens, no `feedback_` prefix.
- The actual on-disk convention: underscores, `feedback_` prefix.

This is the highest-volume broken-link source. Sample broken links:
```
family/PAPER-CHECK-VENDORS                                  -> [[feedback/gather-respects-out-of-band-closures]]
family/PAPER-CHECK-VENDORS                                  -> [[feedback/paper-checks-blindspot]]
projects/family-thread-dossier/INDEX                        -> [[feedback/archive-not-collapse]]
projects/family-thread-dossier/INDEX                        -> [[feedback/paper-checks-blindspot]]
projects/family-thread-dossier/INDEX                        -> [[feedback/gather-respects-out-of-band-closures]]
projects/family-thread-dossier/constitution-v04-amendments-proposed -> [[feedback/intake-protocol]] (×4)
projects/family-thread-dossier/constitution-v04-cantor-critique     -> [[feedback/intake-protocol]]
projects/dashboard-rebuild/INDEX                            -> [[feedback/paper-checks-blindspot]] (×3)
hearth/practice                                             -> [[feedback/intake-protocol]] (×2)
hearth/practice                                             -> [[feedback/archive-not-collapse]]
feedback/feedback_intake_protocol                           -> [[feedback/paper-checks-blindspot]]
feedback/feedback_intake_protocol                           -> [[feedback/gather-respects-out-of-band-closures]]
feedback/feedback_archive_not_collapse                      -> [[feedback/gather-respects-out-of-band-closures]]
```

Even the feedback files themselves link to each other using the aspirational convention. This is fixable in two ways: (a) rename the files to drop `feedback_` and switch to hyphens (the aspirational target), or (b) update the sources to match disk reality. Pick one and enforce.

### Cluster B: Reference targets that don't exist anywhere (≈15 broken links)

Wikilinks that name files no inspector can find. These are real "missing target" cases:

```
business/vastai-pricing-strategy   -> [[reference/vastai-listing-flags]]
BUSINESS                            -> [[../conversation_extract.py]]   # link to a script, not memory
daily/2026-04-22                    -> [[experiments/2026-04-22-overnight-training/TENSION-RESOLUTION-TEAM-RECORD]]   # experiments/ lives outside sartor/memory/
MEMORY                              -> [[experiments/2026-04-22-overnight-training/TENSION-RESOLUTION-TEAM-RECORD]]
MEMORY                              -> [[.claude/skills/peer-comms]]    # skill, not memory file
reference/INDEX                     -> [[reference/archive/OPERATING-AGREEMENT-DRAFT-GPUSERVER1]]   # archive/ excluded from scan
reference/INDEX                     -> [[reference/archive/OPERATING-AGREEMENT-DRAFT-ROCINANTE]]
reference/INDEX                     -> [[reference/archive/HOUSEHOLD-CONSTITUTION-v0.1]]
feedback/feedback_archive_not_collapse -> [[topic-file]]                # generic placeholder, never a real file
```

Note the `reference/INDEX -> [[reference/archive/...]]` cluster: these are intentionally pointing into archived files, and `archive/` is excluded from the canonical wiki scope. That's a definitional argument (should `archive/` count as resolvable?), not a true broken link.

Two pointers (`MEMORY` -> `experiments/...`) reach files that exist outside `sartor/memory/` entirely (under `C:\Users\alto8\experiments\` per `research/experiments-index.md`). That's intentional cross-roof reference; the resolver can't know.

### Cluster C: Subdir-relative misses in `research/persona-engineering/` (≈8 broken links)

Files like `research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint.md` reference `[[base-models/heretic-base/lineage]]` and `[[adapters/lora-sartor-v0.3/lineage]]`. These would resolve if the directories existed at `research/persona-engineering/base-models/` and `research/persona-engineering/adapters/`, but they don't. The convention is documented in `ARCHIVIST-NOTES.md` as a *target architecture* for that research line — the directories are not yet created. These are aspirational links waiting for the substrate to catch up.

### Other broken links

- `BUSINESS -> [[machines/gpuserver1]]` (×2) — actually this DOES resolve to `machines/gpuserver1/INDEX.md` if the resolver tried directory-as-index. Subtle bug in the resolver, not a real broken link.
- `daily/2026-04-22 -> [[experiments/...]]` — out-of-roof reference, see above.

### Net true broken-link rate

Stripping out (a) intentional cross-roof references, (b) `reference/archive/*` definitional disagreement, (c) aspirational-target Cluster C: roughly **30 truly broken wikilinks** in the wiki-core scope, almost all from Cluster A naming-convention drift.

## §5 Orphan files

In the wiki-core scope (353 files), **179 files have zero inbound wikilinks (50.7%)**. In the broad scope (756 files), **579 files have zero inbound wikilinks (76.6%)** — but the broad-scope number is misleading because daily logs and inbox files are designed to be append-only and not pointed-to.

`wiki.py --orphans` reports only **1 orphan** because it filters to a smaller set (excludes meta/reference types via `is_orphan_candidate()`). The 179 number is more honest about discoverability.

**Top 60 orphans in wiki-core scope** (alphabetical by relative path):

```
INDEX                                                         <- the root index has no inbound (because nothing should point AT the root index — fair)
MACHINES                                                      <- root MACHINES.md (the dup of machines/MACHINES.md issue)
business/hours-log/2025-06-to-2026-05-estimate
business/hours-log/system-design-2026-05-02
business/rental-policy
business/secrets-migration-log
family/.claude/CLAUDE
family/.claude/agents/horizon-keeper
family/.claude/agents/household-companion
family/.claude/agents/kids-advocate
family/.claude/agents/partnership-witness
family/CONVENTIONS
family/INDEX
feedback/_consolidation-review-2026-05-02
feedback/artifact-vs-fact-not-found
feedback/awareness-as-duty
feedback/feedback_agent_bypass
feedback/feedback_memory_conventions
feedback/feedback_no_permissions
feedback/feedback_permissions_fix
feedback/feedback_prefer_subagents
feedback/feedback_preserve_frontmatter
feedback/feedback_pricing_autonomy
feedback/feedback_protected_paths
feedback/framework-floor-not-checklist
feedback/goal-driven-execution
feedback/proactive-error-cleanup
feedback/prosecutorial-discount-on-constitutional-reframes
feedback/scope-discipline
gpuserver1-monitoring-log
hearth/.claude/CLAUDE
hearth/.claude/agents/hearth-scribe
hearth/.claude/agents/hearth-steward
hearth/.claude/agents/hearth-welcomer
hearth/.claude/skills/share-with-another-claude
hearth/_history/founding-signatures-2026-05-02
ledgers/INDEX
machines/_TEMPLATE/JOURNAL
machines/_TEMPLATE/STATE
machines/gpuserver1/INDEX
machines/rocinante/CRONS
machines/rtxpro6000server/BMC
machines/rtxpro6000server/CRONS
machines/rtxpro6000server/MISSION-v0.1
people/INDEX
procedures/vastai-host-onboarding
projects/2025-photo-book/PROJECT
projects/curator-fixes/2026-04-13_schema-fixes
projects/dashboard-rebuild/EXPLORE-01-meridian
projects/dashboard-rebuild/EXPLORE-02-briefing
projects/dashboard-rebuild/EXPLORE-03-sartor-network
projects/dashboard-rebuild/EXPLORE-04-inrepo-dashboard
projects/dashboard-rebuild/INDEX
projects/family-thread-dossier/_history/family-dashboard-2026-05-02-v1
projects/family-thread-dossier/constitution-v04-amendments-proposed
projects/family-thread-dossier/constitution-v04-cantor-critique
projects/family-thread-dossier/cron-uplift-program-v0.1
projects/family-thread-dossier/cross-domain-executor-worklist
projects/family-thread-dossier/financial-positions-2026-05-02
projects/family-thread-dossier/gather-pipeline-pain-ranking-2026-05-02
... and 119 more
```

### Orphan-cluster analysis

- **Most `feedback/*.md` are orphans** — 14+ feedback files have no inbound wikilinks. This is fine if `feedback/` is auto-injected (which it is, per MEMORY.md "Feedback rules (auto-injected)"). The auto-injection IS the discoverability mechanism. Adjust the orphan rule to skip `feedback/` entirely.
- **Project-internal files often orphan** — `projects/family-thread-dossier/`, `projects/dashboard-rebuild/`, `projects/curator-fixes/` have many internal files that link out but nothing links in. Project INDEX files exist but don't always cross-link to their child docs. This is real — project INDEXes should point at every child doc.
- **`.claude/` files inside `family/` and `hearth/`** orphan because they're agents/skills inside a sub-`.claude/` directory, not memory files. They show up because they're `.md` and the scanner doesn't filter by directory pattern. These should be excluded from the orphan rule (they're not "memory" — they're agent definitions for a sub-agent).
- **`INDEX.md` and root entity files (MACHINES, etc.) appearing as orphans** — root indexes don't get pointed-at because they're the root. This is fine, but the `MACHINES` / `machines/MACHINES` dup is a real issue (basename collision; one of them is dead).

### Genuine "lost" orphans

The truly orphaned files — discoverable nowhere in the link graph and not auto-injected — are roughly:

- `business/hours-log/*` (3 files, including the 2025-06-to-2026-05 estimate and the system-design doc)
- `business/rental-policy.md`, `business/secrets-migration-log.md`
- `family/CONVENTIONS.md`, `family/INDEX.md` (the family wiki INDEX itself is unreferenced from the root MEMORY.md)
- `gpuserver1-monitoring-log.md` (rolling log, mentioned in MEMORY.md history but not via wikilink)
- All four `projects/dashboard-rebuild/EXPLORE-*` files plus `projects/dashboard-rebuild/INDEX.md` (this entire project is sealed off from the wiki)
- `projects/family-thread-dossier/*` — 7+ files in this project orphan; the project INDEX doesn't link them; nothing else links to the project
- `procedures/vastai-host-onboarding.md` (pairs with the `vastai-management` skill but no wikilink in either direction)
- `machines/rocinante/CRONS.md`, `machines/rtxpro6000server/{CRONS,BMC,MISSION-v0.1}.md` (per-machine state files; the machine `INDEX.md` should link to them)
- `machines/_TEMPLATE/*` (the template — fine to orphan)
- `hearth/_history/founding-signatures-2026-05-02.md` (`_history/` files orphan by design — they're snapshots; arguably should be excluded from the orphan rule)

That's about **35-40 substantively orphaned files** that would benefit from inbound wikilinks. The bulk of the 179 are explicable (auto-injected feedback, root indexes, `_history/` snapshots, `.claude/` sub-agent files, machine templates).

## §6 Hub files (highest in-degree)

Wiki-core scope, top 15 by inbound wikilinks:

| In-degree | File |
|---|---|
| 25 | `FAMILY` |
| 20 | `machines/MACHINES` |
| 20 | `ALTON` |
| 19 | `BUSINESS` |
| 19 | `family/active-todos` |
| 15 | `research/pharmacovigilance/safety-knowledge-graph/models/risk-model` |
| 15 | `research/pharmacovigilance/safety-knowledge-graph/adverse-events/CRS` |
| 13 | `reference/MULTI-MACHINE-MEMORY` |
| 13 | `research/pharmacovigilance/safety-knowledge-graph/adverse-events/ICANS` |
| 12 | `family/vayu` |
| 12 | `reference/OPERATING-AGREEMENT` |
| 12 | `hearth/practice` |
| 12 | `research/pharmacovigilance/safety-knowledge-graph/mitigations/dose-reduction` |
| 11 | `family/vishala` |
| 11 | `family/vasu` |

This is the right shape: the household entity files (FAMILY, ALTON, BUSINESS, MACHINES) are the top hubs, plus `family/active-todos` (the operational task ledger) and the kids' personal files. The pharmacovigilance research files appear because that subdirectory has dense internal cross-linking — the safety-knowledge-graph has its own well-formed link layer.

`reference/OPERATING-AGREEMENT`, `reference/MULTI-MACHINE-MEMORY`, and `hearth/practice` round out the architectural hubs — what you'd expect for a memory layer focused on household + governance + reflection.

`TAXES` does not make top-15 (in-degree 11). For an entity that drives quarterly cron tasks and has a dedicated agent, that's lower than expected. The TAXES file *should* be a top-5 hub. Backlinks: `BUSINESS, INDEX, PROJECTS, business/sante-total, business/solar-inference, log` — that's 6 files. Plus 5 more I didn't track. The TAXES content is rich but the cross-references in are sparse.

## §7 Authority files (highest unique-target out-degree)

Wiki-core scope, top 15 by unique outbound targets:

| Out-degree | File |
|---|---|
| 30 | `family/active-todos` |
| 25 | `log` |
| 24 | `MEMORY` |
| 21 | `reference/INDEX` |
| 17 | `hearth/INDEX` |
| 17 | `projects/unifi-takeover-2026-05-01-INDEX` |
| 14 | `ALTON` |
| 14 | `research/pharmacovigilance/safety-knowledge-graph/models/risk-model` |
| 13 | `research/INDEX` |
| 12 | `BUSINESS` |
| 12 | `research/pharmacovigilance/safety-knowledge-graph/README` |
| 10 | `machines/gpuserver1/INDEX` |
| 10 | `projects/family-thread-dossier/constitution-v04-amendments-proposed` |
| 9 | `family/.claude/agents/household-companion` |
| 9 | `family/.claude/CLAUDE` |

This is also the right shape: INDEX files (family, hearth, reference, research, project INDEXes) are the top authorities — they exist to point at things. `MEMORY.md` and `log.md` are mid-table because they reference many topic files. The pharmacovigilance README and risk-model are local hubs for that subdirectory.

The presence of `family/.claude/agents/household-companion` and `family/.claude/CLAUDE` in the top 15 is interesting — those are sub-agent definition files that reach OUT into the family wiki for context. They're heavy authorities and zero-inbound orphans (no one links AT them). This is by design (they're loaded by the agent harness, not by humans browsing).

## §8 wiki-reindex wiring status

| Question | Answer |
|---|---|
| Does `.claude/scheduled-tasks/wiki-reindex/SKILL.md` exist? | Yes |
| What does it claim to do? | Run `python wiki.py --reindex` nightly; write outputs to `sartor/memory/indexes/*.json`, `data/wiki-state.md`, `data/evolve-log/{date}-wiki-reindex.md` |
| Does any Windows Scheduled Task invoke it? | **NO**. `Get-ScheduledTask` shows: `SartorMorningBriefing`, `SartorGmailScan`, `SartorCuratorPass`, `SartorConversationExtract`, `Sartor Memory Mirror`, `Sartor Peer Creds Sync`, `Sartor Peer Sessions Mirror`, `Sartor Hours Log`, `UniFi Daily Backup`, `SartorImprovementLoop`, `SartorHeartbeat` (disabled). **No `SartorWikiReindex` or equivalent.** |
| Last time `sartor/memory/indexes/*.json` were written? | 2026-04-09 22:41 (28 days ago) |
| Last time `data/wiki-state.md` was written? | 2026-04-10 02:41 (27 days ago) |
| Have any `data/evolve-log/*-wiki-reindex.md` files ever been written? | No. Only file in `data/evolve-log/` is `2026-04-03-1420.md` (the one-off EVOLVE pilot) |
| Does the underlying `wiki.py --reindex` work when invoked manually? | Yes. `wiki.py --selftest` passes 7/7 checks; `wiki.py --health` returns clean JSON; CLI queries return well-structured results. |

**Bottom line:** the SKILL.md is documentation-only. It has never executed as a scheduled task. The on-disk indexes are 28 days behind reality and report stats (55 files, 32 tags, 271 backlinks, 1 orphan, 0 broken) that bear no resemblance to current truth (~359 files, 336 tags, 642 backlinks, 99 orphans, 42 broken — what `wiki.py --health` returns from a fresh in-memory parse).

The `wiki-reader` agent points readers at the disk indexes. A reader asking "what are the orphans?" would currently get the answer "1 orphan: reference/gpuserver1-delegation.md" when reality is 99 (or 179 by my stricter count). Same for tag and similarity queries — they're reading 28-day-stale data.

## §9 wiki-reader test results

The Task tool was not available in this inspector context, so I exercised the underlying `wiki.py` CLI directly — which is exactly what the wiki-reader agent invokes via Bash. Three sample queries:

### Query 1: "What backlinks does ALTON have?"

```
$ python wiki.py --backlinks ALTON
ASTRAZENECA.md
FAMILY.md
INDEX.md
MEMORY.md
SELF.md
TAXES.md
business/az-career.md
business/sante-total.md
business/solar-inference.md
family/active-todos.md
family/vasu.md
family/vayu.md
family/vishala.md
ledgers/kids.md
```

Returns 14 backlinks in clean format. Caveat: this read from `indexes/backlinks.json` which is 28 days stale. The actual current backlinks (from in-memory parse) include 6 more. Accuracy of the cached answer is ~70%.

**Judgment**: structurally correct, freshness compromised by no scheduling.

### Query 2: "What is in the ALTON article view?"

```
$ python wiki.py --article ALTON
# Alton - User Profile  [ALTON.md]

## Frontmatter
  type: person
  entity: ALTON
  ...
  tags: ['entity/person', 'domain/self']
  related: ['FAMILY', 'ASTRAZENECA', 'BUSINESS', 'TAXES']

## Decay: WARM (0.6179)

## Backlinks (14)
  <- ASTRAZENECA.md
  ...

## Wikilinks Out (17)
  -> ASTRAZENECA
  -> BUSINESS
  ...
```

Returns frontmatter + decay tier + backlinks + outbound links + callouts + provenance, all in one structured chunk. This is the article view the wiki-reader agent's prompt is built around. Format is clean and bounded. The decay tier (WARM 0.62) and "last verified 2026-04-12" surface health signals.

**Judgment**: high quality. The agent contract ("return under 400 words with file:line citations") is well-supported by this output.

### Query 3: "What broken wikilinks exist?"

```
$ python wiki.py --broken
ALTON.md	works_at:ASTRAZENECA
ALTON.md	married_to:FAMILY
ALTON.md	located_in:FAMILY
business/vastai-pricing-strategy.md	reference/vastai-listing-flags
BUSINESS.md	owns:machines/gpuserver1
BUSINESS.md	../conversation_extract.py
... (42 entries total)
```

The output **mis-classifies typed wikilinks as broken** (the first 3 entries — `ALTON.md works_at:ASTRAZENECA` etc. — are perfectly resolvable typed wikilinks that the resolver doesn't strip the `rel:` prefix from). About 11 of the 42 reported broken links are this false positive. Real broken count is closer to 31 by `wiki.py`'s own count.

**Judgment**: usable but has a typed-wikilink resolver bug. Independent of the typed-wikilink convention being inert in the corpus, the wiki.py resolver should strip `rel:` before resolution. Filed as an issue for any follow-up work. This is the same root problem as the convention's design choice: typed wikilinks were grafted on without updating the resolver and orphan/broken-link computations to be aware of them.

### Tag query

```
$ python wiki.py --tag entity/person
ALTON.md
FAMILY.md
family/vasu.md
family/vayu.md
family/vishala.md
ledgers/kids.md
```

Returns 6 entity/person files, clean. This works.

### Synthesis on wiki-reader

The agent's underlying tool is **functional and well-structured**, but operates against indexes that are 28 days stale and has a known typed-link resolution bug. A wiki-reader query today returns answers anchored to April 9 reality. That's tolerable for entity files like ALTON (which haven't moved much) and unacceptable for queries about orphans / broken links / tag distribution. Wiring the reindex task is the unblock.

## §10 Recommendations

Ranked by ROI. Rough effort estimates assume a single Claude session.

### Tier 1 — do tonight

**R1. Wire `wiki-reindex` to a Windows Scheduled Task.** [Effort: 15 min. Impact: unblocks the wiki-reader agent's freshness AND every downstream consumer of the indexes.]

Create `scripts/sartor-wiki-reindex.ps1` that wraps `python sartor/memory/wiki.py --reindex` plus runs `python sartor/memory/extract_graph.py` for the typed-link sidecar. Register a daily 4:00 AM ET Windows Scheduled Task `SartorWikiReindex` (consistent with the existing `SartorCuratorPass`, `Sartor Memory Mirror` 3:30 AM, `Sartor Peer Creds Sync` 4h cycle pattern). Log to `C:\Users\alto8\backups\sartor-wiki-reindex.log`. Update `reference_scheduled_tasks.md` and CLAUDE.md "Scheduled Tasks" table to reflect reality. Keep the `.claude/scheduled-tasks/wiki-reindex/SKILL.md` as the spec of what the task does.

This is the single highest-ROI action surfaced by the audit. Everything downstream depends on fresh indexes.

**R2. Fix the `feedback/` naming-convention drift.** [Effort: 30 min, mostly a `git mv` pass + grep-rewrite. Impact: cuts broken-link count by ~half (from ~30 to ~15 real broken).]

Pick one convention and enforce it. Recommendation: **adopt the aspirational convention (hyphens, no `feedback_` prefix)** because (a) the `feedback_` prefix is redundant with the directory name, (b) hyphens match the rest of the corpus (`reference_*`, `gather-triage-*`), (c) more existing wikilinks use the aspirational form, so renaming files is fewer edits than rewriting links. Concretely:

- `git mv feedback/feedback_intake_protocol.md feedback/intake-protocol.md` (and 12 similar)
- After each rename, leave the old filename behind as a 1-line shim with `aliases: [old-name]` frontmatter + a `[[new-name]]` body — for at least 14 days, then delete.
- Update `MEMORY-CONVENTIONS.md` to declare the convention explicitly.

**R3. Audit `reference/INDEX.md`'s archive references.** [Effort: 5 min. Impact: cuts 3 broken links + clarifies whether `archive/` belongs in scope.]

The current INDEX points at `reference/archive/OPERATING-AGREEMENT-DRAFT-{GPUSERVER1,ROCINANTE}` and `reference/archive/HOUSEHOLD-CONSTITUTION-v0.1` as archived items. Either: (a) add `archive/` to wiki.py's resolvable scope (small change), or (b) drop those wikilinks from `reference/INDEX.md` and use plain text. Do (b) — archives shouldn't be searchable as live targets.

### Tier 2 — do this week

**R4. Add inbound wikilinks for the 35-40 substantively-orphaned files.** [Effort: 60-90 min as a curator pass. Impact: reduces orphan count from 179 to ~140; specifically recovers project files lost to the wiki.]

Concrete targets:
- `projects/dashboard-rebuild/INDEX.md` should be referenced from `MEMORY.md` history and from `PROJECTS.md`. Its 4 EXPLORE-* children should be referenced from the dashboard-rebuild INDEX.
- `projects/family-thread-dossier/INDEX.md` should be referenced from `PROJECTS.md`. Its 7+ children should be linked from its INDEX.
- `business/hours-log/{system-design,2025-06-to-2026-05-estimate}.md` should be referenced from `BUSINESS.md` (the §469 hours-log description).
- `business/rental-policy.md`, `business/secrets-migration-log.md` — link from `BUSINESS.md`.
- `procedures/vastai-host-onboarding.md` — link from `vastai-management` skill and from `MACHINES.md`.
- `machines/{rocinante,rtxpro6000server}/{CRONS,BMC,MISSION-v0.1}.md` — link from each machine's `INDEX.md`. Patch the two missing INDEX.md files (rocinante doesn't have one).

**R5. Fix `wiki.py`'s typed-wikilink resolution bug.** [Effort: 10 min in `wiki.py`. Impact: removes 11 false-positive broken links from `wiki.py --broken`.]

Before resolving link targets, strip `rel:` prefix if the rel is in the allowed vocabulary. This is a 5-line patch in `_extract_wikilinks` or wherever the resolver runs. Decline to add typed-wikilink semantics into the wiki layer beyond strip-and-resolve — keep the typed-link extractor (`extract_graph.py`) as the only thing that *interprets* relations; `wiki.py` should treat them as plain wikilinks for resolution purposes.

**R6. Tighten the orphan-detection rule.** [Effort: 15 min. Impact: orphan count drops from 179 to a meaningful ~40, and the alert signal becomes actionable.]

Currently `wiki.py` says "1 orphan" (over-filtered) and my custom script says "179 orphans" (under-filtered). The honest answer depends on whether each of these classes counts as orphan-eligible:

- **Auto-injected files** (everything in `feedback/`): SKIP. They're discoverable via auto-injection, not via wikilink.
- **Sub-agent definition files** (`*/.claude/agents/*.md`, `*/.claude/CLAUDE.md`): SKIP. Loaded by the agent harness, not browsed.
- **`_history/` snapshot files**: SKIP. Snapshots by design.
- **Template files** (`machines/_TEMPLATE/*`): SKIP. Templates by design.
- **Daily logs and inbox**: already excluded from wiki scope.
- **Root entity INDEXes** (`INDEX.md`, `MEMORY.md`): SKIP. Top of the tree.
- **Everything else**: count as candidate orphan.

Implement in `wiki.py`'s `is_orphan_candidate()` (or wherever the orphans index is built).

### Tier 3 — defer 30 days, revisit then

**R7. Do NOT enforce typed wikilinks yet.** [Effort: -. Impact: avoids forcing a convention nobody is actually using.]

The typed-wikilink convention is currently inert. Enforcement requires (a) a consumer of `data/graph.jsonl` other than its own existence, (b) a critical mass of authors who understand the relation vocabulary, (c) a workflow that surfaces typed-link failures in normal authoring. None of those exist today. Specifically:

- **No consumer.** Nothing reads `data/graph.jsonl` except the inspector who just wrote this audit. The wiki-reader agent doesn't use it. The dashboard doesn't use it. No skill or cron consumes it.
- **No author adoption.** 18 days of opportunity, 0 new typed edges from anyone but the v0.3 seeder. The 3 false-positive edges from `ARCHIVIST-NOTES.md` are documentation examples, not real adoption.
- **No surfacing mechanism.** When a writer fails to type a wikilink, nothing notices.

A pre-commit hook to enforce typed wikilinks would feel like punishment with no reward attached. Defer the question. Revisit after R1-R6 land and after one of these emerges:

- A concrete consumer that wants graph queries (e.g., a "who depends on X" dashboard widget, or a curator pass that uses `archived_from` to age-out files).
- An author other than the seeder writes typed links unprompted.
- A specific failure mode that typed wikilinks would have caught.

If at the 30-day check none of those have happened, **deprecate the typed-wikilink convention** — remove `extract_graph.py`, drop the v0.3 spec section from MEMORY-CONVENTIONS, and let the plain wikilink layer be the link layer. That's a legitimate outcome; ports from gstack don't have to stick.

**R8. Auto-flag orphans during nightly reindex.** [Effort: 10 min addition to the `wiki-reindex` task. Impact: orphans get into the dashboard / curator queue without manual scanning.]

Once R1 + R6 land, the nightly reindex's "Curator actions needed" section will have meaningful orphan + broken-link entries. Pipe those into `data/inbox-stream/wiki-health-{date}.jsonl` (consistent with the planned activity-stream pattern in the master uplift plan). MERIDIAN can render them.

**R9. Reconcile the `MACHINES` / `machines/MACHINES` basename collision.** [Effort: 5 min. Impact: removes one false hub-target ambiguity.]

There's a top-level `MACHINES.md` (1 file) and a `machines/MACHINES.md` (different file). When a wikilink says `[[MACHINES]]`, the resolver picks the basename match nondeterministically. Decide which is canonical (probably `machines/MACHINES.md`), redirect the other with an `aliases:` shim, eventually delete. Same pattern probably applies to the other 32 basename collisions, but `MACHINES` is the highest-traffic.

### Tier 4 — long-term, not for this uplift

**R10. Consider whether `wiki.py` should be rewritten.** The current 46 KB file does parse, index, similarity, decay, provenance, callouts, frontmatter, and CLI in one monolith. The `extract_graph.py` is 4.5 KB and does exactly one thing well. If R5 (typed-link bug fix) drags into needing to also fix decay-aware orphan detection plus tag normalization plus similarity caching, consider whether the natural cut is `wiki.py` → `wiki_index.py` (parse + index) + `wiki_query.py` (CLI) + the existing `extract_graph.py`. Not urgent, not part of this audit's scope, but flag for the synthesis stage.

## Appendix A: scripts written for this audit

- `audits/_metrics.py` — read-only metrics computation. Two scopes (`--wiki-scope` flag). 200 lines. Outputs to stdout.
- `audits/_metrics-out.txt` — broad-scope output captured.
- `audits/_metrics-wiki-scope.txt` — wiki-core-scope output captured.

These can stay (or be deleted after the synthesis stage) — they're not committed-to-git artifacts.

## Appendix B: data points the audit did NOT collect

- Per-tag frequency distribution. `wiki.py --tags` returns it; not in this audit's scope.
- Similarity edges (would need embeddings; SQLite at `.index/memory.db` may or may not exist; deferred).
- Cross-roof references (memory → `experiments/`, memory → `.claude/skills/`). Several broken links are these; they're intentional but the resolver can't validate them.
- Wikilink density per file (links per 1000 chars). Useful for "is this file appropriately linked"; not computed.
- Time-decay of link freshness (newer files link more / less than older files). Not computed.

## Appendix C: numbers cross-reference

| Metric | My broad scope | My wiki-core scope | wiki.py --health | indexes/_index.md (28d stale) |
|---|---|---|---|---|
| Files in scope | 756 | 353 | 357 | 55 |
| Plain wikilinks | 1444 | 1338 | 698 | 271 |
| Orphans | 579 | 179 | 99 | 1 |
| Broken | 53 | 57 | 42 | 0 |
| Tags | n/a | n/a | 336 | 32 |

The `wiki.py --health` numbers are smaller than mine because (a) wiki.py applies the `_strip_code_blocks` filter more aggressively, (b) the orphan detector is more permissive (excludes some categories my script didn't), (c) the broken count excludes typed-wikilink false positives less consistently. Both my numbers and wiki.py's are honest within their scope choices; the disk indexes are simply 28 days out of date and should not be used as ground truth.
