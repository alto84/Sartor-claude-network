/**
 * Skill Manifests - Evidence-Based Skills
 *
 * Defines manifests for:
 * - Evidence-Based Validation
 * - Evidence-Based Engineering
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

import {
  SkillManifest,
  SkillTier,
  SkillStatus,
  SkillCategory,
  TriggerType,
  ResourceType
} from '../../skill-types';

/**
 * Evidence-Based Validation Skill
 *
 * Validates claims and decisions using empirical evidence,
 * research data, and quantitative analysis.
 */
export const EVIDENCE_BASED_VALIDATION: SkillManifest = {
  // Identity
  id: 'evidence-based-validation',
  name: 'Evidence-Based Validation',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Validates claims, decisions, and proposals using empirical evidence, research data, and quantitative analysis. Prevents assumption-driven errors.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'validate|verify|evidence|proof|research|study|data',
      confidence: 0.8,
      priority: 10
    },
    {
      type: TriggerType.PATTERN,
      pattern: /is (this|that) (true|correct|valid|supported)/i,
      confidence: 0.85,
      priority: 9
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'need evidence to support this claim',
      confidence: 0.75,
      priority: 8
    },
    {
      type: TriggerType.KEYWORD,
      pattern: 'assumption|claim|hypothesis|assertion',
      confidence: 0.7,
      priority: 7
    }
  ],

  tier: SkillTier.SPECIALIST,

  // Relationships
  dependencies: [
    {
      skillId: 'research-assistant',
      version: '^1.0.0',
      required: false,
      loadTiming: 'lazy',
      fallback: 'web-search'
    },
    {
      skillId: 'data-analysis',
      version: '^2.0.0',
      required: false,
      loadTiming: 'lazy'
    }
  ],

  conflicts: [],

  alternatives: [
    'quick-fact-check',
    'peer-review'
  ],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `Evidence-Based Validation systematically evaluates claims, decisions, and proposals
    by gathering and analyzing empirical evidence. It prevents costly mistakes caused by assumptions
    and ensures decisions are grounded in verifiable data, research, and proven methodologies.`,

    useCases: [
      'Validating technical architecture decisions',
      'Verifying claims about tool capabilities or limitations',
      'Checking assumptions in project planning',
      'Evaluating proposed solutions against research',
      'Confirming best practices with empirical data',
      'Testing hypotheses before implementation',
      'Reviewing requirements for factual accuracy'
    ],

    antiPatterns: [
      'Using for subjective or creative decisions',
      'Applying to time-sensitive emergency situations',
      'Validating opinions or preferences',
      'Over-validating trivial decisions'
    ],

    interface: {
      inputs: [
        {
          name: 'claim',
          type: 'string',
          description: 'The claim, decision, or proposal to validate',
          required: true,
          examples: [
            'Firebase Realtime Database is faster than Firestore for real-time updates',
            'TypeScript reduces bugs by 15% compared to JavaScript',
            'Microservices are always better than monoliths'
          ]
        },
        {
          name: 'context',
          type: 'string',
          description: 'Context about the claim (domain, constraints, goals)',
          required: false,
          examples: [
            'Building a real-time chat application',
            'Team of 5 developers, 6-month timeline'
          ]
        },
        {
          name: 'evidenceLevel',
          type: '"high" | "medium" | "low"',
          description: 'Required level of evidence rigor',
          required: false,
          default: 'medium',
          examples: ['high', 'medium', 'low']
        }
      ],

      outputs: [
        {
          name: 'validated',
          type: 'boolean',
          description: 'Whether the claim is supported by evidence',
          required: true,
          examples: [true, false]
        },
        {
          name: 'confidence',
          type: 'number',
          description: 'Confidence level (0-1) in the validation',
          required: true,
          examples: [0.95, 0.7, 0.3]
        },
        {
          name: 'evidence',
          type: 'Evidence[]',
          description: 'Supporting or contradicting evidence',
          required: true,
          examples: []
        },
        {
          name: 'conclusion',
          type: 'string',
          description: 'Summary conclusion with recommendations',
          required: true,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'network',
          description: 'May fetch research papers, documentation, or studies',
          reversible: true
        }
      ],

      idempotent: true
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'extract-claims',
          description: 'Extract explicit and implicit claims from input',
          optional: false
        },
        {
          order: 2,
          action: 'identify-evidence-sources',
          description: 'Identify potential evidence sources (research, docs, data)',
          optional: false
        },
        {
          order: 3,
          action: 'gather-evidence',
          description: 'Collect evidence from identified sources',
          requiredSkills: ['research-assistant', 'web-search'],
          optional: false
        },
        {
          order: 4,
          action: 'analyze-evidence',
          description: 'Analyze quality, relevance, and credibility of evidence',
          requiredSkills: ['data-analysis'],
          optional: false
        },
        {
          order: 5,
          action: 'synthesize-conclusion',
          description: 'Synthesize findings into validated conclusion',
          optional: false
        }
      ],
      parallelizable: false,
      estimatedDuration: '10-30 seconds',
      retryStrategy: {
        maxAttempts: 2,
        backoffMs: 1000,
        backoffMultiplier: 2,
        maxBackoffMs: 5000,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT']
      }
    },

    examples: [
      {
        title: 'Validate Architecture Decision',
        description: 'Validate claim about database choice',
        input: {
          claim: 'Firebase Realtime Database is faster than Firestore for real-time chat',
          context: 'Building real-time chat with 1000+ concurrent users',
          evidenceLevel: 'high'
        },
        output: {
          validated: true,
          confidence: 0.85,
          evidence: [
            'Firebase RTDB latency: 50-100ms (Firebase docs)',
            'Firestore latency: 100-300ms (Firebase docs)',
            'Benchmark study shows 2-3x faster writes for RTDB'
          ],
          conclusion: 'VALIDATED: Firebase RTDB is faster for real-time updates...'
        }
      },
      {
        title: 'Challenge Unvalidated Claim',
        description: 'Test assumption about microservices',
        input: {
          claim: 'Microservices are always better than monoliths',
          evidenceLevel: 'medium'
        },
        output: {
          validated: false,
          confidence: 0.9,
          evidence: [
            'Research shows monoliths better for small teams (<10)',
            'Netflix case study: microservices for scale, complexity cost',
            'Survey: 60% microservice migrations regretted by small teams'
          ],
          conclusion: 'NOT VALIDATED: Context-dependent, often worse for small teams...'
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'NO_EVIDENCE_FOUND',
        description: 'No evidence could be found for the claim',
        recoverable: true,
        recovery: 'Broaden search, try alternative sources',
        fallback: 'Return inconclusive with recommendation for manual research'
      },
      {
        errorCode: 'CONFLICTING_EVIDENCE',
        description: 'Evidence strongly conflicts, no clear conclusion',
        recoverable: true,
        recovery: 'Weight evidence by quality and recency',
        fallback: 'Present both sides with confidence scores'
      },
      {
        errorCode: 'NETWORK_ERROR',
        description: 'Cannot access external research sources',
        recoverable: true,
        recovery: 'Retry with exponential backoff',
        fallback: 'Use cached evidence if available'
      }
    ]
  },

  // Level 3: Resources (lazy-loaded)
  resources: [
    {
      id: 'validation-criteria',
      type: ResourceType.SCHEMA,
      name: 'Evidence Quality Criteria',
      description: 'Criteria for evaluating evidence quality and credibility',
      path: 'resources/validation-criteria.json',
      size: 5120,
      format: 'application/json',
      loadStrategy: 'lazy'
    },
    {
      id: 'research-sources',
      type: ResourceType.REFERENCE_DATA,
      name: 'Trusted Research Sources',
      description: 'List of trusted research databases and journals',
      path: 'resources/research-sources.json',
      size: 8192,
      format: 'application/json',
      loadStrategy: 'lazy'
    },
    {
      id: 'validation-templates',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Validation Report Templates',
      description: 'Templates for generating validation reports',
      path: 'resources/validation-templates/',
      size: 15360,
      format: 'text/markdown',
      loadStrategy: 'on_request'
    }
  ],

  // Metadata
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: [
      'validation',
      'evidence',
      'research',
      'quality',
      'decision-making'
    ],
    category: SkillCategory.ANALYSIS,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['reasoning', 'research', 'analysis'],
        degradationStrategy: 'limited'
      }
    ],
    estimatedTokens: {
      level1: 48,
      level2: 520,
      level3Avg: 2000
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 12000,
    successRate: 0.92,
    executionCount: 0,
    failureCount: 0
  },

  // Memory integration
  memory: {
    stateRetention: 'session',
    cacheStrategy: {
      type: 'lru',
      maxSize: 10485760, // 10MB
      ttl: 3600000, // 1 hour
      evictionPolicy: 'age'
    },
    maxStateSize: 1048576 // 1MB
  }
};

