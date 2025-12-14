/**
 * Subagent Registry & Discovery Module
 *
 * Provides:
 * - Agent registration with capability declaration
 * - Peer discovery across sessions
 * - Heartbeat-based liveness monitoring
 * - Cross-surface agent visibility
 *
 * @module subagent/registry
 */

import { AgentRole, AgentCapability } from './bootstrap';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Agent status in the registry
 */
export enum AgentStatus {
  /** Agent is starting up */
  INITIALIZING = 'initializing',
  /** Agent is active and accepting work */
  ACTIVE = 'active',
  /** Agent is busy with a task */
  BUSY = 'busy',
  /** Agent is idle, waiting for work */
  IDLE = 'idle',
  /** Agent is shutting down */
  SHUTTING_DOWN = 'shutting_down',
  /** Agent is offline (missed heartbeats) */
  OFFLINE = 'offline',
  /** Agent terminated unexpectedly */
  CRASHED = 'crashed',
}

/**
 * Registered agent information
 */
export interface RegisteredAgent {
  /** Unique agent identifier */
  id: string;
  /** Agent role */
  role: AgentRole;
  /** Agent capabilities */
  capabilities: AgentCapability[];
  /** Current status */
  status: AgentStatus;
  /** Parent agent ID if spawned by another agent */
  parentAgentId?: string;
  /** Child agent IDs */
  childAgentIds: string[];
  /** Surface where agent is running */
  surface: 'web' | 'mobile' | 'desktop' | 'api' | 'slack' | 'cli';
  /** Session ID */
  sessionId: string;
  /** Registration timestamp */
  registeredAt: Date;
  /** Last heartbeat timestamp */
  lastHeartbeat: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Current task ID if any */
  currentTaskId?: string;
  /** Custom metadata */
  metadata: Record<string, unknown>;
}

/**
 * Registration options
 */
export interface RegistrationOptions {
  /** Agent role */
  role: AgentRole;
  /** Agent capabilities */
  capabilities?: AgentCapability[];
  /** Parent agent ID */
  parentAgentId?: string;
  /** Running surface */
  surface?: RegisteredAgent['surface'];
  /** Session ID */
  sessionId?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Peer discovery filter options
 */
export interface DiscoveryFilter {
  /** Filter by role */
  roles?: AgentRole[];
  /** Filter by status */
  statuses?: AgentStatus[];
  /** Filter by capability name */
  capabilities?: string[];
  /** Filter by surface */
  surfaces?: RegisteredAgent['surface'][];
  /** Exclude these agent IDs */
  excludeAgentIds?: string[];
  /** Only return agents with recent activity (ms) */
  activeWithinMs?: number;
  /** Maximum number of results */
  limit?: number;
}

/**
 * Heartbeat response
 */
export interface HeartbeatResponse {
  /** Whether heartbeat was accepted */
  accepted: boolean;
  /** Next expected heartbeat time (ms from now) */
  nextHeartbeatMs: number;
  /** Messages waiting for this agent */
  pendingMessages: number;
  /** Assigned tasks waiting */
  pendingTasks: number;
  /** Server timestamp */
  serverTime: Date;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  /** Total registered agents */
  totalAgents: number;
  /** Agents by status */
  byStatus: Record<AgentStatus, number>;
  /** Agents by role */
  byRole: Record<AgentRole, number>;
  /** Agents by surface */
  bySurface: Record<string, number>;
  /** Active sessions */
  activeSessions: number;
  /** Agents crashed in last hour */
  recentCrashes: number;
}

/**
 * Registry events
 */
export interface RegistryEvents {
  agentRegistered: (agent: RegisteredAgent) => void;
  agentUnregistered: (agentId: string) => void;
  agentStatusChanged: (agentId: string, oldStatus: AgentStatus, newStatus: AgentStatus) => void;
  agentCrashed: (agentId: string) => void;
  heartbeatMissed: (agentId: string, missedCount: number) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default heartbeat interval in milliseconds */
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

/** Number of missed heartbeats before marking offline */
const MISSED_HEARTBEATS_THRESHOLD = 3;

/** Time to wait before removing crashed agents (ms) */
const CRASHED_AGENT_RETENTION_MS = 3600000; // 1 hour

// ============================================================================
// SUBAGENT REGISTRY
// ============================================================================

/**
 * Subagent Registry
 *
 * Centralized registry for managing and discovering agents across
 * sessions and surfaces. Supports heartbeat-based liveness monitoring.
 */
export class SubagentRegistry extends EventEmitter {
  private agents: Map<string, RegisteredAgent> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private missedHeartbeats: Map<string, number> = new Map();
  private heartbeatIntervalMs: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: { heartbeatIntervalMs?: number } = {}) {
    super();
    this.heartbeatIntervalMs = options.heartbeatIntervalMs || DEFAULT_HEARTBEAT_INTERVAL_MS;
    this.startCleanupTimer();
  }

