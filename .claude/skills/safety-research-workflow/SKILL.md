---
name: Safety Research Workflow
description: Guides systematic safety research including literature review, multi-agent research coordination, citation management, evidence validation, and quality assurance. Integrates Memory MCP to persist research findings, methodology patterns, and research iterations across sessions. Use when conducting research studies, coordinating research agents, managing bibliographies, validating research claims, or ensuring research quality.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebSearch, WebFetch, memory_create, memory_search, memory_get, memory_stats
---

# Safety Research Workflow Skill

## Overview

This skill provides comprehensive guidance for conducting rigorous, evidence-based safety research with multi-agent coordination, systematic literature review, citation management, and quality assurance. It integrates all four foundational skills to enable high-quality research that adheres to CLAUDE.md anti-fabrication protocols.

Safety research requires the highest standards of evidence and methodology, particularly in medical and pharmaceutical contexts where findings may influence patient care decisions. This skill provides structured workflows, quality gates, and validation procedures to ensure research integrity throughout the entire process.

**Memory MCP Integration:** This skill now persists research findings as semantic memories, successful methodology patterns as procedural memories, and research iteration history as episodic memories. This enables learning from past research projects and retrieving proven approaches for similar research questions.

## When to Use This Skill

Use this skill when:

- Planning or executing systematic literature reviews
- Conducting pharmaceutical or medical safety assessments
- Coordinating multiple research agents with specialized roles
- Managing bibliographies and citations for research reports
- Validating research claims and evidence chains
- Ensuring research quality through automated checks
- Synthesizing findings from multiple sources with proper attribution
- Conducting evidence-based analysis with rigorous methodology

## Core Principles

### 1. Evidence-Based Only

- All claims must be supported by primary sources with valid identifiers (PMID, DOI, URL)
- No fabricated scores, metrics, or confidence levels without measurement data
- Apply CLAUDE.md anti-fabrication protocols throughout research lifecycle
- Maintain evidence chains from observation to conclusion

### 2. Systematic Methodology

- Define research questions clearly before execution
- Establish inclusion/exclusion criteria upfront
- Document search strategies and data sources
- Apply consistent evaluation frameworks
- Track methodology decisions for reproducibility

### 3. Multi-Agent Coordination

- Specialize agents by research task (literature search, evidence extraction, validation, synthesis)
- Apply parallel agent coordination protocols from CLAUDE.md
- Implement quality gates between research stages
- Enable cross-validation between agents
- Preserve disagreement rather than fabricating consensus

### 4. Quality Assurance

- Validate sources for authenticity (detect fake PMIDs, placeholder text, fabricated URLs)
- Check citation completeness and format consistency
- Verify claims against source material
- Apply confidence calibration based on evidence strength
- Document limitations explicitly

### 5. Transparency

- Document uncertainties and knowledge gaps
- Acknowledge conflicting evidence
- Specify confidence levels with justification
- Identify assumptions and their impact
- Make methodology auditable

## Memory MCP Integration

This skill leverages the Memory MCP system to persist and retrieve research knowledge across sessions, enabling continuous learning and methodology improvement.

### Memory Types for Research

**SEMANTIC Memories - Research Findings:**

- Key findings from literature reviews
- Validated evidence chains (e.g., "Drug X associated with outcome Y in N studies")
- Source quality assessments
- Conflicting evidence patterns
- Domain-specific knowledge (e.g., "ILD mechanisms", "ADC toxicity profiles")

**PROCEDURAL Memories - Methodology Patterns:**

- Successful search strategies (databases, keywords, filters)
- Effective agent coordination patterns
- Quality gate implementations that caught errors
- Bibliography validation approaches
- Synthesis methodologies that produced high-quality outputs

**EPISODIC Memories - Research Iterations:**

- Complete research project histories
- Quality issues encountered and how they were resolved
- Multi-agent coordination successes/failures
- Refinement loop outcomes
- Validation failures and corrective actions

### When to Create Memories

**During Literature Search (Stage 2):**

```
memory_create({
  content: "Search strategy for ADC safety: PubMed with keywords 'antibody-drug conjugate AND (safety OR toxicity OR adverse events)' limited to 2015-2024, retrieved 847 results, 165 relevant after screening",
  type: "procedural",
  importance: 0.8,
  tags: ["literature-search", "adc", "search-strategy"]
})
```

**After Evidence Extraction (Stage 3):**

```
memory_create({
  content: "ADC-associated ILD incidence: Range 2-15% across 8 studies (n=2,450), higher in trastuzumab deruxtecan (15%) vs other ADCs (2-5%). Source: PMID 34567890, 35678901",
  type: "semantic",
  importance: 0.9,
  tags: ["adc", "ild", "incidence", "clinical-evidence"]
})
```

