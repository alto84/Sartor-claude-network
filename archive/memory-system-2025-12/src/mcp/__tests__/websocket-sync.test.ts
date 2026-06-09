/**
 * WebSocket Sync / CRDT Tests
 */

import {
  GCounter,
  PNCounter,
  LWWRegister,
  ORSet,
  LWWMap,
  VectorClockOps,
  MeshSyncServer,
  NodeState,
  SyncMessageType,
} from '../websocket-sync';

describe('CRDTs', () => {
  describe('GCounter', () => {
    it('should start at 0', () => {
      const counter = new GCounter();
      expect(counter.value()).toBe(0);
    });

    it('should increment', () => {
      const counter = new GCounter();
      counter.increment('node1');
      counter.increment('node1');
      counter.increment('node2');

      expect(counter.value()).toBe(3);
    });

    it('should merge correctly', () => {
      const counter1 = new GCounter();
      counter1.increment('node1', 5);
      counter1.increment('node2', 3);

      const counter2 = new GCounter();
      counter2.increment('node1', 2);
      counter2.increment('node2', 7);

      const merged = counter1.merge(counter2);

      // Should take max of each node
      expect(merged.value()).toBe(12); // max(5,2) + max(3,7) = 5 + 7
    });

    it('should serialize and deserialize', () => {
      const counter = new GCounter();
      counter.increment('node1', 5);
      counter.increment('node2', 3);

      const json = counter.toJSON();
      const restored = GCounter.fromJSON(json);

      expect(restored.value()).toBe(counter.value());
    });
  });

  describe('PNCounter', () => {
    it('should start at 0', () => {
      const counter = new PNCounter();
      expect(counter.value()).toBe(0);
    });

    it('should increment and decrement', () => {
      const counter = new PNCounter();
      counter.increment('node1', 10);
      counter.decrement('node1', 3);

      expect(counter.value()).toBe(7);
    });

    it('should merge correctly', () => {
      const counter1 = new PNCounter();
      counter1.increment('node1', 10);
      counter1.decrement('node2', 2);

      const counter2 = new PNCounter();
      counter2.increment('node1', 5);
      counter2.decrement('node2', 5);

      const merged = counter1.merge(counter2);

      // max(10,5) - max(2,5) = 10 - 5 = 5
      expect(merged.value()).toBe(5);
    });

    it('should serialize and deserialize', () => {
      const counter = new PNCounter();
      counter.increment('node1', 10);
      counter.decrement('node2', 3);

      const json = counter.toJSON();
      const restored = PNCounter.fromJSON(json);

      expect(restored.value()).toBe(counter.value());
    });
  });

  describe('LWWRegister', () => {
    it('should store and retrieve values', () => {
      const register = new LWWRegister<string>('initial', 'node1');
      expect(register.get()).toBe('initial');
    });

    it('should update with newer timestamp', () => {
      const register = new LWWRegister<string>();
      register.set('first', 'node1', 100);
      register.set('second', 'node1', 200);

      expect(register.get()).toBe('second');
    });

    it('should reject older timestamp', () => {
      const register = new LWWRegister<string>();
      register.set('first', 'node1', 200);
      register.set('second', 'node1', 100);

      expect(register.get()).toBe('first');
    });

    it('should use node ID as tiebreaker', () => {
      const register = new LWWRegister<string>();
      register.set('a', 'node1', 100);
      register.set('b', 'node2', 100); // Same timestamp, higher node ID wins

      expect(register.get()).toBe('b');
    });

    it('should merge correctly', () => {
      const reg1 = new LWWRegister<string>();
      reg1.set('old', 'node1', 100);

      const reg2 = new LWWRegister<string>();
      reg2.set('new', 'node2', 200);

      const merged = reg1.merge(reg2);
      expect(merged.get()).toBe('new');
    });

    it('should serialize and deserialize', () => {
      const register = new LWWRegister<string>();
      register.set('value', 'node1', 100);

      const json = register.toJSON();
      const restored = LWWRegister.fromJSON<string>(json);

      expect(restored.get()).toBe('value');
    });
  });

  describe('ORSet', () => {
    it('should start empty', () => {
      const set = new ORSet<string>();
      expect(set.size()).toBe(0);
    });

    it('should add elements', () => {
      const set = new ORSet<string>();
      set.add('apple', 'node1');
      set.add('banana', 'node1');

      expect(set.has('apple')).toBe(true);
      expect(set.has('banana')).toBe(true);
      expect(set.size()).toBe(2);
    });

    it('should remove elements', () => {
      const set = new ORSet<string>();
      set.add('apple', 'node1', 100);
      set.remove('apple', 'node1', 200);

      expect(set.has('apple')).toBe(false);
    });

    it('should handle concurrent add/remove', () => {
      const set1 = new ORSet<string>();
      set1.add('item', 'node1', 100);

      const set2 = new ORSet<string>();
      set2.add('item', 'node2', 100);
      set2.remove('item', 'node2', 200);

      const merged = set1.merge(set2);
      // Remove wins because it has later timestamp
      expect(merged.has('item')).toBe(false);
    });

    it('should merge correctly', () => {
      const set1 = new ORSet<string>();
      set1.add('apple', 'node1', 100);
      set1.add('banana', 'node1', 100);

      const set2 = new ORSet<string>();
      set2.add('cherry', 'node2', 100);
      set2.add('banana', 'node2', 100);

      const merged = set1.merge(set2);

      expect(merged.values().sort()).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should serialize and deserialize', () => {
      const set = new ORSet<string>();
      set.add('apple', 'node1');
      set.add('banana', 'node1');

      const json = set.toJSON();
      const restored = ORSet.fromJSON<string>(json);

      expect(restored.values().sort()).toEqual(['apple', 'banana']);
    });
  });

  describe('LWWMap', () => {
    it('should set and get values', () => {
      const map = new LWWMap<string, number>();
      map.set('a', 1, 'node1');
      map.set('b', 2, 'node1');

      expect(map.get('a')).toBe(1);
      expect(map.get('b')).toBe(2);
    });

    it('should update with newer timestamp', () => {
      const map = new LWWMap<string, number>();
      map.set('key', 1, 'node1', 100);
      map.set('key', 2, 'node1', 200);

      expect(map.get('key')).toBe(2);
    });

    it('should delete keys', () => {
      const map = new LWWMap<string, number>();
      map.set('key', 1, 'node1', 100);
      map.delete('key', 'node1', 200);

      expect(map.has('key')).toBe(false);
    });

    it('should merge correctly', () => {
      const map1 = new LWWMap<string, number>();
      map1.set('a', 1, 'node1', 100);
      map1.set('b', 2, 'node1', 100);

      const map2 = new LWWMap<string, number>();
      map2.set('a', 10, 'node2', 200); // newer, should win
      map2.set('c', 3, 'node2', 100);

      const merged = map1.merge(map2);

      expect(merged.get('a')).toBe(10);
      expect(merged.get('b')).toBe(2);
      expect(merged.get('c')).toBe(3);
    });
  });
});

