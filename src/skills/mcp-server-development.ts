/**
 * MCP Server Development Skill
 *
 * Build Model Context Protocol servers with proper patterns, error handling,
 * and protocol compliance. Validates servers against MCP quality standards.
 *
 * Based on principles from UPLIFTED_SKILLS.md:
 * - Stdio Discipline is Non-Negotiable
 * - Input Validation Prevents Cascade
 * - Error Handling is User Experience
 * - Testing Strategy Matches Risk
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * JSON Schema definition for tool inputs/outputs
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: JSONSchema;
  enum?: any[];
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  description?: string;
  [key: string]: any;
}

/**
 * Tool handler function signature
 */
export type ToolHandler = (input: any) => Promise<ToolResult>;

/**
 * Tool execution result
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
  _meta?: Record<string, any>;
}

/**
 * MCP Tool Definition
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  handler: ToolHandler;
}

/**
 * MCP Resource Definition
 */
export interface MCPResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP Prompt Definition
 */
export interface MCPPromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  tools: MCPToolDefinition[];
  resources?: MCPResourceDefinition[];
  prompts?: MCPPromptDefinition[];
}

/**
 * Validation error
 */
export interface ValidationError {
  type: 'error' | 'warning';
  category: 'stdio' | 'schema' | 'security' | 'error-handling' | 'naming' | 'protocol';
  message: string;
  location?: string;
  suggestion: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  category: 'best-practice' | 'performance' | 'maintainability';
  message: string;
  location?: string;
  suggestion: string;
}

/**
 * Validation report
 */
export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  score: number; // 0-1, based on checks passed
}

/**
 * Test case for tool testing
 */
export interface TestCase {
  name: string;
  input: any;
  expectedOutput?: ToolResult;
  shouldFail?: boolean;
  expectedError?: string;
}

/**
 * Test result
 */
export interface TestResult {
  passed: boolean;
  testName: string;
  actualOutput?: ToolResult;
  error?: Error;
  executionTimeMs: number;
}

/**
 * Test report
 */
export interface TestReport {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  coverage: {
    inputValidation: boolean;
    errorHandling: boolean;
    edgeCases: boolean;
  };
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  type: 'command-injection' | 'path-traversal' | 'unsafe-eval' | 'env-leak' | 'sql-injection';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  remediation: string;
  cwe?: string;
}

/**
 * Security analysis report
 */
export interface SecurityReport {
  safe: boolean;
  vulnerabilities: SecurityVulnerability[];
  riskScore: number; // 0-1, higher = more risky
  recommendations: string[];
}

// ============================================================================
// Validation Patterns
// ============================================================================

/**
 * Patterns that violate stdio discipline
 */
