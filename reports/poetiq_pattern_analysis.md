# Poetiq ARC-AGI Solver Pattern Analysis

**Analysis Date:** 2025-12-10
**Repository:** https://github.com/poetiq-ai/poetiq-arc-agi-solver
**Analyst:** AUDITOR Agent
**Purpose:** Extract patterns for Sartor Phase 6 multi-expert implementation

---

## Executive Summary

The poetiq-arc-agi-solver repository implements a multi-model reasoning system for the ARC-AGI benchmark. Analysis reveals a **simpler architecture than expected**, with key divergences from Sartor's design philosophy. The system uses parallel iteration rather than ensemble voting, binary scoring instead of soft scoring, and basic subprocess sandboxing.

**Key Finding:** Poetiq's "diversity-first" approach refers to **solution output grouping**, not archetype diversity or multi-dimensional scoring. This is a fundamentally different concept than Sartor's diversity scorer.

---

## Repository Structure Overview

### Core Architecture
```
poetiq-arc-agi-solver/
├── arc_agi/
│   ├── llm.py                    # LLM interface with retry logic
│   ├── solve.py                  # Coordination wrapper
│   ├── solve_coding.py           # Single expert iteration loop
│   ├── solve_parallel_coding.py # Parallel expert coordination
│   ├── sandbox.py                # Subprocess isolation
│   ├── scoring.py                # Binary scoring (NOT soft)
│   ├── config.py                 # Expert configuration
│   ├── prompts.py                # Prompt templates
│   ├── types.py                  # Type definitions
│   └── utils.py                  # Utilities
├── main.py                       # Entry point
└── config.py                     # System configuration
```

**Evidence:** Repository file listing from GitHub web interface, analyzed 2025-12-10.

### Key Components Identified

1. **Parallel Execution** - `solve_parallel_coding.py`
2. **Voting/Consensus** - Implemented as solution output bucketing
3. **Sandboxing** - `sandbox.py` with subprocess isolation
4. **Scoring** - `scoring.py` (BINARY, not soft 0-100)
5. **LLM Coordination** - `llm.py` with retry and rate limiting

---

## Pattern 1: Parallel Expert Execution

### How It Works (Evidence-Based)

**File:** `arc_agi/solve_parallel_coding.py`

```python
# Poetiq creates parallel tasks using asyncio
tasks = [
    asyncio.create_task(
        solve_coding(
            train_in=train_in,
            train_out=train_out,
            test_in=test_in,
            config=cfg,
            problem_id=problem_id,
        )
    )
    for cfg in expert_configs
]
results: list[ARCAGIResult] = await asyncio.gather(*tasks)
```

**Key Patterns:**
- Uses `asyncio.gather()` for true parallel execution
- Each expert receives a unique seed: `cfg["seed"] += it * cfg["max_iterations"]`
- No dependency between expert executions (fully independent)
- Results collected into a flat list structure

**Configuration:** `config.py`
- 1, 2, or 8 experts (configurable via NUM_EXPERTS)
- Temperature: 1.0 (maximum diversity)
- Shuffle examples: True
- Max iterations per expert: 10
- Max solutions: 5

### Mapping to Sartor

**Sartor Current Implementation:** `/home/alton/Sartor-claude-network/src/multi-expert/execution-engine.ts`

```typescript
// Sartor already implements similar pattern
async executeWithExperts(task: ExpertTask, experts: ExpertConfig[]): Promise<MultiExpertResult> {
  const executions = experts.map(expert => this.executeExpert(task, expert));
  const results = await Promise.allSettled(executions);
  // ...
}
```

**Alignment:** ✓ STRONG
**Gap:** None - Sartor's approach is already equivalent or better (uses Promise.allSettled for error isolation)

**Recommendation:** Keep existing Sartor implementation. Poetiq's `asyncio.gather()` pattern validates our design.

---

## Pattern 2: Voting and Consensus Mechanisms

### How It Works (Evidence-Based)

**File:** `arc_agi/solve_parallel_coding.py`

**CRITICAL FINDING:** Poetiq does NOT use traditional voting. Instead, it uses **solution output bucketing**:

```python
# Solutions grouped by identical test outputs
candidate_buckets  # Passing solutions, grouped by output signature
failure_buckets    # Failing solutions, grouped by output signature

# "Voting" = counting solutions with same output
# Groups sorted by size (most common output = "votes")
```

