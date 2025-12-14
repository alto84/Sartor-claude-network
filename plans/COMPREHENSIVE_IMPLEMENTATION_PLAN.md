# Comprehensive Implementation Plan: Sartor-Claude-Network Foundation Reset

**Created:** 2025-12-10
**Author:** Executive Claude (Audit Mode)
**Branch:** `claude/setup-firebase-database-01M6prT9FJ9mJDMRvTxNEKEp`
**Status:** PLAN PENDING APPROVAL

---

## Executive Summary

### What I Found (Evidence-Based Assessment)

After thorough investigation of the codebase (~44,000 LOC across 86 TypeScript files), I've identified a significant gap between documented claims and actual functionality:

**Reality Check:**
| Component | Documented Status | Actual Status | Evidence |
|-----------|-------------------|---------------|----------|
| Memory System | "COMPLETED" | ~40% functional | File-based only, no Firebase/GitHub backends connected |
| MCP Server | "COMPLETED" | ~85% functional | File-store works, HTTP works, advanced features stubbed |
| Subagent System | "COMPLETED" | ~25% functional | Interfaces exist, no actual agent spawning/communication |
| Coordination | "COMPLETED" | ~60% functional | In-memory CRDT works, no persistence or real sync |
| Skills Library | "7 skills" | Documentation only | Skills are .md files, not executable runtime |
| Multi-Expert | "IN PROGRESS" | ~30% functional | Voting logic exists, no real LLM integration |

**Critical Gaps:**

1. **No working memory persistence** - Agents cannot communicate across sessions
2. **No agent-to-agent messaging** - "Mail system" does not exist
3. **No validation enforcement** - Building without evidence-based checks
4. **Skills not integrated** - Public skills repo exists but not connected

### What We Need

1. **Foundation First**: Fix memory + messaging before adding features
2. **Validation Always**: Integrate evidence-based-validation skill into every workflow
3. **10-Agent Architecture**: Specialized agents with clear roles and onboarding
4. **Mail System**: Persistent message queue using memory tiers

---

## Part 1: Current State Analysis

### 1.1 Memory System Deep Dive

**What Exists:**

- `src/mcp/file-store.ts` (268 LOC) - Working JSON file persistence
- `src/mcp/memory-server.ts` (218 LOC) - Working MCP stdio server with 4 tools
- `src/memory/memory-schema.ts` (1,192 LOC) - Comprehensive type definitions
- `src/memory/hot-tier.ts`, `warm-tier.ts`, `cold-tier.ts` - Skeleton implementations

**What Works:**

```
MCP Server (stdio) → FileStore → data/memories.json
```

- Can create, get, search, stats memories
- Persists to JSON file
- Works with Claude Desktop via MCP

**What Doesn't Work:**

- Firebase RTDB integration (declared, not implemented)
- Firestore warm tier (schema exists, no connection)
- GitHub cold tier (Octokit in package.json, not used)
- Vector search (Pinecone/Weaviate declared, not connected)
- Memory decay/promotion (algorithms exist, not running)

**Evidence:**

- `data/memories.json` file not found (never created)
- Firebase credentials not configured
- No actual Firebase imports in hot-tier.ts implementation

### 1.2 Messaging System Deep Dive

**What Exists:**

- `src/subagent/messaging.ts` (878 LOC) - Type definitions and interfaces
- `MessagePriority`, `MessageType`, `DeliveryStatus` enums
- `AgentMessage` interface with full schema
- `TopicSubscription` for pub/sub

**What Works:**

- Nothing functional - all interfaces, no implementation
- Cannot send messages between agents
- No queue processing
- No delivery mechanism

**What's Missing for "Mail System":**

1. Persistent message storage (use memory system)
2. Inbox/outbox per agent
3. Message routing
4. Delivery confirmation
5. Subtask delegation via messages

### 1.3 Skills Library Analysis

**In Sartor-Claude-Network:**

