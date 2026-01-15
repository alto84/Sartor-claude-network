import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useProfile,
  useProfilesByCategory,
  useProfileStats,
  CATEGORY_METADATA,
  getAllCategories,
  type ProfileCategory,
  type PersonalProfile,
  type ProfileSearchResult,
  type ProfileStats,
} from '../use-profile';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('useProfile Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('CATEGORY_METADATA', () => {
    it('contains all expected categories', () => {
      const expectedCategories: ProfileCategory[] = [
        'bio', 'work', 'health', 'preferences', 'contacts', 'goals',
        'history', 'education', 'financial', 'family', 'hobbies', 'routines', 'notes'
      ];

      expectedCategories.forEach(category => {
        expect(CATEGORY_METADATA).toHaveProperty(category);
      });
    });

    it('each category has required metadata fields', () => {
      Object.values(CATEGORY_METADATA).forEach(metadata => {
        expect(metadata).toHaveProperty('label');
        expect(metadata).toHaveProperty('description');
        expect(metadata).toHaveProperty('icon');
        expect(metadata).toHaveProperty('color');
        expect(metadata).toHaveProperty('defaultPrivate');
        expect(metadata).toHaveProperty('examples');
        expect(Array.isArray(metadata.examples)).toBe(true);
      });
    });

    it('health and financial are private by default', () => {
      expect(CATEGORY_METADATA.health.defaultPrivate).toBe(true);
      expect(CATEGORY_METADATA.financial.defaultPrivate).toBe(true);
    });

    it('most categories are not private by default', () => {
      expect(CATEGORY_METADATA.bio.defaultPrivate).toBe(false);
      expect(CATEGORY_METADATA.work.defaultPrivate).toBe(false);
      expect(CATEGORY_METADATA.preferences.defaultPrivate).toBe(false);
    });
  });

  describe('getAllCategories', () => {
    it('returns all category keys', () => {
      const categories = getAllCategories();

      expect(categories).toContain('bio');
      expect(categories).toContain('work');
      expect(categories).toContain('health');
      expect(categories).toContain('preferences');
      expect(categories).toContain('contacts');
      expect(categories).toContain('goals');
      expect(categories).toContain('history');
      expect(categories).toContain('education');
      expect(categories).toContain('financial');
      expect(categories).toContain('family');
      expect(categories).toContain('hobbies');
      expect(categories).toContain('routines');
      expect(categories).toContain('notes');
    });

    it('returns 13 categories', () => {
      const categories = getAllCategories();
      expect(categories.length).toBe(13);
    });
  });

  describe('useProfile hook', () => {
    const mockProfilesResponse: ProfileSearchResult = {
      profiles: [
        {
          id: '1',
          memberId: 'alton',
          category: 'preferences',
          title: 'Coffee Order',
          content: 'Large cold brew with oat milk',
          importance: 0.7,
          private: false,
          tags: ['food', 'daily'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          source: 'user',
        },
      ],
      total: 1,
      hasMore: false,
    };

    it('returns initial state correctly', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfilesResponse,
      } as Response);

      const { result } = renderHook(() => useProfile(undefined, false));

      expect(result.current.profiles).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.stats).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('exposes all expected action functions', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfilesResponse,
      } as Response);

      const { result } = renderHook(() => useProfile(undefined, false));

      expect(typeof result.current.fetchItems).toBe('function');
      expect(typeof result.current.getItem).toBe('function');
      expect(typeof result.current.createItem).toBe('function');
      expect(typeof result.current.updateItem).toBe('function');
      expect(typeof result.current.deleteItem).toBe('function');
      expect(typeof result.current.fetchStats).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });

    it('fetches profiles automatically when autoFetch is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfilesResponse,
      } as Response);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(result.current.profiles).toHaveLength(1);
    });

    it('does not fetch profiles when autoFetch is false', () => {
      const { result } = renderHook(() => useProfile(undefined, false));

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.profiles).toHaveLength(0);
    });

    it('fetchItems updates profiles state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfilesResponse,
      } as Response);

      const { result } = renderHook(() => useProfile(undefined, false));

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.profiles[0].title).toBe('Coffee Order');
    });

    it('createItem adds new profile to state', async () => {
      const newProfile: PersonalProfile = {
        id: '2',
        memberId: 'alton',
        category: 'work',
        title: 'Job Title',
        content: 'Software Engineer',
        importance: 0.8,
        private: false,
        tags: ['career'],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        source: 'user',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newProfile,
      } as Response);

      const { result } = renderHook(() => useProfile(undefined, false));

      await act(async () => {
        await result.current.createItem({
          memberId: 'alton',
          category: 'work',
          title: 'Job Title',
          content: 'Software Engineer',
        });
      });

      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.profiles[0].title).toBe('Job Title');
    });

    it('clearError resets error state', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useProfile(undefined, false));

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('handles fetch error correctly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProfile(undefined, false));

      await act(async () => {
        await result.current.fetchItems();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.profiles).toHaveLength(0);
    });
  });

  describe('useProfilesByCategory', () => {
    it('uses category filter in fetch', async () => {
      const mockResponse: ProfileSearchResult = {
        profiles: [],
        total: 0,
        hasMore: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderHook(() => useProfilesByCategory('work', 'alton'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchUrl = mockFetch.mock.calls[0][0] as string;
      expect(fetchUrl).toContain('category=work');
      expect(fetchUrl).toContain('memberId=alton');
    });
  });

  describe('useProfileStats', () => {
    const mockStats: ProfileStats = {
      totalProfiles: 50,
      byCategory: {
        bio: 5,
        work: 10,
        health: 3,
        preferences: 8,
        contacts: 5,
        goals: 4,
        history: 3,
        education: 2,
        financial: 2,
        family: 4,
        hobbies: 2,
        routines: 1,
        notes: 1,
      },
      byMember: {
        alton: 30,
        spouse: 20,
      },
      recentlyAdded: 5,
      highImportance: 10,
      privateCount: 8,
    };

    it('fetches stats on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response);

      const { result } = renderHook(() => useProfileStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
    });

    it('provides refetch function', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStats,
      } as Response);

      const { result } = renderHook(() => useProfileStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('handles error state', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Stats error'));

      const { result } = renderHook(() => useProfileStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Stats error');
      expect(result.current.stats).toBeNull();
    });
  });
});
