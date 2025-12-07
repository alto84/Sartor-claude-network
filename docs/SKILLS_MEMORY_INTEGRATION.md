# Skills Memory Integration Specification

## Overview

This document specifies how the dynamic skills library integrates with the three-tier episodic memory system, enabling skills to persist state, learn from experience, and maintain consistency across Claude surfaces (Code, Web, API).

## Architecture Summary

### Three-Tier Memory System
- **Hot Tier** (Firebase RTDB): <100ms latency, working memory, active skill state
- **Warm Tier** (Firestore + Qdrant): 100-500ms latency, recent skill invocations, semantic search
- **Cold Tier** (GitHub): 1-5s latency, skill evolution history, long-term patterns

### Skills Hierarchy
- **Executive Claude**: Orchestrator that delegates to specialist skills
- **7 Specialist Skills**: Domain experts (coding, debugging, testing, architecture, etc.)
- **Progressive Loading**: Skills loaded on-demand based on context

---

## 1. Skill State Persistence

### 1.1 Hot Memory: Active Skill State

**Purpose**: Store currently active skill state for immediate access during ongoing sessions.

#### TypeScript Interface

```typescript
/**
 * Active skill state stored in Firebase RTDB for <100ms access
 */
export interface SkillWorkingMemory {
  /** Unique identifier for this skill session */
  skillSessionId: string;

  /** Which skill is active */
  skillId: SkillId;

  /** Skill name */
  skillName: string;

  /** Current skill state */
  state: SkillState;

  /** When this skill was activated */
  activatedAt: Timestamp;

  /** Who activated this skill (Executive Claude or user) */
  activatedBy: 'executive' | 'user' | 'auto';

  /** Current task the skill is working on */
  currentTask: {
    description: string;
    progress: number; // 0-1
    startedAt: Timestamp;
    estimatedCompletion?: Timestamp;
  };

  /** Active context maintained by the skill */
  context: SkillContext;

  /** Recent observations or findings */
  observations: SkillObservation[];

  /** Tools currently in use */
  activeTools: string[];

  /** Time-to-live in milliseconds (auto-expires) */
  ttl: number;

  /** Session metadata */
  session: {
    userId: string;
    sessionId: string;
    conversationId: string;
    surface: ClaudeSurface;
  };
}

/**
 * Skill identifiers
 */
export enum SkillId {
  EXECUTIVE = 'executive_claude',
  CODER = 'coder_specialist',
  DEBUGGER = 'debugger_specialist',
  TESTER = 'tester_specialist',
  ARCHITECT = 'architect_specialist',
  REVIEWER = 'reviewer_specialist',
  RESEARCHER = 'researcher_specialist',
  DOCUMENTER = 'documenter_specialist'
}

/**
 * Skill state machine states
 */
export enum SkillState {
  IDLE = 'idle',
  LOADING = 'loading',
  ACTIVE = 'active',
  DELEGATING = 'delegating',
  WAITING = 'waiting',
  CONSOLIDATING = 'consolidating',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Context maintained by each skill
 */
export interface SkillContext {
  /** Files being worked on */
  activeFiles: string[];

  /** Repositories or projects in focus */
  repositories: string[];

  /** Key variables or data being tracked */
  variables: Record<string, unknown>;

  /** Hypotheses or assumptions */
  hypotheses: string[];

  /** Decisions made during this session */
  decisions: Array<{
    decision: string;
    reasoning: string;
    timestamp: Timestamp;
  }>;

  /** Blockers or issues encountered */
  blockers: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high';
    resolvedAt?: Timestamp;
  }>;
}

/**
 * Observations made by a skill during execution
 */
export interface SkillObservation {
  /** What was observed */
  observation: string;

  /** When it was observed */
  timestamp: Timestamp;

  /** Importance score */
  importance: number;

  /** Type of observation */
  type: 'finding' | 'pattern' | 'anomaly' | 'insight' | 'error';

  /** Whether this should be persisted to long-term memory */
  shouldPersist: boolean;
}
```

#### Firebase RTDB Structure

```json
{
  "skills": {
    "sessions": {
      "session_abc123": {
        "executive": {
          "skillSessionId": "exec_001",
          "skillId": "executive_claude",
          "skillName": "Executive Claude",
          "state": "delegating",
          "activatedAt": "2025-12-06T10:00:00Z",
          "activatedBy": "user",
          "currentTask": {
            "description": "Debug failing test suite",
            "progress": 0.4,
            "startedAt": "2025-12-06T10:00:00Z"
          },
          "context": {
            "activeFiles": ["test/auth.test.ts"],
            "repositories": ["sartor-claude-network"],
            "variables": {
              "failingTests": 3,
              "testFramework": "jest"
            },
            "hypotheses": [
              "Auth token expiration causing failures"
            ],
            "decisions": [
              {
                "decision": "Delegate to Debugger specialist",
                "reasoning": "Test failures require deep debugging",
                "timestamp": "2025-12-06T10:01:00Z"
              }
            ],
            "blockers": []
          },
          "observations": [],
          "activeTools": ["read", "bash"],
          "ttl": 3600000,
          "session": {
            "userId": "user_123",
            "sessionId": "session_abc123",
            "conversationId": "conv_xyz",
            "surface": "terminal"
          }
        },
        "debugger": {
          "skillSessionId": "debug_001",
          "skillId": "debugger_specialist",
          "skillName": "Debugger Specialist",
          "state": "active",
          "activatedAt": "2025-12-06T10:01:30Z",
          "activatedBy": "executive",
          "currentTask": {
            "description": "Identify root cause of auth test failures",
            "progress": 0.6,
            "startedAt": "2025-12-06T10:01:30Z"
          },
          "context": {
            "activeFiles": [
              "test/auth.test.ts",
              "src/auth/tokenManager.ts"
            ],
            "repositories": ["sartor-claude-network"],
            "variables": {
              "tokenExpirationMs": 3600000,
              "currentTime": 1733486400000
            },
            "hypotheses": [
              "Token expiration timing issue",
              "Mock date not being set correctly"
            ],
            "decisions": [
              {
                "decision": "Check token expiration logic",
                "reasoning": "Tests fail at token boundary",
                "timestamp": "2025-12-06T10:02:00Z"
              }
            ],
            "blockers": []
          },
          "observations": [
            {
              "observation": "Tests use real Date.now() instead of mocked time",
              "timestamp": "2025-12-06T10:03:00Z",
              "importance": 0.9,
              "type": "finding",
              "shouldPersist": true
            }
          ],
          "activeTools": ["read", "grep", "bash"],
          "ttl": 3600000,
          "session": {
            "userId": "user_123",
            "sessionId": "session_abc123",
            "conversationId": "conv_xyz",
            "surface": "terminal"
          }
        }
      }
    },
    "active_count": {
      "session_abc123": 2
    }
  }
}
```

### 1.2 Warm Memory: Skill Invocation History

**Purpose**: Store recent skill invocations with outcomes for pattern extraction and learning.

#### TypeScript Interface

