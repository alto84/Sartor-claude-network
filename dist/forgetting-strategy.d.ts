/**
 * Forgetting Strategy Implementation
 *
 * Implements:
 * 1. Multi-tier deletion strategy (soft/archive/permanent)
 * 2. Never-forget protection rules
 * 3. Privacy-driven expiration
 * 4. Compliance and audit
 */
import { Memory, ForgettingConfig, DeletionCandidate } from './types';
/**
 * Determine appropriate deletion tier for a memory
 *
 * @param memory - Memory to evaluate
 * @param config - Forgetting configuration
 * @returns Deletion tier or null if should be kept
 */
export declare function determineDeletionTier(memory: Memory, config?: ForgettingConfig): 'soft' | 'archive' | 'permanent' | null;
/**
 * Perform soft delete (archive with compression)
 *
 * @param memory - Memory to soft delete
 * @returns Modified memory
 */
export declare function performSoftDelete(memory: Memory): Memory;
/**
 * Perform archive (heavy compression)
 *
 * @param memory - Memory to archive
 * @returns Modified memory
 */
export declare function performArchive(memory: Memory): Memory;
/**
 * Perform permanent deletion
 *
 * @param memory - Memory to delete
 * @param auditLog - Log of deletions for compliance
 * @returns Deletion record for audit
 */
export declare function performPermanentDelete(memory: Memory, auditLog?: boolean): {
    deleted_id: string;
    deleted_at: Date;
    reason: string;
    recoverable: boolean;
};
/**
 * Check if memory should never be forgotten
 *
 * @param memory - Memory to check
 * @param config - Forgetting configuration
 * @returns True if memory is protected
 */
export declare function isNeverForget(memory: Memory, config?: ForgettingConfig): boolean;
/**
 * Add never-forget protection to a memory
 *
 * @param memory - Memory to protect
 * @param reason - Tag indicating why it's protected
 */
export declare function addNeverForgetProtection(memory: Memory, reason?: 'user_request' | 'system_critical' | 'high_importance'): void;
/**
 * Remove never-forget protection (if user requests)
 *
 * @param memory - Memory to unprotect
 */
export declare function removeNeverForgetProtection(memory: Memory): void;
/**
 * Detect if memory contains PII (Personally Identifiable Information)
 *
 * @param memory - Memory to check
 * @returns PII risk score [0, 1]
 */
export declare function detectPII(memory: Memory): number;
/**
 * Detect financial information
 *
 * @param memory - Memory to check
 * @returns Financial data risk score [0, 1]
 */
export declare function detectFinancialData(memory: Memory): number;
/**
 * Calculate privacy risk score
 *
 * @param memory - Memory to evaluate
 * @returns Privacy risk score [0, 1]
 */
export declare function calculatePrivacyRisk(memory: Memory): number;
/**
 * Check if memory should expire due to privacy policy
 *
 * @param memory - Memory to check
 * @param config - Forgetting configuration
 * @returns True if should expire
 */
export declare function shouldExpireForPrivacy(memory: Memory, config?: ForgettingConfig): boolean;
/**
 * Set expiration date based on privacy policy
 *
 * @param memory - Memory to set expiration for
 * @param config - Forgetting configuration
 */
export declare function setPrivacyExpiration(memory: Memory, config?: ForgettingConfig): void;
/**
 * Handle GDPR Right to Erasure request
 *
 * @param userId - User requesting deletion
 * @param memories - All memories for this user
 * @param config - Forgetting configuration
 * @returns Deletion report
 */
export declare function handleRightToErasure(userId: string, memories: Memory[], config?: ForgettingConfig): {
    total_memories: number;
    deleted: number;
    anonymized: number;
    retained: number;
    deletion_ids: string[];
};
/**
 * Anonymize memory (remove PII)
 *
 * @param memory - Memory to anonymize
 */
export declare function anonymizeMemory(memory: Memory): void;
/**
 * Schedule memory for deletion
 *
 * @param memory - Memory to schedule
 * @param gracePeriodDays - Days until permanent deletion
 */
