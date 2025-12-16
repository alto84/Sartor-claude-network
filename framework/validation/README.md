# Validation Framework

## Purpose
Ensure quality and accuracy of agent outputs through:
- Evidence-based validation
- Anti-fabrication checking
- Consistency verification

## Architecture

### Validation Layers

1. **Pre-Output Validation**
   - Check claims have evidence
   - Verify no banned language
   - Ensure uncertainty is expressed

2. **Post-Output Validation**
   - Cross-reference with sources
   - Check internal consistency
   - Verify factual claims

3. **Cross-Agent Validation**
   - Multiple agents verify same claims
   - Disagreement flagging
   - Consensus building

### Validation Rules

Based on CLAUDE.md anti-fabrication protocols:

```typescript
interface ValidationRule {
  name: string;
  type: 'language' | 'evidence' | 'score' | 'claim';
  check: (content: string) => ValidationResult;
}

const rules: ValidationRule[] = [
  {
    name: 'no-fabricated-scores',
    type: 'score',
    check: (content) => {
      // Check for scores without measurement data
    }
  },
  {
    name: 'no-superlatives',
    type: 'language',
    check: (content) => {
      // Check for banned words: exceptional, outstanding, etc.
    }
  },
  {
    name: 'evidence-required',
    type: 'evidence',
    check: (content) => {
      // Check claims have citations
    }
  }
];
```

### Integration

Validation is triggered:
1. Before agent output is saved
2. When synthesizing multiple agent outputs
3. On request via validation skill

## Files

- `validator.ts` - Core validation engine
- `rules/` - Validation rule definitions
- `VALIDATION_SKILL.md` - Skill for agent use