**After Validation Success (Stage 4):**

```
memory_create({
  content: "Bibliography validation for ADC project: validate-bibliography.py detected 3 fabricated PMIDs by pattern matching (sequential 12345678), saved 6 hours of manual checking. Always run automated checks before manual validation.",
  type: "procedural",
  importance: 0.85,
  tags: ["validation", "bibliography", "automation", "success"]
})
```

**After Synthesis (Stage 5):**

```
memory_create({
  content: "Synthesized ADC-ILD mechanisms from 12 mechanistic studies: Primary pathway is antibody-mediated immune activation in lung tissue. Conflicting evidence on whether payload or antibody drives toxicity. Confidence: moderate (mechanistic data, limited direct evidence).",
  type: "semantic",
  importance: 0.9,
  tags: ["adc", "ild", "mechanisms", "synthesis"]
})
```

**Recording Research Project Completion (Stage 7):**

```
memory_create({
  content: JSON.stringify({
    project: "ADC-ILD Comprehensive Review",
    duration_days: 8,
    agents: 4,
    sources: 165,
    quality_metrics: {
      pmid_coverage: 0.885,
      doi_coverage: 1.0,
      fabrication_violations: 0,
      claude_md_violations: 0
    },
    key_learnings: "Parallel agent specialization pattern worked well, validator-executor loop caught 12 issues before final QA",
    challenges: "Conflicting evidence on mechanisms required careful synthesis"
  }),
  type: "episodic",
  importance: 0.95,
  tags: ["research-project", "adc", "ild", "completion", "success"]
})
```

### Retrieving Research Context

**Before Starting New Research (Stage 1 Planning):**

```
// Find similar past research
const similar_research = await memory_search({
  type: "episodic",
  min_importance: 0.8,
  limit: 5
})

// Find proven search strategies
const search_strategies = await memory_search({
  type: "procedural",
  min_importance: 0.7,
  limit: 10
})

// Retrieve domain knowledge
const domain_knowledge = await memory_search({
  type: "semantic",
  min_importance: 0.8,
  limit: 20
})
```

**During Evidence Extraction (Stage 3):**

```
// Check if similar findings already documented
const existing_findings = await memory_search({
  type: "semantic",
  min_importance: 0.7,
  limit: 15
})
// Compare with current findings to identify novel vs. confirmatory evidence
```

**During Validation (Stage 4):**

```
// Find validation patterns that worked before
const validation_patterns = await memory_search({
  type: "procedural",
  min_importance: 0.7,
  limit: 10
})
// Apply proven validation approaches
```

### Memory-Driven Quality Improvement

**Pattern Recognition:**

- Identify recurring validation failures → Update quality gates
- Track which search strategies yield high-quality sources
- Learn which agent coordination patterns produce best results
- Recognize domain-specific evidence patterns

**Continuous Learning:**

- Each research project improves future research
- Failed approaches are documented to avoid repetition
- Successful patterns are reinforced and reused
- Quality metrics improve over time

**Cross-Project Insights:**

- Similar research questions benefit from past findings
- Domain expertise accumulates across projects
- Methodology improvements persist beyond single projects
- Agent coordination patterns are refined iteratively

### Memory Best Practices for Research

1. **Create memories immediately** - Don't wait until end of stage
2. **Use specific tags** - Include domain, methodology, outcome tags
3. **Set appropriate importance** - Higher for successful patterns, key findings
4. **Search before creating** - Avoid duplicate semantic memories
5. **Include source attribution** - Even in memories, cite sources
6. **Document both success and failure** - Learn from mistakes
7. **Use JSON for complex data** - Structured data in episodic memories
8. **Tag with CLAUDE.md compliance** - Track anti-fabrication adherence

## Research Workflow Stages

### Stage 1: Planning

**Objective:** Define research scope, questions, methodology, and agent assignments

**Activities:**

- **Retrieve past research context** using memory_search for similar projects
- Formulate specific, answerable research questions
- Define search strategy (databases, keywords, date ranges)
- Establish inclusion/exclusion criteria
- Identify required agent specializations
- Set quality standards and acceptance criteria
- Create research plan document

**Memory Integration:**

```
// Search for similar past research projects
memory_search({
  type: "episodic",
  min_importance: 0.7,
  limit: 10
})

// Retrieve proven search strategies for this domain
memory_search({
  type: "procedural",
  min_importance: 0.6,
  limit: 15
})

// Get domain knowledge already established
memory_search({
  type: "semantic",
  min_importance: 0.7,
  limit: 20
})
```

**Quality Gates:**