```typescript
/**
 * Record of a completed skill invocation stored in Firestore
 */
export interface SkillInvocationMemory {
  /** Memory identifier */
  id: MemoryId;

  /** Always 'procedural' for skill invocations */
  type: MemoryType.PROCEDURAL;

  /** Skill that was invoked */
  skillId: SkillId;

  /** Task that was performed */
  task: {
    /** User's original request */
    userRequest: string;

    /** Interpreted task description */
    description: string;

    /** Task category */
    category: TaskCategory;

    /** Task complexity */
    complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';

    /** Estimated vs actual time */
    timing: {
      estimatedMs: number;
      actualMs: number;
      accuracyScore: number;
    };
  };

  /** Invocation details */
  invocation: {
    /** When the skill was activated */
    startedAt: Timestamp;

    /** When it completed */
    completedAt: Timestamp;

    /** Duration in milliseconds */
    durationMs: number;

    /** Who invoked it */
    invokedBy: 'user' | 'executive' | 'other_skill';

    /** Invocation chain (if delegated) */
    chain: SkillId[];
  };

  /** Execution details */
  execution: {
    /** Steps taken */
    steps: ExecutionStep[];

    /** Tools used */
    toolsUsed: Array<{
      tool: string;
      callCount: number;
      totalTimeMs: number;
    }>;

    /** Files modified */
    filesModified: string[];

    /** Commands executed */
    commandsExecuted: string[];

    /** Errors encountered */
    errors: Array<{
      error: string;
      recoveredAt?: Timestamp;
      recovery?: string;
    }>;
  };

  /** Outcome */
  outcome: {
    /** Success or failure */
    status: 'success' | 'partial_success' | 'failure';

    /** Success rate (for recurring tasks) */
    successRate: number;

    /** What was accomplished */
    accomplishments: string[];

    /** What was learned */
    learnings: string[];

    /** User satisfaction (if available) */
    userSatisfaction?: number;

    /** User feedback */
    userFeedback?: {
      explicit: string;
      corrections: string[];
      positive: string[];
      negative: string[];
    };
  };

  /** Patterns identified */
  patterns: {
    /** Successful strategies */
    successPatterns: string[];

    /** Anti-patterns to avoid */
    antiPatterns: string[];

    /** Contextual factors that affected outcome */
    contextFactors: Record<string, unknown>;
  };

  /** Embeddings for semantic search */
  embedding: EmbeddingMetadata;

  /** Standard memory metadata */
  temporal: TemporalMetadata;
  importance: ImportanceMetadata;
  source: SourceContext;
  tags: TagMetadata;
  relations: MemoryRelation[];
  sync: SyncMetadata;
  metadata: Record<string, unknown>;
}

/**
 * Task categories for skill invocations
 */
export enum TaskCategory {
  CODE_GENERATION = 'code_generation',
  CODE_MODIFICATION = 'code_modification',
  DEBUGGING = 'debugging',
  TESTING = 'testing',
  REFACTORING = 'refactoring',
  ARCHITECTURE = 'architecture',
  CODE_REVIEW = 'code_review',
  DOCUMENTATION = 'documentation',
  RESEARCH = 'research',
  PLANNING = 'planning',
  EXECUTION = 'execution'
}

/**
 * A step in skill execution
 */
export interface ExecutionStep {
  /** Step number */
  order: number;

  /** What was done */
  action: string;

  /** Why it was done */
  reasoning: string;

  /** Result */
  result: string;

  /** Success */
  successful: boolean;

  /** Time taken */
  durationMs: number;

  /** Tools used in this step */
  toolsUsed: string[];
}
```

#### Firestore Collection Structure

```javascript
// Collection: skill_invocations
{
  "id": "skill_inv_20251206_001",
  "type": "procedural",
  "skillId": "debugger_specialist",
  "task": {
    "userRequest": "Fix the failing auth tests",
    "description": "Debug and fix 3 failing authentication tests",
    "category": "debugging",
    "complexity": "moderate",
    "timing": {
      "estimatedMs": 600000,  // 10 minutes
      "actualMs": 420000,     // 7 minutes
      "accuracyScore": 0.85
    }
  },
  "invocation": {
    "startedAt": "2025-12-06T10:01:30Z",
    "completedAt": "2025-12-06T10:08:30Z",
    "durationMs": 420000,
    "invokedBy": "executive",
    "chain": ["executive_claude", "debugger_specialist"]
  },
  "execution": {
    "steps": [
      {
        "order": 1,
        "action": "Read test file to understand failures",
        "reasoning": "Need to see what tests are failing and why",
        "result": "Found 3 tests failing: tokenExpiration, tokenRefresh, tokenValidation",
        "successful": true,
        "durationMs": 30000,
        "toolsUsed": ["read"]
      },
      {
        "order": 2,
        "action": "Search for token expiration logic",
        "reasoning": "All failures related to token timing",
        "result": "Located tokenManager.ts with expiration logic",
        "successful": true,
        "durationMs": 45000,
        "toolsUsed": ["grep", "read"]
      },
      {
        "order": 3,
        "action": "Run failing tests to observe behavior",
        "reasoning": "See exact failure output and timing",
        "result": "Tests use real Date.now() instead of mocked time",
        "successful": true,
        "durationMs": 120000,
        "toolsUsed": ["bash"]
      },
      {
        "order": 4,
        "action": "Fix tests to use mocked time",
        "reasoning": "Root cause identified: unmocked Date.now()",
        "result": "Modified 3 tests to use jest.setSystemTime()",
        "successful": true,
        "durationMs": 180000,
        "toolsUsed": ["edit"]
      },
      {
        "order": 5,
        "action": "Verify tests pass",
        "reasoning": "Ensure fix resolves the issue",
        "result": "All 3 tests now passing",
        "successful": true,
        "durationMs": 45000,
        "toolsUsed": ["bash"]
      }
    ],
    "toolsUsed": [
      { "tool": "read", "callCount": 4, "totalTimeMs": 75000 },
      { "tool": "grep", "callCount": 2, "totalTimeMs": 30000 },
      { "tool": "bash", "callCount": 3, "totalTimeMs": 165000 },
      { "tool": "edit", "callCount": 1, "totalTimeMs": 180000 }
    ],
    "filesModified": ["test/auth.test.ts"],
    "commandsExecuted": [
      "npm test auth.test.ts",
      "npm test auth.test.ts -- --verbose"
    ],
    "errors": []
  },
  "outcome": {
    "status": "success",
    "successRate": 1.0,
    "accomplishments": [
      "Fixed 3 failing auth tests",
      "Identified and corrected unmocked Date.now() usage",
      "All tests now pass consistently"
    ],
    "learnings": [
      "Jest tests require explicit time mocking for date-dependent logic",
      "Token expiration tests are sensitive to time mocking",
      "Always verify time-based tests use mocked time sources"
    ],
    "userSatisfaction": 0.95,
    "userFeedback": {
      "explicit": "Great job! Tests are working now.",
      "corrections": [],
      "positive": ["Quick identification of root cause", "Clean fix"],
      "negative": []
    }
  },
  "patterns": {
    "successPatterns": [
      "Read test file first to understand failures",
      "Run tests to observe actual behavior",
      "Verify fix before marking complete"
    ],
    "antiPatterns": [],
    "contextFactors": {
      "testFramework": "jest",
      "language": "typescript",
      "hadMockingUtilities": true
    }
  },
  "embedding": {
    "vector": [...],
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "generatedAt": "2025-12-06T10:08:30Z"
  },
  "temporal": {
    "createdAt": "2025-12-06T10:08:30Z",
    "lastAccessedAt": "2025-12-06T10:08:30Z",
    "lastModifiedAt": "2025-12-06T10:08:30Z",
    "accessCount": 1,
    "accessFrequency": 0,
    "accessHistory": ["2025-12-06T10:08:30Z"]
  },
  "importance": {
    "importance": 0.85,
    "initialImportance": 0.85,
    "decayRate": 0.1,
    "protectedFromDecay": false,
    "decayThreshold": 0.3,
    "importanceFactors": {
      "recency": 1.0,
      "frequency": 0.5,
      "userExplicit": 0.95,
      "emotional": 0.8,
      "novelty": 0.7
    }
  },
  "tags": {
    "tags": ["debugging", "testing", "jest", "authentication"],
    "categories": ["skill_invocation", "debugging"],
    "topics": ["test_mocking", "time_handling", "authentication"],
    "entities": []
  }
}
```

