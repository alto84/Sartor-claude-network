"use strict";
/**
 * Multi-Tier AI Memory System Schema
 *
 * This schema defines a comprehensive memory system for AI agents with support for:
 * - Multiple memory tiers (Episodic, Semantic, Procedural, Working)
 * - Temporal decay and forgetting
 * - Semantic search via embeddings
 * - Cross-surface synchronization
 * - Importance-based retention
 * - Relational memory structures
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUGGESTED_INDEXES = exports.KnowledgeType = exports.EntityType = exports.RelationType = exports.MemoryStatus = exports.ConfidenceLevel = exports.ClaudeSurface = exports.MemoryType = void 0;
exports.isEpisodicMemory = isEpisodicMemory;
exports.isSemanticMemory = isSemanticMemory;
exports.isProceduralMemory = isProceduralMemory;
exports.isWorkingMemory = isWorkingMemory;
/**
 * Memory types in the system
 */
var MemoryType;
(function (MemoryType) {
    MemoryType["EPISODIC"] = "episodic";
    MemoryType["SEMANTIC"] = "semantic";
    MemoryType["PROCEDURAL"] = "procedural";
    MemoryType["WORKING"] = "working";
})(MemoryType || (exports.MemoryType = MemoryType = {}));
/**
 * Claude surfaces where memories can originate
 */
var ClaudeSurface;
(function (ClaudeSurface) {
    ClaudeSurface["WEB"] = "web";
    ClaudeSurface["SLACK"] = "slack";
    ClaudeSurface["API"] = "api";
    ClaudeSurface["MOBILE"] = "mobile";
    ClaudeSurface["DESKTOP"] = "desktop";
    ClaudeSurface["TERMINAL"] = "terminal";
})(ClaudeSurface || (exports.ClaudeSurface = ClaudeSurface = {}));
/**
 * Confidence level for memory accuracy
 */
var ConfidenceLevel;
(function (ConfidenceLevel) {
    ConfidenceLevel[ConfidenceLevel["VERY_LOW"] = 0.2] = "VERY_LOW";
    ConfidenceLevel[ConfidenceLevel["LOW"] = 0.4] = "LOW";
    ConfidenceLevel[ConfidenceLevel["MEDIUM"] = 0.6] = "MEDIUM";
    ConfidenceLevel[ConfidenceLevel["HIGH"] = 0.8] = "HIGH";
    ConfidenceLevel[ConfidenceLevel["VERY_HIGH"] = 1] = "VERY_HIGH";
})(ConfidenceLevel || (exports.ConfidenceLevel = ConfidenceLevel = {}));
/**
 * Memory status for lifecycle management
 */
var MemoryStatus;
(function (MemoryStatus) {
    MemoryStatus["ACTIVE"] = "active";
    MemoryStatus["ARCHIVED"] = "archived";
    MemoryStatus["DECAYED"] = "decayed";
    MemoryStatus["CONFLICTED"] = "conflicted";
    MemoryStatus["PENDING_CONSOLIDATION"] = "pending_consolidation";
})(MemoryStatus || (exports.MemoryStatus = MemoryStatus = {}));
/**
 * Types of relationships between memories
 */
var RelationType;
(function (RelationType) {
    // Temporal relationships
    RelationType["PRECEDED_BY"] = "preceded_by";
    RelationType["FOLLOWED_BY"] = "followed_by";
    RelationType["CONCURRENT_WITH"] = "concurrent_with";
    // Semantic relationships
    RelationType["SIMILAR_TO"] = "similar_to";
    RelationType["CONTRADICTS"] = "contradicts";
    RelationType["SUPPORTS"] = "supports";
    RelationType["REFINEMENT_OF"] = "refinement_of";
    RelationType["GENERALIZATION_OF"] = "generalization_of";
    // Structural relationships
    RelationType["PART_OF"] = "part_of";
    RelationType["CONTAINS"] = "contains";
    RelationType["DERIVED_FROM"] = "derived_from";
    RelationType["CONSOLIDATED_INTO"] = "consolidated_into";
    // Causal relationships
    RelationType["CAUSED_BY"] = "caused_by";
    RelationType["CAUSES"] = "causes";
    // Procedural relationships
    RelationType["PREREQUISITE_FOR"] = "prerequisite_for";
    RelationType["ALTERNATIVE_TO"] = "alternative_to";
})(RelationType || (exports.RelationType = RelationType = {}));
/**
 * Entity types for tagging
 */
