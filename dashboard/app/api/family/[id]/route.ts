/**
 * Single Family Member API Route
 *
 * Provides operations for individual family members.
 * Bridges to the Sartor memory system APIs.
 *
 * Routes:
 * - GET /api/family/[id] - Get a single family member
 * - PATCH /api/family/[id] - Update a family member
 * - DELETE /api/family/[id] - Delete a family member
 */

import { NextRequest, NextResponse } from 'next/server';

// Import types inline to avoid module resolution issues
type FamilyRole = 'admin' | 'member' | 'child';
type PresenceStatus = 'online' | 'away' | 'offline';

interface MemberPreferences {
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

interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  email: string;
  avatar?: string;
  preferences: MemberPreferences;
  nickname?: string;
  birthday?: Date;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
  presence?: PresenceStatus;
  features?: {
    canAccessFinance?: boolean;
    canControlHome?: boolean;
    canSendEmail?: boolean;
    healthTrackingEnabled?: boolean;
  };
}

// Request body type
interface UpdateMemberBody {
  name?: string;
  email?: string;
  role?: FamilyRole;
  avatar?: string;
  nickname?: string;
  birthday?: string;
  phone?: string;
  preferences?: Partial<MemberPreferences>;
  features?: FamilyMember['features'];
  presence?: PresenceStatus;
}

// ============================================================================
// FAMILY MEMBERS INSTANCE (Lazy loaded)
// ============================================================================

let membersInstance: any = null;

async function getMembers() {
  if (membersInstance) return membersInstance;

  try {
    // Dynamic import to handle module resolution
    const { createFamilyMembers } = await import('../../../../../src/api/family-members');
    membersInstance = createFamilyMembers();
    return membersInstance;
  } catch (error) {
    console.error('[Family API] Failed to initialize members:', error);
    return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Serialize a family member for JSON response
 */
function serializeMember(member: FamilyMember): Record<string, unknown> {
  return {
    ...member,
    createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : member.createdAt,
    updatedAt: member.updatedAt instanceof Date ? member.updatedAt.toISOString() : member.updatedAt,
    lastSeenAt: member.lastSeenAt instanceof Date ? member.lastSeenAt.toISOString() : member.lastSeenAt,
    birthday: member.birthday instanceof Date ? member.birthday.toISOString() : member.birthday,
  };
}

// ============================================================================
// ROUTE CONTEXT
// ============================================================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/family/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const members = await getMembers();
    if (!members) {
      return NextResponse.json(
        { error: 'Family service unavailable' },
        { status: 503 }
      );
    }

    const { id } = await context.params;

    const member = await members.getMember(id);

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeMember(member));
  } catch (error) {
    console.error('[Family API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/family/[id]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const members = await getMembers();
    if (!members) {
      return NextResponse.json(
        { error: 'Family service unavailable' },
        { status: 503 }
      );
    }

    const { id } = await context.params;
    const body = await request.json() as UpdateMemberBody;

    // Validate role if provided
    if (body.role) {
      const validRoles: FamilyRole[] = ['admin', 'member', 'child'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate role change (ensure at least one admin)
      const canChange = await members.canChangeRole(id, body.role);
      if (!canChange) {
        return NextResponse.json(
          { error: 'Cannot change role: At least one admin must remain' },
          { status: 400 }
        );
      }
    }

    // Handle presence update separately
    if (body.presence) {
      const validPresence: PresenceStatus[] = ['online', 'away', 'offline'];
      if (!validPresence.includes(body.presence)) {
        return NextResponse.json(
          { error: `Invalid presence. Must be one of: ${validPresence.join(', ')}` },
          { status: 400 }
        );
      }
      await members.updatePresence(id, body.presence);
    }

    // Build updates object
    const updates: Partial<FamilyMember> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.role !== undefined) updates.role = body.role;
    if (body.avatar !== undefined) updates.avatar = body.avatar;
    if (body.nickname !== undefined) updates.nickname = body.nickname;
    if (body.birthday !== undefined) updates.birthday = body.birthday ? new Date(body.birthday) : undefined;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.preferences !== undefined) updates.preferences = body.preferences;
    if (body.features !== undefined) updates.features = body.features;

    // Only update if there are changes beyond presence
    const hasUpdates = Object.keys(updates).length > 0;

    if (hasUpdates) {
      const updatedMember = await members.updateMember(id, updates);

      if (!updatedMember) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(serializeMember(updatedMember));
    }

    // If only presence was updated, fetch and return the member
    const member = await members.getMember(id);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeMember(member));
  } catch (error) {
    console.error('[Family API] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/family/[id]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const members = await getMembers();
    if (!members) {
      return NextResponse.json(
        { error: 'Family service unavailable' },
        { status: 503 }
      );
    }

    const { id } = await context.params;

    // Check if this is the last admin
    const member = await members.getMember(id);
    if (member?.role === 'admin') {
      const admins = await members.getMembersByRole('admin');
      if (admins.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin' },
          { status: 400 }
        );
      }
    }

    const deleted = await members.deleteMember(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Family API] DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
