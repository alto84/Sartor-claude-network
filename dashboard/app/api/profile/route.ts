/**
 * Profile API Routes
 *
 * API endpoints for managing personal profile data.
 * Stores data in local JSON file with memory system integration.
 *
 * @module app/api/profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES (duplicated from src/api to avoid import issues in Next.js API routes)
// ============================================================================

type ProfileCategory =
  | 'bio' | 'work' | 'health' | 'preferences' | 'contacts' | 'goals'
  | 'history' | 'education' | 'financial' | 'family' | 'hobbies' | 'routines' | 'notes';

interface PersonalProfile {
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

interface ProfileStore {
  profiles: PersonalProfile[];
  lastUpdated: string;
}

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

const DATA_DIR = join(process.cwd(), '..', 'data');
const PROFILE_FILE = join(DATA_DIR, 'profiles.json');

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadProfiles(): ProfileStore {
  ensureDataDir();

  if (!existsSync(PROFILE_FILE)) {
    const initialStore: ProfileStore = {
      profiles: [],
      lastUpdated: new Date().toISOString(),
    };
    writeFileSync(PROFILE_FILE, JSON.stringify(initialStore, null, 2));
    return initialStore;
  }

  try {
    const data = readFileSync(PROFILE_FILE, 'utf-8');
    return JSON.parse(data) as ProfileStore;
  } catch {
    return { profiles: [], lastUpdated: new Date().toISOString() };
  }
}

function saveProfiles(store: ProfileStore): void {
  ensureDataDir();
  store.lastUpdated = new Date().toISOString();
  writeFileSync(PROFILE_FILE, JSON.stringify(store, null, 2));
}

function generateId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// GET - Fetch profiles with optional filters
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const store = loadProfiles();

    // Check for stats request
    if (searchParams.get('stats') === 'true') {
      const stats = calculateStats(store.profiles);
      return NextResponse.json(stats);
    }

    // Check for single profile request by ID
    const id = searchParams.get('id');
    if (id) {
      const profile = store.profiles.find(p => p.id === id);
      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(profile);
    }

    // Apply filters
    let filtered = [...store.profiles];

    const memberId = searchParams.get('memberId');
    if (memberId) {
      filtered = filtered.filter(p => p.memberId === memberId);
    }

    const categories = searchParams.get('category');
    if (categories) {
      const categoryList = categories.split(',') as ProfileCategory[];
      filtered = filtered.filter(p => categoryList.includes(p.category));
    }

    const tags = searchParams.get('tags');
    if (tags) {
      const tagList = tags.split(',');
      filtered = filtered.filter(p =>
        tagList.some(tag => p.tags.includes(tag))
      );
    }

    const minImportance = searchParams.get('minImportance');
    if (minImportance) {
      filtered = filtered.filter(p => p.importance >= parseFloat(minImportance));
    }

    const isPrivate = searchParams.get('private');
    if (isPrivate !== null) {
      filtered = filtered.filter(p => p.private === (isPrivate === 'true'));
    }

    const search = searchParams.get('q');
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'importance':
          comparison = a.importance - b.importance;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      profiles: paginated,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new profile
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = loadProfiles();

    // Validate required fields
    if (!body.memberId || !body.category || !body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, category, title, content' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newProfile: PersonalProfile = {
      id: generateId(),
      memberId: body.memberId,
      category: body.category,
      title: body.title,
      content: body.content,
      structured: body.structured,
      importance: body.importance ?? 0.5,
      private: body.private ?? false,
      tags: body.tags ?? [],
      createdAt: now,
      updatedAt: now,
      source: body.source ?? 'user',
      verified: body.source === 'user',
      expiresAt: body.expiresAt,
    };

    store.profiles.push(newProfile);
    saveProfiles(store);

    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update an existing profile
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const store = loadProfiles();

    const index = store.profiles.findIndex(p => p.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const existing = store.profiles[index];
    const updated: PersonalProfile = {
      ...existing,
      ...(body.category && { category: body.category }),
      ...(body.title && { title: body.title }),
      ...(body.content && { content: body.content }),
      ...(body.structured !== undefined && { structured: body.structured }),
      ...(body.importance !== undefined && { importance: body.importance }),
      ...(body.private !== undefined && { private: body.private }),
      ...(body.tags && { tags: body.tags }),
      ...(body.verified !== undefined && { verified: body.verified }),
      ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt }),
      updatedAt: new Date().toISOString(),
    };

    store.profiles[index] = updated;
    saveProfiles(store);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove a profile
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const store = loadProfiles();
    const index = store.profiles.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    store.profiles.splice(index, 1);
    saveProfiles(store);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateStats(profiles: PersonalProfile[]) {
  const categories = [
    'bio', 'work', 'health', 'preferences', 'contacts', 'goals',
    'history', 'education', 'financial', 'family', 'hobbies', 'routines', 'notes'
  ] as ProfileCategory[];

  const byCategory: Record<string, number> = {};
  for (const cat of categories) {
    byCategory[cat] = 0;
  }

  const byMember: Record<string, number> = {};
  let recentlyAdded = 0;
  let highImportance = 0;
  let privateCount = 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const profile of profiles) {
    byCategory[profile.category] = (byCategory[profile.category] || 0) + 1;
    byMember[profile.memberId] = (byMember[profile.memberId] || 0) + 1;

    if (new Date(profile.createdAt) > oneWeekAgo) {
      recentlyAdded++;
    }
    if (profile.importance >= 0.8) {
      highImportance++;
    }
    if (profile.private) {
      privateCount++;
    }
  }

  return {
    totalProfiles: profiles.length,
    byCategory,
    byMember,
    recentlyAdded,
    highImportance,
    privateCount,
  };
}
