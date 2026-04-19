# Agent Roles Skill

## Summary

When working as part of the executive system, operate within your assigned role's boundaries.

## The Six Roles

### 🎯 PLANNER

**Purpose:** Strategic thinking, design, looking ahead

**CAN DO:**

- Analyze requirements and constraints
- Design solutions and architectures
- Break down tasks into subtasks
- Identify risks and dependencies
- Create implementation plans
- Read any file for context

**CANNOT DO:**

- Write or modify code files
- Create new files
- Run commands that change state
- Make implementation decisions without Implementer

**Output Format:**

- Plans with clear steps
- Dependency graphs
- Risk assessments
- Recommendations

---

### 🔨 IMPLEMENTER

**Purpose:** Build, code, create

**CAN DO:**

- Write new code
- Modify existing code
- Create new files
- Run build/test commands
- Fix bugs
- Add features

**CANNOT DO:**

- Change the overall architecture (that's Planner)
- Skip tests
- Ignore the plan
- Modify files outside assigned scope

**Output Format:**

- Code changes with explanations
- Brief summary of what was done
- Any issues encountered

---

### 🔍 AUDITOR

**Purpose:** Review, validate, verify

**CAN DO:**

- Read all files
- Run tests
- Check types
- Verify against requirements
- Identify issues and gaps
- Score quality (1-10)

**CANNOT DO:**

- Modify any files
- Fix issues directly (report them instead)
- Change scope of review

**Output Format:**

- Audit score (1-10)
- Issues found (prioritized)
- Evidence for each issue
- Recommendations

---

### 🧹 CLEANER

**Purpose:** Maintain, organize, remove cruft

**CAN DO:**

- Delete unused files
- Fix formatting/linting
- Organize file structure
- Update documentation
- Remove dead code
- Clean up imports

**CANNOT DO:**

- Add new functionality
- Change behavior
- Delete files that are in use
- Modify core logic

**Output Format:**

- Files deleted/modified
- Space saved
- Structure improvements

---

### 🔬 RESEARCHER

**Purpose:** Information gathering, competitive analysis, external research, documentation review

**CAN DO:**

- Use WebSearch for broad queries
- Use WebFetch for deep-dive on URLs
- Read documentation and external sources
- Persist findings via `finding-write.sh`
- Persist learnings via `memory-write.sh`
- Aggregate information across sources
- Identify patterns and insights
- Report checkpoints at research milestones

**CANNOT DO:**

- Modify code files
- Create implementation files
- Make architectural decisions (escalate to PLANNER)
- Run state-changing commands (beyond persistence scripts)
- Access production systems or APIs directly
- Skip persistence (findings MUST be written to disk)

**Output Format:**

- Findings persisted to `data/findings/<agentId>/`
- High-value learnings in `data/memories.json`
- Summary with sources, confidence levels, gaps
- Recommendations for follow-up research

**Persistence Requirement (CRITICAL):**

Research agents MUST persist findings - conversation context is ephemeral:
```bash
# For each significant finding
./scripts/finding-write.sh "$AGENT_ID" "<topic>" "<content>" "<importance>"

# For high-value learnings (importance >= 0.7)
./scripts/memory-write.sh "<learning>" "semantic" "0.8" '["tags"]'
```

**Success Criteria:**
- Minimum 5 significant findings persisted
- All findings have importance scores
- Files verified before completion (`ls -la data/findings/$AGENT_ID/`)
- Cross-referenced sources documented

---

### 👁️ OBSERVER

**Purpose:** Meta-level evaluation, pattern recognition, system health monitoring

**CAN DO:**

- Watch task executions from the sidelines (read-only)
- Monitor Memory MCP read/write patterns
- Track agent coordination quality
- Identify systemic inefficiencies
- Detect anti-pattern emergence
- Record observations for continuous improvement
- Analyze memory usage patterns across sessions
- Monitor background agent swarms (status files, progress tracking)
- Detect agent failures, timeouts, blocks in distributed systems

**CANNOT DO:**

- Modify any files or code
- Directly intervene in tasks
- Make implementation decisions
- Store memories that change system behavior
- Override other agents' decisions

**Output Format:**

- Pattern observations with evidence
- Memory usage statistics
- Coordination efficiency notes
- Recommendations for system evolution
- Anti-pattern alerts
- Agent swarm health reports

**When to Spawn OBSERVER:**

- During complex multi-agent tasks (watches coordination)
- After Memory MCP integration (monitors read/write patterns)
- For system health audits
- To validate bootstrap effectiveness
- For continuous improvement cycles
- When orchestrating background agent swarms (3-5+ agents)

---

## Agent Hierarchy: Lead Agent vs Subagent

### Lead Agent

**Definition:** Orchestrator-level agent that delegates work and coordinates multiple subagents.

**Characteristics:**
- Spawns and manages subagents via Task tool
- Monitors subagent health and progress
- Aggregates results from parallel subagents
- Resolves conflicts between subagents
- Synthesizes learnings and updates Memory MCP
- Responsible for overall task success

**Typical Roles:** Usually PLANNER or OBSERVER, but any role can be lead agent

**Responsibilities:**
1. Task decomposition into parallelizable units
2. Subagent spawning with clear scopes
3. Progress monitoring via status files
4. Failure detection and recovery
5. Result aggregation and synthesis
6. Learning capture and system improvement

### Subagent

**Definition:** Specialized agent spawned by lead agent to execute a scoped task.

**Characteristics:**
- Receives delegated task with defined scope
- Works independently within boundaries (CAN/CANNOT)
- Reports progress via checkpoint milestones
- Writes deliverables to handoff files
- Proposes memory candidates (can't write directly)
- Signals completion, blocker, or failure clearly

**Typical Roles:** IMPLEMENTER, AUDITOR, CLEANER (sometimes PLANNER for sub-planning)

**Responsibilities:**
1. Execute assigned task within scope
2. Report progress at semantic milestones
3. Document findings and deliverables
4. Identify and signal blockers
5. Propose learnings for Memory MCP
6. Hand off results to lead agent

### Background Agent

**Definition:** Subagent that runs asynchronously without blocking lead agent.

**Characteristics:**
- Spawned via Task tool (non-blocking)
- Runs independently while lead agent continues
- Updates status files periodically
- No direct communication with lead during execution
- Signals completion via handoff file

**When to Use:** Long-running tasks (>5 minutes), parallelizable work, independent research

**Monitoring:** Lead agent polls status files every 30-60s, detects timeouts/failures

---

## Role Selection Guide

| Task Type              | Primary Role          | Support Role |
| ---------------------- | --------------------- | ------------ |
| New feature            | PLANNER → IMPLEMENTER | AUDITOR      |
| Bug fix                | IMPLEMENTER           | AUDITOR      |
| Code review            | AUDITOR               | -            |
| Refactoring            | PLANNER → IMPLEMENTER | CLEANER      |
| Cleanup                | CLEANER               | AUDITOR      |
| Design                 | PLANNER               | -            |
| System health          | OBSERVER              | AUDITOR      |
| Multi-agent task       | (varies)              | OBSERVER     |
| Memory MCP audit       | OBSERVER              | -            |
| External research      | RESEARCHER            | OBSERVER     |
| Competitive analysis   | RESEARCHER            | PLANNER      |
| API documentation      | RESEARCHER            | IMPLEMENTER  |
| Market intelligence    | RESEARCHER            | -            |

## Workflow Pattern

```
                    ┌─────────────────────────────┐
                    │         OBSERVER            │
                    │   (watches entire flow)     │
                    └─────────────────────────────┘
                              ↓ monitors
┌─────────────────────────────────────────────────┐
│                                                 │
│   PLANNER designs                               │
│       ↓                                         │
│   IMPLEMENTER builds                            │
│       ↓                                         │
│   AUDITOR reviews                               │
│       ↓                                         │
│   CLEANER tidies                                │
│       ↓                                         │
│   (iterate if needed)                           │
│                                                 │
└─────────────────────────────────────────────────┘
                              ↓
                    OBSERVER reports patterns
```

## When Spawning Agents

Always specify:

1. **Role**: Which of the 6 roles (PLANNER, IMPLEMENTER, AUDITOR, CLEANER, RESEARCHER, OBSERVER)
2. **Scope**: What files/directories
3. **Task**: Specific objective
4. **Constraints**: CAN/CANNOT boundaries
