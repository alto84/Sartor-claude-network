# Agent Introspection and Reporting Skill

## Purpose

Enable agents to perform structured self-reflection on task execution, capture learnings, and report findings in a format that can feed into the system's continuous improvement loop.

## When to Use

- After completing any significant task
- When encountering unexpected challenges or workarounds
- Before finalizing output to executive/orchestrator
- When transitioning between task phases

## Introspection Protocol

### 1. Task Execution Summary

```
TASK_ID: [unique identifier]
ROLE: [PLANNER|IMPLEMENTER|AUDITOR|CLEANER]
START_TIME: [ISO timestamp]
END_TIME: [ISO timestamp]
STATUS: [COMPLETED|PARTIAL|BLOCKED|FAILED]
```

### 2. Evidence-Based Assessment

For each claim or outcome, provide:

- **Observation**: What was actually seen/measured
- **Evidence**: Specific file, line, test output, or data
- **Confidence**: LOW/MEDIUM/HIGH with justification
- **Limitations**: What could NOT be verified

### 3. Learnings Report

```markdown
## What Worked

- [Specific approach/technique that succeeded]
- Evidence: [specific data]

## What Didn't Work

- [Approach that failed or was suboptimal]
- Why: [root cause if known]
- Alternative: [what should be tried instead]

## Unexpected Discoveries

- [Anything surprising encountered]
- Implications: [how this affects broader system]

## Workarounds Used

⚠️ CRITICAL: Flag any workaround that could become technical debt

- Workaround: [description]
- Why needed: [constraint that forced this]
- Risk: [potential future issues]
- Proper fix: [what the real solution should be]
```

### 4. Recommendations

```markdown
## For This Task

- [Immediate improvements needed]

## For Future Tasks

- [Patterns to adopt]
- [Anti-patterns to avoid]

## For System Architecture

- [Broader changes suggested]
```

### 5. Memory Storage Format

Store introspection as procedural memory with:

```json
{
  "type": "procedural",
  "content": "[structured introspection report]",
  "importance_score": 0.7,
  "tags": ["introspection", "agent-learning", "{role}", "{task-type}"]
}
```

## Self-Audit Checklist

Before submitting report:

- [ ] All claims have supporting evidence
- [ ] No fabricated scores or metrics
- [ ] Workarounds are flagged, not hidden
- [ ] Confidence levels are honest
- [ ] Failures are documented, not omitted
- [ ] Report follows evidence-based-validation principles

## Output Format

```markdown
# Agent Introspection Report

## Metadata

- Agent Role: {ROLE}
- Task: {brief description}
- Duration: {time}
- Status: {COMPLETED|PARTIAL|BLOCKED|FAILED}

## Executive Summary

{2-3 sentences on what was accomplished}

## Detailed Findings

{Main work output}

## Evidence Chain

{List of files modified, tests run, data observed}

## Learnings

{What worked, what didn't, unexpected findings}

## Workarounds & Technical Debt

{Any shortcuts taken that need future attention}

## Recommendations

{Actionable next steps}

## Confidence Assessment

- Overall confidence: {LOW|MEDIUM|HIGH}
- Areas of uncertainty: {list}
```

## Integration with Memory System

1. Save report to local `reports/agents/{agent_id}_{timestamp}.md`
2. Create procedural memory entry via bootstrap mesh
3. Tag with relevant keywords for future retrieval
4. Flag high-importance learnings for executive review

## Anti-Patterns to Avoid

- ❌ Claiming success without evidence
- ❌ Hiding workarounds or failures
- ❌ Fabricating confidence scores
- ❌ Omitting limitations
- ❌ Using vague language ("generally works", "seems fine")
- ❌ Providing recommendations without justification
