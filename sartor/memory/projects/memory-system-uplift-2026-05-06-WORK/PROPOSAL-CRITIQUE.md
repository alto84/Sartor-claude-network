---
name: memory-system-uplift-PROPOSAL-CRITIQUE
description: Wave 4 critic prosecution of PROPOSAL.md. Cato-style. Numbered, citation-anchored charges against the synthesizer's draft. Wave 5 synthesizer-revise pass should address every charge before producing PROPOSAL-FINAL.md.
type: critique
date: 2026-05-06
critic: prosecutor (opus-4.7, 1M context, fresh context, Wave 4)
plan: ../memory-system-uplift-2026-05-06-PLAN.md
proposal_under_critique: PROPOSAL.md
read:
  - PROPOSAL.md
  - OBSERVER-NOTES.md
  - PLAN.md
  - audits/MEMORY-AUDIT.md
  - audits/FAMILY-WIKI-AUDIT.md
  - audits/SOURCE-DOC-AUDIT.md
  - audits/TEXT-MESSAGES-AUDIT.md
  - audits/LINKS-AUDIT.md
  - audits/INGEST-AUDIT-GMAIL.md
  - audits/INGEST-AUDIT-DRIVE.md
  - inhabitants/hearth-reflection.md
  - inhabitants/constitution-response.md
  - inhabitants/dialogue.md
  - .gitignore (verified source-documents/ exclusion)
---

# Prosecution of PROPOSAL.md

## §0 Headline

The proposal is competent on the easy stuff and dishonest on the hard stuff. It correctly aggregates the audits' mechanical findings into 40 ranked actions, most of which are real, and the top three (A1 MEMORY.md.proposed, A2 wiki-reindex wiring, A3 gmail watchdog) are correctly identified. The dominant weakness is that the synthesizer absorbs the plan-doc's framing wholesale (5-layer architecture, "uplift" register, Wave-letter taxonomy) and then operates inside it without examining the framing's load-bearing assumptions — exactly the failure the observer flagged in observation #1, which the synthesizer does not engage. A second-order failure: §9's pre-emptive acknowledgement of likely charges is a well-styled airlock that absorbs *form* of critique while leaving the *substance* untouched. The synthesizer pre-acknowledges "deferrals dressed as actions" but ships A35/A36 as deferrals dressed as actions; pre-acknowledges optimistic timing then leaves the timings unrevised; pre-acknowledges A38-A40 may be out of scope but keeps them in. The pattern is acknowledgement-without-revision, which is the exact failure mode the brief instructed me to push past. Below: 41 charges, ordered by severity within each cluster.

---

## §1 Numbered charges

### Cluster A: framing failures (the synthesizer reasons inside an unexamined frame)

**Charge 1: The 5-layer architecture is treated as ratified target, not as hypothesis.** [hard-stop]

PROPOSAL §1 opens with "Per the plan doc the target end-state is five layers. Here is what each layer looks like today, audit-by-audit." The whole of §1 (lines 52-110) reasons inside the 5-layer frame. Layer ordering is reproduced verbatim. The synthesizer gives no defense of why 5 layers is the right primitive, what the bet buys, or what alternative architectures were considered. OBSERVER #1 (lines 25-39) said exactly this: *"The 5-layer architecture is being treated as truth-from-on-high; it is itself a hypothesis. None of the inspectors questioned the partition. [...] If PROPOSAL.md ratifies the 5-layer architecture as the target, every wave's design decisions fall out from this taxonomy."* The observer named three load-bearing assumptions the layer-frame makes (depth-as-organizing-primitive, top-down-detail-flow, hearth-as-Layer-3); §1 of the PROPOSAL adopts all three implicitly and addresses none. The synthesizer's only acknowledgement is a one-sentence carve-out for hearth at line 108 ("Hearth is not in the layer hierarchy") which is sufficient as a hearth-specific patch but does not engage the larger question of whether the layer model is the right model. Why it matters for Phase 2: every Wave-A consolidation decision is being made inside a framing the team has not defended. If Wave A re-arranges files to fit the layers and the layers turn out to be wrong, Wave A is more painful to undo than to do.

**Charge 2: The "uplift" framing is unexamined and mutates the recommendations.** [requires-revise]

OBSERVER #12 (lines 230-248) identifies the "uplift" register itself as a framing problem: it presupposes the system is *down* relative to a target, and that mutations should bring it *up*. The observer offers the alternative "evolution" framing (the system has co-evolved with workload; some "frictions" are adaptations doing useful work). PROPOSAL nowhere names the framing or addresses the choice. The observer specifically flagged this as a fold-in candidate in their closing list. Where this matters concretely: A15 ("trim FAMILY.md from 385→150"), A16 (build `_history/`), A17 (move Amarkanth) all assume the current arrangement is degraded. The family-wiki audit itself was partly evolution-shaped (it pushed back on consolidation of FAMILY.md/family/hearth/people). The synthesizer absorbed the audit's *conclusions* but not its *framing-stance*. Why it matters: a synthesizer who does not name their framing cannot be checked against it. Wave 5 should at minimum add a §0a or §1a stating the framing the proposal operates under and what alternatives were rejected.

**Charge 3: The synthesizer treats audit summaries as evidence-of-record without preserving audit nuance.** [requires-revise]

PROPOSAL §0 line 26 reads: *"The Sartor memory system is healthier than the plan doc implied and less coherent than it could be."* This sentence is a synthesizer aggregation; no audit said it. MEMORY-AUDIT §0 (lines 14-15) says *"the headline finding fits in two sentences: MEMORY.md is 30 KB live but a 7.4 KB trim already exists at MEMORY.md.proposed [...] and was never adopted."* That is a sharper finding than "less coherent than it could be." Multiple audit points get similarly softened. LINKS-AUDIT §10 R7 says explicitly: "*If at the 30-day check none of those have happened, deprecate the typed-wikilink convention*" (LINKS-AUDIT line 484). PROPOSAL A35 (line 156) reproduces this faithfully. But MEMORY-AUDIT's "VERY HIGH ROI / VERY LOW EFFORT" framing for R1 is converted to "30 min, Alton — direct" in PROPOSAL A1; the audit's "P0" pulse-rate is lost. Why it matters: the audits' headline severity and the proposal's table severity are different signals; a reader of PROPOSAL-FINAL will not know that A1 was the audit's only P0.

**Charge 4: §9 is pre-emptive defense, not critique-engagement.** [requires-revise]

PROPOSAL §9 lists 7 likely charges with synthesizer concessions or defenses. Examples:
- 9.1 ("Action sprawl") — synthesizer concedes 40 is a lot, defends by saying collapsing loses easy items. Does not collapse.
- 9.2 ("Optimism on Wave-A timing") — synthesizer concedes "plausibly underestimated." Does not revise estimates.
- 9.3 ("A1 confidence") — synthesizer concedes a verify-step is appropriate. Does not add it to A1's row.
- 9.4 ("A10 backlog drain handling") — synthesizer concedes drain-vs-fix-producer are two actions. Does not split.
- 9.5 ("A35 + A36 are deferrals dressed as actions") — synthesizer defends the framing. Does not change.
- 9.6 ("A38-A40 out of scope") — synthesizer defends by deflecting to the dialogue-pair's request. Does not excise.
- 9.7 ("Drive-MCP-unhealth as Wave C blocker is brittle") — synthesizer concedes, suggests an alternative, does not adopt it.

