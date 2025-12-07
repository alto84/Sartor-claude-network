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

// ============================================================================
// BASE TYPES AND ENUMS
// ============================================================================

/**
 * Unique identifier type for all memory entities
 */
export type MemoryId = string;

/**
 * ISO 8601 timestamp string
 */
export type Timestamp = string;

/**
 * Vector embedding for semantic search
 * Typically 768, 1024, or 1536 dimensions depending on the embedding model
 */
export type Embedding = number[];

/**
 * Importance score: 0.0 (low) to 1.0 (critical)
 */
export type ImportanceScore = number;

/**
 * Decay rate: how quickly a memory fades over time
 * 0.0 (no decay) to 1.0 (rapid decay)
 */
export type DecayRate = number;

/**
 * Memory types in the system
 */
export enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working'
}

/**
 * Claude surfaces where memories can originate
 */
export enum ClaudeSurface {
  WEB = 'web',
  SLACK = 'slack',
  API = 'api',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  TERMINAL = 'terminal'
}

/**
 * Confidence level for memory accuracy
 */
export enum ConfidenceLevel {
  VERY_LOW = 0.2,
  LOW = 0.4,
  MEDIUM = 0.6,
  HIGH = 0.8,
  VERY_HIGH = 1.0
}

/**
 * Memory status for lifecycle management
 */
export enum MemoryStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DECAYED = 'decayed',
  CONFLICTED = 'conflicted',
  PENDING_CONSOLIDATION = 'pending_consolidation'
}

// ============================================================================
// COMMON INTERFACES
// ============================================================================

/**
 * Temporal metadata tracking creation, access, and modification
 */
export interface TemporalMetadata {
  /** When the memory was created */
  createdAt: Timestamp;

  /** When the memory was last accessed */
  lastAccessedAt: Timestamp;

  /** When the memory was last modified */
  lastModifiedAt: Timestamp;

  /** Number of times this memory has been accessed */
  accessCount: number;

  /** Access frequency (accesses per time unit) - calculated field */
  accessFrequency: number;

  /** Last time the memory was used to inform a response */
  lastUsedAt?: Timestamp;

  /** Timestamps of all accesses (for temporal analysis) */
  accessHistory: Timestamp[];
}

/**
 * Importance and decay metadata
 */
export interface ImportanceMetadata {
  /** Current importance score (0-1) */
  importance: ImportanceScore;

  /** Initial importance when created */
  initialImportance: ImportanceScore;

  /** Rate at which importance decays over time */
  decayRate: DecayRate;

  /** Whether this memory should be protected from decay */
  protectedFromDecay: boolean;

  /** Minimum importance threshold before archival */
  decayThreshold: number;

  /** Factors contributing to importance (for transparency) */
  importanceFactors: {
    recency: number;
    frequency: number;
    userExplicit: number;
    emotional: number;
    novelty: number;
  };
}

/**
 * Source context tracking where the memory originated
 */
export interface SourceContext {
  /** Which Claude surface created this memory */
  surface: ClaudeSurface;

  /** User identifier (hashed for privacy) */
  userId: string;

  /** Session identifier */
  sessionId: string;

  /** Conversation or interaction identifier */
  conversationId?: string;

  /** Original message or interaction ID */
  sourceMessageId?: string;

  /** Geographic/timezone context */
  timezone?: string;
  locale?: string;

  /** Device/client metadata */
  deviceType?: string;
  clientVersion?: string;
}

/**
 * Relationship to other memories
 */
export interface MemoryRelation {
  /** Type of relationship */
  type: RelationType;

  /** ID of the related memory */
  targetMemoryId: MemoryId;

  /** Type of the related memory */
  targetMemoryType: MemoryType;

  /** Strength of the relationship (0-1) */
  strength: number;

  /** When this relationship was established */
  establishedAt: Timestamp;

  /** Optional metadata about the relationship */
  metadata?: Record<string, unknown>;
}

