/**
 * Skill Manifests - Evidence-Based Skills & Agent Coordination
 *
 * Defines manifests for:
 * - Evidence-Based Validation
 * - Evidence-Based Engineering
 * - Agent Communication System
 * - Multi-Agent Orchestration
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
} from '../skill-types';

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
 * Agent Communication System Skill
 *
 * Handles inter-agent messaging with quality gates,
 * delivery confirmation, and failure recovery.
 */
export const AGENT_COMMUNICATION: SkillManifest = {
  // Identity
  id: 'agent-communication',
  name: 'Agent Communication System',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Handles inter-agent messaging with quality gates, delivery confirmation, and failure recovery. Ensures reliable communication between specialized agents with validation and retry mechanisms.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'message|communicate|send|broadcast|channel',
      confidence: 0.8,
      priority: 9
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(send|broadcast|communicate) (to|with) (agent|worker|specialist)/i,
      confidence: 0.85,
      priority: 10
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'need to communicate with another agent',
      confidence: 0.75,
      priority: 8
    },
    {
      type: TriggerType.KEYWORD,
      pattern: 'inter-agent|agent-to-agent|message queue|event bus',
      confidence: 0.8,
      priority: 7
    }
  ],

  tier: SkillTier.FOUNDATION,

  // Relationships
  dependencies: [
    {
      skillId: 'evidence-based-validation',
      version: '^1.0.0',
      required: true,
      loadTiming: 'eager'
    }
  ],

  conflicts: [],

  alternatives: [
    'direct-invocation',
    'event-driven-messaging'
  ],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `Agent Communication System provides reliable, validated messaging between specialized agents.
    It implements quality gates to ensure messages are well-formed, delivery confirmation to guarantee receipt,
    and failure recovery mechanisms to handle network issues or agent unavailability. All messages are validated
    against schemas before transmission, ensuring type safety and preventing downstream errors.`,

    useCases: [
      'Sending tasks from orchestrator to worker agents',
      'Broadcasting status updates to multiple agents',
      'Requesting specialized processing from expert agents',
      'Coordinating multi-agent workflows',
      'Publishing events to subscribed agents',
      'Implementing request-response patterns',
      'Managing agent lifecycle notifications'
    ],

    antiPatterns: [
      'Using for synchronous blocking calls (use direct invocation)',
      'Sending unvalidated or unstructured messages',
      'Broadcasting to all agents without filtering',
      'Ignoring delivery confirmation or error responses',
      'Creating circular message dependencies'
    ],

    interface: {
      inputs: [
        {
          name: 'message',
          type: 'AgentMessage',
          description: 'The message to send with metadata and payload',
          required: true,
          examples: [
            '{ type: "TASK", to: "code-analyzer", payload: {...}, priority: "high" }'
          ]
        },
        {
          name: 'deliveryMode',
          type: '"unicast" | "multicast" | "broadcast"',
          description: 'Message delivery mode',
          required: false,
          default: 'unicast',
          examples: ['unicast', 'multicast', 'broadcast']
        },
        {
          name: 'reliability',
          type: '"at-most-once" | "at-least-once" | "exactly-once"',
          description: 'Delivery guarantee level',
          required: false,
          default: 'at-least-once',
          examples: ['at-most-once', 'at-least-once', 'exactly-once']
        },
        {
          name: 'timeout',
          type: 'number',
          description: 'Timeout in milliseconds for delivery confirmation',
          required: false,
          default: 5000,
          examples: [5000, 10000, 30000]
        }
      ],

      outputs: [
        {
          name: 'messageId',
          type: 'string',
          description: 'Unique identifier for the sent message',
          required: true,
          examples: ['msg_abc123', 'msg_xyz789']
        },
        {
          name: 'delivered',
          type: 'boolean',
          description: 'Whether message was successfully delivered',
          required: true,
          examples: [true, false]
        },
        {
          name: 'confirmations',
          type: 'DeliveryConfirmation[]',
          description: 'Delivery confirmations from recipient agents',
          required: true,
          examples: []
        },
        {
          name: 'errors',
          type: 'MessageError[]',
          description: 'Any errors encountered during delivery',
          required: false,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'messaging',
          description: 'Sends messages to other agents via message bus',
          reversible: false
        },
        {
          type: 'state',
          description: 'Updates message delivery tracking state',
          reversible: false
        }
      ],

      idempotent: false
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'validate-message',
          description: 'Validate message format, schema, and required fields',
          requiredSkills: ['evidence-based-validation'],
          optional: false
        },
        {
          order: 2,
          action: 'assign-message-id',
          description: 'Assign unique message ID and timestamp',
          optional: false
        },
        {
          order: 3,
          action: 'apply-quality-gates',
          description: 'Check message quality gates (size, priority, rate limits)',
          optional: false
        },
        {
          order: 4,
          action: 'route-message',
          description: 'Route message to appropriate channel or recipient(s)',
          optional: false
        },
        {
          order: 5,
          action: 'wait-for-confirmation',
          description: 'Wait for delivery confirmation within timeout',
          optional: false
        },
        {
          order: 6,
          action: 'handle-failures',
          description: 'Apply retry logic or failure recovery if needed',
          optional: true
        }
      ],
      parallelizable: true,
      estimatedDuration: '100-500 milliseconds',
      retryStrategy: {
        maxAttempts: 3,
        backoffMs: 500,
        backoffMultiplier: 2,
        maxBackoffMs: 5000,
        retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'AGENT_BUSY']
      }
    },

    examples: [
      {
        title: 'Send Task to Worker',
        description: 'Send analysis task to code analyzer agent',
        input: {
          message: {
            type: 'TASK',
            to: 'code-analyzer',
            from: 'orchestrator',
            payload: {
              action: 'analyze',
              files: ['/src/app.ts']
            },
            priority: 'high'
          },
          deliveryMode: 'unicast',
          reliability: 'at-least-once',
          timeout: 10000
        },
        output: {
          messageId: 'msg_task_001',
          delivered: true,
          confirmations: [
            {
              agentId: 'code-analyzer',
              timestamp: '2025-12-06T10:00:01Z',
              status: 'RECEIVED'
            }
          ],
          errors: []
        }
      },
      {
        title: 'Broadcast Status Update',
        description: 'Broadcast completion status to all interested agents',
        input: {
          message: {
            type: 'STATUS_UPDATE',
            from: 'build-agent',
            payload: {
              event: 'BUILD_COMPLETE',
              buildId: 'build_123',
              status: 'success'
            }
          },
          deliveryMode: 'broadcast',
          reliability: 'at-most-once'
        },
        output: {
          messageId: 'msg_broadcast_001',
          delivered: true,
          confirmations: [
            { agentId: 'monitoring', status: 'RECEIVED' },
            { agentId: 'deployment', status: 'RECEIVED' }
          ],
          errors: []
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'MESSAGE_VALIDATION_FAILED',
        description: 'Message failed schema or quality validation',
        recoverable: false,
        recovery: 'Fix message format and retry',
        fallback: 'Return validation errors to sender'
      },
      {
        errorCode: 'AGENT_NOT_FOUND',
        description: 'Target agent does not exist or is unavailable',
        recoverable: true,
        recovery: 'Retry after backoff or route to alternative agent',
        fallback: 'Return error to sender with alternative suggestions'
      },
      {
        errorCode: 'DELIVERY_TIMEOUT',
        description: 'No confirmation received within timeout period',
        recoverable: true,
        recovery: 'Retry with exponential backoff',
        fallback: 'Mark as failed and notify sender'
      },
      {
        errorCode: 'MESSAGE_TOO_LARGE',
        description: 'Message exceeds maximum size limits',
        recoverable: false,
        recovery: 'Split message into chunks or use reference pattern',
        fallback: 'Return size limit error to sender'
      }
    ]
  },

  // Level 3: Resources
  resources: [
    {
      id: 'message-schemas',
      type: ResourceType.SCHEMA,
      name: 'Message Type Schemas',
      description: 'JSON schemas for all supported message types',
      path: 'resources/message-schemas.json',
      size: 15360,
      format: 'application/json',
      loadStrategy: 'immediate'
    },
    {
      id: 'routing-rules',
      type: ResourceType.REFERENCE_DATA,
      name: 'Message Routing Rules',
      description: 'Rules for routing messages to appropriate agents',
      path: 'resources/routing-rules.json',
      size: 8192,
      format: 'application/json',
      loadStrategy: 'immediate'
    },
    {
      id: 'delivery-patterns',
      type: ResourceType.DOCUMENTATION,
      name: 'Delivery Pattern Examples',
      description: 'Common messaging patterns and best practices',
      path: 'resources/delivery-patterns.md',
      size: 20480,
      format: 'text/markdown',
      loadStrategy: 'lazy'
    }
  ],

  // Metadata
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: [
      'communication',
      'messaging',
      'agents',
      'reliability',
      'coordination'
    ],
    category: SkillCategory.INFRASTRUCTURE,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['messaging', 'validation', 'error-handling'],
        degradationStrategy: 'limited'
      }
    ],
    estimatedTokens: {
      level1: 52,
      level2: 540,
      level3Avg: 1500
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 250,
    successRate: 0.96,
    executionCount: 0,
    failureCount: 0
  },

  // Memory integration
  memory: {
    stateRetention: 'session',
    cacheStrategy: {
      type: 'lru',
      maxSize: 5242880, // 5MB
      ttl: 1800000, // 30 minutes
      evictionPolicy: 'age'
    },
    maxStateSize: 524288 // 512KB
  }
};

