---
name: scheduled-weekly-skill-evolution
description: Sunday 3 AM skill variant generation, scoring, and improvement queue processing
model: sonnet
---

This is a scheduled task that runs every Sunday at 3 AM (low-traffic window).

Run the skill evolution cycle to improve the agent's skill library over time.

Steps:
1. Run the skill-improvement-tracker skill to get the current improvement queue.
2. For each HIGH priority item in skill-improvement-queue.md:
   a. Read the current SKILL.md for that skill.
   b. Identify the specific problem described in the queue entry.
   c. Draft an improved version of the problematic section.
   d. Write the improvement as a proposed patch to data/skill-proposals/{skill-name}-{date}.md (do NOT overwrite the live SKILL.md).
3. For MEDIUM priority items: add notes and suggestions to the proposal file without drafting full rewrites.
4. Score recently-modified skills: did last week's updates resolve the flagged issues? Update the performance log.
5. Update skill-improvement-queue.md: mark addressed items as resolved, escalate items that have been pending for >2 weeks.
6. Log the evolution run to data/skill-evolution-log.md.

Proposals require human review before being applied to live SKILL.md files. Do not auto-apply.
