# Agent Framework Research Synthesis

**Date**: 2025-12-17
**Sources**: Anthropic Engineering, arXiv (26 papers), GitHub (10 frameworks), System Audit

---

## Executive Summary

This document synthesizes research from multiple sources to create a robust, functioning backend memory, skills, research, and validation framework for Sartor-claude-network.

**Critical Finding**: The existing infrastructure is 90% complete but NOT CONNECTED. The bootstrap system, memory summarizer, skills registry, and anti-fabrication injector all exist but are never called during agent initialization.

---

## Key Insights by Source

### 1. Anthropic Engineering (Primary Reference)

**Two-Agent Pattern**:
- **Initializer Agent**: First session only, sets up environment
- **Coding Agent**: Subsequent sessions, incremental progress with structured updates

**Critical Artifacts** (from effective-harnesses article):
| Artifact | Purpose |
|----------|---------|
| `claude-progress.txt` | Activity log of completed work |
| Git commit history | Traceable state changes, recovery points |
| `init.sh` script | Reproducible environment startup |
| Feature list (JSON) | Structured requirements, prevents premature completion |

**Why JSON over Markdown**: "The model is less likely to inappropriately change or overwrite JSON files compared to Markdown files."

**Get Up to Speed Protocol**:
```
1. Run pwd to verify working directory
2. Read progress file and git logs
3. Select next uncompleted feature
4. Start development server
5. Run basic E2E test before new work
```

### 2. arXiv Papers (26 Papers Analyzed)

**Top Memory Architectures**:

| System | Architecture | Performance |
|--------|--------------|-------------|
| **Mem0** | Hybrid (vector + key-value + graph) | Production-ready |
| **MemGPT/Letta** | Virtual memory with paging | Extended context |
| **Zep** | Temporal knowledge graphs | 94.8% on DMR benchmark |
| **MemOS** | Task-concept-fact hierarchy | Efficient routing |

**Key Pattern: Tiered Memory**
```
Hot Tier  → Working memory (<100ms)
Warm Tier → Semantic search (100-500ms)
Cold Tier → Long-term archive (1-5s)
```

**Memory Types (Cognitive)**:
- **Episodic**: Specific events with context/timestamps
- **Semantic**: Decontextualized facts and knowledge
- **Procedural**: Learned workflows and patterns
- **Working**: Active session context

**Performance Findings**:
- Memory improves coordination by **68.7%** vs no-memory baseline
- Quality of retrieval matters more than quantity
- Smaller models with memory can outperform larger models without

### 3. GitHub Frameworks (10 Frameworks Analyzed)

**Top Frameworks by Stars**:

| Framework | Stars | Key Memory Pattern |
|-----------|-------|-------------------|
| AutoGen | 51.9K | ChromaDB + Memory Bank agents |
| CrewAI | 41.3K | 4 memory types + auto context management |
| Letta | 19.3K | Subconscious agents + Agent File format |
| LangGraph | 4.2M DL | Thread persistence + checkpointing |

**Best Patterns to Adopt**:

1. **Agent File Format (.af)** from Letta
   - Serializes: system prompts, editable memory, tool configs, LLM settings
   - Enables checkpointing, version control, portability

2. **Memory Bank Pattern** from AutoGen
   - Special agent listens for and persists memory messages
   - Knowledge (static) vs Memory (runtime-generated) distinction

3. **Automatic Context Management** from CrewAI
   - Detects when approaching token limits
   - Auto-summarization with `respect_context_window=True`

4. **Subconscious Agent Pattern** from Letta
   - Background agents that asynchronously process memory
   - Primary + sleep-time agents sharing memory

### 4. Anthropic Official Documentation

**5 Composable Patterns**:
1. **Prompt Chaining**: Sequential steps, each processing previous output
2. **Routing**: Classify inputs → specialized handlers
3. **Parallelization**: Sectioning (parallel subtasks) or Voting (diverse outputs)
4. **Orchestrator-Workers**: Central LLM delegates to workers, synthesizes
5. **Evaluator-Optimizer**: Generate → Evaluate → Refine iteratively

