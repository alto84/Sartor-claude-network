# Safety Research Workflow Manifest

This file contains the manifest definition that needs to be added to `/home/user/Sartor-claude-network/src/skills/skill-manifest.ts`.

## Instructions

1. Open `src/skills/skill-manifest.ts`
2. Find the line that starts with `/**\n * All skill manifests\n */`
3. Add the following manifest definition **BEFORE** that comment
4. Add `SAFETY_RESEARCH_WORKFLOW` to the `SKILL_MANIFESTS` array

## Manifest Definition

```typescript
/**
 * Safety Research Workflow Skill
 *
 * Conducts rigorous, evidence-based research with systematic validation
 * and multi-perspective analysis, producing findings that meet
 * medical/pharmaceutical-grade standards of evidence.
 */
export const SAFETY_RESEARCH_WORKFLOW: SkillManifest = {
  // Identity
  id: 'safety-research-workflow',
  name: 'Safety Research Workflow',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary:
    'Conducts rigorous, evidence-based research with systematic validation, quality gates, and multi-perspective analysis. Prevents fabricated citations and false consensus.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'research|investigate|study|analyze|evidence|citation|source',
      confidence: 0.85,
      priority: 10,
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(conduct|perform|do) (research|investigation|study|analysis)/i,
      confidence: 0.9,
      priority: 11,
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'need rigorous evidence-based research with quality validation',
      confidence: 0.8,
      priority: 9,
    },
    {
      type: TriggerType.KEYWORD,
      pattern: 'quality gate|validation|peer review|systematic review',
      confidence: 0.75,
      priority: 8,
    },
  ],

  tier: SkillTier.SPECIALIST,

  // Relationships
  dependencies: [
    {
      skillId: 'evidence-based-validation',
      version: '^1.0.0',
      required: true,
      loadTiming: 'eager',
    },
  ],

  conflicts: [],

  alternatives: ['quick-research', 'literature-review'],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `Safety Research Workflow conducts rigorous, evidence-based research following medical/pharmaceutical-grade standards. It systematically validates findings through quality gates, preserves disagreements rather than forcing consensus, maintains evidence hierarchy (empirical > documented > inferred > hypothetical), and explicitly documents limitations. Prevents common research anti-patterns like fabricated citations, invented statistics, and false consensus.`,

    useCases: [
      'High-stakes research requiring rigorous validation',
      'Multi-source synthesis with proper attribution',
      'Claims requiring external validation or peer review',
      'Citation authenticity verification',
      'Research with conflicting evidence sources',
      'Medical, financial, or safety-critical research',
      'Academic or scientific literature reviews',
    ],

    antiPatterns: [
      'Using for quick informal research',
      'Applying to purely creative or exploratory work',
      'Research with tight time constraints (truth over speed)',
      'Single-source fact checking (use evidence-based-validation)',
    ],

    interface: {
      inputs: [
        {
          name: 'question',
          type: 'string',
          description: 'Research question to investigate',
          required: true,
          examples: [
            'What is the comparative efficacy of Firebase RTDB vs Firestore for real-time applications?',
            'What are the security implications of using serverless architectures?',
          ],
        },
        {
          name: 'targetEvidenceLevel',
          type: '"empirical" | "documented" | "inferred" | "hypothetical"',
          description: 'Minimum evidence level required',
          required: false,
          default: 'documented',
          examples: ['empirical', 'documented'],
        },
        {
          name: 'qualityGates',
          type: 'QualityGate[]',
          description: 'Custom quality gates to apply',
          required: false,
          examples: [],
        },
      ],

      outputs: [
        {
          name: 'report',
          type: 'ResearchReport',
          description: 'Complete research report with findings, conflicts, and limitations',
          required: true,
          examples: [],
        },
        {
          name: 'gateResults',
          type: 'GateResults',
          description: 'Quality gate validation results',
          required: true,
          examples: [],
        },
        {
          name: 'valid',
          type: 'boolean',
          description: 'Whether report passes all blocking quality gates',
          required: true,
          examples: [true, false],
        },
      ],

      sideEffects: [
        {
          type: 'network',
          description: 'Fetches research papers, documentation, and data sources',
          reversible: true,
        },
      ],

      idempotent: true,
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'create-research-plan',
          description: 'Decompose question and define methodology',
          optional: false,
        },
        {
          order: 2,
          action: 'gather-evidence',
          description: 'Collect evidence from multiple sources with verification',
          requiredSkills: ['evidence-based-validation'],
          optional: false,
        },
        {
          order: 3,
          action: 'evaluate-claims',
          description: 'Assess each claim with evidence level and confidence',
          optional: false,
        },
        {
          order: 4,
          action: 'identify-conflicts',
          description: 'Find and preserve disagreements in evidence',
          optional: false,
        },
        {
          order: 5,
          action: 'synthesize-findings',
          description: 'Combine findings without forcing false consensus',
          optional: false,
        },
        {
          order: 6,
          action: 'run-quality-gates',
          description: 'Validate report against quality gates',
          optional: false,
        },
      ],
      parallelizable: false,
      estimatedDuration: '30-120 seconds',
      retryStrategy: {
        maxAttempts: 2,
        backoffMs: 2000,
        backoffMultiplier: 2,
        maxBackoffMs: 10000,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SOURCE_UNAVAILABLE'],
      },
    },

    examples: [
      {
        title: 'Technology Comparison Research',
        description: 'Research comparative performance of databases',
        input: {
          question: 'Is Firebase RTDB faster than Firestore for real-time updates?',
          targetEvidenceLevel: 'empirical',
        },
        output: {
          report: {
            findings: [
              {
                statement: 'Firebase RTDB shows 50-100ms latency vs Firestore 100-300ms',
                evidenceLevel: 'documented',
                confidence: 0.85,
                sources: ['Firebase official docs'],
              },
            ],
            conflicts: [],
            confidence: 0.85,
          },
          valid: true,
        },
      },
      {
        title: 'Conflicting Evidence Research',
        description: 'Research with contradictory sources',
        input: {
          question: 'Are microservices better than monoliths?',
          targetEvidenceLevel: 'documented',
        },
        output: {
          report: {
            findings: [],
            conflicts: [
              {
                type: 'disagreement',
                description: 'Sources conflict on scalability vs complexity tradeoffs',
                preserved: true,
              },
            ],
            confidence: 0.4,
          },
          valid: true,
        },
      },
    ],

    errorHandling: [
      {
        errorCode: 'QUALITY_GATE_FAILED',
        description: 'Report failed blocking quality gate',
        recoverable: true,
        recovery: 'Address quality gate issues and regenerate report',
        fallback: 'Return report with gate failures documented',
      },
      {
        errorCode: 'FABRICATED_SOURCE_DETECTED',
        description: 'Placeholder or fabricated source detected',
        recoverable: false,
        recovery: 'Remove fabricated sources and acknowledge gap',
        fallback: 'Reject report - truth over speed',
      },
      {
        errorCode: 'INSUFFICIENT_EVIDENCE',
        description: 'Not enough evidence to meet target evidence level',
        recoverable: true,
        recovery: 'Lower evidence level or extend search',
        fallback: 'Return report with lower confidence and documented gaps',
      },
    ],
  },

  // Level 3: Resources
  resources: [
    {
      id: 'quality-gates',
      type: ResourceType.SCHEMA,
      name: 'Standard Quality Gates',
      description: 'Standard quality gates for research validation',
      path: 'resources/quality-gates.json',
      size: 10240,
      format: 'application/json',
      loadStrategy: 'immediate',
    },
    {
      id: 'evidence-hierarchy',
      type: ResourceType.REFERENCE_DATA,
      name: 'Evidence Hierarchy Standards',
      description: 'Evidence quality hierarchy and credibility weights',
      path: 'resources/evidence-hierarchy.json',
      size: 5120,
      format: 'application/json',
      loadStrategy: 'immediate',
    },
    {
      id: 'research-templates',
      type: ResourceType.DOCUMENTATION,
      name: 'Research Report Templates',
      description: 'Templates for generating research reports',
      path: 'resources/research-templates/',
      size: 20480,
      format: 'text/markdown',
      loadStrategy: 'lazy',
    },
  ],

  // Metadata
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: ['research', 'validation', 'evidence', 'quality-gates', 'anti-fabrication', 'safety'],
    category: SkillCategory.ANALYSIS,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['reasoning', 'research', 'analysis', 'validation'],
        degradationStrategy: 'limited',
      },
    ],
    estimatedTokens: {
      level1: 50,
      level2: 580,
      level3Avg: 2500,
    },
  },

  // Performance
  performance: {
    averageExecutionMs: 45000,
    successRate: 0.88,
    executionCount: 0,
    failureCount: 0,
  },

  // Memory integration
  memory: {
    stateRetention: 'session',
    cacheStrategy: {
      type: 'lru',
      maxSize: 10485760, // 10MB
      ttl: 3600000, // 1 hour
      evictionPolicy: 'age',
    },
    maxStateSize: 1048576, // 1MB
  },
};
```

## Update to SKILL_MANIFESTS Array

Change this:

```typescript
export const SKILL_MANIFESTS: SkillManifest[] = [
  EVIDENCE_BASED_VALIDATION,
  EVIDENCE_BASED_ENGINEERING,
  AGENT_COMMUNICATION,
  MULTI_AGENT_ORCHESTRATION,
  MCP_SERVER_DEVELOPMENT,
  DISTRIBUTED_SYSTEMS_DEBUGGING,
];
```

To this:

```typescript
export const SKILL_MANIFESTS: SkillManifest[] = [
  EVIDENCE_BASED_VALIDATION,
  EVIDENCE_BASED_ENGINEERING,
  AGENT_COMMUNICATION,
  MULTI_AGENT_ORCHESTRATION,
  MCP_SERVER_DEVELOPMENT,
  DISTRIBUTED_SYSTEMS_DEBUGGING,
  SAFETY_RESEARCH_WORKFLOW,
];
```

## Summary

The manifest has been exported from `src/skills/index.ts` (already done).
You just need to add the manifest definition and array entry to `src/skills/skill-manifest.ts`.
