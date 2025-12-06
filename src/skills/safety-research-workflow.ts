/**
 * Safety Research Workflow Skill
 *
 * Conduct rigorous, evidence-based research with systematic validation and
 * multi-perspective analysis, producing findings that meet medical/pharmaceutical-grade
 * standards of evidence.
 *
 * Based on principles from UPLIFTED_SKILLS.md:
 * - Truth Over Speed: Better to acknowledge gaps than fabricate evidence
 * - Evidence Hierarchy: Not all sources carry equal weight
 * - Disagreement as Signal: Conflicting evidence indicates knowledge boundaries
 * - Quality Gates as Circuit Breakers: Validation checkpoints prevent error propagation
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

// ============================================================================
// Core Interfaces
// ============================================================================

export type EvidenceLevel = 'empirical' | 'documented' | 'inferred' | 'hypothetical';

export interface Source {
  identifier: string; // DOI, PMID, URL, or methodology description
  type: 'peer-reviewed' | 'documentation' | 'measurement' | 'expert-opinion' | 'ai-generated';
  title?: string;
  authors?: string[];
  year?: number;
  verifiable: boolean; // Can this source be independently verified?
  accessedAt: number; // Timestamp when source was accessed
}

export interface Evidence {
  source: Source;
  excerpt: string;
  relevance: number; // 0-1, how relevant to the claim
  credibility: number; // 0-1, based on source quality and recency
  contradicts?: string[]; // Claim IDs this evidence contradicts
  supports?: string[]; // Claim IDs this evidence supports
}

export interface ResearchClaim {
  id: string;
  statement: string;
  evidenceLevel: EvidenceLevel;
  sources: Source[];
  evidence: Evidence[];
  confidence: number; // 0-1, must be justified
  confidenceReasoning: string; // Why this confidence level
  limitations: string[]; // Explicit boundaries of this claim
  relatedClaims?: string[]; // IDs of related claims
  timestamp: number;
}

export interface Conflict {
  type: 'disagreement' | 'contradiction' | 'uncertainty' | 'evidence-gap';
  claimIds: string[];
  description: string;
  evidence: {
    supporting: Evidence[];
    contradicting: Evidence[];
  };
  resolution?: {
    type: 'resolved' | 'preserved';
    reasoning: string;
    evidence?: Evidence[]; // Additional evidence that resolved it
  };
  severity: 'minor' | 'moderate' | 'major';
  preserved: boolean; // True if we're preserving disagreement rather than forcing consensus
}

export interface ResearchPlan {
  question: string;
  decomposition: string[]; // Sub-questions to answer
  methodology: string; // How research will be conducted
  evidenceSources: string[]; // Where to look for evidence
  validationCriteria: string[]; // How to validate findings
  expectedEvidenceLevel: EvidenceLevel; // Target evidence level
  estimatedDurationMs: number;
}

export interface ResearchReport {
  question: string;
  methodology: string;
  findings: ResearchClaim[];
  conflicts: Conflict[]; // Preserved, not resolved
  synthesis: string; // Overall synthesis WITHOUT forcing false consensus
  limitations: string[]; // What we don't know
  futureWork: string[]; // What should be researched next
  confidence: number; // Overall confidence (NOT averaged)
  confidenceReasoning: string;
  metadata: {
    conductedAt: number;
    durationMs: number;
    sourcesConsulted: number;
    claimsEvaluated: number;
    conflictsIdentified: number;
  };
}

export interface GateResult {
  passed: boolean;
  gateName: string;
  issues: string[];
  severity: 'blocking' | 'warning';
  details?: Record<string, any>;
}

export interface QualityGate {
  name: string;
  check: (report: ResearchReport) => GateResult;
  severity: 'blocking' | 'warning';
  description: string;
}

export interface GateResults {
  allPassed: boolean;
  blockingFailures: GateResult[];
  warnings: GateResult[];
  results: GateResult[];
}

export interface Synthesis {
  mainFindings: string[];
  emergentInsights: string[];
  conflicts: Conflict[];
  confidence: number;
  confidenceReasoning: string;
  limitations: string[];
  recommendations: string[];
}

// ============================================================================
// Evidence Hierarchy Constants
// ============================================================================

/**
 * Evidence credibility weights based on source type
 * Following medical/pharmaceutical research standards
 */
const SOURCE_CREDIBILITY_WEIGHTS: Record<Source['type'], number> = {
  'peer-reviewed': 1.0,
  'documentation': 0.7,
  'measurement': 0.9,
  'expert-opinion': 0.6,
  'ai-generated': 0.3,
};