- Research questions are specific and measurable
- Methodology is reproducible
- Success criteria are defined
- Resource requirements identified
- Past research context has been reviewed

**Integration Points:**

- Use Multi-Agent Orchestration skill to assign agent roles
- Apply Evidence-Based Validation skill to define quality criteria
- Reference Distributed Systems Debugging for process validation
- **Use Memory MCP to retrieve proven methodologies from past research**

### Stage 2: Literature Search & Collection

**Objective:** Systematically identify and retrieve relevant sources

**Activities:**

- Execute search strategy across defined databases
- Screen results against inclusion/exclusion criteria
- Retrieve full-text articles or abstracts
- Extract bibliographic metadata (authors, title, year, identifiers)
- Track search results and decisions

**Quality Gates:**

- Search strategy is systematic and reproducible
- Inclusion/exclusion criteria applied consistently
- All sources have valid identifiers (PMID, DOI, or accessible URL)
- No placeholder or fabricated sources
- Search coverage is adequate for research question

**Common Pitfalls:**

- Using fabricated PMIDs (e.g., 12345678, sequential patterns)
- Including placeholder titles ("Example Study", "Sample Research")
- Missing source identifiers
- Inconsistent application of inclusion criteria
- Inadequate documentation of search strategy

**Agent Specialization:**

- Agent A: Execute database searches, retrieve sources
- Agent B: Screen for relevance, apply inclusion/exclusion criteria
- Agent C: Extract and validate bibliographic metadata

**Memory Integration:**

```
// After successful search, store strategy
memory_create({
  content: "Search strategy: [database] with keywords '[keywords]' filters '[filters]', retrieved [N] results, [M] relevant after screening. Effective for [domain].",
  type: "procedural",
  importance: 0.75,
  tags: ["literature-search", "search-strategy", "[domain]", "success"]
})

// Store any search challenges encountered
memory_create({
  content: "Challenge: Initial keywords '[keywords]' yielded too broad results (N=5000). Refined to '[refined_keywords]' improved precision. Lesson: Always include specificity terms for [domain].",
  type: "procedural",
  importance: 0.7,
  tags: ["literature-search", "refinement", "[domain]", "lesson-learned"]
})
```

### Stage 3: Evidence Extraction

**Objective:** Extract relevant data points, findings, and evidence from sources

**Activities:**

- Read full-text sources systematically
- Extract numerical data, study findings, methodology details
- Record evidence with source attribution
- Note study quality indicators (sample size, study design, limitations)
- Track conflicting evidence

**Quality Gates:**

- Every extracted claim has source citation
- Numerical data includes context (sample size, confidence intervals, study population)
- Methodology of source studies is documented
- Limitations are recorded
- Conflicting evidence is preserved

**Common Pitfalls:**

- Extracting data without source attribution
- Ignoring study limitations
- Cherry-picking favorable results
- Misrepresenting statistical significance
- Losing context for numerical claims

**Agent Specialization:**

- Agent A: Extract quantitative findings (incidence rates, effect sizes)
- Agent B: Extract qualitative findings (mechanisms, clinical observations)
- Agent C: Extract methodology and study quality indicators
- Agent D: Cross-validate extracted data against sources

**Memory Integration:**

```
// Store key research findings as semantic memories
memory_create({
  content: "[Finding description] Range: [data range] across [N] studies (total n=[sample size]). Sources: [PMIDs or DOIs]. Quality: [study design, limitations].",
  type: "semantic",
  importance: 0.85,
  tags: ["research-finding", "[domain]", "[topic]", "evidence"]
})

// Store extraction patterns that worked well
memory_create({
  content: "Extraction pattern: For [type of study], focus on [specific sections]. Systematic extraction of [data types] improved completeness by 40%. Template: [brief template description].",
  type: "procedural",
  importance: 0.75,
  tags: ["evidence-extraction", "pattern", "[study-type]", "success"]
})

// Check for existing findings before extracting
memory_search({
  type: "semantic",
  min_importance: 0.6,
  limit: 20
})
// Compare with current extraction to identify novel vs. confirmatory
```

### Stage 4: Evidence Validation

**Objective:** Verify authenticity, quality, and proper attribution of all evidence

**Activities:**

- Validate source identifiers (check PMIDs, verify URLs accessible)
- Detect fabricated or placeholder sources
- Verify extracted data matches source material
- Check for citation errors or misattribution
- Assess source credibility and study quality
- Identify evidence gaps or weaknesses

**Quality Gates:**

- All sources validated as authentic (no fake PMIDs, placeholder text)
- Extracted data matches source claims
- Citations are properly formatted and complete
- Evidence quality is assessed and documented
- Limitations are explicitly stated

**Automated Checks:**

