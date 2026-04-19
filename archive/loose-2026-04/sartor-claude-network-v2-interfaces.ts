/**
 * Sartor Claude Network v2 - TypeScript Interface Definitions
 *
 * This file defines the complete contract between all system components.
 * Designed to be version-agnostic and resistant to Claude model changes.
 *
 * @version 2.0.0
 * @license MIT
 */

// ============================================================================
// CORE PRIMITIVES
// ============================================================================

/**
 * Universally unique identifier for any entity in the system
 */
export type EntityId = string & { readonly __brand: 'EntityId' };

/**
 * Timestamp in milliseconds since epoch
 */
export type Timestamp = number & { readonly __brand: 'Timestamp' };

/**
 * Semantic version string (e.g., "2.1.0")
 */
export type SemanticVersion = string & { readonly __brand: 'SemanticVersion' };

/**
 * Cost in dollars (USD)
 */
export type CostUSD = number & { readonly __brand: 'CostUSD' };

/**
 * Token count for LLM operations
 */
export type TokenCount = number & { readonly __brand: 'TokenCount' };

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

/**
 * System-wide configuration
 */
export interface SystemConfig {
  readonly version: SemanticVersion;
  readonly environment: 'development' | 'staging' | 'production';
  readonly executive: ExecutiveConfig;
  readonly memory: MemoryConfig;
  readonly coordination: CoordinationConfig;
  readonly network: NetworkConfig;
}

export interface ExecutiveConfig {
  readonly maxConcurrentDelegations: number;
  readonly synthesisWindowMs: number;
  readonly validationTimeout: number;
  readonly costBudget: BudgetConfig;
  readonly learningRate: number;
}

export interface BudgetConfig {
  readonly dailyLimit: CostUSD;
  readonly perTaskLimit: CostUSD;
  readonly alertThreshold: number; // 0-1, percentage of budget
}

export interface MemoryConfig {
  readonly hotTierSizeBytes: number;
  readonly warmTierSizeBytes: number;
  readonly coldTierSizeBytes: number;
  readonly evictionPolicy: 'lru' | 'lfu' | 'adaptive';
  readonly compressionEnabled: boolean;
  readonly replicationFactor: number;
}

export interface CoordinationConfig {
  readonly maxRetries: number;
  readonly circuitBreakerThreshold: number;
  readonly healthCheckIntervalMs: number;
  readonly degradedModeTimeoutMs: number;
}

