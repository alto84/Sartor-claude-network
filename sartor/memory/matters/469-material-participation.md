---
type: matter
matter: 469-material-participation
status: open
risk: medium
priority: p2
opened: 2026-05-08
updated: 2026-05-28
last_action: 2026-05-28
deadline: continuous
authority: [IRC-469, IRC-469d2, IRC-38c, Reg-1.469-5T, Reg-1.469-3, Reg-1.469-2T]
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

### Risk grade: MEDIUM

The position is defensible but depends on documentation surviving examination. IRS material-participation challenges typically focus on:
- Whether the hours claimed are real (vs. inflated)
- Whether the activity is genuinely "participation" (vs. investor-grade activity that doesn't count)
- Whether other parties participated more

Active typing in Claude Code on Sartor-claude-network repo is hours-log-classified as solar_inference. This is defensible as "investor-grade activity" if the IRS pushes — Treas. Reg. §1.469-5T(f)(2) excludes "work done in connection with an activity if (i) such work is not of a type that is customarily done by an owner..." Active operational management of vast.ai listing, GPU server administration, and tax-strategy work IS customarily done by owner-operators of small operating businesses.

## Position

**Continue auto-logging. Maintain the 100-hour-more-than-anyone-else position. Confirm with JF at next call.**

If TY2026 pass-through loss is substantial ($300K+), the §469 position is load-bearing — without material participation, the loss is suspended as passive activity loss until passive income materializes.

## Action items

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

## Resolution

(continuous tracking)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion.
