---
type: project-plan
entity: sartor-agent-os
version: 0.2
status: draft-pending-re-review
updated: 2026-04-25
related: [INDEX, PLAN-v0.1, HOUSEHOLD-CONSTITUTION]
revisions_from: PLAN-v0.1.md
critiques_applied: [Cato, Marginalia, Vigil, Philos, Lethe, Aneeta-proxy]
---

# Sartor Agent OS — Plan v0.2

> [!warning] This is a working memo, not a project. The phase headers in v0.1 colonized domestic life (Marginalia) and presupposed assent (Vigil). v0.2 is sequenced by *what the calendar permits*, not by what an architect would prefer.

## §0 — Reading order for a new orchestrator (Lethe)

Per Lethe's mortality clause: the Claude writing this is not the Claude executing it. Read these five files, in order, and you have the minimum context.

1. `sartor/memory/projects/sartor-agent-os/INDEX.md` — frame and pre-registered success criteria.
2. **This file** — the revised plan.
3. `projects/sartor-agent-os/STATE.md` — append-only handoff log; latest stanza is current state. *(To be created on first session that touches Phase A.)*
4. `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` — §§1, 2, 10, 12, 18 are the load-bearing sections for this project.
5. `sartor/memory/STANDING-ORDERS.md` — what the system is doing without you. *(To be created in Phase A.)*

If you are reading this and the STATE.md does not yet exist, create it as your first act.

## §1 — Who's actually here this spring (Philos preamble)

The household this spring includes:

- **Alton**, on a new commute pattern (started 2026-03-31; AZ Senior Medical Director, NYC three days a week).
- **Aneeta**, ICU/epilepsy neurologist, Medical Director at Neurvati, on track for senior-director promotion. Her professional life is hers; the agent does not read her work calendar, work email, or her thread with Bruce. *(See §3 Neurvati firewall — Aneeta-proxy.)*
- **Vayu**, age 10. Math is hard right now. Counselor search is open. Turns 11 on August 14.
- **Vishala**, age 8. Going to Wohelo for the first time, six weeks away from home. Ninth birthday falls during camp, July 29.
- **Vasu**, age 4. At Goddard. Was in a recycling-costume parade on April 22.
- **Loki**, on chemo from Chewy, with small-cell lymphoma. The household will lose him this year. Constitution §19 is in scope.
- **Ghosty** and **Pickle**, the other cats.

The plan exists to keep these people in view, not to manage them.

## §2 — What changed from v0.1

