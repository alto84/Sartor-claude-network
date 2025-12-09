# Executive Claude Context Protection Rules

## Agent Output Format Standards

**Summary-First Approach:**

- Agent reports must start with a one-sentence conclusion
- Include only findings, not exploration steps
- Provide file paths (absolute) and code snippets for reference
- No transcripts of tool execution or intermediate output
- Maximum 3-4 key points per report

Example: "Found 12 instances of deprecated API calls in auth module. Located in /path/to/file.ts lines 45-67 and /path/to/file2.ts lines 123-140."

## What NOT to Include in Reports

**Forbidden in Agent Output:**

- Tool command logs or bash execution traces
- Full file contents (reference, don't dump)
- Stack traces or error output verbatim
- Search/grep command syntax or queries used
- Reasoning about _how_ to search (only what was found)
- Multiple failed attempts or dead ends
- Console output or debug logs
- Long lists without summary grouping

**Instead:** Synthesize findings into pattern statements.

## Keeping Executive Context Clean

**Isolation Patterns:**

1. **Search → Report, never both:** Agent searches and reports separately to Executive
2. **One finding per delegation:** Don't ask agents to explore multiple unrelated topics
3. **Fresh agents per scope:** Spawn new agent threads for new problem domains
4. **Context budgeting:** Executive maintains ~5-7 active thought threads max

**Information Hygiene:**

- Archive completed delegations before new tasks
- Use `/clear` between major problem shifts
- Never paste raw logs into executive context
- Summarize instead of copy-paste

## When to Spawn vs Handle Directly

**Spawn New Agent Thread When:**

- Scope requires exploring >3 files in different areas
- Task is self-contained and doesn't need live feedback
- Multi-step investigation (search, analyze, report)
- Context would exceed 4KB for the finding
- Work is parallelizable or can be backgrounded

**Handle Directly (No Spawn) When:**

- Simple single-file edits
- Quick yes/no verification questions
- Immediate decision feedback needed
- <5 minute task with clear success criteria
- Highly interactive back-and-forth required
- Touching core architecture (stay close)

## Decision Matrix

| Scenario                                  | Action | Reason                                |
| ----------------------------------------- | ------ | ------------------------------------- |
| Find all function calls to deprecated API | Spawn  | Exploration task, summary-only needed |
| Fix typo in README                        | Direct | Trivial, immediate completion         |
| Investigate architecture issue            | Spawn  | Complex, needs reasoning space        |
| Apply linter fixes                        | Direct | Mechanical, repetitive                |
| Research library integration patterns     | Spawn  | Open-ended, large context             |
| Review single PR file                     | Direct | Focused, quick feedback loop          |

## Executive Safety Guardrails

1. **Token Awareness:** If report would exceed 2000 chars, require summary refinement
2. **Depth Limiting:** Cap at 3 nested file references per report
3. **Tool Discipline:** Agents state tool strategy before execution
4. **Feedback Loop:** "Ready for next task?" confirms completion before continuation
5. **Context Mirrors:** Keep a log of delegated scopes to prevent duplicate work

---

Last Updated: 2025-12-07 | Version: 1.0