/**
 * Types of relationships between memories
 */
export enum RelationType {
  // Temporal relationships
  PRECEDED_BY = 'preceded_by',
  FOLLOWED_BY = 'followed_by',
  CONCURRENT_WITH = 'concurrent_with',

  // Semantic relationships
  SIMILAR_TO = 'similar_to',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  REFINEMENT_OF = 'refinement_of',
  GENERALIZATION_OF = 'generalization_of',

  // Structural relationships
  PART_OF = 'part_of',
  CONTAINS = 'contains',
  DERIVED_FROM = 'derived_from',
  CONSOLIDATED_INTO = 'consolidated_into',

  // Causal relationships
  CAUSED_BY = 'caused_by',
  CAUSES = 'causes',

  // Procedural relationships
  PREREQUISITE_FOR = 'prerequisite_for',
  ALTERNATIVE_TO = 'alternative_to'
}

/**
 * Embedding metadata for semantic search
 */
export interface EmbeddingMetadata {
  /** Vector representation of the memory */
  vector: Embedding;

  /** Model used to generate the embedding */
  model: string;

  /** Version of the embedding model */
  modelVersion: string;

  /** Dimensionality of the embedding */
  dimensions: number;

  /** When the embedding was generated */
  generatedAt: Timestamp;

  /** Whether the embedding needs to be regenerated */
  needsRefresh: boolean;
}

/**
 * Tags and categorization
 */
export interface TagMetadata {
  /** User-defined tags */
  tags: string[];

  /** System-generated categories */
  categories: string[];

  /** Topics extracted from content */
  topics: string[];

  /** Named entities mentioned */
  entities: Array<{
    text: string;
    type: EntityType;
    confidence: number;
  }>;
}

/**
 * Entity types for tagging
 */
export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  TIME = 'time',
  PRODUCT = 'product',
  EVENT = 'event',
  SKILL = 'skill',
  TECHNOLOGY = 'technology',
  CONCEPT = 'concept'
}

/**
 * Sync metadata for cross-surface coordination
 */
export interface SyncMetadata {
  /** Last time synced to remote storage */
  lastSyncedAt: Timestamp;

  /** Version number for conflict resolution */
  version: number;

  /** Hash of content for change detection */
  contentHash: string;

  /** Whether this memory is synced across surfaces */
  syncEnabled: boolean;

  /** Surfaces where this memory is available */
  availableSurfaces: ClaudeSurface[];

  /** Pending sync operations */
  pendingSync: boolean;

  /** Conflict resolution strategy */
  conflictResolution: 'latest_wins' | 'manual' | 'merge';
}

// ============================================================================
// BASE MEMORY INTERFACE
// ============================================================================

/**
 * Base interface that all memory types extend
 */
export interface BaseMemory {
  /** Unique identifier for this memory */
  id: MemoryId;

  /** Type of memory */
  type: MemoryType;

  /** Current status */
  status: MemoryStatus;

  /** Temporal metadata */
  temporal: TemporalMetadata;

  /** Importance and decay */
  importance: ImportanceMetadata;

  /** Source context */
  source: SourceContext;

  /** Embedding for semantic search */
  embedding: EmbeddingMetadata;

  /** Tags and categorization */
  tags: TagMetadata;

  /** Relationships to other memories */
  relations: MemoryRelation[];

  /** Sync metadata */
  sync: SyncMetadata;

  /** Custom metadata */
  metadata: Record<string, unknown>;
}

// ============================================================================
// EPISODIC MEMORY
// ============================================================================

/**
 * Episodic Memory: Specific conversation episodes with temporal structure
 *
 * Represents autobiographical memories of specific interactions, conversations,
 * and events. These have rich temporal context and narrative structure.
 */
export interface EpisodicMemory extends BaseMemory {
  type: MemoryType.EPISODIC;

  /** The actual content of the episode */
  content: EpisodicContent;

