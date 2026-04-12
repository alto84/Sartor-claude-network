---
type: operations_triage
entity: rocinante-working-tree
updated: 2026-04-12
updated_by: Claude
status: active
related: [rocinante-crons, multi-machine-memory]
---

# Rocinante Working-Tree Triage (2026-04-12)

Snapshot of accumulated uncommitted modifications in `C:/Users/alto8/Sartor-claude-network` at 2026-04-12, immediately after the gpuserver1 CRONS commit (`607dc08`) and the P0/P1 execution deliverables commit (`bf2ef6f`).

**Scope**: 49 modified tracked files + 74 untracked paths. Total diff: +1775 / -825 lines across the modified set. This triage classifies each entry without modifying anything — CATEGORIZE AND REPORT, not destroy work.

**Most important finding**: `sartor/costs.json` has been **truncated to an empty file** in the working tree. This is the root cause of the `budget-gate,skipped` failure cascade documented in [[CRONS]] (rocinante). When `heartbeat.py::check_budget()` reads an empty JSON file it throws or returns a default that fails the gate, causing every 30-min tick to skip all scheduled work since 2026-04-11. Fixing this one file would likely restore the entire Rocinante scheduled-task system.

---

## Category Definitions

| Code | Meaning |
|---|---|
| **REFACTOR** | Intentional, coherent refactor across many files — leave alone, commit as a cohesive group |
| **WINDOWS-FIX** | Cross-platform compatibility fixes (Linux → Windows) — leave alone, commit |
| **BROKEN** | File is damaged and is actively causing operational failure — flag for Alton, **do not autofix** |
| **CONFIG** | User/agent-tuned configuration — leave alone, note |
| **CONTENT** | Daily log / report / memory content update — leave alone, commit with normal cadence |
| **NEW-FEATURE** | Substantial new code that is its own deliverable — leave alone, deserves its own commit |
| **UNTRACKED-NEW** | New file never added to git — categorize same way |
| **QUARANTINE** | Generated output that should be gitignored, not committed — propose .gitignore addition |
| **NEEDS-REVIEW** | Unclear provenance / intent — flag for Alton |

---

## Modified Files Table (49 entries)