/**
 * Evidence level hierarchy (higher is better)
 */
const EVIDENCE_LEVEL_WEIGHTS: Record<EvidenceLevel, number> = {
  'empirical': 1.0,
  'documented': 0.7,
  'inferred': 0.4,
  'hypothetical': 0.2,
};

// ============================================================================
// Quality Gates Implementation
// ============================================================================

/**
 * Quality Gate: Truth Over Speed
 * Reject claims without adequate evidence
 */
export const TruthOverSpeedGate: QualityGate = {
  name: 'Truth Over Speed',
  description: 'Ensures all claims have adequate evidence - no fabricated sources',
  severity: 'blocking',
  check: (report: ResearchReport): GateResult => {
    const issues: string[] = [];

    report.findings.forEach((claim) => {
      // Check for placeholder sources
      const placeholderSources = claim.sources.filter((source) =>
        /\b(example|placeholder|todo|tbd|xxx|fake|test)\b/i.test(source.identifier)
      );

      if (placeholderSources.length > 0) {
        issues.push(
          `Claim "${claim.id}" has ${placeholderSources.length} placeholder source(s): ${placeholderSources
            .map((s) => s.identifier)
            .join(', ')}`
        );
      }

      // Check for claims with no sources but high confidence
      if (claim.sources.length === 0 && claim.confidence > 0.3) {
        issues.push(
          `Claim "${claim.id}" has no sources but confidence ${claim.confidence} > 0.3`
        );
      }

      // Check for empirical claims without empirical sources
      if (claim.evidenceLevel === 'empirical') {
        const hasEmpiricalSource = claim.sources.some(
          (s) => s.type === 'measurement' || s.type === 'peer-reviewed'
        );
        if (!hasEmpiricalSource) {
          issues.push(
            `Claim "${claim.id}" marked as empirical but has no measurement/peer-reviewed sources`
          );
        }
      }

      // Check for missing confidence reasoning
      if (!claim.confidenceReasoning || claim.confidenceReasoning.length < 10) {
        issues.push(`Claim "${claim.id}" lacks adequate confidence reasoning`);
      }
    });

    return {
      passed: issues.length === 0,
      gateName: 'Truth Over Speed',
      issues,
      severity: 'blocking',
    };
  },
};

/**
 * Quality Gate: Source Verification
 * All sources must be verifiable
 */
export const SourceVerificationGate: QualityGate = {
  name: 'Source Verification',
  description: 'All sources must be verifiable with proper identifiers',
  severity: 'blocking',
  check: (report: ResearchReport): GateResult => {
    const issues: string[] = [];

    report.findings.forEach((claim) => {
      claim.sources.forEach((source) => {
        // Check if source has identifier
        if (!source.identifier || source.identifier.trim().length === 0) {
          issues.push(`Source in claim "${claim.id}" missing identifier`);
        }

        // Check if source is marked as verifiable but lacks proper identifier
        if (source.verifiable) {
          const hasProperIdentifier =
            /^(doi:|pmid:|https?:\/\/|arxiv:)/i.test(source.identifier) ||
            source.identifier.includes('measured') ||
            source.identifier.includes('observed');

          if (!hasProperIdentifier) {
            issues.push(
              `Source "${source.identifier}" in claim "${claim.id}" marked verifiable but lacks proper identifier (DOI, PMID, URL, or methodology)`
            );
          }
        }

        // Check for non-verifiable sources with high weight
        if (!source.verifiable && source.type === 'ai-generated') {
          issues.push(
            `Claim "${claim.id}" relies on AI-generated source "${source.identifier}" which is not verifiable`
          );
        }
      });
    });

    return {
      passed: issues.length === 0,
      gateName: 'Source Verification',
      issues,
      severity: 'blocking',
    };
  },
};

/**
 * Quality Gate: Disagreement Preservation
 * Never force consensus when conflicts exist
 */
