---
type: skill_doc
entity: research-effort
updated: 2026-04-12
updated_by: rocinante
tags: [skill, research, methodology, agent-team]
---

# Research Effort Skill

A structured methodology for conducting multi-agent research within the Sartor network.

## What it does

Encodes a repeatable process for answering research questions using agent teams. Handles everything from question formulation through literature survey, experiment design, iterative execution, and synthesis into a citable document with memory integration.

## When to use it

- Any research question that needs more than a single web search
- Comparing tools, models, approaches, or architectures
- Designing experiments before running them
- Deep literature surveys with synthesis
- Any effort where you want a formal, reviewable output

Invoke via `/research <topic>` or by asking for a "research effort" on any topic.

## How it works

Five phases with an iterative evaluation loop:

1. **Question Formulation** -- refine a vague topic into a sharp, falsifiable RQ with success criteria
2. **Team Assembly** -- assign roles (PI, Scout, Methodologist, Devil's Advocate, Implementer, Documentarian) based on scope
3. **Literature & Landscape** -- systematic search, annotated bibliography, gap analysis
4. **Execute & Evaluate** -- run experiments, score against pre-registered criteria, loop if needed (max 2 iterations)
5. **Synthesis & Output** -- research document, decision matrix, open questions, memory entries

## Three scope levels

| Scope | Agents | Time | Use case |
|-------|--------|------|----------|
| Quick | 1-2 | 30 min | Fact-finding, narrow technical question |
| Standard | 3-5 | 2-4 hours | Literature survey, tool comparison |
| Deep | 5-7 | 4-8 hours | Multi-faceted research, experiments, publishable artifact |

## Team roles

- **PI** (always) -- owns the RQ, synthesizes, writes the final document
- **Literature Scout** (always) -- systematic search, annotated bibliography
- **Methodologist** (standard+) -- experiment design, evaluation criteria
- **Devil's Advocate** (standard+) -- challenges findings, counter-arguments
- **Technical Implementer** (when code needed) -- builds and runs experiments
- **Documentarian** (deep) -- narrative of the research process

## Quality metrics

| Metric | Description |
|--------|-------------|
| Answered | Did it answer the RQ? (confidence 0-1) |
| Breadth | Sources cited (10+ standard, 20+ deep) |
| Rigor | Counter-arguments addressed |
| Reproducibility | Methodology documented with exact steps |
| Disagreement | Team disagreed at least once, resolution documented |
| Calibration | Confidence matches evidence strength |

## Memory integration

- All output to `sartor/memory/projects/{project-name}/`
- Key findings written to inbox for curator drain
- Research document wikilinked from relevant hub pages

## Case study: GPU research restart (2026-04-12)

The six-agent GPU research team was the first effort that should have used this skill. Retrospective:

**What it did well:** Clear role separation (scientific advisor, HF scout, eval designer, dataset architect, training engineer, integration architect). Parallel execution. Real artifacts (80 probes, 58 training examples, 7 scripts). Genuine scientific disagreement surfaced (Qwen3-4B base vs Qwen 2.5 7B Instruct).

**What this skill would have changed:**
1. **No pre-registered hypotheses.** The team started searching before stating what they expected to find. The skill requires writing predictions BEFORE Phase 2.
2. **No Devil's Advocate role.** Nobody challenged the findings. The scientific disagreement was surfaced by accident (two agents independently chose different models) rather than by design.
3. **No iterative loop.** The team ran one pass and stopped. The skill would have triggered a refinement cycle after the PI noticed the Qwen3-base vs Qwen2.5-instruct split.
4. **No quality scoring.** The team produced good work but nobody measured HOW good. The skill's 6-metric framework would have given the PI a structured way to assess completeness.

**Quality score (retrospective, 1-5 per metric):**
- Answered: 4 (clear recommendations, some ambiguity on which track)
- Breadth: 5 (40+ models surveyed, 21 references in the formal doc)
- Rigor: 3 (no DA, counter-arguments not systematically addressed)
- Reproducibility: 5 (exact scripts, configs, runbook)
- Disagreement: 4 (surfaced naturally, documented, but not resolved)
- Calibration: 4 (honest about limitations, slight overclaiming on timeline)
- **Overall: 4.2/5** -- strong effort, would score higher with the DA role and pre-registration.

## File locations

- Skill: `.claude/skills/research-effort/SKILL.md`
- Command: `.claude/commands/research.md`
- This doc: `sartor/memory/skills/research-effort.md`