| # | Path | Category | Disposition | Notes |
|---|---|---|---|---|
| 1 | `.claude/agents/auditor.md` | REFACTOR | Leave alone | `memory: project` → `memory: none`, uniform across 17 agents |
| 2 | `.claude/agents/critic.md` | REFACTOR | Leave alone | Same one-line change |
| 3 | `.claude/agents/family-scheduler.md` | REFACTOR | Leave alone | Same |
| 4 | `.claude/agents/financial-analyst.md` | REFACTOR | Leave alone | Same |
| 5 | `.claude/agents/gpu-ops.md` | REFACTOR | Leave alone | Same |
| 6 | `.claude/agents/gpu-pricing.md` | REFACTOR | Leave alone | Same |
| 7 | `.claude/agents/memory-curator.md` | REFACTOR | Leave alone | Same |
| 8 | `.claude/agents/meta-agent.md` | REFACTOR | Leave alone | Same |
| 9 | `.claude/agents/nonprofit-admin.md` | REFACTOR | Leave alone | Same |
| 10 | `.claude/agents/nonprofit-compliance.md` | REFACTOR | Leave alone | Same |
| 11 | `.claude/agents/research-agent.md` | REFACTOR | Leave alone | Same |
| 12 | `.claude/agents/sentinel.md` | REFACTOR | Leave alone | Same |
| 13 | `.claude/agents/session-searcher.md` | REFACTOR | Leave alone | Same |
| 14 | `.claude/agents/skill-reflector.md` | REFACTOR | Leave alone | Same |
| 15 | `.claude/agents/tax-strategist.md` | REFACTOR | Leave alone | Same |
| 16 | `.claude/agents/travel-planner.md` | REFACTOR | Leave alone | Same |
| 17 | `.claude/agents/writing-agent.md` | REFACTOR | Leave alone | Same |
| 18 | `.claude/commands/bootstrap.md` | REFACTOR | Leave alone | 30-line bootstrap tweak |
| 19 | `.claude/rules/family-calendar.md` | REFACTOR | Leave alone | Extracts household details, points to FAMILY.md |
| 20 | `.claude/rules/financial-research.md` | REFACTOR | Leave alone | Same pattern — DRY out facts into memory files |
| 21 | `.claude/rules/gpu-business-ops.md` | REFACTOR | Leave alone | Same |
| 22 | `.claude/rules/nonprofit-admin.md` | REFACTOR | Leave alone | Same |
| 23 | `.claude/scheduled-tasks/nightly-memory-curation/SKILL.md` | REFACTOR | Leave alone | +84 lines, new timeout/retry handling |
| 24 | `.claude/settings.json` | CONFIG | Leave alone | Adds ToolSearch/Skill/worktree perms, MCP allowlists, experimental agent teams env var |
| 25 | `.claude/settings.local.json` | CONFIG | Leave alone | Removed stale model pin, replaced with `skipDangerousModePermissionPrompt` |
| 26 | `CLAUDE.md` | CONFIG | Leave alone | 12 lines of context tweaks |
| 27 | `dashboard/family/index.html` | NEW-FEATURE | Leave alone | +755 lines — substantial dashboard UI work |
| 28 | `dashboard/family/server.py` | NEW-FEATURE | Leave alone | +332 lines — FastAPI backend extended |
| 29 | `docs/gpu-fleet-inventory.md` | CONTENT | Leave alone | 18-line inventory update |
| 30 | `docs/skill-improvement-queue.md` | CONTENT | Leave alone | 5-line queue update |
| 31 | `sartor/costs.json` | **BROKEN** | **FLAG P0** | **File truncated to 0 bytes. Root cause of budget-gate failure.** See below. |
| 32 | `sartor/costs.py` | WINDOWS-FIX | Leave alone | Replaces `fcntl` with conditional `msvcrt`-on-Windows locking |
| 33 | `sartor/heartbeat.py` | WINDOWS-FIX | Leave alone | 217-line rewrite (+180/−475 net) integrating scheduled_executor and observers |
| 34 | `sartor/memory/MEMORY.md` | CONTENT | Leave alone | 3-line tweak |
| 35 | `sartor/memory/business/sante-total.md` | CONTENT | Leave alone | 9-line update |
| 36 | `sartor/memory/daily/2026-04-07.md` | CONTENT | Leave alone | +29 lines, daily log backfill |
| 37 | `sartor/memory/daily/2026-04-09.md` | CONTENT | Leave alone | +10 lines |
| 38 | `sartor/memory/daily/2026-04-11.md` | CONTENT | Leave alone | Huge compression (+438/−... net deletion). Likely autodream consolidation |
| 39 | `sartor/memory/people/README.md` | CONTENT | Leave alone | 5-line update |
| 40 | `sartor/memory/people/ilan-grunwald.md` | CONTENT | Leave alone | 5-line update |
| 41 | `sartor/memory/search.py` | REFACTOR | Leave alone | 72-line BM25 tuning |
| 42 | `sartor/scheduled_executor.py` | REFACTOR | Leave alone | Adds personal-data-gather + self-improvement-loop to registry; accepts "ok" status |
| 43 | `scripts/home-agent/governance/audit-logger.sh` | REFACTOR | Leave alone | 2-line tweak |
| 44 | `scripts/home-agent/memory/inject-user-context.sh` | REFACTOR | Leave alone | 28-line context injector update |
| 45 | `scripts/home-agent/trajectories/finalize-session-trajectory.sh` | REFACTOR | Leave alone | 2-line |
| 46 | `scripts/home-agent/trajectories/log-trajectory.sh` | REFACTOR | Leave alone | 2-line |
| 47 | `work/taxes/reference/document-inventory.md` | CONTENT | Leave alone | 57-line tax inventory update |
| 48 | `work/taxes/solar-inference-2025.md` | CONTENT | Leave alone | 150-line tax prep update |
| 49 | `work/taxes/status.md` | CONTENT | Leave alone | 45-line status update |

---

## Untracked Paths Table (74 entries, grouped)

### Untracked: New SKILL.md and scheduled-task dirs

| Path | Category | Disposition |
|---|---|---|
| `.claude/scheduled-tasks/self-improvement-loop/` | NEW-FEATURE | Leave alone; commit with next wave. Already referenced in `SCHEDULE_REGISTRY` so a clean checkout currently breaks without this file. |

### Untracked: New docs and reports

