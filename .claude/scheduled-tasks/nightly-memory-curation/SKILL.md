---
name: scheduled-nightly-memory-curation
description: Daily 11 PM memory-curator agent run to consolidate and update user memory
model: sonnet
---

This is a scheduled task that runs every night at 11 PM.

Run the memory-curator agent to keep the agent's memory of Alton and his world current and accurate.

Steps:
1. Invoke the memory-curator agent.
2. The curator reviews: today's reports generated, tasks completed or modified, any new information surfaced during the day's operations.
3. Update USER.md in the agent memory system with any changes to Alton's context, preferences, or priorities observed today.
4. Update MEMORY.md index if any new memory files were created or modified.
5. Prune stale entries: flag any memory file entries that appear outdated or contradicted by today's data.
6. Log the curation run to data/memory-curation-log.md with: date, files updated, entries added/removed, notable changes.

Keep curation conservative — only update what clearly changed. Don't overwrite stable facts with daily fluctuations.
