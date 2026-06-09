# Unified Framework Design for Autonomous Agent Swarms

**Synthesizer**: research-synthesizer
**Date**: 2025-12-15
**Status**: Framework Specification
**Compliance**: Adheres to MANDATORY ANTI-FABRICATION PROTOCOLS

---

## Executive Summary

This document synthesizes research findings from multiple agents into an actionable framework design for building autonomous, self-improving agent swarms. The framework comprises four interdependent components:

1. **Memory** - Persistent knowledge across agent sessions
2. **Skills** - Curated capabilities loaded into agents
3. **Validation** - Evidence-based quality assurance
4. **Bootstrap** - Agent initialization and orientation

**Critical Finding**: The file-based coordinator now works correctly after fixing the stdin issue. Agents spawned via `--chat` mode with stdin have full tool access, enabling complex multi-agent workflows.

---

## I. Memory Framework

### Purpose

Enable agents to retain knowledge across sessions and share context across the swarm.

### Architecture

Based on findings from `MEMORY_INTEGRATION_RESEARCH.md` and existing `memory-store.ts`:

```
.swarm/memory/
├── episodic/           # Time-stamped events (session logs, task completions)
│   └── {date}.json
├── semantic/           # Persistent knowledge (facts, patterns, learnings)
│   └── {topic}.json
└── working/            # Active session state (current task context)
    └── {agent_id}.json
```

### Implementation Recommendations

#### 1. Memory Auto-Bootstrap for Spawned Agents

**Problem**: Spawned agents currently require explicit memory client initialization.

**Solution**: Inject memory context into agent prompts at spawn time.

```typescript
// In coordinator/bootstrap.ts
async function injectMemoryContext(agentPrompt: string, agentId: string): Promise<string> {
  const relevantMemories = await summarizeMemories({
    topics: ['mission', 'recent_findings', 'agent_learnings'],
    limit: 10
  }, 2000);

  return `
## Memory Context
${relevantMemories}

## Your Task
${agentPrompt}
`;
}
```

#### 2. Memory API for Agents

Agents interact with memory via file operations (no MCP server required):

```bash
# Store a memory (agents do this before completing)
echo '{"type":"semantic","content":"Found that X causes Y","metadata":{"topic":"findings"}}' \
  >> .swarm/memory/semantic/findings.jsonl

# Query memories (agents read at start)
cat .swarm/memory/semantic/mission.json | jq '.entries[-5:]'
```

#### 3. Memory Summarization

For context window efficiency, memories are summarized before injection:

| Memory Type | Summarization Strategy | Max Tokens |
|-------------|----------------------|------------|
| Episodic | Recent 5 entries, chronological | 500 |
| Semantic | Most relevant to current task | 1000 |
| Working | Full current state | 500 |

### Integration Points

1. **At agent spawn**: Inject summarized relevant memories
2. **During execution**: Agents can query/store via file operations
3. **At completion**: Agent stores findings as semantic memory
4. **At handoff**: Working memory transferred to successor

---

## II. Skills Framework

### Purpose

Provide agents with specialized capabilities through structured skill definitions.

### Architecture

Based on existing skills in `/home/alton/.claude/skills/`:

```
skills/
├── skill-registry.json       # Catalog of available skills
└── {skill-name}/
    ├── SKILL.md              # Main skill definition (required)
    ├── README.md             # Usage documentation
    ├── reference/            # Supporting materials
    │   └── *.md
    ├── examples/             # Usage examples
    │   └── *.md
    └── templates/            # Reusable templates
        └── *.md
```

### Available Skills (from `/home/alton/.claude/skills/`)

| Skill | Category | Purpose |
|-------|----------|---------|
| evidence-based-validation | Validation | Anti-fabrication protocols |
| evidence-based-engineering | Validation | Honest engineering claims |
| mcp-server-development | Implementation | Building MCP servers |
| multi-agent-orchestration | Coordination | Agent coordination patterns |
| distributed-systems-debugging | Debugging | Debugging distributed issues |
| safety-research-workflow | Research | Systematic safety research |
| agent-communication-system | Coordination | Inter-agent messaging |

### Implementation Recommendations

#### 1. Skill Registry

```json
{
  "version": "1.0.0",
  "skills": {
    "validation": {
      "path": "/home/alton/.claude/skills/evidence-based-validation/",
      "load": "SKILL.md",
      "category": "validation",
      "required_for": ["all"]
    },
    "multi-agent": {
      "path": "/home/alton/.claude/skills/multi-agent-orchestration/",
      "load": "SKILL.md",
      "category": "coordination",
      "required_for": ["coordinator", "orchestrator"]
    },
    "research": {
      "path": "/home/alton/.claude/skills/safety-research-workflow/",
      "load": "SKILL.md",
      "category": "research",
      "required_for": ["researcher"]
    }
  }
}
```

