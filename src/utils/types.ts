/**
 * Type definitions for the Memory Importance Scoring and Decay System
 *
 * Re-exports canonical types from memory-schema.ts
 * This file serves as the primary import point for memory-related types
 */

// Re-export all canonical memory types from memory-schema
export {
  // Base types
  type MemoryId,
  type Timestamp,
  type Embedding,
  type ImportanceScore,
  type DecayRate,

  // Core enums
  MemoryType,
  MemoryStatus,
  ClaudeSurface,
  ConfidenceLevel,
  RelationType,
  EntityType,
  KnowledgeType,

  // Metadata interfaces
  type TemporalMetadata,
  type ImportanceMetadata,
  type SourceContext,
  type MemoryRelation,
  type EmbeddingMetadata,
  type TagMetadata,
  type SyncMetadata,

  // Base and specific memory interfaces
  type BaseMemory,
  type EpisodicMemory,
  type SemanticMemory,
  type ProceduralMemory,
  type WorkingMemory,
  type AnyMemory,

  // Memory operation types
  type MemoryQuery,
  type MemoryQueryResult,
  type MemoryIndex,
  type MemoryConsolidation,
  type DecayCalculation,
  type MemoryConflict,

  // Storage interfaces
  type MemoryStorage,
  type VectorStore,
  type MemoryCache,
  type MemorySystem,
  type MemorySystemStats,

  // Utility types
  type MemoryUpdate,
  type MemoryInput,

  // Type guards
  isEpisodicMemory,
  isSemanticMemory,
  isProceduralMemory,
  isWorkingMemory,

  // Index configuration
  SUGGESTED_INDEXES
} from '../memory/memory-schema';

// ============================================================================
// LEGACY TYPE DEFINITIONS (for backward compatibility)
// ============================================================================
//
// These types are kept for compatibility with existing memory system modules
// (decay, consolidation, forgetting, spaced-repetition, importance-scoring).
// They may be deprecated in the future in favor of memory-schema types.

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  status: MemoryStatus;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  last_accessed: Date;
  next_review?: Date;

  // Metrics
  access_count: number;
  strength: number;              // Current memory strength [0, 1]
  importance_score: number;      // Combined importance [0, 1]

  // Embeddings
  embedding?: number[];          // Vector representation
  embedding_model?: string;      // Model used for embedding

  // Metadata
  tags: string[];
  conversation_id?: string;
  user_id?: string;
  source?: string;

  // Related memories
  links: string[];               // IDs of related memories
  consolidated_from?: string[];  // Original memory IDs if consolidated

  // Privacy
  privacy_risk?: number;         // [0, 1] privacy sensitivity
  expires_at?: Date;             // Auto-deletion date

  // Scores (cached)
  recency_score?: number;
  frequency_score?: number;
  salience_score?: number;
  relevance_score?: number;
}

// ============================================================================
// Importance Scoring Types
// ============================================================================

export interface ImportanceWeights {
  recency: number;      // Weight for recency factor [0, 1]
  frequency: number;    // Weight for frequency factor [0, 1]
  salience: number;     // Weight for semantic salience [0, 1]
  relevance: number;    // Weight for contextual relevance [0, 1]
}

export interface RecencyConfig {
  lambda: number;       // Decay constant (default: 0.05)
}

export interface FrequencyConfig {
  max_expected_accesses: number;  // Normalization constant (default: 100)
}

export interface SalienceScores {
  emotional: number;    // [0, 10]
  novelty: number;      // [0, 10]
  actionable: number;   // [0, 10]
  personal: number;     // [0, 10]
}

export interface ImportanceFactors {
  recency: number;
  frequency: number;
  salience: number;
  relevance: number;
}

// ============================================================================
// Decay Configuration
// ============================================================================

export interface DecayConfig {
  base_rate: number;              // Base decay per day (default: 0.1)
  reinforcement_boost: number;    // Strength boost on access (default: 0.15)

  thresholds: {
    soft_delete: number;          // Threshold for archiving (default: 0.30)
    archive: number;              // Threshold for compression (default: 0.15)
    permanent_delete: number;     // Threshold for deletion (default: 0.05)
  };

  type_modifiers: {
    [key in MemoryType]: number;  // Decay rate multipliers by type
  };
}

export interface DecayModifiers {
  importance: number;
  access_pattern: number;
  type: number;
}

// ============================================================================
// Consolidation Types
// ============================================================================

export interface ConsolidationConfig {
  trigger_count: number;          // Memory count threshold (default: 10000)
  similarity_threshold: number;   // Cosine similarity threshold (default: 0.7)
  temporal_proximity_hours: number; // Time window for grouping (default: 1)
  compression_target: number;     // Target compression ratio (default: 0.5)
}

export interface MemoryCluster {
  id: string;
  memories: Memory[];
  centroid?: number[];            // Average embedding
  similarity_score: number;       // Average inter-cluster similarity
  time_span: {
    start: Date;
    end: Date;
  };
}

