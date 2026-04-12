---
name: nightly-memory-consolidation
description: Nightly memory consolidation — runs autoDream 4-phase cycle, applies decay scoring, prunes stale entries
model: sonnet
---

# CONSOLIDATE — Nightly Memory Maintenance

This is a scheduled task that runs every night at 11 PM. It executes the full memory maintenance pipeline: autoDream consolidation, decay scoring, and index regeneration.

## Step 1: Run autoDream (4-phase consolidation)

Execute the autoDream engine to consolidate daily activity into core memory files:

```bash
cd C:\Users\alto8\Sartor-claude-network
python sartor/memory/autodream.py --force
```

autoDream runs 4 phases:
1. **Orient**: Scan topic files + daily logs, report sizes
2. **Gather**: Extract facts from daily logs, convert relative dates to absolute
3. **Consolidate**: Route facts to topic files via keyword matching, 60% overlap dedup
4. **Prune**: Regenerate INDEX.md, archive logs > 90 days

**Timeout handling**: autodream has a known tendency to exceed 5 minutes on large daily logs.
- If autodream has not returned within 240 seconds, terminate it and log the timeout
- On timeout: mark Step 1 as SKIPPED and proceed to Step 2
- Do NOT retry autodream in the same cycle

If autoDream fails, log the error and continue to Step 2.

## Step 2: Apply Decay Scoring

Run the Mnemex decay engine to update tier assignments:

```bash
python sartor/memory/decay.py --update
```

This recalculates: `score(t) = (n_use)^0.6 * e^(-lambda * delta_t) * importance`

After scoring, check tier distribution:
- If >50% of files are COLD or below, flag as WARNING in the log
- If any core file (ALTON.md, FAMILY.md, BUSINESS.md) is below WARM, force an access to bump it

## Step 3: Update Bounded Memory (Hermes Pattern)

Update the bounded state files that get injected into scheduled task prompts:

- `data/SYSTEM-STATE.md` (max 2200 chars): Write current system health snapshot
  - Last heartbeat time, tasks run today, failures, memory tier distribution
- `data/IMPROVEMENT-QUEUE.md` (max 1375 chars): Top 5 prioritized improvements
  - Pull from evolve-log, observer reports, and skill-improvement-queue

## Step 4: Review Claude Memory (READ-ONLY)

Review the auto-memory system for accuracy but DO NOT write to it directly (writes to `~/.claude/` trigger permission prompts):
- Read `~/.claude/projects/C--Users-alto8/memory/MEMORY.md` and check for stale entries
- If updates are needed, write proposed changes to `data/memory-curation-proposals/{date}.md`
- A human will apply the changes to avoid protected-directory prompts

## Step 5: Log and Report

Write consolidation report to `data/consolidation-log/{date}.md`:
- autoDream results (facts gathered, facts routed, files updated)
- Decay tier distribution before and after
- Bounded memory sizes (chars used vs limit)
- Any warnings or errors
- Append one-line summary to `data/heartbeat-log.csv`

## Constraints

- Never delete memory files — only archive or update
- Conservative updates: don't overwrite stable facts with daily noise
- If daily logs are empty (no activity today), skip Steps 1-2 and just run Step 3-4
- Total runtime budget: 5 minutes max
- Set a 60-second minimum remaining budget check before each step; skip remaining steps if wall-clock elapsed > 4 minutes (leaves 1 minute for bounded memory update and logging)
- Core file cold alerting should only check ALTON.md, FAMILY.md, BUSINESS.md, MACHINES.md (not research files)