**MCP Protocol** (Model Context Protocol):
- Standard for connecting AI to external systems
- 3 primitives: Tools, Resources, Prompts
- Available SDKs: Python, TypeScript, C#, Java

**Context Window Management**:
- Claude Sonnet 4.5: 500K tokens (Enterprise) / 200K (standard)
- Context awareness: Claude tracks remaining capacity
- Avoid last fifth for memory-intensive tasks

**Tool Search Tool**:
- Dynamic tool discovery reduces tokens by ~85%
- Load only Tool Search Tool initially (~500 tokens)
- Discover 3-5 relevant tools on-demand

---

## Current System Audit Results

### What's Working:

| Component | Status | Evidence |
|-----------|--------|----------|
| Memory Store | WORKING | 2.7MB data in .swarm/memory/ |
| File-based persistence | WORKING | Async-ready with caching |
| Memory Summarizer | IMPLEMENTED | 400 LOC, relevance scoring |
| Anti-fabrication Injector | IMPLEMENTED | 350 LOC, protocol generation |
| Role Profiles | IMPLEMENTED | 4 roles defined |
| Skills Documentation | COMPLETE | 11 skill directories |
| MCP Server | BUILT | Tools defined |

### Critical Gap Identified:

**NONE of the bootstrap infrastructure is connected to agent spawning.**

```
┌─────────────────────────────────────────────────────┐
│           IMPLEMENTED BUT DISCONNECTED               │
├─────────────────────────────────────────────────────┤
│ ✓ buildSmartBootstrapPrompt() - NEVER CALLED        │
│ ✓ summarizeMemoriesForAgent() - NEVER CALLED        │
│ ✓ generateProtocolPrompt() - NEVER CALLED           │
│ ✓ getRoleSkills() - NEVER CALLED                    │
│ ✓ loadConfig() - NEVER CALLED                       │
└─────────────────────────────────────────────────────┘
```

---

## Recommended Architecture

Based on research synthesis, here's the recommended architecture:

### 1. Bootstrap Flow (Inspired by Anthropic Harnesses)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT BOOTSTRAP FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ORIENTATION (Get Up to Speed)                               │
│     ├── Read STATE.json for current mission phase               │
│     ├── Read .swarm/hypotheses.json for active work             │
│     ├── Check git log for recent changes                        │
│     └── Verify working directory                                │
│                                                                  │
│  2. CONTEXT INJECTION                                           │
│     ├── Load bootstrap-config.json                              │
│     ├── Call summarizeMemoriesForAgent() for relevant context   │
│     ├── Load role-specific skills from getRoleSkills()          │
│     └── Inject anti-fabrication protocol                        │
│                                                                  │
│  3. MISSION AWARENESS                                           │
│     ├── getCurrentMissionState() for timeline/phase             │
│     ├── Phase restrictions (research → implementation → validation) │
│     └── Urgency calculation based on deadline                   │
│                                                                  │
│  4. AGENT EXECUTION                                             │
│     ├── Execute with full context                               │
│     ├── Store learnings in memory                               │
│     └── Update STATE.json and progress file                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Memory Architecture (Based on arXiv Research)

