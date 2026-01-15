/**
 * Family Members API - Manage family member profiles and preferences
 *
 * Uses the multi-tier memory system:
 * - Hot tier (Firebase RTDB): Active session data, presence tracking
 * - Warm tier (Firestore): Member profiles, preferences, permissions
 *
 * @module api/family-members
 */

import { initializeFirebase, getDatabase, getApp } from '../mcp/firebase-init';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { Database } from 'firebase-admin/database';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Role of a family member - determines permissions and UI
 */
export type FamilyRole = 'admin' | 'member' | 'child';

/**
 * Member presence status
 */
export type PresenceStatus = 'online' | 'away' | 'offline';

/**
 * A family member profile
 */
export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  email: string;
  avatar?: string;
  preferences: MemberPreferences;

  // Optional profile details
  nickname?: string;
  birthday?: Date;
  phone?: string;

  // Status tracking
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
  presence?: PresenceStatus;

  // Feature flags
  features?: {
    canAccessFinance?: boolean;
    canControlHome?: boolean;
    canSendEmail?: boolean;
    healthTrackingEnabled?: boolean;
  };
}

/**
 * Member preferences - stored per user
 */
export interface MemberPreferences {
  // UI preferences
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';

  // Notification preferences
  notifications?: {
    email?: boolean;
    push?: boolean;
    calendarReminders?: boolean;
    taskReminders?: boolean;
    dailyDigest?: boolean;
  };

  // Dashboard preferences
  dashboard?: {
    defaultView?: 'day' | 'week' | 'month';
    showWeather?: boolean;
    showCalendar?: boolean;
    showTasks?: boolean;
    showFinance?: boolean;
    showHealth?: boolean;
  };

  // Privacy preferences
  privacy?: {
    shareCalendar?: boolean;
    shareLocation?: boolean;
    shareHealth?: boolean;
  };

  // Custom preferences (extensible)
  custom?: Record<string, unknown>;
}

/**
 * Input for creating a new family member
 */
export interface CreateMemberInput {
  name: string;
  email: string;
  role: FamilyRole;
  avatar?: string;
  nickname?: string;
  birthday?: Date;
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
  birthday?: Date;
  phone?: string;
  preferences?: Partial<MemberPreferences>;
  features?: FamilyMember['features'];
}

/**
 * Family stats
 */
export interface FamilyStats {
  totalMembers: number;
  byRole: Record<FamilyRole, number>;
  online: number;
  away: number;
  offline: number;
}

/**
 * Configuration for FamilyMembers API
 */
export interface FamilyMembersConfig {
  hotTierPath?: string;
  warmTierCollection?: string;
  presenceTTL?: number; // ms before marking offline
}

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

/**
 * Default preferences for new members
 */
export const DEFAULT_PREFERENCES: MemberPreferences = {
  theme: 'auto',
  language: 'en',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  notifications: {
    email: true,
    push: true,
    calendarReminders: true,
    taskReminders: true,
    dailyDigest: true,
  },
  dashboard: {
    defaultView: 'day',
    showWeather: true,
    showCalendar: true,
    showTasks: true,
    showFinance: false,
    showHealth: false,
  },
  privacy: {
    shareCalendar: true,
    shareLocation: false,
    shareHealth: false,
  },
};

/**
 * Get default features based on role
 */
export function getDefaultFeatures(role: FamilyRole): FamilyMember['features'] {
  switch (role) {
    case 'admin':
      return {
        canAccessFinance: true,
        canControlHome: true,
        canSendEmail: true,
        healthTrackingEnabled: true,
      };
    case 'member':
      return {
        canAccessFinance: true,
        canControlHome: true,
        canSendEmail: true,
        healthTrackingEnabled: true,
      };
    case 'child':
      return {
        canAccessFinance: false,
        canControlHome: false, // Can view but not control security
        canSendEmail: false, // Requires approval
        healthTrackingEnabled: false, // Opt-in by parent
      };
  }
}

// ============================================================================
// FAMILY MEMBERS CLASS
// ============================================================================

/**
 * Family Members API - Manage family member profiles
 *
 * Provides CRUD operations for family member management
 */
export class FamilyMembers {
  private db: Database | null = null;
  private firestore: Firestore | null = null;