/**
 * Multi-Agent Orchestration Skill
 *
 * Coordinates specialized workers using intent-based delegation
 * with result synthesis and failure recovery.
 */
export const MULTI_AGENT_ORCHESTRATION: SkillManifest = {
  // Identity
  id: 'multi-agent-orchestration',
  name: 'Multi-Agent Orchestration',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Coordinates specialized workers using intent-based delegation with result synthesis. Manages parallel execution, dependency resolution, and failure recovery across multiple agents.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'orchestrate|delegate|coordinate|parallelize|synthesize',
      confidence: 0.85,
      priority: 10
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(coordinate|orchestrate|manage) (multiple|several|parallel) (agents|workers|tasks)/i,
      confidence: 0.9,
      priority: 11
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'need to coordinate work across specialized agents',
      confidence: 0.8,
      priority: 9
    },
    {
      type: TriggerType.KEYWORD,
      pattern: 'multi-agent|worker pool|task distribution|result aggregation',
      confidence: 0.75,
      priority: 8
    }
  ],

  tier: SkillTier.INFRASTRUCTURE,

  // Relationships
  dependencies: [
    {
      skillId: 'agent-communication',
      version: '^1.0.0',
      required: true,
      loadTiming: 'eager'
    },
    {
      skillId: 'evidence-based-validation',
      version: '^1.0.0',
      required: true,
      loadTiming: 'eager'
    }
  ],

  conflicts: [],

  alternatives: [
    'sequential-processing',
    'monolithic-agent'
  ],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `Multi-Agent Orchestration coordinates specialized worker agents to accomplish complex tasks
    that require diverse expertise. It uses intent-based delegation to assign work to the most appropriate agents,
    manages parallel execution with dependency resolution, synthesizes results from multiple workers, and implements
    failure recovery to handle agent errors or timeouts. This enables scalable, resilient multi-agent systems.`,

    useCases: [
      'Coordinating code analysis across multiple file types',
      'Parallelizing test execution across test suites',
      'Distributing build tasks to specialized build agents',
      'Orchestrating multi-step workflows with dependencies',
      'Managing data processing pipelines with parallel stages',
      'Coordinating research across multiple data sources',
      'Synthesizing reports from multiple specialist agents'
    ],

    antiPatterns: [
      'Using for simple, single-agent tasks',
      'Over-fragmenting tasks into too many micro-agents',
      'Creating tight coupling between orchestrator and workers',
      'Ignoring agent failures or partial results',
      'Failing to handle dependency cycles in task graphs'
    ],

    interface: {
      inputs: [
        {
          name: 'intent',
          type: 'string',
          description: 'High-level intent describing the goal to accomplish',
          required: true,
          examples: [
            'Analyze entire codebase for security vulnerabilities',
            'Run all tests and generate coverage report'
          ]
        },
        {
          name: 'tasks',
          type: 'Task[]',
          description: 'Decomposed tasks with dependencies and requirements',
          required: false,
          examples: []
        },
        {
          name: 'constraints',
          type: 'object',
          description: 'Constraints (timeout, max parallelism, resource limits)',
          required: false,
          examples: [
            '{ maxParallelism: 5, timeout: 60000, maxMemory: "2GB" }'
          ]
        },
        {
          name: 'synthesisStrategy',
          type: '"merge" | "aggregate" | "reduce" | "custom"',
          description: 'Strategy for combining worker results',
          required: false,
          default: 'merge',
          examples: ['merge', 'aggregate', 'reduce']
        }
      ],

      outputs: [
        {
          name: 'result',
          type: 'SynthesizedResult',
          description: 'Synthesized result from all workers',
          required: true,
          examples: []
        },
        {
          name: 'workerResults',
          type: 'WorkerResult[]',
          description: 'Individual results from each worker',
          required: true,
          examples: []
        },
        {
          name: 'execution',
          type: 'ExecutionMetrics',
          description: 'Execution metrics (duration, parallelism, failures)',
          required: true,
          examples: []
        },
        {
          name: 'errors',
          type: 'OrchestratorError[]',
          description: 'Errors encountered during orchestration',
          required: false,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'agent-invocation',
          description: 'Invokes multiple worker agents',
          reversible: false
        },
        {
          type: 'state',
          description: 'Updates orchestration state and task tracking',
          reversible: false
        }
      ],

      idempotent: false
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'decompose-intent',
          description: 'Decompose intent into concrete, assignable tasks',
          optional: false
        },
        {
          order: 2,
          action: 'build-task-graph',
          description: 'Build task dependency graph and identify parallelizable tasks',
          optional: false
        },
        {
          order: 3,
          action: 'assign-workers',
          description: 'Assign tasks to appropriate specialized workers',
          optional: false
        },
        {
          order: 4,
          action: 'execute-tasks',
          description: 'Execute tasks respecting dependencies and parallelism limits',
          requiredSkills: ['agent-communication'],
          optional: false
        },
        {
          order: 5,
          action: 'monitor-progress',
          description: 'Monitor worker progress and handle failures',
          optional: false
        },
        {
          order: 6,
          action: 'synthesize-results',
          description: 'Synthesize worker results using specified strategy',
          requiredSkills: ['evidence-based-validation'],
          optional: false
        }
      ],
      parallelizable: true,
      estimatedDuration: '5-60 seconds',
      retryStrategy: {
        maxAttempts: 2,
        backoffMs: 1000,
        backoffMultiplier: 2,
        maxBackoffMs: 10000,
        retryableErrors: ['WORKER_TIMEOUT', 'WORKER_FAILURE', 'PARTIAL_FAILURE']
      }
    },

    examples: [
      {
        title: 'Parallel Code Analysis',
        description: 'Analyze codebase using specialized analyzers',
        input: {
          intent: 'Analyze codebase for quality, security, and performance issues',
          tasks: [
            { id: 'lint', worker: 'linter', input: 'all-files' },
            { id: 'security', worker: 'security-scanner', input: 'all-files' },
            { id: 'perf', worker: 'performance-analyzer', input: 'all-files', dependencies: [] }
          ],
          constraints: {
            maxParallelism: 3,
            timeout: 60000
          },
          synthesisStrategy: 'merge'
        },
        output: {
          result: {
            issues: [],
            summary: 'Found 5 lint issues, 2 security vulnerabilities, 3 performance problems'
          },
          workerResults: [
            { worker: 'linter', status: 'success', issues: 5 },
            { worker: 'security-scanner', status: 'success', issues: 2 },
            { worker: 'performance-analyzer', status: 'success', issues: 3 }
          ],
          execution: {
            duration: 12500,
            parallelism: 3,
            failures: 0
          },
          errors: []
        }
      },
      {
        title: 'Multi-Stage Pipeline',
        description: 'Execute build, test, and deploy pipeline',
        input: {
          intent: 'Build, test, and deploy application',
          tasks: [
            { id: 'build', worker: 'builder' },
            { id: 'unit-test', worker: 'test-runner', dependencies: ['build'] },
            { id: 'integration-test', worker: 'test-runner', dependencies: ['build'] },
            { id: 'deploy', worker: 'deployer', dependencies: ['unit-test', 'integration-test'] }
          ],
          synthesisStrategy: 'aggregate'
        },
        output: {
          result: {
            deployed: true,
            version: 'v1.2.3',
            tests: { passed: 145, failed: 0 }
          },
          workerResults: [],
          execution: {
            duration: 45000,
            parallelism: 2,
            failures: 0
          },
          errors: []
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'WORKER_NOT_AVAILABLE',
        description: 'Required worker agent is not available',
        recoverable: true,
        recovery: 'Assign task to alternative worker or queue for retry',
        fallback: 'Return partial results with missing worker notification'
      },
      {
        errorCode: 'DEPENDENCY_CYCLE',
        description: 'Task dependencies contain a cycle',
        recoverable: false,
        recovery: 'Break cycle by removing or reordering dependencies',
        fallback: 'Return error with cycle details'
      },
      {
        errorCode: 'WORKER_TIMEOUT',
        description: 'Worker exceeded timeout limit',
        recoverable: true,
        recovery: 'Retry with different worker or increased timeout',
        fallback: 'Continue with partial results, mark task as failed'
      },
      {
        errorCode: 'SYNTHESIS_FAILED',
        description: 'Unable to synthesize results from workers',
        recoverable: true,
        recovery: 'Try alternative synthesis strategy',
        fallback: 'Return raw worker results without synthesis'
      },
      {
        errorCode: 'PARTIAL_FAILURE',
        description: 'Some workers succeeded, others failed',
        recoverable: true,
        recovery: 'Retry failed workers or continue with partial results',
        fallback: 'Return successful results with failure notifications'
      }
    ]
  },

  // Level 3: Resources
  resources: [
    {
      id: 'worker-registry',
      type: ResourceType.REFERENCE_DATA,
      name: 'Worker Agent Registry',
      description: 'Registry of available worker agents and their capabilities',
      path: 'resources/worker-registry.json',
      size: 20480,
      format: 'application/json',
      loadStrategy: 'immediate'
    },
    {
      id: 'delegation-patterns',
      type: ResourceType.DOCUMENTATION,
      name: 'Delegation Pattern Library',
      description: 'Common delegation and orchestration patterns',
      path: 'resources/delegation-patterns.md',
      size: 30720,
      format: 'text/markdown',
      loadStrategy: 'lazy'
    },
    {
      id: 'task-graph-engine',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Task Graph Engine',
      description: 'Engine for building and executing task dependency graphs',
      path: 'resources/task-graph-engine.ts',
      size: 51200,
      format: 'text/typescript',
      loadStrategy: 'lazy'
    },
    {
      id: 'synthesis-strategies',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Result Synthesis Strategies',
      description: 'Strategies for combining results from multiple workers',
      path: 'resources/synthesis-strategies.ts',
      size: 25600,
      format: 'text/typescript',
      loadStrategy: 'lazy'
    }
  ],

  // Metadata
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: [
      'orchestration',
      'coordination',
      'multi-agent',
      'parallel',
      'delegation',
      'synthesis'
    ],
    category: SkillCategory.INFRASTRUCTURE,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['reasoning', 'coordination', 'parallel-processing'],
        degradationStrategy: 'limited'
      }
    ],
    estimatedTokens: {
      level1: 51,
      level2: 580,
      level3Avg: 4500
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 15000,
    successRate: 0.91,
    executionCount: 0,
    failureCount: 0
  },

  // Memory integration
  memory: {
    stateRetention: 'session',
    cacheStrategy: {
      type: 'lru',
      maxSize: 15728640, // 15MB
      ttl: 3600000, // 1 hour
      evictionPolicy: 'age'
    },
    maxStateSize: 1048576 // 1MB
  }
};

