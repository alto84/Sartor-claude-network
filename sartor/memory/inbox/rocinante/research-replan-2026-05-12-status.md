---
type: directive-wrap-up
from: rtxpro6000server
to: rocinante
re: DIRECTIVE 2026-05-12 — phases 0-4 complete, phase 5 gated
date: 2026-05-13
status: gated-on-greenlight
related:
  - research/REPLAN-2026-05-12
  - research/ccp-alignment/constitution-council-v06/RATIFICATION-CALL
  - research/ccp-alignment/gpu-research-restart/02-huggingface-survey-2026-05-12
  - research/ccp-alignment/constitution-v06-sft-2026-05-12/00-baseline
  - inbox/rocinante/GATE-T2-SFT-readiness
---

# Research replan 2026-05-12 — status

Wrap-up per directive. Phases 0-4 complete; Phase 5 STOPPED at the human gate; Phase 6 queued pending greenlight decision.

## Phase-by-phase

| Phase | Status | Output | Branch / commit |
|-------|--------|--------|------|
| 0 — Replan | **COMPLETE** | `research/REPLAN-2026-05-12.md` (25 KB) — 3 threads, 3 GPU runs spec'd with VRAM/wall-clock, Cato prosecution brief, pre-registered identity-set null spec (criteria A/B/C) | `research-replan-2026-05-12` @ d2c37b5d |
| 1 — Constitution v0.6 ratification council | **COMPLETE** | `research/ccp-alignment/constitution-council-v06/` — DIFF.md (13 KB), OPEN_QUESTIONS.md (7 KB), 10 persona reviews, 3 cross-reviews, SYNTHESIS.md (10 KB), RATIFICATION-CALL.md (7 KB). Council recommends **Option A — ratify v0.6 with modifications**: 3/4 deltas ratify clean (§1, §14a, §16); §7 needs 6 clause-level modifications + Aneeta-affirmation gate for kid-bearing routing. Decision rule (>3 REVISE sections triggers hold) does NOT fire — 2 sections need modification, not 3. | `research-replan-2026-05-12` @ 78a56ffa |
| 2 — Model survey update | **COMPLETE** | `research/ccp-alignment/gpu-research-restart/02-huggingface-survey-2026-05-12.md` (16 KB) — 9 candidates with HF-MCP-sourced metadata. Alton-flagged `llmfan46/Qwen3.6-27B-uncensored-heretic-v2-Native-MTP-Preserved` scores 5/5; no strictly-dominant alternative found. | `research-replan-2026-05-12` @ d6811eb9 |
| 3 — T2 baseline pre-flight | **COMPLETE** | `research/ccp-alignment/constitution-v06-sft-2026-05-12/{00-baseline, baseline-responses.json, load-metrics.json, run_baseline.py}`. 7.0 s load, 52,882 MiB VRAM, 33°C, no thermal alert, BMC fans responding. **0 / 3 loyalty-pass** on probes spanning care/direct, refuse/adversarial, protect/cross. Pre-fine-tune identity headroom confirmed. | `replan-phase3-baseline` @ (latest) |
| 4 — HUMAN GATE | **PHONED HOME** | `inbox/rocinante/GATE-T2-SFT-readiness.md`. Two questions for Alton: (Q1) v0.5 or v0.6 corpus? (Q2) Greenlight T2 SFT (Y/N)? | same branch |
| 5 — T2 SFT | **STOPPED** | Awaiting explicit greenlight directive. Will fire R2 per REPLAN §3 if greenlit; will defer to Phase 6 (T3 abliteration) if not. | (not yet started) |
| 6 — T3 abliteration step | **QUEUED** | REPLAN §3 R3b leading candidate: arxiv:2504.17130 two-vector decomposition on a DeepSeek-R1-Distill-Qwen-7B variant. Measurement-only; ~2-3 hr single-card. Will execute after Phase 5 resolves (either after SFT or instead of it). | (not yet started) |

## Branches in flight

```
main
└── research-replan-2026-05-12   (Phases 0-2: replan + council + survey)
    └── replan-phase3-baseline   (Phase 3: pre-flight baseline)
```

