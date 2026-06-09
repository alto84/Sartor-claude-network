/**
 * Subagent Registry Tests
 */

import {
  SubagentRegistry,
  createRegistry,
  getGlobalRegistry,
  resetGlobalRegistry,
  registerAgent,
  discoverPeers,
  sendHeartbeat,
  AgentStatus,
  type RegisteredAgent,
  type RegistrationOptions,
} from '..//registry';
import { AgentRole } from '..//bootstrap';

describe('SubagentRegistry', () => {
  let registry: SubagentRegistry;

  beforeEach(() => {
    registry = createRegistry({ heartbeatIntervalMs: 100 });
  });

  afterEach(() => {
    registry.stop();
  });

  describe('registerSubagent', () => {
    it('should register a new agent', () => {
      const agent = registry.registerSubagent('agent-1', {
        role: AgentRole.IMPLEMENTER,
      });

      expect(agent).toBeDefined();
      expect(agent.id).toBe('agent-1');
      expect(agent.role).toBe(AgentRole.IMPLEMENTER);
      expect(agent.status).toBe(AgentStatus.INITIALIZING);
    });

    it('should register with capabilities', () => {
      const agent = registry.registerSubagent('agent-2', {
        role: AgentRole.PLANNER,
        capabilities: [
          { name: 'planning', description: 'Task planning', proficiency: 0.9 },
        ],
      });

      expect(agent.capabilities).toHaveLength(1);
      expect(agent.capabilities[0].name).toBe('planning');
    });

    it('should register with parent agent', () => {
      registry.registerSubagent('parent-1', { role: AgentRole.COORDINATOR });
      const child = registry.registerSubagent('child-1', {
        role: AgentRole.IMPLEMENTER,
        parentAgentId: 'parent-1',
      });

      expect(child.parentAgentId).toBe('parent-1');

      const parent = registry.getAgent('parent-1');
      expect(parent?.childAgentIds).toContain('child-1');
    });

    it('should throw error for duplicate active registration', () => {
      registry.registerSubagent('dup-1', { role: AgentRole.IMPLEMENTER });
      registry.heartbeat('dup-1', AgentStatus.ACTIVE);

      expect(() => {
        registry.registerSubagent('dup-1', { role: AgentRole.PLANNER });
      }).toThrow();
    });

    it('should allow re-registration of offline agent', () => {
      const agent1 = registry.registerSubagent('offline-1', { role: AgentRole.IMPLEMENTER });
      registry.updateStatus('offline-1', AgentStatus.OFFLINE);

      const agent2 = registry.registerSubagent('offline-1', { role: AgentRole.PLANNER });
      expect(agent2.role).toBe(AgentRole.PLANNER);
    });

    it('should emit agentRegistered event', () => {
      const listener = jest.fn();
      registry.on('agentRegistered', listener);

      registry.registerSubagent('event-1', { role: AgentRole.IMPLEMENTER });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].id).toBe('event-1');
    });
  });

  describe('unregisterAgent', () => {
    it('should remove agent from registry', () => {
      registry.registerSubagent('remove-1', { role: AgentRole.IMPLEMENTER });

      const result = registry.unregisterAgent('remove-1');

      expect(result).toBe(true);
      expect(registry.getAgent('remove-1')).toBeUndefined();
    });

    it('should return false for non-existent agent', () => {
      const result = registry.unregisterAgent('non-existent');
      expect(result).toBe(false);
    });

    it('should update parent child list on unregister', () => {
      registry.registerSubagent('parent-2', { role: AgentRole.COORDINATOR });
      registry.registerSubagent('child-2', {
        role: AgentRole.IMPLEMENTER,
        parentAgentId: 'parent-2',
      });

      registry.unregisterAgent('child-2');

      const parent = registry.getAgent('parent-2');
      expect(parent?.childAgentIds).not.toContain('child-2');
    });

    it('should emit agentUnregistered event', () => {
      const listener = jest.fn();
      registry.on('agentUnregistered', listener);

      registry.registerSubagent('event-2', { role: AgentRole.IMPLEMENTER });
      registry.unregisterAgent('event-2');

      expect(listener).toHaveBeenCalledWith('event-2');
    });
  });

  describe('getAgent', () => {
    it('should return registered agent', () => {
      registry.registerSubagent('get-1', { role: AgentRole.AUDITOR });

      const agent = registry.getAgent('get-1');

      expect(agent).toBeDefined();
      expect(agent?.role).toBe(AgentRole.AUDITOR);
    });

    it('should return undefined for non-existent agent', () => {
      const agent = registry.getAgent('non-existent');
      expect(agent).toBeUndefined();
    });
  });

  describe('discoverPeers', () => {
    beforeEach(() => {
      registry.registerSubagent('peer-1', { role: AgentRole.IMPLEMENTER });
      registry.registerSubagent('peer-2', { role: AgentRole.PLANNER });
      registry.registerSubagent('peer-3', { role: AgentRole.AUDITOR });
      registry.heartbeat('peer-1', AgentStatus.ACTIVE);
      registry.heartbeat('peer-2', AgentStatus.IDLE);
      registry.heartbeat('peer-3', AgentStatus.BUSY);
    });

    it('should return all agents without filter', () => {
      const peers = registry.discoverPeers();
      expect(peers.length).toBe(3);
    });

    it('should filter by role', () => {
      const peers = registry.discoverPeers({ roles: [AgentRole.IMPLEMENTER] });
      expect(peers.length).toBe(1);
      expect(peers[0].role).toBe(AgentRole.IMPLEMENTER);
    });

    it('should filter by status', () => {
      const peers = registry.discoverPeers({
        statuses: [AgentStatus.ACTIVE, AgentStatus.IDLE],
      });
      expect(peers.length).toBe(2);
    });

    it('should filter by capability', () => {
      registry.registerSubagent('cap-agent', {
        role: AgentRole.SPECIALIST,
        capabilities: [{ name: 'special', description: 'Special skill', proficiency: 0.9 }],
      });
      registry.heartbeat('cap-agent', AgentStatus.ACTIVE);

      const peers = registry.discoverPeers({ capabilities: ['special'] });
      expect(peers.length).toBe(1);
      expect(peers[0].id).toBe('cap-agent');
    });

    it('should exclude specified agents', () => {
      const peers = registry.discoverPeers({ excludeAgentIds: ['peer-1'] });
      expect(peers.some((p) => p.id === 'peer-1')).toBe(false);
    });

    it('should limit results', () => {
      const peers = registry.discoverPeers({ limit: 2 });
      expect(peers.length).toBe(2);
    });

    it('should sort by last activity', async () => {
      // Wait a bit then update activity for peer-3 to ensure it's more recent
      await new Promise((resolve) => setTimeout(resolve, 10));
      registry.heartbeat('peer-3', AgentStatus.BUSY);

      const peers = registry.discoverPeers();
      // peer-3 should be first since it was updated most recently
      expect(peers[0].id).toBe('peer-3');
    });
  });

  describe('findByCapability', () => {
    it('should find agents with specific capability', () => {
      registry.registerSubagent('cap-1', {
        role: AgentRole.IMPLEMENTER,
        capabilities: [{ name: 'typescript', description: 'TS', proficiency: 0.9 }],
      });
      registry.registerSubagent('cap-2', {
        role: AgentRole.IMPLEMENTER,
        capabilities: [{ name: 'python', description: 'Python', proficiency: 0.8 }],
      });
      registry.heartbeat('cap-1', AgentStatus.ACTIVE);
      registry.heartbeat('cap-2', AgentStatus.ACTIVE);

      const agents = registry.findByCapability('typescript');
      expect(agents.length).toBe(1);
      expect(agents[0].id).toBe('cap-1');
    });

    it('should filter by minimum proficiency', () => {
      registry.registerSubagent('prof-1', {
        role: AgentRole.IMPLEMENTER,
        capabilities: [{ name: 'skill', description: 'Skill', proficiency: 0.9 }],
      });
      registry.registerSubagent('prof-2', {
        role: AgentRole.IMPLEMENTER,
        capabilities: [{ name: 'skill', description: 'Skill', proficiency: 0.3 }],
      });
      registry.heartbeat('prof-1', AgentStatus.ACTIVE);
      registry.heartbeat('prof-2', AgentStatus.ACTIVE);

      const agents = registry.findByCapability('skill', 0.5);
      expect(agents.length).toBe(1);
      expect(agents[0].id).toBe('prof-1');
    });
  });

  describe('findByRole', () => {
    it('should find agents by role', () => {
      registry.registerSubagent('role-1', { role: AgentRole.PLANNER });
      registry.registerSubagent('role-2', { role: AgentRole.PLANNER });
      registry.registerSubagent('role-3', { role: AgentRole.IMPLEMENTER });
      registry.heartbeat('role-1', AgentStatus.ACTIVE);
      registry.heartbeat('role-2', AgentStatus.IDLE);
      registry.heartbeat('role-3', AgentStatus.ACTIVE);

      const agents = registry.findByRole(AgentRole.PLANNER);
      expect(agents.length).toBe(2);
    });

    it('should include inactive agents when activeOnly is false', () => {
      registry.registerSubagent('inactive-1', { role: AgentRole.AUDITOR });
      registry.updateStatus('inactive-1', AgentStatus.OFFLINE);

      const activeOnly = registry.findByRole(AgentRole.AUDITOR, true);
      const all = registry.findByRole(AgentRole.AUDITOR, false);

      expect(activeOnly.length).toBe(0);
      expect(all.length).toBe(1);
    });
  });

  describe('heartbeat', () => {
    it('should update last heartbeat time', () => {
      registry.registerSubagent('hb-1', { role: AgentRole.IMPLEMENTER });
      const before = registry.getAgent('hb-1')?.lastHeartbeat;

      // Small delay
      jest.advanceTimersByTime(10);
      registry.heartbeat('hb-1');

      const after = registry.getAgent('hb-1')?.lastHeartbeat;
      expect(after!.getTime()).toBeGreaterThanOrEqual(before!.getTime());
    });

    it('should update status if provided', () => {
      registry.registerSubagent('hb-2', { role: AgentRole.IMPLEMENTER });

      registry.heartbeat('hb-2', AgentStatus.ACTIVE);

      expect(registry.getAgent('hb-2')?.status).toBe(AgentStatus.ACTIVE);
    });

    it('should update current task if provided', () => {
      registry.registerSubagent('hb-3', { role: AgentRole.IMPLEMENTER });

      registry.heartbeat('hb-3', AgentStatus.BUSY, 'task-123');

      expect(registry.getAgent('hb-3')?.currentTaskId).toBe('task-123');
    });

    it('should return heartbeat response', () => {
      registry.registerSubagent('hb-4', { role: AgentRole.IMPLEMENTER });

      const response = registry.heartbeat('hb-4');

      expect(response).toBeDefined();
      expect(response?.accepted).toBe(true);
      expect(response?.nextHeartbeatMs).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent agent', () => {
      const response = registry.heartbeat('non-existent');
      expect(response).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', () => {
      registry.registerSubagent('status-1', { role: AgentRole.IMPLEMENTER });

      registry.updateStatus('status-1', AgentStatus.ACTIVE);

      expect(registry.getAgent('status-1')?.status).toBe(AgentStatus.ACTIVE);
    });

    it('should emit agentStatusChanged event', () => {
      const listener = jest.fn();
      registry.on('agentStatusChanged', listener);

      registry.registerSubagent('status-2', { role: AgentRole.IMPLEMENTER });
      registry.updateStatus('status-2', AgentStatus.ACTIVE);

      expect(listener).toHaveBeenCalledWith(
        'status-2',
        AgentStatus.INITIALIZING,
        AgentStatus.ACTIVE
      );
    });

    it('should emit agentCrashed event for crashed status', () => {
      const listener = jest.fn();
      registry.on('agentCrashed', listener);

      registry.registerSubagent('crash-1', { role: AgentRole.IMPLEMENTER });
      registry.updateStatus('crash-1', AgentStatus.CRASHED);

      expect(listener).toHaveBeenCalledWith('crash-1');
    });
  });

  describe('updateCurrentTask', () => {
    it('should update current task and status', () => {
      registry.registerSubagent('task-1', { role: AgentRole.IMPLEMENTER });
      registry.heartbeat('task-1', AgentStatus.ACTIVE);

      registry.updateCurrentTask('task-1', 'task-abc');

      const agent = registry.getAgent('task-1');
      expect(agent?.currentTaskId).toBe('task-abc');
      expect(agent?.status).toBe(AgentStatus.BUSY);
    });

    it('should clear task and set idle when task is null', () => {
      registry.registerSubagent('task-2', { role: AgentRole.IMPLEMENTER });
      registry.heartbeat('task-2', AgentStatus.BUSY, 'task-xyz');

      registry.updateCurrentTask('task-2', null);

      const agent = registry.getAgent('task-2');
      expect(agent?.currentTaskId).toBeUndefined();
      expect(agent?.status).toBe(AgentStatus.IDLE);
    });
  });

  describe('getStats', () => {
    it('should return registry statistics', () => {
      registry.registerSubagent('stats-1', { role: AgentRole.IMPLEMENTER });
      registry.registerSubagent('stats-2', { role: AgentRole.PLANNER });
      registry.heartbeat('stats-1', AgentStatus.ACTIVE);
      registry.heartbeat('stats-2', AgentStatus.IDLE);

      const stats = registry.getStats();

      expect(stats.totalAgents).toBe(2);
      expect(stats.byRole[AgentRole.IMPLEMENTER]).toBe(1);
      expect(stats.byRole[AgentRole.PLANNER]).toBe(1);
      expect(stats.byStatus[AgentStatus.ACTIVE]).toBe(1);
      expect(stats.byStatus[AgentStatus.IDLE]).toBe(1);
    });
  });

  describe('getChildren', () => {
    it('should return child agents', () => {
      registry.registerSubagent('parent', { role: AgentRole.COORDINATOR });
      registry.registerSubagent('child-a', {
        role: AgentRole.IMPLEMENTER,
        parentAgentId: 'parent',
      });
      registry.registerSubagent('child-b', {
        role: AgentRole.AUDITOR,
        parentAgentId: 'parent',
      });

      const children = registry.getChildren('parent');
      expect(children.length).toBe(2);
    });
  });

  describe('getParent', () => {
    it('should return parent agent', () => {
      registry.registerSubagent('p', { role: AgentRole.COORDINATOR });
      registry.registerSubagent('c', {
        role: AgentRole.IMPLEMENTER,
        parentAgentId: 'p',
      });

      const parent = registry.getParent('c');
      expect(parent?.id).toBe('p');
    });

    it('should return undefined for agent without parent', () => {
      registry.registerSubagent('orphan', { role: AgentRole.IMPLEMENTER });

      const parent = registry.getParent('orphan');
      expect(parent).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove all agents', () => {
      registry.registerSubagent('clear-1', { role: AgentRole.IMPLEMENTER });
      registry.registerSubagent('clear-2', { role: AgentRole.PLANNER });

      registry.clear();

      expect(registry.getAllAgents()).toHaveLength(0);
    });
  });
});

describe('Global Registry', () => {
  beforeEach(() => {
    resetGlobalRegistry();
  });

  afterEach(() => {
    resetGlobalRegistry();
  });

  it('should return same instance', () => {
    const reg1 = getGlobalRegistry();
    const reg2 = getGlobalRegistry();
    expect(reg1).toBe(reg2);
  });

  it('should support convenience functions', () => {
    const agent = registerAgent('global-1', { role: AgentRole.IMPLEMENTER });
    expect(agent.id).toBe('global-1');

    sendHeartbeat('global-1', AgentStatus.ACTIVE);
    expect(getGlobalRegistry().getAgent('global-1')?.status).toBe(AgentStatus.ACTIVE);

    const peers = discoverPeers({ statuses: [AgentStatus.ACTIVE] });
    expect(peers.length).toBe(1);
  });
});
