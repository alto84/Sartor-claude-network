/**
 * Sartor Life MCP Gateway
 * Cloudflare Worker serving as the MCP endpoint for Claude.ai
 *
 * This worker provides:
 * - Family vault storage (recipes, documents, traditions)
 * - Long-term memory for the AI assistant
 * - Chat/messaging to family dashboard
 * - Daily summaries and family info
 */

import type { Env, MCPRequest, MCPResponse, MCPToolDefinition, AuthContext } from './types';
import { authenticateRequest, createAuthErrorResponse, getFamilyMembers } from './auth/verify';

// Import tool definitions and handlers
import { vaultTools, vaultAdd, vaultSearch, vaultList, vaultGet, vaultUpdate, vaultDelete } from './tools/vault';
import { memoryTools, memoryStore, memorySearch, memoryGet, memoryUpdate, memoryDelete, memoryListRecent } from './tools/memory';
import { chatTools, chatSend, chatList, chatMarkRead, chatDelete, chatUnreadCount } from './tools/chat';
import { dashboardTools, dashboardSummary, familyMembers, dashboardHighlights, dashboardStats } from './tools/dashboard';

// Combine all tool definitions
const allTools: MCPToolDefinition[] = [
  ...vaultTools,
  ...memoryTools,
  ...chatTools,
  ...dashboardTools
];

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

/**
 * Create MCP response
 */
function mcpResponse(id: string | number, result: unknown): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Create MCP error response
 */
function mcpError(id: string | number, code: number, message: string, data?: unknown): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message, data },
  };
}

/**
 * Handle MCP tool call
 */
async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
  auth: AuthContext,
  env: Env
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    switch (toolName) {
      // Vault tools
      case 'vault_add':
        return await vaultAdd(args as Parameters<typeof vaultAdd>[0], auth, env);
      case 'vault_search':
        return await vaultSearch(args as Parameters<typeof vaultSearch>[0], auth, env);
      case 'vault_list':
        return await vaultList(args as Parameters<typeof vaultList>[0], auth, env);
      case 'vault_get':
        return await vaultGet(args as Parameters<typeof vaultGet>[0], auth, env);
      case 'vault_update':
        return await vaultUpdate(args as Parameters<typeof vaultUpdate>[0], auth, env);
      case 'vault_delete':
        return await vaultDelete(args as Parameters<typeof vaultDelete>[0], auth, env);

      // Memory tools
      case 'memory_store':
        return await memoryStore(args as Parameters<typeof memoryStore>[0], auth, env);
      case 'memory_search':
        return await memorySearch(args as Parameters<typeof memorySearch>[0], auth, env);
      case 'memory_get':
        return await memoryGet(args as Parameters<typeof memoryGet>[0], auth, env);
      case 'memory_update':
        return await memoryUpdate(args as Parameters<typeof memoryUpdate>[0], auth, env);
      case 'memory_delete':
        return await memoryDelete(args as Parameters<typeof memoryDelete>[0], auth, env);
      case 'memory_list_recent':
        return await memoryListRecent(args as Parameters<typeof memoryListRecent>[0], auth, env);

      // Chat tools
      case 'chat_send':
        return await chatSend(args as Parameters<typeof chatSend>[0], auth, env);
      case 'chat_list':
        return await chatList(args as Parameters<typeof chatList>[0], auth, env);
      case 'chat_mark_read':
        return await chatMarkRead(args as Parameters<typeof chatMarkRead>[0], auth, env);
      case 'chat_delete':
        return await chatDelete(args as Parameters<typeof chatDelete>[0], auth, env);
      case 'chat_unread_count':
        return await chatUnreadCount(auth, env);

      // Dashboard tools
      case 'dashboard_summary':
        return await dashboardSummary(args as Parameters<typeof dashboardSummary>[0], auth, env);
      case 'family_members':
        return await familyMembers(args as Parameters<typeof familyMembers>[0], auth, env);
      case 'dashboard_highlights':
        return await dashboardHighlights(args as Parameters<typeof dashboardHighlights>[0], auth, env);
      case 'dashboard_stats':
        return await dashboardStats(auth, env);

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool ${toolName} error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle MCP protocol request
 */
async function handleMCPRequest(
  request: MCPRequest,
  auth: AuthContext,
  env: Env
): Promise<MCPResponse> {
  const { id, method, params } = request;

  switch (method) {
    // MCP initialization
    case 'initialize':
      return mcpResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'sartor-life',
          version: '1.0.0',
        },
      });

    // List available tools
    case 'tools/list':
      return mcpResponse(id, {
        tools: allTools,
      });

    // Execute a tool
    case 'tools/call': {
      const toolName = params?.name as string;
      const toolArgs = (params?.arguments || {}) as Record<string, unknown>;

      if (!toolName) {
        return mcpError(id, -32602, 'Missing tool name');
      }

      const result = await handleToolCall(toolName, toolArgs, auth, env);

      if (result.success) {
        return mcpResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.result || result, null, 2),
            },
          ],
        });
      } else {
        return mcpResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: result.error }, null, 2),
            },
          ],
          isError: true,
        });
      }
    }

    // Ping for health check
    case 'ping':
      return mcpResponse(id, { status: 'pong' });

    default:
      return mcpError(id, -32601, `Method not found: ${method}`);
  }
}