  /** Temporal structure of the episode */
  temporalStructure: TemporalStructure;

  /** Participants in the episode */
  participants: Participant[];

  /** Emotional context of the episode */
  emotionalContext: EmotionalContext;

  /** Narrative structure */
  narrative: NarrativeStructure;

  /** Key moments within the episode */
  keyMoments: KeyMoment[];

  /** Outcomes or results of the episode */
  outcomes: Outcome[];
}

/**
 * Content of an episodic memory
 */
export interface EpisodicContent {
  /** Title or summary of the episode */
  title: string;

  /** Full description or transcript */
  description: string;

  /** Condensed summary */
  summary: string;

  /** Key quotes or excerpts */
  keyQuotes: string[];

  /** Original messages/turns in the conversation */
  messages: Message[];
}

/**
 * A single message or turn in a conversation
 */
export interface Message {
  /** Message identifier */
  id: string;

  /** Speaker (user or assistant) */
  role: 'user' | 'assistant' | 'system';

  /** Message content */
  content: string;

  /** When the message was sent */
  timestamp: Timestamp;

  /** Message importance */
  importance: number;

  /** Embedding of this specific message */
  embedding?: Embedding;
}

/**
 * Temporal structure of an episode
 */
export interface TemporalStructure {
  /** When the episode started */
  startTime: Timestamp;

  /** When the episode ended */
  endTime: Timestamp;

  /** Duration in milliseconds */
  duration: number;

  /** Sequence number in a series of episodes */
  sequenceNumber?: number;

  /** References to previous/next episodes */
  previousEpisode?: MemoryId;
  nextEpisode?: MemoryId;

  /** Temporal context (morning, evening, etc.) */
  temporalContext: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
    isWeekend: boolean;
    season?: string;
  };
}

/**
 * Participant in an episode
 */
export interface Participant {
  /** Participant identifier */
  id: string;

  /** Role in the conversation */
  role: 'user' | 'assistant';

  /** Display name */
  name?: string;

  /** Participation level (0-1) */
  participationLevel: number;

  /** Emotional state during episode */
  emotionalState?: string;
}

/**
 * Emotional context of an episode
 */
export interface EmotionalContext {
  /** Overall emotional valence (-1 to 1) */
  valence: number;

  /** Emotional arousal/intensity (0-1) */
  arousal: number;

  /** Detected emotions */
  emotions: Array<{
    emotion: string;
    intensity: number;
  }>;

  /** Sentiment of the interaction */
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';

  /** User satisfaction (if detectable) */
  userSatisfaction?: number;
}

/**
 * Narrative structure of an episode
 */
export interface NarrativeStructure {
  /** Beginning - how the episode started */
  beginning: string;

  /** Middle - main content */
  middle: string;

  /** End - how it concluded */
  end: string;

  /** Turning points in the conversation */
  turningPoints: Array<{
    messageId: string;
    description: string;
    timestamp: Timestamp;
  }>;

  /** Main themes */
  themes: string[];

  /** Problem-solution pairs */
  problemSolutions: Array<{
    problem: string;
    solution: string;
    resolved: boolean;
  }>;
}

/**
 * Key moment within an episode
 */
export interface KeyMoment {
  /** Moment identifier */
  id: string;

  /** When it occurred */
  timestamp: Timestamp;

  /** Description */
  description: string;

  /** Why it's significant */
  significance: string;

  /** Importance score */
  importance: number;

  /** Related message IDs */
  messageIds: string[];
}

/**
 * Outcome of an episode
 */
export interface Outcome {
  /** Type of outcome */
  type: 'decision' | 'learning' | 'action' | 'insight' | 'unresolved';

  /** Description */
  description: string;

  /** Whether it was successful */
  successful: boolean;

  /** Follow-up required */
  requiresFollowUp: boolean;

  /** Related memories created */
  derivedMemories: MemoryId[];
}

// ============================================================================
// SEMANTIC MEMORY
// ============================================================================

