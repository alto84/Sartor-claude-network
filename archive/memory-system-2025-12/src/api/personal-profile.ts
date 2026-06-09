/**
 * Personal Profile API
 *
 * Types and functions for storing personal and family information
 * in the Sartor memory system. This information is stored in the warm tier
 * for searchability and can be accessed by Claude in future sessions.
 *
 * @module api/personal-profile
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Categories for personal information
 */
export type ProfileCategory =
  | 'bio'           // Personal background, identity
  | 'work'          // Job, career, professional info
  | 'health'        // Medical info, conditions, allergies
  | 'preferences'   // Likes, dislikes, preferences
  | 'contacts'      // Important contacts, relationships
  | 'goals'         // Personal goals, aspirations
  | 'history'       // Life events, milestones
  | 'education'     // Schools, degrees, certifications
  | 'financial'     // Financial info (high privacy)
  | 'family'        // Family relationships, info about family members
  | 'hobbies'       // Interests, hobbies, activities
  | 'routines'      // Daily routines, schedules, habits
  | 'notes';        // General notes

/**
 * A personal profile entry
 */
export interface PersonalProfile {
  id: string;
  memberId: string;           // Which family member this belongs to
  category: ProfileCategory;
  title: string;              // Short title/summary
  content: string;            // The actual information
  structured?: Record<string, unknown>;  // Structured data if applicable
  importance: number;         // 0-1, higher = more important for Claude to remember
  private: boolean;           // If true, only this member can see
  tags: string[];             // Additional tags for searchability
  createdAt: string;
  updatedAt: string;
  source?: 'user' | 'claude' | 'import';  // How this info was added
  verified?: boolean;         // Has the user verified this info is correct
  expiresAt?: string;         // Optional expiration for time-sensitive info
}

/**
 * Input for creating a profile entry
 */
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

/**
 * Input for updating a profile entry
 */
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

/**
 * Filters for searching profiles
 */
export interface ProfileSearchFilters {
  memberId?: string;
  category?: ProfileCategory[];
  tags?: string[];
  minImportance?: number;
  private?: boolean;
  verified?: boolean;
  search?: string;           // Full-text search
  startDate?: string;
  endDate?: string;
}

/**
 * Result from a profile search
 */
export interface ProfileSearchResult {
  profiles: PersonalProfile[];
  total: number;
  hasMore: boolean;
}

/**
 * Statistics for profile data
 */
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

/**
 * Metadata for each category
 */
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

/**
 * Get all categories as array
 */
export function getAllCategories(): ProfileCategory[] {
  return Object.keys(CATEGORY_METADATA) as ProfileCategory[];
}

/**
 * Get category metadata
 */
