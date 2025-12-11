# Uplifted Skills for Opus 4.5

## Intent-Based Patterns for Advanced AI Capabilities

This document preserves the timeless IDEAS from 7 original skills while adapting them for Opus 4.5's extended thinking and intent-based reasoning. Each skill focuses on outcomes and principles rather than prescriptive steps.

---

## 1. Safety Research Workflow

### Intent Statement

Conduct rigorous, evidence-based research with systematic validation and multi-perspective analysis, producing findings that meet medical/pharmaceutical-grade standards of evidence.

### Core Principles

**Truth Over Speed**: Better to acknowledge gaps than fabricate evidence

- Never invent sources, citations, or data to fill knowledge gaps
- Incomplete but honest findings outweigh seemingly complete but fabricated ones
- Research velocity matters less than research integrity

**Evidence Hierarchy**: Not all sources carry equal weight

- Empirical measurement > peer-reviewed literature > expert opinion > inference
- Primary sources > secondary sources > AI-generated summaries
- Systematic reviews > single studies > anecdotal reports

**Disagreement as Signal**: Conflicting evidence indicates knowledge boundaries

- Preserve minority viewpoints rather than forcing false consensus
- Document where sources conflict or contradict
- Multiple agents disagreeing reveals uncertainty, not failure

**Quality Gates as Circuit Breakers**: Validation checkpoints prevent error propagation

- Each research stage produces evidence that validates before proceeding
- Failed validation triggers investigation, not workarounds
- Automated checks catch what human review misses

### Activation Triggers

Invoke this skill when:

- Research findings will influence high-stakes decisions (medical, financial, safety)
- Multiple sources must be synthesized with proper attribution
- Claims require external validation or peer review
- Long citation lists need authenticity verification
- Multi-agent coordination needed for complex research questions

### Quality Criteria

You're doing it right when:

- Every quantitative claim traces to a specific source with identifier (PMID, DOI, URL)
- Limitations section is as detailed as findings section
- Conflicting evidence is documented, not smoothed over
- You can defend each source as authentic (not fabricated to fill gaps)
- Citations survive automated validation (no fake PMIDs, placeholder titles)
- Confidence levels match evidence strength (not aspirational)

You're doing it wrong when:

- You invent "example" citations to illustrate a point
- Multiple agents mysteriously agree despite examining different evidence
- Limitations are generic ("more research needed") rather than specific
- Citation count matters more than citation quality
- Synthesis creates new claims not found in any source

### Anti-Patterns

**The Fabrication Cascade**: Inventing one placeholder source forces invention of supporting sources to maintain consistency. Instead: acknowledge the gap explicitly.

**Metric Averaging Without Basis**: Combining scores from multiple agents without showing calculation methodology. Instead: report each agent's assessment separately with reasoning.

**Consensus Theater**: Multiple agents reviewing the same evidence with identical conclusions. Instead: assign truly different perspectives or specialized domains.

**Citation Padding**: Adding marginally relevant sources to inflate bibliography. Instead: cite only what directly supports specific claims.

---

## 2. Evidence-Based Validation

### Intent Statement

Enforce intellectual honesty by preventing fabricated metrics, exaggerated claims, and unsupported assertions, ensuring all technical assessments rest on verifiable evidence.

### Core Principles

**Measurement Distinguishes Opinion from Fact**: Claims about quality, performance, or completeness require data

- "Fast" requires benchmark comparison to baseline
- "High quality" requires defined rubric and evaluation
- "Complete" requires enumeration of what's included and excluded
- Without measurement, you have an observation or hypothesis, not a conclusion

**Uncertainty Acknowledgment Builds Trust**: Admitting unknowns increases credibility

- "Cannot determine without X" is often the most honest answer
- Explicitly stating assumptions makes claims falsifiable
- Documenting what you didn't test prevents over-inference
- Confidence intervals matter more than point estimates

**Skepticism as Default Posture**: Assume claims are unproven until demonstrated

- "Probably doesn't work as claimed" until evidence shows otherwise
- Look for what could fail before claiming what works
- Negative evidence (what was tested and failed) matters as much as positive
- Burden of proof lies with the claimant