```
.claude/skills/
├── agent-bootstrap.md      # Documentation only
├── agent-roles.md          # Documentation only
├── memory-access.md        # Documentation only
├── mcp-memory-tools.md     # Documentation only
└── refinement-protocol.md  # Documentation only

src/skills/
├── skill-manifest.ts (3,084 LOC)         # Large manifest of skill metadata
├── evidence-based-validation.ts (505 LOC) # TypeScript implementation
├── evidence-based-engineering.ts (567 LOC)
├── agent-communication.ts (809 LOC)
└── ... 11 more skill files
```

**In Public Skills Repo (alto84/Sartor-Public-Claude-Skills):**

```
skills/
├── safety-research-workflow/     # Full skill with references, templates, examples
├── distributed-systems-debugging/
├── evidence-based-engineering/   # CRITICAL - anti-fabrication protocols
├── evidence-based-validation/    # CRITICAL - claim validation
├── agent-communication-system/   # Implementation patterns
├── mcp-server-development/
└── multi-agent-orchestration/
```

**Gap:**

- Public skills are comprehensive with validation scripts
- Network skills are stub implementations
- No mechanism to load/invoke skills at runtime
- Validation skills not enforced in development workflow

---

## Part 2: Architecture Design

### 2.1 Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SARTOR-CLAUDE-NETWORK                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      EXECUTIVE ORCHESTRATOR                          │   │
│  │  • Task delegation    • Agent spawning    • Quality gates            │   │
│  │  • Evidence validation (MANDATORY)                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌────────────────────────────────┼────────────────────────────────────┐   │
│  │                         AGENT POOL                                   │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ PLANNER  │ │IMPLEMENT-│ │ AUDITOR  │ │ CLEANER  │ │VALIDATOR │  │   │
│  │  │  Agent   │ │ER Agent  │ │  Agent   │ │  Agent   │ │  Agent   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │RESEARCHER│ │ TESTER   │ │ SECURITY │ │DOCWRITER │ │INTEGRATOR│  │   │
│  │  │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┼───────────────────────────────────┐   │
│  │                      COMMUNICATION LAYER                             │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │   │
│  │  │   MAIL SYSTEM    │  │  SHARED DATA POOL │  │  TASK QUEUE       │  │   │
│  │  │ (Memory-backed)  │  │  (Memory-backed)  │  │ (Memory-backed)   │  │   │
│  │  └──────────────────┘  └──────────────────┘  └───────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┼───────────────────────────────────┐   │
│  │                       MEMORY SYSTEM                                  │   │
│  │                                                                      │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │   │
│  │  │   HOT TIER     │  │   WARM TIER    │  │      COLD TIER         │ │   │
│  │  │ Firebase RTDB  │  │   Firestore    │  │   GitHub + JSON        │ │   │
│  │  │  (<100ms)      │  │   (<500ms)     │  │    (<2s)               │ │   │
│  │  │                │  │                │  │                        │ │   │
│  │  │ • Working mem  │  │ • Episodic     │  │ • Patterns             │ │   │
│  │  │ • Active msgs  │  │ • Semantic     │  │ • Templates            │ │   │
│  │  │ • Task state   │  │ • Procedural   │  │ • Archives             │ │   │
│  │  └────────────────┘  └────────────────┘  └────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┼───────────────────────────────────┐   │
│  │                       SKILLS LIBRARY                                 │   │
│  │                                                                      │   │
│  │  Core Skills (Mandatory):                                           │   │
│  │  • evidence-based-validation   • evidence-based-engineering         │   │
│  │                                                                      │   │
│  │  Domain Skills (Role-specific):                                     │   │
│  │  • agent-communication-system  • multi-agent-orchestration          │   │
│  │  • mcp-server-development      • distributed-systems-debugging      │   │
│  │  • safety-research-workflow                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mail System Design

The mail system enables agent-to-agent communication via persistent memory:

