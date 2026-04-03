Trigger the skill-reflector agent to analyze the most recent complex task for skill extraction.

Invoke the skill-reflector agent. Direct it to:
1. Identify the most recent complex multi-step task completed (check reports/daily/ and reports/weekly/ for the latest outputs).
2. Analyze what the task required: data sources used, tools invoked, decision points, output structure.
3. Evaluate whether an existing skill covered it well, or whether a new or improved skill would make future runs better.
4. If a new skill is warranted: draft a proposed SKILL.md and save to data/skill-proposals/{name}-{date}.md.
5. If an existing skill needs improvement: add a HIGH priority entry to skill-improvement-queue.md with specific changes needed.
6. Report back what was found and what (if anything) was proposed.
