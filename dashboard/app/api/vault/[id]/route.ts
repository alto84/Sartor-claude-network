/**
 * Single Vault Item API Route
 *
 * Provides operations for individual vault items.
 * Bridges to the Sartor memory system APIs.
 *
 * Routes:
 * - GET /api/vault/[id] - Get a single vault item
 * - PATCH /api/vault/[id] - Update a vault item
 * - DELETE /api/vault/[id] - Delete a vault item (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';

// Import types inline to avoid module resolution issues
type FamilyItemType = 'document' | 'link' | 'note' | 'contact' | 'credential';

interface FamilyItem {
  id: string;
  type: FamilyItemType;
  title: string;
  content: string;
  url?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  importance: number;
  encrypted?: boolean;
  metadata?: {
    category?: string;
    expiresAt?: Date;
    reminderAt?: Date;
    attachments?: string[];
    sharedWith?: string[];
  };
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

// Request body types
interface UpdateVaultItemBody {
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

interface DeleteVaultItemBody {
  deletedBy?: string;
}

// ============================================================================
// VAULT INSTANCE (Lazy loaded)
// ============================================================================

let vaultInstance: any = null;

async function getVault() {
  if (vaultInstance) return vaultInstance;

  try {
    // Dynamic import to handle module resolution
    const { createFamilyVault } = await import('../../../../../src/api/family-vault');
    vaultInstance = createFamilyVault();
    return vaultInstance;
  } catch (error) {
    console.error('[Vault API] Failed to initialize vault:', error);
    return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Serialize a vault item for JSON response
 */
function serializeItem(item: FamilyItem): Record<string, unknown> {
  return {
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    deletedAt: item.deletedAt instanceof Date ? item.deletedAt.toISOString() : item.deletedAt,
    metadata: item.metadata ? {
      ...item.metadata,
      expiresAt: item.metadata.expiresAt instanceof Date ? item.metadata.expiresAt.toISOString() : item.metadata.expiresAt,
      reminderAt: item.metadata.reminderAt instanceof Date ? item.metadata.reminderAt.toISOString() : item.metadata.reminderAt,
    } : undefined,
  };
}

// ============================================================================
// ROUTE CONTEXT
// ============================================================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/vault/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const vault = await getVault();
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault service unavailable' },
        { status: 503 }
      );
    }

    const { id } = await context.params;

    const item = await vault.getFamilyItem(id);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeItem(item));
  } catch (error) {
    console.error('[Vault API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/vault/[id]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const vault = await getVault();
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault service unavailable' },
        { status: 503 }
      );
    }

    const { id } = await context.params;
    const body = await request.json() as UpdateVaultItemBody;

    // Validate type if provided
    if (body.type) {
      const validTypes: FamilyItemType[] = ['document', 'link', 'note', 'contact', 'credential'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Build updates object (omit metadata for separate handling)
    const updates: Partial<Omit<FamilyItem, 'metadata'>> & { metadata?: FamilyItem['metadata'] } = {};
    if (body.type !== undefined) updates.type = body.type;
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.url !== undefined) updates.url = body.url;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.importance !== undefined) updates.importance = body.importance;
    if (body.encrypted !== undefined) updates.encrypted = body.encrypted;
    if (body.metadata !== undefined) {
      updates.metadata = {
        ...body.metadata,
        expiresAt: body.metadata.expiresAt ? new Date(body.metadata.expiresAt) : undefined,
        reminderAt: body.metadata.reminderAt ? new Date(body.metadata.reminderAt) : undefined,
      };
    }

    const updatedItem = await vault.updateFamilyItem(id, updates);

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeItem(updatedItem));
  } catch (error) {
    console.error('[Vault API] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/vault/[id]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const vault = await getVault();
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault service unavailable' },
        { status: 503 }
      );
    }

    const { id } = await context.params;

    // Get deletedBy from request body if provided
    let deletedBy = 'system';
    try {
      const body = await request.json() as DeleteVaultItemBody;
      if (body.deletedBy) {
        deletedBy = body.deletedBy;
      }
    } catch {
      // Body is optional for DELETE
    }

    const deleted = await vault.deleteFamilyItem(id, deletedBy);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Vault API] DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