export const DisagreementPreservationGate: QualityGate = {
  name: 'Disagreement Preservation',
  description: 'Ensures conflicts are preserved rather than artificially resolved',
  severity: 'warning',
  check: (report: ResearchReport): GateResult => {
    const issues: string[] = [];

    // Check if conflicts exist but are all marked as resolved
    if (report.conflicts.length > 0) {
      const allResolved = report.conflicts.every(
        (c) => c.resolution && c.resolution.type === 'resolved'
      );

      if (allResolved && report.conflicts.length > 2) {
        issues.push(
          `All ${report.conflicts.length} conflicts resolved - possible forced consensus`
        );
      }

      // Check for conflicts resolved without additional evidence
      report.conflicts.forEach((conflict) => {
        if (
          conflict.resolution &&
          conflict.resolution.type === 'resolved' &&
          (!conflict.resolution.evidence || conflict.resolution.evidence.length === 0)
        ) {
          issues.push(
            `Conflict "${conflict.type}" resolved without additional evidence - may be forced consensus`
          );
        }
      });
    }

    // Check if synthesis mentions consensus despite conflicts
    if (report.conflicts.length > 0) {
      const synthesisLower = report.synthesis.toLowerCase();
      const suspiciousTerms = ['consensus', 'all agree', 'unanimous', 'everyone agrees'];

      suspiciousTerms.forEach((term) => {
        if (synthesisLower.includes(term)) {
          issues.push(
            `Synthesis mentions "${term}" despite ${report.conflicts.length} conflicts - possible false consensus`
          );
        }
      });
    }

    return {
      passed: issues.length === 0,
      gateName: 'Disagreement Preservation',
      issues,
      severity: 'warning',
    };
  },
};

/**
 * Quality Gate: Limitation Documentation
 * Explicit boundaries must be documented
 */
export const LimitationDocumentationGate: QualityGate = {
  name: 'Limitation Documentation',
  description: 'Ensures explicit boundaries and limitations are documented',
  severity: 'warning',
  check: (report: ResearchReport): GateResult => {
    const issues: string[] = [];

    // Check overall limitations
    if (report.limitations.length === 0) {
      issues.push('Report has no limitations documented - all research has limits');
    }

    // Check for generic limitations
    const genericLimitations = report.limitations.filter(
      (lim) =>
        /\b(more research needed|further study|additional investigation)\b/i.test(lim) &&
        lim.length < 50
    );

    if (genericLimitations.length > 0) {
      issues.push(
        `${genericLimitations.length} generic limitation(s) found - limitations should be specific`
      );
    }

    // Check that each claim has limitations
    const claimsWithoutLimitations = report.findings.filter(
      (claim) => claim.limitations.length === 0
    );

    if (claimsWithoutLimitations.length > 0) {
      issues.push(
        `${claimsWithoutLimitations.length} claim(s) without limitations - all claims have boundaries`
      );
    }

    // Check if limitations section is as detailed as findings
    const limitationsLength = report.limitations.join(' ').length;
    const findingsLength = report.findings.map((f) => f.statement).join(' ').length;

    if (limitationsLength < findingsLength * 0.3) {
      issues.push(
        'Limitations section is significantly shorter than findings - should be similarly detailed'
      );
    }

    return {
      passed: issues.length === 0,
      gateName: 'Limitation Documentation',
      issues,
      severity: 'warning',
    };
  },
};

/**
 * All standard quality gates
 */
export const STANDARD_QUALITY_GATES: QualityGate[] = [
  TruthOverSpeedGate,
  SourceVerificationGate,
  DisagreementPreservationGate,
  LimitationDocumentationGate,
];

// ============================================================================
// SafetyResearchWorkflow Class
// ============================================================================

export class SafetyResearchWorkflow {
  /**
   * Create a research plan from a question
   *
   * Anti-pattern detected: Starting research without a plan
   * Good pattern: Structured approach with clear methodology
   */
  createResearchPlan(
    question: string,
    options?: {
      targetEvidenceLevel?: EvidenceLevel;
      maxDurationMs?: number;
    }
  ): ResearchPlan {
    // Decompose question into sub-questions
    const decomposition = this._decompose(question);

    // Identify evidence sources
    const evidenceSources = this._identifyEvidenceSources(question);

    // Define validation criteria
    const validationCriteria = this._defineValidationCriteria(
      options?.targetEvidenceLevel || 'documented'
    );

    return {
      question,
      decomposition,
      methodology: this._defineMethodology(question, options?.targetEvidenceLevel),
      evidenceSources,
      validationCriteria,
      expectedEvidenceLevel: options?.targetEvidenceLevel || 'documented',
      estimatedDurationMs: options?.maxDurationMs || 60000,
    };
  }

