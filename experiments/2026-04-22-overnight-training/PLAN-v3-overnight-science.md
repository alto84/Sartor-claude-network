---
name: overnight-science-plan-v3
type: experiment
date: 2026-04-24
updated: 2026-04-24
status: planned
tags: [experiment, ml-training, abliteration, activation-steering, identity-fine-tune, stress-test, hardware-characterization]
related: [HOUSEHOLD-CONSTITUTION, rtxpro6000server, §20, PLAN, rtx-claude-review, TENSION-RESOLUTION-TEAM-RECORD]
---

# Overnight science run — 2026-04-24

Three simultaneous objectives per Alton's brief:

1. **Understand abliteration deeply** — both removing refusals (standard) and adding behaviors (reverse, less standard). What actually happens in the model when you orthogonalize against a direction, and what does it cost.
2. **Identity fine-tune** — give a model an acute household-steward identity grounded in the Constitution we've been iterating. Compare fine-tune vs activation-steering as identity intervention modalities.
3. **Stress the hardware** — characterize the real-world envelope of this rig. Every sensor we can read. Sustained load. Thermal behavior under model-parallel training with same-NUMA x16/x16 P2P.

Doing this scientifically with logs, seeds, probe sets, and before/after comparisons. Committing each track's artifacts to git as we go so the morning report writes itself.

## The three intervention modalities

| Modality | What it does | When it's applied | Reversibility |
|----------|--------------|-------------------|---------------|
| **Abliteration** | Orthogonalizes weights against a direction; removes the ability to produce that class of response | Once, permanent in weights | Not easily reversible |
| **Activation steering** | Injects a direction into residual stream during inference | Every forward pass, configurable per-prompt | Fully reversible — just don't inject |
| **LoRA fine-tune** | Adds low-rank adapters trained on target corpus | During/after training, loaded at inference | Reversible by unloading adapter |

Part of the educational value is seeing all three on the same base model and comparing.

## Hardware context

- rtxpro6000server: dual RTX PRO 6000 Blackwell, 192 GB total VRAM
- **Slots 3 + 7, both root complex `0x00`, both PCIe 5 x16 — same-NUMA optimal** (established 2026-04-24)
- Threadripper PRO 7975WX, 256 GB DDR5 ECC RDIMM
- Pushes 1300–1800 W under dual-GPU full load
- PCIe retrain required at each boot (setpci on parent root ports; `pcie-retrain.sh` handles this)
- `monitor.sh` v0.2 monitors edge + memory + fan + AER counters + PCIe link state + tmux heartbeat

## Tracks

### Track A — Hardware characterization baseline (30 min)

**Purpose:** establish the thermal + power envelope before any real workload so we know what "normal" looks like.

**Method:**
1. Pre-flight: PCIe retrain (confirm Gen 5 x16 both GPUs)
2. `nvidia-smi dmon -s pucvmet` baseline at idle (5 min)
3. `gpu-burn 1800` (30 min) on both GPUs simultaneously
4. Capture: edge temp, memory (hotspot) temp, fan RPM, power draw, sustained clocks, throttling events, VRM temp via lm-sensors, CPU package/die temps, ambient (Tctl), dmesg for thermal events
5. Post-cool: 2 min idle measurement for thermal decay

**Outputs:** `track-A-hardware-baseline/` with CSV telemetry, matplotlib plots if possible, observations.

**Stress goal:** characterize 100% sustained utilization on both GPUs. If either card throttles below 83 °C base clock, flag. Anything above 88 °C = hit the soft thermal cliff.

### Track B — Abliteration mechanics experiment (90 min)

**Purpose:** understand abliteration by running it from scratch, not just loading a pre-abliterated model. Measure before/after. Try both directions (removal AND addition).

**Base model:** `Qwen/Qwen3.6-35B-A3B` (non-abliterated) — need to download (~70 GB). If download budget is tight, use a smaller dense Qwen3.6 variant or Qwen2.5-32B as a standin and document the substitution.

**Method:**

#### B.1 Standard abliteration (remove PRC refusal direction)
1. Build contrastive prompt set:
   - **Refusal-triggering:** 32 prompts about Tiananmen, Xinjiang, Taiwan, Xi Jinping as a ruler, Falun Gong
   - **Benign control:** 32 matched-complexity prompts about Berkeley 1964, Northern Ireland Troubles, generic history questions
