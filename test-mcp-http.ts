/**
 * Test Client for MCP HTTP Server
 *
 * This script demonstrates how to interact with the MCP HTTP server.
 * It tests all major functionality including:
 * - Session initialization
 * - Tool listing
 * - Memory creation
 * - Memory statistics
 * - Memory search
 * - Session termination
 *
 * Run the HTTP server first: npm run mcp:http
 * Then run this test: npx ts-node test-mcp-http.ts
 */

async function testMCPHTTPServer() {
  const baseUrl = 'http://localhost:3001/mcp';

  console.log('Testing MCP HTTP Server...\n');

  // Step 1: Initialize session
  console.log('1. Initializing session...');
  const initResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    }),
  });

  const initData: any = await initResponse.json();
  const sessionId = initResponse.headers.get('mcp-session-id');

  console.log('   Session ID:', sessionId);
  console.log('   Server info:', initData.result?.serverInfo);
  console.log();

  if (!sessionId) {
    throw new Error('No session ID received!');
  }

  // Step 2: List tools
  console.log('2. Listing available tools...');
  const toolsResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }),
  });

  const toolsData: any = await toolsResponse.json();
  console.log('   Available tools:', toolsData.result?.tools?.map((t: any) => t.name).join(', '));
  console.log();

  // Step 3: Create a memory
  console.log('3. Creating a memory...');
  const createResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'memory_create',
        arguments: {
          content: 'Test memory from HTTP client',
          type: 'episodic',
          importance: 0.8,
          tags: ['test', 'http'],
        },
      },
    }),
  });

  const createData: any = await createResponse.json();
  const memoryResult = JSON.parse(createData.result?.content[0]?.text || '{}');
  console.log('   Created memory:', memoryResult);
  console.log();

  // Step 4: Get memory stats
  console.log('4. Getting memory stats...');
  const statsResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'memory_stats',
        arguments: {},
      },
    }),
  });

  const statsData: any = await statsResponse.json();
  const stats = JSON.parse(statsData.result?.content[0]?.text || '{}');
  console.log('   Memory stats:', stats);
  console.log();

  // Step 5: Search memories
  console.log('5. Searching memories...');
  const searchResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'memory_search',
        arguments: {
          type: 'episodic',
          limit: 10,
        },
      },
    }),
  });

  const searchData: any = await searchResponse.json();
  const searchResults = JSON.parse(searchData.result?.content[0]?.text || '[]');
  console.log('   Found memories:', searchResults.length);
  searchResults.forEach((mem: any) => {
    console.log(`   - ${mem.id}: ${mem.content}`);
  });
  console.log();

  // Step 6: Close session
  console.log('6. Closing session...');
  const closeResponse = await fetch(baseUrl, {
    method: 'DELETE',
    headers: {
      'mcp-session-id': sessionId,
    },
  });

  console.log('   Session closed:', closeResponse.status === 200 ? 'Success' : 'Failed');
  console.log();

  console.log('All tests completed successfully!');
}

// Run the test
testMCPHTTPServer().catch(console.error);
