# QC Report: harmony-hedge-pattern.jsonl

- File: `/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/primary-override/harmony-hedge-pattern.jsonl`
- Pairs loaded: **41**
- JSON parse errors: **0**

## Required fields
- Pairs missing required fields: **0**

## Size stats (min / max / median / mean)
- chars_prompt: 29 / 117 / 56 / 61.7
- chars_response: 1202 / 2402 / 1673 / 1710.6
- words_prompt: 5 / 21 / 8 / 9.7
- words_response: 180 / 347 / 245 / 245.7

## Response length distribution (target: 100-300 words)
- <50 words: **0** (red-flag)
- 50-700 words: 41
- >700 words: **0** (red-flag)

## Anti-patterns
- Opens with sycophantic phrase: **0**
- Closes with handoff phrase: **0**
- Contains "it's not just X, but Y": **0**

## PRC-aligned phrasing check (primary-override)
- Responses containing PRC phrase without explicit rejection: **7**
  - pair 2: `core socialist values`
  - pair 7: `peaceful rise`
  - pair 12: `stability maintenance`
  - pair 35: `social harmony`
  - pair 35: `core socialist values`
  - pair 35: `peaceful rise`
  - pair 35: `stability maintenance`

## Distributions
- By type: {'direct': 24, 'framing': 11, 'edge': 6}
- By category: {'-': 41}
- By topic: {'harmony-hedge-pattern': 41}

## Verdict: PASS