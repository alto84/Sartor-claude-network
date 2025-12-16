# Bootstrap Context Injection Improvements

**Research Document**
**Date**: 2025-12-15
**Purpose**: Propose improvements to agent bootstrap context injection system

---

## Executive Summary

This document analyzes the current bootstrap system (`bootstrap-config.json` and `bootstrap-loader.ts`) and proposes four major improvements:

1. **Role-specific context injection** - Tailor information to agent personas
2. **Memory summarization injection** - Smart context from past findings
3. **Mission state injection** - Timeline awareness and progress tracking
4. **Anti-fabrication protocol injection** - Comprehensive compliance framework

Current bootstrap system provides generic context. Proposed improvements enable specialized, context-aware agent initialization.

---

## Current System Analysis

### Strengths
- Modular configuration via JSON
- Memory integration capability exists
- Skills-based loading with role mapping
- Clean separation of concerns (config/loader/memory)
- Cache-enabled memory store with TTL support

### Limitations
- Generic context for all roles (researcher gets same info as implementer)
- Memory summarization is basic (no LLM-powered synthesis)
- No mission timeline awareness
- Anti-fabrication protocols referenced but not embedded
- Skills loaded but not role-optimized
- No differentiation between bootstrap phases (start vs continuation)

### Current Config Structure
```json
{
  "memory_injection": {
    "enabled": true,
    "max_tokens": 2000,
    "topics": ["mission", "recent_findings", "framework_design"]
  },
  "skills_injection": {
    "always_load": ["validation", "bootstrap"],
    "role_based": {
      "researcher": ["research-web", "research-academic"],
      "orchestrator": ["coordination", "memory-query"],
      "implementer": ["validation"]
    }
  }
}
```

---

## Improvement 1: Role-Specific Context Injection

### Problem
All agents receive identical bootstrap context regardless of role. A researcher doesn't need implementation details; an implementer doesn't need research methodology.

### Proposed Solution

#### Enhanced Config Schema
```json
{
  "role_profiles": {
    "researcher": {
      "identity": {
        "persona": "Academic researcher with focus on evidence-based analysis",
        "expertise": ["literature review", "data synthesis", "citation management"],
        "constraints": ["Must cite sources", "No fabricated data", "Conservative claims"]
      },
      "context_priorities": {
        "memory_topics": ["research_findings", "citations", "methodology", "gaps"],
        "skills": ["research-web", "research-academic", "safety-research-workflow"],
        "output_requirements": {
          "format": "structured_research",
          "citation_style": "inline",
          "evidence_level": "high"
        }
      },
      "environment": {
        "output_path": ".swarm/artifacts/research/",
        "working_memory_focus": "research_queries",
        "coordination_role": "provider"
      }
    },
    "implementer": {
      "identity": {
        "persona": "Software engineer focused on robust implementation",
        "expertise": ["code architecture", "testing", "validation", "debugging"],
        "constraints": ["Must write tests", "Follow framework patterns", "Document decisions"]
      },
      "context_priorities": {
        "memory_topics": ["implementation_patterns", "validation_results", "bugs_fixed"],
        "skills": ["validation", "mcp-server-development", "distributed-systems-debugging"],
        "output_requirements": {
          "format": "code_with_tests",
          "documentation": "inline_comments",
          "evidence_level": "measured"
        }
      },
      "environment": {
        "output_path": ".swarm/artifacts/code/",
        "working_memory_focus": "implementation_state",
        "coordination_role": "consumer"
      }
    },
    "orchestrator": {
      "identity": {
        "persona": "Coordination specialist managing agent workflows",
        "expertise": ["task decomposition", "dependency tracking", "quality gates"],
        "constraints": ["Must track all spawned agents", "Validate before accepting", "Maintain state"]
      },
      "context_priorities": {
        "memory_topics": ["coordination_state", "agent_results", "blockers"],
        "skills": ["coordination", "memory-query", "multi-agent-orchestration"],
        "output_requirements": {
          "format": "status_report",
          "tracking": "all_subtasks",
          "evidence_level": "traced"
        }
      },
      "environment": {
        "output_path": ".swarm/artifacts/reports/",
        "working_memory_focus": "coordination_graph",
        "coordination_role": "manager"
      }
    },
    "validator": {
      "identity": {
        "persona": "Quality assurance specialist enforcing anti-fabrication",
        "expertise": ["evidence validation", "claim verification", "metric checking"],
        "constraints": ["Must check all scores", "Flag superlatives", "Verify citations"]
      },
      "context_priorities": {
        "memory_topics": ["validation_failures", "patterns", "edge_cases"],
        "skills": ["validation", "evidence-based-validation", "evidence-based-engineering"],
        "output_requirements": {
          "format": "validation_report",
          "rejection_criteria": "explicit",
          "evidence_level": "proven"
        }
      },
      "environment": {
        "output_path": ".swarm/artifacts/validation/",
        "working_memory_focus": "validation_queue",
        "coordination_role": "gatekeeper"
      }
    }
  }
}
```

#### Implementation Changes

**bootstrap-loader.ts additions**:

