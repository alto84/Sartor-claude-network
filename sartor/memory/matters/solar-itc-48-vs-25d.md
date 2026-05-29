---
type: matter
matter: solar-itc-48-vs-25d
status: open
risk: high
priority: p1
opened: 2026-05-08
updated: 2026-05-28
last_action: 2026-05-28
deadline: 2026-07-04   # BEGIN-CONSTRUCTION deadline (not placed-in-service) — corrected 2026-05-28
authority: [IRC-25D, IRC-48, IRC-48E, IRC-168k, IRC-50c, Reg-1.48-9, Reg-1.168k-2, OBBB-PL119-21, Notice-2025-42]
related: [reference_solar_project, BUSINESS, business/solar-inference, TAXES]
---

# Matter: §48 vs §25D ITC track + LLC asset transfer pre-placed-in-service

## Issue

Which Investment Tax Credit regime applies to the 85 Stonebridge Tesla Solar Roof — §25D (residential, credit only) or §48 (commercial, credit + bonus depreciation) — and whether the underlying asset can be transferred to Solar Inference LLC before placed-in-service to lock in the §48 path.

## 2026-05-28 VERIFIED UPDATE (supersedes the stale framing below)

Adversarial verification against live IRS / OBBB / Notice 2025-42 sources (see
[[projects/fleet-ledger-2026-05-28/VERIFICATION|fleet-ledger VERIFICATION.md]] C1/C2/C4) corrected
five load-bearing points in the original analysis. Read these first:

1. **Controlling section is §48E, not §48.** §48 was replaced by the §48E Clean Electricity Investment
   Credit for property **placed in service after 12/31/2024**. A 2026 system runs under §48E. The
   allocation logic carries over; cite §48E.
2. **§25D is DEAD for expenditures after 12/31/2025 (OBBB).** The "§25D = $131,649 fallback" framing in
   the Analysis below is **wrong for a 2026 install** — the personal/residential fraction now gets
   **ZERO** credit, not a residential credit. This makes the §48E business path the only live route and
   raises the stakes on documenting maximal business use.
3. **The $131,649 (= 30% × full $438,829) is OVERSTATED.** §48E applies only to the **business-use
   (depreciable) fraction** of a dwelling-sited system. There is **no 20% on/off cliff** (that was a
   conflation of three different 80/20 rules); the credit scales **proportionately** with business use
   (§48(a)(3)(C)/§48E depreciability gate; §50(b)(2)(D) exempts energy property from the lodging
   disqualifier). Defensible ITC ≈ **$32K (GPU-only kWh ~24%) to ~$86K (dual-rig ~64%)**, possibly
   higher if LLC-owned **net-metered grid-export income** counts as business production of income.
   **Business-use measurement (home-office % vs kWh) is unsettled — a CPA/exam judgment call.** The
   $373,005 figure is correctly the §50(c)(3) half-credit basis reduction (not a business-use haircut).
4. **July 4, 2026 is a BEGIN-CONSTRUCTION deadline, not placed-in-service** (OBBB + IRS Notice 2025-42).
   There is **no Dec 31, 2026 placed-in-service cliff**. If construction **begins by July 4, 2026**, the
   4-year continuity safe harbor lets placed-in-service slip to **~Dec 2029–2030** with the full 30% +
   100% bonus intact. The 5% safe harbor **still applies** (Notice 2025-42 kept it for ≤1.5 MW systems;
   this is 0.0221 MW) — the $219,414.50 drawn 2026-03-15 plausibly establishes it. **Cite Notice
   2025-42, not Notice 2018-59.** This is the highest-leverage action: lock begin-construction before
   July 4 and the placed-in-service crunch largely dissolves.
5. **2026 bonus depreciation = 100% PERMANENT (OBBB)** — resolves the open "80% vs 100%" question; the
   $373,005 figure stands (subject to the business-use haircut in point 3).

**Reframed economics.** The choice is no longer "§25D $131K vs §48 $261K." It is "§48E on the
business fraction (credit + bonus, ~$32–86K credit + proportional bonus) vs **zero** if no business
use is established." The transfer mechanics (Path A/B/C), NJ non-conformity, and begin-construction
analysis below remain valid; the credit-magnitude and §25D-fallback framing are superseded by the
above.

## Facts

