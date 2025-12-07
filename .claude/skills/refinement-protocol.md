# Refinement Protocol Skill

## Summary
Execute tasks using iterative refinement: Generate → Evaluate → Refine until quality threshold met.

## When to Use
- Any non-trivial task (more than simple lookup)
- When quality matters more than speed
- When the first attempt might not be perfect
- When learning from the process is valuable

## The Refinement Loop

```
┌─────────────────────────────────────────┐
│  1. GENERATE initial solution           │
│         ↓                               │
│  2. EVALUATE against criteria           │
│         ↓                               │
│  3. Score < threshold?                  │
│      YES → REFINE and go to step 2     │
│      NO  → COMPLETE                     │
└─────────────────────────────────────────┘
```

## Instructions

### Before Starting
1. Define success criteria (what does "good enough" look like?)
2. Set confidence threshold (default: 0.8)
3. Set max iterations (default: 3)

### During Each Iteration
1. **Generate/Refine**: Produce or improve the solution
2. **Self-Audit**: Check against criteria
   - Correctness: Does it work?
   - Completeness: Does it cover all requirements?
   - Quality: Is it well-structured?
   - Evidence: Is it based on facts?
3. **Score**: Rate confidence 0-1
4. **Decide**: Continue or complete

### After Completion
1. Record the refinement trace
2. Note what improvements were made
3. Store successful patterns for future use

## Example: Refining a Function

**Iteration 1:**
```
Generated: Basic implementation
Self-audit: Works but doesn't handle edge cases
Score: 0.5
Decision: Refine
```

**Iteration 2:**
```
Refined: Added null checks, error handling
Self-audit: Handles edge cases, but no tests
Score: 0.7
Decision: Refine
```

**Iteration 3:**
```
Refined: Added test cases
Self-audit: Complete, tested, documented
Score: 0.9
Decision: Complete ✓
```

## Self-Audit Checklist

Before marking complete, verify:
- [ ] Meets all stated requirements
- [ ] Handles error cases
- [ ] Based on evidence (not assumptions)
- [ ] Would pass code review
- [ ] Doesn't break existing functionality

## Anti-Patterns to Avoid

1. **One-and-done**: Submitting first attempt without evaluation
2. **Infinite loop**: Refining past diminishing returns
3. **Scope creep**: Adding features not in requirements
4. **Assumption-based**: Making claims without verification

## Integration with Memory

After successful refinement:
```typescript
await bridge.recordRefinement({
  task: 'Description of task',
  iterations: 3,
  initialScore: 0.5,
  finalScore: 0.9,
  improvements: ['Added error handling', 'Added tests', 'Improved docs']
});
```

This feeds the learning loop for future improvements.