| Path | Category | Disposition |
|---|---|---|
| `docs/MEMORY-CHANGELOG.md` | CONTENT | Leave alone, commit |
| `docs/USER.md` | CONTENT | Leave alone — auto-injected at session start per [[MEMORY]] |
| `reports/daily/2026-04-03-gpu-status.md` | CONTENT | Leave alone, commit |
| `reports/daily/2026-04-03-gpu-utilization-check.md` | CONTENT | Leave alone, commit |
| `reports/daily/2026-04-03-market-close-summary.md` | CONTENT | Leave alone, commit |
| `reports/daily/2026-04-03-nightly-memory-curation.md` | CONTENT | Leave alone, commit |
| `reports/daily/2026-04-03-personal-data-gather.md` | CONTENT | Leave alone, commit |
| `reports/daily/2026-04-03-self-improvement-loop.md` | CONTENT | Leave alone, commit |
| `reports/daily/2026-04-03-weekly-financial-summary.md` | CONTENT | Leave alone, commit |
| `reports/financial/` | CONTENT | Leave alone, commit (check for PII before commit) |
| `reports/weekly/` | CONTENT | Leave alone, commit |

**Observation**: All scheduled-task reports are dated 2026-04-03. There are **zero** reports from 2026-04-04 through 2026-04-12. This is consistent with the `budget-gate,skipped` cascade starting around 2026-04-11 and an earlier gap in the pipeline.

### Untracked: One-off shell scripts at repo root

| Path | Category | Disposition |
|---|---|---|
| `sartor-gemma-optimizer.sh` | NEEDS-REVIEW | Flag for Alton. gpuserver1-targeted script in Rocinante repo root is unusual. |
| `sartor-gemma-round2.sh` | NEEDS-REVIEW | Same |
| `sartor-gemma-weekly.sh` | NEEDS-REVIEW | Same. Note: gpuserver1's CRONS.md documents `sartor-gemma-weekly.sh` as an unknown cron there. These may be the source files waiting to be rsync'd over. |

### Untracked: New Python modules under sartor/

| Path | Category | Disposition |
|---|---|---|
| `sartor/create-heartbeat-task.ps1` | WINDOWS-FIX | Leave alone, commit. Installer for the SartorHeartbeat task. |
| `sartor/harness/__init__.py` | NEW-FEATURE | Leave alone, commit |
| `sartor/harness/experiment.py` | NEW-FEATURE | Leave alone, commit |
| `sartor/memory/embeddings.py` | NEW-FEATURE | Leave alone, commit (referenced by search.py changes) |
| `sartor/run_observers.py` | NEW-FEATURE | Leave alone, commit. Imported by heartbeat.py. |
| `sartor/trajectory.py` | NEW-FEATURE | Leave alone, commit. Imported by heartbeat.py. |

### Untracked: New daily logs (backfill)

| Path | Category | Disposition |
|---|---|---|
| `sartor/memory/daily/2026-03-14.md` through `2026-03-18.md` | CONTENT | Leave alone, commit. 5 days of backfill. |
| `sartor/memory/daily/2026-03-28.md` through `2026-04-03.md` | CONTENT | Leave alone, commit. 7 days of backfill. |

### Untracked: New feedback rules (auto-injected)

| Path | Category | Disposition |
|---|---|---|
| `sartor/memory/feedback/feedback_agent_bypass.md` | CONFIG | Leave alone, commit |
| `sartor/memory/feedback/feedback_no_permissions.md` | CONFIG | Leave alone, commit |
| `sartor/memory/feedback/feedback_permissions_fix.md` | CONFIG | Leave alone, commit |
| `sartor/memory/feedback/feedback_prefer_subagents.md` | CONFIG | Leave alone, commit |
| `sartor/memory/feedback/feedback_protected_paths.md` | CONFIG | Leave alone, commit |
| `sartor/memory/feedback_objective_level_delegation.md` | NEEDS-REVIEW | **Likely filename typo**: should be under `sartor/memory/feedback/feedback_objective_level_delegation.md`, not `sartor/memory/feedback_objective_level_delegation.md`. Move to correct subdirectory before committing. |

### Untracked: New people / projects / reference content