export declare function scheduleDeletion(memory: Memory, gracePeriodDays: number): void;
/**
 * Find all deletion candidates
 *
 * @param memories - All memories
 * @param config - Forgetting configuration
 * @returns List of deletion candidates
 */
export declare function findDeletionCandidates(memories: Memory[], config?: ForgettingConfig): DeletionCandidate[];
/**
 * Execute forgetting process on deletion candidates
 *
 * @param candidates - Deletion candidates
 * @returns Execution results
 */
export declare function executeForgettingProcess(candidates: DeletionCandidate[]): {
    soft_deleted: number;
    archived: number;
    permanently_deleted: number;
    audit_records: any[];
};
/**
 * PSEUDOCODE: Forgetting Process
 *
 * FUNCTION daily_forgetting_process(all_memories, config):
 *   candidates = []
 *
 *   FOR EACH memory IN all_memories:
 *     // 1. Check protection
 *     IF is_never_forget(memory, config):
 *       CONTINUE
 *
 *     // 2. Check privacy expiration
 *     IF should_expire_for_privacy(memory, config):
 *       ADD {memory, reason: 'privacy', tier: 'permanent'} to candidates
 *       CONTINUE
 *
 *     // 3. Check scheduled expiration
 *     IF memory.expires_at AND memory.expires_at <= now:
 *       ADD {memory, reason: 'scheduled', tier: 'permanent'} to candidates
 *       CONTINUE
 *
 *     // 4. Check minimum retention
 *     age_days = (now - memory.created_at) / 1 day
 *     IF age_days < config.minimum_retention.age_days:
 *       CONTINUE
 *
 *     IF memory.importance >= config.minimum_retention.importance:
 *       CONTINUE
 *
 *     IF memory.access_count >= config.minimum_retention.access_count:
 *       CONTINUE
 *
 *     // 5. Determine tier based on strength
 *     IF memory.strength < 0.05:
 *       tier = 'permanent'
 *     ELSE IF memory.strength < 0.15:
 *       tier = 'archive'
 *     ELSE IF memory.strength < 0.30:
 *       tier = 'soft'
 *     ELSE:
 *       CONTINUE
 *
 *     ADD {memory, tier, reason: 'low_strength'} to candidates
 *   END FOR
 *
 *   // Execute deletions
 *   FOR EACH candidate IN candidates:
 *     MATCH candidate.tier:
 *       CASE 'soft':
 *         memory.status = ARCHIVED
 *         compress_embedding(memory, 128)
 *
 *       CASE 'archive':
 *         memory.status = ARCHIVED
 *         memory.content = summarize(memory.content, 200)
 *         compress_embedding(memory, 64)
 *
 *       CASE 'permanent':
 *         // Grace period check
 *         IF candidate.reason == 'privacy':
 *           // Immediate deletion for privacy
 *           DELETE memory
 *         ELSE:
 *           // Schedule with grace period
 *           memory.expires_at = now + config.grace_period_days
 *           memory.status = ARCHIVED
 *         END IF
 *
 *         log_deletion(memory, candidate.reason)
 *     END MATCH
 *
 *     save(memory)
 *   END FOR
 *
 *   RETURN {
 *     soft_deleted: count of soft deletions,
 *     archived: count of archives,
 *     permanently_deleted: count of permanent deletions
 *   }
 * END FUNCTION
 *
 * FUNCTION handle_user_deletion_request(user_id, all_memories, config):
 *   user_memories = FILTER all_memories WHERE user_id == user_id
 *
 *   FOR EACH memory IN user_memories:
 *     IF has_tag(memory, 'legal') OR has_tag(memory, 'compliance'):
 *       // Anonymize instead of delete
 *       memory.user_id = null
 *       remove_pii(memory.content)
 *       ADD 'anonymized' tag to memory
 *     ELSE:
 *       // Schedule deletion with grace period
 *       memory.expires_at = now + config.grace_period_days
 *       memory.status = ARCHIVED
 *       ADD 'scheduled_deletion' tag to memory
 *     END IF
 *
 *     save(memory)
 *   END FOR
 *
 *   generate_compliance_report(user_id, user_memories)
 * END FUNCTION
 */
//# sourceMappingURL=forgetting-strategy.d.ts.map