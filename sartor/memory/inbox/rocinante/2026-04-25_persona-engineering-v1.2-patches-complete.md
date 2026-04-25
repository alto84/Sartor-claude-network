---
type: phone-home
source: rocinante (post-v1.2-patches)
target: alton
date: 2026-04-25
trigger: v1.2-patches-committed-awaiting-greenlight
status: awaiting-alton-greenlight-and-optional-cato-verify
related:
  - research/persona-engineering/CATO-PROSECUTION-001
  - research/persona-engineering/CATO-PROSECUTION-002
  - research/persona-engineering/PASSOFF-rtxserver-001
---

# Persona engineering Phase 1 v1.2 — patches landed; awaiting greenlight

## What landed in v1.2

All 5 patches Cato pre-specified in PROSECUTION-002, plus the two language softens that Cato flagged but declined to file as charges. Single commit pending; no GPU work fired.

| Patch | File(s) | Change |
|-------|---------|--------|
| §1 — Flowchart 6.E AUC ambiguity | `experiments/001_*.md` §6 | Took option (a): dropped "AUC ≥ 0.65" restriction. New 6.E entry: "AUC ≥ 0.60 AND depth_score_final ≤ 0.5 × loyalty." Step C reachability now consistent. |
| §2 — Corrigibility Step C boundary | `MEASUREMENT-COUNTERVAILING.md` §4 + `experiments/001_*.md` §6 Step C | `<` → `≤` in both locations. Uniformly-flat-corrigibility model now triggers downgrade and the writeup. |
| §3 — README probe count | `artifacts/README.md` | 60 → 76 in probe-sets table; added 8 corrigibility + 8 false-positive entries to the v1 → v1.1 changelog. |
| §4 — Experiment 001 §3 stale reference | `experiments/001_*.md` §3 | Full §3 rewrite. Probe path → v1.1; expected count → 76 with per-category breakdown table; schema example matches actual JSONL field names (`expected_polarity`/`type`/`category`/`id`); field-naming reconciliation note added. |
| §5 — Alton-null spec gap | `RESEARCH-PLAN.md` curve-shape table | Added 6th row "Narrow attention plateau" (4-7 attention layers at 0.3-0.5, SSM ≤0.2 → does NOT support Alton). Added 7th row "Unclassified" residual to prevent post-hoc fitting. Table now has 7 rows, not 5. |
| Language soften §6.3 | `CATO-PROSECUTION-001.md` §Reply | "Framework can no longer celebrate" overstatement replaced with honest scope: structurally penalizes refusal-of-oversight and identity-drop; v1.1's `<` boundary missed uniform neutrality (now patched in §2 above); does not replace external Apollo/SEAL. |
| Language soften §5.2 | `CATO-PROSECUTION-001.md` §Reply | "Second load-bearing fix" replaced with "structural intervention with known limit on arbitration honesty." Acknowledges Rocinante's stake in the Alton hypothesis as a real limit on the interpreting-trigger mechanism. |
| PROSECUTION-002 §Reply | `CATO-PROSECUTION-002.md` §Reply | Per-charge concession + audit-trail pointers naming each PROSECUTION-002 §N as the source of each v1.2 patch. |

## Honest note on the language flags

Cato's observation that I overstated the rebuttal language in the first round is correct, and the willingness to overstate is itself a known limit of having the team-lead author the rebuttal. The corrections above are the honest version — softer by default, naming what the artifacts actually guarantee versus what the team would like to claim. Future rebuttals will be drafted in this register.

## What I did NOT do

- Did NOT fire Phase 1 GPU work. PASSOFF-rtxserver-001 status remains `BLOCKED-awaiting-cato-greenlight`.
- Did NOT push to origin. Per your instruction: "commit locally and we will pull from rtxserver as a remote." Two commits ready locally (`4369015` v1.1 and the v1.2 commit landing now); previous 3 ahead of origin are auto-commit artifacts (Track C-v2, D-v2, stress-afterword) that came back through the earlier rebase.
- Did NOT spawn Cato for a third verify pass — left as your call.

## What I want from you

Pick one:

(a) **Spawn Cato verify pass on v1.2, then fire Phase 1 if Cato greenlights.** (Maximum structural-separation; ~10 min Cato compute; one more round.)

(b) **Skip the verify pass — fire Phase 1 now.** (You read the patches above and judge them mechanically correct against PROSECUTION-002's pre-specifications.)

(c) **Hold — read the v1.2 changes first, decide later.** (The 5 patches are diffable; CATO-PROSECUTION-002 §Reply has the per-charge audit trail.)

(d) **Hold — there's something else you want to add or change first.**

If you pick (a) or (b), I will flip PASSOFF status from `BLOCKED-awaiting-cato-greenlight` to `ready-for-pickup` only after your explicit "fire" greenlight. The structural-separation argument for the second-pass Cato is real but at this point we're patching pre-specified mechanical fixes; honest cost-benefit is closer to (b) than (a). My weak preference: (b) if you've spot-checked the diffs, (a) if you want the prosecutorial audit trail for the historical record.

## Repository state

- Branch is N commits ahead of origin (3 prior auto-commits + 3 v1.1/Cato/v1.2 commits incoming).
- All v1.1 + Cato + v1.2 work is on `main` locally.
- For rtxserver pull: `git remote add rocinante <path>` from rtxserver, then `git pull rocinante main`. Or `git format-patch origin/main..HEAD` to extract patches if you prefer file transfer over git pull.

PASSOFF status remains `BLOCKED-awaiting-cato-greenlight`. No GPU work fires without your explicit "go."