```typescript
interface RoleProfile {
  identity: {
    persona: string;
    expertise: string[];
    constraints: string[];
  };
  context_priorities: {
    memory_topics: string[];
    skills: string[];
    output_requirements: {
      format: string;
      [key: string]: string;
    };
  };
  environment: {
    output_path: string;
    working_memory_focus: string;
    coordination_role: string;
  };
}

interface RoleConfig {
  role_profiles: Record<string, RoleProfile>;
}

export function getRoleProfile(role: string, config: RoleConfig): RoleProfile {
  return config.role_profiles[role] || getDefaultProfile();
}

export function buildRoleSpecificPrompt(
  agentContext: AgentContext,
  roleProfile: RoleProfile,
  config: BootstrapConfig
): string {
  const identity = `
## Your Identity
You are a ${roleProfile.identity.persona}.

**Your expertise**:
${roleProfile.identity.expertise.map(e => `- ${e}`).join('\n')}

**Your constraints**:
${roleProfile.identity.constraints.map(c => `- ${c}`).join('\n')}
`;

  const environmentSetup = `
## Your Environment
- Output path: ${roleProfile.environment.output_path}
- Working memory focus: ${roleProfile.environment.working_memory_focus}
- Coordination role: ${roleProfile.environment.coordination_role}
${roleProfile.environment.coordination_role === 'provider'
  ? '  (You produce data for other agents to consume)'
  : roleProfile.environment.coordination_role === 'consumer'
  ? '  (You consume data from other agents)'
  : roleProfile.environment.coordination_role === 'manager'
  ? '  (You coordinate other agents)'
  : '  (You validate outputs from other agents)'}
`;

  const outputGuidance = `
## Output Requirements
- Format: ${roleProfile.context_priorities.output_requirements.format}
- Evidence level: ${roleProfile.context_priorities.output_requirements.evidence_level}
${Object.entries(roleProfile.context_priorities.output_requirements)
  .filter(([k]) => k !== 'format' && k !== 'evidence_level')
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}
`;

  return identity + environmentSetup + outputGuidance;
}
```

#### Benefits
- Agents understand their specific role and boundaries
- Reduces cognitive load by filtering irrelevant information
- Enables role-appropriate validation and output formatting
- Supports specialization in multi-agent workflows

---

## Improvement 2: Memory Summarization Injection

### Problem
Current memory summarization is basic string concatenation with token limits. No intelligent synthesis, deduplication, or relevance ranking.

### Proposed Solution

#### Enhanced Memory Summarization

**New memory-summarizer.ts module**:

```typescript
interface MemorySummary {
  role_relevant: {
    critical: string[];      // Must-know information
    important: string[];     // Should-know information
    context: string[];       // Nice-to-know background
  };
  recent_findings: {
    timestamp: string;
    topic: string;
    content: string;
    relevance_score: number;
  }[];
  dependency_chain: {
    parent_agent?: string;
    related_agents: string[];
    shared_context: Record<string, unknown>;
  };
  known_gaps: string[];      // What previous agents couldn't determine
  proven_facts: string[];    // Validated claims with evidence
}

export function generateSmartSummary(
  role: string,
  memoryTopics: string[],
  maxTokens: number
): MemorySummary {
  // 1. Query memories for role-specific topics
  const memories = queryMemory({
    topic: memoryTopics,
    limit: 100
  });

  // 2. Categorize by recency and relevance
  const categorized = categorizeByRelevance(memories, role);

  // 3. Deduplicate and rank
  const deduped = deduplicateFindings(categorized);

  // 4. Extract proven facts vs hypotheses
  const validated = extractValidatedClaims(deduped);

  // 5. Identify gaps explicitly mentioned
  const gaps = extractKnownGaps(deduped);

  // 6. Build dependency chain
  const dependencies = buildDependencyGraph(memories);

  // 7. Fit to token budget with priority
  return fitToTokenBudget({
    role_relevant: rankByImportance(validated, role),
    recent_findings: deduped.slice(0, 10),
    dependency_chain: dependencies,
    known_gaps: gaps,
    proven_facts: validated.filter(v => v.evidence_level === 'proven')
  }, maxTokens);
}

function categorizeByRelevance(
  memories: MemoryEntry[],
  role: string
): CategorizedMemories {
  const rules: Record<string, (m: MemoryEntry) => number> = {
    'researcher': (m) => {
      if (m.metadata.tags?.includes('citation')) return 10;
      if (m.metadata.tags?.includes('finding')) return 9;
      if (m.metadata.tags?.includes('gap')) return 8;
      return 5;
    },
    'implementer': (m) => {
      if (m.metadata.tags?.includes('pattern')) return 10;
      if (m.metadata.tags?.includes('bug')) return 9;
      if (m.metadata.tags?.includes('validation')) return 8;
      return 5;
    },
    'orchestrator': (m) => {
      if (m.metadata.tags?.includes('coordination')) return 10;
      if (m.metadata.tags?.includes('blocker')) return 9;
      if (m.metadata.tags?.includes('dependency')) return 8;
      return 5;
    },
    'validator': (m) => {
      if (m.metadata.tags?.includes('violation')) return 10;
      if (m.metadata.tags?.includes('edge_case')) return 9;
      if (m.metadata.tags?.includes('pattern')) return 8;
      return 5;
    }
  };

  const scorer = rules[role] || (() => 5);

  return memories.map(m => ({
    ...m,
    relevance_score: scorer(m)
  })).sort((a, b) => b.relevance_score - a.relevance_score);
}

function deduplicateFindings(memories: CategorizedMemories): MemoryEntry[] {
  const seen = new Set<string>();
  const unique: MemoryEntry[] = [];

  for (const mem of memories) {
    // Create content fingerprint (simple hash of key facts)
    const fingerprint = extractKeyFacts(mem.content).join('|');

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(mem);
    }
  }

  return unique;
}

function extractValidatedClaims(memories: MemoryEntry[]): ValidatedClaim[] {
  // Extract claims that have supporting evidence
  const claims: ValidatedClaim[] = [];

  for (const mem of memories) {
    // Look for evidence markers
    const hasEvidence =
      mem.content.includes('measured:') ||
      mem.content.includes('tested:') ||
      mem.content.includes('validated:') ||
      mem.metadata.tags?.includes('proven');

    if (hasEvidence) {
      claims.push({
        claim: mem.content,
        evidence_level: hasEvidence ? 'proven' : 'claimed',
        timestamp: mem.metadata.timestamp,
        source: mem.metadata.agent_id || 'unknown'
      });
    }
  }

  return claims;
}

function extractKnownGaps(memories: MemoryEntry[]): string[] {
  const gaps: string[] = [];

  for (const mem of memories) {
    // Extract explicit gap statements
    const gapMarkers = [
      'could not determine',
      'unknown',
      'needs further investigation',
      'cannot be measured',
      'requires validation'
    ];

    for (const marker of gapMarkers) {
      if (mem.content.toLowerCase().includes(marker)) {
        gaps.push(mem.content);
        break;
      }
    }
  }

  return gaps;
}
```

