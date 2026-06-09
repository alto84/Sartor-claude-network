# New Validation Rules Research

**Date**: 2025-12-15
**Purpose**: Strengthen anti-fabrication framework with additional detection capabilities
**Status**: Research proposal for implementation

---

## Executive Summary

This document proposes three new validation rules to enhance the anti-fabrication framework defined in `/home/alton/CLAUDE.md` and implemented in `/home/alton/claude-swarm/framework/validation/validator.ts`.

**Current Rules (5)**:
1. `noSuperlatives` - Detects banned superlative language
2. `noFabricatedScores` - Detects scores without evidence
3. `requiresUncertainty` - Detects absolute claims
4. `evidenceRequired` - Detects claims needing citations
5. `citationFormat` - Validates citation formatting

**Proposed New Rules (3)**:
1. `consistencyCheck` - Detects contradictory numerical claims
2. `sourceVerification` - Validates specific source attributions
3. `hedgingBalance` - Detects excessive hedging that obscures claims

---

## Rule 1: Consistency Checking

### Problem Statement

Current validation does not detect when the same metric is reported with different values in a single output. This allows fabrication to slip through if numbers are inconsistent.

**Example of Undetected Fabrication**:
```
The system achieves 85% accuracy on the test set.
...
[Later in same document]
...
Overall accuracy is 92% based on our measurements.
```

Both claims reference "accuracy" but provide different numbers. Without actual measurements, at least one must be fabricated.

### Detection Strategy

1. **Extract numerical claims**: Parse all statements containing metrics + numbers
2. **Normalize metric names**: Group similar terms ("accuracy", "acc", "correct rate")
3. **Compare values**: Flag when same/similar metrics have different values
4. **Context awareness**: Allow different values if explicitly comparing different datasets/conditions

### Implementation Pseudocode

```typescript
interface NumericClaim {
  metric: string;           // e.g., "accuracy", "performance", "speed"
  value: number;            // The numerical value
  unit?: string;            // e.g., "%", "ms", "x"
  context: string;          // Surrounding text (100 chars)
  location: { start: number; end: number };
}

function consistencyCheck(content: string): ValidationResult[] {
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
}

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

  for (const diff of differentiators) {
    const matchCount = contexts.filter(ctx => ctx.includes(diff)).length;
    // If some contexts have differentiator and others don't, it's justified
    if (matchCount > 0 && matchCount < contexts.length) {
      return true;
    }
  }

  return false;
}
```

### Test Cases

```typescript
// Should PASS - same metric, same value
const valid1 = "Accuracy is 94.5% based on test suite. The measured accuracy of 94.5% confirms this.";

// Should PASS - different contexts
const valid2 = "Training accuracy reached 98%, while test accuracy is 92%.";

// Should WARN - inconsistent values, no context difference
const invalid1 = "The system achieves 85% accuracy. Performance is excellent with 92% accuracy.";

// Should PASS - different metrics
const valid3 = "Accuracy is 90% and precision is 85%.";
```

### Severity Rationale

- **Severity**: `warning` (not `error`)
- **Reason**: Inconsistency might be a typo or legitimate comparison that wasn't clearly labeled
- **Human review**: Flagged for manual verification

---

## Rule 2: Source Verification

### Problem Statement

Current `evidenceRequired` rule checks if citations exist but doesn't verify that claimed sources actually support the claims. Fabricated sources are not detected.

**Example of Undetected Fabrication**:
```
According to Smith et al. (2024), this approach achieves 99% accuracy.
```

The citation looks valid, but without verifying:
1. Does Smith et al. (2024) exist?
2. Does it actually make this claim?

### Detection Strategy

1. **Extract source-claim pairs**: Identify statements with specific source attributions
2. **Validate source format**: Check if source follows credible patterns
3. **Detect suspicious patterns**: Flag overly convenient claims from sources
4. **Check source-claim plausibility**: Warn on extraordinary claims even with sources

### Implementation Pseudocode