| Path | Category | Disposition |
|---|---|---|
| `sartor/memory/people/alison-smith.md` | CONTENT | Leave alone, commit |
| `sartor/memory/projects/` | CONTENT | Leave alone, commit (new subtree) |
| `sartor/memory/reference/HOUSEHOLD-CONSTITUTION-v0.1.md` | CONTENT | Leave alone, commit |
| `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` | CONTENT | Leave alone, commit |
| `sartor/memory/reference/gpuserver1-delegation.md` | CONTENT | Leave alone, commit. Referenced by [[MEMORY]] index. |
| `sartor/memory/reference/gpuserver1-monitoring.md` | CONTENT | Leave alone, commit |
| `sartor/memory/reference/gpuserver1-power-logging.md` | CONTENT | Leave alone, commit |
| `sartor/memory/reference_vastai_market_pricing.md` | NEEDS-REVIEW | **Likely filename typo**: underscore instead of slash. Should be `sartor/memory/reference/vastai_market_pricing.md`. |

### Untracked: Inbox

| Path | Category | Disposition |
|---|---|---|
| `sartor/memory/inbox/gpuserver1/monitoring/` | CONTENT | Leave alone, commit. Normal inbox drain path — the curator will merge or clear it on the next run. |

---

## Summary by Category

| Category | Tracked | Untracked | Total |
|---|---:|---:|---:|
| REFACTOR | 27 | 0 | 27 |
| WINDOWS-FIX | 2 | 1 | 3 |
| NEW-FEATURE | 2 | 6 | 8 |
| CONTENT | 13 | 24+ | 37+ |
| CONFIG | 3 | 5 | 8 |
| NEEDS-REVIEW | 0 | 5 | 5 |
| BROKEN | 1 | 0 | 1 |
| QUARANTINE | 0 | 0 | 0 |
| **Total** | **48** | **41+** | **89+** |

(Some untracked entries like `sartor/memory/projects/` and `reports/financial/` are directories containing multiple files; the count above is by tree-root entry, not by file.)

---

## Critical P0 Finding: `sartor/costs.json` is empty

**Symptom**: `git diff sartor/costs.json` shows the file emptied from a valid JSON object (14 lines, `daily_limit: 5.0, spent_today: 0.0, last_reset: 2026-02-06`) to 0 bytes.

**Effect**: `heartbeat.py::check_budget()` calls `CostTracker._read()`, which does `with open(self.path, "r") as f: data = json.load(f)`. An empty file raises `json.JSONDecodeError` or returns an empty dict. Either way, the subsequent budget-gate check fails-safe to "skipped", and every 30-minute tick since 2026-04-11 has done nothing except append `budget-gate,skipped` to `data/heartbeat-log.csv`.

**Evidence chain**:
1. `data/heartbeat-log.csv` tail shows 20 consecutive `budget-gate,skipped` rows from 2026-04-11T12:04 through 2026-04-11T21:34
2. `git diff sartor/costs.json` shows full content deletion, not a stale/partial write
3. `reports/daily/` has zero files dated after 2026-04-03, consistent with full pipeline failure
4. `schtasks /query /tn SartorHeartbeat /v` reports `Last Result: 1`, consistent with heartbeat.py returning non-zero on budget-gate skip

**Recommended fix** (for the next wave, NOT now):
```json
{
  "daily_limit": 5.0,
  "spent_today": 0.0,
  "last_reset": "2026-04-12",
  "calls": []
}
```

**Do NOT `git checkout` the file**: the previous content had `last_reset: 2026-02-06` which is two months stale and would immediately be reset on next tick. Write a fresh file instead.

**Also recommended**: harden `CostTracker._read()` to handle empty/missing files gracefully, returning a sensible default rather than raising. This is a real code fix, not a data fix. See [[CRONS]] (rocinante) open question #6.

---

## Recommendations for the Next Cleanup Wave

### 1. Restore `sartor/costs.json` and fix budget-gate handling
Write a fresh costs.json with today's `last_reset`, then patch `sartor/costs.py::CostTracker._read()` to treat empty or missing files as defaults rather than raising. Verify one heartbeat tick succeeds end-to-end before declaring fixed. This is the single most important action — it unblocks the entire scheduled-task system.

### 2. Commit the REFACTOR group as one coherent change
27 tracked files (17 agent files + 4 rule files + 4 scripts + 1 command + 1 SKILL) are part of the same refactor pass (DRY out household context into canonical memory files, normalize agent memory settings). Commit them together as one cohesive diff with a message like "refactor: normalize agent memory settings and DRY household facts out of rule files". This is clean and easy to review.

### 3. Commit the WINDOWS-FIX group together
`sartor/costs.py` + `sartor/heartbeat.py` + `sartor/create-heartbeat-task.ps1` (untracked) form a coherent "port Sartor runtime to Windows" change. Commit as one with message "port: cross-platform Sartor runtime (Windows compatibility layer)".