- Tesla Solar Roof contract value $438,829 (signed 2025-09-03 via Hilton Head Solar / Lucent Energy).
- System size 22.10 kW, 307 Tesla 72W modules, 3 Tesla 7.6 kW inverters, 2× Powerwalls being added in May 2026 expanded scope ($31,970 per original proposal).
- **Contract is in Alton's personal name** as of 2026-05-08. Has NOT been transferred to Solar Inference LLC.
- Solar Inference LLC: 50/50 multi-member NJ LLC, formed 2025-09-06, EIN 39-4199284. Pre-revenue. Active operating business per IRS positioning (solar-powered AI inference).
- Install start: ~early June 2026. Engineering survey complete 2026-04-30 (Doug Paige) + 2026-05-06 (Steven Schwartz).
- **ITC deadline**: July 4, 2026 is a **begin-construction** deadline (OBBB + Notice 2025-42), NOT
  placed-in-service (corrected 2026-05-28 — see VERIFIED UPDATE above). Begin construction by then
  (5% safe harbor, system ≤1.5 MW) and placed-in-service can slip to ~Dec 2029–2030.
- Climate First Bank Clean Energy Loan: $438,829 funded Jan 20, 2026, in personal joint name (Alton + Aneeta).

## Authority

- **IRC §25D**: Residential clean energy credit. 30% of qualified expenditures. NO bonus depreciation track. Credit attaches to taxpayer who places property in service for personal use at primary or secondary residence.
- **IRC §48**: Energy investment credit (commercial). 30% credit on qualified energy property. Pairs with §168(k) bonus depreciation for property placed in service in 2026 at 100% (per pre-OBBB) — confirm current rate post-OBBB.
- **IRC §168(k)(6)**: Bonus depreciation phase-down schedule. 2026 placed-in-service rate to verify with CPA — historically 80%, OBBB potentially restored to 100%.
- **Treas. Reg. §1.48-9**: Energy property definition (qualified solar electric, qualified energy storage).
- **Treas. Reg. §1.168(k)-2**: Bonus depreciation rules; eligibility tied to original use.
- **§50(d) recapture rules**: Apply if property converted from business to personal use within 5 years.

## Analysis

The §25D vs §48 split matters enormously:
- §25D: 30% × $438,829 = $131,649 federal credit. No depreciation. Total tax benefit ~$131K.
- §48 path: 30% × $438,829 = $131,649 federal credit + ~$373K bonus depreciation deduction × 35% effective tax rate ≈ $130K additional tax benefit. Total tax benefit ~$261K. **$130K delta.**

The §48 path requires:
1. Property owned by an entity using it in a trade or business
2. Original-use placed-in-service after acquisition
3. Property satisfies §48 qualified-energy-property tests
4. No §25D claim by the taxpayer (mutually exclusive)

Solar Inference LLC, with active GPU rental operations on vast.ai (RTX 5090 generating revenue), is plausibly an "active operating business" — but the LLC must be the OWNER of the solar property at placed-in-service, not Alton personally.

### Transfer mechanics

Three plausible paths to get the property into the LLC pre-placed-in-service:

**Path A — Contract assignment.** Lucent assigns the existing $438,829 contract from Alton personally to Solar Inference LLC. Requires Lucent's written consent. Climate First Loan would either:
- (a) Stay in Alton's personal name, with personal interest deduction governed by §163(d) investment interest rules
- (b) Be assigned to LLC concurrently with Climate First's consent and re-underwriting

**Path B — Member capital contribution post-completion.** Alton pays out-of-pocket from personal funds, then contributes the asset to SI LLC at FMV. Risks: (i) §721(b) investment-company concerns less applicable here than for Anthropic shares but worth checking, (ii) "original use" requirement under §168(k) — debate on whether contribution starts a new original use vs. inheriting Alton's prior use. Conservative reading: contribution before placed-in-service is fine; after is risky.

**Path C — LLC pays Lucent directly via member loan from Alton.** Cleanest from "original use" perspective. Alton lends LLC the cash; LLC pays Lucent. Solar property is LLC's from inception. Climate First Loan stays personal but proceeds become Alton's basis in member loan. Member loan generates interest income to Alton, deductible expense to LLC.

### Which path

Path A is cleanest IF Lucent consents AND Climate First consents. Both consents take time and may carry fees. Given the **8-week window** to July 4 deadline, paths take parallel-track work.

Path C is administratively heavier but doesn't require third-party consents. CPA can model.

### NJ non-conformity

NJ does NOT conform to §168(k) bonus depreciation. The federal $130K bonus-depreciation benefit creates an NJ/federal timing difference. The federal benefit is dollar-real but the NJ side carries higher tax for several years until NJ catches up. Net economic value is still strongly positive.

### Begin-construction safe harbor — separate but related issue

