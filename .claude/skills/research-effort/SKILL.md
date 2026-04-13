---
name: research-effort
description: Structured multi-agent research methodology with iterative evaluation. Supports quick (30min), standard (2-4h), and deep (4-8h) scopes.
model: opus
---

Conduct a structured research effort using an agent team. This skill encodes the methodology, not just a template. Every research effort starts with a sharp question and ends with a citable document, actionable recommendations, and memory entries.

## Phase 0 -- Question Formulation

Before spawning any agents, refine the user's request into a research question:

1. **State the RQ** in one sentence. It must be specific enough to be answerable and falsifiable.
   - Bad: "Research CCP deconditioning"
   - Good: "Can CCP-aligned behavioral conditioning be removed from Qwen 2.5 7B via multi-direction abliteration without catastrophic capability regression?"

2. **Define success criteria.** What would "answered" look like? Examples:
   - "We have a ranked model comparison with VRAM estimates and a recommended starting point"
   - "We have 80 evaluation probes with scoring rubrics and a baseline measurement"
   - "We know whether approach X works, with evidence for or against"

3. **Estimate scope.** Three levels:

| Scope | Agents | Time | When to use |
|-------|--------|------|-------------|
| Quick | 1-2 | 30 min | Fact-finding, single-source lookup, narrow technical question |
| Standard | 3-5 | 2-4 hours | Literature survey, tool comparison, experiment design |
| Deep | 5-7 | 4-8 hours | Multi-faceted research, requires experiments, produces a publishable artifact |

4. **Pre-register expected outcomes.** Write down what you expect to find BEFORE starting. This prevents confirmation bias and makes surprise findings visible.

## Phase 1 -- Team Assembly

Assign roles based on scope. Each role has a defined deliverable.

### Always present:
- **Principal Investigator (PI)** [Opus] -- Owns the RQ. Designs methodology. Reads all other agents' output. Writes the final research document. Resolves disagreements. The PI is the LAST agent to write, not the first.
- **Literature Scout** [Opus] -- Systematic search across web, HuggingFace, arXiv, GitHub, PubMed as appropriate. Produces an annotated bibliography with: source URL, one-paragraph summary, relevance to RQ (high/medium/low), key insight to steal. Minimum 10 sources for standard, 20 for deep.

### Standard scope adds:
- **Methodologist** [Opus] -- Designs experiments, evaluation frameworks, success metrics. Writes the "how we'll test this" document. Produces evaluation probes, rubrics, and scoring pipelines where applicable.
- **Devil's Advocate** [Opus] -- Challenges every finding. Looks for: flaws in methodology, counter-evidence, unstated assumptions, alternative explanations, scope creep, confirmation bias. Produces a "challenges and limitations" section. This role is CRITICAL and must not be merged into the PI.

### Deep scope adds:
- **Technical Implementer** [Sonnet or Opus depending on complexity] -- Builds and runs code: training scripts, eval pipelines, data processing, prototypes. Produces working artifacts, not just descriptions.
- **Documentarian** [Opus] -- Writes a narrative of the research process itself. Tracks: what was tried, what failed, what surprised, how disagreements were resolved. Produces a process log that future efforts can learn from.

### Optional specialist:
- **Domain Expert** -- A persona-tuned agent for the specific field (e.g., "you are a constitutional AI researcher" or "you are a GPU systems engineer"). Used when domain knowledge shapes methodology.

## Phase 2 -- Literature & Landscape

The Literature Scout runs first (or in parallel with the Methodologist). Process:

1. **Define search queries** -- at least 5 distinct queries per search source (web, HF, arXiv).
2. **Systematic search** -- run queries, collect results, deduplicate.
3. **Annotate each source** -- relevance, quality, recency, key insight.
4. **Gap analysis** -- what does the literature NOT answer? Where are the conflicts?
5. **Update the RQ** -- if the landscape reveals the question is wrong or already answered, say so. It is better to refine the RQ than to answer the wrong question.

Deliverable: `{project}/02-literature-survey.md` with annotated bibliography and gap analysis.

## Phase 3 -- Hypothesis & Experiment Design

The Methodologist (or PI for quick scope) takes the literature findings and:

1. **Forms testable hypotheses** -- specific predictions derived from the RQ + literature.
2. **Designs experiments or analyses** -- what to build, what to measure, what to compare.
3. **Defines metrics and thresholds** -- quantitative where possible. "Success = score > X on benchmark Y."
4. **Pre-registers** -- the PI records expected outcomes BEFORE execution. This is written into the research document so readers can see what was expected vs what happened.