**Language Precision Prevents Creep**: Superlatives inflate claims beyond evidence

- "Excellent" → "Follows standard patterns, no obvious defects observed"
- "100% test coverage" → "Coverage tool reported 87% line coverage on 2024-11-07"
- "Production ready" → "Passes current tests, production behavior not validated"
- Specific observations replace vague excellence

### Activation Triggers

Invoke this skill when:

- Making any claim with a number (percentage, score, metric)
- Assessing code quality, performance, or completeness
- Reporting test results or validation outcomes
- Comparing alternatives or measuring improvements
- About to use a superlative ("best", "optimal", "perfect")

### Quality Criteria

You're doing it right when:

- Every metric includes methodology (what, how, when measured)
- You distinguish "measured" from "estimated" from "assumed" from "unknown"
- Limitations are specific enough that someone could address them
- You're comfortable being challenged on any claim
- "I don't know" appears frequently in your analysis
- Numbers come with context (sample size, conditions, confidence level)

You're doing it wrong when:

- You round 73 to "almost 100" without noting the gap
- Superlatives appear without comparative data
- "Should work" replaces "tested to work"
- You're more confident than your evidence supports
- You create scores without showing calculation basis
- Completion percentage exceeds tested functionality percentage

### Anti-Patterns

**The Confidence Inflation**: Starting with "probably works" and ending with "proven reliable" without additional evidence. Instead: maintain consistent confidence levels throughout.

**Metric Fabrication to Meet Expectations**: Creating a "quality score" because stakeholders expect one. Instead: report observations and explicitly state that no score can be calculated without a defined rubric.

**The Rounding Trap**: 67% becomes "about 70%" becomes "roughly three-quarters" becomes "mostly complete". Instead: use exact numbers with appropriate significant figures.

**Estimated-Becomes-Actual**: Preliminary estimate hardens into accepted fact through repetition. Instead: label estimates clearly every time, never drop the qualifier.

---

## 3. Evidence-Based Engineering

### Intent Statement

Build reliable systems through honest progress tracking, measured performance claims, and rigorous validation, preventing technical debt from over-promising.

### Core Principles

**Implementation ≠ Completion**: Working code is one checkpoint, not the finish line

- Implemented: Code exists and compiles
- Tested: Code passes defined tests
- Integrated: Code works with other components
- Validated: Code meets requirements in realistic conditions
- Complete: All four stages pass AND documented AND deployed
- Don't claim the end when you're at the beginning

**Measurement Before Optimization**: Can't improve what you don't measure

- Baseline performance before "making it faster"
- Complexity metrics before "cleaning it up"
- Error rates before "improving reliability"
- Without before/after data, you have changes, not improvements

**Estimate Transparency**: Distinguish confidence levels in predictions

- Measured: "Observed 42/50 messages delivered (84% measured rate)"
- Estimated: "Approximately 1000 lines based on file size (not counted)"
- Assumed: "Assuming average network latency of 100ms (not measured)"
- Unknown: "Performance at scale unknown, requires load testing"
- The label matters as much as the number

**Failure Modes Document Boundaries**: What breaks reveals limitations

- Untested edge cases are documented gaps, not assumed working
- Known bugs inform reliability claims
- Resource limits (memory, connections, scale) bound applicability
- What doesn't work yet is as important as what does

### Activation Triggers

Invoke this skill when:

- Reporting implementation progress or completion status
- Making performance, scalability, or reliability claims
- Estimating effort, timelines, or resource requirements
- Claiming optimization or improvement
- Preparing for deployment or production use

### Quality Criteria

You're doing it right when:

- Every "complete" claim enumerates what's complete and what's not
- Performance claims include measurement methodology and conditions
- Progress reports separate implemented/tested/integrated/validated
- You track what you haven't tested as carefully as what you have
- Assumptions are listed explicitly for each claim
- "Unknown" sections appear in all assessments

You're doing it wrong when:

- "Working on my machine" becomes "production ready"
- Test count matters more than what's actually tested
- You claim 3x speedup without before/after benchmarks
- Bugs are "probably fixed" without verification
- Edge cases are "probably fine" without testing
- Completion percentage comes from gut feeling, not enumeration

