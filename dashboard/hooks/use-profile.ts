/**
 * useProfile Hook
 *
 * React hook for personal profile operations. Provides easy access to
 * create, read, update, delete, and search personal profile entries.
 *
 * @module hooks/use-profile
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ProfileCategory =
  | 'bio' | 'work' | 'health' | 'preferences' | 'contacts' | 'goals'
  | 'history' | 'education' | 'financial' | 'family' | 'hobbies' | 'routines' | 'notes';

export interface PersonalProfile {
  id: string;
  memberId: string;
  category: ProfileCategory;
  title: string;
  content: string;
  structured?: Record<string, unknown>;
  importance: number;
  private: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source?: 'user' | 'claude' | 'import';
  verified?: boolean;
  expiresAt?: string;
}

export interface CreateProfileInput {
  memberId: string;
  category: ProfileCategory;
  title: string;
  content: string;
  structured?: Record<string, unknown>;
  importance?: number;
  private?: boolean;
  tags?: string[];
  source?: 'user' | 'claude' | 'import';
  expiresAt?: string;
}

export interface UpdateProfileInput {
  category?: ProfileCategory;
  title?: string;
  content?: string;
  structured?: Record<string, unknown>;
  importance?: number;
  private?: boolean;
  tags?: string[];
  verified?: boolean;
  expiresAt?: string;
}

export interface ProfileSearchFilters {
  memberId?: string;
  category?: ProfileCategory[];
  tags?: string[];
  minImportance?: number;
  private?: boolean;
  search?: string;
  sortBy?: 'importance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ProfileSearchResult {
  profiles: PersonalProfile[];
  total: number;
  hasMore: boolean;
}

export interface ProfileStats {
  totalProfiles: number;
  byCategory: Record<ProfileCategory, number>;
  byMember: Record<string, number>;
  recentlyAdded: number;
  highImportance: number;
  privateCount: number;
}

// ============================================================================
// CATEGORY METADATA
// ============================================================================

export const CATEGORY_METADATA: Record<ProfileCategory, {
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultPrivate: boolean;
  examples: string[];
}> = {
  bio: {
    label: 'Biography',
    description: 'Personal background and identity information',
    icon: 'User',
    color: 'blue',
    defaultPrivate: false,
    examples: ['Full name', 'Nickname', 'Birthdate', 'Hometown', 'Languages spoken'],
  },
  work: {
    label: 'Work',
    description: 'Career and professional information',
    icon: 'Briefcase',
    color: 'slate',
    defaultPrivate: false,
    examples: ['Job title', 'Employer', 'Work schedule', 'Skills', 'Projects'],
  },
  health: {
    label: 'Health',
    description: 'Medical and health-related information',
    icon: 'Heart',
    color: 'red',
    defaultPrivate: true,
    examples: ['Allergies', 'Medications', 'Doctor contacts', 'Medical conditions'],
  },
  preferences: {
    label: 'Preferences',
    description: 'Personal likes, dislikes, and preferences',
    icon: 'Settings',
    color: 'purple',
    defaultPrivate: false,
    examples: ['Favorite foods', 'Coffee order', 'Music taste', 'Communication style'],
  },
  contacts: {
    label: 'Contacts',
    description: 'Important people and relationships',
    icon: 'Users',
    color: 'green',
    defaultPrivate: false,
    examples: ['Emergency contacts', 'Best friends', 'Mentors', 'Service providers'],
  },
  goals: {
    label: 'Goals',
    description: 'Personal and professional goals',
    icon: 'Target',
    color: 'orange',
    defaultPrivate: false,
    examples: ['Career goals', 'Fitness goals', 'Learning goals', 'Family goals'],
  },
  history: {
    label: 'History',
    description: 'Life events and milestones',
    icon: 'Clock',
    color: 'amber',
    defaultPrivate: false,
    examples: ['Places lived', 'Major life events', 'Travel history', 'Achievements'],
  },
  education: {
    label: 'Education',
    description: 'Educational background and certifications',
    icon: 'GraduationCap',
    color: 'indigo',
    defaultPrivate: false,
    examples: ['Degrees', 'Schools attended', 'Certifications', 'Courses taken'],
  },
  financial: {
    label: 'Financial',
    description: 'Financial information (sensitive)',
    icon: 'DollarSign',
    color: 'emerald',
    defaultPrivate: true,
    examples: ['Budget notes', 'Financial goals', 'Subscriptions', 'Account reminders'],
  },
  family: {
    label: 'Family',
    description: 'Family relationships and information',
    icon: 'Home',
    color: 'pink',
    defaultPrivate: false,
    examples: ['Family tree', 'Anniversaries', 'Family traditions', 'Pet information'],
  },
  hobbies: {
    label: 'Hobbies',
    description: 'Interests and recreational activities',
    icon: 'Palette',
    color: 'cyan',
    defaultPrivate: false,
    examples: ['Sports', 'Games', 'Collections', 'Creative pursuits'],
  },
  routines: {
    label: 'Routines',
    description: 'Daily routines and habits',
    icon: 'Calendar',
    color: 'teal',
    defaultPrivate: false,
    examples: ['Morning routine', 'Exercise schedule', 'Meal times', 'Sleep schedule'],
  },
  notes: {
    label: 'Notes',
    description: 'General notes and miscellaneous information',
    icon: 'StickyNote',
    color: 'yellow',
    defaultPrivate: false,
    examples: ['Random thoughts', 'Things to remember', 'Temporary notes'],
  },
};

export function getAllCategories(): ProfileCategory[] {
  return Object.keys(CATEGORY_METADATA) as ProfileCategory[];
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchProfiles(
  filters?: ProfileSearchFilters,
  limit?: number,
  offset?: number
): Promise<ProfileSearchResult> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.memberId) params.set('memberId', filters.memberId);
    if (filters.category && filters.category.length > 0) {
      params.set('category', filters.category.join(','));
    }
    if (filters.tags && filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }
    if (filters.minImportance !== undefined) {
      params.set('minImportance', String(filters.minImportance));
    }
    if (filters.private !== undefined) {
      params.set('private', String(filters.private));
    }
    if (filters.search) params.set('q', filters.search);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  }

  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));

  const query = params.toString();
  const response = await fetch(`/api/profile${query ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error('Failed to fetch profiles');
  }

  return response.json();
}

async function fetchProfileById(id: string): Promise<PersonalProfile> {
  const response = await fetch(`/api/profile?id=${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

async function createProfileApi(input: CreateProfileInput): Promise<PersonalProfile> {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create profile');
  }

  return response.json();
}

async function updateProfileApi(id: string, updates: UpdateProfileInput): Promise<PersonalProfile> {
  const response = await fetch(`/api/profile?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return response.json();
}

async function deleteProfileApi(id: string): Promise<void> {
  const response = await fetch(`/api/profile?id=${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete profile');
  }
}

async function fetchProfileStats(): Promise<ProfileStats> {
  const response = await fetch('/api/profile?stats=true');

  if (!response.ok) {
    throw new Error('Failed to fetch profile stats');
  }

  return response.json();
}

// ============================================================================
// HOOK STATE & ACTIONS
// ============================================================================

export interface UseProfileState {
  profiles: PersonalProfile[];
  total: number;
  hasMore: boolean;
  stats: ProfileStats | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
}

export interface UseProfileActions {
  /** Fetch profiles with optional filters */
  fetchItems: (filters?: ProfileSearchFilters, limit?: number, offset?: number) => Promise<void>;
  /** Get a single profile by ID */
  getItem: (id: string) => Promise<PersonalProfile | null>;
  /** Create a new profile */
  createItem: (input: CreateProfileInput) => Promise<PersonalProfile | null>;
  /** Update an existing profile */
  updateItem: (id: string, updates: UpdateProfileInput) => Promise<PersonalProfile | null>;
  /** Delete a profile */
  deleteItem: (id: string) => Promise<boolean>;
  /** Fetch profile statistics */
  fetchStats: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Refresh profiles (re-fetch with current filters) */
  refresh: () => Promise<void>;
}

