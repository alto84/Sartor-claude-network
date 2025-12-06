/**
 * Memory Decay Function Implementation
 *
 * Implements:
 * 1. Base decay rate calculation
 * 2. Decay modifiers (importance, access pattern, type)
 * 3. Reinforcement on access
 * 4. Threshold-based state transitions
 */
import { Memory, MemoryType, MemoryStatus, DecayConfig, DecayModifiers } from './types';
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
export declare function calculateBaseDecayRate(importance: number, config?: DecayConfig): number;
/**
 * Calculate importance-based decay modifier
 *
 * @param importance - Memory importance score [0, 1]
 * @returns Modifier value (multiplied with base rate)
 */
export declare function getImportanceModifier(importance: number): number;
/**
 * Calculate access pattern-based decay modifier
 *
 * @param memory - The memory to evaluate
 * @returns Modifier value
 */
export declare function getAccessPatternModifier(memory: Memory): number;
/**
 * Get memory type-based decay modifier
 *
 * @param memoryType - Type of memory
 * @param config - Decay configuration
 * @returns Modifier value
 */
export declare function getTypeModifier(memoryType: MemoryType, config?: DecayConfig): number;
/**
 * Calculate all decay modifiers for a memory
 *
 * @param memory - The memory to evaluate
 * @param config - Decay configuration
 * @returns Object containing all modifiers
 */
export declare function calculateDecayModifiers(memory: Memory, config?: DecayConfig): DecayModifiers;
/**
 * Calculate final decay rate with all modifiers applied
 *
 * @param memory - The memory to evaluate
 * @param config - Decay configuration
 * @returns Final decay rate per day
 */
export declare function calculateFinalDecayRate(memory: Memory, config?: DecayConfig): number;
/**
 * Apply decay to memory strength
 *
 * @param memory - The memory to decay
 * @param daysElapsed - Days since last decay update
 * @param config - Decay configuration
 * @returns New strength value [0, 1]
 */
export declare function applyDecay(memory: Memory, daysElapsed: number, config?: DecayConfig): number;
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
export declare function applyReinforcement(currentStrength: number, config?: DecayConfig): number;
/**
 * Update memory strength and handle access reinforcement
 *
 * @param memory - The memory to update
 * @param wasAccessed - Whether the memory was just accessed
 * @param config - Decay configuration
 */
export declare function updateMemoryStrength(memory: Memory, wasAccessed?: boolean, config?: DecayConfig): void;
/**
 * Determine if memory should be soft-deleted (archived)
 *
 * @param memory - The memory to check
 * @param config - Decay configuration
 * @returns True if should be archived
 */
export declare function shouldArchive(memory: Memory, config?: DecayConfig): boolean;
/**
 * Determine if memory should be heavily compressed
 *
 * @param memory - The memory to check
 * @param config - Decay configuration
 * @returns True if should be compressed
 */
export declare function shouldCompress(memory: Memory, config?: DecayConfig): boolean;
/**
 * Determine if memory should be permanently deleted
 *
 * @param memory - The memory to check
 * @param config - Decay configuration
 * @param gracePeriodDays - Minimum age before deletion (default: 90)
 * @returns True if should be deleted
 */
export declare function shouldDelete(memory: Memory, config?: DecayConfig, gracePeriodDays?: number): boolean;
/**
 * Check if memory is protected from deletion
 *
 * @param memory - The memory to check
 * @returns True if memory should never be deleted
 */
export declare function isProtectedMemory(memory: Memory): boolean;
/**
 * Transition memory to appropriate state based on strength
 *
 * @param memory - The memory to transition
 * @param config - Decay configuration
 * @returns New status
 */
export declare function transitionMemoryState(memory: Memory, config?: DecayConfig): MemoryStatus;
/**
 * Batch decay update for multiple memories
 *
 * @param memories - Array of memories to update
 * @param config - Decay configuration
 * @returns Number of memories updated
 */
export declare function batchDecayUpdate(memories: Memory[], config?: DecayConfig): number;
/**
 * Get decay statistics for a set of memories
 */
export declare function getDecayStats(memories: Memory[]): {
    averageStrength: number;
    needsArchive: number;
    needsDelete: number;
    protected: number;
};
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
//# sourceMappingURL=memory-decay.d.ts.map