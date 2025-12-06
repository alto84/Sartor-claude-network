# Claude Code Quality Hooks System

**Purpose:** Enforce evidence-based practices and prevent fabrication in all code generation

**Version:** 1.0.0
**Created:** 2025-12-06
**Status:** Ready for Implementation

---

## Quick Start

### 1. Review Documentation

Start here:
- **[HOOKS_SUMMARY.md](./HOOKS_SUMMARY.md)** - Quick overview with examples
- **[HOOKS_IMPLEMENTATION_GUIDE.md](./HOOKS_IMPLEMENTATION_GUIDE.md)** - Complete implementation guide
- **[hooks.json](./hooks.json)** - Configuration file

### 2. Install

```bash
# From project root
cd /home/user/Sartor-claude-network

# Make pre-commit hook executable
chmod +x .claude/hooks/pre-commit

# Link to git hooks
ln -s ../../.claude/hooks/pre-commit .git/hooks/pre-commit

# Test installation
.claude/hooks/pre-commit --help
```

### 3. Test on Current Codebase

```bash
# Run validators on current files
git add .
git commit -m "Test hooks"

# Hooks will run automatically
```

---

## What This System Does

Enforces quality gates at **three critical points**:

### 1. User-Prompt-Submit Hooks
**Before generating code**, verify:
- Intent is clear (what, why, success criteria)
- Scope is defined (in/out, constraints)
- Evidence is available (tools to support claims)
- No anti-patterns (score without rubric, etc.)

### 2. Post-Tool-Use Hooks
**After generating code**, validate:
- All metrics have measurement evidence
- Language is precise (no "excellent", "should work")
- Uncertainties are documented
- Status claims match evidence

### 3. Pre-Commit Hooks
**Before committing**, check:
- No fabricated metrics
- Evidence-based claims only
- Proper error handling
- Test coverage validated
- Completion status accurate
- No citation fabrication

---

## Quality Principles

1. **Truth Over Speed** - Honest gaps > fabricated completeness
2. **Evidence-Based Claims** - Measurements, not opinions
3. **No Metric Fabrication** - All metrics require methodology
4. **Proper Error Handling** - All risky operations covered
5. **Honest Progress Tracking** - Implementation ≠ Complete
6. **Language Precision** - Specific observations, not superlatives

---

## Files in This System

```
.claude/
├── README.md                           ← You are here
├── HOOKS_SUMMARY.md                    ← Quick overview
├── HOOKS_IMPLEMENTATION_GUIDE.md       ← Complete guide
├── hooks.json                          ← Configuration
└── hooks/
    ├── pre-commit                      ← Main pre-commit script
    └── validators/
        ├── metrics-validator.ts        ← No fabricated metrics
        ├── evidence-validator.ts       ← Evidence-based claims
        ├── error-handling-validator.ts ← Error handling required
        └── completion-validator.ts     ← Status accuracy
```

---

## Quick Examples

### ❌ BLOCKED by Hooks

```typescript
// Code coverage is 95%
```

### ✅ ALLOWED by Hooks

```typescript
// Code coverage: 94.7%
// Measured: jest --coverage on 2025-12-06 15:30
// Command: npm test -- --coverage
// Output: 94.7% statements, 91.2% branches
// Not tested: error handling for edge case X
```

---

### ❌ BLOCKED by Hooks

```typescript
// This should work for most inputs
```

### ✅ ALLOWED by Hooks

```typescript
// Tested to work for: strings 0-10000 chars, UTF-8 encoded
// Test file: test/input-validation.spec.ts
// Untested for: binary data, non-UTF-8 encodings
```

---

### ❌ BLOCKED by Hooks

```markdown
Status: Complete ✓
- Implemented feature
- Tests pass
```

### ✅ ALLOWED by Hooks

```markdown
Status: Tested

Evidence:
- ✅ Implemented (code exists and compiles)
- ✅ Tested (12/12 unit tests pass - see test output)
- ❌ Integrated (integration tests not written)
- ❌ Validated (not tested in production-like conditions)
- ❌ Complete (not documented, not deployed)

Remaining:
1. Integration tests
2. Load testing
3. Documentation
4. Deployment
```