export type UseProfileReturn = UseProfileState & UseProfileActions;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing personal profile operations
 *
 * @param initialFilters - Optional initial filters to apply
 * @param autoFetch - Whether to automatically fetch profiles on mount (default: true)
 * @returns State and actions for profile operations
 *
 * @example
 * ```tsx
 * const {
 *   profiles,
 *   isLoading,
 *   error,
 *   createItem,
 *   deleteItem,
 * } = useProfile({ memberId: 'alton' });
 *
 * // Create a new profile entry
 * const newProfile = await createItem({
 *   memberId: 'alton',
 *   category: 'preferences',
 *   title: 'Coffee Order',
 *   content: 'Large cold brew with oat milk',
 *   importance: 0.7,
 * });
 * ```
 */
export function useProfile(
  initialFilters?: ProfileSearchFilters,
  autoFetch: boolean = true
): UseProfileReturn {
  // State
  const [profiles, setProfiles] = useState<PersonalProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ProfileSearchFilters | undefined>(initialFilters);

  // Fetch profiles
  const fetchItems = useCallback(async (
    filters?: ProfileSearchFilters,
    limit?: number,
    offset?: number
  ) => {
    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const result = await fetchProfiles(filters, limit, offset);
      setProfiles(result.profiles);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get single profile
  const getItem = useCallback(async (id: string): Promise<PersonalProfile | null> => {
    try {
      return await fetchProfileById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Create profile
  const createItem = useCallback(async (input: CreateProfileInput): Promise<PersonalProfile | null> => {
    setIsCreating(true);
    setError(null);

    try {
      const newProfile = await createProfileApi(input);
      // Add to local state
      setProfiles(prev => [newProfile, ...prev]);
      setTotal(prev => prev + 1);
      return newProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Update profile
  const updateItem = useCallback(async (
    id: string,
    updates: UpdateProfileInput
  ): Promise<PersonalProfile | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const updated = await updateProfileApi(id, updates);
      // Update local state
      setProfiles(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Delete profile
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteProfileApi(id);
      // Remove from local state
      setProfiles(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Fetch stats
  const fetchStatsAction = useCallback(async () => {
    try {
      const result = await fetchProfileStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchItems(currentFilters);
  }, [fetchItems, currentFilters]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchItems(initialFilters);
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    profiles,
    total,
    hasMore,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    // Actions
    fetchItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    fetchStats: fetchStatsAction,
    clearError,
    refresh,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for fetching profiles by category
 */
export function useProfilesByCategory(
  category: ProfileCategory,
  memberId?: string,
  autoFetch: boolean = true
) {
  return useProfile(
    { category: [category], memberId },
    autoFetch
  );
}

/**
 * Hook for profile statistics
 */
export function useProfileStats() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchProfileStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, isLoading, error, refetch: fetch };
}