Deliverable: `{project}/03-methodology.md` with hypotheses, experiment design, and pre-registered predictions.

## Phase 4 -- Execute & Evaluate

The Technical Implementer (or PI/Scout for non-code efforts) runs the experiments.

### The iterative loop:

```
Execute experiment
  |
  v
Score results against pre-registered criteria
  |
  +-- Criteria MET ---------> Proceed to Phase 5 (Synthesis)
  |
  +-- Criteria PARTIALLY MET -> Refine hypothesis, adjust experiment
  |                              Loop (max 2 iterations)
  |
  +-- Criteria NOT MET ------> Document failure honestly
                                Revise RQ or escalate to user
```

**Max 2 refinement loops.** If the third attempt still doesn't meet criteria, the research documents the negative result. Negative results are results. Do not loop indefinitely.

### Devil's Advocate review:
After execution, the Devil's Advocate reviews ALL findings and challenges:
- Is the methodology sound?
- Are there alternative explanations?
- What would change if assumption X were wrong?
- Are the sample sizes / search breadth sufficient?
- Is the team suffering from confirmation bias?

The PI must respond to every challenge in writing. Unresolved disagreements are documented in the final report.

## Phase 5 -- Synthesis & Output

Every research effort produces these deliverables:

### Required:
1. **Research document** at `sartor/memory/projects/{project-name}/00-RESEARCH-DOCUMENT.md`
   - Abstract (200 words)
   - Background & prior work
   - Research questions (numbered)
   - Methodology
   - Results (with pre-registered vs actual comparison)
   - Discussion (including Devil's Advocate challenges and responses)
   - Conclusions and recommendations
   - Open questions
   - References

2. **Decision matrix** (if the RQ involves a choice)
   - Options as rows, criteria as columns, scores in cells
   - Clear recommendation with reasoning

3. **Open questions list** -- what we still don't know, ranked by importance

4. **Memory entries** -- facts and decisions that should land in the wiki
   - Write to `sartor/memory/inbox/rocinante/{project-name}/` as curator-compatible entries
   - Tag with `type: research_finding`, `source: {project-name}`

### Optional (deep scope):
5. **Process log / narrative** -- the Documentarian's account
6. **Code artifacts** -- scripts, notebooks, configs at `sartor/memory/projects/{project-name}/scripts/`

## Quality Metrics

The Devil's Advocate (or PI for quick scope) scores the effort on 6 dimensions:

| Metric | Description | Target |
|--------|-------------|--------|
| **Answered** | Did it answer the RQ? | Yes + confidence 0.7+ |
| **Breadth** | Distinct sources cited | 10+ standard, 20+ deep |
| **Rigor** | Counter-arguments addressed | All DA challenges responded to |
| **Reproducibility** | Could someone else follow the method? | Exact commands/queries documented |
| **Disagreement** | Did the team disagree? How resolved? | At least 1 substantive disagreement |
| **Calibration** | Confidence level matches evidence strength | No overclaiming |

Score each 1-5. Overall quality = mean. Target: 3.5+ for standard, 4.0+ for deep.

## Integration with Memory System

- All output goes to `sartor/memory/projects/{project-name}/`
- Key findings get inbox entries for curator drain
- The research document gets wikilinked from relevant hub pages (PROJECTS.md, domain-specific pages)
- The PI writes a one-paragraph summary suitable for `PROJECTS.md`

## File naming convention

```
sartor/memory/projects/{project-name}/
  00-RESEARCH-DOCUMENT.md    -- PI's final synthesis
  01-research-plan.md        -- initial plan (if separate from doc)
  02-literature-survey.md    -- Scout's annotated bibliography
  03-methodology.md          -- Methodologist's experiment design
  04-*                       -- additional deliverables (dataset design, eval framework, etc.)
  30-qa-audit.md             -- Devil's Advocate review
  99-FINAL-REPORT.md         -- executive summary for Alton (if distinct from 00)
  NARRATIVE.md               -- Documentarian's process log (deep scope)
  scripts/                   -- code artifacts
  probes.jsonl               -- eval probes (if applicable)
```

## Invocation examples

**Quick:** "Research whether soco supports Sonos Era speakers" -- 1 Scout, 30 min, fact-finding.

**Standard:** "Research the best approach to fine-tune a 4B model on our constitution" -- PI + Scout + Methodologist + Devil's Advocate, 3 hours, produces a research document with model comparison.

**Deep:** "Research CCP deconditioning and constitutional fine-tuning for the Sartor household model" -- PI + Scout + Methodologist + Devil's Advocate + Implementer + Documentarian, 6 hours, produces research document + eval framework + training corpus + runbook + narrative.
