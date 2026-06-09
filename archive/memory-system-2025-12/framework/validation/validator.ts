/**
 * Validation Engine - Evidence-based validation for agent outputs
 *
 * Implements anti-fabrication protocols from CLAUDE.md
 */

// Types
interface ValidationResult {
  valid: boolean;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: { start: number; end: number };
}

interface ValidationReport {
  content: string;
  timestamp: string;
  results: ValidationResult[];
  passed: boolean;
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// Banned language patterns (from CLAUDE.md) - expanded based on FRAMEWORK_AUDIT.md
const BANNED_SUPERLATIVES = [
  'exceptional',
  'outstanding',
  'world-class',
  'industry-leading',
  'best-in-class',
  'cutting-edge',
  'revolutionary',
  'groundbreaking',
  // Added based on audit recommendations
  'superior',
  'remarkable',
  'excellent',
  'brilliant',
  'phenomenal',
  'state-of-the-art',
  'top-tier',
  'premium',
  'elite',
  'unparalleled',
  'unmatched',
  'incomparable',
  'flawless',
  'perfect',
];

// Score fabrication patterns
const SCORE_PATTERNS = [
  /(\d{1,3})%/g,                    // Percentage scores
  /(\d+\.?\d*)\/(\d+)/g,           // X/Y scores
  /score[:\s]+(\d+)/gi,            // Explicit scores
  /rating[:\s]+(\d+)/gi,           // Ratings
  /grade[:\s]+[A-F][+-]?/gi,       // Letter grades
];

// Required uncertainty phrases
const UNCERTAINTY_PHRASES = [
  'cannot determine without',
  'no empirical evidence',
  'preliminary observation',
  'requires external validation',
  'limitations include',
  'uncertain',
  'approximately',
  'estimated',
];

// Valid citation format patterns
const CITATION_FORMATS = {
  // [Author, Year] or [Author et al., Year]
  authorYear: /\[([A-Z][a-zA-Z'-]+(?:\s+(?:et\s+al\.|&\s+[A-Z][a-zA-Z'-]+))?),?\s*(\d{4}[a-z]?)\]/g,
  // Numbered citations [1], [1,2], [1-3]
  numbered: /\[(\d+(?:[,\-]\d+)*)\]/g,
  // DOI format
  doi: /doi:\s*10\.\d{4,}\/[^\s]+/gi,
  // arXiv format
  arxiv: /arXiv:\d{4}\.\d{4,5}/g,
  // URL citations
  url: /https?:\/\/[^\s\]]+/g,
};

// Hedge word categories for hedgingBalance rule
const HEDGE_WORDS = {
  modal: ['might', 'may', 'could', 'would', 'should', 'possibly', 'perhaps'],
  qualifier: ['approximately', 'roughly', 'about', 'around', 'nearly', 'almost'],
  epistemic: ['appears', 'seems', 'suggests', 'indicates', 'likely', 'probably'],
  conditional: ['assuming', 'provided', 'given that', 'under certain conditions'],
  uncertainty: ['uncertain', 'unclear', 'unknown', 'tentative', 'preliminary'],
};

// Types for consistency checking
interface NumericClaim {
  metric: string;
  value: number;
  unit?: string;
  context: string;
  location: { start: number; end: number };
}

// Types for source verification
interface SourceClaim {
  claim: string;
  source: string;
  sourceType: 'author-year' | 'url' | 'doi' | 'arxiv' | 'unknown';
  claimType: 'numerical' | 'absolute' | 'comparison' | 'general';
  location: { start: number; end: number };
}

// Types for hedging analysis
interface HedgingAnalysis {
  text: string;
  hedgeWords: string[];
  hedgeCount: number;
  wordCount: number;
  hedgeDensity: number;
  isExcessive: boolean;
  location: { start: number; end: number };
}

