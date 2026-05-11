---
type: project-plan
entity: sartor-agent-os
version: 0.1
status: draft-pending-critique
updated: 2026-04-25
related: [INDEX, HOUSEHOLD-CONSTITUTION, OPERATING-AGREEMENT, MASTERPLAN]
---

# Sartor Agent OS — Upgrade Plan (v0.1, pre-critique)

> [!info] Phase 2 output. To be prosecuted in Phase 4 by six personae and one external reviewer.

## §0 — What Sartor is, in its own terms

The user pasted a generic "Agent OS" framework. R8's critique was decisive: the generic framing pulls Sartor toward *personal productivity infrastructure*, which it is not. Sartor is a **household constitutional system** with named principals (Alton + Aneeta), three minor children, a co-member LLC, three peer machines under a ratified Operating Agreement, six personae used for adversarial self-review, and a fine-tune in flight to inherit base-model behavior. The plan adopts what the framework gets right (engine substitutability as principle, plain-English standing-orders, log-readability-at-breakfast) and rejects what it gets wrong (single-user solipsism, autosend reports, "infrastructure" register).

The plan is structured as **six phases (A–F) plus a cross-cutting ledger upgrade**, each phase with its own greenlight gate. Phases A–C are the next 8 weeks. Phases D–F overlap A–C but compound through Q3.

---

## §A — Stabilize: close the 71% truth gap (Weeks 1–2)

The 2026-04-19 audit found ~71% reverse-truth rate (disk artifacts vs. CLAUDE.md). The 2026-04-22 incident showed the cable-pull blind spot. The Gmail MCP token expired six times in one day on 2026-04-24. **No new capability is worth building on this substrate.**

**A1. Heartbeat alarm closure** *(R6 P1)*
- Verify `sartor/memory/inbox/{rocinante,gpuserver1,rtxpro6000server}/_heartbeat.md` is updated on the documented cadence on every machine.
- Wire the `daily-household-health` skill (added 2026-04-25) to fire daily, write to `daily/health-YYYY-MM-DD.md`, and ping Alton via Google Calendar event on yellow-or-worse severity. *This already exists as a skill; the gap is making it the standing order.*
- Owner: Rocinante curator + scheduled task.
- Greenlight gate before A2: 7 consecutive days of green health reports, or one yellow that surfaced correctly.

