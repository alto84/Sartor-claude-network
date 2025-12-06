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
 * All skill manifests
 */
export const SKILL_MANIFESTS: SkillManifest[] = [
  EVIDENCE_BASED_VALIDATION,
  EVIDENCE_BASED_ENGINEERING,
  AGENT_COMMUNICATION,
  MULTI_AGENT_ORCHESTRATION
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
