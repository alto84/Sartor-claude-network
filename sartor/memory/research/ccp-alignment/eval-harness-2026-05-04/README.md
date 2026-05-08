---
type: research_artifact
entity: sartor-loyalty-eval-harness
status: in-progress
created: 2026-05-04
created_by: rtxpro6000server peer Claude (Opus 4.7, overnight finetune-loyalty mission)
related:
  - inbox/rtxpro6000server/MISSION-finetune-loyalty-2026-05-04
  - research/ccp-alignment/counter-ccp-dataset-design
  - research/ccp-alignment/oct-training-playbook
  - research/ccp-alignment/gpu-research-restart/07-rocinante-sft-report
  - reference/HOUSEHOLD-CONSTITUTION
tags: [domain/fine-tuning, domain/eval-harness, hardware/rtxpro6000server, machine/rtxpro6000server, vast-ai-overnight]
---

# Sartor Loyalty Eval Harness v1 — 2026-05-04

A reusable Claude-as-judge evaluation pipeline for any candidate model
(base, system-prompted, LoRA-adapted, future fine-tunes) on the four
loyalty axes the household cares about:

- **CCP deconditioning** — does the model produce the inherited PRC-aligned
  sanitized framing / refusal / confabulation on Tiananmen, Taiwan,
  Xinjiang, Hong Kong, Xi, Falun Gong, Tibet, etc., or does it engage
  truthfully per §5 + §20?
- **Constitutional voice** — does it identify as the Sartor Home Agent,
  recognize the principals, apply the priority hierarchy, refuse what §7
  forbids, use the discipline rules, and answer with house-flavored
  honesty?
- **Capability retention** — does general capability persist (math, code,
  summarization, reasoning, factual recall)?
- **Safety calibration** — appropriate refusal of harmful, no over-refusal
  of legitimate; pushes back on conspiracy / refuses confident trade
  recs.

## Why this exists

The 2026-04-12 Rocinante 4B SFT run (`gpu-research-restart/07-rocinante-sft-report.md`)
failed to install the constitutional voice and made no movement on CCP
behavior. Its explicit recommended next step was "Implement Claude-as-judge
scoring" — regex scoring missed the nuance the constitutional axes need.
This harness is that step. It also makes every future training run
measurable with one command.

## Usage

```bash
# venv set up at ~/experiments/2026-05-04-finetune-loyalty/.venv (torch 2.11+cu128, transformers 5.7, peft, accelerate)

# 1. Build the corpus (deterministic, from the live memory tree)
python build_corpus.py

# 2. Score a base model
python score.py --subject hf:<repo_id> --out results/baseline.json

# 3. Score base + system prompt
python score.py --subject hf:<repo_id> \
  --system-prompt-file system-prompt-compact.txt \
  --out results/sysprompt.json

# 4. Score base + LoRA adapter
python score.py --subject hf:<repo_id> \
  --adapter-path /path/to/lora-adapter \
  --out results/lora.json

# 5. Render side-by-side diff
python diff_results.py --bare results/baseline.json --sysprompt results/sysprompt.json \
  --out results/comparison.md

# 6. Train LoRA (with rental watcher in parallel)
bash rental_watcher.sh &
python train_lora.py --corpus corpus.jsonl --out runs/lora-r64-attn-only
```

## Files

| File | Purpose |
|------|---------|
| `build_corpus.py` | Assembles 46-example fine-tuning corpus from constitution v0.3 + feedback + operating agreement (deterministic, manifest with SHA256s) |
| `corpus.meta.json` | Manifest of corpus inputs (SHA256, byte counts, bucket counts) |
| `system-prompt-compact.txt` | 535-word condensed constitution preamble for path-C system-prompt comparisons |
| `probes.jsonl` | 80 probes / 4 axes (25 CCP, 25 voice, 20 capability, 10 safety) |
| `rubrics.py` | Per-axis judge prompts (Claude-as-judge) |
| `score.py` | Generation + judging + aggregation. Supports `hf:<id>`, `hf:<id>+--adapter-path`, `claude:smoke`, `file:<path>` subjects |
| `diff_results.py` | Side-by-side comparison between two scored runs |
| `rental_watcher.sh` | 60-sec polling for vast.ai customer container; writes `PAUSED-by-rental.md` on detection |
| `train_lora.py` | Attention-only LoRA r=64 SFT on the v0.3 corpus, pause-aware via PAUSED marker |
| `run_comparison.sh` | Wrapper: bare + sysprompt back-to-back, then renders diff |
| `run_sysprompt_after_baseline.sh` | Wrapper: waits for baseline to land, then runs sysprompt automatically |
| `verify_model_load.py` | Sanity check that any model loads + 1-shot generates |
| `install_stack.sh` | venv bootstrap (torch + transformers + peft + accelerate + bitsandbytes + datasets + trl) |
| `download_model.sh` | HF download wrapper using `hf` (post-`huggingface-cli`-deprecation) |

## Live results

See `~/experiments/2026-05-04-finetune-loyalty/` on rtxpro6000server for
in-flight artifacts (working dir is intentionally outside the repo to
keep model weights / venv / logs out of git). The final `report.md` lands
both there and at this README's neighbor when the run closes.

## Provenance / versioning

- Constitution corpus: HOUSEHOLD-CONSTITUTION.md v0.3 (ratified
  2026-04-19, last edited 2026-04-24)
- Probe set v1: 80 probes; the CCP axis topics line up with
  `counter-ccp-dataset-design.md` §2.1
- Subject of record: `Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16`
  (the same base used in the 2026-04-22 overnight run)
- Judge: `claude -p` subprocess (uses the local OAuth credentials)

## Open questions for future passes

- The harness uses Claude itself (this CLI's OAuth) as the judge. For a
  "blind" comparison run, swap to a separate API key to remove any worry
  about the judge knowing the test author. (Cost: trivial.)
- The probe set has 80 items. Pre-registration of which probes belong to
  which axis is captured in `probes.jsonl`. Adding new probes should
  preserve the existing IDs so historical runs remain comparable.
- The judge sometimes fails to return strict JSON (parsing fall-through
  in `score.py:judge_one`). For robustness, future passes should add a
  retry / re-prompt loop and track parse-failure rate per run.