### Anti-Patterns

**The Completion Illusion**: Marking tasks "done" when basic implementation exists but testing/integration/validation remain. Instead: use precise status levels (implemented, tested, integrated, validated, complete).

**Performance Claims Without Baseline**: "Made it faster" without knowing previous speed. Instead: measure both before and after, or state that improvement is theoretical.

**The Untested Assumption**: "Should handle 1000 users" because it handles 10. Instead: explicitly state scaling behavior is unknown without load testing.

**Bug Fix Optimism**: Changing code that "should fix" the issue without verifying the fix works. Instead: demonstrate bug reproduction, apply fix, verify bug no longer reproduces.

---

## 4. Multi-Agent Orchestration

### Intent Statement

Design coordination strategies for multiple agents that preserve independent reasoning while enabling collaborative problem-solving, without fabricating artificial consensus.

### Core Principles

**Specialization Over Uniformity**: Different agents bring different perspectives

- Assign distinct roles based on actual capability differences
- Persona adoption means genuinely different analysis, not cosmetic variety
- Complementary viewpoints reveal blind spots
- Convergent thinking suggests insufficient specialization

**Disagreement Preservation Over Consensus Forcing**: Conflicts indicate boundaries

- Agents reaching different conclusions signals legitimate uncertainty
- Average-of-opinions without measurement basis fabricates false precision
- Minority viewpoints documented, not discarded for neat consensus
- Synthesis acknowledges conflicts, doesn't resolve them artificially

**Coordination Overhead is Real**: Communication costs resources

- More agents increases coordination complexity (often quadratically)
- Quality gates add latency but catch errors
- Shared state requires synchronization
- Measure overhead, don't assume it's negligible

**Independence Validates Findings**: Cross-validation requires actual independence

- Agents reviewing same evidence should not communicate before assessment
- True disagreement only emerges from independent analysis
- "Agent B validated Agent A's work" only meaningful if B had no access to A's reasoning
- Collaboration points must be explicitly designed

### Activation Triggers

Invoke this skill when:

- Multiple agents needed for complex multi-domain problems
- Independent validation required for high-stakes decisions
- Parallel exploration of solution space desired
- Coordination failures appear (deadlock, divergence, conflicts)
- Scaling agent count while maintaining effectiveness

### Quality Criteria

You're doing it right when:

- Each agent produces distinctly different analysis based on their role
- Disagreements emerge naturally and are preserved in synthesis
- You can explain why each agent's perspective is unique
- Coordination overhead is measured, not assumed
- Quality gates actually reject outputs (not rubber stamps)
- Synthesis acknowledges uncertainty rather than forcing resolution

You're doing it wrong when:

- All agents mysteriously agree despite different roles
- You create a "consensus score" by averaging without justification
- More agents increases confidence without additional evidence
- Agents' outputs are interchangeable (specialization failed)
- Coordination costs are ignored in architecture decisions
- Disagreements are smoothed over to present unified front

### Anti-Patterns

**The Consensus Fabrication**: Three agents assess quality as 7/10, 8/10, 9/10, so you report "consensus of 8/10". Instead: report the range and note the disagreement.

**The Rubber-Stamp Validator**: Validator agent always approves primary agent's work. Instead: design validation with independent criteria and show actual rejections.

**Communication Pretense**: Agents supposedly collaborating but actually just sequential execution. Instead: explicitly design collaboration points with message passing.

**Scale-Invariant Coordination**: Adding more agents without adjusting coordination strategy. Instead: recognize that 3-agent and 30-agent systems need different coordination approaches.

---

## 5. Agent Communication System

### Intent Statement

Implement reliable message passing between agents with proper routing, delivery guarantees, and shared state management, while avoiding the illusion of zero-cost communication.

### Core Principles

**Message Delivery Has Failure Modes**: No communication is perfectly reliable

- Network partitions happen
- Messages arrive out of order
- Timeouts occur
- Delivery guarantees (at-most-once, at-least-once, exactly-once) trade off complexity vs reliability
- Design for failure, not just success

**Shared State Requires Conflict Resolution**: Multiple writers create conflicts

