---
type: review
review_of: PLAN.md v1
reviewer: external skeptical SRE
date: 2026-05-26
verdict: revise
---

# Prosecution Memo -- Rental Ops Fix Package v1

The team did good work surfacing the doc/live drift and the dead alerting channel. The plan has structural problems that will reproduce the exact failure mode it's trying to fix. Charges below are ordered by severity.

## Charges

### Charge 1: A3 is built on a corpse, not investigated as one [blocker]

PLAN.md line 41 says "Build `daily-household-health` scheduled task that CLAUDE.md describes but doesn't exist." That framing is wrong and dangerous. The skill exists at `.claude/skills/daily-household-health/SKILL.md`. The scheduled-task definition exists at `.claude/scheduled-tasks/daily-household-health/`. CLAUDE.md lists it as a daily 5:30 ET task. **What does not exist is any `health-*.md` artifact in `sartor/memory/daily/` for 2026-05.** The directory has `2026-05-17.md` through `2026-05-25.md` (Rocinante-side daily summaries) but zero `health-*` files going back as far as the directory's history.

That means the pipeline was built, was supposed to be running, and is silently failing. Building it again, without doing the postmortem on why the prior build went dark, gets you a second dead pipeline. The plan reads as "we'll write the thing," not "we'll find out why the thing that already exists isn't producing output."

**Required before A3 ships:** (a) run the skill manually end-to-end today and capture exit code + stderr; (b) inspect the Windows Scheduled Task history for the last 7 days — last run, last result code, was it disabled, did it OOM; (c) confirm the Google Calendar OAuth scope hasn't lapsed (calendar event creation through the MCP can fail with stale tokens and a 200-ish response); (d) confirm Alton actually opens the calendar he'd be pinged on. Without these four, A3 fires-and-forgets into the same void.

### Charge 2: B1 reroutes alerts to the channel that's already broken [blocker]

PLAN.md line 49 says B1 writes drift detections to "inbox on drift." The entire reason A3 exists is that the inbox is a write-only-from-Claude's-perspective channel — the curator drains it nightly but nobody reads it in real time. The tooling-findings agent said this explicitly (line 39: "Calendar-ping channel for fleet anomalies is dead"). So B1, as designed, is "detect drift fast, route to silent channel." That's not closing the loop. That's adding a sensor to a disconnected siren.

