/**
 * Sartor API Client Library
 *
 * Provides typed client functions for interacting with the Sartor memory system
 * through the dashboard API routes. This library is designed to be used in React
 * components and hooks.
 *
 * @module lib/sartor-api
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types of items that can be stored in the family vault
 */
export type FamilyItemType = 'document' | 'link' | 'note' | 'contact' | 'credential';

/**
 * A family vault item
 */
export interface FamilyItem {
  id: string;
  type: FamilyItemType;
  title: string;
  content: string;
  url?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  importance: number;
  encrypted?: boolean;
  metadata?: {
    category?: string;
    expiresAt?: string;
    reminderAt?: string;
    attachments?: string[];
    sharedWith?: string[];
  };
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

/**
 * Input for creating a vault item
 */
export interface CreateVaultItemInput {
  type: FamilyItemType;
  title: string;
  content: string;
  url?: string;
  tags?: string[];
  createdBy: string;
  importance?: number;
  encrypted?: boolean;
  metadata?: {
    category?: string;
    expiresAt?: string;
    reminderAt?: string;
    attachments?: string[];
    sharedWith?: string[];
  };
}

/**
 * Input for updating a vault item
 */
export interface UpdateVaultItemInput {
  type?: FamilyItemType;
  title?: string;
  content?: string;
  url?: string;
  tags?: string[];
  importance?: number;
  encrypted?: boolean;
  metadata?: {
    category?: string;
    expiresAt?: string;
    reminderAt?: string;
    attachments?: string[];
    sharedWith?: string[];
  };
}

/**
 * Search filters for vault queries
 */
export interface VaultSearchFilters {
  type?: FamilyItemType[];
  tags?: string[];
  createdBy?: string;
  minImportance?: number;
  maxImportance?: number;
  startDate?: string;
  endDate?: string;
  includeDeleted?: boolean;
}

/**
 * Result from a vault search
 */
export interface VaultSearchResult {
  items: FamilyItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Vault statistics
 */
export interface VaultStats {
  totalItems: number;
  byType: Record<FamilyItemType, number>;
  byMember: Record<string, number>;
  recentlyAdded: number;
  highImportance: number;
  storage: 'firebase' | 'firestore' | 'file';
}

/**
 * Role of a family member
 */
export type FamilyRole = 'admin' | 'member' | 'child';

/**
 * Member presence status
 */
export type PresenceStatus = 'online' | 'away' | 'offline';

/**
 * Member preferences
 */
export interface MemberPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';
  notifications?: {
    email?: boolean;
    push?: boolean;
    calendarReminders?: boolean;
    taskReminders?: boolean;
    dailyDigest?: boolean;
  };
  dashboard?: {
    defaultView?: 'day' | 'week' | 'month';
    showWeather?: boolean;
    showCalendar?: boolean;
    showTasks?: boolean;
    showFinance?: boolean;
    showHealth?: boolean;
  };
  privacy?: {
    shareCalendar?: boolean;
    shareLocation?: boolean;
    shareHealth?: boolean;
  };
  custom?: Record<string, unknown>;
}

/**
 * A family member
 */
export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  email: string;
  avatar?: string;
  preferences: MemberPreferences;
  nickname?: string;
  birthday?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
  presence?: PresenceStatus;
  features?: {
    canAccessFinance?: boolean;
    canControlHome?: boolean;
    canSendEmail?: boolean;
    healthTrackingEnabled?: boolean;
  };
}

/**
 * Input for creating a family member
 */
export interface CreateMemberInput {
  name: string;
  email: string;
  role: FamilyRole;
  avatar?: string;
  nickname?: string;
  birthday?: string;
  phone?: string;
  preferences?: Partial<MemberPreferences>;
}

/**
 * Input for updating a family member
 */
export interface UpdateMemberInput {
  name?: string;
  email?: string;
  role?: FamilyRole;
  avatar?: string;
  nickname?: string;
  birthday?: string;
  phone?: string;
  preferences?: Partial<MemberPreferences>;
  features?: FamilyMember['features'];
}

/**
 * Family statistics
 */
export interface FamilyStats {
  totalMembers: number;
  byRole: Record<FamilyRole, number>;
  online: number;
  away: number;
  offline: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

/**
 * Configuration for the Sartor API client
 */
export interface SartorApiConfig {
  baseUrl?: string;
}

/**
 * Sartor API Client
 *
 * Provides methods for interacting with the Sartor memory system APIs
 */
export class SartorApi {
  private baseUrl: string;