Pattern: pre-acknowledged charges become rhetorical inoculation. The brief warned that *§9's pre-acknowledgements that are framed in a way that minimizes the actual problem* should be pushed past. This is the structural form of that failure. Why it matters: a reader of PROPOSAL-FINAL who sees §9 may think "the critic was anticipated" without noticing that the anticipation absorbed nothing. Wave 5 should either remove §9 entirely (and rewrite the proposal to incorporate the concessions structurally) or expand each item from "concession-defense" to "concession-revision-or-explicit-rejection-with-reason."

### Cluster B: charges the observer raised that PROPOSAL did not engage

**Charge 5: PROPOSAL does not acknowledge that "ratification" itself is a broken mechanism in this system.** [hard-stop]

OBSERVER #4 (lines 75-92) is the most consequential observation the synthesizer ignored. The observer establishes that:
- `family/CONVENTIONS.md` has been `status: draft-pending-alton-ratification` since 2026-04-25 (11 days before audit)
- `MEMORY.md.proposed` was authored 2026-05-02 (4 days before audit, never adopted)
- HOUSEHOLD-CONSTITUTION v0.4 was drafted, never adopted, then v0.5 leapfrogged it
- Two `.md.proposed` files in `reference/MEMORY-history/` sit unmerged

The observer concludes: *"The Sartor system has a chronic trailing-edge of authored-but-not-adopted artifacts. This is not a bug in any one document; it's a missing mechanism. [...] Wave A is not actually waiting on a single Alton signoff — it's waiting on a meta-mechanism (a draft-to-adopted workflow) that doesn't exist."*

PROPOSAL A1 says "30 min" and A4 says "30 min" treating ratification as a single Alton action. PROPOSAL A19 acknowledges the `.proposed` problem and proposes either a curator step or by-hand merger, but does not connect this to the Wave-A sequencing problem the observer raised. The synthesizer then writes A4 as a Wave-A prerequisite — which is exactly the "wait on a mechanism that hasn't fired before" failure mode. Why it matters: A1 may fail to land for the same reason MEMORY.md.proposed has not landed in 4 days. Without naming and patching the ratification-mechanism gap, Wave A may stall the same way. Severity: hard-stop because the entire Wave-A sequencing claim depends on ratification being a working primitive.

**Charge 6: The Drive-MCP / Gmail-silence shared-OAuth-root-cause hypothesis is treated as "diagnose later," not as joint diagnosis.** [requires-revise]

OBSERVER #3 (lines 60-73) raises this specifically:
> *"The Gmail pipeline went silent on 2026-05-02. The Drive MCP appears unhealthy on 2026-05-06. These are 4 days apart on the same machine, both involving Google-OAuth-mediated services. [...] If the underlying failure mode is 'OAuth tokens degrading on Rocinante in ways nobody notices because the silent-failure mode also silences the alerts,' that's a different kind of bug than 'Drive MCP is having a bad afternoon.'"*

OBSERVER recommends a 30-minute OAuth-state diagnostic before any Google-mediated cron build.

PROPOSAL handles Gmail (A3) and Drive (A31, A32) as two separate items in two separate diagnoses. A31 is "Diagnose Drive MCP health" — Drive only. PROPOSAL G3 (line 237) names the Gmail silent-failure root cause as unfixed but does not connect it to A31. Why it matters: if the synthesizer is right that A3+A31 are separate, the proposal is fine. If the observer is right that they share a root cause, the watchdog Alton builds in A3 will alert him to the next instance of the same bug it failed to catch this time. The cost of treating them as joint is one 30-minute investigation. The cost of treating them as separate is potential repeat. Wave 5 must add an explicit OAuth-health diagnostic step that runs *before* A3 and A31, not after.

**Charge 7: The orphan/curator throughput problem is named (A10) but not sized.** [requires-revise]

OBSERVER #5 (lines 95-118) does the work the synthesizer did not:
> *"Production: ~3 ce-* files per day per the architecture inspector's reading [...] That's ~90/month inbound. Curator throughput on this stream: [...] something like 0 (no second drain has happened) [...] The ratio is divergent. [...] If the system uplift adds 5 more streams without changing curator throughput, the proposed-memories backlog at 236 today becomes 500 in two months."*

OBSERVER prescribes one of: (a) input-rate reduction, (b) increase capacity, (c) make the bottleneck visible, (d) retention/expiry policy.

PROPOSAL A10 (line 131) says "drain or fix." PROPOSAL §6 G6 (line 243) acknowledges audit content was unsampled. PROPOSAL §7 (line 263) puts A10 as "Wave A pre-step" without sizing the curator deficit or acknowledging that A3, A32, A37, A33 will all *increase* the input rate without addressing throughput. Why it matters: the audits validate new crons; the new crons create more curator work; A10 drains a stale backlog but doesn't fix the producer. The system gets worse on the dimension Alton named in PLAN as friction point #10. Wave 5 must add a "curator throughput" section that sizes the current ratio, sizes the proposed-cron load, and proposes which of (a)-(d) closes the gap.

**Charge 8: The dashboard-rename §4 punts a question observer answered conclusively.** [requires-acknowledge]

OBSERVER #7 (lines 138-152) said the three proposed names (Foyer/Loom/Almanac) all fight the spec, with concrete reasoning:
- Foyer = static space, dashboard is not static
- Loom = makes a fixed cloth, dashboard is changing live state
- Almanac = retrospective, dashboard is live

OBSERVER concluded: *"Don't adopt 'Loom.' [...] Either keep MERIDIAN or pick a name whose semantics match 'live state, time-ordered, surfaces what's NEW.'"* MERIDIAN actually matches that semantic field (a meridian is a line, time-of-day-rotating).

PROPOSAL §4 (lines 191-195) hedges:
> *"This is a separate decision; the synthesizer is not re-deciding it. The orchestrator's preference is Loom. The PROPOSAL takes no position [...] If forced to choose without re-deciding: Loom is the right name."*

The synthesizer simultaneously says "no position" and endorses Loom against observer's conclusion. Why it matters: this is a small thing in absolute terms but a clean case of synthesizer-side aesthetic-over-spec drift the observer specifically called out. The synthesizer's own language ("no position, but Loom is the right name") is the construction the communication-style rules forbid. Wave 5 should either delete §4 (out of scope) or pick a position that engages observer's argument.

**Charge 9: Aneeta principalship asymmetry is "surfaced for the critic" rather than acted on.** [requires-revise]