// Unicode normalization to prevent bypass attempts
// Addresses vulnerability identified in FRAMEWORK_AUDIT.md
function normalizeInput(content: string): string {
  return content
    // Normalize Unicode percent signs to ASCII %
    .replace(/٪/g, '%')       // Arabic percent sign
    .replace(/％/g, '%')      // Fullwidth percent sign
    .replace(/﹪/g, '%')      // Small percent sign
    // Normalize fullwidth digits to ASCII
    .replace(/０/g, '0').replace(/１/g, '1').replace(/２/g, '2')
    .replace(/３/g, '3').replace(/４/g, '4').replace(/５/g, '5')
    .replace(/６/g, '6').replace(/７/g, '7').replace(/８/g, '8')
    .replace(/９/g, '9')
    // Remove zero-width characters (potential obfuscation)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize Unicode spaces to ASCII space
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
}

// Helper functions for consistencyCheck rule
function extractNumericClaims(content: string): NumericClaim[] {
  const claims: NumericClaim[] = [];

  // Pattern: [metric word] + [is/achieves/shows/etc] + [number] + [optional unit]
  const claimPattern = /\b(accuracy|performance|speed|rate|score|precision|recall|f1|throughput|latency|efficiency|coverage|quality)\b[:\s]+(?:is|achieves?|shows?|of|at|:)?\s*(\d+\.?\d*)\s*(%|ms|x|\/\d+)?/gi;

  const matches = content.matchAll(claimPattern);

  for (const match of matches) {
    const metric = match[1].toLowerCase();
    const value = parseFloat(match[2]);
    const unit = match[3] || '';
    const start = match.index!;
    const end = start + match[0].length;

    claims.push({
      metric,
      value,
      unit,
      context: content.slice(
        Math.max(0, start - 100),
        Math.min(content.length, end + 100)
      ),
      location: { start, end },
    });
  }

  return claims;
}

function groupByMetric(claims: NumericClaim[]): Record<string, NumericClaim[]> {
  // Normalize similar metric names
  const normalizations: Record<string, string> = {
    'acc': 'accuracy',
    'perf': 'performance',
    'correct': 'accuracy',
    'pass': 'rate',
    'fail': 'rate',
  };

  const groups: Record<string, NumericClaim[]> = {};

  for (const claim of claims) {
    const normalized = normalizations[claim.metric] || claim.metric;
    if (!groups[normalized]) groups[normalized] = [];
    groups[normalized].push(claim);
  }

  return groups;
}

function checkContextDifference(claims: NumericClaim[]): boolean {
  // Keywords that indicate different contexts (legitimate variation)
  const differentiators = [
    'training', 'test', 'validation',
    'before', 'after',
    'baseline', 'improved', 'optimized',
    'version', 'v1', 'v2',
    'dataset a', 'dataset b',
    'scenario', 'case',
  ];

  // Check if contexts contain differentiating keywords
  const contexts = claims.map(c => c.context.toLowerCase());

  // Strategy 1: Check if some contexts have a differentiator and others don't
  for (const diff of differentiators) {
    const matchCount = contexts.filter(ctx => ctx.includes(diff)).length;
    if (matchCount > 0 && matchCount < contexts.length) {
      return true;
    }
  }

  // Strategy 2: Check for presence of contrasting pairs
  // If we see both "training" and "test", or "before" and "after", it's a comparison
  const contrastPairs = [
    ['training', 'test'],
    ['training', 'validation'],
    ['test', 'validation'],
    ['before', 'after'],
    ['baseline', 'improved'],
    ['baseline', 'optimized'],
    ['v1', 'v2'],
  ];

  const fullContext = contexts.join(' ');
  for (const [first, second] of contrastPairs) {
    if (fullContext.includes(first) && fullContext.includes(second)) {
      return true; // Contrasting contexts present - justified variation
    }
  }

  // Strategy 3: Check if individual claim contexts (local) have different keywords
  // Use a narrower window - just 30 chars before the match to avoid overlap
  const localContexts = claims.map(c => {
    const startIdx = c.context.indexOf(c.metric);
    if (startIdx === -1) return c.context;
    // Get 30 chars before the metric word
    const localStart = Math.max(0, startIdx - 30);
    return c.context.slice(localStart, startIdx + 50).toLowerCase();
  });

  const localKeywords = localContexts.map(ctx => {
    return differentiators.filter(diff => ctx.includes(diff));
  });

  // If contexts have different local keywords, it's justified
  if (localKeywords.every(keywords => keywords.length > 0)) {
    const firstSet = localKeywords[0].sort().join(',');
    for (let i = 1; i < localKeywords.length; i++) {
      const currentSet = localKeywords[i].sort().join(',');
      if (currentSet !== firstSet) {
        return true; // Different local keywords - justified variation
      }
    }
  }

  return false;
}

