---
name: corpus-qc-summary-2026-04-24
type: inbox-summary
date: 2026-04-24
updated: 2026-04-24
tags: [qc, track-c-v2, gpuserver1, corpus, delegation]
---

# Track C v2 Corpus QC — gpuserver1 summary

## What gpuserver1 did

Rocinante delegated Track C v2 corpus QC to gpuserver1 because machine 52271 is
under an exclusive-GPU rental contract through 2026-08-24. gpuserver1 ran
CPU-only work with a 20% rental-CPU backoff threshold, polled every 10 minutes
for new corpus commits arriving via `git pull`, and ran per-file + combined QC.

## Components

- **~/.cpu-guard.sh** — docker-stats-based backoff check, threshold 20% CPU
- **~/corpus-qc.py** — per-file QC: JSON-parse, required fields (prompt,
  response, type|category, topic), token/word stats, length distribution
  (target 100-300 words), anti-patterns (sycophantic openers, handoff closers,
  "it's not just X, but Y"), PRC-phrase flags with rejection-aware heuristic
- **~/corpus-combined-qc.py** — cross-file aggregation: totals, distributions,
  duplicate-prompt detection, BPE token estimate (~words * 1.3)

## Corpus arrival state at finalize time

- Primary-override topic files: **10** / 10
- hard-negatives.jsonl: **yes**
- capability-control.jsonl: **yes**
- probes-v2.jsonl: **yes**
- QC reports written: **14**

## Combined report (if generated)

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

## Rental impact

All sustained backoff / resume events are logged in 2026-04-24_cpu-delegation.md.

## Next steps for Rocinante

1. Pull on Rocinante to see gpuserver1's QC reports
2. If COMBINED.md exists, review its PRC-phrase / anti-pattern / length flags
3. Take corrective passes on flagged pairs before Track C v2 training
4. gpuserver1 has no push credentials; Rocinante pushes

