# Claude Code Quality Hooks System
## Implementation Guide

**Version:** 1.0.0
**Last Updated:** 2025-12-06
**Purpose:** Enforce evidence-based practices and prevent fabrication in all code generation

---

## Overview

This hooks system implements quality gates at three critical points in the development workflow:

1. **Pre-Commit Hooks** - Validate code before committing to version control
2. **User-Prompt-Submit Hooks** - Check prompts before generating code
3. **Post-Tool-Use Hooks** - Validate generated code before presenting to user

All hooks enforce the quality principles from `EXECUTIVE_CLAUDE.md` and `UPLIFTED_SKILLS.md`.

---

## Quality Principles Enforced

### Core Principles

1. **Truth Over Speed**
   - Never fabricate sources, citations, or data
   - Incomplete but honest > complete but fabricated
   - Acknowledge gaps rather than fill with fiction

2. **Evidence-Based Claims**
   - Empirical measurement > peer-reviewed > expert opinion > inference
   - All quantitative claims require verifiable sources
   - "I don't know" is a valid and valuable answer

3. **No Metric Fabrication**
   - All metrics must include measurement methodology
   - No invented scores, percentages, or quality ratings
   - Round numbers flagged as suspicious

4. **Proper Error Handling**
   - All risky operations must have error handling
   - Specific error types, not generic catch-all
   - Failure modes must be documented

5. **Honest Progress Tracking**
   - Implementation ≠ Tested ≠ Integrated ≠ Validated ≠ Complete
   - Status claims must match evidence
   - Vague progress ("mostly done") is forbidden

6. **Language Precision**
   - "Excellent" → specific observations
   - "Approximately" → error margin
   - "Should work" → "tested to work under conditions X"

---

## Hook Architecture

```
User Prompt
    ↓
[User-Prompt-Submit Hooks]
    ↓
Code Generation (Claude)
    ↓
[Post-Tool-Use Hooks]
    ↓
Present to User
    ↓
User Reviews
    ↓
git commit
    ↓
[Pre-Commit Hooks]
    ↓
Commit Allowed/Blocked
```

---

## 1. Pre-Commit Hooks

### What They Validate

#### 1.1 No Fabricated Metrics (`metrics-validator.ts`)

**Checks:**
- All percentages have measurement evidence nearby
- Scores include rubric and calculation methodology
- Performance claims include baseline and measurement data
- Round numbers (100%, 0%, 50%) flagged as suspicious
- Quality superlatives replaced with specific observations

**Examples:**

❌ **BLOCKED:**
```typescript
// Code coverage is 95%
```

✅ **ALLOWED:**
```typescript
// Code coverage: 94.7% (measured with jest --coverage on 2025-12-06)
// Tool: jest v29.5.0
// Command: npm test -- --coverage
// Output: 94.7% statements, 91.2% branches, 96.1% functions
// Not tested: error handling in edge case X
```

---

❌ **BLOCKED:**
```markdown
Quality score: 8/10
```

✅ **ALLOWED:**
```markdown
Quality assessment:
- Rubric: Readability (3/3), Maintainability (2/3), Performance (3/3)
- Calculation: Sum of scores = 8/9 total points
- Methodology: Code review against team standards
- Deductions: -1 for cyclomatic complexity in function X
```

---

#### 1.2 Evidence-Based Claims (`evidence-validator.ts`)

**Forbidden Phrases:**
- "should work" → "tested to work under conditions X"
- "probably works" → "works in tested scenarios A, B, C; untested for D"
- "appears to work" → "passes tests X, Y, Z"
- "mostly complete" → "implemented X/Y features, remaining: Z"
- "production ready" → "passes tests X; deployment checklist: Y% complete"

**Examples:**

❌ **BLOCKED:**
```typescript
// This should work for most use cases
```

✅ **ALLOWED:**
```typescript
// Tested to work for inputs 0-10000 (integration test: test/large-inputs.spec.ts)
// Untested for: negative numbers, floats, edge case at MAX_INT
```

---

#### 1.3 Error Handling Required (`error-handling-validator.ts`)

**Checks:**
- All async functions have try-catch or .catch()
- All API calls handle network errors
- All file operations handle file system errors
- All database operations handle connection/query errors
- No empty catch blocks
- No generic catch(e) without specific error types

**Examples:**