/**
 * Semantic Memory: Facts, preferences, and knowledge
 *
 * Represents general knowledge, facts, preferences, and beliefs that are
 * decontextualized from specific episodes.
 */
export interface SemanticMemory extends BaseMemory {
  type: MemoryType.SEMANTIC;

  /** The knowledge content */
  content: SemanticContent;

  /** Type of semantic knowledge */
  knowledgeType: KnowledgeType;

  /** Confidence in this knowledge */
  confidence: ConfidenceLevel;

  /** Evidence supporting this knowledge */
  evidence: Evidence[];

  /** When this knowledge was last verified */
  lastVerified?: Timestamp;

  /** Contradicting memories */
  contradictions: MemoryId[];

  /** Whether this is a preference vs a fact */
  isPreference: boolean;

  /** Domain or subject area */
  domain: string;
}

/**
 * Content of semantic memory
 */
export interface SemanticContent {
  /** Subject of the knowledge */
  subject: string;

  /** Predicate (relationship or property) */
  predicate: string;

  /** Object (value or related entity) */
  object: string;

  /** Full statement */
  statement: string;

  /** Additional context */
  context?: string;

  /** Qualifiers (always, sometimes, never, etc.) */
  qualifiers: string[];

  /** Structured representation */
  structured?: {
    entity: string;
    property: string;
    value: unknown;
    unit?: string;
  };
}

/**
 * Types of semantic knowledge
 */
export enum KnowledgeType {
  FACT = 'fact',
  PREFERENCE = 'preference',
  BELIEF = 'belief',
  RULE = 'rule',
  DEFINITION = 'definition',
  RELATIONSHIP = 'relationship',
  ATTRIBUTE = 'attribute',
  CAPABILITY = 'capability',
  LIMITATION = 'limitation',
  GOAL = 'goal'
}

/**
 * Evidence supporting a piece of knowledge
 */
export interface Evidence {
  /** Type of evidence */
  type: 'episodic' | 'explicit_statement' | 'inferred' | 'external';

  /** Reference to source (episodic memory ID, etc.) */
  sourceId?: MemoryId;

  /** Description of the evidence */
  description: string;

  /** Strength of evidence (0-1) */
  strength: number;

  /** When the evidence was gathered */
  timestamp: Timestamp;
}

// ============================================================================
// PROCEDURAL MEMORY
// ============================================================================

/**
 * Procedural Memory: How-to knowledge and patterns
 *
 * Represents learned procedures, workflows, patterns, and skills.
 */
export interface ProceduralMemory extends BaseMemory {
  type: MemoryType.PROCEDURAL;

  /** The procedure content */
  content: ProceduralContent;

  /** Steps in the procedure */
  steps: ProcedureStep[];

  /** Conditions for applying this procedure */
  applicabilityConditions: Condition[];

  /** Prerequisites */
  prerequisites: Prerequisite[];

  /** Expected outcomes */
  expectedOutcomes: string[];

  /** Success rate when applied */
  successRate: number;

  /** Number of times executed */
  executionCount: number;

  /** Common variations */
  variations: Variation[];

  /** Known failure modes */
  failureModes: FailureMode[];
}

/**
 * Content of procedural memory
 */
export interface ProceduralContent {
  /** Name of the procedure */
  name: string;

  /** What this procedure accomplishes */
  purpose: string;

  /** Overall description */
  description: string;

  /** When to use this procedure */
  whenToUse: string;

  /** When NOT to use this procedure */
  whenNotToUse?: string;

