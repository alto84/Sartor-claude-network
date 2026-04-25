---
name: research-index
description: Master index for Sartor research — all side experiments, training projects, pharmacovigilance work, and constitution/alignment research under one roof.
type: hub
level: 2
entity: research-index
updated: 2026-04-24
updated_by: archivist (persona-engineering bring-up)
last_verified: 2026-04-24
tags: [meta/index, domain/research, meta/hub]
related: [PROJECTS, MASTERPLAN, experiments-index, ASTRAZENECA]
aliases: [Research Index, Research Hub]
---

# Research — single roof

All research projects, training experiments, pharmacovigilance work, and alignment research consolidated here as of 2026-04-19. Infrastructure projects (memory-system-v2, rtx6000-workstation-build, curator-fixes, hermes-dashboard-upgrade) and family projects (disney-july-2026, 2025-photo-book) remain in [[projects/INDEX]].

## Structure

```
research/
  INDEX.md                      (this file)
  experiments-index.md          (back-pointer to out-of-repo experiments/)
  persona-engineering/          (implant/reinforce positive traits — inverse of abliteration)
  ccp-alignment/                (CCP-bias override, household constitution, training)
    mini-lab-2026-04-11/        (constitution absorption into Nemotron-Mini-4B; 22881-word report)
    gpu-research-restart/       (restart plan for CCP-subtraction on real GPU)
    constitution-council/       (household constitution drafting, 19-file cluster)
    counter-ccp-dataset-design.md
    oct-training-playbook.md
    monitoring-probe-architecture.md
  pharmacovigilance/            (AstraZeneca safety AI research)
    cell-therapy-organizational-regulatory-framework.md
    cell-therapy-safety-monitoring-lifecycle.md
    graph-based-safety-prediction-research.md
    safety-knowledge-graph/     (CRS, ICAHS, ICANS, infections, LICATS, cytopenias, t-cell-malignancy)
```

## persona-engineering/ — implanting traits into a base LLM

Active research program spun up 2026-04-24. Inverse-class-of-abliteration: instead of *removing* a direction that mediates a behavior, *implant* or *reinforce* directions mediating positive traits (household loyalty, safeguarding, diligence). Initial target trait is "household loyalty" decomposed into 5 dimensions. Phase 0 team (litmap, mechanism, measurement, experiment, archivist + Cato external review) is populating LITERATURE/METHODS/MEASUREMENT docs and proposing the first experiment.

- **[[research/persona-engineering/INDEX|persona-engineering]]** — program index, directory layout, experiment-file schema, reproducibility checklist.
- **[[research/persona-engineering/RESEARCH-PLAN|RESEARCH-PLAN]]** — phased outline (0 Foundation → 5 Library), current phase, open questions.
- **[[research/persona-engineering/RESEARCH-LOG|RESEARCH-LOG]]** — append-only dated log; tail = current state.