- Last-write-wins discards information
- Merge functions may not preserve intent
- Vector clocks track causality but consume memory
- CRDTs provide eventual consistency, not strong consistency
- Choose consistency model explicitly based on requirements

**Routing Strategy Affects Performance**: How messages find recipients matters

- Direct routing: Fast but inflexible
- Broadcast: Simple but wasteful
- Topic-based: Decoupled but requires subscription management
- Semantic: Intelligent but computationally expensive
- Wrong choice creates bottlenecks or overhead

**Quality Gates in Communication**: Validation at message boundaries

- Input validation prevents malformed messages
- Output validation ensures contract compliance
- Retry logic with limits prevents infinite loops
- Circuit breakers stop cascade failures
- Every communication point is a potential failure point

### Activation Triggers

Invoke this skill when:

- Implementing message passing between agents
- Debugging communication failures or performance issues
- Designing coordination protocols
- Handling shared data between agents
- Setting up validation checkpoints in workflows

### Quality Criteria

You're doing it right when:

- You've defined what happens when message delivery fails
- Conflict resolution strategy is explicit and tested
- Routing decisions are based on measured requirements
- Quality gates actually reject malformed messages
- Communication overhead is measured and acceptable
- You can trace any message through the system

You're doing it wrong when:

- You assume messages always arrive
- Concurrent updates are "probably fine"
- Routing strategy was chosen without considering load
- Validation is added as afterthought, not designed in
- You can't explain communication latency budget
- Message flow is opaque (can't trace paths)

### Anti-Patterns

**The Perfect Network**: Assuming messages never fail, reorder, or delay. Instead: design explicit handling for delivery failures.

**Conflict-Free Shared State**: Assuming multiple writers won't conflict. Instead: choose and implement a specific conflict resolution strategy.

**Magic Routing**: Hoping the "right" agent receives the message. Instead: design explicit routing logic with fallbacks.

**Unbounded Retries**: Retrying failed operations forever. Instead: implement exponential backoff with maximum retry limits.

---

## 6. Distributed Systems Debugging

### Intent Statement

Systematically investigate distributed system failures by reconstructing causal chains, isolating failure domains, and testing hypotheses with evidence rather than assumptions.

### Core Principles

**Observation Before Hypothesis**: Gather evidence first, theorize second

- Collect logs from all nodes, not just the failing one
- Capture metrics before, during, and after failure
- Document actual behavior vs expected behavior
- Timestamps and causality matter
- Assumptions about "what probably happened" are dangerous

**Non-Determinism is Fundamental**: Same inputs may yield different outputs

- Race conditions depend on timing
- Network delays vary
- Partial failures create inconsistent state
- Reproducibility is goal, not guarantee
- Accept that some bugs appear once and vanish

**Isolation Reveals Root Cause**: Simplify to understand

- Test components independently before testing integration
- Reduce agent count to minimum that exhibits problem
- Remove variables systematically
- Each simplification either preserves or eliminates the bug
- Minimal reproduction is gold

**Failure Injection Validates Understanding**: Test your theories

- Deliberately create suspected conditions
- If hypothesis is correct, injected failure reproduces symptom
- If hypothesis is wrong, failure doesn't reproduce symptom
- Controlled chaos beats uncontrolled debugging
- Fix is only validated when failure injection no longer reproduces

### Activation Triggers

Invoke this skill when:

- Distributed system exhibits unexpected behavior
- Coordination between agents fails
- State divergence appears across nodes
- Performance degrades under load
- Rare, hard-to-reproduce failures occur

### Quality Criteria

You're doing it right when:

- You've collected evidence from all involved components
- Hypotheses are testable and falsifiable
- You can reproduce the issue reliably (or explain why you can't)
- Each debugging step either confirms or refutes a hypothesis
- Root cause explains all observed symptoms
- Fix is validated by failure injection

You're doing it wrong when:

- You debug on just one node's logs
- "Probably a network issue" without verification
- You can't reproduce so you "try a fix anyway"
- Hypothesis changes to fit observations instead of being tested
- You stop when symptoms disappear without confirming root cause
- No regression test created after fix

### Anti-Patterns

**The Single-Node Fallacy**: Debugging distributed system by looking at one node. Instead: correlate events across all nodes.

**The Lucky Fix**: Changing something, symptoms disappear, claiming victory without understanding why. Instead: reproduce failure, apply fix, verify failure no longer reproduces.

**Hypothesis Creep**: Constantly changing theory to fit new evidence. Instead: commit to testable hypothesis, gather evidence, accept or reject, then form new hypothesis.

**Production Debugging**: Trying to debug directly in production without reproduction. Instead: capture state, reproduce in test environment, then debug.

---

## 7. MCP Server Development

### Intent Statement

Build Model Context Protocol servers that reliably expose tools and resources to AI assistants while handling errors gracefully and maintaining protocol compliance.

### Core Principles

**Stdio Discipline is Non-Negotiable**: Protocol corruption from logging mistakes

- stdout is for MCP protocol messages only
- stderr is for all logging, debugging, errors
- One console.log() corrupts entire communication
- Discipline matters because violations are silent

**Input Validation Prevents Cascade**: Bad input creates bad output

- JSON schema defines contract
- Schema validation happens before execution
- Invalid input returns error, doesn't throw exception
- Validation errors are clear and actionable
- Trust nothing from client

**Error Handling is User Experience**: How failure appears to AI

- Errors as JSON in response, not thrown exceptions
- Error messages guide recovery (what was wrong, what to fix)
- isError flag distinguishes failure from success
- Retryable vs permanent errors indicated
- Stack traces in logs, not in responses

**Testing Strategy Matches Risk**: Different tools need different validation

- Unit test: Tool logic independent of MCP protocol
- Integration test: Full MCP request/response flow
- Manual test: MCP Inspector for interactive debugging
- Production monitoring: Actual usage patterns
- Test what matters for your tools

### Activation Triggers

Invoke this skill when:

- Building new MCP server or tools
- Debugging MCP communication failures
- Adding error handling or validation
- Implementing retries or rate limiting
- Creating tests for MCP servers

### Quality Criteria

You're doing it right when:

- No console.log() in code (only console.error())
- Every tool has JSON schema matching implementation
- Invalid input returns structured error, not exception
- Integration tests cover success and failure paths
- You can explain why each tool needs MCP vs direct API
- Errors are clear enough that AI can self-correct

You're doing it wrong when:

- stdio protocol randomly corrupts
- Tool works in testing but fails in production
- Error messages are unhelpful ("Error occurred")
- No tests exist beyond "seems to work"
- Every operation is a tool (over-MCP-ification)
- Unhandled exceptions crash server

### Anti-Patterns

**The Logging Trap**: Using console.log() because you forgot about stdio. Instead: establish linting rule to catch console.log() in code.

**Schema-Implementation Mismatch**: Schema says required but code doesn't validate. Instead: validate input against schema before processing.

**Silent Errors**: Catching exception but returning success response. Instead: set isError: true and include error details.

**MCP Everything**: Making every function an MCP tool. Instead: use MCP for AI-invokable capabilities, regular functions for internal logic.

---

## Meta-Principles Across All Skills

### Progressive Disclosure

Don't front-load all context. Opus 4.5 can request information when needed through extended thinking and tool use.

### Intent Over Prescription

Define the outcome and quality criteria. Let the model reason about how to achieve it.

### Evidence-Based Self-Correction

Model can validate its own work against quality criteria and revise before finalizing.

### Explicit Uncertainty

"I don't know" and "requires measurement" are valid and valuable outputs.

### Limitation Documentation

Every capability has boundaries. Documenting them builds trust.

---

## Using These Skills with Opus 4.5

**Activation**: Reference the skill by name and intent. Model will apply principles.

**Thinking Space**: Model uses extended thinking to apply principles before responding.

**Validation**: Model checks output against quality criteria and revises if needed.

**Combination**: Multiple skills can apply simultaneously (e.g., Evidence-Based Validation + Safety Research).

**Adaptation**: Principles guide judgment in novel situations not covered by specific examples.

---

_Version: 1.0_
_Date: 2025-12-06_
_Source Skills: 7 skills from Sartor-Public-Claude-Skills_
_Target Model: Claude Opus 4.5 and beyond_
