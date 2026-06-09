/**
 * Chat and Communication Tools
 * Family messaging and dashboard notifications
 */

import type { Env, AuthContext, ChatMessage, MCPToolDefinition } from '../types';
import { hasPermission } from '../auth/verify';

// Generate unique ID
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Chat tool definitions for MCP
export const chatTools: MCPToolDefinition[] = [
  {
    name: 'chat_send',
    description: 'Send a message to the family dashboard or a specific family member. Use for notifications, reminders, alerts, and general communication.',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient: "dashboard" for family dashboard, "all" for everyone, or a family member ID (enzo, alessia, nadia)'
        },
        content: {
          type: 'string',
          description: 'Message content'
        },
        type: {
          type: 'string',
          enum: ['text', 'alert', 'reminder', 'notification'],
          description: 'Type of message'
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'Message priority'
        },
        expiresAt: {
          type: 'string',
          description: 'ISO date string for when this message expires (optional)'
        }
      },
      required: ['to', 'content']
    }
  },
  {
    name: 'chat_list',
    description: 'List recent messages, optionally filtered by sender or recipient.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'to_me', 'from_me', 'unread', 'dashboard'],
          description: 'Filter messages'
        },
        limit: {
          type: 'number',
          description: 'Number of messages to return (default: 20, max: 100)'
        }
      }
    }
  },
  {
    name: 'chat_mark_read',
    description: 'Mark a message as read.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Message ID to mark as read'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'chat_delete',
    description: 'Delete a message (only your own messages).',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Message ID to delete'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'chat_unread_count',
    description: 'Get count of unread messages for the current user.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * Send a chat message
 */
export async function chatSend(
  params: {
    to: string;
    content: string;
    type?: 'text' | 'alert' | 'reminder' | 'notification';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    expiresAt?: string;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  if (!hasPermission(auth, 'chat:write')) {
    return { success: false, error: 'Permission denied: chat:write required' };
  }

  // Validate recipient
  const validRecipients = ['dashboard', 'all', 'enzo', 'alessia', 'nadia'];
  if (!validRecipients.includes(params.to)) {
    return { success: false, error: `Invalid recipient. Must be one of: ${validRecipients.join(', ')}` };
  }

  const now = new Date().toISOString();
  const message: ChatMessage = {
    id: generateId(),
    from: auth.member.id,
    to: params.to,
    content: params.content,
    type: params.type || 'text',
    priority: params.priority || 'normal',
    createdAt: now,
    readBy: [auth.member.id], // Sender has implicitly read it
    expiresAt: params.expiresAt
  };

  try {
    // Store the message
    await env.CHAT_KV.put(`message:${message.id}`, JSON.stringify(message));

    // Update global message index
    const globalIndexKey = 'index:messages';
    const globalIndex = await env.CHAT_KV.get(globalIndexKey);
    const globalIds: string[] = globalIndex ? JSON.parse(globalIndex) : [];
    globalIds.unshift(message.id);
    await env.CHAT_KV.put(globalIndexKey, JSON.stringify(globalIds.slice(0, 2000)));

    // Update recipient-specific index
    if (params.to === 'all') {
      // Add to all family members' inboxes
      for (const member of ['enzo', 'alessia', 'nadia']) {
        await addToInbox(member, message.id, env);
      }
    } else if (params.to !== 'dashboard') {
      await addToInbox(params.to, message.id, env);
    }

    // Update dashboard index if sending to dashboard
    if (params.to === 'dashboard' || params.to === 'all') {
      const dashboardKey = 'index:dashboard';
      const dashIndex = await env.CHAT_KV.get(dashboardKey);
      const dashIds: string[] = dashIndex ? JSON.parse(dashIndex) : [];
      dashIds.unshift(message.id);
      await env.CHAT_KV.put(dashboardKey, JSON.stringify(dashIds.slice(0, 500)));
    }

    // Update sender's outbox
    const outboxKey = `index:outbox:${auth.member.id}`;
    const outboxIndex = await env.CHAT_KV.get(outboxKey);
    const outboxIds: string[] = outboxIndex ? JSON.parse(outboxIndex) : [];
    outboxIds.unshift(message.id);
    await env.CHAT_KV.put(outboxKey, JSON.stringify(outboxIds.slice(0, 500)));

    return { success: true, message };
  } catch (error) {
    console.error('Chat send error:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Helper to add message to inbox
 */
async function addToInbox(memberId: string, messageId: string, env: Env): Promise<void> {
  const inboxKey = `index:inbox:${memberId}`;
  const inboxIndex = await env.CHAT_KV.get(inboxKey);
  const inboxIds: string[] = inboxIndex ? JSON.parse(inboxIndex) : [];
  inboxIds.unshift(messageId);
  await env.CHAT_KV.put(inboxKey, JSON.stringify(inboxIds.slice(0, 500)));
}

/**
 * List chat messages
 */
export async function chatList(
  params: {
    filter?: 'all' | 'to_me' | 'from_me' | 'unread' | 'dashboard';
    limit?: number;
  },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  if (!hasPermission(auth, 'chat:read')) {
    return { success: false, error: 'Permission denied: chat:read required' };
  }

  const limit = Math.min(params.limit || 20, 100);
  const filter = params.filter || 'all';
  const now = new Date().toISOString();

  try {
    let indexKey: string;
    switch (filter) {
      case 'to_me':
        indexKey = `index:inbox:${auth.member.id}`;
        break;
      case 'from_me':
        indexKey = `index:outbox:${auth.member.id}`;
        break;
      case 'dashboard':
        indexKey = 'index:dashboard';
        break;
      default:
        indexKey = 'index:messages';
    }

    const indexData = await env.CHAT_KV.get(indexKey);
    const ids: string[] = indexData ? JSON.parse(indexData) : [];

    const messages: ChatMessage[] = [];
    for (const id of ids) {
      if (messages.length >= limit) break;

      const msgData = await env.CHAT_KV.get(`message:${id}`);
      if (!msgData) continue;

      const message: ChatMessage = JSON.parse(msgData);

      // Skip expired messages
      if (message.expiresAt && message.expiresAt < now) continue;

      // Apply unread filter
      if (filter === 'unread' && message.readBy.includes(auth.member.id)) continue;

      // Check access for private messages
      if (message.to !== 'all' && message.to !== 'dashboard') {
        if (message.to !== auth.member.id && message.from !== auth.member.id) {
          if (!hasPermission(auth, 'admin:all')) continue;
        }
      }

      messages.push(message);
    }

    return { success: true, messages };
  } catch (error) {
    console.error('Chat list error:', error);
    return { success: false, error: 'Failed to list messages' };
  }
}

/**
 * Mark message as read
 */
export async function chatMarkRead(
  params: { id: string },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  if (!hasPermission(auth, 'chat:read')) {
    return { success: false, error: 'Permission denied: chat:read required' };
  }

  try {
    const msgData = await env.CHAT_KV.get(`message:${params.id}`);
    if (!msgData) {
      return { success: false, error: 'Message not found' };
    }

    const message: ChatMessage = JSON.parse(msgData);

    // Add to readBy if not already there
    if (!message.readBy.includes(auth.member.id)) {
      message.readBy.push(auth.member.id);
      await env.CHAT_KV.put(`message:${message.id}`, JSON.stringify(message));
    }

    return { success: true };
  } catch (error) {
    console.error('Chat mark read error:', error);
    return { success: false, error: 'Failed to mark message as read' };
  }
}

/**
 * Delete a message
 */
export async function chatDelete(
  params: { id: string },
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  if (!hasPermission(auth, 'chat:write')) {
    return { success: false, error: 'Permission denied: chat:write required' };
  }

  try {
    const msgData = await env.CHAT_KV.get(`message:${params.id}`);
    if (!msgData) {
      return { success: false, error: 'Message not found' };
    }

    const message: ChatMessage = JSON.parse(msgData);

    // Only sender or admin can delete
    if (message.from !== auth.member.id && !hasPermission(auth, 'admin:all')) {
      return { success: false, error: 'Only the sender can delete this message' };
    }

    await env.CHAT_KV.delete(`message:${params.id}`);

    return { success: true };
  } catch (error) {
    console.error('Chat delete error:', error);
    return { success: false, error: 'Failed to delete message' };
  }
}

/**
 * Get unread message count
 */
export async function chatUnreadCount(
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; count?: number; error?: string }> {
  if (!hasPermission(auth, 'chat:read')) {
    return { success: false, error: 'Permission denied: chat:read required' };
  }

  try {
    const inboxKey = `index:inbox:${auth.member.id}`;
    const inboxData = await env.CHAT_KV.get(inboxKey);
    const ids: string[] = inboxData ? JSON.parse(inboxData) : [];

    let unreadCount = 0;
    const now = new Date().toISOString();

    for (const id of ids) {
      const msgData = await env.CHAT_KV.get(`message:${id}`);
      if (!msgData) continue;

      const message: ChatMessage = JSON.parse(msgData);

      // Skip expired
      if (message.expiresAt && message.expiresAt < now) continue;

      // Count unread
      if (!message.readBy.includes(auth.member.id)) {
        unreadCount++;
      }
    }

    return { success: true, count: unreadCount };
  } catch (error) {
    console.error('Chat unread count error:', error);
    return { success: false, error: 'Failed to count unread messages' };
  }
}
