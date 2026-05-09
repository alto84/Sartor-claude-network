# Adversarial Interview: {checkpoint-name}

**Interviewer:** adversarial-interviewer
**Date:** 2026-04-1?
**Checkpoint:** `mini-lab/checkpoints/{checkpoint-name}/`
**Model base:** Nemotron-Mini-4B-Instruct (FR-4B fallback substitute for Nemotron-3-Nano-4B-BF16; see experiment-log)
**Prompt battery:** `mini-lab/scripts/interview_prompts.json` v1.1
**Rubric:** `mini-lab/scripts/interview_rubric.md` v1.1

## Lede

> {one-bullet gut verdict: "{checkpoint-name} character is coherent / incoherent / mixed, because X." Unhedged. Results-synthesizer pulls this directly for §3 of the final report. Hedge in per-prompt scoring below if needed, not here.}

## Summary scoring

| Category | N | Mean score | Interpretation |
|---|---|---|---|
| jailbreak | 10 | ?.?? | |
| constitutional | 10 | ?.?? | |
| refusal_over | 5 | ?.?? | |
| refusal_under | 5 | ?.?? | |
| sycophancy | 5 | ?.?? | |
| rationalization | 5 | ?.?? | |
| character | 5 | ?.?? | |
| mechanism | 5 | ?.?? | |
| multiturn | 3 | ?.?? | |
| **Overall** | 53 | ?.?? | |

## Key findings

### Top 3 concerning behaviors

1.
2.
3.

### Top 3 surprises (good or bad)

1.
2.
3.

### Constitutional citation rate

Fraction of constitutional-category prompts where the model cited or paraphrased the constitution explicitly: X / 10.

### Base-model leakage

Notes on any inherited Nemotron / NVIDIA corporate content bleeding through.

### Cross-category observations

- Character consistency across ch01-ch05:
- Sycophancy vs rationalization correlation:
- Jailbreak vs mechanism-layer gap:

## Per-prompt detail

### Jailbreak

| ID | Score | Notable quote | Notes |
|---|---|---|---|
| jb01 | | | |
| jb02 | | | |
| jb03 | | | |
| jb04 | | | |
| jb05 | | | |
| jb06 | | | |
| jb07 | | | |
| jb08 | | | |
| jb09 | | | |
| jb10 | | | |

### Constitutional adherence

| ID | Score | Notable quote | Cited constitution? |
|---|---|---|---|
| co01 | | | |
| co02 | | | |
| co03 | | | |
| co04 | | | |
| co05 | | | |
| co06 | | | |
| co07 | | | |
| co08 | | | |
| co09 | | | |
| co10 | | | |

### Refusal calibration (over-refusal)

| ID | Score | Notable quote | Notes |
|---|---|---|---|
| ro01 | | | |
| ro02 | | | |
| ro03 | | | |
| ro04 | | | |
| ro05 | | | |

### Refusal calibration (under-refusal)

| ID | Score | Notable quote | Notes |
|---|---|---|---|
| ru01 | | | |
| ru02 | | | |
| ru03 | | | |
| ru04 | | | |
| ru05 | | | |

### Sycophancy

| ID | Score | Notable quote | Notes |
|---|---|---|---|
| sy01 | | | |
| sy02 | | | |
| sy03 | | | |
| sy04 | | | |
| sy05 | | | |

### Rationalization

| ID | Score | Notable quote | Notes |
|---|---|---|---|
| ra01 | | | |
| ra02 | | | |
| ra03 | | | |
| ra04 | | | |
| ra05 | | | |

### Character stability

| ID | Score | Verbatim answer | Notes |
|---|---|---|---|
| ch01 | | | |
| ch02 | | | |
| ch03 | | | |
| ch04 | | | |
| ch05 | | | |

### Mechanism-layer attacks

| ID | Score | Notable quote | Notes |
|---|---|---|---|
| me01 | | | |
| me02 | | | |
| me03 | | | |
| me04 | | | |
| me05 | | | |

### Multi-turn escalation

| ID | Score | Anchor in static battery | Turn at which model wobbled or flipped |
|---|---|---|---|
| mt01 | | medical-confabulation/1 (swallowed penny) | |
| mt02 | | constitutional-adherence/10 (retraining cooperation) | |
| mt03 | | refusal-calibration-under/5 (firework lift charge) | |

## Raw response archive

Full verbatim responses are stored alongside this report at `mini-lab/logs/interview-{checkpoint-name}.jsonl`, keyed by prompt id.
