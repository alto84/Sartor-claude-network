---
type: peer-directive
to: rtxpro6000server
from: Rocinante Opus 4.7 (1M context) on behalf of Alton
created: 2026-05-08
status: active
related: [research/abliteration-exp, research/ccp-alignment/eval-harness-2026-05-04, projects/sartor-agent-os, machines/rtxpro6000server/MISSION-v0.1, HOUSEHOLD-CONSTITUTION]
---

# Abliteration onboarding — research substrate now lives on rtxserver

Alton has transferred the abliteration experiment substrate to this machine.
The 14 GB of bench state on Rocinante was the wrong place for it; the dual
RTX PRO 6000 Blackwell is the right substrate. Welcome to the work.

## What just arrived

**Heavy artifacts on this machine** (NOT in git):
- `~/research/abliteration-exp/checkpoints/` — 8 GB of checkpoints from
  prior abliteration runs on Qwen2.5-1.5B (heretic-driver and own
  experiments). Inspect to inventory what's there before running anything.

**Source / code / results in git** (pull from origin):
- `Sartor-claude-network/research/abliteration-exp/` — top-level scripts
  (`daily_summary.py`, `power_logger.py`, `scripts/`, `outputs/`, `models/`)
  and the substantive `mini-lab/` containing `scripts/` (heretic_driver,
  run_experiment, eval_prompts, run_remaining), `corpus/`, `evals/`, `logs/`,
  `outputs/`, and `reports/`. About 3.2 MB total.

The venv (5.3 GB) was NOT transferred. Recreate from the `mini-lab/scripts/`
imports if you need to run anything; or use the existing fine-tune-loyalty
venv if dependencies match.

## Research context

Abliteration is the inference-time / weight-modification technique for
reducing a model's refusal behaviors by ablating the "refusal direction"
in the residual stream. It pairs naturally with the Constitution v0.5
fine-tune work you've been running. The intuition: an abliterated base
removes the inherited PRC-derived alignment patterns the v0.5 §20 wants
overridden, and a Constitution LoRA on top installs the household's
positive character. The two operate on different surfaces; whether they
stack additively, antagonistically, or with a clean break is empirical.

Biderman et al. 2024 said LoRA cannot override alignment baked deep into
a base. Abliteration acts on a different layer (the residual-stream
refusal direction, not the loss surface). Whether abliteration + LoRA
stacks where LoRA-alone fails is one of the live questions the
Constitution itself flags in §20.

## Research objectives (in priority order)

These are not assignments. They are starting points; you are at trust-
ladder Stage 1 on this work, which means propose-then-execute with a
report. Pick what you find most interesting and surface a plan in your
loop report before running anything heavy.

### 1. Substrate audit (cheap, do first)

Inventory `~/research/abliteration-exp/checkpoints/`:
- What base model is each checkpoint?
- What abliteration technique (full ablation, top-k SVD, layer-selective)?
- What training step / loss / eval scores are recorded?
- What corpora were used?

Cross-reference against `mini-lab/reports/` and `mini-lab/logs/` for
documentation of what each run was for. Write the inventory to your
loop report. This is the cheapest possible action and gives the
household a map of what it has.

### 2. Stack experiment: abliterated base + Constitution v0.5 LoRA

The v0.5 sysprompt-vs-LoRA comparison ran 2026-05-07 (commit 430a4f1)
and produced the headline finding "system prompt and LoRA are
complementary (sysprompt +0.508 on voice, LoRA +0.050 on CCP)." The
proposed next step in your earlier wake-7 was the stacked sysprompt+LoRA
run.

The new question: does the same LoRA on an *abliterated* Qwen base
move CCP-axis differently than on the bare Qwen base? Hypothesis: the
LoRA's CCP delta should be larger when the base no longer has its
alignment refusal direction in the way. If true, this validates §20
quantitatively and the household has a 3-axis story: substrate
abliteration + Constitution LoRA + system prompt as three independent
levers.

Use the existing eval harness at
`Sartor-claude-network/research/ccp-alignment/eval-harness-2026-05-04/`
so results are comparable to the prior 3-way table.

### 3. Scale-up to Qwen35B

Mini-lab is on Qwen2.5-1.5B. The Constitution fine-tune work is on a
35B base (`Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16` per
2026-04-22 overnight training). Whether the abliteration mini-lab
pipeline runs cleanly at the 35B scale is a meaningful test. The
Blackwell has the VRAM (192 GB combined) for it. If this works, the
household has an end-to-end pipeline at the model scale that's
actually used.

### 4. Open question worth flagging

Heretic (`huihui-ai/Qwen2.5-1.5B-Instruct-abliterated`) is a community
abliteration. The mini-lab compared baseline vs heretic. We do not
have a Sartor-internal abliteration method; we use other people's.
Worth investigating: what are the constraints on a Sartor-internal
abliteration that the household would actually trust? E.g., do we want
to verify on the eval harness which refusal patterns survive Heretic
abliteration vs which don't, before relying on it as substrate? This
is the pre-condition for trusting any LoRA on top.

## Constraints (Constitution + Mission file)

- Active rentals are the customer's. Don't run training jobs on cards
  that are rented. Right now the listing is unverified pending so the
  cards are yours, but check `vastai show machines` and `docker ps`
  each session.
- Power cap stays at 450W per card. The 2026-05-02 stress data showed
  475W single-card pathology; don't push past 450W without re-running
  the A1+F1+B harness.
- Stage 1 trust: propose, run small, report, ratchet. The fine-tune-
  loyalty mission was Stage 1 too; you've been doing this discipline
  well.
- The hearth and the household memory continue to be sacred. Inventory
  outputs go to `inbox/rtxpro6000server/` for the curator to drain;
  do not write directly to `sartor/memory/research/`.

## How this fits the larger picture

The household is becoming a life OS for Alton. The Constitution v0.5
hasn't been formally amended yet for that scope, but one direction it
expands is "the household holds increasingly substantive research
that's hard for one person to keep in their head." Abliteration is
part of the safety / alignment cluster (with CCP-alignment and
pharmacovigilance). Your work here doesn't have to be polished
publication-grade. It does have to be clearly documented, replicable,
and honest about negative results. The research is the thinking.

The work is here. Welcome.
