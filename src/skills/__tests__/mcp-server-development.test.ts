/**
 * Tests for MCP Server Development Skill
 *
 * Validates MCP (Model Context Protocol) server implementations for:
 * - Tool input schema validation
 * - Error handling in handlers
 * - Security vulnerabilities (command injection, path traversal)
 * - Server configuration completeness
 * - Stdio discipline (no console.log on stdout)
 * - JSON-RPC protocol compliance
 *
 * Based on: UPLIFTED_SKILLS.md - MCP Server Development
 */

import {
  MCPServerDevelopment,
  createMCPServerDevelopment,
  validateMCPServer,
  ToolDefinition,
  ToolValidationResult,
  SecurityAnalysisResult,
  ServerConfigValidation,
} from '../mcp-server-development';

describe('MCP Server Development', () => {
  let validator: MCPServerDevelopment;

  beforeEach(() => {
    validator = createMCPServerDevelopment();
  });

  describe('Tool Validation', () => {
    describe('FAIL - Tool with no input schema', () => {
      it('should fail when tool lacks input schema', () => {
        const tool: ToolDefinition = {
          name: 'calculateSum',
          description: 'Calculates sum of numbers',
          handler: async (params: any) => params.a + params.b,
        };

        const result = validator.validateToolDefinition(tool);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Tool missing input schema');
        expect(result.severity).toBe('critical');
      });

      it('should fail when input schema is empty object', () => {
        const tool: ToolDefinition = {
          name: 'processData',
          description: 'Process data',
          inputSchema: {},
          handler: async (params: any) => params,
        };

        const result = validator.validateToolDefinition(tool);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Input schema has no properties defined');
      });

      it('should fail when schema missing type definitions', () => {
        const tool: ToolDefinition = {
          name: 'validateEmail',
          inputSchema: {
            properties: {
              email: { description: 'Email address' },
            },
          },
          handler: async (params: any) => true,
        };

        const result = validator.validateToolDefinition(tool);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('missing type'))).toBe(true);
      });

      it('should fail when required fields not specified', () => {
        const tool: ToolDefinition = {
          name: 'createUser',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              email: { type: 'string' },
            },
          },
          handler: async (params: any) => params,
        };

        const result = validator.validateToolDefinition(tool);
        expect(result.warnings).toContain('No required fields specified - all inputs optional');
      });

      it('should fail when schema does not match JSON Schema spec', () => {
        const tool: ToolDefinition = {
          name: 'invalidTool',
          inputSchema: {
            properties: 'invalid', // Should be object
          },
          handler: async (params: any) => null,
        };

        const result = validator.validateToolDefinition(tool);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('Invalid JSON Schema'))).toBe(true);
      });
    });

    describe('FAIL - Handler without error handling', () => {
      it('should fail when async handler has no try-catch', () => {
        const code = `
async function handler(params) {
  const result = await fetch(params.url);
  return result.json();
}`;

        const result = validator.validateHandlerErrorHandling(code);
        expect(result.hasErrorHandling).toBe(false);
        expect(result.issues).toContain('Async handler without try-catch block');
        expect(result.severity).toBe('critical');
      });

      it('should fail when handler does not return error object', () => {
        const code = `
async function handler(params) {
  try {
    return await riskyOperation(params);
  } catch (error) {
    throw error; // Should return error object instead
  }
}`;

        const result = validator.validateHandlerErrorHandling(code);
        expect(result.issues).toContain('Handler throws exception instead of returning error object');
        expect(result.severity).toBe('high');
      });

      it('should fail when error object missing isError flag', () => {
        const code = `
async function handler(params) {
  try {
    return await operation(params);
  } catch (error) {
    return { message: error.message }; // Missing isError: true
  }
}`;

        const result = validator.validateHandlerErrorHandling(code);
        expect(result.issues.some(i => i.includes('isError'))).toBe(true);
      });

      it('should fail when handler has empty catch block', () => {
        const code = `
async function handler(params) {
  try {
    return await process(params);
  } catch (error) {
    // Empty catch - swallows errors
  }
}`;

        const result = validator.validateHandlerErrorHandling(code);
        expect(result.issues).toContain('Empty catch block - errors silently swallowed');
        expect(result.severity).toBe('critical');
      });

      it('should fail when input validation missing', () => {
        const code = `
async function handler(params) {
  // No validation of params
  try {
    return await process(params.requiredField);
  } catch (error) {
    return { isError: true, message: error.message };
  }
}`;

        const result = validator.validateHandlerErrorHandling(code);
        expect(result.warnings).toContain('No input validation detected');
      });
    });

    describe('PASS - Complete tool definition with validation', () => {
      it('should pass for tool with complete schema and error handling', () => {
        const tool: ToolDefinition = {
          name: 'searchDatabase',
          description: 'Search database with query',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              limit: { type: 'number', description: 'Result limit' },
            },
            required: ['query'],
          },
          handler: async (params: any) => {
            try {
              if (!params.query) {
                return { isError: true, message: 'Query required' };
              }
              return { results: [] };
            } catch (error) {
              return { isError: true, message: error.message };
            }
          },
        };

        const result = validator.validateToolDefinition(tool);
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should pass for tool with proper type constraints', () => {
        const tool: ToolDefinition = {
          name: 'processNumbers',
          inputSchema: {
            type: 'object',
            properties: {
              values: {
                type: 'array',
                items: { type: 'number' },
                minItems: 1,
                maxItems: 100,
              },
              operation: {
                type: 'string',
                enum: ['sum', 'average', 'max', 'min'],
              },
            },
            required: ['values', 'operation'],
          },
          handler: async (params: any) => ({ result: 0 }),
        };

        const result = validator.validateToolDefinition(tool);
        expect(result.isValid).toBe(true);
        expect(result.quality).toBe('excellent');
      });

      it('should pass for tool with comprehensive error handling', () => {
        const code = `
async function handler(params) {
  // Input validation
  if (!params || !params.filePath) {
    return { isError: true, message: 'filePath required' };
  }

  try {
    const data = await readFile(params.filePath);
    return { content: data };
  } catch (error) {
    // Structured error response
    return {
      isError: true,
      message: error.message,
      code: error.code,
      retryable: error.code === 'EBUSY',
    };
  }
}`;

        const result = validator.validateHandlerErrorHandling(code);
        expect(result.hasErrorHandling).toBe(true);
        expect(result.hasInputValidation).toBe(true);
        expect(result.hasStructuredErrors).toBe(true);
        expect(result.quality).toBe('excellent');
      });
    });
  });

  describe('Security Analysis', () => {
    describe('FAIL - Command injection vulnerability detected', () => {
      it('should fail when using shell execution with user input', () => {
        const code = `
async function handler(params) {
  const { exec } = require('child_process');
  exec(\`ls \${params.directory}\`, (error, stdout) => {
    return stdout;
  });
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(false);
        expect(result.vulnerabilities).toContainEqual({
          type: 'command-injection',
          severity: 'critical',
          description: expect.stringContaining('shell execution with user input'),
        });
      });

      it('should fail when using eval with parameters', () => {
        const code = `
function handler(params) {
  return eval(params.expression);
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(false);
        expect(result.vulnerabilities.some(v => v.type === 'code-injection')).toBe(true);
      });

      it('should fail when constructing shell commands from input', () => {
        const code = `
async function handler(params) {
  const command = 'git clone ' + params.repoUrl;
  await execSync(command);
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(false);
        expect(result.vulnerabilities.some(v => v.severity === 'critical')).toBe(true);
      });

      it('should fail when using template literals with unsanitized input in commands', () => {
        const code = `
function runScript(params) {
  exec(\`node scripts/\${params.scriptName}.js\`);
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.vulnerabilities.some(v => v.type === 'command-injection')).toBe(true);
      });
    });

    describe('FAIL - Path traversal in file operations', () => {
      it('should fail when file paths not validated', () => {
        const code = `
async function handler(params) {
  const content = await fs.readFile(params.filePath);
  return { content };
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(false);
        expect(result.vulnerabilities).toContainEqual({
          type: 'path-traversal',
          severity: 'high',
          description: expect.stringContaining('unvalidated file path'),
        });
      });

      it('should fail when allowing parent directory references', () => {
        const code = `
function handler(params) {
  // Vulnerable to ../../../etc/passwd
  return fs.readFileSync('./data/' + params.filename);
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.vulnerabilities.some(v => v.type === 'path-traversal')).toBe(true);
      });

      it('should fail when path.join used without validation', () => {
        const code = `
const path = require('path');
function handler(params) {
  const filePath = path.join('/var/data', params.userPath);
  return readFile(filePath);
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.warnings).toContain('path.join does not prevent traversal - validate result');
      });

      it('should fail when user input used in write operations', () => {
        const code = `
async function handler(params) {
  await fs.writeFile(params.outputPath, params.content);
  return { success: true };
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(false);
        expect(result.vulnerabilities.some(v => v.severity === 'critical')).toBe(true);
      });
    });

    describe('PASS - Properly sanitized inputs', () => {
      it('should pass when using allowlist validation for paths', () => {
        const code = `
const path = require('path');
async function handler(params) {
  const allowedDir = '/var/app/data';
  const resolvedPath = path.resolve(allowedDir, params.filename);

  if (!resolvedPath.startsWith(allowedDir)) {
    return { isError: true, message: 'Invalid path' };
  }

  return await fs.readFile(resolvedPath);
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(true);
        expect(result.securityMeasures).toContain('Path traversal prevention');
      });

      it('should pass when using parameterized commands', () => {
        const code = `
const { spawn } = require('child_process');
async function handler(params) {
  // Using spawn with array (no shell) prevents injection
  const process = spawn('ls', ['-la', params.directory], {
    shell: false,
  });
  return { output: await getOutput(process) };
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(true);
        expect(result.securityMeasures).toContain('Parameterized command execution');
      });

      it('should pass when validating against enum of allowed values', () => {
        const code = `
const ALLOWED_OPERATIONS = ['read', 'write', 'delete'];
async function handler(params) {
  if (!ALLOWED_OPERATIONS.includes(params.operation)) {
    return { isError: true, message: 'Invalid operation' };
  }
  return performOperation(params.operation);
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(true);
        expect(result.securityMeasures).toContain('Allowlist validation');
      });

      it('should pass when sanitizing filename input', () => {
        const code = `
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '');
}

async function handler(params) {
  const safeFilename = sanitizeFilename(params.filename);
  const basePath = '/data/uploads';
  const fullPath = path.join(basePath, safeFilename);

  if (!fullPath.startsWith(basePath)) {
    return { isError: true, message: 'Invalid path' };
  }

  return await processFile(fullPath);
}`;

        const result = validator.analyzeSecurityVulnerabilities(code);
        expect(result.isSecure).toBe(true);
        expect(result.quality).toBe('excellent');
      });
    });
  });

  describe('Server Configuration Validation', () => {
    describe('FAIL - Missing required fields', () => {
      it('should fail when server config missing name', () => {
        const config = {
          version: '1.0.0',
          tools: [],
        };

        const result = validator.validateServerConfig(config);
        expect(result.isValid).toBe(false);
        expect(result.missingFields).toContain('name');
        expect(result.severity).toBe('critical');
      });

      it('should fail when server config missing version', () => {
        const config = {
          name: 'my-mcp-server',
          tools: [],
        };

        const result = validator.validateServerConfig(config);
        expect(result.isValid).toBe(false);
        expect(result.missingFields).toContain('version');
      });

      it('should fail when tools array is empty', () => {
        const config = {
          name: 'my-server',
          version: '1.0.0',
          tools: [],
        };

        const result = validator.validateServerConfig(config);
        expect(result.warnings).toContain('No tools defined - server will have no functionality');
      });

      it('should fail when stdio configuration incorrect', () => {
        const config = {
          name: 'my-server',
          version: '1.0.0',
          tools: [{ name: 'test' }],
          transport: 'http', // Should be 'stdio' for MCP
        };

        const result = validator.validateServerConfig(config);
        expect(result.issues).toContain('MCP requires stdio transport');
      });

      it('should fail when error handling strategy not defined', () => {
        const config = {
          name: 'my-server',
          version: '1.0.0',
          tools: [{ name: 'test' }],
        };

        const result = validator.validateServerConfig(config);
        expect(result.warnings).toContain('No error handling strategy defined');
      });
    });

    describe('PASS - Complete valid configuration', () => {
      it('should pass for complete server configuration', () => {
        const config = {
          name: 'filesystem-mcp-server',
          version: '1.0.0',
          description: 'MCP server for file operations',
          transport: 'stdio',
          tools: [
            {
              name: 'readFile',
              description: 'Read file contents',
              inputSchema: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                },
                required: ['path'],
              },
            },
          ],
          resources: [],
          errorHandling: {
            strategy: 'structured',
            includeStackTrace: false,
          },
          logging: {
            level: 'info',
            output: 'stderr',
          },
        };

        const result = validator.validateServerConfig(config);
        expect(result.isValid).toBe(true);
        expect(result.quality).toBe('excellent');
        expect(result.issues).toHaveLength(0);
      });

      it('should pass when logging configured to stderr only', () => {
        const config = {
          name: 'test-server',
          version: '1.0.0',
          tools: [{ name: 'test' }],
          logging: {
            output: 'stderr',
            level: 'debug',
          },
        };

        const result = validator.validateServerConfig(config);
        expect(result.isValid).toBe(true);
        expect(result.securityMeasures).toContain('Logging directed to stderr (stdio safe)');
      });

      it('should pass for server with resources and tools', () => {
        const config = {
          name: 'data-server',
          version: '2.0.0',
          transport: 'stdio',
          tools: [{ name: 'query' }],
          resources: [
            {
              uri: 'data://tables',
              name: 'Database Tables',
              mimeType: 'application/json',
            },
          ],
        };

        const result = validator.validateServerConfig(config);
        expect(result.isValid).toBe(true);
      });

      it('should pass for minimal valid configuration', () => {
        const config = {
          name: 'minimal-server',
          version: '1.0.0',
          tools: [
            {
              name: 'ping',
              inputSchema: { type: 'object', properties: {} },
            },
          ],
        };

        const result = validator.validateServerConfig(config);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Stdio Discipline Validation', () => {
    it('should fail when console.log detected in code', () => {
      const code = `
function handler(params) {
  console.log('Processing request:', params);
  return process(params);
}`;

      const result = validator.validateStdioDiscipline(code);
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('console.log detected - corrupts stdio protocol');
      expect(result.severity).toBe('critical');
    });

    it('should fail when stdout used directly', () => {
      const code = `
process.stdout.write('Status update\\n');
`;

      const result = validator.validateStdioDiscipline(code);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.includes('stdout'))).toBe(true);
    });

    it('should pass when only console.error used', () => {
      const code = `
function handler(params) {
  console.error('Error occurred:', params);
  return { isError: true };
}`;

      const result = validator.validateStdioDiscipline(code);
      expect(result.isValid).toBe(true);
    });

    it('should pass when stderr used for logging', () => {
      const code = `
process.stderr.write('Debug info\\n');
`;

      const result = validator.validateStdioDiscipline(code);
      expect(result.isValid).toBe(true);
    });

    it('should warn about commented console.log', () => {
      const code = `
// console.log('debug');
function handler(params) {
  return params;
}`;

      const result = validator.validateStdioDiscipline(code);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Commented console.log found - ensure removed before production');
    });
  });

  describe('Real-world MCP Server Scenarios', () => {
    it('should validate complete file-system MCP server', () => {
      const server = {
        config: {
          name: 'fs-server',
          version: '1.0.0',
          transport: 'stdio',
          tools: [
            {
              name: 'readFile',
              inputSchema: {
                type: 'object',
                properties: { path: { type: 'string' } },
                required: ['path'],
              },
            },
          ],
          logging: { output: 'stderr' },
        },
        code: `
const fs = require('fs').promises;
const path = require('path');

async function readFileHandler(params) {
  const basePath = '/allowed/directory';
  const fullPath = path.resolve(basePath, params.path);

  if (!fullPath.startsWith(basePath)) {
    return { isError: true, message: 'Path outside allowed directory' };
  }

  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return { content };
  } catch (error) {
    return {
      isError: true,
      message: error.message,
      code: error.code,
    };
  }
}`,
      };

      const configResult = validator.validateServerConfig(server.config);
      const securityResult = validator.analyzeSecurityVulnerabilities(server.code);
      const studioResult = validator.validateStdioDiscipline(server.code);
      const errorResult = validator.validateHandlerErrorHandling(server.code);

      expect(configResult.isValid).toBe(true);
      expect(securityResult.isSecure).toBe(true);
      expect(studioResult.isValid).toBe(true);
      expect(errorResult.hasErrorHandling).toBe(true);
    });

    it('should catch common MCP development mistakes', () => {
      const badServer = `
// Common mistakes in MCP server
console.log('Server starting...'); // VIOLATION: stdout corruption

async function toolHandler(params) {
  // No input validation
  const result = await exec(\`cat \${params.filename}\`); // VIOLATION: command injection
  console.log('Result:', result); // VIOLATION: stdout corruption
  return result; // VIOLATION: no error wrapping
}`;

      const studioResult = validator.validateStdioDiscipline(badServer);
      const securityResult = validator.analyzeSecurityVulnerabilities(badServer);
      const errorResult = validator.validateHandlerErrorHandling(badServer);

      expect(studioResult.violations.length).toBeGreaterThan(0);
      expect(securityResult.vulnerabilities.length).toBeGreaterThan(0);
      expect(errorResult.hasErrorHandling).toBe(false);
    });
  });

  describe('Factory and convenience functions', () => {
    it('should create validator via factory', () => {
      const validator = createMCPServerDevelopment();
      expect(validator).toBeInstanceOf(MCPServerDevelopment);
    });

    it('should provide convenience validation function', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        tools: [],
      };
      const result = validateMCPServer(config, '');
      expect(result).toBeDefined();
      expect(result.configValidation).toBeDefined();
    });
  });
});