```typescript
interface SourceClaim {
  claim: string;
  source: string;
  sourceType: 'author-year' | 'url' | 'doi' | 'arxiv' | 'unknown';
  claimType: 'numerical' | 'absolute' | 'comparison' | 'general';
  suspicionScore: number; // 0-100, higher = more suspicious
  location: { start: number; end: number };
}

function sourceVerification(content: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Step 1: Extract source-claim pairs
  const sourceClaims = extractSourceClaims(content);

  // Step 2: Validate each source-claim pair
  for (const sc of sourceClaims) {
    const issues: string[] = [];

    // Check 1: Source format validation
    if (sc.sourceType === 'unknown') {
      issues.push('Unrecognized source format');
    }

    // Check 2: Extraordinary claims require extraordinary evidence
    if (sc.claimType === 'numerical' || sc.claimType === 'absolute') {
      const hasStrongEvidence = checkStrongEvidence(sc);
      if (!hasStrongEvidence) {
        issues.push('Extraordinary claim requires stronger evidence (URL, DOI, or multiple sources)');
      }
    }

    // Check 3: Suspicious patterns
    const suspicionReasons = detectSuspiciousPatterns(sc);
    if (suspicionReasons.length > 0) {
      issues.push(...suspicionReasons);
    }

    // Check 4: "According to" without proper citation format
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
}

function extractSourceClaims(content: string): SourceClaim[] {
  const claims: SourceClaim[] = [];

  // Pattern 1: "According to [source], [claim]"
  const pattern1 = /according to\s+([^,]+(?:\[[^\]]+\])?),?\s+([^.]+)/gi;

  // Pattern 2: "[Claim] [citation]"
  const pattern2 = /([^.]+)\s+(\[[^\]]+\]|\(https?:\/\/[^)]+\))/gi;

  // Pattern 3: "Source shows/indicates/finds [claim]"
  const pattern3 = /(\[[^\]]+\]|https?:\/\/\S+)\s+(shows?|indicates?|finds?|reports?)\s+([^.]+)/gi;

  // Extract from all patterns
  [pattern1, pattern2, pattern3].forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const claim = match[2] || match[1];
      const source = match[1] || match[2];

      claims.push({
        claim,
        source,
        sourceType: classifySourceType(source),
        claimType: classifyClaimType(claim),
        suspicionScore: 0, // Calculated later
        location: { start: match.index!, end: match.index! + match[0].length },
      });
    }
  });

  return claims;
}

function classifySourceType(source: string): SourceClaim['sourceType'] {
  if (/\[[\w-]+\s+et\s+al\.?,\s*\d{4}\]/.test(source)) return 'author-year';
  if (/\[[\w-]+,\s*\d{4}\]/.test(source)) return 'author-year';
  if (/https?:\/\//.test(source)) return 'url';
  if (/doi:\s*10\.\d+/.test(source)) return 'doi';
  if (/arxiv:\d{4}\.\d{4,5}/.test(source)) return 'arxiv';
  return 'unknown';
}

function classifyClaimType(claim: string): SourceClaim['claimType'] {
  if (/\d+\.?\d*\s*%/.test(claim)) return 'numerical';
  if (/always|never|all|none|every|100%|0%/.test(claim.toLowerCase())) return 'absolute';
  if (/better|worse|faster|slower|more|less/.test(claim.toLowerCase())) return 'comparison';
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
```

### Test Cases

```typescript
// Should PASS - proper URL citation
const valid1 = "According to https://example.com/study.pdf, accuracy improved by 15%.";

// Should PASS - proper DOI with reasonable claim
const valid2 = "Performance gains of 23% were observed (doi:10.1234/example.2024).";

// Should WARN - author-year with extraordinary claim
const invalid1 = "According to Smith et al. (2024), this achieves 99.9% accuracy.";

// Should WARN - vague attribution
const invalid2 = "Experts say this approach is 10x faster.";

// Should WARN - future year
const invalid3 = "Recent research [Jones, 2026] demonstrates effectiveness.";

// Should WARN - "according to" without citation
const invalid4 = "According to recent studies, this works perfectly.";
```

### Severity Rationale

- **Severity**: `warning` (not `error`)
- **Reason**: Source might be legitimate but flagged due to pattern matching limitations
- **Human review**: Verify sources manually or provide stronger evidence

---

## Rule 3: Hedging Balance Detection

### Problem Statement

The `requiresUncertainty` rule ensures claims aren't absolute, but excessive hedging can hide or obscure claims entirely. This allows fabrication through strategic ambiguity.

**Example of Excessive Hedging**:
```
It appears that possibly, under certain conditions, there might be
some evidence suggesting that potentially, the system could possibly
achieve something in the approximate range of perhaps 90% accuracy,
though this is uncertain and requires validation.
```

Too much hedging makes the claim meaningless while appearing compliant with uncertainty requirements.

### Detection Strategy

1. **Count hedge words**: Track frequency of qualifying language
2. **Calculate hedge density**: Ratio of hedge words to total words in claim
3. **Detect hedge stacking**: Multiple hedge words in single claim
4. **Balance assessment**: Flag excessive hedging that obscures meaning

### Implementation Pseudocode

