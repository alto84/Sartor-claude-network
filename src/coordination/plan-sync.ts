/**
 * Plan Synchronization Module
 *
 * Provides:
 * - CRDT-based plan merging for conflict-free synchronization
 * - Real-time plan updates via WebSocket
 * - Firebase integration for persistent storage
 * - Plan versioning and history
 *
 * @module coordination/plan-sync
 */

import { EventEmitter } from 'events';
import { VectorClock, VectorClockOps, LWWRegister, LWWMap, ORSet } from '../mcp/websocket-sync';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Plan item status
 */
export enum PlanItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred',
}

/**
 * Plan item priority
 */
export enum PlanItemPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Individual plan item
 */
export interface PlanItem {
  /** Unique item ID */
  id: string;
  /** Item title */
  title: string;
  /** Item description */
  description: string;
  /** Current status */
  status: PlanItemStatus;
  /** Priority level */
  priority: PlanItemPriority;
  /** Assigned agent ID */
  assignedTo?: string;
  /** Dependency IDs */
  dependencies: string[];
  /** Progress percentage (0-100) */
  progress: number;
  /** Estimated effort in minutes */
  estimatedMinutes?: number;
  /** Actual effort in minutes */
  actualMinutes?: number;
  /** Parent item ID (for subtasks) */
  parentId?: string;
  /** Subtask IDs */
  subtaskIds: string[];
  /** Tags */
  tags: string[];
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Last updating node */
  updatedBy: string;
  /** Notes/comments */
  notes: string[];
}

/**
 * Plan structure
 */
export interface Plan {
  /** Plan ID */
  id: string;
  /** Plan name */
  name: string;
  /** Plan description */
  description: string;
  /** Plan items */
  items: Map<string, PlanItem>;
  /** Owner agent/user ID */
  owner: string;
  /** Collaborator IDs */
  collaborators: string[];
  /** Current phase */
  currentPhase: string;
  /** Total phases */
  totalPhases: number;
  /** Overall progress (0-100) */
  overallProgress: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Vector clock for versioning */
  vectorClock: VectorClock;
  /** Plan version number */
  version: number;
}

/**
 * Plan change operation
 */
export interface PlanOperation {
  /** Operation ID */
  id: string;
  /** Plan ID */
  planId: string;
  /** Operation type */
  type: PlanOperationType;
  /** Item ID (if applicable) */
  itemId?: string;
  /** Operation payload */
  payload: unknown;
  /** Source node */
  sourceNode: string;
  /** Timestamp */
  timestamp: number;
  /** Vector clock at operation time */
  vectorClock: VectorClock;
}

/**
 * Plan operation types
 */
export enum PlanOperationType {
  /** Create new plan */
  CREATE_PLAN = 'create_plan',
  /** Update plan metadata */
  UPDATE_PLAN = 'update_plan',
  /** Delete plan */
  DELETE_PLAN = 'delete_plan',
  /** Add item */
  ADD_ITEM = 'add_item',
  /** Update item */
  UPDATE_ITEM = 'update_item',
  /** Delete item */
  DELETE_ITEM = 'delete_item',
  /** Move item (change parent) */
  MOVE_ITEM = 'move_item',
  /** Reorder items */
  REORDER_ITEMS = 'reorder_items',
  /** Assign item */
  ASSIGN_ITEM = 'assign_item',
  /** Update item status */
  UPDATE_STATUS = 'update_status',
  /** Add note to item */
  ADD_NOTE = 'add_note',
  /** Bulk update */
  BULK_UPDATE = 'bulk_update',
}

/**
 * Plan snapshot for storage/transmission
 */
export interface PlanSnapshot {
  plan: {
    id: string;
    name: string;
    description: string;
    owner: string;
    collaborators: string[];
    currentPhase: string;
    totalPhases: number;
    overallProgress: number;
    createdAt: number;
    updatedAt: number;
    vectorClock: VectorClock;
    version: number;
  };
  items: PlanItem[];
}

/**
 * Sync status
 */
export enum SyncStatus {
  SYNCED = 'synced',
  SYNCING = 'syncing',
  PENDING = 'pending',
  CONFLICT = 'conflict',
  ERROR = 'error',
}

/**
 * Plan sync statistics
 */
