/**
 * Memory Tools
 * Long-term memory storage for Sartor family AI assistant
 */

import type { Env, AuthContext, MemoryItem, MemoryType, MCPToolDefinition } from '../types';
import { hasPermission } from '../auth/verify';

// Generate unique ID
function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Memory tool definitions for MCP
export const memoryTools: MCPToolDefinition[] = [
  {
    name: 'memory_store',
    description: 'Store a memory or fact about the Sartor family. Use for remembering preferences, important events, learnings, and context that should persist across conversations.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['fact', 'preference', 'event', 'reminder', 'learning', 'interaction', 'system'],
          description: 'Type of memory to store'
        },
        content: {
          type: 'string',
          description: 'The memory content to store'
        },
        context: {
          type: 'string',
          description: 'Additional context about when/why this memory was created'
        },
        importance: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Importance level (affects retrieval priority)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorizing and finding the memory'
        },
        relatedMemories: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of related memories to link'
        },
        expiresAt: {
          type: 'string',
          description: 'ISO date string for when this memory should expire (optional)'
        }
      },
      required: ['type', 'content']
    }
  },
  {
    name: 'memory_search',
    description: 'Search through stored memories. Use to recall facts, preferences, past events, and learnings about the family.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text'
        },
        type: {
          type: 'string',
          enum: ['fact', 'preference', 'event', 'reminder', 'learning', 'interaction', 'system'],
          description: 'Filter by memory type'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags'
        },
        minImportance: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Minimum importance level'
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 10, max: 50)'
        },
        includeExpired: {
          type: 'boolean',
          description: 'Include expired memories in results'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'memory_get',
    description: 'Retrieve a specific memory by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The memory ID'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'memory_update',
    description: 'Update an existing memory.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The memory ID to update'
        },
        content: {
          type: 'string',
          description: 'New content'
        },
        importance: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'New importance level'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags'
        },
        relatedMemories: {
          type: 'array',
          items: { type: 'string' },
          description: 'New related memory IDs'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'memory_delete',
    description: 'Delete a memory (requires delete permission).',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The memory ID to delete'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'memory_list_recent',
    description: 'List the most recent memories, optionally filtered by type.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['fact', 'preference', 'event', 'reminder', 'learning', 'interaction', 'system'],
          description: 'Filter by memory type'
        },
        limit: {
          type: 'number',
          description: 'Number of memories to return (default: 10, max: 50)'
        }
      }
    }
  }
];

// Importance ranking for sorting
const importanceRank: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

/**
 * Store a new memory
 */