- Run bibliography validation script to detect fabricated sources
- Check citation format consistency
- Verify URL accessibility
- Detect placeholder patterns in titles/authors
- Validate PMID/DOI formats

**Agent Specialization:**

- Agent A: Source authenticity validation
- Agent B: Data accuracy verification (check against sources)
- Agent C: Study quality assessment
- Agent D: Anti-fabrication compliance audit (apply CLAUDE.md rules)

**Integration Points:**

- Use Evidence-Based Validation skill extensively
- Apply source verification patterns from safety-research-system
- Use automated validation scripts

**Memory Integration:**

```
// Store successful validation patterns
memory_create({
  content: "Validation approach: validate-bibliography.py caught [N] fabricated sources by [pattern]. Followed by manual URL accessibility check caught [M] additional issues. Total time: [duration]. Success rate: [%].",
  type: "procedural",
  importance: 0.8,
  tags: ["validation", "bibliography", "automation", "success-pattern"]
})

// Store validation failures and fixes
memory_create({
  content: "Validation issue: [N] sources had inaccessible URLs despite passing format checks. Root cause: [cause]. Solution: Added accessibility check to automated script. Prevention: Always check URL accessibility, not just format.",
  type: "procedural",
  importance: 0.85,
  tags: ["validation", "failure", "fix", "lesson-learned"]
})

// Retrieve proven validation approaches
memory_search({
  type: "procedural",
  min_importance: 0.7,
  limit: 10
})
```

### Stage 5: Synthesis & Analysis

**Objective:** Integrate findings into coherent conclusions with proper attribution

**Activities:**

- Identify patterns and themes across sources
- Synthesize quantitative findings (e.g., incidence ranges across studies)
- Reconcile conflicting evidence
- Draw evidence-based conclusions
- Document synthesis methodology
- Acknowledge uncertainties

**Quality Gates:**

- Synthesis supported by multiple sources
- Conflicting evidence acknowledged
- Conclusions proportional to evidence strength
- Confidence levels justified by evidence quality
- Limitations explicitly documented

**Common Pitfalls:**

- Overgeneralizing from limited evidence
- Creating fabricated "consensus" scores
- Ignoring conflicting evidence
- Claiming higher confidence than evidence supports
- Failing to acknowledge gaps

**Agent Specialization:**

- Agent A: Synthesize quantitative findings
- Agent B: Synthesize qualitative/mechanistic findings
- Agent C: Identify conflicts and uncertainties
- Agent D: Validate synthesis against CLAUDE.md anti-fabrication rules

**Integration Points:**

- Apply Multi-Agent Orchestration for synthesis coordination
- Use Evidence-Based Validation for claim verification
- Apply confidence calibration methodology

**Memory Integration:**

```
// Store synthesized findings as semantic memories
memory_create({
  content: "Synthesis: [Topic] - [Key conclusion] based on [N] studies. [Data summary]. Conflicting evidence: [description]. Confidence: [level with justification]. Limitations: [key limitations].",
  type: "semantic",
  importance: 0.9,
  tags: ["synthesis", "[domain]", "[topic]", "conclusion"]
})

// Store synthesis methodologies that worked
memory_create({
  content: "Synthesis approach: For [type of evidence], used [methodology]. Handled conflicting evidence by [approach]. Result: [outcome]. Effective for [domain].",
  type: "procedural",
  importance: 0.8,
  tags: ["synthesis", "methodology", "[domain]", "success"]
})

// Store conflicts and how they were resolved
memory_create({
  content: "Conflict resolution: Studies showed [conflicting finding]. Analysis revealed [root cause of conflict]. Resolution: [how handled in synthesis]. Preserved disagreement rather than fabricating consensus.",
  type: "episodic",
  importance: 0.75,
  tags: ["conflict", "resolution", "[topic]", "claude-md-compliant"]
})
```

### Stage 6: Quality Assurance

**Objective:** Comprehensive validation before finalizing research outputs

**Activities:**

- Run automated quality checks on bibliography
- Verify all claims have source citations
- Check for CLAUDE.md compliance (no fabricated scores, banned language)
- Review methodology documentation
- Assess completeness of limitations section
- Peer review simulation (if using multiple agents)

**Quality Gates:**

- All automated quality checks pass
- No unsupported claims
- CLAUDE.md anti-fabrication compliance verified
- Bibliography complete and properly formatted
- Limitations comprehensively documented
- Methodology is reproducible

**Automated Checks:**

- Run `validate-bibliography.py` for source authenticity
- Run `research-quality-check.py` for claim validation
- Check for banned language patterns
- Verify confidence level justification
- Validate numerical claims have methodology documentation