// Helper functions for sourceVerification rule
function extractSourceClaims(content: string): SourceClaim[] {
  const claims: SourceClaim[] = [];

  // Pattern 1: "According to [source], [claim]"
  const pattern1 = /according to\s+([^,]+(?:\[[^\]]+\])?),?\s+([^.]+)/gi;

  // Pattern 2: "[Claim] [citation]"
  const pattern2 = /([^.]+)\s+(\[[^\]]+\]|\(https?:\/\/[^)]+\))/gi;

  // Pattern 3: "Source shows/indicates/finds [claim]"
  const pattern3 = /(\[[^\]]+\]|https?:\/\/\S+)\s+(shows?|indicates?|finds?|reports?)\s+([^.]+)/gi;

  // Extract from pattern1
  let matches = content.matchAll(pattern1);
  for (const match of matches) {
    claims.push({
      claim: match[2],
      source: match[1],
      sourceType: classifySourceType(match[1]),
      claimType: classifyClaimType(match[2]),
      location: { start: match.index!, end: match.index! + match[0].length },
    });
  }

  // Extract from pattern2
  matches = content.matchAll(pattern2);
  for (const match of matches) {
    claims.push({
      claim: match[1],
      source: match[2],
      sourceType: classifySourceType(match[2]),
      claimType: classifyClaimType(match[1]),
      location: { start: match.index!, end: match.index! + match[0].length },
    });
  }

  // Extract from pattern3
  matches = content.matchAll(pattern3);
  for (const match of matches) {
    claims.push({
      claim: match[3],
      source: match[1],
      sourceType: classifySourceType(match[1]),
      claimType: classifyClaimType(match[3]),
      location: { start: match.index!, end: match.index! + match[0].length },
    });
  }

  return claims;
}