❌ **BLOCKED:**
```typescript
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

✅ **ALLOWED:**
```typescript
async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof NetworkError) {
      logger.error('Network error fetching user', { id, error });
      throw error;
    }
    if (error instanceof SyntaxError) {
      logger.error('Invalid JSON in user response', { id });
      throw new DataError('Invalid user data received');
    }
    throw error;
  }
}
```

---

#### 1.4 Completion Status Accuracy (`completion-validator.ts`)

**Status Levels:**

1. **Implemented** - Code exists and compiles
2. **Tested** - Code passes defined unit tests
3. **Integrated** - Code works with other components
4. **Validated** - Code meets requirements in realistic conditions
5. **Complete** - All above + documented + deployed

**Examples:**

❌ **BLOCKED:**
```markdown
Status: Complete ✓

- Implemented user authentication
- Tests pass
```

✅ **ALLOWED:**
```markdown
Status: Tested

Evidence:
- Implemented: Code exists in src/auth/ and compiles (no TS errors)
- Tested: 12/12 unit tests pass (jest output: 2025-12-06 14:23)
  - Test file: src/auth/__tests__/auth.spec.ts
  - Coverage: 89% line coverage

Remaining for Integration:
- Integration tests with database (not yet written)
- End-to-end auth flow test (not yet written)

Remaining for Validation:
- Test with production-like data volume
- Performance testing under load
- Security audit

Remaining for Complete:
- API documentation
- Deployment to staging environment
```

---

#### 1.5 No Citation Fabrication

**Checks:**
- All PMIDs are verified via PubMed API
- All DOIs are verified via CrossRef API
- All URLs return 200 OK (or explicit reason if not)
- No "example" citations
- No suspiciously short PMIDs (< 7 digits)

**Examples:**

❌ **BLOCKED:**
```markdown
Research shows that multi-agent systems improve performance by 90% [1].

[1] Smith et al. "Multi-Agent Performance" PMID: 12345
```

✅ **ALLOWED:**
```markdown
Research shows that orchestrator-worker patterns show 90.2% improvement [1].

[1] Chen, K., et al. (2024). "Hierarchical Multi-Agent Coordination in Large
    Language Model Systems"
    DOI: 10.1145/3589334.3645522
    Verified: 2025-12-06 via CrossRef API
    Note: Specific metric from Table 2, page 7
```

---

### Installation

```bash
# Make the pre-commit hook executable
chmod +x .claude/hooks/pre-commit

# Link to git hooks
ln -s ../../.claude/hooks/pre-commit .git/hooks/pre-commit

# Install dependencies
cd .claude/hooks
npm install
```

### Running Manually

```bash
# Run on staged files
.claude/hooks/pre-commit

# Run on specific files
node .claude/hooks/validators/metrics-validator.ts path/to/file.ts
```

---

## 2. User-Prompt-Submit Hooks

These hooks analyze the user's prompt BEFORE generating code to ensure clarity and catch problematic requests.

### What They Check

#### 2.1 Intent Clarification

Before generating code, ensure we understand:

- **WHAT**: What specific outcome is needed?
- **WHY**: Why does this matter / what problem does it solve?
- **SUCCESS**: How will we know if this succeeded?
- **CONSTRAINTS**: What are the non-negotiable requirements?

**Example Dialogue:**

User: "Make the API faster"

Hook Response:
```
Intent Clarification Needed:

Questions to clarify before proceeding:
1. What specific endpoints or operations are slow?
2. What is the current performance (baseline measurement)?
3. What is the target performance (success criteria)?
4. What constraints exist? (backward compatibility, resource limits, etc.)
5. How will performance be measured to validate improvement?

Cannot proceed with code generation until intent is clear.
Reason: Performance optimization requires baseline measurement and
success criteria to avoid fabricating improvement claims.
```

---

#### 2.2 Scope Boundary Check

Define clear boundaries:

- **IN SCOPE**: What features/behaviors ARE included
- **OUT OF SCOPE**: What features/behaviors are NOT included
- **ASSUMPTIONS**: What are we assuming?
- **UNKNOWNS**: What don't we know yet?

**Example:**

User: "Add authentication to the app"

Hook Response:
```
Scope Boundary Definition Needed:

Please clarify:

IN SCOPE:
- [ ] Login/logout?
- [ ] Registration?
- [ ] Password reset?
- [ ] Session management?
- [ ] Multi-factor auth?
- [ ] OAuth providers (which ones)?

OUT OF SCOPE:
- [ ] What are we NOT doing?

CONSTRAINTS:
- [ ] Must work with existing database?
- [ ] Must preserve existing sessions?
- [ ] Security requirements (OWASP compliance)?

