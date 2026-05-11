---
type: matter
matter: heloc-163h3-tracing
status: open
risk: high
priority: p1
opened: 2026-05-08
updated: 2026-05-08
last_action: 2026-05-08
deadline: 2026-10-15
authority: [IRC-163h3, Reg-1.163-10T, Notice-88-74, IRC-163h2D-repealed]
related: [reference_heloc, TAXES, BUSINESS, ALTON, FAMILY]
---

# Matter: §163(h)(3) HELOC use-of-proceeds tracing

## Issue

Whether the $2,017.75 of HELOC interest paid in TY2025 (and any future interest on additional draws used for Lucent expanded scope) qualifies as deductible "qualified residence interest" under IRC §163(h)(3) — turns on use-of-proceeds tracing.

## Facts

- HELOC funded ~Oct 27, 2025: $506,046.85 wire from Symmetry Lending / Georgia's Own Credit Union to **Aneeta's individual Chase account** (see [[reference_heloc]]).
- Lender chain: Georgia's Own Credit Union (lender) / Cenlar (servicer) / Symmetry Lending (funder/SPV) / CrossCountry Mortgage (originator).
- Joint borrowers: Alton + Aneeta. Loan secured by 85 Stonebridge Rd, Montclair NJ.
- TY2025 1098 from Cenlar reports $2,017.75 interest paid.
- Kim Sarullo's processor email referenced "Heloc refinance" and listed four Chase cards (last-4 1276, 7054, 5680, 9425).

> [!warning] Load-bearing fact, currently unknown
> Use of the $506K wire is undetermined. Three plausible paths:
> 1. Paid off the four Chase cards (consolidation)
> 2. Held as personal cash reserve (consumption)
> 3. Used for 85 Stonebridge improvements (deductible per §163(h)(3))

## Authority

- **IRC §163(h)(3)(A)**: Qualified residence interest = interest on acquisition indebtedness OR home equity indebtedness (note: §163(h)(2)(D) was repealed by TCJA for 2018-2025; HELOC interest deductible only when proceeds buy/build/substantially improve the residence securing the debt).
- **Notice 88-74**: Tracing rules. Interest expense allocated by use of proceeds, not by collateral.
- **Treas. Reg. §1.163-10T(o)(5)**: Tracing applies at time underlying debt was incurred, not at consolidation. CRITICAL for refinance HELOCs that paid off other debt.
- **Treas. Reg. §1.163-8T**: General tracing framework for interest expense allocation.
- **TCJA (P.L. 115-97)**: $750K combined acquisition+improvement debt cap. Personal interest no longer deductible.
- **IRS Publication 936**: Practical tracing guidance.

## Analysis

The TCJA killed the prior "home equity indebtedness for any purpose up to $100K" deduction. Post-2017, HELOC interest is deductible ONLY if the proceeds were used to buy, build, or substantially improve the residence securing the loan.

The Sartor HELOC is structured as a refinance — Kim Sarullo's intro email called it "Heloc refinance of 85 Stonebridge." A refinance HELOC almost always means it paid off prior HELOC AND/OR other debt. Per Reg §1.163-10T(o)(5), tracing applies at the time the original debt was incurred, not at refinance — so we need to trace each dollar back through the refinance to its ultimate use.

If $506K was used to:
- Pay off four Chase cards: trace each card's spend history. Cards used for home improvement → deductible. Cards used for general consumption → personal interest, NONDEDUCTIBLE.
- Hold as cash reserve: NONDEDUCTIBLE (no qualifying use).
- Pay for 85 Stonebridge improvements directly: DEDUCTIBLE up to $750K combined cap with primary mortgage.

The $2,017.75 of TY2025 interest is small but the **principle is what matters** because additional draws are being contemplated for the Lucent expanded scope ($95-170K). If tracing fails on the original $506K, future draws routed through the same HELOC may inherit complications.

Two-document audit defense: keep (a) wire confirmation showing destination, (b) bank statements showing what cleared, (c) for any consolidation, the underlying card statements showing spend history.

### Risk grade: HIGH

The 30-40% probability estimate (informal, based on pattern recognition that consolidation-style HELOCs frequently fail tracing) reflects: refinance pattern + wire to personal account (not contractor) + inclusion of multiple consumer cards in the closing context. None of these are dispositive but together they're a yellow flag.

## Position

**Pending fact reconstruction. Conservative posture: assume some material portion of TY2025 interest is non-deductible until tracing is documented.**

If tracing supports full deduction: amend TY2025 1040 to claim $2,017.75 (or carry through if already on the return). LOW risk.

If tracing supports zero deduction: do not claim $2,017.75. LOW risk.

If tracing is ambiguous: claim only the portion clearly tied to home improvement, document the rest. MEDIUM risk.

## Action items

- [ ] **Reconstruct use-of-proceeds with Aneeta.** Pull bank statements Oct 23 to Nov 30, 2025 for Aneeta's Chase. Identify where the $506K went.
- [ ] If consolidation: pull last 24 months of statements for Chase cards 1276, 7054, 5680, 9425. Categorize spend by deductibility.
- [ ] Cenlar portal pull: confirm whether any HELOC draws have been made since Oct 2025 (separate from initial fund).
- [ ] Send IRAC memo (this file) to Jonathan Francis as written analysis. Request his read.
- [ ] Decision before Oct 15, 2026 (TY2025 amend window): claim or not.
- [ ] If additional draws contemplated for Lucent work: structure draws to pay contractor directly (not through Aneeta's account) to preserve tracing.

## CPA / counsel routing

- **Send to JF as**: written memo (this file). His read is the position-driver.
- **JF deliverable**: informal email confirmation of tracing methodology + sign-off on TY2025 amend disposition.
- **Engagement-letter status**: verbal-only as of 2026-05-08. See [[cpa-engagement-letter]] matter.

## History

- 2026-05-08: Opened. Initial IRAC. Position: HIGH risk pending fact-pattern reconstruction. Wire destination (Aneeta's Chase) and refinance framing (per Kim Sarullo) are the load-bearing flags. Action items issued.

## Resolution

(pending — fill in on close-out)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion. Engage a licensed tax attorney for opinion-letter quality.
