/**
 * Family Vault Tools
 * Secure storage for family documents, recipes, health records, etc.
 */

import type { Env, AuthContext, VaultItem, VaultCategory, MCPToolDefinition } from '../types';
import { hasPermission } from '../auth/verify';

// Generate unique ID
function generateId(): string {
  return `vault_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Vault tool definitions for MCP
export const vaultTools: MCPToolDefinition[] = [
  {
    name: 'vault_add',
    description: 'Add a new item to the family vault. Use for storing recipes, health records, important documents, family traditions, contacts, and notes.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['recipe', 'health', 'education', 'finance', 'document', 'tradition', 'memory', 'contact', 'note', 'other'],
          description: 'Category of the vault item'
        },
        title: {
          type: 'string',
          description: 'Title or name of the item'
        },
        content: {
          type: 'string',
          description: 'Main content of the item'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for easier searching'
        },
        isPrivate: {
          type: 'boolean',
          description: 'If true, only the creator can view this item'
        },
        sharedWith: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of family member IDs who can access this item (if private)'
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (e.g., source, date, location)'
        }
      },
      required: ['category', 'title', 'content']
    }
  },
  {
    name: 'vault_search',
    description: 'Search the family vault for items matching a query. Searches titles, content, and tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text'
        },
        category: {
          type: 'string',
          enum: ['recipe', 'health', 'education', 'finance', 'document', 'tradition', 'memory', 'contact', 'note', 'other'],
          description: 'Filter by category'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags (items must have all specified tags)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10, max: 50)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'vault_list',
    description: 'List recent items from the family vault, optionally filtered by category.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['recipe', 'health', 'education', 'finance', 'document', 'tradition', 'memory', 'contact', 'note', 'other'],
          description: 'Filter by category'
        },
        limit: {
          type: 'number',
          description: 'Number of items to return (default: 10, max: 50)'
        },
        offset: {
          type: 'number',
          description: 'Number of items to skip for pagination'
        }
      }
    }
  },
  {
    name: 'vault_get',
    description: 'Get a specific vault item by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The vault item ID'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'vault_update',
    description: 'Update an existing vault item.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The vault item ID to update'
        },
        title: {
          type: 'string',
          description: 'New title'
        },
        content: {
          type: 'string',
          description: 'New content'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags (replaces existing)'
        },
        metadata: {
          type: 'object',
          description: 'New metadata (merges with existing)'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'vault_delete',
    description: 'Delete a vault item (requires delete permission).',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The vault item ID to delete'
        }
      },
      required: ['id']
    }
  }
];

/**
 * Add item to vault
 */
export async function vaultAdd(
  params: {
    category: VaultCategory;
    title: string;
    content: string;
    tags?: string[];
    isPrivate?: boolean;
    sharedWith?: string[];
    metadata?: Record<string, unknown>;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; item?: VaultItem; error?: string }> {
  if (!hasPermission(auth, 'vault:write')) {
    return { success: false, error: 'Permission denied: vault:write required' };
  }

  const now = new Date().toISOString();
  const item: VaultItem = {
    id: generateId(),
    category: params.category,
    title: params.title,
    content: params.content,
    tags: params.tags || [],
    metadata: params.metadata,
    createdBy: auth.member.id,
    createdAt: now,
    updatedAt: now,
    isPrivate: params.isPrivate || false,
    sharedWith: params.sharedWith
  };

  try {
    // Store the item
    await env.VAULT_KV.put(`item:${item.id}`, JSON.stringify(item));

    // Update index for category
    const categoryIndexKey = `index:category:${item.category}`;
    const existingIndex = await env.VAULT_KV.get(categoryIndexKey);
    const categoryIds: string[] = existingIndex ? JSON.parse(existingIndex) : [];
    categoryIds.unshift(item.id);
    await env.VAULT_KV.put(categoryIndexKey, JSON.stringify(categoryIds.slice(0, 1000)));

    // Update global recent index
    const recentIndexKey = 'index:recent';
    const recentIndex = await env.VAULT_KV.get(recentIndexKey);
    const recentIds: string[] = recentIndex ? JSON.parse(recentIndex) : [];
    recentIds.unshift(item.id);
    await env.VAULT_KV.put(recentIndexKey, JSON.stringify(recentIds.slice(0, 1000)));

    // Update search index (simple tag-based)
    for (const tag of item.tags) {
      const tagKey = `index:tag:${tag.toLowerCase()}`;
      const tagIndex = await env.VAULT_KV.get(tagKey);
      const tagIds: string[] = tagIndex ? JSON.parse(tagIndex) : [];
      tagIds.unshift(item.id);
      await env.VAULT_KV.put(tagKey, JSON.stringify(tagIds.slice(0, 500)));
    }

    return { success: true, item };
  } catch (error) {
    console.error('Vault add error:', error);
    return { success: false, error: 'Failed to add vault item' };
  }
}

/**
 * Search vault items
 */
export async function vaultSearch(
  params: {
    query: string;
    category?: VaultCategory;
    tags?: string[];
    limit?: number;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; items?: VaultItem[]; error?: string }> {
  if (!hasPermission(auth, 'vault:read')) {
    return { success: false, error: 'Permission denied: vault:read required' };
  }

  const limit = Math.min(params.limit || 10, 50);
  const query = params.query.toLowerCase();

  try {
    // Get candidate IDs from indices
    let candidateIds: string[] = [];

    if (params.category) {
      const categoryIndex = await env.VAULT_KV.get(`index:category:${params.category}`);
      candidateIds = categoryIndex ? JSON.parse(categoryIndex) : [];
    } else {
      const recentIndex = await env.VAULT_KV.get('index:recent');
      candidateIds = recentIndex ? JSON.parse(recentIndex) : [];
    }

    // If searching by tags, intersect with tag indices
    if (params.tags && params.tags.length > 0) {
      for (const tag of params.tags) {
        const tagIndex = await env.VAULT_KV.get(`index:tag:${tag.toLowerCase()}`);
        const tagIds: string[] = tagIndex ? JSON.parse(tagIndex) : [];
        candidateIds = candidateIds.filter(id => tagIds.includes(id));
      }
    }

    // Fetch and filter items
    const items: VaultItem[] = [];
    for (const id of candidateIds) {
      if (items.length >= limit) break;

      const itemData = await env.VAULT_KV.get(`item:${id}`);
      if (!itemData) continue;

      const item: VaultItem = JSON.parse(itemData);

      // Check access permissions
      if (item.isPrivate) {
        if (item.createdBy !== auth.member.id &&
            !item.sharedWith?.includes(auth.member.id) &&
            !hasPermission(auth, 'admin:all')) {
          continue;
        }
      }

      // Text search in title, content, and tags
      const searchableText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
      if (searchableText.includes(query)) {
        items.push(item);
      }
    }

    return { success: true, items };
  } catch (error) {
    console.error('Vault search error:', error);
    return { success: false, error: 'Failed to search vault' };
  }
}

/**
 * List recent vault items
 */
export async function vaultList(
  params: {
    category?: VaultCategory;
    limit?: number;
    offset?: number;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; items?: VaultItem[]; total?: number; error?: string }> {
  if (!hasPermission(auth, 'vault:read')) {
    return { success: false, error: 'Permission denied: vault:read required' };
  }

  const limit = Math.min(params.limit || 10, 50);
  const offset = params.offset || 0;

  try {
    // Get IDs from appropriate index
    const indexKey = params.category
      ? `index:category:${params.category}`
      : 'index:recent';

    const indexData = await env.VAULT_KV.get(indexKey);
    const allIds: string[] = indexData ? JSON.parse(indexData) : [];

    // Paginate
    const pageIds = allIds.slice(offset, offset + limit);

    // Fetch items
    const items: VaultItem[] = [];
    for (const id of pageIds) {
      const itemData = await env.VAULT_KV.get(`item:${id}`);
      if (!itemData) continue;

      const item: VaultItem = JSON.parse(itemData);

      // Check access permissions
      if (item.isPrivate) {
        if (item.createdBy !== auth.member.id &&
            !item.sharedWith?.includes(auth.member.id) &&
            !hasPermission(auth, 'admin:all')) {
          continue;
        }
      }

      items.push(item);
    }

    return { success: true, items, total: allIds.length };
  } catch (error) {
    console.error('Vault list error:', error);
    return { success: false, error: 'Failed to list vault items' };
  }
}

/**
 * Get a specific vault item
 */
export async function vaultGet(
  params: { id: string },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; item?: VaultItem; error?: string }> {
  if (!hasPermission(auth, 'vault:read')) {
    return { success: false, error: 'Permission denied: vault:read required' };
  }

  try {
    const itemData = await env.VAULT_KV.get(`item:${params.id}`);
    if (!itemData) {
      return { success: false, error: 'Item not found' };
    }

    const item: VaultItem = JSON.parse(itemData);

    // Check access permissions
    if (item.isPrivate) {
      if (item.createdBy !== auth.member.id &&
          !item.sharedWith?.includes(auth.member.id) &&
          !hasPermission(auth, 'admin:all')) {
        return { success: false, error: 'Access denied to private item' };
      }
    }

    return { success: true, item };
  } catch (error) {
    console.error('Vault get error:', error);
    return { success: false, error: 'Failed to get vault item' };
  }
}

/**
 * Update a vault item
 */
export async function vaultUpdate(
  params: {
    id: string;
    title?: string;
    content?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; item?: VaultItem; error?: string }> {
  if (!hasPermission(auth, 'vault:write')) {
    return { success: false, error: 'Permission denied: vault:write required' };
  }

  try {
    const itemData = await env.VAULT_KV.get(`item:${params.id}`);
    if (!itemData) {
      return { success: false, error: 'Item not found' };
    }

    const item: VaultItem = JSON.parse(itemData);

    // Check if user can edit (creator or admin)
    if (item.createdBy !== auth.member.id && !hasPermission(auth, 'admin:all')) {
      return { success: false, error: 'Only the creator can update this item' };
    }

    // Update fields
    if (params.title) item.title = params.title;
    if (params.content) item.content = params.content;
    if (params.tags) item.tags = params.tags;
    if (params.metadata) {
      item.metadata = { ...item.metadata, ...params.metadata };
    }
    item.updatedAt = new Date().toISOString();

    await env.VAULT_KV.put(`item:${item.id}`, JSON.stringify(item));

    return { success: true, item };
  } catch (error) {
    console.error('Vault update error:', error);
    return { success: false, error: 'Failed to update vault item' };
  }
}

/**
 * Delete a vault item
 */
export async function vaultDelete(
  params: { id: string },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  if (!hasPermission(auth, 'vault:delete')) {
    return { success: false, error: 'Permission denied: vault:delete required' };
  }

  try {
    const itemData = await env.VAULT_KV.get(`item:${params.id}`);
    if (!itemData) {
      return { success: false, error: 'Item not found' };
    }

    const item: VaultItem = JSON.parse(itemData);

    // Check if user can delete (creator or admin)
    if (item.createdBy !== auth.member.id && !hasPermission(auth, 'admin:all')) {
      return { success: false, error: 'Only the creator can delete this item' };
    }

    // Remove from KV
    await env.VAULT_KV.delete(`item:${params.id}`);

    // Note: For simplicity, we don't remove from indices immediately
    // They'll be cleaned up naturally as items aren't found

    return { success: true };
  } catch (error) {
    console.error('Vault delete error:', error);
    return { success: false, error: 'Failed to delete vault item' };
  }
}
