/**
 * useVault Hook
 *
 * React hook for family vault operations. Provides easy access to
 * create, read, update, delete, and search vault items.
 *
 * @module hooks/use-vault
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  sartorApi,
  FamilyItem,
  CreateVaultItemInput,
  UpdateVaultItemInput,
  VaultSearchFilters,
  VaultSearchResult,
  VaultStats,
} from '../lib/sartor-api';

// ============================================================================
// TYPES
// ============================================================================

export interface UseVaultState {
  items: FamilyItem[];
  total: number;
  hasMore: boolean;
  stats: VaultStats | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
}

export interface UseVaultActions {
  /** Fetch all vault items with optional filters */
  fetchItems: (filters?: VaultSearchFilters) => Promise<void>;
  /** Search vault items */
  search: (query: string, filters?: VaultSearchFilters, limit?: number, offset?: number) => Promise<void>;
  /** Get a single item by ID */
  getItem: (id: string) => Promise<FamilyItem | null>;
  /** Create a new vault item */
  createItem: (input: CreateVaultItemInput) => Promise<FamilyItem | null>;
  /** Update an existing vault item */
  updateItem: (id: string, updates: UpdateVaultItemInput) => Promise<FamilyItem | null>;
  /** Delete a vault item (soft delete) */
  deleteItem: (id: string, deletedBy: string) => Promise<boolean>;
  /** Fetch vault statistics */
  fetchStats: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Refresh items (re-fetch with current filters) */
  refresh: () => Promise<void>;
}

export type UseVaultReturn = UseVaultState & UseVaultActions;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing family vault operations
 *
 * @param initialFilters - Optional initial filters to apply
 * @param autoFetch - Whether to automatically fetch items on mount (default: true)
 * @returns State and actions for vault operations
 *
 * @example
 * ```tsx
 * const {
 *   items,
 *   isLoading,
 *   error,
 *   createItem,
 *   deleteItem,
 *   search
 * } = useVault();
 *
 * // Create a new item
 * const newItem = await createItem({
 *   type: 'document',
 *   title: 'Important Doc',
 *   content: 'Contents...',
 *   createdBy: 'user-id',
 *   tags: ['important']
 * });
 *
 * // Search items
 * await search('budget', { type: ['document'] });
 * ```
 */
export function useVault(
  initialFilters?: VaultSearchFilters,
  autoFetch: boolean = true
): UseVaultReturn {
  // State
  const [items, setItems] = useState<FamilyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<VaultSearchFilters | undefined>(initialFilters);

  // Fetch items
  const fetchItems = useCallback(async (filters?: VaultSearchFilters) => {
    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const response = await sartorApi.getVaultItems(filters);
      if (response.success && response.data) {
        setItems(response.data.items);
        setTotal(response.data.total);
        setHasMore(response.data.hasMore);
      } else {
        setError(response.error || 'Failed to fetch items');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search items
  const search = useCallback(async (
    query: string,
    filters?: VaultSearchFilters,
    limit?: number,
    offset?: number
  ) => {
    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const response = await sartorApi.searchVault(query, filters, limit, offset);
      if (response.success && response.data) {
        setItems(response.data.items);
        setTotal(response.data.total);
        setHasMore(response.data.hasMore);
      } else {
        setError(response.error || 'Failed to search items');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get single item
  const getItem = useCallback(async (id: string): Promise<FamilyItem | null> => {
    try {
      const response = await sartorApi.getVaultItem(id);
      if (response.success && response.data) {
        return response.data;
      }
      setError(response.error || 'Failed to get item');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Create item
  const createItem = useCallback(async (input: CreateVaultItemInput): Promise<FamilyItem | null> => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await sartorApi.createVaultItem(input);
      if (response.success && response.data) {
        // Add to local state
        setItems(prev => [response.data!, ...prev]);
        setTotal(prev => prev + 1);
        return response.data;
      }
      setError(response.error || 'Failed to create item');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Update item
  const updateItem = useCallback(async (
    id: string,
    updates: UpdateVaultItemInput
  ): Promise<FamilyItem | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await sartorApi.updateVaultItem(id, updates);
      if (response.success && response.data) {
        // Update local state
        setItems(prev => prev.map(item =>
          item.id === id ? response.data! : item
        ));
        return response.data;
      }
      setError(response.error || 'Failed to update item');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Delete item
  const deleteItem = useCallback(async (id: string, deletedBy: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await sartorApi.deleteVaultItem(id, deletedBy);
      if (response.success) {
        // Remove from local state
        setItems(prev => prev.filter(item => item.id !== id));
        setTotal(prev => prev - 1);
        return true;
      }
      setError(response.error || 'Failed to delete item');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await sartorApi.getVaultStats();
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
    items,
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
    search,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    fetchStats,
    clearError,
    refresh,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for fetching a single vault item
 */
export function useVaultItem(id: string | null) {
  const [item, setItem] = useState<FamilyItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await sartorApi.getVaultItem(id);
      if (response.success && response.data) {
        setItem(response.data);
      } else {
        setError(response.error || 'Failed to fetch item');
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
      setItem(null);
    }
  }, [id, fetch]);

  return { item, isLoading, error, refetch: fetch };
}

/**
 * Hook for vault statistics
 */
export function useVaultStats() {
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sartorApi.getVaultStats();
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
