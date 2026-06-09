/**
 * Cross-Surface Validation Tests
 *
 * Validates that the coordination system works correctly across
 * different storage backends and synchronization scenarios.
 *
 * Tests:
 * - Firebase integration (mock)
 * - GitHub sync (mock)
 * - Local filesystem operations
 * - Error recovery scenarios
 */

import {
  PlanSyncService,
  createPlanSyncService,
  PlanItemStatus,
  PlanItemPriority,
  type Plan,
  type PlanItem,
} from '../plan-sync';
import {
  ProgressTracker,
  createProgressTracker,
  ProgressStatus,
} from '../progress';
import {
  WorkDistributor,
  createDistributor,
  TaskStatus,
  TaskPriority,
} from '../work-distribution';
import {
  SubagentRegistry,
  createRegistry,
  AgentStatus,
  resetGlobalRegistry,
} from '../../subagent/registry';
import { resetGlobalMessageBus } from '../../subagent/messaging';
import { AgentRole } from '../../subagent/bootstrap';

// ============================================================================
// MOCK STORAGE BACKENDS
// ============================================================================

/**
 * Mock Firebase adapter for testing
 */
class MockFirebaseAdapter {
  private data: Map<string, any> = new Map();
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private connected: boolean = true;
  private latencyMs: number = 50;

  async get(path: string): Promise<any> {
    await this.simulateLatency();
    if (!this.connected) {
      throw new Error('Firebase disconnected');
    }
    return this.data.get(path);
  }

  async set(path: string, value: any): Promise<void> {
    await this.simulateLatency();
    if (!this.connected) {
      throw new Error('Firebase disconnected');
    }
    this.data.set(path, value);
    this.notifyListeners(path, value);
  }

  async update(path: string, updates: any): Promise<void> {
    await this.simulateLatency();
    if (!this.connected) {
      throw new Error('Firebase disconnected');
    }
    const current = this.data.get(path) || {};
    this.data.set(path, { ...current, ...updates });
    this.notifyListeners(path, this.data.get(path));
  }

  async delete(path: string): Promise<void> {
    await this.simulateLatency();
    if (!this.connected) {
      throw new Error('Firebase disconnected');
    }
    this.data.delete(path);
    this.notifyListeners(path, null);
  }

