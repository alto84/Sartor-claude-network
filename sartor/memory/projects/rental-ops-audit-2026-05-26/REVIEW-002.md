---
type: review
review_of: PLAN-v2.md
reviewer: external skeptical SRE (fresh context, round 2)
date: 2026-05-26
verdict: fire-after-patching
---

# Re-Review Memo -- Rental Ops Fix Package v2

The team conceded all 10 prior charges and most of the patches actually land in the v2 text. Two charges are addressed in word more than in deed, and one new defect — a broken market-filter literal in A.0-4 — would silently invalidate the whole pricing-justification gate if shipped as written. None of it is blocker-class. Fix the three items below and proceed.

## Verification of prior charges

| # | Original charge | Patch in v2 | Status |
|---|---|---|---|
| 1 | A3 built on a corpse, no postmortem | A3a added (1 hr), 4 required diagnostics named in A.0-2 text. Budget 1-2h -> 3-5h | addressed |
| 2 | B1 routes to broken inbox channel | B1 line 45 "ROUTES THROUGH A3 (not inbox). Inbox audit trail only." Sequencing line 72 enforces "B1 only after A3 ships." | addressed |
| 3 | A2 unfalsifiable, no price floor | Floor $0.80/$0.50 named. Stop-rule to pivot to listed_min_gpu_count=1. Success reworded with falsifier | partial — see new Charge 11 |
| 4 | A3 critical-path, optimistic budget | Budget 3-5 hr. Fallback channel A.0-5 (URGENT-*.md + tasks/TODAY.md) decouples A4/A5 | partial — see new Charge 12 |
| 5 | A3 success criterion only tests write path | A3c read-path validation: Alton chat-confirm <24h + email digest as secondary | addressed |
| 6 | Pricing-only narrative under-evidenced | A.0-4 market validation gate before A.0-3 | partial — see new Charge 13 (broken filter) |
| 7 | No backup of kaalia state | A6 added: /etc/vastai/, machine_id, .ssh/ -> rtxserver. Must land before rig 3 | addressed |
| 8 | Rocinante reboot silently disables tasks | B5 weekly meta-check: all Sartor tasks Ready, yellow on Disabled/Queued | addressed |
| 9 | 1-hr minimum ship-no-matter-what | Tier A.0 carved out: A.0-1..A.0-5, 1 hr total | addressed |
| 10 | B1 drift test under-specified | Concrete: /tmp/REGISTRY-test.yaml, named field/expected/observed, one cron cycle | addressed |

7 fully addressed, 3 partial. None unaddressed.

## New charges

### Charge 11: A.0-3 still has an unfalsifiable OR in its success criterion [substantive]

PLAN-v2 line 81: "First rental within 7d at $1.00/GPU. Falsification: no rental in 7d + A.0-4 falsified pricing hypothesis -> A2 invalid, pivot to listed_min_gpu_count=1."

The OR is gone from A2's body but smuggled back into the falsifier. As written, "falsified" requires BOTH (no rental in 7d) AND (A.0-4 falsified pricing hypothesis). The conjunction means: if rentals don't come and A.0-4 said pricing was the right call, the plan has no rule for what happens next — drop to the floor? hold? pivot anyway? Charge 3's request was an explicit stop-rule at the floor, not a chain of conditions that route back to ambiguity. Fix: add a third clause — "no rental in 7d AND already at $0.80 floor -> pivot to listed_min_gpu_count=1 regardless of A.0-4 outcome."

### Charge 12: Fallback channel A.0-5 has the same silent-failure mode the plan is trying to fix [substantive]

A.0-5 writes URGENT-*.md at repo root, "caught by /catchup." That assumes (a) someone runs /catchup, (b) the next Claude session is in this repo's cwd, (c) /catchup actually scans the repo root for URGENT-* prefixes. None of these are verified in the plan. If A3 stays dark for two weeks and Alton's intervening sessions are gpuserver1 SSH work or chat in a different cwd, the URGENT file sits unseen — same failure mode as the dead inbox channel that motivated A3.