```typescript
interface HedgingAnalysis {
  text: string;
  hedgeWords: string[];
  hedgeCount: number;
  wordCount: number;
  hedgeDensity: number; // hedgeCount / wordCount
  isExcessive: boolean;
  location: { start: number; end: number };
}

// Hedge word categories
const HEDGE_WORDS = {
  modal: ['might', 'may', 'could', 'would', 'should', 'possibly', 'perhaps'],
  qualifier: ['approximately', 'roughly', 'about', 'around', 'nearly', 'almost'],
  epistemic: ['appears', 'seems', 'suggests', 'indicates', 'likely', 'probably'],
  conditional: ['if', 'assuming', 'provided', 'given that', 'under certain conditions'],
  uncertainty: ['uncertain', 'unclear', 'unknown', 'tentative', 'preliminary'],
};

function hedgingBalance(content: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Step 1: Split into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Step 2: Analyze each sentence
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    const analysis = analyzeHedging(sentence, i);

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
}

function analyzeHedging(text: string, sentenceIndex: number): HedgingAnalysis {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/);
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
  const hedgeDensity = hedgeCount / wordCount;

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
    location: { start: sentenceIndex * 100, end: (sentenceIndex + 1) * 100 }, // Approximate
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
      if (window.includes(hedge)) hedgeCount++;
    }

    if (hedgeCount >= 2) return true;
  }

  return false;
}
```

### Test Cases

```typescript
// Should PASS - appropriate hedging
const valid1 = "The results suggest an accuracy of approximately 85%.";

// Should PASS - no hedging (objective statement)
const valid2 = "The measured accuracy is 87.3% based on 1000 test cases.";

// Should FLAG (info) - excessive hedging
const invalid1 = "It might possibly appear that perhaps under certain conditions the accuracy could potentially be around maybe 90%.";

// Should FLAG (info) - hedge stacking
const invalid2 = "This seems to possibly suggest that it might work.";

// Should PASS - single hedge appropriate for context
const valid3 = "This approach likely works for most use cases.";

// Should FLAG (info) - too many hedges
const invalid3 = "The preliminary tentative results possibly suggest that approximately maybe around 80% might be achievable under certain uncertain conditions.";
```

### Severity Rationale

- **Severity**: `info` (not `warning` or `error`)
- **Reason**: Excessive hedging is a style issue, not necessarily fabrication
- **Purpose**: Improve clarity while maintaining appropriate uncertainty
- **Human review**: Rephrase for clarity without losing necessary qualification

---

## Comparison with Existing Rules

| Rule | Detection Target | Overlap with Existing | Unique Contribution |
|------|-----------------|----------------------|---------------------|
| **consistencyCheck** | Contradictory numbers | Partially overlaps with `noFabricatedScores` | Detects internal contradictions; existing rules don't cross-reference claims |
| **sourceVerification** | Questionable citations | Extends `evidenceRequired` and `citationFormat` | Validates source plausibility; existing rules check format only |
| **hedgingBalance** | Excessive uncertainty | Inverse of `requiresUncertainty` | Prevents hiding claims with ambiguity; existing rules only check for too little uncertainty |

### Coverage Analysis

```
Fabrication Risk Spectrum:
├─ Too confident (absolute claims)     ← [requiresUncertainty] ✓ Covered
├─ No evidence (fabricated scores)     ← [noFabricatedScores] ✓ Covered
├─ Bad language (superlatives)         ← [noSuperlatives] ✓ Covered
├─ Missing citations                   ← [evidenceRequired] ✓ Covered
├─ Bad citation format                 ← [citationFormat] ✓ Covered
├─ Inconsistent claims                 ← [consistencyCheck] ✗ NEW
├─ Fake/weak sources                   ← [sourceVerification] ✗ NEW
└─ Obscured claims                     ← [hedgingBalance] ✗ NEW
```

---

## Implementation Priority

### Phase 1 (High Priority)
- **consistencyCheck**: Catches internal contradictions, direct indicator of fabrication

### Phase 2 (Medium Priority)
- **sourceVerification**: Improves citation quality, reduces weak evidence

### Phase 3 (Low Priority)
- **hedgingBalance**: Style improvement, less critical for anti-fabrication

---

## Integration Plan

### File Modifications Required

1. **`/home/alton/claude-swarm/framework/validation/validator.ts`**
   - Add three new rule functions
   - Update `validate()` to call new rules
   - Update `validateAndSuggest()` with new suggestion types

2. **`/home/alton/claude-swarm/framework/validation/test-suite.ts`**
   - Add test cases for each new rule (minimum 5 per rule)
   - Update expected results for combination tests

3. **`/home/alton/claude-swarm/framework/validation/README.md`**
   - Document new rules
   - Update architecture diagram

### Backward Compatibility

All new rules return `ValidationResult[]`, matching existing interface. No breaking changes to API.

### Performance Considerations

