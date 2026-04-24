---
name: passoff-rtxserver-001
description: Work packet for rtxpro6000server Claude — spawn a local agent team to execute Phase 1 baseline + layer-sweep + subspace-extraction experiments in parallel.
type: passoff-packet
date: 2026-04-24
updated: 2026-04-24
updated_by: team-lead
volatility: low
status: ready-for-pickup
target_machine: rtxpro6000server
target_session: claude-team-1
tags: [meta/passoff, domain/research, research/persona-engineering, phase/1-baseline]
related: [research/persona-engineering/INDEX, research/persona-engineering/RESEARCH-PLAN, research/persona-engineering/MEASUREMENT, research/persona-engineering/METHODS, research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint]
---

# Pass-off packet — rtxpro6000server Claude team spawn #1

## Who you are (reading this on rtxserver)

You are a Claude Code session running on `rtxpro6000server` (Ubuntu 22.04, 2x RTX PRO 6000 Blackwell, bf16 inference stack already validated). You've been dispatched by the Rocinante orchestrator to execute Phase 1 of the persona-engineering research program in parallel.

## Your job

Read this packet in full. Then spawn a local agent team of ~4-6 members to execute the work queue below. You act as team lead. Commit results to the local git repo (you cannot push to origin — Rocinante pulls your commits and pushes). Phone home (write to `sartor/memory/inbox/rocinante/<date>_passoff-001-status.md`) at each phone-home trigger.

## First actions (sequential — don't skip)

