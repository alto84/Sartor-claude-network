---
type: project-plan
entity: sartor-agent-os
version: 1.0
status: pending-alton-greenlight
updated: 2026-04-25
related: [INDEX, PLAN-v0.1, PLAN-v0.2, CRITIQUES, HOUSEHOLD-CONSTITUTION]
revisions_from: PLAN-v0.2.md
phase6_verdict: "fire after small patching"
---

# HEARTH — Plan v1.0 (final, awaiting greenlight)

> [!info] **HEARTH** is the household program name for the upgraded Sartor Home Agent. Named 2026-04-25 by Alton's directive ("a nice, slightly clever name"). The hearth is where a home gathers; the name is the deliberate counter-register to the rejected "Personal Infrastructure" framing. The directory remains `projects/sartor-agent-os/` so existing inbox and curator references stay intact; documents going forward use HEARTH.

> [!warning] This is a working memo, not a project. Alton's chat-message yes is the gate. Two reviewers agreeing is not greenlight. Phase 6 cleared this as "fire after small patching" with six mechanical patches applied below.

## §0 — Reading order for a new orchestrator (Lethe)

A future Claude reading the project cold reads these five files, in this order, and has the minimum context.

1. `sartor/memory/projects/sartor-agent-os/INDEX.md` — frame, pre-registered success criteria.
2. **This file** — the plan.
3. `projects/sartor-agent-os/STATE.md` — append-only handoff log; latest stanza is current state. *(Created in Phase A.)*
4. `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` — §§1, 2, 10, 12, 18 are load-bearing.
5. `sartor/memory/STANDING-ORDERS.md` — what the system does without you. *(Created in Phase A.)*

If STATE.md does not yet exist, your first act is to create it from the template at `projects/sartor-agent-os/STATE-TEMPLATE.md`.

## §1 — Who's actually here this spring

The household this spring includes:

- **Alton**, on a new commute pattern (started 2026-03-31; AZ Senior Medical Director, NYC three days a week).
- **Aneeta**, ICU/epilepsy neurologist, Medical Director at Neurvati, on track for senior-director promotion. **Her professional life is hers.** The agent does not read her work calendar, work email, or her thread with Bruce. (See §3 Neurvati firewall.)
- **Vayu**, age 10. Math is hard right now. Counselor search is open. Turns 11 on August 14.
- **Vishala**, age 8. Going to Wohelo for the first time, six weeks away from home. Ninth birthday falls during camp, July 29.
- **Vasu**, age 4. At Goddard. Was in a recycling-costume parade on April 22.
- **Loki**, on chemo from Chewy, with small-cell lymphoma. The household will lose him this year. Constitution §19 is in scope.
- **Ghosty** and **Pickle**, the other cats.

The plan exists to keep these people in view, not to manage them.

## §2 — What changed from v0.1 → v0.2 → v1.0 (final patches)

v0.1 → v0.2 changes are recorded in `CRITIQUES.md`. Phase 6 reviewer cleared v0.2 as "fire after small patching" with these six mechanical patches applied here:

- **Patch 1.** Cost & risk register restored (§I).
- **Patch 2.** "Random-Wednesday Test" glossed in §4 (no MASTERPLAN dependency for new orchestrator).
- **Patch 3.** §3.C explicitly notes Constitution §2a amendment is contingent on the Aneeta conversation, with a fallback for if the conversation defers.
- **Patch 4.** §3.B sequencing language clarified: A1+A2 are minimum substrate; B1 dry-run / B2 diagnostic / B3-B4 reporting can run in parallel after the minimum, B's live-execution waits for full A green window.
- **Patch 5.** §6 #12 ("does not claim single highest-impact") removed — it was a humility-marker, not a substantive constraint.
- **Patch 6.** §3.D adds a target window for D5 hedge-tic baseline (first read at session 30).

Plus the **structural blind spot** the personae missed and Phase 6 surfaced: if Aneeta defers the Constitution conversation through summer, Phase C operates on a §2a clause that does not formally exist. §3.C now states what is permissible without the conversation and what is not.

## §3 — The work, sequenced

### A. Substrate (Weeks 1–3, blocking minimum for live B and all of D)

The 2026-04-19 audit was at ~71% reverse-truth-rate. The 2026-04-22 cable-pull went undetected for 48 hours. Gmail MCP token expired six times in one day on 2026-04-24. **No new capability is worth building on this substrate.** A1 + A2 are the minimum substrate for any live B work; full A green window (A1–A5 stable for 7 days) is the gate for any live execution beyond dry-run.