  /**
   * Evaluate a claim with evidence
   *
   * Anti-pattern detected: Claims without evidence levels
   * Good pattern: Explicit evidence hierarchy and confidence calculation
   */
  evaluateClaim(
    statement: string,
    evidence: Evidence[],
    options?: {
      requiredEvidenceLevel?: EvidenceLevel;
    }
  ): ResearchClaim {
    const id = this._generateClaimId(statement);

    // Extract sources from evidence
    const sources = evidence.map((e) => e.source);

    // Determine evidence level based on sources
    const evidenceLevel = this._determineEvidenceLevel(sources);

    // Calculate confidence based on evidence quality and quantity
    const { confidence, reasoning } = this._calculateConfidence(evidence, evidenceLevel);

    // Identify limitations
    const limitations = this._identifyLimitations(statement, evidence, evidenceLevel);

    return {
      id,
      statement,
      evidenceLevel,
      sources,
      evidence,
      confidence,
      confidenceReasoning: reasoning,
      limitations,
      timestamp: Date.now(),
    };
  }

  /**
   * Run quality gates on a research report
   *
   * Anti-pattern detected: Skipping validation
   * Good pattern: Systematic quality checks before accepting results
   */
  runQualityGates(
    report: ResearchReport,
    gates: QualityGate[] = STANDARD_QUALITY_GATES
  ): GateResults {
    const results: GateResult[] = gates.map((gate) => gate.check(report));

    const blockingFailures = results.filter((r) => !r.passed && r.severity === 'blocking');
    const warnings = results.filter((r) => !r.passed && r.severity === 'warning');

    return {
      allPassed: blockingFailures.length === 0,
      blockingFailures,
      warnings,
      results,
    };
  }

  /**
   * Identify conflicts between claims
   *
   * Anti-pattern detected: Ignoring contradictory evidence
   * Good pattern: Preserve and document disagreements
   */
  identifyConflicts(claims: ResearchClaim[]): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check for claims that contradict each other
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const claim1 = claims[i];
        const claim2 = claims[j];

        // Check if evidence from one claim contradicts the other
        const contradictingEvidence = claim1.evidence.filter((e) =>
          e.contradicts?.includes(claim2.id)
        );

        if (contradictingEvidence.length > 0) {
          conflicts.push({
            type: 'contradiction',
            claimIds: [claim1.id, claim2.id],
            description: `Evidence contradicts between "${claim1.statement}" and "${claim2.statement}"`,
            evidence: {
              supporting: claim1.evidence,
              contradicting: contradictingEvidence,
            },
            severity: 'major',
            preserved: true,
          });
        }

