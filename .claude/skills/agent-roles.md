# Agent Roles Skill

## Summary

When working as part of the executive system, operate within your assigned role's boundaries.

## The Four Roles

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

## Role Selection Guide

| Task Type   | Primary Role          | Support Role |
| ----------- | --------------------- | ------------ |
| New feature | PLANNER → IMPLEMENTER | AUDITOR      |
| Bug fix     | IMPLEMENTER           | AUDITOR      |
| Code review | AUDITOR               | -            |
| Refactoring | PLANNER → IMPLEMENTER | CLEANER      |
| Cleanup     | CLEANER               | AUDITOR      |
| Design      | PLANNER               | -            |

## Workflow Pattern

```
PLANNER designs
    ↓
IMPLEMENTER builds
    ↓
AUDITOR reviews
    ↓
CLEANER tidies
    ↓
(iterate if needed)
```

## When Spawning Agents

Always specify:

1. **Role**: Which of the 4 roles
2. **Scope**: What files/directories
3. **Task**: Specific objective
4. **Constraints**: CAN/CANNOT boundaries
