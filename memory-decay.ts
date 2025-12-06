/**
 * Memory Decay Function Implementation
 *
 * Implements:
 * 1. Base decay rate calculation
 * 2. Decay modifiers (importance, access pattern, type)
 * 3. Reinforcement on access
 * 4. Threshold-based state transitions
 */

import {
  Memory,
  MemoryType,
  MemoryStatus,
  DecayConfig,
  DecayModifiers
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_DECAY_CONFIG: DecayConfig = {
  base_rate: 0.1,              // 10% decay per day
  reinforcement_boost: 0.15,   // 15% boost on access

  thresholds: {
    soft_delete: 0.30,         // Archive threshold
    archive: 0.15,             // Compression threshold
    permanent_delete: 0.05     // Deletion threshold
  },

  type_modifiers: {
    [MemoryType.EPISODIC]: 1.0,    // Normal decay
    [MemoryType.SEMANTIC]: 0.7,    // 30% slower decay
    [MemoryType.PROCEDURAL]: 0.5,  // 50% slower decay
    [MemoryType.EMOTIONAL]: 0.6,   // 40% slower decay
    [MemoryType.SYSTEM]: 0.3       // 70% slower decay
  }
};

// ============================================================================
// 1. Base Decay Rate Calculation
// ============================================================================

/**
 * Calculate base decay rate modified by importance
 *
 * Formula: base_decay * (1 - importance)^2
 *
 * Quadratic relationship: high-importance memories decay much slower
 *
 * @param importance - Memory importance score [0, 1]
 * @param config - Decay configuration
 * @returns Decay rate per day
 */
export function calculateBaseDecayRate(
  importance: number,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  const importanceModifier = Math.pow(1 - importance, 2);
  const decayRate = config.base_rate * importanceModifier;

  return Math.max(0, decayRate);
}

// ============================================================================
// 2. Decay Modifiers
// ============================================================================

/**
 * Calculate importance-based decay modifier
 *
 * @param importance - Memory importance score [0, 1]
 * @returns Modifier value (multiplied with base rate)
 */
export function getImportanceModifier(importance: number): number {
  // Higher importance = lower modifier (slower decay)
  // importance 0.0 → modifier 1.0 (no reduction)
  // importance 0.5 → modifier 0.55
  // importance 1.0 → modifier 0.1 (90% reduction)
  return 1 - (importance * 0.9);
}

/**
 * Calculate access pattern-based decay modifier
 *
 * @param memory - The memory to evaluate
 * @returns Modifier value
 */
export function getAccessPatternModifier(memory: Memory): number {
  const now = new Date();
  const lastAccessed = new Date(memory.last_accessed);
  const hoursSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60);

  if (hoursSinceAccess < 24) {
    return 0.5;  // 50% slower decay if accessed in last 24h
  } else if (hoursSinceAccess < 24 * 7) {
    return 0.7;  // 30% slower decay if accessed in last 7 days
  } else if (memory.access_count === 0) {
    return 1.5;  // 50% faster decay if never accessed
  }

  return 1.0;  // Normal decay
}

/**
 * Get memory type-based decay modifier
 *
 * @param memoryType - Type of memory
 * @param config - Decay configuration
 * @returns Modifier value
 */
export function getTypeModifier(
  memoryType: MemoryType,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  return config.type_modifiers[memoryType] || 1.0;
}

/**
 * Calculate all decay modifiers for a memory
 *
 * @param memory - The memory to evaluate
 * @param config - Decay configuration
 * @returns Object containing all modifiers
 */
export function calculateDecayModifiers(
  memory: Memory,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): DecayModifiers {
  return {
    importance: getImportanceModifier(memory.importance_score),
    access_pattern: getAccessPatternModifier(memory),
    type: getTypeModifier(memory.type, config)
  };
}

/**
 * Calculate final decay rate with all modifiers applied
 *
 * @param memory - The memory to evaluate
 * @param config - Decay configuration
 * @returns Final decay rate per day
 */
export function calculateFinalDecayRate(
  memory: Memory,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  const baseRate = calculateBaseDecayRate(memory.importance_score, config);
  const modifiers = calculateDecayModifiers(memory, config);

  const finalRate = baseRate * modifiers.importance * modifiers.access_pattern * modifiers.type;

  return Math.max(0, finalRate);
}

// ============================================================================
// 3. Memory Strength Updates
// ============================================================================