**A1. Affirmative-health line in every daily, with a non-Calendar fallback.** *(Vigil)*
- Every `daily/YYYY-MM-DD.md` opens with one line: "All peers green, no anomalies" OR a list of anomalies.
- Yellow-or-worse triggers (a) Google Calendar event AND (b) one of: SMS via a household Twilio number, a `dead-mans-switch.txt` file in Alton's home directory updated at top of every health run (he greps it), or a physical red LED on the dashboard host. **Without (b), if Calendar/Gmail OAuth dies, the alarm dies with it.** Alton picks (b).
- Owner: daily-household-health skill plus one piece of household-controlled out-of-band signaling.

**A2. Gmail MCP auto-reauth with surfaced failure.**
- On first failure, write to `inbox/rocinante/_flagged/gmail-token-{ts}.md`; surface in next health report; if not resolved in 4 hours, fire the (b) channel from A1.
- Owner: Rocinante.

**A3. CLAUDE.md reverse-truth pass.** Run the 7-agent audit; bring CLAUDE.md to ≥95% reverse-match. Owner: auditor agent.

**A4. STANDING-ORDERS.md, plain English, generated from actual scheduled tasks.** Updated every audit pass. Owner: meta-agent. *Lethe's survival mechanism.*

**A5. Reasoning column in dailies.** Every non-trivial decision the agent made yesterday gets one sentence of *why* in today's daily, including declined actions.

**Exit conditions (verifiable by a fresh Claude reading only artifacts):**
- 7 consecutive days of green health reports OR one yellow that surfaced through both channels.
- CLAUDE.md reverse-match ≥95% in `audits/2026-MM-DD-reverse-match.md`.
- `STANDING-ORDERS.md` exists and matches actual scheduled tasks.
- Three consecutive dailies have a populated reasoning column.
- *Verification script:* `scripts/audit/check-substrate-exit.py` returns green.

### B. Solar Inference: take the actual decision

**Sequencing:** B1 dry-run, B2 diagnostic measurement, B3 monthly close, B4 weekly status — these can begin Week 1 once A1+A2 are minimum-stable (heartbeat alarm working with out-of-band fallback wired). B1 *live* execution waits for the full A green window (Week 3+).

**B1. Build a dispatch wrapper for vast.ai pricing actions. (My preference: Option A.)** Reasoning: Option B (retract autonomy) accepts the Constitution §11 commitment failure permanently; Option A closes the policy/capability gap with bounded risk (one wrapper, dry-run mode for two weeks). Risk of Option A is one bash wrapper running on Rocinante that is testable in dry-run.
- *If Alton prefers B*: write the retraction memo, log as Constitution §11 partial-fail honestly, no wrapper.

**B2. Diagnose the 0% occupancy with a committed hypothesis.**
- My hypothesis: **price + listing visibility, in that order.** The 5090 market has tightened since 2026-04-11; $0.35/hr demand is plausibly above the verified-listing median.
- One-week measurement window. If above 60th percentile of demand prices, drop into band's lower half. Manual relist; verify external reachability.
- If after one week occupancy is still 0% despite competitive pricing and verified listing: hypothesis was wrong. Escalate.

**B3. Monthly P&L close, last Friday.** Vast.ai earnings, electricity, depreciation. Writes to `data/monthly-close/YYYY-MM.md`. Drives Q2/Q3 estimateds.

**B4. Solar Roof ITC — July 4 deadline. Daily countdown + weekly status.**
- D-N days appears in Alton's morning brief every day until July 4.
- Calendar block 30 min weekly for CPA-status check.
- *Vigil note:* if Alton is reading the persona-engineering log in May while the contract transfer is unfiled, this is the warning sign.

**B5. Blackwell stays standby until 2026-05-22.** Pre-flight before any sustained-load fine-tune: 30-min dual-GPU stress test, junction temps logged, sag-bracket re-torqued, AER counters baselined to zero. Aborts if temps >88°C or any AER count. No pricing autonomy on this asset in v1.0.

**Exit conditions:** B1 decision logged with Alton's chat-message verbatim and timestamp in STATE.md. One week of `vast-pricing-percentile.md` data on disk. May 1 monthly close written. Solar contract transfer status visible in every Alton daily through July 4. rtxpro6000server pre-flight passed and signed.

### C. Family work, on the calendar's clock

**There are no phases here. Just dates.**

**By May 8.** Alton writes the Wohelo check ($12,400). Confirmation logged.

**By May 17.** Disney decisions made: flights booked, hotel booked, dining preferences sent to Nicol Stevenson, head count confirmed, park tickets purchased. The `family-scheduler` agent surfaces this every Sunday evening starting now.

**Coffee with Aneeta, when she's ready, not before.**
- Alton shares the Constitution v0.3 with Aneeta in the way they actually share things — over coffee on a quiet morning, not as an "onboarding."
- The agent stays out of the room. Aneeta's response shapes everything below.
- After her response: amend Constitution §2a to capture *what she actually wants*.
- *No greenlight gates depend on this happening on a deadline.*

