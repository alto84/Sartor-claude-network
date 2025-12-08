/**
 * MCP HTTP Client
 *
 * A simple HTTP client for calling the MCP server from within code.
 * Used for bootstrap mesh communication between agents.
 *
 * Features:
 * - Session management with automatic initialization
 * - JSON-RPC 2.0 protocol support
 * - 5-second timeout per request
 * - Graceful error handling (returns null/empty arrays, doesn't throw)
 */

interface Memory {
  id: string;
  content: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working';
  importance_score: number;
  tags: string[];
  created_at: string;
}

interface Stats {
  total: number;
  by_type: {
    episodic: number;
    semantic: number;
    procedural: number;
    working: number;
  };
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export class MCPHttpClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private requestId = 0;

  constructor(baseUrl: string = 'http://localhost:3001/mcp') {
    this.baseUrl = baseUrl;
  }

  /**
   * Initialize a session (required before other calls)
   */
  async initialize(): Promise<boolean> {
    try {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'mcp-http-client',
            version: '1.0.0',
          },
        },
      };

      const response = await this.sendRequest(request, null);

      if (!response) {
        console.error('[MCP Client] Failed to initialize: no response');
        return false;
      }

      // Session ID comes from response header
      // Note: We set it during sendRequest via the fetch response
      if (!this.sessionId) {
        console.error('[MCP Client] Failed to initialize: no session ID in response');
        return false;
      }

      // Send initialized notification (no response expected)
      const notificationRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'notifications/initialized',
      };

      await this.sendRequest(notificationRequest, this.sessionId);

      console.error(`[MCP Client] Session initialized: ${this.sessionId}`);
      return true;
    } catch (error) {
      console.error('[MCP Client] Initialize error:', error);
      return false;
    }
  }

  /**
   * Check if server is available
   */
  async ping(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000); // Quick 1s timeout for ping

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 0,
          method: 'ping',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      return response.ok;
    } catch (error) {
      // Server not available - return false quietly
      return false;
    }
  }

  /**
   * Call memory_create
   */
  async createMemory(params: {
    content: string;
    type: 'episodic' | 'semantic' | 'procedural' | 'working';
    importance?: number;
    tags?: string[];
  }): Promise<{ id: string } | null> {
    try {
      if (!this.sessionId) {
        console.error('[MCP Client] Cannot create memory: not initialized');
        return null;
      }

      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'tools/call',
        params: {
          name: 'memory_create',
          arguments: {
            content: params.content,
            type: params.type,
            importance: params.importance,
            tags: params.tags,
          },
        },
      };

      const response = await this.sendRequest(request, this.sessionId);

      if (!response || response.error) {
        console.error('[MCP Client] Create memory error:', response?.error);
        return null;
      }

      // Parse the tool result from the response
      // The result is in: response.result.content[0].text
      const resultText = response.result?.content?.[0]?.text;
      if (!resultText) {
        console.error('[MCP Client] Invalid response format');
        return null;
      }

      const result = JSON.parse(resultText);
      if (result.success && result.id) {
        return { id: result.id };
      }

      console.error('[MCP Client] Create memory failed:', result);
      return null;
    } catch (error) {
      console.error('[MCP Client] Create memory error:', error);
      return null;
    }
  }

  /**
   * Call memory_get
   */
  async getMemory(id: string): Promise<Memory | null> {
    try {
      if (!this.sessionId) {
        console.error('[MCP Client] Cannot get memory: not initialized');
        return null;
      }

      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'tools/call',
        params: {
          name: 'memory_get',
          arguments: { id },
        },
      };

      const response = await this.sendRequest(request, this.sessionId);

      if (!response || response.error) {
        console.error('[MCP Client] Get memory error:', response?.error);
        return null;
      }

      // Parse the tool result
      const resultText = response.result?.content?.[0]?.text;
      if (!resultText) {
        console.error('[MCP Client] Invalid response format');
        return null;
      }

      const result = JSON.parse(resultText);
      if (result.error) {
        console.error('[MCP Client] Get memory failed:', result.error);
        return null;
      }

      return result as Memory;
    } catch (error) {
      console.error('[MCP Client] Get memory error:', error);
      return null;
    }
  }

  /**
   * Call memory_search
   */
  async searchMemories(params: {
    type?: string;
    min_importance?: number;
    limit?: number;
  }): Promise<Memory[]> {
    try {
      if (!this.sessionId) {
        console.error('[MCP Client] Cannot search memories: not initialized');
        return [];
      }

      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'tools/call',
        params: {
          name: 'memory_search',
          arguments: {
            type: params.type,
            min_importance: params.min_importance,
            limit: params.limit,
          },
        },
      };

      const response = await this.sendRequest(request, this.sessionId);

      if (!response || response.error) {
        console.error('[MCP Client] Search memories error:', response?.error);
        return [];
      }

      // Parse the tool result
      const resultText = response.result?.content?.[0]?.text;
      if (!resultText) {
        console.error('[MCP Client] Invalid response format');
        return [];
      }

      const result = JSON.parse(resultText);
      if (Array.isArray(result)) {
        return result;
      }

      console.error('[MCP Client] Search memories failed:', result);
      return [];
    } catch (error) {
      console.error('[MCP Client] Search memories error:', error);
      return [];
    }
  }

  /**
   * Call memory_stats
   */
  async getStats(): Promise<Stats | null> {
    try {
      if (!this.sessionId) {
        console.error('[MCP Client] Cannot get stats: not initialized');
        return null;
      }

      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'tools/call',
        params: {
          name: 'memory_stats',
          arguments: {},
        },
      };

      const response = await this.sendRequest(request, this.sessionId);

      if (!response || response.error) {
        console.error('[MCP Client] Get stats error:', response?.error);
        return null;
      }

      // Parse the tool result
      const resultText = response.result?.content?.[0]?.text;
      if (!resultText) {
        console.error('[MCP Client] Invalid response format');
        return null;
      }

      const result = JSON.parse(resultText);
      return result as Stats;
    } catch (error) {
      console.error('[MCP Client] Get stats error:', error);
      return null;
    }
  }

  /**
   * Close session
   */
  async close(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    try {
      console.error(`[MCP Client] Closing session: ${this.sessionId}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      await fetch(this.baseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': this.sessionId,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
    } catch (error) {
      console.error('[MCP Client] Close session error:', error);
    } finally {
      this.sessionId = null;
    }
  }

  /**
   * Send a JSON-RPC request to the MCP server
   */
  private async sendRequest(
    request: JsonRpcRequest,
    sessionId: string | null
  ): Promise<JsonRpcResponse | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      };

      if (sessionId) {
        headers['mcp-session-id'] = sessionId;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Extract session ID from response headers (for initialize request)
      if (!this.sessionId) {
        const newSessionId = response.headers.get('mcp-session-id');
        if (newSessionId) {
          this.sessionId = newSessionId;
        }
      }

      if (!response.ok) {
        console.error(`[MCP Client] HTTP error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data as JsonRpcResponse;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.error('[MCP Client] Request timeout');
      } else {
        console.error('[MCP Client] Request error:', error);
      }
      return null;
    }
  }
}
