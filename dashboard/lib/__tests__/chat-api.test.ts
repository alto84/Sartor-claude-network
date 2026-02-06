/**
 * Chat API Tests
 *
 * Tests for the chat API endpoint and Claude service integration.
 * Mocks the Anthropic SDK to test various scenarios.
 */

// Must mock before imports
const mockCreate = jest.fn();
const mockStream = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  // Create mock error classes
  class MockAPIError extends Error {
    status: number;
    headers: Record<string, string>;
    constructor(status: number, body: unknown, message: string, headers: Record<string, string>) {
      super(message);
      this.name = 'APIError';
      this.status = status;
      this.headers = headers;
    }
  }

  class MockAPIConnectionError extends Error {
    cause: unknown;
    constructor(opts: { cause: unknown }) {
      super('Connection error');
      this.name = 'APIConnectionError';
      this.cause = opts.cause;
    }
  }

  class MockRateLimitError extends Error {
    status: number;
    headers: Record<string, string>;
    constructor(status: number, body: unknown, message: string, headers: Record<string, string>) {
      super(message);
      this.name = 'RateLimitError';
      this.status = status;
      this.headers = headers;
    }
  }

  class MockAuthenticationError extends Error {
    status: number;
    headers: Record<string, string>;
    constructor(status: number, body: unknown, message: string, headers: Record<string, string>) {
      super(message);
      this.name = 'AuthenticationError';
      this.status = status;
      this.headers = headers;
    }
  }

  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
      stream: mockStream,
    },
  }));

  // Attach error classes to the mock
  MockAnthropic.APIError = MockAPIError;
  MockAnthropic.APIConnectionError = MockAPIConnectionError;
  MockAnthropic.RateLimitError = MockRateLimitError;
  MockAnthropic.AuthenticationError = MockAuthenticationError;

  return {
    __esModule: true,
    default: MockAnthropic,
    APIError: MockAPIError,
    APIConnectionError: MockAPIConnectionError,
    RateLimitError: MockRateLimitError,
    AuthenticationError: MockAuthenticationError,
  };
});

import Anthropic from '@anthropic-ai/sdk';
import {
  chat,
  streamChat,
  ClaudeServiceError,
  ChatResponse,
  ConversationMessage,
  ToolDefinition,
  ChatOptions,
  familyTools,
  getFamilyMemberName,
  isChildUser,
  isAdultUser,
  getChildPromptModifier,
} from '../claude-service';