**Agent Specialization:**

- Agent A: Bibliography completeness audit
- Agent B: Claim-source mapping verification
- Agent C: CLAUDE.md compliance audit
- Agent D: Methodology reproducibility check

**Integration Points:**

- Use Evidence-Based Validation skill for comprehensive audit
- Apply Distributed Systems Debugging for process validation
- Use automated quality scripts

**Memory Integration:**

```
// Store QA findings and improvements
memory_create({
  content: "QA audit found [N] issues: [issue types]. All resolved before final delivery. Key improvements: [improvements made]. Time investment in QA: [hours]. Issues prevented: [prevented issues].",
  type: "episodic",
  importance: 0.8,
  tags: ["quality-assurance", "audit", "improvements", "success"]
})

// Store effective QA patterns
memory_create({
  content: "QA pattern: Running [automated checks] before manual review reduced QA time by [%]. Order: 1) validate-bibliography.py, 2) research-quality-check.py, 3) manual CLAUDE.md audit, 4) peer review simulation. Caught [%] of issues in automated phase.",
  type: "procedural",
  importance: 0.85,
  tags: ["quality-assurance", "automation", "workflow", "efficiency"]
})
```

### Stage 7: Documentation & Delivery

**Objective:** Package research findings with complete methodology and supporting materials

**Activities:**

- Compile final research report
- Format bibliography to required standard
- Document search strategy and methodology
- Create executive summary
- Package supporting materials (search logs, evidence extraction tables)
- Archive source materials

**Quality Gates:**

- Report structure is complete
- All sections have proper citations
- Bibliography is complete and correctly formatted
- Methodology is fully documented
- Limitations section is comprehensive
- Supporting materials are organized

**Deliverables:**

- Final research report with complete bibliography
- Methodology documentation
- Executive summary
- Evidence extraction tables (optional)
- Search strategy documentation
- Quality assurance report

**Memory Integration:**

```
// Record complete research project as episodic memory
memory_create({
  content: JSON.stringify({
    project: "[Project Name]",
    research_question: "[Question]",
    duration_days: [N],
    agents_used: [N],
    sources: [N],
    quality_metrics: {
      pmid_coverage: [ratio],
      doi_coverage: [ratio],
      fabrication_violations: 0,
      claude_md_violations: 0,
      claim_citation_rate: [ratio]
    },
    coordination_pattern: "[pattern used]",
    key_learnings: "[what worked well]",
    challenges: "[what was difficult]",
    methodology_innovations: "[any new approaches]"
  }),
  type: "episodic",
  importance: 0.95,
  tags: ["research-project", "[domain]", "completion", "success", "full-project"]
})

// Record final metrics for continuous improvement
memory_create({
  content: "Project [Name] completed with [quality score]. Time breakdown: Planning [%], Search [%], Extraction [%], Validation [%], Synthesis [%], QA [%], Documentation [%]. Efficiency gains vs. previous: [improvements].",
  type: "procedural",
  importance: 0.8,
  tags: ["metrics", "efficiency", "[domain]", "completed"]
})
```

## Multi-Agent Research Coordination

### Coordination Patterns

#### Pattern 1: Sequential Pipeline

**Use when:** Research stages have clear dependencies

**Structure:**

```
Agent A (Search) → Agent B (Extraction) → Agent C (Validation) → Agent D (Synthesis)
```

**Coordination:**

- Each agent completes fully before next begins
- Quality gates between agents
- Handoff includes methodology documentation
- Downstream agents verify upstream outputs

**Example:** Systematic literature review where search must complete before extraction

#### Pattern 2: Parallel Specialization

**Use when:** Different research domains can be explored simultaneously

**Structure:**

```
                    ┌→ Agent A (Clinical Evidence)
Research Question ──┼→ Agent B (Mechanistic Studies)
                    └→ Agent C (Regulatory Documents)
                            ↓
                      Agent D (Synthesis)
```

**Coordination:**

- Agents work simultaneously on different domains
- Regular sync points for integration
- Cross-validation between agents
- Final synthesis agent integrates findings

**Example:** Multi-domain safety assessment (clinical, mechanistic, regulatory)

#### Pattern 3: Validator-Executor Loop

**Use when:** Quality assurance requires iterative refinement

**Structure:**

```
Agent A (Executor) ←→ Agent B (Validator)
        ↓
    Final Output
```

**Coordination:**

- Executor produces research output
- Validator audits for quality and compliance
- Executor revises based on validator feedback
- Iterate until quality gates pass

**Example:** Research report development with quality assurance

#### Pattern 4: Cross-Validation Matrix

**Use when:** Maximum rigor required, multiple independent validations needed

**Structure:**

