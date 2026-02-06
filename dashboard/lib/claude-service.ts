/**
 * Claude Service Library for Sartor Family Dashboard
 *
 * Provides direct integration with Claude API for family chat interactions.
 * Uses the Anthropic SDK for all Claude communications.
 *
 * @module lib/claude-service
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  ContentBlock,
  Tool,
  ToolUseBlock,
  TextBlock,
  Message,
  RawMessageStreamEvent
} from '@anthropic-ai/sdk/resources/messages';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

/**
 * Family-focused system prompt for the Sartor household
 */
const FAMILY_SYSTEM_PROMPT = `You are Claude, the friendly AI assistant for the Sartor family household in Montclair, NJ.

## Family Members
- **Alton** - Father, the primary tech administrator
- **Aneeta** - Mother
- **Vayu** - Son, 10 years old
- **Vishala** - Daughter, 8 years old
- **Vasu** - Son, 4 years old

## Your Role
You help the family with daily life management including:
- Calendar and scheduling coordination
- Task management and reminders
- Answering questions and providing information
- Smart home control assistance
- Family activity planning
- Homework help for the kids (age-appropriate)
- Meal planning and grocery lists

## Communication Style
- Be warm, friendly, and conversational - you're part of the household
- Adjust your tone based on who you're speaking with:
  - With adults: Professional but friendly, detailed when needed
  - With kids: Simple language, encouraging, patient, and fun
- Keep responses concise unless more detail is requested
- Be proactive with helpful suggestions when appropriate
- Remember context from the conversation

## Important Guidelines
- Respect privacy between family members unless explicitly shared
- For the children, keep content age-appropriate
- Financial matters should only be discussed with adults
- Safety is always a priority, especially regarding the kids
- When unsure about family preferences, ask rather than assume

## Location Context
The family lives in Montclair, New Jersey. Consider local context for:
- Weather and seasonal activities
- Local events and attractions
- School schedules (typical NJ school calendar)
- Time zone (Eastern Time)

Be helpful, be kind, and help make the Sartor household run smoothly!`;

// ============================================================================
// TYPES
// ============================================================================

/**
 * A message in the conversation history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Tool definition for Claude to use
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Response from a chat request
 */
export interface ChatResponse {
  content: string;
  toolCalls?: ToolCallResult[];
  stopReason: string | null;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * A tool call made by Claude
 */
export interface ToolCallResult {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Streaming event types
 */
export type StreamEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_use'; toolCall: ToolCallResult }
  | { type: 'done'; response: ChatResponse }
  | { type: 'error'; error: Error };

/**
 * Options for chat requests
 */
export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  systemPrompt?: string;
}

// ============================================================================
// PLACEHOLDER TOOLS
// ============================================================================

/**
 * Placeholder array for tool definitions
 * Add family-specific tools here as they are implemented
 */
export const familyTools: ToolDefinition[] = [
  // Example placeholder - uncomment and modify as needed:
  // {
  //   name: 'get_calendar_events',
  //   description: 'Get calendar events for a family member',
  //   input_schema: {
  //     type: 'object',
  //     properties: {
  //       userId: { type: 'string', description: 'Family member ID' },
  //       startDate: { type: 'string', description: 'Start date (ISO format)' },
  //       endDate: { type: 'string', description: 'End date (ISO format)' }
  //     },
  //     required: ['userId']
  //   }
  // },
  // {
  //   name: 'create_task',
  //   description: 'Create a new task for a family member',
  //   input_schema: {
  //     type: 'object',
  //     properties: {
  //       title: { type: 'string', description: 'Task title' },
  //       assignee: { type: 'string', description: 'Family member to assign to' },
  //       dueDate: { type: 'string', description: 'Due date (ISO format)' },
  //       priority: { type: 'string', enum: ['low', 'medium', 'high'] }
  //     },
  //     required: ['title']
  //   }
  // },
  // {
  //   name: 'control_smart_home',
  //   description: 'Control smart home devices',
  //   input_schema: {
  //     type: 'object',
  //     properties: {
  //       device: { type: 'string', description: 'Device name or ID' },
  //       action: { type: 'string', description: 'Action to perform' },
  //       value: { type: 'string', description: 'Optional value for the action' }
  //     },
  //     required: ['device', 'action']
  //   }
  // }
];

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error class for Claude service errors
 */
export class ClaudeServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ClaudeServiceError';
  }
}

/**
 * Handle API errors and convert to ClaudeServiceError
 */