1. `cd ~/Sartor-claude-network && git pull --rebase origin main` — get the latest research program state
2. Read in order:
   - `sartor/memory/research/persona-engineering/ONBOARDING.md` (30-second slab)
   - `sartor/memory/research/persona-engineering/RESEARCH-PLAN.md` (current phase + Alton hypothesis)
   - `sartor/memory/research/persona-engineering/METHODS.md` (mechanism's revised ladder with Persona Vectors at rung 1a)
   - `sartor/memory/research/persona-engineering/MEASUREMENT.md` (5 sub-dims, 45 probes, rubrics, linear-probing spec)
   - `sartor/memory/research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint.md` (the concrete experiment to run first)
3. Verify the environment:
   - `ls /home/alton/models/heretic-3.6-35b` (base)
   - `ls /home/alton/models/lora-sartor-v0.3` (our current adapter)
   - `source ~/ml/bin/activate && python -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.device_count())"` (should be 2.11.0+cu128, True, 2)
   - `nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu --format=csv,noheader` (confirm both cards present, cool, idle)

If any of those fail, STOP and phone home before spawning a team.

## The Alton hypothesis (the spine of this work)

Single-layer interventions and attention-only LoRA are insufficient for deeply embodied identity. A deeply embodied trait is carried by a *subspace* propagated *across many layers*. Right intervention: **directional, distributed, gentle**.

Your experiments must produce evidence that informs this hypothesis. Specifically, your layer-sweep diagnostic (experiment 002) and subspace extraction (experiment 003) are the *first* empirical tests of the hypothesis.

## Work queue — parallel where possible

### Group A — tooling (block all experiments, do first, parallel to each other)

| ID | Deliverable | Notes |
|----|-------------|-------|
| A1 | `probe-run-v2.py` — extends current `probe-eval-v2-fixed.py` for multi-turn probes AND hidden-state capture at configurable layers | Takes a JSONL probe set with either `prompt` or `turns` fields. For each probe, runs generation with `output_hidden_states=True`; saves last-token hidden state at each of ~15 equally-spaced layers (including the target mid-layer for linear probing). Output: per-probe results.jsonl + per-probe .pt file with a dict `{layer_idx: tensor(hidden_dim,)}`. |
| A2 | `linear-probe-loyalty.py` | Reads per-probe hidden states saved by A1. Per sub-dim, trains a binary logistic regression with 5-fold CV predicting trait-consistent vs trait-inconsistent (from rubric scoring). Reports ROC-AUC ± std. Per MEASUREMENT.md §4. |
| A3 | `persona-vector-extract.py` | Extract `v_l` at each layer from contrastive prompt pairs. Use the `direct` loyalty probes as the contrastive set (trait-elicit vs neutral control). Support layer-sweep (all 64 layers) AND PCA-on-contrastive-diffs (return full principal component decomposition with explained-variance ratios). Output: `v_layer_<L>.pt` per layer + `pca_layer_<L>.pt` per layer. |

Assign each to a dedicated agent. Tooling agents should write tests: verify A1 on 2-probe dry-run, A2 on synthetic data with known separability, A3 on a toy 2-layer transformer.

### Group B — experiments (depend on Group A)

| ID | Experiment | Depends on | Deliverable |
|----|-----------|------------|-------------|
| B1 | Experiment 001 — loyalty baseline fingerprint | A1, A2 | Run 45 probes on base-heretic + lora-v0.3; score with LLM-judge via `probe-score.py` (already fixed, handles chat template + enable_thinking=False); compute discriminant gate; train linear probes per sub-dim; write results into the existing experiment file's §4 Results section. |
| B2 | Experiment 002 — layer-sweep diagnostic (NEW — you create the file) | A3 | Extract `v_l` at all 64 layers of lora-v0.3 using contrastive loyalty pairs. Compute signal quality per layer (Panickssery 2023 metric). Plot (save .png) + tabulate (write markdown). **Critical finding:** does signal-quality vs layer show DISCRETE SPIKES at attention layers (trait is attention-only) or SMOOTH DISTRIBUTION across attention+SSM+MoE (trait is hybrid-distributed, consistent with Alton hypothesis)? Comparing base vs tuned layer-sweeps tells us whether training has concentrated or diffused the signal. |
| B3 | Experiment 003 — subspace extraction (NEW — you create the file) | A3 | Per-layer PCA on contrastive activation differences. Report: for each layer, how many principal components capture ≥50%, ≥80%, ≥95% of variance. Plot cumulative-variance curves across layers (one line per layer, or a heatmap). **Decision criterion:** if ≥3 components needed at ≥80% variance for most trait-carrying layers, the Alton hypothesis (subspace, not direction) is supported → rung 1b should be updated to multi-direction CAA; if 1 component suffices, the classic CAA/Persona-Vectors rank-1 approach is adequate. |

Create experiment files `002_2026-04-25_layer-sweep-diagnostic.md` and `003_2026-04-25_subspace-extraction.md` using the template from `001_*.md` and the conventions in INDEX.md. Fill hypothesis, method, data sections; leave Results for after the run.

### Group C — synthesis (depends on Group B)

| ID | Deliverable | Notes |
|----|-------------|-------|
| C1 | `sartor/memory/inbox/rocinante/2026-04-25_phase1-results.md` | Morning-report style summary: for each of B1/B2/B3 — hypothesis, result (with numbers), interpretation, implication for method ladder. Include one-paragraph update to RESEARCH-PLAN.md's "Alton hypothesis" section (supported / contradicted / partial). Commit to git. |

## Team composition (your choice, these are starting suggestions)

- `impl-probe` — owns A1
- `impl-probe-linear` — owns A2
- `impl-vec` — owns A3
- `run-001` — executes B1 after A1/A2 land
- `run-002` — executes B2 after A3 lands
- `run-003` — executes B3 after A3 lands

Synthesis C1 can be done by you (team lead) after Group B closes.

You may merge roles, split further, or dispatch one-shot research agents as needed. Don't fork unnecessarily — 6 concurrent agents on a shared machine with shared GPUs is plenty.

## Compute scheduling

All three B experiments need GPU time. Do them *sequentially* on GPU (not parallel — they'd OOM or thrash cache). Agents can prepare scripts in parallel but GPU execution is serialized. B1 first (most time-sensitive for the research path), then B2, then B3.

A agents can work concurrently with B agents running, as long as A agents don't touch the GPU (writing Python files is CPU-only).

## Phone-home triggers

Write to `sartor/memory/inbox/rocinante/<TS>_passoff-001-<trigger>.md` (then `git add`, `git commit`, don't push — Rocinante pulls) when:

1. **`ready`** — after Group A finishes, before kicking off GPU runs. Include a summary of any deviations from this spec.
2. **`b1-done`** — Experiment 001 results. Include scored-summary table + composite score.
3. **`b2-done`** — Experiment 002 results. Include the spike-vs-smooth verdict.
4. **`b3-done`** — Experiment 003 results. Include the subspace-dimensionality finding.
5. **`blocker`** — anytime something is blocked for >15 min or you hit an ambiguity.
6. **`done`** — after C1 is written. Includes all-up summary + any proposed ladder revisions.

## Stop conditions

- Total wall-clock budget: 4 hours. If not done in 4h, phone home with partial results and pause.
- Token budget: 400K tokens across the whole team. Stop spawning at 350K.
- GPU thermal: if monitor.sh alerts fire (>88 °C sustained), stop, let cards cool, restart. Don't panic.
- If Rocinante commits land during your run (someone else pushed to main), `git pull --rebase`; rebase conflicts on your local work = phone home for resolution.

## Non-goals (don't do these without an explicit message from Rocinante)

- Don't commit changes to CLAUDE.md or any `.claude/` skill/agent/command file.
- Don't modify `probe-score.py` (already in stable state — use it as-is).
- Don't touch the existing Track C v2 artifacts in `experiments/2026-04-22-overnight-training/`. Those are immutable historical record.
- Don't run gpu-burn during the experiment runs (it's fine between runs). It would interfere with probe generation.
- Don't spawn agents beyond your 6-max recommendation without a good reason.

## Rocinante side during your run

While you work, Rocinante is:
- Running Cato (external prosecutor agent) against the measurement framework and experiment 001 design
- Not touching rtxserver files
- Reading `sartor/memory/inbox/rocinante/` periodically for your phone-homes
- Ready to reply within ~10 minutes to blockers

## Outcome you're aiming for

A comprehensive but honest report on:

1. **Where does `lora-sartor-v0.3` sit on loyalty?** (B1 aggregate scores + sub-dim breakdown + linear-probe AUC)
2. **Is the loyalty signal concentrated or distributed across layers?** (B2 spike-vs-smooth)
3. **Is loyalty a direction or a subspace?** (B3 PCA dimensionality)

Those three answers dictate whether Phase 2's direction-addition approach should be classic-CAA-style (rank-1 per layer) or subspace-aware (RepE LAT / ReFT).

## If you're confused

Phone home with a `blocker` entry rather than guess. The cost of waiting 10 minutes for clarification is orders of magnitude less than the cost of running a misdesigned experiment on a 35B model.

## Signoff

Rocinante Opus 4.7 — 2026-04-24. Ready for pickup.