describe('VectorClockOps', () => {
  describe('create', () => {
    it('should create a clock with initial value', () => {
      const clock = VectorClockOps.create('node1');
      expect(clock['node1']).toBe(1);
    });
  });

  describe('increment', () => {
    it('should increment clock for a node', () => {
      let clock = VectorClockOps.create('node1');
      clock = VectorClockOps.increment(clock, 'node1');

      expect(clock['node1']).toBe(2);
    });

    it('should add new node entry', () => {
      let clock = VectorClockOps.create('node1');
      clock = VectorClockOps.increment(clock, 'node2');

      expect(clock['node2']).toBe(1);
    });
  });

  describe('merge', () => {
    it('should take max of each component', () => {
      const clock1 = { node1: 3, node2: 1 };
      const clock2 = { node1: 1, node2: 5, node3: 2 };

      const merged = VectorClockOps.merge(clock1, clock2);

      expect(merged).toEqual({ node1: 3, node2: 5, node3: 2 });
    });
  });

  describe('compare', () => {
    it('should detect a happened before b', () => {
      const a = { node1: 1, node2: 1 };
      const b = { node1: 2, node2: 2 };

      expect(VectorClockOps.compare(a, b)).toBe(-1);
    });

    it('should detect a happened after b', () => {
      const a = { node1: 2, node2: 2 };
      const b = { node1: 1, node2: 1 };

      expect(VectorClockOps.compare(a, b)).toBe(1);
    });

    it('should detect concurrent events', () => {
      const a = { node1: 2, node2: 1 };
      const b = { node1: 1, node2: 2 };

      expect(VectorClockOps.compare(a, b)).toBe(0);
    });
  });

  describe('happenedBefore', () => {
    it('should return true when a < b', () => {
      const a = { node1: 1 };
      const b = { node1: 2 };

      expect(VectorClockOps.happenedBefore(a, b)).toBe(true);
    });

    it('should return false when a >= b', () => {
      const a = { node1: 2 };
      const b = { node1: 1 };

      expect(VectorClockOps.happenedBefore(a, b)).toBe(false);
    });
  });

  describe('areConcurrent', () => {
    it('should detect concurrent clocks', () => {
      const a = { node1: 2, node2: 1 };
      const b = { node1: 1, node2: 2 };

      expect(VectorClockOps.areConcurrent(a, b)).toBe(true);
    });

    it('should return false for ordered clocks', () => {
      const a = { node1: 1 };
      const b = { node1: 2 };

      expect(VectorClockOps.areConcurrent(a, b)).toBe(false);
    });
  });
});

describe('MeshSyncServer', () => {
  let server: MeshSyncServer;

  beforeEach(() => {
    server = new MeshSyncServer('server-node-1');
  });

  afterEach(() => {
    server.stop();
  });

  describe('start/stop', () => {
    it('should start and stop cleanly', () => {
      server.start();
      expect(() => server.stop()).not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return server statistics', () => {
      server.start();

      const stats = server.getStats();

      expect(stats.nodeId).toBe('server-node-1');
      expect(stats.connectedNodes).toBe(0);
      expect(stats.vectorClock).toBeDefined();
    });
  });

  describe('getNodeList', () => {
    it('should return empty list initially', () => {
      server.start();

      const nodes = server.getNodeList();
      expect(nodes).toEqual([]);
    });
  });

  describe('notifyMemoryChange', () => {
    it('should update vector clock', () => {
      server.start();

      const initialClock = { ...server.getStats().vectorClock };

      server.notifyMemoryChange({
        memoryId: 'mem-1',
        operation: 'create',
        newValue: { content: 'test' },
        sourceNode: 'server-node-1',
        timestamp: Date.now(),
        vectorClock: initialClock,
      });

      const newClock = server.getStats().vectorClock;
      expect(newClock['server-node-1']).toBeGreaterThan(initialClock['server-node-1'] || 0);
    });
  });
});