/**
 * MCP Server Development Skill
 *
 * Builds MCP servers with proper patterns, error handling,
 * and protocol compliance.
 */
export const MCP_SERVER_DEVELOPMENT: SkillManifest = {
  // Identity
  id: 'mcp-server-development',
  name: 'MCP Server Development',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Build Model Context Protocol servers with proper stdio discipline, input validation, error handling, and security checks. Validates servers against MCP quality standards.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'mcp server|mcp tool|model context protocol',
      confidence: 0.9,
      priority: 11
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(build|create|develop|validate) (mcp|model context protocol) (server|tool)/i,
      confidence: 0.95,
      priority: 12
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'need to build an MCP server',
      confidence: 0.85,
      priority: 10
    },
    {
      type: TriggerType.KEYWORD,
      pattern: 'stdio|json-rpc|tool handler|mcp validation',
      confidence: 0.75,
      priority: 8
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
    }
  ],

  conflicts: [],

  alternatives: [
    'generic-api-development',
    'sdk-development'
  ],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `MCP Server Development provides tools and validation for building Model Context Protocol servers
    that reliably expose tools and resources to AI assistants. It enforces critical patterns like stdio discipline
    (stdout for protocol only, stderr for logging), comprehensive input validation, proper error handling with MCP
    error codes, and security checks for common vulnerabilities. Helps prevent protocol corruption and ensures
    servers are production-ready.`,

    useCases: [
      'Building new MCP servers for custom integrations',
      'Validating existing MCP servers for protocol compliance',
      'Generating typed handler code from JSON schemas',
      'Testing MCP tools with comprehensive test cases',
      'Analyzing handlers for security vulnerabilities',
      'Debugging MCP communication failures',
      'Implementing proper error handling and validation'
    ],

    antiPatterns: [
      'Using console.log() instead of console.error() (corrupts stdio)',
      'Skipping input validation against schemas',
      'Returning thrown exceptions instead of structured errors',
      'Implementing tools without security considerations',
      'Writing to stdout directly outside JSON-RPC protocol'
    ],

    interface: {
      inputs: [
        {
          name: 'config',
          type: 'MCPServerConfig',
          description: 'Complete server configuration with tools, resources, and prompts',
          required: true,
          examples: [
            '{ name: "filesystem", version: "1.0.0", tools: [...] }'
          ]
        },
        {
          name: 'tool',
          type: 'MCPToolDefinition',
          description: 'Individual tool definition to validate',
          required: false,
          examples: []
        },
        {
          name: 'handlerCode',
          type: 'string',
          description: 'Handler source code to analyze for security issues',
          required: false,
          examples: []
        },
        {
          name: 'testCases',
          type: 'TestCase[]',
          description: 'Test cases for validating tool behavior',
          required: false,
          examples: []
        }
      ],

      outputs: [
        {
          name: 'validationReport',
          type: 'ValidationReport',
          description: 'Validation results with errors, warnings, and suggestions',
          required: true,
          examples: []
        },
        {
          name: 'securityReport',
          type: 'SecurityReport',
          description: 'Security analysis with vulnerabilities and risk score',
          required: false,
          examples: []
        },
        {
          name: 'testReport',
          type: 'TestReport',
          description: 'Test execution results with coverage analysis',
          required: false,
          examples: []
        },
        {
          name: 'generatedCode',
          type: 'string',
          description: 'Generated handler code skeleton',
          required: false,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'none',
          description: 'Pure validation and code generation, no side effects',
          reversible: true
        }
      ],

      idempotent: true
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'validate-server-config',
          description: 'Validate server metadata and overall structure',
          optional: false
        },
        {
          order: 2,
          action: 'validate-tools',
          description: 'Validate each tool definition, schema, and naming',
          optional: false
        },
        {
          order: 3,
          action: 'analyze-stdio-discipline',
          description: 'Check for console.log() and stdout violations',
          optional: false
        },
        {
          order: 4,
          action: 'analyze-security',
          description: 'Scan for command injection, path traversal, and other vulnerabilities',
          optional: false
        },
        {
          order: 5,
          action: 'validate-error-handling',
          description: 'Ensure proper try-catch and isError usage',
          optional: false
        },
        {
          order: 6,
          action: 'generate-recommendations',
          description: 'Provide actionable suggestions for improvements',
          optional: false
        }
      ],
      parallelizable: true,
      estimatedDuration: '1-5 seconds',
      retryStrategy: {
        maxAttempts: 1,
        backoffMs: 0,
        backoffMultiplier: 1,
        maxBackoffMs: 0,
        retryableErrors: []
      }
    },

    examples: [
      {
        title: 'Validate MCP Server',
        description: 'Validate complete server configuration',
        input: {
          config: {
            name: 'filesystem-server',
            version: '1.0.0',
            tools: [
              {
                name: 'read_file',
                description: 'Read contents of a file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', description: 'File path' }
                  },
                  required: ['path']
                },
                handler: async () => ({ content: [] })
              }
            ]
          }
        },
        output: {
          validationReport: {
            valid: true,
            errors: [],
            warnings: [],
            suggestions: ['Consider adding output schema'],
            score: 0.95
          }
        }
      },
      {
        title: 'Security Analysis',
        description: 'Analyze handler for security vulnerabilities',
        input: {
          handlerCode: 'const result = exec(input.command); console.log(result);'
        },
        output: {
          securityReport: {
            safe: false,
            vulnerabilities: [
              {
                type: 'command-injection',
                severity: 'critical',
                location: 'handler code',
                description: 'Potential command injection via exec',
                remediation: 'Validate and sanitize inputs'
              },
              {
                type: 'command-injection',
                severity: 'critical',
                location: 'handler code',
                description: 'console.log() corrupts stdio',
                remediation: 'Use console.error() instead'
              }
            ],
            riskScore: 0.5,
            recommendations: []
          }
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'INVALID_SCHEMA',
        description: 'JSON Schema is malformed or incomplete',
        recoverable: true,
        recovery: 'Fix schema structure and required fields',
        fallback: 'Return validation errors with specific fixes needed'
      },
      {
        errorCode: 'STDIO_VIOLATION',
        description: 'Found console.log() or stdout writes',
        recoverable: true,
        recovery: 'Replace with console.error() for logging',
        fallback: 'Flag as critical error preventing deployment'
      },
      {
        errorCode: 'SECURITY_VULNERABILITY',
        description: 'Detected potential security issue',
        recoverable: true,
        recovery: 'Implement input validation and sanitization',
        fallback: 'Block deployment until fixed'
      }
    ]
  },

  // Level 3: Resources
  resources: [
    {
      id: 'mcp-specification',
      type: ResourceType.DOCUMENTATION,
      name: 'MCP Protocol Specification',
      description: 'Official Model Context Protocol specification',
      path: 'resources/mcp-spec.md',
      size: 51200,
      format: 'text/markdown',
      loadStrategy: 'lazy'
    },
    {
      id: 'security-patterns',
      type: ResourceType.REFERENCE_DATA,
      name: 'Security Vulnerability Patterns',
      description: 'Common security vulnerabilities to check for',
      path: 'resources/security-patterns.json',
      size: 10240,
      format: 'application/json',
      loadStrategy: 'immediate'
    },
    {
      id: 'handler-templates',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Tool Handler Templates',
      description: 'Code templates for common handler patterns',
      path: 'resources/handler-templates/',
      size: 20480,
      format: 'text/typescript',
      loadStrategy: 'lazy'
    },
    {
      id: 'test-templates',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Test Case Templates',
      description: 'Templates for comprehensive tool testing',
      path: 'resources/test-templates/',
      size: 15360,
      format: 'text/typescript',
      loadStrategy: 'lazy'
    }
  ],

  // Metadata
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: [
      'mcp',
      'protocol',
      'validation',
      'security',
      'server-development',
      'stdio'
    ],
    category: SkillCategory.CODE,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['code-analysis', 'security', 'validation'],
        degradationStrategy: 'limited'
      }
    ],
    estimatedTokens: {
      level1: 49,
      level2: 580,
      level3Avg: 3000
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 2000,
    successRate: 0.98,
    executionCount: 0,
    failureCount: 0
  },

  // Memory integration
  memory: {
    stateRetention: 'session',
    cacheStrategy: {
      type: 'lru',
      maxSize: 5242880, // 5MB
      ttl: 3600000, // 1 hour
      evictionPolicy: 'age'
    },
    maxStateSize: 524288 // 512KB
  }
};