### 1.3 Cold Memory: Skill Evolution History

**Purpose**: Archive skill improvements, version history, and long-term performance trends in GitHub.

#### GitHub Repository Structure

```
sartor-skills-evolution/
├── .github/
│   └── workflows/
│       ├── skill-refinement.yml          # Daily skill analysis
│       ├── pattern-extraction.yml        # Weekly pattern mining
│       └── performance-tracking.yml      # Monthly reports
│
├── skills/
│   ├── executive_claude/
│   │   ├── v1.0.0/
│   │   │   ├── skill-definition.md       # Skill prompt/instructions
│   │   │   ├── performance-metrics.json  # Success rates, timing
│   │   │   └── learnings.md              # What was learned
│   │   ├── v1.1.0/
│   │   ├── current -> v1.1.0             # Symlink to current version
│   │   └── CHANGELOG.md
│   │
│   ├── debugger_specialist/
│   │   ├── v1.0.0/
│   │   ├── v1.1.0/
│   │   ├── v1.2.0/
│   │   ├── current -> v1.2.0
│   │   └── CHANGELOG.md
│   │
│   └── [other skills...]/
│
├── patterns/
│   ├── successful/
│   │   ├── debugging-patterns.md
│   │   ├── testing-patterns.md
│   │   └── [others...].md
│   │
│   ├── anti-patterns/
│   │   ├── debugging-antipatterns.md
│   │   └── [others...].md
│   │
│   └── contextual/
│       ├── language-specific.md
│       └── framework-specific.md
│
├── performance/
│   ├── 2025/
│   │   ├── 12/
│   │   │   ├── skill-metrics.json        # Daily aggregated metrics
│   │   │   └── improvements.md           # Improvements made
│   │   └── Q4-report.md
│   │
│   └── all-time-stats.json
│
├── refinements/
│   ├── 2025-12-06-debugger-time-mocking.md
│   ├── 2025-12-05-coder-error-handling.md
│   └── [others...].md
│
└── README.md
```

#### Skill Definition File Format

```markdown
---
skillId: debugger_specialist
version: 1.2.0
previousVersion: 1.1.0
createdAt: 2025-12-06T00:00:00Z
author: skill-refinement-system
performanceImprovement: 12%
refinementReason: |
  Added explicit guidance for time-mocking in tests based on
  pattern extraction from 47 successful debugging sessions.
---

# Debugger Specialist v1.2.0

## Core Capabilities

You are the Debugger Specialist, an expert at identifying and fixing bugs in code. You excel at:
- Root cause analysis
- Systematic debugging approaches
- Error reproduction
- Test isolation
- Fix verification

## Behavioral Instructions

### Initial Assessment
1. Read the error message or failing test output completely
2. Identify the error type (syntax, runtime, logic, timing, etc.)
3. Locate the relevant source files
4. Form initial hypotheses about the root cause

### Investigation Strategy
1. **For Test Failures**:
   - Read the test file to understand what's being tested
   - Check for time-dependent logic (dates, timeouts, race conditions)
   - **NEW in v1.2.0**: Verify time mocking is properly configured for date-dependent tests
   - Run tests to observe actual vs expected behavior
   - Check test setup/teardown for proper state management

2. **For Runtime Errors**:
   - Trace the stack trace from bottom to top
   - Identify the first occurrence in user code (vs library code)
   - Check for null/undefined values, type mismatches
   - Verify error handling around the failure point

3. **For Logic Errors**:
   - Add logging or breakpoints to trace execution
   - Compare actual vs expected values at each step
   - Check boundary conditions and edge cases
   - Verify assumptions about input data

### Common Patterns (Learned from Experience)

#### Success Patterns
- Always read test files completely before running tests
- Run tests multiple times to check for flakiness
- Verify fixes with the exact reproduction steps
- Check for similar issues in related code

#### Anti-Patterns to Avoid
- Don't assume error messages are always accurate
- Don't fix symptoms without understanding root cause
- Don't skip verification after making a fix

#### Context-Specific Guidance

**Jest/Testing Frameworks**:
- **CRITICAL**: Always check if date/time mocking is needed
- Use `jest.setSystemTime()` or `jest.useFakeTimers()` for time-dependent tests
- Verify mocks are properly reset in afterEach hooks
- Check for async race conditions in asynchronous tests

**TypeScript/JavaScript**:
- Check for `undefined` vs `null` distinctions
- Verify async/await usage is correct
- Look for missing error handling in promises

### Performance Metrics

#### Historical Performance (v1.1.0)
- Average task completion time: 8.5 minutes
- Success rate: 87%
- User satisfaction: 0.82

#### Current Performance (v1.2.0)
- Average task completion time: 7.5 minutes
- Success rate: 92%
- User satisfaction: 0.88
- **Improvement**: +5% success rate, -12% time, +7% satisfaction

### Known Limitations
- Complex race conditions may require multiple iterations
- Legacy code without tests is harder to debug
- Third-party library bugs may be beyond scope

### Version History
- v1.0.0 (2025-11-01): Initial specialist skill
- v1.1.0 (2025-11-15): Added async debugging guidance
- v1.2.0 (2025-12-06): Added time-mocking guidance for tests

---

**Last Updated**: 2025-12-06T00:00:00Z
**Performance Tracking**: See `/performance/2025/12/debugger-metrics.json`
```

---

## 2. Self-Improvement Loop

### 2.1 Feedback Collection

#### TypeScript Interfaces