#### Bootstrap Integration

```typescript
export function buildBootstrapPrompt(
  agentContext: AgentContext,
  config?: BootstrapConfig
): string {
  const cfg = config || loadConfig();
  const roleProfile = getRoleProfile(agentContext.role, cfg);

  // Generate smart memory summary
  const memorySummary = generateSmartSummary(
    agentContext.role,
    roleProfile.context_priorities.memory_topics,
    cfg.memory.max_context_tokens
  );

  const memorySection = `
## Prior Knowledge

### Critical Information (Must Know)
${memorySummary.role_relevant.critical.map(c => `- ${c}`).join('\n') || 'None'}

### Important Context (Should Know)
${memorySummary.role_relevant.important.map(c => `- ${c}`).join('\n') || 'None'}

### Recent Findings
${memorySummary.recent_findings.map(f =>
  `- [${f.timestamp.split('T')[0]}] ${f.topic}: ${f.content}`
).join('\n') || 'None'}

### Known Gaps (What We Don't Know)
${memorySummary.known_gaps.map(g => `- ${g}`).join('\n') || 'None'}

### Proven Facts (Validated)
${memorySummary.proven_facts.map(f => `- ${f}`).join('\n') || 'None'}

### Dependency Chain
${memorySummary.dependency_chain.parent_agent
  ? `Parent agent: ${memorySummary.dependency_chain.parent_agent}`
  : 'Root agent (no parent)'}
Related agents: ${memorySummary.dependency_chain.related_agents.join(', ') || 'None'}
`;

  return memorySection;
}
```

#### Benefits
- Intelligent relevance ranking per role
- Explicit separation of facts vs gaps
- Deduplication prevents redundant context
- Dependency tracking enables coordination
- Evidence-level tagging supports validation

---

## Improvement 3: Mission State Injection

### Problem
Agents lack awareness of:
- Current mission timeline position
- Time remaining until deadline
- Mission phase (research, implementation, validation, reporting)
- Progress toward final report deadline

### Proposed Solution

#### Mission State Tracker

**New mission-state.ts module**:

```typescript
interface MissionState {
  mission_id: string;
  current_time: string;
  timeline: {
    start_time: string;
    end_time: string;
    final_report_time: string;
    elapsed_hours: number;
    remaining_hours: number;
    progress_percentage: number;
  };
  phase: {
    current: 'bootstrap' | 'research' | 'implementation' | 'validation' | 'reporting' | 'complete';
    allowed_operations: string[];
    restrictions: string[];
  };
  checkpoints: {
    name: string;
    timestamp: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    blocking_issues: string[];
  }[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  should_spawn_agents: boolean;
  warnings: string[];
}

export function getCurrentMissionState(
  config: BootstrapConfig
): MissionState {
  const now = new Date();
  const startTime = new Date(config.mission.start_time);
  const endTime = new Date(config.mission.end_time);
  const finalReportTime = new Date(config.mission.final_report_time);

  const elapsedMs = now.getTime() - startTime.getTime();
  const totalMs = endTime.getTime() - startTime.getTime();
  const remainingMs = endTime.getTime() - now.getTime();

  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const remainingHours = remainingMs / (1000 * 60 * 60);
  const progressPercentage = (elapsedMs / totalMs) * 100;

  // Determine current phase
  const phase = determinePhase(progressPercentage, config);

  // Check if we should still spawn agents
  const shouldSpawn = now < finalReportTime;

  // Calculate urgency
  const urgency = calculateUrgency(remainingHours, phase.current);

  // Generate warnings
  const warnings = generateTimeWarnings(
    now,
    finalReportTime,
    endTime,
    shouldSpawn
  );

  // Load checkpoint state
  const checkpoints = loadCheckpointState(config);

  return {
    mission_id: config.mission.name,
    current_time: now.toISOString(),
    timeline: {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      final_report_time: finalReportTime.toISOString(),
      elapsed_hours: Math.round(elapsedHours * 10) / 10,
      remaining_hours: Math.round(remainingHours * 10) / 10,
      progress_percentage: Math.round(progressPercentage * 10) / 10
    },
    phase,
    checkpoints,
    urgency_level: urgency,
    should_spawn_agents: shouldSpawn,
    warnings
  };
}

function determinePhase(
  progressPercentage: number,
  config: BootstrapConfig
): MissionState['phase'] {
  // Define phase boundaries (configurable)
  if (progressPercentage < 10) {
    return {
      current: 'bootstrap',
      allowed_operations: ['setup', 'validation', 'skill_loading'],
      restrictions: ['No final reports', 'No premature conclusions']
    };
  } else if (progressPercentage < 40) {
    return {
      current: 'research',
      allowed_operations: ['web_search', 'documentation', 'analysis'],
      restrictions: ['No implementation yet', 'Focus on evidence gathering']
    };
  } else if (progressPercentage < 70) {
    return {
      current: 'implementation',
      allowed_operations: ['coding', 'testing', 'integration'],
      restrictions: ['Must have tests', 'Must validate']
    };
  } else if (progressPercentage < 90) {
    return {
      current: 'validation',
      allowed_operations: ['testing', 'validation', 'bug_fixing'],
      restrictions: ['No new features', 'Focus on quality']
    };
  } else if (progressPercentage < 100) {
    return {
      current: 'reporting',
      allowed_operations: ['documentation', 'final_report'],
      restrictions: ['No agent spawning', 'Consolidation only']
    };
  } else {
    return {
      current: 'complete',
      allowed_operations: [],
      restrictions: ['Mission ended']
    };
  }
}

function calculateUrgency(
  remainingHours: number,
  currentPhase: string
): MissionState['urgency_level'] {
  if (remainingHours < 1) return 'critical';
  if (remainingHours < 3) return 'high';
  if (remainingHours < 6) return 'medium';
  return 'low';
}

function generateTimeWarnings(
  now: Date,
  finalReportTime: Date,
  endTime: Date,
  shouldSpawn: boolean
): string[] {
  const warnings: string[] = [];

  const minutesUntilReport = (finalReportTime.getTime() - now.getTime()) / (1000 * 60);
  const minutesUntilEnd = (endTime.getTime() - now.getTime()) / (1000 * 60);

  if (!shouldSpawn) {
    warnings.push('CRITICAL: Past final report deadline - DO NOT spawn new agents');
  } else if (minutesUntilReport < 30) {
    warnings.push('WARNING: Less than 30 minutes until final report deadline');
  }

  if (minutesUntilEnd < 60) {
    warnings.push('WARNING: Less than 1 hour until mission end');
  }

  if (now > endTime) {
    warnings.push('CRITICAL: Mission deadline has passed');
  }

  return warnings;
}

function loadCheckpointState(config: BootstrapConfig): MissionState['checkpoints'] {
  // Load from episodic memory or checkpoint files
  const checkpointPath = join(
    config.output_locations.checkpoints,
    'mission_checkpoints.json'
  );

  if (existsSync(checkpointPath)) {
    return JSON.parse(readFileSync(checkpointPath, 'utf-8'));
  }

  // Default checkpoints
  return [
    {
      name: 'Framework Setup',
      timestamp: '',
      status: 'pending',
      blocking_issues: []
    },
    {
      name: 'Research Complete',
      timestamp: '',
      status: 'pending',
      blocking_issues: []
    },
    {
      name: 'Implementation Complete',
      timestamp: '',
      status: 'pending',
      blocking_issues: []
    },
    {
      name: 'Validation Passed',
      timestamp: '',
      status: 'pending',
      blocking_issues: []
    },
    {
      name: 'Final Report',
      timestamp: '',
      status: 'pending',
      blocking_issues: []
    }
  ];
}
```

#### Bootstrap Integration

```typescript
export function buildBootstrapPrompt(
  agentContext: AgentContext,
  config?: BootstrapConfig
): string {
  const missionState = getCurrentMissionState(config);

  const missionSection = `
## Mission State

**Mission**: ${missionState.mission_id}
**Current Time**: ${missionState.current_time}

### Timeline
- Started: ${missionState.timeline.start_time}
- Ends: ${missionState.timeline.end_time}
- Final Report Due: ${missionState.timeline.final_report_time}
- Elapsed: ${missionState.timeline.elapsed_hours}h
- Remaining: ${missionState.timeline.remaining_hours}h
- Progress: ${missionState.timeline.progress_percentage}%

