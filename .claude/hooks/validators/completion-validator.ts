/**
 * Completion Status Validator
 * Ensures accurate distinction between implemented/tested/integrated/validated/complete
 *
 * Enforces: Implementation ≠ Completion, honest progress tracking
 */

export enum CompletionStatus {
  IMPLEMENTED = 'implemented',   // Code exists and compiles
  TESTED = 'tested',              // Code passes defined tests
  INTEGRATED = 'integrated',      // Code works with other components
  VALIDATED = 'validated',        // Code meets requirements in realistic conditions
  COMPLETE = 'complete',          // All above + documented + deployed
}

interface StatusClaim {
  claimedStatus: CompletionStatus;
  actualStatus: CompletionStatus;
  evidence: string[];
  missingEvidence: string[];
  lineNumber: number;
}

export class CompletionValidator {
  private readonly STATUS_REQUIREMENTS = {
    [CompletionStatus.IMPLEMENTED]: {
      required: ['code exists', 'compiles/runs'],
      evidence_keywords: ['implemented', 'created', 'added', 'written'],
      not_sufficient_alone: true,
    },
    [CompletionStatus.TESTED]: {
      required: ['unit tests exist', 'tests pass', 'test output available'],
      evidence_keywords: ['test', 'spec', 'passes', 'coverage'],
      requires_prior: [CompletionStatus.IMPLEMENTED],
    },
    [CompletionStatus.INTEGRATED]: {
      required: ['works with other components', 'integration tests pass'],
      evidence_keywords: ['integrated', 'integration test', 'end-to-end'],
      requires_prior: [CompletionStatus.IMPLEMENTED, CompletionStatus.TESTED],
    },
    [CompletionStatus.VALIDATED]: {
      required: ['meets requirements', 'validated in realistic conditions', 'acceptance criteria met'],
      evidence_keywords: ['validated', 'verified', 'confirmed', 'acceptance'],
      requires_prior: [CompletionStatus.IMPLEMENTED, CompletionStatus.TESTED, CompletionStatus.INTEGRATED],
    },
    [CompletionStatus.COMPLETE]: {
      required: ['all prior stages', 'documented', 'deployed/ready for deployment'],
      evidence_keywords: ['complete', 'done', 'finished', 'deployed'],
      requires_prior: [
        CompletionStatus.IMPLEMENTED,
        CompletionStatus.TESTED,
        CompletionStatus.INTEGRATED,
        CompletionStatus.VALIDATED,
      ],
    },
  };

  private readonly OVERCLAIM_PATTERNS = [
    {
      pattern: /\b(complete|done|finished|ready)\b/gi,
      suggestsStatus: CompletionStatus.COMPLETE,
      commonOverclaim: 'Claiming complete when only implemented',
    },
    {
      pattern: /\b(production[-\s]?ready)\b/gi,
      suggestsStatus: CompletionStatus.COMPLETE,
      commonOverclaim: 'Claiming production-ready without validation',
    },
    {
      pattern: /\b100%\b/gi,
      suggestsStatus: CompletionStatus.COMPLETE,
      commonOverclaim: 'Claiming 100% without enumeration',
    },
    {
      pattern: /\b(validated|verified)\b/gi,
      suggestsStatus: CompletionStatus.VALIDATED,
      commonOverclaim: 'Claiming validated without realistic testing',
    },
  ];