ASSUMPTIONS:
- [ ] What can we assume about the environment?
```

---

#### 2.3 Evidence Availability Check

Verify we have tools to support claims:

**Checks:**
- If claiming performance → require access to benchmarking tools
- If claiming quality → require access to linting/analysis tools
- If claiming coverage → require access to coverage measurement tools
- If making comparisons → require baseline measurements

**Example:**

User: "Optimize the database queries to be 2x faster"

Hook Response:
```
Evidence Availability Check:

To support performance improvement claims, I need:

✅ Available:
- Benchmarking tool (hyperfine, ab, or similar)
- Query profiler access

❌ Missing:
- Baseline measurements (current query performance)
- Target environment specification (dev vs prod?)

Action Required:
Please provide baseline measurements or allow me to run benchmarks
before optimization. This ensures we can verify actual improvement
rather than claiming fabricated performance gains.

Would you like me to:
1. First benchmark current performance, then optimize?
2. Optimize without performance claims?
```

---

#### 2.4 Anti-Pattern Detection

Detect if the request itself is problematic:

**Flags:**
- Request for scores without defined rubric
- Request for metrics without measurement tools
- Request for "example" citations/data
- Request for completion estimates without enumerable checklist

**Example:**

User: "Generate a quality score for this codebase"

Hook Response:
```
⚠️  Anti-Pattern Detected: Score Without Rubric

This request would require fabricating a quality score.

Problem:
Quality scores require a defined rubric with specific criteria
and weights. Without this, any score would be subjective opinion
presented as objective measurement.

Alternatives:

Option 1: Define rubric first
- Let me help you create a quality rubric based on your priorities
- Then we can evaluate the codebase against specific criteria
- This produces a defensible, non-fabricated score

Option 2: Qualitative assessment
- Provide specific observations (complexity metrics, lint results,
  test coverage, adherence to standards)
- No single score, but verifiable observations

Which approach would you prefer?
```

---

### Implementation in Claude Code

These hooks would be implemented as Claude's internal validation before generating code:

```typescript
// Pseudo-code for Claude's prompt processing
async function processUserPrompt(prompt: string): Promise<void> {
  // Run user-prompt-submit hooks
  const intentCheck = await checkIntentClarity(prompt);
  if (!intentCheck.clear) {
    await askClarifyingQuestions(intentCheck.questions);
    return; // Don't proceed until clarity achieved
  }

  const scopeCheck = await checkScopeDefinition(prompt);
  if (!scopeCheck.defined) {
    await requestScopeDefinition(scopeCheck.template);
    return;
  }

  const evidenceCheck = await checkEvidenceAvailability(prompt);
  if (!evidenceCheck.available) {
    await negotiateEvidenceApproach(evidenceCheck.missing);
    return;
  }

  const antiPatternCheck = await detectAntiPatterns(prompt);
  if (antiPatternCheck.detected) {
    await suggestAlternatives(antiPatternCheck.issues);
    return;
  }

  // All hooks passed, proceed with code generation
  await generateCode(prompt);
}
```

---

## 3. Post-Tool-Use Hooks

These hooks validate generated code BEFORE presenting to the user.

### What They Validate

#### 3.1 Output Evidence Validation

**Scans for:**
- Metrics without measurement methodology
- Metrics without timestamps
- Percentages without denominators
- Scores without rubric reference
- Improvement claims without baseline
- Suspiciously round numbers

**Action:**
If found, automatically adds disclaimer or requests evidence.

**Example:**

Generated code includes:
```typescript
// Coverage improved to 95%
```

Hook auto-corrects to:
```typescript
// Coverage: [MEASUREMENT NEEDED]
// TODO: Run coverage tool and record:
//   - Tool used (e.g., jest --coverage)
//   - Command run
//   - Timestamp
//   - Exact output
//   - What was NOT tested
```

---

#### 3.2 Language Precision Check

**Flags and auto-corrects:**

| Vague Term | Replacement |
|------------|-------------|
| "excellent" | "Specific observations: [LIST]" |
| "production-ready" | "Status: [LEVEL], remaining: [ITEMS]" |
| "mostly complete" | "X/Y complete, remaining: Z" |
| "approximately" | "X ± Y" or "X (estimated via METHOD)" |
| "should work" | "tested to work for [CONDITIONS], untested for [CONDITIONS]" |

---

#### 3.3 Uncertainty Documentation

**Every output must include:**

1. **Limitations Section**
   - What are the known limitations?
   - What edge cases aren't handled?

2. **Untested Section**
   - What hasn't been tested?
   - What assumptions were made?

3. **Confidence Level**
   - How confident are we?
   - What would increase confidence?

**Example Auto-Added Section:**

```markdown
## Limitations

### Tested:
- User authentication with valid credentials
- Session timeout after 30 minutes
- Password validation (length, complexity)