  onValue(path: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    this.listeners.get(path)!.push(callback);

    // Immediate callback with current value
    const current = this.data.get(path);
    if (current !== undefined) {
      callback(current);
    }

    return () => {
      const listeners = this.listeners.get(path);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  setConnected(connected: boolean): void {
    this.connected = connected;
  }

  setLatency(ms: number): void {
    this.latencyMs = ms;
  }

  clear(): void {
    this.data.clear();
    this.listeners.clear();
  }

  private async simulateLatency(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }

  private notifyListeners(path: string, data: any): void {
    const listeners = this.listeners.get(path);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
}

/**
 * Mock GitHub adapter for testing
 */
class MockGitHubAdapter {
  private files: Map<string, string> = new Map();
  private branches: Map<string, string> = new Map();
  private currentBranch: string = 'main';
  private rateLimit: { remaining: number; reset: Date } = {
    remaining: 5000,
    reset: new Date(Date.now() + 3600000),
  };

  async getFile(path: string): Promise<{ content: string; sha: string }> {
    this.checkRateLimit();
    const content = this.files.get(`${this.currentBranch}:${path}`);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    return {
      content,
      sha: this.generateSha(content),
    };
  }

  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<{ sha: string }> {
    this.checkRateLimit();
    const key = `${this.currentBranch}:${path}`;

    if (sha) {
      const existing = this.files.get(key);
      if (existing && this.generateSha(existing) !== sha) {
        throw new Error('SHA mismatch - file has been modified');
      }
    }

    this.files.set(key, content);
    return { sha: this.generateSha(content) };
  }

  async deleteFile(path: string, sha: string, message: string): Promise<void> {
    this.checkRateLimit();
    const key = `${this.currentBranch}:${path}`;
    const existing = this.files.get(key);

    if (!existing) {
      throw new Error(`File not found: ${path}`);
    }

    if (this.generateSha(existing) !== sha) {
      throw new Error('SHA mismatch - file has been modified');
    }

    this.files.delete(key);
  }

  async listFiles(path: string): Promise<string[]> {
    this.checkRateLimit();
    const prefix = `${this.currentBranch}:${path}`;
    return Array.from(this.files.keys())
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.replace(`${this.currentBranch}:`, ''));
  }

  async createBranch(name: string, from: string = 'main'): Promise<void> {
    this.checkRateLimit();
    const sourceSha = this.branches.get(from) || 'initial';
    this.branches.set(name, sourceSha);
  }

  switchBranch(name: string): void {
    this.currentBranch = name;
  }

  setRateLimit(remaining: number): void {
    this.rateLimit.remaining = remaining;
  }

  clear(): void {
    this.files.clear();
    this.branches.clear();
    this.currentBranch = 'main';
    this.rateLimit.remaining = 5000;
  }

  private checkRateLimit(): void {
    if (this.rateLimit.remaining <= 0) {
      throw new Error(`Rate limit exceeded. Reset at ${this.rateLimit.reset}`);
    }
    this.rateLimit.remaining--;
  }

  private generateSha(content: string): string {
    // Simple hash for testing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(40, '0');
  }
}

/**
 * Mock local filesystem adapter for testing
 */
class MockLocalFSAdapter {
  private files: Map<string, string> = new Map();
  private watchCallbacks: Map<string, ((event: string, filename: string) => void)[]> =
    new Map();

  readFile(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  writeFile(path: string, content: string): void {
    const existed = this.files.has(path);
    this.files.set(path, content);
    this.notifyWatchers(path, existed ? 'change' : 'rename');
  }

  deleteFile(path: string): void {
    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
    }
    this.files.delete(path);
    this.notifyWatchers(path, 'rename');
  }

  exists(path: string): boolean {
    return this.files.has(path);
  }

  readDir(dir: string): string[] {
    return Array.from(this.files.keys())
      .filter((key) => key.startsWith(dir))
      .map((key) => key.replace(dir + '/', ''));
  }

  watch(path: string, callback: (event: string, filename: string) => void): () => void {
    if (!this.watchCallbacks.has(path)) {
      this.watchCallbacks.set(path, []);
    }
    this.watchCallbacks.get(path)!.push(callback);

    return () => {
      const callbacks = this.watchCallbacks.get(path);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  clear(): void {
    this.files.clear();
    this.watchCallbacks.clear();
  }

  private notifyWatchers(path: string, event: string): void {
    // Notify direct watchers
    const callbacks = this.watchCallbacks.get(path);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event, path));
    }

    // Notify directory watchers
    const dir = path.substring(0, path.lastIndexOf('/'));
    const dirCallbacks = this.watchCallbacks.get(dir);
    if (dirCallbacks) {
      dirCallbacks.forEach((cb) => cb(event, path));
    }
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Cross-Surface Validation', () => {
  describe('Firebase Integration', () => {
    let firebase: MockFirebaseAdapter;
    let syncService: PlanSyncService;

    beforeEach(() => {
      firebase = new MockFirebaseAdapter();
      syncService = createPlanSyncService('node-1');
    });

    afterEach(() => {
      firebase.clear();
    });

    it('should persist plan to Firebase', async () => {
      const plan = syncService.createPlan('Test Plan', 'Testing Firebase sync');

      await firebase.set(`plans/${plan.id}`, {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        version: plan.version,
      });

      const stored = await firebase.get(`plans/${plan.id}`);
      expect(stored.name).toBe('Test Plan');
      expect(stored.description).toBe('Testing Firebase sync');
    });

    it('should handle Firebase disconnection gracefully', async () => {
      firebase.setConnected(false);

      await expect(firebase.set('test', { data: 'value' })).rejects.toThrow(
        'Firebase disconnected'
      );
    });

    it('should receive real-time updates', async () => {
      const updates: any[] = [];

      firebase.onValue('plans/test-plan', (data) => {
        updates.push(data);
      });

      await firebase.set('plans/test-plan', { version: 1 });
      await firebase.update('plans/test-plan', { version: 2 });

      expect(updates.length).toBe(2);
      expect(updates[1].version).toBe(2);
    });

    it('should handle high latency', async () => {
      firebase.setLatency(500);

      const startTime = Date.now();
      await firebase.set('test', { data: 'value' });
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(500);
    });

    it('should sync plan items across nodes', async () => {
      const plan = syncService.createPlan('Multi-Node Plan', 'Testing sync');
      const item = syncService.addItem(plan.id, 'Task 1');

      // Simulate node-1 writing to Firebase
      await firebase.set(`plans/${plan.id}/items/${item!.id}`, item);

      // Simulate node-2 reading from Firebase
      const node2Data = await firebase.get(`plans/${plan.id}/items/${item!.id}`);
      expect(node2Data.title).toBe('Task 1');
    });
  });

  describe('GitHub Sync', () => {
    let github: MockGitHubAdapter;
    let syncService: PlanSyncService;

    beforeEach(() => {
      github = new MockGitHubAdapter();
      syncService = createPlanSyncService('node-1');
    });

    afterEach(() => {
      github.clear();
    });

    it('should create plan file in repository', async () => {
      const plan = syncService.createPlan('GitHub Plan', 'Testing GitHub sync');
      const content = JSON.stringify(syncService.getPlanSnapshot(plan.id), null, 2);

      const result = await github.createOrUpdateFile(
        `plans/${plan.id}.json`,
        content,
        'Create plan'
      );

      expect(result.sha).toBeDefined();

      const file = await github.getFile(`plans/${plan.id}.json`);
      expect(JSON.parse(file.content).plan.name).toBe('GitHub Plan');
    });

    it('should handle optimistic locking with SHA', async () => {
      // Create initial file
      const content1 = JSON.stringify({ version: 1 });
      const result1 = await github.createOrUpdateFile(
        'test.json',
        content1,
        'v1'
      );

      // Update with correct SHA
      const content2 = JSON.stringify({ version: 2 });
      await github.createOrUpdateFile('test.json', content2, 'v2', result1.sha);

      // Try to update with old SHA (should fail)
      const content3 = JSON.stringify({ version: 3 });
      await expect(
        github.createOrUpdateFile('test.json', content3, 'v3', result1.sha)
      ).rejects.toThrow('SHA mismatch');
    });

    it('should handle rate limiting', async () => {
      github.setRateLimit(0);

      await expect(github.getFile('test.json')).rejects.toThrow('Rate limit exceeded');
    });

    it('should work across branches', async () => {
      // Create file on main
      await github.createOrUpdateFile('plan.json', '{"branch": "main"}', 'main');

      // Create feature branch
      await github.createBranch('feature/test', 'main');
      github.switchBranch('feature/test');

      // Modify on feature branch
      await github.createOrUpdateFile(
        'plan.json',
        '{"branch": "feature"}',
        'feature'
      );

      const featureFile = await github.getFile('plan.json');
      expect(JSON.parse(featureFile.content).branch).toBe('feature');

      // Main should be unchanged
      github.switchBranch('main');
      const mainFile = await github.getFile('plan.json');
      expect(JSON.parse(mainFile.content).branch).toBe('main');
    });

    it('should list plan files', async () => {
      await github.createOrUpdateFile('plans/plan-1.json', '{}', 'p1');
      await github.createOrUpdateFile('plans/plan-2.json', '{}', 'p2');
      await github.createOrUpdateFile('other/file.json', '{}', 'other');

      const planFiles = await github.listFiles('plans');
      expect(planFiles).toContain('plans/plan-1.json');
      expect(planFiles).toContain('plans/plan-2.json');
      expect(planFiles).not.toContain('other/file.json');
    });
  });

  describe('Local Filesystem', () => {
    let fs: MockLocalFSAdapter;
    let syncService: PlanSyncService;

    beforeEach(() => {
      fs = new MockLocalFSAdapter();
      syncService = createPlanSyncService('local');
    });

    afterEach(() => {
      fs.clear();
    });

    it('should persist plan to local file', () => {
      const plan = syncService.createPlan('Local Plan', 'Testing local storage');
      const snapshot = syncService.getPlanSnapshot(plan.id);

      fs.writeFile(`/plans/${plan.id}.json`, JSON.stringify(snapshot, null, 2));

      const content = fs.readFile(`/plans/${plan.id}.json`);
      const restored = JSON.parse(content);
      expect(restored.plan.name).toBe('Local Plan');
    });

    it('should handle missing files', () => {
      expect(() => fs.readFile('/nonexistent.json')).toThrow('ENOENT');
    });

    it('should watch for file changes', () => {
      const changes: { event: string; filename: string }[] = [];

      fs.watch('/plans', (event, filename) => {
        changes.push({ event, filename });
      });

      fs.writeFile('/plans/new.json', '{}');
      fs.writeFile('/plans/new.json', '{"updated": true}');
      fs.deleteFile('/plans/new.json');

      expect(changes.length).toBe(3);
      expect(changes[0].event).toBe('rename'); // New file
      expect(changes[1].event).toBe('change'); // Modified
      expect(changes[2].event).toBe('rename'); // Deleted
    });

    it('should list files in directory', () => {
      fs.writeFile('/plans/a.json', '{}');
      fs.writeFile('/plans/b.json', '{}');
      fs.writeFile('/other/c.json', '{}');

      const files = fs.readDir('/plans');
      expect(files).toContain('a.json');
      expect(files).toContain('b.json');
      expect(files.length).toBe(2);
    });

    it('should check file existence', () => {
      fs.writeFile('/test.json', '{}');

      expect(fs.exists('/test.json')).toBe(true);
      expect(fs.exists('/missing.json')).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    let firebase: MockFirebaseAdapter;
    let github: MockGitHubAdapter;
    let fs: MockLocalFSAdapter;

    beforeEach(() => {
      firebase = new MockFirebaseAdapter();
      github = new MockGitHubAdapter();
      fs = new MockLocalFSAdapter();
    });

    afterEach(() => {
      firebase.clear();
      github.clear();
      fs.clear();
    });

    it('should recover from Firebase disconnection', async () => {
      const pendingWrites: any[] = [];

      // Queue writes during disconnection
      firebase.setConnected(false);
      try {
        await firebase.set('test', { value: 1 });
      } catch {
        pendingWrites.push({ path: 'test', value: { value: 1 } });
      }

      // Reconnect and retry
      firebase.setConnected(true);
      for (const write of pendingWrites) {
        await firebase.set(write.path, write.value);
      }

      const stored = await firebase.get('test');
      expect(stored.value).toBe(1);
    });

    it('should handle GitHub rate limit recovery', async () => {
      github.setRateLimit(0);

      // Should fail
      await expect(github.listFiles('/')).rejects.toThrow('Rate limit');

      // Reset rate limit
      github.setRateLimit(100);

      // Should succeed
      const files = await github.listFiles('/');
      expect(files).toBeDefined();
    });

    it('should handle concurrent modifications', async () => {
      // Create initial state
      const initial = JSON.stringify({ version: 1 });
      const result = await github.createOrUpdateFile('state.json', initial, 'init');

      // Simulate two concurrent modifications
      const content2 = JSON.stringify({ version: 2 });
      const content3 = JSON.stringify({ version: 3 });

      // First modification succeeds
      const result2 = await github.createOrUpdateFile(
        'state.json',
        content2,
        'v2',
        result.sha
      );

      // Second modification fails (conflict)
      await expect(
        github.createOrUpdateFile('state.json', content3, 'v3', result.sha)
      ).rejects.toThrow('SHA mismatch');

      // Should retry with new SHA
      await github.createOrUpdateFile('state.json', content3, 'v3', result2.sha);

      const final = await github.getFile('state.json');
      expect(JSON.parse(final.content).version).toBe(3);
    });

    it('should fallback to local storage on cloud failure', async () => {
      const syncService = createPlanSyncService('fallback-node');
      const plan = syncService.createPlan('Fallback Plan', 'Testing fallback');

      // Try cloud storage (fails)
      firebase.setConnected(false);
      let cloudFailed = false;
      try {
        await firebase.set(`plans/${plan.id}`, plan);
      } catch {
        cloudFailed = true;
      }

      // Fallback to local
      if (cloudFailed) {
        const snapshot = syncService.getPlanSnapshot(plan.id);
        fs.writeFile(`/plans/${plan.id}.json`, JSON.stringify(snapshot));
      }

      expect(cloudFailed).toBe(true);
      expect(fs.exists(`/plans/${plan.id}.json`)).toBe(true);
    });

    it('should sync local changes when cloud reconnects', async () => {
      // Create local changes while disconnected
      fs.writeFile('/pending/change-1.json', JSON.stringify({ action: 'create' }));
      fs.writeFile('/pending/change-2.json', JSON.stringify({ action: 'update' }));

      // Simulate reconnection sync
      firebase.setConnected(true);
      const pendingFiles = fs.readDir('/pending');

      for (const file of pendingFiles) {
        const content = fs.readFile(`/pending/${file}`);
        const change = JSON.parse(content);
        await firebase.set(`synced/${file}`, change);
        fs.deleteFile(`/pending/${file}`);
      }

      // Verify sync completed
      const synced1 = await firebase.get('synced/change-1.json');
      const synced2 = await firebase.get('synced/change-2.json');
      expect(synced1.action).toBe('create');
      expect(synced2.action).toBe('update');
      expect(fs.exists('/pending/change-1.json')).toBe(false);
    });
  });

  describe('Multi-Agent Coordination', () => {
    let registry: SubagentRegistry;
    let distributor: WorkDistributor;
    let tracker: ProgressTracker;

    beforeEach(() => {
      registry = createRegistry({ heartbeatIntervalMs: 1000 });
      distributor = createDistributor(registry);
      tracker = createProgressTracker();

      // Register agents
      registry.registerSubagent('agent-1', { role: AgentRole.IMPLEMENTER });
      registry.registerSubagent('agent-2', { role: AgentRole.IMPLEMENTER });
      registry.registerSubagent('coordinator', { role: AgentRole.COORDINATOR });

      registry.heartbeat('agent-1', AgentStatus.ACTIVE);
      registry.heartbeat('agent-2', AgentStatus.IDLE);
      registry.heartbeat('coordinator', AgentStatus.ACTIVE);
    });

    afterEach(() => {
      registry.stop();
      distributor.clear();
      tracker.clear();
      // Reset global instances to stop open handles
      resetGlobalRegistry();
      resetGlobalMessageBus();
    });

    it('should coordinate work across agents', async () => {
      // Coordinator creates tasks
      const task1 = distributor.createTask('Task 1', 'First task');
      const task2 = distributor.createTask('Task 2', 'Second task');

      // Agents claim tasks
      const claim1 = distributor.claimTask(task1.id, 'agent-1');
      const claim2 = distributor.claimTask(task2.id, 'agent-2');

      expect(claim1.success).toBe(true);
      expect(claim2.success).toBe(true);

      // Track progress (agentId, taskId, percentage, status)
      tracker.reportProgress('agent-1', task1.id, 50, ProgressStatus.IN_PROGRESS);
      tracker.reportProgress('agent-2', task2.id, 25, ProgressStatus.IN_PROGRESS);

      // Check individual progress
      const progress1 = tracker.getLatestProgress(task1.id);
      const progress2 = tracker.getLatestProgress(task2.id);
      expect(progress1?.percentage).toBe(50);
      expect(progress2?.percentage).toBe(25);
    });

    it('should handle agent failure', async () => {
      const task = distributor.createTask('Critical Task', 'Must complete');

      // Agent-1 claims and starts
      distributor.claimTask(task.id, 'agent-1');
      distributor.startTask(task.id, 'agent-1');

      // Agent-1 fails
      registry.updateStatus('agent-1', AgentStatus.CRASHED);

      // Coordinator releases task
      distributor.releaseTask(task.id, 'agent-1');

      // Agent-2 takes over
      const claim = distributor.claimTask(task.id, 'agent-2');
      expect(claim.success).toBe(true);
    });

    it('should prevent duplicate task claiming', () => {
      const task = distributor.createTask('Exclusive Task', 'Only one owner');

      distributor.claimTask(task.id, 'agent-1');
      const secondClaim = distributor.claimTask(task.id, 'agent-2');

      expect(secondClaim.success).toBe(false);
      expect(secondClaim.reason).toBe('Task already claimed');
    });

    it('should track milestones across agents', () => {
      const milestone = tracker.createMilestone('MVP', 'Minimum viable product');

      // Different agents contribute to tasks linked to milestone
      tracker.reportProgress('agent-1', 'backend-task', 100, ProgressStatus.COMPLETED);
      tracker.reportProgress('agent-2', 'frontend-task', 80, ProgressStatus.IN_PROGRESS);
      tracker.reportProgress('coordinator', 'testing-task', 60, ProgressStatus.IN_PROGRESS);

      // Verify milestone was created
      expect(milestone.id).toBeDefined();
      expect(milestone.name).toBe('MVP');

      // Verify individual progress entries
      const backend = tracker.getLatestProgress('backend-task');
      const frontend = tracker.getLatestProgress('frontend-task');
      expect(backend?.percentage).toBe(100);
      expect(frontend?.percentage).toBe(80);
    });
  });
});