/**
 * Evidence-Based Engineering Skill
 *
 * Applies evidence-based methodology to engineering decisions,
 * ensuring technical choices are grounded in data and research.
 */
export const EVIDENCE_BASED_ENGINEERING: SkillManifest = {
  // Identity
  id: 'evidence-based-engineering',
  name: 'Evidence-Based Engineering',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Applies empirical evidence and research to engineering decisions. Evaluates technical choices using benchmarks, case studies, and proven methodologies.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'architecture|design|implementation|technology choice|framework',
      confidence: 0.75,
      priority: 8
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(which|what|should (i|we)) (use|choose|implement)/i,
      confidence: 0.8,
      priority: 9
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'what is the best approach for this engineering problem',
      confidence: 0.75,
      priority: 7
    },
    {
      type: TriggerType.KEYWORD,
      pattern: 'benchmark|performance|scalability|reliability',
      confidence: 0.7,
      priority: 6
    }
  ],

  tier: SkillTier.SPECIALIST,

  // Relationships
  dependencies: [
    {
      skillId: 'evidence-based-validation',
      version: '^1.0.0',
      required: true,
      loadTiming: 'eager'
    },
    {
      skillId: 'architecture-analysis',
      version: '^1.0.0',
      required: false,
      loadTiming: 'lazy'
    },
    {
      skillId: 'benchmark-runner',
      version: '^1.0.0',
      required: false,
      loadTiming: 'lazy'
    }
  ],

  conflicts: [],

  alternatives: [
    'quick-engineering-decision',
    'best-practices-lookup'
  ],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `Evidence-Based Engineering applies scientific methodology to engineering decisions.
    It evaluates technical choices using benchmarks, case studies, research papers, and real-world
    data rather than hype, trends, or assumptions. Ensures engineering decisions are optimal for
    the specific context and requirements.`,

    useCases: [
      'Choosing between technology stacks or frameworks',
      'Evaluating architectural patterns for specific use cases',
      'Deciding on scalability strategies',
      'Selecting databases or storage solutions',
      'Comparing implementation approaches',
      'Making build vs buy decisions',
      'Evaluating third-party tools and libraries'
    ],

    antiPatterns: [
      'Using for creative or exploratory prototyping',
      'Applying to novel problems without precedent',
      'Making decisions where speed trumps optimization',
      'Choosing technologies for learning rather than production'
    ],

    interface: {
      inputs: [
        {
          name: 'problem',
          type: 'string',
          description: 'The engineering problem or decision to solve',
          required: true,
          examples: [
            'Choose between REST and GraphQL for our API',
            'Decide on deployment strategy for microservices'
          ]
        },
        {
          name: 'requirements',
          type: 'object',
          description: 'Technical and business requirements',
          required: true,
          examples: []
        },
        {
          name: 'constraints',
          type: 'object',
          description: 'Constraints (budget, timeline, team skills)',
          required: false,
          examples: []
        },
        {
          name: 'alternatives',
          type: 'string[]',
          description: 'Specific alternatives to evaluate',
          required: false,
          examples: []
        }
      ],

      outputs: [
        {
          name: 'recommendation',
          type: 'string',
          description: 'Recommended solution with justification',
          required: true,
          examples: []
        },
        {
          name: 'evaluation',
          type: 'Alternative[]',
          description: 'Evaluation of each alternative',
          required: true,
          examples: []
        },
        {
          name: 'tradeoffs',
          type: 'object',
          description: 'Key tradeoffs and decision factors',
          required: true,
          examples: []
        },
        {
          name: 'evidence',
          type: 'Evidence[]',
          description: 'Supporting evidence and benchmarks',
          required: true,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'network',
          description: 'May fetch benchmarks, documentation, case studies',
          reversible: true
        }
      ],

      idempotent: true
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'analyze-requirements',
          description: 'Analyze requirements and extract decision criteria',
          optional: false
        },
        {
          order: 2,
          action: 'identify-alternatives',
          description: 'Identify viable alternatives and approaches',
          optional: false
        },
        {
          order: 3,
          action: 'gather-evidence',
          description: 'Gather benchmarks, case studies, and research',
          requiredSkills: ['evidence-based-validation'],
          optional: false
        },
        {
          order: 4,
          action: 'evaluate-alternatives',
          description: 'Evaluate each alternative against criteria',
          requiredSkills: ['architecture-analysis'],
          optional: false
        },
        {
          order: 5,
          action: 'rank-and-recommend',
          description: 'Rank alternatives and provide recommendation',
          optional: false
        }
      ],
      parallelizable: true,
      estimatedDuration: '20-60 seconds',
      retryStrategy: {
        maxAttempts: 2,
        backoffMs: 2000,
        backoffMultiplier: 2,
        maxBackoffMs: 10000,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT']
      }
    },

    examples: [
      {
        title: 'Database Selection',
        description: 'Choose database for real-time application',
        input: {
          problem: 'Choose database for real-time collaborative editor',
          requirements: {
            realTime: true,
            scale: '10k concurrent users',
            consistency: 'eventual ok'
          },
          alternatives: ['Firebase RTDB', 'Firestore', 'MongoDB', 'PostgreSQL']
        },
        output: {
          recommendation: 'Firebase RTDB',
          evaluation: [],
          tradeoffs: {},
          evidence: []
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'INSUFFICIENT_EVIDENCE',
        description: 'Not enough evidence to make confident recommendation',
        recoverable: true,
        recovery: 'Broaden search, include case studies',
        fallback: 'Provide recommendation with caveats and suggest validation approach'
      },
      {
        errorCode: 'NO_CLEAR_WINNER',
        description: 'Multiple alternatives score equally',
        recoverable: true,
        recovery: 'Weight by secondary criteria',
        fallback: 'Present top 2-3 options with context-specific guidance'
      }
    ]
  },

  // Level 3: Resources
  resources: [
    {
      id: 'benchmark-database',
      type: ResourceType.REFERENCE_DATA,
      name: 'Technology Benchmarks Database',
      description: 'Curated benchmarks for common technologies',
      path: 'resources/benchmarks/',
      size: 102400,
      format: 'application/json',
      loadStrategy: 'lazy'
    },
    {
      id: 'case-studies',
      type: ResourceType.DOCUMENTATION,
      name: 'Engineering Case Studies',
      description: 'Real-world case studies and post-mortems',
      path: 'resources/case-studies/',
      size: 256000,
      format: 'text/markdown',
      loadStrategy: 'on_request'
    },
    {
      id: 'decision-matrix',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Decision Matrix Templates',
      description: 'Templates for engineering decision matrices',
      path: 'resources/decision-matrix.json',
      size: 10240,
      format: 'application/json',
      loadStrategy: 'immediate'
    }
  ],

  // Metadata
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: [
      'engineering',
      'architecture',
      'decision-making',
      'evidence',
      'benchmarks'
    ],
    category: SkillCategory.CODE,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['reasoning', 'analysis', 'technical'],
        degradationStrategy: 'limited'
      }
    ],
    estimatedTokens: {
      level1: 46,
      level2: 510,
      level3Avg: 3500
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 25000,
    successRate: 0.88,
    executionCount: 0,
    failureCount: 0
  },

  // Memory integration
  memory: {
    stateRetention: 'persistent',
    cacheStrategy: {
      type: 'lru',
      maxSize: 20971520, // 20MB
      ttl: 7200000, // 2 hours
      evictionPolicy: 'age'
    },
    maxStateSize: 2097152 // 2MB
  }
};

/**
 * All skill manifests
 */
export const SKILL_MANIFESTS: SkillManifest[] = [
  EVIDENCE_BASED_VALIDATION,
  EVIDENCE_BASED_ENGINEERING
];

/**
 * Get manifest by ID
 */
export function getSkillManifest(skillId: string): SkillManifest | undefined {
  return SKILL_MANIFESTS.find(m => m.id === skillId);
}

/**
 * Get all skill summaries (Level 1)
 */
export function getAllSkillSummaries() {
  return SKILL_MANIFESTS.map(manifest => ({
    id: manifest.id,
    version: manifest.version,
    summary: manifest.summary,
    triggers: manifest.triggers,
    tier: manifest.tier,
    dependencies: manifest.dependencies.map(d => d.skillId),
    estimatedTokens: manifest.metadata.estimatedTokens.level1
  }));
}