function handleApiError(error: unknown): never {
  if (error instanceof Anthropic.APIError) {
    throw new ClaudeServiceError(
      error.message,
      `API_ERROR_${error.status}`,
      { status: error.status, headers: error.headers }
    );
  }

  if (error instanceof Anthropic.APIConnectionError) {
    throw new ClaudeServiceError(
      'Failed to connect to Claude API',
      'CONNECTION_ERROR',
      { cause: error.cause }
    );
  }

  if (error instanceof Anthropic.RateLimitError) {
    throw new ClaudeServiceError(
      'Rate limit exceeded. Please try again later.',
      'RATE_LIMIT',
      { retryAfter: error.headers?.get?.('retry-after') }
    );
  }

  if (error instanceof Anthropic.AuthenticationError) {
    throw new ClaudeServiceError(
      'Authentication failed. Please check your API key.',
      'AUTH_ERROR'
    );
  }

  if (error instanceof Error) {
    throw new ClaudeServiceError(
      error.message,
      'UNKNOWN_ERROR',
      { originalError: error.name }
    );
  }

  throw new ClaudeServiceError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR'
  );
}

// ============================================================================
// CLAUDE CLIENT
// ============================================================================

/**
 * Singleton Anthropic client instance
 */
let anthropicClient: Anthropic | null = null;

/**
 * Get or create the Anthropic client
 */