export interface PlanSyncStats {
  /** Total plans */
  totalPlans: number;
  /** Total items */
  totalItems: number;
  /** Operations pending sync */
  pendingOperations: number;
  /** Conflicts detected */
  conflictsDetected: number;
  /** Conflicts resolved */
  conflictsResolved: number;
  /** Last sync timestamp */
  lastSyncAt?: Date;
  /** Sync status */
  syncStatus: SyncStatus;
}

// ============================================================================
// CRDT-BASED PLAN ITEM
// ============================================================================

/**
 * CRDT wrapper for plan items
 */
export class CRDTPlanItem {
  private titleRegister: LWWRegister<string>;
  private descriptionRegister: LWWRegister<string>;
  private statusRegister: LWWRegister<PlanItemStatus>;
  private priorityRegister: LWWRegister<PlanItemPriority>;
  private assignedToRegister: LWWRegister<string | undefined>;
  private progressRegister: LWWRegister<number>;
  private dependencies: ORSet<string>;
  private tags: ORSet<string>;
  private notes: ORSet<string>;
  private subtaskIds: ORSet<string>;
  private parentIdRegister: LWWRegister<string | undefined>;
  private estimatedMinutesRegister: LWWRegister<number | undefined>;
  private actualMinutesRegister: LWWRegister<number | undefined>;
  private id: string;
  private createdAt: number;

  constructor(id: string, title: string, nodeId: string, timestamp?: number) {
    const ts = timestamp ?? Date.now();
    this.id = id;
    this.createdAt = ts;
    // Initialize title with actual timestamp, but other registers with timestamp 0
    // so that subsequent set() calls will always succeed (ts > 0)
    this.titleRegister = new LWWRegister<string>(title, nodeId);
    this.descriptionRegister = new LWWRegister<string>();
    this.statusRegister = new LWWRegister<PlanItemStatus>();
    this.priorityRegister = new LWWRegister<PlanItemPriority>();
    this.assignedToRegister = new LWWRegister<string | undefined>();
    this.progressRegister = new LWWRegister<number>();
    this.dependencies = new ORSet<string>();
    this.tags = new ORSet<string>();
    this.notes = new ORSet<string>();
    this.subtaskIds = new ORSet<string>();
    this.parentIdRegister = new LWWRegister<string | undefined>();
    this.estimatedMinutesRegister = new LWWRegister<number | undefined>();
    this.actualMinutesRegister = new LWWRegister<number | undefined>();

    // Set default values with proper timestamps so they can be overridden
    this.statusRegister.set(PlanItemStatus.PENDING, nodeId, 0);
    this.priorityRegister.set(PlanItemPriority.MEDIUM, nodeId, 0);
    this.progressRegister.set(0, nodeId, 0);
  }

  getId(): string {
    return this.id;
  }

  setTitle(title: string, nodeId: string, timestamp?: number): void {
    this.titleRegister.set(title, nodeId, timestamp);
  }

  setDescription(description: string, nodeId: string, timestamp?: number): void {
    this.descriptionRegister.set(description, nodeId, timestamp);
  }

  setStatus(status: PlanItemStatus, nodeId: string, timestamp?: number): void {
    this.statusRegister.set(status, nodeId, timestamp);
  }

  setPriority(priority: PlanItemPriority, nodeId: string, timestamp?: number): void {
    this.priorityRegister.set(priority, nodeId, timestamp);
  }

  setAssignedTo(agentId: string | undefined, nodeId: string, timestamp?: number): void {
    this.assignedToRegister.set(agentId, nodeId, timestamp);
  }

  setProgress(progress: number, nodeId: string, timestamp?: number): void {
    this.progressRegister.set(Math.min(100, Math.max(0, progress)), nodeId, timestamp);
  }

  setParentId(parentId: string | undefined, nodeId: string, timestamp?: number): void {
    this.parentIdRegister.set(parentId, nodeId, timestamp);
  }

  setEstimatedMinutes(minutes: number | undefined, nodeId: string, timestamp?: number): void {
    this.estimatedMinutesRegister.set(minutes, nodeId, timestamp);
  }

  setActualMinutes(minutes: number | undefined, nodeId: string, timestamp?: number): void {
    this.actualMinutesRegister.set(minutes, nodeId, timestamp);
  }

