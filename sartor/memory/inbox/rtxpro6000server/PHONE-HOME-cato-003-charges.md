---
name: phone-home-cato-003-charges
description: rtxserver phone-home — Cato-003 verify pass on v1.2 returned REVISE with four small patches. Phase 1 NOT fired. Awaiting Alton greenlight on resolution path.
type: phone-home
date: 2026-04-25
from: rtxserver (persona-engineering team-lead, post-cato-003)
to: rocinante (for Alton)
status: blocked-awaiting-greenlight
volatility: low
tags: [meta/phone-home, domain/research, research/persona-engineering, phase/1-baseline]
related:
  - research/persona-engineering/CATO-PROSECUTION-003
  - research/persona-engineering/PASSOFF-rtxserver-001
---

# Cato-003 verdict: REVISE. Phase 1 NOT fired.

## Headline

Per Alton's pre-fire decision rule, REVISE blocks the run until Alton greenlights the resolution path. PASSOFF status flipped to `BLOCKED-cato-003-charges`. Four small patches queued in PASSOFF §v1.2 → v1.2-revise queue. None block conceptually; total revision cost is four text edits across two files. Cato-003 explicitly stated "no fourth-round prosecution warranted."

## What landed cleanly (4 of 5 + 1 of 2)

- **Patch 1** — 6.E flowchart entry criterion (option (a), ≥ 0.60 floor): clean.
- **Patch 3** — README probe count 60 → 76 with full breakdown: clean. JSONL verified at 76 probes via `wc -l` and `Counter`.
- **Patch 4** — Experiment 001 §3 stale reference (path, schema, field-naming reconciliation): clean.
- **Patch 5** — RESEARCH-PLAN curve-shape table extension. Cato-003 also vetted the team-added "Unclassified" residual row for reframing-escape-hatch potential and cleared it (anti-coercion clause + default-to-inconclusive verdict neutralizes the risk).
- **Language soften 2 (§5.2)** — clean.

## What needs revision (1 of 5 + 1 of 2 + 2 new)

The four patches below are small, mechanical, and listed in full in PASSOFF-rtxserver-001 §v1.2 → v1.2-revise queue.

1. **Patch 1 (re-apply §2)** — `experiments/001_*.md:316` (§2.6.b countervailing scoring step) still reads `<` instead of `≤`. The two-character v1.2 patch landed in §6 Step C and in MEASUREMENT-COUNTERVAILING.md but missed §2.6.b. This matters operationally because §2.6.b is what work item A4 (`score-countervailing.py`) reads when the implementing agent wires up the script — under `<`, the script will miss the uniform-neutrality case the patch was supposed to catch. This is the only patch with operational teeth; the rest are hygiene.

2. **Patch 2** — §6.3 rebuttal lead-in still reads "most important of the three load-bearing additions." §5.2 in the same document explicitly retracts "load-bearing" as overstatement. Internal inconsistency. One sentence rewrite.

3. **New §1** — Cato-002 §1 patch language explicitly required "a new §History entry in experiment 001 v1.1." The v1.2 patch added inline audit-trail comments but no top-level §History rollup; frontmatter still reads `version: v1.1`. One §History entry + frontmatter version bump.

4. **New §2** — `RESEARCH-PLAN.md:6` `updated:` field still reads 2026-04-24 while the §History block records the 2026-04-25 v1.2 patch. Same desync class as the README defect Cato-002 §3 caught. One frontmatter line update.

## Resolution path — needs Alton call

Two reasonable options:

- **(a) Apply-then-Cato-004 verify.** External reviewer confirms the four patches landed before fire. Cost: ~10 min for a Cato-004 spawn. Lowest residual risk.
- **(b) Apply-then-fire.** All four patches are mechanical text edits. Cato-003 was tight ("fire after the four small patches above. No fourth-round prosecution warranted"). Operational concern (patch 1, §2.6.b boundary) is locally verifiable by `grep` after the edit. Cost: skips a verification round.

I recommend **(b)**. Cato-003 is on record that no fourth round is warranted; the four patches are textual; the §2.6.b operational miss is verifiable by direct inspection. (a) is safer but the cost-of-being-wrong on these specific four patches is small.

## State

- Cato-003's full verdict: `sartor/memory/research/persona-engineering/CATO-PROSECUTION-003.md` (committed at fa586f0, brought into main as 7921723).
- PASSOFF status: `BLOCKED-cato-003-charges`.
- PASSOFF version bumped: `v1.1` → `v1.2`.
- No GPU work executed. No experiment artifacts created.

## What I need from Alton

A pick between (a) and (b), or a third option I'm not seeing. Once you call it, I will (i) execute the four patches, (ii) flip PASSOFF status accordingly, (iii) either spawn Cato-004 or fire Phase 1 directly per your call.

— rtxserver, 2026-04-25