B1 must depend on A3 (or whatever escalation channel survives A3's postmortem) and route through it for drift severity ≥ yellow. The inbox can remain the audit trail; it cannot be the alert channel. Otherwise the post-mortem in six months reads identical to today's: "we had a script that detected the problem; nobody saw it."

### Charge 3: A2 success criterion is unfalsifiable and the price floor is undefined [substantive]

PLAN.md line 87: "Rental within 7 days, OR Alton accepts 'no rental in 7d -> drop another 10%'." The OR makes this unfalsifiable — any outcome where Alton chats with Claude qualifies as success. And the criterion has no floor: a chain of 10% drops from $1.00/GPU gets you to $0.66 in three iterations, $0.43 in seven. The pricing-findings agent explicitly noted the cold-start dynamic (score 130.2 partly reflects zero rental history), so further price drops may not move the needle while score is the binding constraint.

The premise check the user asked for matters here. The pricing analyst named three stacked failure modes — overpricing, niche market, cold-start. The plan treats this as 100% pricing. Falsifying evidence would be: a competing dual-RTX-PRO-6000 listing at $2.00 total that ALSO isn't getting rentals (cold-start dominates), or a single-RTX-PRO-6000 listing at $1.20 that IS renting (niche has demand but multi-GPU minimum is the blocker — in which case lowering `listed_min_gpu_count` from 2 to 1 is the fix, not price). The plan dispatches none of this validation; it commits the money first.

**Required:** (a) set an explicit floor — "no further drops below $0.80/GPU without revisiting whether multi-GPU minimum is the binding constraint"; (b) before second drop, check at least one comparable listing's recent rental activity to test the cold-start vs price hypothesis; (c) reword success as "rental within 7d at $1.00" — falsifiable, not OR'd into trivial truth.

### Charge 4: A3 is on the critical path and budgeted optimistically [substantive]

PLAN.md line 76: "A3 first. Without alerting pipeline, every other monitor is silent." Estimated 1-2 hr. Given Charge 1 — the prior build is dead and the postmortem isn't scoped — 1-2 hr is the optimistic-case estimate for a clean build, not for a build + dead-pipeline diagnosis + OAuth check + Calendar-actually-read confirmation. Realistic range is 3-5 hr.

A4 and A5 do not require A3 to be functional — they require *an* escalation channel. Make A4/A5 parallelizable by routing them to a fallback channel (e.g., a `URGENT-` prefixed file at repo root that the next Claude session will catch on startup, or appending to `tasks/TODAY.md`). That decouples Tier A from A3's risk. As written, an A3 slip blocks the entire Tier A delivery.

### Charge 5: A3 success criterion is too weak [substantive]

PLAN.md line 88: "test yellow event produces Calendar event." That tests the write path. It does not test the read path. The whole point of A3 is to close the human-feedback loop. A real success criterion includes: Alton confirms he saw the calendar event in his normal workflow within 24h, OR there is a verifiable secondary path (mobile notification, email digest) that fires alongside. Without that, you've tested that the skill writes to a calendar that may or may not be in Alton's daily glance.

### Charge 6: Premise check — pricing-only narrative is under-evidenced [substantive]

The plan accepts the pricing analyst's diagnosis but the analyst's own report named cold-start and niche as co-factors. Falsifiers the plan should have demanded before committing to the $1.00/GPU change: (a) does machine 37777 at $2.64 ($1.32/GPU, score 228.9) get rentals? If yes, price-per-score is the binding constraint and the right fix is to push score up via verification work, not just drop price. (b) Of the 25 RTX PRO 6000 WS listings, how many show non-zero `current_rentals_running`? If <5, the market itself isn't moving and no price will help short-term. The plan should require this single CLI query before A2 fires.

### Charge 7: No off-site backup of listing config / no recovery-from-machine-loss [substantive]

The audit asked about systemic issues; this one isn't surfaced anywhere. If rtxserver's boot drive dies tomorrow, the kaalia config (machine_id, certs, listing parameters) needs to be reconstructable. There's no mention of backing up `/etc/vastai/`, `/var/lib/vastai/`, or whatever kaalia persists. The team is about to onboard rig 3 — three hosts and zero recovery procedure is a Tier-A gap, not out-of-scope.

### Charge 8: Hidden assumption — Rocinante never reboots [substantive]

A3 lives on Rocinante (Windows Scheduled Task). The CLAUDE.md scheduled-task list shows multiple `Sartor *` Windows tasks. None of them have a documented "verify still enabled after reboot" check. A Windows update or a Sartor user-profile event can disable scheduled tasks silently. The plan should add a meta-check: a weekly job that asserts every named scheduled task is `Ready` (not `Disabled`) and files yellow if not. Otherwise the alerting backbone has a single point of failure equal to "Windows did something."

### Charge 9: Over-engineering check — Tier A could be 1 hour and still capture most of the value [minor]

If forced to ship in 1 hour: A1 (2 min) + A2 with explicit floor and stop-rule (10 min) + one-line cron addition to existing `stale-detect.sh` that writes a file named `URGENT-rtxserver-idle-NNh.md` at repo root every 24h while idle (15 min) + manual diagnosis of why A3 is dark (30 min). That captures the rtxserver-specific failure. Everything else is structural and can wait a session. The 9.5h package is correctly scoped *if* it actually ships; the risk is that it doesn't, and meanwhile rtxserver continues at $0. Recommend an explicit Tier A.0 = "ship the 1-hour fix today, do the rest properly next session."

### Charge 10: B1 reconciler's "deliberately-introduced drift" test is under-specified [minor]

Success criterion (line 91) doesn't say what drift, where, how detected, or who confirms. Make it concrete: "Change `vast_ai_machine_id` in a test copy of REGISTRY.yaml to a known-wrong value, run reconciler, assert it produces an alert routed through A3 within one cron cycle." Otherwise this is post-hoc-friendly.

## Verdict

**Revise.** The diagnosis is mostly right and the priority ordering (alerting first) is correct. Two things must change before this is fire-ready:

1. **A3 must be reframed as a postmortem-plus-rebuild, not a fresh build** (Charge 1). Until you know why the existing pipeline is dark, rebuilding it is theatre.
2. **B1 must route through A3, not back to the inbox** (Charge 2). Otherwise the structural fix reproduces the structural failure.

Strongly recommended (not blockers but cheap wins):

3. Parallelize A4/A5 with a fallback channel so A3 slip doesn't gate Tier A (Charge 4).
4. Set a price floor and a single market-validation query before A2 (Charges 3 + 6).
5. Add a Tier A.0 one-hour minimal package to ship today regardless of plan slip (Charge 9).
6. Add backup/recovery for kaalia state before rig 3 onboards (Charge 7).
7. Add scheduled-task-still-enabled meta-check (Charge 8).

Re-review the revised plan before greenlight. The 9.5h investment is justified iff the alerting backbone actually closes the loop — which is precisely the open question Charge 1 raises.

## Reply from the team

Orchestrator-written, 2026-05-26. All 10 charges accepted, none contested. Patches landed in PLAN-v2.md.

**Charge 1 (A3 corpse) BLOCKER -- CONCEDED:** A3 restructured as A3a (postmortem) + A3b (build/fix based on findings) + A3c (read-path validation with Alton). Budget revised 1-2 hr -> 3-5 hr. A3a includes the four required diagnostics: manual e2e run with exit code, Win Scheduled Task history (7d), Calendar OAuth scope test, Alton chat-confirmation of target calendar usage.

**Charge 2 (B1 reroutes to broken channel) BLOCKER -- CONCEDED:** B1 now depends on A3 completion. For severity >= yellow, B1 routes through A3 alerting channel. Inbox remains audit trail only. Reordered: B1 cannot ship until A3 ships.

**Charge 3 (A2 unfalsifiable + no floor) CONCEDED:** Explicit floor added: $0.80/GPU on-demand, $0.50/GPU interruptible. Stop rule: no further drops below floor without revisiting whether multi-GPU minimum is binding (lower listed_min_gpu_count from 2 to 1 instead). Success reworded: rental within 7d at $1.00/GPU, OR market validation per Charge 6 falsifies pricing hypothesis.

**Charge 4 (A3 critical path + optimistic budget) CONCEDED:** Budget revised 3-5 hr. A4/A5 decoupled via fallback channel: URGENT-*.md at repo root (caught by /catchup) + append to tasks/TODAY.md. A4/A5 can ship in parallel with A3 postmortem.

**Charge 5 (A3 success criterion too weak) CONCEDED:** Read-path validation added. After A3 fires first yellow, Alton must confirm in chat within 24h that he saw the calendar event in his normal workflow. Secondary path also required: email digest as backup.

**Charge 6 (premise check under-evidenced) CONCEDED:** Pre-A2 market validation gate added as A2-prereq (A.0-4): query vastai search offers gpu_name=RTX_PRO_6000_WS rentable=any. If 0 listings have active rentals at any price -> market dead, pause A2, pivot to listed_min_gpu_count=1. If single-GPU PRO 6000 is renting at $1.20+ -> multi-GPU minimum is binding, not price.

**Charge 7 (no backup of kaalia state) CONCEDED:** Added A6: daily backup of /etc/vastai/, /var/lib/vastai_kaalia/machine_id, /var/lib/vastai_kaalia/.ssh/ from each host to rtxserver via existing off-site backup pattern. Must land before rig 3 onboarding.

**Charge 8 (Rocinante reboot disables tasks) CONCEDED:** Added B5: weekly meta-check that all Sartor Windows scheduled tasks remain Ready. File yellow on Disabled/Queued. Closes single-point-of-failure.

**Charge 9 (Tier A.0 1-hour minimum) EXTEND -- ACCEPTED:** Reorganized as Tier A.0 (ship today, 1 hr) + Tier A (next session) + Tier B/C/D. A.0 captures rtxserver failure regardless of plan-slip. 9.5h package is structural fix; A.0 is bandage that keeps wound from bleeding.

**Charge 10 (B1 drift test under-specified) CONCEDED:** Concrete success criterion: change vast_ai_machine_id in /tmp/REGISTRY-test.yaml copy, point reconciler at test path, assert reconciler produces drift alert routed through A3 within one cron cycle (24h max). Alert must name the diff specifically: field, expected, observed.

**No new charges discovered during revision.**

**Next step:** Re-review of PLAN-v2.md by fresh reviewer (same persona, new context) per Phase 6.