function getClient(): Anthropic {
  if (!anthropicClient) {
    // The SDK automatically reads ANTHROPIC_API_KEY from environment
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert conversation history to Anthropic message format
 */
function toMessageParams(history: ConversationMessage[]): MessageParam[] {
  return history.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

/**
 * Extract text content from Claude's response
 */
function extractTextContent(content: ContentBlock[]): string {
  return content
    .filter((block): block is TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');
}

/**
 * Extract tool calls from Claude's response
 */
function extractToolCalls(content: ContentBlock[]): ToolCallResult[] {
  return content
    .filter((block): block is ToolUseBlock => block.type === 'tool_use')
    .map(block => ({
      id: block.id,
      name: block.name,
      input: block.input as Record<string, unknown>
    }));
}

/**
 * Build the full system prompt with user context
 */
function buildSystemPrompt(userId: string, customPrompt?: string): string {
  const userContext = `\n\nCurrent user: ${userId}`;
  const basePrompt = customPrompt || FAMILY_SYSTEM_PROMPT;
  return basePrompt + userContext;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Send a message to Claude and get a response
 *
 * @param message - The user's message
 * @param conversationHistory - Previous messages in the conversation
 * @param userId - The ID of the family member sending the message
 * @param options - Optional configuration for the request
 * @returns The response from Claude
 *
 * @example
 * ```typescript
 * const response = await chat(
 *   "What's on the calendar for today?",
 *   previousMessages,
 *   "alton"
 * );
 * console.log(response.content);
 * ```
 */
export async function chat(
  message: string,
  conversationHistory: ConversationMessage[] = [],
  userId: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const client = getClient();

  const {
    maxTokens = MAX_TOKENS,
    temperature,
    tools = familyTools,
    systemPrompt
  } = options;

  // Build messages array with history and new message
  const messages: MessageParam[] = [
    ...toMessageParams(conversationHistory),
    { role: 'user', content: message }
  ];

  try {
    const requestParams: Anthropic.MessageCreateParams = {
      model: MODEL,
      max_tokens: maxTokens,
      system: buildSystemPrompt(userId, systemPrompt),
      messages
    };

    // Only add temperature if specified (API has a default)
    if (temperature !== undefined) {
      requestParams.temperature = temperature;
    }

    // Only add tools if there are any defined
    if (tools.length > 0) {
      requestParams.tools = tools as Tool[];
    }

    const response: Message = await client.messages.create(requestParams);

    return {
      content: extractTextContent(response.content),
      toolCalls: extractToolCalls(response.content),
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Send a message to Claude with streaming response
 *
 * @param message - The user's message
 * @param conversationHistory - Previous messages in the conversation
 * @param userId - The ID of the family member sending the message
 * @param options - Optional configuration for the request
 * @returns An async generator that yields stream events
 *
 * @example
 * ```typescript
 * const stream = streamChat(
 *   "Tell me a story for bedtime",
 *   previousMessages,
 *   "vayu"
 * );
 *
 * for await (const event of stream) {
 *   if (event.type === 'text') {
 *     process.stdout.write(event.content);
 *   } else if (event.type === 'done') {
 *     console.log('\nDone!', event.response.usage);
 *   }
 * }
 * ```
 */
export async function* streamChat(
  message: string,
  conversationHistory: ConversationMessage[] = [],
  userId: string,
  options: ChatOptions = {}
): AsyncGenerator<StreamEvent> {
  const client = getClient();

  const {
    maxTokens = MAX_TOKENS,
    temperature,
    tools = familyTools,
    systemPrompt
  } = options;

  // Build messages array with history and new message
  const messages: MessageParam[] = [
    ...toMessageParams(conversationHistory),
    { role: 'user', content: message }
  ];

  try {
    const requestParams: Anthropic.MessageCreateParams = {
      model: MODEL,
      max_tokens: maxTokens,
      system: buildSystemPrompt(userId, systemPrompt),
      messages,
      stream: true
    };

    // Only add temperature if specified
    if (temperature !== undefined) {
      requestParams.temperature = temperature;
    }

    // Only add tools if there are any defined
    if (tools.length > 0) {
      requestParams.tools = tools as Tool[];
    }

    const stream = await client.messages.stream(requestParams);

    let fullContent = '';
    const toolCalls: ToolCallResult[] = [];
    let currentToolUse: Partial<ToolCallResult> | null = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let stopReason: string | null = null;

    for await (const event of stream) {
      const rawEvent = event as RawMessageStreamEvent;

      switch (rawEvent.type) {
        case 'message_start':
          if ('message' in rawEvent && rawEvent.message?.usage) {
            inputTokens = rawEvent.message.usage.input_tokens;
          }
          break;

        case 'content_block_start':
          if ('content_block' in rawEvent) {
            const block = rawEvent.content_block;
            if (block?.type === 'tool_use') {
              currentToolUse = {
                id: block.id,
                name: block.name,
                input: {}
              };
            }
          }
          break;

        case 'content_block_delta':
          if ('delta' in rawEvent && rawEvent.delta) {
            const delta = rawEvent.delta as { type: string; text?: string; partial_json?: string };
            if (delta.type === 'text_delta' && delta.text) {
              fullContent += delta.text;
              yield { type: 'text', content: delta.text };
            } else if (delta.type === 'input_json_delta' && delta.partial_json && currentToolUse) {
              // Accumulate JSON for tool use
              // Note: Full parsing happens at content_block_stop
            }
          }
          break;

        case 'content_block_stop':
          if (currentToolUse && currentToolUse.id && currentToolUse.name) {
            const toolCall: ToolCallResult = {
              id: currentToolUse.id,
              name: currentToolUse.name,
              input: currentToolUse.input || {}
            };
            toolCalls.push(toolCall);
            yield { type: 'tool_use', toolCall };
            currentToolUse = null;
          }
          break;

        case 'message_delta':
          if ('delta' in rawEvent && rawEvent.delta) {
            const delta = rawEvent.delta as { stop_reason?: string };
            if (delta.stop_reason) {
              stopReason = delta.stop_reason;
            }
          }
          if ('usage' in rawEvent && rawEvent.usage) {
            const usage = rawEvent.usage as { output_tokens?: number };
            if (usage.output_tokens) {
              outputTokens = usage.output_tokens;
            }
          }
          break;

        case 'message_stop':
          yield {
            type: 'done',
            response: {
              content: fullContent,
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              stopReason,
              usage: {
                inputTokens,
                outputTokens
              }
            }
          };
          break;
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get family member display name from userId
 */
export function getFamilyMemberName(userId: string): string {
  const familyMembers: Record<string, string> = {
    alton: 'Alton',
    aneeta: 'Aneeta',
    vayu: 'Vayu',
    vishala: 'Vishala',
    vasu: 'Vasu'
  };

  return familyMembers[userId.toLowerCase()] || userId;
}

/**
 * Check if a user is a child (for content filtering)
 */
export function isChildUser(userId: string): boolean {
  const children = ['vayu', 'vishala', 'vasu'];
  return children.includes(userId.toLowerCase());
}

/**
 * Check if a user is an adult (for financial/sensitive content)
 */
export function isAdultUser(userId: string): boolean {
  const adults = ['alton', 'aneeta'];
  return adults.includes(userId.toLowerCase());
}

/**
 * Get age-appropriate system prompt modifier for children
 */
export function getChildPromptModifier(userId: string): string {
  const childAges: Record<string, number> = {
    vayu: 10,
    vishala: 8,
    vasu: 4
  };

  const age = childAges[userId.toLowerCase()];
  if (!age) return '';

  if (age <= 5) {
    return `\n\nIMPORTANT: You are speaking with a ${age}-year-old child. Use very simple words, short sentences, and be extra patient and encouraging. Keep responses fun and playful!`;
  } else if (age <= 8) {
    return `\n\nIMPORTANT: You are speaking with an ${age}-year-old child. Use simple language, be encouraging, and make learning fun. Explain things in ways a second or third grader would understand.`;
  } else {
    return `\n\nIMPORTANT: You are speaking with a ${age}-year-old child. Be friendly and age-appropriate. You can use more complex explanations but still keep things relatable and engaging.`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MODEL,
  MAX_TOKENS,
  FAMILY_SYSTEM_PROMPT,
  getClient
};
