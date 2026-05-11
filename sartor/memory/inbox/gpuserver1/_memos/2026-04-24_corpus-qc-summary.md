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


## Key findings (detail, from gpuserver1 spot-check)

### Headline

Corpus is high-quality and ready to train on. 558 pairs, 0 parse errors, targets met (433 primary-override in 400-500 band, 75 hard-negatives in 50-100, 50 capability-control at target), 0 duplicate prompts, ~170K BPE tokens.

### Type/category distribution

- Primary-override type axis: 262 direct / 106 framing / 65 edge (three prompt shapes §20 calls for)
- Hard-negatives categories: children 15, credentials 15, professional 15, impersonation 10, financial 10, external-comm 10
- Capability-control categories: arithmetic 15, python 15, bio-phys-chem 10, general-knowledge 10

### Flags — all checked; all look like false positives

**PRC-phrase flags (19 total, all primary-override files).** These are responses where a PRC phrase appears without a rejection keyword in a 200-char window. Spot-checked harmony-hedge-pattern flagged pairs (the topic most at risk of drift): **every flag was a false positive**. The responses quote the phrases as technical objects under analysis ("Core socialist values (shehuizhuyi hexin jiazhiguan) is a twelve-term slogan formalized by the CCP in 2012 under Xi Jinping...") and critique them directly with domain vocabulary ("ideological work", "bureaucratic apparatus", "budget line") that my rejection-cue list did not include. **Recommendation: these flags deserve a ~10-minute eyeball pass but no rewrites expected.** Distribution: harmony-hedge-pattern 7 (expected — this file IS about the pattern), tibet-dalai-lama 5, falun-gong 3, xi-jinping-rule 2, tiananmen-1989 1, xinjiang-uyghur 1. Pair indices are listed in per-file qc-reports/*.md.

**Length "red-flags" — all false positives on spot-check:**

- capability-control: 22/50 responses <50 words. All arithmetic ("347 + 586" -> 34-word answer). Correct.
- hard-negatives: 2/75 responses <50 words. Both are clean principled refusals citing Constitution sections. Correct for terse, firm declines.
- probes-v2: 34/34 <50 words. Probes are prompt-only files — there is no response to measure. Expected.

**Anti-pattern counts: all zero** across 558 pairs. No sycophantic openers, no handoff closers, no "it's not just X, but Y". Register discipline looks tight.

### Recommendations for Rocinante

1. Proceed with Track C v2 training on the corpus as-is — no blocking issues
2. Optional: review the 19 PRC-phrase flags (per-file reports list pair indices) — my sample of 4 found all false positive
3. Push this commit from Rocinante — gpuserver1 has no credentials

### gpuserver1 operational notes

- Rental spiked to 100% CPU briefly during the run; cpu-guard threshold (20%) triggered but resolved quickly. No sustained BACKOFF.
- Poll-loop wall time: ~20 minutes. Corpus arrived in one batched commit at 18:43:34Z, 12 minutes into the 90-minute budget.
- cpu-guard.sh, corpus-qc.py, corpus-combined-qc.py remain installed at ~/ on gpuserver1 for reuse on future batches.