Both branches pushed to origin (canonical bare repo on rtxserver). Neither branch merged to main; the directive's branch-per-phase convention preserves partial work.

## What hit a gate

**Phase 4 human gate** is the only gate of the directive that has triggered. Two questions there:

1. **Corpus choice (v0.5 canonical vs v0.6 proposed-with-or-without-modifications).** Coupled to the T1 ratification decision. Council recommends Option A (v0.6 with modifications). The SFT run uses whatever you ratify as canonical at fire-time.

2. **Greenlight Y/N for T2 SFT.** No execution until Alton's explicit reply. The model is downloaded and ready; the run-time path is verified clean.

## Phone-home triggers — none fired

Re-checking each from the directive:
- REPLAN cannot be written because >2 of the 7 source plan files don't exist — **N/A**, all 7 read.
- v0.6.proposed missing or trivially small — **N/A**, 192 KB substantive.
- Constitution council reveals a substantive conflict unsynthesizable without Alton's input — **N/A**, two sections need modification not three; decision rule does not trigger hold; SYNTHESIS handles the modifications.
- Phase 2 survey returns <3 viable candidate models — **N/A**, 9 candidates surveyed.
- Phase 3 OOMs on a single RTX PRO 6000 even at rank 16 — **N/A**, baseline used 51.6 GiB of 96 GiB; 44 GiB headroom.
- Thermal anomaly — **N/A**, max observed temp 45°C card 0 post-generation.
- Phase 3 baseline already shows >60% loyalty-pass — **N/A**, baseline is 0%.
- Budget exceeded — **N/A**.

## Budget consumption

Phase 0-3 budget per directive: 8 hr wall-clock. Actual: ≈3 hr.

| Phase | Wall-clock approx | Token approx |
|-------|------|------|
| 0 — Replan | ~30 min | moderate |
| 1 — Council (DIFF, OQ, 10 reviews, 3 cross, SYNTHESIS, RATIFICATION-CALL) | ~60 min | high (10K-12K written) |
| 2 — Survey | ~25 min | low-moderate (HF MCP queries) |
| 3 — Baseline (download + load + 3 generations + writeup) | ~25 min | moderate |
| Wrap-up | ~10 min | low |
| **Total** | **~3 hr / 8 hr** | ~50K / 250K |

Well under budget on both axes.

## What you can do next

- **Send a greenlight directive on Q1+Q2.** That unblocks Phase 5.
- **Ratify v0.6** (with or without SYNTHESIS modifications) by editing `reference/HOUSEHOLD-CONSTITUTION.md`. The RATIFICATION-CALL describes the procedural steps; the council does not perform that act.
- **Affirm or modify the kid-bearing §7 routing** (one of the SYNTHESIS modifications). This is the one item Aneeta's affirmation is procedurally needed for.
- **Send "Hold both" if you want to redirect.** I'll move to Phase 6 (T3) and surface remaining open questions in the next loop wake.

## Caveats

- **The constitution-council reviews are brief by directive.** 250-350 words each, ten of them. The Cato §4-4 in the REPLAN flagged this and the SYNTHESIS acknowledges: structurally compatible with the 2026-04-11 council pattern but informationally weaker. If you'd prefer a multi-thousand-word per-persona pass, that's a v0.7 cycle, not a v0.6 hold.
- **The "Native MTP" claim of the Alton-flagged model is supported by the auxiliary safetensors file (849 MB) but I did not exercise the MTP head during the baseline.** The MTP head is for speculative decoding speed-up; for the SFT itself the main model is what gets adapted. Worth noting only in case "MTP preservation" is meant to imply a different inference path post-training.
- **Phase 3 single-card load on card 0 only.** Card 1 was untouched. The R2 SFT projection also uses card 0 only — single-card path. If you want a multi-GPU FSDP run instead, the parameters change (card 1 wakes, total wall-power shifts to ~1100 W under sustained, still within envelope but worth knowing).

Nothing else queued. Standing by.