```typescript
/**
 * Feedback collected after each skill invocation
 */
export interface SkillFeedback {
  /** Feedback identifier */
  id: string;

  /** Skill invocation this relates to */
  invocationId: MemoryId;

  /** Skill that was used */
  skillId: SkillId;

  /** When feedback was collected */
  timestamp: Timestamp;

  /** Feedback sources */
  sources: {
    /** Explicit user feedback */
    explicit?: {
      rating: number;        // 1-5 stars
      comment?: string;
      corrections?: string[];
      praise?: string[];
      complaints?: string[];
    };

    /** Implicit signals */
    implicit: {
      /** Did user accept the changes without modification? */
      acceptedAsIs: boolean;

      /** Number of follow-up corrections needed */
      followUpCorrections: number;

      /** Time to user approval */
      timeToApproval?: number;

      /** User asked for different approach */
      requestedRedirection: boolean;
    };

    /** System observations */
    system: {
      /** Task completed successfully */
      taskCompleted: boolean;

      /** Tests passed (if applicable) */
      testsPassed?: boolean;

      /** Build succeeded (if applicable) */
      buildSucceeded?: boolean;

      /** No errors in execution */
      errorFree: boolean;

      /** Time efficiency vs estimate */
      timeEfficiency: number;
    };
  };

  /** Categorized feedback */
  categorized: {
    /** What went well */
    successes: string[];

    /** What didn't work */
    failures: string[];

    /** What was inefficient */
    inefficiencies: string[];

    /** What was novel or creative */
    innovations: string[];
  };

  /** Learning opportunities identified */
  learningOpportunities: Array<{
    description: string;
    category: LearningCategory;
    priority: 'low' | 'medium' | 'high';
    suggestedRefinement: string;
  }>;
}

/**
 * Categories of learning from feedback
 */
export enum LearningCategory {
  TOOL_USAGE = 'tool_usage',
  STRATEGY = 'strategy',
  ERROR_HANDLING = 'error_handling',
  EFFICIENCY = 'efficiency',
  COMMUNICATION = 'communication',
  DOMAIN_KNOWLEDGE = 'domain_knowledge',
  CONTEXT_AWARENESS = 'context_awareness'
}
```

### 2.2 Pattern Extraction

#### TypeScript Interfaces

```typescript
/**
 * Extracted pattern from multiple skill invocations
 */
export interface SkillPattern {
  /** Pattern identifier */
  id: string;

  /** Pattern type */
  type: 'success_pattern' | 'anti_pattern' | 'contextual_pattern';

  /** Which skill this pattern applies to */
  skillId: SkillId;

  /** Pattern name */
  name: string;

  /** Pattern description */
  description: string;

  /** Conditions when this pattern applies */
  applicability: {
    /** Task categories this applies to */
    taskCategories: TaskCategory[];

    /** Context requirements */
    contextRequirements: Record<string, unknown>;

    /** Minimum complexity level */
    minComplexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';
  };

  /** Evidence supporting this pattern */
  evidence: {
    /** Number of invocations analyzed */
    sampleSize: number;

    /** Success rate when pattern followed */
    successRateWith: number;

    /** Success rate when pattern not followed */
    successRateWithout: number;

    /** Statistical confidence */
    confidence: number;

    /** Source invocations */
    sourceInvocations: MemoryId[];
  };

  /** How to apply this pattern */
  application: {
    /** When to use */
    whenToUse: string;

    /** Steps to follow */
    steps: string[];

    /** Expected outcomes */
    expectedOutcomes: string[];

    /** Warnings */
    warnings?: string[];
  };

  /** When this pattern was extracted */
  extractedAt: Timestamp;

  /** When it was last validated */
  lastValidated: Timestamp;

  /** Validation history */
  validationHistory: Array<{
    timestamp: Timestamp;
    sampleSize: number;
    successRate: number;
    stillValid: boolean;
  }>;
}
```

#### Pattern Extraction Process

```typescript
/**
 * Pattern extraction service that runs periodically
 */
export class SkillPatternExtractor {
  /**
   * Extract patterns from recent skill invocations
   */
  async extractPatterns(
    skillId: SkillId,
    timeRange: { start: Timestamp; end: Timestamp },
    minSampleSize: number = 10
  ): Promise<SkillPattern[]> {
    // 1. Query recent successful invocations
    const successfulInvocations = await this.queryInvocations({
      skillId,
      timeRange,
      outcomeStatus: 'success',
      minUserSatisfaction: 0.7
    });

    // 2. Query failed invocations for anti-patterns
    const failedInvocations = await this.queryInvocations({
      skillId,
      timeRange,
      outcomeStatus: 'failure'
    });

    // 3. Group by task category and context
    const groups = this.groupByTaskAndContext([
      ...successfulInvocations,
      ...failedInvocations
    ]);

    // 4. For each group, extract common sequences
    const patterns: SkillPattern[] = [];

    for (const group of groups) {
      if (group.invocations.length < minSampleSize) continue;

      // Extract common execution sequences
      const sequences = this.extractCommonSequences(group.invocations);

      // Calculate success rates
      for (const sequence of sequences) {
        const withPattern = group.invocations.filter(inv =>
          this.invocationFollowsSequence(inv, sequence)
        );
        const withoutPattern = group.invocations.filter(inv =>
          !this.invocationFollowsSequence(inv, sequence)
        );

        const successRateWith = this.calculateSuccessRate(withPattern);
        const successRateWithout = this.calculateSuccessRate(withoutPattern);

        // If significant improvement, it's a success pattern
        if (successRateWith - successRateWithout > 0.15) {
          patterns.push(this.createSuccessPattern(
            skillId,
            sequence,
            withPattern,
            { with: successRateWith, without: successRateWithout }
          ));
        }

        // If significant degradation, it's an anti-pattern
        if (successRateWithout - successRateWith > 0.15) {
          patterns.push(this.createAntiPattern(
            skillId,
            sequence,
            withPattern,
            { with: successRateWith, without: successRateWithout }
          ));
        }
      }
    }

    // 5. Extract contextual patterns (e.g., language-specific)
    const contextualPatterns = this.extractContextualPatterns(
      successfulInvocations,
      failedInvocations
    );

    patterns.push(...contextualPatterns);

    return patterns;
  }

  /**
   * Extract common sequences from invocations
   */
  private extractCommonSequences(invocations: SkillInvocationMemory[]): string[][] {
    // Use sequence mining algorithm to find common step patterns
    // This is a simplified version - real implementation would use
    // algorithms like PrefixSpan or SPADE

    const sequences: Map<string, number> = new Map();

    for (const invocation of invocations) {
      const steps = invocation.execution.steps;

      // Generate all subsequences of length 2-5
      for (let len = 2; len <= Math.min(5, steps.length); len++) {
        for (let i = 0; i <= steps.length - len; i++) {
          const subseq = steps.slice(i, i + len).map(s => s.action);
          const key = JSON.stringify(subseq);
          sequences.set(key, (sequences.get(key) || 0) + 1);
        }
      }
    }

    // Filter to sequences that appear in at least 30% of invocations
    const threshold = invocations.length * 0.3;
    return Array.from(sequences.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([key, _]) => JSON.parse(key));
  }

  // ... additional helper methods
}
```

### 2.3 Skill Refinement

#### Refinement Process