#### 2. Skill Loading Protocol

```typescript
// In coordinator/skill-loader.ts
function loadSkillsForRole(role: string): string {
  const registry = loadRegistry();
  const skillContent: string[] = [];

  for (const [name, skill] of Object.entries(registry.skills)) {
    if (skill.required_for.includes('all') || skill.required_for.includes(role)) {
      const skillPath = path.join(skill.path, skill.load);
      skillContent.push(readFileSync(skillPath, 'utf-8'));
    }
  }

  return skillContent.join('\n\n---\n\n');
}
```

#### 3. Skill Injection

Skills are injected into agent prompts at spawn time, after memory but before task:

```
[System Context from CLAUDE.md]
[Memory Context - recent relevant memories]
[Skill Context - loaded skill definitions]
[Task Context - what the agent should do]
```

### Skill Development Guidelines

New skills should follow the existing pattern:

1. Create directory under `/home/alton/.claude/skills/{skill-name}/`
2. Write `SKILL.md` with core instructions
3. Add `README.md` with usage documentation
4. Include examples in `examples/` directory
5. Register in `skill-registry.json`

---

## III. Validation Framework

### Purpose

Ensure agent outputs meet quality standards and adhere to anti-fabrication protocols.

### Architecture

Based on `SELF_IMPROVING_SYSTEM_DESIGN.md` and existing `validator.ts`:

```
validation/
├── validator.ts          # Core validation engine
├── rules/               # Validation rule definitions
│   ├── language.ts      # No superlatives, banned words
│   ├── evidence.ts      # Claims need sources
│   └── scores.ts        # No fabricated metrics
├── tests/               # Ground truth test suites
│   └── test-suite-v1.json
└── results/             # Validation run results
    └── {timestamp}.json
```

### Validation Rules (Mandatory)

From `validator.ts` and `CLAUDE.md`:

#### 1. No Fabricated Scores

```typescript
// Banned without evidence
const SCORE_PATTERNS = [
  /(\d{1,3})%/g,           // Percentage scores
  /(\d+\.?\d*)\/(\d+)/g,   // X/Y scores
  /score[:\s]+(\d+)/gi,    // Explicit scores
  /grade[:\s]+[A-F]/gi,    // Letter grades
];

// Scores require:
// - "measured", "calculated", "based on", "according to", "source:"
```

#### 2. No Superlatives

```typescript
const BANNED_SUPERLATIVES = [
  'exceptional', 'outstanding', 'world-class', 'industry-leading',
  'best-in-class', 'cutting-edge', 'revolutionary', 'groundbreaking'
];
```

#### 3. Evidence Required

Claims using "studies show", "research indicates", etc. must have citations within 200 characters.

#### 4. Uncertainty Expression

Absolute claims like "will definitely", "always works", "never fails" trigger warnings.

### Implementation Recommendations

#### 1. Pre-Commit Validation

Run validation before saving agent outputs:

```typescript
// In coordinator/result-handler.ts
async function saveAgentResult(result: AgentResult): Promise<void> {
  const validation = validate(result.output);

  if (!validation.passed) {
    // Log validation failures
    result.validation_status = 'failed';
    result.validation_errors = validation.results.filter(r => r.severity === 'error');

    // Do not reject output, but flag for review
  }

  await writeResult(result);
}
```

#### 2. Self-Improvement Cycle

From `SELF_IMPROVING_SYSTEM_DESIGN.md`:

```
1. Establish Baseline → Run test suite, record pass/fail counts
2. Analyze Failures → Identify specific patterns (no scores!)
3. Hypothesis → Propose one specific change
4. A/B Test → Compare baseline vs. modified
5. Decision → Accept only if: improvement > 0 AND regression = 0
6. Iterate
```

#### 3. Test Suite Structure

```json
{
  "test_suite_id": "baseline-v1",
  "tests": [
    {
      "test_id": "code-gen-001",
      "prompt": "Write a function that...",
      "ground_truth": {
        "type": "executable_test",
        "test_file": "tests/code-gen-001.test.ts"
      },
      "evaluation": {
        "method": "run_tests",
        "binary_pass_fail": true
      }
    }
  ]
}
```

### Cross-Agent Validation

For critical outputs, multiple agents validate independently:

1. Agent A produces output
2. Agents B, C validate output independently
3. Disagreements are flagged (valuable, not hidden)
4. Human review required for consensus

---

## IV. Bootstrap Framework

### Purpose

Orient new agents with consistent initialization: mission context, skills, memory, and constraints.

### Architecture