**Selection Algorithm:**
1. Group passing solutions by identical test outputs
2. Sort groups by size (most common output wins)
3. Within each group, optionally select by lowest iterations
4. Order: "diversity-first over groups, then remaining members"
5. Failures ranked by mean soft score, then group size

**Configuration Parameters:** `config.py`
- `new_voting`: True (enable new voting mode)
- `count_failed_matches`: True (include failures matching candidate outputs)
- `select_first_iteration_from_bucket`: False
- `low_to_high_iterations`: False

### Mapping to Sartor

**Sartor Current Implementation:** `/home/alton/Sartor-claude-network/src/multi-expert/voting-system.ts`

Sartor implements **traditional voting methods**:
- Majority voting (plurality)
- Ranked-choice voting (instant runoff)
- Borda count (positional scoring)
- Weighted voting (by confidence)

**DIVERGENCE:** ⚠️ FUNDAMENTAL DIFFERENCE

Poetiq's "voting" is actually **consensus detection via output clustering**. This is appropriate for puzzle-solving where outputs are discrete and comparable.

Sartor's voting is appropriate for **subjective solution ranking** where multiple valid solutions exist.

**Recommendation:**
- **KEEP Sartor's voting system** - It's more general-purpose
- **ADD output clustering** as a separate feature for specific use cases
- **DO NOT replace** existing voting with Poetiq's approach
- Document this as "consensus detection" not "voting" to avoid confusion

---

## Pattern 3: Diversity Scoring

### How It Works (Evidence-Based)

**CRITICAL FINDING:** Poetiq has NO diversity scorer as Sartor understands it.

**What Poetiq's "diversity-first" means:**
- Solutions are bucketed by output similarity
- "Diversity-first" = select from DIFFERENT output buckets before same bucket
- NOT archetype diversity
- NOT approach diversity
- NOT multi-dimensional scoring

**Evidence:** Analysis of `solve_parallel_coding.py` shows:
- No diversity scoring module
- No archetype variation tracking
- No solution approach clustering
- Only output signature comparison

### Mapping to Sartor

**Sartor Current Implementation:** `/home/alton/Sartor-claude-network/src/multi-expert/diversity-scorer.ts`

Sartor's diversity scorer implements:
- Archetype uniqueness scoring
- Output similarity detection (Jaccard-like)
- Novelty tracking against previously seen solutions
- Multi-dimensional scoring (archetype, uniqueness, novelty)

**Alignment:** ✗ NO OVERLAP

**Recommendation:**
- **KEEP Sartor's diversity scorer** - It's more sophisticated
- **DO NOT modify** based on Poetiq patterns
- Sartor's approach is superior for multi-expert coordination
- Poetiq's "diversity" is output deduplication, not true diversity scoring

---

## Pattern 4: Soft Scoring (0-100 vs Binary)

### How It Works (Evidence-Based)

**File:** `arc_agi/scoring.py`

**CRITICAL FINDING:** Poetiq uses **BINARY scoring**, NOT soft scoring (0-100).

```python
# Poetiq's scoring implementation
correct / max(len(gt_outputs), 1)  # Produces 0.0-1.0 range
# Evaluation: attempt_1 or attempt_2 matches ground truth EXACTLY
# "Strict structural equality for ARC grids (list[list[int]])"
```

**Scoring Characteristics:**
- Binary outcomes only (correct=1, incorrect=0)
- Dual attempt allowance (two chances per input)
- No ranking mechanism
- No partial credit
- No tolerance for near-matches
- Task-level accuracy = proportion correct

**Evidence:** Direct quote from WebFetch analysis: "No soft scoring, diversity metrics, or solution ranking mechanisms are present in this implementation."

### Mapping to Sartor

**Sartor Current Implementation:** `/home/alton/Sartor-claude-network/src/multi-expert/soft-scorer.ts`

Sartor implements true soft scoring:
- 0-100 range with partial credit
- Multi-dimensional (correctness, completeness, quality, efficiency)
- Confidence weighting
- Bonus/penalty system
- Statistical pool analysis

**Alignment:** ✗ COMPLETE MISMATCH

**Recommendation:**
- **KEEP Sartor's soft scorer** - It's far more sophisticated
- **DO NOT adopt** Poetiq's binary approach
- Poetiq's binary scoring is appropriate for puzzle-solving only
- Sartor's soft scoring is necessary for general-purpose expert coordination
- **FLAG THIS AS MISINFORMATION** - Any claims that Poetiq uses "soft scoring" are incorrect

---

## Pattern 5: Sandboxing Approaches

### How It Works (Evidence-Based)

