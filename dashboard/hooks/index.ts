/**
 * Hooks Index
 *
 * Re-exports all custom hooks for easy importing.
 *
 * @module hooks
 */

// Vault hooks
export {
  useVault,
  useVaultItem,
  useVaultStats,
  type UseVaultState,
  type UseVaultActions,
  type UseVaultReturn,
} from './use-vault';

// Family hooks
export {
  useFamily,
  useFamilyMember,
  useFamilyStats,
  usePresence,
  useFamilyFilter,
  type UseFamilyState,
  type UseFamilyActions,
  type UseFamilyReturn,
} from './use-family';

// Profile hooks
export {
  useProfile,
  useProfilesByCategory,
  useProfileStats,
  getAllCategories,
  CATEGORY_METADATA,
  type PersonalProfile,
  type ProfileCategory,
  type CreateProfileInput,
  type UpdateProfileInput,
  type ProfileSearchFilters,
  type ProfileSearchResult,
  type ProfileStats,
  type UseProfileState,
  type UseProfileActions,
  type UseProfileReturn,
} from './use-profile';

// Claude hooks
export {
  useClaude,
  useQuickAsk,
  useClaudeStats,
  useClaudeTask,
  type UseClaudeState,
  type UseClaudeActions,
  type UseClaudeReturn,
} from './use-claude';

// Celebration hooks
export {
  useCelebrations,
  useCelebrationClick,
  type CelebrationType,
} from './use-celebrations';