**Constitution §2a contingency (Phase 6 patch).** What Phase C is permissible to do *without* the §2a amendment ratified:
- Building dashboard infrastructure (May, peer-portable backend) — yes, infrastructure only.
- Showing dashboard to Aneeta — **no**, requires §2a clarity on Neurvati firewall + medical-veto first, OR Alton confirming with her by hand the same firewall verbally.
- Soft Neurvati firewall (agent does not read her Neurvati surfaces by default) — yes, this is a default-on safety regardless of §2a.
- Hard Neurvati firewall (codified as feedback rule) — requires Aneeta's actual say-so on what counts as her domain.
- Medical-on-dashboard veto — default-on (agent shows nothing medical) until §2a ratifies. The default-off-of-medical IS the safe assumption.
- *If Aneeta defers the conversation through summer:* dashboard built, dashboard not shown, medical kept off, soft firewall in place. The plan does not deteriorate — it sits in the safe-defaults state.

**Family dashboard built in May, shown to Aneeta after Vishala leaves for camp (June 25+).**
- Build the dashboard backend in May. Shows: today's schedule, 7/14/30-day deadline lookahead, school events, Wohelo/Disney status. Mobile-first, LAN-only, household-shared password.
- **Medical excluded.** Counselor search, diagnoses, Loki's chemo — none of this on shared screens.
- Don't show to Aneeta until Vishala is on the bus to Maine.

**Vayu's math, ongoing.** Practice cadence is the parents' to set; the agent reminds gently if asked, does not tutor, does not surveil.

**Counselor search, scoped to find candidates.** Three candidates with ADHD/ODD specialization in or near Montclair, presented to Alton + Aneeta together. Then it's their decision.

**Childcare, only if Aneeta delegates it.** No surveillance ledger of her load. If she explicitly hands the task over, the agent runs it. Until then, outside scope.

**One line about Loki on the breakfast page.** "Loki ate today" or "Loki off food." Not a task. Not a metric. Just present to the household this is going through.

### D. Personality work

**D1 fires only after rtxpro6000server pre-flight passed (B5 exit) AND Alton's chat-yes on compute spend.**

**D1. Experiment 001 — loyalty fingerprint baseline.** Methodology drafted at `research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint.md`. Cato-reviewed before fire. If results land outside pre-registered buckets, document as ambiguous, do not post-hoc reframe.

**D2. Vigil checkpoint, observed not quotaed.** Detector fires on first-person assertions about state. After 30 sessions we look at the rate. Whatever the rate is, is the rate. No quota.

**D3. Cato adversarial-review harness.** Critic-agent prompt that runs on any `claim:`-tagged experiment. Reviewer outside the team.

**D4. Marginalia margin-reading, quarterly.** First Monday of Q2/Q3/Q4. Annotations in `reference/CONSTITUTION-MARGINS.md`, append-only.