var EntityType;
(function (EntityType) {
    EntityType["PERSON"] = "person";
    EntityType["ORGANIZATION"] = "organization";
    EntityType["LOCATION"] = "location";
    EntityType["DATE"] = "date";
    EntityType["TIME"] = "time";
    EntityType["PRODUCT"] = "product";
    EntityType["EVENT"] = "event";
    EntityType["SKILL"] = "skill";
    EntityType["TECHNOLOGY"] = "technology";
    EntityType["CONCEPT"] = "concept";
})(EntityType || (exports.EntityType = EntityType = {}));
/**
 * Types of semantic knowledge
 */
var KnowledgeType;
(function (KnowledgeType) {
    KnowledgeType["FACT"] = "fact";
    KnowledgeType["PREFERENCE"] = "preference";
    KnowledgeType["BELIEF"] = "belief";
    KnowledgeType["RULE"] = "rule";
    KnowledgeType["DEFINITION"] = "definition";
    KnowledgeType["RELATIONSHIP"] = "relationship";
    KnowledgeType["ATTRIBUTE"] = "attribute";
    KnowledgeType["CAPABILITY"] = "capability";
    KnowledgeType["LIMITATION"] = "limitation";
    KnowledgeType["GOAL"] = "goal";
})(KnowledgeType || (exports.KnowledgeType = KnowledgeType = {}));
/**
 * Suggested indexes for optimal performance
 */
exports.SUGGESTED_INDEXES = [
    {
        name: 'memory_id',
        type: 'hash',
        fields: ['id'],
        options: { unique: true }
    },
    {
        name: 'memory_type_status',
        type: 'btree',
        fields: ['type', 'status']
    },
    {
        name: 'created_at',
        type: 'btree',
        fields: ['temporal.createdAt']
    },
    {
        name: 'last_accessed_at',
        type: 'btree',
        fields: ['temporal.lastAccessedAt']
    },
    {
        name: 'importance_score',
        type: 'btree',
        fields: ['importance.importance']
    },
    {
        name: 'user_session',
        type: 'btree',
        fields: ['source.userId', 'source.sessionId']
    },
    {
        name: 'tags',
        type: 'btree',
        fields: ['tags.tags']
    },
    {
        name: 'categories',
        type: 'btree',
        fields: ['tags.categories']
    },
    {
        name: 'embedding_vector',
        type: 'vector',
        fields: ['embedding.vector'],
        options: {
            vectorDimensions: 1536,
            vectorMetric: 'cosine'
        }
    },
    {
        name: 'content_fulltext',
        type: 'fulltext',
        fields: ['content']
    }
];
// ============================================================================
// UTILITY TYPES
// ============================================================================
/**
 * Type guard to check if a memory is episodic
 */
function isEpisodicMemory(memory) {
    return memory.type === MemoryType.EPISODIC;
}
/**
 * Type guard to check if a memory is semantic
 */
function isSemanticMemory(memory) {
    return memory.type === MemoryType.SEMANTIC;
}
/**
 * Type guard to check if a memory is procedural
 */
function isProceduralMemory(memory) {
    return memory.type === MemoryType.PROCEDURAL;
}
/**
 * Type guard to check if a memory is working memory
 */
function isWorkingMemory(memory) {
    return memory.type === MemoryType.WORKING;
}
//# sourceMappingURL=memory-schema.js.map