function classifySourceType(source: string): SourceClaim['sourceType'] {
  if (/\[[\w-]+\s+et\s+al\.?,\s*\d{4}\]/.test(source)) return 'author-year';
  if (/\[[\w-]+,\s*\d{4}\]/.test(source)) return 'author-year';
  if (/https?:\/\//.test(source)) return 'url';
  if (/doi:\s*10\.\d+/.test(source)) return 'doi';
  if (/arxiv:\d{4}\.\d{4,5}/i.test(source)) return 'arxiv';
  return 'unknown';
}

function classifyClaimType(claim: string): SourceClaim['claimType'] {
  if (/\d+\.?\d*\s*%/.test(claim)) return 'numerical';
  if (/always|never|all|none|every|100%|0%/i.test(claim)) return 'absolute';
  if (/better|worse|faster|slower|more|less/i.test(claim)) return 'comparison';
  return 'general';
}

function checkStrongEvidence(sc: SourceClaim): boolean {
  // Strong evidence = URL, DOI, or arXiv (verifiable)
  return sc.sourceType === 'url' ||
         sc.sourceType === 'doi' ||
         sc.sourceType === 'arxiv';
}

function detectSuspiciousPatterns(sc: SourceClaim): string[] {
  const issues: string[] = [];

  // Pattern 1: Year is current or future (might not exist yet)
  const yearMatch = sc.source.match(/\d{4}/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    const currentYear = new Date().getFullYear();
    if (year > currentYear) {
      issues.push(`Source year ${year} is in the future`);
    }
  }

  // Pattern 2: Overly convenient numbers (round percentages >95%)
  const numberMatch = sc.claim.match(/(\d+\.?\d*)\s*%/);
  if (numberMatch && sc.claimType === 'numerical') {
    const value = parseFloat(numberMatch[1]);
    if (value >= 95 && value % 5 === 0) {
      issues.push('Suspiciously round high percentage (≥95%)');
    }
    if (value > 99) {
      issues.push('Extraordinary claim (>99%) requires exceptional evidence');
    }
  }

  // Pattern 3: Vague attribution ("experts say", "research shows" without specific source)
  const vagueTerms = ['experts', 'research', 'studies', 'scientists'];
  if (vagueTerms.some(term => sc.source.toLowerCase().includes(term)) &&
      sc.sourceType === 'unknown') {
    issues.push('Vague source attribution without specific citation');
  }

  return issues;
}

// Helper functions for hedgingBalance rule
function analyzeHedging(text: string, sentenceIndex: number, startOffset: number): HedgingAnalysis {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Collect all hedge words found
  const foundHedges: string[] = [];

  // Check all hedge categories
  for (const category of Object.values(HEDGE_WORDS)) {
    for (const hedge of category) {
      // Use word boundary matching to avoid partial matches
      const pattern = new RegExp(`\\b${hedge}\\b`, 'gi');
      const matches = lower.match(pattern);
      if (matches) {
        foundHedges.push(...matches);
      }
    }
  }

  const hedgeCount = foundHedges.length;
  const hedgeDensity = wordCount > 0 ? hedgeCount / wordCount : 0;

  // Thresholds for excessive hedging
  const DENSITY_THRESHOLD = 0.15; // 15% of words are hedges
  const ABSOLUTE_THRESHOLD = 5;   // 5+ hedge words in one sentence

  const isExcessive = hedgeDensity > DENSITY_THRESHOLD ||
                      hedgeCount > ABSOLUTE_THRESHOLD;

  return {
    text,
    hedgeWords: foundHedges,
    hedgeCount,
    wordCount,
    hedgeDensity,
    isExcessive,
    location: { start: startOffset, end: startOffset + text.length },
  };
}

function detectHedgeStacking(sentence: string): boolean {
  // Pattern: Two or more hedge words within 3 words of each other
  const allHedges = Object.values(HEDGE_WORDS).flat();
  const words = sentence.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length - 1; i++) {
    const window = words.slice(i, i + 3).join(' ');

    let hedgeCount = 0;
    for (const hedge of allHedges) {
      if (new RegExp(`\\b${hedge}\\b`).test(window)) hedgeCount++;
    }

    if (hedgeCount >= 2) return true;
  }

  return false;
}

