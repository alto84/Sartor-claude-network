/**
 * Metrics Validation Hook
 * Ensures all quantitative claims have verifiable sources
 *
 * Enforces: No fabricated metrics, evidence-based claims only
 */

interface MetricClaim {
  value: string;
  context: string;
  lineNumber: number;
  file: string;
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

export class MetricsValidator {
  private readonly SUSPICIOUS_PATTERNS = [
    // Percentages without evidence
    { pattern: /(\d+)%\s+(coverage|complete|done|tested)/gi, message: 'Percentage claim requires measurement evidence' },

    // Scores without rubric
    { pattern: /score:?\s*(\d+)\/(\d+)/gi, message: 'Score requires defined rubric and calculation methodology' },

    // Quality superlatives
    { pattern: /quality:?\s*(excellent|perfect|optimal|superior)/gi, message: 'Quality claim requires specific observations, not superlatives' },

    // Confidence without basis
    { pattern: /(high|low|medium)\s+confidence/gi, message: 'Confidence level requires explanation of basis' },

    // Vague approximations
    { pattern: /approximately\s+\d+/gi, message: 'Approximation requires error margin or precision bounds' },

    // Round numbers (often fabricated)
    { pattern: /\b100%\b|\b0%\b|\bexactly\s+\d+0\b/gi, message: 'Suspiciously round number - is this measured or estimated?' },

    // Performance claims
    { pattern: /\b(\d+)x\s+(faster|slower|better|worse)/gi, message: 'Performance claim requires baseline and measurement data' },
  ];

  private readonly REQUIRED_EVIDENCE_KEYWORDS = [
    'measured',
    'tested',
    'benchmark',
    'output',
    'result',
    'timestamp',
    'tool:',
    'command:',
  ];

  validate(content: string, filename: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const claims = this.extractMetricClaims(content, filename);

    for (const claim of claims) {
      // Check for suspicious patterns
      for (const { pattern, message } of this.SUSPICIOUS_PATTERNS) {
        if (pattern.test(claim.value)) {
          const hasEvidence = this.hasNearbyEvidence(content, claim.lineNumber);

          if (!hasEvidence) {
            issues.push({
              severity: 'error',
              message: `${message}: "${claim.value}"`,
              location: `${claim.file}:${claim.lineNumber}`,
              suggestion: this.suggestEvidence(claim.value),
            });
          }
        }
      }

      // Check for fabrication red flags
      const fabricationFlags = this.detectFabrication(claim);
      if (fabricationFlags.length > 0) {
        issues.push({
          severity: 'error',
          message: `Possible fabricated metric: ${fabricationFlags.join(', ')}`,
          location: `${claim.file}:${claim.lineNumber}`,
          suggestion: 'Provide verifiable measurement or mark as estimate',
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  private extractMetricClaims(content: string, filename: string): MetricClaim[] {
    const lines = content.split('\n');
    const claims: MetricClaim[] = [];

    lines.forEach((line, index) => {
      // Look for numbers followed by units or qualifiers
      const metricPatterns = [
        /\d+(\.\d+)?%/g,
        /\d+\/\d+/g,
        /\d+(\.\d+)?\s*(ms|seconds|minutes|hours)/g,
        /score:?\s*\d+/gi,
        /(coverage|complete|tested|validated).*\d+/gi,
      ];

      for (const pattern of metricPatterns) {
        const matches = line.match(pattern);
        if (matches) {
          claims.push({
            value: line.trim(),
            context: this.getContext(lines, index),
            lineNumber: index + 1,
            file: filename,
          });
        }
      }
    });

    return claims;
  }

  private hasNearbyEvidence(content: string, lineNumber: number): boolean {
    const lines = content.split('\n');
    const contextRange = 5; // Check 5 lines before and after
    const startLine = Math.max(0, lineNumber - contextRange);
    const endLine = Math.min(lines.length, lineNumber + contextRange);

    const contextLines = lines.slice(startLine, endLine).join('\n').toLowerCase();

    // Check for evidence keywords
    return this.REQUIRED_EVIDENCE_KEYWORDS.some(keyword =>
      contextLines.includes(keyword)
    );
  }

  private detectFabrication(claim: MetricClaim): string[] {
    const flags: string[] = [];

    // Red flag: Suspiciously precise numbers
    if (/\d+\.\d{4,}/.test(claim.value)) {
      flags.push('Unusually precise number (possible fabrication)');
    }

    // Red flag: Multiple round numbers
    if (/(100%|0%|50%|75%)/.test(claim.value)) {
      flags.push('Suspiciously round percentage');
    }

    // Red flag: Claims without hedging
    if (/(exactly|precisely|always)\s+\d+/.test(claim.value)) {
      flags.push('Absolute claim without uncertainty margin');
    }

    // Red flag: Performance improvement claims
    if (/\d+x\s+(faster|better|improvement)/.test(claim.value)) {
      if (!claim.context.includes('benchmark') && !claim.context.includes('measured')) {
        flags.push('Performance claim without benchmark evidence');
      }
    }

    return flags;
  }

  private suggestEvidence(claim: string): string {
    if (claim.includes('%')) {
      return 'Include: measurement tool, command used, timestamp, exact output';
    }
    if (claim.includes('score')) {
      return 'Include: rubric definition, calculation methodology, individual scores';
    }
    if (claim.includes('faster') || claim.includes('slower')) {
      return 'Include: baseline measurement, new measurement, tool used, conditions';
    }
    if (claim.includes('quality')) {
      return 'Replace with: specific observations (lint score, complexity, standards followed)';
    }
    return 'Provide verifiable evidence or mark as estimate with methodology';
  }

  private getContext(lines: string[], lineNumber: number): string {
    const contextRange = 3;
    const start = Math.max(0, lineNumber - contextRange);
    const end = Math.min(lines.length, lineNumber + contextRange + 1);
    return lines.slice(start, end).join('\n');
  }
}

// Example usage in pre-commit hook
export async function validateMetrics(files: string[]): Promise<boolean> {
  const validator = new MetricsValidator();
  let hasErrors = false;

  for (const file of files) {
    const content = await readFile(file);
    const result = validator.validate(content, file);

    if (!result.valid) {
      console.error(`\n❌ Metrics validation failed for ${file}:`);
      result.issues.forEach(issue => {
        console.error(`  ${issue.severity.toUpperCase()}: ${issue.message}`);
        console.error(`    Location: ${issue.location}`);
        console.error(`    Suggestion: ${issue.suggestion}`);
      });
      hasErrors = true;
    }

    if (result.warnings.length > 0) {
      console.warn(`\n⚠️  Warnings for ${file}:`);
      result.warnings.forEach(warning => {
        console.warn(`  ${warning.message}`);
      });
    }
  }

  return !hasErrors;
}

// Stub for file reading (would be implemented based on runtime)
async function readFile(path: string): Promise<string> {
  // Implementation would use fs.readFile or similar
  throw new Error('Not implemented - integrate with your file system');
}
