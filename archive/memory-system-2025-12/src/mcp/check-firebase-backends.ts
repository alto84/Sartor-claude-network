#!/usr/bin/env ts-node
/**
 * Firebase Backend Checker
 *
 * Tests which Firebase backends are available and recommends the best option.
 * Run: npx ts-node src/mcp/check-firebase-backends.ts
 */

import { initializeFirebase, getDatabase, getApp } from './firebase-init';
import { getFirestore } from 'firebase-admin/firestore';

interface BackendStatus {
  name: string;
  available: boolean;
  latency?: number;
  error?: string;
  recommendation: string;
}

async function testRealtimeDatabase(): Promise<BackendStatus> {
  const start = Date.now();
  try {
    const success = initializeFirebase();
    if (!success) {
      return {
        name: 'Realtime Database',
        available: false,
        recommendation: 'Credentials not configured',
        error: 'Firebase initialization failed',
      };
    }

    const db = getDatabase();
    if (!db) {
      return {
        name: 'Realtime Database',
        available: false,
        recommendation: 'Database URL not configured or database not created',
        error: 'Database instance not available',
      };
    }

    // Try a simple read
    const testRef = db.ref('.info/connected');
    await testRef.once('value');
    const latency = Date.now() - start;

    return {
      name: 'Realtime Database',
      available: true,
      latency,
      recommendation: 'Available for use',
    };
  } catch (error: any) {
    return {
      name: 'Realtime Database',
      available: false,
      recommendation: 'Check database URL and permissions',
      error: error.message,
    };
  }
}

async function testFirestore(): Promise<BackendStatus> {
  const start = Date.now();
  try {
    const success = initializeFirebase();
    if (!success) {
      return {
        name: 'Firestore',
        available: false,
        recommendation: 'Credentials not configured',
        error: 'Firebase initialization failed',
      };
    }

    const app = getApp();
    if (!app) {
      return {
        name: 'Firestore',
        available: false,
        recommendation: 'Firebase app not initialized',
        error: 'App instance not available',
      };
    }

    const firestore = getFirestore(app);

    // Try a simple operation - list collections (this works even with empty database)
    const collections = await firestore.listCollections();
    const latency = Date.now() - start;

    return {
      name: 'Firestore',
      available: true,
      latency,
      recommendation: 'Available for use - RECOMMENDED for new projects',
    };
  } catch (error: any) {
    // Check if it's a permission error (means Firestore exists but needs setup)
    // vs a not-found error (means Firestore not enabled)
    const isPerm = error.message?.includes('PERMISSION_DENIED');
    const isNotFound = error.message?.includes('NOT_FOUND') || error.message?.includes('not found');

    if (isPerm) {
      return {
        name: 'Firestore',
        available: false,
        recommendation: 'Firestore exists but needs security rule configuration',
        error: 'Permission denied - configure Firestore security rules',
      };
    } else if (isNotFound) {
      return {
        name: 'Firestore',
        available: false,
        recommendation: 'Firestore not enabled - enable in Firebase Console',
        error: 'Firestore not found - needs to be created',
      };
    } else {
      return {
        name: 'Firestore',
        available: false,
        recommendation: 'Check service account permissions',
        error: error.message,
      };
    }
  }
}

async function main() {
  console.log('=== Firebase Backend Availability Check ===\n');

  console.log('Testing backends...\n');

  // Test both backends
  const [rtdbStatus, firestoreStatus] = await Promise.all([
    testRealtimeDatabase(),
    testFirestore(),
  ]);

  // Display results
  console.log('Results:');
  console.log('─'.repeat(60));

  for (const status of [rtdbStatus, firestoreStatus]) {
    console.log(`\n${status.name}:`);
    console.log(`  Available: ${status.available ? '✅ YES' : '❌ NO'}`);
    if (status.latency) {
      console.log(`  Latency: ${status.latency}ms`);
    }
    if (status.error) {
      console.log(`  Error: ${status.error}`);
    }
    console.log(`  → ${status.recommendation}`);
  }

  console.log('\n' + '─'.repeat(60));

  // Overall recommendation
  console.log('\n=== Recommendation ===\n');

  if (firestoreStatus.available && rtdbStatus.available) {
    console.log('✅ Both backends are available!');
    console.log('\nRecommendation: Use Firestore');
    console.log('Reasons:');
    console.log('  - Better scalability');
    console.log('  - More flexible queries');
    console.log('  - Easier setup (auto-enabled on most projects)');
    console.log('\nTo use Firestore:');
    console.log('  1. Update memory-server.ts to use FirestoreMultiTierStore');
    console.log('  2. Restart MCP server');
  } else if (firestoreStatus.available) {
    console.log('✅ Firestore is available!');
    console.log('\nRecommendation: Use Firestore');
    console.log('Realtime Database is not available, but Firestore works great.');
    console.log('\nTo use Firestore:');
    console.log('  1. Update memory-server.ts to use FirestoreMultiTierStore');
    console.log('  2. Restart MCP server');
  } else if (rtdbStatus.available) {
    console.log('✅ Realtime Database is available!');
    console.log('\nRecommendation: Use Realtime Database');
    console.log('Firestore is not available, but Realtime Database works.');
    console.log('\nTo use Realtime Database:');
    console.log('  1. Use existing MultiTierStore (no changes needed)');
    console.log('\nOptional: Enable Firestore for better scalability:');
    console.log('  1. Go to Firebase Console → Firestore Database');
    console.log('  2. Click "Create database"');
  } else {
    console.log('❌ Neither backend is available');
    console.log('\nTroubleshooting steps:');
    console.log('  1. Check service account credentials are configured');
    console.log('  2. For Firestore: Enable in Firebase Console');
    console.log('  3. For Realtime Database: Create database and set FIREBASE_DATABASE_URL');
    console.log('\nThe system will fall back to file storage until configured.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nFor detailed integration guide:');
  console.log('  - Firestore: docs/FIRESTORE_INTEGRATION.md');
  console.log('  - Quick start: FIRESTORE_QUICKSTART.md');
  console.log('  - Full report: FIRESTORE_IMPLEMENTATION_REPORT.md');
  console.log('\n');
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