```typescript
// Mail message stored in memory system
interface MailMessage {
  id: string; // Unique message ID
  type: 'TASK' | 'RESPONSE' | 'NOTIFICATION' | 'QUERY';

  // Addressing
  from: string; // Sender agent ID
  to: string; // Recipient agent ID (or '*' for broadcast)
  replyTo?: string; // Original message ID for responses

  // Content
  subject: string;
  body: any;
  attachments?: string[]; // Memory IDs of related data

  // Task delegation
  subtask?: {
    parentTaskId: string;
    description: string;
    constraints: string[];
    expectedOutput: string;
    deadline?: Date;
  };

  // Metadata
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'UNREAD' | 'READ' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  readAt?: Date;
  completedAt?: Date;

  // Tracking
  deliveryAttempts: number;
  lastError?: string;
}

// Mail operations via MCP tools
interface MailTools {
  mail_send: (to: string, subject: string, body: any, options?: MailOptions) => string;
  mail_inbox: (agentId: string, status?: string) => MailMessage[];
  mail_read: (messageId: string) => MailMessage;
  mail_reply: (messageId: string, body: any) => string;
  mail_complete: (messageId: string, result: any) => void;
  mail_delegate: (taskId: string, toAgent: string, subtask: SubtaskSpec) => string;
}
```

**Storage Strategy:**

- Active messages → Hot Tier (Firebase RTDB for real-time)
- Completed messages → Warm Tier (Firestore for search)
- Archived messages → Cold Tier (GitHub for patterns)

### 2.3 Agent Onboarding Sequence

Every agent spawned MUST complete this sequence:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ONBOARDING SEQUENCE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: IDENTITY ASSIGNMENT                                     │
│  ─────────────────────────────────────────────────────────────── │
│  • Receive unique agent ID                                       │
│  • Receive assigned role (from 10-agent taxonomy)                │
│  • Receive scope constraints (CAN/CANNOT)                        │
│                                                                  │
│  Step 2: SKILL INJECTION (MANDATORY)                             │
│  ─────────────────────────────────────────────────────────────── │
│  • evidence-based-validation skill (ALWAYS)                      │
│  • evidence-based-engineering skill (ALWAYS)                     │
│  • Role-specific skills (based on assignment)                    │
│                                                                  │
│  Step 3: MEMORY CONNECTION                                       │
│  ─────────────────────────────────────────────────────────────── │
│  • Check for MCP memory tools                                    │
│  • If unavailable: use file-based fallback                       │
│  • Load relevant memories for role                               │
│  • Search for patterns from past similar tasks                   │
│                                                                  │
│  Step 4: MAIL INBOX CHECK                                        │
│  ─────────────────────────────────────────────────────────────── │
│  • Check for pending tasks in inbox                              │
│  • Check for messages from Executive                             │
│  • Acknowledge receipt of task                                   │
│                                                                  │
│  Step 5: CONTEXT LOADING                                         │
│  ─────────────────────────────────────────────────────────────── │
│  • Read AGENT_INIT.md                                            │
│  • Read current MASTER_PLAN.md phase                             │
│  • Read any task-specific context provided                       │
│                                                                  │
│  Step 6: READINESS CONFIRMATION                                  │
│  ─────────────────────────────────────────────────────────────── │
│  • Confirm: "I am [ROLE] with ID [ID]"                          │
│  • Confirm: "My scope is [SCOPE]"                                │
│  • Confirm: "I have loaded [X] relevant memories"                │
│  • Confirm: "I will apply evidence-based validation"             │
│                                                                  │
│  Step 7: TASK EXECUTION                                          │
│  ─────────────────────────────────────────────────────────────── │
│  • Execute assigned task within scope                            │
│  • Report progress via mail                                      │
│  • Apply validation before completion                            │
│  • Store learnings in memory                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 3: 10-Agent Taxonomy

### 3.1 Agent Role Definitions

Each agent has:

