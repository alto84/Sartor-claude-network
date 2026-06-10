---
type: matter
matter: heloc-163h3-tracing
status: open
risk: high
priority: p1
opened: 2026-05-08
updated: 2026-06-09
last_action: 2026-06-09
deadline: 2026-10-15
authority: [IRC-163h3, IRC-163h2A, Reg-1.163-8T, Reg-1.163-10T-o5, Notice-88-74, Notice-89-35, IRC-163h2D-repealed, OBBBA-70108]
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
- **Treas. Reg. §1.163-10T(o)(5)**: ~~Tracing applies at time underlying debt was incurred~~ **[MIS-CITE, corrected 2026-06-09: the replacement-debt rule (each consolidated dollar inherits the character of the original spend) is Reg. §1.163-8T(e)(4). §1.163-10T(o)(5) is the election to treat residence-secured debt as NOT secured by the residence, so §1.163-8T tracing controls exclusively. Substantive conclusion unchanged.]**
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

## 2026-06-09 UPDATE — two-route new-draw analysis (IRAC memo + adversarial verdict, grade MEDIUM)

Full memo prepared 2026-06-09 (Reading 1: interest deductibility on new draws; Reading 2: depreciation of HELOC-funded improvements; draw-discipline checklist). Verified conclusions, with verdict corrections applied:

**Headroom fact (verdict correction, contradicts the memo's own framing): best evidence is ~$0 headroom, not ~$21K.** $506,046.85 was the NET wire; reference_heloc shows a $20,953.15 closing-cost retention against the $527,000 limit, the 2025-10-08 timeline records Alton confirming the initial draw as "the entire amount," and the TY2025 Cenlar 1098 reports principal of $527,000. **The entire new-draw analysis is moot until principal is repaid — Cenlar portal pull (balance/available credit) is the gating action.** Corollary: untraced run-rate is ~$39.5K/yr at 7.5% on $527K, and the ~$21K closing-cost slice is itself personal-use debt.

**Route A — §163(h)(3) QRI on improvement draws: legally clean, economically gutted.** $750K acquisition-debt cap is permanent (OBBBA §70108); the ~$1.82M first mortgage saturates it 2.4×, so Pub. 936 averaging recovers only ~10–25% of new-draw interest (~$380–$940/yr at a midpoint draw). **Verdict fork: if any first-mortgage portion is grandfathered pre-12/16/2017 debt, Route A on new draws can be exactly $0 — first-mortgage VINTAGE (not just rate) must be pulled.**

**Route B — business tracing (§163(h)(2)(A) / §1.163-8T / Notice 89-35): worth ~4× per traced dollar, survives verification.** Draw → documented capital contribution to SI LLC → LLC pays for business property from its own account. The **§1.163-10T(o)(5) election** survives verification as a real route but with corrected framing: it is **optional belt-and-suspenders, not a default companion** — post-TCJA, non-acquisition residence-secured debt traced to business use is deductible without it; the election is per-debt (covers ALL draws on the HELOC), forfeits any Route A QRI on the same line, and is irrevocable without Commissioner consent. Internal inconsistency resolved: you cannot take the election AND Route A on the same HELOC — choose deliberately with JF. Route B applies ONLY to dollars the LLC genuinely deploys; running personal improvements through the LLC is form without substance, HIGH — don't.

**§469 contingency (verdict's most consequential gap):** hours alone may not fix it. If vast.ai hosting is per-se passive rental under §1.469-1T(e)(3) (reserved contract C.34113802 ~141 days), Route B interest AND the bonus depreciation suspend even at 100+ hours. See [[469-material-participation]] 2026-06-09 update. Also missing limiter now stated: §461(l), 2026 MFJ threshold $512K (OBBBA reset).

**Citation corrections adopted:** the 30-days commingling rule is Notice 89-35 (the reg, §1.163-8T(c)(4)(iii)(B), gives only 15-days-after); Notice 88-74's improvement rule is completion-keyed (24-month lookback; debt up to 90 days after completion) — the memo's draw-within-90-days checklist guidance is conservative and safe; replacement-debt inheritance is §1.163-8T(e)(4) (Authority bullet above corrected); §163(j) gross-receipts threshold is $32M for 2026 (irrelevant either way).

**Reading 2 (depreciation):** HELOC-routed scope items yield essentially zero LLC depreciable basis — siding/mortar/bathroom/power-washing are personal (HIGH, don't); only AC re-arrangement (as Powerwall install cost) and vent relocations (as roof-install cost) are arguable, MEDIUM, requiring contemporaneous necessity documentation, scaled by business-use fraction. Funding source is irrelevant to basis character — two ledgers: what the dollar bought vs where it came from.

**Untraced $506K (now $527K): conservative posture stands.** Do not claim the TY2025 $2,017.75 pending reconstruction; "cards confirmed paid off" leans consolidation → nondeductible under §1.163-8T(e)(4). At ~$39.5K/yr of presumptively nondeductible interest, the reconstruction is the prize, an order of magnitude larger than the new-draw question. Amend window closes 2026-10-15.

**Draw-discipline checklist** (8 items: headroom first; one draw = one purpose; direct-to-vendor payment; two-hop documentation for Route B contributions; per-draw paper; tracing schedule in `data/financial/`; (o)(5) decided once with JF; repayment ordering per §1.163-8T(d)(1) cleanses personal-traced debt first) — lives in the 2026-06-09 memo; operationalize before ANY new draw.

**New action items:** (1) Cenlar portal pull — balance/available credit (gates everything); (2) pull first-mortgage vintage + rate; (3) JF asks: Pub. 936 averaging math, (o)(5) go/no-go, Notice 89-35 contribution mechanics + Schedule E presentation, ratify conservative TY2025 posture.

## History

- 2026-05-08: Opened. Initial IRAC. Position: HIGH risk pending fact-pattern reconstruction. Wire destination (Aneeta's Chase) and refinance framing (per Kim Sarullo) are the load-bearing flags. Action items issued.
- 2026-06-09: **Two-route new-draw memo + adversarial verdict (MEDIUM) added.** Headroom corrected to ~$0 best-evidence (1098 principal $527,000) — new-draw analysis moot pending paydown; Route A diluted to ~$380–$940/yr (or $0 if first mortgage has grandfathered debt); Route B (Notice 89-35 contribution + optional §1.163-10T(o)(5) election) is the value path for genuinely-LLC dollars, contingent on §469 characterization; Authority mis-cite fixed (§1.163-8T(e)(4), not (o)(5)); draw-discipline checklist adopted; conservative posture on the untraced principal reaffirmed (~$39.5K/yr nondeductible run-rate is the real prize).

## Resolution

(pending — fill in on close-out)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion. Engage a licensed tax attorney for opinion-letter quality.
