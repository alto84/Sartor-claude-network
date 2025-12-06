/**
 * Example Usage of the Memory System
 *
 * Demonstrates:
 * - Creating and managing memories
 * - Searching and retrieval
 * - Running maintenance operations
 * - Handling different memory types
 * - Privacy and compliance
 */

import {
  createMemorySystem,
  createOptimizedMemorySystem
} from './memory-system';

import {
  Memory,
  MemoryType
} from './types';

// ============================================================================
// Example 1: Basic Memory Operations
// ============================================================================

async function basicMemoryOperations() {
  console.log('=== Example 1: Basic Memory Operations ===\n');

  // Create a new memory system
  const memorySystem = createMemorySystem();

  // Create some memories
  const memory1 = await memorySystem.createMemory(
    'User prefers dark mode for the UI',
    MemoryType.SEMANTIC,
    {
      tags: ['user_preference', 'ui', 'explicitly_saved']
    }
  );
  console.log('Created memory 1:', memory1.id);

  const memory2 = await memorySystem.createMemory(
    'User mentioned they work as a software engineer at Google',
    MemoryType.EPISODIC,
    {
      tags: ['personal_fact', 'career']
    }
  );
  console.log('Created memory 2:', memory2.id);

  const memory3 = await memorySystem.createMemory(
    'User asked how to implement a binary search tree',
    MemoryType.EPISODIC,
    {
      tags: ['question', 'programming']
    }
  );
  console.log('Created memory 3:', memory3.id);

  // Retrieve a memory (this counts as access and strengthens it)
  const retrieved = await memorySystem.getMemory(memory1.id);
  console.log('\nRetrieved memory:', retrieved?.content);
  console.log('Strength after access:', retrieved?.strength);
  console.log('Access count:', retrieved?.access_count);

  // Search memories by tag
  const searchResults = await memorySystem.searchMemories({
    filters: {
      tags: ['personal_fact']
    }
  });
  console.log('\nSearch results for "personal_fact" tag:');
  searchResults.forEach(result => {
    console.log(`- ${result.memory.content} (score: ${result.score.toFixed(3)})`);
  });

  // Get statistics
  const stats = memorySystem.getStats();
  console.log('\nMemory system statistics:');
  console.log(`Total memories: ${stats.total_memories}`);
  console.log(`Average importance: ${stats.average_importance.toFixed(3)}`);
  console.log(`Average strength: ${stats.average_strength.toFixed(3)}`);
}

// ============================================================================
// Example 2: Memory Decay and Reinforcement
// ============================================================================

async function memoryDecayExample() {
  console.log('\n=== Example 2: Memory Decay and Reinforcement ===\n');

  const memorySystem = createMemorySystem();

  // Create a memory
  const memory = await memorySystem.createMemory(
    'Temporary note: Meeting scheduled for tomorrow',
    MemoryType.EPISODIC,
    {
      tags: ['temporary', 'meeting']
    }
  );

  console.log('Initial state:');
  console.log(`Strength: ${memory.strength}`);
  console.log(`Importance: ${memory.importance_score.toFixed(3)}`);

  // Simulate time passing - run daily maintenance
  console.log('\nAfter 7 days without access:');
  // In production, this would run daily
  await memorySystem.runDailyMaintenance();

  const afterDecay = await memorySystem.getMemory(memory.id, false);
  console.log(`Strength: ${afterDecay?.strength.toFixed(3)}`);

  // Access the memory (reinforcement)
  console.log('\nAccessing memory (reinforcement):');
  await memorySystem.getMemory(memory.id, true);

  const afterReinforcement = await memorySystem.getMemory(memory.id, false);
  console.log(`Strength: ${afterReinforcement?.strength.toFixed(3)}`);
  console.log(`Access count: ${afterReinforcement?.access_count}`);
}

// ============================================================================
// Example 3: Spaced Repetition
// ============================================================================

async function spacedRepetitionExample() {
  console.log('\n=== Example 3: Spaced Repetition ===\n');

  const memorySystem = createMemorySystem();

  // Create important procedural knowledge
  const memory = await memorySystem.createMemory(
    'To debug TypeScript: Use breakpoints, check types with hover, enable source maps',
    MemoryType.PROCEDURAL,
    {
      tags: ['procedural_knowledge', 'typescript', 'debugging'],
      importance_score: 0.85 // High importance
    }
  );

  console.log('Created high-importance procedural memory');
  console.log(`Importance: ${memory.importance_score}`);

  // Calculate review intervals
  const { calculateNextReviewDate, getIntervalProgression } = require('./spaced-repetition');

  const intervals = getIntervalProgression(memory.importance_score, 8);
  console.log('\nReview schedule (days):');
  intervals.forEach((interval, index) => {
    console.log(`Review ${index + 1}: ${interval} days`);
  });

  // Run daily reviews
  console.log('\nRunning daily review process...');
  const maintenanceResults = await memorySystem.runDailyMaintenance();
  console.log(`Memories reviewed: ${maintenanceResults.reviews_processed}`);
}

