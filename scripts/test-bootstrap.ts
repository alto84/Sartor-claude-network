/**
 * Bootstrap Mesh Test Script
 *
 * Tests:
 * 1. Local file reading
 * 2. MCP HTTP connection (if server running)
 * 3. GitHub cold tier (if credentials exist)
 * 4. Firebase (if credentials exist)
 * 5. Full bootstrap mesh with fallback
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileStore } from '../src/mcp/file-store';
import { GitHubColdTier } from '../src/memory/cold-tier';
import { MultiTierStore } from '../src/mcp/multi-tier-store';
import { initializeFirebase, getDatabase } from '../src/mcp/firebase-init';

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

function success(msg: string): void {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function failure(msg: string): void {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg: string): void {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function section(title: string): void {
  console.log(`\n${colors.bright}${colors.blue}${title}${colors.reset}`);
}

interface TestResults {
  localFile: boolean;
  mcpHttp: boolean;
  github: boolean;
  firebase: boolean;
  bootstrap: boolean;
  memoriesCount: number;
  primaryBackend: string;
}

async function testLocalFile(): Promise<boolean> {
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    const dataFile = path.join(dataDir, 'memories.json');

    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      info('Data directory does not exist, creating...');
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Try to read or create the file
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      const parsed = JSON.parse(content);
      success(`Local file exists and is readable (${Object.keys(parsed.memories || {}).length} memories)`);
    } else {
      info('Local file does not exist, creating...');
      const store = new FileStore();
      success('Local file created successfully');
    }

    return true;
  } catch (error) {
    failure(`Local file test failed: ${error}`);
    return false;
  }
}

async function testMcpHttp(): Promise<boolean> {
  try {
    const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;
    const url = `http://localhost:${MCP_PORT}/mcp`;

    // Create timeout helper
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
    );

    // Try to initialize a session with timeout
    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-bootstrap', version: '1.0.0' },
          },
        }),
      }),
      timeout,
    ]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const sessionId = response.headers.get('mcp-session-id');
    if (!sessionId) {
      throw new Error('No session ID returned');
    }

    // Try to call memory_stats
    const statsTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
    );

    const statsResponse = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'memory_stats',
            arguments: {},
          },
        }),
      }),
      statsTimeout,
    ]);

    if (!statsResponse.ok) {
      throw new Error(`Stats call failed: HTTP ${statsResponse.status}`);
    }

    const statsData: any = await statsResponse.json();
    const statsText = statsData.result?.content?.[0]?.text;
    if (statsText) {
      const stats = JSON.parse(statsText);
      success(`MCP HTTP server is running (${stats.total} memories)`);
    } else {
      success('MCP HTTP server is running');
    }

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Timeout') || errorMsg.includes('fetch failed')) {
      failure('MCP HTTP test failed: Server not responding');
      info('Make sure to run: npm run mcp:http');
    } else {
      failure(`MCP HTTP test failed: ${errorMsg}`);
      info('Make sure to run: npm run mcp:http');
    }
    return false;
  }
}

async function testGitHub(): Promise<boolean> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      info('GitHub credentials not configured (set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)');
      return false;
    }

    const github = new GitHubColdTier(token, owner, repo, 'memories');

    // Try to list memories in a directory with timeout
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
    );

    const files = await Promise.race([github.list('episodic'), timeout]);
    success(`GitHub cold tier is accessible (${files.length} episodic memories)`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Timeout')) {
      failure('GitHub test failed: Request timed out');
      info('Check your internet connection and GitHub API access');
    } else {
      failure(`GitHub test failed: ${errorMsg}`);
      info('Check your GitHub credentials and repository access');
    }
    return false;
  }
}

async function testFirebase(): Promise<boolean> {
  try {
    const hasCredentials =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
      fs.existsSync(path.join(process.cwd(), 'config', 'service-account.json'));

    const hasDatabaseUrl =
      process.env.FIREBASE_DATABASE_URL ||
      fs.existsSync(path.join(process.cwd(), 'config', 'firebase-config.json'));

    if (!hasCredentials) {
      info('Firebase credentials not configured');
      info('Set one of: GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_SERVICE_ACCOUNT_BASE64, or config/service-account.json');
      return false;
    }

    if (!hasDatabaseUrl) {
      info('Firebase database URL not configured');
      info('Set FIREBASE_DATABASE_URL or configure in config/firebase-config.json');
      return false;
    }

    const initialized = initializeFirebase();
    if (!initialized) {
      failure('Firebase initialization failed');
      return false;
    }

    const db = getDatabase();
    if (!db) {
      failure('Firebase database not available');
      return false;
    }

    // Try to read from a test path with timeout
    const testRef = db.ref('mcp-memories');
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
    );

    const snapshot = await Promise.race([testRef.get(), timeout]);
    const count = snapshot.exists() ? snapshot.numChildren() : 0;

    success(`Firebase is connected (${count} memories in hot tier)`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Timeout') || errorMsg.includes('EAI_AGAIN')) {
      failure('Firebase test failed: Network connectivity issue');
      info('Check your internet connection and Firebase credentials');
    } else {
      failure(`Firebase test failed: ${errorMsg}`);
    }
    return false;
  }
}

async function testBootstrapMesh(): Promise<{ success: boolean; backend: string; count: number }> {
  try {
    // Create a MultiTierStore instance - it will auto-detect available backends
    const store = new MultiTierStore();

    // Get backend status
    const backends = store.getBackendStatus();
    const availableBackends = Object.entries(backends)
      .filter(([_, enabled]) => enabled)
      .map(([name, _]) => name);

    if (availableBackends.length === 0) {
      failure('No backends available');
      return { success: false, backend: 'none', count: 0 };
    }

    // Determine primary backend
    let primaryBackend = 'file';
    if (backends.firebase) {
      primaryBackend = 'firebase (hot tier)';
    } else if (backends.github) {
      primaryBackend = 'github (cold tier)';
    }

    // Try to get stats with timeout
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
    );

    const stats = await Promise.race([store.getStats(), timeout]);

    success(`Bootstrap mesh is operational`);
    info(`Available backends: ${availableBackends.join(', ')}`);
    info(`Primary backend: ${primaryBackend}`);
    info(`Total memories accessible: ${stats.total}`);
    info(`By tier: hot=${stats.by_tier.hot}, warm=${stats.by_tier.warm}, cold=${stats.by_tier.cold}`);

    return { success: true, backend: primaryBackend, count: stats.total };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Timeout')) {
      failure('Bootstrap mesh test failed: Operation timed out');
      info('One or more backends are not responding (likely network issue)');
    } else {
      failure(`Bootstrap mesh test failed: ${errorMsg}`);
    }
    return { success: false, backend: 'none', count: 0 };
  }
}

async function main() {
  console.log(`${colors.bright}${colors.blue}=== Bootstrap Mesh Test ===${colors.reset}\n`);

  const results: TestResults = {
    localFile: false,
    mcpHttp: false,
    github: false,
    firebase: false,
    bootstrap: false,
    memoriesCount: 0,
    primaryBackend: 'none',
  };

  // Test 1: Local file
  section('1. Testing local file...');
  results.localFile = await testLocalFile();

  // Test 2: MCP HTTP
  section('2. Testing MCP HTTP...');
  results.mcpHttp = await testMcpHttp();

  // Test 3: GitHub
  section('3. Testing GitHub cold tier...');
  results.github = await testGitHub();

  // Test 4: Firebase
  section('4. Testing Firebase...');
  results.firebase = await testFirebase();

  // Test 5: Bootstrap mesh integration
  section('5. Testing bootstrap mesh...');
  const bootstrapResult = await testBootstrapMesh();
  results.bootstrap = bootstrapResult.success;
  results.primaryBackend = bootstrapResult.backend;
  results.memoriesCount = bootstrapResult.count;

  // Summary
  section('=== Summary ===');
  console.log();

  const backends = [];
  if (results.firebase) backends.push('Firebase (hot tier)');
  if (results.localFile) backends.push('File storage (warm tier)');
  if (results.github) backends.push('GitHub (cold tier)');

  if (backends.length === 0) {
    console.log(`${colors.red}${colors.bright}⚠ No backends are operational!${colors.reset}`);
    console.log(`${colors.yellow}At minimum, file storage should work. Check permissions.${colors.reset}`);
  } else {
    console.log(`${colors.green}${colors.bright}✓ ${backends.length} backend(s) available${colors.reset}`);
    backends.forEach(b => console.log(`  • ${b}`));
  }

  console.log();
  console.log(`${colors.cyan}Primary backend:${colors.reset} ${results.primaryBackend}`);
  console.log(`${colors.cyan}Total memories:${colors.reset} ${results.memoriesCount}`);
  console.log(`${colors.cyan}MCP HTTP server:${colors.reset} ${results.mcpHttp ? `${colors.green}running${colors.reset}` : `${colors.yellow}not running${colors.reset}`}`);

  console.log();

  // Recommendations
  if (!results.firebase && !results.github) {
    console.log(`${colors.yellow}Recommendations:${colors.reset}`);
    console.log('  • Configure Firebase for hot tier storage (<100ms)');
    console.log('  • Configure GitHub for cold tier archival (1-5s)');
    console.log('  • See CLAUDE.md for configuration instructions');
  }

  if (!results.mcpHttp) {
    console.log(`${colors.yellow}Note:${colors.reset} MCP HTTP server not running. Start with: npm run mcp:http`);
  }

  console.log();

  // Exit code based on whether at least file storage works
  process.exit(results.localFile ? 0 : 1);
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
