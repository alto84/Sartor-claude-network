import * as admin from 'firebase-admin';
import { Database } from 'firebase-admin/database';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Firebase initialization module for MCP server
 * Supports multiple credential loading methods with graceful fallbacks
 * Logs to stderr to maintain MCP stdout protocol compliance
 */

let isInitialized = false;
let databaseInstance: Database | null = null;

/**
 * Load Firebase credentials from various sources
 * Priority order:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON file)
 * 2. config/service-account.json file
 * 3. FIREBASE_SERVICE_ACCOUNT_BASE64 env var (base64-encoded JSON)
 */
function loadCredentials(): admin.ServiceAccount | null {
  // Method 1: GOOGLE_APPLICATION_CREDENTIALS
  const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (googleCredsPath) {
    try {
      const absolutePath = path.resolve(googleCredsPath);
      if (fs.existsSync(absolutePath)) {
        const creds = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
        console.error('[Firebase Init] Loaded credentials from GOOGLE_APPLICATION_CREDENTIALS');
        return creds as admin.ServiceAccount;
      }
    } catch (error) {
      console.error(
        `[Firebase Init] Error loading credentials from GOOGLE_APPLICATION_CREDENTIALS: ${error}`
      );
    }
  }

  // Method 2: config/service-account.json
  const configPath = path.join(process.cwd(), 'config', 'service-account.json');
  if (fs.existsSync(configPath)) {
    try {
      const creds = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.error('[Firebase Init] Loaded credentials from config/service-account.json');
      return creds as admin.ServiceAccount;
    } catch (error) {
      console.error(
        `[Firebase Init] Error loading credentials from config/service-account.json: ${error}`
      );
    }
  }

  // Method 3: FIREBASE_SERVICE_ACCOUNT_BASE64
  const base64Creds = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64Creds) {
    try {
      const decoded = Buffer.from(base64Creds, 'base64').toString('utf-8');
      const creds = JSON.parse(decoded);
      console.error('[Firebase Init] Loaded credentials from FIREBASE_SERVICE_ACCOUNT_BASE64');
      return creds as admin.ServiceAccount;
    } catch (error) {
      console.error(
        `[Firebase Init] Error loading credentials from FIREBASE_SERVICE_ACCOUNT_BASE64: ${error}`
      );
    }
  }

  return null;
}

/**
 * Get database URL from environment or config
 */
function getDatabaseUrl(): string | undefined {
  // First check env var
  if (process.env.FIREBASE_DATABASE_URL) {
    return process.env.FIREBASE_DATABASE_URL;
  }

  // Fallback to config file
  try {
    const configPath = path.join(process.cwd(), 'config', 'firebase-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config?.realtimeDatabase?.databaseURL || config?.firebaseConfig?.databaseURL;
    }
  } catch (error) {
    console.error(`[Firebase Init] Error loading database URL from config: ${error}`);
  }

  return undefined;
}

/**
 * Initialize Firebase Admin SDK
 * Safe to call multiple times - subsequent calls are no-ops
 *
 * @returns true if initialization successful, false otherwise
 */
export function initializeFirebase(): boolean {
  // Already initialized
  if (isInitialized) {
    console.error('[Firebase Init] Already initialized, skipping');
    return true;
  }

  // Check if Firebase was already initialized externally
  if (admin.apps.length > 0) {
    console.error('[Firebase Init] Firebase already initialized externally');
    isInitialized = true;
    databaseInstance = admin.database();
    return true;
  }

  // Load credentials
  const credentials = loadCredentials();
  if (!credentials) {
    console.error('[Firebase Init] ERROR: No credentials found. Please set one of:');
    console.error('  - GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.error('  - config/service-account.json file');
    console.error('  - FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable');
    return false;
  }

  // Get database URL
  const databaseURL = getDatabaseUrl();
  if (!databaseURL) {
    console.error('[Firebase Init] ERROR: No database URL found. Please set:');
    console.error('  - FIREBASE_DATABASE_URL environment variable');
    console.error('  - Or configure it in config/firebase-config.json');
    return false;
  }

  // Initialize Firebase
  try {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      databaseURL: databaseURL,
    });

    databaseInstance = admin.database();
    isInitialized = true;

    console.error('[Firebase Init] ✓ Firebase initialized successfully');
    console.error(`[Firebase Init] Database URL: ${databaseURL}`);
    return true;
  } catch (error) {
    console.error(`[Firebase Init] ERROR: Failed to initialize Firebase: ${error}`);
    return false;
  }
}

/**
 * Get Firebase Database instance
 * Automatically initializes if not already done
 *
 * @returns Database instance or null if initialization failed
 */
export function getDatabase(): Database | null {
  if (!isInitialized) {
    const success = initializeFirebase();
    if (!success) {
      return null;
    }
  }

  return databaseInstance;
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return isInitialized;
}

/**
 * Get Firebase Admin app instance (for advanced use cases)
 */
export function getApp(): admin.app.App | null {
  if (!isInitialized) {
    return null;
  }
  return admin.app();
}