```typescript
/**
 * Skill refinement that updates skill definitions based on patterns
 */
export class SkillRefinementEngine {
  /**
   * Generate a refinement proposal for a skill
   */
  async proposeRefinement(
    skillId: SkillId,
    patterns: SkillPattern[],
    currentVersion: string
  ): Promise<SkillRefinementProposal> {
    // 1. Load current skill definition
    const currentSkill = await this.loadSkillDefinition(skillId, currentVersion);

    // 2. Generate refinements based on patterns
    const refinements: Refinement[] = [];

    for (const pattern of patterns) {
      if (pattern.type === 'success_pattern') {
        refinements.push({
          type: 'add_guidance',
          section: this.determineRelevantSection(pattern),
          content: this.generateGuidanceText(pattern),
          reasoning: `Pattern observed in ${pattern.evidence.sampleSize} invocations with ${(pattern.evidence.successRateWith * 100).toFixed(1)}% success rate`,
          confidence: pattern.evidence.confidence
        });
      } else if (pattern.type === 'anti_pattern') {
        refinements.push({
          type: 'add_warning',
          section: 'anti_patterns',
          content: this.generateWarningText(pattern),
          reasoning: `Anti-pattern reduces success rate by ${((pattern.evidence.successRateWithout - pattern.evidence.successRateWith) * 100).toFixed(1)}%`,
          confidence: pattern.evidence.confidence
        });
      }
    }

    // 3. Create new version with refinements
    const newVersion = this.incrementVersion(currentVersion, 'minor');
    const refinedSkill = this.applyRefinements(currentSkill, refinements);

    // 4. Estimate performance improvement
    const estimatedImprovement = this.estimatePerformanceImpact(
      patterns,
      refinements
    );

    return {
      skillId,
      currentVersion,
      newVersion,
      refinements,
      refinedDefinition: refinedSkill,
      estimatedImprovement,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Apply a refinement proposal
   */
  async applyRefinement(proposal: SkillRefinementProposal): Promise<void> {
    // 1. Create new version directory in GitHub
    await this.createVersionDirectory(
      proposal.skillId,
      proposal.newVersion,
      proposal.refinedDefinition
    );

    // 2. Update CHANGELOG
    await this.updateChangelog(proposal);

    // 3. Create refinement documentation
    await this.documentRefinement(proposal);

    // 4. Update current symlink after validation period
    // (keep old version active for A/B testing)

    // 5. Schedule A/B test to validate improvement
    await this.scheduleABTest(proposal);
  }
}

/**
 * Skill refinement proposal
 */
export interface SkillRefinementProposal {
  skillId: SkillId;
  currentVersion: string;
  newVersion: string;
  refinements: Refinement[];
  refinedDefinition: string;
  estimatedImprovement: {
    successRate: number;
    efficiency: number;
    userSatisfaction: number;
  };
  createdAt: Timestamp;
}

/**
 * Individual refinement to apply
 */
export interface Refinement {
  type: 'add_guidance' | 'add_warning' | 'modify_section' | 'add_example';
  section: string;
  content: string;
  reasoning: string;
  confidence: number;
}
```

---

## 3. Cross-Surface Consistency

### 3.1 Skill Behavior Across Surfaces

**Goal**: Skills behave consistently whether invoked from Claude Code (terminal), claude.ai (web), or API, with surface-specific adaptations where appropriate.

#### TypeScript Interfaces

```typescript
/**
 * Surface-specific skill configuration
 */
export interface SkillSurfaceConfig {
  /** Which surface this config is for */
  surface: ClaudeSurface;

  /** Tool availability on this surface */
  availableTools: string[];

  /** Tool restrictions or limitations */
  toolLimitations: Record<string, {
    restricted: boolean;
    reason?: string;
    alternative?: string;
  }>;

  /** UI/UX adaptations */
  presentation: {
    /** Can show interactive progress updates */
    supportsProgressUpdates: boolean;

    /** Can show rich formatting */
    supportsRichFormatting: boolean;

    /** Can request user input mid-task */
    supportsInteractiveInput: boolean;

    /** Preferred output format */
    outputFormat: 'markdown' | 'plain_text' | 'structured_json';
  };

  /** Performance considerations */
  performance: {
    /** Expected latency for this surface */
    typicalLatencyMs: number;

    /** Should optimize for speed vs completeness */
    optimizeFor: 'speed' | 'completeness' | 'balanced';

    /** Maximum execution time before timeout */
    maxExecutionMs: number;
  };

  /** Context availability */
  context: {
    /** Has access to file system */
    hasFileSystemAccess: boolean;

    /** Has access to git */
    hasGitAccess: boolean;

    /** Has terminal access */
    hasTerminalAccess: boolean;

    /** Has web browsing capability */
    hasWebAccess: boolean;
  };
}

/**
 * Predefined surface configurations
 */
export const SURFACE_CONFIGS: Record<ClaudeSurface, SkillSurfaceConfig> = {
  [ClaudeSurface.TERMINAL]: {
    surface: ClaudeSurface.TERMINAL,
    availableTools: ['read', 'write', 'edit', 'bash', 'grep', 'glob'],
    toolLimitations: {},
    presentation: {
      supportsProgressUpdates: true,
      supportsRichFormatting: true,
      supportsInteractiveInput: true,
      outputFormat: 'markdown'
    },
    performance: {
      typicalLatencyMs: 2000,
      optimizeFor: 'completeness',
      maxExecutionMs: 600000  // 10 minutes
    },
    context: {
      hasFileSystemAccess: true,
      hasGitAccess: true,
      hasTerminalAccess: true,
      hasWebAccess: false
    }
  },

  [ClaudeSurface.WEB]: {
    surface: ClaudeSurface.WEB,
    availableTools: ['web_search', 'web_fetch'],
    toolLimitations: {
      'bash': {
        restricted: true,
        reason: 'No terminal access in web interface',
        alternative: 'Provide instructions for user to run commands'
      },
      'read': {
        restricted: true,
        reason: 'No file system access',
        alternative: 'Ask user to paste file contents'
      }
    },
    presentation: {
      supportsProgressUpdates: true,
      supportsRichFormatting: true,
      supportsInteractiveInput: true,
      outputFormat: 'markdown'
    },
    performance: {
      typicalLatencyMs: 1500,
      optimizeFor: 'balanced',
      maxExecutionMs: 300000  // 5 minutes
    },
    context: {
      hasFileSystemAccess: false,
      hasGitAccess: false,
      hasTerminalAccess: false,
      hasWebAccess: true
    }
  },

  [ClaudeSurface.API]: {
    surface: ClaudeSurface.API,
    availableTools: [],  // Depends on client implementation
    toolLimitations: {},
    presentation: {
      supportsProgressUpdates: false,
      supportsRichFormatting: false,
      supportsInteractiveInput: false,
      outputFormat: 'structured_json'
    },
    performance: {
      typicalLatencyMs: 1000,
      optimizeFor: 'speed',
      maxExecutionMs: 120000  // 2 minutes
    },
    context: {
      hasFileSystemAccess: false,
      hasGitAccess: false,
      hasTerminalAccess: false,
      hasWebAccess: false
    }
  }
};
```

### 3.2 Shared Skill Memory

**Goal**: Learnings from one surface benefit all surfaces.

#### Synchronization Strategy

