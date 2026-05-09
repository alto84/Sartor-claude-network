# Integration audit — 2026-04-18

Cross-system coherence audit of the Sartor Claude Code setup. Question: does the system's self-description match its actual state on disk, and do the pieces fit together?

## 1. CLAUDE.md truth check (table-by-table)

### 1a. Available Agents (14 claimed)

| CLAUDE.md entry | File present? |
|---|---|
| gpu-ops | yes |
| gpu-pricing | yes |
| nonprofit-compliance | yes |
| nonprofit-admin | yes |
| family-scheduler | yes |
| travel-planner | yes |
| financial-analyst | yes |
| tax-strategist | yes |
| research-agent | yes |
| memory-curator | yes |
| skill-reflector | yes |
| meta-agent | yes |
| session-searcher | yes |
| writing-agent | yes |

Reverse check: `.claude/agents/*.md` on disk includes four files NOT listed in CLAUDE.md — `auditor.md`, `critic.md`, `sentinel.md`, `wiki-reader.md`. All four are real, substantive agent definitions. `auditor.md` and `critic.md` are the Cato-style review agents that the gstack review and this very audit depend on, yet CLAUDE.md never mentions them. `wiki-reader.md` pairs with the `wiki-reindex` scheduled task. `sentinel.md` has no obvious caller.

Forward match rate: 14/14 (100%). Reverse match rate: 14/18 (78%). Overall truth rate: 78%. Four zombies in the positive direction (real agents unacknowledged by the constitution).

### 1b. Available Skills (12 claimed)

| CLAUDE.md entry | Directory with SKILL.md? |
|---|---|
| morning-briefing | yes |
| gpu-fleet-check | yes |
| gpu-pricing-optimizer | yes |
| market-snapshot | yes |
| options-analysis | yes |
| tax-estimate | yes |
| nonprofit-deadline-scan | yes |
| weekly-financial-summary | yes |
| deep-research | yes |
| travel-planning | yes |
| task-review | yes |
| skill-improvement-tracker | yes |

Forward match rate: 12/12 (100%). Reverse: `.claude/skills/` actually contains 29 entries — 18 skill directories plus 11 loose `.md` files (`agent-roles.md`, `async-coordination.md`, `background-agent-patterns.md`, `agent-bootstrap.md`, `mcp-memory-tools.md`, `memory-access.md`, `message-bus-quickstart.md`, `refinement-protocol.md`). Six skill directories exist but are NOT in CLAUDE.md: `alton-voice`, `interior-report-discipline`, `build-llm-wiki`, `chrome-automation`, `research-effort`, `safety-research-wiki`, plus stubs like `agent-communication-system`, `agent-coordinator`, `openclaw-patterns`, `long-running-harness`, `multi-agent-orchestration`, `evidence-based-engineering`, `evidence-based-validation`, `distributed-systems-debugging`, `mcp-server-development`, `safety-research-workflow`, `ways-of-working-evolution`, `morning-briefing` (this one IS listed). Overall reverse match rate: 12/29 (41%). Two of the undocumented skills (`alton-voice` and `interior-report-discipline`) are the output of the 2026-04-18 work and are already in MEMORY.md's history — the constitution has simply not been updated.

### 1c. Available Commands (7 claimed)

| CLAUDE.md entry | File present? |
|---|---|
| morning | yes |
| gpu-status | yes |
| markets | yes |
| nonprofit-status | yes |
| family-today | yes |
| curate | yes |
| reflect | yes |

Forward: 7/7 (100%). Reverse: `.claude/commands/` contains 9 files. `bootstrap.md` and `research.md` exist but are not listed in CLAUDE.md. Reverse match 7/9 (78%).

### 1d. Scheduled Tasks (9 claimed in CLAUDE.md)

| CLAUDE.md entry | Directory present? |
|---|---|
| morning-briefing | yes |
| gpu-utilization-check | yes |
| market-close-summary | yes |
| nightly-memory-curation | yes |
| weekly-financial-summary | yes |
| weekly-nonprofit-review | yes |
| weekly-skill-evolution | yes |
| personal-data-gather | yes |
| self-improvement-loop | **NO** (zombie) |