Steven Schwartz (Lucent CEO) confirmed verbally on 2026-05-08 that the project is past the 5% threshold "by virtue of the engineering" — meaning physical work + costs incurred to date already exceed the IRS Notice 2018-59 begin-construction threshold.

Authority: Notice 2018-59 (consolidating Notices 2013-29, 2013-60, 2014-46, 2015-25, 2016-31, 2017-04). Two prongs to "begin construction":
1. **Physical work of a significant nature** (off-site engineering, design work, racking fabrication count)
2. **Five Percent Safe Harbor** — paying or incurring ≥ 5% of total project cost

Sartor: $10K down payment 2025-10-24 + $438,829 Climate First Loan funding 2026-01-20 + engineering work pre-2026 = well past 5% of total cost.

**What this gets us**: Begin-construction status locked into TY2025 → 4-year continuity safe harbor → placed-in-service can slip as late as Dec 31, 2029 without losing ITC eligibility. **Separate from the §48 vs §25D question.**

**What this does NOT solve**: §48 path STILL requires LLC ownership at placed-in-service. Begin-construction safe harbor protects RATE; ownership rules determine REGIME.

**Action**: Get Steven to provide a one-page written attestation of (a) engineering work performed pre-2026, (b) costs incurred pre-2026, formalizing the 5% safe harbor record. File in `reference/solar-project-2026-05/`. Important under exam — verbal "we're past 5%" is not a tax-document.

### Risk grade: HIGH

Not because the position is shaky — it's defensible — but because the deadline is short, multiple consents are needed, and failure to execute by July 4 forfeits the §48 path and locks in §25D-only treatment. Loss of $130K of tax benefit if we miss the window.

## Position

**Pursue Path A or Path C in parallel. Decision needed within 14 days.** Climate First's prequal letter (already on file) explicitly contemplates contract amendments, so the lender side is workable. Lucent's consent to contract assignment is the gating question.

## Action items

- [ ] **15-min CPA call** with Jonathan Francis. Agenda: §48 vs §25D decision, transfer-path selection, Climate First Loan structuring under chosen path, NJ §168(k) treatment.
- [ ] Email Steven Schwartz (Lucent) requesting confirmation that Lucent will assign the contract to Solar Inference LLC if requested. Reference the [[reference_solar_project]] ITC deadline. Use [[alton-voice]] if drafting.
- [ ] Email Climate First Bank (Erin Gannon, erin.gannon@climatefirstbank.com) requesting their assignment process and documentation requirements for moving the loan to LLC. Or alternatively confirming acceptable structure where loan stays personal but property is LLC-owned.
- [ ] Decision deadline: 2026-05-22 (two weeks from open) on path selection. Implementation deadline: 2026-06-15 to leave buffer for placed-in-service certification.
- [ ] Update [[reference_solar_project]] when path is decided.

## CPA / counsel routing

- **Send to JF as**: 15-min call (path-selection decision) + written memo (this file as background).
- **JF deliverable**: opinion-letter-quality position on §48 vs §25D AND chosen transfer path. THIS IS LOAD-BEARING — ITC + bonus depreciation total ~$261K.
- **Engagement letter**: This matter alone justifies converting JF engagement from verbal to written. See [[cpa-engagement-letter]].

## History

- 2026-05-08: Opened. Path A/B/C tradeoff identified. Two-week decision window set.
- 2026-05-08 (later): Steven Schwartz verbal confirmation of 5% Begin-Construction threshold passed via engineering. Notice 2018-59 framework added to memo. **Critical clarification**: 5% safe harbor protects ITC rate-preservation, NOT regime selection (§48 vs §25D). LLC ownership at placed-in-service is still the load-bearing question. Action items expanded: written attestation from Steven + draft emails to Steven and Erin Gannon (Climate First) to drive Phase 1 decisions.
- 2026-05-28: **VERIFIED UPDATE added** (adversarial verification vs live IRS/OBBB/Notice 2025-42). Five corrections: controlling section is §48E (not §48); §25D dead for expenditures after 12/31/2025 (zero residential fallback); $131,649 overstated — §48E scales with the business-use fraction (no 20% cliff), defensible ~$32–86K; July 4 2026 is a begin-construction (not placed-in-service) deadline with the 5% safe harbor still available (Notice 2025-42, system ≤1.5 MW); 2026 bonus is 100% permanent. Begin-construction lock before July 4 is now the highest-leverage action. CPA call agenda updated accordingly.

## Resolution

(pending — fill in on close-out)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion. Engage a licensed tax attorney for opinion-letter quality.
