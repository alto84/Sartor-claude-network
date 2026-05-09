# Skills audit — 2026-04-18

Auditor: Claude (Opus 4.7 1M). Carry-overs: interior-report-discipline, completeness-principle, no audition rhetoric. Target library at `.claude/skills/`; cross-check against `CLAUDE.md` Available Skills table.

## 1. Inventory

Thirty skill directories exist under `.claude/skills/`. Eight loose top-level `.md` files (`agent-bootstrap.md`, `agent-roles.md`, `async-coordination.md`, `background-agent-patterns.md`, `mcp-memory-tools.md`, `memory-access.md`, `message-bus-quickstart.md`, `refinement-protocol.md`) also live there — stranded skill-like documents outside any directory.

Directory-based skills, size of primary file, presence in CLAUDE.md's Available Skills table:

| Skill | SKILL.md bytes | In CLAUDE.md table |
|---|---|---|
| agent-communication-system | 41,503 | no |
| agent-coordinator | 2,671 | no |
| agent-introspection | 3,702 | no |
| alton-voice | 16,061 | no |
| build-llm-wiki | 24,790 | no |
| chrome-automation | 3,871 | no |
| deep-research | 2,394 | yes |
| distributed-systems-debugging | 25,571 | no |
| evidence-based-engineering | 26,925 | no |
| evidence-based-validation | 24,499 | no |
| gpu-fleet-check | 3,172 | yes |
| gpu-pricing-optimizer | 2,348 | yes |
| interior-report-discipline | 6,006 | no |
| long-running-harness | 3,699 | no |
| market-snapshot | 1,375 | yes |
| mcp-server-development | 32,599 | no |
| morning-briefing | 3,149 | yes |
| multi-agent-orchestration | 31,293 | no |
| nonprofit-deadline-scan | 3,652 | yes |
| openclaw-patterns | 2,811 | no |
| options-analysis | 1,900 | yes |
| research-effort | 9,703 | no |
| safety-research-wiki | 21,344 | no |
| safety-research-workflow | 41,577 | no |
| skill-improvement-tracker | 2,266 | yes |
| task-review | 1,734 | yes |
| tax-estimate | 3,725 | yes |
| travel-planning | 2,344 | yes |
| ways-of-working-evolution | 7,247 | no |
| weekly-financial-summary | 1,939 | yes |

Mismatches: Twelve skills are in the CLAUDE.md table; eighteen directory-based skills plus eight loose files are not. The two newest load-bearing additions — `alton-voice` (2026-04-18) and `interior-report-discipline` (2026-04-18) — are absent from the table despite being invoked this morning. `research-effort` (backing the `/research` command) is also missing. `build-llm-wiki` and `safety-research-wiki` (domain power tools) missing. Reverse direction: the table is clean — no phantom entries.

Commands directory (`.claude/commands/`) contains nine files. Four are in CLAUDE.md's Available Commands table (`morning`, `gpu-status`, `markets`, `nonprofit-status`, `family-today`, `curate`, `reflect`). `bootstrap.md`, `research.md` are present as files but absent from the table.

## 2. Duplication map

Heavy duplication is concentrated in three clusters.

**Multi-agent scaffold cluster** (approx 60-70% overlap): `multi-agent-orchestration/SKILL.md`, `agent-communication-system/SKILL.md`, `agent-coordinator/SKILL.md`, `distributed-systems-debugging/SKILL.md`, plus loose files `async-coordination.md`, `background-agent-patterns.md`, `message-bus-quickstart.md`. All six cover agent spawning, message routing, status tracking, coordination protocols. Total footprint ~100KB. Concrete overlap example: all four of the above open with a near-identical "When to use" block (coordinating 5+ agents, debugging coordination, analyzing multi-agent systems), then each covers consensus, communication, state sync, and conflict detection in different vocabulary. `agent-coordinator` and `agent-communication-system` both enumerate the same AGENT_ID/ROLE/TASK/STATUS table; `agent-communication-system` and `messaging-bus-quickstart` both describe direct messaging, broadcast, pub/sub, request/response, priority queuing with the same headings. Cross-agent CLAUDE.md boilerplate ("Memory MCP Integration", anti-fabrication protocols, confidence calibration) reappears in ~70% of skills.

