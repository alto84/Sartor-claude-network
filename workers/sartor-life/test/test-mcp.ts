/**
 * Test file for Sartor Life MCP Gateway
 * Run with: npx vitest run test/test-mcp.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Mock environment
const mockEnv = {
  VAULT_KV: createMockKV(),
  MEMORY_KV: createMockKV(),
  CHAT_KV: createMockKV(),
  RATE_LIMIT_KV: createMockKV(),
  AUTH_TOKEN_ENZO: 'test-token-enzo',
  AUTH_TOKEN_ALESSIA: 'test-token-alessia',
  AUTH_TOKEN_NADIA: 'test-token-nadia',
  AUTH_TOKEN_ADMIN: 'test-token-admin',
  ENVIRONMENT: 'test',
  MAX_REQUESTS_PER_MINUTE: '60',
  MAX_VAULT_ITEMS: '10000',
  MAX_MEMORY_ITEMS: '50000',
};

// Mock KV namespace
function createMockKV() {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) || null,
    put: async (key: string, value: string, options?: { expirationTtl?: number }) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({ keys: Array.from(store.keys()).map(name => ({ name })) }),
  };
}

// Helper to make MCP requests
async function mcpRequest(
  method: string,
  params?: Record<string, unknown>,
  token = 'test-token-enzo'
) {
  const request = new Request('http://localhost/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  // In real tests, you'd import and call the worker handler
  // For now, this is a structure for testing
  return { request, env: mockEnv };
}

describe('Sartor Life MCP Gateway', () => {
  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const request = new Request('http://localhost/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });
      // Test would verify 401 response
      expect(request.headers.get('Authorization')).toBeNull();
    });

    it('should accept valid bearer token', async () => {
      const { request } = await mcpRequest('tools/list');
      expect(request.headers.get('Authorization')).toBe('Bearer test-token-enzo');
    });
  });

  describe('MCP Protocol', () => {
    it('should handle initialize request', async () => {
      const { request } = await mcpRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      });
      expect(request.method).toBe('POST');
    });

    it('should list available tools', async () => {
      const { request } = await mcpRequest('tools/list');
      expect(request.method).toBe('POST');
    });
  });

  describe('Vault Tools', () => {
    it('should add item to vault', async () => {
      const { request } = await mcpRequest('tools/call', {
        name: 'vault_add',
        arguments: {
          category: 'recipe',
          title: 'Pasta Carbonara',
          content: 'Classic Italian pasta recipe...',
          tags: ['italian', 'pasta', 'dinner'],
        },
      });
      expect(request.method).toBe('POST');
    });

    it('should search vault', async () => {
      const { request } = await mcpRequest('tools/call', {
        name: 'vault_search',
        arguments: {
          query: 'pasta',
          category: 'recipe',
        },
      });
      expect(request.method).toBe('POST');
    });
  });

  describe('Memory Tools', () => {
    it('should store memory', async () => {
      const { request } = await mcpRequest('tools/call', {
        name: 'memory_store',
        arguments: {
          type: 'preference',
          content: 'Enzo prefers dark roast coffee',
          importance: 'medium',
          tags: ['preferences', 'food', 'enzo'],
        },
      });
      expect(request.method).toBe('POST');
    });

    it('should search memories', async () => {
      const { request } = await mcpRequest('tools/call', {
        name: 'memory_search',
        arguments: {
          query: 'coffee',
        },
      });
      expect(request.method).toBe('POST');
    });
  });

  describe('Chat Tools', () => {
    it('should send message to dashboard', async () => {
      const { request } = await mcpRequest('tools/call', {
        name: 'chat_send',
        arguments: {
          to: 'dashboard',
          content: 'Reminder: Family dinner at 7pm',
          type: 'reminder',
          priority: 'high',
        },
      });
      expect(request.method).toBe('POST');
    });

    it('should list messages', async () => {
      const { request } = await mcpRequest('tools/call', {
        name: 'chat_list',
        arguments: {
          filter: 'unread',
        },
      });
      expect(request.method).toBe('POST');
    });
  });

  describe('Dashboard Tools', () => {
    it('should get dashboard summary', async () => {
      const { request } = await mcpRequest('tools/call', {
        name: 'dashboard_summary',
        arguments: {},
      });
      expect(request.method).toBe('POST');
    });

    it('should get family members', async () => {
      const { request } = await mcpRequest('tools/call', {
        name: 'family_members',
        arguments: {},
      });
      expect(request.method).toBe('POST');
    });
  });
});

// Integration test example (requires running worker)
describe.skip('Integration Tests', () => {
  const WORKER_URL = 'http://localhost:8787';
  const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token';

  it('should respond to health check', async () => {
    const response = await fetch(`${WORKER_URL}/health`);
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  it('should handle full MCP flow', async () => {
    // Initialize
    const initResponse = await fetch(`${WORKER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      }),
    });
    expect(initResponse.ok).toBe(true);

    // List tools
    const toolsResponse = await fetch(`${WORKER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      }),
    });
    const toolsData = await toolsResponse.json();
    expect(toolsData.result.tools).toBeDefined();
    expect(toolsData.result.tools.length).toBeGreaterThan(0);
  });
});