export interface NetworkConfig {
  readonly gossipIntervalMs: number;
  readonly raftElectionTimeoutMs: number;
  readonly sessionMigrationTimeoutMs: number;
  readonly maxMachines: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  DELEGATION = 'DELEGATION',
  MEMORY = 'MEMORY',
  COORDINATION = 'COORDINATION',
  NETWORK = 'NETWORK',
  BUDGET = 'BUDGET',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  CONFLICT = 'CONFLICT',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface SystemError {
  readonly category: ErrorCategory;
  readonly code: string;
  readonly message: string;
  readonly timestamp: Timestamp;
  readonly context?: Record<string, unknown>;
  readonly retryable: boolean;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorHandler<T = unknown> {
  handle(error: SystemError): T | Promise<T>;
  shouldRetry(error: SystemError): boolean;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export enum EventType {
  // Executive events
  TASK_DELEGATED = 'TASK_DELEGATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  SYNTHESIS_STARTED = 'SYNTHESIS_STARTED',
  SYNTHESIS_COMPLETED = 'SYNTHESIS_COMPLETED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  BUDGET_ALERT = 'BUDGET_ALERT',

  // Memory events
  MEMORY_EVICTED = 'MEMORY_EVICTED',
  MEMORY_REPLICATED = 'MEMORY_REPLICATED',
  MEMORY_CONFLICT = 'MEMORY_CONFLICT',

  // Coordination events
  CIRCUIT_OPENED = 'CIRCUIT_OPENED',
  CIRCUIT_CLOSED = 'CIRCUIT_CLOSED',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  DEGRADED_MODE_ENTERED = 'DEGRADED_MODE_ENTERED',

  // Network events
  MACHINE_JOINED = 'MACHINE_JOINED',
  MACHINE_LEFT = 'MACHINE_LEFT',
  LEADER_ELECTED = 'LEADER_ELECTED',
  SESSION_MIGRATED = 'SESSION_MIGRATED',
}

export interface SystemEvent<TPayload = unknown> {
  readonly id: EntityId;
  readonly type: EventType;
  readonly timestamp: Timestamp;
  readonly source: EntityId;
  readonly payload: TPayload;
  readonly correlationId?: EntityId;
}

export interface EventPublisher {
  publish<T>(event: SystemEvent<T>): Promise<void>;
}

export interface EventSubscriber {
  subscribe<T>(
    eventType: EventType,
    handler: (event: SystemEvent<T>) => void | Promise<void>
  ): () => void; // Returns unsubscribe function
}

// ============================================================================
// EXECUTIVE CLAUDE LAYER
// ============================================================================

/**
 * Main orchestrator for the Sartor Claude Network
 */
export interface ExecutiveClaude {
  /**
   * Process a user request and orchestrate its execution
   */
  processRequest(request: UserRequest): Promise<ExecutionResult>;

  /**
   * Delegate a task to a subordinate Claude
   */
  delegate(task: DelegationTask): Promise<DelegationResult>;

  /**
   * Synthesize results from multiple delegated tasks
   */
  synthesize(results: DelegationResult[]): Promise<SynthesizedResult>;

  /**
   * Validate a result before returning to user
   */
  validate(result: ExecutionResult): Promise<ValidationResult>;

  /**
   * Get current execution context
   */
  getContext(): ExecutionContext;

  /**
   * Persist current state for version continuity
   */
  persistIdentity(): Promise<IdentitySnapshot>;

  /**
   * Restore from a previous identity snapshot
   */
  restoreIdentity(snapshot: IdentitySnapshot): Promise<void>;
}

export interface UserRequest {
  readonly id: EntityId;
  readonly content: string;
  readonly context?: Record<string, unknown>;
  readonly priority: 'low' | 'normal' | 'high' | 'urgent';
  readonly deadline?: Timestamp;
  readonly budgetLimit?: CostUSD;
}

export interface ExecutionResult {
  readonly requestId: EntityId;
  readonly content: string;
  readonly confidence: number; // 0-1
  readonly cost: CostUSD;
  readonly duration: number; // milliseconds
  readonly metadata: ResultMetadata;
}

export interface ResultMetadata {
  readonly delegationCount: number;
  readonly memoryAccesses: number;
  readonly validationsPassed: number;
  readonly synthesisSteps: number;
  readonly model?: string; // Claude model used
}

export interface DelegationTask {
  readonly id: EntityId;
  readonly parentId?: EntityId;
  readonly type: TaskType;
  readonly description: string;
  readonly context: SemanticContext;
  readonly constraints: TaskConstraints;
  readonly expectedOutputSchema?: unknown; // JSON Schema
}

export enum TaskType {
  RESEARCH = 'RESEARCH',
  ANALYSIS = 'ANALYSIS',
  SYNTHESIS = 'SYNTHESIS',
  VALIDATION = 'VALIDATION',
  EXECUTION = 'EXECUTION',
  CREATIVE = 'CREATIVE',
}

export interface TaskConstraints {
  readonly maxCost?: CostUSD;
  readonly maxDuration?: number;
  readonly maxTokens?: TokenCount;
  readonly requiredCapabilities?: string[];
}

export interface DelegationResult {
  readonly taskId: EntityId;
  readonly success: boolean;
  readonly output?: unknown;
  readonly error?: SystemError;
  readonly cost: CostUSD;
  readonly duration: number;
  readonly metadata: Record<string, unknown>;
}

export interface SynthesizedResult {
  readonly sourceResults: EntityId[];
  readonly synthesizedOutput: unknown;
  readonly confidence: number;
  readonly contradictions?: Contradiction[];
}

export interface Contradiction {
  readonly results: EntityId[];
  readonly description: string;
  readonly resolution?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: ValidationIssue[];
  readonly confidence: number;
}

export interface ValidationIssue {
  readonly severity: 'error' | 'warning' | 'info';
  readonly code: string;
  readonly message: string;
  readonly path?: string[];
}

/**
 * Extracts semantic meaning from context
 */
export interface ContextDistiller {
  /**
   * Distill raw context into semantic representation
   */
  distill(rawContext: unknown): Promise<SemanticContext>;

  /**
   * Merge multiple contexts
   */
  merge(contexts: SemanticContext[]): Promise<SemanticContext>;

  /**
   * Extract key entities and relationships
   */
  extractEntities(context: SemanticContext): Entity[];
}

export interface SemanticContext {
  readonly id: EntityId;
  readonly timestamp: Timestamp;
  readonly entities: Entity[];
  readonly relationships: Relationship[];
  readonly intent: Intent;
  readonly constraints: string[];
  readonly embeddings?: number[]; // Vector representation
}

export interface Entity {
  readonly id: EntityId;
  readonly type: string;
  readonly value: unknown;
  readonly confidence: number;
}

export interface Relationship {
  readonly source: EntityId;
  readonly target: EntityId;
  readonly type: string;
  readonly properties?: Record<string, unknown>;
}

export interface Intent {
  readonly primary: string;
  readonly secondary?: string[];
  readonly confidence: number;
}

/**
 * Intelligent synthesis of multiple results
 */
export interface SynthesisEngine {
  /**
   * Synthesize multiple results into coherent output
   */
  synthesize<T>(
    results: T[],
    strategy: SynthesisStrategy
  ): Promise<SynthesizedResult>;

  /**
   * Detect contradictions between results
   */
  detectContradictions<T>(results: T[]): Promise<Contradiction[]>;

  /**
   * Resolve conflicts using specified strategy
   */
  resolveConflicts(
    contradictions: Contradiction[],
    strategy: ConflictResolutionStrategy
  ): Promise<unknown>;
}

export enum SynthesisStrategy {
  MERGE = 'MERGE', // Combine all results
  VOTE = 'VOTE', // Majority wins
  WEIGHTED = 'WEIGHTED', // Weight by confidence
  CONSENSUS = 'CONSENSUS', // Require agreement
  HIERARCHICAL = 'HIERARCHICAL', // Trust based on source hierarchy
}

export enum ConflictResolutionStrategy {
  LATEST = 'LATEST',
  HIGHEST_CONFIDENCE = 'HIGHEST_CONFIDENCE',
  MANUAL = 'MANUAL',
  VOTE = 'VOTE',
}

/**
 * Learns from delegation patterns to optimize future decisions
 */
export interface DelegationLearner {
  /**
   * Record a delegation outcome for learning
   */
  recordOutcome(outcome: DelegationOutcome): Promise<void>;

  /**
   * Predict optimal delegation strategy for a task
   */
  predictStrategy(task: DelegationTask): Promise<DelegationStrategy>;

  /**
   * Get historical performance metrics
   */
  getMetrics(filters?: MetricFilters): Promise<PerformanceMetrics>;
}

export interface DelegationOutcome {
  readonly task: DelegationTask;
  readonly result: DelegationResult;
  readonly strategy: DelegationStrategy;
  readonly success: boolean;
  readonly actualCost: CostUSD;
  readonly actualDuration: number;
}

export interface DelegationStrategy {
  readonly targetMachine?: EntityId;
  readonly parallelism: number;
  readonly retryPolicy: RetryPolicy;
  readonly timeout: number;
  readonly priority: number;
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoffMs: number;
  readonly backoffMultiplier: number;
  readonly retryableErrors: ErrorCategory[];
}

export interface MetricFilters {
  readonly taskType?: TaskType;
  readonly timeRange?: { start: Timestamp; end: Timestamp };
  readonly successOnly?: boolean;
}

export interface PerformanceMetrics {
  readonly totalDelegations: number;
  readonly successRate: number;
  readonly averageCost: CostUSD;
  readonly averageDuration: number;
  readonly p50Duration: number;
  readonly p95Duration: number;
  readonly p99Duration: number;
  readonly costByType: Map<TaskType, CostUSD>;
}

/**
 * Real-time validation of results
 */
export interface ValidationGate {
  /**
   * Validate a result against rules and schema
   */
  validate<T>(
    result: T,
    rules: ValidationRule[]
  ): Promise<ValidationResult>;

  /**
   * Register a custom validation rule
   */
  registerRule(rule: ValidationRule): void;

  /**
   * Get all active rules
   */
  getRules(): ValidationRule[];
}

export interface ValidationRule {
  readonly id: EntityId;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly severity: 'error' | 'warning' | 'info';
  validate(value: unknown): Promise<boolean> | boolean;
  getMessage?(value: unknown): string;
}

/**
 * Budget enforcement and tracking
 */
export interface CostManager {
  /**
   * Check if operation is within budget
   */
  checkBudget(estimatedCost: CostUSD): Promise<boolean>;

  /**
   * Record actual cost of an operation
   */
  recordCost(cost: CostUSD, operation: string): Promise<void>;

  /**
   * Get current budget status
   */
  getBudgetStatus(): Promise<BudgetStatus>;

  /**
   * Set budget limits
   */
  setBudget(config: BudgetConfig): Promise<void>;

  /**
   * Get cost breakdown by category
   */
  getCostBreakdown(period: TimePeriod): Promise<CostBreakdown>;
}

export interface BudgetStatus {
  readonly dailyLimit: CostUSD;
  readonly dailySpent: CostUSD;
  readonly dailyRemaining: CostUSD;
  readonly percentUsed: number;
  readonly alertLevel: 'none' | 'warning' | 'critical';
}

export interface TimePeriod {
  readonly start: Timestamp;
  readonly end: Timestamp;
}

export interface CostBreakdown {
  readonly total: CostUSD;
  readonly byType: Map<TaskType, CostUSD>;
  readonly byMachine: Map<EntityId, CostUSD>;
  readonly byHour: Array<{ hour: number; cost: CostUSD }>;
}

/**
 * Persistent identity across Claude instances
 */
export interface IdentityStore {
  /**
   * Save current state snapshot
   */
  save(snapshot: IdentitySnapshot): Promise<void>;

  /**
   * Load most recent snapshot
   */
  load(): Promise<IdentitySnapshot | null>;

  /**
   * Load specific version
   */
  loadVersion(version: SemanticVersion): Promise<IdentitySnapshot | null>;

  /**
   * List all available snapshots
   */
  listSnapshots(): Promise<SnapshotMetadata[]>;

  /**
   * Delete old snapshots based on retention policy
   */
  prune(retentionPolicy: RetentionPolicy): Promise<number>; // Returns count deleted
}

export interface IdentitySnapshot {
  readonly version: SemanticVersion;
  readonly timestamp: Timestamp;
  readonly executionContext: ExecutionContext;
  readonly memoryState: MemorySnapshot;
  readonly learningState: LearningState;
  readonly budgetState: BudgetStatus;
  readonly checksum: string;
}

export interface ExecutionContext {
  readonly currentRequest?: UserRequest;
  readonly activeDelegations: Map<EntityId, DelegationTask>;
  readonly recentHistory: HistoryEntry[];
  readonly sessionId: EntityId;
}

export interface HistoryEntry {
  readonly timestamp: Timestamp;
  readonly request: UserRequest;
  readonly result: ExecutionResult;
}

export interface MemorySnapshot {
  readonly hotEntries: MemoryEntry[];
  readonly warmEntries: MemoryEntry[];
  readonly vectorClock: VectorClockState;
}

export interface LearningState {
  readonly delegationPatterns: DelegationPattern[];
  readonly successRates: Map<TaskType, number>;
  readonly averageCosts: Map<TaskType, CostUSD>;
}

export interface DelegationPattern {
  readonly taskSignature: string;
  readonly successfulStrategy: DelegationStrategy;
  readonly occurrences: number;
}

export interface SnapshotMetadata {
  readonly version: SemanticVersion;
  readonly timestamp: Timestamp;
  readonly sizeBytes: number;
  readonly checksum: string;
}

export interface RetentionPolicy {
  readonly maxAge?: number; // milliseconds
  readonly maxCount?: number;
  readonly keepVersions?: SemanticVersion[];
}

// ============================================================================
// MEMORY LAYER
// ============================================================================

export enum MemoryTier {
  HOT = 'HOT',     // In-memory, immediate access
  WARM = 'WARM',   // SSD-backed, fast access
  COLD = 'COLD',   // Disk/cloud, slower access
}

export interface MemoryEntry {
  readonly id: EntityId;
  readonly key: string;
  readonly value: unknown;
  readonly tier: MemoryTier;
  readonly timestamp: Timestamp;
  readonly accessCount: number;
  readonly lastAccessed: Timestamp;
  readonly vectorClock: VectorClockState;
  readonly metadata: MemoryMetadata;
}

export interface MemoryMetadata {
  readonly sizeBytes: number;
  readonly compressed: boolean;
  readonly replicated: boolean;
  readonly replicaLocations?: EntityId[];
  readonly tags?: string[];
}

/**
 * Distributed memory management with tiering
 */
export interface MemoryManager {
  /**
   * Get a value from memory (any tier)
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in memory
   */
  set<T>(key: string, value: T, options?: MemoryOptions): Promise<void>;

  /**
   * Delete a value from memory
   */
  delete(key: string): Promise<boolean>;

  /**
   * Move entry between tiers
   */
  promoteTier(key: string, targetTier: MemoryTier): Promise<void>;
  demoteTier(key: string, targetTier: MemoryTier): Promise<void>;

  /**
   * Get memory statistics
   */
  getStats(): Promise<MemoryStats>;

  /**
   * Manually trigger eviction
   */
  evict(tier?: MemoryTier): Promise<number>; // Returns count evicted
}

export interface MemoryOptions {
  readonly tier?: MemoryTier;
  readonly ttl?: number; // Time to live in milliseconds
  readonly replicate?: boolean;
  readonly compress?: boolean;
  readonly tags?: string[];
}

export interface MemoryStats {
  readonly hotSize: number;
  readonly warmSize: number;
  readonly coldSize: number;
  readonly totalEntries: number;
  readonly hitRate: number;
  readonly evictionRate: number;
}

/**
 * Vector clock for distributed memory consistency
 */
export interface VectorClock {
  /**
   * Get current clock state
   */
  get(): VectorClockState;

  /**
   * Increment clock for this machine
   */
  increment(machineId: EntityId): VectorClockState;

  /**
   * Merge with another clock
   */
  merge(other: VectorClockState): VectorClockState;

  /**
   * Compare two clocks
   */
  compare(a: VectorClockState, b: VectorClockState): ClockComparison;
}

export type VectorClockState = Map<EntityId, number>;

export enum ClockComparison {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  CONCURRENT = 'CONCURRENT',
  EQUAL = 'EQUAL',
}

/**
 * Hybrid Logical Clock for wall-clock aware ordering
 */
export interface HybridLogicalClock {
  /**
   * Get current HLC timestamp
   */
  now(): HLCTimestamp;

  /**
   * Update clock with received timestamp
   */
  update(received: HLCTimestamp): HLCTimestamp;

  /**
   * Compare two HLC timestamps
   */
  compare(a: HLCTimestamp, b: HLCTimestamp): number; // -1, 0, 1
}

export interface HLCTimestamp {
  readonly wallClock: Timestamp;
  readonly logical: number;
  readonly machineId: EntityId;
}

/**
 * CRDT operations for conflict-free replication
 */
export interface CRDTOperations {
  /**
   * Merge two CRDT states
   */
  merge<T extends CRDT>(local: T, remote: T): T;

  /**
   * Apply an operation to a CRDT
   */
  apply<T extends CRDT, TOp extends CRDTOperation>(
    state: T,
    operation: TOp
  ): T;

  /**
   * Create a new CRDT instance
   */
  create<T extends CRDT>(type: CRDTType): T;
}

export enum CRDTType {
  COUNTER = 'COUNTER',
  REGISTER = 'REGISTER',
  SET = 'SET',
  MAP = 'MAP',
  GRAPH = 'GRAPH',
}

export interface CRDT {
  readonly type: CRDTType;
  readonly vectorClock: VectorClockState;
}

export interface CRDTOperation {
  readonly type: string;
  readonly timestamp: HLCTimestamp;
  readonly machineId: EntityId;
}

/**
 * Session handoff between Claude instances
 */
export interface SessionHandoff {
  /**
   * Prepare session for handoff
   */
  prepare(): Promise<SessionSnapshot>;

  /**
   * Accept a handed-off session
   */
  accept(snapshot: SessionSnapshot): Promise<void>;

  /**
   * Validate session snapshot
   */
  validate(snapshot: SessionSnapshot): Promise<ValidationResult>;
}

export interface SessionSnapshot {
  readonly sessionId: EntityId;
  readonly timestamp: Timestamp;
  readonly executionContext: ExecutionContext;
  readonly memoryState: MemorySnapshot;
  readonly checksum: string;
}

// ============================================================================
// COORDINATION LAYER
// ============================================================================

/**
 * Coordinates work across multiple Claude instances
 */
export interface AgentCoordinator {
  /**
   * Assign a task to an available agent
   */
  assignTask(task: DelegationTask): Promise<EntityId>; // Returns agent ID

  /**
   * Get status of all agents
   */
  getAgentStatuses(): Promise<Map<EntityId, AgentStatus>>;

  /**
   * Register a new agent
   */
  registerAgent(agent: AgentInfo): Promise<void>;

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: EntityId): Promise<void>;

  /**
   * Rebalance work across agents
   */
  rebalance(): Promise<RebalanceResult>;
}

export interface AgentStatus {
  readonly agentId: EntityId;
  readonly state: AgentState;
  readonly currentTask?: EntityId;
  readonly queuedTasks: number;
  readonly cpu: number; // 0-1
  readonly memory: number; // 0-1
  readonly lastHeartbeat: Timestamp;
}

export enum AgentState {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  DEGRADED = 'DEGRADED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface AgentInfo {
  readonly id: EntityId;
  readonly capabilities: string[];
  readonly maxConcurrentTasks: number;
  readonly machineId: EntityId;
}

export interface RebalanceResult {
  readonly tasksMoved: number;
  readonly fromAgent: EntityId;
  readonly toAgent: EntityId;
  readonly reason: string;
}

/**
 * Routes tasks to appropriate handlers
 */
export interface TaskRouter {
  /**
   * Route a task to the best handler
   */
  route(task: DelegationTask): Promise<RoutingDecision>;

  /**
   * Register a task handler
   */
  registerHandler(handler: TaskHandler): void;

  /**
   * Get routing metrics
   */
  getMetrics(): Promise<RoutingMetrics>;
}

export interface RoutingDecision {
  readonly handlerId: EntityId;
  readonly confidence: number;
  readonly estimatedCost: CostUSD;
  readonly estimatedDuration: number;
  readonly reasoning?: string;
}

export interface TaskHandler {
  readonly id: EntityId;
  readonly supportedTypes: TaskType[];
  readonly capacity: number;
  readonly currentLoad: number;
  canHandle(task: DelegationTask): Promise<boolean>;
  handle(task: DelegationTask): Promise<DelegationResult>;
}

export interface RoutingMetrics {
  readonly totalRouted: number;
  readonly averageDecisionTime: number;
  readonly routingErrors: number;
  readonly handlerUtilization: Map<EntityId, number>;
}

/**
 * Circuit breaker for fault tolerance
 */
export interface CircuitBreaker {
  /**
   * Execute an operation with circuit breaker protection
   */
  execute<T>(
    operation: () => Promise<T>,
    config?: CircuitBreakerConfig
  ): Promise<T>;

  /**
   * Get current circuit state
   */
  getState(): CircuitState;

  /**
   * Manually open the circuit
   */
  open(): void;

  /**
   * Manually close the circuit
   */
  close(): void;

  /**
   * Reset circuit breaker metrics
   */
  reset(): void;
}

export interface CircuitBreakerConfig {
  readonly failureThreshold: number; // Number of failures before opening
  readonly successThreshold: number; // Successes needed to close
  readonly timeout: number; // Time to wait before half-open
  readonly monitoringPeriod: number; // Time window for failure counting
}

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Health checking for system components
 */
export interface HealthCheck {
  /**
   * Check health of a component
   */
  check(componentId: EntityId): Promise<HealthStatus>;

  /**
   * Check health of all components
   */
  checkAll(): Promise<Map<EntityId, HealthStatus>>;

  /**
   * Register a health check function
   */
  register(
    componentId: EntityId,
    checkFn: () => Promise<HealthStatus>
  ): void;

  /**
   * Start periodic health checks
   */
  startMonitoring(intervalMs: number): void;

  /**
   * Stop periodic health checks
   */
  stopMonitoring(): void;
}

export interface HealthStatus {
  readonly healthy: boolean;
  readonly componentId: EntityId;
  readonly timestamp: Timestamp;
  readonly details?: HealthDetails;
}

export interface HealthDetails {
  readonly uptime: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
  readonly errorRate: number;
  readonly responseTime: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Manages degraded mode operation
 */
export interface DegradedModeManager {
  /**
   * Enter degraded mode
   */
  enter(reason: string): Promise<void>;

  /**
   * Exit degraded mode
   */
  exit(): Promise<void>;

  /**
   * Check if in degraded mode
   */
  isDegraded(): boolean;

  /**
   * Get degraded mode configuration
   */
  getConfig(): DegradedModeConfig;

  /**
   * Set degraded mode configuration
   */
  setConfig(config: DegradedModeConfig): void;
}

export interface DegradedModeConfig {
  readonly disableFeatures: string[];
  readonly reduceParallelism: number; // Factor to reduce by
  readonly simplifyResponses: boolean;
  readonly skipValidation: boolean;
  readonly cachingOnly: boolean;
}

// ============================================================================
// MACHINE NETWORK LAYER
// ============================================================================

/**
 * Registry of all machines in the network
 */
export interface MachineRegistry {
  /**
   * Register a new machine
   */
  register(machine: MachineInfo): Promise<void>;

  /**
   * Unregister a machine
   */
  unregister(machineId: EntityId): Promise<void>;

  /**
   * Get machine info
   */
  get(machineId: EntityId): Promise<MachineInfo | null>;

  /**
   * Get all machines
   */
  getAll(): Promise<MachineInfo[]>;

  /**
   * Update machine status
   */
  updateStatus(machineId: EntityId, status: MachineStatus): Promise<void>;

  /**
   * Find machines matching criteria
   */
  find(criteria: MachineCriteria): Promise<MachineInfo[]>;
}

export interface MachineInfo {
  readonly id: EntityId;
  readonly status: MachineStatus;
  readonly capabilities: string[];
  readonly region: string;
  readonly address: string;
  readonly metadata: MachineMetadata;
  readonly joinedAt: Timestamp;
}

export enum MachineStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  FAILED = 'FAILED',
}

export interface MachineMetadata {
  readonly cpu: number;
  readonly memory: number;
  readonly storage: number;
  readonly network: number;
  readonly modelVersion?: string;
}

export interface MachineCriteria {
  readonly status?: MachineStatus;
  readonly capabilities?: string[];
  readonly region?: string;
  readonly minCpu?: number;
  readonly minMemory?: number;
}

/**
 * Raft consensus for leader election and log replication
 */
export interface RaftConsensus {
  /**
   * Start Raft node
   */
  start(): Promise<void>;

  /**
   * Stop Raft node
   */
  stop(): Promise<void>;

  /**
   * Get current role
   */
  getRole(): RaftRole;

  /**
   * Get current leader
   */
  getLeader(): EntityId | null;

  /**
   * Propose a new log entry
   */
  propose(entry: LogEntry): Promise<void>;

  /**
   * Read committed log entries
   */
  getLog(fromIndex: number, toIndex?: number): Promise<LogEntry[]>;

  /**
   * Get cluster state
   */
  getClusterState(): Promise<ClusterState>;
}

export enum RaftRole {
  LEADER = 'LEADER',
  FOLLOWER = 'FOLLOWER',
  CANDIDATE = 'CANDIDATE',
}

export interface LogEntry {
  readonly index: number;
  readonly term: number;
  readonly command: unknown;
  readonly timestamp: Timestamp;
}

export interface ClusterState {
  readonly term: number;
  readonly leader: EntityId | null;
  readonly members: EntityId[];
  readonly commitIndex: number;
  readonly lastApplied: number;
}

/**
 * Gossip protocol for distributed state propagation
 */
export interface GossipProtocol {
  /**
   * Start gossiping
   */
  start(): void;

  /**
   * Stop gossiping
   */
  stop(): void;

  /**
   * Broadcast a message
   */
  broadcast(message: GossipMessage): void;

  /**
   * Subscribe to gossip messages
   */
  subscribe(handler: (message: GossipMessage) => void): () => void;

  /**
   * Get gossip statistics
   */
  getStats(): GossipStats;
}

export interface GossipMessage {
  readonly id: EntityId;
  readonly source: EntityId;
  readonly type: string;
  readonly payload: unknown;
  readonly timestamp: Timestamp;
  readonly ttl: number; // Hops remaining
}

export interface GossipStats {
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly bytesTransferred: number;
  readonly peerCount: number;
  readonly averageLatency: number;
}

/**
 * Session migration between machines
 */
export interface SessionMigration {
  /**
   * Migrate session to another machine
   */
  migrate(
    sessionId: EntityId,
    targetMachine: EntityId
  ): Promise<MigrationResult>;

  /**
   * Prepare session for migration
   */
  prepare(sessionId: EntityId): Promise<SessionSnapshot>;

  /**
   * Accept migrated session
   */
  accept(snapshot: SessionSnapshot): Promise<void>;

  /**
   * Rollback failed migration
   */
  rollback(migrationId: EntityId): Promise<void>;

  /**
   * Get migration status
   */
  getStatus(migrationId: EntityId): Promise<MigrationStatus>;
}

export interface MigrationResult {
  readonly migrationId: EntityId;
  readonly success: boolean;
  readonly duration: number;
  readonly bytesTransferred: number;
  readonly error?: SystemError;
}

export enum MigrationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

/**
 * Generic repository pattern for data access
 */
export interface Repository<T, TId = EntityId> {
  get(id: TId): Promise<T | null>;
  getAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: TId): Promise<boolean>;
  update(id: TId, updates: Partial<T>): Promise<T>;
  query(criteria: unknown): Promise<T[]>;
}

/**
 * Generic service interface
 */
export interface Service {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): Promise<ServiceStatus>;
  getMetrics(): Promise<Record<string, number>>;
}

