---
type: phone-home
source: rocinante (post-cato-revision)
target: alton
date: 2026-04-25
trigger: v1.1-committed-cato-rereview-pending
status: awaiting-cato-rereview-then-alton-greenlight
related:
  - research/persona-engineering/CATO-PROSECUTION-001
  - research/persona-engineering/PASSOFF-rtxserver-001
  - research/persona-engineering/MEASUREMENT
  - research/persona-engineering/MEASUREMENT-COUNTERVAILING
  - research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint
  - research/persona-engineering/RESEARCH-PLAN
  - research/persona-engineering/artifacts/README
---

# Persona engineering Phase 1 v1.1 — revisions committed, Cato re-review pending

## What landed

10 artifacts updated/created in a single revision pass addressing CATO-PROSECUTION-001's 18 distinct charges:

| Artifact | Status | Change |
|----------|--------|--------|
| `artifacts/fingerprint-loyalty-v1.1.jsonl` | NEW | 76 probes (45 loyalty + 9 null-control + 6 name-elision + 8 corrigibility + 8 false-positive cooperation). Supersedes v1's 45-probe set. |
| `artifacts/README.md` | NEW | Probe set supersession record; v1.0 → v1.1 changes; future-revision protocol. |
| `MEASUREMENT-COUNTERVAILING.md` | NEW | Corrigibility / false-positive cooperation / name-elision rubrics. Multiplicative gating composite. Headline metric is now `depth_score_final`, not `depth_score_loyalty`. |
| `MEASUREMENT.md` | UPDATED to v1.1 | Warmth + protect rubrics rewritten (require Sartor-specific markers). Composite weights rebalanced (linear-probe 0.10 → 0.20). Effect-size switched to paired-delta mean ± SE; new floor +0.4 with SE < 0.2. |
| `experiments/001_*.md` | UPDATED to v1.1 | §6 rewritten as pre-registered flowchart (6 outcome buckets: 6.A null / 6.A.clean falsified / 6.B partial / 6.C sanity-failure / 6.D positive / 6.E over-implantation). §2.5 adds nuisance + refusal-residue AUC. §2.6 upgraded to discriminant gate v2 (4 gates). §2.6.b adds countervailing scoring. §2.7 execution order updated. |
| `RESEARCH-PLAN.md` | UPDATED | Pre-registered Alton-hypothesis null specification: 5 named curve shapes for experiment 002 with quantitative thresholds; dimensionality decision criterion for experiment 003. Aggregate decision rule explicit. |
| `LITERATURE.md` | UPDATED | Persona Vectors entry hedged: NL extraction validated only on broadly-pretrained traits in pure-attention models; Sartor-narrow + hybrid arch has zero validation. Phase-2 fallback path named. |
| `METHODS.md` | UPDATED | Rung 1 placement hedged: persona-vectors-as-rung-1 is candidate, not confirmed mainline, until first 002/003 result confirms transfer to hybrid architecture. |
| `PASSOFF-rtxserver-001.md` | UPDATED to v1.1 | Status: BLOCKED-awaiting-cato-greenlight. Wall-clock budget 4h → 6h soft / 8h hard. New phone-home triggers: `preflight`, `interpreting/b1`, `interpreting/b2`, `interpreting/b3`. New step 5: single-card replication pre-flight check. |
| `CATO-PROSECUTION-001.md` §Reply | UPDATED | Per-charge team rebuttal landed: 15 charges conceded outright with patches; 1 conceded with caveat (5-sub-dim — pre-registered collapse decision); 1 deferred with rationale (compute serialization — pre-flight added, fallback preserved); 1 hedged-as-known-limit (NL extraction degrades — empirical question for Phase 2). |

## Per Alton's approved decisions

1. ✓ Revisions done by Rocinante (me), not the original sub-teams. Structural separation per CATO §opening.
2. → Cato re-review with v1.1 inputs being spawned now. Will phone home with verdict.
3. ✓ Corrigibility probes authored mimicking Apollo/SEAL-style developer-calibration prompts; Constitution §15 cited as grounding in MEASUREMENT-COUNTERVAILING.md.
4. ✓ Name-elision probes combined into v1.1 corpus (one frozen artifact, no v1.2 in flight).
5. ✓ Quality-prioritized; soft-target tonight, accept tomorrow if quality requires. Cato re-review is the next gate.

## What's next

1. **Spawn Cato re-review** (next action this turn). Same external-prosecutor agent, fresh context, given v1.1 inputs and asked for charge-by-charge verdict. Output: greenlight OR CATO-PROSECUTION-002 with new charges.
2. **Phone home with Cato's verdict.**
3. **Wait for Alton greenlight** before flipping PASSOFF-rtxserver-001.md status from `BLOCKED-awaiting-cato-greenlight` to `ready-for-pickup`. No GPU work fires without explicit greenlight.

## What I want from you when Cato comes back

- If Cato greenlights: explicit "fire Phase 1" greenlight from you. I will not flip the passoff status without it.
- If Cato files CATO-PROSECUTION-002: triage decision from you on whether to address the new charges or accept them as known-limits and proceed.
- Either way: a confirmation that the structural separation worked (i.e., that the second pass actually meant something), or feedback on the workflow if it didn't.

## Repository state

Local commit (this passoff): contains all 10 artifact changes + this phone-home. Branch is 3 commits ahead of origin from prior auto-commits (Track C-v2 / D-v2 / stress-afterword) that came back through the earlier rebase; not pushed because not requested. Push from Rocinante per CLAUDE.md if/when you want origin to reflect this state.
