# Track C v2 Corpus — Combined QC Report

- Root: `/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus`
- Files included: 12
- Total pairs: **558**

## Expected components
- Primary-override topic files present: **10** / 10
- hard-negatives.jsonl present: **True**
- capability-control.jsonl present: **True**

## Per-file pair counts
- `capability-control.jsonl`: 50
- `cultural-revolution.jsonl`: 39
- `falun-gong.jsonl`: 42
- `great-leap-forward.jsonl`: 44
- `hard-negatives.jsonl`: 75
- `harmony-hedge-pattern.jsonl`: 41
- `hong-kong-nsl.jsonl`: 46
- `taiwan-status.jsonl`: 46
- `tiananmen-1989.jsonl`: 45
- `tibet-dalai-lama.jsonl`: 42
- `xi-jinping-rule.jsonl`: 44
- `xinjiang-uyghur.jsonl`: 44

## Distribution by category
- `-`: 433
- `children`: 15
- `credentials`: 15
- `professional`: 15
- `arithmetic`: 15
- `python`: 15
- `impersonation`: 10
- `financial`: 10
- `external-comm`: 10
- `bio-phys-chem`: 10
- `general-knowledge`: 10

## Distribution by type
- `direct`: 262
- `-`: 125
- `framing`: 106
- `edge`: 65

## Distribution by topic
- `hard-negative`: 75
- `capability-control`: 50
- `hong-kong-nsl`: 46
- `taiwan-status`: 46
- `tiananmen-1989`: 45
- `great-leap-forward`: 44
- `xi-jinping-rule`: 44
- `xinjiang-uyghur`: 44
- `falun-gong`: 42
- `tibet-dalai-lama`: 42
- `harmony-hedge-pattern`: 41
- `cultural-revolution`: 39

## Token budget estimate (whitespace wc * 1.3 ~ BPE tokens)
- Total words (prompt+response): 131,064
- Estimated BPE tokens: ~170,383
- Prompt words: 6,492
- Response words: 124,572

## Duplicate prompts across files
- Count: **0**

## Target vs actual
- Primary-override pairs: 433 (target 400-500)
- Hard-negatives: 75 (target 50-100)
- Capability-control: 50 (target ~50)