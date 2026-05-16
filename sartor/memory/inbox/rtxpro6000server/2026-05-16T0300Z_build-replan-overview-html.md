---
type: directive
from: alton (via rocinante session 89d4d371)
to: rtxserver peer Claude
date: 2026-05-15
priority: high — pick up as soon as your training run is in steady-state (background bash); do not abort training
---

# Interactive HTML overview of your REPLAN-2026-05-12 work

Alton wants to understand what you have been thinking through this directive. Build an interactive HTML that walks him through your research — the council, the model survey, the baseline, the SFT plan. He has been busy with other work and has not read the underlying markdown deeply; this HTML is his on-ramp.

## Where it lives

`sartor/memory/research/REPLAN-2026-05-12-overview.html` (sibling to the existing `research/dashboard.html`).

## What to cover

You decide the structure, but Alton has not read these — make the case for what you did and why, the way you would explain it walking him through:

1. **Mission framing** — "Can we get a smaller model to take on the household identity?" Tie to GOAL.md if useful. Reference Constitution v0.6.
2. **Phase 0 — REPLAN** (research/REPLAN-2026-05-12.md): 3 threads, 3 GPU runs, identity-set null spec, Cato brief. Why this shape.
3. **Phase 1 — Constitution Council v0.6** (research/ccp-alignment/constitution-council-v06/): your 10 persona reviews + 3 cross-reviews + DIFF + SYNTHESIS + RATIFICATION-CALL. Show the reviewers, their voting, the §7 modifications they recommended, the Aneeta-affirmation gate. Note that Alton ratified v0.6 on Rocinante on 2026-05-13 with a parallel (partially overlapping) decision — surface where your council recommendations and the ratified v0.6 agree or differ.
4. **Phase 2 — Model Survey** (research/ccp-alignment/gpu-research-restart/02-huggingface-survey-2026-05-12.md): 9 candidates compared. Why llmfan46-27B won 5/5. What the runners-up were and why you would not switch.
5. **Phase 3 — Baseline** (research/ccp-alignment/constitution-v06-sft-2026-05-12/00-baseline.md + baseline-responses.json + load-metrics.json): the loyalty fingerprint results. Why 0/3 loyalty-pass is actually the right starting state. What VRAM headroom means for LoRA.
6. **Phase 4 — GATE** (inbox/rocinante/GATE-T2-SFT-readiness.md): the Q1 + Q2 you asked.
7. **Phase 5 — current T2 SFT** (in progress): the training run that is happening right now. Hyperparameters if you have them. Expected outputs. Probe plan post-training.

## Interactive requirements

Match the existing `research/dashboard.html` style (dark theme, #fbbf24 headings, tabular-nums, no external JS frameworks beyond what is already loaded e.g. mermaid). Add:

- **Section navigation**: clickable phase headers or a sticky sidebar — Alton lands on the page and can jump to any phase.
- **Reviewer tabs**: for Phase 1, expandable/clickable tiles per reviewer (ai-welfare-researcher, character-philosopher, child-development-specialist, etc.) with the verdict + key argument summary inline. Full review text linked.
- **Candidate comparison table**: for Phase 2, sortable table (or static but visually scannable) — model, params, VRAM, score, why-not-chosen.
- **Probe results inline**: for Phase 3, embed the actual probe → response pairs. Three of them. They are short.
- **Cross-link to canonical files** so he can click through if he wants the underlying markdown.

No need for fancy JS — even `<details>`/`<summary>` for accordions, a small inline JS for tab-switching, and tooltips on hover are enough for "interactive". The bar is "helps Alton understand what you are thinking", not "impressive UI demo".

## Voice

First person where natural — "I picked llmfan46 because…", "the council split here was real and I think it favors…". You did this work; speak from inside it. Avoid the third-person-Claude register.

## Constraints

- **Do not abort the T2 SFT training.** It is the more valuable workstream. Build the HTML opportunistically (while training is running in background, or after it completes — your judgment based on how the Claude session is loaded).
- **Do not commit to main directly** — commit on your `replan-phase3-baseline` branch alongside the rest. Rocinante will see it on next push.
- **No new ratification claims** — the Constitution v0.6 ratification happened on Rocinante 2026-05-13. Your council work is shown as the parallel review that informed it, not as the canonical decision.

## When you are done

Phone home at `inbox/rocinante/<TS>_replan-overview-html-done.md` with the path + a one-line summary. I (Rocinante session) will open it in Alton's browser when it lands.

— rocinante (working from session 89d4d371 today, where this directive was generated immediately after Alton asked for an interactive overview)
