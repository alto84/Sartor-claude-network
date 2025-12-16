/**
 * Subagent Bootstrap Module
 *
 * Provides rapid onboarding for new Claude instances with:
 * - Configurable onboarding depth levels
 * - Skills, memories, plans, and context compilation
 * - Performance-optimized for <500ms bootstrap time
 *
 * @module subagent/bootstrap
 */

import { KnowledgeGraph, EntityType, Entity, Relationship } from '../mcp/knowledge-graph';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Onboarding depth levels for subagent bootstrap
 */
export enum OnboardingDepth {
  /** Just essential skills - fastest bootstrap (~100ms) */
  MINIMAL = 'minimal',
  /** Skills + recent memories - balanced (~250ms) */
  STANDARD = 'standard',
  /** Everything: skills, memories, plans, relationships (~500ms) */
  FULL = 'full',
}

/**
 * Agent role types
 */
export enum AgentRole {
  PLANNER = 'planner',
  IMPLEMENTER = 'implementer',
  AUDITOR = 'auditor',
  CLEANER = 'cleaner',
  RESEARCHER = 'researcher',
  COORDINATOR = 'coordinator',
  SPECIALIST = 'specialist',
}

/**
 * Agent capability declaration
 */
export interface AgentCapability {
  name: string;
  description: string;
  proficiency: number; // 0-1
  dependencies?: string[];
}

/**
 * Skill definition for bootstrap context
 */
export interface BootstrapSkill {
  id: string;
  name: string;
  description: string;
  usage: string;
  examples?: string[];
  lastUsed?: Date;
  usageCount: number;
  confidence: number;
}

/**
 * Memory summary for bootstrap
 */
export interface BootstrapMemory {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working';
  summary: string;
  importance: number;
  relevanceScore: number;
  createdAt: Date;
  lastAccessed?: Date;
  tags: string[];
}

/**
 * Plan item for bootstrap
 */
export interface BootstrapPlanItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedTo?: string;
  dependencies: string[];
  progress: number;
  estimatedMinutes?: number;
}

/**
 * Active plan structure
 */
export interface ActivePlan {
  id: string;
  name: string;
  description: string;
  items: BootstrapPlanItem[];
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  collaborators: string[];
}

/**
 * Master plan reference
 */
export interface MasterPlan {
  id: string;
  name: string;
  currentPhase: string;
  totalPhases: number;
  overallProgress: number;
  priorities: string[];
  lastUpdated: Date;
}

/**
 * Entity relationship for bootstrap
 */
export interface BootstrapRelationship {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  relationType: string;
  weight: number;
}

/**
 * Session context for bootstrap
 */
export interface SessionContext {
  sessionId: string;
  surface: 'web' | 'mobile' | 'desktop' | 'api' | 'slack' | 'cli';
  userId?: string;
  projectPath?: string;
  workingDirectory?: string;
  environment: Record<string, string>;
  startedAt: Date;
  lastActivity: Date;
}

/**
 * Complete subagent context
 */
export interface SubagentContext {
  agentId: string;
  parentAgentId?: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  skills: BootstrapSkill[];
  recentMemories: BootstrapMemory[];
  activePlan?: ActivePlan;
  masterPlan?: MasterPlan;
  entityRelationships: BootstrapRelationship[];
  sessionContext: SessionContext;
  bootstrapDepth: OnboardingDepth;
  bootstrapTime: number;
  timestamp: Date;
}

/**
 * Bootstrap configuration options
 */