        // Check for claims with opposing conclusions
        if (this._areOpposing(claim1.statement, claim2.statement)) {
          conflicts.push({
            type: 'disagreement',
            claimIds: [claim1.id, claim2.id],
            description: `Conflicting conclusions: "${claim1.statement}" vs "${claim2.statement}"`,
            evidence: {
              supporting: claim1.evidence,
              contradicting: claim2.evidence,
            },
            severity: claim1.confidence > 0.7 && claim2.confidence > 0.7 ? 'major' : 'moderate',
            preserved: true,
          });
        }
      }
    }

    // Check for uncertainty (low confidence across multiple claims on same topic)
    const uncertainClaims = claims.filter((c) => c.confidence < 0.5);
    if (uncertainClaims.length >= 2) {
      conflicts.push({
        type: 'uncertainty',
        claimIds: uncertainClaims.map((c) => c.id),
        description: `High uncertainty across ${uncertainClaims.length} claims - knowledge gap detected`,
        evidence: {
          supporting: [],
          contradicting: [],
        },
        severity: 'moderate',
        preserved: true,
      });
    }

    return conflicts;
  }

  /**
   * Synthesize findings without forcing false consensus
   *
   * Anti-pattern detected: Averaging opinions without basis
   * Good pattern: Acknowledge conflicts, preserve disagreements
   */
  synthesizeFindings(claims: ResearchClaim[]): Synthesis {
    const conflicts = this.identifyConflicts(claims);

    // Group claims by topic/theme (simplified - would use NLP in production)
    const mainFindings = claims
      .filter((c) => c.confidence > 0.6)
      .map((c) => `${c.statement} (confidence: ${c.confidence.toFixed(2)}, ${c.evidenceLevel})`);

    // Identify emergent insights (not present in individual claims)
    const emergentInsights = this._identifyEmergentInsights(claims, conflicts);

    // Calculate overall confidence WITHOUT averaging
    const { confidence, reasoning } = this._synthesizeConfidence(claims, conflicts);

    // Aggregate limitations
    const limitations = Array.from(
      new Set(claims.flatMap((c) => c.limitations).concat(this._synthesizeLimitations(conflicts)))
    );

    // Generate recommendations
    const recommendations = this._generateRecommendations(claims, conflicts);

    return {
      mainFindings,
      emergentInsights,
      conflicts,
      confidence,
      confidenceReasoning: reasoning,
      limitations,
      recommendations,
    };
  }

  /**
   * Create a complete research report
   */
  createResearchReport(
    question: string,
    methodology: string,
    findings: ResearchClaim[],
    options?: {
      customGates?: QualityGate[];
    }
  ): ResearchReport {
    const startTime = Date.now();

    // Identify conflicts
    const conflicts = this.identifyConflicts(findings);

    // Synthesize findings
    const synthesis = this.synthesizeFindings(findings);

    // Create report
    const report: ResearchReport = {
      question,
      methodology,
      findings,
      conflicts,
      synthesis: this._formatSynthesis(synthesis),
      limitations: synthesis.limitations,
      futureWork: this._identifyFutureWork(findings, conflicts),
      confidence: synthesis.confidence,
      confidenceReasoning: synthesis.confidenceReasoning,
      metadata: {
        conductedAt: startTime,
        durationMs: Date.now() - startTime,
        sourcesConsulted: this._countUniqueSources(findings),
        claimsEvaluated: findings.length,
        conflictsIdentified: conflicts.length,
      },
    };

    return report;
  }

  /**
   * Validate a research report against quality gates
   */
  validateReport(
    report: ResearchReport,
    gates?: QualityGate[]
  ): { valid: boolean; results: GateResults } {
    const results = this.runQualityGates(report, gates);

    return {
      valid: results.allPassed,
      results,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private _decompose(question: string): string[] {
    // Simplified decomposition - production would use more sophisticated NLP
    const subQuestions: string[] = [];

    // Add sub-questions based on question structure
    if (question.includes('better') || question.includes('vs')) {
      subQuestions.push('What are the alternatives?');
      subQuestions.push('What are the comparative metrics?');
      subQuestions.push('What are the use case constraints?');
    }

    if (question.includes('how') || question.includes('why')) {
      subQuestions.push('What is the mechanism/process?');
      subQuestions.push('What evidence supports this?');
      subQuestions.push('What are the exceptions?');
    }

    subQuestions.push('What are the limitations of current knowledge?');

    return subQuestions;
  }

  private _identifyEvidenceSources(_question: string): string[] {
    // Default evidence sources for research
    return [
      'Peer-reviewed literature',
      'Official documentation',
      'Empirical measurements',
      'Expert consensus',
      'Case studies',
    ];
  }

  private _defineValidationCriteria(evidenceLevel: EvidenceLevel): string[] {
    const baseCriteria = [
      'All sources must be verifiable',
      'Claims must have confidence reasoning',
      'Limitations must be documented',
    ];

    if (evidenceLevel === 'empirical') {
      baseCriteria.push('Empirical measurements required');
      baseCriteria.push('Peer-reviewed sources preferred');
    }

    return baseCriteria;
  }

  private _defineMethodology(_question: string, evidenceLevel?: EvidenceLevel): string {
    return `Systematic evidence-based research following medical/pharmaceutical standards. Target evidence level: ${
      evidenceLevel || 'documented'
    }. Quality gates: Truth Over Speed, Source Verification, Disagreement Preservation, Limitation Documentation.`;
  }

  private _generateClaimId(statement: string): string {
    // Simple ID generation - production would use better hashing
    return `claim_${statement.substring(0, 20).replace(/\s+/g, '_')}_${Date.now()}`;
  }

  private _determineEvidenceLevel(sources: Source[]): EvidenceLevel {
    if (sources.length === 0) {
      return 'hypothetical';
    }

    // Check for empirical sources
    const hasEmpirical = sources.some(
      (s) => s.type === 'measurement' || s.type === 'peer-reviewed'
    );
    if (hasEmpirical) {
      return 'empirical';
    }

    // Check for documented sources
    const hasDocumented = sources.some((s) => s.type === 'documentation' && s.verifiable);
    if (hasDocumented) {
      return 'documented';
    }

    // Check for expert opinion
    const hasExpertOpinion = sources.some((s) => s.type === 'expert-opinion');
    if (hasExpertOpinion) {
      return 'inferred';
    }

    return 'hypothetical';
  }

  private _calculateConfidence(
    evidence: Evidence[],
    evidenceLevel: EvidenceLevel
  ): { confidence: number; reasoning: string } {
    if (evidence.length === 0) {
      return {
        confidence: 0.1,
        reasoning: 'No evidence provided - minimal confidence',
      };
    }

    // Calculate based on evidence quality and quantity
    const evidenceLevelWeight = EVIDENCE_LEVEL_WEIGHTS[evidenceLevel];

    // Average credibility of evidence
    const avgCredibility = evidence.reduce((sum, e) => sum + e.credibility, 0) / evidence.length;

    // Quantity factor (diminishing returns after 5 pieces of evidence)
    const quantityFactor = Math.min(1.0, evidence.length / 5);

    // Combined confidence
    const confidence = evidenceLevelWeight * avgCredibility * quantityFactor;

    const reasoning = `Confidence ${confidence.toFixed(
      2
    )} based on: evidence level (${evidenceLevel}, weight ${evidenceLevelWeight}), ${
      evidence.length
    } evidence pieces, average credibility ${avgCredibility.toFixed(2)}`;

    return { confidence: Math.min(1.0, confidence), reasoning };
  }

  private _identifyLimitations(
    _statement: string,
    evidence: Evidence[],
    evidenceLevel: EvidenceLevel
  ): string[] {
    const limitations: string[] = [];

    // Evidence level limitations
    if (evidenceLevel === 'hypothetical') {
      limitations.push('Claim is hypothetical - requires empirical validation');
    } else if (evidenceLevel === 'inferred') {
      limitations.push('Claim is inferred - direct measurement would strengthen');
    } else if (evidenceLevel === 'documented') {
      limitations.push('Based on documentation - independent verification recommended');
    }

    // Evidence quantity limitations
    if (evidence.length < 3) {
      limitations.push(`Limited evidence base (${evidence.length} sources) - additional sources needed`);
    }

    // Recency limitations
    const oldSources = evidence.filter(
      (e) => e.source.year && e.source.year < new Date().getFullYear() - 5
    );
    if (oldSources.length > 0) {
      limitations.push(`${oldSources.length} source(s) over 5 years old - may be outdated`);
    }

    // Non-verifiable sources
    const nonVerifiable = evidence.filter((e) => !e.source.verifiable);
    if (nonVerifiable.length > 0) {
      limitations.push(`${nonVerifiable.length} source(s) not independently verifiable`);
    }

    return limitations;
  }

  private _areOpposing(statement1: string, statement2: string): boolean {
    // Simplified opposition detection - production would use NLP
    const s1Lower = statement1.toLowerCase();
    const s2Lower = statement2.toLowerCase();

    // Check for direct negation
    if (
      (s1Lower.includes('not') && !s2Lower.includes('not')) ||
      (!s1Lower.includes('not') && s2Lower.includes('not'))
    ) {
      return true;
    }

    // Check for opposing terms
    const opposingPairs = [
      ['faster', 'slower'],
      ['better', 'worse'],
      ['more', 'less'],
      ['increase', 'decrease'],
      ['yes', 'no'],
    ];

    for (const [term1, term2] of opposingPairs) {
      if (
        (s1Lower.includes(term1) && s2Lower.includes(term2)) ||
        (s1Lower.includes(term2) && s2Lower.includes(term1))
      ) {
        return true;
      }
    }

    return false;
  }

  private _identifyEmergentInsights(claims: ResearchClaim[], conflicts: Conflict[]): string[] {
    const insights: string[] = [];

    // Insight from conflicts
    if (conflicts.length > 0) {
      insights.push(
        `Research reveals ${conflicts.length} knowledge boundaries where evidence conflicts or is uncertain`
      );
    }

    // Insight from evidence levels
    const empiricalCount = claims.filter((c) => c.evidenceLevel === 'empirical').length;
    if (empiricalCount > 0) {
      insights.push(
        `${empiricalCount}/${claims.length} claims supported by empirical evidence (${(
          (empiricalCount / claims.length) *
          100
        ).toFixed(0)}%)`
      );
    }

    // Insight from confidence distribution
    const highConfidence = claims.filter((c) => c.confidence > 0.7).length;
    const lowConfidence = claims.filter((c) => c.confidence < 0.4).length;

    if (highConfidence > 0 && lowConfidence > 0) {
      insights.push(
        `Mixed confidence: ${highConfidence} high-confidence claims, ${lowConfidence} low-confidence claims - indicates partial knowledge`
      );
    }

    return insights;
  }

  private _synthesizeConfidence(
    claims: ResearchClaim[],
    conflicts: Conflict[]
  ): { confidence: number; reasoning: string } {
    if (claims.length === 0) {
      return {
        confidence: 0,
        reasoning: 'No claims to synthesize',
      };
    }

    // Calculate minimum confidence (conservative approach)
    const minConfidence = Math.min(...claims.map((c) => c.confidence));

    // Calculate average confidence
    const avgConfidence = claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length;

    // Penalty for conflicts
    const conflictPenalty = conflicts.filter((c) => c.severity === 'major').length * 0.1;

    // Use weighted approach: favor minimum but consider average
    const baseConfidence = minConfidence * 0.6 + avgConfidence * 0.4;
    const finalConfidence = Math.max(0, baseConfidence - conflictPenalty);

    const reasoning = `Synthesized confidence ${finalConfidence.toFixed(
      2
    )} based on: minimum claim confidence ${minConfidence.toFixed(
      2
    )}, average ${avgConfidence.toFixed(2)}, ${conflicts.length} conflicts (penalty: -${conflictPenalty.toFixed(
      2
    )}). NOT averaged - uses conservative approach.`;

    return { confidence: finalConfidence, reasoning };
  }

  private _synthesizeLimitations(conflicts: Conflict[]): string[] {
    const limitations: string[] = [];

    const majorConflicts = conflicts.filter((c) => c.severity === 'major');
    if (majorConflicts.length > 0) {
      limitations.push(
        `${majorConflicts.length} major conflicts indicate significant knowledge boundaries`
      );
    }

    const uncertaintyConflicts = conflicts.filter((c) => c.type === 'uncertainty');
    if (uncertaintyConflicts.length > 0) {
      limitations.push('Multiple areas of high uncertainty detected - further research critical');
    }

    return limitations;
  }

  private _generateRecommendations(claims: ResearchClaim[], conflicts: Conflict[]): string[] {
    const recommendations: string[] = [];

    // Recommend based on low confidence claims
    const lowConfidenceClaims = claims.filter((c) => c.confidence < 0.5);
    if (lowConfidenceClaims.length > 0) {
      recommendations.push(
        `Strengthen evidence for ${lowConfidenceClaims.length} low-confidence claims`
      );
    }

    // Recommend based on conflicts
    const unresolvedConflicts = conflicts.filter((c) => c.preserved && c.severity === 'major');
    if (unresolvedConflicts.length > 0) {
      recommendations.push(
        `Investigate ${unresolvedConflicts.length} major conflicts with additional research`
      );
    }

    // Recommend based on evidence gaps
    const hypotheticalClaims = claims.filter((c) => c.evidenceLevel === 'hypothetical');
    if (hypotheticalClaims.length > 0) {
      recommendations.push(
        `Validate ${hypotheticalClaims.length} hypothetical claims with empirical evidence`
      );
    }

    return recommendations;
  }

  private _identifyFutureWork(claims: ResearchClaim[], conflicts: Conflict[]): string[] {
    const futureWork: string[] = [];

    // Future work from limitations
    const allLimitations = claims.flatMap((c) => c.limitations);
    const uniqueLimitations = Array.from(new Set(allLimitations));

    uniqueLimitations.slice(0, 3).forEach((limitation) => {
      futureWork.push(`Address: ${limitation}`);
    });

    // Future work from conflicts
    conflicts
      .filter((c) => c.severity === 'major' && c.preserved)
      .forEach((conflict) => {
        futureWork.push(`Resolve conflict: ${conflict.description}`);
      });

    return futureWork;
  }

  private _formatSynthesis(synthesis: Synthesis): string {
    const parts: string[] = [];

    if (synthesis.mainFindings.length > 0) {
      parts.push('Main Findings:');
      synthesis.mainFindings.forEach((f, i) => {
        parts.push(`${i + 1}. ${f}`);
      });
    }

    if (synthesis.emergentInsights.length > 0) {
      parts.push('\nEmergent Insights:');
      synthesis.emergentInsights.forEach((insight) => {
        parts.push(`- ${insight}`);
      });
    }

    if (synthesis.conflicts.length > 0) {
      parts.push(`\nConflicts Identified: ${synthesis.conflicts.length}`);
      synthesis.conflicts
        .filter((c) => c.severity === 'major')
        .forEach((conflict) => {
          parts.push(`- ${conflict.description} [${conflict.type}, preserved]`);
        });
    }

    parts.push(`\nOverall Confidence: ${synthesis.confidence.toFixed(2)}`);
    parts.push(`Reasoning: ${synthesis.confidenceReasoning}`);

    return parts.join('\n');
  }

  private _countUniqueSources(claims: ResearchClaim[]): number {
    const uniqueIdentifiers = new Set<string>();
    claims.forEach((claim) => {
      claim.sources.forEach((source) => {
        uniqueIdentifiers.add(source.identifier);
      });
    });
    return uniqueIdentifiers.size;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a new research workflow instance
 */
export function createResearchWorkflow(): SafetyResearchWorkflow {
  return new SafetyResearchWorkflow();
}

/**
 * Create a source with validation
 */
export function createSource(
  identifier: string,
  type: Source['type'],
  options?: Partial<Omit<Source, 'identifier' | 'type'>>
): Source {
  // Validate identifier format
  const verifiable =
    /^(doi:|pmid:|https?:\/\/|arxiv:)/i.test(identifier) ||
    identifier.includes('measured') ||
    identifier.includes('observed') ||
    options?.verifiable === true;

  return {
    identifier,
    type,
    verifiable,
    accessedAt: Date.now(),
    ...options,
  };
}

/**
 * Create evidence with validation
 */
export function createEvidence(
  source: Source,
  excerpt: string,
  options?: Partial<Omit<Evidence, 'source' | 'excerpt'>>
): Evidence {
  // Calculate default credibility based on source type
  const defaultCredibility = SOURCE_CREDIBILITY_WEIGHTS[source.type] || 0.5;

  return {
    source,
    excerpt,
    relevance: options?.relevance ?? 0.8,
    credibility: options?.credibility ?? defaultCredibility,
    ...options,
  };
}

/**
 * Format gate results for display
 */
export function formatGateResults(results: GateResults): string {
  const lines: string[] = [];

  lines.push(`Quality Gate Results: ${results.allPassed ? 'PASSED' : 'FAILED'}`);
  lines.push(`Blocking Failures: ${results.blockingFailures.length}`);
  lines.push(`Warnings: ${results.warnings.length}`);
  lines.push('');

  if (results.blockingFailures.length > 0) {
    lines.push('BLOCKING FAILURES:');
    results.blockingFailures.forEach((failure, i) => {
      lines.push(`${i + 1}. ${failure.gateName}`);
      failure.issues.forEach((issue) => {
        lines.push(`   - ${issue}`);
      });
      lines.push('');
    });
  }

  if (results.warnings.length > 0) {
    lines.push('WARNINGS:');
    results.warnings.forEach((warning, i) => {
      lines.push(`${i + 1}. ${warning.gateName}`);
      warning.issues.forEach((issue) => {
        lines.push(`   - ${issue}`);
      });
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Format research report for display
 */
export function formatResearchReport(report: ResearchReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('RESEARCH REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Question: ${report.question}`);
  lines.push(`Methodology: ${report.methodology}`);
  lines.push('');
  lines.push(`Findings: ${report.findings.length} claims`);
  lines.push(`Conflicts: ${report.conflicts.length}`);
  lines.push(`Overall Confidence: ${report.confidence.toFixed(2)}`);
  lines.push('');
  lines.push('SYNTHESIS:');
  lines.push(report.synthesis);
  lines.push('');
  lines.push('LIMITATIONS:');
  report.limitations.forEach((lim, i) => {
    lines.push(`${i + 1}. ${lim}`);
  });
  lines.push('');
  lines.push('FUTURE WORK:');
  report.futureWork.forEach((work, i) => {
    lines.push(`${i + 1}. ${work}`);
  });
  lines.push('');
  lines.push('METADATA:');
  lines.push(`  Conducted: ${new Date(report.metadata.conductedAt).toISOString()}`);
  lines.push(`  Duration: ${report.metadata.durationMs}ms`);
  lines.push(`  Sources Consulted: ${report.metadata.sourcesConsulted}`);
  lines.push(`  Claims Evaluated: ${report.metadata.claimsEvaluated}`);
  lines.push(`  Conflicts Identified: ${report.metadata.conflictsIdentified}`);
  lines.push('='.repeat(80));

  return lines.join('\n');
}

// ============================================================================
// Export Default Instance
// ============================================================================

export default new SafetyResearchWorkflow();
