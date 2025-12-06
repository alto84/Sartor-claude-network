"use strict";
/**
 * MCP Server Development Skill - Usage Examples
 *
 * Demonstrates how to use the MCP Server Development skill to validate
 * and build MCP servers with proper patterns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.example1_ValidateToolDefinition = example1_ValidateToolDefinition;
exports.example2_DetectMistakes = example2_DetectMistakes;
exports.example3_SecurityAnalysis = example3_SecurityAnalysis;
exports.example4_GenerateHandler = example4_GenerateHandler;
exports.example5_TestHandler = example5_TestHandler;
exports.example6_ValidateServerConfig = example6_ValidateServerConfig;
exports.runAllExamples = runAllExamples;
const mcp_server_development_1 = require("./mcp-server-development");
// ============================================================================
// Example 1: Validate a Tool Definition
// ============================================================================
async function example1_ValidateToolDefinition() {
    console.log('\n=== Example 1: Validate Tool Definition ===\n');
    // Define a tool (with proper naming and schema)
    const goodTool = {
        name: 'read_file',
        description: 'Read the contents of a file from the filesystem',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Absolute path to the file to read',
                    minLength: 1,
                },
            },
            required: ['path'],
        },
        handler: async (input) => {
            // Proper error handling with try-catch
            try {
                // Validate input
                const validation = (0, mcp_server_development_1.validateInput)(input, {
                    type: 'object',
                    properties: { path: { type: 'string' } },
                    required: ['path'],
                });
                if (!validation.valid) {
                    return (0, mcp_server_development_1.createErrorResponse)(-32602, `Invalid input: ${validation.errors.join(', ')}`);
                }
                // Tool logic here (using console.error for logging, not console.log)
                console.error('[read_file] Reading file:', input.path);
                return {
                    content: [{
                            type: 'text',
                            text: 'File contents here...',
                        }],
                };
            }
            catch (error) {
                console.error('[read_file] Error:', error);
                return (0, mcp_server_development_1.createErrorResponse)(-32603, error instanceof Error ? error.message : 'Unknown error');
            }
        },
    };
    // Validate the tool
    const report = (0, mcp_server_development_1.validateToolDefinition)(goodTool);
    console.log('Validation Report:');
    console.log('  Valid:', report.valid);
    console.log('  Score:', report.score);
    console.log('  Errors:', report.errors.length);
    console.log('  Warnings:', report.warnings.length);
    console.log('  Suggestions:', report.suggestions);
}
// ============================================================================
// Example 2: Detect Common Mistakes
// ============================================================================
async function example2_DetectMistakes() {
    console.log('\n=== Example 2: Detect Common Mistakes ===\n');
    // Tool with mistakes (camelCase name, no description, missing schema details)
    const badTool = {
        name: 'readFile', // Should be snake_case
        description: 'Read', // Too short
        inputSchema: {
            type: 'object',
            // Missing properties
        },
        handler: async (_input) => ({ content: [] }),
    };
    const report = (0, mcp_server_development_1.validateToolDefinition)(badTool);
    console.log('Validation Report for Bad Tool:');
    console.log('  Valid:', report.valid);
    console.log('  Errors:');
    report.errors.forEach(err => {
        console.log(`    - [${err.severity}] ${err.message}`);
        console.log(`      Suggestion: ${err.suggestion}`);
    });
}
// ============================================================================
// Example 3: Security Analysis
// ============================================================================
async function example3_SecurityAnalysis() {
    console.log('\n=== Example 3: Security Analysis ===\n');
    // Handler code with security issues
    const dangerousHandlerCode = `
    async function handler(input: any) {
      // BAD: console.log corrupts stdio
      console.log('Processing:', input);

      // BAD: Command injection vulnerability
      const result = exec(input.command);

      // BAD: Path traversal vulnerability
      const filePath = path.join('/data', input.path);

      return { content: [{ type: 'text', text: result }] };
    }
  `;
    const securityReport = (0, mcp_server_development_1.analyzeInputValidation)(dangerousHandlerCode);
    console.log('Security Report:');
    console.log('  Safe:', securityReport.safe);
    console.log('  Risk Score:', securityReport.riskScore);
    console.log('\n  Vulnerabilities:');
    securityReport.vulnerabilities.forEach(vuln => {
        console.log(`    - [${vuln.severity}] ${vuln.type}`);
        console.log(`      ${vuln.description}`);
        console.log(`      Remediation: ${vuln.remediation}`);
    });
    console.log('\n  Recommendations:');
    securityReport.recommendations.forEach(rec => {
        console.log(`    - ${rec}`);
    });
}
// ============================================================================
// Example 4: Generate Handler Code
// ============================================================================
async function example4_GenerateHandler() {
    console.log('\n=== Example 4: Generate Handler Code ===\n');
    const schema = {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query string',
            },
            limit: {
                type: 'number',
                description: 'Maximum number of results',
            },
            includeArchived: {
                type: 'boolean',
                description: 'Include archived items in results',
            },
        },
        required: ['query'],
    };
    const generatedCode = (0, mcp_server_development_1.generateToolHandler)(schema, 'search_items');
    console.log('Generated Handler Code:');
    console.log(generatedCode);
}
// ============================================================================
// Example 5: Test Tool Handler
// ============================================================================
async function example5_TestHandler() {
    console.log('\n=== Example 5: Test Tool Handler ===\n');
    // Define a simple tool
    const tool = {
        name: 'add_numbers',
        description: 'Add two numbers together',
        inputSchema: {
            type: 'object',
            properties: {
                a: { type: 'number', description: 'First number' },
                b: { type: 'number', description: 'Second number' },
            },
            required: ['a', 'b'],
        },
        handler: async (input) => {
            try {
                const validation = (0, mcp_server_development_1.validateInput)(input, {
                    type: 'object',
                    properties: {
                        a: { type: 'number' },
                        b: { type: 'number' },
                    },
                    required: ['a', 'b'],
                });
                if (!validation.valid) {
                    return {
                        content: [{ type: 'text', text: validation.errors.join(', ') }],
                        isError: true,
                    };
                }
                const sum = input.a + input.b;
                return {
                    content: [{
                            type: 'text',
                            text: `Result: ${sum}`,
                        }],
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: error instanceof Error ? error.message : 'Unknown error',
                        }],
                    isError: true,
                };
            }
        },
    };
    // Define test cases
    const testCases = [
        {
            name: 'Valid addition',
            input: { a: 5, b: 3 },
        },
        {
            name: 'Invalid input - missing field',
            input: { a: 5 },
            shouldFail: true,
        },
        {
            name: 'Invalid input - wrong type',
            input: { a: 'five', b: 3 },
            shouldFail: true,
        },
        {
            name: 'Edge case - zero',
            input: { a: 0, b: 0 },
        },
        {
            name: 'Edge case - negative numbers',
            input: { a: -5, b: 3 },
        },
    ];
    // Run tests
    const testReport = await (0, mcp_server_development_1.testToolHandler)(tool, testCases);
    console.log('Test Report:');
    console.log('  Total Tests:', testReport.totalTests);
    console.log('  Passed:', testReport.passed);
    console.log('  Failed:', testReport.failed);
    console.log('\n  Coverage:');
    console.log('    Input Validation:', testReport.coverage.inputValidation);
    console.log('    Error Handling:', testReport.coverage.errorHandling);
    console.log('    Edge Cases:', testReport.coverage.edgeCases);
    console.log('\n  Results:');
    testReport.results.forEach(result => {
        console.log(`    ${result.passed ? '✓' : '✗'} ${result.testName} (${result.executionTimeMs}ms)`);
        if (!result.passed && result.error) {
            console.log(`      Error: ${result.error.message}`);
        }
    });
}
// ============================================================================
// Example 6: Validate Complete Server Config
// ============================================================================
async function example6_ValidateServerConfig() {
    console.log('\n=== Example 6: Validate Server Config ===\n');
    const serverConfig = {
        name: 'filesystem-server',
        version: '1.0.0',
        tools: [
            {
                name: 'read_file',
                description: 'Read the contents of a file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'File path' },
                    },
                    required: ['path'],
                },
                handler: async (input) => ({
                    content: [{ type: 'text', text: 'File contents' }],
                }),
            },
            {
                name: 'write_file',
                description: 'Write content to a file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'File path' },
                        content: { type: 'string', description: 'Content to write' },
                    },
                    required: ['path', 'content'],
                },
                handler: async (input) => ({
                    content: [{ type: 'text', text: 'File written successfully' }],
                }),
            },
        ],
        resources: [
            {
                uri: 'file:///workspace',
                name: 'Workspace Files',
                description: 'Access to workspace files',
                mimeType: 'application/octet-stream',
            },
        ],
    };
    const validator = new mcp_server_development_1.MCPServerValidator();
    const report = validator.validateServerConfig(serverConfig);
    console.log('Server Validation Report:');
    console.log('  Valid:', report.valid);
    console.log('  Score:', report.score.toFixed(2));
    console.log('  Errors:', report.errors.length);
    console.log('  Warnings:', report.warnings.length);
    if (report.errors.length > 0) {
        console.log('\n  Errors:');
        report.errors.forEach(err => {
            console.log(`    - [${err.severity}] ${err.category}: ${err.message}`);
        });
    }
    if (report.warnings.length > 0) {
        console.log('\n  Warnings:');
        report.warnings.forEach(warn => {
            console.log(`    - ${warn.category}: ${warn.message}`);
        });
    }
    if (report.suggestions.length > 0) {
        console.log('\n  Suggestions:');
        report.suggestions.forEach(suggestion => {
            console.log(`    - ${suggestion}`);
        });
    }
}
// ============================================================================
// Run All Examples
// ============================================================================
async function runAllExamples() {
    await example1_ValidateToolDefinition();
    await example2_DetectMistakes();
    await example3_SecurityAnalysis();
    await example4_GenerateHandler();
    await example5_TestHandler();
    await example6_ValidateServerConfig();
}
// Run if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
//# sourceMappingURL=mcp-server-development.example.js.map