```
Agent A (Primary) → Agent B (Validator 1) ↘
                                           Agent D (Synthesis)
Agent C (Independent) → (no cross-talk) ↗
```

**Coordination:**

- Multiple agents research same question independently
- No communication between primary agents
- Synthesis agent reconciles findings
- Disagreements preserved and documented

**Example:** High-stakes safety assessment requiring independent verification

### Agent Role Specializations

**Literature Search Agent:**

- Execute database queries
- Screen for relevance
- Retrieve full-text sources
- Extract bibliographic metadata
- Document search strategy

**Evidence Extraction Agent:**

- Read sources systematically
- Extract numerical and qualitative data
- Record evidence with citations
- Note study quality indicators
- Track conflicting evidence

**Validation Agent:**

- Verify source authenticity
- Check data accuracy against sources
- Validate citations
- Assess study quality
- Apply anti-fabrication rules

**Synthesis Agent:**

- Integrate findings across sources
- Reconcile conflicting evidence
- Draw evidence-based conclusions
- Calibrate confidence levels
- Document limitations

**Quality Assurance Agent:**

- Audit bibliography completeness
- Verify claim-source mapping
- Check CLAUDE.md compliance
- Validate methodology
- Generate quality reports

### CLAUDE.md Parallel Agent Coordination Applied to Research

**Persona Adoption:**

- Each research agent adopts distinct specialized identity
- Literature Agent focuses on comprehensive source identification
- Validation Agent maintains skeptical, critical perspective
- Synthesis Agent integrates without fabricating consensus

**Complementary Analysis:**

- Literature Agent provides breadth of sources
- Evidence Extraction Agent provides depth of data
- Validation Agent provides quality control
- Synthesis Agent provides integration

**Cross-Validation:**

- Validation Agent checks Literature Agent's sources for authenticity
- Synthesis Agent verifies Evidence Extraction Agent's data against sources
- Quality Assurance Agent audits all agents' outputs

**Synthesis Protocol:**

- Combine insights without fabricating consensus metrics
- Preserve disagreements between agents
- Document where evidence conflicts
- Avoid averaging or creating composite scores without justification

**Anti-Fabrication in Teams:**

- No metric averaging without measurement basis
- Report differing assessments honestly
- Each agent independently validates claims
- More agents does not increase confidence without independent evidence

## Citation & Bibliography Management

### Citation Standards

**Required Elements:**

- Authors (all or "et al." for >3)
- Title (complete, no placeholders)
- Journal/source name
- Year of publication
- Volume and issue (if applicable)
- Page numbers or article identifier
- At least one of: PMID, DOI, or accessible URL

**Prohibited:**

- Fabricated PMIDs (sequential like 12345678, repetitive like 11111111)
- Placeholder titles ("Example Study", "Sample Research", "Test Paper")
- Placeholder authors ("Smith et al.", "Doe et al." without full citation)
- Fake URLs (example.com, test.com, localhost)
- Missing identifiers
- Incomplete citations

### Citation Formats

**Medical/Clinical Research:**

```
Author A, Author B, Author C. Title of the article. Journal Name. Year;Volume(Issue):Pages. PMID: 12345678. DOI: 10.1234/journal.2024.56789
```

**Technical/Engineering:**

```
Author A, Author B (Year). Title of the article. Journal Name, Volume(Issue), Pages. https://doi.org/10.1234/journal.2024.56789
```

**Regulatory Documents:**

```
Regulatory Agency. Document Title. Publication Date. Accessed: Date. URL
```

### Bibliography Quality Checks

Use `validate-bibliography.py` to check:

- PMID format validity and fabrication detection
- URL accessibility and placeholder detection
- Title/author placeholder pattern detection
- Citation format consistency
- Identifier completeness
- Duplicate detection

### Source Verification Patterns

**Valid PMID Characteristics:**

- 1-8 digits only
- Not sequential (12345678, 23456789)
- Not repetitive (11111111, 99999999)
- Not obviously fabricated

**Valid URL Characteristics:**

- Starts with http:// or https://
- Has valid domain (not example.com, test.com, localhost)
- Resolves to accessible resource (HTTP 200/300 status)
- Not containing "placeholder", "fake", "dummy", "test"

**Valid DOI Characteristics:**

- Starts with "10."
- Has proper format: 10.XXXX/identifier

## Quality Assurance Automation

### Bibliography Validation Script

**Purpose:** Detect fabricated or incomplete sources

**Checks:**

- PMID format and authenticity patterns
- URL accessibility
- Title/author placeholder detection
- Citation format consistency
- Identifier completeness

**Usage:**

```bash
python scripts/validate-bibliography.py <bibliography_file>
```