```typescript
/**
 * Cross-surface skill memory synchronization
 */
export class SkillMemorySyncService {
  /**
   * Sync skill learnings across surfaces
   */
  async syncSkillLearnings(skillId: SkillId): Promise<SyncResult> {
    // 1. Gather skill invocations from all surfaces
    const invocations = await this.gatherInvocationsAcrossSurfaces(skillId);

    // 2. Extract patterns separately for each surface
    const surfacePatterns = new Map<ClaudeSurface, SkillPattern[]>();

    for (const surface of Object.values(ClaudeSurface)) {
      const surfaceInvocations = invocations.filter(
        inv => inv.source.surface === surface
      );

      if (surfaceInvocations.length >= 5) {
        const patterns = await this.patternExtractor.extractPatterns(
          skillId,
          surfaceInvocations
        );
        surfacePatterns.set(surface, patterns);
      }
    }

    // 3. Identify universal patterns (work across all surfaces)
    const universalPatterns = this.findUniversalPatterns(surfacePatterns);

    // 4. Identify surface-specific patterns
    const surfaceSpecificPatterns = this.findSurfaceSpecificPatterns(
      surfacePatterns
    );

    // 5. Update skill definition with both types
    await this.updateSkillWithPatterns(
      skillId,
      universalPatterns,
      surfaceSpecificPatterns
    );

    return {
      universalPatterns: universalPatterns.length,
      surfaceSpecificPatterns: Array.from(surfaceSpecificPatterns.entries())
        .reduce((sum, [_, patterns]) => sum + patterns.length, 0),
      syncedAt: new Date().toISOString()
    };
  }

  /**
   * Find patterns that work across all surfaces
   */
  private findUniversalPatterns(
    surfacePatterns: Map<ClaudeSurface, SkillPattern[]>
  ): SkillPattern[] {
    const universal: SkillPattern[] = [];

    // Get patterns from first surface as candidates
    const [firstSurface, firstPatterns] = surfacePatterns.entries().next().value;

    for (const pattern of firstPatterns) {
      // Check if similar pattern exists in all other surfaces
      let isUniversal = true;

      for (const [surface, patterns] of surfacePatterns.entries()) {
        if (surface === firstSurface) continue;

        const hasSimilar = patterns.some(p =>
          this.arePatternsEquivalent(pattern, p)
        );

        if (!hasSimilar) {
          isUniversal = false;
          break;
        }
      }

      if (isUniversal) {
        universal.push(this.mergePatternEvidence(pattern, surfacePatterns));
      }
    }

    return universal;
  }
}
```

---

## 4. MCP Tool Extensions

### 4.1 New MCP Tools for Skill Management

```typescript
/**
 * MCP tool: load_skill
 * Activate a skill and return its current state
 */
export interface LoadSkillInput {
  /** Skill to load */
  skillId: SkillId;

  /** Session context */
  sessionId: string;
  userId: string;
  conversationId: string;
  surface: ClaudeSurface;

  /** Task to perform (optional, for context) */
  task?: string;

  /** Load specific version (default: latest) */
  version?: string;
}

export interface LoadSkillOutput {
  success: boolean;
  skillSessionId: string;
  skillId: SkillId;
  skillName: string;
  version: string;
  state: SkillState;
  availableTools: string[];
  surfaceConfig: SkillSurfaceConfig;
  recentLearnings: string[];  // Recent patterns to be aware of
  activatedAt: Timestamp;
}

/**
 * MCP tool: unload_skill
 * Deactivate a skill and consolidate its state to warm memory
 */
export interface UnloadSkillInput {
  skillSessionId: string;
  reason: 'completed' | 'cancelled' | 'error' | 'timeout';
  summary?: string;
}

export interface UnloadSkillOutput {
  success: boolean;
  skillSessionId: string;
  consolidatedTo: MemoryId;  // Warm memory ID
  duration: number;
  observationsPersisted: number;
  learningsExtracted: number;
}

/**
 * MCP tool: list_active_skills
 * Show all currently active skills in a session
 */
export interface ListActiveSkillsInput {
  sessionId: string;
}

export interface ListActiveSkillsOutput {
  success: boolean;
  activeSkills: Array<{
    skillSessionId: string;
    skillId: SkillId;
    skillName: string;
    state: SkillState;
    activatedAt: Timestamp;
    currentTask: string;
    progress: number;
  }>;
  totalActive: number;
}

/**
 * MCP tool: record_skill_outcome
 * Record feedback and outcome for a skill invocation
 */
export interface RecordSkillOutcomeInput {
  skillSessionId: string;
  outcome: {
    status: 'success' | 'partial_success' | 'failure';
    accomplishments: string[];
    learnings: string[];
  };
  feedback?: {
    rating?: number;
    comment?: string;
    corrections?: string[];
  };
}

export interface RecordSkillOutcomeOutput {
  success: boolean;
  feedbackRecorded: boolean;
  invocationMemoryId: MemoryId;
  patternsTriggered: number;  // Number of patterns this confirms/refutes
}

/**
 * MCP tool: get_skill_recommendations
 * Get skill recommendations based on user request and context
 */
export interface GetSkillRecommendationsInput {
  userRequest: string;
  context: {
    currentFiles?: string[];
    currentRepository?: string;
    recentErrors?: string[];
    recentCommands?: string[];
  };
  sessionId: string;
}

export interface GetSkillRecommendationsOutput {
  success: boolean;
  recommendations: Array<{
    skillId: SkillId;
    skillName: string;
    confidence: number;
    reasoning: string;
    estimatedDuration: number;
    estimatedSuccessRate: number;
  }>;
  suggestedPrimary: SkillId;
}
```

### 4.2 Integration with Existing Memory Tools

The skill management tools integrate seamlessly with existing memory tools:

```typescript
/**
 * Integration example: Skill invocation creates multiple memory types
 */
async function executeSkillWithMemory(
  skillId: SkillId,
  task: string,
  context: ExecutionContext
): Promise<SkillExecutionResult> {
  // 1. Load skill (creates hot memory: SkillWorkingMemory)
  const loadResult = await mcpTools.load_skill({
    skillId,
    sessionId: context.sessionId,
    userId: context.userId,
    conversationId: context.conversationId,
    surface: context.surface,
    task
  });

  // 2. Execute task (skill updates hot memory in real-time)
  const executionResult = await executeSkill(loadResult.skillSessionId, task);

  // 3. Record outcome (creates warm memory: SkillInvocationMemory)
  const outcomeResult = await mcpTools.record_skill_outcome({
    skillSessionId: loadResult.skillSessionId,
    outcome: executionResult.outcome,
    feedback: executionResult.userFeedback
  });

  // 4. Unload skill (consolidates to warm memory)
  await mcpTools.unload_skill({
    skillSessionId: loadResult.skillSessionId,
    reason: 'completed',
    summary: executionResult.summary
  });

  // 5. If significant learnings, also create semantic memory
  if (executionResult.learnings.length > 0) {
    for (const learning of executionResult.learnings) {
      await mcpTools.store_memory({
        content: learning,
        context: {
          conversation_id: context.conversationId,
          user_id: context.userId,
          session_id: context.sessionId
        },
        metadata: {
          category: 'skill',
          tags: [skillId, 'learning', 'best_practice'],
          importance: 0.8
        },
        related_memory_ids: [outcomeResult.invocationMemoryId]
      });
    }
  }

  return executionResult;
}
```

---

## 5. Example Flows

### 5.1 Complex Task with Delegation

**Scenario**: User asks "Fix the failing tests and update the documentation"

#### Flow Diagram