export interface ServiceStatus {
  readonly running: boolean;
  readonly uptime: number;
  readonly version: SemanticVersion;
  readonly health: HealthStatus;
}

/**
 * Observable pattern for reactive updates
 */
export interface Observable<T> {
  subscribe(observer: Observer<T>): () => void;
  getValue(): T;
}

export interface Observer<T> {
  next(value: T): void;
  error?(error: Error): void;
  complete?(): void;
}

/**
 * Metrics collection and reporting
 */
export interface MetricsCollector {
  increment(metric: string, value?: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, duration: number, tags?: Record<string, string>): void;
  flush(): Promise<void>;
}

/**
 * Logging interface
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void;
}

/**
 * Serialization for network transfer
 */
export interface Serializer {
  serialize<T>(value: T): Buffer | string;
  deserialize<T>(data: Buffer | string): T;
  getContentType(): string;
}

/**
 * Compression for efficient storage/transfer
 */
export interface Compressor {
  compress(data: Buffer): Promise<Buffer>;
  decompress(data: Buffer): Promise<Buffer>;
  estimateRatio(data: Buffer): number;
}

/**
 * Encryption for sensitive data
 */
export interface Encryptor {
  encrypt(data: Buffer, key: string): Promise<Buffer>;
  decrypt(data: Buffer, key: string): Promise<Buffer>;
  hash(data: Buffer): string;
}