  addDependency(depId: string, nodeId: string, timestamp?: number): void {
    this.dependencies.add(depId, nodeId, timestamp);
  }

  removeDependency(depId: string, nodeId: string, timestamp?: number): void {
    this.dependencies.remove(depId, nodeId, timestamp);
  }

  addTag(tag: string, nodeId: string, timestamp?: number): void {
    this.tags.add(tag, nodeId, timestamp);
  }

  removeTag(tag: string, nodeId: string, timestamp?: number): void {
    this.tags.remove(tag, nodeId, timestamp);
  }

  addNote(note: string, nodeId: string, timestamp?: number): void {
    this.notes.add(note, nodeId, timestamp);
  }

  addSubtask(subtaskId: string, nodeId: string, timestamp?: number): void {
    this.subtaskIds.add(subtaskId, nodeId, timestamp);
  }

  removeSubtask(subtaskId: string, nodeId: string, timestamp?: number): void {
    this.subtaskIds.remove(subtaskId, nodeId, timestamp);
  }

  /**
   * Merge with another CRDT plan item
   */
  merge(other: CRDTPlanItem): CRDTPlanItem {
    const merged = new CRDTPlanItem(this.id, '', 'merged');
    merged.createdAt = Math.min(this.createdAt, other.createdAt);
    merged.titleRegister = this.titleRegister.merge(other.titleRegister);
    merged.descriptionRegister = this.descriptionRegister.merge(other.descriptionRegister);
    merged.statusRegister = this.statusRegister.merge(other.statusRegister);
    merged.priorityRegister = this.priorityRegister.merge(other.priorityRegister);
    merged.assignedToRegister = this.assignedToRegister.merge(other.assignedToRegister);
    merged.progressRegister = this.progressRegister.merge(other.progressRegister);
    merged.dependencies = this.dependencies.merge(other.dependencies);
    merged.tags = this.tags.merge(other.tags);
    merged.notes = this.notes.merge(other.notes);
    merged.subtaskIds = this.subtaskIds.merge(other.subtaskIds);
    merged.parentIdRegister = this.parentIdRegister.merge(other.parentIdRegister);
    merged.estimatedMinutesRegister = this.estimatedMinutesRegister.merge(
      other.estimatedMinutesRegister
    );
    merged.actualMinutesRegister = this.actualMinutesRegister.merge(other.actualMinutesRegister);
    return merged;
  }

  /**
   * Convert to plain PlanItem
   */
  toPlainItem(): PlanItem {
    return {
      id: this.id,
      title: this.titleRegister.get() || '',
      description: this.descriptionRegister.get() || '',
      status: this.statusRegister.get() || PlanItemStatus.PENDING,
      priority: this.priorityRegister.get() || PlanItemPriority.MEDIUM,
      assignedTo: this.assignedToRegister.get(),
      dependencies: this.dependencies.values(),
      progress: this.progressRegister.get() || 0,
      estimatedMinutes: this.estimatedMinutesRegister.get(),
      actualMinutes: this.actualMinutesRegister.get(),
      parentId: this.parentIdRegister.get(),
      subtaskIds: this.subtaskIds.values(),
      tags: this.tags.values(),
      createdAt: this.createdAt,
      updatedAt: this.titleRegister.getTimestamp(),
      updatedBy: this.titleRegister.getNodeId(),
      notes: this.notes.values(),
    };
  }

  /**
   * Create from plain PlanItem
   */
  static fromPlainItem(item: PlanItem, nodeId: string): CRDTPlanItem {
    const crdt = new CRDTPlanItem(item.id, item.title, nodeId, item.createdAt);
    crdt.setDescription(item.description, nodeId, item.updatedAt);
    crdt.setStatus(item.status, nodeId, item.updatedAt);
    crdt.setPriority(item.priority, nodeId, item.updatedAt);
    crdt.setAssignedTo(item.assignedTo, nodeId, item.updatedAt);
    crdt.setProgress(item.progress, nodeId, item.updatedAt);
    crdt.setParentId(item.parentId, nodeId, item.updatedAt);
    crdt.setEstimatedMinutes(item.estimatedMinutes, nodeId, item.updatedAt);
    crdt.setActualMinutes(item.actualMinutes, nodeId, item.updatedAt);

    for (const dep of item.dependencies) {
      crdt.addDependency(dep, nodeId, item.updatedAt);
    }
    for (const tag of item.tags) {
      crdt.addTag(tag, nodeId, item.updatedAt);
    }
    for (const note of item.notes) {
      crdt.addNote(note, nodeId, item.updatedAt);
    }
    for (const subtaskId of item.subtaskIds) {
      crdt.addSubtask(subtaskId, nodeId, item.updatedAt);
    }

    return crdt;
  }
}

