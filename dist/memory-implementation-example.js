"use strict";
/**
 * Memory System Implementation Examples
 *
 * This file demonstrates how to implement the memory schema interfaces
 * in a real MCP server environment.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySystemImpl = void 0;
exports.generateMemoryId = generateMemoryId;
exports.now = now;
exports.calculateImportance = calculateImportance;
exports.calculateDecayRate = calculateDecayRate;
exports.applyDecay = applyDecay;
exports.hashContent = hashContent;
exports.createBaseMemory = createBaseMemory;
const memory_schema_1 = require("./memory-schema");
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Generate a unique memory ID
 */
function generateMemoryId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Get current ISO timestamp
 */
function now() {
    return new Date().toISOString();
}
/**
 * Calculate importance from various factors
 */
function calculateImportance(factors) {
    const weights = {
        recency: 0.25,
        frequency: 0.20,
        userExplicit: 0.30,
        emotional: 0.15,
        novelty: 0.10
    };
    return (factors.recency * weights.recency +
        factors.frequency * weights.frequency +
        factors.userExplicit * weights.userExplicit +
        factors.emotional * weights.emotional +
        factors.novelty * weights.novelty);
}
/**
 * Calculate decay rate based on memory characteristics
 */
function calculateDecayRate(memory) {
    // High importance memories decay slower
    const importanceModifier = 1 - memory.importance.importance;
    // Frequently accessed memories decay slower
    const frequencyModifier = Math.max(0, 1 - memory.temporal.accessFrequency / 10);
    // Base decay rate varies by memory type
    const baseDecayRates = {
        [memory_schema_1.MemoryType.WORKING]: 0.9, // Very fast decay
        [memory_schema_1.MemoryType.EPISODIC]: 0.5, // Moderate decay
        [memory_schema_1.MemoryType.SEMANTIC]: 0.2, // Slow decay
        [memory_schema_1.MemoryType.PROCEDURAL]: 0.1 // Very slow decay
    };
    const baseRate = baseDecayRates[memory.type];
    return baseRate * importanceModifier * frequencyModifier;
}
/**
 * Apply exponential decay to importance score
 */
function applyDecay(currentImportance, decayRate, timeSinceAccessMs) {
    const hoursSinceAccess = timeSinceAccessMs / (1000 * 60 * 60);
    const decayFactor = Math.exp(-decayRate * hoursSinceAccess / 24); // Daily decay
    const newImportance = currentImportance * decayFactor;
    const shouldArchive = newImportance < 0.1;
    return {
        currentImportance,
        baseDecayRate: decayRate,
        timeSinceAccess: timeSinceAccessMs,
        frequencyModifier: 1.0,
        newImportance,
        shouldArchive
    };
}
/**
 * Hash content for sync conflict detection
 */
