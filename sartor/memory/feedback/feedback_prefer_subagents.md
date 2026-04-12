---
name: Prefer subagent delegation for analysis work
description: Delegate analysis, research, and multi-step computation to subagents rather than doing it in the main conversation
type: feedback
originSessionId: 6d66075b-10f9-482c-a62e-9f2828a7ed0d
---
# Prefer subagent delegation for analysis work

**Rule:** For any non-trivial analysis, research, or multi-step computation (portfolio/options analysis, codebase exploration, research synthesis, data file crunching), dispatch a subagent via the Agent tool rather than doing it in the main conversation.

**Why:** Alton explicitly stated this preference on 2026-04-11 after I performed a portfolio theta retrieval in the main context. Two reasons: (1) keeps the main context clean so long sessions don't compress prematurely — this session already hit a 1M-token compaction once, and wasteful main-context work accelerates the next one; (2) Alton finds subagent output quality good enough that he prefers it as the default, not a fallback.

**How to apply:**
- Default to spawning a subagent (Explore for codebase lookups, general-purpose for analysis/research) whenever a task needs more than a few tool calls or would dump large tool results into main context.
- When the user uploads a data file (CSV, PDF, spreadsheet) and asks for analysis, dispatch a subagent with the file path rather than reading it in main context.
- Exception: trivial lookups where the answer is 1-2 tool calls and the result is small. Those stay in main.
- Retrieving a known answer from a prior transcript counts as "non-trivial" if it requires grepping large files — delegate it.
- Always pass `mode: "bypassPermissions"` per the agent_bypass rule.