const STDIO_VIOLATIONS = {
  // console.log corrupts stdout
  consoleLog: /console\.log\(/g,

  // Direct stdout writes (should only be JSON-RPC)
  processStdoutWrite: /process\.stdout\.write\(/g,

  // Print statements
  print: /\bprint\(/g,
};

/**
 * Security vulnerability patterns
 */
const SECURITY_PATTERNS = {
  // Command injection risks
  commandInjection: [/exec\(/g, /execSync\(/g, /spawn\(/g, /child_process/g],

  // Path traversal risks
  pathTraversal: [
    /\.\.[/\\]/g, // ../ or ..\
    /path\.join\([^)]*\$\{\}/g, // path.join with template literals
  ],

  // Unsafe evaluation
  unsafeEval: [/\beval\(/g, /Function\(/g, /new Function/g],

  // Environment variable leaks
  envLeak: [/process\.env/g],

  // SQL injection (if using SQL)
  sqlInjection: [
    /query\([^)]*\$\{\}/g, // SQL with template literals
    /execute\([^)]*\+/g, // String concatenation in SQL
  ],
};

/**
 * MCP error codes from specification
 */
const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

// ============================================================================
// MCPServerValidator Class
// ============================================================================

export class MCPServerValidator {
  /**
   * Validate a complete MCP server configuration
   */
  validateServerConfig(config: MCPServerConfig): ValidationReport {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate server metadata
    if (!config.name || config.name.trim().length === 0) {
      errors.push({
        type: 'error',
        category: 'naming',
        message: 'Server name is required',
        suggestion: 'Provide a descriptive server name (e.g., "filesystem-server")',
        severity: 'high',
      });
    }

    if (!config.version || !/^\d+\.\d+\.\d+/.test(config.version)) {
      errors.push({
        type: 'error',
        category: 'protocol',
        message: 'Server version must follow semver (e.g., "1.0.0")',
        suggestion: 'Use semantic versioning: MAJOR.MINOR.PATCH',
        severity: 'medium',
      });
    }

    // Validate tools
    if (!config.tools || config.tools.length === 0) {
      warnings.push({
        category: 'best-practice',
        message: 'Server has no tools defined',
        suggestion: 'MCP servers should expose at least one tool',
      });
    } else {
      config.tools.forEach((tool) => {
        const toolReport = this.validateToolDefinition(tool);
        errors.push(...toolReport.errors);
        warnings.push(...toolReport.warnings);
        suggestions.push(...toolReport.suggestions.map((s) => `Tool "${tool.name}": ${s}`));
      });
    }

    // Validate resources if present
    if (config.resources && config.resources.length > 0) {
      config.resources.forEach((resource, resourceIndex) => {
        if (!resource.uri) {
          errors.push({
            type: 'error',
            category: 'protocol',
            message: `Resource at index ${resourceIndex} missing required "uri" field`,
            location: `resources[${resourceIndex}]`,
            suggestion: 'Provide a URI for the resource',
            severity: 'high',
          });
        }
        if (!resource.name) {
          errors.push({
            type: 'error',
            category: 'protocol',
            message: `Resource at index ${resourceIndex} missing required "name" field`,
            location: `resources[${resourceIndex}]`,
            suggestion: 'Provide a descriptive name for the resource',
            severity: 'high',
          });
        }
      });
    }

    // Calculate score
    const totalChecks = 5 + config.tools.length * 8;
    const passedChecks = totalChecks - errors.length - warnings.length * 0.5;
    const score = Math.max(0, Math.min(1, passedChecks / totalChecks));

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }

  /**
   * Validate a single tool definition
   */
  validateToolDefinition(tool: MCPToolDefinition): ValidationReport {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate name
    if (!tool.name || tool.name.trim().length === 0) {
      errors.push({
        type: 'error',
        category: 'naming',
        message: 'Tool name is required',
        suggestion: 'Provide a descriptive tool name using snake_case (e.g., "read_file")',
        severity: 'critical',
      });
    } else if (!/^[a-z][a-z0-9_]*$/.test(tool.name)) {
      errors.push({
        type: 'error',
        category: 'naming',
        message: `Tool name "${tool.name}" should use snake_case`,
        suggestion: 'Use snake_case for tool names (e.g., "get_user_data" not "getUserData")',
        severity: 'medium',
      });
    }

    // Validate description
    if (!tool.description || tool.description.trim().length === 0) {
      errors.push({
        type: 'error',
        category: 'protocol',
        message: 'Tool description is required',
        suggestion: 'Provide a clear description of what the tool does',
        severity: 'high',
      });
    } else if (tool.description.length < 10) {
      warnings.push({
        category: 'best-practice',
        message: 'Tool description is very short',
        suggestion: 'Provide a detailed description (at least 20 characters)',
      });
    }

    // Validate input schema
    if (!tool.inputSchema) {
      errors.push({
        type: 'error',
        category: 'schema',
        message: 'Tool input schema is required',
        suggestion: 'Define a JSON Schema for tool inputs',
        severity: 'critical',
      });
    } else {
      const schemaReport = this.validateSchema(tool.inputSchema, 'input');
      errors.push(...schemaReport.errors);
      warnings.push(...schemaReport.warnings);
    }

    // Validate handler exists
    if (!tool.handler || typeof tool.handler !== 'function') {
      errors.push({
        type: 'error',
        category: 'protocol',
        message: 'Tool handler must be a function',
        suggestion: 'Provide an async function that processes tool inputs',
        severity: 'critical',
      });
    }

    // Best practice: output schema
    if (!tool.outputSchema) {
      suggestions.push('Consider adding an output schema to document expected return values');
    }

    // Calculate score
    const totalChecks = 8;
    const passedChecks = totalChecks - errors.length - warnings.length * 0.5;
    const score = Math.max(0, Math.min(1, passedChecks / totalChecks));

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }

  /**
   * Validate JSON Schema
   */
  private validateSchema(schema: JSONSchema, context: 'input' | 'output'): ValidationReport {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (!schema.type) {
      errors.push({
        type: 'error',
        category: 'schema',
        message: `${context} schema missing "type" field`,
        suggestion: 'Specify schema type (e.g., "object", "string", "array")',
        severity: 'high',
      });
    }

    if (schema.type === 'object') {
      if (!schema.properties || Object.keys(schema.properties).length === 0) {
        warnings.push({
          category: 'best-practice',
          message: `${context} schema has no properties defined`,
          suggestion: 'Define properties for the object schema',
        });
      }

      // Check for required fields
      if (schema.required && schema.required.length > 0) {
        schema.required.forEach((field) => {
          if (!schema.properties || !schema.properties[field]) {
            errors.push({
              type: 'error',
              category: 'schema',
              message: `Required field "${field}" not defined in properties`,
              suggestion: `Add "${field}" to schema properties`,
              severity: 'medium',
            });
          }
        });
      }

      // Check that all properties have descriptions
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
          if (!prop.description) {
            warnings.push({
              category: 'best-practice',
              message: `Property "${key}" missing description`,
              suggestion: 'Add descriptions to all schema properties for better AI understanding',
            });
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score: errors.length === 0 ? 1 : 0.5,
    };
  }

  /**
   * Analyze handler code for input validation
   */
  analyzeInputValidation(handlerCode: string): SecurityReport {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Check for stdio violations (CRITICAL)
    const consoleLogMatches = handlerCode.match(STDIO_VIOLATIONS.consoleLog);
    if (consoleLogMatches) {
      vulnerabilities.push({
        type: 'command-injection', // Using this as closest match
        severity: 'critical',
        location: 'handler code',
        description: `Found ${consoleLogMatches.length} console.log() call(s) that will corrupt stdio protocol`,
        remediation: 'Replace all console.log() with console.error() for logging',
        cwe: 'MCP-STDIO-001',
      });
    }

    const stdoutMatches = handlerCode.match(STDIO_VIOLATIONS.processStdoutWrite);
    if (stdoutMatches) {
      vulnerabilities.push({
        type: 'command-injection',
        severity: 'critical',
        location: 'handler code',
        description: 'Direct stdout writes will corrupt MCP protocol',
        remediation: 'Only write JSON-RPC messages to stdout, use stderr for logging',
        cwe: 'MCP-STDIO-002',
      });
    }

    // Check for command injection
    SECURITY_PATTERNS.commandInjection.forEach((pattern) => {
      if (pattern.test(handlerCode)) {
        vulnerabilities.push({
          type: 'command-injection',
          severity: 'critical',
          location: 'handler code',
          description: 'Potential command injection via exec/spawn',
          remediation:
            'Validate and sanitize all inputs before executing commands. Use allowlists.',
          cwe: 'CWE-78',
        });
      }
    });

    // Check for path traversal
    SECURITY_PATTERNS.pathTraversal.forEach((pattern) => {
      if (pattern.test(handlerCode)) {
        vulnerabilities.push({
          type: 'path-traversal',
          severity: 'high',
          location: 'handler code',
          description: 'Potential path traversal vulnerability',
          remediation:
            'Validate file paths against allowed directories. Use path.resolve() and check results.',
          cwe: 'CWE-22',
        });
      }
    });

    // Check for unsafe eval
    SECURITY_PATTERNS.unsafeEval.forEach((pattern) => {
      if (pattern.test(handlerCode)) {
        vulnerabilities.push({
          type: 'unsafe-eval',
          severity: 'critical',
          location: 'handler code',
          description: 'Use of eval() or Function() constructor',
          remediation: 'Never use eval() with user input. Find alternative approaches.',
          cwe: 'CWE-95',
        });
      }
    });

    // Check for environment variable usage
    if (SECURITY_PATTERNS.envLeak[0].test(handlerCode)) {
      vulnerabilities.push({
        type: 'env-leak',
        severity: 'medium',
        location: 'handler code',
        description: 'Accessing environment variables',
        remediation:
          'Ensure environment variables are not leaked in responses. Sanitize before returning.',
        cwe: 'CWE-200',
      });
    }

    // Check for SQL injection
    SECURITY_PATTERNS.sqlInjection.forEach((pattern) => {
      if (pattern.test(handlerCode)) {
        vulnerabilities.push({
          type: 'sql-injection',
          severity: 'critical',
          location: 'handler code',
          description: 'Potential SQL injection via string concatenation',
          remediation: 'Use parameterized queries or prepared statements',
          cwe: 'CWE-89',
        });
      }
    });

    // Generate recommendations
    if (vulnerabilities.length === 0) {
      recommendations.push('No obvious security vulnerabilities detected');
    } else {
      recommendations.push('Review all user inputs for proper validation');
      recommendations.push('Implement allowlists rather than denylists for validation');
      recommendations.push('Add integration tests that attempt malicious inputs');
    }

    // Check for error handling
    if (!handlerCode.includes('try') || !handlerCode.includes('catch')) {
      recommendations.push('Add try-catch blocks to handle errors gracefully');
    }

    if (!handlerCode.includes('isError')) {
      recommendations.push('Set isError: true in responses when errors occur');
    }

    // Calculate risk score
    const criticalCount = vulnerabilities.filter((v) => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter((v) => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter((v) => v.severity === 'medium').length;
    const riskScore = Math.min(1, criticalCount * 0.5 + highCount * 0.3 + mediumCount * 0.1);

    return {
      safe: vulnerabilities.length === 0,
      vulnerabilities,
      riskScore,
      recommendations,
    };
  }
}

// ============================================================================
// Code Generation Functions
// ============================================================================

/**
 * Generate a typed handler skeleton from JSON Schema
 */
export function generateToolHandler(schema: JSONSchema, toolName: string): string {
  const inputType = generateTypeScriptInterface(schema, `${toPascalCase(toolName)}Input`);

  return `
${inputType}

/**
 * Handler for ${toolName}
 */
async function ${toCamelCase(toolName)}Handler(input: ${toPascalCase(toolName)}Input): Promise<ToolResult> {
  try {
    // Validate input against schema
    // TODO: Add schema validation here

    // TODO: Implement tool logic here

    return {
      content: [{
        type: 'text',
        text: 'Tool executed successfully'
      }]
    };
  } catch (error) {
    // IMPORTANT: Log to stderr, not stdout
    console.error('${toolName} error:', error);

    return {
      content: [{
        type: 'text',
        text: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`
      }],
      isError: true
    };
  }
}
`.trim();
}

/**
 * Generate TypeScript interface from JSON Schema
 */
function generateTypeScriptInterface(schema: JSONSchema, interfaceName: string): string {
  if (schema.type !== 'object') {
    return `type ${interfaceName} = ${jsonSchemaTypeToTS(schema)};`;
  }

  const properties = schema.properties || {};
  const required = schema.required || [];

  const fields = Object.entries(properties)
    .map(([key, prop]: [string, any]) => {
      const optional = !required.includes(key) ? '?' : '';
      const description = prop.description ? `  /** ${prop.description} */\n` : '';
      const type = jsonSchemaTypeToTS(prop);
      return `${description}  ${key}${optional}: ${type};`;
    })
    .join('\n');

  return `interface ${interfaceName} {
${fields}
}`;
}

/**
 * Convert JSON Schema type to TypeScript type
 */
function jsonSchemaTypeToTS(schema: JSONSchema): string {
  switch (schema.type) {
    case 'string':
      return schema.enum ? schema.enum.map((v) => `'${v}'`).join(' | ') : 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return schema.items ? `Array<${jsonSchemaTypeToTS(schema.items)}>` : 'any[]';
    case 'object':
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

/**
 * Convert snake_case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ============================================================================
// Testing Functions
// ============================================================================

/**
 * Test a tool handler with provided test cases
 */
export async function testToolHandler(
  tool: MCPToolDefinition,
  testCases: TestCase[]
): Promise<TestReport> {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const startTime = Date.now();

    try {
      const output = await tool.handler(testCase.input);
      const executionTimeMs = Date.now() - startTime;

      if (testCase.shouldFail) {
        // Expected to fail but didn't
        results.push({
          passed: false,
          testName: testCase.name,
          actualOutput: output,
          error: new Error('Expected test to fail but it succeeded'),
          executionTimeMs,
        });
        failed++;
      } else if (output.isError) {
        // Unexpected error
        results.push({
          passed: false,
          testName: testCase.name,
          actualOutput: output,
          error: new Error(`Handler returned error: ${output.content[0]?.text}`),
          executionTimeMs,
        });
        failed++;
      } else {
        // Success
        results.push({
          passed: true,
          testName: testCase.name,
          actualOutput: output,
          executionTimeMs,
        });
        passed++;
      }
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      if (testCase.shouldFail) {
        // Expected to fail and did
        results.push({
          passed: true,
          testName: testCase.name,
          error: error as Error,
          executionTimeMs,
        });
        passed++;
      } else {
        // Unexpected error
        results.push({
          passed: false,
          testName: testCase.name,
          error: error as Error,
          executionTimeMs,
        });
        failed++;
      }
    }
  }

  // Analyze coverage
  const hasInputValidationTest = testCases.some(
    (tc) => tc.name.toLowerCase().includes('invalid') || tc.shouldFail
  );
  const hasErrorHandlingTest = testCases.some(
    (tc) => tc.name.toLowerCase().includes('error') || tc.shouldFail
  );
  const hasEdgeCasesTest = testCases.some(
    (tc) => tc.name.toLowerCase().includes('edge') || tc.name.toLowerCase().includes('boundary')
  );

  return {
    totalTests: testCases.length,
    passed,
    failed,
    results,
    coverage: {
      inputValidation: hasInputValidationTest,
      errorHandling: hasErrorHandlingTest,
      edgeCases: hasEdgeCasesTest,
    },
  };
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Quick validation of a tool definition
 */
export function validateToolDefinition(tool: MCPToolDefinition): ValidationReport {
  const validator = new MCPServerValidator();
  return validator.validateToolDefinition(tool);
}

/**
 * Quick validation of a server config
 */
export function validateServerConfig(config: MCPServerConfig): ValidationReport {
  const validator = new MCPServerValidator();
  return validator.validateServerConfig(config);
}

/**
 * Quick security analysis of handler code
 */
export function analyzeInputValidation(handler: string): SecurityReport {
  const validator = new MCPServerValidator();
  return validator.analyzeInputValidation(handler);
}

/**
 * Create a basic MCP error response
 */
export function createErrorResponse(code: number, message: string, data?: any): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
    _meta: {
      errorCode: code,
      errorData: data,
    },
  };
}

/**
 * Validate input against JSON Schema
 */
export function validateInput(
  input: any,
  schema: JSONSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic type checking
  if (schema.type && typeof input !== schema.type) {
    if (!(schema.type === 'integer' && typeof input === 'number')) {
      errors.push(`Expected type ${schema.type}, got ${typeof input}`);
    }
  }

  // Required fields for objects
  if (schema.type === 'object' && schema.required) {
    schema.required.forEach((field) => {
      if (!(field in input)) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  }

  // String validation
  if (schema.type === 'string') {
    if (schema.minLength && input.length < schema.minLength) {
      errors.push(`String too short (min: ${schema.minLength})`);
    }
    if (schema.maxLength && input.length > schema.maxLength) {
      errors.push(`String too long (max: ${schema.maxLength})`);
    }
    if (schema.enum && !schema.enum.includes(input)) {
      errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
    }
  }

  // Number validation
  if (schema.type === 'number' || schema.type === 'integer') {
    if (schema.minimum !== undefined && input < schema.minimum) {
      errors.push(`Number too small (min: ${schema.minimum})`);
    }
    if (schema.maximum !== undefined && input > schema.maximum) {
      errors.push(`Number too large (max: ${schema.maximum})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Compatibility Aliases (for test expectations)
// ============================================================================

// Type aliases for backwards compatibility
export type ToolDefinition = MCPToolDefinition;
export type ToolValidationResult = ValidationReport;
export type SecurityAnalysisResult = SecurityReport;
export type ServerConfigValidation = ValidationReport;

// Class alias
export const MCPServerDevelopment = MCPServerValidator;

// Factory function
export function createMCPServerDevelopment(): MCPServerValidator {
  return new MCPServerValidator();
}

// Server validation function
export function validateMCPServer(config: MCPServerConfig): ValidationReport {
  const validator = new MCPServerValidator();
  return validator.validateServerConfig(config);
}

// ============================================================================
// Exports
// ============================================================================

export default {
  MCPServerValidator,
  MCPServerDevelopment,
  createMCPServerDevelopment,
  validateMCPServer,
  validateToolDefinition,
  validateServerConfig,
  generateToolHandler,
  testToolHandler,
  analyzeInputValidation,
  createErrorResponse,
  validateInput,
  MCP_ERROR_CODES,
};