  private hotTierPath: string;
  private warmTierCollection: string;
  private presenceTTL: number;

  private useFirebase: boolean = false;
  private useFirestore: boolean = false;

  constructor(config: FamilyMembersConfig = {}) {
    this.hotTierPath = config.hotTierPath || 'family-members/presence';
    this.warmTierCollection = config.warmTierCollection || 'family-members';
    this.presenceTTL = config.presenceTTL || 5 * 60 * 1000; // 5 minutes

    this.initializeBackends();
  }

  /**
   * Initialize storage backends
   */
  private initializeBackends(): void {
    const success = initializeFirebase();

    if (success) {
      // Hot tier - Firebase RTDB (for presence)
      this.db = getDatabase();
      if (this.db) {
        this.useFirebase = true;
        console.error('[FamilyMembers] Hot tier (Firebase RTDB) enabled');
      }

      // Warm tier - Firestore (for profiles)
      const app = getApp();
      if (app) {
        try {
          this.firestore = getFirestore(app);
          this.useFirestore = true;
          console.error('[FamilyMembers] Warm tier (Firestore) enabled');
        } catch (error) {
          console.error('[FamilyMembers] Firestore initialization failed:', error);
        }
      }
    }

    if (!this.useFirebase && !this.useFirestore) {
      console.error('[FamilyMembers] WARNING: No cloud backends available.');
    }
  }

