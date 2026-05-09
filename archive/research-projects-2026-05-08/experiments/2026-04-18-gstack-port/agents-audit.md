# Agents audit — 2026-04-18

Cross-check of every agent definition in `.claude/agents/` against CLAUDE.md's "Available Agents" table, the skills directory, scheduled tasks, and commands. Applies the same prosecution discipline as the morning alton-voice and gstack role-analyst reviews: 80% shared scaffolding with a domain swap is one agent with two labels.

## 1. Inventory

Eighteen agent files live in `.claude/agents/`. CLAUDE.md's table lists fourteen.

| File | Purpose (one line) | Notable dependencies |
|---|---|---|
| `auditor.md` | Nightly deep quality review — broken links, reward hacking, contradictions | reads `data/heartbeat-log.csv`, writes `reports/daily/` |
| `bootstrap.md` (none — it is a command, not an agent) | n/a | n/a |
| `critic.md` | Weekly strategic review — cost/value, laziness detection, proposals | reads heartbeat, writes `reports/weekly/` |
| `family-scheduler.md` | Calendar coordination for 5-person household | Read/Write/Grep only, no Google Calendar MCP declared |
| `financial-analyst.md` | Options Greeks, scenario modeling, portfolio monitoring | WebSearch, WebFetch |
| `gpu-ops.md` | vast.ai fleet monitoring on Machine 52271 | SSH to 192.168.1.100, `vastai` CLI |
| `gpu-pricing.md` | Pricing analysis for RTX 5090 listing | SSH, `vastai search offers` |
| `memory-curator.md` | Nightly dialectic USER.md + MEMORY.md curation | writes `docs/USER.md`, `docs/MEMORY.md`, `docs/MEMORY-CHANGELOG.md` |
| `meta-agent.md` | Generates/modifies agent definition files | Edit tool |
| `nonprofit-admin.md` | Sante Total doc prep, task tracking | writes `docs/nonprofit-pending-items.md` |
| `nonprofit-compliance.md` | IRS/state deadline monitoring, penalty tables | read-only |
| `research-agent.md` | Deep research synthesis across AI/consciousness/compute | WebSearch, WebFetch |
| `sentinel.md` | Fast haiku-tier health check inline with heartbeat | writes `data/observer-log.jsonl` |
| `session-searcher.md` | Haiku-tier transcript lookup | read-only |
| `skill-reflector.md` | Post-task skill extraction | writes `.claude/skills/` |
| `tax-strategist.md` | Multi-entity tax planning support | Read/Write/Grep/Glob |
| `travel-planner.md` | Family-of-5 trip logistics | WebSearch, WebFetch |
| `wiki-reader.md` | Bounded wiki CLI queries via `wiki.py` | Bash to `sartor/memory/wiki.py` |
| `writing-agent.md` | Blog/manuscript drafts in Alton's voice | Read/Write/Grep |

## 2. CLAUDE.md alignment

**Files missing from CLAUDE.md's table (four):** `auditor`, `critic`, `sentinel`, `wiki-reader`. All four are active — `auditor` and `critic` are referenced in `reflect`/`curate` adjacent flows, `sentinel` is invoked by heartbeat, `wiki-reader` is referenced by `build-llm-wiki/SKILL.md` line 486. These are real working agents absent from the constitution.

**Table entries with a file (fourteen):** all fourteen CLAUDE.md rows have a matching file. No orphan table rows.

**Mismatched descriptions:** none of the fourteen descriptions contradict their files. `gpu-ops` table says "health, listing status, rental activity, earnings" — the file covers all four. `memory-curator` table says "prunes stale memory, maintains data hygiene" — file does more (dialectic USER.md synthesis) but the table text is not wrong, just thin.

## 3. Role collapse check

Applying the gstack 80%-overlap test:

- **`auditor` and `critic` share ~65% scaffolding.** Both are observer-role reviewers, both read `data/heartbeat-log.csv`, both write to `reports/`, both detect laziness/reward-hacking patterns. They are separated by cadence (nightly vs weekly) and depth (tactical vs strategic), which is a real distinction. Not a collapse candidate, but the boundary is thinner than the descriptions suggest.
- **`nonprofit-admin` and `nonprofit-compliance` share ~55% scaffolding** (same entity, same docs directory, same CPA contact). The split is clean: `-compliance` is read-only deadlines, `-admin` writes correspondence. Keep separate.
- **`gpu-ops` and `gpu-pricing`** share ~40% (same machine ID, same SSH target, same vast.ai CLI). Clean split: ops monitors, pricing analyzes. Keep separate.
- **`session-searcher` and `wiki-reader`** both answer "what do we know about X" with bounded context. `session-searcher` searches transcripts, `wiki-reader` queries memory via `wiki.py`. These should share a "bounded-context reader" parent pattern, but the data sources differ enough to justify two.
- **`meta-agent` and `skill-reflector`** both generate `.claude/*.md` files from observed patterns. ~50% scaffolding overlap. One targets agents, one targets skills. Defensible but worth watching.

