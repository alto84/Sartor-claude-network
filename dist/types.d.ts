/**
 * Type definitions for the Memory Importance Scoring and Decay System
 */
export declare enum MemoryType {
    EPISODIC = "episodic",// Specific events and experiences
    SEMANTIC = "semantic",// Facts and general knowledge
    PROCEDURAL = "procedural",// How-to knowledge and skills
    EMOTIONAL = "emotional",// Emotionally significant content
    SYSTEM = "system"
}
export declare enum MemoryStatus {
    ACTIVE = "active",
    ARCHIVED = "archived",
    DELETED = "deleted"
}
export interface Memory {
    id: string;
    content: string;
    type: MemoryType;
    status: MemoryStatus;
    created_at: Date;
    updated_at: Date;
    last_accessed: Date;
    next_review?: Date;
    access_count: number;
    strength: number;
    importance_score: number;
    embedding?: number[];
    embedding_model?: string;
    tags: string[];
    conversation_id?: string;
    user_id?: string;
    source?: string;
    links: string[];
    consolidated_from?: string[];
    privacy_risk?: number;
    expires_at?: Date;
    recency_score?: number;
    frequency_score?: number;
    salience_score?: number;
    relevance_score?: number;
}
export interface ImportanceWeights {
    recency: number;
    frequency: number;
    salience: number;
    relevance: number;
}
export interface RecencyConfig {
    lambda: number;
}
export interface FrequencyConfig {
    max_expected_accesses: number;
}
export interface SalienceScores {
    emotional: number;
    novelty: number;
    actionable: number;
    personal: number;
}
export interface ImportanceFactors {
    recency: number;
    frequency: number;
    salience: number;
    relevance: number;
}
export interface DecayConfig {
    base_rate: number;
    reinforcement_boost: number;
    thresholds: {
        soft_delete: number;
        archive: number;
        permanent_delete: number;
    };
    type_modifiers: {
        [key in MemoryType]: number;
    };
}
export interface DecayModifiers {
    importance: number;
    access_pattern: number;
    type: number;
}
export interface ConsolidationConfig {
    trigger_count: number;
    similarity_threshold: number;
    temporal_proximity_hours: number;
    compression_target: number;
}
export interface MemoryCluster {
    id: string;
    memories: Memory[];
    centroid?: number[];
    similarity_score: number;
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
export interface SpacedRepetitionConfig {
    initial_interval: number;
    second_interval: number;
    min_easiness: number;
    max_easiness: number;
}
export interface ReviewSchedule {
    memory_id: string;
    next_review: Date;
    interval: number;
    easiness_factor: number;
    review_count: number;
}
export interface ReviewQueue {
    memories: Memory[];
    priority_scores: number[];
    due_dates: Date[];
}
export interface ForgettingConfig {
    grace_period_days: number;
    never_forget_tags: string[];
    privacy: {
        pii_max_days: number;
        financial_max_days: number;
        health_max_days?: number;
        casual_max_days: number;
    };
    minimum_retention: {
        age_days: number;
        importance: number;
        access_count: number;
    };
}
export interface DeletionCandidate {
    memory: Memory;
    reason: string;
    tier: 'soft' | 'archive' | 'permanent';
    scheduled_for: Date;
    recoverable: boolean;
}
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
    performance: {
        batch_size: number;
        max_embedding_dimensions: number;
        compressed_dimensions: number;
        cache_ttl_seconds: number;
    };
}
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
    score: number;
    distance?: number;
    matched_on: string[];
}
export interface MemoryOperationResult {
    success: boolean;
    memory_id?: string;
    error?: string;
    metadata?: Record<string, any>;
}
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
export declare enum MemoryEvent {
    CREATED = "memory.created",
    UPDATED = "memory.updated",
    ACCESSED = "memory.accessed",
    CONSOLIDATED = "memory.consolidated",
    ARCHIVED = "memory.archived",
    DELETED = "memory.deleted",
    STRENGTHENED = "memory.strengthened",
    DECAYED = "memory.decayed"
}
export interface MemoryEventData {
    event: MemoryEvent;
    memory_id: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=types.d.ts.map