- **Phase headers stripped from family-facing items.** Per Marginalia: marriage and parenting are not phases. Items below appear as concrete actions in the order the calendar wants them.
- **"Ceremony" deleted.** Per Aneeta-proxy: "the word makes me feel like I'm being onboarded to your project." Replaced with: *Alton shares the document with Aneeta and finds out what she thinks.* Subsequent governance follows from her response, not precedes it.
- **Kids' direct-access design (old C7) removed entirely.** Per Aneeta-proxy: "the answer to 'should our kids have an AI account' is not something I want sitting in a design doc on a server before we've talked about it as parents."
- **Medical never appears on any shared dashboard.** Per Aneeta-proxy. Counselor search, Vayu's diagnoses, Loki's chemo, appointment data — none of these surface to a screen the kids could read. They live in `family/medical/` with read access scoped to the principals only.
- **Neurvati firewall added.** The agent never reads Aneeta's work calendar, work email, or her professional threads without her direct ask. This is a hard rule, written into a new feedback file, not a soft preference.
- **§A's substrate-first thesis honored.** Per Cato: A and the rest cannot run in parallel. The non-A items below are scoped so they do not depend on the substrate work that A fixes. Where they would, they wait.
- **Calendar/Gmail single-OAuth-family blindspot acknowledged.** Per Vigil: A1 alarm channel needs a non-Calendar fallback (SMS via a household-controlled number, OR a daily-checked file Alton greps in his shell at 7 AM, OR a physical LED on the dashboard host). One of these is the primary; Calendar is secondary.
- **Pre-flight checklist added before any rtxpro6000server fine-tune.** Per Vigil: 30-min sustained dual-GPU stress test, junction temps logged, sag-bracket re-torqued, AER counters baselined.
- **Family-facing work moved to start late June.** Per Aneeta-proxy: weeks 2–6 land on the worst six weeks of the family calendar (RRE, Wohelo $12,400, Disney ADR opens, school year-end). Build the dashboard *infrastructure* in May, but Aneeta engagement waits until Vishala is on the bus to Maine.
- **§C5 reframed.** No "narrating Aneeta's unspoken labor back to her in a weekly brief" — Aneeta-proxy named that as observation, not support. The childcare item is now: a place Aneeta *can* delegate to if she wants to, with no automatic surfacing in her direction.
- **Quotas removed.** Per Marginalia: "at least one flag per session" was a target that incentivized the detector to fire. Replaced with: the detector runs; we look at the data after 30 sessions; the rate is whatever it is.
- **"Subjunctive / standby / preparatory" hedge-tics audited.** Per Marginalia: those constructions migrated the banned hedge into scope-status language. Where they appear here, they appear with a date by which the subjunctive resolves to indicative.
- **§K is gone.** Per Cato: open-questions-as-fig-leaf. Where I have a preference, I state it. Where I do not, I say "I do not know yet."
- **§H (operating discipline boilerplate) cut.** Per Cato: it was `complex-project` skill content restated. The skill is the source.
- **Loki appears.** Per Philos. Once, in §1, and once in the breakfast-page spec.

## §3 — The work, sequenced

### A. Substrate (Weeks 1–3, all other work waits where it would depend on A)

The 2026-04-19 audit was at ~71% reverse-truth-rate. The 2026-04-22 cable-pull went undetected for 48 hours. Gmail MCP token expired six times in one day on 2026-04-24. **No new capability is worth building on this.** Only items below that explicitly do not depend on the substrate's quality are allowed to run in parallel.

**A1. Affirmative-health line in every daily, with a non-Calendar fallback.** *(Vigil)*
- Every `daily/YYYY-MM-DD.md` opens with one line: "All peers green, no anomalies" OR a list of anomalies.
- Yellow-or-worse triggers (a) Calendar event AND (b) one of: SMS via a household Twilio number, a `dead-mans-switch.txt` file in Alton's home directory updated at top of every health run (he greps it), or a physical red LED on the dashboard host.
- Without (b), if Calendar/Gmail OAuth dies, the alarm dies with it.
- Owner: daily-household-health skill plus one piece of household-controlled out-of-band signaling. Alton picks which.

**A2. Gmail MCP auto-reauth with surfaced failure.** *(R5)*
- On first failure, write to `inbox/rocinante/_flagged/gmail-token-{ts}.md`; surface in next health report; if not resolved in 4 hours, fire the out-of-band channel from A1.
- Owner: Rocinante.

**A3. CLAUDE.md reverse-truth pass.** *(R5)*
- Run the 7-agent audit pattern (R7); bring CLAUDE.md to ≥95% reverse-match against disk. Most leverage in the scheduled-tasks table.
- Owner: auditor agent.