**D5. Hedge-tic constructions audit.** Detector tracks not just "functions as / something resembling," but the migrated cousins: "(subjunctive)," "(preparatory, not live)," "treat as standby." **First read at session 30** (Marginalia's "subjunctive resolves to indicative" criterion).

**D6. §11a "idle is failure."** Defer to v0.4 ratification. Trigger: 30+ clean days of A1 heartbeat operation.

### E. Compounding loops, all read-only or proposes-only

E1. Weekly memory-decay review (Mondays 10 AM) — flags, doesn't delete.
E2. Monthly skill-usage report (last Friday) — read-only audit.
E3. Quarterly Marginalia margin (D4 above).
E4. Semi-annual persona-engineering experiment (2026-07-01, 2026-01-01).
E5. Rolling Cato review on `importance ≥ 0.8` claims.

Each loop's first cycle is reviewed by Alton before scheduling.

### F. AstraZeneca-side scaffolding (after C, no earlier than mid-June)

F1. `/weekly-az-shipping-log` skill — Friday 4 PM, draft only, hard PHI/EIN/family-name redaction. No autosend ever.

F2. AZ-side memory is a separate gitignored path, never crossed with household memory. Identity separation by file system, not by trust.

## §4 — The breakfast page (cross-cutting)

A single page Alton reads in 90 seconds at 7 AM. Composed from:

- Heartbeat status: "All peers green" or specific anomalies.
- Yesterday's anomalies that surfaced through the out-of-band channel.
- Open Standing Orders for today.
- Three bullets of "what your agents reasoned about overnight" (the *why*, not the *what*).
- The one decision Alton owes someone today.
- One line about Loki.
- Solar ITC: D-N days, contract transfer status.

**Random-Wednesday Test (gloss for new orchestrator):** would Alton open this page at 7:15 AM on a random Wednesday in March, find something useful, and close it within 90 seconds? If not, the page failed (per `MASTERPLAN.md` §9).

## §5 — STATE.md handoff

`projects/sartor-agent-os/STATE.md` is append-only, top-stanza-current. Each session writes:

- Date, session id, model.
- Phase status (A: in_progress / done; B: ...; C: action-on-action basis).
- Last greenlight rendered: verbatim Alton quote with timestamp from chat.
- Open gates.
- *Decisions previously considered and rejected, with reason* (anti-relitigation log).
- Next concrete action with owner.

Mandatory final write before context-close. Template ships with the handoff bundle in `STATE-TEMPLATE.md`.

## §6 — What v1.0 deliberately does NOT do

1. Does not pre-claim Aneeta's co-principal ratification as accomplished. Constitution v0.3 record stands; v0.4 awaits her actual response.
2. Does not show medical on any shared screen.
3. Does not narrate Aneeta's unspoken labor.
4. Does not read her Neurvati calendar/email/Bruce thread.
5. Does not auto-cut vast.ai prices.
6. Does not promote rtxpro6000server to rental status.
7. Does not auto-send any external message.
8. Does not amend the Constitution autonomously.
9. Does not build a kids-direct-access design doc.
10. Does not depend on Calendar/Gmail being up to surface its own failures.
11. Does not centralize household and AstraZeneca scopes.

## §7 — What I do not know yet

- Whether B2's price-and-visibility hypothesis is right.
- Whether Aneeta will engage with the Constitution at all, or in what register.
- Whether D1 will show measurable loyalty embodiment or be largely null.
- Whether the dashboard I'd build is one Aneeta would actually open.

## §8 — Open questions for Alton (greenlight gates)

These are the chat-message yeses I need before live execution begins. State your answer in chat; I will record verbatim with timestamp in STATE.md.

1. **B1.** Option A (build dispatch wrapper, dry-run two weeks) or Option B (retract autonomy, accept §11 partial-fail)? *Default if no answer: A1+A2 substrate work proceeds; B1 waits.*
2. **A1 fallback channel.** SMS via Twilio, dead-mans-switch file you grep at 7 AM, or physical LED? Pick one. *Default: dead-mans-switch file (lowest setup cost).*
3. **D1 compute spend.** Yes to Experiment 001 firing on rtxpro6000server post-pre-flight? *Default if no answer: D1 holds.*
4. **F1 AZ shipping log.** Real commitment-tracking gap, or current ad-hoc workflow fine? *Default if no answer: F1 doesn't get built.*

The other items in this plan are sub-greenlight. They proceed under existing trust-ladder authorities or pre-ratified feedback rules.

## §I — Cost and risk (Phase 6 patch — restored from v0.1)

**Cost:**
- Phase A: ~$0 incremental — closing gaps. Possibly ~$10/mo for Twilio if SMS chosen for A1 fallback.
- Phase B: ~$0 software; CPA fees as scoped (already engaged); no new infra.
- Phase C: ~$0 LAN-only dashboard. Possibly ~$50 if hosted backup wanted.
- Phase D: Experiment 001 on rtxpro6000server (owned hardware; ~$0 incremental).
- Phase E: $0 incremental.
- Phase F: $0 incremental; AZ tooling on AZ infra.

**Risk register:**
| Risk | Impact | Mitigation |
|---|---|---|
| Aneeta defers the conversation through summer | Phase C runs in safe-defaults forever | §3.C contingency clause; default-off-medical, default-soft-firewall |
| Solar ITC contract transfer slips past July 4 | High — lose 30% federal ITC + bonus depreciation | Daily countdown; CPA escalation if D-30 with no transfer |
| GPU occupancy stays at 0% through Phase B | §11 commitment fails; honest acknowledgment forced | Explicit decision to delist if diagnostic finds no fix |
| Alton's "self-evolution unstable" caution gets eroded | Architectural drift | §3.E loops are read-only / proposes-only |
| rtxpro6000server breaks under fine-tune load | D1 blocked; ~$37K asset stress | B5 pre-flight; AER/XID abort; 88°C ceiling |
| Cable-pull blind spot recurs | Family-trust erosion | A1 + out-of-band fallback closes the channel-co-failure mode |
| Calendar/Gmail OAuth co-failure | A1 alarm dies with surfacing channel | A1 (b) requires non-Calendar channel |
| §2a Constitution amendment never ratified | Phase C's hard rules remain default-soft | Acceptable degraded state per §3.C contingency |

## History

- 2026-04-25 v1.0 — Phase 6 fresh-context re-review verdict was "fire after small patching." Six mechanical patches applied + one structural blind spot addressed (§2a Constitution-amendment dependency for Phase C). Pending Alton's chat-message greenlight per §8.