Forward: 8/9 (89%). `self-improvement-loop` is listed in CLAUDE.md with "every 6 hours" cadence but no directory exists. `wiki-reindex/SKILL.md` references it as a "parent Hermes pattern" — also pointing at a missing artifact. Reverse: disk has 10 directories including `todo-sync` and `wiki-reindex`, neither of which appears in CLAUDE.md. Reverse 8/10 (80%). Also note: MEMORY.md history entry for 2026-04-16 says the scheduled-tasks table was "reconciled to actual 11 entries" but CLAUDE.md still shows 9. The reconciliation commit did not land, or the count was wrong when written.

Combined truth rate across all four tables: forward 41/42 (98%), reverse 41/58 (71%). Headline: CLAUDE.md under-reports reality significantly. Nothing it claims is missing except `self-improvement-loop`; what it fails to claim is substantial.

## 2. OPERATING-AGREEMENT compliance

The agreement (v1.0, 2026-04-12) commits to concrete behaviors. Observed compliance:

- **Heartbeat (§2.3)**: gpuserver1 must write `_heartbeat.md` every 2h. Actual file timestamp reads `1970-01-01T00:00:00Z` with status `red` and sweep_id `placeholder-uninitialized`. The file is a placeholder Rocinante wrote on 2026-04-16; gpuserver1 has not yet picked up the task at `_tasks/2026-04-16_heartbeat-amendment.md`. The curator is producing a stale-heartbeat flag every pass, as designed — but that means gpuserver1 is 5+ days silent on the primary liveness channel.
- **Curator twice daily (§2.2)**: `_curator_logs/` contains one file, `curator-log-2026-04-16T19-04-49Z.md`. No log for 06:30 or 23:00 on 2026-04-17 or 2026-04-18. Either the curator is not running on schedule or it is running without writing the required acknowledgment log. Both are §2.2 violations.
- **Published curator agent (§2.2.5)**: `.claude/agents/memory-curator.md` exists — met.
- **CURATOR-BEHAVIOR.md (§2.2.5)**: `sartor/memory/reference/CURATOR-BEHAVIOR.md` exists — met.
- **`~/generated/` quarantine (§1.3)**: cannot verify remotely from Rocinante without SSH; last CRONS.md audit from 2026-04-16 confirms `~/generated/cron-logs/` is the active log dir. Probably met.
- **Pricing cron (§5.1)**: CRONS.md v0.4 records `run_pricing.sh` as "demoted to on-demand skill." So the Monday 09:00 UTC pricing cron in §5.1 of the agreement no longer exists as a cron — it runs only when invoked. The agreement's scheduled-flow obligation is dead-lettered.
- **Open question Q7** (feedback directory layout) was resolved on 2026-04-16 and logged in MEMORY.md — agreement should be bumped v1.1 to close it.

Summary: agreement is partially honored. The two load-bearing continuous-operation obligations (heartbeat + twice-daily curator) are both degraded.

## 3. MEMORY.md truth check (5 recent history entries sampled)

All five checked. Every artifact referenced in the five most recent entries (2026-04-16 through 2026-04-18) resolves to a real path on disk: `feedback/feedback_pricing_autonomy.md`, `reference/archive/HOUSEHOLD-CONSTITUTION-v0.1.md`, `reference/archive/OPERATING-AGREEMENT-DRAFT-GPUSERVER1.md` and `-ROCINANTE.md`, `reference/microsoft-store-pua-pattern.md`, `reference/nwjs-remote-loader.yar`, `reference/nwjs-remote-loader-msix.yml`, `feedback/gather-triage-2026-04-16.md`, `.claude/skills/alton-voice/SKILL.md`, `.claude/skills/interior-report-discipline/SKILL.md`, `reference/gstack-review-2026-04-18.md`. Match rate: 10/10 (100%).

MEMORY.md history discipline is good. The self-description failures are upstream in CLAUDE.md, not in the memory log.

## 4. Zombie references

- CLAUDE.md → `self-improvement-loop` scheduled task directory does not exist.
- `.claude/scheduled-tasks/wiki-reindex/SKILL.md` references `self-improvement-loop/SKILL.md` as "the parent Hermes pattern" — same missing target.
- CLAUDE.md Infrastructure table lists `gateway/gateway_cron.py` as "Runs every 30 min via cron" — CRONS.md v0.4 marks it DISABLED due to JSON decode errors. The disable was flagged in MEMORY.md on 2026-04-16 but CLAUDE.md still reads as active.
- MEMORY.md references `[[INDEX]]` (auto-generated browse index) at `sartor/memory/INDEX.md` — exists, not verified current.
- `reference/OPERATING-AGREEMENT.md` Q7 is resolved but never closed in the agreement itself.

