/**
 * Error Handling Validator
 * Ensures all code includes proper error handling
 *
 * Enforces: Proper error handling, failure modes documented, graceful degradation
 */

interface ErrorHandlingCheck {
  functionName: string;
  hasErrorHandling: boolean;
  errorTypes: string[];
  missingHandling: string[];
  lineNumber: number;
}

export class ErrorHandlingValidator {
  private readonly PATTERNS_REQUIRING_ERROR_HANDLING = {
    typescript: {
      async_function: /async\s+function\s+(\w+)|async\s+(\w+)\s*\(/g,
      api_call: /\b(fetch|axios|http|request)\s*\(/gi,
      file_operation: /\b(readFile|writeFile|fs\.)\w+/gi,
      database_operation: /\b(query|execute|find|create|update|delete)\s*\(/gi,
      json_parse: /JSON\.parse\s*\(/g,
      promise_usage: /new\s+Promise|\.then\(|\.catch\(/g,
    },
    python: {
      async_function: /async\s+def\s+(\w+)/g,
      api_call: /requests\.\w+\(|httpx\.\w+\(/g,
      file_operation: /open\s*\(|with\s+open\(/g,
      database_operation: /\.query\(|\.execute\(|\.create\(/g,
      json_parse: /json\.loads\(/g,
    },
  };

  private readonly ERROR_HANDLING_PATTERNS = {
    typescript: {
      try_catch: /try\s*{[\s\S]*?}\s*catch\s*\(/g,
      promise_catch: /\.catch\s*\(/g,
      error_check: /if\s*\(\s*!?.*error/gi,
      throw_statement: /throw\s+new\s+\w*Error/g,
    },
    python: {
      try_except: /try\s*:[\s\S]*?except\s+/g,
      error_check: /if\s+.*error/gi,
      raise_statement: /raise\s+\w*Error/g,
    },
  };

  validate(content: string, filename: string, language: 'typescript' | 'python'): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Find all patterns that require error handling
    const riskyOperations = this.findRiskyOperations(content, language);

    // Check if each has appropriate error handling
    for (const operation of riskyOperations) {
      const hasErrorHandling = this.checkErrorHandlingPresent(
        content,
        operation.lineNumber,
        language
      );

      if (!hasErrorHandling.present) {
        issues.push({
          severity: 'error',
          message: `Missing error handling for ${operation.type}: ${operation.code}`,
          location: `${filename}:${operation.lineNumber}`,
          suggestion: this.suggestErrorHandling(operation.type, language),
        });
      } else if (!hasErrorHandling.specific) {
        warnings.push({
          severity: 'warning',
          message: `Generic error handling for ${operation.type}. Consider specific error types.`,
          location: `${filename}:${operation.lineNumber}`,
          suggestion: this.suggestSpecificErrorHandling(operation.type, language),
        });
      }
    }

    // Check for anti-patterns
    const antiPatterns = this.detectErrorHandlingAntiPatterns(content, language, filename);
    issues.push(...antiPatterns);

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  private findRiskyOperations(
    content: string,
    language: 'typescript' | 'python'
  ): Array<{ type: string; code: string; lineNumber: number }> {
    const operations: Array<{ type: string; code: string; lineNumber: number }> = [];
    const lines = content.split('\n');
    const patterns = this.PATTERNS_REQUIRING_ERROR_HANDLING[language];

    lines.forEach((line, index) => {
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(line)) {
          operations.push({
            type,
            code: line.trim(),
            lineNumber: index + 1,
          });
        }
      }
    });

    return operations;
  }

  private checkErrorHandlingPresent(
    content: string,
    lineNumber: number,
    language: 'typescript' | 'python'
  ): { present: boolean; specific: boolean } {
    const lines = content.split('\n');
    const contextRange = 15; // Check 15 lines before and after
    const startLine = Math.max(0, lineNumber - contextRange);
    const endLine = Math.min(lines.length, lineNumber + contextRange);

    const context = lines.slice(startLine, endLine).join('\n');
    const patterns = this.ERROR_HANDLING_PATTERNS[language];

    // Check if any error handling pattern is present
    let present = false;
    let specific = false;

    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.test(context)) {
        present = true;

        // Check if it's specific error handling (not just catch(e) or except:)
        if (key === 'try_catch' || key === 'try_except') {
          if (language === 'typescript') {
            specific = /catch\s*\(\s*\w+\s*:\s*\w*Error\s*\)/.test(context);
          } else {
            specific = /except\s+\w*Error/.test(context);
          }
        } else {
          specific = true;
        }
        break;
      }
    }

    return { present, specific };
  }

  private suggestErrorHandling(operationType: string, language: 'typescript' | 'python'): string {
    const suggestions: Record<string, Record<string, string>> = {
      typescript: {
        async_function: 'Wrap in try-catch or add .catch() to promise chain',
        api_call: 'Handle network errors, timeouts, and non-200 status codes',
        file_operation: 'Handle ENOENT, EACCES, and other file system errors',
        database_operation: 'Handle connection errors, query errors, and constraint violations',
        json_parse: 'Handle JSON.parse() SyntaxError for malformed JSON',
        promise_usage: 'Add .catch() handler or use try-catch with await',
      },
      python: {
        async_function: 'Wrap in try-except block',
        api_call: 'Handle requests.exceptions (ConnectionError, Timeout, HTTPError)',
        file_operation: 'Handle IOError, FileNotFoundError, PermissionError',
        database_operation: 'Handle connection errors, operational errors, integrity errors',
        json_parse: 'Handle json.JSONDecodeError for malformed JSON',
      },
    };

    return suggestions[language][operationType] || 'Add appropriate error handling';
  }

  private suggestSpecificErrorHandling(operationType: string, language: 'typescript' | 'python'): string {
    if (language === 'typescript') {
      return 'Use specific error types (e.g., catch (error: NetworkError)) instead of generic catch';
    } else {
      return 'Use specific exception types (e.g., except requests.HTTPError) instead of bare except';
    }
  }

  private detectErrorHandlingAntiPatterns(
    content: string,
    language: 'typescript' | 'python',
    filename: string
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = content.split('\n');

    const antiPatterns = {
      typescript: [
        {
          pattern: /catch\s*\(\s*\w*\s*\)\s*{\s*}/g,
          message: 'Empty catch block - swallowing errors silently',
          suggestion: 'Log error, handle gracefully, or propagate upward',
        },
        {
          pattern: /catch\s*\(\s*\w*\s*\)\s*{\s*console\.log/g,
          message: 'Only logging errors without handling',
          suggestion: 'Log AND handle or propagate error',
        },
        {
          pattern: /catch\s*\(\s*_\s*\)/g,
          message: 'Ignoring error with _ parameter',
          suggestion: 'Handle error or explicitly document why it can be ignored',
        },
      ],
      python: [
        {
          pattern: /except:\s*\n\s*pass/g,
          message: 'Empty except block - swallowing errors silently',
          suggestion: 'Log error, handle gracefully, or re-raise',
        },
        {
          pattern: /except Exception:/g,
          message: 'Catching broad Exception - too generic',
          suggestion: 'Catch specific exception types',
        },
      ],
    };

    const patternsToCheck = antiPatterns[language];

    lines.forEach((line, index) => {
      for (const { pattern, message, suggestion } of patternsToCheck) {
        if (pattern.test(line)) {
          issues.push({
            severity: 'error',
            message: `Error handling anti-pattern: ${message}`,
            location: `${filename}:${index + 1}`,
            suggestion,
          });
        }
      }
    });

    return issues;
  }
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface ValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  location: string;
  suggestion: string;
}