// ============================================================================
// Example 4: Memory Consolidation
// ============================================================================

async function consolidationExample() {
  console.log('\n=== Example 4: Memory Consolidation ===\n');

  const memorySystem = createMemorySystem();

  // Create related memories
  const memories = [
    'User asked about React hooks',
    'User implemented useState in their component',
    'User debugged useEffect dependency array',
    'User learned about custom hooks',
    'User created a useLocalStorage hook'
  ];

  console.log('Creating related memories about React hooks...');
  for (const content of memories) {
    await memorySystem.createMemory(content, MemoryType.EPISODIC, {
      tags: ['react', 'programming'],
      // Mock embedding (in production: use real embeddings)
      embedding: Array.from({ length: 768 }, () => Math.random())
    });
  }

  console.log(`Created ${memories.length} related memories`);

  // Run consolidation
  console.log('\nRunning consolidation...');
  const results = await memorySystem.runConsolidation();

  console.log(`Clusters found: ${results.clusters_found}`);
  console.log(`Clusters consolidated: ${results.clusters_consolidated}`);
  console.log(`Compression ratio: ${(results.compression_ratio * 100).toFixed(1)}%`);

  const stats = memorySystem.getStats();
  console.log(`Active memories after consolidation: ${stats.by_status.active}`);
  console.log(`Archived memories: ${stats.by_status.archived}`);
}

// ============================================================================
// Example 5: Privacy and Forgetting
// ============================================================================

async function privacyExample() {
  console.log('\n=== Example 5: Privacy and Forgetting ===\n');

  const memorySystem = createMemorySystem();

  // Create memory with PII
  const piiMemory = await memorySystem.createMemory(
    'User email is john.doe@example.com and phone is 555-123-4567',
    MemoryType.EPISODIC,
    {
      tags: ['contact_info']
    }
  );

  console.log('Created memory with PII');

  // Check privacy risk
  const { calculatePrivacyRisk, detectPII } = require('./forgetting-strategy');

  const privacyRisk = calculatePrivacyRisk(piiMemory);
  const piiScore = detectPII(piiMemory);

  console.log(`Privacy risk score: ${privacyRisk.toFixed(3)}`);
  console.log(`PII detection score: ${piiScore.toFixed(3)}`);
  console.log(`Auto-expiration set for: ${piiMemory.expires_at}`);

  // Create protected memory
  const protectedMemory = await memorySystem.createMemory(
    'User commitment: Will deliver the project by Friday',
    MemoryType.SEMANTIC,
    {
      tags: ['commitment', 'explicitly_saved']
    }
  );

  console.log('\nCreated protected memory (commitment)');
  console.log('This memory will never be auto-deleted');

  // Simulate GDPR deletion request
  console.log('\nSimulating GDPR Right to Erasure request...');
  const { handleRightToErasure } = require('./forgetting-strategy');

  const allMemories = memorySystem.exportMemories();
  const erasureReport = handleRightToErasure('user123', allMemories, memorySystem.getConfig().forgetting);

  console.log('Erasure report:');
  console.log(`Total memories: ${erasureReport.total_memories}`);
  console.log(`Deleted: ${erasureReport.deleted}`);
  console.log(`Anonymized: ${erasureReport.anonymized}`);
}

// ============================================================================
// Example 6: Context-Aware Retrieval
// ============================================================================

async function contextAwareRetrievalExample() {
  console.log('\n=== Example 6: Context-Aware Retrieval ===\n');

  const memorySystem = createMemorySystem();

  // Create diverse memories
  await memorySystem.createMemory(
    'User prefers Python for data science work',
    MemoryType.SEMANTIC,
    {
      tags: ['preference', 'python', 'data_science'],
      embedding: [0.8, 0.6, 0.3, 0.9, 0.2] // Mock embedding
    }
  );

  await memorySystem.createMemory(
    'User uses pandas and numpy frequently',
    MemoryType.EPISODIC,
    {
      tags: ['python', 'tools'],
      embedding: [0.75, 0.65, 0.25, 0.85, 0.15]
    }
  );

  await memorySystem.createMemory(
    'User asked about JavaScript async/await',
    MemoryType.EPISODIC,
    {
      tags: ['javascript', 'question'],
      embedding: [0.2, 0.3, 0.9, 0.1, 0.8]
    }
  );

  console.log('Created diverse memories');

  // Context: User is asking about Python data analysis
  const pythonContext = [0.82, 0.62, 0.28, 0.88, 0.18];

  console.log('\nRetrieving memories relevant to Python data analysis...');
  const relevant = await memorySystem.getRelevantMemories(pythonContext, 5);

  console.log(`Found ${relevant.length} relevant memories:`);
  relevant.forEach((memory, index) => {
    console.log(`${index + 1}. ${memory.content}`);
  });
}