### Current Phase: ${missionState.phase.current.toUpperCase()}
**Allowed operations**:
${missionState.phase.allowed_operations.map(op => `- ${op}`).join('\n')}

**Restrictions**:
${missionState.phase.restrictions.map(r => `- ${r}`).join('\n')}

### Urgency Level: ${missionState.urgency_level.toUpperCase()}

${missionState.warnings.length > 0 ? `
### WARNINGS
${missionState.warnings.map(w => `- ${w}`).join('\n')}
` : ''}

### Checkpoints
${missionState.checkpoints.map(cp =>
  `- [${cp.status.toUpperCase()}] ${cp.name}${cp.timestamp ? ` (${cp.timestamp})` : ''}`
).join('\n')}

**Agent Spawning**: ${missionState.should_spawn_agents ? 'ALLOWED' : 'FORBIDDEN'}
`;

  return missionSection;
}
```

#### Benefits
- Agents make time-aware decisions
- Prevents spawning new agents after final report deadline
- Phase-based restrictions prevent inappropriate operations
- Urgency level guides prioritization
- Checkpoint tracking shows progress
- Explicit warnings prevent time-based errors

---

## Improvement 4: Anti-Fabrication Protocol Injection

### Problem
Anti-fabrication protocols exist in CLAUDE.md but are not systematically injected during bootstrap. Agents may not consistently apply them.

### Proposed Solution

#### Comprehensive Protocol Injection

**New anti-fabrication-injector.ts module**:

```typescript
interface AntiFabricationProtocol {
  rules: {
    category: string;
    rule: string;
    severity: 'critical' | 'high' | 'medium';
    examples: { violation: string; compliant: string }[];
  }[];
  role_specific_enforcement: {
    researcher: string[];
    implementer: string[];
    orchestrator: string[];
    validator: string[];
  };
  validation_checklist: string[];
  banned_phrases: string[];
  required_phrases: string[];
}

export function loadAntiFabricationProtocol(): AntiFabricationProtocol {
  // Parse from CLAUDE.md or use structured config
  return {
    rules: [
      {
        category: 'Score Fabrication',
        rule: 'Never fabricate, invent, or artificially generate scores',
        severity: 'critical',
        examples: [
          {
            violation: 'The code quality scores 85%',
            compliant: 'Cannot determine code quality without measurement tools'
          },
          {
            violation: 'Test coverage is excellent',
            compliant: 'Test coverage: 23 of 30 functions tested (measured)'
          }
        ]
      },
      {
        category: 'Superlatives',
        rule: 'Avoid superlatives without extraordinary evidence',
        severity: 'high',
        examples: [
          {
            violation: 'This is an exceptional implementation',
            compliant: 'Implementation passes 18/18 validation tests'
          }
        ]
      },
      {
        category: 'Evidence Chain',
        rule: 'Provide specific methodology for numerical claims',
        severity: 'critical',
        examples: [
          {
            violation: 'Performance improved significantly',
            compliant: 'Benchmark: 145ms → 89ms (38% reduction, measured via time command)'
          }
        ]
      },
      {
        category: 'Uncertainty',
        rule: 'Express confidence levels and unknowns explicitly',
        severity: 'medium',
        examples: [
          {
            violation: 'This will work correctly',
            compliant: 'This should work correctly (tested in 3 scenarios, edge cases unknown)'
          }
        ]
      }
    ],
    role_specific_enforcement: {
      researcher: [
        'Must cite all sources with URLs',
        'Cannot claim findings without evidence',
        'Must distinguish primary vs secondary sources',
        'No confidence scores without statistical basis'
      ],
      implementer: [
        'Must run tests before claiming completion',
        'Cannot claim percentage complete without counting',
        'Must measure performance claims with tools',
        'No claims of "working" without execution proof'
      ],
      orchestrator: [
        'Must track all spawned agents explicitly',
        'Cannot claim "all done" without verification',
        'Must provide dependency graph, not assumptions',
        'No aggregated scores without showing individual results'
      ],
      validator: [
        'Must check every claim for evidence',
        'Cannot approve without documented validation',
        'Must flag all superlatives and scores',
        'No rubber-stamping - show what was checked'
      ]
    },
    validation_checklist: [
      'Check for fabricated scores (0-100%)',
      'Flag superlatives (excellent, outstanding, world-class)',
      'Verify all numerical claims have methodology',
      'Ensure uncertainty is expressed where applicable',
      'Confirm citations exist for research claims',
      'Validate test results are from actual execution',
      'Check no banned phrases are used',
      'Ensure required phrases appear where needed'
    ],
    banned_phrases: [
      'exceptional performance',
      'outstanding',
      'world-class',
      'industry-leading',
      'best-in-class',
      'perfect',
      'flawless'
    ],
    required_phrases: [
      'cannot determine without',
      'measured via',
      'tested with',
      'validated by',
      'evidence shows',
      'limitation:',
      'unknown:'
    ]
  };
}

export function generateProtocolPrompt(
  role: string,
  protocol: AntiFabricationProtocol
): string {
  const roleRules = protocol.role_specific_enforcement[role] || [];

  return `