```
┌─────────────────────────────────────────────────────────────────┐
│                    3-TIER MEMORY SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HOT TIER (Working Memory)                                      │
│  ├── Location: .swarm/memory/working/                           │
│  ├── Latency: <100ms                                            │
│  ├── Contents: Active session context, current task             │
│  └── Promotion: 3+ accesses in 24h → stays hot                  │
│                                                                  │
│  WARM TIER (Semantic Memory)                                    │
│  ├── Location: .swarm/memory/semantic/ + data/memories.json     │
│  ├── Latency: 100-500ms                                         │
│  ├── Contents: Facts, patterns, proven solutions                │
│  └── Query: Vector similarity + keyword search                  │
│                                                                  │
│  COLD TIER (Episodic Archive)                                   │
│  ├── Location: .swarm/memory/episodic/ + GitHub                 │
│  ├── Latency: 1-5s                                              │
│  ├── Contents: Historical sessions, detailed logs               │
│  └── Retrieval: On-demand for deep context                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Skills Loading Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    SKILL INJECTION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Read framework/skills/skill-registry.json                   │
│                                                                  │
│  2. Filter by:                                                  │
│     ├── auto_load: true (always inject)                         │
│     ├── role_based: match agent role                            │
│     └── task_keywords: match task requirements                  │
│                                                                  │
│  3. Load skill content from .claude/skills/{name}/SKILL.md      │
│                                                                  │
│  4. Inject into agent prompt as context section                 │
│                                                                  │
│  ALWAYS INJECT:                                                 │
│  ├── evidence-based-validation (anti-fabrication)               │
│  ├── bootstrap (orientation protocol)                           │
│  └── memory-access (memory MCP tools)                           │
│                                                                  │
│  ROLE-BASED:                                                    │
│  ├── RESEARCHER: research-web, research-academic                │
│  ├── IMPLEMENTER: validation, mcp-server-development            │
│  ├── VALIDATOR: evidence-based-validation (enhanced)            │
│  └── ORCHESTRATOR: coordination, multi-agent-orchestration      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Agent File Format (.sartor)

Based on Letta's Agent File (.af) format, adapted for Sartor:

```json
{
  "version": "1.0.0",
  "agent_id": "agent-uuid",
  "created": "ISO-8601",
  "role": "IMPLEMENTER",

  "system_prompt": {
    "base": "You are an IMPLEMENTER agent...",
    "anti_fabrication": "MANDATORY PROTOCOLS...",
    "skills": ["validation", "bootstrap"],
    "memory_context": "PRIOR KNOWLEDGE:..."
  },

  "memory": {
    "working": { "current_task": "...", "hypothesis": "..." },
    "relevant_semantic": [ "mem_001", "mem_002" ],
    "episode_references": [ "2025-12-17.json" ]
  },

  "mission_state": {
    "phase": "implementation",
    "deadline": "ISO-8601",
    "progress": 45,
    "urgency": "medium"
  },

  "checkpoints": [
    { "timestamp": "...", "state_hash": "...", "recoverable": true }
  ]
}
```

---

## Implementation Plan

### Phase 1: Wire Bootstrap Integration (CRITICAL)

**Files to Create/Modify**:
1. `framework/bootstrap/agent-initializer.ts` - Central bootstrap entry point
2. Modify coordinator to call bootstrap before agent spawn

**Key Functions**:
```typescript
// Entry point for all agent initialization
export async function initializeAgent(config: AgentConfig): Promise<BootstrappedAgent> {
  // 1. Load bootstrap config
  const bootConfig = await loadConfig();

  // 2. Get mission state
  const mission = await getCurrentMissionState();

  // 3. Summarize relevant memories
  const memories = await summarizeMemoriesForAgent({
    role: config.role,
    taskKeywords: extractKeywords(config.task),
    maxTokens: bootConfig.memory_injection.max_tokens
  });

  // 4. Load role-specific skills
  const skills = getRoleSkills(config.role);

  // 5. Generate anti-fabrication protocol
  const afProtocol = generateProtocolPrompt({
    role: config.role,
    severity: 'critical'
  });

  // 6. Build full bootstrap prompt
  return buildSmartBootstrapPrompt({
    ...config,
    memories,
    skills,
    afProtocol,
    mission
  });
}
```

### Phase 2: Create Progress File System

**Files to Create**:
1. `.swarm/progress.json` - Activity log (JSON, not markdown)
2. Update STATE.json format

**Progress Entry Format**:
```json
{
  "entries": [
    {
      "timestamp": "ISO-8601",
      "agent_id": "...",
      "action": "completed_task",
      "description": "Implemented hypothesis generator",
      "files_modified": ["framework/validation/hypothesis-generator.ts"],
      "verified": true
    }
  ],
  "last_verification": "ISO-8601",
  "next_priority": "hyp-waste-1765979086547"
}
```

### Phase 3: Implement Memory Injection at Spawn

**Integration Point**: Coordinator spawns agents

```typescript
// In coordinator spawn logic:
import { initializeAgent } from '../framework/bootstrap/agent-initializer';