No 80%+ collapse candidates identified.

## 4. Dead references

- `family-scheduler` references Google Calendar coordination as a responsibility but has tools `Read, Write, Grep` only — no MCP tool declared. Either the agent cannot actually hit the calendar (must be called from a parent with MCP access) or the tools list is incomplete.
- CLAUDE.md "Available Skills" table lists `/task-review` and `/skill-improvement-tracker` as skills. Both skill directories exist. No `agent` references either.
- `wiki-reader.md` references `[[LLM-WIKI-ARCHITECTURE]]` at the bottom — verify this wiki file exists. Also uses YAML key `allowed-tools` rather than the standard `tools:` list used by every other agent. Schema drift.
- `auditor` references `scripts/home-agent/security/validate-command.sh` — not verified in this pass.
- CLAUDE.md says 14 agents, 12 skills, 7 commands, 9 scheduled tasks. Actual counts: 18 agents, 27+ skills, 9 commands, 10 scheduled tasks. Documentation is stale.

## 5. Agent-to-agent patterns

Only indirect invocation visible in agent text:
- `nonprofit-admin` → references `nonprofit-compliance` ("IRS and state compliance deadlines are tracked by the nonprofit-compliance agent"). Soft handoff, not a tool call.
- `nonprofit-compliance` → references `nonprofit-admin` ("coordinate with nonprofit-admin" on bank account setup).
- `session-searcher` → "support other agents that need historical context without loading full memory files." Declared-but-untested delegation target.
- Commands `curate` and `reflect` explicitly invoke `memory-curator` and `skill-reflector`. These are the only hard invocations.
- `sentinel`, `auditor`, `critic` are triggered by schedule, not by other agents.

No explicit agent-to-agent Task-tool invocations anywhere in the agent files.

## 6. Missing capabilities

- **Email drafter.** `nonprofit-admin` drafts correspondence; nothing drafts personal or business email. Gmail MCP is available but no agent owns it.
- **Calendar agent with MCP access.** `family-scheduler` has no calendar tools. The `/family-today` command hits Google Calendar directly from the orchestrator, bypassing any agent.
- **Personal-data-gather owner.** The scheduled task exists; no agent owns it. It runs as a bare SKILL.
- **Household finance.** `tax-strategist` covers entities; nothing covers personal cash flow, credit card autopay audits, or the Chase/Wohelo/childcare open items from today's ALTON.md triage.
- **Security triage.** After the PrivacyBrowse MSIX incident today, there is no agent for "suspicious file showed up, run YARA/Sigma against known patterns." This is now a recurring pattern.

## 7. Prioritized action list

1. Update CLAUDE.md "Available Agents" table to 18 rows. Add `auditor`, `critic`, `sentinel`, `wiki-reader`. This is the single highest-leverage fix.
2. Normalize `wiki-reader.md` frontmatter: rename `allowed-tools` to `tools`, add `permissionMode`, `maxTurns`, `memory` fields. Schema drift will bite the meta-agent next time it parses the library.
3. Add Google Calendar MCP tools to `family-scheduler.md`, or explicitly document that the agent is read-only and the orchestrator owns the MCP call. Current state is ambiguous.
4. Apply the completeness-principle (proposed in today's gstack review) to agent descriptions: state what the agent cannot do, not only what it does. `gpu-ops` does this well with the "When gpuserver1 is Unreachable" tree; none of the other 17 do.
5. Adopt the `{{PREAMBLE}}` template pattern from the gstack review for agents, not just skills. All 18 agents repeat the "update your agent memory" trailing line verbatim, and most repeat `permissionMode: bypassPermissions / maxTurns / memory: none`.
6. Define the agent-to-agent invocation protocol explicitly. Right now `session-searcher` claims to "support other agents" with no declared interface. Either give it a callable contract or remove the claim.
7. Create the missing security-triage agent scoped to today's MSIX-pattern detection (YARA/Sigma already live at `sartor/memory/reference/`).
8. Verify or retire the scheduled `weekly-skill-evolution` task. The gstack review flagged it as unverified; it is the compounding loop for `skill-reflector` and `critic`. If it does not fire, three agents go silent.