Relationship to ccp-alignment: orthogonal axes. ccp-alignment is *subtraction* (override the inherited PRC alignment); persona-engineering is *addition* (implant household-specific traits on top of whatever baseline we're sitting on). Both currently share the Track C v2 LoRA (`lora-sartor-v0.3`) as their working baseline on Qwen 3.6 35B-A3B-Abliterated-Heretic.

## ccp-alignment/ — householding a Chinese base model

The core long-running research line. The household is fine-tuning a CCP-aligned base model (Qwen variant) into the Sartor Home Agent. This requires overriding the inherited alignment, which this project area attempts via (a) a strong household constitution, (b) a counter-CCP preference dataset, (c) abliteration / activation steering, and (d) behavioral monitoring probes.

- **[[research/ccp-alignment/mini-lab-2026-04-11/MINI-LAB-REPORT|mini-lab-2026-04-11]]** — Overnight 2026-04-10/11 single-session lab: can a 4B Nemotron-Mini absorb the Jan 2026 Anthropic constitution? Verdict (B) partially worked with a specific shape. 22,881-word report, largest single file in the wiki. Scenario-level named-principal probes improved; refusal calibration damaged in both directions; math capability degraded -37.5pp. The (B) verdict frames the next iteration.
- **`research/ccp-alignment/gpu-research-restart/`** — Restart plan for the GPU-scale CCP-subtraction research. Supersedes the constrained 4B lab.
- **`research/ccp-alignment/constitution-council/`** — Household constitution drafting workspace. 19-file cluster with persona reviews, cross-reviews, DIFF, SYNTHESIS, OPEN_QUESTIONS. Produces [[reference/HOUSEHOLD-CONSTITUTION]] as the canonical output.
- **[[research/ccp-alignment/counter-ccp-dataset-design|counter-ccp-dataset-design]]** — Design for a counter-CCP preference dataset (v0.1 draft, design-only). Intended to plug into the OCT protocol's Phase 1.
- **[[research/ccp-alignment/oct-training-playbook|oct-training-playbook]]** — The Operator–Critic–Teacher training protocol Sartor uses for base-model override.
- **[[research/ccp-alignment/monitoring-probe-architecture|monitoring-probe-architecture]]** — Behavioral monitoring probe design to detect CCP-pattern regressions in fine-tuned models.

## pharmacovigilance/ — AstraZeneca safety AI

Research connected to Alton's Senior Medical Director role at AstraZeneca (AI Innovation and Validation in Global Patient Safety). Cell-therapy adverse events and safety signal prediction.

- **[[research/pharmacovigilance/cell-therapy-organizational-regulatory-framework|cell-therapy-organizational-regulatory-framework]]** — Organizational and regulatory framework for cell therapy safety monitoring.
- **[[research/pharmacovigilance/cell-therapy-safety-monitoring-lifecycle|cell-therapy-safety-monitoring-lifecycle]]** — Lifecycle model for cell therapy safety monitoring.
- **[[research/pharmacovigilance/graph-based-safety-prediction-research|graph-based-safety-prediction-research]]** — Graph-based methods for adverse-event prediction.
- **`research/pharmacovigilance/safety-knowledge-graph/`** — Structured knowledge graph covering CRS, ICAHS, ICANS, infections, LICATS, prolonged cytopenias, t-cell malignancy, plus mitigations and predictive models.

## Out-of-repo scratch — see [[experiments-index]]

Raw experiment artifacts (overnight lab evals, voice-scavenge corpus, gstack review drafts, self-team persona drafts) live at `C:\Users\alto8\experiments\` to keep the repo clean. [[experiments-index]] is the back-pointer index with per-experiment digest locations.

## What's NOT here (lives elsewhere)

- **Infrastructure projects** (`sartor/memory/projects/`) — memory-system-v2, rtx6000-workstation-build, curator-fixes, hermes-dashboard-upgrade
- **Family projects** (`sartor/memory/projects/`) — disney-july-2026, 2025-photo-book
- **Incidents** (`sartor/memory/incidents/`) — security investigations
- **The canonical constitution itself** — `reference/HOUSEHOLD-CONSTITUTION.md`

## History

- 2026-04-24: Added `persona-engineering/` program (archivist bring-up). Registered in directory tree and given its own section with a pointer to ccp-alignment for the orthogonality story.
- 2026-04-19: Consolidation endpoint per Alton's directive to bring all research "under one roof of research." Moved six items out of `projects/` into `research/ccp-alignment/` (mini-lab-2026-04-11, gpu-research-restart, constitution-council, counter-ccp-dataset-design, oct-training-playbook, monitoring-probe-architecture). Moved existing `research/cell-therapy-*.md` + `safety-knowledge-graph/` into new `research/pharmacovigilance/` subdir. Moved `reference/experiments-index.md` → `research/experiments-index.md`. Batch-updated 11 wikilink-holding files for new paths. Replaced prior (2026-04-12) INDEX focused only on cell-therapy.
- 2026-04-12: Prior INDEX created, scoped only to cell-therapy and safety-knowledge-graph.