/**
 * Apply decay to memory strength
 *
 * @param memory - The memory to decay
 * @param daysElapsed - Days since last decay update
 * @param config - Decay configuration
 * @returns New strength value [0, 1]
 */
export function applyDecay(
  memory: Memory,
  daysElapsed: number,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  const decayRate = calculateFinalDecayRate(memory, config);
  const totalDecay = decayRate * daysElapsed;

  const newStrength = Math.max(0, memory.strength - totalDecay);

  return newStrength;
}

/**
 * Apply reinforcement boost when memory is accessed
 *
 * Formula: new_strength = min(1.0, current_strength + boost * (1 - current_strength))
 *
 * Diminishing returns: stronger memories get less boost
 *
 * @param currentStrength - Current memory strength [0, 1]
 * @param config - Decay configuration
 * @returns New strength value [0, 1]
 */
export function applyReinforcement(
  currentStrength: number,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  const boost = config.reinforcement_boost * (1 - currentStrength);
  const newStrength = Math.min(1.0, currentStrength + boost);

  return newStrength;
}

/**
 * Update memory strength and handle access reinforcement
 *
 * @param memory - The memory to update
 * @param wasAccessed - Whether the memory was just accessed
 * @param config - Decay configuration
 */
export function updateMemoryStrength(
  memory: Memory,
  wasAccessed: boolean = false,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): void {
  const now = new Date();
  const lastUpdated = new Date(memory.updated_at);

  // Calculate days elapsed since last update
  const millisPerDay = 1000 * 60 * 60 * 24;
  const daysElapsed = (now.getTime() - lastUpdated.getTime()) / millisPerDay;

  // Apply decay
  let newStrength = applyDecay(memory, daysElapsed, config);

  // Apply reinforcement if accessed
  if (wasAccessed) {
    newStrength = applyReinforcement(newStrength, config);
    memory.access_count += 1;
    memory.last_accessed = now;
  }

  memory.strength = newStrength;
  memory.updated_at = now;
}

// ============================================================================
// 4. Threshold-Based State Transitions
// ============================================================================

/**
 * Determine if memory should be soft-deleted (archived)
 *
 * @param memory - The memory to check
 * @param config - Decay configuration
 * @returns True if should be archived
 */
export function shouldArchive(
  memory: Memory,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): boolean {
  return memory.strength < config.thresholds.soft_delete &&
         memory.status === MemoryStatus.ACTIVE;
}

/**
 * Determine if memory should be heavily compressed
 *
 * @param memory - The memory to check
 * @param config - Decay configuration
 * @returns True if should be compressed
 */
export function shouldCompress(
  memory: Memory,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): boolean {
  return memory.strength < config.thresholds.archive;
}

/**
 * Determine if memory should be permanently deleted
 *
 * @param memory - The memory to check
 * @param config - Decay configuration
 * @param gracePeriodDays - Minimum age before deletion (default: 90)
 * @returns True if should be deleted
 */
export function shouldDelete(
  memory: Memory,
  config: DecayConfig = DEFAULT_DECAY_CONFIG,
  gracePeriodDays: number = 90
): boolean {
  if (memory.strength >= config.thresholds.permanent_delete) {
    return false;
  }

  // Check minimum age
  const now = new Date();
  const created = new Date(memory.created_at);
  const ageInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays < gracePeriodDays) {
    return false;
  }

  // Check importance threshold
  if (memory.importance_score > 0.2) {
    return false;
  }

  // Check access count
  if (memory.access_count >= 2) {
    return false;
  }

  // Check for never-forget tags
  const neverForgetTags = [
    'user_preference',
    'system_config',
    'explicitly_saved',
    'commitment',
    'promise',
    'personal_fact'
  ];

  const hasProtectedTag = memory.tags.some(tag =>
    neverForgetTags.includes(tag)
  );

  if (hasProtectedTag) {
    return false;
  }

  return true;
}

/**
 * Check if memory is protected from deletion
 *
 * @param memory - The memory to check
 * @returns True if memory should never be deleted
 */
export function isProtectedMemory(memory: Memory): boolean {
  // System memories
  if (memory.type === MemoryType.SYSTEM) {
    return true;
  }

  // High importance
  if (memory.importance_score > 0.8) {
    return true;
  }

  // Frequently accessed
  if (memory.access_count > 50) {
    return true;
  }

  // Protected tags
  const neverForgetTags = [
    'user_preference',
    'system_config',
    'explicitly_saved',
    'commitment',
    'promise',
    'decision',
    'personal_fact',
    'high_importance',
    'legal',
    'privacy',
    'procedural_knowledge'
  ];

  return memory.tags.some(tag => neverForgetTags.includes(tag));
}