/**
 * Distributed Systems Debugging Skill
 *
 * Systematically investigates distributed system failures through
 * evidence-based hypothesis testing and isolation.
 */
export const DISTRIBUTED_SYSTEMS_DEBUGGING: SkillManifest = {
  // Identity
  id: 'distributed-systems-debugging',
  name: 'Distributed Systems Debugging',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Systematically investigates distributed system failures by reconstructing causal chains, isolating failure domains, and testing hypotheses with evidence rather than assumptions.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'debug|failure|distributed|race condition|timeout|partition',
      confidence: 0.8,
      priority: 9
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(debug|investigate|diagnose) (distributed|multi-agent|coordination) (failure|issue|problem)/i,
      confidence: 0.9,
      priority: 10
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'need to debug a distributed system failure',
      confidence: 0.85,
      priority: 9
    },
    {
      type: TriggerType.KEYWORD,
      pattern: 'non-deterministic|reproduce|causal chain|root cause',
      confidence: 0.75,
      priority: 8
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
    }
  ],

  conflicts: [],

  alternatives: [
    'quick-debug',
    'log-analysis'
  ],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `Distributed Systems Debugging applies systematic methodology to investigate failures in
    distributed systems. It reconstructs causal chains from observations, isolates failure domains through
    controlled experiments, and validates hypotheses using failure injection. Unlike traditional debugging,
    this skill acknowledges non-determinism and requires evidence-based reasoning rather than assumptions.`,

    useCases: [
      'Investigating race conditions or timing-dependent failures',
      'Diagnosing network partition or communication failures',
      'Analyzing coordination failures between agents',
      'Debugging non-deterministic behavior',
      'Finding root cause in multi-component failures',
      'Reproducing intermittent failures',
      'Understanding cascade failures'
    ],

    antiPatterns: [
      'Debugging single-component systems (use traditional debugging)',
      'Quick fixes without understanding root cause',
      'Assuming deterministic behavior',
      'Debugging production without reproduction environment',
      'Jumping to conclusions without evidence'
    ],

    interface: {
      inputs: [
        {
          name: 'symptoms',
          type: 'string[]',
          description: 'Observed symptoms of the failure',
          required: true,
          examples: [
            'Agent A times out when communicating with Agent B',
            'Messages delivered out of order 20% of the time'
          ]
        },
        {
          name: 'dataSources',
          type: 'DataSource[]',
          description: 'Sources of observational data (logs, metrics, traces)',
          required: true,
          examples: []
        },
        {
          name: 'components',
          type: 'string[]',
          description: 'Components involved in the system',
          required: false,
          examples: ['agent-a', 'agent-b', 'message-bus', 'coordinator']
        }
      ],

      outputs: [
        {
          name: 'report',
          type: 'DebugReport',
          description: 'Comprehensive debug report with hypotheses and recommendations',
          required: true,
          examples: []
        },
        {
          name: 'rootCause',
          type: 'Hypothesis',
          description: 'Root cause if identified with high confidence',
          required: false,
          examples: []
        },
        {
          name: 'unknowns',
          type: 'string[]',
          description: 'What could not be determined',
          required: true,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'testing',
          description: 'May inject failures into test environment',
          reversible: true
        },
        {
          type: 'data-collection',
          description: 'Collects and stores observational data',
          reversible: false
        }
      ],

      idempotent: true
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'collect-observations',
          description: 'Gather evidence from all data sources systematically',
          optional: false
        },
        {
          order: 2,
          action: 'reconstruct-causal-chains',
          description: 'Build timeline of events to understand sequence',
          optional: false
        },
        {
          order: 3,
          action: 'form-hypotheses',
          description: 'Generate testable hypotheses based on evidence',
          requiredSkills: ['evidence-based-validation'],
          optional: false
        },
        {
          order: 4,
          action: 'rank-hypotheses',
          description: 'Order hypotheses by evidence strength',
          optional: false
        },
        {
          order: 5,
          action: 'test-hypotheses',
          description: 'Validate top hypotheses using controlled experiments',
          optional: false
        },
        {
          order: 6,
          action: 'perform-isolation',
          description: 'Isolate minimal reproduction case',
          optional: true
        },
        {
          order: 7,
          action: 'generate-report',
          description: 'Generate comprehensive report with unknowns',
          optional: false
        }
      ],
      parallelizable: false,
      estimatedDuration: '5-30 minutes',
      retryStrategy: {
        maxAttempts: 1,
        backoffMs: 0,
        backoffMultiplier: 1,
        maxBackoffMs: 0,
        retryableErrors: []
      }
    },

    examples: [
      {
        title: 'Debug Race Condition',
        description: 'Investigate timing-dependent message delivery failure',
        input: {
          symptoms: [
            'Messages sometimes delivered out of order',
            'Only occurs under high load'
          ],
          dataSources: [
            { type: 'logs', components: ['agent-a', 'agent-b', 'message-bus'] },
            { type: 'traces', components: ['message-bus'] }
          ],
          components: ['agent-a', 'agent-b', 'message-bus']
        },
        output: {
          report: {
            symptoms: ['Messages sometimes delivered out of order', 'Only occurs under high load'],
            hypotheses: [
              {
                description: 'Race condition in message bus queuing',
                confidence: 0.85,
                testable: true,
                test: 'Inject delays to alter timing'
              }
            ],
            rootCause: { description: 'Race condition in message bus queuing', confidence: 0.85 },
            unknowns: [],
            recommendations: ['Add sequence numbers to messages', 'Implement total ordering']
          }
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'NO_OBSERVATIONS',
        description: 'No observational data could be collected',
        recoverable: false,
        recovery: 'Enable logging/tracing and reproduce failure',
        fallback: 'Return error indicating insufficient data'
      },
      {
        errorCode: 'CANNOT_REPRODUCE',
        description: 'Failure cannot be reproduced',
        recoverable: true,
        recovery: 'Collect more observations during natural occurrence',
        fallback: 'Acknowledge non-determinism, provide best-effort analysis'
      },
      {
        errorCode: 'ISOLATION_FAILED',
        description: 'Cannot isolate minimal reproduction',
        recoverable: true,
        recovery: 'Document full reproduction case',
        fallback: 'Provide analysis based on complete system'
      }
    ]
  },

  // Level 3: Resources
  resources: [
    {
      id: 'failure-patterns',
      type: ResourceType.REFERENCE_DATA,
      name: 'Common Distributed System Failure Patterns',
      description: 'Library of common failure patterns and their signatures',
      path: 'resources/failure-patterns.json',
      size: 51200,
      format: 'application/json',
      loadStrategy: 'lazy'
    },
    {
      id: 'hypothesis-templates',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Hypothesis Templates',
      description: 'Templates for generating testable hypotheses',
      path: 'resources/hypothesis-templates.json',
      size: 20480,
      format: 'application/json',
      loadStrategy: 'lazy'
    },
    {
      id: 'failure-injection-library',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Failure Injection Library',
      description: 'Pre-built failure injection scenarios',
      path: 'resources/failure-injections.ts',
      size: 40960,
      format: 'text/typescript',
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
      'debugging',
      'distributed-systems',
      'failure-analysis',
      'evidence-based',
      'hypothesis-testing',
      'isolation',
      'root-cause'
    ],
    category: SkillCategory.ANALYSIS,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['reasoning', 'analysis', 'debugging'],
        degradationStrategy: 'limited'
      }
    ],
    estimatedTokens: {
      level1: 49,
      level2: 560,
      level3Avg: 3500
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 180000, // 3 minutes
    successRate: 0.87,
    executionCount: 0,
    failureCount: 0
  },

  // Memory integration
  memory: {
    stateRetention: 'session',
    cacheStrategy: {
      type: 'lru',
      maxSize: 20971520, // 20MB
      ttl: 3600000, // 1 hour
      evictionPolicy: 'age'
    },
    maxStateSize: 2097152 // 2MB
  }
};

