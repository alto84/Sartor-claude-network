/**
 * Family Members API Route
 *
 * Provides CRUD operations for family member management through the dashboard.
 * Bridges to the Sartor memory system APIs.
 *
 * Routes:
 * - GET /api/family - List family members
 * - POST /api/family - Create a new family member
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
interface CreateMemberBody {
  name: string;
  email: string;
  role: FamilyRole;
  avatar?: string;
  nickname?: string;
  birthday?: string;
  phone?: string;
  preferences?: Partial<MemberPreferences>;
}

// ============================================================================
// FAMILY MEMBERS INSTANCE (Lazy loaded)
// ============================================================================

let membersInstance: any = null;

async function getMembers() {
  if (membersInstance) return membersInstance;

  try {
    // Dynamic import to handle module resolution
    const { createFamilyMembers } = await import('../../../../src/api/family-members');
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
// GET /api/family
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const members = await getMembers();
    if (!members) {
      return NextResponse.json(
        { error: 'Family service unavailable' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Check if requesting stats
    const stats = searchParams.get('stats');
    if (stats === 'true') {
      const familyStats = await members.getStats();
      return NextResponse.json(familyStats);
    }

    // Check for email lookup
    const email = searchParams.get('email');
    if (email) {
      const member = await members.getMemberByEmail(email);
      if (!member) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(serializeMember(member));
    }

    // Check for role filter
    const role = searchParams.get('role') as FamilyRole | null;
    if (role) {
      const validRoles: FamilyRole[] = ['admin', 'member', 'child'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }
      const membersByRole = await members.getMembersByRole(role);
      return NextResponse.json(membersByRole.map(serializeMember));
    }

    // Check for presence filter
    const presence = searchParams.get('presence');
    if (presence === 'online') {
      const onlineMembers = await members.getOnlineMembers();
      return NextResponse.json(onlineMembers.map(serializeMember));
    }

    // Get all members
    const allMembers = await members.getFamilyMembers();
    return NextResponse.json(allMembers.map(serializeMember));
  } catch (error) {
    console.error('[Family API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/family
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const members = await getMembers();
    if (!members) {
      return NextResponse.json(
        { error: 'Family service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json() as CreateMemberBody;

    // Validate required fields
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: FamilyRole[] = ['admin', 'member', 'child'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingMember = await members.getMemberByEmail(body.email);
    if (existingMember) {
      return NextResponse.json(
        { error: 'A member with this email already exists' },
        { status: 409 }
      );
    }

    // Create the member
    const member = await members.createMember({
      name: body.name,
      email: body.email,
      role: body.role,
      avatar: body.avatar,
      nickname: body.nickname,
      birthday: body.birthday ? new Date(body.birthday) : undefined,
      phone: body.phone,
      preferences: body.preferences,
    });

    return NextResponse.json(serializeMember(member), { status: 201 });
  } catch (error) {
    console.error('[Family API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
