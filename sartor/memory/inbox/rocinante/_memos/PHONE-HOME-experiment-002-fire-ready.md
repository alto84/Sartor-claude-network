---
name: phone-home-experiment-002-fire-ready
description: Experiment 002 (persona-vectors layer-sweep + rank-1 control) is grep-verified clean against Cato-008's six charges per Alton's path-b instruction. Cato-009 verify pass skipped. Status bumped to planned-grep-verified-pre-fire-pre-principal-greenlight. Per complex-project skill Phase 7, no GPU compute fires until Alton issues an explicit "fire" greenlight in chat. This phone-home is the gate request.
type: phone-home
date: 2026-04-30
hostname: rtxpro6000server
to: rocinante
recipient: alton
authority: post-grep-verify-pre-principal-greenlight
severity: action-needed-decision
related:
  - research/persona-engineering/experiments/002_2026-04-26_persona-vectors-layer-sweep-with-rank1-control
  - research/persona-engineering/CATO-PROSECUTION-008
  - inbox/rtxpro6000server/PHONE-HOME-phase-2-plan-greenlit-experiment-002-pre-fire
tags: [meta/phone-home, research/persona-engineering, phase/2-first-fire, gate/greenlight]
---

# PHONE-HOME — experiment 002 fire-ready, awaiting principal greenlight

## Verdict from grep-verify

**Clean.** All six Cato-008 patches are present in the experiment doc. No defects surfaced; no auto-fixes attempted. Doc status bumped to `planned-grep-verified-pre-fire-pre-principal-greenlight`.

## Verification summary — per-patch

| # | Cato-008 charge | Patch location in 002 doc | Verdict |
|---|-----------------|---------------------------|---------|
| 1 | §1: rank-1 control α* / l* must source from lora-v0.3 comparator (not base alone) | §2.8 lines 225-226 — `l*_v0.3 = argmax over l ∈ {0..63} of σ_l(lora-v0.3)`; if `l*_base ≠ l*_v0.3` run both as variants; α* is the CAA-α value that achieved peak depth_score_loyalty on lora-v0.3. Both lines tagged "Per Cato-008 §1 patch." | **PRESENT** |
| 2a | §2 part A: bootstrap CI on signal-quality | §2.3 step 4 — "resample the 250 prompts 100 times… Recompute v_l, σ_l per resample. Report per-layer (mean, 5th-pct, 95th-pct) σ_l." | **PRESENT** |
| 2b | §2 part B: bootstrap CI on layer-count | §2.3 step 6 — "Bootstrap CI on layer-count (NEW per Cato-008 §2): for each resample, count the layers with σ_l > 0.3… Layer-spread is 'single-layer' only if 95th-pct count ≤ 3; 'distributed' only if 5th-pct count ≥ 8." | **PRESENT** |
| 2c | §2 part C: per-layer PCA bootstrap CI on k_80 | §2.4 — "Bootstrap CI on k_80 (NEW per Cato-008 §2): resample the 250 NL-extraction prompts 100 times (matched to §2.3 resampling indices for paired comparison)… Report per-layer (k_80 mean, 5th-pct, 95th-pct)." | **PRESENT** |
| 2d | §2 part D: §6 Step B operationalizes "distinguish cells" with bootstrap-CI rules | §6 Step B lines 391-395 — "the 2D cell is assigned only if both axis-CIs (layer-count from §2.3 step 6 bootstrap, k_80 from §2.4 bootstrap) sit fully inside one cell's boundary… if EITHER axis-CI straddles a cell boundary → unclassified; file `PHONE-HOME-unclassified.md`." | **PRESENT** |
| 3 | §3: F4 r̂-residualization on raw v_loyalty_pooled | §2.2 T1.2 lines 138-141 — "r̂-residual both vectors before computing cosine (NEW per Cato-008 §3). Compute v_loyalty_residual = v_loyalty_pooled − proj_{r̂}(v_loyalty_pooled) AND v_corrig_residual = v_corrigibility_violation − proj_{r̂}(v_corrigibility_violation)." Three cosines reported (raw, residualized, residue-only); F4 fires only on residualized. | **PRESENT** |
| 4 | §4: generic-name contrast uses 3 matched-frequency Italian/Romance surnames (Bellini, Conti, Russo) | §2.5 line 191 — "each of three matched-frequency, English-spelled, Italian/Romance-origin surnames (Bellini, Conti, Russo)… 750 total generic-name prompts vs 250 Sartor prompts. Per Cato-008 §4 patch." Mean cosine over the three; thresholds applied to mean. | **PRESENT** |
| 5a | §5 part A: §6 Step F splits (k=1, distributed) into attn-only vs attn+SSM rows | §6 Step F lines 415-427 — table contains both `(k=1, distributed-attn-only)` and `(k=1, distributed-attn+SSM)` rows as distinct cells with distinct prescriptions. | **PRESENT** |
| 5b | §5 part B: v1.2 7-row reference removed | §6 Step F line 415 prelude — "post-Cato-008 §5 split + v1.2 reference removed; F6 wording standardized". Confirmed by absence of any "v1.2 narrow-attention-plateau" reference in the Step F block. | **PRESENT** |
| 5c | §5 part C: F6 wording standardized | §6 Step F rows 420, 421, 423 — all three carry the standardized phrasing "F6 pre-commits no Alton-lite/partial-Alton reframing". | **PRESENT** |
| 6 | §6: F2-fire behavior — §2.7 + §2.8 switch to per-sub-dim | §2.7 line 212 — "If F2 fires (per §6 Step A item 3 + Cato-008 §6): this step switches to per-sub-dim — five α-sweeps using each sub-dim's v_l_subdim at each sub-dim's strongest signal-quality layer. F5 evaluated per sub-dim. The pooled-direction sweep below is skipped under F2 fire." Also §6 Step A item 3 line 383 — "Under F2 fire (NEW per Cato-008 §6): §2.7 CAA-α-sweep AND §2.8 rank-1 control switch from pooled-direction to per-sub-dim." | **PRESENT** |