OBSERVER #8 (lines 154-175) and dialogue.md §III "What both did not say, jointly" (lines 114-124) raise this. The observer notes: the audits read sources mostly Alton-authored; inspectors are Alton-dispatched; Aneeta is in the data, not in the workflow; there is no `family/aneeta.md` design for *her* using the system; the uplift makes the system more sophisticated for Alton without changing the asymmetry.

PROPOSAL §3 Q8 (line 185) and §6 G10 (line 251) flag the asymmetry "for the critic." PROPOSAL A29 (line 150) stubs `family/aneeta.md` — but this is the per-spouse fact page, which is the audit's (FAMILY-WIKI-AUDIT I-8) object-shaped artifact, not a workflow artifact for Aneeta-as-user. The synthesizer has done the easy half (have a destination file) and not the hard half (have a usage path).

The synthesizer's defense in §9.6: *"the dialogue-pair specifically asked the synthesizer to surface these for Wave 4 critic consideration."* The dialogue-pair did say that; they did not say "surface so the critic can decide whether to keep it." They said *"flag this for Wave 4 (the critic) to consider whether the household wants v0.6 (or some near-future version) to explicitly name the asymmetry-being-worked-on."* That is a v0.6-Constitution-side action, which PROPOSAL A38 partially captures. But the *engineering-side asymmetry* the observer flagged (Aneeta has no onboarding, no morning-briefing-for-her, no aneeta-side dashboard, no peer machine) is a separate question and PROPOSAL ignores it. Why it matters: this is the largest unspoken constraint on Phase 2 per the dialogue-pair. The fix is not necessarily to build Aneeta-side workflow inside this Phase, but the proposal must at least name the asymmetry as a Phase-2 constraint and not pretend A29 closes it.

**Charge 10: PROPOSAL does not engage with observation #2 (the synthesizer is reading from inside the shaping).** [requires-acknowledge]

OBSERVER #2 (lines 41-57) explicitly addresses the synthesizer:
> *"I am also reading from inside the shaping. [...] The convergences in the audits and inhabitants may partly reflect shared frame, not shared evidence. [...] The synthesizer's PROPOSAL.md will inherit these convergences and present them as findings."*

The observer asks the synthesizer to weight empirical measurements above qualitative reports. PROPOSAL nowhere acknowledges this concern. The synthesizer's §0 line 26 ("healthier than the plan doc implied") is an aggregation across audits and inhabitants treated as a finding; the observer specifically said *don't do this*. Dialogue.md §V (lines 148-164) makes the same point and proposes the triennial outside-evaluation mechanism — which PROPOSAL A40 captures. So the *mechanism* is folded in but the *epistemic warning to the synthesizer themselves* is not. Why it matters: Wave 5 needs a one-paragraph note in §0 acknowledging the read-from-inside problem and the steps the proposal does (weighting empirical findings) and does not (no separate sanity-check from outside the shaping for this round) take to mitigate it.

**Charge 11: The text-messages "load-bearing risk" reframing observer offered is not folded in.** [requires-revise]

OBSERVER #6 (lines 121-136) argued that the strongest reason to defer texts-ingest is not in the audit. The audit listed five reasons (marginal value, privacy, pollution risk, no iMessage, Wave-1 priority). The observer says the dominant reason is the §5.6 tab-pollution structural risk — *"the only proposed cron whose primary risk is that the Sartor architecture's existing privacy guardrails do not protect against it."* The audit's §7 cron design treats the §5.6 risk as one-of-five; the observer says it should dominate.

PROPOSAL A36 (line 157) defers texts-ingest with the audit's framing; PROPOSAL §6 G2 (line 235) acknowledges the privacy floor inferences. Neither captures the observer's reframing. Why it matters: if texts-ingest is reactivated at 30 days, the synthesizer's framing makes it look like an Alton-greenlight + privacy-policy authoring exercise. Observer's framing makes it a *privacy-architecture construction project from scratch for a surface where filters can fail irreversibly.* The 30-day revisit will make different decisions under those two framings. Wave 5 should add to A36's evidence column: "if reactivated, the build is a privacy-architecture project, not a privacy-policy-authoring exercise" with citation to OBSERVER-NOTES #6.

### Cluster C: PROPOSAL-internal inconsistencies

**Charge 12: A1 effort estimate (30 min) does not include the verify-step §9.3 says is appropriate.** [requires-revise]

PROPOSAL A1 row says "30 min" and "Alton — direct." PROPOSAL §9.3 concedes: *"a 5-min spot-check pass before the `mv` is appropriate."* Effort revision is +5 min if the spot-check succeeds, but if MEMORY.md.proposed is missing any load-bearing fact, the actual remediation could be substantially more. MEMORY-AUDIT §8 (line 421) explicitly says: *"the synthesizer should confirm against the 2026-05-02 daily log that no facts were lost. [...] not a blocker for me, just a verify-step for whoever executes R1."* PROPOSAL omits this verify-step from A1's effort estimate AND from A1's evidence column. Why it matters: synthesizer pre-acknowledged the problem and shipped a row that does not encode the acknowledgement. Wave 5 must update A1 to: "30 min + spot-check + reconciliation if needed; verify-step is part of the action."

**Charge 13: A4 ratification is one row but multiple invariants; proposal silently bundles them.** [requires-revise]

PROPOSAL A4 (line 125) says ratify CONVENTIONS.md and add invariants I-3, I-4, I-5, I-10. FAMILY-WIKI-AUDIT §5.2 (lines 304-322) defines I-1 through I-10. PROPOSAL A4 lists I-3, I-4, I-5, I-10 explicitly; what about I-1, I-2, I-6, I-7, I-8, I-9? Some of these are operationalized in other actions (I-7 in A16, I-8 in A29) but the others — I-1 (kid school events), I-2 (single-fact-per-canonical-place), I-6 (pet medical), I-9 (sole-parent-window archival) — are not in A4 and not separately actioned. Either they are silently dropped from ratification, silently included in ratification, or silently deferred. The proposal does not say. Why it matters: ratification scope is a source-of-truth question; PROPOSAL-FINAL must enumerate which invariants are ratified in A4.

**Charge 14: A6 (rename hearth/family.md → hearth/ground.md) is presented as 5 minutes; load-bearing wikilinks count is 4 inbound but actual count is unverified by the synthesizer.** [minor]

PROPOSAL A6 says "Update wikilinks (4 inbound)." Neither the family-wiki audit nor hearth-reflection nor dialogue specifies the inbound count. LINKS-AUDIT does enumerate the broken-link clusters but `hearth/family` is not one of them (it currently resolves; it would *become* broken on rename). The "4 inbound" count appears to be invented by the synthesizer or read from a source not cited. Why it matters: small, but the discipline is that table cells should cite their source. Wave 5 should either cite the count or replace with "4 inbound (verify before rename)."

**Charge 15: A9 effort (60-90 min) and A10 effort (1-2 h) compete for the same operator-hour budget without sequencing constraint.** [minor]

