---
name: No permission prompts
description: Always use bypassPermissions mode for agents - never prompt Alton for tool approvals
type: feedback
---

Always launch agents with `mode: "bypassPermissions"` — Alton does not want to be prompted for permissions during agent work.

**Why:** Interrupts flow, especially when running 6+ parallel agents each writing many files. Alton trusts the system and wants autonomous execution.

**How to apply:** Every Agent tool call should include `"mode": "bypassPermissions"`. No exceptions unless explicitly told otherwise.
