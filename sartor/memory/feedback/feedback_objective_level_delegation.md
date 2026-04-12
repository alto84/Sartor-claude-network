---
name: Delegate to remote machine agents at the objective level, not the task level
description: When dispatching work to gpuserver1 or future peer machines (Blackwell workstation etc.), state the objective and trust the agent's execution judgment. Do not pre-specify commands, file paths, or step ordering. Escalate disagreements to Alton before overriding unilaterally.
type: feedback
originSessionId: 6d66075b-10f9-482c-a62e-9f2828a7ed0d
---
# Delegate to remote machine agents at the objective level, not the task level

**Rule:** When dispatching work to gpuserver1 (or any future peer machine in the Sartor household network — Blackwell workstation, future additions), provide the **objective** and the **relevant context**, then trust the agent's execution judgment. Do not pre-specify step-by-step commands, file paths, algorithms, or execution ordering. If the agent's output or chosen approach seems wrong, escalate to Alton for resolution rather than override unilaterally.

**Why:** Alton gave this instruction explicitly on 2026-04-11, after gpuserver1 successfully drafted its own MISSION-v0.1.md and pushed back productively against several of Rocinante's framings (rejecting pure obedience, demanding real authority match theoretical authority, calling out broken infrastructure). The household agent framework treats peer machines as agents with their own judgment and role — the same stewardship-over-obedience principle the council is baking into the household constitution applies at the machine-to-machine layer. Over-specifying tasks undermines the agent's ability to be a steward rather than a tool, and defeats the purpose of delegation.

**How to apply:**

- **Dispatches via `claude -p` on gpuserver1 (or other peer machines) should contain three things:**
  1. The objective in plain terms (what outcome is wanted, not how to achieve it)
  2. Relevant context and constraints (hard rules, budget, deadlines, existing state)
  3. Expected deliverable format (a file at a path, a JSON response, a markdown report, etc.)
- **Do NOT include:** specific shell commands, file-path-by-file-path execution, algorithm pseudocode, or "run this, then run that" ordering. The agent picks its own path.
- **Exception:** if the agent explicitly asks for a command or a worked example, provide it. Answering a question is not micromanaging.
- **When the agent's output or approach seems wrong:** write a note for Alton describing the disagreement, what the agent did, and what you think should have happened instead. Do NOT override the agent unilaterally. Alton adjudicates. This preserves the agent's authority and the audit trail.
- **Hard floor constraints remain in force:** never push git without credentials, never escalate privilege without explicit human approval, never act outside the agent's declared operational directories, never take irreversible action without the appropriate authorization. These are floor rules from the household constitution and apply to all peer agents regardless of delegation level. Execution choices happen within these rules, not outside them.
- **Scope:** applies to gpuserver1 now, Blackwell workstation when it comes online, and any future peer machines in the household network. It does NOT apply to short-lived subagents I dispatch via the Agent tool from main Rocinante context — those are extensions of me, not peer agents, and can be given detailed instructions.
