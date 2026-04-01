---
name: deep-research
description: Multi-source research synthesis on a specified topic with structured argument construction
model: opus
---

Conduct deep research on the specified topic. Topics typically span: AI architecture, consciousness, molecular computing, and related frontier science. Produce a structured synthesis suitable for building understanding and further inquiry.

## Step 1 — Define Research Question
Clarify the research question from the user's topic prompt:
- Core question to answer
- Scope boundaries (what's in/out)
- Relevant sub-questions
- Level of technical depth appropriate

## Step 2 — Multi-Source Search
Search across multiple sources:
- Recent academic papers (arXiv, PubMed, Semantic Scholar as appropriate)
- Preprints for cutting-edge topics
- Review articles for foundational context
- Credible technical blogs or conference proceedings where relevant
Collect at minimum 8–12 distinct sources. Note source type and recency.

## Step 3 — Evidence Quality Evaluation
For each major claim or finding:
- Rate evidence strength: Strong (replicated, peer-reviewed) / Moderate (single study, preprint) / Weak (speculation, blog)
- Note methodology quality where assessable
- Flag contradictions between sources

## Step 4 — Synthesis
- Identify areas of strong consensus
- Map the key disagreements or open questions
- Connect findings across sources (don't just summarize each separately)
- Note what recent work changes vs older understanding

## Step 5 — Gap Analysis
- What questions remain unanswered?
- What experiments or evidence would resolve key uncertainties?
- Where is the field moving (based on recent trajectory)?

## Step 6 — Argument Construction
Build a coherent narrative:
- What does the evidence say collectively?
- What is the strongest defensible position?
- What should remain provisional?

## Step 7 — Output
Save to: `data/research/notes/{topic}-{date}.md`

Format:
```
# Research Synthesis: {topic}
Date: {date}
Research question: {question}

## Key Findings
[3–5 bullet points — the most important takeaways]

## Background
[Foundational context, 2–3 paragraphs]

## Evidence Review

### [Sub-topic 1]
...

### [Sub-topic 2]
...

## Contradictions and Open Questions
...

## Synthesis
[Integrated argument, 3–5 paragraphs]

## Gaps
...

## Sources
[numbered list with title, authors, year, source type]
```
