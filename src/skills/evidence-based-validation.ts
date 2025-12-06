/**
 * Evidence-Based Validation Skill
 *
 * Enforces intellectual honesty by preventing fabricated metrics, exaggerated claims,
 * and unsupported assertions, ensuring all technical assessments rest on verifiable evidence.
 *
 * Based on principles from UPLIFTED_SKILLS.md:
 * - Measurement Distinguishes Opinion from Fact
 * - Uncertainty Acknowledgment Builds Trust
 * - Skepticism as Default Posture
 * - Language Precision Prevents Creep
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-1, based on checks passed (NOT fabricated)
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  category: 'metrics' | 'language' | 'evidence' | 'completeness';
  message: string;
  location?: { line: number; column: number };
  suggestion: string;
}

export interface ValidationInput {
  text: string;
  context?: {
    type?: 'code' | 'documentation' | 'claim' | 'report';
    claims?: Array<{ claim: string; sources: string[] }>;
    status?: string;
    details?: string[];
  };
}

export interface MetricCheck {
  hasNumber: boolean;
  hasMethodology: boolean;
  isRounded: boolean;
  isFabricated: boolean;
  location?: { line: number; column: number };
  text: string;
}

// ============================================================================
// Prohibited Patterns
// ============================================================================

const PROHIBITED_PATTERNS = {
  // Vague language that lacks specificity
  vague: [
    /\b(should work|might work|probably work|could work)\b/gi,
    /\b(probably|possibly|maybe|perhaps|likely)\b/gi,
    /\b(seems to|appears to)\b/gi,
    /\b(roughly|about|around|approximately)\s+\d+%/gi, // Vague percentage
  ],

  // Superlatives without evidence
  superlatives: [
    /\b(excellent|perfect|best|optimal|ideal|superior)\b/gi,
    /\b(flawless|impeccable|outstanding|exceptional)\b/gi,
    /\b100%(?!\s+(test\s+)?coverage|line\s+coverage|measured)/gi, // 100% without specific context
  ],

  // Confidence inflation indicators
  confidenceInflation: [
    /\b(proven|guaranteed|certainly|definitely|absolutely)\b/gi,
    /\b(always works|never fails|completely reliable)\b/gi,
  ],

  // Completion claims without evidence
  unsubstantiatedCompletion: [
    /\b(production ready|fully complete|entirely done)\b/gi,
    /\b(all tests pass)\b(?!.*\d+\s+tests?)/gi, // "all tests pass" without count
  ],

  // Unsupported comparisons
  unsupportedComparisons: [
    /\b(faster|slower|better|worse)\b(?!.*\d+)/gi, // Comparative without numbers
    /\b(\d+x\s+(?:faster|slower|better))\b(?!.*baseline|before|previous)/gi, // Multiplier without baseline
  ],
};

// Methodology indicators that make metrics acceptable
const METHODOLOGY_INDICATORS = [
  /measured\s+(?:on|at|using)/i,
  /benchmark(?:ed)?\s+(?:on|at|using)/i,
  /tested\s+(?:on|at|using)/i,
  /coverage\s+tool\s+reported/i,
  /\d{4}-\d{2}-\d{2}/, // Date stamp
  /sample\s+size/i,
  /\d+\s+out\s+of\s+\d+/i, // e.g., "42 out of 50"
  /(?:min|max|avg|mean|median):/i,
];

// ============================================================================
// EvidenceBasedValidator Class
// ============================================================================

export class EvidenceBasedValidator {
  /**
   * Validate metrics to ensure they're not fabricated
   *
   * Anti-pattern detected: Metrics without methodology
   * Good pattern: "Coverage tool reported 87% line coverage on 2024-12-06"
   * Bad pattern: "Code quality is excellent at 95%"
   */
  validateMetrics(text: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check for numbers that might be metrics
      const numberMatches = line.matchAll(/\b(\d+(?:\.\d+)?)\s*(%|percent|points?|score)\b/gi);

      for (const match of numberMatches) {
        const metricText = match[0];
        const value = parseFloat(match[1]);
        const hasMethodology = METHODOLOGY_INDICATORS.some(pattern =>
          line.match(pattern) ||
          (lineIndex > 0 && lines[lineIndex - 1].match(pattern))
        );

        // Check if it's a suspiciously round number without methodology
        const isRound = value % 10 === 0 || value === 100;
        const isSuspicious = isRound && !hasMethodology;

        if (!hasMethodology) {
          issues.push({
            type: isSuspicious ? 'error' : 'warning',
            category: 'metrics',
            message: `Metric "${metricText}" lacks methodology - how was this measured?`,
            location: { line: lineIndex + 1, column: match.index || 0 },
            suggestion: `Specify how this was measured. Example: "Coverage tool reported ${value}% line coverage on 2024-12-06" or "Estimated approximately ${value}% based on file count (not measured)"`,
          });
        }

        // Check for suspiciously precise decimals (e.g., 87.3%) which suggest fabrication
        if (value % 1 !== 0 && !hasMethodology) {
          issues.push({
            type: 'warning',
            category: 'metrics',
            message: `Precise decimal "${metricText}" without methodology suggests fabrication`,
            location: { line: lineIndex + 1, column: match.index || 0 },
            suggestion: 'Either provide measurement details or use whole numbers for estimates',
          });
        }
      }
    });

    const score = issues.length === 0 ? 1.0 : Math.max(0, 1 - (issues.length * 0.2));

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      score,
      issues,
      suggestions: this._generateMetricSuggestions(issues),
    };
  }

  /**
   * Validate language for vague terms and superlatives
   *
   * Anti-pattern detected: Language that inflates claims
   * Good pattern: "Follows standard patterns, no obvious defects observed"
   * Bad pattern: "Excellent code quality"
   */
  validateLanguage(text: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    const lines = text.split('\n');

    // Check each prohibited pattern category
    Object.entries(PROHIBITED_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        lines.forEach((line, lineIndex) => {
          const matches = line.matchAll(pattern);
          for (const match of matches) {
            const matchText = match[0];
            const suggestion = this._getLanguageSuggestion(matchText, category);

            issues.push({
              type: category === 'vague' ? 'warning' : 'error',
              category: 'language',
              message: `Prohibited ${category} language detected: "${matchText}"`,
              location: { line: lineIndex + 1, column: match.index || 0 },
              suggestion,
            });
          }
        });
      });
    });

    const score = issues.length === 0 ? 1.0 : Math.max(0, 1 - (issues.length * 0.15));

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      score,
      issues,
      suggestions: this._generateLanguageSuggestions(issues),
    };
  }

  /**
   * Validate that claims have supporting evidence
   *
   * Anti-pattern detected: Claims without sources
   * Good pattern: Every quantitative claim traces to a specific source
   */
  validateEvidence(claim: string, sources: string[]): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check if claim contains numbers/metrics
    const hasNumbers = /\d+/.test(claim);
    const hasComparison = /\b(faster|slower|better|worse|improved|increased|decreased)\b/i.test(claim);
    const hasStrongClaim = /\b(proven|guaranteed|always|never|all|every|completely)\b/i.test(claim);

    if (sources.length === 0) {
      if (hasNumbers || hasComparison || hasStrongClaim) {
        issues.push({
          type: 'error',
          category: 'evidence',
          message: 'Claim contains metrics/comparisons but has no supporting sources',
          suggestion: 'Provide specific sources (URLs, DOIs, PMIDs, or measurement methodology)',
        });
      } else {
        issues.push({
          type: 'warning',
          category: 'evidence',
          message: 'Claim has no supporting evidence',
          suggestion: 'Add sources or rephrase as hypothesis/observation rather than conclusion',
        });
      }
    }

    // Validate source quality
    sources.forEach((source, index) => {
      // Check for placeholder/fake sources
      const isPlaceholder = /\b(example|placeholder|todo|tbd|xxx)\b/i.test(source);
      const hasIdentifier = /\b(doi:|pmid:|https?:\/\/|arxiv:)\b/i.test(source);

      if (isPlaceholder) {
        issues.push({
          type: 'error',
          category: 'evidence',
          message: `Source ${index + 1} appears to be a placeholder: "${source}"`,
          suggestion: 'Replace with actual source or remove the claim',
        });
      } else if (!hasIdentifier && !source.includes('measured') && !source.includes('observed')) {
        issues.push({
          type: 'warning',
          category: 'evidence',
          message: `Source ${index + 1} lacks identifier (DOI, PMID, URL): "${source}"`,
          suggestion: 'Include DOI, PMID, URL, or methodology description',
        });
      }
    });

    const score = sources.length > 0 ?
      Math.max(0, 1 - (issues.filter(i => i.type === 'error').length * 0.3)) :
      0.3;

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      score,
      issues,
      suggestions: this._generateEvidenceSuggestions(claim, sources, issues),
    };
  }

  /**
   * Validate completion claims against actual details
   *
   * Anti-pattern detected: Claiming completion when only implementation exists
   * Good pattern: Separate implemented/tested/integrated/validated/complete
   */
  validateCompleteness(status: string, details: string[]): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Map status claims to required evidence
    const statusRequirements: Record<string, string[]> = {
      'complete': ['implemented', 'tested', 'integrated', 'validated', 'documented'],
      'production ready': ['tested', 'performance validated', 'error handling', 'deployed'],
      'fully tested': ['test count', 'coverage', 'edge cases'],
      'optimized': ['baseline', 'after', 'benchmark'],
      'validated': ['test results', 'verification method'],
    };

    const normalizedStatus = status.toLowerCase();

    // Check if status makes strong completion claim
    Object.entries(statusRequirements).forEach(([statusPattern, requirements]) => {
      if (normalizedStatus.includes(statusPattern)) {
        requirements.forEach(requirement => {
          const hasRequirement = details.some(detail =>
            detail.toLowerCase().includes(requirement)
          );

          if (!hasRequirement) {
            issues.push({
              type: 'error',
              category: 'completeness',
              message: `Status "${status}" requires evidence of "${requirement}" but none provided`,
              suggestion: `Either provide ${requirement} details or use more accurate status (e.g., "implemented" instead of "${statusPattern}")`,
            });
          }
        });
      }
    });

    // Check for completion percentage claims
    const percentageMatch = status.match(/(\d+)%\s*(?:complete|done|finished)/i);
    if (percentageMatch) {
      const percentage = parseInt(percentageMatch[1]);
      const hasEnumeration = details.some(d =>
        /\d+\s+(?:out of|\/)\s+\d+/.test(d) || // "5 out of 10"
        /(?:completed|done|finished).*:\s*\d+/.test(d) // "completed: 5"
      );

      if (!hasEnumeration) {
        issues.push({
          type: 'error',
          category: 'completeness',
          message: `Completion percentage "${percentage}%" lacks enumeration of what's counted`,
          suggestion: 'Provide specific breakdown: "X out of Y features implemented, Z out of Y tested"',
        });
      }
    }

    // Check for vague completion claims
    if (/\b(mostly|nearly|almost|basically)\s+(?:complete|done|ready)\b/i.test(status)) {
      issues.push({
        type: 'warning',
        category: 'completeness',
        message: 'Vague completion language detected',
        suggestion: 'Be specific: what is complete and what remains?',
      });
    }

    const score = issues.length === 0 ? 1.0 : Math.max(0, 1 - (issues.length * 0.25));

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      score,
      issues,
      suggestions: this._generateCompletenessSuggestions(status, details, issues),
    };
  }

  /**
   * Master validation that runs all checks
   *
   * Combines metrics, language, evidence, and completeness validation
   */
  validate(input: ValidationInput): ValidationResult {
    const results: ValidationResult[] = [];

    // Always validate metrics and language
    results.push(this.validateMetrics(input.text));
    results.push(this.validateLanguage(input.text));

    // Validate evidence if claims provided
    if (input.context?.claims && input.context.claims.length > 0) {
      input.context.claims.forEach(({ claim, sources }) => {
        results.push(this.validateEvidence(claim, sources));
      });
    }

    // Validate completeness if status provided
    if (input.context?.status && input.context?.details) {
      results.push(this.validateCompleteness(input.context.status, input.context.details));
    }

    // Combine results
    const allIssues = results.flatMap(r => r.issues);
    const allSuggestions = Array.from(new Set(results.flatMap(r => r.suggestions)));

    // Calculate overall score (weighted average based on number of checks)
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const avgScore = totalScore / results.length;

    // Round to 2 decimal places for reporting (with methodology!)
    const score = Math.round(avgScore * 100) / 100;

    return {
      valid: allIssues.filter(i => i.type === 'error').length === 0,
      score,
      issues: allIssues,
      suggestions: allSuggestions,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private _generateMetricSuggestions(issues: ValidationIssue[]): string[] {
    const suggestions: string[] = [];

    if (issues.length > 0) {
      suggestions.push('Include measurement methodology for all metrics');
      suggestions.push('Use format: "Tool X reported Y on date Z" for measured values');
      suggestions.push('Use format: "Estimated approximately Y based on Z (not measured)" for estimates');
      suggestions.push('Distinguish measured vs estimated vs assumed vs unknown');
    }

    return suggestions;
  }

  private _generateLanguageSuggestions(issues: ValidationIssue[]): string[] {
    const suggestions: string[] = [];
    const categories = new Set(issues.map(i => i.message.match(/Prohibited (\w+)/)?.[1]));

    if (categories.has('vague')) {
      suggestions.push('Replace "should work" with "tested to work" or "not yet tested"');
      suggestions.push('Replace "probably" with specific confidence level or evidence');
    }

    if (categories.has('superlatives')) {
      suggestions.push('Replace superlatives with specific observations');
      suggestions.push('Example: "excellent" → "follows standard patterns, no obvious defects observed"');
    }

    if (categories.has('confidenceInflation')) {
      suggestions.push('Reduce confidence to match evidence level');
      suggestions.push('Use "observed in tests" rather than "proven" or "guaranteed"');
    }

    return suggestions;
  }

  private _generateEvidenceSuggestions(
    _claim: string,
    sources: string[],
    issues: ValidationIssue[]
  ): string[] {
    const suggestions: string[] = [];

    if (sources.length === 0) {
      suggestions.push('Add specific sources with identifiers (DOI, PMID, URL)');
      suggestions.push('Or rephrase as observation/hypothesis rather than conclusion');
    }

    if (issues.some(i => i.message.includes('placeholder'))) {
      suggestions.push('Remove placeholder sources - incomplete evidence is better than fabricated evidence');
    }

    if (issues.some(i => i.message.includes('lacks identifier'))) {
      suggestions.push('Include DOI, PMID, or URL for each source');
      suggestions.push('For measurements, describe methodology instead');
    }

    return suggestions;
  }

  private _generateCompletenessSuggestions(
    _status: string,
    _details: string[],
    issues: ValidationIssue[]
  ): string[] {
    const suggestions: string[] = [];

    if (issues.length > 0) {
      suggestions.push('Use precise status levels: implemented → tested → integrated → validated → complete');
      suggestions.push('Enumerate what is complete and what remains');
      suggestions.push('For percentages, show the calculation: "5 out of 10 features implemented (50%)"');
    }

    return suggestions;
  }

  private _getLanguageSuggestion(matchText: string, category: string): string {
    const lower = matchText.toLowerCase();

    // Specific suggestions for common patterns
    const replacements: Record<string, string> = {
      'should work': 'Replace with "tested to work" or "not yet tested"',
      'might work': 'Replace with "tested to work" or "not yet tested"',
      'probably': 'Replace with specific evidence or acknowledge uncertainty explicitly',
      'possibly': 'Replace with specific evidence or acknowledge uncertainty explicitly',
      'excellent': 'Replace with specific observations: "follows standard patterns, no obvious defects observed"',
      'perfect': 'Replace with specific observations about what works and what doesn\'t',
      'best': 'Replace with comparative data: "performed X% better than Y on benchmark Z"',
      'optimal': 'Replace with measurement: "selected based on benchmark showing X"',
      'proven': 'Replace with "observed in tests" or "validated under conditions X"',
      'guaranteed': 'Replace with "observed reliability of X% under test conditions"',
      'production ready': 'Replace with specific status: "passes tests, production behavior not validated"',
    };

    for (const [pattern, suggestion] of Object.entries(replacements)) {
      if (lower.includes(pattern)) {
        return suggestion;
      }
    }

    return `Remove ${category} language and use specific observations instead`;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a new validator instance
 */
export function createValidator(): EvidenceBasedValidator {
  return new EvidenceBasedValidator();
}

/**
 * Quick validation of text for common issues
 */
export function quickValidate(text: string): ValidationResult {
  const validator = new EvidenceBasedValidator();
  return validator.validate({ text });
}

/**
 * Validate a claim with sources
 */
export function validateClaim(claim: string, sources: string[]): ValidationResult {
  const validator = new EvidenceBasedValidator();
  return validator.validateEvidence(claim, sources);
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`Validation Score: ${result.score.toFixed(2)} (based on ${result.issues.length} checks)`);
  lines.push(`Status: ${result.valid ? 'VALID' : 'INVALID'}`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('Issues Found:');
    result.issues.forEach((issue, index) => {
      lines.push(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.category}`);
      lines.push(`   ${issue.message}`);
      if (issue.location) {
        lines.push(`   Location: Line ${issue.location.line}, Column ${issue.location.column}`);
      }
      lines.push(`   Suggestion: ${issue.suggestion}`);
      lines.push('');
    });
  }

  if (result.suggestions.length > 0) {
    lines.push('General Suggestions:');
    result.suggestions.forEach((suggestion, index) => {
      lines.push(`${index + 1}. ${suggestion}`);
    });
  }

  return lines.join('\n');
}

// ============================================================================
// Export Default Instance
// ============================================================================

export default new EvidenceBasedValidator();
