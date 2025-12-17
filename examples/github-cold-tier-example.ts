/**
 * Example usage of GitHub Cold Tier Storage
 *
 * This example demonstrates how to use the GitHub cold tier for long-term
 * memory archival and retrieval.
 */

import { GitHubColdTier, createGitHubColdTier } from '../src/mcp/github-cold-tier';
import { MemoryType } from '../src/mcp/file-store';

async function main() {
  console.log('=== GitHub Cold Tier Storage Example ===\n');

  // Create instance with environment variables
  // Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO in your .env
  const coldTier = createGitHubColdTier();

  console.log('Storage enabled:', coldTier.isEnabled());

  if (!coldTier.isEnabled()) {
    console.log('\nTo enable GitHub cold tier, set these environment variables:');
    console.log('  GITHUB_TOKEN=your_github_personal_access_token');
    console.log('  GITHUB_OWNER=your_github_username');
    console.log('  GITHUB_REPO=your_repository_name');
    console.log('\nRunning in degraded mode (no actual GitHub operations).\n');
  }

  // Example 1: Archive memories
  console.log('--- Example 1: Archive Memories ---');
  const memoriesToArchive = [
    {
      id: 'mem_1234567890',
      content: 'Important pattern: Always validate user input before processing',
      type: MemoryType.PROCEDURAL,
      importance_score: 0.9,
      tags: ['security', 'best-practice'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'mem_0987654321',
      content: 'Meeting notes: Discussed new feature roadmap for Q1 2025',
      type: MemoryType.EPISODIC,
      importance_score: 0.7,
      tags: ['meeting', 'planning'],
      created_at: new Date().toISOString(),
    },
  ];

  await coldTier.archive(memoriesToArchive);
  console.log(`Archived ${memoriesToArchive.length} memories\n`);

  // Example 2: Retrieve memories by type
  console.log('--- Example 2: Retrieve by Type ---');
  const proceduralMemories = await coldTier.retrieve({
    type: [MemoryType.PROCEDURAL],
    limit: 10,
  });
  console.log(`Found ${proceduralMemories.length} procedural memories\n`);

  // Example 3: Retrieve high-importance memories
  console.log('--- Example 3: Retrieve High-Importance Memories ---');
  const importantMemories = await coldTier.retrieve({
    min_importance: 0.8,
    limit: 20,
  });
  console.log(`Found ${importantMemories.length} high-importance memories\n`);

  // Example 4: Retrieve memories by date range
  console.log('--- Example 4: Retrieve by Date Range ---');
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const recentMemories = await coldTier.retrieve({
    date_range: {
      start: lastWeek.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    },
    limit: 50,
  });
  console.log(`Found ${recentMemories.length} memories from last week\n`);

  // Example 5: Retrieve memories by tags
  console.log('--- Example 5: Retrieve by Tags ---');
  const taggedMemories = await coldTier.retrieve({
    tags: ['security', 'best-practice'],
    limit: 10,
  });
  console.log(`Found ${taggedMemories.length} memories with specified tags\n`);

  // Example 6: List memory metadata
  console.log('--- Example 6: List Memory Metadata ---');
  const metadata = await coldTier.list({ limit: 5 });
  console.log(`Retrieved metadata for ${metadata.length} memories`);
  if (metadata.length > 0) {
    console.log('Sample metadata:', JSON.stringify(metadata[0], null, 2));
  }
  console.log();

  // Example 7: Get statistics
  console.log('--- Example 7: Storage Statistics ---');
  const stats = await coldTier.getStats();
  console.log('Total memories:', stats.total_memories);
  console.log('By type:', stats.by_type);
  console.log('Storage backend:', stats.storage_backend);
  console.log('Cache hit rate:', (stats.cache_hit_rate * 100).toFixed(2) + '%');
  console.log('Oldest memory:', stats.oldest_memory || 'N/A');
  console.log('Newest memory:', stats.newest_memory || 'N/A');
  console.log();

  // Example 8: Backward compatibility (for multi-tier-store)
  console.log('--- Example 8: Backward Compatibility Methods ---');
  await coldTier.set(
    'procedural/mem_example.json',
    {
      id: 'mem_example',
      content: 'Example using old interface',
      type: MemoryType.PROCEDURAL,
      importance_score: 0.8,
      tags: ['example'],
      created_at: new Date().toISOString(),
    },
    'Store example memory'
  );
  console.log('Stored memory using set() method');

  const retrieved = await coldTier.get('procedural/mem_example.json');
  console.log('Retrieved memory:', retrieved ? 'Success' : 'Not found');
  console.log();

  // Example 9: Cache management
  console.log('--- Example 9: Cache Management ---');
  console.log('Clearing cache...');
  coldTier.clearCache();
  console.log('Cache cleared\n');

  console.log('=== Example Complete ===');
}

// Run example
main().catch(console.error);