// Validation Rules
const rules = {
  noSuperlatives: (content: string): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const lower = content.toLowerCase();

    for (const word of BANNED_SUPERLATIVES) {
      // Find ALL occurrences, not just the first (fixes multiple occurrence bug)
      let searchIndex = 0;
      while (searchIndex < lower.length) {
        const index = lower.indexOf(word, searchIndex);
        if (index === -1) break;

        results.push({
          valid: false,
          rule: 'no-superlatives',
          message: `Banned superlative "${word}" found. Use objective language instead.`,
          severity: 'error',
          location: { start: index, end: index + word.length },
        });
        searchIndex = index + word.length;
      }
    }

    return results;
  },

  noFabricatedScores: (content: string): ValidationResult[] => {
    const results: ValidationResult[] = [];

    for (const pattern of SCORE_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        // Check if score has associated evidence
        const context = content.slice(
          Math.max(0, match.index! - 100),
          Math.min(content.length, match.index! + match[0].length + 100)
        );

        const hasEvidence =
          context.includes('measured') ||
          context.includes('calculated') ||
          context.includes('based on') ||
          context.includes('according to') ||
          context.includes('source:') ||
          context.includes('http') ||
          context.includes('doi:');

        if (!hasEvidence) {
          results.push({
            valid: false,
            rule: 'no-fabricated-scores',
            message: `Score "${match[0]}" appears without measurement evidence. Add source or methodology.`,
            severity: 'warning',
            location: { start: match.index!, end: match.index! + match[0].length },
          });
        }
      }
    }

    return results;
  },

  requiresUncertainty: (content: string): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const lower = content.toLowerCase();

    // Check for claims that might need uncertainty
    const claimPatterns = [
      /will definitely/gi,
      /is certain to/gi,
      /always works/gi,
      /never fails/gi,
      /100% reliable/gi,
      /perfect solution/gi,
    ];

    for (const pattern of claimPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        results.push({
          valid: false,
          rule: 'requires-uncertainty',
          message: `Absolute claim "${match[0]}" needs qualification. Express uncertainty appropriately.`,
          severity: 'warning',
          location: { start: match.index!, end: match.index! + match[0].length },
        });
      }
    }

    return results;
  },

  evidenceRequired: (content: string): ValidationResult[] => {
    const results: ValidationResult[] = [];

    // Check for claims that need evidence
    const claimIndicators = [
      /studies show/gi,
      /research indicates/gi,
      /data suggests/gi,
      /according to experts/gi,
    ];

    for (const pattern of claimIndicators) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        // Check for citation within 200 chars
        const context = content.slice(
          match.index!,
          Math.min(content.length, match.index! + 200)
        );

        const hasCitation =
          context.includes('[') ||
          context.includes('http') ||
          context.includes('doi:') ||
          context.includes('et al');

        if (!hasCitation) {
          results.push({
            valid: false,
            rule: 'evidence-required',
            message: `Claim "${match[0]}" needs citation or source.`,
            severity: 'warning',
            location: { start: match.index!, end: match.index! + match[0].length },
          });
        }
      }
    }

    return results;
  },

  citationFormat: (content: string): ValidationResult[] => {
    const results: ValidationResult[] = [];

    // Find potential malformed citations (brackets with content that doesn't match valid formats)
    const bracketPattern = /\[([^\]]+)\]/g;
    const matches = content.matchAll(bracketPattern);

    for (const match of matches) {
      const citation = match[1];
      const fullMatch = match[0];
      const index = match.index!;

      // Skip if it's a valid format
      // [Author, Year], [Author et al., Year], [Author et al, Year] (comma optional after et al)
      const isValidAuthorYear = /^[A-Z][a-zA-Z'-]+(?:\s+(?:et\s+al\.?|&\s+[A-Z][a-zA-Z'-]+))?,?\s*\d{4}[a-z]?$/.test(citation);
      const isValidNumbered = /^\d+(?:[,\-]\d+)*$/.test(citation);
      const isValidUrl = /^https?:\/\//.test(citation);
      const isMarkdownLink = /^[^\]]+\]\([^)]+$/.test(citation); // Skip markdown links
      const isCodeBlock = content.slice(Math.max(0, index - 10), index).includes('`');

      // Skip obvious non-citations (code, markdown, etc.)
      if (isMarkdownLink || isCodeBlock) continue;

      // Skip array indices and common bracket uses
      if (/^[\d\s,]+$/.test(citation) && citation.length < 5) continue; // [0], [1,2]
      if (/^(TODO|FIXME|NOTE|WARNING|INFO|DEBUG)/.test(citation)) continue;
      if (/^(x|y|i|j|n|key|value|index)$/.test(citation.toLowerCase())) continue;

      // Check for potential citation attempts that are malformed
      const looksLikeCitation =
        /[A-Z][a-z]+.*\d{4}/.test(citation) || // Has name-like + year
        /et\s+al/i.test(citation) ||            // Has "et al"
        citation.includes(',') && /\d{4}/.test(citation); // Has comma and year

      if (looksLikeCitation && !isValidAuthorYear && !isValidNumbered && !isValidUrl) {
        results.push({
          valid: false,
          rule: 'citation-format',
          message: `Citation "${fullMatch}" may be malformed. Expected formats: [Author, Year], [Author et al., Year], [1], or [1-3].`,
          severity: 'info',
          location: { start: index, end: index + fullMatch.length },
        });
      }
    }

    return results;
  },

  // NEW RULE: Consistency checking for contradictory numerical claims
  consistencyCheck: (content: string): ValidationResult[] => {
    const results: ValidationResult[] = [];

    // Step 1: Extract all numeric claims
    const claims = extractNumericClaims(content);

    // Step 2: Group by normalized metric name
    const metricGroups = groupByMetric(claims);

    // Step 3: Check for inconsistencies within each group
    for (const [metric, claimList] of Object.entries(metricGroups)) {
      if (claimList.length < 2) continue; // Need at least 2 claims to compare

      // Get unique values for this metric
      const uniqueValues = new Set(claimList.map(c => c.value));

      if (uniqueValues.size > 1) {
        // Check if variation is justified by different contexts
        const hasJustification = checkContextDifference(claimList);

        if (!hasJustification) {
          results.push({
            valid: false,
            rule: 'consistency-check',
            message: `Inconsistent values for "${metric}": ${Array.from(uniqueValues).join(', ')}. Same metric should have same value unless comparing different conditions.`,
            severity: 'warning',
            location: claimList[0].location,
          });
        }
      }
    }

    return results;
  },

  // NEW RULE: Source verification for questionable citations
  // Only triggers on explicit "according to" or "X shows/indicates" patterns with weak sources
  sourceVerification: (content: string): ValidationResult[] => {
    const results: ValidationResult[] = [];

    // Step 1: Extract source-claim pairs (only explicit attribution patterns)
    const sourceClaims = extractSourceClaims(content);

    // Step 2: Validate each source-claim pair
    for (const sc of sourceClaims) {
      const issues: string[] = [];

      // Skip validation for properly formatted citations (author-year, numbered, url, doi, arxiv)
      // These are already valid citation formats - no need for extra verification
      if (sc.sourceType !== 'unknown') {
        continue;
      }

      // Only flag unknown source types when making strong claims
      if (sc.sourceType === 'unknown') {
        // Check if it's actually trying to cite something (vs just brackets in text)
        const looksLikeRealCitation =
          sc.source.toLowerCase().includes('according') ||
          sc.source.toLowerCase().includes('shows') ||
          sc.source.toLowerCase().includes('indicates') ||
          sc.source.toLowerCase().includes('reports') ||
          sc.source.toLowerCase().includes('study') ||
          sc.source.toLowerCase().includes('research');

        if (!looksLikeRealCitation) {
          continue; // Skip - not actually trying to make a cited claim
        }

        issues.push('Unrecognized source format');
      }

      // Check for suspicious patterns only on claims with issues
      const suspicionReasons = detectSuspiciousPatterns(sc);
      if (suspicionReasons.length > 0) {
        issues.push(...suspicionReasons);
      }

      // Check: "According to" without proper citation format
      if (sc.claim.toLowerCase().includes('according to') &&
          sc.sourceType === 'unknown') {
        issues.push('"According to" requires proper citation format');
      }

      // Report issues
      if (issues.length > 0) {
        results.push({
          valid: false,
          rule: 'source-verification',
          message: `Source claim verification issues: ${issues.join('; ')}`,
          severity: 'warning',
          location: sc.location,
        });
      }
    }

    return results;
  },

  // NEW RULE: Hedging balance to detect excessive qualification
  hedgingBalance: (content: string): ValidationResult[] => {
    const results: ValidationResult[] = [];

    // Step 1: Split into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Track position in original content
    let currentOffset = 0;

    // Step 2: Analyze each sentence
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();

      // Find actual position of this sentence in content
      const sentenceStart = content.indexOf(sentence, currentOffset);
      currentOffset = sentenceStart + sentence.length;

      const analysis = analyzeHedging(sentence, i, sentenceStart);

      // Step 3: Check for excessive hedging
      if (analysis.isExcessive) {
        results.push({
          valid: false,
          rule: 'hedging-balance',
          message: `Excessive hedging (${analysis.hedgeCount} hedge words in ${analysis.wordCount} words, ${(analysis.hedgeDensity * 100).toFixed(1)}% density). Hedging should express appropriate uncertainty, not obscure claims.`,
          severity: 'info',
          location: analysis.location,
        });
      }

      // Step 4: Check for hedge stacking (multiple in short phrase)
      if (detectHedgeStacking(sentence)) {
        results.push({
          valid: false,
          rule: 'hedging-balance',
          message: 'Multiple hedge words in close proximity. Consider simplifying: "might possibly" → "might", "appears to suggest" → "suggests".',
          severity: 'info',
          location: analysis.location,
        });
      }
    }

    return results;
  },
};