/**
 * Health check endpoint
 */
function handleHealthCheck(env: Env): Response {
  return jsonResponse({
    status: 'healthy',
    service: 'sartor-life',
    version: '1.0.0',
    environment: env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Info endpoint
 */
function handleInfo(env: Env): Response {
  return jsonResponse({
    name: 'Sartor Life MCP Gateway',
    version: '1.0.0',
    description: 'Family life management API for Claude.ai',
    environment: env.ENVIRONMENT,
    capabilities: [
      'Family Vault (recipes, documents, traditions)',
      'Long-term Memory Storage',
      'Family Chat & Dashboard Messaging',
      'Daily Summaries & Family Info',
    ],
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
    })),
    authentication: 'Bearer token required',
    rateLimit: `${env.MAX_REQUESTS_PER_MINUTE} requests/minute`,
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Public endpoints (no auth required)
    if (path === '/health' || path === '/healthz') {
      return handleHealthCheck(env);
    }

    if (path === '/info' || path === '/') {
      return handleInfo(env);
    }

    // All other endpoints require authentication
    const authResult = await authenticateRequest(request, env);

    if (!authResult.auth) {
      return createAuthErrorResponse(
        authResult.error || 'Authentication failed',
        authResult.error === 'Rate limit exceeded' ? 429 : 401
      );
    }

    const auth = authResult.auth;

    // Add rate limit headers to response
    const rateLimitHeaders: Record<string, string> = {};
    if (authResult.rateLimit) {
      rateLimitHeaders['X-RateLimit-Limit'] = String(authResult.rateLimit.limit);
      rateLimitHeaders['X-RateLimit-Remaining'] = String(authResult.rateLimit.remaining);
      rateLimitHeaders['X-RateLimit-Reset'] = String(authResult.rateLimit.reset);
    }

    // MCP endpoint
    if (path === '/mcp' || path === '/mcp/') {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }

      try {
        const body = await request.json() as MCPRequest;

        // Validate JSON-RPC structure
        if (body.jsonrpc !== '2.0' || !body.method || body.id === undefined) {
          return jsonResponse(mcpError(body.id || 0, -32600, 'Invalid JSON-RPC request'), 400);
        }

        const response = await handleMCPRequest(body, auth, env);
        return new Response(JSON.stringify(response), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...rateLimitHeaders,
          },
        });
      } catch (error) {
        console.error('MCP request error:', error);
        return jsonResponse(mcpError(0, -32700, 'Parse error'), 400);
      }
    }

    // SSE endpoint for MCP (Server-Sent Events for streaming)
    if (path === '/mcp/sse' || path === '/sse') {
      // For now, redirect to standard endpoint
      // Full SSE implementation would use ReadableStream
      return jsonResponse({
        error: 'SSE not yet implemented',
        message: 'Use POST /mcp for standard MCP requests',
      }, 501);
    }

    // Direct tool endpoints (for debugging/testing)
    if (path.startsWith('/api/')) {
      const toolPath = path.replace('/api/', '');

      if (request.method === 'POST') {
        try {
          const args = await request.json() as Record<string, unknown>;
          const result = await handleToolCall(toolPath.replace('/', '_'), args, auth, env);

          return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
              ...rateLimitHeaders,
            },
          });
        } catch (error) {
          return jsonResponse({ error: 'Invalid request body' }, 400);
        }
      }
    }

    // 404 for unknown paths
    return jsonResponse(
      {
        error: 'Not found',
        path,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /info',
          'POST /mcp',
          'POST /api/{tool_name}',
        ],
      },
      404
    );
  },
};