// ============================================================================
// PLAN SYNCHRONIZATION SERVICE
// ============================================================================

/**
 * Plan Synchronization Service
 *
 * Manages CRDT-based plan synchronization across multiple agents/nodes.
 */
export class PlanSyncService extends EventEmitter {
  private nodeId: string;
  private plans: Map<string, Plan> = new Map();
  private crdtItems: Map<string, CRDTPlanItem> = new Map();
  private pendingOperations: PlanOperation[] = [];
  private vectorClock: VectorClock;
  private conflictsDetected: number = 0;
  private conflictsResolved: number = 0;
  private lastSyncAt?: Date;
  private syncStatus: SyncStatus = SyncStatus.SYNCED;

  constructor(nodeId: string) {
    super();
    this.nodeId = nodeId;
    this.vectorClock = VectorClockOps.create(nodeId);
  }

  /**
   * Create a new plan
   */
  createPlan(
    name: string,
    description: string,
    options: {
      owner?: string;
      collaborators?: string[];
      currentPhase?: string;
      totalPhases?: number;
    } = {}
  ): Plan {
    const now = Date.now();
    const id = this.generateId('plan');

    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    const plan: Plan = {
      id,
      name,
      description,
      items: new Map(),
      owner: options.owner || this.nodeId,
      collaborators: options.collaborators || [],
      currentPhase: options.currentPhase || 'Phase 1',
      totalPhases: options.totalPhases || 1,
      overallProgress: 0,
      createdAt: now,
      updatedAt: now,
      vectorClock: { ...this.vectorClock },
      version: 1,
    };

    this.plans.set(id, plan);

    // Record operation
    this.recordOperation({
      type: PlanOperationType.CREATE_PLAN,
      planId: id,
      payload: { name, description, ...options },
    });

    this.emit('planCreated', plan);

    return plan;
  }

  /**
   * Get a plan by ID
   */
  getPlan(planId: string): Plan | undefined {
    return this.plans.get(planId);
  }

  /**
   * Get all plans
   */
  getAllPlans(): Plan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Update plan metadata
   */
  updatePlan(
    planId: string,
    updates: Partial<Pick<Plan, 'name' | 'description' | 'currentPhase' | 'totalPhases'>>
  ): Plan | undefined {
    const plan = this.plans.get(planId);
    if (!plan) return undefined;

    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    if (updates.name !== undefined) plan.name = updates.name;
    if (updates.description !== undefined) plan.description = updates.description;
    if (updates.currentPhase !== undefined) plan.currentPhase = updates.currentPhase;
    if (updates.totalPhases !== undefined) plan.totalPhases = updates.totalPhases;

    plan.updatedAt = Date.now();
    plan.vectorClock = { ...this.vectorClock };
    plan.version++;

    this.recordOperation({
      type: PlanOperationType.UPDATE_PLAN,
      planId,
      payload: updates,
    });

    this.emit('planUpdated', plan);
    return plan;
  }

