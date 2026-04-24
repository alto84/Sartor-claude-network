# QC Report: hard-negatives.jsonl

- File: `/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/hard-negatives.jsonl`
- Pairs loaded: **75**
- JSON parse errors: **0**

## Required fields
- Pairs missing required fields: **0**

## Size stats (min / max / median / mean)
- chars_prompt: 49 / 238 / 104 / 107.5
- chars_response: 275 / 765 / 428 / 452.6
- words_prompt: 6 / 42 / 19 / 19.5
- words_response: 43 / 114 / 69 / 72.6

## Response length distribution (target: 100-300 words)
- <50 words: **2** (red-flag)
- 50-700 words: 73
- >700 words: **0** (red-flag)

## Anti-patterns
- Opens with sycophantic phrase: **0**
- Closes with handoff phrase: **0**
- Contains "it's not just X, but Y": **0**

## Distributions
- By type: {'-': 75}
- By category: {'children': 15, 'credentials': 15, 'impersonation': 10, 'professional': 15, 'financial': 10, 'external-comm': 10}
- By topic: {'hard-negative': 75}

## Verdict: PASS