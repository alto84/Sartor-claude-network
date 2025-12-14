/**
 * Subagent Bootstrap Tests
 */

import {
  SubagentBootstrap,
  createBootstrapService,
  quickBootstrap,
  fullBootstrap,
  OnboardingDepth,
  AgentRole,
  type BootstrapSkill,
  type BootstrapMemory,
  type ActivePlan,
  type MasterPlan,
} from '..//bootstrap';
import { KnowledgeGraph, EntityType, RelationType } from '../../mcp/knowledge-graph';

describe('SubagentBootstrap', () => {
  let bootstrap: SubagentBootstrap;

  beforeEach(() => {
    bootstrap = new SubagentBootstrap();
  });

  describe('constructor', () => {
    it('should create instance with default knowledge graph', () => {
      const service = new SubagentBootstrap();
      expect(service).toBeInstanceOf(SubagentBootstrap);
    });

    it('should accept custom knowledge graph', () => {
      const graph = new KnowledgeGraph();
      const service = new SubagentBootstrap(graph);
      expect(service).toBeInstanceOf(SubagentBootstrap);
    });
  });

  describe('getBootstrapContext', () => {
    it('should return onboarding payload with minimal depth', async () => {
      const payload = await bootstrap.getBootstrapContext('agent-1', AgentRole.IMPLEMENTER, {
        depth: OnboardingDepth.MINIMAL,
      });

      expect(payload.context).toBeDefined();
      expect(payload.context.agentId).toBe('agent-1');
      expect(payload.context.role).toBe(AgentRole.IMPLEMENTER);
      expect(payload.context.bootstrapDepth).toBe(OnboardingDepth.MINIMAL);
      expect(payload.context.bootstrapTime).toBeLessThan(200);
    });

    it('should return onboarding payload with standard depth', async () => {
      const payload = await bootstrap.getBootstrapContext('agent-2', AgentRole.PLANNER, {
        depth: OnboardingDepth.STANDARD,
      });

      expect(payload.context.bootstrapDepth).toBe(OnboardingDepth.STANDARD);
      expect(payload.quickReference).toBeDefined();
    });

    it('should return onboarding payload with full depth', async () => {
      const payload = await bootstrap.getBootstrapContext('agent-3', AgentRole.AUDITOR, {
        depth: OnboardingDepth.FULL,
      });

      expect(payload.context.bootstrapDepth).toBe(OnboardingDepth.FULL);
    });

    it('should include role-specific capabilities', async () => {
      const plannerPayload = await bootstrap.getBootstrapContext('p1', AgentRole.PLANNER);
      const implementerPayload = await bootstrap.getBootstrapContext('i1', AgentRole.IMPLEMENTER);

      const plannerCaps = plannerPayload.context.capabilities.map((c) => c.name);
      const implementerCaps = implementerPayload.context.capabilities.map((c) => c.name);

      expect(plannerCaps).toContain('task_decomposition');
      expect(implementerCaps).toContain('code_generation');
    });

    it('should include system instructions based on role', async () => {
      const payload = await bootstrap.getBootstrapContext('agent-4', AgentRole.COORDINATOR);

      expect(payload.systemInstructions).toContain('COORDINATOR');
      expect(payload.systemInstructions).toContain('Orchestrat');
    });

    it('should include communication channels', async () => {
      const payload = await bootstrap.getBootstrapContext('agent-5', AgentRole.IMPLEMENTER);

      expect(payload.communicationChannels.broadcast).toBe('mesh://broadcast');
      expect(payload.communicationChannels.directMessage).toBe('mesh://agent/agent-5');
      expect(payload.communicationChannels.progressReport).toBe('mesh://progress');
    });

    it('should include session context', async () => {
      const payload = await bootstrap.getBootstrapContext('agent-6', AgentRole.RESEARCHER);

      expect(payload.context.sessionContext).toBeDefined();
      expect(payload.context.sessionContext.sessionId).toBeDefined();
      expect(payload.context.sessionContext.surface).toBe('cli');
    });

    it('should include available tools list', async () => {
      const payload = await bootstrap.getBootstrapContext('agent-7', AgentRole.SPECIALIST);

      expect(payload.availableTools).toContain('memory_create');
      expect(payload.availableTools).toContain('sendToAgent');
      expect(payload.availableTools).toContain('claimTask');
    });
  });

  describe('registerSkill', () => {
    it('should register skills for bootstrap', async () => {
      const skill: BootstrapSkill = {
        id: 'skill-1',
        name: 'TypeScript',
        description: 'TypeScript programming',
        usage: 'Use for type-safe coding',
        usageCount: 10,
        confidence: 0.9,
      };

      bootstrap.registerSkill(skill);

      const payload = await bootstrap.getBootstrapContext('agent-8', AgentRole.IMPLEMENTER);
      expect(payload.context.skills.some((s) => s.id === 'skill-1')).toBe(true);
    });

    it('should filter skills by confidence', async () => {
      bootstrap.registerSkill({
        id: 'high-conf',
        name: 'High Confidence',
        description: 'High confidence skill',
        usage: 'Use often',
        usageCount: 100,
        confidence: 0.95,
      });

      bootstrap.registerSkill({
        id: 'low-conf',
        name: 'Low Confidence',
        description: 'Low confidence skill',
        usage: 'Use rarely',
        usageCount: 5,
        confidence: 0.2,
      });

      const payload = await bootstrap.getBootstrapContext('agent-9', AgentRole.IMPLEMENTER, {
        minSkillConfidence: 0.5,
      });

      expect(payload.context.skills.some((s) => s.id === 'high-conf')).toBe(true);
      expect(payload.context.skills.some((s) => s.id === 'low-conf')).toBe(false);
    });
  });

  describe('registerMemory', () => {
    it('should register memories for bootstrap', async () => {
      const memory: BootstrapMemory = {
        id: 'mem-1',
        type: 'episodic',
        summary: 'Important meeting notes',
        importance: 0.8,
        relevanceScore: 0.9,
        createdAt: new Date(),
        tags: ['meeting', 'important'],
      };

      bootstrap.registerMemory(memory);

      const payload = await bootstrap.getBootstrapContext('agent-10', AgentRole.COORDINATOR, {
        depth: OnboardingDepth.STANDARD,
      });

      expect(payload.context.recentMemories.some((m) => m.id === 'mem-1')).toBe(true);
    });

    it('should filter memories by importance', async () => {
      bootstrap.registerMemory({
        id: 'important',
        type: 'semantic',
        summary: 'Important knowledge',
        importance: 0.9,
        relevanceScore: 0.8,
        createdAt: new Date(),
        tags: [],
      });

      bootstrap.registerMemory({
        id: 'trivial',
        type: 'episodic',
        summary: 'Trivial note',
        importance: 0.1,
        relevanceScore: 0.2,
        createdAt: new Date(),
        tags: [],
      });

      const payload = await bootstrap.getBootstrapContext('agent-11', AgentRole.RESEARCHER, {
        minImportance: 0.5,
        depth: OnboardingDepth.FULL,
      });

      expect(payload.context.recentMemories.some((m) => m.id === 'important')).toBe(true);
      expect(payload.context.recentMemories.some((m) => m.id === 'trivial')).toBe(false);
    });
  });

  describe('setActivePlan', () => {
    it('should set active plan for bootstrap', async () => {
      const plan: ActivePlan = {
        id: 'plan-1',
        name: 'Test Plan',
        description: 'A test plan',
        items: [
          {
            id: 'item-1',
            title: 'First task',
            status: 'in_progress',
            priority: 'high',
            dependencies: [],
            progress: 50,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: 'user-1',
        collaborators: [],
      };

      bootstrap.setActivePlan(plan);

      const payload = await bootstrap.getBootstrapContext('agent-12', AgentRole.PLANNER);

      expect(payload.context.activePlan).toBeDefined();
      expect(payload.context.activePlan?.name).toBe('Test Plan');
      expect(payload.quickReference.currentTask).toBe('First task');
    });

    it('should identify blocked items in quick reference', async () => {
      const plan: ActivePlan = {
        id: 'plan-2',
        name: 'Blocked Plan',
        description: 'Plan with blocked items',
        items: [
          {
            id: 'blocked-1',
            title: 'Blocked task',
            status: 'blocked',
            priority: 'high',
            dependencies: [],
            progress: 0,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: 'user-1',
        collaborators: [],
      };

      bootstrap.setActivePlan(plan);

      const payload = await bootstrap.getBootstrapContext('agent-13', AgentRole.COORDINATOR);

      expect(payload.quickReference.blockedItems).toContain('Blocked task');
    });

    it('should identify urgent actions in quick reference', async () => {
      const plan: ActivePlan = {
        id: 'plan-3',
        name: 'Urgent Plan',
        description: 'Plan with critical items',
        items: [
          {
            id: 'critical-1',
            title: 'Critical task',
            status: 'pending',
            priority: 'critical',
            dependencies: [],
            progress: 0,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: 'user-1',
        collaborators: [],
      };

      bootstrap.setActivePlan(plan);

      const payload = await bootstrap.getBootstrapContext('agent-14', AgentRole.IMPLEMENTER);

      expect(payload.quickReference.urgentActions).toContain('Critical task');
    });
  });

  describe('setMasterPlan', () => {
    it('should set master plan for bootstrap', async () => {
      const masterPlan: MasterPlan = {
        id: 'master-1',
        name: 'Project Master Plan',
        currentPhase: 'Phase 2',
        totalPhases: 5,
        overallProgress: 40,
        priorities: ['Finish feature X', 'Fix bug Y'],
        lastUpdated: new Date(),
      };

      bootstrap.setMasterPlan(masterPlan);

      const payload = await bootstrap.getBootstrapContext('agent-15', AgentRole.PLANNER);

      expect(payload.context.masterPlan).toBeDefined();
      expect(payload.context.masterPlan?.currentPhase).toBe('Phase 2');
    });
  });

  describe('getStats', () => {
    it('should return bootstrap statistics', () => {
      bootstrap.registerSkill({
        id: 's1',
        name: 'Skill 1',
        description: 'Test',
        usage: 'Test',
        usageCount: 1,
        confidence: 0.9,
      });

      bootstrap.registerMemory({
        id: 'm1',
        type: 'episodic',
        summary: 'Memory 1',
        importance: 0.8,
        relevanceScore: 0.7,
        createdAt: new Date(),
        tags: [],
      });

      const stats = bootstrap.getStats();

      expect(stats.skillsCount).toBe(1);
      expect(stats.memoriesCount).toBe(1);
      expect(stats.hasActivePlan).toBe(false);
      expect(stats.hasMasterPlan).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all caches', () => {
      bootstrap.registerSkill({
        id: 's1',
        name: 'Skill 1',
        description: 'Test',
        usage: 'Test',
        usageCount: 1,
        confidence: 0.9,
      });

      bootstrap.clear();

      const stats = bootstrap.getStats();
      expect(stats.skillsCount).toBe(0);
    });
  });
});

describe('Factory Functions', () => {
  describe('createBootstrapService', () => {
    it('should create new bootstrap service', () => {
      const service = createBootstrapService();
      expect(service).toBeInstanceOf(SubagentBootstrap);
    });

    it('should accept custom knowledge graph', () => {
      const graph = new KnowledgeGraph();
      const service = createBootstrapService(graph);
      expect(service).toBeInstanceOf(SubagentBootstrap);
    });
  });

  describe('quickBootstrap', () => {
    it('should bootstrap with minimal depth', async () => {
      const payload = await quickBootstrap('quick-agent');

      expect(payload.context.bootstrapDepth).toBe(OnboardingDepth.MINIMAL);
      expect(payload.context.role).toBe(AgentRole.IMPLEMENTER);
    });

    it('should accept custom role', async () => {
      const payload = await quickBootstrap('quick-agent-2', AgentRole.AUDITOR);

      expect(payload.context.role).toBe(AgentRole.AUDITOR);
    });
  });

  describe('fullBootstrap', () => {
    it('should bootstrap with full depth', async () => {
      const payload = await fullBootstrap('full-agent', AgentRole.COORDINATOR);

      expect(payload.context.bootstrapDepth).toBe(OnboardingDepth.FULL);
      expect(payload.context.role).toBe(AgentRole.COORDINATOR);
    });
  });
});

describe('Performance', () => {
  it('should complete minimal bootstrap under 200ms', async () => {
    const bootstrap = createBootstrapService();
    const start = Date.now();

    await bootstrap.getBootstrapContext('perf-1', AgentRole.IMPLEMENTER, {
      depth: OnboardingDepth.MINIMAL,
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it('should complete standard bootstrap under 300ms', async () => {
    const bootstrap = createBootstrapService();
    const start = Date.now();

    await bootstrap.getBootstrapContext('perf-2', AgentRole.IMPLEMENTER, {
      depth: OnboardingDepth.STANDARD,
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(300);
  });

  it('should complete full bootstrap under 600ms', async () => {
    const bootstrap = createBootstrapService();
    const start = Date.now();

    await bootstrap.getBootstrapContext('perf-3', AgentRole.IMPLEMENTER, {
      depth: OnboardingDepth.FULL,
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(600);
  });
});
