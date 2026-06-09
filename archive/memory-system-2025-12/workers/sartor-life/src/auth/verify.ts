/**
 * Authentication and Authorization Module
 * Handles token verification and family member identification
 */

import type { Env, AuthContext, FamilyMember, Permission, RateLimitInfo } from '../types';

// Family member configurations
const FAMILY_MEMBERS: Record<string, Omit<FamilyMember, 'id'> & { tokenEnvKey: keyof Env }> = {
  enzo: {
    name: 'Enzo',
    role: 'parent',
    tokenEnvKey: 'AUTH_TOKEN_ENZO',
    permissions: [
      'vault:read', 'vault:write', 'vault:delete',
      'memory:read', 'memory:write', 'memory:delete',
      'chat:read', 'chat:write',
      'dashboard:read', 'dashboard:write',
      'family:read'
    ]
  },
  alessia: {
    name: 'Alessia',
    role: 'parent',
    tokenEnvKey: 'AUTH_TOKEN_ALESSIA',
    permissions: [
      'vault:read', 'vault:write', 'vault:delete',
      'memory:read', 'memory:write', 'memory:delete',
      'chat:read', 'chat:write',
      'dashboard:read', 'dashboard:write',
      'family:read'
    ]
  },
  nadia: {
    name: 'Nadia',
    role: 'child',
    tokenEnvKey: 'AUTH_TOKEN_NADIA',
    permissions: [
      'vault:read', 'vault:write',
      'memory:read', 'memory:write',
      'chat:read', 'chat:write',
      'dashboard:read',
      'family:read'
    ]
  },
  admin: {
    name: 'Admin',
    role: 'admin',
    tokenEnvKey: 'AUTH_TOKEN_ADMIN',
    permissions: ['admin:all']
  }
};

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Verify token and identify family member
 */
export function verifyToken(token: string, env: Env): AuthContext | null {
  // Check against each family member's token
  for (const [memberId, config] of Object.entries(FAMILY_MEMBERS)) {
    const envToken = env[config.tokenEnvKey] as string | undefined;

    if (envToken && token === envToken) {
      return {
        member: {
          id: memberId,
          name: config.name,
          role: config.role,
          permissions: config.permissions
        },
        tokenType: 'bearer',
        isValid: true
      };
    }
  }

  return null;
}

/**
 * Check if member has required permission
 */
export function hasPermission(auth: AuthContext, permission: Permission): boolean {
  if (!auth.isValid) return false;

  // Admin has all permissions
  if (auth.member.permissions.includes('admin:all')) return true;

  return auth.member.permissions.includes(permission);
}

/**
 * Check multiple permissions (any match)
 */
export function hasAnyPermission(auth: AuthContext, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(auth, p));
}

/**
 * Check multiple permissions (all required)
 */
export function hasAllPermissions(auth: AuthContext, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(auth, p));
}

/**
 * Rate limiting implementation
 */
export async function checkRateLimit(
  memberId: string,
  env: Env
): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  const maxRequests = parseInt(env.MAX_REQUESTS_PER_MINUTE || '60', 10);
  const windowMs = 60 * 1000; // 1 minute window
  const now = Date.now();
  const windowKey = `rate:${memberId}:${Math.floor(now / windowMs)}`;

  try {
    // Get current count
    const currentData = await env.RATE_LIMIT_KV.get(windowKey);
    const currentCount = currentData ? parseInt(currentData, 10) : 0;

    if (currentCount >= maxRequests) {
      return {
        allowed: false,
        info: {
          remaining: 0,
          reset: Math.ceil(now / windowMs) * windowMs,
          limit: maxRequests
        }
      };
    }

    // Increment counter
    await env.RATE_LIMIT_KV.put(windowKey, String(currentCount + 1), {
      expirationTtl: 120 // Expire after 2 minutes
    });

    return {
      allowed: true,
      info: {
        remaining: maxRequests - currentCount - 1,
        reset: Math.ceil(now / windowMs) * windowMs,
        limit: maxRequests
      }
    };
  } catch (error) {
    // On error, allow request but log
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      info: {
        remaining: maxRequests,
        reset: now + windowMs,
        limit: maxRequests
      }
    };
  }
}

/**
 * Authenticate request - combines token extraction, verification, and rate limiting
 */
export async function authenticateRequest(
  request: Request,
  env: Env
): Promise<{
  auth: AuthContext | null;
  error?: string;
  rateLimit?: RateLimitInfo;
}> {
  // Extract token
  const token = extractBearerToken(request);
  if (!token) {
    return { auth: null, error: 'Missing Authorization header' };
  }

  // Verify token
  const auth = verifyToken(token, env);
  if (!auth) {
    return { auth: null, error: 'Invalid or expired token' };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit(auth.member.id, env);
  if (!rateCheck.allowed) {
    return {
      auth,
      error: 'Rate limit exceeded',
      rateLimit: rateCheck.info
    };
  }

  return { auth, rateLimit: rateCheck.info };
}

/**
 * Get all family members (for family:read permission)
 */
export function getFamilyMembers(): FamilyMember[] {
  return Object.entries(FAMILY_MEMBERS)
    .filter(([id]) => id !== 'admin')
    .map(([id, config]) => ({
      id,
      name: config.name,
      role: config.role,
      permissions: config.permissions
    }));
}

/**
 * Create authentication error response
 */
export function createAuthErrorResponse(error: string, status: number = 401): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString()
      }
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="sartor-life"'
      }
    }
  );
}