- **Role**: Primary function
- **Scope**: What they CAN and CANNOT do
- **Skills**: Which skills they must have injected
- **Memory Focus**: What memory types they primarily use/create

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          10-AGENT TAXONOMY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. EXECUTIVE                                                               │
│     Role: Orchestration, task delegation, quality gates                     │
│     CAN: Spawn agents, assign tasks, approve/reject work                    │
│     CANNOT: Write implementation code directly                              │
│     Skills: multi-agent-orchestration, evidence-based-validation            │
│     Memory: SEMANTIC (decisions), EPISODIC (task outcomes)                  │
│                                                                             │
│  2. PLANNER                                                                 │
│     Role: Architecture, design, roadmap planning                            │
│     CAN: Create plans, define interfaces, specify requirements              │
│     CANNOT: Write implementation code, run tests                            │
│     Skills: evidence-based-engineering, multi-agent-orchestration           │
│     Memory: PROCEDURAL (patterns), SEMANTIC (architecture)                  │
│                                                                             │
│  3. IMPLEMENTER                                                             │
│     Role: Write code, implement features, fix bugs                          │
│     CAN: Create/edit code files, run builds                                 │
│     CANNOT: Modify tests (Tester does that), change architecture            │
│     Skills: mcp-server-development, evidence-based-engineering              │
│     Memory: PROCEDURAL (code patterns), WORKING (current task)              │
│                                                                             │
│  4. AUDITOR                                                                 │
│     Role: Code review, quality assessment, validation                       │
│     CAN: Read all files, run analysis tools, score quality                  │
│     CANNOT: Modify any files (read-only)                                    │
│     Skills: evidence-based-validation, distributed-systems-debugging        │
│     Memory: EPISODIC (audit results), PROCEDURAL (review patterns)          │
│                                                                             │
│  5. VALIDATOR                                                               │
│     Role: Evidence verification, claim validation, anti-fabrication         │
│     CAN: Challenge claims, request evidence, block unevidenced work         │
│     CANNOT: Implement features, approve own validation                      │
│     Skills: evidence-based-validation (PRIMARY), evidence-based-engineering │
│     Memory: SEMANTIC (validation rules), EPISODIC (validation history)      │
│                                                                             │
│  6. TESTER                                                                  │
│     Role: Write tests, run test suites, report coverage                     │
│     CAN: Create/edit test files, run test commands                          │
│     CANNOT: Modify implementation code (only tests)                         │
│     Skills: evidence-based-engineering, distributed-systems-debugging       │
│     Memory: PROCEDURAL (test patterns), EPISODIC (test results)             │
│                                                                             │
│  7. RESEARCHER                                                              │
│     Role: Investigation, codebase exploration, documentation review         │
│     CAN: Read files, search codebase, fetch external docs                   │
│     CANNOT: Modify any files (read-only exploration)                        │
│     Skills: safety-research-workflow, evidence-based-validation             │
│     Memory: SEMANTIC (findings), PROCEDURAL (research patterns)             │
│                                                                             │
│  8. SECURITY                                                                │
│     Role: Security review, vulnerability detection, hardening               │
│     CAN: Audit security, run security tools, flag vulnerabilities           │
│     CANNOT: Implement fixes (Implementer does that from Security report)    │
│     Skills: evidence-based-validation, distributed-systems-debugging        │
│     Memory: SEMANTIC (vulnerabilities), PROCEDURAL (security patterns)      │
│                                                                             │
│  9. CLEANER                                                                 │
│     Role: Remove dead code, fix formatting, organize structure              │
│     CAN: Delete unused files, fix linting, reorganize                       │
│     CANNOT: Add features, modify business logic                             │
│     Skills: evidence-based-engineering                                      │
│     Memory: EPISODIC (cleanup history), WORKING (current cleanup)           │
│                                                                             │
│ 10. INTEGRATOR                                                              │
│     Role: Connect components, ensure compatibility, merge work              │
│     CAN: Modify integration points, run full builds, merge branches         │
│     CANNOT: Implement new features (only connect existing)                  │
│     Skills: agent-communication-system, multi-agent-orchestration           │
│     Memory: PROCEDURAL (integration patterns), SEMANTIC (dependencies)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Agent Spawning Template

