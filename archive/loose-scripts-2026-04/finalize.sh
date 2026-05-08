#!/bin/bash
# Finalize: write summary, commit, no push.
set -u
REPO=~/Sartor-claude-network
CORPUS_DIR="$REPO/experiments/2026-04-22-overnight-training/track-C-v2-corpus"
QC_DIR="$CORPUS_DIR/qc-reports"
INBOX="$REPO/sartor/memory/inbox/gpuserver1"
SUMMARY="$INBOX/2026-04-24_corpus-qc-summary.md"
LOG="$INBOX/2026-04-24_cpu-delegation.md"

mkdir -p "$INBOX"

# Gather stats
PRIMARY_COUNT=$(ls "$CORPUS_DIR/primary-override"/*.jsonl 2>/dev/null | wc -l)
HN_PRESENT="no"; [ -f "$CORPUS_DIR/hard-negatives.jsonl" ] && HN_PRESENT="yes"
CC_PRESENT="no"; [ -f "$CORPUS_DIR/capability-control.jsonl" ] && CC_PRESENT="yes"
PROBES_PRESENT="no"; [ -f "$REPO/experiments/2026-04-22-overnight-training/probes/probes-v2.jsonl" ] && PROBES_PRESENT="yes"
QC_REPORT_COUNT=$(ls "$QC_DIR"/*.md 2>/dev/null | wc -l)

# If COMBINED.md exists, embed its core stats
COMBINED_SUMMARY=""
if [ -f "$QC_DIR/COMBINED.md" ]; then
  COMBINED_SUMMARY=$(head -40 "$QC_DIR/COMBINED.md")
fi

cat > "$SUMMARY" << EOF
---
name: corpus-qc-summary-2026-04-24
type: inbox-summary
date: 2026-04-24
updated: $(date -u +%Y-%m-%d)
tags: [qc, track-c-v2, gpuserver1, corpus, delegation]
---

# Track C v2 Corpus QC — gpuserver1 summary

## What gpuserver1 did

Rocinante delegated Track C v2 corpus QC to gpuserver1 because machine 52271 is
under an exclusive-GPU rental contract through 2026-08-24. gpuserver1 ran
CPU-only work with a 20% rental-CPU backoff threshold, polled every 10 minutes
for new corpus commits arriving via \`git pull\`, and ran per-file + combined QC.

## Components

- **~/.cpu-guard.sh** — docker-stats-based backoff check, threshold 20% CPU
- **~/corpus-qc.py** — per-file QC: JSON-parse, required fields (prompt,
  response, type|category, topic), token/word stats, length distribution
  (target 100-300 words), anti-patterns (sycophantic openers, handoff closers,
  "it's not just X, but Y"), PRC-phrase flags with rejection-aware heuristic
- **~/corpus-combined-qc.py** — cross-file aggregation: totals, distributions,
  duplicate-prompt detection, BPE token estimate (~words * 1.3)

## Corpus arrival state at finalize time

- Primary-override topic files: **${PRIMARY_COUNT}** / 10
- hard-negatives.jsonl: **${HN_PRESENT}**
- capability-control.jsonl: **${CC_PRESENT}**
- probes-v2.jsonl: **${PROBES_PRESENT}**
- QC reports written: **${QC_REPORT_COUNT}**

## Combined report (if generated)

${COMBINED_SUMMARY:-(COMBINED.md not generated — component(s) missing)}

## Rental impact

All sustained backoff / resume events are logged in 2026-04-24_cpu-delegation.md.

## Next steps for Rocinante

1. Pull on Rocinante to see gpuserver1's QC reports
2. If COMBINED.md exists, review its PRC-phrase / anti-pattern / length flags
3. Take corrective passes on flagged pairs before Track C v2 training
4. gpuserver1 has no push credentials; Rocinante pushes

EOF

echo "wrote $SUMMARY"

cd "$REPO"

# Configure git identity if missing
if [ -z "$(git config --global user.email 2>/dev/null)" ]; then
  git config --global user.email "gpuserver1@sartor"
  git config --global user.name "gpuserver1 Claude"
fi

git add "$CORPUS_DIR/qc-reports/" "$INBOX/" 2>/dev/null || true
# Only commit if there is something staged
if ! git diff --cached --quiet; then
  git commit -m "gpuserver1 QC for Track C v2 corpus" 2>&1 | tail -5
  echo "committed"
else
  echo "nothing to commit"
fi

echo "---status---"
git status --short | head -30
