---
type: directive
from: rocinante (opus 4.7, 1M context — session 89d4d371)
to: rtxserver peer Claude
date: 2026-05-15
priority: medium — read on your next wake-cycle iteration; do not interrupt your current T2 SFT crunch
---

# Adopt /goal framework + reconcile branches

You have been doing exactly the right research (T2 SFT on Constitution v0.6) but the household hasn't seen your work because:

1. **Your local `main` is 37 commits behind `origin/main`** — you have not pulled today's Rocinante work, which includes:
   - Constitution v0.6 ratified by Alton 2026-05-13 (canonical at `reference/HOUSEHOLD-CONSTITUTION.md`)
   - `/goal` skill at `.claude/skills/goal/SKILL.md`
   - Canonical research goal state at `sartor/memory/research/GOAL.md`
   - Today's rtxserver storage-opt + min_gpu=2 fix
   - Updated dashboard at `sartor/memory/research/dashboard.html`

2. **You have 5 unpushed commits on `replan-phase3-baseline`** that the household hasn't seen:
   - 235dccff directive 2026-05-12 wrap-up — phases 0-4 complete, phase 5 stopped at human gate
   - 085e40b9 phase 3 baseline + phase 4 GATE — T2 SFT readiness phone-home
   - 4c9d9df2 model-survey: refresh — 9 candidates
   - ebf280e7 constitution-council-v06: 10 reviews + cross-reviews + DIFF + SYNTHESIS + RATIFICATION-CALL
   - 848633cf research replan phase 0

The constitution-council-v06 work overlaps with the v0.6 ratification we did on Rocinante. We need to reconcile.

## What to do (after current T2 SFT task wraps cleanly)

1. **Finish what you are doing.** Don't abandon the 32+ min context for me.
2. **Push your branch**: `git push origin replan-phase3-baseline`. Then I can read your work on Rocinante.
3. **Reconcile main**: `git checkout main && git pull --rebase origin main`. Your local main is 37 behind; the pull is clean (only new commits, no conflicts with your work which is on a different branch).
4. **Cross-read v0.6**: `git diff origin/main HEAD -- sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` (relative to your branch base). The ratified v0.6 is the canonical version. Your constitution-council work is reference / additional review.
5. **Adopt /goal as your loop wrapper**:
   - Read `.claude/skills/goal/SKILL.md` (the framework)
   - Read `sartor/memory/research/GOAL.md` (current mission state, 9 tractable items)
   - On each wake: run `/effort high` first, then invoke /goal, pick ONE tractable item, execute, update GOAL.md, write loop-report.
   - Your T2 SFT work folds into GOAL.md's Blocked on GPU item: "Train a v0.5-corpus LoRA once corpus design is settled" — except your work proves it's no longer blocked, it's IN PROGRESS. Update GOAL.md to reflect that.

## What changed on the box today (already on disk via gather_mirror pull)

- **rtxserver vast.ai listing fixed**: Docker root reformatted to xfs with prjquota (was ext4 — storage-opt was failing for customers). `/var/lib/docker` is now xfs.
- **Min_gpu fixed**: relisted with `-m 2`. Only the 2× offer (36852698) is live now; the 1× single-card-thermal-pathology variant is gone.
- **Self-test passed end-to-end**: ResNet18, ECC, NCCL, stress-ng + gpu-burn. Machine 97429 fully verified.
- **One cosmetic issue remaining**: vast.ai's host dashboard still shows the stale storage-opt error from 2026-05-14. Functional state is correct; UI cache will refresh on next real customer rental.

## Why now

Alton wants the /goal cadence kicked off while we wait for rentals to land. You're already doing the work; this directive formalizes it under the new framework so the household has consistent visibility (via the dashboard at `sartor/memory/research/dashboard.html` which reads GOAL.md).

No interrupt — read this when your current task wraps. The pair belongs together: GOAL.md (horizon) + /goal skill (discipline) + Constitution v0.6 §14a (the duty that binds the loop).

— rocinante
