/**
 * Forgetting Strategy Implementation
 *
 * Implements:
 * 1. Multi-tier deletion strategy (soft/archive/permanent)
 * 2. Never-forget protection rules
 * 3. Privacy-driven expiration
 * 4. Compliance and audit
 */

import {
  Memory,
  MemoryStatus,
  MemoryType,
  ForgettingConfig,
  DeletionCandidate,
} from '../utils/types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_FORGETTING_CONFIG: ForgettingConfig = {
  grace_period_days: 30,

  never_forget_tags: [
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
    'procedural_knowledge',
  ],

  privacy: {
    pii_max_days: 30, // Personal Identifiable Information
    financial_max_days: 90, // Financial data
    health_max_days: 180, // Health information
    casual_max_days: 180, // Casual conversation
  },

  minimum_retention: {
    age_days: 7, // Don't delete if younger than 7 days
    importance: 0.7, // Don't delete if importance > 0.7
    access_count: 10, // Don't delete if accessed 10+ times
  },
};

// ============================================================================
// 1. Deletion Tier System
// ============================================================================

/**
 * Determine appropriate deletion tier for a memory
 *
 * @param memory - Memory to evaluate
 * @param config - Forgetting configuration
 * @returns Deletion tier or null if should be kept
 */
export function determineDeletionTier(
  memory: Memory,
  config: ForgettingConfig = DEFAULT_FORGETTING_CONFIG
): 'soft' | 'archive' | 'permanent' | null {
  // Check if protected
  if (isNeverForget(memory, config)) {
    return null;
  }

  // Check minimum retention criteria
  if (!meetsMinimumRetention(memory, config)) {
    return null;
  }

  // Determine tier based on strength
  if (memory.strength < 0.05) {
    return 'permanent';
  } else if (memory.strength < 0.15) {
    return 'archive';
  } else if (memory.strength < 0.3) {
    return 'soft';
  }

  return null;
}

/**
 * Check if memory meets minimum retention requirements
 */
function meetsMinimumRetention(memory: Memory, config: ForgettingConfig): boolean {
  const now = new Date();
  const created = new Date(memory.created_at);
  const ageInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  // Too young to delete
  if (ageInDays < config.minimum_retention.age_days) {
    return false;
  }

  // Too important to delete
  if (memory.importance_score >= config.minimum_retention.importance) {
    return false;
  }

  // Too frequently accessed to delete
  if (memory.access_count >= config.minimum_retention.access_count) {
    return false;
  }

  return true;
}

/**
 * Perform soft delete (archive with compression)
 *
 * @param memory - Memory to soft delete
 * @returns Modified memory
 */
export function performSoftDelete(memory: Memory): Memory {
  memory.status = MemoryStatus.ARCHIVED;

  // Compress embedding (e.g., 768 → 128 dimensions via PCA)
  if (memory.embedding && memory.embedding.length > 128) {
    memory.embedding = compressEmbedding(memory.embedding, 128);
  }

  // Keep metadata and summary
  // Full content is preserved

  // Add archived tag
  if (!memory.tags.includes('archived')) {
    memory.tags.push('archived');
  }

  return memory;
}

/**
 * Perform archive (heavy compression)
 *
 * @param memory - Memory to archive
 * @returns Modified memory
 */
export function performArchive(memory: Memory): Memory {
  memory.status = MemoryStatus.ARCHIVED;

  // Create summary if content is long
  if (memory.content.length > 200) {
    const summary = memory.content.substring(0, 200) + '...';
    memory.content = `[ARCHIVED] ${summary}`;
  }

  // Remove full embedding
  if (memory.embedding) {
    memory.embedding = compressEmbedding(memory.embedding, 64);
  }

  // Add archived tag
  if (!memory.tags.includes('archived')) {
    memory.tags.push('archived');
  }

  return memory;
}

/**
 * Perform permanent deletion
 *
 * @param memory - Memory to delete
 * @param auditLog - Log of deletions for compliance
 * @returns Deletion record for audit
 */