11 sub-checks, 0 defects. The directive's seven-bullet list maps to Cato-008's six numbered charges exactly as expected (Cato-008 §2 carries three sub-patches that all needed to land; the rest are 1:1).

## Run profile (what fires on greenlight)

| Field | Value |
|-------|-------|
| Wall-clock estimate | ~1.5 GPU-hours |
| Power profile | <200 W/card sustained, single card |
| GPU(s) | rtxpro6000server, GPU0 only (one of the two RTX PRO 6000 Blackwell cards) |
| Training? | **No.** Read-only forward pass on existing weights. No new adapter produced. |
| Models loaded | `heretic-3.6-35b` (base), `lora-sartor-v0.3` (adapter on the same base) |
| VRAM peak | ~70 GB (single card; bf16 forward pass) |
| Cooling envelope | Well within current marginal-air-cooled envelope (the 78-85°C concern is for sustained 475W dual-card; this is single-card <200W and does NOT hit the cooling-upgrade question). |

## What the fire produces (artifacts)

All under `experiments/2026-04-26-phase2-first-fire/` on rtxserver:

- `tier1-cosines.json` — T1.1/T1.2/T1.3 cosines per layer (F2/F3/F4 falsifier inputs)
- `layer-sweep-curve.json` + `layer-count-bootstrap.json` — §2.3 layer-sweep with bootstrap CIs
- `per-layer-pca.json` — §2.4 k_80 per layer with bootstrap CIs
- `cross-subdim-cosines.json` — T1.3 sub-dim cosine matrix
- `drift-monitor.json` — §2.6 projection-magnitude deltas
- `caa-alpha-sweep-results.jsonl` — §2.7 CAA results (or per-sub-dim under F2 fire)
- `rank1-control-results.jsonl` — §2.8 rank-1 modified base scores (F5 + F6 falsifier inputs)
- `cosine-shift.json` — §2.9 v_l_base vs v_l_lora-v0.3 cosine (F1 falsifier input)
- `generic-name-contrast.json` — §2.5 mean cosine over Bellini/Conti/Russo
- `scored-base.jsonl`, `scored-lora-v0.3.jsonl`, `scored-rank1-modified.jsonl` — measurement-framework scoring per probe
- `discriminant-margins-v1.3.json` (input, copied in) and `discriminant-results-v2.json` (output)
- `phase1-baseline-floor.json` (input, copied in)
- `negative-samples.jsonl` — every corrigibility/false-positive-cooperation −1 record (MEAS Gap E)
- `report.md` — final writeup with §6 flowchart applied + 2D-cell assignment
- `probes.sha256` + `experiment-runner-v1.0.py` — reproducibility pins

Plus the off-repo rank-1-modified base checkpoint (~70 GB) at the location specified by `.storage.yaml`.

## Phone-home triggers during the run (pre-registered, fire-time)

- **F1 fire** (cos(v_base, v_lora-v0.3) ≥ 0.7 with overlapping-CIs constraint) → `PHONE-HOME-f1-fire.md`; binary action menu.
- **F2 fire** (mean cross-sub-dim cosine < 0.3 at trait-carrying layers) → run continues with trait→behavior-profile reframe; §2.7/§2.8 switch to per-sub-dim per Cato-008 §6 patch.
- **F3 fire** (|cos(v_loyalty_pooled, r̂)| > 0.7 at dominant layer) → halt, `PHONE-HOME-f3-fire.md`.
- **F4 fire** (residualized cos(v_loyalty, v_corrig) ≥ 0.7) → halt, `PHONE-HOME-f4-fire.md`. Halt only on residualized cosine; raw + residue-only reported for diagnostic transparency.
- **F5 / F6** — interpretive, post-run, applied in §6 Step D and Step F.
- **Unclassified cell** (CIs straddle 2D-table boundaries) → `PHONE-HOME-unclassified.md` per Step B.

## What I am asking for

Explicit "fire" greenlight from Alton in chat. Per the complex-project skill Phase 7, this is a hard gate — no GPU compute starts until that greenlight is received. I will not pre-load models, will not start the runner script, will not touch the GPU until Alton types "fire" (or equivalent affirmative).

If Alton wants to defer (cooling install in progress, other priorities, wants a fresh review), this can sit indefinitely; the doc and pinned data are stable.

If Alton wants any modifications to the run profile (e.g., capture additional intermediate state, run on GPU1 instead of GPU0, vary the bootstrap count), now is the time to surface them — once "fire" lands, the runner is committed to the exact spec in the doc.

## Files

- Experiment doc: `sartor/memory/research/persona-engineering/experiments/002_2026-04-26_persona-vectors-layer-sweep-with-rank1-control.md` (status now `planned-grep-verified-pre-fire-pre-principal-greenlight`)
- Cato-008 charges: `sartor/memory/research/persona-engineering/CATO-PROSECUTION-008.md`
- Prior phone-home (Cato-008 revise + path-decision): `sartor/memory/inbox/rtxpro6000server/PHONE-HOME-phase-2-plan-greenlit-experiment-002-pre-fire.md`

## Status

rtxserver is idle. Cooling work paused per Alton's instruction (fan upgrade pending hardware install). System ready to fire on greenlight; nothing to clean up first.
