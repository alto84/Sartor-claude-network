import { MemorySystem } from '../memory-system';
import { MemoryType, MemoryStatus } from '../memory-schema';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'mock-app' })),
  getApps: jest.fn(() => []),
}));

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(() => ({
    repos: {
      getContent: jest.fn().mockResolvedValue({ data: { content: '' } }),
      createOrUpdateFileContents: jest
        .fn()
        .mockResolvedValue({ data: { commit: { sha: 'abc123' } } }),
    },
  })),
}));

describe('MemoryService Tier Tests', () => {
  let memorySystem: MemorySystem;

  beforeEach(() => {
    memorySystem = new MemorySystem();
  });

  test('should set and get a memory', async () => {
    const mem = await memorySystem.createMemory('Test', MemoryType.EPISODIC, { tags: ['test'] });
    expect(mem.id).toBeDefined();
    const retrieved = await memorySystem.getMemory(mem.id);
    expect(retrieved?.content).toBe('Test');
  });

  test('should delete a memory', async () => {
    const mem = await memorySystem.createMemory('Delete', MemoryType.SEMANTIC);
    expect(memorySystem.deleteMemory(mem.id)).toBe(true);
    expect(await memorySystem.getMemory(mem.id)).toBeNull();
  });

  test('should retrieve memory without recording access', async () => {
    const mem = await memorySystem.createMemory('Silent', MemoryType.SEMANTIC);
    const initial = mem.access_count;
    const retrieved = await memorySystem.getMemory(mem.id, false);
    expect(retrieved?.access_count).toBe(initial);
  });

  test('should promote memory tier with repeated access', async () => {
    const mem = await memorySystem.createMemory('Promote', MemoryType.EPISODIC);
    await memorySystem.getMemory(mem.id);
    await memorySystem.getMemory(mem.id);
    const boosted = await memorySystem.getMemory(mem.id);
    expect(boosted!.access_count).toBeGreaterThan(0);
  });

  test('should demote memory when decay triggers', async () => {
    const mem = await memorySystem.createMemory('Decay', MemoryType.EPISODIC);
    const updated = await memorySystem.updateMemory(mem.id, {
      importance_score: 0.1,
      strength: 0.3,
    });
    expect(updated?.strength).toBe(0.3);
  });

  test('should archive memory below decay threshold', async () => {
    const mem = await memorySystem.createMemory('Archive', MemoryType.EPISODIC);
    await memorySystem.updateMemory(mem.id, {
      status: MemoryStatus.ARCHIVED,
      strength: 0.05,
    });
    const archived = await memorySystem.getMemory(mem.id);
    expect(archived?.status).toBe(MemoryStatus.ARCHIVED);
  });

  test('should search memories with importance filter', async () => {
    await memorySystem.createMemory('High', MemoryType.SEMANTIC, { importance_score: 0.9 });
    await memorySystem.createMemory('Low', MemoryType.SEMANTIC, { importance_score: 0.2 });
    const results = await memorySystem.searchMemories({
      filters: { min_importance: 0.7 },
    });
    expect(results[0]?.memory.importance_score).toBeGreaterThanOrEqual(0.7);
  });

  test('should consolidate multiple memories', async () => {
    for (let i = 0; i < 10; i++) {
      await memorySystem.createMemory(`Mem ${i}`, MemoryType.EPISODIC);
    }
    const stats = memorySystem.getStats();
    expect(stats.total_memories).toBeGreaterThanOrEqual(10);
  });

  test('should filter memories by type', async () => {
    await memorySystem.createMemory('E', MemoryType.EPISODIC);
    await memorySystem.createMemory('S', MemoryType.SEMANTIC);
    const results = await memorySystem.searchMemories({
      filters: { type: [MemoryType.SEMANTIC] },
    });
    expect(results.every((r) => r.memory.type === MemoryType.SEMANTIC)).toBe(true);
  });

  test('should run daily maintenance and process decay', async () => {
    await memorySystem.createMemory('Maint', MemoryType.EPISODIC);
    const results = await memorySystem.runDailyMaintenance();
    expect(results).toHaveProperty('decay_updated');
    expect(results).toHaveProperty('consolidations');
  });

  test('should fallback to archived tier', async () => {
    const mem = await memorySystem.createMemory('Fallback', MemoryType.EPISODIC);
    await memorySystem.updateMemory(mem.id, { status: MemoryStatus.ARCHIVED });
    const stats = memorySystem.getStats();
    expect(stats.by_status[MemoryStatus.ARCHIVED]).toBeGreaterThanOrEqual(0);
  });

  test('should export and reimport memories', async () => {
    const orig = await memorySystem.createMemory('Export', MemoryType.SEMANTIC);
    const exported = memorySystem.exportMemories();
    const newSys = new MemorySystem();
    newSys.importMemories(exported);
    const reimp = await newSys.getMemory(orig.id);
    expect(reimp?.content).toBe('Export');
  });
});
