# Validation Skill

## Purpose

This skill enables agents to validate their outputs against the anti-fabrication protocols defined in CLAUDE.md. It helps ensure all agent communications are evidence-based, appropriately uncertain, and free of banned superlatives.

## When to Use

- Before submitting any report or assessment
- When generating content with scores, percentages, or ratings
- When making claims about research or data
- When reviewing other agents' outputs
- As a quality gate before final report generation

## Validation Rules

The validation framework enforces four core rules:

### 1. No Superlatives (`no-superlatives`)
**Severity: Error**

Banned words:
- exceptional, outstanding, world-class
- industry-leading, best-in-class
- cutting-edge, revolutionary, groundbreaking

**Instead use**: Objective descriptive language
- "meets requirements" instead of "exceptional implementation"
- "performs as specified" instead of "outstanding performance"

### 2. No Fabricated Scores (`no-fabricated-scores`)
**Severity: Warning**

Triggers on patterns:
- Percentages: `95%`, `80%`
- Ratings: `8/10`, `4/5`
- Explicit scores: `score: 8`
- Letter grades: `Grade A`, `B+`

**Evidence phrases that suppress warnings**:
- "measured", "calculated", "based on", "according to", "source:"

**Example**:
```
BAD:  "This achieves 95% accuracy."
GOOD: "This achieves 95% accuracy based on test suite results."
```

### 3. Requires Uncertainty (`requires-uncertainty`)
**Severity: Warning**

Triggers on absolute claims:
- "will definitely", "is certain to"
- "always works", "never fails"
- "100% reliable", "perfect solution"

**Instead use**: Qualified language
- "likely to work in most cases"
- "expected to succeed under typical conditions"
- "has high reliability based on testing"

### 4. Evidence Required (`evidence-required`)
**Severity: Warning**

Triggers on research claims without citation:
- "studies show", "research indicates"
- "data suggests", "according to experts"

**Citation formats accepted**:
- Bracket citations: `[Smith et al, 2023]`
- URLs: `https://...`
- DOI: `doi:10.1234/...`
- Author references: `et al`

## Using the Validator

### Programmatic Usage (TypeScript)

```typescript
import { validate, validateAndSuggest } from './validation/validator';

// Basic validation
const report = validate(content);
console.log(`Passed: ${report.passed}`);
console.log(`Errors: ${report.summary.errors}`);
console.log(`Warnings: ${report.summary.warnings}`);

// With suggestions
const { report, suggestions } = validateAndSuggest(content);
for (const suggestion of suggestions) {
  console.log(`Suggestion: ${suggestion}`);
}
```

### CLI Usage

```bash
npx tsx framework/validation/validator.ts "Content to validate"
```

### Test Suite

Run the 18-test validation test suite:

```bash
npx tsx framework/validation/test-suite.ts
```

Expected output: 17/18 tests pass (one known edge case with URL citations)

## Integration Patterns

### Pre-Output Validation

```typescript
function generateReport(data: any): string {
  const content = formatReport(data);
  const validation = validate(content);

  if (!validation.passed) {
    throw new Error(`Report has ${validation.summary.errors} errors`);
  }

  if (validation.summary.warnings > 0) {
    console.warn(`Report has ${validation.summary.warnings} warnings`);
  }

  return content;
}
```

### Agent Output Gate

```typescript
async function processAgentOutput(output: string): Promise<void> {
  const { report, suggestions } = validateAndSuggest(output);

  if (report.summary.errors > 0) {
    // Block output, return to agent for revision
    return await requestRevision(output, suggestions);
  }

  // Allow output with warnings logged
  await publishOutput(output);
}
```

## Validation Report Structure

```typescript
interface ValidationReport {
  content: string;         // Truncated input (first 100 chars)
  timestamp: string;       // ISO timestamp
  results: ValidationResult[];
  passed: boolean;         // true if no errors
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

interface ValidationResult {
  valid: boolean;
  rule: string;            // Rule that triggered
  message: string;         // Human-readable message
  severity: 'error' | 'warning' | 'info';
  location?: {             // Position in content
    start: number;
    end: number;
  };
}
```

## Best Practices

1. **Validate Early**: Run validation during content generation, not just at the end
2. **Fix Errors First**: Errors block output; warnings can be reviewed
3. **Add Evidence**: When citing numbers, include measurement source
4. **Use Uncertainty**: Qualify claims appropriately
5. **Avoid Marketing Language**: Stick to objective descriptions

## Common Patterns

### Making Score Claims

```markdown
BAD:
"The system has 95% accuracy and is industry-leading."

GOOD:
"The system achieved 95% accuracy on the test set of 500 samples.
This represents the measured performance on available test data."
```

### Describing Results

```markdown
BAD:
"This exceptional implementation will definitely solve all problems."

GOOD:
"This implementation addresses the specified requirements.
Testing indicates it handles the documented use cases.
Edge cases may require additional handling."
```

### Citing Research

```markdown
BAD:
"Studies show this approach is more effective."

GOOD:
"Studies show this approach reduces latency by 30% [Johnson et al, 2024]."
```

## Files Reference

| File | Purpose |
|------|---------|
| `framework/validation/validator.ts` | Core validation engine |
| `framework/validation/test-suite.ts` | 18 test cases |
| `framework/validation/ground-truth.json` | Expected behaviors |
| `framework/validation/ab-test-runner.ts` | A/B comparison framework |
| `framework/validation/README.md` | Architecture documentation |

## Related Skills

- **Bootstrap Skill**: Loads validation context for new agents
- **Evidence-Based Engineering**: Full evidence protocol enforcement

---

*This skill is part of the anti-fabrication framework defined in CLAUDE.md*