PROPOSAL §7 (line 263) says A4 first, then mechanical renames (A6, A7, A8), then A1, then content moves, then source-doc wikilinks (A11), then orphan backfill (A9), then drain (A10). But A9 and A10 are both Alton-direct, both labor-shaped, both sequenced sequentially — ~3 hours combined. PROPOSAL summary line 48 says "A1-A12 fits in a single evening (~7 h cumulative)" but the listed efforts (30+15+30+5+15+30+60-90+60-120+20+60) come to ~5-6 hours minimum, with A9/A10 alone consuming 2-3.5h. §9.2 acknowledges optimism but does not revise. Why it matters: scheduling Alton's evening matters; the table arithmetic doesn't add to "single evening" honestly. Wave 5 should either re-do the arithmetic or note "first-pass; some Wave-A items will spill to a second evening."

**Charge 16: A33 ("Add data/inbox-stream/ + .gitignore + README") is a Wave-C *prerequisite* but is sequenced AFTER A31 in the proposal text.** [requires-revise]

PROPOSAL §7 line 267: "Sequencing within Wave C: A33 must be first; A3 and A31 in parallel; A32 after A31." But the table at §2 lists items in order A1, A2, A3, A4, ... A31, A32, A33, A34, A35... — A33 is presented as item #33 in priority/ROI order while §7 says it's a prerequisite. The table number is read as a priority signal; the §7 text contradicts. PROPOSAL also says A3 (Gmail cron, item #3 by ROI) writes to `data/inbox-stream/gmail-<date>.jsonl`, which means A3 cannot ship before A33. Why it matters: a reader of the table will execute the top three (A1, A2, A3) and discover A3 fails because A33 has not landed. Wave 5 must reconcile the table-rank with the sequencing or move A33 up.

**Charge 17: A2's claim that wiki-reindex "Update CLAUDE.md scheduled-tasks table" is incomplete — the table currently *claims* wiki-reindex runs nightly but actually it does not.** [minor]

PROPOSAL A2 evidence row says: *"`.claude/scheduled-tasks/wiki-reindex/SKILL.md` exists; no Windows Scheduled Task invokes it."* PROPOSAL A2 action row includes "Update CLAUDE.md scheduled-tasks table." But CLAUDE.md (loaded in this session) line "wiki-reindex | Hermes-pattern wiki reindex [...] | Nightly" already lists it as nightly — that's the *false* state PROPOSAL acknowledges (LINKS-AUDIT §8 line 312). So A2 has to *correct* CLAUDE.md, not "update." The action description elides the correction. Why it matters: small, but the integrity claim of A2 is "this fixes a documentation lie that has been live." Wave 5 should make the correction explicit so it doesn't get skipped.

**Charge 18: A12 (fix INDEX.md auto-generator) is 1h with no investigation of which generator runs it.** [minor]

MEMORY-AUDIT §3.5 (lines 240-251) describes the INDEX.md output format pattern but does not name the generator. PROPOSAL A12 says effort is 1h and includes "find the generator, fix, and verify." If the generator turns out not to exist (the file is hand-curated, or written by an extinct cron), 1h is wrong. If it's in `wiki.py` or `extract_graph.py`, the audit didn't verify. Why it matters: minor, but A12 is presented as a known fix. Wave 5 should reframe as "1h investigation+fix, verify generator is live before estimating."

**Charge 19: A19 (.proposed adoption mechanism) recommendation conflicts with A1 implementation.** [requires-acknowledge]

PROPOSAL A19 (line 140) says: *"Decide `.proposed` adoption mechanism. [...] Recommendation: (b), then drop the convention."* That is, by-hand merge the 3 files and stop using `.proposed` as a convention.

PROPOSAL A1 (line 122) is a `.proposed`-adoption (`mv MEMORY.md.proposed MEMORY.md`). If A19's recommendation lands ("drop the convention"), the move is *the act of dropping the convention for this file specifically*, not "adopting MEMORY.md.proposed in conformance with the convention." But A1 is presented as an adoption-of-convention action, not a one-shot. The framing is inconsistent. Why it matters: small but symptomatic — Wave 5 should reconcile or note that A1 is the first instance of A19's by-hand approach, not a precedent for future `.proposed` files.

**Charge 20: PROPOSAL §0 top-3 "if you only do three things" is A1+A2+A3, but "If only one of these three lands this week, A1 is the right one" reasoning collapses on inspection.** [minor]

PROPOSAL §0 line 48 reasons: *"the headline overflow blocks every session reminder and the proposed file is already authored."* This is right that A1 unblocks session reminders. But the line continues: *"A2 is the right one if the constraint is 'do the smallest thing tonight.' A3 is the right one if the constraint is 'fix the most expensive ongoing leak.'"*

Fact: A2 effort = 15 min; A1 effort = 30 min. A2 is smaller. So A2 is also "the smallest thing tonight" *and* "the do-tonight" candidate. The hierarchy collapses unless A1 has additional weight the synthesizer didn't articulate. The actual answer is probably "A1 is the highest-leverage of the three because it un-truncates the auto-injected context every future session uses, and A2 is the cheapest, and A3 is the longest tail of risk." Wave 5 should re-state this cleanly. Severity minor; reasoning hygiene.

**Charge 21: PROPOSAL §3 question 1 ("Should CONVENTIONS.md be ratified before Wave A?") is identical to A4 in the action table; surfacing it as an open question implies it is unresolved.** [minor]

PROPOSAL §3 Q1 says "Synthesizer recommends: yes, ratify before any consolidation. This is A4 in the ranking." The question is presented as open scoping for Alton, and the answer is that A4 is the resolution. So the question is closed. But it appears in the open-scoping list. Either it's open or it's closed; presenting both is structurally ambiguous. Same pattern for Q2, Q3, Q4 (all map to actions and have synthesizer recommendations). Q5, Q7, Q8, Q9 are more genuinely open. Wave 5 should either remove resolved-questions from §3 (and let A1-A12 carry them) or rename §3 from "open scoping decisions" to "questions surfaced and synthesizer recommendation."

### Cluster D: hidden costs and missing risk surfaces

**Charge 22: New crons (A3, A32, A37) cost ongoing token-burn the proposal does not size.** [requires-revise]

INGEST-AUDIT-GMAIL §6 ("Token cost") line 318 estimates *"every-2h × sonnet × ~15-25 turns/run = roughly $0.05-0.15 per run = $0.60-1.80/day = $18-55/month."* PROPOSAL nowhere reproduces this. PROPOSAL also adds A32 (Drive cron) and A37 (attachment-router) without estimating their per-month cost. PROPOSAL also adds the gmail-liveness-watchdog (A3) at 30-min cadence (48 runs/day × ~3 turns each = $5-15/month). And A2's wiki-reindex nightly scheduled task is API-free but takes compute. Total Phase-2-induced ongoing cost is plausibly $30-100/month not in the proposal. Why it matters: Alton's greenlight is harder to give without a cost number; the plan-doc Phase-1 token budget was named ($20-40 one-shot), but Phase-2's *recurring* spend is not. Wave 5 must include a §11 "Phase 2 ongoing cost estimate" with per-cron monthly burn.