  validate(content: string, filename: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Extract status claims
    const statusClaims = this.extractStatusClaims(content, filename);

    // Validate each claim
    for (const claim of statusClaims) {
      const validation = this.validateStatusClaim(claim, content);

      if (!validation.valid) {
        issues.push({
          severity: 'error',
          message: `Overclaim: Status "${claim.claimedStatus}" but evidence only supports "${validation.actualStatus}"`,
          location: `${filename}:${claim.lineNumber}`,
          suggestion: validation.suggestion,
        });
      }

      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings.map(w => ({
          severity: 'warning' as const,
          message: w,
          location: `${filename}:${claim.lineNumber}`,
          suggestion: 'Provide additional evidence or downgrade status claim',
        })));
      }
    }

    // Check for vague progress claims
    const vagueIssues = this.detectVagueProgress(content, filename);
    issues.push(...vagueIssues);

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  private extractStatusClaims(content: string, filename: string): StatusClaim[] {
    const claims: StatusClaim[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Look for status keywords
      for (const pattern of this.OVERCLAIM_PATTERNS) {
        const match = pattern.pattern.exec(line);
        if (match) {
          claims.push({
            claimedStatus: pattern.suggestsStatus,
            actualStatus: CompletionStatus.IMPLEMENTED, // Will be determined
            evidence: [],
            missingEvidence: [],
            lineNumber: index + 1,
          });
        }
      }

      // Look for explicit status claims
      const statusMatch = line.match(/status:\s*(\w+)/i);
      if (statusMatch) {
        const status = statusMatch[1].toLowerCase() as CompletionStatus;
        if (Object.values(CompletionStatus).includes(status)) {
          claims.push({
            claimedStatus: status,
            actualStatus: CompletionStatus.IMPLEMENTED,
            evidence: [],
            missingEvidence: [],
            lineNumber: index + 1,
          });
        }
      }
    });

    return claims;
  }

  private validateStatusClaim(
    claim: StatusClaim,
    content: string
  ): { valid: boolean; actualStatus: CompletionStatus; suggestion: string; warnings: string[] } {
    const warnings: string[] = [];
    let actualStatus = CompletionStatus.IMPLEMENTED;
    const requirements = this.STATUS_REQUIREMENTS[claim.claimedStatus];

    // Check for evidence of each status level
    for (const [status, req] of Object.entries(this.STATUS_REQUIREMENTS)) {
      const hasEvidence = this.hasEvidenceFor(content, req.evidence_keywords);

      if (hasEvidence) {
        actualStatus = status as CompletionStatus;

        // Check for required prior statuses
        if (req.requires_prior) {
          for (const priorStatus of req.requires_prior) {
            const priorReq = this.STATUS_REQUIREMENTS[priorStatus];
            const hasPriorEvidence = this.hasEvidenceFor(content, priorReq.evidence_keywords);

            if (!hasPriorEvidence) {
              warnings.push(
                `Claiming ${status} but missing evidence for prerequisite status: ${priorStatus}`
              );
            }
          }
        }
      }
    }

    const valid = this.compareStatuses(actualStatus, claim.claimedStatus) >= 0;

    let suggestion = '';
    if (!valid) {
      suggestion = this.buildSuggestion(claim.claimedStatus, actualStatus);
    }

    return { valid, actualStatus, suggestion, warnings };
  }

  private hasEvidenceFor(content: string, keywords: string[]): boolean {
    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  }

  private compareStatuses(actual: CompletionStatus, claimed: CompletionStatus): number {
    const order = [
      CompletionStatus.IMPLEMENTED,
      CompletionStatus.TESTED,
      CompletionStatus.INTEGRATED,
      CompletionStatus.VALIDATED,
      CompletionStatus.COMPLETE,
    ];

    const actualIndex = order.indexOf(actual);
    const claimedIndex = order.indexOf(claimed);

    return actualIndex - claimedIndex;
  }

  private buildSuggestion(claimed: CompletionStatus, actual: CompletionStatus): string {
    const requirements = this.STATUS_REQUIREMENTS[claimed];

    return [
      `Current evidence supports status: "${actual}"`,
      `To reach "${claimed}", provide evidence of:`,
      ...requirements.required.map(r => `  - ${r}`),
      '',
      'Or update status claim to match actual progress.',
    ].join('\n');
  }

  private detectVagueProgress(content: string, filename: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = content.split('\n');

    const vaguePatterns = [
      {
        pattern: /\b(mostly|almost|nearly|basically)\s+(done|complete|finished)/gi,
        message: 'Vague progress indicator',
        suggestion: 'Specify exact completion: "X/Y items complete, remaining: Z"',
      },
      {
        pattern: /\b(\d+)%\s+complete\b/gi,
        message: 'Percentage complete without enumeration',
        suggestion: 'List what is complete and what remains, with counts',
      },
      {
        pattern: /\b(just need to|only need to|all that\'s left)/gi,
        message: 'Minimizing remaining work',
        suggestion: 'Explicitly list all remaining work items',
      },
    ];

    lines.forEach((line, index) => {
      for (const { pattern, message, suggestion } of vaguePatterns) {
        if (pattern.test(line)) {
          issues.push({
            severity: 'error',
            message: `${message}: "${line.trim()}"`,
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

// Example usage
export function validateCompletionClaims(content: string, filename: string): ValidationResult {
  const validator = new CompletionValidator();
  return validator.validate(content, filename);
}