export interface ConsolidationStrategy {
  action: 'link' | 'summarize' | 'keep_and_summarize' | 'skip';
  cluster: MemoryCluster;
  reason: string;
}

export interface ConsolidatedMemory {
  summary: string;
  key_points: string[];
  original_ids: string[];
  time_span: string;
  importance_score: number;
}

// ============================================================================
// Spaced Repetition Types
// ============================================================================

export interface SpacedRepetitionConfig {
  initial_interval: number;       // Days until first review (default: 1)
  second_interval: number;        // Days until second review (default: 6)
  min_easiness: number;           // Minimum easiness factor (default: 1.3)
  max_easiness: number;           // Maximum easiness factor (default: 3.0)
}

export interface ReviewSchedule {
  memory_id: string;
  next_review: Date;
  interval: number;               // Current interval in days
  easiness_factor: number;        // Based on importance
  review_count: number;
}

export interface ReviewQueue {
  memories: Memory[];
  priority_scores: number[];      // Composite score for ordering
  due_dates: Date[];
}

// ============================================================================
// Forgetting Strategy Types
// ============================================================================

export interface ForgettingConfig {
  grace_period_days: number;      // Days before permanent deletion (default: 30)
  never_forget_tags: string[];

  privacy: {
    pii_max_days: number;         // Max retention for PII (default: 30)
    financial_max_days: number;   // Max retention for financial data (default: 90)
    health_max_days?: number;     // Max retention for health data
    casual_max_days: number;      // Max retention for casual chat (default: 180)
  };

  minimum_retention: {
    age_days: number;             // Don't delete memories younger than this
    importance: number;           // Don't delete memories above this importance
    access_count: number;         // Don't delete memories accessed more than this
  };
}

export interface DeletionCandidate {
  memory: Memory;
  reason: string;
  tier: 'soft' | 'archive' | 'permanent';
  scheduled_for: Date;
  recoverable: boolean;
}

// ============================================================================
// System Configuration
// ============================================================================

export interface MemorySystemConfig {
  importance: {
    weights: ImportanceWeights;
    recency_lambda: number;
    max_expected_accesses: number;
  };

  decay: DecayConfig;
  consolidation: ConsolidationConfig;
  spaced_repetition: SpacedRepetitionConfig;
  forgetting: ForgettingConfig;

  // Performance settings
  performance: {
    batch_size: number;           // Memories to process at once
    max_embedding_dimensions: number; // Full embedding size
    compressed_dimensions: number;    // Archived embedding size
    cache_ttl_seconds: number;    // Cache lifetime for computed scores
  };
}

// ============================================================================
// Analytics and Monitoring
// ============================================================================

export interface MemoryStats {
  total_memories: number;
  by_status: {
    [key in MemoryStatus]: number;
  };
  by_type: {
    [key in MemoryType]: number;
  };

  average_importance: number;
  average_strength: number;
  average_age_days: number;

  total_storage_bytes: number;
  consolidated_count: number;
  deletion_count_30d: number;
}

export interface PerformanceMetrics {
  importance_calc_ms: number;
  retrieval_ms: number;
  consolidation_ms: number;
  decay_update_ms: number;
}

// ============================================================================
// API Interfaces
// ============================================================================

export interface MemoryQuery {
  query_text?: string;
  query_embedding?: number[];

  filters?: {
    type?: MemoryType[];
    tags?: string[];
    min_importance?: number;
    min_strength?: number;
    date_range?: {
      start: Date;
      end: Date;
    };
  };

  limit?: number;
  offset?: number;
  include_archived?: boolean;
}

export interface MemorySearchResult {
  memory: Memory;
  score: number;                  // Relevance score
  distance?: number;              // Embedding distance
  matched_on: string[];           // Fields that matched
}

export interface MemoryOperationResult {
  success: boolean;
  memory_id?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// LLM Integration Types
// ============================================================================

export interface LLMSalienceRequest {
  content: string;
  context?: string;
}

export interface LLMSalienceResponse {
  scores: SalienceScores;
  explanation?: string;
  cached: boolean;
}

export interface LLMConsolidationRequest {
  memories: Memory[];
  strategy: 'summarize' | 'link' | 'merge';
}

export interface LLMConsolidationResponse {
  consolidated: ConsolidatedMemory;
  tokens_used: number;
}

// ============================================================================
// Event Types
// ============================================================================

export enum MemoryEvent {
  CREATED = 'memory.created',
  UPDATED = 'memory.updated',
  ACCESSED = 'memory.accessed',
  CONSOLIDATED = 'memory.consolidated',
  ARCHIVED = 'memory.archived',
  DELETED = 'memory.deleted',
  STRENGTHENED = 'memory.strengthened',
  DECAYED = 'memory.decayed'
}

export interface MemoryEventData {
  event: MemoryEvent;
  memory_id: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
