interface MemoryConfig {
  hotMaxSize?: number;
  warmMaxSize?: number;
  promotionThreshold?: number;
}

interface SetOptions {
  tier?: 'hot' | 'warm' | 'cold';
  ttl?: number;
}

interface TierItem<T> {
  value: T;
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
}

export class MemoryService {
  private hot: Map<string, TierItem<any>> = new Map();
  private warm: Map<string, TierItem<any>> = new Map();
  private cold: Map<string, TierItem<any>> = new Map();
  private config: Required<MemoryConfig>;

  constructor(config: MemoryConfig = {}) {
    this.config = {
      hotMaxSize: config.hotMaxSize ?? 50,
      warmMaxSize: config.warmMaxSize ?? 500,
      promotionThreshold: config.promotionThreshold ?? 5,
    };
  }

  async get(key: string): Promise<any> {
    for (const tier of [this.hot, this.warm, this.cold]) {
      const item = tier.get(key);
      if (item) {
        item.accessCount++;
        item.lastAccessed = Date.now();
        if (item.accessCount >= this.config.promotionThreshold && tier !== this.hot) {
          await this.promote(key);
        }
        return item.value;
      }
    }
    return undefined;
  }

  async set(key: string, value: any, options: SetOptions = {}): Promise<void> {
    const now = Date.now();
    const item: TierItem<any> = {
      value,
      accessCount: 1,
      lastAccessed: now,
      createdAt: now,
    };

    const tier = options.tier ?? 'warm';
    if (tier === 'hot') {
      this.hot.set(key, item);
      this.evictIfNeeded(this.hot, this.config.hotMaxSize, this.warm);
    } else if (tier === 'warm') {
      this.warm.set(key, item);
      this.evictIfNeeded(this.warm, this.config.warmMaxSize, this.cold);
    } else {
      this.cold.set(key, item);
    }
  }

  async delete(key: string): Promise<void> {
    this.hot.delete(key);
    this.warm.delete(key);
    this.cold.delete(key);
  }

  async promote(key: string): Promise<void> {
    const coldItem = this.cold.get(key);
    if (coldItem) {
      this.cold.delete(key);
      this.warm.set(key, coldItem);
      this.evictIfNeeded(this.warm, this.config.warmMaxSize, this.cold);
      return;
    }
    const warmItem = this.warm.get(key);
    if (warmItem) {
      this.warm.delete(key);
      this.hot.set(key, warmItem);
      this.evictIfNeeded(this.hot, this.config.hotMaxSize, this.warm);
    }
  }

  async demote(key: string): Promise<void> {
    const hotItem = this.hot.get(key);
    if (hotItem) {
      this.hot.delete(key);
      this.warm.set(key, hotItem);
      this.evictIfNeeded(this.warm, this.config.warmMaxSize, this.cold);
      return;
    }
    const warmItem = this.warm.get(key);
    if (warmItem) {
      this.warm.delete(key);
      this.cold.set(key, warmItem);
    }
  }

  async search(pattern: string | RegExp): Promise<Array<{ key: string; value: any }>> {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    const results = [];
    for (const tier of [this.hot, this.warm, this.cold]) {
      for (const [key, item] of tier.entries()) {
        if (regex.test(key)) results.push({ key, value: item.value });
      }
    }
    return results;
  }

  private evictIfNeeded(
    tier: Map<string, TierItem<any>>,
    maxSize: number,
    fallback: Map<string, TierItem<any>>
  ): void {
    if (tier.size > maxSize) {
      let lruKey: string | null = null;
      let lruTime = Infinity;
      for (const [key, item] of tier.entries()) {
        if (item.lastAccessed < lruTime) {
          lruTime = item.lastAccessed;
          lruKey = key;
        }
      }
      if (lruKey) {
        const item = tier.get(lruKey)!;
        tier.delete(lruKey);
        fallback.set(lruKey, item);
      }
    }
  }
}
