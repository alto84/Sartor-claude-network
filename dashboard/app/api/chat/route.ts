/**
 * Chat API Route with Real Claude Integration
 *
 * Handles chat messages between family members and Claude.
 * Uses the Anthropic SDK for real Claude responses.
 *
 * @module app/api/chat/route
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  rtdbGet,
  rtdbPush,
  rtdbSet,
  getRecentMemories,
  getImportantMemories,
  createMemory,
  Memory,
} from '@/lib/firebase';

// ============================================================================
// TYPES
// ============================================================================

interface ChatRequest {
  content: string;
  userId: string;
  userName: string;
  sessionId?: string;
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  suggestions?: string[];
  toolCalls?: ToolCallResult[];
}

interface ToolCallResult {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
}

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  userId: string;
  userName: string;
  timestamp: string;
  sessionId: string;
  metadata?: {
    suggestions?: string[];
    toolCalls?: ToolCallResult[];
    model?: string;
  };
}

// ============================================================================
// CLAUDE CLIENT INITIALIZATION
// ============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are Claude, the AI assistant for the Sartor family. You help manage their daily life through a unified dashboard.

Your capabilities include:
- **Calendar & Scheduling**: Help with events, appointments, and finding free time
- **Task Management**: Track todos, set reminders, prioritize work
- **Smart Home**: Control lights, thermostat, security (when connected)
- **Family Coordination**: Shared calendars, meal planning, logistics
- **General Assistance**: Answer questions, provide advice, help with planning

Communication style:
- Warm and friendly - you're part of the household
- Concise for quick queries, detailed when asked
- Proactive with helpful suggestions
- Respectful of family members' time

When you can help with something, be specific about what you can do. When you need more information, ask clarifying questions.

Always end responses with 2-3 relevant follow-up suggestions when appropriate.`;

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const tools: Anthropic.Tool[] = [
  {
    name: 'get_calendar_events',
    description: 'Get calendar events for a specific date range',
    input_schema: {
      type: 'object' as const,
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in ISO format (YYYY-MM-DD)',
        },
        endDate: {
          type: 'string',
          description: 'End date in ISO format (YYYY-MM-DD)',
        },
        familyMember: {
          type: 'string',
          description: 'Optional: filter by family member name',
        },
      },
      required: ['startDate'],
    },
  },
  {
    name: 'get_tasks',
    description: 'Get pending tasks, optionally filtered by assignee or due date',
    input_schema: {
      type: 'object' as const,
      properties: {
        assignee: {
          type: 'string',
          description: 'Filter by assigned family member',
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed'],
          description: 'Filter by task status',
        },
        dueBefore: {
          type: 'string',
          description: 'Get tasks due before this date (ISO format)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task for a family member',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Task title',
        },
        description: {
          type: 'string',
          description: 'Task description',
        },
        assignee: {
          type: 'string',
          description: 'Family member to assign the task to',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO format',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Task priority',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_smart_home_status',
    description: 'Get the current status of smart home devices',
    input_schema: {
      type: 'object' as const,
      properties: {
        deviceType: {
          type: 'string',
          enum: ['thermostat', 'lights', 'security', 'garage', 'all'],
          description: 'Type of device to check',
        },
      },
      required: [],
    },
  },
  {
    name: 'control_smart_home',
    description: 'Control a smart home device',
    input_schema: {
      type: 'object' as const,
      properties: {
        device: {
          type: 'string',
          description: 'Device to control (e.g., "living_room_lights", "thermostat")',
        },
        action: {
          type: 'string',
          description: 'Action to perform (e.g., "turn_on", "turn_off", "set_temperature")',
        },
        value: {
          type: 'string',
          description: 'Optional value for the action (e.g., temperature value)',
        },
      },
      required: ['device', 'action'],
    },
  },
  {
    name: 'search_memories',
    description: 'Search through family memories, notes, and stored information',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to filter by',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_memory',
    description: 'Store a new memory or note for future reference',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'The information to remember',
        },
        type: {
          type: 'string',
          enum: ['episodic', 'semantic', 'procedural'],
          description: 'Type of memory',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        importance: {
          type: 'number',
          description: 'Importance level from 0 to 1',
        },
      },
      required: ['content'],
    },
  },
];

// ============================================================================
// TOOL EXECUTION
// ============================================================================

async function executeToolCall(
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'get_calendar_events': {
      // TODO: Integrate with actual calendar API
      const { startDate, endDate, familyMember } = input as {
        startDate: string;
        endDate?: string;
        familyMember?: string;
      };

      // For now, return sample data - replace with real calendar integration
      return {
        events: [
          {
            id: '1',
            title: 'Team standup',
            start: `${startDate}T09:00:00`,
            end: `${startDate}T09:30:00`,
            attendees: ['Alton'],
          },
          {
            id: '2',
            title: 'School pickup',
            start: `${startDate}T15:30:00`,
            end: `${startDate}T16:00:00`,
            attendees: ['Family'],
          },
        ],
        filtered: familyMember ? `Filtered for ${familyMember}` : undefined,
      };
    }

    case 'get_tasks': {
      // Fetch tasks from Firebase
      const tasks = await rtdbGet<Record<string, unknown>>('tasks');
      if (!tasks) {
        return { tasks: [], message: 'No tasks found' };
      }

      let taskList = Object.values(tasks);
      const { assignee, status, dueBefore } = input as {
        assignee?: string;
        status?: string;
        dueBefore?: string;
      };

      if (assignee) {
        taskList = taskList.filter((t: any) => t.assignee === assignee);
      }
      if (status) {
        taskList = taskList.filter((t: any) => t.status === status);
      }
      if (dueBefore) {
        taskList = taskList.filter((t: any) => t.dueDate && t.dueDate < dueBefore);
      }

      return { tasks: taskList };
    }

    case 'create_task': {
      const { title, description, assignee, dueDate, priority } = input as {
        title: string;
        description?: string;
        assignee?: string;
        dueDate?: string;
        priority?: 'low' | 'medium' | 'high';
      };

      const now = new Date().toISOString();
      const task = {
        title,
        description: description || '',
        assignee: assignee || 'Unassigned',
        dueDate: dueDate || null,
        priority: priority || 'medium',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      const taskId = await rtdbPush('tasks', task);
      return { success: true, taskId, task };
    }

    case 'get_smart_home_status': {
      // TODO: Integrate with Home Assistant
      const { deviceType } = input as { deviceType?: string };

      // Sample smart home status
      const status = {
        thermostat: { temperature: 72, setPoint: 70, mode: 'cool' },
        lights: {
          living_room: 'on',
          bedroom: 'off',
          kitchen: 'off',
        },
        security: { armed: true, mode: 'away' },
        garage: { status: 'closed' },
      };

      if (deviceType && deviceType !== 'all') {
        return { [deviceType]: status[deviceType as keyof typeof status] };
      }
      return status;
    }

    case 'control_smart_home': {
      // TODO: Integrate with Home Assistant
      const { device, action, value } = input as {
        device: string;
        action: string;
        value?: string;
      };

      // Simulate control action
      return {
        success: true,
        message: `${action} executed on ${device}${value ? ` with value ${value}` : ''}`,
        device,
        action,
        value,
      };
    }

    case 'search_memories': {
      const { query, tags } = input as { query: string; tags?: string[] };

      // Search recent and important memories
      const recentMemories = await getRecentMemories(20);
      const importantMemories = await getImportantMemories(0.7);

      // Combine and deduplicate
      const allMemories = [...recentMemories, ...importantMemories];
      const uniqueMemories = Array.from(
        new Map(allMemories.map((m) => [m.id, m])).values()
      );

      // Simple text search
      const queryLower = query.toLowerCase();
      const results = uniqueMemories.filter((m) => {
        const contentMatch = m.content.toLowerCase().includes(queryLower);
        const tagMatch = tags ? tags.some((t) => m.tags?.includes(t)) : true;
        return contentMatch && tagMatch;
      });

      return { memories: results, total: results.length };
    }

    case 'create_memory': {
      const { content, type, tags, importance } = input as {
        content: string;
        type?: Memory['type'];
        tags?: string[];
        importance?: number;
      };

      const memoryId = await createMemory({
        type: type || 'semantic',
        content,
        tags: tags || [],
        importance: importance ?? 0.5,
        source: {
          surface: 'dashboard',
          backend: 'firebase',
        },
      });

      return { success: true, memoryId };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ============================================================================
// CONVERSATION HISTORY
// ============================================================================

async function loadConversationHistory(
  sessionId: string,
  limit: number = 20
): Promise<StoredMessage[]> {
  const messages = await rtdbGet<Record<string, StoredMessage>>(
    `chat/sessions/${sessionId}/messages`
  );

  if (!messages) return [];

  const messageList = Object.values(messages) as StoredMessage[];
  return messageList
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-limit);
}

async function saveMessage(message: StoredMessage): Promise<string | null> {
  const path = `chat/sessions/${message.sessionId}/messages`;
  return rtdbPush(path, message);
}

async function updateSessionMetadata(sessionId: string, userId: string): Promise<void> {
  await rtdbSet(`chat/sessions/${sessionId}/metadata`, {
    lastActivity: new Date().toISOString(),
    lastUserId: userId,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function convertToAnthropicMessages(
  messages: StoredMessage[]
): Anthropic.MessageParam[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}

function generateSuggestions(content: string, toolCalls?: ToolCallResult[]): string[] {
  const suggestions: string[] = [];
  const lowerContent = content.toLowerCase();

  // Context-based suggestions
  if (lowerContent.includes('calendar') || lowerContent.includes('schedule')) {
    suggestions.push('Show tomorrow\'s schedule');
    suggestions.push('Find free time this week');
  }

  if (lowerContent.includes('task') || lowerContent.includes('todo')) {
    suggestions.push('What else is due today?');
    suggestions.push('Show completed tasks');
  }

  if (lowerContent.includes('home') || lowerContent.includes('thermostat') || lowerContent.includes('light')) {
    suggestions.push('Turn off all lights');
    suggestions.push('Set thermostat to 72');
  }

  // Tool-based suggestions
  if (toolCalls?.some((t) => t.name === 'get_tasks')) {
    suggestions.push('Create a new task');
    suggestions.push('Show high priority tasks');
  }

  // Default suggestions if none generated
  if (suggestions.length === 0) {
    suggestions.push('What\'s on my calendar today?');
    suggestions.push('Show pending tasks');
    suggestions.push('Smart home status');
  }

  return suggestions.slice(0, 3);
}

// ============================================================================
// MAIN CHAT HANDLER
// ============================================================================

async function handleChatMessage(
  content: string,
  userId: string,
  userName: string,
  sessionId: string
): Promise<ChatResponse> {
  const client = getAnthropicClient();

  // Load conversation history
  const history = await loadConversationHistory(sessionId);
  const anthropicMessages = convertToAnthropicMessages(history);

  // Add the new user message
  anthropicMessages.push({ role: 'user', content });

  // Load relevant memories for context
  const recentMemories = await getRecentMemories(5);
  const importantMemories = await getImportantMemories(0.9);

  // Build context from memories
  let memoryContext = '';
  if (recentMemories.length > 0 || importantMemories.length > 0) {
    const allMemories = [...importantMemories, ...recentMemories].slice(0, 5);
    memoryContext = '\n\nRelevant context from memory:\n' +
      allMemories.map((m) => `- ${m.content}`).join('\n');
  }

  const systemPrompt = SYSTEM_PROMPT +
    `\n\nCurrent user: ${userName} (ID: ${userId})` +
    memoryContext;

  // Call Claude API
  let response: Anthropic.Message;
  const toolCallResults: ToolCallResult[] = [];

  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
    });

    // Handle tool use in a loop
    let currentResponse = response;
    let iterations = 0;
    const maxIterations = 5;

    while (
      currentResponse.stop_reason === 'tool_use' &&
      iterations < maxIterations
    ) {
      iterations++;

      // Find tool use blocks
      const toolUseBlocks = currentResponse.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute each tool
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeToolCall(
          toolUse.name,
          toolUse.input as Record<string, unknown>
        );

        toolCallResults.push({
          id: toolUse.id,
          name: toolUse.name,
          input: toolUse.input as Record<string, unknown>,
          result,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Continue the conversation with tool results
      anthropicMessages.push({
        role: 'assistant',
        content: currentResponse.content,
      });
      anthropicMessages.push({
        role: 'user',
        content: toolResults,
      });

      currentResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages: anthropicMessages,
      });
    }

    response = currentResponse;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }

  // Extract text content from response
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );
  const responseContent = textBlocks.map((b) => b.text).join('\n');

  // Save user message
  const userMessageId = generateId();
  const userMessage: StoredMessage = {
    id: userMessageId,
    role: 'user',
    content,
    userId,
    userName,
    timestamp: new Date().toISOString(),
    sessionId,
  };
  await saveMessage(userMessage);

  // Save assistant message
  const assistantMessageId = generateId();
  const suggestions = generateSuggestions(responseContent, toolCallResults);
  const assistantMessage: StoredMessage = {
    id: assistantMessageId,
    role: 'assistant',
    content: responseContent,
    userId: 'claude',
    userName: 'Claude',
    timestamp: new Date().toISOString(),
    sessionId,
    metadata: {
      suggestions,
      toolCalls: toolCallResults.length > 0 ? toolCallResults : undefined,
      model: 'claude-sonnet-4-20250514',
    },
  };
  await saveMessage(assistantMessage);

  // Update session metadata
  await updateSessionMetadata(sessionId, userId);

  return {
    id: assistantMessageId,
    content: responseContent,
    timestamp: assistantMessage.timestamp,
    suggestions,
    toolCalls: toolCallResults.length > 0 ? toolCallResults : undefined,
  };
}

// ============================================================================
// STREAMING HANDLER
// ============================================================================

async function handleStreamingChat(
  content: string,
  userId: string,
  userName: string,
  sessionId: string
): Promise<ReadableStream> {
  const client = getAnthropicClient();

  // Load conversation history
  const history = await loadConversationHistory(sessionId);
  const anthropicMessages = convertToAnthropicMessages(history);
  anthropicMessages.push({ role: 'user', content });

  // Load relevant memories
  const recentMemories = await getRecentMemories(5);
  const importantMemories = await getImportantMemories(0.9);

  let memoryContext = '';
  if (recentMemories.length > 0 || importantMemories.length > 0) {
    const allMemories = [...importantMemories, ...recentMemories].slice(0, 5);
    memoryContext = '\n\nRelevant context from memory:\n' +
      allMemories.map((m) => `- ${m.content}`).join('\n');
  }

  const systemPrompt = SYSTEM_PROMPT +
    `\n\nCurrent user: ${userName} (ID: ${userId})` +
    memoryContext;

  // Save user message first
  const userMessageId = generateId();
  const userMessage: StoredMessage = {
    id: userMessageId,
    role: 'user',
    content,
    userId,
    userName,
    timestamp: new Date().toISOString(),
    sessionId,
  };
  await saveMessage(userMessage);

  const encoder = new TextEncoder();
  let fullContent = '';
  const assistantMessageId = generateId();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: anthropicMessages,
        });

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const text = event.delta.text;
            fullContent += text;

            // Send SSE event
            const data = JSON.stringify({ type: 'text', content: text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // Generate suggestions based on full content
        const suggestions = generateSuggestions(fullContent);

        // Save the complete assistant message
        const assistantMessage: StoredMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: fullContent,
          userId: 'claude',
          userName: 'Claude',
          timestamp: new Date().toISOString(),
          sessionId,
          metadata: {
            suggestions,
            model: 'claude-sonnet-4-20250514',
          },
        };
        await saveMessage(assistantMessage);
        await updateSessionMetadata(sessionId, userId);

        // Send completion event with suggestions
        const completeData = JSON.stringify({
          type: 'complete',
          id: assistantMessageId,
          suggestions,
        });
        controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));

        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        const errorData = JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { content, userId, userName, sessionId, stream } = body;

    if (!content || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: content, userId, userName' },
        { status: 400 }
      );
    }

    const effectiveSessionId = sessionId || `${userId}-default`;

    // Check for streaming request
    if (stream || request.headers.get('Accept') === 'text/event-stream') {
      const streamResponse = await handleStreamingChat(
        content,
        userId,
        userName,
        effectiveSessionId
      );

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming request
    const response = await handleChatMessage(
      content,
      userId,
      userName,
      effectiveSessionId
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'API configuration error. Please check server settings.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'Missing sessionId or userId parameter' },
        { status: 400 }
      );
    }

    const effectiveSessionId = sessionId || `${userId}-default`;
    const messages = await loadConversationHistory(effectiveSessionId, limit);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Chat API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
