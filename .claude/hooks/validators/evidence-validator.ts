/**
 * Evidence-Based Claims Validator
 * Ensures technical claims are backed by verifiable evidence
 *
 * Enforces: Truth over speed, no fabrication, evidence hierarchy
 */

interface EvidenceRequirement {
  claim: string;
  requiredEvidence: string[];
  foundEvidence: string[];
  sufficient: boolean;
}

export class EvidenceValidator {
  private readonly FORBIDDEN_PHRASES = [
    {
      phrase: 'should work',
      reason: 'Untested claim',
      replacement: 'tested to work under conditions X',
    },
    {
      phrase: 'probably works',
      reason: 'Uncertain claim',
      replacement: 'works in tested scenarios A, B, C; untested for D, E',
    },
    { phrase: 'appears to work', reason: 'Unvalidated claim', replacement: 'passes tests X, Y, Z' },
    { phrase: 'seems correct', reason: 'Unverified claim', replacement: 'verified by check X' },
    {
      phrase: 'mostly complete',
      reason: 'Vague status',
      replacement: 'implemented X/Y features, remaining: Z',
    },
    {
      phrase: 'almost done',
      reason: 'Vague status',
      replacement: 'completed items A, B, C; remaining: D, E',
    },
    {
      phrase: 'basically finished',
      reason: 'Vague status',
      replacement: 'specific completion status',
    },
    {
      phrase: 'production ready',
      reason: 'Overconfident claim',
      replacement: 'passes tests X; deployment checklist: Y% complete',
    },
  ];

  private readonly EVIDENCE_HIERARCHY = [
    {
      level: 'empirical',
      weight: 1.0,
      examples: ['measured', 'benchmarked', 'profiled', 'tested'],
    },
    {
      level: 'documented',
      weight: 0.7,
      examples: ['documented in', 'per documentation', 'according to spec'],
    },
    { level: 'inferred', weight: 0.4, examples: ['likely', 'expected', 'should', 'probably'] },
    { level: 'assumed', weight: 0.2, examples: ['assuming', 'presumably', 'appears'] },
  ];

  validate(content: string, filename: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Check for forbidden phrases
    const forbiddenIssues = this.checkForbiddenPhrases(content, filename);
    issues.push(...forbiddenIssues);

    // Check evidence quality for claims
    const evidenceIssues = this.validateClaimEvidence(content, filename);
    issues.push(...evidenceIssues);

    // Check for fabrication indicators
    const fabricationIssues = this.detectFabrication(content, filename);
    issues.push(...fabricationIssues);

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  private checkForbiddenPhrases(content: string, filename: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const { phrase, reason, replacement } of this.FORBIDDEN_PHRASES) {
        if (line.toLowerCase().includes(phrase.toLowerCase())) {
          issues.push({
            severity: 'error',
            message: `Forbidden phrase: "${phrase}" - ${reason}`,
            location: `${filename}:${index + 1}`,
            suggestion: `Replace with: "${replacement}"`,
          });
        }
      }
    });

    return issues;
  }

  private validateClaimEvidence(content: string, filename: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const claims = this.extractClaims(content);

    for (const claim of claims) {
      const evidence = this.findEvidence(content, claim);

      if (evidence.length === 0) {
        issues.push({
          severity: 'error',
          message: `Claim without evidence: "${claim.text}"`,
          location: `${filename}:${claim.lineNumber}`,
          suggestion: 'Provide verifiable evidence or remove claim',
        });
      } else {
        // Check evidence quality
        const evidenceQuality = this.assessEvidenceQuality(evidence);
        if (evidenceQuality < 0.5) {
          issues.push({
            severity: 'warning',
            message: `Weak evidence for claim: "${claim.text}"`,
            location: `${filename}:${claim.lineNumber}`,
            suggestion: 'Provide empirical evidence (measurements, tests) instead of assumptions',
          });
        }
      }
    }

    return issues;
  }

  private detectFabrication(content: string, filename: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Red flags for fabrication
    const fabricationPatterns = [
      {
        pattern: /example\s+(citation|source|reference)/gi,
        message: 'Using example citations - these must be real or removed',
      },
      {
        pattern: /placeholder\s+(data|metric|number)/gi,
        message: 'Placeholder data detected - replace with real data or remove',
      },
      {
        pattern: /\[INSERT\s+\w+\]/gi,
        message: 'Template placeholder not filled in',
      },
      {
        pattern: /TODO:?\s*(add|provide|get)\s+(citation|source|data|metric)/gi,
        message: 'Missing citation/data marked as TODO - must be completed before commit',
      },
      {
        pattern: /PMID:\s*\d{1,6}\b/gi, // PMIDs are typically 8 digits
        message: 'Suspiciously short PMID - verify this is a real citation',
      },
    ];

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      for (const { pattern, message } of fabricationPatterns) {
        if (pattern.test(line)) {
          issues.push({
            severity: 'error',
            message,
            location: `${filename}:${index + 1}`,
            suggestion: 'Replace with verified data or remove claim',
          });
        }
      }
    });

    return issues;
  }

  private extractClaims(content: string): Array<{ text: string; lineNumber: number }> {
    const claims: Array<{ text: string; lineNumber: number }> = [];
    const lines = content.split('\n');

    // Claim indicators
    const claimPatterns = [
      /\b(improves?|increases?|decreases?|reduces?|optimizes?)\b/i,
      /\b(better|faster|slower|more efficient|less complex)\b/i,
      /\b(fixes?|resolves?|solves?|addresses?)\b/i,
      /\b(implements?|adds?|provides?|enables?)\b/i,
    ];

    lines.forEach((line, index) => {
      for (const pattern of claimPatterns) {
        if (pattern.test(line)) {
          claims.push({
            text: line.trim(),
            lineNumber: index + 1,
          });
          break;
        }
      }
    });

    return claims;
  }

  private findEvidence(content: string, claim: { text: string; lineNumber: number }): string[] {
    const evidence: string[] = [];
    const lines = content.split('\n');
    const contextRange = 10; // Look 10 lines before and after

    const startLine = Math.max(0, claim.lineNumber - contextRange);
    const endLine = Math.min(lines.length, claim.lineNumber + contextRange);

    const contextLines = lines.slice(startLine, endLine);

    // Evidence indicators
    const evidencePatterns = [
      /\b(measured|tested|benchmarked|profiled|verified)\b/i,
      /\b(test output|test results|benchmark results)\b/i,
      /\b(command|tool):\s*.+/i,
      /\b(before|after|baseline|comparison)\b/i,
      /\b\d+(\.\d+)?\s*(ms|seconds|MB|GB|%)\b/i, // Measurements with units
    ];

    contextLines.forEach((line) => {
      for (const pattern of evidencePatterns) {
        if (pattern.test(line)) {
          evidence.push(line.trim());
          break;
        }
      }
    });

    return evidence;
  }

  private assessEvidenceQuality(evidence: string[]): number {
    if (evidence.length === 0) return 0;

    let totalWeight = 0;
    let count = 0;

    for (const evidenceLine of evidence) {
      for (const { examples, weight } of this.EVIDENCE_HIERARCHY) {
        for (const example of examples) {
          if (evidenceLine.toLowerCase().includes(example)) {
            totalWeight += weight;
            count++;
            break;
          }
        }
      }
    }

    return count > 0 ? totalWeight / count : 0;
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