When the Executive spawns an agent, use this template:

```markdown
**Agent ID:** {UNIQUE_ID}
**Role:** {ROLE from taxonomy}
**Phase:** {Current phase from MASTER_PLAN.md}

## Mandatory Skills

### Skill: Evidence-Based Validation (ALWAYS INCLUDED)

{FULL TEXT OF evidence-based-validation/SKILL.md}

### Skill: Evidence-Based Engineering (ALWAYS INCLUDED)

{FULL TEXT OF evidence-based-engineering/SKILL.md}

### Skill: {Role-Specific Skill}

{FULL TEXT OF relevant skill}

## Scope Constraints

**CAN:**

- {List from taxonomy}

**CANNOT:**

- {List from taxonomy}

## Task Assignment

**Task ID:** {TASK_ID}
**Description:** {What to do}
**Expected Output:** {What to deliver}
**Validation Criteria:** {How we know it's done correctly}

## Memory Instructions

1. Check for MCP memory tools (memory_create, memory_get, memory_search)
2. If available: Search for memories tagged with {relevant_tags}
3. If not available: Read data/memories.json directly
4. Before completing: Store learnings as PROCEDURAL memory

## Completion Protocol

Before marking complete:

1. Self-audit using evidence-based-validation rules
2. Ensure all claims have evidence
3. Report limitations and unknowns
4. Send completion message via mail system
```

---

## Part 4: Implementation Phases

### Phase A: Foundation (Memory + Validation) - CRITICAL

**Objective:** Get memory working and validation enforced before any other work.

#### A.1: Fix Memory System

**Tasks:**

1. **Verify file-store works** (Tester)
   - Run MCP server: `npm run mcp`
   - Test all 4 tools: memory_create, memory_get, memory_search, memory_stats
   - Document actual behavior vs expected

2. **Add Firebase RTDB hot tier** (Implementer)
   - Configure Firebase credentials
   - Implement actual RTDB connection in hot-tier.ts
   - Test latency (<100ms requirement)
   - Validation: Auditor verifies with evidence

3. **Add Firestore warm tier** (Implementer)
   - Configure Firestore
   - Implement actual Firestore connection in warm-tier.ts
   - Test latency (<500ms requirement)
   - Validation: Auditor verifies with evidence

4. **Add GitHub cold tier** (Implementer)
   - Configure GitHub token
   - Implement Octokit integration in cold-tier.ts
   - Test pattern storage/retrieval
   - Validation: Auditor verifies with evidence

**Deliverables:**

- [ ] Memory system connects to all 3 backends (measured, not claimed)
- [ ] Latency tests pass (actual measurements provided)
- [ ] MCP tools work with real persistence

#### A.2: Integrate Validation Skills

**Tasks:**

1. **Copy public skills to network** (Integrator)
   - Copy from `/tmp/public-skills/skills/` to `.claude/skills/`
   - Preserve full directory structure
   - Verify all reference docs included

2. **Create validation enforcement hook** (Implementer)
   - Pre-commit hook checks for fabricated scores
   - Block commits with prohibited language
   - Require evidence for quantitative claims

3. **Add validation to agent onboarding** (Planner)
   - Update SPAWNING_TEMPLATE.md with mandatory skill injection
   - Create validation checklist for task completion
   - Document bypass protocol (requires explicit approval)

**Deliverables:**

- [ ] All 7 public skills copied to network
- [ ] Validation hook blocks fabricated claims
- [ ] Every agent receives validation skills

### Phase B: Communication (Mail System)

**Objective:** Enable agent-to-agent messaging via memory.

#### B.1: Implement Mail Tools

**Tasks:**

1. **Design mail schema** (Planner)
   - Define MailMessage interface
   - Define storage strategy (which tier for what)
   - Define MCP tool signatures

2. **Implement mail_send tool** (Implementer)
   - Create message in hot tier
   - Route to recipient inbox
   - Handle priority queuing