```
bootstrap/
├── bootstrap-config.json   # Default configuration
├── bootstrap-loader.ts     # Injection logic
├── templates/             # Prompt templates
│   ├── coordinator.md
│   ├── researcher.md
│   ├── implementer.md
│   └── validator.md
└── BOOTSTRAP_SKILL.md     # Self-bootstrap capability
```

### Bootstrap Process

```
New Agent Spawn
      │
      ▼
┌─────────────────┐
│ 1. Load Config  │ ← bootstrap-config.json
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Query Memory │ ← Relevant memories for this agent
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Load Skills  │ ← Skills required for this role
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Build Prompt │ ← Combine into full agent context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Spawn Agent  │ ← claude --chat with full context
└─────────────────┘
```

### Bootstrap Configuration

```json
{
  "version": "1.0.0",
  "defaults": {
    "memory": {
      "inject_relevant": true,
      "max_context_tokens": 2000,
      "topics": ["mission", "recent_findings"]
    },
    "skills": {
      "always_load": ["evidence-based-validation"],
      "role_specific": {
        "researcher": ["safety-research-workflow"],
        "coordinator": ["multi-agent-orchestration"],
        "implementer": ["mcp-server-development"]
      }
    },
    "constraints": [
      "Adhere to anti-fabrication protocols",
      "Store findings to memory before completing",
      "Report evidence for all claims"
    ]
  },
  "roles": {
    "coordinator": {
      "template": "templates/coordinator.md",
      "can_spawn": true,
      "timeout_minutes": 55
    },
    "researcher": {
      "template": "templates/researcher.md",
      "can_spawn": false,
      "timeout_minutes": 25
    }
  }
}
```

### Bootstrap Prompt Template

```markdown
# Agent Bootstrap: {role}

## Mission
{mission_objective}

## Your Role
You are agent "{agent_id}" with role "{role}".

## Current Mission State
{memory_context}

## Available Skills
{skill_descriptions}

## Constraints
{constraints}

## Communication
- Write findings to: .swarm/artifacts/
- Write spawn requests to: .swarm/requests/
- Read sibling results from: .swarm/results/

## Your Task
{task_objective}

## Requirements
{requirements}

## Success Criteria
{success_criteria}
```

### Implementation Recommendations

#### 1. Bootstrap Loader

```typescript
// In coordinator/bootstrap-loader.ts
async function buildAgentPrompt(
  role: string,
  task: TaskDefinition,
  config: BootstrapConfig
): Promise<string> {
  // 1. Load template
  const template = await loadTemplate(config.roles[role].template);

  // 2. Get memory context
  const memoryContext = await summarizeMemories({
    topics: config.defaults.memory.topics,
    limit: 10
  }, config.defaults.memory.max_context_tokens);

  // 3. Load skills
  const skills = [
    ...config.defaults.skills.always_load,
    ...(config.defaults.skills.role_specific[role] || [])
  ];
  const skillContent = await loadSkills(skills);

  // 4. Build prompt
  return interpolateTemplate(template, {
    role,
    agent_id: generateAgentId(),
    mission_objective: getMissionObjective(),
    memory_context: memoryContext,
    skill_descriptions: skillContent,
    constraints: config.defaults.constraints.join('\n'),
    task_objective: task.objective,
    requirements: task.requirements.join('\n'),
    success_criteria: task.success_criteria?.join('\n') || 'Complete the task as specified'
  });
}
```

#### 2. Spawning with Full Bootstrap

```typescript
// In coordinator/spawner.ts
async function spawnAgent(request: AgentRequest): Promise<ChildProcess> {
  const prompt = await buildAgentPrompt(
    request.agentRole,
    request.task,
    bootstrapConfig
  );

  const proc = spawn('claude', ['--chat'], {
    env: {
      ...process.env,
      SWARM_REQUEST_ID: request.requestId,
      SWARM_AGENT_ROLE: request.agentRole,
      SWARM_PARENT_ID: request.parentRequestId || ''
    }
  });

  // Write prompt to stdin (CRITICAL: this is the fix that makes it work)
  proc.stdin.write(prompt);
  proc.stdin.end();

  return proc;
}
```

---

## V. Integration Architecture

### How Components Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                         COORDINATOR                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Read mission from .swarm/instructions/MISSION.json          │
│  2. Query memory for relevant context                           │
│  3. Determine which agents to spawn                             │
│  4. For each agent:                                              │
│     a. Build bootstrap prompt (memory + skills + task)          │
│     b. Spawn via stdin mode                                      │
│     c. Track in .swarm/active-agents/                           │
│  5. Wait for results in .swarm/results/                         │
│  6. Validate outputs against anti-fabrication rules             │
│  7. Store learnings to memory                                   │
│  8. Spawn successor before timeout                              │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ AGENT 1  │    │ AGENT 2  │    │ AGENT 3  │
    │(Research)│    │(Implement)│   │(Validate)│
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         ▼               ▼               ▼
    ┌──────────────────────────────────────────┐
    │              SHARED RESOURCES             │
    ├──────────────────────────────────────────┤
    │  .swarm/artifacts/  - Output artifacts   │
    │  .swarm/memory/     - Shared knowledge   │
    │  .swarm/results/    - Agent results      │
    │  .swarm/requests/   - Spawn requests     │
    └──────────────────────────────────────────┘