**Output:**

- List of validation issues by source
- Severity classification (critical, warning, info)
- Suggested fixes
- Summary statistics

### Research Quality Check Script

**Purpose:** Validate research claims and CLAUDE.md compliance

**Checks:**

- Unsupported claims (assertions without citations)
- Banned language (without evidence)
- Score fabrication
- Confidence level justification
- Methodology documentation
- Limitations completeness

**Usage:**

```bash
python scripts/research-quality-check.py <research_report>
```

**Output:**

- List of compliance issues
- CLAUDE.md violations
- Unsupported claims
- Missing citations
- Quality score breakdown

## Common Research Pitfalls

### Fabrication Pitfalls

- Creating fake PMIDs to fill citation gaps
- Using placeholder sources ("Example Study")
- Fabricating consensus scores without measurement
- Creating weighted averages without calculation basis
- Claiming higher confidence than evidence supports

### Methodology Pitfalls

- Inconsistent application of inclusion criteria
- Cherry-picking favorable results
- Ignoring conflicting evidence
- Inadequate documentation of search strategy
- Missing limitations section

### Citation Pitfalls

- Incomplete bibliographic information
- Inaccessible URLs
- Format inconsistency across citations
- Missing source identifiers
- Duplicate citations with different numbering

### Synthesis Pitfalls

- Overgeneralizing from limited evidence
- Misrepresenting study findings
- Losing context for numerical claims
- Failing to acknowledge uncertainties
- Creating false consensus across agents

## Integration with Other Skills

### Memory MCP Integration (Primary)

**How it integrates:**

- Persist research findings across sessions as semantic memories
- Store successful methodology patterns as procedural memories
- Track complete research projects as episodic memories
- Enable learning from past research to improve future quality
- Build domain expertise that accumulates over time

**Example:**
Before starting ADC toxicity research:

```
// Search for past ADC research
memory_search({
  type: "semantic",
  min_importance: 0.7,
  limit: 20
})
// Returns: 12 findings from previous ADC-ILD project
// Reuse validated findings, avoid re-searching same sources
// Build on existing knowledge base

// Find proven search strategies
memory_search({
  type: "procedural",
  min_importance: 0.7,
  limit: 10
})
// Returns: Successful PubMed search strategy from ADC-ILD project
// Adapt proven methodology to new research question
```

### Skill #1: Evidence-Based Validation

**How it integrates:**

- Apply rigorous validation to all research claims
- Use anti-fabrication protocols throughout research lifecycle
- Validate sources for authenticity
- Check confidence calibration
- Ensure proper evidence chains

**Example:**
When validating bibliography, use Evidence-Based Validation skill to:

1. Check each PMID for fabrication patterns
2. Verify URLs are accessible
3. Detect placeholder text in titles/authors
4. Ensure all claims have source citations
5. Validate confidence levels against evidence quality

### Skill #2: MCP Server Development

**How it integrates:**

- Create research tools accessible via MCP
- Enable research agents to communicate via MCP protocol
- Build bibliography management MCP servers
- Create validation services as MCP tools

**Example:**
Build MCP server for bibliography validation:

- Tool: `validate_sources` - check source authenticity
- Tool: `check_citation_format` - verify citation consistency
- Tool: `verify_pmid` - validate PMID against PubMed API
- Tool: `assess_evidence_quality` - evaluate study quality indicators

### Skill #3: Multi-Agent Orchestration

**How it integrates:**

- Apply coordination patterns to research agent teams
- Implement quality gates between research stages
- Enable parallel research execution with synthesis
- Coordinate cross-validation between agents

**Example:**
For systematic literature review:

1. Orchestrator assigns search to Agent A
2. Agent A completes, passes to Agent B (extraction)
3. Agent C validates Agent A's sources (parallel with Agent B)
4. Agent D synthesizes Agent B's extractions after Agent C validates
5. Quality gates enforce validation before proceeding

### Skill #4: Distributed Systems Debugging

**How it integrates:**

- Debug multi-agent research processes
- Validate research workflow execution
- Trace evidence chains through research pipeline
- Identify bottlenecks in research coordination

**Example:**
When research quality is insufficient:

1. Trace which agent produced problematic output
2. Check inputs/outputs at each stage
3. Validate agent coordination worked correctly
4. Identify where quality gates failed
5. Verify methodology was followed systematically

## Advanced Research Patterns

### Systematic Literature Review

Full workflow in `workflows/systematic-literature-review.md`

**Stages:**

1. Protocol development (research question, criteria, search strategy)
2. Systematic search execution
3. Screening (title/abstract, then full-text)
4. Data extraction
5. Quality assessment
6. Evidence synthesis
7. Report generation