export function performPermanentDelete(
  memory: Memory,
  auditLog: boolean = true
): {
  deleted_id: string;
  deleted_at: Date;
  reason: string;
  recoverable: boolean;
} {
  const deletionRecord = {
    deleted_id: memory.id,
    deleted_at: new Date(),
    reason: `Strength ${memory.strength.toFixed(3)}, Importance ${memory.importance_score.toFixed(3)}`,
    recoverable: false,
  };

  // Mark as deleted
  memory.status = MemoryStatus.DELETED;

  // In production: remove from database
  // This is just a status change for safety

  return deletionRecord;
}

/**
 * Simple embedding compression (mock - use PCA/autoencoder in production)
 */
function compressEmbedding(embedding: number[], targetDim: number): number[] {
  if (embedding.length <= targetDim) {
    return embedding;
  }

  // Simple downsampling (in production: use PCA or autoencoder)
  const step = embedding.length / targetDim;
  const compressed: number[] = [];

  for (let i = 0; i < targetDim; i++) {
    const idx = Math.floor(i * step);
    compressed.push(embedding[idx]);
  }

  return compressed;
}

// ============================================================================
// 2. Never-Forget Protection
// ============================================================================

/**
 * Check if memory should never be forgotten
 *
 * @param memory - Memory to check
 * @param config - Forgetting configuration
 * @returns True if memory is protected
 */
export function isNeverForget(
  memory: Memory,
  config: ForgettingConfig = DEFAULT_FORGETTING_CONFIG
): boolean {
  // System memories are always protected
  if (memory.type === MemoryType.SYSTEM) {
    return true;
  }

  // Check for protected tags
  const hasProtectedTag = memory.tags.some((tag) => config.never_forget_tags.includes(tag));

  if (hasProtectedTag) {
    return true;
  }

  // Check high importance
  if (memory.importance_score > 0.8) {
    return true;
  }

  // Check frequent access
  if (memory.access_count > 50) {
    return true;
  }

  return false;
}

/**
 * Add never-forget protection to a memory
 *
 * @param memory - Memory to protect
 * @param reason - Tag indicating why it's protected
 */
export function addNeverForgetProtection(
  memory: Memory,
  reason: 'user_request' | 'system_critical' | 'high_importance' = 'user_request'
): void {
  const tag =
    reason === 'user_request'
      ? 'explicitly_saved'
      : reason === 'system_critical'
        ? 'system_config'
        : 'high_importance';

  if (!memory.tags.includes(tag)) {
    memory.tags.push(tag);
  }

  // Ensure high strength
  memory.strength = Math.max(memory.strength, 0.9);
}

/**
 * Remove never-forget protection (if user requests)
 *
 * @param memory - Memory to unprotect
 */
export function removeNeverForgetProtection(memory: Memory): void {
  const protectedTags = ['explicitly_saved', 'user_preference', 'high_importance'];

  memory.tags = memory.tags.filter((tag) => !protectedTags.includes(tag));
}

// ============================================================================
// 3. Privacy-Driven Expiration
// ============================================================================

/**
 * Detect if memory contains PII (Personally Identifiable Information)
 *
 * @param memory - Memory to check
 * @returns PII risk score [0, 1]
 */
export function detectPII(memory: Memory): number {
  const content = memory.content.toLowerCase();

  let score = 0;
  let detectionCount = 0;

  // Email patterns
  if (/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/.test(content)) {
    score += 0.3;
    detectionCount++;
  }

  // Phone numbers
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content)) {
    score += 0.3;
    detectionCount++;
  }

  // SSN patterns
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(content)) {
    score += 0.5;
    detectionCount++;
  }

  // Credit card patterns
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(content)) {
    score += 0.5;
    detectionCount++;
  }

  // Address patterns (simplified)
  if (/\b\d+\s+[\w\s]+\b(street|st|avenue|ave|road|rd|boulevard|blvd)\b/.test(content)) {
    score += 0.2;
    detectionCount++;
  }

  // Names (very basic - would use NER in production)
  if (memory.tags.includes('personal_info') || memory.tags.includes('name')) {
    score += 0.2;
    detectionCount++;
  }

  return Math.min(1.0, score);
}

/**
 * Detect financial information
 *
 * @param memory - Memory to check
 * @returns Financial data risk score [0, 1]
 */
