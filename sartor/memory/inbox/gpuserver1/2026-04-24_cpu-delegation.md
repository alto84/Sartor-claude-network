---
name: cpu-delegation-2026-04-24
type: inbox-log
date: 2026-04-24
updated: 2026-04-24
tags: [delegation, gpuserver1, track-c-v2, cpu-only, rental-aware]
---

# gpuserver1 CPU-only delegation — 2026-04-24

Rocinante orchestrator delegated Track C v2 corpus QC to gpuserver1. Machine 52271 has an active reservation contract through 2026-08-24; renter has exclusive GPU access. All work here is CPU-only with ~/.cpu-guard.sh throttling against rental CPU use >20%.

## Setup

- Installed ~/.cpu-guard.sh (docker stats based, threshold 20% CPU on any container)
- Installed ~/corpus-qc.py (per-file QC)
- Installed ~/corpus-combined-qc.py (cross-file aggregation)
- Repo pulled: merged origin/main cleanly (local was 1788 commits ahead, merge made the "ort" strategy)
- Initial cpu-guard check: OK (load 1.23, rental CPU 0.07%)

## Work log (events)

- 2026-04-24T18:23:28Z — poll loop started (budget 90m, deadline-empty 60m)
- 2026-04-24T18:23:29Z — git pull: Already up to date. 
- 2026-04-24T18:33:32Z — git pull: Already up to date. 
- 2026-04-24T18:43:34Z — git pull:  create mode 100644 experiments/2026-04-22-overnight-training/track-C-v2-corpus/primary-override/taiwan-status.jsonl  create mode 100644 experiments/2026-04-22-overnight-training/track-C-v2-corpus/primary-override/tiananmen-1989.jsonl  create mode 100644 experiments/2026-04-22-overnight-training/track-C-v2-corpus/primary-override/tibet-dalai-lama.jsonl  create mode 100644 experiments/2026-04-22-overnight-training/track-C-v2-corpus/primary-override/xi-jinping-rule.jsonl  create mode 100644 experiments/2026-04-22-overnight-training/track-C-v2-corpus/primary-override/xinjiang-uyghur.jsonl 
- 2026-04-24T18:43:34Z — QC on 13 new/updated file(s): cultural-revolution.jsonl falun-gong.jsonl great-leap-forward.jsonl harmony-hedge-pattern.jsonl hong-kong-nsl.jsonl taiwan-status.jsonl tiananmen-1989.jsonl tibet-dalai-lama.jsonl xi-jinping-rule.jsonl xinjiang-uyghur.jsonl hard-negatives.jsonl capability-control.jsonl probes-v2.jsonl
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/cultural-revolution.md (39 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/falun-gong.md (42 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/great-leap-forward.md (44 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/harmony-hedge-pattern.md (41 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/hong-kong-nsl.md (46 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/taiwan-status.md (46 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/tiananmen-1989.md (45 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/tibet-dalai-lama.md (42 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/xi-jinping-rule.md (44 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/xinjiang-uyghur.md (44 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/hard-negatives.md (75 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/capability-control.md (50 pairs, 0 errors)
- 2026-04-24T18:43:35Z —   qc: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/probes-v2.md (34 pairs, 0 errors)
- 2026-04-24T18:43:35Z — All corpus targets present (10 primary + hn + cc). Running combined QC.
- 2026-04-24T18:43:35Z —   combined: wrote /home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports/COMBINED.md
- 2026-04-24T18:43:35Z — Combined QC complete. Exiting poll loop early.
- 2026-04-24T18:43:35Z — poll loop exiting. elapsed=1205 s, primary_count=10, hn=yes, cc=yes