describe('Chat API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default successful response
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello! How can I help you today?' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 15 },
    });
  });

  describe('chat function', () => {
    describe('Basic message sending', () => {
      it('sends a basic message successfully', async () => {
        const response = await chat('Hello', [], 'alton');

        expect(response.content).toBe('Hello! How can I help you today?');
        expect(response.stopReason).toBe('end_turn');
        expect(response.usage).toEqual({
          inputTokens: 10,
          outputTokens: 15,
        });
      });

      it('sends message with correct parameters', async () => {
        await chat('Test message', [], 'alton');

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{ role: 'user', content: 'Test message' }],
          })
        );
      });

      it('includes system prompt with user context', async () => {
        await chat('Hello', [], 'vayu');

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            system: expect.stringContaining('Current user: vayu'),
          })
        );
      });

      it('handles custom options correctly', async () => {
        const options: ChatOptions = {
          maxTokens: 2048,
          temperature: 0.7,
          systemPrompt: 'Custom system prompt',
        };

        await chat('Hello', [], 'alton', options);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            max_tokens: 2048,
            temperature: 0.7,
            system: expect.stringContaining('Custom system prompt'),
          })
        );
      });
    });

    describe('Conversation history', () => {
      it('includes conversation history in messages', async () => {
        const history: ConversationMessage[] = [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
        ];

        await chat('Second message', history, 'alton');

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              { role: 'user', content: 'First message' },
              { role: 'assistant', content: 'First response' },
              { role: 'user', content: 'Second message' },
            ],
          })
        );
      });

      it('handles empty conversation history', async () => {
        await chat('Hello', [], 'alton');

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [{ role: 'user', content: 'Hello' }],
          })
        );
      });

      it('handles long conversation history', async () => {
        const history: ConversationMessage[] = [];
        for (let i = 0; i < 10; i++) {
          history.push({ role: 'user', content: `Message ${i}` });
          history.push({ role: 'assistant', content: `Response ${i}` });
        }

        await chat('Final message', history, 'alton');

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              { role: 'user', content: 'Message 0' },
              { role: 'user', content: 'Final message' },
            ]),
          })
        );

        // Verify all 21 messages (20 history + 1 new)
        const callArgs = mockCreate.mock.calls[0][0];
        expect(callArgs.messages).toHaveLength(21);
      });
    });

    describe('Tool execution', () => {
      it('handles tool calls in response', async () => {
        mockCreate.mockResolvedValue({
          content: [
            { type: 'text', text: 'Let me check the calendar.' },
            {
              type: 'tool_use',
              id: 'tool_123',
              name: 'get_calendar_events',
              input: { userId: 'alton', date: '2024-01-15' },
            },
          ],
          stop_reason: 'tool_use',
          usage: { input_tokens: 10, output_tokens: 20 },
        });

        const response = await chat("What's on my calendar?", [], 'alton');

        expect(response.content).toBe('Let me check the calendar.');
        expect(response.toolCalls).toHaveLength(1);
        expect(response.toolCalls![0]).toEqual({
          id: 'tool_123',
          name: 'get_calendar_events',
          input: { userId: 'alton', date: '2024-01-15' },
        });
        expect(response.stopReason).toBe('tool_use');
      });

      it('handles multiple tool calls', async () => {
        mockCreate.mockResolvedValue({
          content: [
            { type: 'text', text: 'Checking multiple things...' },
            {
              type: 'tool_use',
              id: 'tool_1',
              name: 'get_calendar_events',
              input: { userId: 'alton' },
            },
            {
              type: 'tool_use',
              id: 'tool_2',
              name: 'get_tasks',
              input: { userId: 'alton' },
            },
          ],
          stop_reason: 'tool_use',
          usage: { input_tokens: 15, output_tokens: 30 },
        });

        const response = await chat('Show calendar and tasks', [], 'alton');

        expect(response.toolCalls).toHaveLength(2);
        expect(response.toolCalls![0].name).toBe('get_calendar_events');
        expect(response.toolCalls![1].name).toBe('get_tasks');
      });

      it('includes tools in request when provided', async () => {
        const tools: ToolDefinition[] = [
          {
            name: 'test_tool',
            description: 'A test tool',
            input_schema: {
              type: 'object',
              properties: {
                param: { type: 'string' },
              },
              required: ['param'],
            },
          },
        ];

        await chat('Use the tool', [], 'alton', { tools });

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            tools: expect.arrayContaining([
              expect.objectContaining({ name: 'test_tool' }),
            ]),
          })
        );
      });
    });

    describe('Error handling', () => {
      it('handles API errors gracefully', async () => {
        const MockAPIError = (Anthropic as unknown as { APIError: new (...args: unknown[]) => Error }).APIError;
        const apiError = new MockAPIError(500, { message: 'Internal server error' }, 'Internal server error', {});

        mockCreate.mockRejectedValue(apiError);

        await expect(chat('Hello', [], 'alton')).rejects.toThrow(ClaudeServiceError);
      });

      it('handles connection errors', async () => {
        const MockAPIConnectionError = (Anthropic as unknown as { APIConnectionError: new (...args: unknown[]) => Error }).APIConnectionError;
        const connectionError = new MockAPIConnectionError({ cause: new Error('Network error') });

        mockCreate.mockRejectedValue(connectionError);

        await expect(chat('Hello', [], 'alton')).rejects.toThrow(ClaudeServiceError);

        try {
          await chat('Hello', [], 'alton');
        } catch (error) {
          expect(error).toBeInstanceOf(ClaudeServiceError);
          expect((error as ClaudeServiceError).code).toBe('CONNECTION_ERROR');
        }
      });

      it('handles rate limit errors', async () => {
        const MockRateLimitError = (Anthropic as unknown as { RateLimitError: new (...args: unknown[]) => Error }).RateLimitError;
        const rateLimitError = new MockRateLimitError(429, { message: 'Rate limited' }, 'Rate limited', { 'retry-after': '60' });

        mockCreate.mockRejectedValue(rateLimitError);

        try {
          await chat('Hello', [], 'alton');
        } catch (error) {
          expect(error).toBeInstanceOf(ClaudeServiceError);
          expect((error as ClaudeServiceError).code).toBe('RATE_LIMIT');
        }
      });

      it('handles authentication errors', async () => {
        const MockAuthenticationError = (Anthropic as unknown as { AuthenticationError: new (...args: unknown[]) => Error }).AuthenticationError;
        const authError = new MockAuthenticationError(401, { message: 'Invalid API key' }, 'Invalid API key', {});

        mockCreate.mockRejectedValue(authError);

        try {
          await chat('Hello', [], 'alton');
        } catch (error) {
          expect(error).toBeInstanceOf(ClaudeServiceError);
          expect((error as ClaudeServiceError).code).toBe('AUTH_ERROR');
        }
      });

      it('handles unknown errors', async () => {
        mockCreate.mockRejectedValue(new Error('Unknown error'));

        try {
          await chat('Hello', [], 'alton');
        } catch (error) {
          expect(error).toBeInstanceOf(ClaudeServiceError);
          expect((error as ClaudeServiceError).code).toBe('UNKNOWN_ERROR');
        }
      });
    });
  });

  describe('streamChat function', () => {
    it('yields text events during streaming', async () => {
      const mockEvents = [
        { type: 'message_start', message: { usage: { input_tokens: 10 } } },
        { type: 'content_block_start', content_block: { type: 'text' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello ' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'world!' } },
        { type: 'content_block_stop' },
        { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 5 } },
        { type: 'message_stop' },
      ];

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const event of mockEvents) {
            yield event;
          }
        },
      };

      mockStream.mockResolvedValue(mockAsyncIterator);

      const events: unknown[] = [];
      for await (const event of streamChat('Hello', [], 'alton')) {
        events.push(event);
      }

      // Check text events
      const textEvents = events.filter((e: unknown) => (e as { type: string }).type === 'text');
      expect(textEvents).toHaveLength(2);
      expect((textEvents[0] as { content: string }).content).toBe('Hello ');
      expect((textEvents[1] as { content: string }).content).toBe('world!');

      // Check done event
      const doneEvent = events.find((e: unknown) => (e as { type: string }).type === 'done');
      expect(doneEvent).toBeDefined();
      expect((doneEvent as { response: ChatResponse }).response.content).toBe('Hello world!');
    });

    it('yields tool_use events during streaming', async () => {
      const mockEvents = [
        { type: 'message_start', message: { usage: { input_tokens: 10 } } },
        {
          type: 'content_block_start',
          content_block: { type: 'tool_use', id: 'tool_1', name: 'test_tool' },
        },
        { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '{"key":' } },
        { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '"value"}' } },
        { type: 'content_block_stop' },
        { type: 'message_delta', delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 15 } },
        { type: 'message_stop' },
      ];

      const mockAsyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for (const event of mockEvents) {
            yield event;
          }
        },
      };

      mockStream.mockResolvedValue(mockAsyncIterator);

      const events: unknown[] = [];
      for await (const event of streamChat('Use tool', [], 'alton')) {
        events.push(event);
      }

      const toolEvent = events.find((e: unknown) => (e as { type: string }).type === 'tool_use');
      expect(toolEvent).toBeDefined();
      expect((toolEvent as { toolCall: { name: string } }).toolCall.name).toBe('test_tool');
    });

    it('yields error events on failure', async () => {
      mockStream.mockRejectedValue(new Error('Stream error'));

      const events: unknown[] = [];
      for await (const event of streamChat('Hello', [], 'alton')) {
        events.push(event);
      }

      const errorEvent = events.find((e: unknown) => (e as { type: string }).type === 'error');
      expect(errorEvent).toBeDefined();
      expect((errorEvent as { error: Error }).error.message).toBe('Stream error');
    });
  });

  describe('Utility functions', () => {
    describe('getFamilyMemberName', () => {
      it('returns correct names for family members', () => {
        expect(getFamilyMemberName('alton')).toBe('Alton');
        expect(getFamilyMemberName('aneeta')).toBe('Aneeta');
        expect(getFamilyMemberName('vayu')).toBe('Vayu');
        expect(getFamilyMemberName('vishala')).toBe('Vishala');
        expect(getFamilyMemberName('vasu')).toBe('Vasu');
      });

      it('handles case-insensitive input', () => {
        expect(getFamilyMemberName('ALTON')).toBe('Alton');
        expect(getFamilyMemberName('Vayu')).toBe('Vayu');
      });

      it('returns userId for unknown members', () => {
        expect(getFamilyMemberName('unknown')).toBe('unknown');
        expect(getFamilyMemberName('guest')).toBe('guest');
      });
    });

    describe('isChildUser', () => {
      it('returns true for child users', () => {
        expect(isChildUser('vayu')).toBe(true);
        expect(isChildUser('vishala')).toBe(true);
        expect(isChildUser('vasu')).toBe(true);
      });

      it('returns false for adult users', () => {
        expect(isChildUser('alton')).toBe(false);
        expect(isChildUser('aneeta')).toBe(false);
      });

      it('handles case-insensitive input', () => {
        expect(isChildUser('VAYU')).toBe(true);
        expect(isChildUser('Vishala')).toBe(true);
      });

      it('returns false for unknown users', () => {
        expect(isChildUser('unknown')).toBe(false);
      });
    });

    describe('isAdultUser', () => {
      it('returns true for adult users', () => {
        expect(isAdultUser('alton')).toBe(true);
        expect(isAdultUser('aneeta')).toBe(true);
      });

      it('returns false for child users', () => {
        expect(isAdultUser('vayu')).toBe(false);
        expect(isAdultUser('vishala')).toBe(false);
        expect(isAdultUser('vasu')).toBe(false);
      });

      it('handles case-insensitive input', () => {
        expect(isAdultUser('ALTON')).toBe(true);
        expect(isAdultUser('Aneeta')).toBe(true);
      });

      it('returns false for unknown users', () => {
        expect(isAdultUser('unknown')).toBe(false);
      });
    });

    describe('getChildPromptModifier', () => {
      it('returns appropriate modifier for young children', () => {
        const modifier = getChildPromptModifier('vasu');
        expect(modifier).toContain('4-year-old');
        expect(modifier).toContain('very simple words');
      });

      it('returns appropriate modifier for middle children', () => {
        const modifier = getChildPromptModifier('vishala');
        expect(modifier).toContain('8-year-old');
        expect(modifier).toContain('simple language');
      });

      it('returns appropriate modifier for older children', () => {
        const modifier = getChildPromptModifier('vayu');
        expect(modifier).toContain('10-year-old');
        expect(modifier).toContain('age-appropriate');
      });

      it('returns empty string for adults', () => {
        expect(getChildPromptModifier('alton')).toBe('');
        expect(getChildPromptModifier('aneeta')).toBe('');
      });

      it('returns empty string for unknown users', () => {
        expect(getChildPromptModifier('unknown')).toBe('');
      });
    });
  });

  describe('familyTools', () => {
    it('is defined as an array', () => {
      expect(Array.isArray(familyTools)).toBe(true);
    });

    it('is currently empty (placeholder)', () => {
      // The familyTools array is a placeholder for future tool definitions
      expect(familyTools).toHaveLength(0);
    });
  });
});

describe('ClaudeServiceError', () => {
  it('has correct name and properties', () => {
    const error = new ClaudeServiceError('Test error', 'TEST_CODE', {
      detail: 'value',
    });

    expect(error.name).toBe('ClaudeServiceError');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ detail: 'value' });
  });

  it('works without details', () => {
    const error = new ClaudeServiceError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toBeUndefined();
  });

  it('is instance of Error', () => {
    const error = new ClaudeServiceError('Test', 'CODE');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ClaudeServiceError);
  });
});