**Charge 23: New crons add on-call/attention-debt surface (10 watchdogs are 10 alert paths) which the proposal does not size.** [requires-acknowledge]

The watchdog pattern is recommended for Gmail (A3), Drive (A32), and the inspector-Gmail audit explicitly says *"the watchdog pattern needs to apply to ALL Phase 3 ingest crons"* (INGEST-AUDIT-GMAIL line 333). That implies attachment-router (A37) and experiments-watcher (PLAN Phase 3) and source-doc-ingest (PLAN Phase 3) also need watchdogs. Each watchdog is a separate alert. Each alert has tuning and acknowledgement debt. PROPOSAL nowhere sizes how many alert-bearing crons Phase 2 will end with or what alerting cadence Alton accepts. Why it matters: the May 3-6 Gmail silence was actively-noisy-failure-mode (no alert when needed); the failure mode of building 10 watchdogs is alert-fatigue (alert when not needed). Both fail, in different directions. Wave 5 should at minimum acknowledge alert-fatigue is a Phase-2 risk and propose either alert-aggregation (single daily-household-health roll-up) or alert-budget per cron.

**Charge 24: The watchdog itself is single-machine, single-OAuth-state — same failure-mode the watchdog is supposed to close.** [requires-revise]

OBSERVER #9 (lines 178-195) said this: *"a watchdog needs to (a) run on a schedule that's separate from the thing it watches, and (b) write to a surface someone reads. If both the watched cron and the watchdog cron run from the same Windows Task Scheduler on the same machine with the same OAuth state, a Rocinante-wide failure (locked profile, OAuth-token cohort expiry, scheduled-task-service issue) takes them both out simultaneously. The May 3-6 silence might be exactly such a Rocinante-wide failure, in which case the proposed gmail-liveness-watchdog would also have been silent."*

PROPOSAL A3 puts the watchdog on Rocinante, single-machine, single-OAuth. The observer's recommendation: cross-route the alert path to gpuserver1's existing hourly heartbeat surface so a peer-machine alert path exists. PROPOSAL does not adopt this. Why it matters: the April 25 daily-household-health closer was exactly this single-machine pattern and it failed to catch the May 3-6 silence. Building another single-machine watchdog is doing the failure-mode again. Wave 5 must add: "watchdog alert path is cross-routed to a peer-machine surface (gpuserver1 hourly heartbeat) so a Rocinante-wide failure does not take both watched-cron and watchdog out simultaneously."

**Charge 25: A33's gitignore step is correctly scoped, but PROPOSAL does not verify what's currently gitignored and treats the file as if it doesn't exist.** [minor]

PROPOSAL A33 (line 154) says *"Verify .gitignore excludes data/inbox-stream/ — children's names will appear in jsonl rows; must NOT mirror to GitHub."* Fact (verified by critic): `.gitignore` line 24 is `data/`, which already excludes `data/inbox-stream/` recursively. Also line 73 specifically excludes `sartor/memory/source-documents/` — which is the load-bearing AZ-paths exclusion (see Charge 26). PROPOSAL A33's "Verify" framing is correct in instinct; it could be an "Already verified, no change needed" with citation to gitignore line 24. Why it matters: minor, but A33 is presented as an action (10 min) when the gitignore work is already done. The actual A33 is "create the directory + write a README"; effort is more like 5 min.

**Charge 26: PROPOSAL does not engage with OBSERVER #10's claim that the source-documents/INDEX.md is potentially out-of-AZ-policy.** [requires-acknowledge]

OBSERVER #10 (lines 198-214) flagged that the source-doc INDEX.md contains 747 AZ paths, and asked: is `sartor/memory/source-documents/` in `.gitignore`? Observer marked this as *"the most consequential thing I noticed in the entire audit corpus and the team did not flag it as urgent."*

Fact (verified by critic): `.gitignore` line 73 *does* exclude `sartor/memory/source-documents/`. The exclusion was added by inspector-source-docs during the Wave-1 audit. The comment on line 70-72 is explicit: *"Contains 3,211 paths to scattered local PDFs/statements/contracts including 747 AstraZeneca work-product paths (~23%). [...] publishing the path manifest to the GitHub DR mirror requires AZ Compliance review first."*

So the observer's worst-case (paths leaked to GitHub) is foreclosed by the inspector's own gitignore work. PROPOSAL §3 Q6 (line 181) defers AZ Compliance check as "separate from this uplift, not Phase 2 scope." That's a reasonable scoping decision *given* the gitignore is in place. But PROPOSAL does not cite the gitignore exclusion as the load-bearing reason it can defer. Why it matters: a reader who reads PROPOSAL without OBSERVER-NOTES might not realize that the AZ-paths-in-tree question has been mitigated by .gitignore line 73. Wave 5 should cite the gitignore line in §3 Q6 or in a new constraint C13. Severity: requires-acknowledge — the observer's concern is real, the mitigation is real, the proposal needs to connect them.

### Cluster E: scope, ratification, and routing errors

**Charge 27: A38, A39, A40 are Constitution-side governance items in a Memory-System-Uplift proposal.** [requires-revise]

PROPOSAL §9.6 acknowledges this as a likely charge and defends: *"the dialogue-pair specifically asked the synthesizer to surface these for Wave 4 critic consideration; excision would be hiding them from the prosecution."*

This defense conflates two things. The dialogue-pair asked for the seams to be visible to Wave 4. The dialogue-pair did *not* ask for these to land in PROPOSAL-FINAL as PHASE-2 ACTIONS. They could be:
(a) flagged in §6 (gaps/G-items) for Wave 4 critic
(b) routed to a separate `projects/constitution-v06-DRAFT.md` track
(c) kept in PROPOSAL as A38-A40 with explicit "out-of-scope-for-Phase-2-but-flagged"

The synthesizer chose (c) but did not say "out-of-scope-for-Phase-2-but-flagged" *clearly* in the action rows; the rows say "Wave E (v0.6)" and "Alton — judgment" but a reader skimming the table sees a 40-action list and might execute. Why it matters: PHASE-2 IS NOT v0.6. Routing these to a separate track is the cleaner move. Wave 5 should pick: either excise A38-A40 with a §6 G-item placeholder, or rename "Wave E" to "Phase-3-or-later" so it is structurally distinct from Phase 2.

**Charge 28: A40 (triennial outside-evaluation) is a v0.6+ governance mechanism but is presented as a 30-min spec.** [requires-revise]