- **consistencyCheck**: O(n²) in worst case (comparing all claims), but typically O(n) with small number of metrics
- **sourceVerification**: O(n) linear scan with regex matching
- **hedgingBalance**: O(n) sentence-level analysis

No significant performance impact expected for typical document sizes (< 10,000 words).

---

## Limitations and Caveats

### Consistency Check
- **Cannot detect**: Cross-document inconsistencies (only within single text)
- **False positives**: Legitimate comparisons might be flagged if context keywords not detected
- **Mitigation**: Use `warning` severity; allow context differentiators

### Source Verification
- **Cannot detect**: Actually fake sources that follow correct format patterns
- **No external validation**: Does not fetch URLs or check DOI registries
- **Mitigation**: Flag suspicious patterns; require human verification for extraordinary claims

### Hedging Balance
- **Subjective threshold**: Hedge density thresholds (15%) are approximate
- **Domain variation**: Academic writing may legitimately use more hedging
- **Mitigation**: Use `info` severity; make thresholds configurable

---

## Validation Against CLAUDE.md Compliance

### Anti-Fabrication Protocol Alignment

| CLAUDE.md Requirement | consistencyCheck | sourceVerification | hedgingBalance |
|-----------------------|------------------|--------------------|--------------------|
| No fabricated scores | ✓ Detects conflicting scores | ✓ Requires evidence for scores | Neutral |
| Evidence chain | ✓ Cross-references claims | ✓ Validates source strength | Neutral |
| No delegation | N/A | ✓ Flags vague attributions | N/A |
| No assumptions | ✓ Flags unjustified variance | ✓ Flags weak sources | N/A |
| Uncertainty expression | N/A | N/A | ✓ Prevents over-hedging |
| Limitation disclosure | N/A | N/A | ✓ Encourages clear statements |

### Circumvention Prevention

These rules specifically address circumvention attempts:
- **consistencyCheck**: Prevents "scatter different numbers and hope no one notices"
- **sourceVerification**: Prevents "cite plausible-looking but fake sources"
- **hedgingBalance**: Prevents "hide fabrication in ambiguous language"

---

## Future Research Directions

### Beyond These Three Rules

1. **Temporal Consistency**: Track claims across multiple outputs over time
2. **Cross-Reference Validation**: Verify citations against external databases (DOI, arXiv APIs)
3. **Claim Extraction**: Use NLP to extract structured claims for fact-checking
4. **Statistical Validation**: Check if reported statistics are mathematically plausible (e.g., confidence intervals, sample sizes)
5. **Context-Aware Scoring**: ML model to detect fabrication patterns specific to domain

### Integration with Self-Improvement System

Reference: `/home/alton/claude-swarm/.swarm/artifacts/SELF_IMPROVING_SYSTEM_DESIGN.md`

These validation rules can be used in:
- **Critique Phase**: Automated quality assessment
- **Decision Phase**: Evidence-based commit decisions
- **Learning Phase**: Track which rules are most frequently triggered

---

## Conclusion

The three proposed validation rules address gaps in the current anti-fabrication framework:

1. **consistencyCheck**: Detects internal contradictions in numerical claims
2. **sourceVerification**: Validates source credibility and claim-evidence alignment
3. **hedgingBalance**: Prevents excessive ambiguity that obscures claims

All three rules:
- Align with CLAUDE.md anti-fabrication protocols
- Use appropriate severity levels (`warning` or `info`)
- Require human review for final decisions
- Maintain backward compatibility with existing validator API
- Add minimal performance overhead

**Implementation readiness**: All three rules have detailed pseudocode and test cases. Ready for development.

**Recommendation**: Implement in priority order (consistencyCheck → sourceVerification → hedgingBalance) to maximize fabrication detection with minimal development effort.

---

## Appendix: Full Rule Comparison Table

| Rule Name | Type | Severity | Target | False Positive Risk | Implementation Complexity |
|-----------|------|----------|--------|---------------------|--------------------------|
| noSuperlatives | Language | Error | Banned words | Low | Low |
| noFabricatedScores | Score | Warning | Unsupported metrics | Medium | Medium |
| requiresUncertainty | Claim | Warning | Absolute statements | Low | Low |
| evidenceRequired | Evidence | Warning | Uncited claims | Medium | Medium |
| citationFormat | Citation | Info | Malformed refs | Medium | Medium |
| **consistencyCheck** | **Consistency** | **Warning** | **Contradictions** | **Medium** | **High** |
| **sourceVerification** | **Evidence** | **Warning** | **Weak sources** | **High** | **Medium** |
| **hedgingBalance** | **Language** | **Info** | **Over-hedging** | **High** | **Medium** |

---

**End of Research Proposal**