function hashContent(content) {
    // In production, use a proper hashing algorithm
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create base memory metadata
 */
function createBaseMemory(type, surface, userId, sessionId, initialImportance = 0.5) {
    const currentTime = now();
    const memoryId = generateMemoryId();
    const importanceFactors = {
        recency: 1.0,
        frequency: 0.0,
        userExplicit: 0.5,
        emotional: 0.5,
        novelty: 0.7
    };
    return {
        id: memoryId,
        type,
        status: memory_schema_1.MemoryStatus.ACTIVE,
        temporal: {
            createdAt: currentTime,
            lastAccessedAt: currentTime,
            lastModifiedAt: currentTime,
            accessCount: 0,
            accessFrequency: 0,
            accessHistory: [currentTime]
        },
        importance: {
            importance: initialImportance,
            initialImportance,
            decayRate: 0.5,
            protectedFromDecay: false,
            decayThreshold: 0.1,
            importanceFactors
        },
        source: {
            surface,
            userId,
            sessionId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator?.language || 'en-US'
        },
        embedding: {
            vector: [], // Will be populated by embedding service
            model: 'text-embedding-3-small',
            modelVersion: '1.0',
            dimensions: 1536,
            generatedAt: currentTime,
            needsRefresh: true
        },
        tags: {
            tags: [],
            categories: [],
            topics: [],
            entities: []
        },
        relations: [],
        sync: {
            lastSyncedAt: currentTime,
            version: 1,
            contentHash: '',
            syncEnabled: true,
            availableSurfaces: [surface],
            pendingSync: false,
            conflictResolution: 'latest_wins'
        },
        metadata: {}
    };
}
// ============================================================================
// MEMORY SYSTEM IMPLEMENTATION
// ============================================================================
/**
 * In-memory implementation of MemoryStorage (for demonstration)
 * In production, use a real database
 */
class InMemoryStorage {
    constructor() {
        this.memories = new Map();
    }
    async store(memory) {
        this.memories.set(memory.id, memory);
    }
    async retrieve(id) {
        return this.memories.get(id) || null;
    }
    async update(id, updates) {
        const memory = this.memories.get(id);
        if (memory) {
            this.memories.set(id, { ...memory, ...updates });
        }
    }
    async delete(id) {
        this.memories.delete(id);
    }
    async query(query) {
        let results = Array.from(this.memories.values());
        // Filter by type
        if (query.types) {
            results = results.filter(m => query.types.includes(m.type));
        }
        // Filter by status
        if (query.status) {
            results = results.filter(m => query.status.includes(m.status));
        }
        // Filter by temporal
        if (query.temporal) {
            if (query.temporal.startDate) {
                results = results.filter(m => m.temporal.createdAt >= query.temporal.startDate);
            }
            if (query.temporal.endDate) {
                results = results.filter(m => m.temporal.createdAt <= query.temporal.endDate);
            }
        }
        // Filter by importance
        if (query.importance) {
            if (query.importance.minImportance !== undefined) {
                results = results.filter(m => m.importance.importance >= query.importance.minImportance);
            }
            if (query.importance.maxImportance !== undefined) {
                results = results.filter(m => m.importance.importance <= query.importance.maxImportance);
            }
        }
        // Filter by tags
        if (query.tags?.includeTags) {
            results = results.filter(m => query.tags.includeTags.some(tag => m.tags.tags.includes(tag)));
        }
        // Limit results
        if (query.limit) {
            results = results.slice(0, query.limit);
        }
        return results.map(memory => ({
            memory,
            score: 0.8, // Simplified scoring
            retrievalReason: 'matched query filters',
            relevanceFactors: {
                semantic: 0.8,
                temporal: 0.7,
                importance: memory.importance.importance,
                relational: 0.5
            }
        }));
    }
    async batchStore(memories) {
        for (const memory of memories) {
            await this.store(memory);
        }
    }
    async batchRetrieve(ids) {
        return Promise.all(ids.map(id => this.retrieve(id)));
    }
    async createIndex() {
        // No-op for in-memory implementation
    }
    async dropIndex() {
        // No-op for in-memory implementation
    }
}
/**
 * Simple in-memory vector store (for demonstration)
 */
class SimpleVectorStore {
    constructor() {
        this.vectors = new Map();
    }
    async addVectors(vectors) {
        for (const { id, vector, metadata } of vectors) {
            this.vectors.set(id, { vector, metadata });
        }
    }
    async searchSimilar(query, limit, filter) {
        const results = [];
        for (const [id, { vector }] of this.vectors.entries()) {
            const similarity = this.cosineSimilarity(query, vector);
            results.push({ id, score: similarity });
        }
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    async updateVector(id, vector) {
        const existing = this.vectors.get(id);
        if (existing) {
            this.vectors.set(id, { ...existing, vector });
        }
    }
    async deleteVector(id) {
        this.vectors.delete(id);
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
/**
 * Simple in-memory cache
 */
class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.hits = 0;
        this.misses = 0;
    }
    async get(id) {
        const cached = this.cache.get(id);
        if (cached && cached.expires > Date.now()) {
            this.hits++;
            return cached.memory;
        }
        this.misses++;
        return null;
    }
    async set(id, memory, ttl = 3600000) {
        this.cache.set(id, {
            memory,
            expires: Date.now() + ttl
        });
    }
    async remove(id) {
        this.cache.delete(id);
    }
    async clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
    async stats() {
        return {
            hits: this.hits,
            misses: this.misses,
            size: this.cache.size
        };
    }
}
/**
 * Complete Memory System Implementation
 */
class MemorySystemImpl {
    constructor(storage, vectorStore, cache) {
        this.storage = storage || new InMemoryStorage();
        this.vectorStore = vectorStore || new SimpleVectorStore();
        this.cache = cache || new SimpleCache();
    }
    async createEpisodicMemory(content) {
        const base = createBaseMemory(memory_schema_1.MemoryType.EPISODIC, content.source?.surface || memory_schema_1.ClaudeSurface.API, content.source?.userId || 'unknown', content.source?.sessionId || generateMemoryId());
        const memory = {
            ...base,
            ...content,
            type: memory_schema_1.MemoryType.EPISODIC
        };
        // Update content hash
        memory.sync.contentHash = hashContent(memory.content);
        await this.storage.store(memory);
        await this.cache.set(memory.id, memory);
        return memory;
    }
    async createSemanticMemory(content) {
        const base = createBaseMemory(memory_schema_1.MemoryType.SEMANTIC, content.source?.surface || memory_schema_1.ClaudeSurface.API, content.source?.userId || 'unknown', content.source?.sessionId || generateMemoryId());
        const memory = {
            ...base,
            ...content,
            type: memory_schema_1.MemoryType.SEMANTIC,
            confidence: content.confidence || memory_schema_1.ConfidenceLevel.MEDIUM,
            knowledgeType: content.knowledgeType || memory_schema_1.KnowledgeType.FACT,
            evidence: content.evidence || [],
            contradictions: content.contradictions || [],
            isPreference: content.isPreference || false,
            domain: content.domain || 'general'
        };
        memory.sync.contentHash = hashContent(memory.content);
        await this.storage.store(memory);
        await this.cache.set(memory.id, memory);
        return memory;
    }
    async createProceduralMemory(content) {
        const base = createBaseMemory(memory_schema_1.MemoryType.PROCEDURAL, content.source?.surface || memory_schema_1.ClaudeSurface.API, content.source?.userId || 'unknown', content.source?.sessionId || generateMemoryId());
        const memory = {
            ...base,
            ...content,
            type: memory_schema_1.MemoryType.PROCEDURAL,
            steps: content.steps || [],
            applicabilityConditions: content.applicabilityConditions || [],
            prerequisites: content.prerequisites || [],
            expectedOutcomes: content.expectedOutcomes || [],
            successRate: content.successRate || 0,
            executionCount: content.executionCount || 0,
            variations: content.variations || [],
            failureModes: content.failureModes || []
        };
        memory.sync.contentHash = hashContent(memory.content);
        await this.storage.store(memory);
        await this.cache.set(memory.id, memory);
        return memory;
    }
    async createWorkingMemory(content) {
        const base = createBaseMemory(memory_schema_1.MemoryType.WORKING, content.source?.surface || memory_schema_1.ClaudeSurface.API, content.source?.userId || 'unknown', content.source?.sessionId || generateMemoryId(), 0.9 // Working memory starts with high importance
        );
        const memory = {
            ...base,
            ...content,
            type: memory_schema_1.MemoryType.WORKING,
            attentionFocus: content.attentionFocus || {
                primary: '',
                secondary: [],
                trigger: '',
                duration: 0,
                importance: 0.5
            },
            activeGoals: content.activeGoals || [],
            contextStack: content.contextStack || [],
            recentlyActivated: content.recentlyActivated || [],
            pendingTasks: content.pendingTasks || [],
            sessionState: content.sessionState || {
                sessionId: base.source.sessionId,
                startedAt: now(),
                lastActivityAt: now(),
                turnCount: 0,
                engagementLevel: 'medium',
                phase: 'exploration'
            },
            ttl: content.ttl || 3600000, // 1 hour default
            consolidationCandidate: false
        };
        memory.sync.contentHash = hashContent(memory.content);
        await this.storage.store(memory);
        await this.cache.set(memory.id, memory, memory.ttl);
        return memory;
    }
    async recall(query) {
        // If we have a query embedding, use vector search
        if (query.queryEmbedding) {
            const vectorResults = await this.vectorStore.searchSimilar(query.queryEmbedding, query.limit || 10);
            const memories = await this.storage.batchRetrieve(vectorResults.map(r => r.id));
            return memories
                .filter((m) => m !== null)
                .map((memory, idx) => ({
                memory,
                score: vectorResults[idx].score,
                retrievalReason: 'semantic similarity',
                relevanceFactors: {
                    semantic: vectorResults[idx].score,
                    temporal: this.calculateTemporalRelevance(memory),
                    importance: memory.importance.importance,
                    relational: 0.5
                }
            }));
        }
        // Otherwise, use structured query
        return this.storage.query(query);
    }
    async updateMemoryMetadata(id, metadata) {
        const memory = await this.storage.retrieve(id);
        if (!memory) {
            throw new Error(`Memory ${id} not found`);
        }
        // Update access metadata
        const currentTime = now();
        const updatedMetadata = {
            ...metadata,
            temporal: {
                ...memory.temporal,
                ...metadata.temporal,
                lastAccessedAt: currentTime,
                accessCount: memory.temporal.accessCount + 1,
                accessHistory: [...memory.temporal.accessHistory, currentTime]
            },
            sync: {
                ...memory.sync,
                version: memory.sync.version + 1,
                lastSyncedAt: currentTime
            }
        };
        await this.storage.update(id, updatedMetadata);
        await this.cache.remove(id); // Invalidate cache
    }
    async consolidate(memoryIds, strategy) {
        const memories = await this.storage.batchRetrieve(memoryIds);
        const validMemories = memories.filter((m) => m !== null);
        if (validMemories.length === 0) {
            throw new Error('No valid memories to consolidate');
        }
        // Create consolidated memory based on strategy
        let consolidated;
        switch (strategy) {
            case 'merge':
                consolidated = await this.mergeMemories(validMemories);
                break;
            case 'summarize':
                consolidated = await this.summarizeMemories(validMemories);
                break;
            case 'abstract':
                consolidated = await this.abstractMemories(validMemories);
                break;
            case 'pattern_extract':
                consolidated = await this.extractPattern(validMemories);
                break;
            default:
                throw new Error(`Unknown consolidation strategy: ${strategy}`);
        }
        await this.storage.store(consolidated);
        // Archive source memories
        for (const memory of validMemories) {
            await this.storage.update(memory.id, {
                status: memory_schema_1.MemoryStatus.ARCHIVED,
                metadata: {
                    ...memory.metadata,
                    consolidatedInto: consolidated.id
                }
            });
        }
        return {
            sourceMemoryIds: memoryIds,
            consolidatedMemoryId: consolidated.id,
            strategy,
            consolidatedAt: now(),
            preservationScore: 0.85 // Simplified
        };
    }
    async applyDecay() {
        const allMemories = await this.storage.query({});
        const calculations = [];
        const currentTime = Date.now();
        for (const { memory } of allMemories) {
            if (memory.importance.protectedFromDecay) {
                continue;
            }
            const timeSinceAccess = currentTime - new Date(memory.temporal.lastAccessedAt).getTime();
            const decay = applyDecay(memory.importance.importance, memory.importance.decayRate, timeSinceAccess);
            calculations.push(decay);
            // Update memory importance
            await this.storage.update(memory.id, {
                importance: {
                    ...memory.importance,
                    importance: decay.newImportance
                },
                status: decay.shouldArchive ? memory_schema_1.MemoryStatus.ARCHIVED : memory.status
            });
        }
        return calculations;
    }
    async detectConflicts() {
        // Simplified conflict detection
        // In production, use semantic similarity + contradiction detection
        return [];
    }
    async resolveConflict(conflictId, strategy) {
        // Implementation for conflict resolution
        throw new Error('Not implemented');
    }
    async sync(surface) {
        // Implementation for cross-surface sync
        return { synced: 0, conflicts: 0 };
    }
    async archive(criteria) {
        const results = await this.storage.query(criteria);
        const archived = [];
        for (const { memory } of results) {
            await this.storage.update(memory.id, {
                status: memory_schema_1.MemoryStatus.ARCHIVED
            });
            archived.push(memory.id);
        }
        return archived;
    }
    async getStats() {
        const allMemories = await this.storage.query({});
        const cacheStats = await this.cache.stats();
        const counts = {
            [memory_schema_1.MemoryType.EPISODIC]: 0,
            [memory_schema_1.MemoryType.SEMANTIC]: 0,
            [memory_schema_1.MemoryType.PROCEDURAL]: 0,
            [memory_schema_1.MemoryType.WORKING]: 0
        };
        const importanceSums = {
            [memory_schema_1.MemoryType.EPISODIC]: 0,
            [memory_schema_1.MemoryType.SEMANTIC]: 0,
            [memory_schema_1.MemoryType.PROCEDURAL]: 0,
            [memory_schema_1.MemoryType.WORKING]: 0
        };
        for (const { memory } of allMemories) {
            counts[memory.type]++;
            importanceSums[memory.type] += memory.importance.importance;
        }
        const averageImportance = {
            [memory_schema_1.MemoryType.EPISODIC]: importanceSums[memory_schema_1.MemoryType.EPISODIC] / (counts[memory_schema_1.MemoryType.EPISODIC] || 1),
            [memory_schema_1.MemoryType.SEMANTIC]: importanceSums[memory_schema_1.MemoryType.SEMANTIC] / (counts[memory_schema_1.MemoryType.SEMANTIC] || 1),
            [memory_schema_1.MemoryType.PROCEDURAL]: importanceSums[memory_schema_1.MemoryType.PROCEDURAL] / (counts[memory_schema_1.MemoryType.PROCEDURAL] || 1),
            [memory_schema_1.MemoryType.WORKING]: importanceSums[memory_schema_1.MemoryType.WORKING] / (counts[memory_schema_1.MemoryType.WORKING] || 1)
        };
        return {
            counts,
            storageUsed: 0, // Would calculate actual size
            averageImportance,
            recentCreations: 0,
            recentAccesses: 0,
            pendingConsolidation: 0,
            conflicts: 0,
            cacheHitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses),
            lastSync: {
                [memory_schema_1.ClaudeSurface.WEB]: now(),
                [memory_schema_1.ClaudeSurface.SLACK]: now(),
                [memory_schema_1.ClaudeSurface.API]: now(),
                [memory_schema_1.ClaudeSurface.MOBILE]: now(),
                [memory_schema_1.ClaudeSurface.DESKTOP]: now(),
                [memory_schema_1.ClaudeSurface.TERMINAL]: now()
            }
        };
    }
    // Private helper methods
    calculateTemporalRelevance(memory) {
        const hoursSinceCreation = (Date.now() - new Date(memory.temporal.createdAt).getTime()) / (1000 * 60 * 60);
        return Math.exp(-hoursSinceCreation / 168); // Decay over one week
    }
    async mergeMemories(memories) {
        // Simplified merge - take first memory and add relations
        const primary = memories[0];
        return {
            ...primary,
            id: generateMemoryId(),
            relations: memories.slice(1).map(m => ({
                type: 'CONSOLIDATED_INTO',
                targetMemoryId: m.id,
                targetMemoryType: m.type,
                strength: 1.0,
                establishedAt: now()
            }))
        };
    }
    async summarizeMemories(memories) {
        // In production, use LLM to generate summary
        return this.mergeMemories(memories);
    }
    async abstractMemories(memories) {
        // In production, extract abstract patterns
        return this.mergeMemories(memories);
    }
    async extractPattern(memories) {
        // In production, analyze episodic memories to extract procedures
        const base = createBaseMemory(memory_schema_1.MemoryType.PROCEDURAL, memories[0].source.surface, memories[0].source.userId, memories[0].source.sessionId);
        return {
            ...base,
            type: memory_schema_1.MemoryType.PROCEDURAL,
            content: {
                name: 'Extracted pattern',
                purpose: 'Pattern extracted from repeated behaviors',
                description: 'Auto-generated procedural memory',
                whenToUse: 'When similar conditions arise'
            },
            steps: [],
            applicabilityConditions: [],
            prerequisites: [],
            expectedOutcomes: [],
            successRate: 0,
            executionCount: 0,
            variations: [],
            failureModes: []
        };
    }
}
exports.MemorySystemImpl = MemorySystemImpl;
// ============================================================================
// USAGE EXAMPLES
// ============================================================================
/**
 * Example: Creating and using a memory system
 */
async function exampleUsage() {
    const memorySystem = new MemorySystemImpl();
    // Create an episodic memory
    const episode = await memorySystem.createEpisodicMemory({
        content: {
            title: 'TypeScript discussion',
            description: 'Discussed TypeScript best practices',
            summary: 'User wants to learn about TypeScript patterns',
            keyQuotes: ['I love type safety'],
            messages: [
                {
                    id: 'msg_1',
                    role: 'user',
                    content: 'How do I use generics in TypeScript?',
                    timestamp: now(),
                    importance: 0.8
                },
                {
                    id: 'msg_2',
                    role: 'assistant',
                    content: 'Generics allow you to create reusable components...',
                    timestamp: now(),
                    importance: 0.7
                }
            ]
        },
        temporalStructure: {
            startTime: now(),
            endTime: now(),
            duration: 300000,
            temporalContext: {
                timeOfDay: 'afternoon',
                dayOfWeek: 'Monday',
                isWeekend: false
            }
        },
        participants: [
            { id: 'user_1', role: 'user', participationLevel: 0.5 },
            { id: 'assistant', role: 'assistant', participationLevel: 0.5 }
        ],
        emotionalContext: {
            valence: 0.8,
            arousal: 0.6,
            emotions: [{ emotion: 'curious', intensity: 0.9 }],
            sentiment: 'positive',
            userSatisfaction: 0.9
        },
        narrative: {
            beginning: 'User asked about generics',
            middle: 'Discussed use cases and examples',
            end: 'User understood the concept',
            turningPoints: [],
            themes: ['TypeScript', 'Generics', 'Type Safety'],
            problemSolutions: []
        },
        keyMoments: [],
        outcomes: []
    });
    console.log('Created episodic memory:', episode.id);
    // Extract semantic memory from episode
    const semantic = await memorySystem.createSemanticMemory({
        content: {
            subject: 'user_1',
            predicate: 'is_interested_in',
            object: 'TypeScript generics',
            statement: 'User is interested in learning TypeScript generics',
            qualifiers: ['high_interest']
        },
        knowledgeType: memory_schema_1.KnowledgeType.PREFERENCE,
        confidence: memory_schema_1.ConfidenceLevel.HIGH,
        evidence: [
            {
                type: 'episodic',
                sourceId: episode.id,
                description: 'User asked about generics in conversation',
                strength: 0.9,
                timestamp: now()
            }
        ],
        isPreference: true,
        domain: 'programming'
    });
    console.log('Created semantic memory:', semantic.id);
    // Recall memories
    const results = await memorySystem.recall({
        types: [memory_schema_1.MemoryType.EPISODIC, memory_schema_1.MemoryType.SEMANTIC],
        limit: 10,
        importance: {
            minImportance: 0.5
        }
    });
    console.log(`Found ${results.length} memories`);
    // Get stats
    const stats = await memorySystem.getStats();
    console.log('Memory system stats:', stats);
}
// Run example if this file is executed directly
if (require.main === module) {
    exampleUsage().catch(console.error);
}
//# sourceMappingURL=memory-implementation-example.js.map