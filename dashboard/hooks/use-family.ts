/**
 * useFamily Hook
 *
 * React hook for family member operations. Provides easy access to
 * create, read, update, and delete family members, as well as
 * presence tracking.
 *
 * @module hooks/use-family
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  sartorApi,
  FamilyMember,
  CreateMemberInput,
  UpdateMemberInput,
  FamilyRole,
  PresenceStatus,
  FamilyStats,
} from '../lib/sartor-api';

// ============================================================================
// TYPES
// ============================================================================

export interface UseFamilyState {
  members: FamilyMember[];
  stats: FamilyStats | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
}

export interface UseFamilyActions {
  /** Fetch all family members */
  fetchMembers: () => Promise<void>;
  /** Get a single member by ID */
  getMember: (id: string) => Promise<FamilyMember | null>;
  /** Get a member by email */
  getMemberByEmail: (email: string) => Promise<FamilyMember | null>;
  /** Get members by role */
  getMembersByRole: (role: FamilyRole) => Promise<FamilyMember[]>;
  /** Get online members */
  getOnlineMembers: () => Promise<FamilyMember[]>;
  /** Create a new family member */
  createMember: (input: CreateMemberInput) => Promise<FamilyMember | null>;
  /** Update an existing family member */
  updateMember: (id: string, updates: UpdateMemberInput) => Promise<FamilyMember | null>;
  /** Delete a family member */
  deleteMember: (id: string) => Promise<boolean>;
  /** Update member presence */
  updatePresence: (id: string, status: PresenceStatus) => Promise<boolean>;
  /** Fetch family statistics */
  fetchStats: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Refresh members list */
  refresh: () => Promise<void>;
}

export type UseFamilyReturn = UseFamilyState & UseFamilyActions;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing family member operations
 *
 * @param autoFetch - Whether to automatically fetch members on mount (default: true)
 * @returns State and actions for family operations
 *
 * @example
 * ```tsx
 * const {
 *   members,
 *   isLoading,
 *   error,
 *   createMember,
 *   deleteMember,
 *   updatePresence
 * } = useFamily();
 *
 * // Create a new member
 * const newMember = await createMember({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'member'
 * });
 *
 * // Update presence
 * await updatePresence(newMember.id, 'online');
 * ```
 */
export function useFamily(autoFetch: boolean = true): UseFamilyReturn {
  // State
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all members
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sartorApi.getFamilyMembers();
      if (response.success && response.data) {
        setMembers(response.data);
      } else {
        setError(response.error || 'Failed to fetch members');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get single member
  const getMember = useCallback(async (id: string): Promise<FamilyMember | null> => {
    try {
      const response = await sartorApi.getFamilyMember(id);
      if (response.success && response.data) {
        return response.data;
      }
      setError(response.error || 'Failed to get member');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Get member by email
  const getMemberByEmail = useCallback(async (email: string): Promise<FamilyMember | null> => {
    try {
      const response = await sartorApi.getFamilyMemberByEmail(email);
      if (response.success && response.data) {
        return response.data;
      }
      // Don't set error for not found - it's a valid response
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Get members by role
  const getMembersByRole = useCallback(async (role: FamilyRole): Promise<FamilyMember[]> => {
    try {
      const response = await sartorApi.getMembersByRole(role);
      if (response.success && response.data) {
        return response.data;
      }
      setError(response.error || 'Failed to get members by role');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, []);

  // Get online members
  const getOnlineMembers = useCallback(async (): Promise<FamilyMember[]> => {
    try {
      const response = await sartorApi.getOnlineMembers();
      if (response.success && response.data) {
        return response.data;
      }
      setError(response.error || 'Failed to get online members');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, []);

  // Create member
  const createMember = useCallback(async (input: CreateMemberInput): Promise<FamilyMember | null> => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await sartorApi.createFamilyMember(input);
      if (response.success && response.data) {
        // Add to local state
        setMembers(prev => [...prev, response.data!]);
        return response.data;
      }
      setError(response.error || 'Failed to create member');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Update member
  const updateMember = useCallback(async (
    id: string,
    updates: UpdateMemberInput
  ): Promise<FamilyMember | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await sartorApi.updateFamilyMember(id, updates);
      if (response.success && response.data) {
        // Update local state
        setMembers(prev => prev.map(member =>
          member.id === id ? response.data! : member
        ));
        return response.data;
      }
      setError(response.error || 'Failed to update member');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Delete member
  const deleteMember = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await sartorApi.deleteFamilyMember(id);
      if (response.success) {
        // Remove from local state
        setMembers(prev => prev.filter(member => member.id !== id));
        return true;
      }
      setError(response.error || 'Failed to delete member');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Update presence
  const updatePresence = useCallback(async (id: string, status: PresenceStatus): Promise<boolean> => {
    try {
      const response = await sartorApi.updatePresence(id, status);
      if (response.success) {
        // Update local state
        setMembers(prev => prev.map(member =>
          member.id === id ? { ...member, presence: status } : member
        ));
        return true;
      }
      setError(response.error || 'Failed to update presence');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await sartorApi.getFamilyStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to fetch stats');
      }
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
    await fetchMembers();
  }, [fetchMembers]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchMembers();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    members,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    // Actions
    fetchMembers,
    getMember,
    getMemberByEmail,
    getMembersByRole,
    getOnlineMembers,
    createMember,
    updateMember,
    deleteMember,
    updatePresence,
    fetchStats,
    clearError,
    refresh,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for fetching a single family member
 */
export function useFamilyMember(id: string | null) {
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await sartorApi.getFamilyMember(id);
      if (response.success && response.data) {
        setMember(response.data);
      } else {
        setError(response.error || 'Failed to fetch member');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetch();
    } else {
      setMember(null);
    }
  }, [id, fetch]);

  return { member, isLoading, error, refetch: fetch };
}

/**
 * Hook for family statistics
 */
export function useFamilyStats() {
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sartorApi.getFamilyStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to fetch stats');
      }
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

/**
 * Hook for current user's presence management
 */
export function usePresence(memberId: string | null) {
  const [presence, setPresence] = useState<PresenceStatus>('offline');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (status: PresenceStatus) => {
    if (!memberId) return false;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await sartorApi.updatePresence(memberId, status);
      if (response.success) {
        setPresence(status);
        return true;
      }
      setError(response.error || 'Failed to update presence');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [memberId]);

  const goOnline = useCallback(() => updateStatus('online'), [updateStatus]);
  const goAway = useCallback(() => updateStatus('away'), [updateStatus]);
  const goOffline = useCallback(() => updateStatus('offline'), [updateStatus]);

  return {
    presence,
    isUpdating,
    error,
    updateStatus,
    goOnline,
    goAway,
    goOffline,
  };
}

/**
 * Hook for filtering family members
 */
export function useFamilyFilter() {
  const { members, isLoading, error } = useFamily();

  const admins = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role === 'member');
  const children = members.filter(m => m.role === 'child');
  const onlineMembers = members.filter(m => m.presence === 'online');
  const awayMembers = members.filter(m => m.presence === 'away');
  const offlineMembers = members.filter(m => m.presence === 'offline');

  return {
    all: members,
    admins,
    members: regularMembers,
    children,
    online: onlineMembers,
    away: awayMembers,
    offline: offlineMembers,
    isLoading,
    error,
  };
}
