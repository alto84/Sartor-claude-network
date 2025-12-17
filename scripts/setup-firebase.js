#!/usr/bin/env node

/**
 * Firebase Setup Wizard
 *
 * Validates Firebase configuration and tests connectivity.
 * Provides clear diagnostics and troubleshooting guidance.
 *
 * Usage:
 *   node scripts/setup-firebase.js
 *   npm run setup:firebase  # if added to package.json
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const CHECK_MARK = '✓';
const CROSS_MARK = '✗';
const ARROW = '→';

/**
 * Print colored message
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print success message
 */
function success(message) {
  log(`${CHECK_MARK} ${message}`, 'green');
}

/**
 * Print error message
 */
function error(message) {
  log(`${CROSS_MARK} ${message}`, 'red');
}

/**
 * Print warning message
 */
function warning(message) {
  log(`${ARROW} ${message}`, 'yellow');
}

/**
 * Print info message
 */
function info(message) {
  log(`${ARROW} ${message}`, 'cyan');
}

/**
 * Print section header
 */
function header(message) {
  log(`\n${message}`, 'bright');
  log('='.repeat(message.length), 'bright');
}

/**
 * Check if a file exists and is readable
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to load and validate a JSON file
 */
function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * Validate service account credentials structure
 */
function validateServiceAccount(credentials) {
  const requiredFields = [
    'project_id',
    'private_key',
    'client_email',
  ];

  const missing = requiredFields.filter(field => !credentials[field]);

  return {
    valid: missing.length === 0,
    missing,
    projectId: credentials.project_id,
    clientEmail: credentials.client_email,
  };
}

/**
 * Load credentials from various sources
 * Returns: { method: string, credentials: object } or null
 */
function loadCredentials() {
  // Method 1: GOOGLE_APPLICATION_CREDENTIALS environment variable
  const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (googleCredsPath) {
    const absolutePath = path.resolve(googleCredsPath);
    if (fileExists(absolutePath)) {
      const creds = loadJSON(absolutePath);
      if (creds) {
        return {
          method: 'GOOGLE_APPLICATION_CREDENTIALS env var',
          path: absolutePath,
          credentials: creds,
        };
      }
    }
  }

  // Method 2: config/service-account.json
  const configPath = path.join(process.cwd(), 'config', 'service-account.json');
  if (fileExists(configPath)) {
    const creds = loadJSON(configPath);
    if (creds) {
      return {
        method: 'config/service-account.json file',
        path: configPath,
        credentials: creds,
      };
    }
  }

  // Method 3: FIREBASE_SERVICE_ACCOUNT_BASE64
  const base64Creds = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64Creds) {
    try {
      const decoded = Buffer.from(base64Creds, 'base64').toString('utf-8');
      const creds = JSON.parse(decoded);
      return {
        method: 'FIREBASE_SERVICE_ACCOUNT_BASE64 env var',
        path: '(base64 encoded)',
        credentials: creds,
      };
    } catch {
      // Invalid base64 or JSON
    }
  }

  return null;
}

/**
 * Get database URL from environment or config
 */
function getDatabaseUrl() {
  // Check environment variable
  if (process.env.FIREBASE_DATABASE_URL) {
    return {
      method: 'FIREBASE_DATABASE_URL env var',
      url: process.env.FIREBASE_DATABASE_URL,
    };
  }

  // Check config file
  try {
    const configPath = path.join(process.cwd(), 'config', 'firebase-config.json');
    if (fileExists(configPath)) {
      const config = loadJSON(configPath);
      const url = config?.realtimeDatabase?.databaseURL || config?.firebaseConfig?.databaseURL;
      if (url) {
        return {
          method: 'config/firebase-config.json file',
          url,
        };
      }
    }
  } catch {
    // Config file doesn't exist or is invalid
  }

  return null;
}

/**
 * Test Firebase connectivity by attempting to initialize and perform basic operations
 */
async function testFirebaseConnection(credentials, databaseURL) {
  try {
    // Dynamically import firebase-admin (ESM compatibility)
    const admin = await import('firebase-admin');

    // Check if already initialized
    if (admin.default.apps.length > 0) {
      info('Firebase already initialized, using existing app');
      const db = admin.default.database();
      return { success: true, db };
    }

    // Initialize Firebase
    admin.default.initializeApp({
      credential: admin.default.credential.cert(credentials),
      databaseURL: databaseURL,
    });

    const db = admin.default.database();

    // Test write
    const testRef = db.ref('_setup_test');
    await testRef.set({
      timestamp: Date.now(),
      test: true,
    });
    success('Test write successful');

    // Test read
    const snapshot = await testRef.get();
    if (snapshot.exists()) {
      success('Test read successful');
    } else {
      throw new Error('Test read failed: data not found');
    }

    // Cleanup
    await testRef.remove();

    return { success: true, db };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      code: err.code,
    };
  }
}

/**
 * Provide troubleshooting guidance based on error
 */
function provideTroubleshooting(errorCode, errorMessage) {
  header('\nTroubleshooting Guide');

  if (errorCode === 'PERMISSION_DENIED' || errorMessage.includes('Permission denied')) {
    error('Permission Error Detected');
    console.log('\nPossible solutions:');
    console.log('1. Check Realtime Database security rules in Firebase Console');
    console.log('2. Verify service account has "Firebase Admin" role');
    console.log('3. Try regenerating the service account key');
    console.log('\nSee: docs/FIREBASE_SETUP.md#issue-permission-denied-errors');
  } else if (errorCode === 'NETWORK_ERROR' || errorMessage.includes('ENOTFOUND')) {
    error('Network Error Detected');
    console.log('\nPossible solutions:');
    console.log('1. Check internet connectivity');
    console.log('2. Verify database URL is correct');
    console.log('3. Check firewall/proxy settings');
    console.log('4. Verify Firebase service status: https://status.firebase.google.com/');
  } else if (errorMessage.includes('Invalid JSON')) {
    error('Invalid Credentials Format');
    console.log('\nPossible solutions:');
    console.log('1. Verify service-account.json is valid JSON:');
    console.log('   cat config/service-account.json | jq .');
    console.log('2. Re-download credentials from Firebase Console');
    console.log('3. Check for file corruption or incomplete download');
  } else {
    error('Unknown Error');
    console.log('\nError details:', errorMessage);
    console.log('\nFor more help, see: docs/FIREBASE_SETUP.md#troubleshooting');
  }
}