**Evidence discipline cluster**: `evidence-based-engineering` (26,925B) and `evidence-based-validation` (24,499B). Both enforce "NEVER fabricate scores," both ban the same list ("85/100 quality score", "99% delivery rate", "Exceptional performance", "A+ code quality"), both require the measured/estimated/unknown distinction, both prescribe Memory MCP integration. These are near-identical skills with different framings (engineering-facing vs validation-facing). One belongs.

**Research cluster**: `research-effort`, `deep-research`, `safety-research-workflow`, `safety-research-wiki`, `build-llm-wiki`. All five prescribe variations on question formulation, multi-source search, evidence evaluation, synthesis, and memory entries. `safety-research-workflow` alone is 41,577B — larger than any single-purpose skill should need. `deep-research` (2,394B) is a lean version of the same methodology `research-effort` (9,703B) builds out with quality metrics. `safety-research-wiki` and `build-llm-wiki` are genuinely distinct (domain wiki vs generic wiki builder) but share template/page-type scaffolding.

House-voice blocks (no-em-dash, no-sycophancy, "don't announce this skill", "lead with the answer") are copy-pasted into `interior-report-discipline`, `alton-voice`, `morning-briefing`, `research-effort`, `tax-estimate`, and the `.claude/rules/communication-style.md` file. This is exactly the preamble-duplication the gstack-review called out as the port candidate.

## 3. Staleness scan

Only three skills carry `updated:` frontmatter: `build-llm-wiki`, `safety-research-wiki` (both 2026-04-09), and `alton-voice` (inferred from filesystem mtime 2026-04-18; frontmatter lacks an `updated:` field). The remaining 27 have no staleness marker — the field is optional in Sartor convention but absent here across the board.

Filesystem mtimes: twenty-nine files under skills dirs carry a 2025-12-18 mtime (initial drop). Skills never re-edited since: `agent-communication-system`, `agent-coordinator`, `agent-introspection`, `distributed-systems-debugging`, `evidence-based-engineering`, `evidence-based-validation`, `long-running-harness`, `mcp-server-development`, `multi-agent-orchestration`, `safety-research-workflow`, `ways-of-working-evolution`, and all eight loose top-level files. At 120 days since last touch, every one of these is >60 days stale.

Dead references surfaced:
- `agent-bootstrap.md` instructs "Read `.claude/AGENT_INIT.md`" — file does not exist.
- `ways-of-working-evolution` references `SPAWNING_TEMPLATE.md` and `ORCHESTRATOR_BOOTSTRAP.md` — neither exists at repo root.
- `openclaw-patterns` imports `from gateway import Gateway` inside a skill file — the skill's own `gateway.py` is present, but the usage example implies a module on path, not a co-located file. `CLAUDE.md` marks `gateway_cron.py` as DISABLED, making the openclaw-patterns gateway example aspirational.
- Loose files `async-coordination.md` and `background-agent-patterns.md` reference `data/agent-status/` as a live coordination directory; no evidence that directory is used by any current scheduled task or agent.
- `evidence-based-validation/SKILL.md` has the banned-pattern emoji markers render as `�?O` in the README (charset corruption in `evidence-based-engineering/README.md`).

## 4. Prestige-structure prosecution