  constructor(config: SartorApiConfig = {}) {
    this.baseUrl = config.baseUrl || '';
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json() as T & { error?: string };

      if (!response.ok) {
        return {
          success: false,
          error: (data as { error?: string }).error || `HTTP error ${response.status}`,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // VAULT OPERATIONS
  // ============================================================================

  /**
   * Get all vault items
   */
  async getVaultItems(filters?: VaultSearchFilters): Promise<ApiResponse<VaultSearchResult>> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.type) params.set('type', filters.type.join(','));
      if (filters.tags) params.set('tags', filters.tags.join(','));
      if (filters.createdBy) params.set('createdBy', filters.createdBy);
      if (filters.minImportance !== undefined) params.set('minImportance', String(filters.minImportance));
      if (filters.maxImportance !== undefined) params.set('maxImportance', String(filters.maxImportance));
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.includeDeleted) params.set('includeDeleted', 'true');
    }
    const query = params.toString();
    return this.request<VaultSearchResult>(`/api/vault${query ? `?${query}` : ''}`);
  }

  /**
   * Search the vault
   */
  async searchVault(
    query: string,
    filters?: VaultSearchFilters,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<VaultSearchResult>> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters) {
      if (filters.type) params.set('type', filters.type.join(','));
      if (filters.tags) params.set('tags', filters.tags.join(','));
      if (filters.createdBy) params.set('createdBy', filters.createdBy);
      if (filters.minImportance !== undefined) params.set('minImportance', String(filters.minImportance));
      if (filters.maxImportance !== undefined) params.set('maxImportance', String(filters.maxImportance));
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.includeDeleted) params.set('includeDeleted', 'true');
    }
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    return this.request<VaultSearchResult>(`/api/vault?${params.toString()}`);
  }

  /**
   * Get a single vault item by ID
   */
  async getVaultItem(id: string): Promise<ApiResponse<FamilyItem>> {
    return this.request<FamilyItem>(`/api/vault/${id}`);
  }

  /**
   * Create a new vault item
   */
  async createVaultItem(input: CreateVaultItemInput): Promise<ApiResponse<FamilyItem>> {
    return this.request<FamilyItem>('/api/vault', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update a vault item
   */
  async updateVaultItem(id: string, updates: UpdateVaultItemInput): Promise<ApiResponse<FamilyItem>> {
    return this.request<FamilyItem>(`/api/vault/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a vault item (soft delete)
   */
  async deleteVaultItem(id: string, deletedBy: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/api/vault/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ deletedBy }),
    });
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(): Promise<ApiResponse<VaultStats>> {
    return this.request<VaultStats>('/api/vault?stats=true');
  }

  // ============================================================================
  // FAMILY MEMBER OPERATIONS
  // ============================================================================

  /**
   * Get all family members
   */
  async getFamilyMembers(): Promise<ApiResponse<FamilyMember[]>> {
    return this.request<FamilyMember[]>('/api/family');
  }

  /**
   * Get a single family member by ID
   */
  async getFamilyMember(id: string): Promise<ApiResponse<FamilyMember>> {
    return this.request<FamilyMember>(`/api/family/${id}`);
  }

  /**
   * Get a family member by email
   */
  async getFamilyMemberByEmail(email: string): Promise<ApiResponse<FamilyMember>> {
    return this.request<FamilyMember>(`/api/family?email=${encodeURIComponent(email)}`);
  }

  /**
   * Create a new family member
   */
  async createFamilyMember(input: CreateMemberInput): Promise<ApiResponse<FamilyMember>> {
    return this.request<FamilyMember>('/api/family', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update a family member
   */
  async updateFamilyMember(id: string, updates: UpdateMemberInput): Promise<ApiResponse<FamilyMember>> {
    return this.request<FamilyMember>(`/api/family/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a family member
   */
  async deleteFamilyMember(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/api/family/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update member presence
   */
  async updatePresence(id: string, status: PresenceStatus): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/family/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ presence: status }),
    });
  }

  /**
   * Get family statistics
   */
  async getFamilyStats(): Promise<ApiResponse<FamilyStats>> {
    return this.request<FamilyStats>('/api/family?stats=true');
  }

  /**
   * Get members by role
   */
  async getMembersByRole(role: FamilyRole): Promise<ApiResponse<FamilyMember[]>> {
    return this.request<FamilyMember[]>(`/api/family?role=${role}`);
  }

  /**
   * Get online members
   */
  async getOnlineMembers(): Promise<ApiResponse<FamilyMember[]>> {
    return this.request<FamilyMember[]>('/api/family?presence=online');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default API client instance
 */
export const sartorApi = new SartorApi();

/**
 * Create a new API client with custom configuration
 */
export function createSartorApi(config?: SartorApiConfig): SartorApi {
  return new SartorApi(config);
}