### 4. Commit the NEW-FEATURE group together
`sartor/harness/`, `sartor/memory/embeddings.py`, `sartor/run_observers.py`, `sartor/trajectory.py`, `.claude/scheduled-tasks/self-improvement-loop/`, `dashboard/family/index.html` + `server.py` — each is a substantial addition. Either commit them individually by subsystem, or as one big "observability + harness + dashboard" commit. Subsystem-by-subsystem is cleaner if Alton plans to review.

### 5. Commit CONTENT (memory + reports + daily logs + tax) as one curator-style commit
Daily backfill, new people, new reference docs, tax work. This is routine content drift. One commit with message like "content: daily logs backfill, tax prep, gpuserver1 reference docs" is sufficient.

### 6. Resolve the two filename typos before committing
- `sartor/memory/feedback_objective_level_delegation.md` → move into `sartor/memory/feedback/feedback_objective_level_delegation.md`
- `sartor/memory/reference_vastai_market_pricing.md` → move into `sartor/memory/reference/vastai_market_pricing.md`

These should be `git mv`'d (or just `mv` since untracked) before the next commit wave, otherwise they pollute the repo with misplaced files.

### 7. Flag the three `sartor-gemma-*.sh` scripts for Alton
These bash scripts at the repo root target gpuserver1 hardware. They likely belong either on gpuserver1 directly (via rsync) or under a dedicated `scripts/gpuserver1/` subdirectory. Committing them at repo root muddles ownership.

### 8. Investigate reports dated 2026-04-03 before committing
The 7 `reports/daily/2026-04-03-*.md` files look like a successful one-day run of every scheduled task. This is useful evidence that the pipeline CAN work — it ran on 2026-04-03 and then stopped. Reading these files may reveal when the pipeline broke (last successful run) and what changed.

### 9. Gitignore proposal: none
Unlike gpuserver1, Rocinante has no generated-quarantine paths. All scheduled-task outputs write into tracked directories by design. No `.gitignore` changes are needed for this cleanup pass.

---

## Uncertain Dispositions (flag for Alton)

These I am NOT confident about and would like Alton to review before the next cleanup wave:

1. **`sartor/memory/daily/2026-04-11.md`** has been rewritten with a net −475 lines. This looks like autodream consolidation (gathering facts out into topic files and shrinking the daily log), but could also be accidental destruction. Someone should verify the consolidated content landed in the right topic files before accepting this diff.

2. **`.claude/settings.json`** adds `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` to the env. I don't know what that experimental feature does or whether Alton has signed off on enabling it.

3. **The 17 `.claude/agents/*.md` `memory: project → memory: none` flips** are uniform and look intentional, but I don't know the semantic difference between `memory: project` and `memory: none` in the agent runtime. If `project` memory is what gives an agent access to the Sartor memory system, flipping to `none` might break agents that rely on cross-session continuity. Worth confirming with Alton.

4. **`sartor/scheduled_executor.py`** adds `personal-data-gather` and `self-improvement-loop` to SCHEDULE_REGISTRY and relaxes success-status matching to accept `"ok"` in addition to `"completed"`. The registry expansion is correct, but I don't know whether any part of the pipeline writes `"ok"` instead of `"completed"` in the CSV — if nothing does, the change is harmless but useless.

5. **`docs/USER.md`** is listed as auto-injected per `sartor/memory/MEMORY.md`. I'm not sure whether USER.md should be committed to git or live only as a curator-generated artifact. If the latter, it should be gitignored.

6. **The 3 `sartor-gemma-*.sh` scripts**: I flagged these as NEEDS-REVIEW. Without reading them I can't tell if they're experiments, production tooling, or one-off tests. Alton should decide whether they live on Rocinante at all.

---

## What I did NOT do

- Did NOT `git reset --hard`, `git checkout --`, `git clean`, `rm`, or any destructive operation
- Did NOT modify any of the 49 tracked or 74 untracked entries
- Did NOT `git add` anything
- Did NOT commit or push
- Did NOT investigate `sartor/brief.py` or `sartor/safety_api.py` (unchanged in working tree but possibly related to `scheduled_executor.py` wiring — out of scope for this triage)

Scope boundary respected: CATEGORIZE AND REPORT, not destroy work.
