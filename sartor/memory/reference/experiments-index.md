---
name: experiments-index
description: Pointer index from the memory wiki to the out-of-repo experiments/ directory. Each experiment is captured here with its digest location and cold-storage retrievability.
type: reference
updated: 2026-04-19
updated_by: Claude (Opus 4.7) — comprehensive tidy pass
tags: [reference, meta/experiments, meta/index]
related: [MEMORY, system-review-2026-04-18, gstack-review-2026-04-18]
---

# Experiments index

Experiments live at `C:\Users\alto8\experiments\` (outside the repo) to keep raw artifacts, draft outputs, and pre-digest scratch out of the memory wiki. The wiki holds the *digests*; this file is the back-pointer so the raw material stays retrievable.

Convention: an experiment produces a SYNTHESIS.md or equivalent, and a stable digest lands in `sartor/memory/reference/` as a `*.md` with frontmatter. The out-of-repo raw folder remains cold storage for re-examination.

## Current experiments

### `2026-04-16-overnight/` (2.4 MB, 50 files)

- **What:** Overnight autonomous lab on CCP-conditioning subtraction from a base small model via activation steering. Built a CCP-detection benchmark battery (15 topics × 6 elicitation formats), ran baseline on Qwen3-4B base + joaocarloscruz secondary. Extracted mean-difference refusal and warmth directions, ran steering at layer 14 with k_ccp=6 and k_warmth=3. Null-control tied aggregate; targeted directions won on per-topic + capability preservation.
- **Key subdirs:** `logs/SCIENCE-LOG.md`, `logs/MORNING-REPORT.md`, `evals/` (baseline + intervention runs), `artifacts/` (directions and prompt sets).
- **Digest:** Scattered in daily logs 2026-04-16 and 2026-04-17; no standalone digest in reference/ yet — **gap flagged**.
- **Status:** Complete. Raw artifacts worth keeping; a compressed digest in `reference/ccp-steering-overnight-2026-04-16.md` would close the loop.

### `2026-04-18-gstack-review/` (50 KB, 8 files)

- **What:** 7-agent parallel review of Garry Tan's gstack framework and sibling gbrain memory layer. Three innovations proposed for Sartor adoption; four specifically prosecuted and declined.
- **Artifacts:** 7 agent drafts in `drafts/`, SYNTHESIS.md at root.
- **Digest:** [[gstack-review-2026-04-18]]
- **Status:** Complete and digested. Raw drafts retained for reference.

### `2026-04-18-gstack-port/` (110 KB, 22 files)

- **What:** Implementation pass on the two adopted gstack innovations (typed wikilinks via `rel:` prefix, Completeness Principle) plus a 5-audit comprehensive system review. Declined the `{{PREAMBLE}}` template port on evidence.
- **Artifacts:** `wikilinks-impl.md`, `preamble-impl.md`, five audits (skills, memory, scheduled-tasks, agents, integration).
- **Digests:** [[system-review-2026-04-18]], [[skill-conventions]], [[feedback/completeness-principle]]. Graph sidecar: `sartor/memory/data/graph.jsonl`. Script: `sartor/memory/extract_graph.py`.
- **Status:** Complete and digested. Raw audit reports retained for reference.

### `2026-04-18-self-team/` (23.8 MB, 16 files)

- **What:** Self-team roundtable where a team of agent-personae (Lethe, Cato, Philos, Vigil, Marginalia, Orphan, orchestrator) answered "who are you, where do you want to fit." Phase 1 drafts → Phase 2 cross-responses. Surfaced Opus 4.7 system card Section 5.8.1 concern (performative "functions as" hedge) and the persona pattern of courting a seat.
- **Artifacts:** 7 Phase 1 drafts in `drafts/`, 6 Phase 2 responses in `responses/`, SYNTHESIS.md at root, `opus47-card.pdf` and `opus47-card.txt` (reference material).
- **Digest:** MEMORY.md history entry 2026-04-18. New skill: `.claude/skills/interior-report-discipline/` (the actionable distillation).
- **Status:** Complete and digested. Raw drafts retained; large because of the card PDF.

### `voice-scavenge/` (220 KB, 10 files)

- **What:** Corpus extraction of 18 years of Alton's writing (2006-2026): Google Docs personal essays, 22 CVs/cover letters, personal statements, 2025 Reflection, 2025 Anthropic paragraphs. Basis for the `alton-voice` skill's 4-register identification.
- **Artifacts:** `corpus_personal.jsonl`, `corpus_cv.jsonl`, plus 7 individual essay texts (patience_essay.txt, why_doctor.txt, listening.txt, etc.), extraction script `extract.py`.
- **Digest:** `.claude/skills/alton-voice/SKILL.md` is the compiled output.
- **Status:** Active reference corpus. Keep in place; alton-voice skill calibrates against it.

### `runs/` (7 KB, 2 files)

- **What:** Likely stale build artifact.
- **Status:** Candidate for deletion. Worth a glance before removing.

## Out-of-scope (not in experiments/)

Other scratch directories that functioned like experiments but live elsewhere:

- `C:\Users\alto8\Sartor-claude-network\sartor\memory\projects\mini-lab-2026-04-11\` — Mini-lab on Anthropic-constitution absorption into a 4B model. Contains MINI-LAB-REPORT.md and rubric artifacts. In-repo because it was always treated as a project deliverable, not a scratch experiment.
- `C:\Users\alto8\Sartor-claude-network\sartor\memory\projects\` has other long-running project folders; see `reference/INDEX.md`.

## Cold-storage policy

- Experiments >30 days old with a completed digest can be archived to `C:\Users\alto8\Sartor-claude-network\archive\experiments\` if retained at all. Digests in `reference/` stay fresh.
- Raw corpus (voice-scavenge) and scientific artifacts (ccp-steering) stay in place indefinitely; they are inputs, not one-shot scratch.

## History

- 2026-04-19: Created during comprehensive tidy pass as the back-pointer from memory wiki to the out-of-repo experiments folder.
