/**
 * Memory System Status API Route
 *
 * Checks the health of all memory backends:
 * - Firebase RTDB (hot tier)
 * - Firestore (warm tier)
 * - Obsidian (local warm tier)
 * - Google Drive (document storage)
 */

import { NextResponse } from 'next/server';
import https from 'https';

// Custom HTTPS agent that accepts self-signed certificates (for Obsidian Local REST API)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

interface BackendStatus {
  name: string;
  type: 'firebase' | 'firestore' | 'obsidian' | 'gdrive' | 'github';
  connected: boolean;
  latency?: number;
  lastChecked: string;
  error?: string;
  details?: {
    version?: string;
    region?: string;
    endpoint?: string;
  };
}

interface MemorySystemStatus {
  overall: 'healthy' | 'degraded' | 'offline';
  backends: BackendStatus[];
  tiers: {
    hot: { count: number; sizeBytes: number };
    warm: { count: number; sizeBytes: number };
    cold: { count: number };
  };
  lastSync: string;
}

/**
 * Check Obsidian Local REST API
 * Uses https module directly to handle self-signed certificates
 */
async function checkObsidian(): Promise<BackendStatus> {
  const startTime = Date.now();
  const apiUrl = process.env.OBSIDIAN_API_URL || 'https://127.0.0.1:27124';
  const apiKey = process.env.OBSIDIAN_API_KEY;

  if (!apiKey) {
    return {
      name: 'Obsidian',
      type: 'obsidian',
      connected: false,
      lastChecked: new Date().toISOString(),
      error: 'API key not configured',
      details: { endpoint: apiUrl },
    };
  }

  return new Promise((resolve) => {
    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: '/',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      rejectUnauthorized: false, // Accept self-signed certificates
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const latency = Date.now() - startTime;
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({
              name: 'Obsidian',
              type: 'obsidian',
              connected: true,
              latency,
              lastChecked: new Date().toISOString(),
              details: {
                endpoint: apiUrl,
                version: json.versions?.self,
              },
            });
          } catch {
            resolve({
              name: 'Obsidian',
              type: 'obsidian',
              connected: true,
              latency,
              lastChecked: new Date().toISOString(),
              details: { endpoint: apiUrl },
            });
          }
        } else {
          resolve({
            name: 'Obsidian',
            type: 'obsidian',
            connected: false,
            lastChecked: new Date().toISOString(),
            error: `HTTP ${res.statusCode}`,
            details: { endpoint: apiUrl },
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        name: 'Obsidian',
        type: 'obsidian',
        connected: false,
        lastChecked: new Date().toISOString(),
        error: error.message,
        details: { endpoint: apiUrl },
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: 'Obsidian',
        type: 'obsidian',
        connected: false,
        lastChecked: new Date().toISOString(),
        error: 'Connection timeout',
        details: { endpoint: apiUrl },
      });
    });

    req.end();
  });
}

/**
 * Check Firebase RTDB connection
 */
async function checkFirebaseRTDB(): Promise<BackendStatus> {
  const startTime = Date.now();
  const databaseUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    'https://sartor-family-default-rtdb.firebaseio.com';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Check if we can reach the Firebase RTDB
    const response = await fetch(`${databaseUrl}/.json?shallow=true`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    // Firebase returns 401 if auth required but still reachable
    if (response.ok || response.status === 401) {
      return {
        name: 'Firebase RTDB',
        type: 'firebase',
        connected: true,
        latency,
        lastChecked: new Date().toISOString(),
        details: {
          region: 'us-central1',
          endpoint: databaseUrl,
        },
      };
    } else {
      return {
        name: 'Firebase RTDB',
        type: 'firebase',
        connected: false,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${response.status}`,
        details: { endpoint: databaseUrl },
      };
    }
  } catch (error) {
    return {
      name: 'Firebase RTDB',
      type: 'firebase',
      connected: false,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Connection failed',
      details: { endpoint: databaseUrl },
    };
  }
}

/**
 * Check Firestore connection
 */
async function checkFirestore(): Promise<BackendStatus> {
  const startTime = Date.now();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sartor-family';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Check Firestore REST API availability
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: '_health_check' }], limit: 1 } }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    // 400/401/403 still means Firestore is reachable
    if (response.ok || response.status === 400 || response.status === 401 || response.status === 403) {
      return {
        name: 'Firestore',
        type: 'firestore',
        connected: true,
        latency,
        lastChecked: new Date().toISOString(),
        details: { region: 'us-central1' },
      };
    } else {
      return {
        name: 'Firestore',
        type: 'firestore',
        connected: false,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      name: 'Firestore',
      type: 'firestore',
      connected: false,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Check Google Drive API (requires OAuth token)
 */
async function checkGoogleDrive(): Promise<BackendStatus> {
  const clientId = process.env.GDRIVE_CLIENT_ID;

  if (!clientId) {
    return {
      name: 'Google Drive',
      type: 'gdrive',
      connected: false,
      lastChecked: new Date().toISOString(),
      error: 'OAuth not configured',
      details: { endpoint: 'drive.googleapis.com' },
    };
  }

  // For now, just check if credentials are configured
  // Full OAuth flow requires user interaction
  return {
    name: 'Google Drive',
    type: 'gdrive',
    connected: false,
    lastChecked: new Date().toISOString(),
    error: 'OAuth token not acquired (run auth flow)',
    details: { endpoint: 'drive.googleapis.com' },
  };
}

/**
 * Check GitHub API
 */
async function checkGitHub(): Promise<BackendStatus> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://api.github.com/zen', {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    return {
      name: 'GitHub Archive',
      type: 'github',
      connected: response.ok,
      latency: response.ok ? latency : undefined,
      lastChecked: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}`,
      details: { endpoint: 'api.github.com' },
    };
  } catch (error) {
    return {
      name: 'GitHub Archive',
      type: 'github',
      connected: false,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Connection failed',
      details: { endpoint: 'api.github.com' },
    };
  }
}

/**
 * Calculate overall health status
 */
function calculateOverallHealth(backends: BackendStatus[]): 'healthy' | 'degraded' | 'offline' {
  const connectedCount = backends.filter(b => b.connected).length;
  const totalCount = backends.length;
  const ratio = connectedCount / totalCount;

  // Firebase RTDB is critical for hot tier
  const firebaseStatus = backends.find(b => b.type === 'firebase');
  const isCriticalDown = firebaseStatus && !firebaseStatus.connected;

  if (isCriticalDown || ratio < 0.3) return 'offline';
  if (ratio < 1) return 'degraded';
  return 'healthy';
}

export async function GET() {
  try {
    // Check all backends in parallel
    const [firebase, firestore, obsidian, gdrive, github] = await Promise.all([
      checkFirebaseRTDB(),
      checkFirestore(),
      checkObsidian(),
      checkGoogleDrive(),
      checkGitHub(),
    ]);

    const backends = [firebase, firestore, obsidian, gdrive, github];
    const overall = calculateOverallHealth(backends);

    // Placeholder tier stats (would come from actual queries in production)
    const tiers = {
      hot: { count: 0, sizeBytes: 0 },
      warm: { count: 0, sizeBytes: 0 },
      cold: { count: 0 },
    };

    const status: MemorySystemStatus = {
      overall,
      backends,
      tiers,
      lastSync: new Date().toISOString(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Memory status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check memory system status' },
      { status: 500 }
    );
  }
}