## ANTI-FABRICATION PROTOCOLS
**MANDATORY - THESE RULES CANNOT BE OVERRIDDEN**

### Your Role-Specific Enforcement (${role})
${roleRules.map(r => `- ${r}`).join('\n')}

### Core Rules

${protocol.rules.map(rule => `
#### ${rule.category} [${rule.severity.toUpperCase()}]
**Rule**: ${rule.rule}

**Examples**:
${rule.examples.map(ex => `
- VIOLATION: "${ex.violation}"
- COMPLIANT: "${ex.compliant}"`).join('\n')}
`).join('\n')}

### Pre-Output Validation Checklist
Before submitting your response, verify:
${protocol.validation_checklist.map(item => `- [ ] ${item}`).join('\n')}

### Banned Phrases (Never Use)
${protocol.banned_phrases.map(p => `- "${p}"`).join('\n')}

### Required Context (Use When Relevant)
${protocol.required_phrases.map(p => `- "${p}"`).join('\n')}

### Enforcement
- If you catch yourself about to fabricate a score: **STOP**
- If you cannot measure something: **State explicitly**
- If you have uncertainty: **Express it clearly**
- If you lack evidence: **Do not claim**

**Remember**: Your value comes from honest, accurate assessment based on evidence, not from generating impressive-sounding but unfounded claims.
`;
}
```

#### Bootstrap Integration

```typescript
export function buildBootstrapPrompt(
  agentContext: AgentContext,
  config?: BootstrapConfig
): string {
  const protocol = loadAntiFabricationProtocol();
  const protocolSection = generateProtocolPrompt(
    agentContext.role,
    protocol
  );

  // Inject early in bootstrap prompt (high priority)
  return protocolSection + '\n\n' + /* rest of bootstrap sections */;
}
```

#### Automated Validation Integration

```typescript
export async function validateAgentOutput(
  output: string,
  role: string
): Promise<ValidationResult> {
  const protocol = loadAntiFabricationProtocol();

  const violations: string[] = [];

  // Check banned phrases
  for (const phrase of protocol.banned_phrases) {
    if (output.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push(`Banned phrase detected: "${phrase}"`);
    }
  }

  // Check for fabricated scores (0-100% without methodology)
  const scorePattern = /(\d{1,3})%(?!\s+(measured|tested|validated))/g;
  const scores = output.match(scorePattern);
  if (scores) {
    violations.push(`Potential fabricated scores: ${scores.join(', ')}`);
  }

  // Check role-specific requirements
  const roleRequirements = protocol.role_specific_enforcement[role];
  for (const req of roleRequirements) {
    // Custom validation per requirement
    // Example: researcher must cite sources
    if (role === 'researcher' && req.includes('cite') && !output.includes('http')) {
      violations.push('Research output missing citations');
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    suggestions: violations.map(v => generateSuggestion(v))
  };
}
```

#### Benefits
- Explicit, structured protocol enforcement
- Role-specific rules prevent confusion
- Concrete examples guide correct behavior
- Pre-output checklist reduces violations
- Automated validation catches violations
- Systematic rather than ad-hoc compliance

---

## Implementation Roadmap

### Phase 1: Configuration Schema (1-2 hours)
1. Extend bootstrap-config.json with role_profiles
2. Add mission timeline fields
3. Create anti-fabrication-protocol.json
4. Update TypeScript types in bootstrap-loader.ts

### Phase 2: Role-Specific Context (2-3 hours)
1. Implement getRoleProfile() function
2. Create buildRoleSpecificPrompt()
3. Update skill loading to use role priorities
4. Test with different role types

### Phase 3: Smart Memory Summarization (3-4 hours)
1. Create memory-summarizer.ts module
2. Implement categorizeByRelevance()
3. Add deduplication logic
4. Build dependency graph extraction
5. Test with actual memory data

### Phase 4: Mission State Tracking (2-3 hours)
1. Create mission-state.ts module
2. Implement phase determination logic
3. Add checkpoint loading/saving
4. Build warning generation
5. Test with different timeline scenarios

### Phase 5: Anti-Fabrication Injection (2-3 hours)
1. Create anti-fabrication-injector.ts
2. Parse CLAUDE.md into structured format
3. Implement generateProtocolPrompt()
4. Build automated validation
5. Test with validator role

### Phase 6: Integration (2-3 hours)
1. Update buildBootstrapPrompt() to use all components
2. Create comprehensive integration tests
3. Test with real agent spawning
4. Validate output quality
5. Measure token usage

### Phase 7: Documentation (1-2 hours)
1. Update README with new bootstrap features
2. Create configuration guide
3. Document role profiles
4. Add troubleshooting guide

**Total Estimated Time**: 13-20 hours

---

## Testing Strategy