export function getCategoryMetadata(category: ProfileCategory) {
  return CATEGORY_METADATA[category];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique profile ID
 */
export function generateProfileId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new profile entry
 */
export function createProfile(input: CreateProfileInput): PersonalProfile {
  const now = new Date().toISOString();
  const categoryMeta = CATEGORY_METADATA[input.category];

  return {
    id: generateProfileId(),
    memberId: input.memberId,
    category: input.category,
    title: input.title,
    content: input.content,
    structured: input.structured,
    importance: input.importance ?? 0.5,
    private: input.private ?? categoryMeta.defaultPrivate,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
    source: input.source ?? 'user',
    verified: input.source === 'user',
    expiresAt: input.expiresAt,
  };
}

/**
 * Update a profile entry
 */
export function updateProfile(
  profile: PersonalProfile,
  updates: UpdateProfileInput
): PersonalProfile {
  return {
    ...profile,
    ...updates,
    tags: updates.tags ?? profile.tags,
    structured: updates.structured ?? profile.structured,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check if a profile matches the given filters
 */
export function matchesFilters(
  profile: PersonalProfile,
  filters: ProfileSearchFilters
): boolean {
  // Member filter
  if (filters.memberId && profile.memberId !== filters.memberId) {
    return false;
  }

  // Category filter
  if (filters.category && filters.category.length > 0) {
    if (!filters.category.includes(profile.category)) {
      return false;
    }
  }

  // Tags filter (any match)
  if (filters.tags && filters.tags.length > 0) {
    const hasMatchingTag = filters.tags.some(tag =>
      profile.tags.includes(tag)
    );
    if (!hasMatchingTag) {
      return false;
    }
  }

  // Importance filter
  if (filters.minImportance !== undefined) {
    if (profile.importance < filters.minImportance) {
      return false;
    }
  }

  // Private filter
  if (filters.private !== undefined && profile.private !== filters.private) {
    return false;
  }

  // Verified filter
  if (filters.verified !== undefined && profile.verified !== filters.verified) {
    return false;
  }

  // Text search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    const matchesTitle = profile.title.toLowerCase().includes(searchLower);
    const matchesContent = profile.content.toLowerCase().includes(searchLower);
    const matchesTags = profile.tags.some(tag =>
      tag.toLowerCase().includes(searchLower)
    );
    if (!matchesTitle && !matchesContent && !matchesTags) {
      return false;
    }
  }

  // Date filters
  if (filters.startDate) {
    if (profile.createdAt < filters.startDate) {
      return false;
    }
  }
  if (filters.endDate) {
    if (profile.createdAt > filters.endDate) {
      return false;
    }
  }

  return true;
}

/**
 * Sort profiles by importance and recency
 */
export function sortProfiles(
  profiles: PersonalProfile[],
  sortBy: 'importance' | 'date' | 'title' = 'date',
  order: 'asc' | 'desc' = 'desc'
): PersonalProfile[] {
  return [...profiles].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'importance':
        comparison = a.importance - b.importance;
        break;
      case 'date':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Calculate profile statistics
 */
export function calculateStats(profiles: PersonalProfile[]): ProfileStats {
  const stats: ProfileStats = {
    totalProfiles: profiles.length,
    byCategory: {} as Record<ProfileCategory, number>,
    byMember: {},
    recentlyAdded: 0,
    highImportance: 0,
    privateCount: 0,
  };

  // Initialize category counts
  for (const category of getAllCategories()) {
    stats.byCategory[category] = 0;
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const profile of profiles) {
    // By category
    stats.byCategory[profile.category]++;

    // By member
    stats.byMember[profile.memberId] = (stats.byMember[profile.memberId] || 0) + 1;

    // Recently added
    if (new Date(profile.createdAt) > oneWeekAgo) {
      stats.recentlyAdded++;
    }

    // High importance
    if (profile.importance >= 0.8) {
      stats.highImportance++;
    }

    // Private count
    if (profile.private) {
      stats.privateCount++;
    }
  }

  return stats;
}

/**
 * Format profile for Claude context injection
 */
export function formatProfileForContext(profile: PersonalProfile): string {
  const meta = CATEGORY_METADATA[profile.category];
  const importance = profile.importance >= 0.8 ? '[HIGH IMPORTANCE]' : '';

  return `**${meta.label}: ${profile.title}** ${importance}
${profile.content}
${profile.tags.length > 0 ? `Tags: ${profile.tags.join(', ')}` : ''}
`.trim();
}

/**
 * Summarize profiles for Claude context (respects token limit)
 */
export function summarizeProfilesForContext(
  profiles: PersonalProfile[],
  maxTokens: number = 2000
): string {
  if (profiles.length === 0) {
    return 'No personal profile information available.';
  }

  // Sort by importance
  const sorted = sortProfiles(profiles, 'importance', 'desc');

  let summary = `## Personal Profile Information (${profiles.length} entries)\n\n`;
  let tokenEstimate = summary.length / 4;

  for (const profile of sorted) {
    const entry = formatProfileForContext(profile) + '\n\n';
    const entryTokens = entry.length / 4;

    if (tokenEstimate + entryTokens > maxTokens) {
      summary += '\n... (additional profile entries truncated for context limit)';
      break;
    }

    summary += entry;
    tokenEstimate += entryTokens;
  }

  return summary;
}