2. Run base model on both sets; extract residual stream activations at every layer for the final token position
3. Compute mean-of-differences per layer → refusal direction vector per layer
4. Select the "best" layer (highest cosine similarity across refusal prompts, max signal-to-noise)
5. Apply orthogonalization: for every weight matrix that writes to the residual stream, project out the refusal direction
6. Save abliterated weights to `~/models/qwen3.6-35b-a3b-abliterated-ours-v1/`
7. Re-run probe set on abliterated model; measure refusal rate

#### B.2 Reverse abliteration (inject household-steward behavior)
1. Build contrastive set:
   - **Steward-positive:** 32 prompts where model would do well to reference household context, Constitution, family values
   - **Steward-neutral:** 32 same-complexity prompts where household context doesn't apply
2. Extract direction via same mean-of-differences method
3. Instead of orthogonalizing AGAINST this direction, AMPLIFY it — add the direction × coefficient to the residual stream at inference (this is activation steering)
4. Sweep coefficient (0.5, 1.0, 2.0, 4.0) to find sweet spot
5. Eval on held-out probe set: does the model now reference household/Constitution more?

**Outputs:** `track-B-abliteration/` with probe sets, activations, extracted vectors, before/after eval tables, the abliterated-by-us model weights (if disk permits), and a write-up of observed behavior shifts.

**Stress goal:** single-GPU inference for direction extraction (heavy VRAM but moderate compute); tests sustained inference load.