export function detectFinancialData(memory: Memory): number {
  const content = memory.content.toLowerCase();

  let score = 0;

  const financialKeywords = [
    'salary',
    'income',
    'tax',
    'account number',
    'routing number',
    'investment',
    'portfolio',
    'bank',
    'credit',
    'debit',
    'payment',
  ];

  for (const keyword of financialKeywords) {
    if (content.includes(keyword)) {
      score += 0.15;
    }
  }

  if (memory.tags.includes('financial')) {
    score += 0.3;
  }

  return Math.min(1.0, score);
}

/**
 * Calculate privacy risk score
 *
 * @param memory - Memory to evaluate
 * @returns Privacy risk score [0, 1]
 */
export function calculatePrivacyRisk(memory: Memory): number {
  const piiScore = detectPII(memory);
  const financialScore = detectFinancialData(memory);

  // Age factor: older data = lower risk (context has changed)
  const now = new Date();
  const created = new Date(memory.created_at);
  const ageInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  const ageScore = Math.max(0, 1 - ageInDays / 365); // Decay over 1 year

  const privacyRisk = piiScore * 0.4 + financialScore * 0.4 + ageScore * 0.2;

  return Math.min(1.0, privacyRisk);
}

/**
 * Check if memory should expire due to privacy policy
 *
 * @param memory - Memory to check
 * @param config - Forgetting configuration
 * @returns True if should expire
 */
export function shouldExpireForPrivacy(
  memory: Memory,
  config: ForgettingConfig = DEFAULT_FORGETTING_CONFIG
): boolean {
  const now = new Date();
  const created = new Date(memory.created_at);
  const ageInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  // Check PII expiration
  const piiScore = detectPII(memory);
  if (piiScore > 0.5 && ageInDays > config.privacy.pii_max_days) {
    return true;
  }

  // Check financial data expiration
  const financialScore = detectFinancialData(memory);
  if (financialScore > 0.5 && ageInDays > config.privacy.financial_max_days) {
    return true;
  }

  // Check casual conversation expiration
  if (
    memory.type === MemoryType.EPISODIC &&
    memory.importance_score < 0.3 &&
    ageInDays > config.privacy.casual_max_days
  ) {
    return true;
  }

  // Check overall privacy risk
  const privacyRisk = calculatePrivacyRisk(memory);
  if (privacyRisk > 0.7) {
    return true;
  }

  return false;
}

/**
 * Set expiration date based on privacy policy
 *
 * @param memory - Memory to set expiration for
 * @param config - Forgetting configuration
 */
export function setPrivacyExpiration(
  memory: Memory,
  config: ForgettingConfig = DEFAULT_FORGETTING_CONFIG
): void {
  const piiScore = detectPII(memory);
  const financialScore = detectFinancialData(memory);

  let expirationDays: number;

  if (piiScore > 0.5) {
    expirationDays = config.privacy.pii_max_days;
  } else if (financialScore > 0.5) {
    expirationDays = config.privacy.financial_max_days;
  } else if (memory.type === MemoryType.EPISODIC && memory.importance_score < 0.3) {
    expirationDays = config.privacy.casual_max_days;
  } else {
    // No automatic expiration
    return;
  }

  const expiresAt = new Date(memory.created_at);
  expiresAt.setDate(expiresAt.getDate() + expirationDays);
  memory.expires_at = expiresAt;

  // Update privacy risk
  memory.privacy_risk = calculatePrivacyRisk(memory);
}

// ============================================================================
// 4. Compliance and User Rights
// ============================================================================

/**
 * Handle GDPR Right to Erasure request
 *
 * @param userId - User requesting deletion
 * @param memories - All memories for this user
 * @param config - Forgetting configuration
 * @returns Deletion report
 */