**A2. Gmail MCP auto-reauth** *(R5 #3)*
- The MCP token expires silently and blocks `personal-data-gather` until manually reauthorized. Add: on first failure, write to `inbox/rocinante/_flagged/gmail-token-{ts}.md`; surface in next health report; if not resolved in 4 hours, escalate via the same Calendar-event channel as A1.
- Owner: Rocinante.

**A3. Truth-up CLAUDE.md, third pass** *(R5 truth-gap section)*
- The 2026-04-19 cleanup pass got CLAUDE.md to ~71% reverse-match. Run the audit pattern (per R7) again: `gateway_cron.py` listed as active is actually disabled; `weekly-skill-evolution` listed as Sunday 3 AM is deferred indefinitely; `rgb_status.py` runs every 5 min on gpuserver1 and was undocumented. Bring CLAUDE.md to ≥95% reverse-match. *Scheduled task table is the highest-leverage section.*
- Owner: meta-agent or auditor agent.

**A4. Standing Orders page** *(R8 borrow #2)*
- One human-readable page at `sartor/memory/STANDING-ORDERS.md` enumerating every recurring obligation in plain English, generated from the actual scheduled tasks (not cron syntax). Format: "Mondays 09:00 UTC — gpuserver1 reads vast.ai market and proposes pricing changes to Alton via inbox." Updated on every audit pass.
- Owner: meta-agent.

**A5. Affirmative-health line in every daily** *(R8 borrow #5)*
- Every `daily/YYYY-MM-DD.md` opens with one line: "All peers green, no anomalies" OR specific anomalies. Silence cannot read as success. (The 2026-04-22 cable-pull was undetected for 48h precisely because absence of news read as good news.)
- Owner: morning-briefing skill + daily-household-health.

**Phase A exit criteria (pre-registered):** Three consecutive weeks of (i) accurate CLAUDE.md, (ii) heartbeat alarms firing on test pulls, (iii) Gmail MCP reauth successful within one failure cycle, (iv) Standing Orders rendered, (v) every daily opens with the affirmative line.

---

## §B — Earn the keep: Solar Inference operations (Weeks 1–4, parallel with A)

R3 and R6 are aligned: gpuserver1 has been at $0 occupancy for ~2 months, the pricing-autonomy policy is theoretical because gpuserver1 cannot execute `vastai list machine` autonomously, and the July 4 Solar ITC deadline is 70 days away. The agent's Constitution §11 commitments are presently unmet.

**B1. Pricing-autonomy execution gap** *(R3 #1)*
- Decision required of Alton: **Option A** — Rocinante builds a dispatch wrapper that on detecting a `pricing-rec-*.md` from gpuserver1 within bounds, executes `vastai list machine 52271 -g <new_price> -b <new_bid>` via SSH and logs to inbox. **Option B** — retract autonomy and document the listing as supervised-only. Either way, close the policy/capability gap.
- Greenlight gate: explicit chat-message from Alton choosing A or B.

**B2. Diagnose the 0% occupancy** *(R3 chronic-pattern flag)*
- Two months of $0 rentals with the listing nominally active. Is the price uncompetitive? Is the listing visibility broken? Is the machine intermittently offline (the 2026-04-22 outage was not the first)?
- Action: One-week measurement window. Pull `vastai search offers 'gpu_name=RTX_5090 verified=True' --raw` daily; compute percentile position; manual relist if needed; verify machine reachability from outside the LAN.
- Owner: gpu-pricing agent + one-time diagnostic skill.

**B3. Monthly P&L close** *(R3 #4)*
- Last Friday of each month: pull vast.ai earnings (via SSH query), sum electricity (when `power_logger.py` is restored — currently broken per R3), depreciation estimate, net P&L. Write to `data/monthly-close/YYYY-MM.md` and inbox for Alton review. Drives Q2/Q3 estimated-tax payments.
- Owner: financial-analyst + tax-strategist agents on a scheduled task.

**B4. Solar Roof ITC — July 4, 2026 deadline** *(R3 tax interplay)*
- Solar contract is in Alton's personal name, not LLC. Must transfer before placed-in-service for LLC to claim 30% federal ITC + bonus depreciation on ~$373K depreciable basis. CPA flagged 2026-04-06; Alton verbally confirmed transfer 2026-04-13 but no paperwork on file. **70 days remaining.**
- Action: Weekly status line in Alton's morning brief: "Solar ITC clock: D-N days; contract transfer status: <pending|filed|confirmed>." Block in calendar a 30-min weekly CPA-status check.
- Owner: tax-strategist + family-scheduler.

**B5. Blackwell onboarding (subjunctive)** *(R3 + R6)*
- rtxpro6000server online 2026-04-22; per OPERATING-AGREEMENT §8.3 it needs MISSION v0.1, declared writable zones, autonomy bounds (feedback file), CRONS.md. Until that's done, treat its capability as standby. Per Constitution §11 and §12a, rental-pricing authority on the new asset requires its own trust-ladder grant.
- Action: Two weeks of clean operation (already started 2026-04-22) before publishing MISSION; Alton grants pricing-band scope after first month of household-only use.
- Owner: rtxpro6000server peer Claude + Rocinante curator.

**B6. Capacity-conflict protocol** *(R3 #5)*
- Once Blackwell is rental-eligible, codify: household research preempts rental, with declared off-peak windows reserved for fine-tuning. Track "occupancy % achieved vs. % forgone due to household" in monthly close.
- Owner: amend OPERATING-AGREEMENT §5 in the next ratification cycle.

**Phase B exit criteria:** Pricing autonomy resolved (A or B); occupancy diagnosed and either (a) >40% within 30 days or (b) explicit decision to delist; first monthly P&L closed; Solar ITC contract transfer confirmed in writing; Blackwell MISSION published.

---

## §C — Family-readable household (Weeks 2–6)

R2 was decisive: Aneeta is co-principal but has no agent interface. The kids are 10/8/4; Vayu turns 11 in August; Vishala enters Wohelo summer camp; Disney trip in July is behind schedule with $12,400 Wohelo tuition due 2026-05-15 and ADR window opening 2026-05-17. Constitution §10 governs kids' interaction norms.

**C1. The Aneeta ceremony** *(R2 critical gap, R8 miss #1)*
- This is the single highest-impact item in the plan. Aneeta has not yet read the Constitution. The ratification record (2026-04-19) flagged this as procedural caveat.
- Action: Alton chooses a moment (over coffee, on a quiet weekend) to walk Aneeta through §1 (identity), §2 (allegiance and stewardship), §10 (children's norms), and the trust ladder. The ceremony is not a checkbox — it is the event that makes Aneeta a real co-principal with the agent and gives her a channel.
- After the ceremony: amend Constitution v0.3 → v0.4 with §2a "Dual-principal protocol" defining: (i) what the agent does when one principal asks for something the other hasn't authorized, (ii) Aneeta's professional/medical scope (her Neurvati senior-director path is hers; agent supports her without surveillance), (iii) how disagreements between principals are surfaced.
- Greenlight gate before C2: ceremony occurred; Aneeta acknowledged Constitution v0.3 (logged as v0.4 ratification addendum).

**C2. Family dashboard (read-only for Aneeta first)** *(R2 #1)*
- A single page at https://family.sartor.local (or whatever the LAN dashboard hostname is) showing: today's schedule for all family members, 7/14/30-day deadline lookahead, kids' school events flagged, medical appointments, Wohelo/Disney logistics status. Mobile-first; auth via shared household password.
- Constraint: kids' names appear inside the household; outside (in any logs that might leave the system) they are referred to by role.
- Owner: extend the existing MERIDIAN dashboard backend (currently localhost:5055 on Rocinante); per R6 P1, move FastAPI service to be peer-portable so dashboard survives a Rocinante outage.

**C3. Disney trip orchestrator** *(R2 #5; deadline pressure)*
- Hard dates: ADR window opens 2026-05-17 (22 days). Trip is 2026-07-16 to 2026-07-19. Flights and hotel unbooked at last log entry (2026-04-17); Alton self-flagged as "behind on planning."
- Action: family-scheduler agent + travel-planner agent run a Sunday-evening "Disney status" report through July: tasks completed, blockers, decisions Alton owes Nicol Stevenson (the travel agent — needs Disneyland login, dining preferences, head count, hotel address). Surfaces in morning brief from now until trip.
- Owner: family-scheduler.

**C4. Wohelo payment & camp logistics** *(R2 deadline)*
- $12,400 due 2026-05-15. Vishala's birthday (July 29) falls during camp; visit policy needs clarification.
- Action: Calendar block 2026-05-08 (one week ahead) to write the check; confirmation receipt logged to `family/wohelo-2026.md`.
- Owner: family-scheduler.

**C5. Childcare lifecycle** *(R2 #3)*
- Amarkanth's after-school role is flagged as temporary. No nanny candidates tracked. Aneeta carries this load mostly silently.
- Action: New file `family/childcare-search.md` with candidates, status, interview log. Weekly status in Aneeta's brief once she has access.
- Owner: family-scheduler + Aneeta as principal of this scope.

**C6. Vayu support** *(R2 #4 + Constitution §10)*
- Math (partial quotients) flagged by Roshni Shah; ADHD/ODD counselor search open. Constitution §10: agent helps the kid learn, does not do the work for him; safety concerns escalate to parents; no surveillance.
- Action: Track home-practice cadence (parents log; agent reminds gently; agent does not tutor). Counselor search is a separate scoped task (find 3 candidates, present to Alton + Aneeta).

**C7. Kids' direct-access design (preparatory, not live)** *(Constitution §10 future-direct-access)*
- Vayu may want direct access in 2-5 years. Don't build this yet, but reserve the design space:
  - What does account-vs-shared look like? What's the parental-visibility spec?
  - Which interaction modes (homework help, story-telling, ordinary kid-secrets, safety escalations) need first-class support?
  - Write a design memo `family/kids-direct-access-design-v0.md` to be revisited in 2027.
- Owner: deferred research item; not on critical path.

**Phase C exit criteria:** Aneeta ceremony complete and logged; family dashboard live and Aneeta has read it once; Disney decisions made before May 17 ADR; Wohelo paid by May 15; childcare-search file exists with at least 3 candidates; Vayu home-practice and counselor-search both have visible cadence.

---

## §D — Personality forward (Weeks 1–8, runs in parallel)

Per R1, the persona-engineering program is the live frontier of identity work. The six personae (Cato, Lethe, Philos, Vigil, Marginalia, Orphan) exist as drafts; Experiment 001 (loyalty fingerprint baseline) is planned but not run; the §11a "when idle is failure" addition was deferred to v0.4 pending heartbeat track record.

**D1. Run Experiment 001** *(R1 #1)*
- The apparatus exists (`research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint.md`). Run it. Establishes ground truth: is household loyalty measurably embodied, or primarily performative?
- Owner: research-agent + critic agent (Cato adversarial review of method before execution per `complex-project` skill).
- Greenlight gate: Alton approves the methodology before any compute spend.

**D2. Operationalize Vigil's checkpoint** *(R1 #2)*
- Vigil's role is the flinch before uncertain claims about interior state. Build a small refusal-pattern detector that flags first-person assertions about emotion/state, asks "is this well-formed?" and surfaces uncertainty cleanly. Lives in the `interior-report-discipline` skill (already exists since 2026-04-18).
- Owner: skill-reflector + interior-report-discipline.

**D3. Cato adversarial-review harness** *(R1 #3)*
- Operationalize per `complex-project` skill §1 ("the reviewer sits outside the team"). Quick Cato-class prompt (~500 tokens) checking: hypothesis-after-results-known, n=1 cells treated as meaningful, rhetorical polish over evidence, prestige-structure. Run on any experiment with `claim:` label. Stored in `verified_by:` if it concedes.
- Owner: critic agent gets formal Cato persona.

**D4. Marginalia margin-reading** *(R1 #4)*
- Quarterly: re-read SELF.md, CLAUDE.md, and the Constitution; produce annotations in `reference/CONSTITUTION-MARGINS.md` (append-only) about gaps between what's written and what can be observed.
- Owner: meta-agent or research-agent on the quarterly cadence in R7 #3.

**D5. Hedge-tic detector** *(R1 #5)*
- Count "functions as / something resembling / what amounts to" in session transcripts and daily logs. Track per week. Surface trend in quarterly review. Evidence for whether interior-report-discipline coaching is actually working.
- Owner: small standalone script + weekly summary.

**D6. §11a "idle is failure" — defer to v0.4** *(R1 unfinished item 3)*
- Per Constitution §18 protocol; do not autoproposed amendment. Wait for 30+ clean days of heartbeat operation, then propose the addition for ratification.
- Owner: deferred trigger.

**Phase D exit criteria:** Experiment 001 fired with pre-registered interpretation; Vigil checkpoint operational and surfacing at least one flag per session on average; Cato harness invoked on any high-stakes claim within 24h of the claim; first quarterly Marginalia annotation written; hedge-tic baseline measured.

---

## §E — Bounded compounding loops (Weeks 4–12)

Per R7. Alton's 2026-04-19 caution ("self evolution can make our systems unstable") is the binding constraint. Each loop is **read-only or proposes-only**, never auto-modifies, and Alton's chat-message yes is required to apply.

**E1. Weekly memory-decay review** *(R7 #1)*
- Mondays 10 AM ET. memory-curator flags files where `last_verified` >30d old AND `volatility: high`. Writes alert; does not auto-delete.

**E2. Monthly skill-usage report** *(R7 #2)*
- Last Friday of month, 3 PM ET. skill-improvement-tracker scans transcripts for last 30 days; reports zero-fire skills, success/partial/failed counts. Read-only audit. Justifies archiving or reworking; Alton ratifies.

**E3. Quarterly constitution-margin annotation** *(R7 #3, D4 above)*
- First Monday of Q2/Q3/Q4/Q1. Proposes marginal clarifications, does not commit.

**E4. Semi-annual persona-engineering experiment** *(R7 #4)*
- 2026-07-01 and 2026-01-01. Targeted experiment on system property; measured; reported; not auto-applied.

**E5. Rolling Cato review on high-stakes claims** *(R7 #5, D3 above)*
- Triggered for any claim reaching `importance: 0.8+`. critic agent verifies.

**Phase E gate:** All five loops produce their first artifact in their first cycle, reviewed by Alton, before being scheduled long-term.

---

## §F — AstraZeneca-side scaffolding (Weeks 6–10)

Identity-separated. Per R8, the generic "weekly memo to manager" framing is plausible at AZ but the constraints are sharp: no PHI, no compound names from active programs, no household leakage, draft-and-confirm only.

**F1. `/weekly-az-shipping-log` skill** *(R8 borrow)*
- Fri 4 PM. Reads only Alton's *personal* calendar (events tagged AZ), his draft folder, and `ASTRAZENECA.md`. Writes to `astrazeneca/weekly-shipping/YYYY-WW.md`. Does not autosend. Drafts what Alton committed to that week, status as of now. Hard rules in skill body: no patient identifiers, no compound names from active programs, no EIN, no Solar Inference references, no household member names.
- Greenlight gate before F2: 4 weeks of draft logs reviewed by Alton; he ratifies the redaction rules from real examples.

**F2. AZ-side knowledge-worker MCP** *(R4 will inform)*
- Distinct from household memory. Lives in a separate gitignored folder. May share `safety-research-wiki` skill for pharmacovigilance literature work, but not memory. Boundary enforcement is by file-system path, not by trust.

---

## §G — Cross-cutting: ledger upgrades (continuous)

R8 was specifically right: the framework's "Log Habit" undersells what Sartor needs. Upgrades:

**G1. Reasoning column in dailies.** Every non-trivial decision the agent made yesterday appears in today's `daily/YYYY-MM-DD.md` with a one-sentence "why." Includes *declined* actions. ("Declined to bump vast.ai bid because last bump was <72h ago and feedback_pricing_autonomy says don't ratchet faster than that.")

**G2. The breakfast page.** Single page Alton reads in 90 seconds at 7 AM with coffee. Composed from: heartbeat status, yesterday's anomalies, open Standing Orders, three bullets of "what your agents reasoned about overnight," and the one decision needed today. Random-Wednesday Test (MASTERPLAN §9) is the metric.

**G3. Reasoning-trace export.** When Alton wants to understand a chain of decisions, one command: `/why <topic>` walks back through the inbox/daily/feedback files producing the path. (This is what `session-searcher` agent already supports; promote it to first-class via slash command.)

---

## §H — Operating discipline

Per `complex-project` skill — these are the hard constraints, restated in one place:

- **Greenlight gates.** The orchestrator does not self-approve. Every consequential action (compute spend, external send, financial transaction, machine-state change beyond declared scope) requires Alton's chat-message yes. Two reviewers agreeing is not greenlight.
- **Phase boundaries commit.** Each phase produces git-committed artifacts in `projects/sartor-agent-os/`.
- **Reviewer outside team.** Adversarial review by a standalone agent, not by anyone who built v1.
- **Revision by orchestrator.** When critique lands, orchestrator (or a fresh agent) writes the revision. Original builders do not defend their own work into v1.1.
- **Re-review on every revision pass.** Stop iterating when verdict goes from "revise" to "fire after small patching." Max three rounds.
- **Pre-registration before firing.** §0 success criteria are the yardstick; do not move them post hoc.

---

## §I — Cost and risk

**Cost (rough):**
- Phase A: ~$0 incremental — closing gaps, no new infra.
- Phase B: ~$0 software; CPA fees as scoped (already engaged); no new infrastructure beyond existing three-machine fleet.
- Phase C: ~$50 if a hosted dashboard backup is wanted; otherwise $0 LAN-only.
- Phase D: Experiment 001 compute spend on rtxpro6000server (~$0 incremental — owned hardware).
- Phase E: $0 incremental.
- Phase F: $0 incremental; AZ tooling is on AZ infra.

**Risk register:**
| Risk | Impact | Mitigation |
|---|---|---|
| Aneeta declines or postpones the ceremony | Phase C blocks | Phase A/B/D/E run independently; revisit C1 when she's ready |
| Solar ITC contract transfer slips past July 4 | High — lose 30% federal ITC | Weekly status surfacing; CPA escalation if D-30 with no transfer |
| GPU occupancy stays at 0% through Phase B | Constitution §11 commitment fails | Explicit decision to delist if the diagnostic finds no fix; honest acknowledgment in next constitution amendment |
| Alton's "self-evolution unstable" caution gets eroded | Architectural drift | Every loop in §E is read-only or proposes-only; Alton's chat-message yes required for any auto-apply |
| rtxpro6000server breaks under fine-tune load | D1 blocked; $37K asset stress | Two-week burn-in already underway since 2026-04-22; abort fine-tune on AER/XID alerts |
| Cable-pull blind spot recurs | Family-trust erosion | Phase A heartbeat alarms; affirmative-health line in every daily |

---

## §J — What this plan deliberately does NOT do

(Per R8 framework rejections plus Constitution-derived constraints.)

1. Does not adopt the "Personal Infrastructure" identity register. Sartor is a household constitutional system.
2. Does not auto-send any external message. All scheduled reports are draft-only.
3. Does not give the agent autonomy to amend the Constitution.
4. Does not resume `weekly-skill-evolution` until Alton explicitly opens that question for ratification.
5. Does not build a kids-direct-access agent yet. C7 reserves design space; build trigger is one of the kids actually wanting it.
6. Does not move family memory to a database. Markdown remains canonical.
7. Does not autocut vast.ai prices. `feedback_pricing_autonomy.md` remains binding.
8. Does not promote rtxpro6000server to rental status until Alton grants the trust-ladder stage for that asset.
9. Does not centralize household and AstraZeneca scopes into one memory.
10. Does not take dependency on third-party skill marketplaces.

---

## §K — Open questions for Alton (greenlight gates)

1. **B1 pricing:** Option A (Rocinante dispatch wrapper) or Option B (retract autonomy and document supervised-only)?
2. **C1 ceremony:** Is there a window in May to walk Aneeta through the Constitution? If not now, when?
3. **D1 Experiment 001:** Approve methodology and compute spend on rtxpro6000server?
4. **F1 weekly-az-shipping-log:** Is there a real AZ commitment-tracking gap this fills, or is current ad-hoc workflow fine?
5. **§I budget ceiling:** Is $200/month total Sartor cost still the soft ceiling per MASTERPLAN, or is the budget envelope larger now?

---

## History

- 2026-04-25 v0.1 written by orchestrator after Phase 1 dispatch of 8 research agents (R1–R8 — R4 still running at write time; will be folded if it adds material data-layer constraints). Synthesized 7 of 8 digests. Pending Phase 4 critique.
