/**
 * Family Vault API Route
 *
 * Provides CRUD operations for family vault items through the dashboard.
 * Bridges to the Sartor memory system APIs.
 *
 * Routes:
 * - GET /api/vault - List/search vault items
 * - POST /api/vault - Create a new vault item
 */

import { NextRequest, NextResponse } from 'next/server';

// Import types inline to avoid module resolution issues
// In production, you would use proper path aliases configured in tsconfig
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

interface VaultSearchFilters {
  type?: FamilyItemType[];
  tags?: string[];
  createdBy?: string;
  minImportance?: number;
  maxImportance?: number;
  startDate?: Date;
  endDate?: Date;
  includeDeleted?: boolean;
}

interface VaultSearchResult {
  items: FamilyItem[];
  total: number;
  hasMore: boolean;
}

// Request body type
interface CreateVaultItemBody {
  type: FamilyItemType;
  title: string;
  content?: string;
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

// ============================================================================
// VAULT INSTANCE (Lazy loaded)
// ============================================================================

let vaultInstance: any = null;

async function getVault() {
  if (vaultInstance) return vaultInstance;

  try {
    // Dynamic import to handle module resolution
    const { createFamilyVault } = await import('../../../../src/api/family-vault');
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
 * Parse search filters from URL search params
 */
function parseFilters(searchParams: URLSearchParams): VaultSearchFilters {
  const filters: VaultSearchFilters = {};

  const type = searchParams.get('type');
  if (type) {
    filters.type = type.split(',') as FamilyItemType[];
  }

  const tags = searchParams.get('tags');
  if (tags) {
    filters.tags = tags.split(',');
  }

  const createdBy = searchParams.get('createdBy');
  if (createdBy) {
    filters.createdBy = createdBy;
  }

  const minImportance = searchParams.get('minImportance');
  if (minImportance) {
    filters.minImportance = parseFloat(minImportance);
  }

  const maxImportance = searchParams.get('maxImportance');
  if (maxImportance) {
    filters.maxImportance = parseFloat(maxImportance);
  }

  const startDate = searchParams.get('startDate');
  if (startDate) {
    filters.startDate = new Date(startDate);
  }

  const endDate = searchParams.get('endDate');
  if (endDate) {
    filters.endDate = new Date(endDate);
  }

  const includeDeleted = searchParams.get('includeDeleted');
  if (includeDeleted === 'true') {
    filters.includeDeleted = true;
  }

  return filters;
}

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
// GET /api/vault
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const vault = await getVault();
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault service unavailable' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Check if requesting stats
    const stats = searchParams.get('stats');
    if (stats === 'true') {
      const vaultStats = await vault.getStats();
      return NextResponse.json(vaultStats);
    }

    // Parse query and filters
    const query = searchParams.get('q') || '';
    const filters = parseFilters(searchParams);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Search vault
    const result: VaultSearchResult = await vault.searchVault(query, filters, limit, offset);

    // Serialize items
    const serializedItems = result.items.map(serializeItem);

    return NextResponse.json({
      items: serializedItems,
      total: result.total,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('[Vault API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/vault
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const vault = await getVault();
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json() as CreateVaultItemBody;

    // Validate required fields
    if (!body.type || !body.title || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, createdBy' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: FamilyItemType[] = ['document', 'link', 'note', 'contact', 'credential'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create the item
    const item = await vault.createFamilyItem({
      type: body.type,
      title: body.title,
      content: body.content || '',
      url: body.url,
      tags: body.tags || [],
      createdBy: body.createdBy,
      importance: body.importance,
      encrypted: body.encrypted,
      metadata: body.metadata,
    });

    return NextResponse.json(serializeItem(item), { status: 201 });
  } catch (error) {
    console.error('[Vault API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