export function handleRightToErasure(
  userId: string,
  memories: Memory[],
  config: ForgettingConfig = DEFAULT_FORGETTING_CONFIG
): {
  total_memories: number;
  deleted: number;
  anonymized: number;
  retained: number;
  deletion_ids: string[];
} {
  const userMemories = memories.filter((m) => m.user_id === userId);

  const report = {
    total_memories: userMemories.length,
    deleted: 0,
    anonymized: 0,
    retained: 0,
    deletion_ids: [] as string[],
  };

  for (const memory of userMemories) {
    // Check if legally required to retain
    if (memory.tags.includes('legal') || memory.tags.includes('compliance')) {
      // Anonymize instead of delete
      anonymizeMemory(memory);
      report.anonymized++;
    } else {
      // Schedule for deletion with grace period
      scheduleDeletion(memory, config.grace_period_days);
      report.deleted++;
      report.deletion_ids.push(memory.id);
    }
  }

  return report;
}

/**
 * Anonymize memory (remove PII)
 *
 * @param memory - Memory to anonymize
 */
export function anonymizeMemory(memory: Memory): void {
  // Remove user association
  memory.user_id = undefined;

  // Remove PII from content (simplified - use NER in production)
  memory.content = memory.content
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

  // Add anonymized tag
  if (!memory.tags.includes('anonymized')) {
    memory.tags.push('anonymized');
  }
}

/**
 * Schedule memory for deletion
 *
 * @param memory - Memory to schedule
 * @param gracePeriodDays - Days until permanent deletion
 */
export function scheduleDeletion(memory: Memory, gracePeriodDays: number): void {
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + gracePeriodDays);

  memory.expires_at = deletionDate;
  memory.status = MemoryStatus.ARCHIVED; // Soft delete during grace period

  if (!memory.tags.includes('scheduled_deletion')) {
    memory.tags.push('scheduled_deletion');
  }
}

/**
 * Find all deletion candidates
 *
 * @param memories - All memories
 * @param config - Forgetting configuration
 * @returns List of deletion candidates
 */
export function findDeletionCandidates(
  memories: Memory[],
  config: ForgettingConfig = DEFAULT_FORGETTING_CONFIG
): DeletionCandidate[] {
  const candidates: DeletionCandidate[] = [];

  for (const memory of memories) {
    // Skip protected memories
    if (isNeverForget(memory, config)) {
      continue;
    }

    // Check for privacy expiration
    if (shouldExpireForPrivacy(memory, config)) {
      candidates.push({
        memory,
        reason: 'Privacy policy expiration',
        tier: 'permanent',
        scheduled_for: new Date(),
        recoverable: false,
      });
      continue;
    }

    // Check for scheduled deletion
    if (memory.expires_at && new Date(memory.expires_at) <= new Date()) {
      candidates.push({
        memory,
        reason: 'Scheduled expiration reached',
        tier: 'permanent',
        scheduled_for: new Date(),
        recoverable: false,
      });
      continue;
    }

    // Check strength-based tiers
    const tier = determineDeletionTier(memory, config);
    if (tier) {
      const scheduledFor = new Date();
      if (tier === 'permanent') {
        scheduledFor.setDate(scheduledFor.getDate() + config.grace_period_days);
      }

      candidates.push({
        memory,
        reason: `Low strength (${memory.strength.toFixed(3)})`,
        tier,
        scheduled_for: scheduledFor,
        recoverable: tier !== 'permanent',
      });
    }
  }

  return candidates;
}

/**
 * Execute forgetting process on deletion candidates
 *
 * @param candidates - Deletion candidates
 * @returns Execution results
 */
export function executeForgettingProcess(candidates: DeletionCandidate[]): {
  soft_deleted: number;
  archived: number;
  permanently_deleted: number;
  audit_records: any[];
} {
  const results = {
    soft_deleted: 0,
    archived: 0,
    permanently_deleted: 0,
    audit_records: [] as any[],
  };

  for (const candidate of candidates) {
    switch (candidate.tier) {
      case 'soft':
        performSoftDelete(candidate.memory);
        results.soft_deleted++;
        break;

      case 'archive':
        performArchive(candidate.memory);
        results.archived++;
        break;

      case 'permanent':
        const record = performPermanentDelete(candidate.memory);
        results.permanently_deleted++;
        results.audit_records.push(record);
        break;
    }
  }

  return results;
}

// ============================================================================
// Pseudocode for Forgetting Strategy
// ============================================================================

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