export async function memoryStore(
  params: {
    type: MemoryType;
    content: string;
    context?: string;
    importance?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    relatedMemories?: string[];
    expiresAt?: string;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; memory?: MemoryItem; error?: string }> {
  if (!hasPermission(auth, 'memory:write')) {
    return { success: false, error: 'Permission denied: memory:write required' };
  }

  const now = new Date().toISOString();
  const memory: MemoryItem = {
    id: generateId(),
    type: params.type,
    content: params.content,
    context: params.context,
    importance: params.importance || 'medium',
    tags: params.tags || [],
    relatedMemories: params.relatedMemories,
    createdBy: auth.member.id,
    createdAt: now,
    expiresAt: params.expiresAt
  };

  try {
    // Store the memory
    await env.MEMORY_KV.put(`memory:${memory.id}`, JSON.stringify(memory));

    // Update type index
    const typeIndexKey = `index:type:${memory.type}`;
    const typeIndex = await env.MEMORY_KV.get(typeIndexKey);
    const typeIds: string[] = typeIndex ? JSON.parse(typeIndex) : [];
    typeIds.unshift(memory.id);
    await env.MEMORY_KV.put(typeIndexKey, JSON.stringify(typeIds.slice(0, 2000)));

    // Update recent index
    const recentKey = 'index:recent';
    const recentIndex = await env.MEMORY_KV.get(recentKey);
    const recentIds: string[] = recentIndex ? JSON.parse(recentIndex) : [];
    recentIds.unshift(memory.id);
    await env.MEMORY_KV.put(recentKey, JSON.stringify(recentIds.slice(0, 2000)));

    // Update tag indices
    for (const tag of memory.tags) {
      const tagKey = `index:tag:${tag.toLowerCase()}`;
      const tagIndex = await env.MEMORY_KV.get(tagKey);
      const tagIds: string[] = tagIndex ? JSON.parse(tagIndex) : [];
      tagIds.unshift(memory.id);
      await env.MEMORY_KV.put(tagKey, JSON.stringify(tagIds.slice(0, 1000)));
    }

    // Update importance index
    const impKey = `index:importance:${memory.importance}`;
    const impIndex = await env.MEMORY_KV.get(impKey);
    const impIds: string[] = impIndex ? JSON.parse(impIndex) : [];
    impIds.unshift(memory.id);
    await env.MEMORY_KV.put(impKey, JSON.stringify(impIds.slice(0, 1000)));

    return { success: true, memory };
  } catch (error) {
    console.error('Memory store error:', error);
    return { success: false, error: 'Failed to store memory' };
  }
}

/**
 * Search memories
 */
export async function memorySearch(
  params: {
    query: string;
    type?: MemoryType;
    tags?: string[];
    minImportance?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
    includeExpired?: boolean;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; memories?: MemoryItem[]; error?: string }> {
  if (!hasPermission(auth, 'memory:read')) {
    return { success: false, error: 'Permission denied: memory:read required' };
  }

  const limit = Math.min(params.limit || 10, 50);
  const query = params.query.toLowerCase();
  const now = new Date().toISOString();

  try {
    // Get candidate IDs
    let candidateIds: string[] = [];

    if (params.type) {
      const typeIndex = await env.MEMORY_KV.get(`index:type:${params.type}`);
      candidateIds = typeIndex ? JSON.parse(typeIndex) : [];
    } else {
      const recentIndex = await env.MEMORY_KV.get('index:recent');
      candidateIds = recentIndex ? JSON.parse(recentIndex) : [];
    }

    // Filter by tags if specified
    if (params.tags && params.tags.length > 0) {
      for (const tag of params.tags) {
        const tagIndex = await env.MEMORY_KV.get(`index:tag:${tag.toLowerCase()}`);
        const tagIds: string[] = tagIndex ? JSON.parse(tagIndex) : [];
        candidateIds = candidateIds.filter(id => tagIds.includes(id));
      }
    }

    // Fetch and filter memories
    const memories: MemoryItem[] = [];
    const minRank = params.minImportance ? importanceRank[params.minImportance] : 0;

    for (const id of candidateIds) {
      if (memories.length >= limit * 2) break; // Fetch extra for filtering

      const memData = await env.MEMORY_KV.get(`memory:${id}`);
      if (!memData) continue;

      const memory: MemoryItem = JSON.parse(memData);

      // Check expiration
      if (!params.includeExpired && memory.expiresAt && memory.expiresAt < now) {
        continue;
      }

      // Check importance
      if (importanceRank[memory.importance] < minRank) {
        continue;
      }

      // Text search
      const searchableText = `${memory.content} ${memory.context || ''} ${memory.tags.join(' ')}`.toLowerCase();
      if (searchableText.includes(query)) {
        memories.push(memory);
      }
    }

    // Sort by importance and recency
    memories.sort((a, b) => {
      const impDiff = importanceRank[b.importance] - importanceRank[a.importance];
      if (impDiff !== 0) return impDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { success: true, memories: memories.slice(0, limit) };
  } catch (error) {
    console.error('Memory search error:', error);
    return { success: false, error: 'Failed to search memories' };
  }
}

/**
 * Get a specific memory
 */
export async function memoryGet(
  params: { id: string },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; memory?: MemoryItem; error?: string }> {
  if (!hasPermission(auth, 'memory:read')) {
    return { success: false, error: 'Permission denied: memory:read required' };
  }

  try {
    const memData = await env.MEMORY_KV.get(`memory:${params.id}`);
    if (!memData) {
      return { success: false, error: 'Memory not found' };
    }

    const memory: MemoryItem = JSON.parse(memData);
    return { success: true, memory };
  } catch (error) {
    console.error('Memory get error:', error);
    return { success: false, error: 'Failed to get memory' };
  }
}

/**
 * Update a memory
 */
export async function memoryUpdate(
  params: {
    id: string;
    content?: string;
    importance?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    relatedMemories?: string[];
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; memory?: MemoryItem; error?: string }> {
  if (!hasPermission(auth, 'memory:write')) {
    return { success: false, error: 'Permission denied: memory:write required' };
  }

  try {
    const memData = await env.MEMORY_KV.get(`memory:${params.id}`);
    if (!memData) {
      return { success: false, error: 'Memory not found' };
    }

    const memory: MemoryItem = JSON.parse(memData);

    // Check ownership
    if (memory.createdBy !== auth.member.id && !hasPermission(auth, 'admin:all')) {
      return { success: false, error: 'Only the creator can update this memory' };
    }

    // Update fields
    if (params.content) memory.content = params.content;
    if (params.importance) memory.importance = params.importance;
    if (params.tags) memory.tags = params.tags;
    if (params.relatedMemories) memory.relatedMemories = params.relatedMemories;

    await env.MEMORY_KV.put(`memory:${memory.id}`, JSON.stringify(memory));

    return { success: true, memory };
  } catch (error) {
    console.error('Memory update error:', error);
    return { success: false, error: 'Failed to update memory' };
  }
}

/**
 * Delete a memory
 */
export async function memoryDelete(
  params: { id: string },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  if (!hasPermission(auth, 'memory:delete')) {
    return { success: false, error: 'Permission denied: memory:delete required' };
  }

  try {
    const memData = await env.MEMORY_KV.get(`memory:${params.id}`);
    if (!memData) {
      return { success: false, error: 'Memory not found' };
    }

    const memory: MemoryItem = JSON.parse(memData);

    // Check ownership
    if (memory.createdBy !== auth.member.id && !hasPermission(auth, 'admin:all')) {
      return { success: false, error: 'Only the creator can delete this memory' };
    }

    await env.MEMORY_KV.delete(`memory:${params.id}`);

    return { success: true };
  } catch (error) {
    console.error('Memory delete error:', error);
    return { success: false, error: 'Failed to delete memory' };
  }
}

/**
 * List recent memories
 */
export async function memoryListRecent(
  params: {
    type?: MemoryType;
    limit?: number;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; memories?: MemoryItem[]; error?: string }> {
  if (!hasPermission(auth, 'memory:read')) {
    return { success: false, error: 'Permission denied: memory:read required' };
  }

  const limit = Math.min(params.limit || 10, 50);
  const now = new Date().toISOString();

  try {
    const indexKey = params.type ? `index:type:${params.type}` : 'index:recent';
    const indexData = await env.MEMORY_KV.get(indexKey);
    const ids: string[] = indexData ? JSON.parse(indexData) : [];

    const memories: MemoryItem[] = [];
    for (const id of ids) {
      if (memories.length >= limit) break;

      const memData = await env.MEMORY_KV.get(`memory:${id}`);
      if (!memData) continue;

      const memory: MemoryItem = JSON.parse(memData);

      // Skip expired
      if (memory.expiresAt && memory.expiresAt < now) continue;

      memories.push(memory);
    }

    return { success: true, memories };
  } catch (error) {
    console.error('Memory list error:', error);
    return { success: false, error: 'Failed to list memories' };
  }
}
