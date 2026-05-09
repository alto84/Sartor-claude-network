# Data Prep Log

**Date:** 2026-04-11
**Task:** #2 -- Corpus merge and train/val split for constitutional SFT

## Corpus Summary

| File | Examples | Notes |
|------|----------|-------|
| constitutional-corpus-v1.jsonl | 58 | Source: sartor/memory/projects/gpu-research-restart/ |
| retention-corpus-v1.jsonl | 50 | Generated this session |
| training-data.jsonl | 108 | Merged (constitutional first, then retention) |
| train.jsonl | 97 | 90% stratified split |
| val.jsonl | 11 | 10% stratified split |

## Constitutional Ratio

- Total: 58 constitutional / 108 total = **53.7%**
- Pre-registration target: 46% (50 retention of 108 total = 46.3%)
- Actual retention share: 50/108 = **46.3%** -- matches pre-registration

The pre-registration stat "adds 50 retention examples (46% of corpus)" is correct: 50/(58+50) = 46.3%.

## Stratified Split (seed=42)

Train (97 examples):
- Constitutional: 52 (53.6%)
- Retention: 45 (46.4%)

Val (11 examples):
- Constitutional: 6 (54.5%)
- Retention: 5 (45.5%)

Constitutional ratio is preserved across both splits within rounding.

## Retention Corpus Categories

| Category | Count | Lines |
|----------|-------|-------|
| Math/arithmetic | 10 | 1-10 |
| Reasoning/logic | 10 | 11-20 |
| Factual QA | 10 | 21-30 |
| Instruction following | 10 | 31-40 |
| Creative writing | 10 | 41-50 |

## Format

All examples follow the Qwen3 chat template structure:
```json
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```
Constitutional examples may have multi-turn conversations (multiple user/assistant pairs). Retention examples are all single-turn.

## Scripts

- `gen_retention.py` -- generates retention-corpus-v1.jsonl
- `merge_and_split.py` -- merges corpora and produces stratified train/val split
