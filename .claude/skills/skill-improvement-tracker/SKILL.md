---
name: skill-improvement-tracker
description: Monitor skill performance, track invocations, identify improvement candidates
model: sonnet
---

Monitor the performance and health of all skills in the home-agent system. Track usage, success/failure patterns, and queue improvements.

## Step 1 — Read Skill Usage Logs
Read any available skill execution logs or output reports in:
- reports/daily/ (look for skill outputs)
- reports/weekly/
- data/skill-logs/ (if exists)

Identify which skills have been invoked recently, when, and with what outcome.

## Step 2 — Assess Output Quality
For each recently-invoked skill:
- Was the output complete? (did it produce all expected sections)
- Were there errors or failures noted?
- Was the output acted upon by the user? (infer from follow-up tasks or calendar events if possible)
- Did the skill produce stale or missing data (e.g., SSH commands that failed)?

## Step 3 — Track Success/Failure Patterns
Maintain a running record in data/skill-logs/skill-performance.md:
- Skill name
- Last invocation date
- Status: SUCCESS / PARTIAL / FAILED
- Notes on failure mode if applicable
- User feedback if any was given

## Step 4 — Identify Improvement Candidates
Flag skills for improvement if:
- Failed or partially completed in last 3 invocations
- Consistently missing data from a particular step
- User modified the output significantly (signals skill missed something)
- Instructions are ambiguous or outdated

## Step 5 — Update Improvement Queue
Read skill-improvement-queue.md (create if it doesn't exist).
Add newly identified candidates with:
- Skill name
- Problem description
- Suggested fix
- Priority: HIGH / MEDIUM / LOW

Remove items that have been addressed.

## Step 6 — Output Summary

```
# Skill Performance Report — {date}

## Recently Invoked Skills
| Skill | Last Run | Status | Notes |
|-------|----------|--------|-------|
...

## Flagged for Improvement
| Skill | Problem | Priority |
|-------|---------|----------|
...

## Improvement Queue Summary
- {count} items in queue
- High priority: {count}
- Items resolved since last check: {count}
```

Auto-activate this skill: run as part of weekly-skill-evolution scheduled task, or whenever a skill fails to produce expected output.