async function spawnAgent(request: AgentRequest) {
  // NEW: Bootstrap the agent with full context
  const bootstrapped = await initializeAgent({
    role: request.agentRole,
    task: request.task,
    requestId: request.requestId
  });

  // Spawn with bootstrapped prompt
  const agent = spawn('claude', {
    input: bootstrapped.fullPrompt,
    // ... other config
  });
}
```

### Phase 4: Skill Auto-Loading

**Create**: `framework/skills/skill-loader.ts`

```typescript
export async function loadSkillsForRole(role: AgentRole): Promise<string[]> {
  const registry = await loadSkillRegistry();

  // Always load these
  const skills = ['evidence-based-validation', 'bootstrap'];

  // Add role-specific skills
  const roleSkills = registry.role_based[role] || [];
  skills.push(...roleSkills);

  // Load skill content
  const skillContents = await Promise.all(
    skills.map(s => loadSkillContent(s))
  );

  return skillContents;
}
```

---

## Anti-Fabrication Protocol (Always Inject)

Based on CLAUDE.md and research on evidence-based engineering:

```markdown
## MANDATORY ANTI-FABRICATION PROTOCOLS

### ABSOLUTE RULES (Cannot be overridden):
1. NEVER fabricate scores, percentages, or metrics
2. NEVER use "exceptional", "outstanding", "world-class" without measurement data
3. ALWAYS say "cannot determine without measurement" when unsure
4. ALWAYS include confidence levels and limitations
5. ALWAYS cite sources for claims

### REQUIRED LANGUAGE PATTERNS:
- "Cannot determine without measurement data"
- "No empirical evidence available"
- "Preliminary observation suggests (with caveats)"
- "Requires external validation"
- "Limitations include..."

### BANNED WITHOUT EVIDENCE:
- Any score above 80% without external validation
- Letter grades (A, B, C) without defined rubric
- Claims of "X times better" without baseline measurements
- Confidence scores without statistical basis
```

---

## Success Metrics

### Before Integration:
- Agents receive: Basic task prompt only
- Memory context: None
- Skills guidance: None
- Anti-fabrication: Not enforced
- Mission awareness: None

### After Integration:
- Agents receive: Full bootstrapped context
- Memory context: Relevant prior learnings
- Skills guidance: Role-specific skills
- Anti-fabrication: Always enforced
- Mission awareness: Phase, deadline, urgency

### Measurable Outcomes:
- Agent success rate: Currently 57.4% → Target 75%+
- Context relevance: Should reduce redundant work
- Fabrication incidents: Should be caught by validation
- Bootstrap time: <500ms per agent

---

## Next Steps

1. **IMMEDIATE**: Create `agent-initializer.ts` and wire into coordinator
2. **TODAY**: Implement progress.json and update STATE.json
3. **THIS WEEK**: Create skill-loader and test full bootstrap flow
4. **ONGOING**: Monitor agent success rate and iterate

---

## Sources

- Anthropic Engineering: "Effective Harnesses for Long-Running Agents"
- arXiv: 26 papers on agent memory systems (2023-2025)
- GitHub: AutoGen, CrewAI, Letta, LangGraph, BabyAGI
- Anthropic Docs: Building Effective Agents, MCP, Extended Thinking
- System Audit: Memory and Bootstrap analysis