  /**
   * Register a new subagent
   *
   * @param agentId - Unique agent identifier
   * @param options - Registration options
   * @returns Registered agent information
   */
  registerSubagent(agentId: string, options: RegistrationOptions): RegisteredAgent {
    // Check for duplicate registration
    if (this.agents.has(agentId)) {
      const existing = this.agents.get(agentId)!;
      if (existing.status !== AgentStatus.OFFLINE && existing.status !== AgentStatus.CRASHED) {
        throw new Error(`Agent ${agentId} is already registered and active`);
      }
      // Re-registration of offline/crashed agent is allowed
    }

    const now = new Date();
    const agent: RegisteredAgent = {
      id: agentId,
      role: options.role,
      capabilities: options.capabilities || [],
      status: AgentStatus.INITIALIZING,
      parentAgentId: options.parentAgentId,
      childAgentIds: [],
      surface: options.surface || 'cli',
      sessionId: options.sessionId || `session-${Date.now()}`,
      registeredAt: now,
      lastHeartbeat: now,
      lastActivity: now,
      metadata: options.metadata || {},
    };

    // Register the agent
    this.agents.set(agentId, agent);

    // Update parent's child list
    if (options.parentAgentId) {
      const parent = this.agents.get(options.parentAgentId);
      if (parent) {
        parent.childAgentIds.push(agentId);
      }
    }

    // Start heartbeat monitoring
    this.startHeartbeatMonitor(agentId);

    // Emit registration event
    this.emit('agentRegistered', agent);

    return agent;
  }

  /**
   * Unregister an agent
   *
   * @param agentId - Agent to unregister
   * @returns Whether agent was found and unregistered
   */
  unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    // Update status to shutting down
    this.updateStatus(agentId, AgentStatus.SHUTTING_DOWN);

    // Remove from parent's child list
    if (agent.parentAgentId) {
      const parent = this.agents.get(agent.parentAgentId);
      if (parent) {
        parent.childAgentIds = parent.childAgentIds.filter((id) => id !== agentId);
      }
    }

    // Handle orphaned children
    for (const childId of agent.childAgentIds) {
      const child = this.agents.get(childId);
      if (child) {
        child.parentAgentId = undefined;
      }
    }

    // Stop heartbeat monitoring
    this.stopHeartbeatMonitor(agentId);

    // Remove agent
    this.agents.delete(agentId);
    this.missedHeartbeats.delete(agentId);

    // Emit unregistration event
    this.emit('agentUnregistered', agentId);

    return true;
  }