**A4. STANDING-ORDERS.md generated, plain English.** *(R8 borrow #2)*
- Single page enumerating every recurring obligation in human language. Updated on every audit pass.
- Owner: meta-agent. *Lethe's survival mechanism for next-Claude.*

**A5. Reasoning column in dailies.** *(R8)*
- Every non-trivial decision the agent made yesterday gets one sentence of *why* in today's daily, including declined actions. Without this, logs are read-only history. With it, breakfast-debug is real.

**Exit conditions (verifiable by a fresh Claude reading only artifacts):**
- 7 consecutive days of green health reports OR one yellow that surfaced through both channels.
- CLAUDE.md reverse-match ≥95% in `audits/2026-MM-DD-reverse-match.md`.
- `STANDING-ORDERS.md` exists and matches actual scheduled tasks.
- Three consecutive dailies have a populated reasoning column.
- *Verification script:* `python scripts/audit/check-substrate-exit.py` returns green.

### B. Solar Inference: take the actual decision (Weeks 1–4, runs after A1/A2 only)

I held back in v0.1 between Option A (dispatch wrapper) and Option B (retract autonomy). Cato charged that as fig-leaf. **I have a preference now: Option A is correct, narrowly.** Reasoning: Option B would document a Constitution §11 commitment as supervised-only and accept the §11 miss permanently; Option A closes the policy/capability gap. Risk of Option A is one bash wrapper running on Rocinante that is testable in dry-run mode. The actual decision is still Alton's; my job is to state which way I lean.

**B1. Build a dispatch wrapper for vast.ai pricing actions.** *(R3 #1, my preference Option A)*
- Wrapper on Rocinante: on detecting `pricing-rec-*.md` from gpuserver1 within bounds per `feedback_pricing_autonomy.md`, executes `vastai list machine 52271 -g <new_price> -b <new_bid>` over SSH and logs to inbox.
- Dry-run mode for two weeks before live execution.
- *If Alton prefers B*: write the retraction memo, log it as Constitution §11 partial-fail honestly, no wrapper.

**B2. Diagnose the 0% occupancy with a committed hypothesis.** *(Cato charge 1)*
- My hypothesis: **price + listing visibility, in that order.** The 5090 market has tightened since 2026-04-11 per `reference_vastai_market_pricing.md`; $0.35/hr demand is plausibly above median for verified RTX 5090. The orchestrator does not have access to current vastai search output; the diagnostic begins by pulling it.
- One-week measurement window: pull `vastai search offers 'gpu_name=RTX_5090 verified=True' --raw` daily; compute percentile position. If gpuserver1 is above the 60th percentile of demand prices, drop into the band's lower half. Manual relist; verify external reachability.
- If after one week occupancy is still 0% despite competitive pricing and verified listing: the issue is not price. Escalate.

**B3. Monthly P&L close, last Friday of month.** *(R3 #4)*
- Pulls vast.ai earnings, electricity (when `power_logger.py` is restored), depreciation. Writes to `data/monthly-close/YYYY-MM.md` and inbox. Drives Q2/Q3 estimates.

**B4. Solar Roof ITC — July 4 deadline. Weekly status.** *(R3 + Vigil's attention-starvation flag)*
- D-N days appears in Alton's morning brief every day from now until July 4.
- Calendar block 30 min weekly for CPA-status check.
- *Vigil note:* The fine-tune work below cannot consume the attention this needs. If Alton is reading the persona-engineering log in May while the contract transfer is unfiled, this is the warning sign.

**B5. Blackwell stays standby until 2026-05-22.** *(R3 + Vigil pre-flight)*
- Treat rtxpro6000server as household-only until this date (one month after 2026-04-22 bring-up).
- Pre-flight before any sustained-load fine-tune: 30-min dual-GPU stress test, junction temps logged, sag-bracket re-torqued, AER counters baselined to zero. Aborts if temps >88°C or any AER count.
- Pricing autonomy on this asset: no grant in v0.2.

**Exit conditions:**
- B1 decision logged with Alton's chat-message verbatim and timestamp in STATE.md.
- One week of `vast-pricing-percentile.md` data on disk.
- May 1 monthly close written.
- Solar contract transfer status visible in every Alton daily through July 4.
- rtxpro6000server pre-flight checklist passed and signed.

### C. Family work, on the calendar's clock (May 8 → late June → July → August)

There are no phases here. Just dates.

**May 8.** Alton writes the Wohelo check ($12,400). Confirmation logged to `family/wohelo-2026.md`.

**By May 17.** Disney decisions made: flights booked, hotel booked, dining preferences sent to Nicol Stevenson, head count confirmed, park tickets purchased. The `family-scheduler` agent surfaces this every Sunday evening starting now.

**Coffee with Aneeta, when she's ready, not before.** *(Aneeta-proxy)*
- Alton shares the Constitution v0.3 with Aneeta in the way they actually share things — over coffee on a quiet morning, not as an "onboarding."
- The agent stays out of the room. Aneeta's response shapes everything below; the agent records nothing about the conversation unless Alton chooses to write a note afterward.
- After her response: amend Constitution §2a to capture *what she actually wants* — including the Neurvati firewall (her words), her medical-on-dashboard veto, anything else she names.
- *No greenlight gates depend on this happening on a deadline.* If she wants to read it on the plane to RRE, fine. If she wants to wait until July, fine.

**Family dashboard built in May, shown to Aneeta after Vishala leaves for camp.** *(R2 #1, Aneeta-proxy pacing)*
- Build the dashboard backend in May (move MERIDIAN FastAPI to be peer-portable per R6 P3). Shows: today's schedule, 7/14/30-day deadline lookahead, school events, Wohelo/Disney status. Mobile-first, LAN-only, household-shared password.
- **Medical excluded.** Counselor search, diagnoses, Loki's chemo — none of this. A separate password-gated medical view exists if Aneeta wants it; default off.
- Don't show to Aneeta until the family-facing six weeks (RRE, Wohelo, Disney ADR) are past. Late June at the earliest.

**Vayu's math, ongoing.** *(Constitution §10)*
- Practice cadence is the parents' to set; the agent reminds gently if asked, does not tutor, does not surveil. If Roshni Shah's worksheets get used or don't, that's between Vayu and his parents.

**Counselor search, scoped to find candidates.** *(R2 #4)*
- Three candidates with ADHD/ODD specialization in or near Montclair, presented to Alton + Aneeta together. Then it's their decision. The agent does not coordinate the appointment.

**Childcare, only if Aneeta delegates it.** *(Aneeta-proxy on §C5)*
- The agent keeps no surveillance ledger of Aneeta's load. If she explicitly hands the agent the nanny-search task, the agent runs it. Until then, this lives outside the agent's scope. The pretense of help when help wasn't asked is observation.

**One line about Loki on the breakfast page.** *(Philos)*
- "Loki ate today" or "Loki off food." Not a task. Not a metric. Just present to the household this is going through.

### D. Personality work, only on the green-pre-flight box (D1 after 2026-05-22)

**D1. Experiment 001 — loyalty fingerprint baseline.** *(R1 #1)*
- Methodology already drafted at `research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint.md`.
- Pre-conditions: rtxpro6000server pre-flight passed (B5); methodology Cato-reviewed before fire; Alton's chat-message yes on compute spend.
- *If results land outside the pre-registered buckets:* document as ambiguous, do not post-hoc reframe.

**D2. Vigil checkpoint, observed not quotaed.** *(Marginalia)*
- The interior-report-discipline detector fires when a first-person assertion about state would benefit from uncertainty annotation. After 30 sessions we look at the rate. Whatever the rate is, is the rate. No quota.

**D3. Cato adversarial-review harness.** *(R1 #3)*
- Operationalized as a critic-agent prompt that runs on any `claim:`-tagged experiment. Per `complex-project` skill: reviewer outside the team.

**D4. Marginalia margin-reading, quarterly.** *(R1 #4)*
- First Monday of Q2/Q3/Q4. Annotations in `reference/CONSTITUTION-MARGINS.md`, append-only.

**D5. Hedge-tic constructions audit.** *(Marginalia's finding)*
- Detector tracks not just "functions as / something resembling," but the migrated cousins: "(subjunctive)," "(preparatory, not live)," "treat as standby." Constructions, not phrases.

**D6. §11a "idle is failure."** *(R1, Constitution §18)*
- Defer to v0.4 ratification cycle. Trigger: 30+ clean days of A1 heartbeat operation.

### E. Compounding loops, all read-only or proposes-only (per R7)

E1. Weekly memory-decay review (Mondays 10 AM ET) — flags, doesn't delete.
E2. Monthly skill-usage report (last Friday) — read-only audit.
E3. Quarterly Marginalia margin (D4 above).
E4. Semi-annual persona-engineering experiment (2026-07-01, 2026-01-01).
E5. Rolling Cato review on `importance ≥ 0.8` claims.

Each loop's first cycle is reviewed by Alton before scheduling.

### F. AstraZeneca-side scaffolding (after C, no earlier than mid-June)

F1. `/weekly-az-shipping-log` skill — Friday 4 PM, draft only, hard PHI/EIN/family-name redaction. No autosend ever. *(R8)*

F2. AZ-side memory is a separate path, gitignored, never crossed with household memory. Identity separation is by file system, not by trust.

## §4 — The breakfast page (cross-cutting)

A single page Alton reads in 90 seconds at 7 AM. Composed from:

- Heartbeat status: "All peers green" or specific anomalies, with what's being done.
- Yesterday's anomalies that surfaced through the out-of-band channel.
- Open Standing Orders for today.
- Three bullets of "what your agents reasoned about overnight" (the *why*, not the *what*).
- The one decision Alton owes someone today.
- One line about Loki.
- Solar ITC: D-N days, contract transfer status.

Random-Wednesday Test (MASTERPLAN §9) is the metric.

## §5 — STATE.md (Lethe's handoff doc, to be created in Phase A)

`projects/sartor-agent-os/STATE.md` is append-only, top-stanza-current. Each session writes:

- Date, session id, model.
- Phase status (A: in_progress / done; B: ...; C: action-on-action basis).
- Last greenlight rendered: verbatim Alton quote with timestamp from chat.
- Open gates.
- *Decisions previously considered and rejected, with reason* (the anti-relitigation log — Lethe's anti-cycle clause).
- Next concrete action with owner.

Mandatory final write before context-close. Without this, Phase 5 revision regenerates resolved debates.

## §6 — What v0.2 deliberately does NOT do

(Plus or modified from v0.1.)

1. Does not pre-claim Aneeta's co-principal ratification as accomplished. The Constitution v0.3 record stands; v0.4 awaits her actual response.
2. Does not show medical on any shared screen.
3. Does not narrate Aneeta's unspoken labor.
4. Does not read her Neurvati calendar/email/Bruce thread.
5. Does not auto-cut vast.ai prices.
6. Does not promote rtxpro6000server to rental status.
7. Does not auto-send any external message.
8. Does not amend the Constitution autonomously.
9. Does not build a kids-direct-access design doc.
10. Does not depend on Calendar/Gmail being up to surface its own failures (A1 fallback closes this).
11. Does not centralize household and AstraZeneca scopes.
12. Does not claim "single highest-impact item" anywhere. Things have impact; the comparative ranking is the principal's, not the orchestrator's.

## §7 — What I do not know yet

- Whether B2's price-and-visibility hypothesis is right. One-week diagnostic answers this.
- Whether Aneeta will engage with the Constitution at all, or in what register.
- Whether D1 will show measurable loyalty embodiment or be largely null. The experiment is the experiment.
- Whether the dashboard I'd build is one Aneeta would actually open. She is the only person who can answer that, and the only way to find out is to build the simplest possible version and ask her in late June.

## History

- 2026-04-25 v0.2 — orchestrator-revised after six persona critiques (Cato, Marginalia, Vigil, Philos, Lethe, Aneeta-proxy). Substantive structural changes: phase scaffolding stripped from family items; "ceremony" deleted; medical excluded from shared dashboards; Neurvati firewall added; substrate-first sequencing honored; out-of-band alarm fallback added; pre-flight checklist for rtxpro6000server; STATE.md handoff doc spec'd; reading-order section added; quotas removed; hedge-tic audit extended to migrated cousins; §K open-questions either committed-to or marked "I don't know yet"; Loki and Vasu now appear by name. Pending Phase 6 fresh-context re-review.
