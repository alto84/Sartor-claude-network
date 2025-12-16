/**
 * Firebase Connection Test
 *
 * Tests the Firebase Admin SDK connection to Realtime Database
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const credentialsPath = path.resolve(__dirname, '../../config/firebase-credentials.json');

async function testFirebaseConnection(): Promise<void> {
  console.log('=== Firebase Connection Test ===\n');

  // Check credentials file exists
  if (!fs.existsSync(credentialsPath)) {
    console.error('ERROR: Credentials file not found at:', credentialsPath);
    process.exit(1);
  }
  console.log('✓ Credentials file found');

  try {
    // Initialize Firebase Admin
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    // Try alternative RTDB URL formats for different regions
    const possibleURLs = [
      `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
      `https://${serviceAccount.project_id}-default-rtdb.europe-west1.firebasedatabase.app`,
      `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`,
      `https://${serviceAccount.project_id}.firebaseio.com`
    ];

    console.log('Attempting RTDB URL:', possibleURLs[0]);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: possibleURLs[0]
      });
    }
    console.log('✓ Firebase Admin initialized');

    // Get Realtime Database reference
    const db = admin.database();
    console.log('✓ Database reference obtained');

    // Test write
    const testRef = db.ref('connection_test');
    const testData = {
      timestamp: Date.now(),
      message: 'Connection test from Sartor-Claude-Network',
      agent: 'executive'
    };

    const startWrite = Date.now();
    await testRef.set(testData);
    const writeLatency = Date.now() - startWrite;
    console.log(`✓ Write successful (latency: ${writeLatency}ms)`);

    // Test read
    const startRead = Date.now();
    const snapshot = await testRef.get();
    const readLatency = Date.now() - startRead;
    const readData = snapshot.val();
    console.log(`✓ Read successful (latency: ${readLatency}ms)`);
    console.log('  Data:', JSON.stringify(readData, null, 2));

    // Test Firestore as well
    const firestore = admin.firestore();
    console.log('\n=== Firestore Connection Test ===\n');

    const firestoreStartWrite = Date.now();
    await firestore.collection('connection_test').doc('test').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'Firestore connection test',
      agent: 'executive'
    });
    const firestoreWriteLatency = Date.now() - firestoreStartWrite;
    console.log(`✓ Firestore write successful (latency: ${firestoreWriteLatency}ms)`);

    const firestoreStartRead = Date.now();
    const firestoreDoc = await firestore.collection('connection_test').doc('test').get();
    const firestoreReadLatency = Date.now() - firestoreStartRead;
    console.log(`✓ Firestore read successful (latency: ${firestoreReadLatency}ms)`);
    console.log('  Data:', JSON.stringify(firestoreDoc.data(), null, 2));

    // Summary
    console.log('\n=== Connection Test Summary ===');
    console.log(`RTDB Write Latency: ${writeLatency}ms ${writeLatency < 100 ? '(MEETS <100ms target)' : '(EXCEEDS target)'}`);
    console.log(`RTDB Read Latency: ${readLatency}ms ${readLatency < 100 ? '(MEETS <100ms target)' : '(EXCEEDS target)'}`);
    console.log(`Firestore Write Latency: ${firestoreWriteLatency}ms ${firestoreWriteLatency < 500 ? '(MEETS <500ms target)' : '(EXCEEDS target)'}`);
    console.log(`Firestore Read Latency: ${firestoreReadLatency}ms ${firestoreReadLatency < 500 ? '(MEETS <500ms target)' : '(EXCEEDS target)'}`);

    // Clean up
    await testRef.remove();
    await firestore.collection('connection_test').doc('test').delete();
    console.log('\n✓ Test data cleaned up');
    console.log('\n=== ALL TESTS PASSED ===');

    process.exit(0);
  } catch (error) {
    console.error('\nERROR:', error);
    process.exit(1);
  }
}

testFirebaseConnection();