  /**
   * Get agent by ID
   *
   * @param agentId - Agent identifier
   * @returns Agent information or undefined
   */
  getAgent(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Discover peer agents
   *
   * @param filter - Discovery filter options
   * @returns List of matching agents
   */
  discoverPeers(filter: DiscoveryFilter = {}): RegisteredAgent[] {
    const now = Date.now();
    let results: RegisteredAgent[] = [];

    for (const agent of this.agents.values()) {
      // Apply filters
      if (filter.roles && !filter.roles.includes(agent.role)) {
        continue;
      }

      if (filter.statuses && !filter.statuses.includes(agent.status)) {
        continue;
      }

      if (filter.surfaces && !filter.surfaces.includes(agent.surface)) {
        continue;
      }

      if (filter.excludeAgentIds && filter.excludeAgentIds.includes(agent.id)) {
        continue;
      }

      if (filter.activeWithinMs) {
        const lastActivityMs = now - agent.lastActivity.getTime();
        if (lastActivityMs > filter.activeWithinMs) {
          continue;
        }
      }

      if (filter.capabilities && filter.capabilities.length > 0) {
        const agentCapNames = agent.capabilities.map((c) => c.name);
        const hasAllCaps = filter.capabilities.every((cap) => agentCapNames.includes(cap));
        if (!hasAllCaps) {
          continue;
        }
      }

      results.push(agent);
    }

    // Sort by last activity (most recent first)
    results.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // Apply limit
    if (filter.limit && results.length > filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  /**
   * Find agents by capability
   *
   * @param capabilityName - Capability to search for
   * @param minProficiency - Minimum proficiency level (0-1)
   * @returns Agents with matching capability
   */
  findByCapability(capabilityName: string, minProficiency: number = 0): RegisteredAgent[] {
    return this.discoverPeers({
      statuses: [AgentStatus.ACTIVE, AgentStatus.IDLE],
    }).filter((agent) =>
      agent.capabilities.some(
        (cap) => cap.name === capabilityName && cap.proficiency >= minProficiency
      )
    );
  }

  /**
   * Find agents by role
   *
   * @param role - Role to search for
   * @param activeOnly - Only return active/idle agents
   * @returns Agents with matching role
   */
  findByRole(role: AgentRole, activeOnly: boolean = true): RegisteredAgent[] {
    const statuses = activeOnly
      ? [AgentStatus.ACTIVE, AgentStatus.IDLE]
      : Object.values(AgentStatus);

    return this.discoverPeers({ roles: [role], statuses });
  }

  /**
   * Process heartbeat from agent
   *
   * @param agentId - Agent sending heartbeat
   * @param status - Optional status update
   * @param taskId - Optional current task ID
   * @returns Heartbeat response
   */
  heartbeat(agentId: string, status?: AgentStatus, taskId?: string): HeartbeatResponse | undefined {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return undefined;
    }

    const now = new Date();
    agent.lastHeartbeat = now;
    agent.lastActivity = now;

    // Reset missed heartbeat counter
    this.missedHeartbeats.set(agentId, 0);

    // Update status if provided
    if (status && status !== agent.status) {
      this.updateStatus(agentId, status);
    }

    // Update current task
    if (taskId !== undefined) {
      agent.currentTaskId = taskId || undefined;
    }

    // Calculate pending items (placeholder - would integrate with messaging)
    const pendingMessages = 0; // TODO: integrate with messaging module
    const pendingTasks = 0; // TODO: integrate with work distribution

    return {
      accepted: true,
      nextHeartbeatMs: this.heartbeatIntervalMs,
      pendingMessages,
      pendingTasks,
      serverTime: now,
    };
  }

  /**
   * Update agent status
   *
   * @param agentId - Agent ID
   * @param newStatus - New status
   */
  updateStatus(agentId: string, newStatus: AgentStatus): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return;
    }

    const oldStatus = agent.status;
    if (oldStatus === newStatus) {
      return;
    }

    agent.status = newStatus;
    agent.lastActivity = new Date();

    this.emit('agentStatusChanged', agentId, oldStatus, newStatus);

    if (newStatus === AgentStatus.CRASHED) {
      this.emit('agentCrashed', agentId);
    }
  }

  /**
   * Update agent's current task
   *
   * @param agentId - Agent ID
   * @param taskId - Task ID or null to clear
   */
  updateCurrentTask(agentId: string, taskId: string | null): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.currentTaskId = taskId || undefined;
      agent.lastActivity = new Date();
      if (taskId) {
        this.updateStatus(agentId, AgentStatus.BUSY);
      } else if (agent.status === AgentStatus.BUSY) {
        this.updateStatus(agentId, AgentStatus.IDLE);
      }
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const stats: RegistryStats = {
      totalAgents: this.agents.size,
      byStatus: {} as Record<AgentStatus, number>,
      byRole: {} as Record<AgentRole, number>,
      bySurface: {},
      activeSessions: 0,
      recentCrashes: 0,
    };

    // Initialize counters
    for (const status of Object.values(AgentStatus)) {
      stats.byStatus[status] = 0;
    }
    for (const role of Object.values(AgentRole)) {
      stats.byRole[role] = 0;
    }

    const sessions = new Set<string>();
    const oneHourAgo = Date.now() - 3600000;

    for (const agent of this.agents.values()) {
      stats.byStatus[agent.status]++;
      stats.byRole[agent.role]++;
      stats.bySurface[agent.surface] = (stats.bySurface[agent.surface] || 0) + 1;
      sessions.add(agent.sessionId);

      if (agent.status === AgentStatus.CRASHED && agent.lastActivity.getTime() > oneHourAgo) {
        stats.recentCrashes++;
      }
    }