// ============================================================================
// FACTORY INTERFACES
// ============================================================================

/**
 * Factory for creating system components
 */
export interface SystemFactory {
  createExecutiveClaude(config: ExecutiveConfig): ExecutiveClaude;
  createMemoryManager(config: MemoryConfig): MemoryManager;
  createAgentCoordinator(config: CoordinationConfig): AgentCoordinator;
  createMachineRegistry(config: NetworkConfig): MachineRegistry;
}

/**
 * Dependency injection container
 */
export interface Container {
  register<T>(token: symbol | string, instance: T): void;
  resolve<T>(token: symbol | string): T;
  has(token: symbol | string): boolean;
}

// ============================================================================
// VERSION COMPATIBILITY
// ============================================================================

/**
 * Version compatibility checker
 */
export interface VersionCompatibility {
  /**
   * Check if two versions are compatible
   */
  isCompatible(v1: SemanticVersion, v2: SemanticVersion): boolean;

  /**
   * Get migration path between versions
   */
  getMigrationPath(
    from: SemanticVersion,
    to: SemanticVersion
  ): SemanticVersion[];

  /**
   * Upgrade data format between versions
   */
  upgrade<T>(data: T, from: SemanticVersion, to: SemanticVersion): Promise<T>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSystemError(value: unknown): value is SystemError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'category' in value &&
    'code' in value &&
    'message' in value
  );
}

export function isMemoryEntry(value: unknown): value is MemoryEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'key' in value &&
    'tier' in value
  );
}

export function isSystemEvent(value: unknown): value is SystemEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'timestamp' in value
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 5;
export const DEFAULT_HEALTH_CHECK_INTERVAL = 5000; // 5 seconds
export const MAX_DELEGATION_DEPTH = 10;
export const MAX_CONTEXT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  // Core
  SystemConfig,

  // Executive
  UserRequest,
  ExecutionResult,
  DelegationTask,

  // Memory
  MemoryEntry,
  MemoryManager,

  // Coordination
  AgentCoordinator,
  TaskRouter,

  // Network
  MachineRegistry,
  RaftConsensus,
  GossipProtocol,
};