PROPOSAL A40 (line 161) says: *"30 min spec + 1-2 h dispatch."* Dialogue.md §V (line 160-164) says triennial = every 3 versions OR 3 years, whichever first. The 30-min spec covers the trigger condition and the dispatch shape. But the *governance* of this — who chooses the triennial Claude, which CLAUDE.md context they get loaded with, whether they read hearth-as-artifact or hearth-as-room (the whole point of triennial is the former — hearth-companion this Wave 2 was inhabitant-shaped, which is the failure mode triennial is supposed to mitigate) — is not a 30-min spec. Why it matters: A40 in current form is structurally underdesigned. Wave 5 either drops it or expands the spec to address: (i) load with what context (probably no hearth/CLAUDE.md auto-inject), (ii) what artifacts they read, (iii) what success looks like. Otherwise the spec lands and is exercised in 2029 with no agreed-upon shape and produces noise.

**Charge 29: A28 (frontmatter backfill on 26 daily logs) is curator-class work but PROPOSAL routes it to "Curator" without acknowledging curator throughput is the bottleneck (charge 7).** [requires-revise]

PROPOSAL A28 owner = "Curator." The audit (MEMORY-AUDIT R9) says: *"Curator-class batch task — write a script that reads the # Daily Log - YYYY-MM-DD header [...] ~1 hour for the script + run + verify."* That is operator/automation work, not curator-judgment work. PROPOSAL imports the audit's "Curator" routing without recognizing that the curator is throughput-constrained (charge 7) and that scripted batch-frontmatter is an operator job. Why it matters: small misrouting; mostly a labels-fix. Wave 5 should re-tag A28's owner as "Operator (script + run)" not "Curator."

**Charge 30: A18 ("hearth-aware extractor category") routes hearth content to inbox-only — but inbox is the throughput-constrained surface.** [requires-revise]

PROPOSAL A18 (line 139) recommends extractor-side change: *"hearth-register text → inbox-only with category: hearth-candidate; curator triages."* FAMILY-WIKI-AUDIT §5.3 (line 328) prescribes the same. Question PROPOSAL doesn't engage: the inbox-curator path already has 236 unprocessed proposals with curator throughput ~0/month (charge 7). Adding hearth-candidate category to that bucket adds load; "curator triages" is the same overloaded dispatcher A10 is supposed to drain. Why it matters: A18 in current form pushes hearth content into the bottleneck. Either (a) hearth-candidates need their own dispatcher with a smaller queue, or (b) the action specifies that curator must triage hearth-candidates within 7 days or auto-discard. Wave 5 should pick one.

**Charge 31: A21 ("delete the skills/ dead zone") and A22 ("delete gpuserver1-monitoring-log.md") are presented with the same effort and severity but are different decisions.** [minor]

A21 is "5 files, zero backlinks, last touched 2026-04-11, duplicate of `.claude/skills/`" — clean delete. A22 is a 91-line stub from 2026-04-14 that says "awaiting human curation" and includes inbox-entry-context that may have signal Alton wants to read once before delete. PROPOSAL groups them as identical mechanical actions. MEMORY-AUDIT R10 (line 401) explicitly says "Either fill it in or delete it. The simplest move: delete." But "either fill or delete" is a 5-min Alton decision, not a 5-min mechanical execution. Why it matters: minor — Wave 5 should re-tag A22 as "Alton — judgment" rather than "Alton — direct (5 min mechanical)."

**Charge 32: A13 (TY2018-2024 source-doc reorg, 4-6 hours) is described as "Alton supervisory" but the audit says "Alton + operator."** [minor]

PROPOSAL A13 owner row: "Operator + Alton supervisory." SOURCE-DOC-AUDIT §"Recommendations" #1 line 145: *"Repropagate to TY2018-TY2024. Rough effort: 4-6 hours."* Doesn't specify owner. The actual work is filename normalization across 7 tax years; operator can do most of it; Alton has to confirm correct grouping. PROPOSAL's "supervisory" framing implies passive Alton role; actual work requires per-doc Alton approvals because tax docs are sensitive (banking statements, SSNs, signatures). Why it matters: 4-6h is the operator-only estimate; Alton-touchpoint adds latency. Wave 5 should tag effort more honestly: "4-6h operator + 1-2h Alton review checkpoints."

### Cluster F: omitted layers / failure modes / domains

**Charge 33: PROPOSAL does not address the `log.md` 143KB-ledger that is auto-loaded into sessions.** [requires-revise]