  /** Estimated time/effort */
  estimatedEffort?: {
    time: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

/**
 * A step in a procedure
 */
export interface ProcedureStep {
  /** Step number */
  order: number;

  /** Step description */
  description: string;

  /** Action to take */
  action: string;

  /** Expected result */
  expectedResult?: string;

  /** Sub-steps */
  subSteps?: ProcedureStep[];

  /** Whether this step is optional */
  optional: boolean;

  /** Conditions for executing this step */
  conditions?: Condition[];

  /** Alternatives to this step */
  alternatives?: string[];

  /** Common mistakes */
  commonMistakes?: string[];
}

/**
 * Condition for procedure applicability or step execution
 */
export interface Condition {
  /** Condition description */
  description: string;

  /** Structured condition (for programmatic evaluation) */
  structured?: {
    variable: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value: unknown;
  };

  /** Whether this must be true (vs nice to have) */
  required: boolean;
}

/**
 * Prerequisite for a procedure
 */
export interface Prerequisite {
  /** Type of prerequisite */
  type: 'knowledge' | 'skill' | 'resource' | 'state';

  /** Description */
  description: string;

  /** Reference to related memory */
  relatedMemoryId?: MemoryId;

  /** Whether this is strictly required */
  required: boolean;
}

/**
 * Variation of a procedure
 */
export interface Variation {
  /** Variation name */
  name: string;

  /** How it differs from the base procedure */
  differences: string;

  /** When to use this variation */
  whenToUse: string;

  /** Modified steps */
  modifiedSteps?: Partial<ProcedureStep>[];
}

/**
 * Known failure mode
 */
export interface FailureMode {
  /** Description of the failure */
  description: string;

  /** How often this occurs (0-1) */
  frequency: number;

  /** How to detect this failure */
  detection: string;

  /** How to recover */
  recovery?: string;

  /** How to prevent */
  prevention?: string;
}

// ============================================================================
// WORKING MEMORY
// ============================================================================

/**
 * Working Memory: Active session context
 *
 * Represents the current, active context of an ongoing session. This is
 * short-lived and highly volatile.
 */
export interface WorkingMemory extends BaseMemory {
  type: MemoryType.WORKING;

  /** Active session content */
  content: WorkingMemoryContent;

  /** Current focus of attention */
  attentionFocus: AttentionFocus;

  /** Active goals */
  activeGoals: Goal[];

  /** Current context stack */
  contextStack: ContextFrame[];

  /** Recently activated memories */
  recentlyActivated: ActivatedMemory[];

  /** Pending tasks */
  pendingTasks: Task[];

  /** Session state */
  sessionState: SessionState;

  /** Time-to-live in milliseconds */
  ttl: number;

  /** Whether this should be consolidated to long-term memory */
  consolidationCandidate: boolean;
}

/**
 * Content of working memory
 */
export interface WorkingMemoryContent {
  /** Current topic or subject */
  currentTopic: string;

  /** Summary of current conversation */
  conversationSummary: string;

  /** Key points discussed so far */
  keyPoints: string[];

  /** Open questions */
  openQuestions: string[];

  /** Decisions made */
  decisions: Array<{
    decision: string;
    timestamp: Timestamp;
  }>;

  /** Current hypotheses or assumptions */
  hypotheses: string[];
}

/**
 * What the system is currently focusing on
 */
export interface AttentionFocus {
  /** Primary focus */
  primary: string;

  /** Secondary focuses */
  secondary: string[];

  /** What triggered this focus */
  trigger: string;

  /** How long this has been in focus */
  duration: number;

  /** Importance of current focus */
  importance: number;
}

/**
 * An active goal
 */
export interface Goal {
  /** Goal identifier */
  id: string;

  /** Goal description */
  description: string;

  /** Goal type */
  type: 'user_requested' | 'inferred' | 'system';

  /** Priority (0-1) */
  priority: number;

  /** Progress toward goal (0-1) */
  progress: number;

  /** Sub-goals */
  subGoals?: Goal[];

  /** Whether this goal is completed */
  completed: boolean;

  /** When this goal was established */
  establishedAt: Timestamp;

  /** Deadline (if any) */
  deadline?: Timestamp;
}

/**
 * A frame in the context stack
 */
export interface ContextFrame {
  /** Frame identifier */
  id: string;

  /** What this context is about */
  topic: string;

  /** When this context was pushed */
  pushedAt: Timestamp;

  /** Key variables in this context */
  variables: Record<string, unknown>;

  /** Parent context */
  parentId?: string;

  /** Whether this context is still active */
  active: boolean;
}

/**
 * A memory that was recently activated
 */
export interface ActivatedMemory {
  /** Memory identifier */
  memoryId: MemoryId;

  /** Memory type */
  memoryType: MemoryType;

  /** When it was activated */
  activatedAt: Timestamp;

  /** Why it was activated */
  activationReason: string;

  /** Activation strength (0-1) */
  activationStrength: number;

  /** Whether it's still in active use */
  inUse: boolean;
}

/**
 * A pending task
 */
export interface Task {
  /** Task identifier */
  id: string;

  /** Task description */
  description: string;

  /** Task status */
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';

  /** Priority */
  priority: number;

  /** Dependencies */
  dependencies: string[];

  /** Estimated effort */
  estimatedEffort?: number;

  /** Created timestamp */
  createdAt: Timestamp;

  /** Due timestamp */
  dueAt?: Timestamp;
}

/**
 * Current session state
 */
export interface SessionState {
  /** Session identifier */
  sessionId: string;

  /** When session started */
  startedAt: Timestamp;

  /** Last activity timestamp */
  lastActivityAt: Timestamp;

  /** Number of turns in this session */
  turnCount: number;

  /** User engagement level */
  engagementLevel: 'low' | 'medium' | 'high';

  /** Session phase */
  phase: 'opening' | 'exploration' | 'problem_solving' | 'closing';

  /** Continuity from previous session */
  previousSessionId?: string;
}

// ============================================================================
// QUERY AND INDEX STRUCTURES
// ============================================================================

/**
 * Query interface for memory retrieval
 */
export interface MemoryQuery {
  /** Types of memories to search */
  types?: MemoryType[];

  /** Text query for semantic search */
  textQuery?: string;

  /** Query embedding for vector search */
  queryEmbedding?: Embedding;

  /** Maximum number of results */
  limit?: number;

  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number;

  /** Temporal filters */
  temporal?: {
    startDate?: Timestamp;
    endDate?: Timestamp;
    lastAccessedSince?: Timestamp;
  };

  /** Importance filters */
  importance?: {
    minImportance?: number;
    maxImportance?: number;
  };

  /** Tag filters */
  tags?: {
    includeTags?: string[];
    excludeTags?: string[];
    categories?: string[];
  };

  /** Source filters */
  source?: {
    surfaces?: ClaudeSurface[];
    userId?: string;
    sessionId?: string;
  };

  /** Status filters */
  status?: MemoryStatus[];

  /** Relationship filters */
  relatedTo?: MemoryId;
  relationTypes?: RelationType[];
}

/**
 * Result from a memory query
 */
export interface MemoryQueryResult<T extends BaseMemory = BaseMemory> {
  /** The matching memory */
  memory: T;

  /** Similarity score (0-1) */
  score: number;

  /** Why this was retrieved */
  retrievalReason: string;

  /** Relevance factors */
  relevanceFactors: {
    semantic: number;
    temporal: number;
    importance: number;
    relational: number;
  };
}

/**
 * Index configuration for efficient lookups
 */
export interface MemoryIndex {
  /** Index name */
  name: string;

  /** Index type */
  type: 'btree' | 'hash' | 'vector' | 'fulltext';

  /** Fields to index */
  fields: string[];

  /** Index options */
  options?: {
    unique?: boolean;
    sparse?: boolean;
    vectorDimensions?: number;
    vectorMetric?: 'cosine' | 'euclidean' | 'dot_product';
  };
}

/**
 * Suggested indexes for optimal performance
 */
export const SUGGESTED_INDEXES: MemoryIndex[] = [
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
// MEMORY OPERATIONS
// ============================================================================

/**
 * Interface for memory consolidation
 */
export interface MemoryConsolidation {
  /** Source memories being consolidated */
  sourceMemoryIds: MemoryId[];

  /** Resulting consolidated memory */
  consolidatedMemoryId: MemoryId;

  /** Consolidation strategy used */
  strategy: 'merge' | 'summarize' | 'abstract' | 'pattern_extract';

  /** When consolidation occurred */
  consolidatedAt: Timestamp;

  /** Information preserved */
  preservationScore: number;
}

/**
 * Interface for memory decay calculation
 */
export interface DecayCalculation {
  /** Current importance score */
  currentImportance: number;

  /** Base decay rate */
  baseDecayRate: number;

  /** Time since last access (ms) */
  timeSinceAccess: number;

  /** Access frequency modifier */
  frequencyModifier: number;

  /** New importance after decay */
  newImportance: number;

  /** Whether memory should be archived */
  shouldArchive: boolean;
}

/**
 * Interface for conflict resolution
 */
export interface MemoryConflict {
  /** Conflicting memories */
  conflictingMemories: MemoryId[];

  /** Type of conflict */
  conflictType: 'contradiction' | 'duplicate' | 'outdated';

  /** Detected at */
  detectedAt: Timestamp;

  /** Resolution strategy */
  resolutionStrategy?: 'keep_latest' | 'keep_highest_confidence' | 'merge' | 'manual';

  /** Resolution outcome */
  resolution?: {
    resolvedAt: Timestamp;
    keptMemoryId: MemoryId;
    archivedMemoryIds: MemoryId[];
  };
}

// ============================================================================
// STORAGE LAYER INTERFACES
// ============================================================================

/**
 * Storage backend interface
 */
export interface MemoryStorage {
  /** Store a memory */
  store<T extends BaseMemory>(memory: T): Promise<void>;

  /** Retrieve a memory by ID */
  retrieve<T extends BaseMemory>(id: MemoryId): Promise<T | null>;

  /** Update a memory */
  update<T extends BaseMemory>(id: MemoryId, updates: Partial<T>): Promise<void>;

  /** Delete a memory */
  delete(id: MemoryId): Promise<void>;

  /** Query memories */
  query<T extends BaseMemory>(query: MemoryQuery): Promise<MemoryQueryResult<T>[]>;

  /** Batch operations */
  batchStore<T extends BaseMemory>(memories: T[]): Promise<void>;
  batchRetrieve<T extends BaseMemory>(ids: MemoryId[]): Promise<(T | null)[]>;

  /** Index management */
  createIndex(index: MemoryIndex): Promise<void>;
  dropIndex(indexName: string): Promise<void>;
}

/**
 * Vector store interface for semantic search
 */
export interface VectorStore {
  /** Add vectors to the store */
  addVectors(vectors: Array<{ id: MemoryId; vector: Embedding; metadata?: Record<string, unknown> }>): Promise<void>;

  /** Search for similar vectors */
  searchSimilar(query: Embedding, limit: number, filter?: Record<string, unknown>): Promise<Array<{ id: MemoryId; score: number }>>;

  /** Update a vector */
  updateVector(id: MemoryId, vector: Embedding): Promise<void>;

  /** Delete a vector */
  deleteVector(id: MemoryId): Promise<void>;
}

/**
 * Cache interface for hot memories
 */
export interface MemoryCache {
  /** Get from cache */
  get<T extends BaseMemory>(id: MemoryId): Promise<T | null>;

  /** Set in cache */
  set<T extends BaseMemory>(id: MemoryId, memory: T, ttl?: number): Promise<void>;

  /** Remove from cache */
  remove(id: MemoryId): Promise<void>;

  /** Clear cache */
  clear(): Promise<void>;

  /** Get cache statistics */
  stats(): Promise<{ hits: number; misses: number; size: number }>;
}

// ============================================================================
// COMPLETE MEMORY SYSTEM INTERFACE
// ============================================================================

/**
 * Complete memory system interface
 */
export interface MemorySystem {
  /** Storage layer */
  storage: MemoryStorage;

  /** Vector store for embeddings */
  vectorStore: VectorStore;

  /** Cache for frequently accessed memories */
  cache: MemoryCache;

  /** Create a new episodic memory */
  createEpisodicMemory(content: Partial<EpisodicMemory>): Promise<EpisodicMemory>;

  /** Create a new semantic memory */
  createSemanticMemory(content: Partial<SemanticMemory>): Promise<SemanticMemory>;

  /** Create a new procedural memory */
  createProceduralMemory(content: Partial<ProceduralMemory>): Promise<ProceduralMemory>;

  /** Create a new working memory */
  createWorkingMemory(content: Partial<WorkingMemory>): Promise<WorkingMemory>;

  /** Retrieve relevant memories for a query */
  recall(query: MemoryQuery): Promise<MemoryQueryResult[]>;

  /** Update memory metadata (access time, importance, etc.) */
  updateMemoryMetadata(id: MemoryId, metadata: Partial<BaseMemory>): Promise<void>;

  /** Consolidate multiple memories into one */
  consolidate(memoryIds: MemoryId[], strategy: MemoryConsolidation['strategy']): Promise<MemoryConsolidation>;

  /** Apply decay to memories */
  applyDecay(): Promise<DecayCalculation[]>;

  /** Detect and resolve conflicts */
  detectConflicts(): Promise<MemoryConflict[]>;
  resolveConflict(conflictId: string, strategy: MemoryConflict['resolutionStrategy']): Promise<void>;

  /** Sync memories across surfaces */
  sync(surface: ClaudeSurface): Promise<{ synced: number; conflicts: number }>;

  /** Archive old or low-importance memories */
  archive(criteria: MemoryQuery): Promise<MemoryId[]>;

  /** Get memory statistics */
  getStats(): Promise<MemorySystemStats>;
}

/**
 * Memory system statistics
 */
export interface MemorySystemStats {
  /** Total memories by type */
  counts: Record<MemoryType, number>;

  /** Total storage used (bytes) */
  storageUsed: number;

  /** Average importance by type */
  averageImportance: Record<MemoryType, number>;

  /** Memories created in last 24h */
  recentCreations: number;

  /** Memories accessed in last 24h */
  recentAccesses: number;

  /** Memories pending consolidation */
  pendingConsolidation: number;

  /** Detected conflicts */
  conflicts: number;

  /** Cache hit rate */
  cacheHitRate: number;

  /** Last sync timestamp by surface */
  lastSync: Record<ClaudeSurface, Timestamp>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if a memory is episodic
 */
export function isEpisodicMemory(memory: BaseMemory): memory is EpisodicMemory {
  return memory.type === MemoryType.EPISODIC;
}

/**
 * Type guard to check if a memory is semantic
 */
export function isSemanticMemory(memory: BaseMemory): memory is SemanticMemory {
  return memory.type === MemoryType.SEMANTIC;
}

/**
 * Type guard to check if a memory is procedural
 */
export function isProceduralMemory(memory: BaseMemory): memory is ProceduralMemory {
  return memory.type === MemoryType.PROCEDURAL;
}

/**
 * Type guard to check if a memory is working memory
 */
export function isWorkingMemory(memory: BaseMemory): memory is WorkingMemory {
  return memory.type === MemoryType.WORKING;
}

/**
 * Union type of all memory types
 */
export type AnyMemory = EpisodicMemory | SemanticMemory | ProceduralMemory | WorkingMemory;

/**
 * Partial memory for updates
 */
export type MemoryUpdate<T extends BaseMemory> = Partial<Omit<T, 'id' | 'type'>>;

/**
 * Memory creation input
 */
export type MemoryInput<T extends BaseMemory> = Omit<T, 'id' | 'temporal' | 'sync'> & {
  id?: MemoryId;
};