// ============================================================================
// Example 7: Custom Configuration
// ============================================================================

async function customConfigurationExample() {
  console.log('\n=== Example 7: Custom Configuration ===\n');

  // Create memory system optimized for conversation
  const conversationalSystem = createOptimizedMemorySystem('conversational');
  console.log('Created conversational memory system');
  console.log('Optimized for: recency and context awareness');

  // Create memory system optimized for knowledge base
  const knowledgeBaseSystem = createOptimizedMemorySystem('knowledge_base');
  console.log('\nCreated knowledge base memory system');
  console.log('Optimized for: importance and permanence');

  // Custom configuration
  const customSystem = createMemorySystem({
    importance: {
      weights: {
        recency: 0.30,
        frequency: 0.30,
        salience: 0.20,
        relevance: 0.20
      },
      recency_lambda: 0.03, // Slower recency decay
      max_expected_accesses: 200
    },
    decay: {
      base_rate: 0.05, // Slower decay
      reinforcement_boost: 0.20, // Stronger reinforcement
      thresholds: {
        soft_delete: 0.25,
        archive: 0.10,
        permanent_delete: 0.03
      },
      type_modifiers: {
        episodic: 0.8,
        semantic: 0.5,
        procedural: 0.3,
        emotional: 0.4,
        system: 0.1
      }
    }
  });

  console.log('\nCreated custom memory system');
  console.log('Custom weights and decay rates applied');

  const config = customSystem.getConfig();
  console.log('\nImportance weights:');
  console.log(`- Recency: ${config.importance.weights.recency}`);
  console.log(`- Frequency: ${config.importance.weights.frequency}`);
  console.log(`- Salience: ${config.importance.weights.salience}`);
  console.log(`- Relevance: ${config.importance.weights.relevance}`);
}

// ============================================================================
// Example 8: Daily Maintenance Workflow
// ============================================================================

async function dailyMaintenanceExample() {
  console.log('\n=== Example 8: Daily Maintenance Workflow ===\n');

  const memorySystem = createMemorySystem();

  // Create various memories
  console.log('Creating sample memories...');
  for (let i = 0; i < 50; i++) {
    await memorySystem.createMemory(
      `Sample memory ${i}: ${Math.random() > 0.5 ? 'Important' : 'Casual'} content`,
      Math.random() > 0.5 ? MemoryType.SEMANTIC : MemoryType.EPISODIC,
      {
        tags: Math.random() > 0.7 ? ['important'] : ['casual'],
        importance_score: Math.random()
      }
    );
  }

  console.log('Created 50 sample memories');

  // Get initial stats
  const beforeStats = memorySystem.getStats();
  console.log('\nBefore maintenance:');
  console.log(`Active: ${beforeStats.by_status.active}`);
  console.log(`Archived: ${beforeStats.by_status.archived}`);
  console.log(`Average strength: ${beforeStats.average_strength.toFixed(3)}`);

  // Run maintenance
  console.log('\nRunning daily maintenance...');
  const results = await memorySystem.runDailyMaintenance();

  console.log('\nMaintenance results:');
  console.log(`Decay updated: ${results.decay_updated} memories`);
  console.log(`Reviews processed: ${results.reviews_processed}`);
  console.log(`Consolidations: ${results.consolidations}`);
  console.log(`Deletions: ${results.deletions}`);

  // Get final stats
  const afterStats = memorySystem.getStats();
  console.log('\nAfter maintenance:');
  console.log(`Active: ${afterStats.by_status.active}`);
  console.log(`Archived: ${afterStats.by_status.archived}`);
  console.log(`Average strength: ${afterStats.average_strength.toFixed(3)}`);
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  try {
    await basicMemoryOperations();
    await memoryDecayExample();
    await spacedRepetitionExample();
    await consolidationExample();
    await privacyExample();
    await contextAwareRetrievalExample();
    await customConfigurationExample();
    await dailyMaintenanceExample();

    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export examples for individual testing
export {
  basicMemoryOperations,
  memoryDecayExample,
  spacedRepetitionExample,
  consolidationExample,
  privacyExample,
  contextAwareRetrievalExample,
  customConfigurationExample,
  dailyMaintenanceExample,
  runAllExamples
};

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