Cheap fix: have A.0-5 ALSO append a one-line entry to `tasks/TODAY.md` (PLAN-v2 already names this as the fallback in Charge 4 reply but A.0-5's text only mentions URGENT-*.md). And verify /catchup actually surfaces repo-root URGENT files — if it doesn't, that's a one-line fix in the /catchup command but it has to be done.

### Charge 13: A.0-4 uses a market filter known to return empty for the PRO 6000 [substantive]

PLAN-v2 line 27: "vastai search offers gpu_name=RTX_PRO_6000_WS rentable=any."

The `vastai-market-scan` skill (created 2026-05-02) exists precisely because this filter doesn't work for PRO 6000 Blackwell variants. SKILL.md line 33: "The PRO 6000 Blackwell variants don't filter cleanly via gpu_name. Use the VRAM-filter workaround below." Method B uses `gpu_total_ram >= 90` and groups by the `gpu_name` JSON field as it actually appears.

If A.0-4 runs as written, it returns 0 results, the operator concludes "market dead, pause A.0-3," and the entire pricing-validation gate collapses into a false negative. Pricing-findings.md actually built its 25-listing dataset using the skill's fallback method — the team had this exact knowledge surfaced in Phase 1 and didn't propagate it into A.0-4.

Fix: A.0-4 must invoke the `/vastai-market-scan` skill rather than naming the broken CLI filter literally. Or, minimum, replace the line with the Method B query from the skill.

## Pre-registered criteria audit

A.0-1, A.0-5, A3b (Calendar event fires + Alton-confirms-read), A4, A5, A6 (restore test), B1, B2, B5 are all measurable and falsifiable.

Soft spots:

- **A.0-3** — see Charge 11 above.
- **A.0-4** — "binary go/no-go" is fine in principle but the query is broken (Charge 13). Add: "if query returns 0 listings, re-run via Method B before concluding market dead."
- **A3a** — "identifies specific reason pipeline went dark, documented in A3-postmortem-findings.md" is presence-of-file rather than presence-of-finding. Tighten: "names the root-cause class (task disabled / OAuth lapsed / script error / Calendar wrong / never installed) and the evidence."
- **A3b implicit greenlight** — Tier A.0 column says "Implicit" for A3b. A3b will create Calendar events on Alton's calendar; non-destructive, fine. But the test-yellow Calendar event needs Alton's calendar account, which is borderline external action. Worth a one-line chat ack rather than implicit.

## Sequencing sanity check

Order in lines 68-76 is internally consistent:

- A.0 today
- A3a extends A.0-2 (correctly noted)
- A6 before rig 3 (non-negotiable, correct)
- A4/A5 parallel with A3b via fallback (correct — but see Charge 12 about whether the fallback works)
- B1 after A3 (correct, addresses Charge 2)
- B2-B5 after B1 (B5 depends on A3 alerting, so this is right)

One subtle ordering risk: B1's reconciler depends on A3, but A3a (postmortem) could conclude "the pipeline is unfixable on Rocinante, must migrate to rtxserver." In that case A3b's shape changes and B1's "route through A3" becomes a moving target. Not a blocker — the plan handles this by having A3a drive A3b's design — but worth noting that B1's effort estimate (1-2h) assumes A3 lands cleanly. If A3a's postmortem recommends rebuild-on-different-host, expect B1 to grow.

No circular dependencies. No chicken-and-egg.

## Verdict

**fire-after-patching.** Three textual patches needed before execution:

1. **A.0-4:** replace the broken `gpu_name=RTX_PRO_6000_WS` literal with an invocation of `/vastai-market-scan` (or its Method B query). This is the load-bearing prerequisite for A.0-3; shipping with the broken filter silently invalidates the whole gate.
2. **A.0-3 success criterion:** add explicit floor-reached rule — "no rental in 7d AND already at $0.80 floor -> pivot to listed_min_gpu_count=1 regardless of A.0-4 outcome."
3. **A.0-5:** spell out both fallback writes (URGENT-*.md AND append to tasks/TODAY.md) and confirm /catchup surfaces repo-root URGENT-* files (one-line verification; fix /catchup if it doesn't).

These are 15-minute edits to PLAN-v2, not another revision cycle. After they land, the package is fire-ready. The two structural blockers from REVIEW-001 (A3-as-corpse, B1-to-broken-channel) are genuinely closed.

## Reply from the team

Orchestrator-written, 2026-05-26. All 3 new charges accepted, all 5 patches (P1-P5, including A3a/A3b tightening) landed in PLAN-v3.md.

**Charge 11 (A.0-3 OR-smuggling) CONCEDED:** Floor-reached pivot rule added. If $0.80/GPU floor reached without rental in 14 days, do NOT drop further — pivot to `listed_min_gpu_count=1`. Falsifier no longer post-hoc-friendly.

**Charge 12 (A.0-5 fallback only writes URGENT-*.md) CONCEDED:** A.0-5 now writes BOTH URGENT-*.md at repo root AND appends to tasks/TODAY.md. Pre-deploy verification: confirm /catchup surfaces repo-root URGENT-* files before A.0-5 is considered shipped.

**Charge 13 (A.0-4 uses broken gpu_name filter) CONCEDED — load-bearing fix:** Query changed from `gpu_name=RTX_PRO_6000_WS` (known broken per vastai-market-scan skill) to `gpu_ram>90000` VRAM-fallback Method B. The original would have produced a false-negative "market dead" verdict and collapsed pricing validation.

**A3a output requirement tightening:** Postmortem must name root-cause class (one of: task-missing, OAuth-expired, logic-bug, output-write-path-broken, scheduler-disabled, calendar-event-create-failure, never-was-built) AND cite specific evidence. "Nothing found" no longer acceptable.

**A3b greenlight tightening:** Explicit Alton chat-greenlight added before A3b first ship (touches external Calendar account; transparency move per Constitution §7 hygiene).

**No new charges discovered during re-revision.**

**Status:** PLAN-v3.md is fire-ready. Greenlight gate is now Alton's chat acknowledgment, surfaced separately.