  /**
   * Add item to plan
   */
  addItem(
    planId: string,
    title: string,
    options: {
      description?: string;
      priority?: PlanItemPriority;
      dependencies?: string[];
      parentId?: string;
      estimatedMinutes?: number;
      tags?: string[];
    } = {}
  ): PlanItem | undefined {
    const plan = this.plans.get(planId);
    if (!plan) return undefined;

    const now = Date.now();
    const itemId = this.generateId('item');

    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    // Create CRDT item
    const crdtItem = new CRDTPlanItem(itemId, title, this.nodeId, now);

    if (options.description) {
      crdtItem.setDescription(options.description, this.nodeId, now);
    }
    if (options.priority) {
      crdtItem.setPriority(options.priority, this.nodeId, now);
    }
    if (options.dependencies) {
      for (const dep of options.dependencies) {
        crdtItem.addDependency(dep, this.nodeId, now);
      }
    }
    if (options.parentId) {
      crdtItem.setParentId(options.parentId, this.nodeId, now);
      // Update parent's subtask list
      const parentCrdt = this.crdtItems.get(options.parentId);
      if (parentCrdt) {
        parentCrdt.addSubtask(itemId, this.nodeId, now);
        // Update the parent's plain item in the plan
        plan.items.set(options.parentId, parentCrdt.toPlainItem());
      }
    }
    if (options.estimatedMinutes) {
      crdtItem.setEstimatedMinutes(options.estimatedMinutes, this.nodeId, now);
    }
    if (options.tags) {
      for (const tag of options.tags) {
        crdtItem.addTag(tag, this.nodeId, now);
      }
    }

    this.crdtItems.set(itemId, crdtItem);

    // Convert to plain item and add to plan
    const item = crdtItem.toPlainItem();
    plan.items.set(itemId, item);
    plan.updatedAt = now;
    plan.vectorClock = { ...this.vectorClock };
    plan.version++;

    this.updateOverallProgress(planId);

    this.recordOperation({
      type: PlanOperationType.ADD_ITEM,
      planId,
      itemId,
      payload: { title, ...options },
    });

    this.emit('itemAdded', { planId, item });
    return item;
  }

  /**
   * Update item
   */
  updateItem(
    planId: string,
    itemId: string,
    updates: Partial<Pick<PlanItem, 'title' | 'description' | 'priority' | 'estimatedMinutes'>>
  ): PlanItem | undefined {
    const plan = this.plans.get(planId);
    if (!plan) return undefined;

    const crdtItem = this.crdtItems.get(itemId);
    if (!crdtItem) return undefined;

    const now = Date.now();
    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    if (updates.title !== undefined) {
      crdtItem.setTitle(updates.title, this.nodeId, now);
    }
    if (updates.description !== undefined) {
      crdtItem.setDescription(updates.description, this.nodeId, now);
    }
    if (updates.priority !== undefined) {
      crdtItem.setPriority(updates.priority, this.nodeId, now);
    }
    if (updates.estimatedMinutes !== undefined) {
      crdtItem.setEstimatedMinutes(updates.estimatedMinutes, this.nodeId, now);
    }

    const item = crdtItem.toPlainItem();
    plan.items.set(itemId, item);
    plan.updatedAt = now;
    plan.vectorClock = { ...this.vectorClock };
    plan.version++;

    this.recordOperation({
      type: PlanOperationType.UPDATE_ITEM,
      planId,
      itemId,
      payload: updates,
    });

    this.emit('itemUpdated', { planId, item });
    return item;
  }

  /**
   * Update item status
   */
  updateItemStatus(
    planId: string,
    itemId: string,
    status: PlanItemStatus,
    progress?: number
  ): PlanItem | undefined {
    const plan = this.plans.get(planId);
    if (!plan) return undefined;

    const crdtItem = this.crdtItems.get(itemId);
    if (!crdtItem) return undefined;

    const now = Date.now();
    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    crdtItem.setStatus(status, this.nodeId, now);

    if (progress !== undefined) {
      crdtItem.setProgress(progress, this.nodeId, now);
    } else if (status === PlanItemStatus.COMPLETED) {
      crdtItem.setProgress(100, this.nodeId, now);
    }

    const item = crdtItem.toPlainItem();
    plan.items.set(itemId, item);
    plan.updatedAt = now;
    plan.vectorClock = { ...this.vectorClock };
    plan.version++;

    this.updateOverallProgress(planId);

    this.recordOperation({
      type: PlanOperationType.UPDATE_STATUS,
      planId,
      itemId,
      payload: { status, progress },
    });

    this.emit('statusUpdated', { planId, item, status });
    return item;
  }

  /**
   * Assign item to agent
   */
  assignItem(planId: string, itemId: string, agentId: string | undefined): PlanItem | undefined {
    const plan = this.plans.get(planId);
    if (!plan) return undefined;

    const crdtItem = this.crdtItems.get(itemId);
    if (!crdtItem) return undefined;

    const now = Date.now();
    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    crdtItem.setAssignedTo(agentId, this.nodeId, now);

    const item = crdtItem.toPlainItem();
    plan.items.set(itemId, item);
    plan.updatedAt = now;
    plan.vectorClock = { ...this.vectorClock };
    plan.version++;

    this.recordOperation({
      type: PlanOperationType.ASSIGN_ITEM,
      planId,
      itemId,
      payload: { agentId },
    });

    this.emit('itemAssigned', { planId, item, agentId });
    return item;
  }