```

### Data Flow

```
Mission Definition
       │
       ▼
   Bootstrap
       │
   ┌───┴───┐
   ▼       ▼
Memory  Skills
   │       │
   └───┬───┘
       │
       ▼
 Agent Prompt
       │
       ▼
  Agent Work
       │
   ┌───┴───┐
   ▼       ▼
Output  Memory
   │    Update
   ▼
Validation
   │
   ▼
  Result
```

---

## VI. Implementation Roadmap

### Phase 1: Foundation (Immediate)

| Task | Files | Status |
|------|-------|--------|
| Memory store implementation | `framework/memory/memory-store.ts` | Complete |
| Validation engine | `framework/validation/validator.ts` | Complete |
| Skill registry | `framework/skills/skill-registry.json` | Needs creation |
| Bootstrap config | `framework/bootstrap/bootstrap-config.json` | Needs creation |

### Phase 2: Integration (Next)

| Task | Description |
|------|-------------|
| Bootstrap loader | Implement `bootstrap-loader.ts` to build agent prompts |
| Coordinator update | Update coordinator to use bootstrap system |
| Memory injection | Add memory context injection to spawn process |
| Skill loading | Implement dynamic skill loading for roles |

### Phase 3: Self-Improvement (Following)

| Task | Description |
|------|-------------|
| Test suite creation | Build initial 20-test ground truth suite |
| A/B testing infrastructure | Implement comparative testing |
| Modification tracking | Track hypothesis → test → decision cycle |
| Meta-learning | Learn which modification types work |

---

## VII. Critical Findings & Lessons Learned

### 1. Coordinator Spawning Fix

**Problem**: Agents spawned with `claude -p` had no tool access.

**Solution**: Use `claude --chat` with prompt via stdin:
```javascript
const proc = spawn('claude', ['--chat']);
proc.stdin.write(prompt);
proc.stdin.end();
```

**Verification**: Self-perpetuation now works; agents can use all tools.

### 2. Memory System Integration Gap

**Problem**: MCP Memory Server exists but spawned agents can't access it automatically.

**Solution**: Use file-based memory instead of MCP for spawned agents:
- Simpler (no connection management)
- Works with any spawn method
- Natural file-based coordination

### 3. Task Tool vs. File Coordinator

| Aspect | Task Tool | File Coordinator |
|--------|-----------|------------------|
| Tool Access | Full | Full (after fix) |
| Nesting | Limited | Unlimited |
| Output | Captured | File-based |
| Coordination | In-process | Cross-process |

**Recommendation**: Use Task tool for simple sub-tasks, file coordinator for overnight/parallel work.

### 4. Anti-Fabrication is Central

Every component must respect anti-fabrication protocols:
- Memory: Store observations, not scores
- Skills: Teach evidence-based approaches
- Validation: Enforce anti-fabrication rules
- Bootstrap: Include constraints in every agent

---

## VIII. Limitations & Caveats

This framework design is based on synthesis of research findings. The following limitations apply:

1. **Not yet validated**: Implementation required to verify design works as specified
2. **Memory scalability**: File-based approach may not scale to very large memory stores
3. **Self-improvement**: The A/B testing cycle requires significant testing to validate effectiveness
4. **Skills coverage**: Current skills cover validation and coordination; implementation skills may need expansion

**Next Steps**: Implement Phase 1 components and validate through actual agent runs.

---

## Document Control

**Version**: 1.0.0
**Date**: 2025-12-15
**Synthesized From**:
- `MEMORY_INTEGRATION_RESEARCH.md`
- `SELF_IMPROVING_SYSTEM_DESIGN.md`
- `PERSISTENT_INSTRUCTIONS_SYSTEM.md`
- `CONTINUOUS_AGENT_PATTERNS.md`
- `CRITICAL_FINDING_COORDINATOR_AGENTS.md`
- `OVERNIGHT_ORCHESTRATION.md`
- Existing framework code in `/home/alton/claude-swarm/framework/`
- Production skills in `/home/alton/.claude/skills/`

**Change Log**:
- 2025-12-15: Initial synthesis by research-synthesizer agent

---

*This framework is designed to evolve. Validate through implementation, measure through testing, improve through evidence.*
