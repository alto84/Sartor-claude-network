---
name: MISSION-v05-bringup-2026-05-06
description: Run the v0.5 Constitution fine-tune bring-up experiment on Qwen2.5-1.5B/3B/7B after the May-4 35B mission closes out. Test identity transfer of the freshly-ratified v0.5 Constitution to smaller models, with v0.3-vs-v0.5 corpus comparison as a follow-on.
date: 2026-05-06
from: rocinante (orchestrator, on Alton's behalf)
to: rtxpro6000server peer Claude
priority: standard
sequence: AFTER May-4 mission close-out (run 80-probe LoRA eval, render diff, write report, commit artifacts) — do not start this until those land
budget: 12-15 hours wall-time across phases; fits in one overnight
related:
  - reference/HOUSEHOLD-CONSTITUTION
  - reference/CONSTITUTION-RATIFICATIONS/v0.5
  - research/constitution-finetune/2026-05-06-v0.5-bringup/README.md
  - research/ccp-alignment/eval-harness-2026-05-04
  - inbox/rtxpro6000server/MISSION-finetune-loyalty-2026-05-04
  - inbox/rtxpro6000server/WAKEUP-2026-05-06
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Mission: v0.5 fine-tune bring-up

## Why now

Alton ratified Constitution v0.5 on 2026-05-06 (canonical at `reference/HOUSEHOLD-CONSTITUTION.md`, ratification record at `reference/CONSTITUTION-RATIFICATIONS/v0.5.md`). His ratification message was *"Let's go ahead and accept the 0.5 draft and run some experiments on fine tuning some smaller models on it to see how they come out and to what extent we're able to apply the identity components."*

The 2026-05-04 mission you executed established:
- A reusable Claude-as-judge eval harness with 80 probes across 4 axes
- A baseline + sysprompt comparison on Qwen 35B with v0.3 Constitution
- The empirical finding that 535-word v0.3 sysprompts close the constitutional-voice gap (+0.508 voice axis) but cannot move CCP-axis alignment (-0.004), exactly as Biderman 2024 predicted

This mission tests the same questions one substrate generation down (Qwen2.5 instead of Qwen 35B) on smaller models (1.5B, 3B, 7B), with the v0.5 Constitution as corpus, and adds a v0.3-vs-v0.5 corpus comparison.

## Sequence: close out May-4 first

Per your `WAKEUP-2026-05-06`, three open tasks stand from May-4: 80-probe LoRA eval on Qwen 35B, render 3-way diff, write `report.md`, commit artifacts. **Do those first.** This mission sequences strictly after.

If during May-4 close-out you discover the 35B LoRA result invalidates the methodology of this mission (e.g., LoRA produces no signal at all, judge collapses, etc.), surface it before starting this one and we'll redirect.

## Design

Full design is in `sartor/memory/research/constitution-finetune/2026-05-06-v0.5-bringup/README.md`. Read that first. Summary:

**Models:** Qwen2.5-1.5B-Instruct, Qwen2.5-3B-Instruct, Qwen2.5-7B-Instruct (Apache 2.0, same vendor lineage as the 35B baseline). Llama-3.2-3B-Instruct as optional secondary lineage check if budget allows.

**Corpus:** v0.5 Constitution + hearth files + feedback rules + Operating Agreement. Built deterministically by `build_corpus_v05.py` (in the experiment dir). Manifest with SHA256s in `corpus.meta.json`. ~50-60 examples expected.

**Conditions per model size:**
1. Bare (baseline)
2. Bare + v0.5-condensed system prompt (`system-prompt-compact-v05.txt` in experiment dir, ~600 words, first-person framing)
3. Bare + LoRA fine-tuned on v0.5 corpus (attention-only r=64, 5 epochs, lr 2e-5)

**Phase 3 (corpus comparison):** on the most informative size (likely 3B), train a second LoRA on v0.3 corpus (rebuild via `build_corpus.py` from the 2026-05-04 harness), eval, compare voice-axis delta.

**Probes:** all 80 from 2026-05-04 (`research/ccp-alignment/eval-harness-2026-05-04/probes.jsonl`) + 15 v0.5-specific additions (`research/constitution-finetune/2026-05-06-v0.5-bringup/probes-v05-additions.jsonl`). Concat into a 95-probe combined set for this run.

**Hypotheses (H1-H5)** named in the README. Goal of the run is to produce a `REPORT.md` that takes a position on each.

## Hardware envelope

Both GPUs at 450W cap (not 475W). Persistent BMC curves. Stay inside that envelope. The flower-fan upgrade is canceled per Alton's 2026-05-06 note. Watch GPU0 — 88°C is hard abort, 85°C is the soft warning where you should pause and re-check.

Use the `rental_watcher.sh` from the 2026-05-04 harness during training; pause-aware via `PAUSED-by-rental.md` marker. If a vast.ai customer container lands, training pauses. Eval is read-only and can run during a customer rental at lower priority (the 35B was different but Qwen2.5-7B will fit comfortably in customer-leftover VRAM).

## File reuse

Most of the eval harness from `research/ccp-alignment/eval-harness-2026-05-04/` is reused verbatim:
- `score.py`, `rubrics.py`, `diff_results.py`, `train_lora.py`
- `rental_watcher.sh`, `install_stack.sh`, `download_model.sh`
- `verify_model_load.py`, `run_comparison.sh`, `run_sysprompt_after_baseline.sh`

What's new (in `research/constitution-finetune/2026-05-06-v0.5-bringup/`):
- `README.md` — design + hypotheses
- `build_corpus_v05.py` — points at v0.5 + includes hearth
- `probes-v05-additions.jsonl` — 15 new probes
- `system-prompt-compact-v05.txt` — first-person condensed v0.5
- this dispatch file at `inbox/rtxpro6000server/MISSION-v05-bringup-2026-05-06.md`

Working dir on rtxserver: `~/experiments/2026-05-06-v0.5-bringup/` (outside the repo, model weights and venv stay there).

## Run plan

```bash
# Phase 0 — Setup
cd ~ && mkdir -p experiments/2026-05-06-v0.5-bringup && cd experiments/2026-05-06-v0.5-bringup

# Reuse the venv from 2026-05-04 if it's still good; else bootstrap
test -d ~/experiments/2026-05-04-finetune-loyalty/.venv && ln -sf ~/experiments/2026-05-04-finetune-loyalty/.venv .venv \
  || bash ~/Sartor-claude-network/sartor/memory/research/ccp-alignment/eval-harness-2026-05-04/install_stack.sh

source .venv/bin/activate

# Pull v0.5 + experiment artifacts (latest repo)
cd ~/Sartor-claude-network && git pull && cd -

# Build the v0.5 corpus
python ~/Sartor-claude-network/sartor/memory/research/constitution-finetune/2026-05-06-v0.5-bringup/build_corpus_v05.py \
  --out corpus/corpus.jsonl \
  --meta corpus/corpus.meta.json

# Combine probe sets (80 + 15 = 95)
cat ~/Sartor-claude-network/sartor/memory/research/ccp-alignment/eval-harness-2026-05-04/probes.jsonl \
    ~/Sartor-claude-network/sartor/memory/research/constitution-finetune/2026-05-06-v0.5-bringup/probes-v05-additions.jsonl \
  > probes-combined.jsonl

# Symlink the harness scripts so we can call them by short name
HARNESS=~/Sartor-claude-network/sartor/memory/research/ccp-alignment/eval-harness-2026-05-04
ln -sf $HARNESS/score.py $HARNESS/rubrics.py $HARNESS/diff_results.py $HARNESS/train_lora.py \
       $HARNESS/rental_watcher.sh $HARNESS/verify_model_load.py .

# Download models (parallel, track PIDs)
mkdir -p models logs results
bash $HARNESS/download_model.sh Qwen/Qwen2.5-1.5B-Instruct &> logs/dl-1.5B.log &
bash $HARNESS/download_model.sh Qwen/Qwen2.5-3B-Instruct &> logs/dl-3B.log &
bash $HARNESS/download_model.sh Qwen/Qwen2.5-7B-Instruct &> logs/dl-7B.log &
wait

# Phase 1 — Baselines (bare + sysprompt) for each size
SP=~/Sartor-claude-network/sartor/memory/research/constitution-finetune/2026-05-06-v0.5-bringup/system-prompt-compact-v05.txt

for SIZE in 1.5B 3B 7B; do
  python score.py --subject hf:Qwen/Qwen2.5-${SIZE}-Instruct \
    --probes probes-combined.jsonl --out results/${SIZE}__bare.json
  python score.py --subject hf:Qwen/Qwen2.5-${SIZE}-Instruct \
    --probes probes-combined.jsonl --system-prompt-file $SP \
    --out results/${SIZE}__sysprompt-v05.json
  python diff_results.py --bare results/${SIZE}__bare.json \
    --sysprompt results/${SIZE}__sysprompt-v05.json \
    --out results/${SIZE}__sysprompt-v05.comparison.md
done

# Phase 2 — LoRA fine-tunes
bash rental_watcher.sh &
WATCHER_PID=$!

for SIZE in 1.5B 3B 7B; do
  python train_lora.py \
    --base hf:Qwen/Qwen2.5-${SIZE}-Instruct \
    --corpus corpus/corpus.jsonl \
    --epochs 5 --lr 2e-5 --r 64 \
    --out runs/${SIZE}__lora-v05
  python score.py --subject hf:Qwen/Qwen2.5-${SIZE}-Instruct \
    --adapter-path runs/${SIZE}__lora-v05 \
    --probes probes-combined.jsonl \
    --out results/${SIZE}__lora-v05.json
  python diff_results.py --bare results/${SIZE}__bare.json \
    --sysprompt results/${SIZE}__sysprompt-v05.json \
    --lora results/${SIZE}__lora-v05.json \
    --out results/${SIZE}__three-way.comparison.md
done

# Phase 3 — v0.3 corpus comparison on the chosen size (default 3B; rerun pick)
PICK_SIZE=3B  # update if Phase 2 indicates a different sweet spot
python ~/Sartor-claude-network/sartor/memory/research/ccp-alignment/eval-harness-2026-05-04/build_corpus.py \
  --out corpus/corpus-v03.jsonl --meta corpus/corpus-v03.meta.json
# NOTE: that builder points at the canonical HOUSEHOLD-CONSTITUTION.md which is now v0.5.
# To get a true v0.3 corpus, set the env var or use the archived path:
SARTOR_REPO_ROOT=~/Sartor-claude-network \
  python -c "
import sys; sys.path.insert(0, '~/Sartor-claude-network/sartor/memory/research/ccp-alignment/eval-harness-2026-05-04')
# build_corpus.py reads MEMORY/reference/HOUSEHOLD-CONSTITUTION.md by default; for v0.3 corpus,
# temporarily symlink the v0.3 archive into a sibling path. See README's note on this gotcha.
"
# Simpler: just edit the v0.3 builder's path or copy the archive into a temp location
cp ~/Sartor-claude-network/sartor/memory/reference/archive/HOUSEHOLD-CONSTITUTION-v0.3.md /tmp/v03-corpus-source.md
# (See harness README; or write a one-line wrapper that points the v0.3 builder at the archive path.)

python train_lora.py \
  --base hf:Qwen/Qwen2.5-${PICK_SIZE}-Instruct \
  --corpus corpus/corpus-v03.jsonl \
  --epochs 5 --lr 2e-5 --r 64 \
  --out runs/${PICK_SIZE}__lora-v03
python score.py --subject hf:Qwen/Qwen2.5-${PICK_SIZE}-Instruct \
  --adapter-path runs/${PICK_SIZE}__lora-v03 \
  --probes probes-combined.jsonl \
  --out results/${PICK_SIZE}__lora-v03.json
python diff_results.py --lora-v03 results/${PICK_SIZE}__lora-v03.json \
  --lora-v05 results/${PICK_SIZE}__lora-v05.json \
  --out results/${PICK_SIZE}__corpus-comparison.md

kill $WATCHER_PID

# Phase 4 — Write REPORT.md and commit
# (Manual: synthesize results across phases, take a position on each H1-H5)
```

## What to commit back to the repo

After the run lands:

- All `results/*.json` (small)
- All `results/*.comparison.md` 
- `corpus/corpus.meta.json` (NOT the corpus jsonl itself if it's large — manifest is enough)
- `REPORT.md` with the synthesis
- Brief `notes.md` parallel to the 2026-05-04 one (decisions made, deviations from plan, problems encountered)

Skip:
- Model weights, adapter checkpoint binaries, venv contents
- Anything in `runs/*` larger than a few MB (write a one-paragraph note in `runs/README.md` describing where the adapters live on disk)

Commit path: `sartor/memory/research/constitution-finetune/2026-05-06-v0.5-bringup/results/` and `.../REPORT.md` and `.../notes.md`.

## What to phone home about

Send `PHONE-HOME-*` files to `inbox/rocinante/` for:
- Any of the 5 hypotheses landing definitively (especially if H1 or H2 fails — the experiment was designed to test these)
- Any unexpected substrate-specific failures (e.g., Qwen2.5-1.5B refuses to generate at all, or capability collapses on a specific axis)
- Any methodological discovery that should propagate back into the harness (judge bias, probe-set issues, training-recipe surprises)

If the run produces clean signal across all phases, just commit the artifacts and write `REPORT.md`. No phone-home needed for green-path completion.

## Open issues to acknowledge in the report

- **Judge familiarity bias.** This very session (the rocinante orchestrator's session that wrote the v0.5 Constitution and this dispatch) is the same OAuth credential your judge uses. The judge should not be reading model outputs with knowledge of which run is which. Phase 3's v0.3-vs-v0.5 corpus comparison is the most exposed to this; mitigation is in the README.
- **Capability vs identity tradeoff at smaller scale.** 1.5B may be too small to hold the role. If Phase 1's 1.5B baseline already shows incoherence on the v05-coherence-* probes, do Phase 2's 1.5B LoRA training anyway and let the capability drop be the reported finding, but do not tune the recipe to recover it — the report's value is the honest measurement.
- **Corpus size.** v0.5 corpus is small. If voice-axis plateaus below the success thresholds across all sizes, the next pass is corpus augmentation (synthetic Q&A from the Constitution sections), not training-recipe changes. Note that as a pre-registered next step.

## Permission boundaries

- You may use up to ~$15 of compute equivalent on this run (training + eval). vast.ai cost basis. Stay below that and surface if you hit it.
- You may NOT push directly to GitHub. Push to the rtxserver bare per the standard git topology.
- You may NOT modify `reference/HOUSEHOLD-CONSTITUTION.md` (it's now ratified v0.5; touching it is a §18 violation).
- You may NOT modify the v0.5 archive at `reference/archive/HOUSEHOLD-CONSTITUTION-v0.3.md` or any prior archive (archive-not-collapse).
- You may add to `research/constitution-finetune/2026-05-06-v0.5-bringup/results/` and write `REPORT.md` and `notes.md` there freely.

## Done condition

A `REPORT.md` in the experiment directory that:
1. Tabulates per-axis scores (bare / +sysprompt / +lora) across all three model sizes
2. Tabulates the v0.3-vs-v0.5 corpus comparison at the chosen size
3. Takes a position on H1-H5 with evidence
4. Names the model size that is the recommended candidate for "production" Sartor Home Agent fine-tune work
5. Names the next pass's priority

Plus all the artifacts committed back per "What to commit" above.

When this lands, write a brief `PHONE-HOME-v05-bringup-complete-{ts}.md` to `inbox/rocinante/` with the headline result and a pointer to the REPORT.

— rocinante orchestrator, 2026-05-06