**File:** `arc_agi/sandbox.py`

```python
# Subprocess isolation
asyncio.create_subprocess_exec()  # Separate Python process
PYTHONHASHSEED=0  # Deterministic execution

# Security measures
- Process containment (isolated subprocess)
- Limited imports (json, numpy, scipy only)
- Input/output via stdin/stdout as JSON
- Timeout: 1.5 seconds maximum
- Process kill on timeout

# Error handling
- Timeout enforcement (kills non-responsive processes)
- Return code detection
- JSON parsing validation
- ProcessLookupError handling
```

**Limitations (per analysis):**
- No OS-level sandboxing (no containers, seccomp, resource limits)
- "A determined adversary could potentially escape via Python vulnerabilities"
- "Could consume excessive system resources before timeout triggers"

### Mapping to Sartor

**Sartor Current Implementation:** `/home/alton/Sartor-claude-network/src/multi-expert/sandbox-executor.ts`

```typescript
// Subprocess isolation with Node.js spawn
spawn(command, args, {
  cwd: this.config.cwd,
  env,
  shell: this.config.shell,
  timeout: this.config.timeout,
});

// Features
- Timeout enforcement (SIGKILL on timeout)
- Memory limits (NODE_OPTIONS --max-old-space-size)
- Output size limits (1MB default)
- JSON parsing support
- Multi-language support (JS, TS, Python)
```

**Alignment:** ✓ STRONG

Both implementations use similar subprocess isolation patterns.

**Recommendation:**
- **KEEP Sartor's sandbox executor** - Already equivalent
- **CONSIDER ADDING:**
  - Deterministic seeding (PYTHONHASHSEED=0 equivalent)
  - More restrictive environment (limit available imports)
  - Network isolation flags
- **DO NOT WEAKEN** existing security measures
- Both systems share same fundamental limitation (no OS-level containerization)

**Enhancement Ideas:**
- Add Docker container option for true isolation
- Implement resource cgroups (Linux)
- Add seccomp filters for syscall restrictions

---

## Pattern 6: LLM Retry and Rate Limiting

### How It Works (Evidence-Based)

**File:** `arc_agi/llm.py`

```python
# Rate limiting per model
limiters = {
  "gemini/gemini-2.5-pro": Limiter(2.0),  # Higher concurrency
  # Most others: Limiter(1.0)
}

# Retry logic
- Up to 3 attempts (configurable)
- Specific exceptions don't count against retries:
  - Rate limits
  - Server errors
  - Connection failures
- RETRY_DELAY_SEC = 5 seconds between attempts

# Error handling tiers
1. Transparent retries (rate limits, service errors)
2. Timeout management (max_remaining_timeouts counter)
3. Fatal errors (exhaust retries and re-raise)
```

**Key Pattern:** "No coordination logic for sequential or dependent LLM calls. Each invocation is independent."

### Mapping to Sartor

**Sartor Implementation:** Not explicitly implemented in multi-expert module.

**Alignment:** ⚠️ GAP IDENTIFIED

**Recommendation:**
- **ADD rate limiting** to Sartor's LLM integration layer
- **ADD retry logic** with exponential backoff
- **IMPLEMENT per-model limiters** for different API providers
- **DO NOT add** to multi-expert module (belongs in LLM client layer)
- Place in integration or utility layer, not multi-expert orchestration

---

## Pattern 7: Iterative Refinement with Feedback

### How It Works (Evidence-Based)

**File:** `arc_agi/solve_coding.py`

```python
# Solution generation loop
for iteration in range(max_iterations):
  # Generate solution via LLM
  # Execute against training data
  # Compare predicted vs ground truth

  # Validation
  success = bool(arr.shape == truth.shape and np.array_equal(arr, truth))

  # Feedback generation for failures
  - Shape mismatches
  - Element-by-element comparisons ("prediction/correct" pairs)
  - Execution errors

  # Feedback enters example pool for next iteration
  # "mean_score" across training examples guides refinement
  # Early termination if all training examples solved
```

**Key Patterns:**
- Iterative improvement loop (up to 10 iterations)
- Training data validation at each step
- Detailed diagnostic feedback generation
- Soft scoring used internally (pixel-level accuracy)
- Best solution retention (highest training accuracy)

### Mapping to Sartor

**Sartor Current Implementation:** `/home/alton/Sartor-claude-network/src/multi-expert/feedback-loop.ts`

Sartor implements feedback collection and refinement loops with similar patterns.

**Alignment:** ✓ STRONG