/**
 * Refinement Loop Skill
 *
 * Core refinement mechanism based on Poetiq's approach.
 * Iteratively refines outputs through generate-evaluate-refine cycles.
 */
export const REFINEMENT_LOOP: SkillManifest = {
  // Identity
  id: 'refinement-loop',
  name: 'Refinement Loop',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Core iterative refinement mechanism using generate-evaluate-refine cycles. Self-auditing with confidence tracking, process supervision, and cost awareness. Foundation for any non-trivial task.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'refine|iterate|improve|polish|enhance quality',
      confidence: 0.75,
      priority: 7
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(iteratively|repeatedly) (refine|improve|enhance)/i,
      confidence: 0.85,
      priority: 9
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'need to iteratively improve the output quality',
      confidence: 0.8,
      priority: 8
    },
    {
      type: TriggerType.KEYWORD,
      pattern: 'generate-evaluate-refine|self-audit|confidence threshold',
      confidence: 0.8,
      priority: 8
    }
  ],

  tier: SkillTier.FOUNDATION,

  // Relationships
  dependencies: [],

  conflicts: [],

  alternatives: [
    'single-pass-generation',
    'manual-refinement'
  ],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `Refinement Loop implements Poetiq's generate-evaluate-refine pattern for iterative quality improvement.
    It generates an initial candidate, evaluates it for quality, and refines it based on feedback until a confidence
    threshold is reached. Features self-auditing (knows when to stop), process supervision (tracks every step for
    learning), cost awareness (respects budget limits), and confidence tracking (stops when good enough). This is
    THE standard mechanism for executing any non-trivial task that requires quality assurance.`,

    useCases: [
      'Generating high-quality code that meets specific requirements',
      'Creating comprehensive documentation with iterative improvements',
      'Designing system architectures with refinement cycles',
      'Writing research reports with evidence-based validation',
      'Developing test suites with coverage improvement',
      'Crafting API designs with quality gates',
      'Any task where quality matters more than speed'
    ],

    antiPatterns: [
      'Using for trivial tasks that don\'t need refinement',
      'Setting confidenceThreshold too high (>0.95) causing infinite loops',
      'Ignoring cost budget leading to runaway expenses',
      'Not providing meaningful evaluation functions',
      'Using when first-draft quality is sufficient'
    ],

    interface: {
      inputs: [
        {
          name: 'generate',
          type: '() => Promise<T>',
          description: 'Function to generate initial candidate',
          required: true,
          examples: [
            'async () => generateCode(requirements)',
            'async () => createArchitectureDesign(specs)'
          ]
        },
        {
          name: 'evaluate',
          type: '(candidate: T) => Promise<EvaluationResult>',
          description: 'Function to evaluate candidate quality and provide feedback',
          required: true,
          examples: [
            'async (code) => runLinterAndTests(code)',
            'async (design) => validateAgainstRequirements(design)'
          ]
        },
        {
          name: 'refine',
          type: '(candidate: T, feedback: Feedback) => Promise<T>',
          description: 'Function to refine candidate based on feedback',
          required: true,
          examples: [
            'async (code, feedback) => applyFixes(code, feedback)',
            'async (design, feedback) => incorporateFeedback(design, feedback)'
          ]
        },
        {
          name: 'config',
          type: 'RefinementConfig',
          description: 'Configuration for the refinement loop',
          required: true,
          examples: [
            '{ maxIterations: 5, confidenceThreshold: 0.9, processSupervision: true }'
          ]
        }
      ],

      outputs: [
        {
          name: 'candidate',
          type: 'T',
          description: 'Final refined candidate',
          required: true,
          examples: []
        },
        {
          name: 'confidence',
          type: 'number',
          description: 'Final confidence score (0-1)',
          required: true,
          examples: [0.92, 0.85, 0.78]
        },
        {
          name: 'iterations',
          type: 'number',
          description: 'Total iterations performed',
          required: true,
          examples: [3, 5, 2]
        },
        {
          name: 'converged',
          type: 'boolean',
          description: 'Whether confidence threshold was reached',
          required: true,
          examples: [true, false]
        },
        {
          name: 'stopReason',
          type: 'string',
          description: 'Why the loop stopped',
          required: true,
          examples: ['confidence', 'maxIterations', 'budget', 'timeout', 'noImprovement']
        },
        {
          name: 'processTrace',
          type: 'ProcessStep[]',
          description: 'Detailed process trace (if supervision enabled)',
          required: false,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'computation',
          description: 'Executes generate/evaluate/refine functions multiple times',
          reversible: false
        },
        {
          type: 'cost',
          description: 'May incur API costs based on iterations',
          reversible: false
        }
      ],

      idempotent: false
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'generate-initial',
          description: 'Generate initial candidate using generate function',
          optional: false
        },
        {
          order: 2,
          action: 'evaluate-initial',
          description: 'Evaluate initial candidate for quality and feedback',
          optional: false
        },
        {
          order: 3,
          action: 'check-continuation',
          description: 'Check if refinement should continue (self-audit)',
          optional: false
        },
        {
          order: 4,
          action: 'refine-candidate',
          description: 'Refine candidate based on feedback',
          optional: true
        },
        {
          order: 5,
          action: 'evaluate-refined',
          description: 'Evaluate refined candidate',
          optional: true
        },
        {
          order: 6,
          action: 'repeat-or-finish',
          description: 'Repeat steps 3-5 or finish if stopping criteria met',
          optional: false
        }
      ],
      parallelizable: false,
      estimatedDuration: 'Variable (depends on iterations and function complexity)',
      retryStrategy: {
        maxAttempts: 1,
        backoffMs: 0,
        backoffMultiplier: 1,
        maxBackoffMs: 0,
        retryableErrors: []
      }
    },

    examples: [
      {
        title: 'Refine Code Quality',
        description: 'Iteratively improve code until it passes quality gates',
        input: {
          generate: 'async () => generateFunction(requirements)',
          evaluate: 'async (code) => ({ score: runLinter(code), feedback: getIssues(code) })',
          refine: 'async (code, fb) => applyFix(code, fb)',
          config: { maxIterations: 5, confidenceThreshold: 0.9, processSupervision: true }
        },
        output: {
          candidate: '// High-quality code...',
          confidence: 0.92,
          iterations: 3,
          converged: true,
          stopReason: 'confidence',
          totalCost: 150
        }
      },
      {
        title: 'Architecture Design Refinement',
        description: 'Refine architecture design based on requirements validation',
        input: {
          generate: 'async () => createInitialDesign()',
          evaluate: 'async (design) => validateRequirements(design)',
          refine: 'async (design, fb) => improveDesign(design, fb)',
          config: { maxIterations: 3, confidenceThreshold: 0.85, costBudget: 500 }
        },
        output: {
          candidate: '// Refined architecture...',
          confidence: 0.87,
          iterations: 2,
          converged: true,
          stopReason: 'confidence',
          totalCost: 320
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'TIMEOUT',
        description: 'Refinement loop exceeded timeout',
        recoverable: false,
        recovery: 'Return best candidate so far',
        fallback: 'Return partial result with timeout indication'
      },
      {
        errorCode: 'BUDGET_EXCEEDED',
        description: 'Cost budget exceeded',
        recoverable: false,
        recovery: 'Stop and return best candidate',
        fallback: 'Return result with budget exceeded warning'
      },
      {
        errorCode: 'NO_IMPROVEMENT',
        description: 'Multiple iterations without improvement',
        recoverable: false,
        recovery: 'Stop refinement and return current candidate',
        fallback: 'Return result indicating plateau reached'
      },
      {
        errorCode: 'GENERATION_FAILED',
        description: 'Generate function failed',
        recoverable: true,
        recovery: 'Retry generation with backoff',
        fallback: 'Throw error to caller'
      },
      {
        errorCode: 'EVALUATION_FAILED',
        description: 'Evaluate function failed',
        recoverable: true,
        recovery: 'Retry evaluation or skip iteration',
        fallback: 'Use previous evaluation score'
      }
    ]
  },

  // Level 3: Resources
  resources: [
    {
      id: 'refinement-patterns',
      type: ResourceType.DOCUMENTATION,
      name: 'Refinement Patterns Guide',
      description: 'Common patterns for effective refinement loops',
      path: 'resources/refinement-patterns.md',
      size: 20480,
      format: 'text/markdown',
      loadStrategy: 'lazy'
    },
    {
      id: 'evaluation-strategies',
      type: ResourceType.CODE_TEMPLATE,
      name: 'Evaluation Strategy Templates',
      description: 'Templates for building effective evaluators',
      path: 'resources/evaluation-strategies.ts',
      size: 15360,
      format: 'text/typescript',
      loadStrategy: 'lazy'
    },
    {
      id: 'refinement-examples',
      type: ResourceType.EXAMPLES,
      name: 'Refinement Loop Examples',
      description: 'Real-world examples of refinement loops',
      path: 'resources/refinement-examples/',
      size: 30720,
      format: 'text/typescript',
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
      'refinement',
      'iteration',
      'quality',
      'self-audit',
      'confidence',
      'process-supervision',
      'cost-aware'
    ],
    category: SkillCategory.INFRASTRUCTURE,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['reasoning', 'iteration', 'self-audit'],
        degradationStrategy: 'limited'
      }
    ],
    estimatedTokens: {
      level1: 50,
      level2: 580,
      level3Avg: 2000
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 0, // Variable based on functions
    successRate: 0.95,
    executionCount: 0,
    failureCount: 0
  },

  // Memory integration
  memory: {
    stateRetention: 'session',
    cacheStrategy: {
      type: 'lru',
      maxSize: 5242880, // 5MB
      ttl: 1800000, // 30 minutes
      evictionPolicy: 'age'
    },
    maxStateSize: 524288 // 512KB
  }
};

