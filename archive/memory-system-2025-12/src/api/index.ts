/**
 * Sartor Life Management System - API Module
 *
 * Provides APIs for family data storage and management, integrated with
 * the multi-tier memory system:
 * - Hot tier (Firebase RTDB): Active session data, real-time presence
 * - Warm tier (Firestore): Searchable persistent storage
 * - Cold tier (GitHub): Archived/deleted items
 *
 * @module api
 */

// ============================================================================
// FAMILY VAULT API
// ============================================================================

export {
  // Types
  FamilyItemType,
  FamilyItem,
  VaultSearchFilters,
  VaultSearchResult,
  VaultStats,
  FamilyVaultConfig,

  // Functions
  calculateImportance,
  createFamilyVault,

  // Class
  FamilyVault,
} from './family-vault';

// ============================================================================
// FAMILY MEMBERS API
// ============================================================================

export {
  // Types
  FamilyRole,
  PresenceStatus,
  FamilyMember,
  MemberPreferences,
  CreateMemberInput,
  UpdateMemberInput,
  FamilyStats,
  FamilyMembersConfig,

  // Constants
  DEFAULT_PREFERENCES,

  // Functions
  getDefaultFeatures,
  createFamilyMembers,

  // Class
  FamilyMembers,
} from './family-members';

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

import { FamilyVault, FamilyVaultConfig } from './family-vault';
import { FamilyMembers, FamilyMembersConfig } from './family-members';

/**
 * Combined configuration for all APIs
 */
export interface FamilyAPIConfig {
  vault?: FamilyVaultConfig;
  members?: FamilyMembersConfig;
}

/**
 * Combined API instance
 */
export interface FamilyAPI {
  vault: FamilyVault;
  members: FamilyMembers;
}

/**
 * Create both API instances with shared configuration
 *
 * @param config - Optional configuration for both APIs
 * @returns Combined API instance with vault and members
 *
 * @example
 * ```typescript
 * const api = createFamilyAPI({
 *   vault: { importanceThresholdForCold: 0.9 },
 *   members: { presenceTTL: 10 * 60 * 1000 }
 * });
 *
 * // Create a family member
 * const member = await api.members.createMember({
 *   name: 'John',
 *   email: 'john@example.com',
 *   role: 'admin'
 * });
 *
 * // Create a vault item
 * const item = await api.vault.createFamilyItem({
 *   type: 'document',
 *   title: 'Important Document',
 *   content: 'Contents here...',
 *   tags: ['important', 'legal'],
 *   createdBy: member.id
 * });
 *
 * // Search the vault
 * const results = await api.vault.searchVault('document', {
 *   type: ['document'],
 *   minImportance: 0.5
 * });
 * ```
 */
export function createFamilyAPI(config: FamilyAPIConfig = {}): FamilyAPI {
  return {
    vault: new FamilyVault(config.vault),
    members: new FamilyMembers(config.members),
  };
}

// ============================================================================
// API VERSION
// ============================================================================

/**
 * API version information
 */
export const API_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  },
};