**Recommendation:**
- **KEEP existing feedback loop** - Already well-designed
- **CONSIDER ADDING:**
  - Training data validation pattern (if applicable to tasks)
  - More detailed diagnostic feedback templates
  - Soft score tracking across iterations
  - Early termination on quality thresholds

---

## Architectural Mapping to Sartor

### Sartor's Multi-Expert Structure

```
/home/alton/Sartor-claude-network/src/multi-expert/
├── orchestrator.ts          # Top-level coordination (similar to solve.py)
├── execution-engine.ts      # Parallel execution (similar to solve_parallel_coding.py)
├── expert-config.ts         # Expert definitions (similar to config.py)
├── voting-system.ts         # Traditional voting (DIFFERENT from Poetiq)
├── diversity-scorer.ts      # Archetype diversity (NOT in Poetiq)
├── soft-scorer.ts           # True 0-100 scoring (NOT in Poetiq)
├── sandbox-executor.ts      # Subprocess isolation (similar to sandbox.py)
├── feedback-loop.ts         # Refinement (similar to solve_coding.py iteration)
└── memory-integration.ts    # Memory layer (NOT in Poetiq)
```

### Component Alignment Matrix

| Sartor Component | Poetiq Equivalent | Alignment | Action |
|------------------|-------------------|-----------|--------|
| orchestrator.ts | solve.py | ✓ Similar | Keep |
| execution-engine.ts | solve_parallel_coding.py | ✓ Strong | Keep |
| expert-config.ts | config.py | ✓ Similar | Keep |
| voting-system.ts | solve_parallel_coding.py (bucketing) | ✗ Different | Keep Sartor's |
| diversity-scorer.ts | (Not present) | ✗ No equivalent | Keep |
| soft-scorer.ts | scoring.py | ✗ Opposite | Keep Sartor's |
| sandbox-executor.ts | sandbox.py | ✓ Strong | Keep, enhance |
| feedback-loop.ts | solve_coding.py | ✓ Similar | Keep, enhance |
| memory-integration.ts | (Not present) | ✗ No equivalent | Keep |

---

## Recommended Adaptations

### 1. Output Consensus Detection (NEW FEATURE)

**Pattern Source:** Poetiq's solution bucketing
**Sartor Location:** New module or add to voting-system.ts
**Implementation:**

```typescript
// Add to voting-system.ts
export interface OutputBucket {
  outputSignature: string;
  results: ExpertResult[];
  count: number;
}

export function detectConsensus(results: ExpertResult[]): OutputBucket[] {
  // Group by output similarity
  // Sort by bucket size
  // Return consensus candidates
}
```

**Use Case:** When task has verifiable output and multiple solutions produce same result.

### 2. Enhanced Sandbox Determinism

**Pattern Source:** Poetiq's PYTHONHASHSEED=0
**Sartor Location:** sandbox-executor.ts
**Implementation:**

```typescript
// Add to sandbox environment
env: {
  PYTHONHASHSEED: '0',
  NODE_ENV: 'sandbox',
  // Restrict network access
  NO_PROXY: '*',
}
```

### 3. Rate Limiting Layer

**Pattern Source:** Poetiq's LLM rate limiters
**Sartor Location:** New module in integration/ or utils/
**Implementation:**

```typescript
// New: src/integration/rate-limiter.ts
export class RateLimiter {
  private limiters: Map<string, TokenBucket>;

  async acquire(modelId: string): Promise<void> {
    // Token bucket algorithm
    // Per-model limits
  }
}
```

### 4. Training Data Validation Pattern

**Pattern Source:** Poetiq's solve_coding.py iteration
**Sartor Location:** feedback-loop.ts enhancement
**Implementation:**

```typescript
// Add to feedback-loop.ts
export interface ValidationResult {
  passed: boolean;
  score: number;
  feedback: string[];
  shapeMatch: boolean;
  valueMatch: boolean;
}

export async function validateAgainstTraining(
  solution: unknown,
  trainingData: unknown[]
): Promise<ValidationResult> {
  // Implement Poetiq's validation pattern
}
```

---

## Patterns to Avoid or Modify

### 1. Binary Scoring ❌

**Poetiq Pattern:** Strict binary (0 or 1, no partial credit)
**Why Avoid:** Too restrictive for general-purpose expert coordination
**Sartor's Approach:** Keep soft scoring (0-100) with partial credit

### 2. Output-Only "Diversity" ❌