### Not Tested:
- Concurrent login attempts
- Database connection failures during auth
- Session behavior under high load (1000+ simultaneous users)

### Assumptions:
- Database is always available (no retry logic)
- Clock skew between server and client < 5 minutes
- Single datacenter (no geo-distribution)

### Confidence:
Medium - Works for stated use cases, but untested for production load.

To increase confidence:
- [ ] Load testing with 1000+ concurrent users
- [ ] Chaos engineering (simulate database failures)
- [ ] Security audit by external team
```

---

#### 3.4 Implementation vs Completion Check

**Validates:**
- Code claiming "complete" actually has tests
- Code claiming "tested" actually has test output
- Code claiming "validated" actually has validation evidence

**Auto-correction:**

If code claims:
```markdown
Status: Complete ✓
```

But only has implementation and tests, auto-corrects to:
```markdown
Status: Tested

Evidence:
- ✅ Implemented (code exists and compiles)
- ✅ Tested (unit tests pass)
- ❌ Integrated (integration tests not yet written)
- ❌ Validated (not tested in realistic conditions)
- ❌ Complete (not documented, not deployed)

To reach Complete:
1. Write integration tests with other components
2. Run in staging environment with realistic data
3. Complete documentation (API docs, usage guide)
4. Deploy to production
```

---

### Implementation in Claude Code

```typescript
// Pseudo-code for post-generation validation
async function validateGeneratedOutput(output: string): Promise<void> {
  // Run all post-tool-use validators
  const metricsValidation = await validateMetrics(output);
  const languageValidation = await validateLanguage(output);
  const uncertaintyValidation = await validateUncertainty(output);
  const statusValidation = await validateStatusClaims(output);

  // Auto-correct issues where possible
  let correctedOutput = output;

  if (!metricsValidation.valid) {
    correctedOutput = await addMeasurementPlaceholders(correctedOutput);
  }

  if (!languageValidation.valid) {
    correctedOutput = await replacePrecisionIssues(correctedOutput);
  }

  if (!uncertaintyValidation.valid) {
    correctedOutput = await addLimitationsSection(correctedOutput);
  }

  if (!statusValidation.valid) {
    correctedOutput = await downgradeStatusClaims(correctedOutput);
  }

  // Present corrected output to user
  return correctedOutput;
}
```

---

## Hook Configuration

All hooks are configured via `.claude/hooks.json`:

```json
{
  "pre_commit": {
    "enabled": true,
    "gates": [
      { "id": "no-fabricated-metrics", "severity": "error" },
      { "id": "evidence-based-claims", "severity": "error" },
      { "id": "error-handling-required", "severity": "error" },
      { "id": "test-coverage-validation", "severity": "warning" },
      { "id": "completion-status-accuracy", "severity": "error" }
    ]
  },
  "user_prompt_submit": {
    "enabled": true,
    "gates": [
      { "id": "intent-clarification", "severity": "info" },
      { "id": "scope-boundary-check", "severity": "info" },
      { "id": "evidence-availability", "severity": "warning" }
    ]
  },
  "post_tool_use": {
    "enabled": true,
    "gates": [
      { "id": "output-evidence-validation", "severity": "error" },
      { "id": "language-precision-check", "severity": "warning" },
      { "id": "uncertainty-documentation", "severity": "warning" }
    ]
  }
}
```

### Severity Levels

- **error** - Blocks commit/generation
- **warning** - Allows but flags for review
- **info** - Informational only

---

## Overriding Hooks (Emergency Use)

In rare cases, you may need to override hooks:

```bash
# Skip pre-commit hooks (requires explicit approval)
git commit --no-verify

# Skip specific hook
SKIP_HOOK=metrics-validation git commit
```

**⚠️  WARNING:** All overrides are logged and should be justified.

---

## Measuring Hook Effectiveness

Track these metrics to ensure hooks are working:

```json
{
  "quality_metrics": {
    "hook_trigger_rate": "How often does each hook trigger?",
    "false_positive_rate": "How often are hooks triggered incorrectly?",
    "issue_prevention_count": "How many issues caught before commit?",
    "time_overhead": "How much time do hooks add?"
  },
  "thresholds": {
    "acceptable_overhead_ms": 5000,
    "target_issue_prevention_rate": 0.95,
    "acceptable_false_positive_rate": 0.05
  }
}
```

---

## Examples: Complete Workflow

### Example 1: Adding a Feature

**Step 1: User Prompt**
```
User: Add a caching layer to improve API performance
```

**Step 2: User-Prompt-Submit Hook**
```
Intent Clarification:

Questions before proceeding:
1. What is the current API performance (baseline)?
2. What is the target performance (success criteria)?
3. Which endpoints should be cached?
4. What caching strategy? (TTL, LRU, etc.)
5. How will we measure improvement?

Scope Definition:
- IN SCOPE: ?
- OUT OF SCOPE: ?
- CONSTRAINTS: ?
```

**Step 3: User Responds**
```
User:
- Current: 500ms average response time (measured with curl, 2025-12-06)
- Target: <100ms for cached responses
- Cache: /api/products (changes infrequently)
- Strategy: Redis with 1-hour TTL
- Measure: Compare before/after with same benchmark
```

**Step 4: Code Generation**
```typescript
// Claude generates code with proper error handling
```

**Step 5: Post-Tool-Use Hook**
```
Auto-adds:

## Performance Claims

Baseline: 500ms average (measured with: curl -w "%{time_total}" repeated 100x)
Implementation: Redis caching with 1-hour TTL
Expected: <100ms for cached hits (estimated, not yet measured)

## Limitations
- Not yet tested under production load
- Cache invalidation strategy: simple TTL (may serve stale data)
- No distributed cache (single Redis instance)

## Status: Implemented
- ✅ Code exists and compiles
- ❌ Tests (need to write)
- ❌ Benchmark (need to measure actual improvement)
```

**Step 6: User Reviews and Tests**
```typescript
// User runs benchmarks
// Actual result: 85ms average for cached hits
```

**Step 7: Update with Real Data**
```typescript
## Performance Results

Baseline: 500ms average (measured: curl 2025-12-06 14:23)
After caching: 85ms average for cache hits (measured: curl 2025-12-06 15:45)
Improvement: 83% reduction in response time
Cache hit rate: 92% (Redis INFO stats)

Methodology:
- Tool: curl -w "%{time_total}"
- Sample size: 1000 requests
- Environment: Staging server (8GB RAM, 4 CPU)
- Date: 2025-12-06
```

**Step 8: Commit**
```bash
git add .
git commit -m "Add Redis caching to /api/products"

# Pre-commit hook runs
✅ Metrics validation passed (has measurement evidence)
✅ Evidence validation passed (claims backed by data)
✅ Error handling passed (Redis errors handled)
✅ Status accuracy passed (marked as Tested, not Complete)

Commit allowed ✓
```

---

## Troubleshooting

### Hook Fails with "Missing Evidence"

**Problem:** Metric claim without nearby evidence

**Solution:** Add measurement details within 5 lines of claim:

```typescript
// ❌ This will fail
const coverage = 95%;

// ✅ This will pass
const coverage = 94.7; // Measured with jest --coverage on 2025-12-06
// Command: npm test -- --coverage
// Output: 94.7% statements, 91.2% branches
```

### Hook Fails with "Forbidden Phrase"

**Problem:** Using vague language like "should work"

**Solution:** Replace with specific, evidence-based language:

```typescript
// ❌ This should work for most inputs
function parse(input: string) { ... }

// ✅ Tested to work for inputs: strings 0-10000 chars, UTF-8 encoded
// Untested for: binary data, non-UTF-8 encodings
function parse(input: string) { ... }
```

### Hook Fails with "Missing Error Handling"

**Problem:** Async operation without try-catch

**Solution:** Add specific error handling:

```typescript
// ❌ No error handling
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}

// ✅ With error handling
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new HTTPError(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof HTTPError) {
      logger.error('HTTP error', { error });
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new DataError('Invalid JSON');
    }
    throw error;
  }
}
```

---

## Meta-Principles Summary

All hooks enforce these meta-principles:

1. **Truth Over Speed** - Honest gaps > fabricated completeness
2. **Measurement Over Opinion** - Data > superlatives
3. **Precision Over Approximation** - Exact numbers with error bars
4. **Uncertainty is Honest** - "I don't know" is valid
5. **Evidence Hierarchy** - Empirical > documented > inferred
6. **Implementation ≠ Completion** - Status accuracy matters

---

## Next Steps

1. **Install hooks**: Follow installation instructions above
2. **Test on existing code**: Run validators on current codebase
3. **Adjust thresholds**: Tune sensitivity based on false positives
4. **Track metrics**: Monitor hook effectiveness over time
5. **Iterate**: Refine validators based on real-world usage

---

## Support & Feedback

- Issues with hooks: Document false positives/negatives
- Suggested improvements: Propose new validators or refinements
- Override justifications: Log why hooks were bypassed

---

**Document Status:** Living specification - evolve based on learnings
**Next Review:** After 100 commits with hooks active
**Feedback Location:** `.claude/hooks/feedback.md`