/**
 * Display final configuration summary
 */
function displaySummary(credInfo, dbInfo, testResult) {
  header('\nConfiguration Summary');

  console.log('\nCredentials:');
  if (credInfo) {
    info(`Method: ${credInfo.method}`);
    if (credInfo.path !== '(base64 encoded)') {
      info(`Path: ${credInfo.path}`);
    }
    const validation = validateServiceAccount(credInfo.credentials);
    if (validation.valid) {
      info(`Project ID: ${validation.projectId}`);
      info(`Service Account: ${validation.clientEmail}`);
    }
  } else {
    error('No credentials configured');
  }

  console.log('\nDatabase:');
  if (dbInfo) {
    info(`Method: ${dbInfo.method}`);
    info(`URL: ${dbInfo.url}`);
  } else {
    error('No database URL configured');
  }

  console.log('\nConnection:');
  if (testResult && testResult.success) {
    success('Status: CONNECTED');
    success('Storage Backend: Firebase Realtime Database');
  } else if (!credInfo || !dbInfo) {
    warning('Status: NOT CONFIGURED');
    warning('Storage Backend: Will fall back to file storage');
  } else {
    error('Status: ERROR');
    error('Storage Backend: Will fall back to file storage');
  }
}

/**
 * Main wizard function
 */
async function runWizard() {
  header('Firebase Setup Wizard');

  let hasErrors = false;
  let credInfo = null;
  let dbInfo = null;
  let testResult = null;

  // Step 1: Check for credentials
  console.log('\nChecking for credentials...');
  credInfo = loadCredentials();

  if (!credInfo) {
    error('No credentials found');
    console.log('\nYou need to configure Firebase credentials using one of:');
    console.log('1. Set GOOGLE_APPLICATION_CREDENTIALS to path of service-account.json');
    console.log('2. Place credentials at config/service-account.json');
    console.log('3. Set FIREBASE_SERVICE_ACCOUNT_BASE64 with base64-encoded credentials');
    console.log('\nSee: docs/FIREBASE_SETUP.md#step-3-download-service-account-credentials');
    hasErrors = true;
  } else {
    success(`Found credentials: ${credInfo.method}`);

    // Validate credentials structure
    const validation = validateServiceAccount(credInfo.credentials);
    if (!validation.valid) {
      error('Credentials file is missing required fields');
      error(`Missing: ${validation.missing.join(', ')}`);
      hasErrors = true;
    } else {
      success('Credentials file is valid JSON');
      success(`Required fields present: project_id, client_email, private_key`);
    }
  }

  // Step 2: Check for database URL
  console.log('\nChecking for database URL...');
  dbInfo = getDatabaseUrl();

  if (!dbInfo) {
    error('No database URL found');
    console.log('\nYou need to configure the database URL using:');
    console.log('1. Set FIREBASE_DATABASE_URL environment variable');
    console.log('2. Add to config/firebase-config.json');
    console.log('\nExample: https://your-project-id-default-rtdb.firebaseio.com');
    console.log('\nSee: docs/FIREBASE_SETUP.md#step-2-enable-firebase-services');
    hasErrors = true;
  } else {
    success(`Database URL configured: ${dbInfo.url}`);

    // Validate URL format
    if (!dbInfo.url.startsWith('https://') || !dbInfo.url.includes('firebaseio.com')) {
      warning('Database URL format looks unusual');
      warning('Expected format: https://PROJECT-ID-default-rtdb.firebaseio.com');
    }
  }

  // Step 3: Test connectivity (only if we have both credentials and URL)
  if (credInfo && dbInfo && !hasErrors) {
    console.log('\nTesting Firebase connectivity...');
    try {
      testResult = await testFirebaseConnection(credInfo.credentials, dbInfo.url);

      if (testResult.success) {
        success('Successfully connected to Firebase');
      } else {
        error('Failed to connect to Firebase');
        error(`Error: ${testResult.error}`);
        provideTroubleshooting(testResult.code, testResult.error);
        hasErrors = true;
      }
    } catch (err) {
      error('Failed to test Firebase connection');
      error(`Error: ${err.message}`);
      provideTroubleshooting(err.code, err.message);
      hasErrors = true;
    }
  }

  // Display summary
  displaySummary(credInfo, dbInfo, testResult);

  // Final status
  console.log('');
  if (!hasErrors && testResult && testResult.success) {
    log('\n' + CHECK_MARK + ' Your Firebase configuration is ready to use!', 'green');
    console.log('\nNext steps:');
    console.log('1. Start the MCP server: npm run mcp');
    console.log('2. Run tests: npm run test:firebase-backends');
    console.log('3. Read the docs: docs/FIREBASE_SETUP.md');
    return 0;
  } else {
    log('\n' + CROSS_MARK + ' Configuration incomplete or has errors', 'red');
    console.log('\nRefer to: docs/FIREBASE_SETUP.md for detailed setup instructions');
    return 1;
  }
}

// Run the wizard
if (require.main === module) {
  runWizard()
    .then(exitCode => process.exit(exitCode))
    .catch(err => {
      error(`Unexpected error: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runWizard };