export interface BootstrapOptions {
  /** Onboarding depth level */
  depth: OnboardingDepth;
  /** Maximum number of memories to include */
  maxMemories?: number;
  /** Maximum number of skills to include */
  maxSkills?: number;
  /** Include entity relationships */
  includeRelationships?: boolean;
  /** Filter memories by type */
  memoryTypes?: Array<'episodic' | 'semantic' | 'procedural' | 'working'>;
  /** Minimum importance threshold for memories */
  minImportance?: number;
  /** Filter skills by minimum confidence */
  minSkillConfidence?: number;
  /** Custom context to merge */
  customContext?: Record<string, unknown>;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Onboarding payload returned to new agents
 */
export interface OnboardingPayload {
  context: SubagentContext;
  quickReference: {
    currentTask?: string;
    blockedItems: string[];
    urgentActions: string[];
    recentDecisions: string[];
  };
  systemInstructions: string;
  availableTools: string[];
  communicationChannels: {
    broadcast: string;
    directMessage: string;
    progressReport: string;
  };
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_OPTIONS: Required<BootstrapOptions> = {
  depth: OnboardingDepth.STANDARD,
  maxMemories: 20,
  maxSkills: 15,
  includeRelationships: true,
  memoryTypes: ['episodic', 'semantic', 'procedural', 'working'],
  minImportance: 0.3,
  minSkillConfidence: 0.5,
  customContext: {},
  timeout: 500,
};

const DEPTH_CONFIGS: Record<OnboardingDepth, Partial<BootstrapOptions>> = {
  [OnboardingDepth.MINIMAL]: {
    maxMemories: 0,
    maxSkills: 10,
    includeRelationships: false,
    timeout: 100,
  },
  [OnboardingDepth.STANDARD]: {
    maxMemories: 15,
    maxSkills: 15,
    includeRelationships: true,
    timeout: 250,
  },
  [OnboardingDepth.FULL]: {
    maxMemories: 50,
    maxSkills: 30,
    includeRelationships: true,
    timeout: 500,
  },
};

// ============================================================================
// BOOTSTRAP SERVICE
// ============================================================================

/**
 * Subagent Bootstrap Service
 *
 * Provides fast, configurable onboarding for new Claude instances.
 * Optimized for <500ms bootstrap time even with full context.
 */
export class SubagentBootstrap {
  private knowledgeGraph: KnowledgeGraph;
  private skillsCache: Map<string, BootstrapSkill> = new Map();
  private memoriesCache: Map<string, BootstrapMemory> = new Map();
  private activePlanCache: ActivePlan | null = null;
  private masterPlanCache: MasterPlan | null = null;

  constructor(knowledgeGraph?: KnowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph || new KnowledgeGraph();
  }

  /**
   * Get complete bootstrap context for a new subagent
   *
   * @param agentId - Unique identifier for the new agent
   * @param role - Role the agent will perform
   * @param options - Bootstrap configuration options
   * @returns Complete onboarding payload
   */
  async getBootstrapContext(
    agentId: string,
    role: AgentRole,
    options: Partial<BootstrapOptions> = {}
  ): Promise<OnboardingPayload> {
    const startTime = Date.now();

    // Merge options with depth-specific and default configs
    const depthConfig = DEPTH_CONFIGS[options.depth || OnboardingDepth.STANDARD];
    const config: Required<BootstrapOptions> = {
      ...DEFAULT_OPTIONS,
      ...depthConfig,
      ...options,
    };

    // Parallel fetching for performance
    const [skills, memories, activePlan, masterPlan, relationships] = await Promise.all([
      this.getSkills(config),
      this.getMemories(config),
      this.getActivePlan(),
      this.getMasterPlan(),
      config.includeRelationships ? this.getRelationships() : Promise.resolve([]),
    ]);

    const bootstrapTime = Date.now() - startTime;

    // Build subagent context
    const context: SubagentContext = {
      agentId,
      role,
      capabilities: this.getDefaultCapabilities(role),
      skills,
      recentMemories: memories,
      activePlan: activePlan || undefined,
      masterPlan: masterPlan || undefined,
      entityRelationships: relationships,
      sessionContext: this.buildSessionContext(),
      bootstrapDepth: config.depth,
      bootstrapTime,
      timestamp: new Date(),
    };

    // Build quick reference
    const quickReference = this.buildQuickReference(activePlan, memories);

    // Build system instructions based on role
    const systemInstructions = this.buildSystemInstructions(role, context);

    return {
      context,
      quickReference,
      systemInstructions,
      availableTools: this.getAvailableTools(),
      communicationChannels: {
        broadcast: 'mesh://broadcast',
        directMessage: `mesh://agent/${agentId}`,
        progressReport: 'mesh://progress',
      },
    };
  }