**Quality Standards:**

- PRISMA compliance (Preferred Reporting Items for Systematic Reviews)
- Pre-registered protocol
- Reproducible search strategy
- Systematic screening process
- Bias assessment
- Comprehensive bibliography

### Multi-Agent Research Project

Full workflow in `workflows/multi-agent-research-project.md`

**Phases:**

1. Planning: Define research questions, assign agent roles
2. Parallel execution: Agents work on specialized domains
3. Cross-validation: Agents verify each other's findings
4. Synthesis: Integration agent combines findings
5. Quality assurance: Validation agent audits final output
6. Delivery: Package with methodology documentation

**Coordination:**

- Clear agent role definitions
- Quality gates between phases
- Regular sync points
- Cross-validation protocols
- Final synthesis with preserved disagreements

### Evidence-Based Safety Assessment

Pattern from safety-research-system ADC/ILD project

**Structure:**

1. Research Question: "What is the mechanistic basis for ADC-associated ILD?"
2. Agent Assignments:
   - Agent A: Clinical evidence (incidence, outcomes, risk factors)
   - Agent B: Mechanistic studies (molecular pathways, preclinical data)
   - Agent C: Treatment protocols (management, outcomes)
   - Agent D: Validation and synthesis
3. Quality Gates:
   - All sources validated for authenticity
   - Evidence extracted with proper attribution
   - Claims verified against sources
   - CLAUDE.md compliance checked
4. Deliverable: Comprehensive review with 165+ validated citations

## Limitations of This Skill

This skill does NOT:

- Replace domain expertise in research topics
- Automatically execute research (requires human judgment)
- Guarantee research validity (depends on source quality)
- Eliminate all research pitfalls (vigilance still required)
- Provide statistical analysis tools (separate skill needed)
- Replace peer review (human expert review still essential)
- Automatically sync memories across distributed agents (manual coordination required)

This skill DOES:

- Provide systematic methodology to reduce errors
- Enable quality automation to catch common pitfalls
- Structure multi-agent research coordination
- Enforce evidence standards and anti-fabrication rules
- Facilitate reproducible research workflows
- Guide bibliography management and validation
- **Persist research knowledge across sessions via Memory MCP**
- **Enable learning from past research to improve future quality**
- **Build cumulative domain expertise over time**

### Memory System Considerations

**What Gets Stored:**

- Research findings with source attribution (semantic)
- Successful methodology patterns (procedural)
- Complete project histories (episodic)
- Quality issues and resolutions (procedural)
- Domain knowledge (semantic)

**What Does NOT Get Stored:**

- Raw bibliographies (too large, use files instead)
- Complete research reports (use files, store summaries in memory)
- Individual citation details (store key findings only)
- Temporary working memory (use WORKING type, low importance)

**Memory Quality Standards:**

- All semantic memories must include source citations
- Procedural memories must include success/failure context
- Episodic memories should use JSON for structured data
- Tag comprehensively for effective retrieval
- Set importance based on reusability (0.9+ for proven patterns)

## References & Resources

**Internal Resources:**

- `reference/research-methodology.md` - Detailed research methods
- `reference/multi-agent-research.md` - Agent coordination patterns
- `reference/citation-management.md` - Citation standards and validation
- `reference/quality-assurance.md` - QA procedures and checklists
- `reference/skill-integration.md` - How this skill integrates others
- `templates/research-plan-template.md` - Research planning template
- `templates/literature-review-template.md` - Literature review structure
- `workflows/systematic-literature-review.md` - Complete workflow
- `workflows/multi-agent-research-project.md` - Multi-agent workflow
- `examples/research-workflows.md` - Real research examples
- `scripts/validate-bibliography.py` - Bibliography validation
- `scripts/research-quality-check.py` - Quality assurance automation

**External Standards:**

- PRISMA: Systematic review reporting standard
- CLAUDE.md: Anti-fabrication protocols (mandatory compliance)
- Evidence-Based Medicine hierarchy
- Research reproducibility guidelines

## Skill Metadata

**Version:** 2.0.0
**Created:** 2025-10-18
**Updated:** 2025-12-11 (Memory MCP Integration)
**Dependencies:**

- Memory MCP (memory_create, memory_search, memory_get, memory_stats)
- Evidence-Based Validation
- Multi-Agent Orchestration
- MCP Server Development (optional)
- Distributed Systems Debugging (optional)
  **Skill Level:** Advanced
  **Domain:** Research methodology, safety assessment, evidence synthesis
  **Quality Standard:** Medical/pharmaceutical research grade
  **Memory Integration:** Full (semantic, procedural, episodic)
  **Cross-Session Learning:** Enabled via Memory MCP
