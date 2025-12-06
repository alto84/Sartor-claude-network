/**
 * Distributed Systems Debugging Skill
 *
 * Systematically investigates distributed system failures by reconstructing causal chains,
 * isolating failure domains, and testing hypotheses with evidence rather than assumptions.
 *
 * Based on principles from UPLIFTED_SKILLS.md:
 * - Observation Before Hypothesis: Gather evidence first, theorize second
 * - Non-Determinism is Fundamental: Same inputs may yield different outputs
 * - Isolation Reveals Root Cause: Simplify to understand
 * - Failure Injection Validates Understanding: Test your theories
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

// Declare global functions for Node.js environment
declare const console: {
  error(...args: any[]): void;
  log(...args: any[]): void;
};
declare function setTimeout(callback: (...args: any[]) => void, ms: number): any;

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SystemObservation {
  timestamp: number;
  component: string;
  type: 'log' | 'metric' | 'trace' | 'event';
  data: unknown;
  source: string;  // Where this came from
}

export interface Hypothesis {
  description: string;
  supportingEvidence: SystemObservation[];
  contradictingEvidence: SystemObservation[];
  confidence: number;  // Based on evidence ratio (0-1)
  testable: boolean;
  test?: string;  // How to test this hypothesis
}

export interface DebugReport {
  symptoms: string[];
  observations: SystemObservation[];
  hypotheses: Hypothesis[];
  rootCause?: Hypothesis;  // Only if confident (confidence >= 0.8)
  unknowns: string[];  // What we couldn't determine
  recommendations: string[];
}

export interface DataSource {
  id: string;
  type: 'logs' | 'metrics' | 'traces' | 'events';
  component: string;
  fetch: () => Promise<SystemObservation[]>;
}

export interface Test {
  id: string;
  description: string;
  execute: () => Promise<TestResult>;
}

export interface TestResult {
  success: boolean;
  observations: SystemObservation[];
  symptomReproduced: boolean;  // Did the test reproduce the symptom?
  timestamp: number;
  error?: string;
}

export interface RankedHypotheses {
  hypotheses: Hypothesis[];
  ranking: {
    hypothesis: Hypothesis;
    rank: number;
    score: number;  // Based on evidence strength
    reasoning: string;
  }[];
}

export interface DebugSession {
  id: string;
  startTime: number;
  endTime?: number;
  symptoms: string[];
  sources: DataSource[];
  observations: SystemObservation[];
  hypotheses: Hypothesis[];
  tests: Map<string, TestResult>;
  isolationSteps: IsolationStep[];
  state: 'active' | 'completed' | 'blocked';
}

export interface IsolationStep {
  description: string;
  variables: string[];  // What variables were present
  removed: string[];    // What was removed in this step
  symptomPresent: boolean;  // Was symptom still present after removal?
  timestamp: number;
}

export interface FailureInjection {
  id: string;
  description: string;
  targetComponent: string;
  failureType: 'network_delay' | 'network_partition' | 'timeout' | 'resource_exhaustion' | 'crash' | 'data_corruption';
  parameters: Record<string, unknown>;
  inject: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export interface CausalChain {
  events: SystemObservation[];
  timelineMs: number[];  // Relative timestamps from first event
  components: string[];  // Components involved in order
  confidence: number;    // How confident we are in this chain
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  // Confidence thresholds
  MIN_HYPOTHESIS_CONFIDENCE: 0.3,
  ROOT_CAUSE_CONFIDENCE_THRESHOLD: 0.8,

  // Evidence requirements
  MIN_SUPPORTING_EVIDENCE: 2,
  MAX_CONTRADICTING_EVIDENCE_RATIO: 0.3,  // Max 30% contradicting

  // Observation limits
  MAX_OBSERVATIONS_PER_SOURCE: 10000,
  OBSERVATION_TIMEOUT_MS: 30000,

  // Isolation
  MAX_ISOLATION_ITERATIONS: 10,

  // Correlation
  CORRELATION_TIME_WINDOW_MS: 1000,  // Events within 1s are considered related
};

// ============================================================================
// DistributedSystemsDebugger Class
// ============================================================================

export class DistributedSystemsDebugger {
  private sessions: Map<string, DebugSession> = new Map();
  private sessionCounter = 0;

  /**
   * Collect observations from multiple data sources systematically
   *
   * Principle: Observation Before Hypothesis
   * Anti-pattern avoided: Jumping to conclusions before gathering data
   *
   * @param sources Data sources to collect from (logs, metrics, traces, events)
   * @returns Collected observations from all sources
   */
  async collectObservations(sources: DataSource[]): Promise<SystemObservation[]> {
    const observations: SystemObservation[] = [];
    const errors: { source: string; error: string }[] = [];

    // Collect from all sources in parallel
    const collectionPromises = sources.map(async (source) => {
      try {
        const sourceObservations = await Promise.race([
          source.fetch(),
          this._timeout(DEFAULT_CONFIG.OBSERVATION_TIMEOUT_MS),
        ]);

        // Limit observations per source to prevent memory issues
        const limited = sourceObservations.slice(0, DEFAULT_CONFIG.MAX_OBSERVATIONS_PER_SOURCE);

        if (sourceObservations.length > DEFAULT_CONFIG.MAX_OBSERVATIONS_PER_SOURCE) {
          console.error(
            `Warning: Source ${source.id} returned ${sourceObservations.length} observations, ` +
            `limited to ${DEFAULT_CONFIG.MAX_OBSERVATIONS_PER_SOURCE}`
          );
        }

        observations.push(...limited);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({ source: source.id, error: errorMsg });
        console.error(`Failed to collect from source ${source.id}: ${errorMsg}`);
      }
    });

    await Promise.allSettled(collectionPromises);

    // Sort observations by timestamp for timeline analysis
    observations.sort((a, b) => a.timestamp - b.timestamp);

    return observations;
  }

  /**
   * Form hypotheses based on observations (evidence-based)
   *
   * Principle: Evidence Determines Root Cause
   * Quality gate: Every hypothesis must have supporting evidence
   *
   * @param observations Collected system observations
   * @returns Array of testable hypotheses with evidence
   */
  formHypotheses(observations: SystemObservation[]): Hypothesis[] {
    const hypotheses: Hypothesis[] = [];

    // Group observations by component to identify patterns
    const byComponent = this._groupByComponent(observations);

    // Analyze temporal patterns
    const temporalPatterns = this._findTemporalPatterns(observations);

    // Generate hypotheses based on common failure patterns

    // Pattern 1: Component-specific errors
    for (const [component, obs] of byComponent.entries()) {
      const errorObs = obs.filter(o =>
        o.type === 'log' &&
        typeof o.data === 'string' &&
        (o.data.toLowerCase().includes('error') || o.data.toLowerCase().includes('fail'))
      );

      if (errorObs.length >= DEFAULT_CONFIG.MIN_SUPPORTING_EVIDENCE) {
        hypotheses.push({
          description: `Component ${component} is experiencing internal errors`,
          supportingEvidence: errorObs,
          contradictingEvidence: [],
          confidence: this._calculateConfidence(errorObs, []),
          testable: true,
          test: `Isolate ${component} and check if errors persist. Inject test requests to ${component} and observe error rate.`,
        });
      }
    }

    // Pattern 2: Network/communication issues
    const networkRelatedObs = observations.filter(o => {
      const dataStr = JSON.stringify(o.data).toLowerCase();
      return dataStr.includes('timeout') ||
             dataStr.includes('connection') ||
             dataStr.includes('network') ||
             dataStr.includes('unreachable');
    });

    if (networkRelatedObs.length >= DEFAULT_CONFIG.MIN_SUPPORTING_EVIDENCE) {
      const components = [...new Set(networkRelatedObs.map(o => o.component))];
      hypotheses.push({
        description: `Network connectivity issues between components: ${components.join(', ')}`,
        supportingEvidence: networkRelatedObs,
        contradictingEvidence: [],
        confidence: this._calculateConfidence(networkRelatedObs, []),
        testable: true,
        test: `Inject network partition between ${components[0]} and ${components[1] || 'downstream'} to reproduce symptom.`,
      });
    }

    // Pattern 3: Resource exhaustion
    const resourceObs = observations.filter(o => {
      if (o.type !== 'metric') return false;
      const dataStr = JSON.stringify(o.data).toLowerCase();
      return dataStr.includes('memory') ||
             dataStr.includes('cpu') ||
             dataStr.includes('disk') ||
             dataStr.includes('connection pool');
    });

    if (resourceObs.length >= DEFAULT_CONFIG.MIN_SUPPORTING_EVIDENCE) {
      hypotheses.push({
        description: `Resource exhaustion in one or more components`,
        supportingEvidence: resourceObs,
        contradictingEvidence: [],
        confidence: this._calculateConfidence(resourceObs, []),
        testable: true,
        test: `Monitor resource metrics under load. Inject resource constraints to reproduce symptom.`,
      });
    }

    // Pattern 4: Temporal/timing issues (race conditions, ordering)
    if (temporalPatterns.length > 0) {
      const raceCandidates = temporalPatterns.filter(p =>
        p.events.length >= 2 &&
        (p.timelineMs[p.timelineMs.length - 1] - p.timelineMs[0]) < DEFAULT_CONFIG.CORRELATION_TIME_WINDOW_MS
      );

      if (raceCandidates.length > 0) {
        const pattern = raceCandidates[0];
        hypotheses.push({
          description: `Timing-dependent issue involving ${pattern.components.join(' -> ')} (possible race condition)`,
          supportingEvidence: pattern.events,
          contradictingEvidence: [],
          confidence: pattern.confidence,
          testable: true,
          test: `Inject delays between ${pattern.components[0]} and ${pattern.components[1]} to alter timing. If symptom disappears/changes, confirms timing dependency.`,
        });
      }
    }

    // Filter out low-confidence hypotheses
    return hypotheses.filter(h => h.confidence >= DEFAULT_CONFIG.MIN_HYPOTHESIS_CONFIDENCE);
  }

  /**
   * Test a hypothesis using controlled experiments
   *
   * Principle: Failure Injection Validates Understanding
   * Quality gate: Test must be reproducible
   *
   * @param hypothesis The hypothesis to test
   * @param test The test procedure to execute
   * @returns Test result with observations
   */
  async testHypothesis(hypothesis: Hypothesis, test: Test): Promise<TestResult> {
    console.error(`Testing hypothesis: ${hypothesis.description}`);
    console.error(`Test procedure: ${test.description}`);

    try {
      const result = await test.execute();

      // Validate that test provides observations
      if (result.observations.length === 0) {
        console.error('Warning: Test produced no observations');
      }

      // Log result
      if (result.symptomReproduced) {
        console.error('✓ Test reproduced the symptom - hypothesis supported');
      } else {
        console.error('✗ Test did not reproduce symptom - hypothesis may be incorrect');
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Test failed with error: ${errorMsg}`);

      return {
        success: false,
        observations: [],
        symptomReproduced: false,
        timestamp: Date.now(),
        error: errorMsg,
      };
    }
  }

  /**
   * Rank hypotheses by evidence strength
   *
   * Principle: Evidence Determines Root Cause
   * Measurement: Explicit scoring based on evidence quality and quantity
   *
   * @param hypotheses Array of hypotheses to rank
   * @returns Ranked hypotheses with scores and reasoning
   */
  rankHypotheses(hypotheses: Hypothesis[]): RankedHypotheses {
    const ranking = hypotheses.map((hypothesis) => {
      // Calculate score based on multiple factors
      const evidenceScore = this._scoreEvidence(hypothesis);
      const testabilityScore = hypothesis.testable ? 1.0 : 0.5;
      const confidenceScore = hypothesis.confidence;

      // Weighted combination
      const score = (evidenceScore * 0.5) + (confidenceScore * 0.3) + (testabilityScore * 0.2);

      // Generate reasoning
      const reasoning = this._generateRankingReasoning(hypothesis, score, evidenceScore);

      return {
        hypothesis,
        rank: 0,  // Will be set after sorting
        score,
        reasoning,
      };
    });

    // Sort by score (descending)
    ranking.sort((a, b) => b.score - a.score);

    // Assign ranks
    ranking.forEach((r, index) => {
      r.rank = index + 1;
    });

    return {
      hypotheses,
      ranking,
    };
  }

  /**
   * Generate comprehensive debug report
   *
   * Principle: Explicit Uncertainty (unknowns are documented)
   * Quality gate: Root cause only declared when evidence is strong
   *
   * @param session Debug session with collected data
   * @returns Structured debug report with unknowns
   */
  generateDebugReport(session: DebugSession): DebugReport {
    const ranked = this.rankHypotheses(session.hypotheses);
    const topHypothesis = ranked.ranking[0]?.hypothesis;

    // Only declare root cause if confidence is high enough
    const rootCause = topHypothesis && topHypothesis.confidence >= DEFAULT_CONFIG.ROOT_CAUSE_CONFIDENCE_THRESHOLD
      ? topHypothesis
      : undefined;

    // Identify unknowns
    const unknowns = this._identifyUnknowns(session);

    // Generate recommendations
    const recommendations = this._generateRecommendations(session, ranked, rootCause);

    return {
      symptoms: session.symptoms,
      observations: session.observations,
      hypotheses: session.hypotheses,
      rootCause,
      unknowns,
      recommendations,
    };
  }

  /**
   * Create a new debug session
   *
   * @param symptoms Observed symptoms to investigate
   * @param sources Data sources to collect from
   * @returns New debug session
   */
  createSession(symptoms: string[], sources: DataSource[]): DebugSession {
    const session: DebugSession = {
      id: `debug-session-${++this.sessionCounter}`,
      startTime: Date.now(),
      symptoms,
      sources,
      observations: [],
      hypotheses: [],
      tests: new Map(),
      isolationSteps: [],
      state: 'active',
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Perform systematic isolation to identify minimal reproduction
   *
   * Principle: Isolation Reveals Root Cause
   * Process: Remove variables systematically until symptom disappears
   *
   * @param session Debug session
   * @param variables Variables that can be isolated (components, agents, data)
   * @param checkSymptom Function to check if symptom is still present
   * @returns Isolation steps showing what's necessary for symptom
   */
  async performIsolation(
    session: DebugSession,
    variables: string[],
    checkSymptom: (remaining: string[]) => Promise<boolean>
  ): Promise<IsolationStep[]> {
    const steps: IsolationStep[] = [];
    let remaining = [...variables];

    console.error(`Starting isolation with ${variables.length} variables: ${variables.join(', ')}`);

    let iteration = 0;
    while (remaining.length > 1 && iteration < DEFAULT_CONFIG.MAX_ISOLATION_ITERATIONS) {
      iteration++;

      // Try removing each variable one at a time
      for (let i = 0; i < remaining.length; i++) {
        const toRemove = remaining[i];
        const testSet = remaining.filter((_, idx) => idx !== i);

        console.error(`Testing without: ${toRemove} (remaining: ${testSet.join(', ')})`);

        const symptomPresent = await checkSymptom(testSet);

        const step: IsolationStep = {
          description: `Removed ${toRemove}`,
          variables: [...remaining],
          removed: [toRemove],
          symptomPresent,
          timestamp: Date.now(),
        };

        steps.push(step);
        session.isolationSteps.push(step);

        if (!symptomPresent) {
          // Symptom disappeared, so this variable is necessary
          console.error(`✓ ${toRemove} is necessary for symptom (symptom disappeared without it)`);
        } else {
          // Symptom still present, so this variable is not necessary
          console.error(`✗ ${toRemove} is not necessary (symptom still present without it)`);
          remaining = testSet;
          break;
        }
      }

      // If we couldn't remove anything, we've found minimal set
      if (remaining.length === variables.length) {
        break;
      }

      variables = remaining;
    }

    console.error(`Isolation complete. Minimal reproduction requires: ${remaining.join(', ')}`);
    return steps;
  }

  /**
   * Reconstruct causal chain from observations
   *
   * Principle: Timestamps and causality matter
   * Process: Build timeline of events to understand sequence
   *
   * @param observations System observations
   * @returns Potential causal chains
   */
  reconstructCausalChains(observations: SystemObservation[]): CausalChain[] {
    const chains: CausalChain[] = [];

    // Sort by timestamp
    const sorted = [...observations].sort((a, b) => a.timestamp - b.timestamp);

    if (sorted.length === 0) {
      return chains;
    }

    // Find sequences where events are temporally related
    let currentChain: SystemObservation[] = [sorted[0]];
    let currentComponents: string[] = [sorted[0].component];

    for (let i = 1; i < sorted.length; i++) {
      const timeDiff = sorted[i].timestamp - sorted[i - 1].timestamp;

      if (timeDiff <= DEFAULT_CONFIG.CORRELATION_TIME_WINDOW_MS) {
        // Part of current chain
        currentChain.push(sorted[i]);
        if (!currentComponents.includes(sorted[i].component)) {
          currentComponents.push(sorted[i].component);
        }
      } else {
        // Start new chain if current one is significant
        if (currentChain.length >= 2 && currentComponents.length >= 2) {
          chains.push(this._buildCausalChain(currentChain, currentComponents));
        }

        currentChain = [sorted[i]];
        currentComponents = [sorted[i].component];
      }
    }

    // Add last chain if significant
    if (currentChain.length >= 2 && currentComponents.length >= 2) {
      chains.push(this._buildCausalChain(currentChain, currentComponents));
    }

    // Sort chains by confidence (descending)
    chains.sort((a, b) => b.confidence - a.confidence);

    return chains;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Complete a debug session
   */
  completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = 'completed';
      session.endTime = Date.now();
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate confidence based on evidence ratio
   *
   * Formula: confidence = supporting / (supporting + contradicting)
   * Adjustment: Reduce confidence if evidence count is low
   */
  private _calculateConfidence(
    supporting: SystemObservation[],
    contradicting: SystemObservation[]
  ): number {
    const totalEvidence = supporting.length + contradicting.length;

    if (totalEvidence === 0) {
      return 0;
    }

    // Base confidence from ratio
    const ratio = supporting.length / totalEvidence;

    // Penalty for low evidence count
    const evidencePenalty = Math.min(1, supporting.length / DEFAULT_CONFIG.MIN_SUPPORTING_EVIDENCE);

    return ratio * evidencePenalty;
  }

  /**
   * Score evidence quality and quantity
   */
  private _scoreEvidence(hypothesis: Hypothesis): number {
    const supportingCount = hypothesis.supportingEvidence.length;
    const contradictingCount = hypothesis.contradictingEvidence.length;

    // Diminishing returns for large amounts of evidence
    const supportingScore = Math.min(1, supportingCount / 10);

    // Penalty for contradicting evidence
    const contradictingPenalty = contradictingCount * 0.2;

    return Math.max(0, supportingScore - contradictingPenalty);
  }

  /**
   * Generate reasoning for hypothesis ranking
   */
  private _generateRankingReasoning(
    hypothesis: Hypothesis,
    score: number,
    _evidenceScore: number
  ): string {
    const reasons: string[] = [];

    reasons.push(`Confidence: ${(hypothesis.confidence * 100).toFixed(1)}%`);
    reasons.push(`Supporting evidence: ${hypothesis.supportingEvidence.length} observations`);

    if (hypothesis.contradictingEvidence.length > 0) {
      reasons.push(`Contradicting evidence: ${hypothesis.contradictingEvidence.length} observations`);
    }

    if (!hypothesis.testable) {
      reasons.push('Not easily testable');
    }

    reasons.push(`Overall score: ${score.toFixed(3)}`);

    return reasons.join('; ');
  }

  /**
   * Identify unknowns in the debug session
   *
   * Principle: Explicit Uncertainty
   */
  private _identifyUnknowns(session: DebugSession): string[] {
    const unknowns: string[] = [];

    // Check for missing data sources
    const componentsCovered = new Set(session.observations.map(o => o.component));
    const componentsInSymptoms = this._extractComponentsFromSymptoms(session.symptoms);

    for (const component of componentsInSymptoms) {
      if (!componentsCovered.has(component)) {
        unknowns.push(`No observations collected from component: ${component}`);
      }
    }

    // Check for untested hypotheses
    const untestedHypotheses = session.hypotheses.filter(h => {
      return h.testable && !Array.from(session.tests.keys()).some(testId =>
        testId.includes(h.description.substring(0, 20))
      );
    });

    if (untestedHypotheses.length > 0) {
      unknowns.push(`${untestedHypotheses.length} testable hypotheses remain untested`);
    }

    // Check for low observation types
    const observationTypes = new Set(session.observations.map(o => o.type));
    const expectedTypes: Array<SystemObservation['type']> = ['log', 'metric', 'trace', 'event'];

    for (const type of expectedTypes) {
      if (!observationTypes.has(type)) {
        unknowns.push(`No ${type} observations collected`);
      }
    }

    // Check for non-deterministic behavior
    if (session.isolationSteps.length > 0) {
      const inconsistentResults = session.isolationSteps.filter((step, idx, arr) => {
        return idx > 0 &&
               step.variables.length === arr[idx - 1].variables.length &&
               step.symptomPresent !== arr[idx - 1].symptomPresent;
      });

      if (inconsistentResults.length > 0) {
        unknowns.push('Non-deterministic behavior detected (same conditions produced different results)');
      }
    }

    return unknowns;
  }

  /**
   * Generate recommendations based on session state
   */
  private _generateRecommendations(
    session: DebugSession,
    ranked: RankedHypotheses,
    rootCause: Hypothesis | undefined
  ): string[] {
    const recommendations: string[] = [];

    if (rootCause) {
      recommendations.push(`HIGH CONFIDENCE: Root cause identified - ${rootCause.description}`);

      if (rootCause.test) {
        recommendations.push(`Validate fix by: ${rootCause.test}`);
      }

      recommendations.push('Create regression test to prevent recurrence');
    } else {
      const topHypothesis = ranked.ranking[0]?.hypothesis;

      if (topHypothesis) {
        recommendations.push(
          `MODERATE CONFIDENCE: Most likely cause - ${topHypothesis.description} ` +
          `(confidence: ${(topHypothesis.confidence * 100).toFixed(1)}%)`
        );

        if (topHypothesis.test) {
          recommendations.push(`Next step: ${topHypothesis.test}`);
        }
      } else {
        recommendations.push('INSUFFICIENT EVIDENCE: Collect more observations before proceeding');
      }
    }

    // Suggest additional data collection
    const observationTypes = new Set(session.observations.map(o => o.type));
    if (!observationTypes.has('trace')) {
      recommendations.push('Enable distributed tracing to capture request flow');
    }
    if (!observationTypes.has('metric')) {
      recommendations.push('Collect system metrics (CPU, memory, network) during symptom occurrence');
    }

    // Suggest isolation if not performed
    if (session.isolationSteps.length === 0) {
      recommendations.push('Perform systematic isolation to identify minimal reproduction');
    }

    return recommendations;
  }

  /**
   * Group observations by component
   */
  private _groupByComponent(observations: SystemObservation[]): Map<string, SystemObservation[]> {
    const grouped = new Map<string, SystemObservation[]>();

    for (const obs of observations) {
      const existing = grouped.get(obs.component) || [];
      existing.push(obs);
      grouped.set(obs.component, existing);
    }

    return grouped;
  }

  /**
   * Find temporal patterns in observations
   */
  private _findTemporalPatterns(observations: SystemObservation[]): CausalChain[] {
    // This is a simplified implementation
    // A real implementation would use more sophisticated pattern detection
    return this.reconstructCausalChains(observations);
  }

  /**
   * Build a causal chain from related observations
   */
  private _buildCausalChain(events: SystemObservation[], components: string[]): CausalChain {
    const startTime = events[0].timestamp;
    const timelineMs = events.map(e => e.timestamp - startTime);

    // Calculate confidence based on:
    // - Number of components involved (more = higher confidence in distributed issue)
    // - Temporal proximity (tighter clustering = higher confidence)
    // - Evidence diversity (different observation types = higher confidence)

    const componentDiversity = components.length / 5;  // Normalize to 0-1
    const typeDiversity = new Set(events.map(e => e.type)).size / 4;  // 4 types max
    const temporalTightness = 1 - (timelineMs[timelineMs.length - 1] / DEFAULT_CONFIG.CORRELATION_TIME_WINDOW_MS);

    const confidence = Math.min(1, (componentDiversity + typeDiversity + temporalTightness) / 3);

    return {
      events,
      timelineMs,
      components,
      confidence,
    };
  }

  /**
   * Extract component names from symptom descriptions
   */
  private _extractComponentsFromSymptoms(symptoms: string[]): string[] {
    // This is a simple implementation
    // A real implementation would use more sophisticated NER or pattern matching
    const components: Set<string> = new Set();

    for (const symptom of symptoms) {
      // Look for quoted component names
      const quoted = symptom.match(/"([^"]+)"/g);
      if (quoted) {
        quoted.forEach(q => components.add(q.replace(/"/g, '')));
      }

      // Look for common component keywords
      const words = symptom.split(/\s+/);
      for (const word of words) {
        if (word.includes('service') || word.includes('agent') || word.includes('server')) {
          components.add(word);
        }
      }
    }

    return Array.from(components);
  }

  /**
   * Timeout helper
   */
  private _timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a new distributed systems debugger instance
 */
export function createDebugger(): DistributedSystemsDebugger {
  return new DistributedSystemsDebugger();
}

/**
 * Create a data source from a simple fetch function
 */
export function createDataSource(
  id: string,
  component: string,
  type: DataSource['type'],
  fetchFn: () => Promise<SystemObservation[]>
): DataSource {
  return {
    id,
    type,
    component,
    fetch: fetchFn,
  };
}

/**
 * Create a test from a simple execute function
 */
export function createTest(
  id: string,
  description: string,
  executeFn: () => Promise<Omit<TestResult, 'timestamp'>>
): Test {
  return {
    id,
    description,
    execute: async () => {
      const result = await executeFn();
      return {
        ...result,
        timestamp: Date.now(),
      };
    },
  };
}

/**
 * Format debug report for display
 *
 * Principle: Evidence-based reporting with explicit unknowns
 */
export function formatDebugReport(report: DebugReport): string {
  const lines: string[] = [];

  lines.push('=== DISTRIBUTED SYSTEMS DEBUG REPORT ===');
  lines.push('');

  // Symptoms
  lines.push('SYMPTOMS:');
  report.symptoms.forEach(s => lines.push(`  - ${s}`));
  lines.push('');

  // Observations
  lines.push(`OBSERVATIONS: ${report.observations.length} total`);
  const byType = new Map<string, number>();
  const byComponent = new Map<string, number>();

  for (const obs of report.observations) {
    byType.set(obs.type, (byType.get(obs.type) || 0) + 1);
    byComponent.set(obs.component, (byComponent.get(obs.component) || 0) + 1);
  }

  lines.push('  By type:');
  byType.forEach((count, type) => lines.push(`    - ${type}: ${count}`));
  lines.push('  By component:');
  byComponent.forEach((count, component) => lines.push(`    - ${component}: ${count}`));
  lines.push('');

  // Hypotheses
  lines.push(`HYPOTHESES: ${report.hypotheses.length} generated`);
  report.hypotheses.forEach((h, idx) => {
    lines.push(`  ${idx + 1}. ${h.description}`);
    lines.push(`     Confidence: ${(h.confidence * 100).toFixed(1)}%`);
    lines.push(`     Supporting evidence: ${h.supportingEvidence.length}`);
    lines.push(`     Contradicting evidence: ${h.contradictingEvidence.length}`);
    lines.push(`     Testable: ${h.testable ? 'Yes' : 'No'}`);
    if (h.test) {
      lines.push(`     Test: ${h.test}`);
    }
  });
  lines.push('');

  // Root cause
  if (report.rootCause) {
    lines.push('ROOT CAUSE (HIGH CONFIDENCE):');
    lines.push(`  ${report.rootCause.description}`);
    lines.push(`  Confidence: ${(report.rootCause.confidence * 100).toFixed(1)}%`);
  } else {
    lines.push('ROOT CAUSE: Not determined (insufficient evidence or confidence)');
  }
  lines.push('');

  // Unknowns
  lines.push(`UNKNOWNS: ${report.unknowns.length}`);
  if (report.unknowns.length > 0) {
    report.unknowns.forEach(u => lines.push(`  - ${u}`));
  } else {
    lines.push('  (none)');
  }
  lines.push('');

  // Recommendations
  lines.push('RECOMMENDATIONS:');
  report.recommendations.forEach(r => lines.push(`  - ${r}`));

  return lines.join('\n');
}

/**
 * Create a failure injection helper
 */
export function createFailureInjection(
  id: string,
  description: string,
  targetComponent: string,
  failureType: FailureInjection['failureType'],
  parameters: Record<string, unknown>,
  injectFn: () => Promise<void>,
  cleanupFn: () => Promise<void>
): FailureInjection {
  return {
    id,
    description,
    targetComponent,
    failureType,
    parameters,
    inject: injectFn,
    cleanup: cleanupFn,
  };
}

// ============================================================================
// Export Default Instance
// ============================================================================

export default new DistributedSystemsDebugger();