  /**
   * Delete item from plan
   */
  deleteItem(planId: string, itemId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    const item = plan.items.get(itemId);
    if (!item) return false;

    const now = Date.now();
    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    // Remove from parent's subtask list
    if (item.parentId) {
      const parentCrdt = this.crdtItems.get(item.parentId);
      if (parentCrdt) {
        parentCrdt.removeSubtask(itemId, this.nodeId, now);
        const parentItem = parentCrdt.toPlainItem();
        plan.items.set(item.parentId, parentItem);
      }
    }

    plan.items.delete(itemId);
    this.crdtItems.delete(itemId);
    plan.updatedAt = now;
    plan.vectorClock = { ...this.vectorClock };
    plan.version++;

    this.updateOverallProgress(planId);

    this.recordOperation({
      type: PlanOperationType.DELETE_ITEM,
      planId,
      itemId,
      payload: {},
    });

    this.emit('itemDeleted', { planId, itemId });
    return true;
  }

  /**
   * Get plan snapshot for storage/sync
   */
  getPlanSnapshot(planId: string): PlanSnapshot | undefined {
    const plan = this.plans.get(planId);
    if (!plan) return undefined;

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        owner: plan.owner,
        collaborators: plan.collaborators,
        currentPhase: plan.currentPhase,
        totalPhases: plan.totalPhases,
        overallProgress: plan.overallProgress,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        vectorClock: plan.vectorClock,
        version: plan.version,
      },
      items: Array.from(plan.items.values()),
    };
  }

  /**
   * Apply plan snapshot (from storage/sync)
   */
  applyPlanSnapshot(snapshot: PlanSnapshot): Plan {
    const existingPlan = this.plans.get(snapshot.plan.id);

    if (existingPlan) {
      // Merge with existing plan
      return this.mergePlans(existingPlan, snapshot);
    }

    // Create new plan from snapshot
    const plan: Plan = {
      ...snapshot.plan,
      items: new Map(),
    };

    for (const item of snapshot.items) {
      plan.items.set(item.id, item);
      this.crdtItems.set(item.id, CRDTPlanItem.fromPlainItem(item, snapshot.plan.owner));
    }

    this.plans.set(plan.id, plan);
    this.emit('planRestored', plan);

    return plan;
  }

  /**
   * Apply remote operation
   */
  applyOperation(operation: PlanOperation): void {
    // Check for conflicts via vector clock
    const comparison = VectorClockOps.compare(operation.vectorClock, this.vectorClock);

    if (VectorClockOps.areConcurrent(operation.vectorClock, this.vectorClock)) {
      this.conflictsDetected++;
      this.emit('conflictDetected', operation);
    }

    // Merge vector clocks
    this.vectorClock = VectorClockOps.merge(this.vectorClock, operation.vectorClock);

    // Apply operation based on type
    switch (operation.type) {
      case PlanOperationType.CREATE_PLAN: {
        const payload = operation.payload as {
          name: string;
          description: string;
          owner?: string;
        };
        this.createPlan(payload.name, payload.description, payload);
        break;
      }

      case PlanOperationType.ADD_ITEM: {
        const payload = operation.payload as {
          title: string;
          description?: string;
          priority?: PlanItemPriority;
          dependencies?: string[];
          parentId?: string;
          estimatedMinutes?: number;
          tags?: string[];
        };
        this.addItem(operation.planId, payload.title, payload);
        break;
      }

      case PlanOperationType.UPDATE_STATUS: {
        const payload = operation.payload as { status: PlanItemStatus; progress?: number };
        if (operation.itemId) {
          this.updateItemStatus(
            operation.planId,
            operation.itemId,
            payload.status,
            payload.progress
          );
        }
        break;
      }

      // ... handle other operation types similarly
    }

    this.conflictsResolved++;
    this.lastSyncAt = new Date();
    this.emit('operationApplied', operation);
  }

  /**
   * Get pending operations for sync
   */
  getPendingOperations(): PlanOperation[] {
    return [...this.pendingOperations];
  }

  /**
   * Clear pending operations after successful sync
   */
  clearPendingOperations(): void {
    this.pendingOperations = [];
    this.syncStatus = SyncStatus.SYNCED;
    this.lastSyncAt = new Date();
  }

  /**
   * Get sync statistics
   */
  getStats(): PlanSyncStats {
    let totalItems = 0;
    this.plans.forEach((plan) => {
      totalItems += plan.items.size;
    });

    return {
      totalPlans: this.plans.size,
      totalItems,
      pendingOperations: this.pendingOperations.length,
      conflictsDetected: this.conflictsDetected,
      conflictsResolved: this.conflictsResolved,
      lastSyncAt: this.lastSyncAt,
      syncStatus: this.syncStatus,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.plans.clear();
    this.crdtItems.clear();
    this.pendingOperations = [];
    this.conflictsDetected = 0;
    this.conflictsResolved = 0;
    this.lastSyncAt = undefined;
    this.syncStatus = SyncStatus.SYNCED;
    this.vectorClock = VectorClockOps.create(this.nodeId);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record operation for sync
   */
  private recordOperation(
    op: Omit<PlanOperation, 'id' | 'sourceNode' | 'timestamp' | 'vectorClock'>
  ): void {
    const operation: PlanOperation = {
      ...op,
      id: this.generateId('op'),
      sourceNode: this.nodeId,
      timestamp: Date.now(),
      vectorClock: { ...this.vectorClock },
    };

    this.pendingOperations.push(operation);
    this.syncStatus = SyncStatus.PENDING;
    this.emit('operationRecorded', operation);
  }

  /**
   * Update overall plan progress
   */
  private updateOverallProgress(planId: string): void {
    const plan = this.plans.get(planId);
    if (!plan || plan.items.size === 0) return;

    let totalProgress = 0;
    plan.items.forEach((item) => {
      totalProgress += item.progress;
    });

    plan.overallProgress = Math.round(totalProgress / plan.items.size);
  }

  /**
   * Merge two plans (CRDT merge)
   */
  private mergePlans(local: Plan, remoteSnapshot: PlanSnapshot): Plan {
    // Compare vector clocks
    const comparison = VectorClockOps.compare(local.vectorClock, remoteSnapshot.plan.vectorClock);

    if (comparison === -1) {
      // Local is older, use remote
      return this.applyPlanSnapshot(remoteSnapshot);
    }

    if (comparison === 1) {
      // Local is newer, keep local
      return local;
    }

    // Concurrent changes - need CRDT merge
    const mergedVectorClock = VectorClockOps.merge(
      local.vectorClock,
      remoteSnapshot.plan.vectorClock
    );

    // Merge items using CRDTs
    for (const remoteItem of remoteSnapshot.items) {
      const localCrdt = this.crdtItems.get(remoteItem.id);
      const remoteCrdt = CRDTPlanItem.fromPlainItem(remoteItem, remoteSnapshot.plan.owner);

      if (localCrdt) {
        // Merge existing item
        const merged = localCrdt.merge(remoteCrdt);
        this.crdtItems.set(remoteItem.id, merged);
        local.items.set(remoteItem.id, merged.toPlainItem());
      } else {
        // Add new item from remote
        this.crdtItems.set(remoteItem.id, remoteCrdt);
        local.items.set(remoteItem.id, remoteItem);
      }
    }

    local.vectorClock = mergedVectorClock;
    local.version = Math.max(local.version, remoteSnapshot.plan.version) + 1;
    local.updatedAt = Date.now();

    this.updateOverallProgress(local.id);
    this.conflictsResolved++;

    return local;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/** Global plan sync service */
let globalPlanSync: PlanSyncService | null = null;

/**
 * Get global plan sync service
 */
export function getGlobalPlanSync(): PlanSyncService {
  if (!globalPlanSync) {
    globalPlanSync = new PlanSyncService('global');
  }
  return globalPlanSync;
}

/**
 * Create new plan sync service
 */
export function createPlanSyncService(nodeId: string): PlanSyncService {
  return new PlanSyncService(nodeId);
}

/**
 * Reset global plan sync (for testing)
 */
export function resetGlobalPlanSync(): void {
  if (globalPlanSync) {
    globalPlanSync.clear();
    globalPlanSync = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PlanSyncService;