    stats.activeSessions = sessions.size;

    return stats;
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get children of an agent
   *
   * @param agentId - Parent agent ID
   * @returns Child agents
   */
  getChildren(agentId: string): RegisteredAgent[] {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return [];
    }

    return agent.childAgentIds
      .map((id) => this.agents.get(id))
      .filter((a): a is RegisteredAgent => a !== undefined);
  }

  /**
   * Get parent of an agent
   *
   * @param agentId - Child agent ID
   * @returns Parent agent or undefined
   */
  getParent(agentId: string): RegisteredAgent | undefined {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.parentAgentId) {
      return undefined;
    }
    return this.agents.get(agent.parentAgentId);
  }

  /**
   * Clear all agents (for testing)
   */
  clear(): void {
    // Stop all heartbeat monitors
    for (const agentId of this.agents.keys()) {
      this.stopHeartbeatMonitor(agentId);
    }

    this.agents.clear();
    this.missedHeartbeats.clear();
  }

  /**
   * Stop the registry (cleanup)
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    for (const agentId of this.agents.keys()) {
      this.stopHeartbeatMonitor(agentId);
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Start heartbeat monitoring for an agent
   */
  private startHeartbeatMonitor(agentId: string): void {
    this.stopHeartbeatMonitor(agentId);
    this.missedHeartbeats.set(agentId, 0);

    const timer = setInterval(() => {
      this.checkHeartbeat(agentId);
    }, this.heartbeatIntervalMs);

    this.heartbeatTimers.set(agentId, timer);
  }

  /**
   * Stop heartbeat monitoring for an agent
   */
  private stopHeartbeatMonitor(agentId: string): void {
    const timer = this.heartbeatTimers.get(agentId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(agentId);
    }
  }

  /**
   * Check heartbeat for an agent
   */
  private checkHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.stopHeartbeatMonitor(agentId);
      return;
    }

    // Don't check offline or crashed agents
    if (agent.status === AgentStatus.OFFLINE || agent.status === AgentStatus.CRASHED) {
      return;
    }

    const missedCount = (this.missedHeartbeats.get(agentId) || 0) + 1;
    this.missedHeartbeats.set(agentId, missedCount);

    this.emit('heartbeatMissed', agentId, missedCount);

    if (missedCount >= MISSED_HEARTBEATS_THRESHOLD) {
      // Mark as offline after too many missed heartbeats
      this.updateStatus(agentId, AgentStatus.OFFLINE);
    }
  }

  /**
   * Start periodic cleanup of crashed agents
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupCrashedAgents();
    }, CRASHED_AGENT_RETENTION_MS / 4); // Run cleanup periodically
  }

  /**
   * Clean up old crashed agents
   */
  private cleanupCrashedAgents(): void {
    const cutoff = Date.now() - CRASHED_AGENT_RETENTION_MS;

    for (const [agentId, agent] of this.agents.entries()) {
      if (agent.status === AgentStatus.CRASHED && agent.lastActivity.getTime() < cutoff) {
        this.unregisterAgent(agentId);
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/** Global registry instance */
let globalRegistry: SubagentRegistry | null = null;

/**
 * Get the global registry instance
 */
export function getGlobalRegistry(): SubagentRegistry {
  if (!globalRegistry) {
    globalRegistry = new SubagentRegistry();
  }
  return globalRegistry;
}

/**
 * Create a new registry instance
 */
export function createRegistry(options?: { heartbeatIntervalMs?: number }): SubagentRegistry {
  return new SubagentRegistry(options);
}

/**
 * Reset the global registry (for testing)
 */
export function resetGlobalRegistry(): void {
  if (globalRegistry) {
    globalRegistry.stop();
    globalRegistry = null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Register an agent in the global registry
 */
export function registerAgent(agentId: string, options: RegistrationOptions): RegisteredAgent {
  return getGlobalRegistry().registerSubagent(agentId, options);
}

/**
 * Discover peers in the global registry
 */
export function discoverPeers(filter?: DiscoveryFilter): RegisteredAgent[] {
  return getGlobalRegistry().discoverPeers(filter);
}

/**
 * Send heartbeat to global registry
 */
export function sendHeartbeat(
  agentId: string,
  status?: AgentStatus,
  taskId?: string
): HeartbeatResponse | undefined {
  return getGlobalRegistry().heartbeat(agentId, status, taskId);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SubagentRegistry;