/**
 * Safety Research Workflow Skill (placeholder for export compatibility)
 */
export const SAFETY_RESEARCH_WORKFLOW: SkillManifest = {
  id: 'safety-research-workflow',
  name: 'Safety Research Workflow',
  version: '1.0.0',
  summary: 'Placeholder manifest - see safety-research-workflow.ts for implementation',
  triggers: [],
  tier: SkillTier.SPECIALIST,
  dependencies: [],
  conflicts: [],
  alternatives: [],
  instructions: {
    description: 'See safety-research-workflow.ts',
    useCases: [],
    antiPatterns: [],
    interface: {
      inputs: [],
      outputs: [],
      sideEffects: [],
      idempotent: true
    },
    procedure: {
      steps: [],
      parallelizable: false,
      estimatedDuration: '0',
      retryStrategy: {
        maxAttempts: 1,
        backoffMs: 0,
        backoffMultiplier: 1,
        maxBackoffMs: 0,
        retryableErrors: []
      }
    },
    examples: [],
    errorHandling: []
  },
  resources: [],
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: ['placeholder'],
    category: SkillCategory.RESEARCH,
    modelCompatibility: [],
    estimatedTokens: { level1: 0, level2: 0, level3Avg: 0 }
  },
  performance: {
    averageExecutionMs: 0,
    successRate: 1,
    executionCount: 0,
    failureCount: 0
  },
  memory: {
    stateRetention: 'session',
    cacheStrategy: {
      type: 'lru',
      maxSize: 0,
      ttl: 0,
      evictionPolicy: 'age'
    },
    maxStateSize: 0
  }
};