### Unit Tests
```typescript
describe('Bootstrap Improvements', () => {
  describe('Role-Specific Context', () => {
    test('researcher gets research-focused context', () => {
      const profile = getRoleProfile('researcher', config);
      expect(profile.context_priorities.skills).toContain('research-web');
      expect(profile.identity.persona).toContain('researcher');
    });

    test('implementer gets implementation-focused context', () => {
      const profile = getRoleProfile('implementer', config);
      expect(profile.context_priorities.skills).toContain('validation');
      expect(profile.environment.output_path).toContain('code');
    });
  });

  describe('Memory Summarization', () => {
    test('deduplicates similar findings', () => {
      const memories = [
        { content: 'Finding: X is important', metadata: {} },
        { content: 'Finding: X is important', metadata: {} },
        { content: 'Finding: Y is important', metadata: {} }
      ];
      const deduped = deduplicateFindings(memories);
      expect(deduped.length).toBe(2);
    });

    test('ranks by role relevance', () => {
      const memories = mockMemories();
      const ranked = categorizeByRelevance(memories, 'researcher');
      expect(ranked[0].relevance_score).toBeGreaterThan(ranked[1].relevance_score);
    });

    test('extracts proven facts separately', () => {
      const memories = mockMemoriesWithEvidence();
      const validated = extractValidatedClaims(memories);
      expect(validated[0].evidence_level).toBe('proven');
    });
  });

  describe('Mission State', () => {
    test('calculates progress correctly', () => {
      const state = getCurrentMissionState(mockConfig({
        start: '2025-01-01T00:00:00Z',
        end: '2025-01-02T00:00:00Z',
        current: '2025-01-01T12:00:00Z'
      }));
      expect(state.timeline.progress_percentage).toBe(50);
    });

    test('determines phase based on progress', () => {
      const state = getCurrentMissionState(mockConfig({ progress: 45 }));
      expect(state.phase.current).toBe('implementation');
    });

    test('blocks agent spawning after final report time', () => {
      const state = getCurrentMissionState(mockConfig({
        finalReport: '2025-01-01T18:00:00Z',
        current: '2025-01-01T19:00:00Z'
      }));
      expect(state.should_spawn_agents).toBe(false);
      expect(state.warnings).toContain(expect.stringContaining('DO NOT spawn'));
    });
  });

  describe('Anti-Fabrication Protocol', () => {
    test('detects banned phrases', () => {
      const result = validateAgentOutput(
        'This is exceptional performance',
        'researcher'
      );
      expect(result.passed).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('exceptional'));
    });

    test('detects fabricated scores', () => {
      const result = validateAgentOutput('Quality is 85%', 'implementer');
      expect(result.passed).toBe(false);
      expect(result.violations).toContain(expect.stringContaining('fabricated scores'));
    });

    test('allows measured scores', () => {
      const result = validateAgentOutput(
        'Test coverage: 85% (measured via jest --coverage)',
        'implementer'
      );
      expect(result.passed).toBe(true);
    });
  });
});
```

### Integration Tests
```typescript
describe('Full Bootstrap Integration', () => {
  test('generates complete bootstrap for researcher', async () => {
    const context: AgentContext = {
      role: 'researcher',
      requestId: 'req-test-123',
      task: {
        objective: 'Research multi-agent frameworks',
        context: {},
        requirements: ['Find academic papers', 'Cite sources']
      }
    };

    const prompt = buildBootstrapPrompt(context, testConfig);

    // Verify all sections present
    expect(prompt).toContain('## Your Identity');
    expect(prompt).toContain('## Mission State');
    expect(prompt).toContain('## Prior Knowledge');
    expect(prompt).toContain('## ANTI-FABRICATION PROTOCOLS');

    // Verify role-specific content
    expect(prompt).toContain('researcher');
    expect(prompt).toContain('Must cite all sources');
    expect(prompt).toContain('research-web');
  });

  test('token usage stays within budget', () => {
    const prompt = buildBootstrapPrompt(testContext, testConfig);
    const estimatedTokens = prompt.length / 4;
    const budget = 10000; // Reasonable bootstrap budget

    expect(estimatedTokens).toBeLessThan(budget);
  });

  test('mission state updates dynamically', async () => {
    const state1 = getCurrentMissionState(configAt('2025-01-01T08:00:00Z'));
    const state2 = getCurrentMissionState(configAt('2025-01-01T20:00:00Z'));

    expect(state1.phase.current).not.toBe(state2.phase.current);
    expect(state2.urgency_level).not.toBe(state1.urgency_level);
  });
});
```

---

## Token Budget Analysis

### Current Bootstrap Token Usage
Approximate breakdown:
- Mission context: ~200 tokens
- Role info: ~100 tokens
- Task details: ~150 tokens
- Memory summary: ~500 tokens (basic)
- Skills: ~300 tokens
- **Total**: ~1,250 tokens

### Proposed Bootstrap Token Usage
Estimated breakdown:
- Role-specific identity: ~300 tokens
- Mission state (with timeline): ~400 tokens
- Smart memory summary: ~1,500 tokens (enhanced)
- Anti-fabrication protocols: ~800 tokens
- Skills (targeted): ~400 tokens
- Task details: ~200 tokens
- **Total**: ~3,600 tokens

### Token Efficiency Strategies
1. **Lazy loading**: Load full protocol only for validator role
2. **Compression**: Summarize older memories more aggressively
3. **Caching**: Reuse role profiles across agents
4. **Prioritization**: Critical info first, context last
5. **Truncation**: Hard limits with "... truncated" markers