  /**
   * Generate a unique ID for a family member
   */
  private generateId(): string {
    return `fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Serialize a FamilyMember for storage
   */
  private serializeMember(member: FamilyMember): Record<string, any> {
    return {
      ...member,
      createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : member.createdAt,
      updatedAt: member.updatedAt instanceof Date ? member.updatedAt.toISOString() : member.updatedAt,
      lastSeenAt: member.lastSeenAt instanceof Date ? member.lastSeenAt.toISOString() : member.lastSeenAt,
      birthday: member.birthday instanceof Date ? member.birthday.toISOString() : member.birthday,
    };
  }

  /**
   * Deserialize stored data to FamilyMember
   */
  private deserializeMember(data: Record<string, any>): FamilyMember {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt) : undefined,
      birthday: data.birthday ? new Date(data.birthday) : undefined,
    } as FamilyMember;
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new family member
   *
   * @param input - Member creation input
   * @returns The created member
   */
  async createMember(input: CreateMemberInput): Promise<FamilyMember> {
    const now = new Date();
    const id = this.generateId();

    const member: FamilyMember = {
      id,
      name: input.name,
      email: input.email,
      role: input.role,
      avatar: input.avatar,
      nickname: input.nickname,
      birthday: input.birthday,
      phone: input.phone,
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...input.preferences,
      },
      features: getDefaultFeatures(input.role),
      createdAt: now,
      updatedAt: now,
      presence: 'offline',
    };

    const serialized = this.serializeMember(member);

    // Store in warm tier (Firestore) - primary storage
    if (this.useFirestore && this.firestore) {
      try {
        await this.firestore.collection(this.warmTierCollection).doc(id).set(serialized);
      } catch (error) {
        console.error('[FamilyMembers] Warm tier write failed:', error);
        throw error;
      }
    }

    // Store presence in hot tier (Firebase RTDB)
    if (this.useFirebase && this.db) {
      try {
        await this.db.ref(`${this.hotTierPath}/${id}`).set({
          status: 'offline',
          lastSeen: now.toISOString(),
        });
      } catch (error) {
        console.error('[FamilyMembers] Hot tier presence write failed:', error);
      }
    }

    return member;
  }

  /**
   * Get a family member by ID
   *
   * @param id - Member ID
   * @returns The member or null if not found
   */
  async getMember(id: string): Promise<FamilyMember | null> {
    // Get from warm tier (Firestore)
    if (this.useFirestore && this.firestore) {
      try {
        const doc = await this.firestore.collection(this.warmTierCollection).doc(id).get();
        if (doc.exists) {
          const member = this.deserializeMember(doc.data() as Record<string, any>);

          // Get current presence from hot tier
          if (this.useFirebase && this.db) {
            try {
              const presenceSnapshot = await this.db.ref(`${this.hotTierPath}/${id}`).get();
              if (presenceSnapshot.exists()) {
                const presence = presenceSnapshot.val();
                member.presence = presence.status || 'offline';
                member.lastSeenAt = presence.lastSeen ? new Date(presence.lastSeen) : member.lastSeenAt;
              }
            } catch (error) {
              console.error('[FamilyMembers] Presence read failed:', error);
            }
          }

          return member;
        }
      } catch (error) {
        console.error('[FamilyMembers] Warm tier read failed:', error);
      }
    }

    return null;
  }

  /**
   * Get a family member by email
   *
   * @param email - Member email
   * @returns The member or null if not found
   */
  async getMemberByEmail(email: string): Promise<FamilyMember | null> {
    if (this.useFirestore && this.firestore) {
      try {
        const snapshot = await this.firestore
          .collection(this.warmTierCollection)
          .where('email', '==', email)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          return this.deserializeMember(snapshot.docs[0].data() as Record<string, any>);
        }
      } catch (error) {
        console.error('[FamilyMembers] Email lookup failed:', error);
      }
    }

    return null;
  }

  /**
   * Update a family member
   *
   * @param id - Member ID
   * @param updates - Fields to update
   * @returns The updated member or null if not found
   */
  async updateMember(id: string, updates: UpdateMemberInput): Promise<FamilyMember | null> {
    const existing = await this.getMember(id);
    if (!existing) {
      return null;
    }

    // Merge preferences deeply
    const mergedPreferences = updates.preferences
      ? this.mergePreferences(existing.preferences, updates.preferences)
      : existing.preferences;

    // Merge features deeply
    const mergedFeatures = updates.features
      ? { ...existing.features, ...updates.features }
      : existing.features;

    const updatedMember: FamilyMember = {
      ...existing,
      ...updates,
      preferences: mergedPreferences,
      features: mergedFeatures,
      updatedAt: new Date(),
    };

    const serialized = this.serializeMember(updatedMember);

    // Update warm tier
    if (this.useFirestore && this.firestore) {
      try {
        await this.firestore.collection(this.warmTierCollection).doc(id).set(serialized);
      } catch (error) {
        console.error('[FamilyMembers] Warm tier update failed:', error);
        throw error;
      }
    }

    return updatedMember;
  }

  /**
   * Deep merge preferences
   */
  private mergePreferences(
    existing: MemberPreferences,
    updates: Partial<MemberPreferences>
  ): MemberPreferences {
    return {
      ...existing,
      ...updates,
      notifications: updates.notifications
        ? { ...existing.notifications, ...updates.notifications }
        : existing.notifications,
      dashboard: updates.dashboard
        ? { ...existing.dashboard, ...updates.dashboard }
        : existing.dashboard,
      privacy: updates.privacy
        ? { ...existing.privacy, ...updates.privacy }
        : existing.privacy,
      custom: updates.custom
        ? { ...existing.custom, ...updates.custom }
        : existing.custom,
    };
  }

  /**
   * Delete a family member
   *
   * @param id - Member ID
   * @returns True if deleted, false if not found
   */
  async deleteMember(id: string): Promise<boolean> {
    let deleted = false;

    // Delete from warm tier
    if (this.useFirestore && this.firestore) {
      try {
        const doc = await this.firestore.collection(this.warmTierCollection).doc(id).get();
        if (doc.exists) {
          await this.firestore.collection(this.warmTierCollection).doc(id).delete();
          deleted = true;
        }
      } catch (error) {
        console.error('[FamilyMembers] Warm tier delete failed:', error);
      }
    }

    // Delete presence from hot tier
    if (this.useFirebase && this.db) {
      try {
        await this.db.ref(`${this.hotTierPath}/${id}`).remove();
      } catch (error) {
        console.error('[FamilyMembers] Hot tier delete failed:', error);
      }
    }

    return deleted;
  }

  // ============================================================================
  // LIST AND SEARCH
  // ============================================================================

  /**
   * Get all family members
   *
   * @returns All family members
   */
  async getFamilyMembers(): Promise<FamilyMember[]> {
    const members: FamilyMember[] = [];

    if (this.useFirestore && this.firestore) {
      try {
        const snapshot = await this.firestore.collection(this.warmTierCollection).get();

        snapshot.forEach((doc) => {
          members.push(this.deserializeMember(doc.data() as Record<string, any>));
        });

        // Get presence for all members
        if (this.useFirebase && this.db && members.length > 0) {
          try {
            const presenceSnapshot = await this.db.ref(this.hotTierPath).get();
            if (presenceSnapshot.exists()) {
              const presenceData = presenceSnapshot.val();
              for (const member of members) {
                if (presenceData[member.id]) {
                  member.presence = presenceData[member.id].status || 'offline';
                  member.lastSeenAt = presenceData[member.id].lastSeen
                    ? new Date(presenceData[member.id].lastSeen)
                    : member.lastSeenAt;
                }
              }
            }
          } catch (error) {
            console.error('[FamilyMembers] Presence batch read failed:', error);
          }
        }
      } catch (error) {
        console.error('[FamilyMembers] List failed:', error);
        throw error;
      }
    }

    // Sort by role (admin first, then member, then child) and then by name
    const roleOrder: Record<FamilyRole, number> = { admin: 0, member: 1, child: 2 };
    members.sort((a, b) => {
      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return roleOrder[a.role] - roleOrder[b.role];
      }
      return a.name.localeCompare(b.name);
    });

    return members;
  }

  /**
   * Get family members by role
   *
   * @param role - Role to filter by
   * @returns Members with the specified role
   */
  async getMembersByRole(role: FamilyRole): Promise<FamilyMember[]> {
    const members: FamilyMember[] = [];

    if (this.useFirestore && this.firestore) {
      try {
        const snapshot = await this.firestore
          .collection(this.warmTierCollection)
          .where('role', '==', role)
          .get();

        snapshot.forEach((doc) => {
          members.push(this.deserializeMember(doc.data() as Record<string, any>));
        });
      } catch (error) {
        console.error('[FamilyMembers] Role filter failed:', error);
        throw error;
      }
    }

    return members.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get online family members
   *
   * @returns Currently online members
   */
  async getOnlineMembers(): Promise<FamilyMember[]> {
    const allMembers = await this.getFamilyMembers();
    return allMembers.filter((m) => m.presence === 'online');
  }

  // ============================================================================
  // PRESENCE MANAGEMENT
  // ============================================================================

  /**
   * Update a member's presence status
   *
   * @param id - Member ID
   * @param status - New presence status
   */
  async updatePresence(id: string, status: PresenceStatus): Promise<void> {
    const now = new Date();

    // Update hot tier (real-time presence)
    if (this.useFirebase && this.db) {
      try {
        await this.db.ref(`${this.hotTierPath}/${id}`).set({
          status,
          lastSeen: now.toISOString(),
        });
      } catch (error) {
        console.error('[FamilyMembers] Presence update failed:', error);
        throw error;
      }
    }

    // Update lastSeenAt in warm tier
    if (this.useFirestore && this.firestore) {
      try {
        await this.firestore.collection(this.warmTierCollection).doc(id).update({
          lastSeenAt: now.toISOString(),
          presence: status,
        });
      } catch (error) {
        console.error('[FamilyMembers] LastSeen update failed:', error);
      }
    }
  }

  /**
   * Mark a member as online (heartbeat)
   *
   * @param id - Member ID
   */
  async heartbeat(id: string): Promise<void> {
    await this.updatePresence(id, 'online');
  }

  /**
   * Mark a member as away
   *
   * @param id - Member ID
   */
  async markAway(id: string): Promise<void> {
    await this.updatePresence(id, 'away');
  }

  /**
   * Mark a member as offline
   *
   * @param id - Member ID
   */
  async markOffline(id: string): Promise<void> {
    await this.updatePresence(id, 'offline');
  }

  // ============================================================================
  // PREFERENCES
  // ============================================================================

  /**
   * Get a member's preferences
   *
   * @param id - Member ID
   * @returns Member preferences or null if member not found
   */
  async getPreferences(id: string): Promise<MemberPreferences | null> {
    const member = await this.getMember(id);
    return member?.preferences || null;
  }

  /**
   * Update a member's preferences
   *
   * @param id - Member ID
   * @param preferences - Preferences to update
   * @returns Updated preferences or null if member not found
   */
  async updatePreferences(
    id: string,
    preferences: Partial<MemberPreferences>
  ): Promise<MemberPreferences | null> {
    const updated = await this.updateMember(id, { preferences });
    return updated?.preferences || null;
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  /**
   * Check if a member has a specific feature enabled
   *
   * @param id - Member ID
   * @param feature - Feature key to check
   * @returns True if feature is enabled
   */
  async hasFeature(id: string, feature: keyof NonNullable<FamilyMember['features']>): Promise<boolean> {
    const member = await this.getMember(id);
    if (!member || !member.features) {
      return false;
    }
    return member.features[feature] === true;
  }

  /**
   * Enable a feature for a member
   *
   * @param id - Member ID
   * @param feature - Feature to enable
   */
  async enableFeature(id: string, feature: keyof NonNullable<FamilyMember['features']>): Promise<void> {
    const member = await this.getMember(id);
    if (!member) {
      throw new Error(`Member not found: ${id}`);
    }

    const features = { ...member.features, [feature]: true };
    await this.updateMember(id, { features });
  }

  /**
   * Disable a feature for a member
   *
   * @param id - Member ID
   * @param feature - Feature to disable
   */
  async disableFeature(id: string, feature: keyof NonNullable<FamilyMember['features']>): Promise<void> {
    const member = await this.getMember(id);
    if (!member) {
      throw new Error(`Member not found: ${id}`);
    }

    const features = { ...member.features, [feature]: false };
    await this.updateMember(id, { features });
  }

  /**
   * Check if a member is an admin
   *
   * @param id - Member ID
   * @returns True if member is an admin
   */
  async isAdmin(id: string): Promise<boolean> {
    const member = await this.getMember(id);
    return member?.role === 'admin';
  }

  /**
   * Check if a member is an adult (admin or member)
   *
   * @param id - Member ID
   * @returns True if member is an adult
   */
  async isAdult(id: string): Promise<boolean> {
    const member = await this.getMember(id);
    return member?.role === 'admin' || member?.role === 'member';
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get family statistics
   *
   * @returns Family stats
   */
  async getStats(): Promise<FamilyStats> {
    const members = await this.getFamilyMembers();

    const stats: FamilyStats = {
      totalMembers: members.length,
      byRole: {
        admin: 0,
        member: 0,
        child: 0,
      },
      online: 0,
      away: 0,
      offline: 0,
    };

    for (const member of members) {
      // Count by role
      stats.byRole[member.role]++;

      // Count by presence
      switch (member.presence) {
        case 'online':
          stats.online++;
          break;
        case 'away':
          stats.away++;
          break;
        default:
          stats.offline++;
      }
    }

    return stats;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get backend status
   */
  getBackendStatus(): { hot: boolean; warm: boolean } {
    return {
      hot: this.useFirebase,
      warm: this.useFirestore,
    };
  }

  /**
   * Validate member role change
   * Ensures at least one admin remains
   *
   * @param id - Member ID
   * @param newRole - Proposed new role
   * @returns True if role change is valid
   */
  async canChangeRole(id: string, newRole: FamilyRole): Promise<boolean> {
    const member = await this.getMember(id);
    if (!member) {
      return false;
    }

    // If changing away from admin, ensure at least one admin remains
    if (member.role === 'admin' && newRole !== 'admin') {
      const admins = await this.getMembersByRole('admin');
      if (admins.length <= 1) {
        return false; // Cannot remove the last admin
      }
    }

    return true;
  }

  /**
   * Change a member's role (with validation)
   *
   * @param id - Member ID
   * @param newRole - New role
   * @returns Updated member or throws if invalid
   */
  async changeRole(id: string, newRole: FamilyRole): Promise<FamilyMember> {
    const canChange = await this.canChangeRole(id, newRole);
    if (!canChange) {
      throw new Error('Cannot change role: At least one admin must remain');
    }

    const updated = await this.updateMember(id, {
      role: newRole,
      features: getDefaultFeatures(newRole),
    });

    if (!updated) {
      throw new Error(`Member not found: ${id}`);
    }

    return updated;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a FamilyMembers instance
 *
 * @param config - Optional configuration
 * @returns FamilyMembers instance
 */
export function createFamilyMembers(config?: FamilyMembersConfig): FamilyMembers {
  return new FamilyMembers(config);
}