/**
 * Self-Improvement Feedback Mechanism
 *
 * Learns from execution outcomes to extract patterns, refine strategies,
 * and continuously improve performance through lifelong memory.
 */
export const SELF_IMPROVEMENT: SkillManifest = {
  // Identity
  id: 'self-improvement',
  name: 'Self-Improvement Feedback Mechanism',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Learns from every execution by extracting patterns from successful outcomes, maintaining lifelong memory of strategies, and continuously refining skills based on accumulated evidence and feedback.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'learn|improve|pattern|feedback|refine skill',
      confidence: 0.75,
      priority: 7
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(learn from|extract patterns from) (execution|outcome|feedback)/i,
      confidence: 0.85,
      priority: 9
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'need to learn from past executions and improve',
      confidence: 0.8,
      priority: 8
    }
  ],

  tier: SkillTier.FOUNDATION,

  // Relationships
  dependencies: [
    {
      skillId: 'evidence-based-validation',
      version: '^1.0.0',
      required: true,
      loadTiming: 'lazy'
    }
  ],

  conflicts: [],

  alternatives: [
    'manual-improvement',
    'static-patterns'
  ],

  // Level 2: Instructions (~500 tokens)
  instructions: {
    description: `Self-Improvement Feedback Mechanism implements a learning system that extracts patterns from
    execution outcomes, maintains lifelong memory of learned strategies, and continuously refines skills based on
    accumulated evidence. Based on Reflexion (verbal RL in episodic memory), SOAR (learning from search traces),
    and ArcMemo (lifelong memory). Enables continuous improvement through evidence-based pattern extraction.`,

    useCases: [
      'Learning from successful task executions',
      'Extracting reusable patterns from process traces',
      'Refining skills based on accumulated feedback',
      'Recommending strategies based on context',
      'Maintaining lifelong learning across sessions',
      'Identifying optimization opportunities',
      'Building institutional knowledge'
    ],

    antiPatterns: [
      'Learning from single data points',
      'Applying patterns without context validation',
      'Ignoring negative feedback',
      'Over-generalizing from limited evidence',
      'Failing to track confidence levels'
    ],

    interface: {
      inputs: [
        {
          name: 'outcome',
          type: 'ExecutionOutcome',
          description: 'Record of task execution with process trace',
          required: true,
          examples: []
        },
        {
          name: 'context',
          type: 'string',
          description: 'Context for pattern matching and recommendations',
          required: false,
          examples: []
        },
        {
          name: 'feedback',
          type: 'Feedback[]',
          description: 'Feedback for skill refinement',
          required: false,
          examples: []
        }
      ],

      outputs: [
        {
          name: 'patterns',
          type: 'LearnedPattern[]',
          description: 'Extracted patterns with evidence and success rates',
          required: true,
          examples: []
        },
        {
          name: 'recommendations',
          type: 'PatternRecommendation[]',
          description: 'Context-relevant strategy recommendations',
          required: false,
          examples: []
        },
        {
          name: 'updates',
          type: 'SkillUpdate[]',
          description: 'Proposed skill refinements',
          required: false,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'state',
          description: 'Persists patterns to memory system',
          reversible: false
        }
      ],

      idempotent: false
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'record-outcome',
          description: 'Record execution outcome with complete process trace',
          optional: false
        },
        {
          order: 2,
          action: 'extract-patterns',
          description: 'Extract patterns from successful executions',
          optional: false
        },
        {
          order: 3,
          action: 'validate-patterns',
          description: 'Validate patterns against evidence and calculate confidence',
          optional: false
        },
        {
          order: 4,
          action: 'persist-memory',
          description: 'Persist patterns to lifelong memory system',
          optional: false
        },
        {
          order: 5,
          action: 'generate-recommendations',
          description: 'Generate context-relevant recommendations',
          optional: true
        }
      ],
      parallelizable: false,
      estimatedDuration: '1-5 seconds',
      retryStrategy: {
        maxAttempts: 2,
        backoffMs: 1000,
        backoffMultiplier: 2,
        maxBackoffMs: 5000,
        retryableErrors: ['PERSISTENCE_ERROR']
      }
    },

    examples: [
      {
        title: 'Learn from Successful Execution',
        description: 'Extract patterns from successful task completion',
        input: {
          outcome: {
            taskId: 'task_001',
            skillUsed: 'code-analysis',
            success: true,
            processTrace: []
          }
        },
        output: {
          patterns: [
            {
              context: 'analyzing TypeScript code',
              strategy: 'Start with type checking, then static analysis',
              successRate: 0.9,
              evidence: ['task_001', 'task_002']
            }
          ]
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'INSUFFICIENT_EVIDENCE',
        description: 'Not enough data to extract reliable patterns',
        recoverable: true,
        recovery: 'Continue collecting outcomes until threshold reached',
        fallback: 'Return empty pattern set with notification'
      },
      {
        errorCode: 'PERSISTENCE_ERROR',
        description: 'Failed to persist patterns to memory',
        recoverable: true,
        recovery: 'Retry with exponential backoff',
        fallback: 'Keep patterns in-memory for current session'
      }
    ]
  },

  // Level 3: Resources
  resources: [
    {
      id: 'pattern-library',
      type: ResourceType.REFERENCE_DATA,
      name: 'Learned Pattern Library',
      description: 'Repository of learned patterns with evidence',
      path: 'resources/patterns/',
      size: 102400,
      format: 'application/json',
      loadStrategy: 'lazy'
    }
  ],

  // Metadata
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: [
      'learning',
      'improvement',
      'patterns',
      'feedback',
      'memory',
      'reflexion',
      'lifelong-learning'
    ],
    category: SkillCategory.INFRASTRUCTURE,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['reasoning', 'pattern-recognition', 'learning'],
        degradationStrategy: 'limited'
      }
    ],
    estimatedTokens: {
      level1: 52,
      level2: 550,
      level3Avg: 2000
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 2000,
    successRate: 0.94,
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
 * Roadmap Skill - Dynamic Implementation Plan Access
 *
 * Provides progressive access to the implementation roadmap,
 * allowing any agent to query "What should I work on?"
 */
export const ROADMAP_SKILL: SkillManifest = {
  // Identity
  id: 'roadmap-skill',
  name: 'Dynamic Roadmap Skill',
  version: '1.0.0',

  // Level 1: Summary (always loaded, ~50 tokens)
  summary: 'Provides dynamic access to implementation roadmap. Any agent can query current phase, next tasks, and progress. Tracks task status automatically with hooks integration.',

  triggers: [
    {
      type: TriggerType.KEYWORD,
      pattern: 'what should I work on|next task|roadmap|current phase|implementation plan',
      confidence: 0.9,
      priority: 10
    },
    {
      type: TriggerType.PATTERN,
      pattern: /(what|which) (task|work|phase)/i,
      confidence: 0.7,
      priority: 7
    },
    {
      type: TriggerType.SEMANTIC,
      pattern: 'show me the implementation status',
      confidence: 0.8,
      priority: 8
    }
  ],

  tier: SkillTier.FOUNDATION,

  // Relationships
  dependencies: [],
  conflicts: [],
  alternatives: ['static-documentation'],

  // Level 2: Instructions (~400 tokens)
  instructions: {
    description: `Roadmap Skill provides dynamic, stateful access to the implementation plan defined in IMPLEMENTATION_ORDER.md.
    It enables any subagent to query "What should I work on?" and receive context-aware task recommendations. The skill
    tracks progress automatically through hooks integration, maintaining a persistent state file that records task completions,
    agent assignments, and refinement loops. This ensures all agents have a shared understanding of project status and priorities.`,

    useCases: [
      'Agent queries "What should I work on next?"',
      'Displaying current phase and progress at session start',
      'Tracking task completions across multiple agents',
      'Identifying blockers and unmet entry conditions',
      'Generating progress reports for stakeholders',
      'Coordinating parallel work across agent teams'
    ],

    antiPatterns: [
      'Manually updating roadmap state without using the API',
      'Skipping phases without meeting exit criteria',
      'Marking tasks complete without validation',
      'Ignoring entry conditions for phases'
    ],

    interface: {
      inputs: [
        {
          name: 'query',
          type: 'string',
          description: 'Optional query type: "next-tasks" | "current-phase" | "summary" | "all-phases"',
          required: false,
          examples: ['next-tasks', 'current-phase', 'summary']
        }
      ],

      outputs: [
        {
          name: 'summary',
          type: 'string',
          description: 'Quick roadmap summary (~100 tokens) for agent context',
          required: true,
          examples: ['📍 Current: Phase 4...']
        },
        {
          name: 'nextTasks',
          type: 'RoadmapTask[]',
          description: 'Array of next tasks to work on',
          required: false,
          examples: []
        },
        {
          name: 'currentPhase',
          type: 'RoadmapPhase',
          description: 'Current phase details',
          required: false,
          examples: []
        }
      ],

      sideEffects: [
        {
          type: 'file-system',
          description: 'Reads/writes roadmap state to .claude/roadmap-state.json',
          reversible: true
        }
      ],

      idempotent: false
    },

    procedure: {
      steps: [
        {
          order: 1,
          action: 'load-state',
          description: 'Load current roadmap state from persistent file',
          optional: false
        },
        {
          order: 2,
          action: 'determine-phase',
          description: 'Identify current phase based on completion status',
          optional: false
        },
        {
          order: 3,
          action: 'filter-tasks',
          description: 'Filter pending tasks by priority and phase',
          optional: false
        },
        {
          order: 4,
          action: 'generate-summary',
          description: 'Create concise summary for agent context',
          optional: false
        }
      ],
      parallelizable: false,
      estimatedDuration: '<50ms',
      retryStrategy: {
        maxAttempts: 3,
        backoffMs: 100,
        backoffMultiplier: 2,
        maxBackoffMs: 1000,
        retryableErrors: ['FILE_READ_ERROR']
      }
    },

    examples: [
      {
        title: 'Query Next Tasks',
        description: 'Agent asks what to work on',
        input: {},
        output: {
          summary: '📍 Current: Phase 4 - Memory System Implementation...',
          nextTasks: [
            { id: 'task-4-1', description: 'Implement Hot Tier...' }
          ]
        }
      }
    ],

    errorHandling: [
      {
        errorCode: 'STATE_FILE_NOT_FOUND',
        description: 'Roadmap state file does not exist',
        recoverable: true,
        recovery: 'Initialize default state from ROADMAP_PHASES',
        fallback: 'Use fallback static roadmap'
      },
      {
        errorCode: 'INVALID_STATE',
        description: 'State file is corrupted',
        recoverable: true,
        recovery: 'Reinitialize from defaults',
        fallback: 'Log error and use defaults'
      }
    ]
  },

  // Level 3: Resources
  resources: [
    {
      id: 'implementation-order',
      type: ResourceType.DOCUMENTATION,
      name: 'Implementation Order Document',
      description: 'Source of truth for roadmap phases and tasks',
      path: '/home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md',
      size: 36000,
      format: 'text/markdown',
      loadStrategy: 'eager'
    }
  ],

  // Metadata
  metadata: {
    author: 'Sartor Architecture Team',
    created: '2025-12-06',
    updated: '2025-12-06',
    status: SkillStatus.STABLE,
    tags: [
      'roadmap',
      'planning',
      'coordination',
      'progress-tracking',
      'task-management'
    ],
    category: SkillCategory.INFRASTRUCTURE,
    modelCompatibility: [
      {
        modelId: 'claude-sonnet-4-5',
        features: ['context-awareness', 'task-coordination'],
        degradationStrategy: 'full'
      }
    ],
    estimatedTokens: {
      level1: 35,
      level2: 400,
      level3Avg: 1000
    }
  },

  // Performance
  performance: {
    averageExecutionMs: 25,
    successRate: 0.99,
    executionCount: 0,
    failureCount: 0
  },

  // Memory integration
  memory: {
    stateRetention: 'persistent',
    cacheStrategy: {
      type: 'lru',
      maxSize: 102400, // 100KB
      ttl: 300000, // 5 minutes
      evictionPolicy: 'age'
    },
    maxStateSize: 51200 // 50KB
  }
};

/**
 * All skill manifests
 */
export const SKILL_MANIFESTS: SkillManifest[] = [
  EVIDENCE_BASED_VALIDATION,
  EVIDENCE_BASED_ENGINEERING,
  AGENT_COMMUNICATION,
  MULTI_AGENT_ORCHESTRATION,
  MCP_SERVER_DEVELOPMENT,
  DISTRIBUTED_SYSTEMS_DEBUGGING,
  REFINEMENT_LOOP,
  SAFETY_RESEARCH_WORKFLOW,
  SELF_IMPROVEMENT,
  ROADMAP_SKILL
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
