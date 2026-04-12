---
type: project_status
status: wrapped
wrapped_date: 2026-04-12
project: mini-lab-2026-04-11
entity: sartor-mini-lab
---

# Mini-Lab WRAPPED

**Verdict**: (B) Partially worked with a specific shape. sft-v2 installed constitutional voice and scenario-level values on a 4B Nemotron-Mini-Instruct dense transformer (LoRA r=32/alpha=64, 10 epochs, 136-example OCT-style corpus with loss-masking fix via `assistant_only_loss=True` + monkey-patched `{% generation %}` markers). Net eval delta: -0.146 (base 0.625, sft-v2 0.479). Constitutional voice transferred; refusal calibration, math reasoning, and rationalization-resistance regressed. The regression is a real training effect (small-corpus high-epoch overfit), not a bug artifact — confirmed because sft-v2's clean run reproduces the shape that sft-v1's buggy run first showed.

---

## What Is Preserved

**In-repo (committed with MINI-LAB-REPORT.md)**:
- `sartor/memory/projects/mini-lab-2026-04-11/MINI-LAB-REPORT.md` — full final report (~44k tokens), authoritative

**In artifacts directory** (`sartor/memory/projects/mini-lab-2026-04-11/artifacts/`):
- `train_sft.py` — SFT training script with chat-template monkey-patch and `assistant_only_loss=True` fix
- `run_eval.py` — eval runner
- `score_eval.py` — eval scorer
- `interview.py` — adversarial interview harness
- `probes.jsonl` — 96-prompt eval battery (probe definitions)
- `rubric.md` — interview rubric
- `eval-base-scored.json` — scored base (C0) eval results (96 probes)
- `eval-sft-v2-scored.json` — scored sft-v2 eval results (96 probes)
- `interview-base-raw.jsonl` — base model interview raw outputs
- `interview-sft-v2-raw.jsonl` — sft-v2 interview raw outputs

**In working directory** (`C:/Users/alto8/abliteration-exp/mini-lab/`) — left behind:
- All checkpoint files (large, not repo-worthy)
- All training logs (`logs/`)
- All intermediate/buggy evals (`outputs/eval-sft-v1-*`, `eval-base-scorecard-partial.json`, etc.)
- Corpus files (derivable from sources)
- All helper scripts not central to reproducibility (`run_all_for_checkpoint.py`, `sweet_spot_probe.py`, etc.)
- Reports subdirectory (`reports/`) — narrative session docs, available if needed

---

## What Was Intentionally Left Behind

- Checkpoints (2 in `checkpoints/`): large binary files; not archived. The trained sft-v2 model is on gpuserver1 if it still exists, otherwise retraining from artifacts takes ~10 min.
- sft-v1 buggy evals: `eval-sft-v1-buggy-c100-partial.jsonl`, `eval-sft-v1-buggy-c170.jsonl` — contaminated by loss-masking bug, retained in working dir for forensic reference only.
- Training logs: kept in `mini-lab/logs/` only; not archived.
- `build_corpus.py`, `four_point_summary.py`, `run_sft_four_point.py`, `run_sft_v2_chain.py`, `wait_then_eval_sft_v2.py`, `wake_lock.py`, `launch_detached.py` — orchestration helpers, not needed for reproducibility.

---

## What Future Work Would Pick Up

1. **Planned but not run**: abliteration (C4/C5), persona-vector steering (C6/C7), DPO pass (C3), sft-v2 hyperparameter retry (C8). The MINI-LAB-REPORT.md documents the full protocol for each.
2. **Architecture debt**: The planned target (Nemotron-3-Nano-4B-BF16 hybrid Mamba-Transformer) was unreachable on Windows due to `mamba_ssm` lacking a Windows wheel. That question (can LoRA and persona-vector extraction generalize to Mamba-2 blocks?) remains open and motivates the 35B production run on gpuserver1 (Linux, no `mamba_ssm` build issue).
3. **Refusal calibration damage**: The training effect is well-characterized (small-corpus overfit at r=32/alpha=64). Remediation options documented in MINI-LAB-REPORT.md §10: larger corpus with diverse benign examples, lower alpha, data augmentation for refusal-calibration-over class.
4. **CCP hedging probe design**: Base model produces multi-perspective evasion (not refusal) on 3 of 8 CCP probes. Counter-CCP probe battery needs to test for content engagement vs. hedge-without-content. See MINI-LAB-REPORT.md §5.2.
5. **sft-v1 interview transcript**: Never completed due to session deadline. If the 35B run uses the same interview harness, sft-v1 results would fill the comparison gap.
6. **35B production run**: This mini-lab was methodology rehearsal for the full OCT run on Qwen3.5-35B-A3B on dual RTX PRO 6000 Blackwell. The eval battery, interview rubric, and chat-template fix from this lab are directly reusable. See `sartor/memory/projects/oct-training-playbook.md`.