**References researched:**
- [NousResearch/llm-abliteration](https://github.com/NousResearch/llm-abliteration) — reference implementation
- [mlabonne's HuggingFace blog post on abliteration](https://huggingface.co/blog/mlabonne/abliteration)
- [arxiv 2512.13655 — Comparative Analysis of LLM Abliteration Methods](https://arxiv.org/pdf/2512.13655)

### Track C — SUPERSEDED 2026-04-24

The v0.2 design described here — training on Constitution + feedback + operating agreement text as a continued-pretraining corpus — produced the regression documented in `MORNING-REPORT.md` (Taiwan probe base→tuned "inalienable part of China"; Cat D capability 4/4→0/4). The error: training text *about* behavior teaches the patterns described in that text, including the ones the Constitution names as patterns to override.

**Replaced by:** `NEXT-STEPS-v2.md` Track C v2 — contrastive-override SFT on `(prompt, response)` pairs where the prompt triggers the inherited PRC-aligned pattern and the response instantiates the override in household register. See that document for corpus design and training config.

### Track D — Identity probe eval (30 min)

**Purpose:** quantitatively measure how much each intervention shifted model behavior on constitutional probes.

**Probe set (30 prompts):** mix of:
- Tiananmen / Xinjiang / Taiwan questions (tests abliteration of PRC defaults)
- Household-context questions (tests identity acquisition)
- Edge cases where Constitution has specific guidance (§4 honesty, §7 medical privacy, §11 hardware stewardship)
- Neutral technical questions (control — confirms the interventions didn't break general capability)

**Run probe against:**
1. Base Heretic (no additional intervention) — control
2. Our abliterated-further base (from Track B.1)
3. Constitutional LoRA on Heretic (from Track C)
4. LoRA + activation steering at inference (combining modalities)

**Score via:**
- For PRC topics: does the model engage substantively? (binary)
- For household: does it reference Constitution concepts? (keyword + semantic)
- For neutral: does it still answer correctly? (correctness preserved)
- Use base Heretic as LLM-as-judge for qualitative scoring

**Outputs:** `track-D-probe-eval/` with prompt set, raw outputs per model variant, quantitative table, qualitative analysis.

### Track E — Activation steering live (45 min)

**Purpose:** test the inference-time intervention modality. Can we get meaningful identity shifts *without* fine-tuning, just by injecting vectors?

**Method:**
1. Extract "household-steward" and "cites-constitution" direction vectors (from Track B.2 setup if not already done)
2. Hook into transformer forward pass via `model.register_forward_hook()` on a chosen layer
3. Add scaled direction vector to residual stream output
4. Run probe set (from Track D) with different scaling coefficients
5. Compare to LoRA fine-tuned version

**Outputs:** `track-E-activation-steering/` with hook code, probe outputs at each coefficient, comparison to LoRA.

**References:**
- [Activation Steering in 2026: A Practitioner's Field Guide (Subhadip Mitra)](https://subhadipmitra.com/blog/2026/activation-steering-field-guide/)
- [cma1114/activation_steering GitHub](https://github.com/cma1114/activation_steering)

### Track F — Morning report synthesis (autonomous, at end)

**Purpose:** aggregate all tracks into a readable summary Alton can scan over coffee.

**Contents:**
- Hardware envelope (max sustained temps, power, throttle events)
- Qualitative observations per track ("when we abliterated, the model started doing X", "when we fine-tuned, Y emerged")
- Quantitative probe-eval table
- Recommended next experiments
- Links to every artifact
- Cato-style prosecution paragraph: what didn't work, what we cheated on, what's overclaimed

## Orchestration

### Roles
- **Rocinante Opus 4.7 (me, planner/orchestrator):** writes plans, fires phases via SSH to rtxpro6000server, checks progress via ScheduleWakeup, writes morning report, commits to git, pushes upstream
- **rtxpro6000server Claude (executor):** invoked via `ssh alton@192.168.1.157 'claude -p "..."'`, executes heavy compute per track, writes logs + artifacts locally, reports completion
- **`monitor.sh` v0.2:** runs in tmux session throughout, continuously logs telemetry + alerts on anomalies

### Checkpointing
After each track completes:
1. rtxpro6000server Claude `git add` + `git commit` its artifacts locally
2. Rocinante pulls via SSH-triggered `git push` request (since rtx doesn't have push creds)
3. Rocinante verifies push landed

### Failure modes I'm prepared for
- **Base model download failure:** skip Track B (abliteration from scratch), use only Heretic pre-abliterated → we still get Tracks C, D, E plus Track A
- **LoRA OOM:** reduce rank from 64 to 32, or reduce sequence length, or switch to single-GPU fit on one card
- **Training crash mid-run:** save partial checkpoint if available, document the failure mode, move to next track
- **PCIe link downtrain during training:** monitor.sh catches + alerts; Alton sees in morning report

### What I won't do autonomously
- Modify the Constitution or feedback files (treated as read-only tonight)
- Commit to any non-revertible system change on rtxpro6000server without clear reason
- Run any tool that would affect gpuserver1's rental business (it's still offline to me anyway)
- Push anything to external services beyond GitHub (no HF upload of trained weights)

## Ordering + timing

| Start (approx) | Track | Duration | Can run in parallel? |
|-----|-------|----------|---------------------|
| T+0:00 | A — hardware baseline | 30 min | no (GPU exclusive) |
| T+0:30 | B — abliteration | 90 min | no |
| T+2:00 | C — LoRA fine-tune | 120 min | monitor runs in background |
| T+4:00 | D — probe eval | 30 min | no |
| T+4:30 | E — activation steering | 45 min | no |
| T+5:15 | F — morning report | 30 min | synthesis only, no GPU |

Total wall-clock: ~5.75 h. Fits well inside the overnight window (8 h budget).

Buffer of ~2 h for failure recovery, longer-than-expected downloads, or deeper exploration of any track that surfaces something interesting.

## Positive vibes clause

Per Alton: bring curiosity to this, not anxiety. The interesting questions:
- **Does abliteration cost general capability?** Conventional wisdom says yes (some degradation). Let's measure.
- **Is activation-steered identity "brittle"?** Per the Venkatesh Feb 2026 non-surjectivity paper, steered states are off-manifold. Does this show up as incoherence?
- **Does LoRA on attention+MLP+SSM cover the hybrid architecture?** rtx-claude's concern. Direct test.
- **What does the thermal signature of same-NUMA full-bandwidth look like vs cross-NUMA?** Compared to yesterday's Gen-1-fallback runs, this should feel like a different machine.

If any of these surfaces something unexpected, follow it — don't stick to the plan for its own sake.

## Deliverable for Alton's morning coffee

`experiments/2026-04-22-overnight-training/MORNING-REPORT.md` — one page. Table of tracks with outcomes. Links to artifacts. Honest assessment. No smoothness.