---

## Configuration

Edit `.claude/hooks.json` to adjust:

```json
{
  "pre_commit": {
    "enabled": true,
    "gates": [
      {
        "id": "no-fabricated-metrics",
        "severity": "error"  // error | warning | info
      }
    ]
  }
}
```

### Severity Levels
- **error** - Blocks commit/generation
- **warning** - Allows but flags
- **info** - Informational only

---

## Emergency Override

```bash
# Skip all hooks (use sparingly!)
git commit --no-verify

# Skip specific hook
SKIP_HOOK=metrics-validation git commit
```

⚠️ **All overrides are logged**

---

## Measuring Success

Track these metrics:

```yaml
Hook Effectiveness:
  trigger_rate: How often hooks trigger?
  false_positive_rate: How often incorrectly flagged?
  issues_prevented: How many issues caught?
  time_overhead: Time added to workflow?

Acceptable Thresholds:
  time_overhead: < 5 seconds
  issue_prevention_rate: > 95%
  false_positive_rate: < 5%
```

---

## Troubleshooting

### Hook fails with "Missing Evidence"

**Problem:** Metric without measurement details

**Fix:** Add tool, command, timestamp within 5 lines:

```typescript
// Coverage: 94.7%
// Measured: jest --coverage on 2025-12-06
// Command: npm test -- --coverage
```

### Hook fails with "Forbidden Phrase"

**Problem:** Vague language like "should work"

**Fix:** Replace with specific tested conditions:

```typescript
// Tested to work for inputs: X, Y, Z
// Untested for: A, B, C
```

### Hook fails with "Missing Error Handling"

**Problem:** Async operation without try-catch

**Fix:** Add specific error types:

```typescript
try {
  const result = await riskyOperation();
} catch (error) {
  if (error instanceof SpecificError) {
    // Handle specifically
  }
  throw error;
}
```

---

## Philosophy

### From EXECUTIVE_CLAUDE.md

> "Quality gates as circuit breakers: Each stage produces evidence that
> validates before proceeding. Failed validation triggers investigation,
> not workarounds."

### From UPLIFTED_SKILLS.md

> "Truth over speed: Better to acknowledge gaps than fabricate evidence.
> Never invent sources, citations, or data to fill knowledge gaps."

> "Implementation ≠ Completion: Working code is one checkpoint, not the
> finish line. Don't claim the end when you're at the beginning."

---

## What Makes This Unique

**Traditional linters** check syntax and style.

**These hooks** check semantic meaning and evidence:

- Is this metric fabricated or measured?
- Is this claim based on evidence or opinion?
- Is this status accurate or overclaimed?
- Is this citation real or invented?
- Is error handling present and specific?

**This is evidence-based engineering enforcement.**

---

## Support

- **Questions**: See HOOKS_IMPLEMENTATION_GUIDE.md
- **False positives**: Document in `.claude/hooks/feedback.md`
- **New validators**: Propose in issues
- **Configuration help**: See hooks.json comments

---

## Next Steps

1. ✅ Review documentation (HOOKS_SUMMARY.md)
2. ⬜ Install hooks (chmod + ln -s)
3. ⬜ Test on current codebase
4. ⬜ Adjust sensitivity based on false positives
5. ⬜ Track metrics (trigger rate, overhead)
6. ⬜ Iterate and refine

---

## Success Criteria

This system succeeds when:

✅ Zero fabricated metrics in commits
✅ All claims backed by verifiable evidence
✅ Status accuracy matches actual progress
✅ All risky operations have error handling
✅ Citations are verifiable
✅ "I don't know" appears regularly
✅ Vague language replaced with precision
✅ Limitations documented as thoroughly as features

---

**Every commit, every claim, every metric should be defensible.**

*Based on: EXECUTIVE_CLAUDE.md + UPLIFTED_SKILLS.md*
*Purpose: Enforce quality gates for evidence-based code generation*
*Version: 1.0.0*
*Created: 2025-12-06*
