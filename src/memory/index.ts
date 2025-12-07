/**
 * Memory Module Index
 * Re-exports core memory service, tiers, and key types
 */

// Memory Service
export { MemoryService } from './memory-service';
export { createMemoryService } from './memory-service';

// Memory Tiers
export type { HotTier } from './hot-tier';
export type { WarmTier } from './warm-tier';
export type { ColdTier } from './cold-tier';

// Core Types from Schema
export {
  MemoryType,
  MemoryStatus,
  MemoryId,
  Timestamp,
  Embedding,
  ImportanceScore,
  DecayRate,
  ClaudeSurface,
  ConfidenceLevel,
  RelationType,
  EntityType,
  KnowledgeType,
} from './memory-schema';

export type {
  BaseMemory,
  EpisodicMemory,
  SemanticMemory,
  ProceduralMemory,
  WorkingMemory,
  MemoryQuery,
  MemoryQueryResult,
  TemporalMetadata,
  ImportanceMetadata,
  SourceContext,
  EmbeddingMetadata,
  TagMetadata,
  SyncMetadata,
  MemoryRelation,
} from './memory-schema';