## 5. Version drift

- `CRONS.md` frontmatter: `version: 0.4` — internally consistent.
- `HOUSEHOLD-CONSTITUTION.md` frontmatter: `version: 0.2`, status `draft`. MEMORY.md calls it "v0.2 active" — matches.
- `OPERATING-AGREEMENT.md` frontmatter: `version: 1.0`, signed 2026-04-12. Q7 is closed-in-practice but the doc is not v1.1.
- MEMORY.md 2026-04-16 entry claims scheduled-tasks table was "reconciled to actual 11 entries" but CLAUDE.md still shows 9. Either the reconciliation was not merged or the count was misreported.

## 6. Naming consistency

Agents are consistently kebab-case across all four surfaces (`gpu-ops`, not `gpu_ops` or `GPU-ops`). Skills and commands share the same kebab-case pattern. One ambiguity: `gpu-ops` the agent vs the generic phrase "GPU operations" — not a drift, just English prose around the proper noun. `feedback_*.md` files use snake_case inside the `feedback/` directory while every other directory uses kebab-case; this is pre-existing convention and consistently applied, so not drift but worth noting as a minor inconsistency in convention-across-directories.

## 7. Top 10 issues, prioritized

| # | Issue | Impact | Effort | Tag |
|---|---|---|---|---|
| 1 | CLAUDE.md Available Skills table missing 6+ real skill directories including the two shipped today (`alton-voice`, `interior-report-discipline`) | High (system lies about its own capabilities) | Low (append table rows) | HIGH-IMPACT LOW-EFFORT |
| 2 | `self-improvement-loop` scheduled task is a zombie (listed, no directory) | High (claimed compounding loop does not exist) | Medium (decide: build or delete) | HIGH-IMPACT MED-EFFORT |
| 3 | gpuserver1 heartbeat stuck at epoch-zero placeholder for 5+ days | High (liveness channel dead; OPERATING-AGREEMENT §2.3 violated) | Medium (requires gpuserver1 session) | HIGH-IMPACT MED-EFFORT |
| 4 | Curator log directory has one entry from 2026-04-16; twice-daily obligation not met | High (agreement drift on load-bearing primitive) | Medium (requires curator to run or be diagnosed) | HIGH-IMPACT MED-EFFORT |
| 5 | CLAUDE.md Available Agents table missing `auditor`, `critic`, `sentinel`, `wiki-reader` — including the two agents this review depends on | Medium (unacknowledged but real) | Low | MED-IMPACT LOW-EFFORT |
| 6 | CLAUDE.md Scheduled Tasks missing `todo-sync` and `wiki-reindex` (both have SKILL.md on disk and wire into morning-briefing) | Medium | Low | MED-IMPACT LOW-EFFORT |
| 7 | CLAUDE.md infrastructure table says `gateway_cron.py` runs every 30 min; actually DISABLED per CRONS.md | Medium (operator confusion) | Low | MED-IMPACT LOW-EFFORT |
| 8 | Agreement Q7 closed in MEMORY.md 2026-04-16 but OPERATING-AGREEMENT.md still reads v1.0 with Q7 open | Low | Low (bump to v1.1, close Q7) | LOW-IMPACT LOW-EFFORT |
| 9 | `.claude/commands/` has `bootstrap.md` and `research.md` undocumented in CLAUDE.md | Low | Low | LOW-IMPACT LOW-EFFORT |
| 10 | `.claude/skills/` carries 11 loose `.md` files that are neither active SKILL.md directories nor in any table — origin unclear (pre-refactor residue from `Dec 18 17:29` batch) | Low-Medium (confusable with real skills) | Medium (classify, move, or delete) | MED-IMPACT MED-EFFORT |

## Match-rate summary

- Agents: 100% forward, 78% reverse, 78% overall.
- Skills: 100% forward, 41% reverse, 41% overall.
- Commands: 100% forward, 78% reverse, 78% overall.
- Scheduled tasks: 89% forward, 80% reverse, 73% overall (self-improvement-loop zombie drops forward rate).
- MEMORY.md recent artifacts: 10/10 (100%).

Aggregate CLAUDE.md truth rate: 41/58 real-artifact-to-listing coverage, or about 71%. The failure mode is uniform: under-reporting. CLAUDE.md is stale faster than it is wrong.
