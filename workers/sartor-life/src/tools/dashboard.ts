/**
 * Dashboard Tools
 * Daily overview and family information
 */

import type {
  Env,
  AuthContext,
  DashboardSummary,
  VaultItem,
  ChatMessage,
  MemoryItem,
  FamilyMember,
  MCPToolDefinition
} from '../types';
import { hasPermission, getFamilyMembers } from '../auth/verify';

// Dashboard tool definitions for MCP
export const dashboardTools: MCPToolDefinition[] = [
  {
    name: 'dashboard_summary',
    description: 'Get a daily overview including recent vault items, unread messages, important reminders, and family highlights.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date for the summary (ISO format, default: today)'
        },
        includeWeather: {
          type: 'boolean',
          description: 'Include weather information (requires external API)'
        }
      }
    }
  },
  {
    name: 'family_members',
    description: 'Get information about Sartor family members.',
    inputSchema: {
      type: 'object',
      properties: {
        memberId: {
          type: 'string',
          description: 'Specific member ID to get details for (optional)'
        }
      }
    }
  },
  {
    name: 'dashboard_highlights',
    description: 'Get curated highlights and important items for the family.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look back for highlights (default: 7, max: 30)'
        }
      }
    }
  },
  {
    name: 'dashboard_stats',
    description: 'Get statistics about the family vault and memories.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * Get dashboard summary
 */
export async function dashboardSummary(
  params: {
    date?: string;
    includeWeather?: boolean;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; summary?: DashboardSummary; error?: string }> {
  if (!hasPermission(auth, 'dashboard:read')) {
    return { success: false, error: 'Permission denied: dashboard:read required' };
  }

  const summaryDate = params.date || new Date().toISOString().split('T')[0];

  try {
    // Get recent vault items
    const recentVaultItems = await getRecentVaultItems(auth, env, 5);

    // Get unread message count
    const unreadCount = await getUnreadCount(auth, env);

    // Get important reminders from memories
    const reminders = await getReminders(auth, env);

    // Get today's highlights
    const highlights = await generateHighlights(auth, env);

    const summary: DashboardSummary = {
      date: summaryDate,
      familyMember: auth.member.name,
      calendar: [], // Would integrate with calendar API
      tasks: [], // Would integrate with task management
      reminders,
      recentVaultItems,
      unreadMessages: unreadCount,
      highlights
    };

    // Weather would require external API
    if (params.includeWeather) {
      summary.weather = {
        location: 'Home',
        temperature: 0,
        condition: 'Unknown',
        forecast: 'Weather integration not configured'
      };
    }

    return { success: true, summary };
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return { success: false, error: 'Failed to generate dashboard summary' };
  }
}

/**
 * Get family members information
 */
export async function familyMembers(
  params: { memberId?: string },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; members?: FamilyMember[]; member?: FamilyMember; error?: string }> {
  if (!hasPermission(auth, 'family:read')) {
    return { success: false, error: 'Permission denied: family:read required' };
  }

  const allMembers = getFamilyMembers();

  if (params.memberId) {
    const member = allMembers.find(m => m.id === params.memberId);
    if (!member) {
      return { success: false, error: 'Family member not found' };
    }
    return { success: true, member };
  }

  return { success: true, members: allMembers };
}

/**
 * Get dashboard highlights
 */
export async function dashboardHighlights(
  params: { days?: number },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; highlights?: string[]; error?: string }> {
  if (!hasPermission(auth, 'dashboard:read')) {
    return { success: false, error: 'Permission denied: dashboard:read required' };
  }

  const days = Math.min(params.days || 7, 30);

  try {
    const highlights = await generateHighlights(auth, env, days);
    return { success: true, highlights };
  } catch (error) {
    console.error('Dashboard highlights error:', error);
    return { success: false, error: 'Failed to get highlights' };
  }
}

/**
 * Get dashboard statistics
 */
export async function dashboardStats(
  auth: AuthContext,
  env: Env
): Promise<{
  success: boolean;
  stats?: {
    vaultItems: number;
    memories: number;
    messages: number;
    activeReminders: number;
  };
  error?: string;
}> {
  if (!hasPermission(auth, 'dashboard:read')) {
    return { success: false, error: 'Permission denied: dashboard:read required' };
  }

  try {
    // Count vault items
    const vaultIndex = await env.VAULT_KV.get('index:recent');
    const vaultCount = vaultIndex ? JSON.parse(vaultIndex).length : 0;

    // Count memories
    const memoryIndex = await env.MEMORY_KV.get('index:recent');
    const memoryCount = memoryIndex ? JSON.parse(memoryIndex).length : 0;

    // Count messages
    const msgIndex = await env.CHAT_KV.get('index:messages');
    const msgCount = msgIndex ? JSON.parse(msgIndex).length : 0;

    // Count active reminders
    const reminderIndex = await env.MEMORY_KV.get('index:type:reminder');
    const reminderIds: string[] = reminderIndex ? JSON.parse(reminderIndex) : [];
    let activeReminders = 0;
    const now = new Date().toISOString();

    for (const id of reminderIds.slice(0, 100)) {
      const memData = await env.MEMORY_KV.get(`memory:${id}`);
      if (memData) {
        const memory: MemoryItem = JSON.parse(memData);
        if (!memory.expiresAt || memory.expiresAt > now) {
          activeReminders++;
        }
      }
    }

    return {
      success: true,
      stats: {
        vaultItems: vaultCount,
        memories: memoryCount,
        messages: msgCount,
        activeReminders
      }
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return { success: false, error: 'Failed to get statistics' };
  }
}

// Helper functions

async function getRecentVaultItems(
  auth: AuthContext,
  env: Env,
  limit: number
): Promise<VaultItem[]> {
  const indexData = await env.VAULT_KV.get('index:recent');
  if (!indexData) return [];

  const ids: string[] = JSON.parse(indexData);
  const items: VaultItem[] = [];

  for (const id of ids.slice(0, limit * 2)) {
    if (items.length >= limit) break;

    const itemData = await env.VAULT_KV.get(`item:${id}`);
    if (!itemData) continue;

    const item: VaultItem = JSON.parse(itemData);

    // Check access
    if (item.isPrivate) {
      if (item.createdBy !== auth.member.id &&
          !item.sharedWith?.includes(auth.member.id) &&
          !hasPermission(auth, 'admin:all')) {
        continue;
      }
    }

    items.push(item);
  }

  return items;
}

async function getUnreadCount(auth: AuthContext, env: Env): Promise<number> {
  const inboxKey = `index:inbox:${auth.member.id}`;
  const inboxData = await env.CHAT_KV.get(inboxKey);
  if (!inboxData) return 0;

  const ids: string[] = JSON.parse(inboxData);
  let count = 0;
  const now = new Date().toISOString();

  for (const id of ids) {
    const msgData = await env.CHAT_KV.get(`message:${id}`);
    if (!msgData) continue;

    const message: ChatMessage = JSON.parse(msgData);

    if (message.expiresAt && message.expiresAt < now) continue;
    if (!message.readBy.includes(auth.member.id)) {
      count++;
    }
  }

  return count;
}

async function getReminders(
  auth: AuthContext,
  env: Env
): Promise<{ id: string; message: string; triggerTime: string }[]> {
  const reminderIndex = await env.MEMORY_KV.get('index:type:reminder');
  if (!reminderIndex) return [];

  const ids: string[] = JSON.parse(reminderIndex);
  const reminders: { id: string; message: string; triggerTime: string }[] = [];
  const now = new Date().toISOString();

  for (const id of ids.slice(0, 20)) {
    const memData = await env.MEMORY_KV.get(`memory:${id}`);
    if (!memData) continue;

    const memory: MemoryItem = JSON.parse(memData);

    // Skip expired
    if (memory.expiresAt && memory.expiresAt < now) continue;

    reminders.push({
      id: memory.id,
      message: memory.content,
      triggerTime: memory.createdAt
    });
  }

  return reminders.slice(0, 5);
}

async function generateHighlights(
  auth: AuthContext,
  env: Env,
  days: number = 7
): Promise<string[]> {
  const highlights: string[] = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // Check for new high-importance memories
  const memoryIndex = await env.MEMORY_KV.get('index:importance:high');
  if (memoryIndex) {
    const ids: string[] = JSON.parse(memoryIndex);
    for (const id of ids.slice(0, 5)) {
      const memData = await env.MEMORY_KV.get(`memory:${id}`);
      if (memData) {
        const memory: MemoryItem = JSON.parse(memData);
        if (memory.createdAt >= cutoff) {
          highlights.push(`Important: ${memory.content.substring(0, 100)}...`);
        }
      }
    }
  }

  // Check for critical memories
  const criticalIndex = await env.MEMORY_KV.get('index:importance:critical');
  if (criticalIndex) {
    const ids: string[] = JSON.parse(criticalIndex);
    for (const id of ids.slice(0, 3)) {
      const memData = await env.MEMORY_KV.get(`memory:${id}`);
      if (memData) {
        const memory: MemoryItem = JSON.parse(memData);
        highlights.unshift(`CRITICAL: ${memory.content.substring(0, 100)}...`);
      }
    }
  }

  // Add greeting based on time
  const hour = now.getHours();
  if (hour < 12) {
    highlights.unshift(`Good morning, ${auth.member.name}!`);
  } else if (hour < 17) {
    highlights.unshift(`Good afternoon, ${auth.member.name}!`);
  } else {
    highlights.unshift(`Good evening, ${auth.member.name}!`);
  }

  return highlights.slice(0, 10);
}
