/**
 * Bootstrap Mesh Example
 *
 * Demonstrates how to use the BootstrapMesh to load memories from multiple sources
 * with automatic fallback.
 */

import { createBootstrapMesh } from '../src/mcp/bootstrap-mesh';

async function main() {
  console.log('=== Bootstrap Mesh Example ===\n');

  // Create bootstrap mesh (will auto-detect available backends)
  const mesh = createBootstrapMesh({
    mcpUrl: 'http://localhost:3001/mcp',
    // Optional: configure GitHub
    // github: {
    //   token: process.env.GITHUB_TOKEN!,
    //   owner: process.env.GITHUB_OWNER!,
    //   repo: process.env.GITHUB_REPO!,
    // },
    // Optional: enable/disable Firebase
    firebase: true,
  });

  // Wait a moment for MCP availability check
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check backend status
  console.log('Backend Status:');
  const status = mesh.getBackendStatus();
  console.log(`  MCP HTTP:  ${status.mcp ? '✓' : '✗'}`);
  console.log(`  Local File: ${status.local ? '✓' : '✗'}`);
  console.log(`  GitHub:     ${status.github ? '✓' : '✗'}`);
  console.log(`  Firebase:   ${status.firebase ? '✓' : '✗'}`);
  console.log();

  // Example 1: Save a new memory
  console.log('Example 1: Save a memory');
  try {
    const memoryId = await mesh.saveMemory({
      content: 'Bootstrap mesh example - testing multi-backend storage',
      type: 'episodic',
      importance_score: 0.7,
      tags: ['example', 'bootstrap', 'test'],
      created_at: new Date().toISOString(),
    });
    console.log(`✓ Saved memory: ${memoryId}`);
    console.log(`  Active backend: ${mesh.getActiveBackend()}\n`);
  } catch (error) {
    console.error(`✗ Failed to save memory: ${error}\n`);
  }

  // Example 2: Load memories with filters
  console.log('Example 2: Load memories (episodic, importance >= 0.5)');
  try {
    const memories = await mesh.loadMemories({
      type: 'episodic',
      minImportance: 0.5,
      limit: 5,
    });

    console.log(`✓ Loaded ${memories.length} memories`);
    console.log(`  Active backend: ${mesh.getActiveBackend()}`);

    if (memories.length > 0) {
      console.log('\nMemories:');
      memories.forEach((mem, i) => {
        console.log(`  ${i + 1}. [${mem.type}] ${mem.content.substring(0, 60)}...`);
        console.log(`     Importance: ${mem.importance_score}, Tags: [${mem.tags.join(', ')}]`);
      });
    }
    console.log();
  } catch (error) {
    console.error(`✗ Failed to load memories: ${error}\n`);
  }

  // Example 3: Load all semantic memories
  console.log('Example 3: Load all semantic memories');
  try {
    const semanticMems = await mesh.loadMemories({
      type: 'semantic',
      limit: 10,
    });

    console.log(`✓ Loaded ${semanticMems.length} semantic memories`);
    console.log(`  Active backend: ${mesh.getActiveBackend()}\n`);
  } catch (error) {
    console.error(`✗ Failed to load semantic memories: ${error}\n`);
  }

  // Example 4: Get a specific memory by ID (if we have any)
  console.log('Example 4: Get specific memory by ID');
  try {
    const allMemories = await mesh.loadMemories({ limit: 1 });
    if (allMemories.length > 0) {
      const memId = allMemories[0].id;
      const memory = await mesh.getMemory(memId);

      if (memory) {
        console.log(`✓ Retrieved memory: ${memId}`);
        console.log(`  Content: ${memory.content.substring(0, 60)}...`);
        console.log(`  Type: ${memory.type}`);
        console.log(`  Importance: ${memory.importance_score}\n`);
      } else {
        console.log(`✗ Memory not found: ${memId}\n`);
      }
    } else {
      console.log('No memories available to retrieve\n');
    }
  } catch (error) {
    console.error(`✗ Failed to get memory: ${error}\n`);
  }

  // Example 5: Filter by tags
  console.log('Example 5: Load memories with specific tags');
  try {
    const taggedMems = await mesh.loadMemories({
      tags: ['example', 'test'],
      limit: 10,
    });

    console.log(`✓ Loaded ${taggedMems.length} memories with tags [example, test]`);
    console.log(`  Active backend: ${mesh.getActiveBackend()}\n`);
  } catch (error) {
    console.error(`✗ Failed to load tagged memories: ${error}\n`);
  }

  console.log('=== Example Complete ===');
}

// Run the example
main().catch(error => {
  console.error('Example failed:', error);
  process.exit(1);
});
