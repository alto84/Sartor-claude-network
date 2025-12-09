/**
 * Test script for MCP HTTP Client
 *
 * This script demonstrates how to use the MCPHttpClient to communicate
 * with the MCP HTTP server.
 *
 * Usage:
 * 1. Start the MCP HTTP server: npm run mcp:http
 * 2. In another terminal: npx ts-node test-mcp-client.ts
 */

import { MCPHttpClient } from '../src/mcp/mcp-http-client';

async function main() {
  console.log('=== MCP HTTP Client Test ===\n');

  const client = new MCPHttpClient();

  // 1. Check if server is available
  console.log('1. Pinging server...');
  const isAvailable = await client.ping();
  if (!isAvailable) {
    console.error('ERROR: Server is not available. Please start the server with: npm run mcp:http');
    process.exit(1);
  }
  console.log('✓ Server is available\n');

  // 2. Initialize session
  console.log('2. Initializing session...');
  const initialized = await client.initialize();
  if (!initialized) {
    console.error('ERROR: Failed to initialize session');
    process.exit(1);
  }
  console.log('✓ Session initialized\n');

  // 3. Create a memory
  console.log('3. Creating a test memory...');
  const created = await client.createMemory({
    content: 'Test memory from HTTP client - session established successfully',
    type: 'episodic',
    importance: 0.8,
    tags: ['test', 'http-client', 'bootstrap'],
  });
  if (!created) {
    console.error('ERROR: Failed to create memory');
    await client.close();
    process.exit(1);
  }
  console.log(`✓ Memory created: ${created.id}\n`);

  // 4. Retrieve the memory
  console.log('4. Retrieving the memory...');
  const retrieved = await client.getMemory(created.id);
  if (!retrieved) {
    console.error('ERROR: Failed to retrieve memory');
    await client.close();
    process.exit(1);
  }
  console.log('✓ Memory retrieved:');
  console.log(JSON.stringify(retrieved, null, 2));
  console.log();

  // 5. Search memories
  console.log('5. Searching for episodic memories...');
  const results = await client.searchMemories({
    type: 'episodic',
    min_importance: 0.5,
    limit: 5,
  });
  console.log(`✓ Found ${results.length} episodic memories:`);
  results.forEach((mem, i) => {
    console.log(`   ${i + 1}. ${mem.id}: ${mem.content.substring(0, 60)}...`);
  });
  console.log();

  // 6. Get stats
  console.log('6. Getting memory system stats...');
  const stats = await client.getStats();
  if (!stats) {
    console.error('ERROR: Failed to get stats');
    await client.close();
    process.exit(1);
  }
  console.log('✓ Memory system stats:');
  console.log(JSON.stringify(stats, null, 2));
  console.log();

  // 7. Close session
  console.log('7. Closing session...');
  await client.close();
  console.log('✓ Session closed\n');

  console.log('=== All tests passed! ===');
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