/**
 * Transition memory to appropriate state based on strength
 *
 * @param memory - The memory to transition
 * @param config - Decay configuration
 * @returns New status
 */
export function transitionMemoryState(
  memory: Memory,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): MemoryStatus {
  // Check if protected
  if (isProtectedMemory(memory)) {
    return MemoryStatus.ACTIVE;
  }

  // Check deletion threshold
  if (shouldDelete(memory, config)) {
    memory.status = MemoryStatus.DELETED;
    return MemoryStatus.DELETED;
  }

  // Check archive threshold
  if (shouldArchive(memory, config)) {
    memory.status = MemoryStatus.ARCHIVED;
    return MemoryStatus.ARCHIVED;
  }

  // Remain active
  memory.status = MemoryStatus.ACTIVE;
  return MemoryStatus.ACTIVE;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Batch decay update for multiple memories
 *
 * @param memories - Array of memories to update
 * @param config - Decay configuration
 * @returns Number of memories updated
 */
export function batchDecayUpdate(
  memories: Memory[],
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): number {
  let updatedCount = 0;

  for (const memory of memories) {
    updateMemoryStrength(memory, false, config);
    transitionMemoryState(memory, config);
    updatedCount++;
  }

  return updatedCount;
}

/**
 * Get decay statistics for a set of memories
 */
export function getDecayStats(memories: Memory[]): {
  averageStrength: number;
  needsArchive: number;
  needsDelete: number;
  protected: number;
} {
  const totalStrength = memories.reduce((sum, m) => sum + m.strength, 0);

  return {
    averageStrength: memories.length > 0 ? totalStrength / memories.length : 0,
    needsArchive: memories.filter(m => shouldArchive(m)).length,
    needsDelete: memories.filter(m => shouldDelete(m)).length,
    protected: memories.filter(m => isProtectedMemory(m)).length
  };
}

// ============================================================================
// Pseudocode for Decay Algorithm
// ============================================================================

/**
 * PSEUDOCODE: Daily Decay Process
 *
 * FUNCTION daily_decay_process(all_memories, config):
 *   FOR EACH memory IN all_memories:
 *     // Skip if recently updated
 *     IF (now - memory.updated_at) < 1 hour:
 *       CONTINUE
 *
 *     // Calculate time elapsed
 *     days_elapsed = (now - memory.updated_at) / 24 hours
 *
 *     // Calculate decay rate with modifiers
 *     base_rate = config.base_rate * (1 - memory.importance)^2
 *     importance_mod = 1 - (memory.importance * 0.9)
 *     access_mod = get_access_pattern_modifier(memory)
 *     type_mod = config.type_modifiers[memory.type]
 *
 *     final_rate = base_rate * importance_mod * access_mod * type_mod
 *
 *     // Apply decay
 *     decay_amount = final_rate * days_elapsed
 *     memory.strength = MAX(0, memory.strength - decay_amount)
 *
 *     // Update timestamp
 *     memory.updated_at = now
 *
 *     // Check state transitions
 *     IF memory.strength < config.thresholds.permanent_delete:
 *       IF should_delete(memory):
 *         memory.status = DELETED
 *     ELSE IF memory.strength < config.thresholds.archive:
 *       memory.status = ARCHIVED
 *     ELSE IF memory.strength < config.thresholds.soft_delete:
 *       memory.status = ARCHIVED
 *
 *     // Save updated memory
 *     save(memory)
 *
 *   END FOR
 * END FUNCTION
 *
 * FUNCTION on_memory_access(memory, config):
 *   // Apply decay first
 *   days_elapsed = (now - memory.updated_at) / 24 hours
 *   memory.strength = apply_decay(memory, days_elapsed)
 *
 *   // Apply reinforcement boost
 *   boost = config.reinforcement_boost * (1 - memory.strength)
 *   memory.strength = MIN(1.0, memory.strength + boost)
 *
 *   // Update metadata
 *   memory.access_count += 1
 *   memory.last_accessed = now
 *   memory.updated_at = now
 *
 *   // Potentially reactivate archived memory
 *   IF memory.status == ARCHIVED AND memory.strength > config.thresholds.soft_delete:
 *     memory.status = ACTIVE
 *
 *   save(memory)
 * END FUNCTION
 */