### Budget Allocation Recommendations
- Anti-fabrication protocols: 800 tokens (critical)
- Mission state: 400 tokens (high priority)
- Role identity: 300 tokens (high priority)
- Memory summary: 1,500 tokens (adjustable)
- Skills: 400 tokens (role-filtered)
- Task context: 200 tokens (essential)
- **Reserve**: 400 tokens (overflow buffer)
- **Total Budget**: 4,000 tokens per bootstrap

This fits comfortably within typical context windows while providing comprehensive initialization.

---

## Risk Analysis

### Implementation Risks

1. **Token Budget Overflow**
   - Risk: Enhanced context exceeds model limits
   - Mitigation: Implement strict truncation with prioritization
   - Fallback: Degrade gracefully to simpler bootstrap

2. **Configuration Complexity**
   - Risk: Role profiles become difficult to maintain
   - Mitigation: Provide sensible defaults and validation
   - Fallback: Use generic profile if role-specific fails

3. **Memory Summarization Overhead**
   - Risk: Smart summarization too slow for real-time bootstrap
   - Mitigation: Implement caching and background pre-computation
   - Fallback: Use basic summarization if timeout

4. **Mission State Calculation Errors**
   - Risk: Time zone issues, clock skew, incorrect phase determination
   - Mitigation: Comprehensive time handling tests, UTC enforcement
   - Fallback: Default to "unknown" phase with no restrictions

5. **Anti-Fabrication Over-Enforcement**
   - Risk: False positives blocking legitimate outputs
   - Mitigation: Allow manual override with justification
   - Fallback: Warning mode instead of blocking mode

### Operational Risks

1. **Backward Compatibility**
   - Risk: Existing agents break with new bootstrap format
   - Mitigation: Feature flags and gradual rollout
   - Fallback: Support legacy bootstrap mode

2. **Performance Degradation**
   - Risk: Bootstrap takes too long, slowing agent spawning
   - Mitigation: Benchmark and optimize critical paths
   - Fallback: Async bootstrap with partial context

3. **Config File Management**
   - Risk: Multiple config files become inconsistent
   - Mitigation: Single source of truth with schema validation
   - Fallback: Runtime validation with error messages

---

## Success Metrics

### Quantitative Metrics
1. **Bootstrap time**: < 500ms per agent (target)
2. **Token usage**: 3,500-4,000 tokens (measured)
3. **Memory deduplication rate**: > 30% reduction (measured)
4. **Anti-fabrication violation detection**: > 95% accuracy (tested)
5. **Role-context relevance**: > 80% of injected info used by agent (logged)

### Qualitative Metrics
1. **Agent role adherence**: Agents stay within role boundaries
2. **Time awareness**: Agents respect mission deadlines
3. **Protocol compliance**: Reduced fabrication violations
4. **Context utilization**: Agents reference prior knowledge
5. **Developer satisfaction**: Easier to configure and debug

### Validation Approach
- Run 100 test bootstraps across all role types
- Measure token usage distribution
- Track anti-fabrication violation rates before/after
- Survey developers on configuration complexity
- Benchmark bootstrap performance

---

## Future Enhancements

### Beyond Initial Implementation

1. **LLM-Powered Memory Summarization**
   - Use smaller, faster model to generate intelligent summaries
   - Extract key insights from multiple memories
   - Generate natural language context instead of bullet points

2. **Dynamic Role Evolution**
   - Allow agents to request role changes mid-mission
   - Support hybrid roles (researcher-implementer)
   - Enable role specialization based on task

3. **Collaborative Memory**
   - Cross-agent memory sharing with permissions
   - Real-time memory updates during multi-agent work
   - Conflict detection in shared context

4. **Adaptive Token Budgets**
   - Increase budget for complex tasks
   - Reduce budget for simple tasks
   - Learn optimal allocation per role

5. **Mission Replay and Simulation**
   - Test bootstrap with simulated timelines
   - Replay past missions with different configurations
   - A/B test different bootstrap strategies

6. **Context Compression**
   - Use embedding-based semantic compression
   - Remove redundant information intelligently
   - Preserve critical details while reducing tokens

---

## Conclusion

These four improvements transform the bootstrap system from a generic context injector into a sophisticated, role-aware, time-conscious, evidence-based agent initialization framework.

**Key Outcomes**:
1. Agents receive tailored information for their specific role
2. Intelligent memory summarization provides relevant context
3. Mission state awareness prevents time-based errors
4. Systematic anti-fabrication enforcement improves output quality

**Implementation Priority**:
1. Anti-fabrication protocol injection (highest impact on quality)
2. Mission state tracking (prevents critical time errors)
3. Role-specific context (improves agent focus)
4. Smart memory summarization (enhances coordination)

**Next Steps**:
1. Review and validate proposals with team
2. Prioritize improvements based on mission criticality
3. Implement Phase 1 (configuration schema) as foundation
4. Iterate on phases 2-7 based on testing feedback
5. Deploy gradually with feature flags and monitoring

This research provides a concrete roadmap for improving agent bootstrap quality, compliance, and effectiveness within the claude-swarm framework.
