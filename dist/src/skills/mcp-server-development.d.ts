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
    score: number;
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
    riskScore: number;
    recommendations: string[];
}
export declare class MCPServerValidator {
    /**
     * Validate a complete MCP server configuration
     */
    validateServerConfig(config: MCPServerConfig): ValidationReport;
    /**
     * Validate a single tool definition
     */
    validateToolDefinition(tool: MCPToolDefinition): ValidationReport;
    /**
     * Validate JSON Schema
     */
    private validateSchema;
    /**
     * Analyze handler code for input validation
     */
    analyzeInputValidation(handlerCode: string): SecurityReport;
}
/**
 * Generate a typed handler skeleton from JSON Schema
 */
export declare function generateToolHandler(schema: JSONSchema, toolName: string): string;
/**
 * Test a tool handler with provided test cases
 */
export declare function testToolHandler(tool: MCPToolDefinition, testCases: TestCase[]): Promise<TestReport>;
/**
 * Quick validation of a tool definition
 */
export declare function validateToolDefinition(tool: MCPToolDefinition): ValidationReport;
/**
 * Quick validation of a server config
 */
export declare function validateServerConfig(config: MCPServerConfig): ValidationReport;
/**
 * Quick security analysis of handler code
 */
export declare function analyzeInputValidation(handler: string): SecurityReport;
/**
 * Create a basic MCP error response
 */
export declare function createErrorResponse(code: number, message: string, data?: any): ToolResult;
/**
 * Validate input against JSON Schema
 */
export declare function validateInput(input: any, schema: JSONSchema): {
    valid: boolean;
    errors: string[];
};
declare const _default: {
    MCPServerValidator: typeof MCPServerValidator;
    validateToolDefinition: typeof validateToolDefinition;
    validateServerConfig: typeof validateServerConfig;
    generateToolHandler: typeof generateToolHandler;
    testToolHandler: typeof testToolHandler;
    analyzeInputValidation: typeof analyzeInputValidation;
    createErrorResponse: typeof createErrorResponse;
    validateInput: typeof validateInput;
    MCP_ERROR_CODES: {
        PARSE_ERROR: number;
        INVALID_REQUEST: number;
        METHOD_NOT_FOUND: number;
        INVALID_PARAMS: number;
        INTERNAL_ERROR: number;
    };
};
export default _default;
//# sourceMappingURL=mcp-server-development.d.ts.map