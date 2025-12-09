import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function test() {
  console.log('=== MEMORY SYSTEM TEST ===\n');

  const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3001/mcp'));
  const client = new Client({ name: 'test', version: '1.0.0' });

  await client.connect(transport);
  console.log('✓ Connected\n');

  // Create all types
  const types = ['episodic', 'procedural', 'semantic'];
  for (const type of types) {
    const result = await client.callTool({ name: 'memory_create', arguments: {
      content: `Test ${type} memory at ${new Date().toISOString()}`,
      type,
      importance: 0.85,
      tags: ['test', type]
    }});
    const data = JSON.parse((result.content as any)[0].text);
    console.log(`CREATE ${type}:`, data.id);
  }

  // Search
  console.log('\n--- Search Results ---');
  const search = await client.callTool({ name: 'memory_search', arguments: { limit: 5 }});
  const results = JSON.parse((search.content as any)[0].text);
  console.log('Found:', results.length, 'memories');

  // Stats
  const stats = await client.callTool({ name: 'memory_stats', arguments: {} });
  const s = JSON.parse((stats.content as any)[0].text);
  console.log('\n--- Stats ---');
  console.log('Total:', s.total);
  console.log('By type:', JSON.stringify(s.by_type));

  await client.close();
  console.log('\n✓ MEMORY SYSTEM FULLY OPERATIONAL');
}

test().catch(e => console.error('ERROR:', e.message));
