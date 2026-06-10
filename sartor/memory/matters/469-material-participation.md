---
type: matter
matter: 469-material-participation
status: open
risk: medium-high
priority: p2
opened: 2026-05-08
updated: 2026-06-09
last_action: 2026-06-09
deadline: continuous
authority: [IRC-469, IRC-469d2, IRC-38c, IRC-704d, IRC-465, IRC-461l, IRC-721, IRC-168k2E, Reg-1.469-5T, Reg-1.469-1T-e3, Reg-1.469-4, Reg-1.469-3, Reg-1.469-2T, RevProc-2010-13, RevProc-2025-32]
related: [BUSINESS, business/solar-inference, TAXES]
---

# Matter: §469 material participation hours documentation

## Issue

Document and defend Alton's material participation in Solar Inference LLC under IRC §469 / Treas. Reg. §1.469-5T to ensure pass-through losses are non-passive (deductible against ordinary income) rather than passive (limited to passive income).

## 2026-05-28 VERIFIED UPDATE (supersedes the auto-log-is-sufficient framing below)

Adversarial verification (see [[projects/fleet-ledger-2026-05-28/VERIFICATION|VERIFICATION.md]] C3):

1. **The hours log is NOT, as built, a defensible §1.469-5T(f)(4) record.** §469(h)(1) requires the
   **individual's own** regular/continuous/substantial involvement. The current extractor classifies
   "active-typing time by working directory" and **counts automated activity as Alton's hours**:
   scheduled-task/cron Claude runs (the tell: rows bounded exactly 07:30:01→23:30:01), peer-machine
   mirrored sessions, and subagent sidechains. It **overstates** the §469 figure — precisely the
   "are the hours real vs inflated" failure mode an exam targets. **Fix shipped 2026-05-28:**
   `scripts/hours-log-extract.py` now excludes sidechains, peer-mirrored sessions, and automated/cron
   sessions, and emits a `human_interactive_hours` column — **that column, not the old ones, is the
   tax-defensible figure.** Re-baseline the trailing-hours estimate from it before relying on the position.
2. **"Investor-grade activity" cuts AGAINST us, not for us.** The original Analysis cited
   §1.469-5T(f)(2) defensively — but reviewing autonomous pricing output, reading dashboards, and
   monitoring are exactly the **investor activities that don't count**. The log over-captures these.
   Lean on operator-level work (pricing decisions, vendor/hardware ops, customer issues), logged as
   Alton's own time.
3. **The ITC is the energy credit on the SOLAR ROOF (§48E), not on GPU hardware** (GPUs earn
   depreciation). If material participation fails → the activity is passive → (a) the bonus-depreciation
   loss is **suspended** (§469(a)(1)(A),(b), deductible only vs passive income), AND (b) the §48E ITC
   becomes a **passive activity credit** (§469(d)(2)) that **cannot offset the AZ/Neurvati W-2 wages** —
   it strands as a carryforward. Confirm with JF which passive activity the ITC is allocated to.
4. **The 7-day short-rental exception does NOT rescue the position.** §1.469-1T(e)(3)(ii)(A) only strips
   the per-se *rental* label; the activity is then tested under §469(c)(1) and **still requires material
   participation**. In a failure scenario it stays passive.
5. **Second-order limit even when "allowed":** §38(c) general-business-credit cap (25% of net regular
   tax over $25K), 20-year carryforward, §196 deduction at expiry.

**Net:** the (a)(3) 100-hour-more-than-anyone test is still the most reachable path, but it must rest
on the new `human_interactive_hours` figure and operator-level (not investor-grade) time. This raises
the matter's effective risk given how load-bearing the ITC's usability against wage income is.

## 2026-06-09 UPDATE — W-2 pass-through chain (four-limiter memo + adversarial verdict)

Full IRAC memo 2026-06-09 analyzed the TY2026 pass-through of the full LLC loss (potentially $370K+ incl. solar-roof business fraction) against W-2 wages. The loss must clear **four limiters in statutory order: §704(d) basis → §465 at-risk → §469 → §461(l)**. Verified findings, verdict corrections applied:

**(1) §469 gateway — rental-activity characterization is THE open issue, ahead of hours.** vast.ai hosting may be a per-se passive rental under §1.469-1T(e)(3) regardless of material participation. Average-period mechanics: reserved contract C.34113802 (2026-04-05→08-24) is one ~141-day period; single-class computation needs **N ≥ 23 discrete on-demand rental periods closing in 2026** to get the average ≤7 days (verdict corrected the memo's N ≥ 27 — (141+N)/(N+1) ≤ 7 solves to N ≥ 22.33). Two-class income-weighted computation could land ~35–45 days and fail outright if gpuserver1 contributes ≥~25–30% of gross rental income. **The decisive facts — discrete rental-period count and per-machine income split — are untallied; pull from vast.ai host records/kaalia container history.** Caution: rtxserver's "~1 day average" assumption is itself suspect (the C.38328535 miner rental ran long). Class-of-property definition (one equipment class vs per-server) has no pinned authority — JF item. Significant-services fallback is weak (hosting mostly automated). **Mitigation: when C.34113802 expires 2026-08-24, do NOT accept another multi-month reserved contract in 2026; run on-demand listings to drive the period count up** (aligns with existing short-term-first strategy; Alton's call). If the rental label sticks, everything downstream is moot and grouping the roof in would poison the roof too.

**(2) Hours pace — 49.47h YTD (human_interactive_hours summed directly from all-hours.csv through 2026-06-09; the 45.1h briefing figure was stale).** Need 50.53h more by 12/31 — ~1.8h/week, reachable with operator-level time (pricing decisions, hardware ops, vendor/lender interaction, listing-strategy execution, books). Investor-grade time (dashboards, reviewing autonomous output) excluded per the 05-28 update. **Log gap: the CSV only captures Claude-session typing — the solar install starting now generates non-keyboard operator hours (site walks, electrician coordination); start a contemporaneous narrative/calendar supplement per §1.469-5T(f)(4).** Possible upside: early-2026 rows have blank human_interactive_hours; extractor backfill could raise the YTD figure. Spousal attribution (§469(h)(5)) confirmed: Aneeta's 50% share is non-passive if Alton materially participates. Open verdict question: whether Lucent install-crew individuals' hours count against the (a)(3) more-than-anyone test (the 500-hour (a)(1) test would be immune).

**(3) Grouping (§1.469-4):** preferred framing in order: (i) no grouping needed — the roof's business fraction is an asset OF the single GPU-hosting trade or business; (ii) if two activities, grouping passes the §1.469-4(c) appropriate-economic-unit factors decisively (identical 50/50 ownership, one location, the roof's business use IS supplying the GPU load), with Rev. Proc. 2010-13 disclosure — **but only after the rental label is stripped** (§1.469-4(d)(1) blocks grouping a rental activity with a trade or business except via the proportionate-ownership branch, and grouping into a per-se-passive rental makes the whole group passive).

**(4) Other limiters:**
- **§704(d) basis — currently the hardest dollar constraint.** Alton outside basis ~$37,831.29; **Aneeta $0**; Exhibit A blank. A 50/50 $370K loss strands ~$185K on Aneeta regardless of §469. Fix: contribution/assignment of the solar system creating basis for both spouses. **Verdict correction on structure: contract ASSIGNMENT to the LLC (LLC becomes the purchaser from Lucent) ranks ABOVE in-kind §721 contribution** — contributed property takes §179(d)(2)(C) carryover basis, which fails §168(k)(2)(E)(ii); the 721-preserves-bonus reading is contested in the final-reg preamble and practitioner literature. Never have the LLC BUY the system from the members (§267 related-party kills bonus). HIGH today; LOW-MEDIUM if assignment/contribution executes pre-PIS.
- **§465 at-risk: LOW** — Climate First loan full-recourse to both spouses, unrelated lender; keep the recourse character.
- **§461(l): VERIFIED — 2026 MFJ cap is $512,000** (Rev. Proc. 2025-32; OBBBA reset, down from $626K in 2025). $370K aggregate loss is under the cap; excess would carry as NOL. LOW.
- **NJ: plan on ≈ $0 against wages** — §168(k) addback plus category-of-income no-netting (ABCA 50% partial only among business categories). Federal benefit is the entire near-term prize.

**(5) §48E ITC side — two gates, both adverse:** (i) §469(d)(2) passive-credit trap (same gateway as the loss); (ii) **§38(c): the verdict resolved the open question unfavorably — §48E is NOT a §38(c)(4)(B) specified credit** (the list includes §48, never §48E), so the TMT floor fully applies; and the loss itself shrinks regular tax, throttling same-year credit absorption. The bonus-vs-slower-depreciation election interaction is now a mandatory JF modeling item, not optional. Also: **Notice 2025-42 vacated** (D.D.C. 2026-06-06) — 5% safe harbor restored under pre-IRA notices, statutory 7/4 BoC date unchanged; and the **FEOC ≥40% material-assistance gate** applies to 2026-BoC facilities (→ [[feoc-material-assistance-48e]]).

**Scenarios (federal):** best case (everything executes, non-passive, basis fixed) ~$160–220K cash value — but graded HIGH until FEOC, rental-period tally, business-use metering, and acquisition structure pin down; the best-case ~$350K roof fraction is internally in tension with the $86K ITC ceiling and undercut by net-metering credits flowing to the personal PSE&G account. **Mid case (realistic planning anchor, MEDIUM): hosting leg only, ~$45K loss → ~$16–17K federal**, roof sliding to TY2027. Worst case $0 (rental label sticks or hours fail).

## Facts

- Solar Inference LLC: 50/50 multi-member, Alton + Aneeta. Pre-revenue. Active GPU rental + planned solar ITC + bonus depreciation in TY2026.
- Trailing 12-month estimated participation (per `sartor/memory/business/hours-log/all-hours.csv` via Sartor Hours Log scheduled task): ~180 hours as of 2026-05-02.
- Auto-logging via Windows Scheduled Task "Sartor Hours Log" — walks Claude Code session JSONL files, computes union of typing intervals (gaps <30 min count as active), classifies by cwd (Sartor-claude-network → solar_inference, else → general_sartor).
- TY2026 expected loss: large (Solar ITC + bonus depreciation if [[solar-itc-48-vs-25d]] §48 path executes — could be $300K+ pass-through loss).

## Authority

- **IRC §469**: Passive activity loss rules. Losses from passive activities deductible only against passive income.
- **Treas. Reg. §1.469-5T**: Seven material-participation tests. Must satisfy any ONE.
  - (a)(1) 500-hour test
  - (a)(2) Substantially-all-participation test
  - (a)(3) 100-hour-and-more-than-anyone-else test
  - (a)(4) Significant-participation activity (>500 hours combined across multiple SPAs)
  - (a)(5) 5-of-10-prior-years test
  - (a)(6) Personal-service-activity 3-prior-years test
  - (a)(7) Facts-and-circumstances test (regular/continuous/substantial; with limits)
- **Treas. Reg. §1.469-5T(f)(4)**: Documentation can be by reasonable means including "approximate number of hours based on appointment books, calendars, or narrative summaries."
- **Treas. Reg. §1.469-2T**: Definition of activities, grouping, etc.

## Analysis

Sartor's most defensible path is **(a)(3) 100-hour-and-more-than-anyone-else**.

Test (a)(3) requires:
1. Alton participates >100 hours during the year, AND
2. No other individual (including Aneeta) participates more than Alton.

180 trailing 12-month hours easily exceeds 100. Aneeta's participation in SI LLC is minimal (50% member but operationally inactive). External vendors (Lucent, Newegg, vast.ai customer support) are not "individuals" for §469 purposes — they're contracted parties.

Test (a)(1) 500 hours is harder but plausibly reachable by EOY 2026 if GPU buildout, solar install, and tax-strategy work continue.

The auto-logging system is critical because Reg §1.469-5T(f)(4) requires "reasonable means" of documentation. Random session JSONL files without classification fail "reasonable" — the auto-logger producing dated CSV with categorization passes.

### Risk grade: ~~MEDIUM~~ MEDIUM-HIGH (re-graded 2026-06-09 — see the 2026-06-09 update; this 2026-05-08 section retained as history, and its "180 trailing hours" figure above is superseded by the 49.47h human_interactive_hours YTD)

The position is defensible but depends on documentation surviving examination. IRS material-participation challenges typically focus on:
- Whether the hours claimed are real (vs. inflated)
- Whether the activity is genuinely "participation" (vs. investor-grade activity that doesn't count)
- Whether other parties participated more

Active typing in Claude Code on Sartor-claude-network repo is hours-log-classified as solar_inference. This is defensible as "investor-grade activity" if the IRS pushes — Treas. Reg. §1.469-5T(f)(2) excludes "work done in connection with an activity if (i) such work is not of a type that is customarily done by an owner..." Active operational management of vast.ai listing, GPU server administration, and tax-strategy work IS customarily done by owner-operators of small operating businesses.

## Position

**Continue auto-logging. Maintain the 100-hour-more-than-anyone-else position. Confirm with JF at next call.**

If TY2026 pass-through loss is substantial ($300K+), the §469 position is load-bearing — without material participation, the loss is suspended as passive activity loss until passive income materializes.

## 2026-06-09 (later) — spousal attribution + documentation regime stood up

1. **§469(h)(5) / Reg. §1.469-5T(f)(3): spousal hours COMBINE.** Aneeta's participation
   (computer assembly, contractor coordination, planning/CPA calls) is attributed to Alton for
   every material-participation test. Her hours help; the old action item "confirm Aneeta's
   participation < Alton's" is moot for the tests (it mattered only under the wrong reading of
   (a)(3); spouses are not "other individuals" for the comparison). Her hours still do NOT create
   §704(d) basis — separate problem.
2. **Documentation regime (the auto-log captures only Alton's Claude keyboard time; rows before
   2026-04-10 are blank and unrecoverable — transcripts pruned):**
   - `business/hours-log/participation-log.csv` — manual log, both spouses, non-Claude time.
     Seeded 2026-06-09 with a best-estimate reconstruction (every row anchored to a dated
     artifact: DocuSign, order numbers, Gmail thread ids, calendar). Alton EST ~20.5h + Aneeta
     EST ~5.75h on top of the 53h auto-log → combined position ~79h + meetings, before H2.
   - `business/minutes/` — member-meeting minutes regime: TEMPLATE.md going forward (recordings/
     transcripts permitted, both consent) + `2026-06-09-ratification-of-prior-meetings.md`
     enumerating 7 reconstructed Jan–Jun planning meetings for both-member email ratification.
   - Aneeta email sign-off drafted (Gmail) — her confirming reply becomes corroboration.
   - `.claude/scheduled-tasks/weekly-participation-preseed/` — Sunday-evening task pre-seeds
     candidate rows from the week's Gmail/Calendar signals; members fill hours. Keeps the record
     contemporaneous instead of reconstructed.
3. Minutes double as operating-business formality evidence (§48E active-business posture, §183).

## Action items

- [ ] **Pull 2026 discrete rental-period count + per-machine gross income split** from vast.ai host records / kaalia container history (decides the rental-characterization gateway; single-class breakeven N ≥ 23). (added 2026-06-09)
- [ ] **Start contemporaneous narrative/calendar supplement for non-keyboard hours** (solar install site walks, electrician coordination) per §1.469-5T(f)(4). (added 2026-06-09)
- [ ] **Post-2026-08-24: on-demand listings only for rest of 2026** — no new multi-month reserved contract (Alton's call; flag to /vastai-management). (added 2026-06-09)
- [ ] JF agenda: class-of-property computation method; §721-vs-contract-assignment structuring; §48E specified-credit status confirmed adverse — run TMT projection; bonus-vs-slower-depreciation vs ITC absorption; Form 8582 / Rev. Proc. 2010-13 grouping disclosure. (added 2026-06-09)
- [ ] Check whether the extractor can backfill blank early-2026 human_interactive_hours rows. (added 2026-06-09)
- [ ] Periodic check of `business/hours-log/all-hours.csv` — flag if anomalous spikes or gaps.
- [ ] At year-end TY2026 close-out: produce annualized hours summary by activity classification.
- [ ] Confirm Aneeta's participation is < Alton's (likely yes by large margin).
- [ ] Discuss with JF at next call: confirm (a)(3) test framing for SI LLC.
- [ ] If TY2026 loss is filed as non-passive: ensure documentation in CPA file before filing.

## CPA / counsel routing

- **Send to JF as**: FYI memo + agenda item for TY2026 return prep.
- **JF deliverable**: confirmation of test framing; potentially Form 8582 prep.

## History

- 2026-05-08: Opened. Position: §1.469-5T(a)(3) test, defensible per auto-log.
- 2026-05-28: VERIFIED UPDATE — hours log counted bot activity; human_interactive_hours column is the defensible figure; investor-grade time cuts against us; ITC strands against wages if passive; 7-day exception necessary-not-sufficient; §38(c) cap noted.
- 2026-06-09: **W-2 pass-through chain memo + adversarial verdict added; risk raised MEDIUM → MEDIUM-HIGH.** Rental-activity characterization under §1.469-1T(e)(3) identified as the gateway issue ahead of hours (period count untallied; single-class breakeven N ≥ 23 per verdict math fix); hours pace 49.47h YTD / 50.53h to the 100h test (~1.8h/wk); grouping analysis added (strip rental label first, Rev. Proc. 2010-13 disclosure); §704(d) is the hardest dollar constraint (Aneeta $0 basis) with contract-assignment ranked above §721 contribution for bonus eligibility; §465 LOW; §461(l) $512K MFJ 2026 verified not binding; NJ ≈ $0 vs wages; §48E confirmed NOT a §38(c)(4)(B) specified credit (TMT floor applies). Mid case ~$45K hosting-leg loss is the realistic planning anchor. Action items expanded.

## Resolution

(continuous tracking)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion.