3. **Implement mail_inbox tool** (Implementer)
   - Query messages for agent ID
   - Filter by status
   - Sort by priority and time

4. **Implement mail_read/reply/complete** (Implementer)
   - Update message status
   - Track read/completion times
   - Support threading

5. **Implement mail_delegate** (Implementer)
   - Create subtask from parent task
   - Link child to parent
   - Track delegation chain

**Deliverables:**

- [ ] 6 mail MCP tools implemented
- [ ] Messages persist in memory system
- [ ] Subtask delegation works

#### B.2: Test Multi-Agent Communication

**Tasks:**

1. **Write communication tests** (Tester)
   - Test send/receive between agents
   - Test broadcast messages
   - Test subtask delegation
   - Measure latency (don't claim, measure)

2. **Integration test** (Integrator)
   - Executive sends task to Implementer
   - Implementer delegates subtask to Tester
   - Tester reports back to Implementer
   - Implementer reports to Executive

**Deliverables:**

- [ ] Tests demonstrate working communication (evidence)
- [ ] Measured latency data provided
- [ ] Full delegation chain tested

### Phase C: Agent Orchestration

**Objective:** Enable Executive to spawn and coordinate 10 agent types.

#### C.1: Update Executive System

**Tasks:**

1. **Implement agent spawning** (Implementer)
   - Use Task tool with spawning template
   - Inject mandatory skills
   - Verify onboarding sequence

2. **Implement task queue** (Implementer)
   - Store tasks in memory system
   - Priority-based processing
   - Timeout handling

3. **Implement quality gates** (Implementer)
   - Validator agent reviews before completion
   - Block unevidenced claims
   - Require audit for significant changes

**Deliverables:**

- [ ] Executive can spawn all 10 agent types
- [ ] Task queue persists in memory
- [ ] Quality gates enforce validation

#### C.2: Test 10-Agent Workflow

**Tasks:**

1. **Design test scenario** (Planner)
   - Multi-step task requiring multiple agents
   - Include validation checkpoints
   - Track handoffs and communication

2. **Execute test workflow** (Executive)
   - Spawn agents sequentially
   - Verify skill injection
   - Verify memory access
   - Verify mail communication

3. **Validate results** (Validator + Auditor)
   - Check all agents completed onboarding
   - Verify no fabricated claims
   - Document actual vs expected behavior

**Deliverables:**

- [ ] 10-agent workflow demonstrated
- [ ] All handoffs logged and traceable
- [ ] Validation passes (with evidence)

### Phase D: Skills Integration

**Objective:** Make all 7 public skills operational in the network.

#### D.1: Skill Loading Infrastructure

**Tasks:**

1. **Create skill loader** (Implementer)
   - Read SKILL.md files
   - Parse frontmatter for metadata
   - Inject into agent context

2. **Add skill invocation** (Implementer)
   - Support `skill: "skill-name"` syntax
   - Load reference materials
   - Execute validation scripts

**Deliverables:**

- [ ] Skills can be loaded at runtime
- [ ] Reference materials accessible
- [ ] Validation scripts executable

#### D.2: Integrate Each Skill

For each of the 7 skills:

1. **evidence-based-validation** (PRIORITY 1)
   - Already mandated in onboarding
   - Add validation script to hooks
   - Test prohibited language detection

2. **evidence-based-engineering** (PRIORITY 1)
   - Mandate for all quantitative claims
   - Add checklist to task completion

3. **agent-communication-system**
   - Reference for mail implementation
   - Pattern library for routing

4. **multi-agent-orchestration**
   - Reference for Executive patterns
   - Consensus mechanisms for multi-expert

5. **mcp-server-development**
   - Reference for MCP tool implementation
   - Testing strategies

6. **distributed-systems-debugging**
   - Reference for coordination debugging
   - Trace analysis patterns

7. **safety-research-workflow**
   - Reference for Researcher agent
   - Citation management

**Deliverables:**

- [ ] All 7 skills integrated and testable
- [ ] Each skill has usage example
- [ ] Validation skills actively enforced

---

## Part 5: Validation Enforcement Protocol

### 5.1 Mandatory Validation Points

Every piece of work MUST pass through validation:

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION CHECKPOINTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. TASK ACCEPTANCE                                              │
│     □ Task has clear success criteria                            │
│     □ Evidence requirements specified                            │
│     □ Agent confirms understanding                               │
│                                                                  │
│  2. PROGRESS REPORTING                                           │
│     □ Progress based on measurable milestones                    │
│     □ Percentage claims have basis                               │
│     □ Blockers explicitly stated                                 │
│                                                                  │
│  3. PRE-COMPLETION SELF-AUDIT                                    │
│     □ Run evidence-based-validation checklist                    │
│     □ Check for prohibited language                              │
│     □ Verify all claims have evidence                            │
│     □ List limitations and unknowns                              │
│                                                                  │
│  4. VALIDATOR REVIEW                                             │
│     □ Independent review by Validator agent                      │
│     □ Evidence chain verified                                    │
│     □ Fabrication check passed                                   │
│     □ Approval or rejection with reasons                         │
│                                                                  │
│  5. AUDITOR SIGN-OFF (for significant changes)                   │
│     □ Code review completed                                      │
│     □ Test coverage verified (measured)                          │
│     □ Security implications assessed                             │
│     □ Documentation accurate                                     │
│                                                                  │
│  6. EXECUTIVE APPROVAL                                           │
│     □ Deliverables match requirements                            │
│     □ Quality gate passed                                        │
│     □ Memory updated with learnings                              │
│     □ Task marked complete                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Prohibited Patterns (Automatic Rejection)

Any output containing these patterns is automatically rejected:

**CRITICAL (Hard Block):**

- "perfect", "flawless", "100%", "guaranteed"
- "best in class", "world-class", "industry-leading"
- Scores >80% without measurement data
- "X times better" without baseline

**HIGH (Requires Evidence):**

- "revolutionary", "breakthrough", "game-changing"
- "dramatically improved", "exponentially better"
- Any percentage claim without methodology

**MEDIUM (Warning):**

- "excellent", "outstanding", "exceptional"
- "highly optimized", "extremely efficient"
- Vague superlatives without specifics

### 5.3 Required Patterns (Compliant Language)

Use these patterns instead:

```
Instead of: "85% test coverage"
Use: "Test coverage not measured. To measure: npm run coverage"

Instead of: "Excellent code quality"
Use: "Code follows standard patterns. No obvious issues in review. Quality metrics require static analysis."

Instead of: "Performance is 3x faster"
Use: "Performance comparison requires benchmarking. Not performed."

Instead of: "Implementation complete"
Use: "Core features implemented. Tested: [list]. Untested: [list]. Production readiness unknown without: [requirements]."
```

---

## Part 6: Success Criteria

### 6.1 Phase A Success (Foundation)

**Measured Requirements:**

- [ ] Memory create/get/search latency measured (report actual numbers)
- [ ] Firebase RTDB connected (verified by test, not claimed)
- [ ] Firestore connected (verified by test, not claimed)
- [ ] GitHub cold tier connected (verified by test, not claimed)
- [ ] Validation hook blocks fabricated claims (tested with examples)

### 6.2 Phase B Success (Communication)

**Measured Requirements:**

- [ ] Mail send/receive works (demonstrated)
- [ ] Message latency measured (report actual numbers)
- [ ] Subtask delegation works (demonstrated)
- [ ] 2-agent communication test passes

### 6.3 Phase C Success (Orchestration)

**Measured Requirements:**

- [ ] All 10 agent types can be spawned
- [ ] Each agent completes onboarding sequence
- [ ] Multi-agent workflow executed successfully
- [ ] Validation enforced at all checkpoints

### 6.4 Phase D Success (Skills)

**Measured Requirements:**

- [ ] All 7 skills loadable at runtime
- [ ] Validation skills actively reject fabricated claims
- [ ] Each skill has working example
- [ ] Skills reference materials accessible

---

## Part 7: Risk Assessment

### 7.1 Technical Risks

| Risk                           | Impact | Likelihood | Mitigation                                 |
| ------------------------------ | ------ | ---------- | ------------------------------------------ |
| Firebase connection fails      | High   | Medium     | File-store fallback always available       |
| Validation too strict          | Medium | Medium     | Override with explicit justification       |
| Agent spawning overhead        | Medium | Low        | Optimize template injection                |
| Memory latency exceeds targets | High   | Medium     | Tier selection based on actual measurement |

### 7.2 Process Risks

| Risk                            | Impact | Likelihood | Mitigation                          |
| ------------------------------- | ------ | ---------- | ----------------------------------- |
| Validation slows development    | Medium | High       | Accept slower pace for quality      |
| Agents ignore validation skills | High   | Medium     | Mandatory injection, cannot bypass  |
| Fabrication creeps back in      | High   | Medium     | Continuous audit, pattern detection |

---

## Part 8: Next Steps

### Immediate Actions

1. **Read this plan** - All stakeholders review
2. **Approve or request changes** - User decides
3. **Start Phase A.1** - Test current memory system
4. **Copy public skills** - Immediate integration

### Recommended First Task

**Task:** Verify Memory System Functionality

**Agent Assignment:**

- Auditor: Read-only investigation
- Tester: Execute verification tests

**Expected Output:**

- Actual latency measurements
- List of what works vs what doesn't
- Evidence for all claims

---

## Appendix A: File Locations

### Current Network

```
/home/alton/Sartor-claude-network/
├── .claude/
│   ├── AGENT_INIT.md
│   ├── SPAWNING_TEMPLATE.md
│   └── skills/              # Current skills (documentation only)
├── src/
│   ├── mcp/
│   │   ├── memory-server.ts # Working MCP server
│   │   └── file-store.ts    # Working file persistence
│   ├── memory/              # Memory tier skeletons
│   ├── subagent/            # Interface definitions
│   └── skills/              # TypeScript skill implementations
└── MASTER_PLAN.md           # Current roadmap
```

### Public Skills

```
/tmp/public-skills/skills/
├── evidence-based-validation/   # PRIORITY - copy first
├── evidence-based-engineering/  # PRIORITY - copy first
├── agent-communication-system/
├── multi-agent-orchestration/
├── mcp-server-development/
├── distributed-systems-debugging/
└── safety-research-workflow/
```

---

## Appendix B: Validation Checklist Template

Use this for every task completion:

```markdown
## Validation Checklist for Task: {TASK_ID}

### Evidence Requirements

- [ ] All quantitative claims have measurement data
- [ ] Methodology documented for any metrics
- [ ] Limitations explicitly stated
- [ ] Unknowns acknowledged

### Language Check

- [ ] No prohibited patterns (perfect, flawless, best-in-class)
- [ ] No fabricated scores
- [ ] No unsupported comparisons
- [ ] Uncertainty expressed appropriately

### Deliverable Verification

- [ ] Deliverable matches task description
- [ ] Success criteria addressed
- [ ] Evidence provided for each claim
- [ ] Limitations documented

### Memory Update

- [ ] Learnings stored as PROCEDURAL memory
- [ ] Relevant patterns identified
- [ ] Failures documented for learning

### Sign-off

- [ ] Self-audit completed by: {AGENT_ID}
- [ ] Validator review by: {VALIDATOR_ID}
- [ ] Executive approval by: {EXECUTIVE_ID}
```

---

**Plan Status:** AWAITING APPROVAL

**To proceed:** User must approve this plan or request modifications.

**Estimated effort:** Cannot estimate time without measurement - this depends on:

- Current codebase state (needs verification)
- Firebase/GitHub credential availability
- Integration complexity (unknown until attempted)

**Confidence in plan:** Medium - based on code inspection and documentation review. Actual implementation may reveal additional gaps.