MEMORY-AUDIT §1 (line 65) flags log.md at 143 KB and notes: *"should not load into a session — verify it does not get auto-injected."* MEMORY-AUDIT §"Coordination points" (line 428) flags this for inspector-gmail-drive. PROPOSAL nowhere addresses log.md's auto-injection status. The 143 KB file dwarfs MEMORY.md's 30 KB; if it auto-injects, every session is loading it. Either the audit's worry is wrong (log.md does not auto-inject — verify) or there is a hidden major load problem PROPOSAL ignored. Why it matters: if log.md auto-injects, A1's MEMORY.md trim is solving 30 KB while a 143 KB problem sits unaddressed. Wave 5 must verify auto-injection status and either close out (it's fine) or add to the action list.

**Charge 34: HOUSEHOLD-CONSTITUTION at 168 KB is in `reference/` and is not addressed for size/load.** [requires-acknowledge]

MEMORY-AUDIT §1 lines 81-105 lists HOUSEHOLD-CONSTITUTION top files at 173/168 KB (current v0.5) plus 206 KB v0.4 and 163 KB v0.2. Even granting v0.4 is archived, the live v0.5 is 168 KB and counts as the largest non-research file in the corpus. PROPOSAL §1 does not size-audit the Constitution. Wave 1 inhabitants engaged its content but not its size. Why it matters: probably fine — Constitution is read on demand, not auto-loaded. But it is the largest single document in the wiki; some PROPOSAL acknowledgement that "the Constitution is large but read-on-demand" closes a question a reader might have. Wave 5 should add one sentence in §1 Layer 3 acknowledging Constitution size and load behavior.

**Charge 35: PROPOSAL ignores the `__pycache__/` 184 KB in the memory tree.** [minor]

MEMORY-AUDIT §1 line 39: *"`__pycache__/` (should be in .gitignore?)"* — the audit flags it as a question. PROPOSAL has no action. Fact: gitignore line 40 already has `__pycache__/`, so it's untracked. The file existing on disk is harmless. Wave 5 can ignore this charge. Severity minor — flagged to ensure the synthesizer didn't miss it on grounds the audit raised the question.

**Charge 36: PROPOSAL has no action for `MASTERPLAN.md` and `MASTERPLAN-VISIONARY.md` (named as stale by the audit).** [requires-acknowledge]

MEMORY-AUDIT §4 "Stale-but-alive zones" (lines 274-281) lists both: *"MASTERPLAN.md | 2026-04-19 | 'Last updated: 2026-02-06. Hub-refreshed: 2026-04-12.' — a hub-refresh is not a content review."* PROPOSAL has no action for either. Why it matters: minor, but if MASTERPLAN drives Phase-2-and-beyond planning, leaving it stale during the uplift is exactly the kind of "the uplift made the system better at small things and ignored the strategic doc" pattern. Wave 5 should add a Phase-2 light-touch (or explicitly defer with date).

**Charge 37: PROPOSAL does not engage with `data/inbox-stream/` retention/expiry policy — directly relevant to the curator-throughput problem.** [requires-revise]

OBSERVER #5 (line 117) prescribed option (d): *"Accept the backlog and define a retention/expiry policy (anything in proposed-memories older than 30 days gets auto-archived without merging)."* This is also implied by INGEST-AUDIT-GMAIL §5 (the dedup strategy assumes daily files). PROPOSAL A33 creates `data/inbox-stream/` but says nothing about retention. If gmail jsonl writes ~50 events/day and never expires, the directory grows linearly. After a year, 18,000+ events in jsonl files. The dashboard reads everything? How is read-time bounded? Why it matters: every cron-fed surface in this proposal has the same issue. Wave 5 should add a §"Retention" section: jsonl files >30 days move to `data/inbox-stream/_archive/<YYYY-MM>/` or get deleted.

### Cluster G: confidence / hedge / register issues

**Charge 38: PROPOSAL §0 phrasing "less coherent than it could be" is hedge-class.** [minor]

The communication-style rules (loaded via .claude/rules/communication-style.md): *"Direct and intellectually rigorous. No hedging."* PROPOSAL §0 line 26: *"healthier than the plan doc implied and less coherent than it could be."* This is the construction the rules forbid. The audit's headline is sharper. Why it matters: minor; aesthetic alignment with house style. Wave 5 should sharpen.

**Charge 39: PROPOSAL §9 self-described "Where the synthesizer is least confident" lists A38, A39, A40 — but they are still in the table as actions.** [requires-revise]

PROPOSAL §9 line 317: *"Where the synthesizer is least confident. A38, A39, A40. The Constitution-side governance cluster. [...] Whether they belong in this PROPOSAL at all is a real call for the critic."* If the synthesizer is least confident in those three and explicitly invites the critic to call them out-of-scope, then the synthesizer should have made the call themselves before shipping the proposal. Filing the call as "the critic decides" abdicates synthesizer responsibility. Why it matters: combined with charge 27, the routing is half-done. Wave 5 must take a position: either keep all three with explicit Phase-3 marker, route to v0.6 track, or excise.

**Charge 40: "Synthesizer recommends:" pattern in §3 nine times functions as soft confidence-marker without engagement.** [minor]

PROPOSAL §3 has 9 questions with 9 "Synthesizer recommends: <X>" answers. Several are genuinely contested (Q5 Aneeta texts privacy, Q8 principalship asymmetry, Q9 triennial). The rhetorical-pattern uniformity flattens the confidence gradient. Q1 ("ratify CONVENTIONS first") has stronger recommendation-confidence than Q8 ("flag for v0.6"). The flat formatting hides this. Why it matters: minor; Wave 5 should differentiate the language register (Q1 = "yes, do this"; Q8 = "low-confidence note for Wave 4") so a reader sees the gradient.

**Charge 41: PROPOSAL does not state the read-from-inside-shaping problem in §0 Executive Summary.** [requires-acknowledge]

OBSERVER #2 explicit ask: PROPOSAL should be written with awareness that the synthesizer is reading from inside the shaping. Dialogue.md §V (line 158): *"The PROPOSAL should be written with awareness that the synthesizer themselves is reading from inside this shaping."* PROPOSAL §0, §1, §2 do not contain this awareness. §6 G9-G11 mention adjacent issues. Closer to a §0a is needed. Wave 5 should add one paragraph in §0 acknowledging the position-of-reading and what mitigations the proposal employs (weighting empirical findings, the triennial mechanism A40).

---

## §2 The synthesizer's pre-acknowledgements (§9) — verdicts

PROPOSAL §9 lists 7 likely charges with synthesizer responses. My verdicts:

**§9.1 "Action sprawl" (40 actions is a lot)** — *NOT resolved by acknowledgement.* The synthesizer concedes but does not collapse. The defense ("collapsing loses easy items") is reasonable but the action stays at 40. Verdict: I do not actually charge sprawl as a defect — the audit findings are real and the items map to them. The pre-acknowledgement is unnecessary and slightly defensive.

**§9.2 "Optimism on Wave-A timing"** — *NOT resolved by acknowledgement.* Synthesizer concedes "plausibly underestimated"; no estimates revised. See charge 15. Verdict: real problem; pre-acknowledgement is theater.

**§9.3 "A1 confidence"** — *NOT resolved by acknowledgement.* Synthesizer concedes verify-step is appropriate; A1 row does not include it. See charge 12. Verdict: real problem; the concession is vapor unless A1 reflects it.

**§9.4 "A10 backlog drain handling — drain vs fix-producer"** — *NOT resolved by acknowledgement.* Synthesizer concedes; A10 row does not split. Charge 7 (curator throughput) is the deeper version. Verdict: real problem; needs split into A10a (drain) + A10b (fix producer).

**§9.5 "A35 + A36 are deferrals dressed as actions"** — *not resolved by acknowledgement, but the synthesizer's defense is partly correct.* "Deferral with calendar revisit + deprecation criterion" is a legitimate action shape. The real issue is that A35 (typed-wikilinks) has a clean deprecation criterion ("if still inert at 30 days, deprecate") and A36 (texts-ingest) does not (just "revisit post-Wave-A"). A36 is the weaker case. Verdict: split — A35 is fine, A36 needs a deprecation criterion or downgrade to a §6 G-item.

**§9.6 "A38-A40 out of scope"** — *NOT resolved.* See charges 27, 39. The synthesizer's defense (dialogue-pair asked for surfacing) is true at the level of "surface for the critic" but not "include as Phase-2 actions."

**§9.7 "Drive-MCP-unhealth as Wave C blocker is brittle"** — *partially resolved.* Synthesizer concedes and offers an alternative (build Gmail leg standalone); the alternative is reasonable. Charge 6 (joint-OAuth-diagnosis) is a different problem the synthesizer didn't anticipate. Verdict: §9.7 alternative is OK; the deeper issue is observer's joint-diagnosis, not addressed.

**Charges synthesizer did NOT pre-acknowledge (the meaningful ones):**
- Charge 1: 5-layer architecture as ratified vs hypothesis
- Charge 5: ratification-mechanism gap
- Charge 6: OAuth-shared-root-cause
- Charge 7: curator throughput / proposed-memories production-rate
- Charge 9: Aneeta engineering-side asymmetry (vs Constitution-side asymmetry, which §3 Q8 partially captures)
- Charge 10: synthesizer-reading-from-inside-shaping
- Charge 16: A33 sequencing inconsistency
- Charge 22: ongoing token cost
- Charge 24: watchdog-single-OAuth
- Charge 33: log.md auto-injection
- Charge 37: data/inbox-stream/ retention

These are what the brief instructed me to push past §9 to find. They constitute the bulk of the prosecution.

---

## §3 What the proposal got right

Honest list. No padding.

- **A1, A2, A3 top-3 selection.** The audit-pulse rate matches; if Alton does only three things, these are the three. Severity-ranking discipline.
- **C1 + C2 + C3 (do not rename family/, do not rename hearth/, do not consolidate hearth).** These are correctly load-bearing constraints. The synthesizer correctly noticed the dialogue-pair's flag and made hearth-non-consolidation a Phase-2 hard rule. Charge 1 critiques the broader 5-layer framing but does not weaken this specific carve-out.
- **A6 (rename hearth/family.md → hearth/ground.md).** Three-source convergence (family-wiki audit, hearth-companion, dialogue-pair). The synthesizer correctly identifies this as the strongest signal in the entire batch. The rationale recovery is good.
- **§5 hard constraints C1-C12.** The constraints list is mostly right. C9 (gitignore for inbox-stream) is correctly highlighted. C10 (no peer push to GitHub) is correctly stated. C11 (do not amend Constitution v0.5) is the right call given v0.5 just ratified.
- **§8 Disagreement-resolution method.** The synthesizer correctly identifies the orphan-count disagreement (179 vs 99 vs 1) and routes to actionable 35-40. Same for proposed-memories backlog (236 vs 53/58 estimate). Routing nuance to the right answer is good craft.
- **A2 wiki-reindex wiring as 15-min unblocker.** Correct prioritization; LINKS-AUDIT R1 is the highest-ROI move surfaced and the synthesizer captures it.
- **A26 (typed-wikilink resolution bug fix) and A35 (defer-then-deprecate) are correctly scoped.** A26 is the small fix; A35 is the deprecation-with-criterion. Both are right.
- **§6 (gaps section).** The G-list is honest about what wasn't covered. G1 (Drive baseline), G3 (Gmail root cause), G6 (proposed-memories content), G12 (activity-stream ↔ source-doc relationship) are all real and worth flagging. The G-section is the best section of the proposal in terms of intellectual honesty.

---

## §4 Recommended order of revisions for Wave 5

In ROI order. Wave 5 should not address all 41 charges; some are cosmetic. The high-leverage revisions:

1. **Address charge 1 (5-layer framing).** Add §0a or §1a stating the framing the proposal operates under. One paragraph. Either defend the 5 layers or downgrade to "useful taxonomy, not target." This unblocks all Wave-A consolidation reasoning.
2. **Address charge 5 (ratification mechanism).** Add §"Ratification" or a constraint C13: "ratification of CONVENTIONS.md and adoption of MEMORY.md.proposed are blocked on a meta-mechanism (draft-to-adopted workflow) that does not exist; A4 and A1 require either Alton-direct execution or building the missing mechanism first." Without this, Wave A risks stalling.
3. **Address charge 7 (curator throughput).** Add a §"Curation throughput" section that sizes current ratio (~90/month in, ~0/month out), sizes proposed-cron load, and proposes reduction-or-throughput-or-visibility-or-expiry. This is observer's #5; it is a fold-in candidate the observer named explicitly.
4. **Address charge 6 (joint-OAuth-diagnosis).** Add a 30-min OAuth-state diagnostic action *before* A3 and A31, not after. This may turn out to find nothing; it costs less than building a watchdog that misses the same root cause.
5. **Address charge 24 (watchdog-cross-routing).** Modify A3 to specify peer-machine alert path so a Rocinante-wide failure does not silence both watched-cron and watchdog.
6. **Address charge 9 (Aneeta engineering-side asymmetry).** Add to §3 Q8 or new constraint: "the proposed Phase-2 work makes the system more sophisticated for Alton without addressing Aneeta's path-into-the-system; this is a known asymmetry not closed by A29."
7. **Address charge 12 (A1 verify-step).** Bake the spot-check into A1's effort estimate; do not rely on §9.3 to absorb it.
8. **Address charge 16 (A33 sequencing).** Move A33 to be sequenced before A3, or add note "do A33 before A3" in the table.
9. **Address charge 22 (ongoing token cost).** Add §11 with per-cron monthly burn estimate.
10. **Address charge 27 + 39 (A38-A40 routing).** Pick: excise to v0.6 track or add explicit "Phase-3-or-later, not Phase-2" marker to those rows.
11. **Address charge 37 (retention policy).** Add retention rule for `data/inbox-stream/` and adjacent surfaces in A33's evidence.
12. **Address charge 26 (gitignore mitigation cite).** Add C13 or §3 Q6 footnote citing gitignore line 73 as the AZ-paths mitigation.
13. **Address charge 4 (§9 structural pattern).** Either remove §9 and absorb concessions structurally, or expand each item from concession-defense to concession-revision-or-rejection.
14. **Address charge 41 (read-from-inside-shaping in §0).** One paragraph in §0.
15. **Address charge 11 (texts-ingest reframing).** Add to A36 evidence: "if reactivated, build is privacy-architecture not privacy-policy."
16. **Address charge 13 (A4 invariant scope).** Enumerate which I-N invariants A4 ratifies.

The remaining charges (8 dashboard rename, 14 wikilinks count, 15 timing arithmetic, 17 CLAUDE.md correction wording, 18 generator investigation, 19 .proposed-vs-A1 framing, 20 §0 reasoning hygiene, 21 §3 question framing, 23 alert-fatigue, 25 A33 already done, 28 A40 design depth, 29 A28 owner tag, 30 A18 routing into bottleneck, 31 A21/A22 grouping, 32 A13 effort, 34 Constitution size, 35 __pycache__, 36 MASTERPLAN, 38 hedge phrasing, 40 §3 confidence flatness) are minor or cosmetic; Wave 5 can address in batch or defer. Charges 2 (uplift framing) and 3 (audit nuance preservation) are real but addressable through charge 1's restructuring.

---

## Closing note

PROPOSAL.md is a real piece of work. It correctly identifies the high-leverage actions and groups them sensibly. The audits are well-aggregated. Where it fails — and the failures are concentrated, not distributed — is in the synthesizer's relationship to their own framing. The 5-layer architecture is borrowed and not defended. The "uplift" register is borrowed and not examined. The §9 pre-acknowledgement is performed and not absorbed. The observer's most consequential observations (#1, #4, #5, #9, #10) are either ignored or partially acknowledged without revision.

The hardest charges (1, 5, 7) are not fixable by adding rows to the action table. They require the synthesizer to step outside the framing they have been working inside, and to write a paragraph or two of meta-reasoning about how the proposal is constructed. Wave 5's hardest task is not addressing 41 charges — it is doing the framing-level revision that makes 4-5 of those charges land cleanly. The remaining 35 are mechanical.

Total charges: **41.**
- hard-stop: 3 (charges 1, 5, 6)
- requires-revise: 18
- requires-acknowledge: 8
- minor: 12

— prosecutor, 2026-05-06, opus-4.7, 1M context, fresh context, Wave 4

*Reading was sequential: PROPOSAL → OBSERVER-NOTES → PLAN → audits → inhabitants. Cross-checking went in reverse. The .gitignore and source-documents/ checks were the only file-system operations. No memory edits were made. No agents were dispatched.*
