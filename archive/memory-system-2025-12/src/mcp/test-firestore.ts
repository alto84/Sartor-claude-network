#!/usr/bin/env ts-node
/**
 * Test script to verify Firestore connectivity
 *
 * This script attempts to:
 * 1. Initialize Firebase with Firestore
 * 2. Create a test memory
 * 3. Read it back
 * 4. Report success or failure
 *
 * Run: npx ts-node src/mcp/test-firestore.ts
 */

import { FirestoreStore, MemoryType } from './firestore-store';

async function testFirestore() {
  console.log('=== Firestore Connectivity Test ===\n');

  try {
    // Create store
    console.log('1. Initializing FirestoreStore...');
    const store = new FirestoreStore();

    if (!store.isUsingFirestore()) {
      console.log('❌ Firestore not available');
      console.log('   Using fallback storage instead');
      console.log('\nThis is expected if:');
      console.log('   - Service account credentials are not configured');
      console.log('   - Firestore is not enabled in Firebase project');
      console.log('\nTo enable Firestore:');
      console.log('   1. Go to Firebase Console');
      console.log('   2. Select your project');
      console.log('   3. Click "Firestore Database" in left sidebar');
      console.log('   4. Click "Create database" (if not already created)');
      return;
    }

    console.log('✓ Firestore initialized successfully\n');

    // Create test memory
    console.log('2. Creating test memory...');
    const testMemory = await store.createMemory(
      'This is a test memory created by test-firestore.ts',
      MemoryType.WORKING,
      {
        importance_score: 0.5,
        tags: ['test', 'firestore-connectivity'],
      }
    );
    console.log(`✓ Memory created: ${testMemory.id}\n`);

    // Read it back
    console.log('3. Reading memory back...');
    const retrieved = await store.getMemory(testMemory.id);
    if (!retrieved) {
      console.log('❌ Failed to retrieve memory');
      return;
    }
    console.log('✓ Memory retrieved successfully');
    console.log(`   Content: ${retrieved.content}\n`);

    // Get stats
    console.log('4. Getting stats...');
    const stats = await store.getStats();
    console.log('✓ Stats retrieved:');
    console.log(`   Total memories: ${stats.total}`);
    console.log(`   Storage backend: ${stats.storage}`);
    console.log(`   By type:`, stats.by_type);

    console.log('\n=== ✓ All tests passed! ===');
    console.log('\nFirestore is working correctly and can be used as hot tier storage.');
    console.log('You can now switch to FirestoreMultiTierStore in your application.');

  } catch (error) {
    console.error('\n=== ❌ Test failed ===');
    console.error('Error:', error);
    console.error('\nPossible causes:');
    console.error('   - Invalid service account credentials');
    console.error('   - Firestore not enabled in Firebase project');
    console.error('   - Network connectivity issues');
  }
}

// Run test
testFirestore().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
