/**
 * Memory Service for Sartor Family Dashboard
 *
 * Provides chat persistence and memory storage using Firebase RTDB
 *
 * @module lib/memory-service
 */

import {
  rtdbGet,
  rtdbSet,
  rtdbPush,
  rtdbSubscribe,
  firestoreSetDoc,
  firestoreGetCollection,
  Memory,
  MemoryType,
} from './firebase';
import { Unsubscribe } from 'firebase/database';
import { where, orderBy, limit } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Role of the message sender
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message structure
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    toolCalls?: string[];
    familyMember?: string;
    [key: string]: unknown;
  };
}

/**
 * Chat session structure
 */
export interface ChatSession {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  familyMember?: string;
  summary?: string;
  tags?: string[];
}

/**
 * Conversation summary structure
 */
export interface ConversationSummary {
  sessionId: string;
  summary: string;
  keyTopics: string[];
  messageCount: number;
  timeRange: {
    start: string;
    end: string;
  };
  createdAt: string;
}

/**
 * Memory search result
 */
export interface MemorySearchResult {
  memory: Memory;
  relevanceScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHAT_BASE_PATH = 'chat/sessions';
const MEMORIES_PATH = 'memories';
const DEFAULT_MESSAGE_LIMIT = 50;

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * Save a chat message to a session
 *
 * @param sessionId - The session ID to save the message to
 * @param message - The message to save (without id and timestamp)
 * @returns The saved message with id and timestamp, or null on failure
 */
export async function saveMessage(
  sessionId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<Message | null> {
  const timestamp = new Date().toISOString();
  const messagePath = `${CHAT_BASE_PATH}/${sessionId}/messages`;

  const messageData: Omit<Message, 'id'> = {
    ...message,
    timestamp,
  };

  const messageId = await rtdbPush(messagePath, messageData);

  if (!messageId) {
    console.error(`Failed to save message to session ${sessionId}`);
    return null;
  }

  // Update session metadata
  await updateSessionMetadata(sessionId, {
    updatedAt: timestamp,
    incrementMessageCount: true,
  });

  return {
    id: messageId,
    ...messageData,
  };
}

/**
 * Get conversation history for a session
 *
 * @param sessionId - The session ID to get messages from
 * @param messageLimit - Maximum number of messages to retrieve (default: 50)
 * @returns Array of messages sorted by timestamp (oldest first)
 */
export async function getConversationHistory(
  sessionId: string,
  messageLimit: number = DEFAULT_MESSAGE_LIMIT
): Promise<Message[]> {
  const messagePath = `${CHAT_BASE_PATH}/${sessionId}/messages`;
  const messagesData = await rtdbGet<Record<string, Omit<Message, 'id'>>>(messagePath);

  if (!messagesData) {
    return [];
  }

  // Convert to array with IDs and sort by timestamp
  const messages: Message[] = Object.entries(messagesData)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Return the most recent messages up to the limit
  if (messages.length > messageLimit) {
    return messages.slice(-messageLimit);
  }

  return messages;
}

/**
 * Subscribe to new messages in a session
 *
 * @param sessionId - The session ID to subscribe to
 * @param callback - Function called when messages change
 * @returns Unsubscribe function, or null on failure
 */
export function subscribeToMessages(
  sessionId: string,
  callback: (messages: Message[]) => void
): Unsubscribe | null {
  const messagePath = `${CHAT_BASE_PATH}/${sessionId}/messages`;

  return rtdbSubscribe<Record<string, Omit<Message, 'id'>>>(messagePath, (data) => {
    if (!data) {
      callback([]);
      return;
    }

    const messages: Message[] = Object.entries(data)
      .map(([id, msg]) => ({ id, ...msg }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    callback(messages);
  });
}

// ============================================================================
// SESSION OPERATIONS
// ============================================================================

/**
 * Create a new chat session
 *
 * @param options - Session creation options
 * @returns The created session, or null on failure
 */
export async function createSession(options?: {
  title?: string;
  familyMember?: string;
  tags?: string[];
}): Promise<ChatSession | null> {
  const timestamp = new Date().toISOString();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const session: ChatSession = {
    id: sessionId,
    title: options?.title || `Chat ${new Date().toLocaleDateString()}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    messageCount: 0,
    familyMember: options?.familyMember,
    tags: options?.tags,
  };

  const success = await rtdbSet(`${CHAT_BASE_PATH}/${sessionId}/metadata`, session);

  if (!success) {
    console.error('Failed to create chat session');
    return null;
  }

  return session;
}

/**
 * Get a chat session by ID
 *
 * @param sessionId - The session ID
 * @returns The session, or null if not found
 */
export async function getSession(sessionId: string): Promise<ChatSession | null> {
  return rtdbGet<ChatSession>(`${CHAT_BASE_PATH}/${sessionId}/metadata`);
}

/**
 * Get all sessions for a family member
 *
 * @param familyMember - Optional family member filter
 * @param sessionLimit - Maximum number of sessions to return
 * @returns Array of sessions sorted by updatedAt (newest first)
 */
export async function getSessions(
  familyMember?: string,
  sessionLimit: number = 20
): Promise<ChatSession[]> {
  const allSessions = await rtdbGet<Record<string, { metadata: ChatSession }>>(`${CHAT_BASE_PATH}`);

  if (!allSessions) {
    return [];
  }

  let sessions = Object.values(allSessions)
    .map((s) => s.metadata)
    .filter((s): s is ChatSession => !!s);

  // Filter by family member if specified
  if (familyMember) {
    sessions = sessions.filter((s) => s.familyMember === familyMember);
  }

  // Sort by updatedAt (newest first) and limit
  return sessions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, sessionLimit);
}

/**
 * Update session metadata
 */
async function updateSessionMetadata(
  sessionId: string,
  updates: {
    title?: string;
    summary?: string;
    tags?: string[];
    updatedAt?: string;
    incrementMessageCount?: boolean;
  }
): Promise<boolean> {
  const session = await getSession(sessionId);

  if (!session) {
    // Create session metadata if it doesn't exist
    const newSession: ChatSession = {
      id: sessionId,
      title: updates.title || `Chat ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      updatedAt: updates.updatedAt || new Date().toISOString(),
      messageCount: updates.incrementMessageCount ? 1 : 0,
      summary: updates.summary,
      tags: updates.tags,
    };
    return rtdbSet(`${CHAT_BASE_PATH}/${sessionId}/metadata`, newSession);
  }

  const updatedSession: ChatSession = {
    ...session,
    title: updates.title ?? session.title,
    summary: updates.summary ?? session.summary,
    tags: updates.tags ?? session.tags,
    updatedAt: updates.updatedAt || new Date().toISOString(),
    messageCount: updates.incrementMessageCount
      ? session.messageCount + 1
      : session.messageCount,
  };

  return rtdbSet(`${CHAT_BASE_PATH}/${sessionId}/metadata`, updatedSession);
}

/**
 * Delete a chat session and all its messages
 *
 * @param sessionId - The session ID to delete
 * @returns True if successful
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  return rtdbSet(`${CHAT_BASE_PATH}/${sessionId}`, null);
}

// ============================================================================
// CONVERSATION SUMMARIZATION
// ============================================================================

/**
 * Summarize a conversation for context compression
 *
 * This creates a condensed summary of the conversation that can be used
 * to maintain context without sending all messages to the LLM.
 *
 * @param messages - Array of messages to summarize
 * @returns Conversation summary
 */
export function summarizeConversation(messages: Message[]): ConversationSummary {
  if (messages.length === 0) {
    return {
      sessionId: '',
      summary: 'No messages in conversation.',
      keyTopics: [],
      messageCount: 0,
      timeRange: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };
  }

  // Extract key information from messages
  const userMessages = messages.filter((m) => m.role === 'user');
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  // Extract topics from user messages (simple keyword extraction)
  const keyTopics = extractKeyTopics(userMessages.map((m) => m.content));

  // Create summary
  const summary = generateSummaryText(messages, keyTopics);

  // Get time range
  const sortedByTime = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return {
    sessionId: '', // Will be set when saved
    summary,
    keyTopics,
    messageCount: messages.length,
    timeRange: {
      start: sortedByTime[0].timestamp,
      end: sortedByTime[sortedByTime.length - 1].timestamp,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Extract key topics from message content
 */
function extractKeyTopics(contents: string[]): string[] {
  const allText = contents.join(' ').toLowerCase();

  // Common family-related topic keywords
  const topicKeywords = [
    'calendar', 'schedule', 'appointment', 'meeting',
    'task', 'todo', 'reminder',
    'email', 'message',
    'weather', 'forecast',
    'shopping', 'grocery', 'list',
    'dinner', 'meal', 'recipe',
    'homework', 'school', 'practice',
    'budget', 'spending', 'finance',
    'home', 'device', 'light', 'thermostat',
    'health', 'exercise', 'sleep',
    'family', 'kids', 'children',
  ];

  // Find which topics appear in the messages
  const foundTopics = topicKeywords.filter((keyword) =>
    allText.includes(keyword)
  );

  // Return unique topics (max 5)
  return [...new Set(foundTopics)].slice(0, 5);
}

/**
 * Generate summary text from messages
 */
function generateSummaryText(messages: Message[], topics: string[]): string {
  const userMessages = messages.filter((m) => m.role === 'user');
  const messageCount = messages.length;
  const userQueries = userMessages.length;

  let summary = `Conversation with ${messageCount} messages (${userQueries} user queries). `;

  if (topics.length > 0) {
    summary += `Topics discussed: ${topics.join(', ')}. `;
  }

  // Add first and last user message preview
  if (userMessages.length > 0) {
    const firstQuery = userMessages[0].content.slice(0, 100);
    summary += `Started with: "${firstQuery}${userMessages[0].content.length > 100 ? '...' : ''}". `;

    if (userMessages.length > 1) {
      const lastQuery = userMessages[userMessages.length - 1].content.slice(0, 100);
      summary += `Most recent query: "${lastQuery}${userMessages[userMessages.length - 1].content.length > 100 ? '...' : ''}".`;
    }
  }

  return summary;
}

/**
 * Save a conversation summary
 */
export async function saveConversationSummary(
  sessionId: string,
  summary: ConversationSummary
): Promise<boolean> {
  const summaryWithSession = {
    ...summary,
    sessionId,
  };

  // Save to session metadata
  return updateSessionMetadata(sessionId, {
    summary: summary.summary,
  });
}

// ============================================================================
// MEMORY STORAGE AND SEARCH
// ============================================================================

/**
 * Store a memory/fact in the memory system
 *
 * @param type - The type of memory (episodic, semantic, procedural, working)
 * @param content - The content of the memory
 * @param importance - Importance score from 0 to 1
 * @param options - Additional memory options
 * @returns The memory ID, or null on failure
 */
export async function storeMemory(
  type: MemoryType,
  content: string,
  importance: number,
  options?: {
    context?: string;
    tags?: string[];
    expiresAt?: string;
    relatedIds?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<string | null> {
  const timestamp = new Date().toISOString();

  const memoryData: Omit<Memory, 'id'> = {
    type,
    content,
    importance: Math.max(0, Math.min(1, importance)), // Clamp to 0-1
    timestamp,
    context: options?.context,
    tags: options?.tags || [],
    expiresAt: options?.expiresAt,
    relatedIds: options?.relatedIds,
    metadata: options?.metadata,
    source: {
      surface: 'dashboard',
      backend: 'firebase',
    },
  };

  // Store in hot tier (RTDB)
  const memoryId = await rtdbPush(MEMORIES_PATH, memoryData);

  if (!memoryId) {
    console.error('Failed to store memory');
    return null;
  }

  // For high-importance memories, also store in warm tier (Firestore)
  if (importance >= 0.7) {
    await firestoreSetDoc('memories', memoryId, {
      id: memoryId,
      ...memoryData,
    });
  }

  return memoryId;
}

/**
 * Search memories by query
 *
 * Performs a simple text search across memory content and tags.
 * For more sophisticated search, consider integrating vector embeddings.
 *
 * @param query - Search query string
 * @param options - Search options
 * @returns Array of matching memories with relevance scores
 */
export async function searchMemories(
  query: string,
  options?: {
    type?: MemoryType;
    minImportance?: number;
    tags?: string[];
    limit?: number;
  }
): Promise<MemorySearchResult[]> {
  const allMemories = await rtdbGet<Record<string, Memory>>(MEMORIES_PATH);

  if (!allMemories) {
    return [];
  }

  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 2);

  let results: MemorySearchResult[] = [];

  for (const [id, memory] of Object.entries(allMemories)) {
    // Apply filters
    if (options?.type && memory.type !== options.type) continue;
    if (options?.minImportance && memory.importance < options.minImportance) continue;
    if (options?.tags && !options.tags.some((tag) => memory.tags?.includes(tag))) continue;

    // Check if memory is expired
    if (memory.expiresAt && new Date(memory.expiresAt) < new Date()) continue;

    // Calculate relevance score
    const relevanceScore = calculateRelevance(memory, queryLower, queryTerms);

    if (relevanceScore > 0) {
      results.push({
        memory: { ...memory, id },
        relevanceScore,
      });
    }
  }

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Apply limit
  const resultLimit = options?.limit || 10;
  return results.slice(0, resultLimit);
}

/**
 * Calculate relevance score for a memory against a query
 */
function calculateRelevance(
  memory: Memory,
  queryLower: string,
  queryTerms: string[]
): number {
  let score = 0;
  const contentLower = memory.content.toLowerCase();
  const contextLower = memory.context?.toLowerCase() || '';

  // Exact match in content
  if (contentLower.includes(queryLower)) {
    score += 1.0;
  }

  // Term matches in content
  for (const term of queryTerms) {
    if (contentLower.includes(term)) {
      score += 0.3;
    }
    if (contextLower.includes(term)) {
      score += 0.2;
    }
  }

  // Tag matches
  if (memory.tags) {
    for (const tag of memory.tags) {
      if (queryTerms.includes(tag.toLowerCase())) {
        score += 0.5;
      }
    }
  }

  // Boost by importance
  score *= 0.5 + memory.importance * 0.5;

  // Recency boost (memories from last 24 hours get a small boost)
  const ageHours =
    (Date.now() - new Date(memory.timestamp).getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) {
    score *= 1.1;
  }

  return score;
}

/**
 * Get memories by type
 */
export async function getMemoriesByType(
  type: MemoryType,
  limitCount: number = 20
): Promise<Memory[]> {
  const allMemories = await rtdbGet<Record<string, Memory>>(MEMORIES_PATH);

  if (!allMemories) {
    return [];
  }

  return Object.entries(allMemories)
    .filter(([_, memory]) => memory.type === type)
    .map(([id, memory]) => ({ ...memory, id }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limitCount);
}

/**
 * Get high-importance memories
 */
export async function getImportantMemories(
  minImportance: number = 0.8,
  limitCount: number = 10
): Promise<Memory[]> {
  const allMemories = await rtdbGet<Record<string, Memory>>(MEMORIES_PATH);

  if (!allMemories) {
    return [];
  }

  return Object.entries(allMemories)
    .filter(([_, memory]) => memory.importance >= minImportance)
    .map(([id, memory]) => ({ ...memory, id }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, limitCount);
}

/**
 * Delete a memory
 */
export async function deleteMemory(memoryId: string): Promise<boolean> {
  return rtdbSet(`${MEMORIES_PATH}/${memoryId}`, null);
}

/**
 * Update a memory's importance
 */
export async function updateMemoryImportance(
  memoryId: string,
  importance: number
): Promise<boolean> {
  const memory = await rtdbGet<Memory>(`${MEMORIES_PATH}/${memoryId}`);

  if (!memory) {
    return false;
  }

  const clampedImportance = Math.max(0, Math.min(1, importance));

  return rtdbSet(`${MEMORIES_PATH}/${memoryId}`, {
    ...memory,
    importance: clampedImportance,
  });
}

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

/**
 * Build context for a new conversation turn
 *
 * Combines recent messages with relevant memories to create
 * optimal context for the LLM.
 *
 * @param sessionId - The current session ID
 * @param currentQuery - The user's current query
 * @param options - Context building options
 * @returns Context object with messages and memories
 */
export async function buildConversationContext(
  sessionId: string,
  currentQuery: string,
  options?: {
    maxMessages?: number;
    includeMemories?: boolean;
    maxMemories?: number;
  }
): Promise<{
  recentMessages: Message[];
  relevantMemories: Memory[];
  summary?: string;
}> {
  const maxMessages = options?.maxMessages || 20;
  const includeMemories = options?.includeMemories ?? true;
  const maxMemories = options?.maxMemories || 5;

  // Get recent conversation history
  const recentMessages = await getConversationHistory(sessionId, maxMessages);

  // Get session summary if available
  const session = await getSession(sessionId);

  // Search for relevant memories based on current query
  let relevantMemories: Memory[] = [];

  if (includeMemories && currentQuery) {
    const searchResults = await searchMemories(currentQuery, {
      minImportance: 0.5,
      limit: maxMemories,
    });
    relevantMemories = searchResults.map((r) => r.memory);
  }

  return {
    recentMessages,
    relevantMemories,
    summary: session?.summary,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  Memory,
  MemoryType,
} from './firebase';