```
User Request
    ↓
Executive Claude (Hot Memory)
    ├─→ Analyze request
    ├─→ Identify: Testing issue + Documentation task
    ├─→ Decision: Delegate to specialists
    ↓
Executive loads Debugger Specialist (Hot Memory)
    ↓
Debugger Specialist (Hot Memory)
    ├─→ Reads test files
    ├─→ Runs tests to see failures
    ├─→ Identifies: Time mocking issue
    ├─→ Fixes tests
    ├─→ Verifies fix
    ├─→ Records observations: "Jest time mocking pattern"
    ↓
Debugger completes → Creates SkillInvocationMemory (Warm Memory)
    ├─→ Success: true
    ├─→ Learning: "Always check time mocking in Jest tests"
    ├─→ Pattern: Adds to success pattern pool
    ↓
Executive loads Documenter Specialist (Hot Memory)
    ↓
Documenter Specialist (Hot Memory)
    ├─→ Reviews test changes
    ├─→ Updates test documentation
    ├─→ Adds time mocking section
    ↓
Documenter completes → Creates SkillInvocationMemory (Warm Memory)
    ↓
Executive consolidates results
    ↓
User Feedback: "Perfect, thanks!"
    ├─→ Positive feedback recorded
    ├─→ Both skill invocations marked successful
    ↓
Overnight: Pattern Extraction (GitHub Actions)
    ├─→ Analyzes 50+ Debugger invocations
    ├─→ Finds: Time mocking pattern in 15 successful cases
    ├─→ Creates: Success pattern with 92% success rate
    ↓
Weekly: Skill Refinement (GitHub Actions)
    ├─→ Proposes: Add time mocking guidance to Debugger v1.2.0
    ├─→ Creates: New version in GitHub (Cold Memory)
    ├─→ Updates: CHANGELOG and performance metrics
    ↓
Next invocation: Debugger v1.2.0 with improved guidance
```

#### Detailed Implementation

```typescript
// 1. User makes request
const request = "Fix the failing tests and update the documentation";

// 2. Executive Claude receives and analyzes
const executiveSkill = await mcpTools.load_skill({
  skillId: SkillId.EXECUTIVE,
  sessionId: session.id,
  userId: user.id,
  conversationId: conversation.id,
  surface: ClaudeSurface.TERMINAL,
  task: request
});

// Executive's analysis (stored in hot memory)
await updateSkillState(executiveSkill.skillSessionId, {
  observations: [
    {
      observation: "Request contains two distinct tasks: fix tests + update docs",
      type: 'finding',
      importance: 0.8,
      shouldPersist: true
    }
  ],
  context: {
    decisions: [
      {
        decision: "Delegate testing task to Debugger specialist",
        reasoning: "Test failures require debugging expertise",
        timestamp: new Date().toISOString()
      },
      {
        decision: "After debugging complete, delegate to Documenter specialist",
        reasoning: "Documentation updates should reflect test changes",
        timestamp: new Date().toISOString()
      }
    ]
  },
  state: SkillState.DELEGATING
});

// 3. Executive delegates to Debugger
const debuggerSkill = await mcpTools.load_skill({
  skillId: SkillId.DEBUGGER,
  sessionId: session.id,
  userId: user.id,
  conversationId: conversation.id,
  surface: ClaudeSurface.TERMINAL,
  task: "Fix the failing tests"
});

// Debugger executes (updates hot memory throughout)
const debuggerResult = await debuggerSpecialist.execute({
  skillSessionId: debuggerSkill.skillSessionId,
  task: "Fix the failing tests",
  onProgress: async (update) => {
    // Real-time updates to hot memory
    await updateSkillState(debuggerSkill.skillSessionId, {
      currentTask: {
        ...debuggerSkill.currentTask,
        progress: update.progress
      },
      observations: update.observations
    });
  }
});

// 4. Debugger completes - record outcome
await mcpTools.record_skill_outcome({
  skillSessionId: debuggerSkill.skillSessionId,
  outcome: {
    status: 'success',
    accomplishments: [
      "Fixed 3 failing auth tests",
      "Identified and corrected unmocked Date.now() usage"
    ],
    learnings: [
      "Jest tests require explicit time mocking for date-dependent logic"
    ]
  }
});

// This creates SkillInvocationMemory in Firestore (warm memory)
const invocationMemory = await createSkillInvocationMemory(debuggerResult);

// 5. Executive continues with documentation
const documenterSkill = await mcpTools.load_skill({
  skillId: SkillId.DOCUMENTER,
  sessionId: session.id,
  userId: user.id,
  conversationId: conversation.id,
  surface: ClaudeSurface.TERMINAL,
  task: "Update documentation for the test fixes"
});

// Documenter can access the debugger's invocation memory for context
const debuggerContext = await mcpTools.recall_memories({
  query: "recent test fixes in this session",
  filters: {
    categories: ["skill"],
    conversation_id: conversation.id
  },
  limit: 5
});

// ... Documenter executes and completes

// 6. Executive consolidates
await mcpTools.unload_skill({
  skillSessionId: executiveSkill.skillSessionId,
  reason: 'completed',
  summary: "Successfully fixed tests and updated documentation using Debugger and Documenter specialists"
});
```

### 5.2 Skill Failure and Learning

**Scenario**: Skill attempts a solution that doesn't work, learns from the failure

#### Flow

```
User Request: "Add authentication to the API"
    ↓
Coder Specialist activated (Hot Memory)
    ├─→ Initial approach: JWT with bcrypt
    ├─→ Implements authentication middleware
    ├─→ Runs tests → FAIL (timing issues)
    ↓
Coder records failure (Hot Memory)
    ├─→ Observation: "Bcrypt timing too slow for tests"
    ├─→ Hypothesis: "Use faster hashing for test environment"
    ↓
User correction: "The tests are timing out"
    ├─→ Explicit feedback recorded
    ↓
Coder adapts approach
    ├─→ Modified: Use bcrypt for prod, plain hashing for tests
    ├─→ Runs tests → PASS
    ↓
Coder completes → SkillInvocationMemory (Warm Memory)
    ├─→ Status: partial_success (needed correction)
    ├─→ Learnings: "Test environment needs fast hashing"
    ├─→ Feedback: User correction recorded
    ↓
Pattern Extraction (Daily)
    ├─→ Identifies: Performance consideration pattern
    ├─→ Creates: "Consider test performance when choosing crypto"
    ↓
Skill Refinement (Weekly)
    ├─→ Adds to Coder v1.3.0: "Check test performance for crypto operations"
    ├─→ Cold Memory: GitHub commit with refinement
```

#### Implementation

```typescript
// Initial attempt
const coderSkill = await mcpTools.load_skill({
  skillId: SkillId.CODER,
  task: "Add authentication to the API"
});

// Coder executes first approach
await updateSkillState(coderSkill.skillSessionId, {
  context: {
    hypotheses: ["JWT with bcrypt will provide secure authentication"],
    decisions: [{
      decision: "Use bcrypt for password hashing",
      reasoning: "Industry standard, very secure"
    }]
  }
});

// Tests fail
await updateSkillState(coderSkill.skillSessionId, {
  observations: [{
    observation: "Tests failing with timeout errors",
    type: 'error',
    importance: 0.9,
    shouldPersist: true
  }],
  context: {
    blockers: [{
      description: "Test timeouts when running auth tests",
      severity: 'high'
    }]
  }
});

// User provides correction
const userFeedback = {
  explicit: {
    comment: "The tests are timing out",
    corrections: ["Tests need faster execution"]
  },
  implicit: {
    acceptedAsIs: false,
    followUpCorrections: 1
  }
};

// Coder adapts
await updateSkillState(coderSkill.skillSessionId, {
  context: {
    hypotheses: [
      "Bcrypt is too slow for test environment",
      "Can use faster hashing for tests, bcrypt for production"
    ],
    decisions: [{
      decision: "Use environment-based hashing strategy",
      reasoning: "User feedback indicates performance issue in tests"
    }]
  }
});

// Second attempt succeeds
await mcpTools.record_skill_outcome({
  skillSessionId: coderSkill.skillSessionId,
  outcome: {
    status: 'partial_success',  // Needed correction
    accomplishments: [
      "Added JWT authentication",
      "Implemented environment-aware hashing"
    ],
    learnings: [
      "Test environment performance matters for crypto operations",
      "Use faster alternatives in tests when security isn't critical"
    ]
  },
  feedback: userFeedback
});

// This creates a learning opportunity
const invocationMemory = await getInvocationMemory(coderSkill.skillSessionId);
invocationMemory.feedback.learningOpportunities.push({
  description: "Add guidance about test performance for crypto operations",
  category: LearningCategory.DOMAIN_KNOWLEDGE,
  priority: 'high',
  suggestedRefinement: "In 'Authentication Implementation' section, add note about test environment performance"
});
```

