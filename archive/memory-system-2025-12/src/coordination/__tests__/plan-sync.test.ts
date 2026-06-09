/**
 * Plan Synchronization Tests
 */

import {
  PlanSyncService,
  CRDTPlanItem,
  createPlanSyncService,
  getGlobalPlanSync,
  resetGlobalPlanSync,
  PlanItemStatus,
  PlanItemPriority,
  PlanOperationType,
  SyncStatus,
  type Plan,
  type PlanItem,
} from '..//plan-sync';

describe('PlanSyncService', () => {
  let syncService: PlanSyncService;

  beforeEach(() => {
    syncService = createPlanSyncService('node-1');
  });

  afterEach(() => {
    syncService.clear();
  });

  describe('createPlan', () => {
    it('should create a new plan', () => {
      const plan = syncService.createPlan(
        'Test Plan',
        'A test plan description'
      );

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(plan.name).toBe('Test Plan');
      expect(plan.description).toBe('A test plan description');
      expect(plan.version).toBe(1);
    });

    it('should create plan with options', () => {
      const plan = syncService.createPlan('Custom Plan', 'With options', {
        owner: 'user-1',
        collaborators: ['user-2', 'user-3'],
        currentPhase: 'Phase 2',
        totalPhases: 5,
      });

      expect(plan.owner).toBe('user-1');
      expect(plan.collaborators).toEqual(['user-2', 'user-3']);
      expect(plan.currentPhase).toBe('Phase 2');
      expect(plan.totalPhases).toBe(5);
    });

    it('should emit planCreated event', () => {
      const listener = jest.fn();
      syncService.on('planCreated', listener);

      syncService.createPlan('Event Plan', 'Test');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should record operation for sync', () => {
      syncService.createPlan('Sync Plan', 'Test');

      const operations = syncService.getPendingOperations();

      expect(operations.length).toBe(1);
      expect(operations[0].type).toBe(PlanOperationType.CREATE_PLAN);
    });
  });

  describe('getPlan', () => {
    it('should retrieve plan by ID', () => {
      const created = syncService.createPlan('Retrievable', 'Test');

      const retrieved = syncService.getPlan(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Retrievable');
    });

    it('should return undefined for non-existent plan', () => {
      const plan = syncService.getPlan('non-existent');
      expect(plan).toBeUndefined();
    });
  });

  describe('getAllPlans', () => {
    it('should return all plans', () => {
      syncService.createPlan('Plan 1', 'First');
      syncService.createPlan('Plan 2', 'Second');
      syncService.createPlan('Plan 3', 'Third');

      const plans = syncService.getAllPlans();

      expect(plans.length).toBe(3);
    });
  });

  describe('updatePlan', () => {
    it('should update plan metadata', () => {
      const plan = syncService.createPlan('Original', 'Original description');

      const updated = syncService.updatePlan(plan.id, {
        name: 'Updated',
        description: 'Updated description',
      });

      expect(updated?.name).toBe('Updated');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.version).toBe(2);
    });

    it('should update current phase', () => {
      const plan = syncService.createPlan('Phased', 'Multi-phase', {
        totalPhases: 3,
      });

      syncService.updatePlan(plan.id, { currentPhase: 'Phase 2' });

      const updated = syncService.getPlan(plan.id);
      expect(updated?.currentPhase).toBe('Phase 2');
    });
  });

  describe('addItem', () => {
    let plan: Plan;

    beforeEach(() => {
      plan = syncService.createPlan('Item Test', 'Plan for item tests');
    });

    it('should add item to plan', () => {
      const item = syncService.addItem(plan.id, 'New Task');

      expect(item).toBeDefined();
      expect(item?.title).toBe('New Task');
      expect(item?.status).toBe(PlanItemStatus.PENDING);
    });

    it('should add item with options', () => {
      const item = syncService.addItem(plan.id, 'Detailed Task', {
        description: 'With full details',
        priority: PlanItemPriority.HIGH,
        estimatedMinutes: 120,
        tags: ['urgent', 'feature'],
      });

      expect(item?.description).toBe('With full details');
      expect(item?.priority).toBe(PlanItemPriority.HIGH);
      expect(item?.estimatedMinutes).toBe(120);
      expect(item?.tags).toContain('urgent');
    });

    it('should add item with dependencies', () => {
      const dep = syncService.addItem(plan.id, 'Dependency');
      const item = syncService.addItem(plan.id, 'Dependent', {
        dependencies: [dep!.id],
      });

      expect(item?.dependencies).toContain(dep!.id);
    });

    it('should add subtask with parent', () => {
      const parent = syncService.addItem(plan.id, 'Parent Task');
      const child = syncService.addItem(plan.id, 'Subtask', {
        parentId: parent!.id,
      });

      expect(child?.parentId).toBe(parent!.id);

      const updatedParent = Array.from(
        syncService.getPlan(plan.id)!.items.values()
      ).find((i) => i.id === parent!.id);
      expect(updatedParent?.subtaskIds).toContain(child!.id);
    });

    it('should emit itemAdded event', () => {
      const listener = jest.fn();
      syncService.on('itemAdded', listener);

      syncService.addItem(plan.id, 'Event Item');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateItem', () => {
    let plan: Plan;
    let item: PlanItem;

    beforeEach(() => {
      plan = syncService.createPlan('Update Test', 'Test updates');
      item = syncService.addItem(plan.id, 'Original Item')!;
    });

    it('should update item properties', () => {
      const updated = syncService.updateItem(plan.id, item.id, {
        title: 'Updated Title',
        description: 'Updated Description',
      });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.description).toBe('Updated Description');
    });

    it('should update item priority', () => {
      const updated = syncService.updateItem(plan.id, item.id, {
        priority: PlanItemPriority.CRITICAL,
      });

      expect(updated?.priority).toBe(PlanItemPriority.CRITICAL);
    });
  });

  describe('updateItemStatus', () => {
    let plan: Plan;
    let item: PlanItem;

    beforeEach(() => {
      plan = syncService.createPlan('Status Test', 'Test status updates');
      item = syncService.addItem(plan.id, 'Status Item')!;
    });

    it('should update item status', () => {
      const updated = syncService.updateItemStatus(
        plan.id,
        item.id,
        PlanItemStatus.IN_PROGRESS
      );

      expect(updated?.status).toBe(PlanItemStatus.IN_PROGRESS);
    });

    it('should update status with progress', () => {
      const updated = syncService.updateItemStatus(
        plan.id,
        item.id,
        PlanItemStatus.IN_PROGRESS,
        50
      );

      expect(updated?.progress).toBe(50);
    });

    it('should set progress to 100 on completion', () => {
      const updated = syncService.updateItemStatus(
        plan.id,
        item.id,
        PlanItemStatus.COMPLETED
      );

      expect(updated?.progress).toBe(100);
    });

    it('should emit statusUpdated event', () => {
      const listener = jest.fn();
      syncService.on('statusUpdated', listener);

      syncService.updateItemStatus(plan.id, item.id, PlanItemStatus.COMPLETED);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should update overall plan progress', () => {
      const item2 = syncService.addItem(plan.id, 'Second Item')!;

      syncService.updateItemStatus(plan.id, item.id, PlanItemStatus.COMPLETED);

      const updatedPlan = syncService.getPlan(plan.id);
      expect(updatedPlan?.overallProgress).toBe(50);
    });
  });

  describe('assignItem', () => {
    it('should assign item to agent', () => {
      const plan = syncService.createPlan('Assign Test', 'Test');
      const item = syncService.addItem(plan.id, 'Assignable')!;

      const updated = syncService.assignItem(plan.id, item.id, 'agent-1');

      expect(updated?.assignedTo).toBe('agent-1');
    });

    it('should unassign item', () => {
      const plan = syncService.createPlan('Unassign Test', 'Test');
      const item = syncService.addItem(plan.id, 'Assigned')!;
      syncService.assignItem(plan.id, item.id, 'agent-1');

      const updated = syncService.assignItem(plan.id, item.id, undefined);

      expect(updated?.assignedTo).toBeUndefined();
    });
  });

  describe('deleteItem', () => {
    it('should delete item from plan', () => {
      const plan = syncService.createPlan('Delete Test', 'Test');
      const item = syncService.addItem(plan.id, 'Deletable')!;

      const result = syncService.deleteItem(plan.id, item.id);

      expect(result).toBe(true);
      expect(syncService.getPlan(plan.id)?.items.has(item.id)).toBe(false);
    });

    it('should update parent subtask list', () => {
      const plan = syncService.createPlan('Parent Delete', 'Test');
      const parent = syncService.addItem(plan.id, 'Parent')!;
      const child = syncService.addItem(plan.id, 'Child', {
        parentId: parent.id,
      })!;

      syncService.deleteItem(plan.id, child.id);

      const updatedParent = Array.from(
        syncService.getPlan(plan.id)!.items.values()
      ).find((i) => i.id === parent.id);
      expect(updatedParent?.subtaskIds).not.toContain(child.id);
    });
  });

  describe('getPlanSnapshot', () => {
    it('should return plan snapshot for sync', () => {
      const plan = syncService.createPlan('Snapshot Test', 'Test');
      syncService.addItem(plan.id, 'Item 1');
      syncService.addItem(plan.id, 'Item 2');

      const snapshot = syncService.getPlanSnapshot(plan.id);

      expect(snapshot).toBeDefined();
      expect(snapshot?.plan.id).toBe(plan.id);
      expect(snapshot?.items.length).toBe(2);
    });
  });

  describe('applyPlanSnapshot', () => {
    it('should restore plan from snapshot', () => {
      const plan = syncService.createPlan('Original', 'Test');
      syncService.addItem(plan.id, 'Item');
      const snapshot = syncService.getPlanSnapshot(plan.id)!;

      // Create new service and apply snapshot
      const newService = createPlanSyncService('node-2');
      const restored = newService.applyPlanSnapshot(snapshot);

      expect(restored.name).toBe('Original');
      expect(restored.items.size).toBe(1);

      newService.clear();
    });
  });

  describe('getStats', () => {
    it('should return sync statistics', () => {
      const plan = syncService.createPlan('Stats Test', 'Test');
      syncService.addItem(plan.id, 'Item 1');
      syncService.addItem(plan.id, 'Item 2');

      const stats = syncService.getStats();

      expect(stats.totalPlans).toBe(1);
      expect(stats.totalItems).toBe(2);
      expect(stats.pendingOperations).toBeGreaterThan(0);
      expect(stats.syncStatus).toBe(SyncStatus.PENDING);
    });
  });

  describe('clearPendingOperations', () => {
    it('should clear pending operations', () => {
      syncService.createPlan('Pending Test', 'Test');

      syncService.clearPendingOperations();

      expect(syncService.getPendingOperations().length).toBe(0);
      expect(syncService.getStats().syncStatus).toBe(SyncStatus.SYNCED);
    });
  });
});

describe('CRDTPlanItem', () => {
  describe('basic operations', () => {
    it('should create item with title', () => {
      const item = new CRDTPlanItem('item-1', 'Test Title', 'node-1');
      const plain = item.toPlainItem();

      expect(plain.id).toBe('item-1');
      expect(plain.title).toBe('Test Title');
    });

    it('should update properties', () => {
      const item = new CRDTPlanItem('item-1', 'Original', 'node-1');

      item.setTitle('Updated', 'node-1', Date.now());
      item.setDescription('New Description', 'node-1', Date.now());
      item.setStatus(PlanItemStatus.IN_PROGRESS, 'node-1', Date.now());
      item.setPriority(PlanItemPriority.HIGH, 'node-1', Date.now());
      item.setProgress(50, 'node-1', Date.now());

      const plain = item.toPlainItem();
      expect(plain.title).toBe('Updated');
      expect(plain.description).toBe('New Description');
      expect(plain.status).toBe(PlanItemStatus.IN_PROGRESS);
      expect(plain.priority).toBe(PlanItemPriority.HIGH);
      expect(plain.progress).toBe(50);
    });

    it('should manage dependencies', () => {
      const item = new CRDTPlanItem('item-1', 'Test', 'node-1');

      item.addDependency('dep-1', 'node-1');
      item.addDependency('dep-2', 'node-1');

      expect(item.toPlainItem().dependencies).toContain('dep-1');
      expect(item.toPlainItem().dependencies).toContain('dep-2');

      item.removeDependency('dep-1', 'node-1', Date.now());
      expect(item.toPlainItem().dependencies).not.toContain('dep-1');
    });

    it('should manage tags', () => {
      const item = new CRDTPlanItem('item-1', 'Test', 'node-1');

      item.addTag('urgent', 'node-1');
      item.addTag('feature', 'node-1');

      expect(item.toPlainItem().tags).toContain('urgent');
      expect(item.toPlainItem().tags).toContain('feature');
    });

    it('should manage notes', () => {
      const item = new CRDTPlanItem('item-1', 'Test', 'node-1');

      item.addNote('Note 1', 'node-1');
      item.addNote('Note 2', 'node-1');

      expect(item.toPlainItem().notes.length).toBe(2);
    });
  });

  describe('merge', () => {
    it('should merge two CRDT items', () => {
      const item1 = new CRDTPlanItem('item-1', 'Title 1', 'node-1', 100);
      const item2 = new CRDTPlanItem('item-1', 'Title 2', 'node-2', 200);

      item1.setDescription('Desc 1', 'node-1', 100);
      item2.setDescription('Desc 2', 'node-2', 200);

      const merged = item1.merge(item2);
      const plain = merged.toPlainItem();

      // Later timestamp wins
      expect(plain.title).toBe('Title 2');
      expect(plain.description).toBe('Desc 2');
    });

    it('should merge dependencies from both items', () => {
      const item1 = new CRDTPlanItem('item-1', 'Test', 'node-1');
      const item2 = new CRDTPlanItem('item-1', 'Test', 'node-2');

      item1.addDependency('dep-1', 'node-1');
      item2.addDependency('dep-2', 'node-2');

      const merged = item1.merge(item2);
      const plain = merged.toPlainItem();

      expect(plain.dependencies).toContain('dep-1');
      expect(plain.dependencies).toContain('dep-2');
    });
  });

  describe('fromPlainItem', () => {
    it('should create CRDT item from plain item', () => {
      const plain: PlanItem = {
        id: 'plain-1',
        title: 'Plain Item',
        description: 'A plain item',
        status: PlanItemStatus.IN_PROGRESS,
        priority: PlanItemPriority.HIGH,
        dependencies: ['dep-1'],
        progress: 50,
        parentId: undefined,
        subtaskIds: [],
        tags: ['tag1'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: 'node-1',
        notes: ['note1'],
      };

      const crdt = CRDTPlanItem.fromPlainItem(plain, 'node-1');
      const restored = crdt.toPlainItem();

      expect(restored.id).toBe('plain-1');
      expect(restored.title).toBe('Plain Item');
      expect(restored.status).toBe(PlanItemStatus.IN_PROGRESS);
      expect(restored.dependencies).toContain('dep-1');
      expect(restored.tags).toContain('tag1');
    });
  });
});

describe('Global Plan Sync', () => {
  beforeEach(() => {
    resetGlobalPlanSync();
  });

  afterEach(() => {
    resetGlobalPlanSync();
  });

  it('should return same instance', () => {
    const sync1 = getGlobalPlanSync();
    const sync2 = getGlobalPlanSync();
    expect(sync1).toBe(sync2);
  });
});