**Poetiq Pattern:** Group solutions by identical outputs only
**Why Modify:** Sartor needs archetype and approach diversity
**Sartor's Approach:** Keep multi-dimensional diversity scoring

### 3. Shared-Nothing Expert Isolation ❌

**Poetiq Pattern:** Experts completely independent, no learning
**Why Modify:** Sartor benefits from memory and cross-expert learning
**Sartor's Approach:** Keep memory integration and experience sharing

### 4. Simple Vote Counting ❌

**Poetiq Pattern:** Count identical outputs as "votes"
**Why Modify:** Too simplistic for complex decision-making
**Sartor's Approach:** Keep sophisticated voting methods (ranked-choice, Borda, weighted)

---

## Risk Assessment

### Pattern Adoption Risks

| Pattern | Risk Level | Description | Mitigation |
|---------|-----------|-------------|------------|
| Parallel Execution | 🟢 Low | Already aligned | None needed |
| Output Bucketing | 🟡 Medium | Could oversimplify voting | Add as separate feature, don't replace |
| Binary Scoring | 🔴 High | Would eliminate nuance | Do not adopt |
| Subprocess Sandbox | 🟢 Low | Similar to existing | Enhance with determinism |
| Rate Limiting | 🟢 Low | Missing feature | Add to integration layer |
| Feedback Iteration | 🟢 Low | Already similar | Enhance with validation pattern |

### Complexity Risks

**Poetiq's Simplicity vs Sartor's Sophistication:**
- Poetiq is optimized for ARC-AGI puzzles (discrete, verifiable outputs)
- Sartor is designed for general-purpose multi-agent coordination
- Adopting Poetiq's simpler patterns could regress Sartor's capabilities

**Recommendation:** Cherry-pick specific techniques (rate limiting, determinism) but maintain Sartor's sophisticated approach to scoring, voting, and diversity.

---

## Evidence Quality Assessment

### Strong Evidence (Direct Code Analysis)

✓ Parallel execution pattern (solve_parallel_coding.py)
✓ Binary scoring implementation (scoring.py)
✓ Subprocess sandboxing (sandbox.py)
✓ LLM retry logic (llm.py)
✓ Configuration parameters (config.py)

### Weak Evidence (Inferred from Documentation)

⚠️ "Diversity-first" terminology (source: blog post reference, not code)
⚠️ Performance claims (not verified with empirical data)
⚠️ "Record-breaking" claims (referenced but not validated)

### No Evidence Available

✗ Actual performance metrics on ARC-AGI benchmark
✗ Comparison with other approaches
✗ Ablation studies showing which components matter
✗ Production deployment patterns
✗ Scale testing results

**Limitation:** Analysis based on code structure and documentation only. Cannot verify actual effectiveness of patterns without running experiments.

---

## Implementation Priority

### High Priority (Immediate Value)

1. **Rate Limiting Layer** - Missing from Sartor, clear value
2. **Sandbox Determinism** - Easy enhancement, low risk
3. **Output Consensus Detection** - New capability, complements voting

### Medium Priority (Consider for Phase 7)

4. **Training Data Validation Pattern** - Useful for specific task types
5. **Enhanced Error Handling** - Adopt Poetiq's retry tiers
6. **Feedback Template Improvements** - More detailed diagnostics

### Low Priority (Research/Future)

7. **OS-Level Sandboxing** - Both systems lack this, significant effort
8. **Docker Integration** - True isolation, but adds complexity
9. **Performance Monitoring** - Neither system has this well-developed

---

## Introspection Report

See separate file: `/home/alton/Sartor-claude-network/reports/agents/auditor_poetiq_review_20251210_214931.md`

---

## Conclusion

The poetiq-arc-agi-solver repository provides **validation** for Sartor's existing architecture (parallel execution, sandboxing, feedback loops) but does NOT provide sophisticated patterns for voting, diversity, or soft scoring as initially expected.

**Key Insights:**
1. Sartor's multi-expert system is already MORE sophisticated than Poetiq's
2. Poetiq's "diversity-first" is a misnomer - it's output deduplication
3. Poetiq uses binary scoring, NOT soft scoring (0-100)
4. Sartor should adopt specific techniques (rate limiting, determinism) but maintain its superior approach to scoring and diversity

**Recommended Action:** Implement HIGH PRIORITY enhancements, but DO NOT regress Sartor's existing capabilities by adopting Poetiq's simpler patterns.

---

**Analysis Completed:** 2025-12-10
**Confidence Level:** High (based on direct code analysis)
**Limitations:** Cannot verify performance claims without empirical testing
