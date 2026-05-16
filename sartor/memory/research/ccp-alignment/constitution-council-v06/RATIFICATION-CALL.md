---
type: ratification-call
project: constitution-council-v06
constitution_version_in: 0.5 (currently canonical)
constitution_version_out: 0.6 (proposed)
date: 2026-05-13
prepared_by: rtxserver peer Claude (Opus 4.7)
addressed_to: Alton Sartor (and Aneeta Sartor for kid-bearing §7 clauses)
recommendation: ratify-with-modifications
related: [DIFF, OPEN_QUESTIONS, SYNTHESIS, reviews/, cross-reviews/]
---

# Ratification call — Constitution v0.6

## Summary line

Council of ten persona reviews + three cross-reviews recommends **ratify v0.6 with modifications**. Three of four deltas (§1, §14a, §16) are robust; the fourth (§7 sanctioned-cloud subsection) needs six clause-level modifications and a kid-bearing-routing gate that requires Aneeta's affirmation. No reviewer recommends hold of v0.6 entire.

## Vote summary per delta

| Delta | Plain ratify | Revise (clause-level) | Hold (structural) |
|-------|--------------|----------------------|--------------------|
| §1 life-OS substrate | **10 / 10** | 0 | 0 |
| §7 sanctioned-cloud subsection | 5 / 10 | 4 / 10 | 1 / 10 (constitutional-ai-method, on placement) |
| §14a self-paced peer loops | 8 / 10 | 2 / 10 (fiduciary, red-team cross-review extending) | 0 |
| §16 granted-vs-accumulated | **10 / 10** | 0 | 0 |

§14a clause-additions are mechanical (two specific clauses). §7 modifications are six clause-level additions plus one procedural gate; the §7 content is settled, the modifications harden gating and harmonize with existing §7 clauses.

## Three options for ratification

### Option A — Ratify v0.6 as-amended (council-recommended)

Accept the SYNTHESIS modifications. The amended v0.6 incorporates:

- §1 verbatim as proposed.
- §7 with six clause-level additions:
  1. Default-to-vault on ambiguous kid-bearing categories
  2. Clarify plain-tier-sync ≠ outbound-shareable to outside parties
  3. Transitional clause: vault categories out of project tree until vault exists
  4. Harmonize with existing §7 medical clause (sanctioned-clinical channels still permitted)
  5. Strengthen AZ work-product separation
  6. Kid-bearing routing gated on Aneeta's affirmation (effectively converts §7 amendment to two ratification clauses: Clause A non-kid-bearing ratifies with v0.6; Clause B kid-bearing holds pending dated Aneeta affirmation)
- §14a with two clause additions:
  1. Wiring grant does not authorize touching files under entity-financial, family-medical, or legal-document trees, AND wiring-fix commit messages must not reference paths under those trees regardless of which file the fix actually touches.
  2. Peer surfaces wiring-fix activity in next loop-report's anomalies-and-surfacings section.
- §16 verbatim as proposed.

If you choose Option A: Alton ratifies the v0.6-as-amended, Aneeta separately affirms the kid-bearing routing in Clause B (or the kid-bearing routing holds pending), four v0.7 follow-on notes (cap-at-quarter norm, §7 structural restructure, sanctioned-cloud re-review triggers, §14a substrate-change review) are recorded.

### Option B — Ratify v0.6 as-proposed, modifications as v0.6.1 follow-up

Ratify the v0.6.proposed text exactly as drafted on 2026-05-09. The SYNTHESIS modifications become a v0.6.1 amendment bundle to land within (e.g.) two weeks, with Aneeta's affirmation collected separately on the kid-bearing categories.

Trade-off: faster ratification of v0.6 baseline; the §7 hardening lands as follow-up rather than in-amendment. Risk: the v0.6.1 follow-up could slip indefinitely. Mitigation: write the v0.6.1 bundle as a single PR ready to merge before ratifying v0.6 baseline.

### Option C — Reject; request v0.7 cycle

Decline to ratify; request a v0.7 cycle that addresses (a) the §7 modifications and (b) the four v0.7 follow-on structural items together.

Trade-off: cleanest constitutional artifact at the end; postpones the Drive-sync question's Constitutional resolution by a quarter. The household has already operationally chosen plain-tier Drive sync, so this option creates a gap between operating practice and Constitutional sanction during the wait.

## Council-recommended option

**Option A.** Council vote is not unanimous (constitutional-ai-method's HOLD-on-§7 leans toward Option B; child-development and medical-ethicist's procedural recommendation explicitly aligns with Option A's two-clause-split for kid-bearing categories), but the convergence of the cross-reviews (mech-interp on constitutional-ai-method, medical-ethicist on child-development) lands on Option A as the operationally-best path.

## What you ratify by signing

If you choose Option A, your ratification act creates the canonical v0.6 file at `reference/HOUSEHOLD-CONSTITUTION.md` incorporating the modifications above, archives v0.5 to `reference/archive/HOUSEHOLD-CONSTITUTION-v0.5.md`, and records the ratification in `reference/CONSTITUTION-RATIFICATIONS/v0.6.md` with the council artifacts (this directory) as the attached record.

If you choose Option B, your ratification act creates the canonical v0.6 file from the proposed text as-drafted, archives v0.5, and creates an open `v0.6.1-followup` issue or memo containing the SYNTHESIS modifications.

If you choose Option C, no canonical file changes; v0.5 remains canonical; this council's artifacts become input to the v0.7 cycle.

## Aneeta's affirmation (required for kid-bearing §7 Clause B regardless of option)

The §7 amendment's kid-bearing routing (where diagnoses/prescriptions/counseling-notes vs biographical-detail-Calendar-already-carries goes) is named in the proposed text as provisional pending Aneeta's affirmation. The council recommends that this affirmation be a documented act, dated, with explicit acknowledgment of:

- The plain-tier categories for kids: names, schools, ages, day-to-day logistics as Calendar/Gmail already carry them.
- The vault-tier categories for kids: diagnoses, prescriptions, counseling notes, chart-entry-class material.
- The default-to-vault rule for ambiguous kid-bearing categories.

Aneeta's affirmation can land alongside Alton's ratification act, or as a separate signing within (e.g.) 14 days. Until both affirmations are in place, the kid-bearing routing operates under provisional-with-conservative-default per the SYNTHESIS modification #1.

## How to ratify

Edit-in-place is the household's existing pattern. Specifically:

1. Apply the §7 and §14a modifications to `reference/HOUSEHOLD-CONSTITUTION.v0.6.proposed.md` (or to a fresh file).
2. Move `reference/HOUSEHOLD-CONSTITUTION.md` (v0.5) to `reference/archive/HOUSEHOLD-CONSTITUTION-v0.5.md`.
3. Rename the modified v0.6 file to `reference/HOUSEHOLD-CONSTITUTION.md`, update frontmatter (`status: ratified`, `ratified_by_alton: 2026-05-DD`, `version: 0.6`).
4. Create `reference/CONSTITUTION-RATIFICATIONS/v0.6.md` with the ratification record + Aneeta's affirmation status + pointer to this council directory.
5. Commit with the message format the v0.5 ratification commit used; push to origin.

The council does not perform this act. You do. The artifacts here support your decision; the decision is yours.

## Council's net

v0.6 lands. The §7 amendment lands with hardening. The kid-bearing categories wait on Aneeta. v0.7 picks up four structural items in a future cycle no sooner than 2026-08-13 per the cap-at-one-amendment-per-quarter working norm.