**Prestige — `safety-research-workflow` (41,577 bytes).** This is the clearest over-elaboration. It presents "four foundational principles" (Evidence-Based Only, Systematic Methodology, Multi-Agent Coordination, Quality Assurance, Transparency — five, actually, not four, which the skill asserts is four), then "core principles", then "memory MCP integration patterns", then six reference subfiles (research-methodology, multi-agent-research, citation-management, quality-assurance, skill-integration) totaling another ~100KB, then two Python scripts, then a template, then a `VALIDATION.md`. The actual behavior delivered: plan a literature search, track citations, apply anti-fabrication. `research-effort` delivers the same behavior in 9,703 bytes with a sharper role taxonomy (PI, Scout, Methodologist, Devil's Advocate, Implementer, Documentarian) and explicit scope tiers (quick/standard/deep). `safety-research-workflow`'s extra 32KB is scaffolding theater.

**Prestige — `multi-agent-orchestration` + `agent-communication-system`.** 31KB and 41KB of SKILL.md each, with six and five reference subfiles. They describe Raft vs BFT consensus, CRDTs, vector clocks, hierarchical consensus, gossip protocols — for a household agent system that currently spawns at most 7 parallel subagents via the Task tool on a local machine. The consensus-mechanism taxonomy is not load-bearing for any work Sartor actually does. This is the alton-voice four-register pathology in a different domain.

**Prestige — `evidence-based-engineering` + `evidence-based-validation`.** Two ~25KB skills that say the same thing in different voices. The actual rule fits on one page: "don't make up numbers; distinguish measured / estimated / unknown." Compare to `interior-report-discipline` (6KB) which makes a similar discipline point and earns its length with a decision rule, load-bearing examples, and a named failure mode.

**Load-bearing — `alton-voice`.** Honestly earns its 16KB. Four registers with distinct signatures, concrete phrase lists, corpus-backed examples, anti-patterns named. The gstack-review prosecuted this skill's four-register framing as two-modes-in-costume this morning, but the skill itself is dense with actual voice DNA, not scaffolding — the prosecution was about taxonomy inflation, not content padding. Load-bearing.

**Load-bearing — `interior-report-discipline`.** 6KB, single decision rule (functional/phenomenal distinction = content? keep hedge : delete), load-bearing examples (before/after pairs), named failure modes (over-correction, new tic, performing the discipline, saturation), explicit NOT-for list. No scaffolding theater. Load-bearing.

**Load-bearing — `gpu-fleet-check`, `morning-briefing`, `nonprofit-deadline-scan`, `tax-estimate`, `weekly-financial-summary`.** These are the five domain-execution skills. Each is 2-4KB, hits the domain cleanly, produces a specific artifact at a specific path. `nonprofit-deadline-scan` even includes the actual penalty-calculation math ($255/partner/month for Form 1065) and the escalation tier logic. `gpu-fleet-check` includes the SSH-failure decision tree that distinguishes ping-down from sshd-down. `tax-estimate` carries the entities, the specific dollar figures ($438K solar roof, 30% ITC), and NJ-federal conformance flag. These are the skills that do real work.

**Load-bearing — `research-effort` and `deep-research`.** `research-effort` is the better of the two; `deep-research` should be retired in favor of `research-effort`'s sharper methodology.

**Load-bearing — `chrome-automation`.** Tight, practical. Two approaches (CDP vs extension bridge), command reference table, architecture notes. No padding.

## 5. Missing

Concrete gaps where a household agent should have a skill and does not:

- **`dashboard-report`** — generate status pages for the MERIDIAN dashboard (noted at `dashboard/family/server.py:5055` in CLAUDE.md). Currently dashboard consumes raw memory files; no skill produces dashboard-formatted output.
- **`family-calendar-draft`** — draft calendar events for Aneeta/kids review before insertion. CLAUDE.md constraint "Never schedule anything for Aneeta without Alton's confirmation" implies a draft-and-confirm pattern, but no skill implements it.
- **`school-calendar-watch`** — CLAUDE.md specifies "Track MKA academic calendar for Vayu and Vishala" but no skill fetches or watches the MKA calendar. Morning-briefing reads `family/active-todos.md` for deadlines; MKA isn't there systematically.
- **`emergency-playbook`** — no skill for when the GPU server SSH is down, when vast.ai listing expires unexpectedly, when a tax deadline is blown. `gpu-fleet-check` has a decision tree for SSH failure but no recovery runbook.
- **`memory-curator-audit`** — CLAUDE.md lists a `memory-curator` agent and a nightly curation scheduled task, but no skill audits curator output (prunes, merges, staleness handling). Compounding loop needs this.
- **`preamble-render`** — the infrastructure-side skill to build `.tmpl` → `SKILL.md` per the gstack-port proposal. This is the skill that would close the preamble duplication finding.

## 6. Prioritized action list

1. **[high, medium] Retire `evidence-based-engineering` and keep `evidence-based-validation`.** They're near-identical. Pick one, redirect references, delete the other. Saves 26KB and a cognitive-load tax on anyone choosing between them.
2. **[high, large] Collapse the multi-agent cluster.** Keep one primary skill (`multi-agent-orchestration` trimmed to the consensus-patterns-Sartor-actually-uses), fold `agent-coordinator` and `agent-introspection` in as subsections, retire `agent-communication-system` (41KB single file is not earning its keep), move the three loose `.md` files (`async-coordination`, `background-agent-patterns`, `message-bus-quickstart`) into the trimmed skill or delete. Net reduction: ~130KB.
3. **[high, small] Reconcile CLAUDE.md Available Skills table.** Add `alton-voice`, `interior-report-discipline`, `research-effort`, `build-llm-wiki`, `safety-research-wiki`, `chrome-automation`. Remove the stranded loose files or give them a directory. Add `bootstrap` and `research` to Available Commands.
4. **[high, medium] Build the preamble renderer (gstack-port proposal 2).** `.claude/skills/_preamble.tmpl` + render pipeline. Convert the house-voice block and anti-fabrication stanza to a single source. This is the infrastructure change that prevents recurrence of the duplication caught in this audit.
5. **[medium, small] Add `updated:` frontmatter to every SKILL.md.** Sartor convention requires it; 27 of 30 skills lack it. Start with the twelve in the CLAUDE.md table since they're actively invoked.
6. **[medium, medium] Retire or heavily trim `safety-research-workflow`.** `research-effort` supersedes it. Keep the two Python scripts (`research-quality-check.py`, `validate-bibliography.py`) if they work; fold useful content into `research-effort` or `safety-research-wiki`.
7. **[medium, small] Delete dead references.** Fix `agent-bootstrap.md` pointing to non-existent `AGENT_INIT.md`. Fix `ways-of-working-evolution` references to `SPAWNING_TEMPLATE.md` and `ORCHESTRATOR_BOOTSTRAP.md`. Clean up charset corruption in `evidence-based-engineering/README.md`.
8. **[medium, medium] Write `completeness-principle` as a skill or keep it as feedback.** Already exists at `sartor/memory/feedback/completeness-principle.md` per gstack-review follow-up. If feedback covers it, no new skill needed; if the audit found recurrence, promote to skill.
9. **[low, medium] Add `school-calendar-watch` and `family-calendar-draft`.** Close the CLAUDE.md constraint gap for MKA calendar tracking and Aneeta-confirmation pattern.
10. **[low, small] Document the eight loose top-level skill files' fate.** Either convert to directory skills with SKILL.md, or archive. Holding both forms invites drift.

## Successes worth naming

The domain-execution skills (`morning-briefing`, `gpu-fleet-check`, `gpu-pricing-optimizer`, `nonprofit-deadline-scan`, `tax-estimate`, `weekly-financial-summary`, `travel-planning`, `options-analysis`, `market-snapshot`, `task-review`, `skill-improvement-tracker`) are collectively the best part of the library. Each is small, domain-specific, hits a real artifact path, carries the actual numbers/commands/thresholds needed. `alton-voice` and `interior-report-discipline` are load-bearing meta-skills with evident craft. `chrome-automation` is tight and practical. `research-effort` is a sharp methodology skill that makes the three research-adjacent bloat-skills look worse by comparison.

The library's problems are concentrated in the multi-agent-coordination cluster and the evidence-discipline doublet — not in the skills that actually execute household work.