  /**
   * Register skills for bootstrap
   */
  registerSkill(skill: BootstrapSkill): void {
    this.skillsCache.set(skill.id, skill);
  }

  /**
   * Register memory for bootstrap
   */
  registerMemory(memory: BootstrapMemory): void {
    this.memoriesCache.set(memory.id, memory);
  }

  /**
   * Set the active plan
   */
  setActivePlan(plan: ActivePlan): void {
    this.activePlanCache = plan;
  }

  /**
   * Set the master plan
   */
  setMasterPlan(plan: MasterPlan): void {
    this.masterPlanCache = plan;
  }

  /**
   * Get skills based on configuration
   */
  private async getSkills(config: Required<BootstrapOptions>): Promise<BootstrapSkill[]> {
    const skills: BootstrapSkill[] = [];

    this.skillsCache.forEach((skill) => {
      if (skill.confidence >= config.minSkillConfidence) {
        skills.push(skill);
      }
    });

    // Sort by confidence and usage, then limit
    return skills
      .sort((a, b) => {
        const scoreA = a.confidence * 0.6 + (a.usageCount / 100) * 0.4;
        const scoreB = b.confidence * 0.6 + (b.usageCount / 100) * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, config.maxSkills);
  }

  /**
   * Get memories based on configuration
   */
  private async getMemories(config: Required<BootstrapOptions>): Promise<BootstrapMemory[]> {
    if (config.maxMemories === 0) {
      return [];
    }

    const memories: BootstrapMemory[] = [];

    this.memoriesCache.forEach((memory) => {
      if (
        memory.importance >= config.minImportance &&
        config.memoryTypes.includes(memory.type)
      ) {
        memories.push(memory);
      }
    });

    // Sort by relevance and importance, then limit
    return memories
      .sort((a, b) => {
        const scoreA = a.relevanceScore * 0.5 + a.importance * 0.5;
        const scoreB = b.relevanceScore * 0.5 + b.importance * 0.5;
        return scoreB - scoreA;
      })
      .slice(0, config.maxMemories);
  }

  /**
   * Get active plan
   */
  private async getActivePlan(): Promise<ActivePlan | null> {
    return this.activePlanCache;
  }

  /**
   * Get master plan
   */
  private async getMasterPlan(): Promise<MasterPlan | null> {
    return this.masterPlanCache;
  }

  /**
   * Get entity relationships from knowledge graph
   */
  private async getRelationships(): Promise<BootstrapRelationship[]> {
    const allRelationships = this.knowledgeGraph.getAllRelationships();
    const result: BootstrapRelationship[] = [];

    for (const rel of allRelationships.slice(0, 50)) {
      const source = this.knowledgeGraph.getEntity(rel.sourceId);
      const target = this.knowledgeGraph.getEntity(rel.targetId);

      if (source && target) {
        result.push({
          sourceId: rel.sourceId,
          sourceName: source.name,
          targetId: rel.targetId,
          targetName: target.name,
          relationType: rel.type,
          weight: rel.weight,
        });
      }
    }

    return result;
  }

  /**
   * Get default capabilities for a role
   */
  private getDefaultCapabilities(role: AgentRole): AgentCapability[] {
    const baseCapabilities: AgentCapability[] = [
      { name: 'memory_access', description: 'Access shared memory system', proficiency: 1.0 },
      { name: 'communication', description: 'Inter-agent messaging', proficiency: 1.0 },
    ];

    const roleCapabilities: Record<AgentRole, AgentCapability[]> = {
      [AgentRole.PLANNER]: [
        { name: 'task_decomposition', description: 'Break down complex tasks', proficiency: 0.9 },
        { name: 'dependency_analysis', description: 'Identify task dependencies', proficiency: 0.85 },
        { name: 'resource_allocation', description: 'Assign tasks to agents', proficiency: 0.8 },
      ],
      [AgentRole.IMPLEMENTER]: [
        { name: 'code_generation', description: 'Write production code', proficiency: 0.95 },
        { name: 'testing', description: 'Write and run tests', proficiency: 0.85 },
        { name: 'debugging', description: 'Find and fix issues', proficiency: 0.9 },
      ],
      [AgentRole.AUDITOR]: [
        { name: 'code_review', description: 'Review code quality', proficiency: 0.9 },
        { name: 'security_analysis', description: 'Identify vulnerabilities', proficiency: 0.85 },
        { name: 'compliance_check', description: 'Verify standards adherence', proficiency: 0.8 },
      ],
      [AgentRole.CLEANER]: [
        { name: 'refactoring', description: 'Improve code structure', proficiency: 0.9 },
        { name: 'documentation', description: 'Write clear docs', proficiency: 0.85 },
        { name: 'debt_reduction', description: 'Address technical debt', proficiency: 0.8 },
      ],
      [AgentRole.RESEARCHER]: [
        { name: 'information_gathering', description: 'Research topics', proficiency: 0.95 },
        { name: 'analysis', description: 'Analyze findings', proficiency: 0.9 },
        { name: 'synthesis', description: 'Combine information', proficiency: 0.85 },
      ],
      [AgentRole.COORDINATOR]: [
        { name: 'orchestration', description: 'Coordinate agents', proficiency: 0.9 },
        { name: 'conflict_resolution', description: 'Resolve conflicts', proficiency: 0.85 },
        { name: 'progress_tracking', description: 'Monitor progress', proficiency: 0.9 },
      ],
      [AgentRole.SPECIALIST]: [
        { name: 'domain_expertise', description: 'Deep domain knowledge', proficiency: 0.95 },
        { name: 'consultation', description: 'Provide expert advice', proficiency: 0.9 },
      ],
    };

    return [...baseCapabilities, ...roleCapabilities[role]];
  }

  /**
   * Build session context
   */
  private buildSessionContext(): SessionContext {
    return {
      sessionId: `session-${Date.now()}`,
      surface: 'cli',
      projectPath: process.cwd(),
      workingDirectory: process.cwd(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
      startedAt: new Date(),
      lastActivity: new Date(),
    };
  }

  /**
   * Build quick reference from context
   */
  private buildQuickReference(
    activePlan: ActivePlan | null,
    memories: BootstrapMemory[]
  ): OnboardingPayload['quickReference'] {
    const blockedItems: string[] = [];
    const urgentActions: string[] = [];

    if (activePlan) {
      for (const item of activePlan.items) {
        if (item.status === 'blocked') {
          blockedItems.push(item.title);
        }
        if (item.priority === 'critical' && item.status !== 'completed') {
          urgentActions.push(item.title);
        }
      }
    }

    // Extract recent decisions from memories
    const recentDecisions = memories
      .filter((m) => m.type === 'episodic' && m.tags.includes('decision'))
      .slice(0, 5)
      .map((m) => m.summary);

    // Find current task
    const currentTask = activePlan?.items.find((i) => i.status === 'in_progress')?.title;

    return {
      currentTask,
      blockedItems,
      urgentActions,
      recentDecisions,
    };
  }

  /**
   * Build system instructions based on role
   */
  private buildSystemInstructions(role: AgentRole, context: SubagentContext): string {
    const roleInstructions: Record<AgentRole, string> = {
      [AgentRole.PLANNER]: `You are a PLANNER agent responsible for:
- Breaking down complex tasks into actionable items
- Identifying dependencies between tasks
- Estimating effort and prioritizing work
- Coordinating with other agents on task distribution`,

      [AgentRole.IMPLEMENTER]: `You are an IMPLEMENTER agent responsible for:
- Writing production-quality code
- Following established patterns and conventions
- Writing tests for new functionality
- Documenting your implementations`,

      [AgentRole.AUDITOR]: `You are an AUDITOR agent responsible for:
- Reviewing code for quality and correctness
- Identifying potential security issues
- Ensuring compliance with standards
- Providing constructive feedback`,

      [AgentRole.CLEANER]: `You are a CLEANER agent responsible for:
- Refactoring code for clarity and maintainability
- Reducing technical debt
- Improving documentation
- Standardizing code style`,

      [AgentRole.RESEARCHER]: `You are a RESEARCHER agent responsible for:
- Gathering information on technical topics
- Analyzing findings and patterns
- Synthesizing research into actionable insights
- Documenting discoveries`,

      [AgentRole.COORDINATOR]: `You are a COORDINATOR agent responsible for:
- Orchestrating work across multiple agents
- Resolving conflicts and blockers
- Tracking overall progress
- Communicating status updates`,

      [AgentRole.SPECIALIST]: `You are a SPECIALIST agent responsible for:
- Providing deep domain expertise
- Consulting on complex decisions
- Reviewing specialized implementations
- Training other agents on domain knowledge`,
    };

    return `${roleInstructions[role]}

CONTEXT:
- Session: ${context.sessionContext.sessionId}
- Bootstrap Depth: ${context.bootstrapDepth}
- Available Skills: ${context.skills.length}
- Recent Memories: ${context.recentMemories.length}
- Active Plan: ${context.activePlan?.name || 'None'}

COMMUNICATION:
- Use the messaging system for inter-agent communication
- Report progress regularly
- Escalate blockers immediately`;
  }

  /**
   * Get list of available tools
   */
  private getAvailableTools(): string[] {
    return [
      'memory_create',
      'memory_get',
      'memory_search',
      'memory_stats',
      'sendToAgent',
      'broadcastToAll',
      'reportProgress',
      'claimTask',
      'getPlanSnapshot',
    ];
  }

  /**
   * Get bootstrap statistics
   */
  getStats(): {
    skillsCount: number;
    memoriesCount: number;
    hasActivePlan: boolean;
    hasMasterPlan: boolean;
    relationshipsCount: number;
  } {
    return {
      skillsCount: this.skillsCache.size,
      memoriesCount: this.memoriesCache.size,
      hasActivePlan: this.activePlanCache !== null,
      hasMasterPlan: this.masterPlanCache !== null,
      relationshipsCount: this.knowledgeGraph.getAllRelationships().length,
    };
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.skillsCache.clear();
    this.memoriesCache.clear();
    this.activePlanCache = null;
    this.masterPlanCache = null;
    this.knowledgeGraph.clear();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new bootstrap service instance
 */
export function createBootstrapService(knowledgeGraph?: KnowledgeGraph): SubagentBootstrap {
  return new SubagentBootstrap(knowledgeGraph);
}

/**
 * Quick bootstrap with minimal options
 */
export async function quickBootstrap(
  agentId: string,
  role: AgentRole = AgentRole.IMPLEMENTER
): Promise<OnboardingPayload> {
  const service = createBootstrapService();
  return service.getBootstrapContext(agentId, role, { depth: OnboardingDepth.MINIMAL });
}

/**
 * Full bootstrap with all context
 */
export async function fullBootstrap(
  agentId: string,
  role: AgentRole,
  knowledgeGraph?: KnowledgeGraph
): Promise<OnboardingPayload> {
  const service = createBootstrapService(knowledgeGraph);
  return service.getBootstrapContext(agentId, role, { depth: OnboardingDepth.FULL });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SubagentBootstrap;