// Main validation function
export function validate(content: string): ValidationReport {
  // Normalize input to prevent Unicode bypass attempts
  const normalizedContent = normalizeInput(content);
  const results: ValidationResult[] = [];

  // Run all rules on normalized content
  results.push(...rules.noSuperlatives(normalizedContent));
  results.push(...rules.noFabricatedScores(normalizedContent));
  results.push(...rules.requiresUncertainty(normalizedContent));
  results.push(...rules.evidenceRequired(normalizedContent));
  results.push(...rules.citationFormat(normalizedContent));
  // NEW RULES
  results.push(...rules.consistencyCheck(normalizedContent));
  results.push(...rules.sourceVerification(normalizedContent));
  results.push(...rules.hedgingBalance(normalizedContent));

  // Calculate summary
  const summary = {
    errors: results.filter(r => r.severity === 'error').length,
    warnings: results.filter(r => r.severity === 'warning').length,
    info: results.filter(r => r.severity === 'info').length,
  };

  return {
    content: content.slice(0, 100) + '...', // Truncate for report
    timestamp: new Date().toISOString(),
    results,
    passed: summary.errors === 0,
    summary,
  };
}

// Validate and fix common issues
export function validateAndSuggest(content: string): {
  report: ValidationReport;
  suggestions: string[];
} {
  const report = validate(content);
  const suggestions: string[] = [];

  for (const result of report.results) {
    switch (result.rule) {
      case 'no-superlatives':
        suggestions.push(`Replace superlative with objective description`);
        break;
      case 'no-fabricated-scores':
        suggestions.push(`Add measurement methodology or source for score`);
        break;
      case 'requires-uncertainty':
        suggestions.push(`Add qualifiers like "likely", "approximately", or "in most cases"`);
        break;
      case 'evidence-required':
        suggestions.push(`Add citation in format [Author, Year] or URL`);
        break;
      case 'citation-format':
        suggestions.push(`Use standard format: [Author, Year] or [1] for numbered refs`);
        break;
      // NEW RULES
      case 'consistency-check':
        suggestions.push(`Review and reconcile inconsistent metric values, or add context (e.g., "training" vs "test") to justify differences`);
        break;
      case 'source-verification':
        suggestions.push(`Strengthen source attribution with verifiable citation (URL, DOI, or arXiv reference)`);
        break;
      case 'hedging-balance':
        suggestions.push(`Reduce hedge word density - use one qualifier per claim instead of stacking multiple`);
        break;
    }
  }

  return { report, suggestions };
}

// Export for CLI usage
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('validator.ts');

if (isMainModule && process.argv[1]?.endsWith('validator.ts')) {
  const content = process.argv[2] || 'This is an exceptional solution with 95% accuracy!';
  const report = validate(content);

  console.log('=== Validation Report ===\n');
  console.log(`Passed: ${report.passed}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}\n`);

  for (const result of report.results) {
    console.log(`[${result.severity.toUpperCase()}] ${result.rule}`);
    console.log(`  ${result.message}\n`);
  }
}