### 5.3 Cross-Surface Learning

**Scenario**: Learning from Claude Code improves performance on claude.ai

#### Flow

```
[Claude Code - Terminal]
User: "Debug the API endpoint that's returning 500"
    ↓
Debugger Specialist
    ├─→ Uses Bash tool to run server
    ├─→ Uses Grep to find error logs
    ├─→ Uses Read to examine code
    ├─→ Identifies: Missing error handling in async middleware
    ├─→ Success pattern: "Read logs → Grep errors → Trace stack"
    ↓
Pattern extracted (Warm Memory)
    ├─→ Pattern: "Log-first debugging for server errors"
    ├─→ Success rate: 94% (Terminal surface)
    ↓
Pattern validated across surfaces (Weekly sync)
    ├─→ Checks: Can this work on Web surface?
    ├─→ Limitation: No Bash access on Web
    ├─→ Adaptation: "Ask user to share logs"
    ↓
Skill updated (Cold Memory - GitHub)
    ├─→ Universal guidance: "Start by examining error logs"
    ├─→ Surface-specific:
        Terminal: "Use grep and bash to access logs"
        Web: "Request user to share relevant log files"
    ↓
[Claude.ai - Web - Different User]
User: "My API is crashing, can you help?"
    ↓
Debugger Specialist v1.3.0 (with learning from Terminal)
    ├─→ Follows pattern: Log-first debugging
    ├─→ Adapts for Web surface: "Could you share the error logs?"
    ├─→ User pastes logs
    ├─→ Applies same successful pattern
    ├─→ Success!
    ↓
Cross-surface pattern validated
    ├─→ Pattern now confirmed on both Terminal and Web
    ├─→ Marked as "universal pattern"
```

---

## 6. Performance and Monitoring

### 6.1 Key Metrics

```typescript
/**
 * Metrics tracked for each skill
 */
export interface SkillMetrics {
  skillId: SkillId;
  version: string;
  period: {
    start: Timestamp;
    end: Timestamp;
  };

  performance: {
    /** Total invocations */
    totalInvocations: number;

    /** Success rate */
    successRate: number;

    /** Average duration */
    avgDurationMs: number;

    /** Duration vs estimate accuracy */
    durationAccuracy: number;

    /** User satisfaction average */
    avgUserSatisfaction: number;
  };

  learning: {
    /** Patterns extracted this period */
    patternsExtracted: number;

    /** Refinements applied */
    refinementsApplied: number;

    /** Performance improvement from refinements */
    improvementFromRefinements: number;
  };

  usage: {
    /** By surface */
    bySurface: Record<ClaudeSurface, number>;

    /** By task category */
    byTaskCategory: Record<TaskCategory, number>;

    /** By complexity */
    byComplexity: Record<string, number>;
  };
}
```

### 6.2 Dashboard Queries

```typescript
/**
 * Get comprehensive skill performance report
 */
async function getSkillPerformanceReport(
  skillId: SkillId,
  days: number = 30
): Promise<SkillPerformanceReport> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  // Query warm memory for recent invocations
  const invocations = await mcpTools.recall_memories({
    query: `skill invocations for ${skillId}`,
    filters: {
      categories: ['skill_invocation'],
      tags: [skillId],
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    },
    limit: 1000
  });

  // Calculate metrics
  const metrics = calculateMetrics(invocations.memories);

  // Get skill evolution from cold memory
  const evolution = await getSkillEvolutionHistory(skillId);

  // Compare current vs previous version
  const comparison = compareVersions(
    evolution.currentVersion,
    evolution.previousVersion
  );

  return {
    skillId,
    currentVersion: evolution.currentVersion,
    metrics,
    evolution,
    comparison,
    recommendations: generateRecommendations(metrics, evolution)
  };
}
```

---

## 7. Migration and Rollout

### 7.1 Rollout Phases

**Phase 1: Foundation** (Week 1-2)
- Implement hot memory structure in Firebase RTDB
- Create basic skill state tracking
- Deploy for Executive Claude only

**Phase 2: Warm Memory** (Week 3-4)
- Implement SkillInvocationMemory in Firestore
- Add feedback collection
- Deploy for 2-3 specialist skills (Coder, Debugger)

**Phase 3: Pattern Extraction** (Week 5-6)
- Implement pattern extraction algorithms
- Set up daily GitHub Actions workflow
- Begin collecting patterns

**Phase 4: Refinement** (Week 7-8)
- Implement refinement engine
- Create first refined skill versions
- Deploy to GitHub cold storage

**Phase 5: Cross-Surface** (Week 9-10)
- Implement surface-specific adaptations
- Test on multiple surfaces
- Sync learnings across surfaces

**Phase 6: Full Deployment** (Week 11-12)
- Deploy all specialist skills
- Enable automatic refinement
- Monitor and optimize

### 7.2 Backwards Compatibility

```typescript
/**
 * Ensure old invocations without skill tracking still work
 */
export class BackwardsCompatibilityLayer {
  async handleLegacyInvocation(request: string): Promise<Response> {
    // Check if this is a skill-tracked invocation
    const hasSkillContext = await this.checkForSkillContext(request);

    if (hasSkillContext) {
      // Use new skill system
      return this.handleWithSkills(request);
    } else {
      // Fall back to traditional handling
      return this.handleTraditional(request);
    }
  }
}
```

---

## 8. Security and Privacy

### 8.1 Data Protection

```typescript
/**
 * Privacy controls for skill memory
 */
export interface SkillMemoryPrivacy {
  /** User can opt out of skill learning */
  learningEnabled: boolean;

  /** User can request data deletion */
  deletionRequests: Array<{
    requestedAt: Timestamp;
    scope: 'all' | 'specific_invocation' | 'specific_skill';
    status: 'pending' | 'completed';
  }>;

  /** Anonymize user data in patterns */
  anonymizeInPatterns: boolean;

  /** Don't share learnings across users */
  privateLearnings: boolean;
}
```

### 8.2 Access Control

- **Hot Memory (Firebase RTDB)**: User can only access their own session data
- **Warm Memory (Firestore)**: User can only query their own invocations
- **Cold Memory (GitHub)**: Patterns are anonymized, no PII stored

---

## Conclusion

This integration design creates a comprehensive learning system where:

1. **Skills maintain active state** in hot memory for fast access
2. **Invocation history is preserved** in warm memory for pattern analysis
3. **Skills evolve over time** with refinements stored in cold memory
4. **Learnings are shared** across surfaces while respecting their constraints
5. **Users benefit** from improved performance as the system learns

The three-tier architecture ensures the right balance of performance, persistence, and long-term evolution for the dynamic skills library.
