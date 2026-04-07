---
name: tax-estimate
description: Cross-entity estimated tax calculation across Personal, Solar Inference LLC, and Sante Total
model: opus
reads: [TAXES, BUSINESS, ALTON]
writes: [data/financial/tax-estimates/]
---

Produce an estimated tax calculation across all three entities for CPA discussion support. This is modeling for informed conversations with a tax professional — not tax advice.

> [!fact] Authoritative source
> Current filing status, CPA contact, and open questions live in [[TAXES]]. Always read it first — it's the ground truth for deadlines, CPA scope, and material TY2025 changes.

## Entities
1. **Personal (Alton + Aneeta)** — NJ resident, married filing jointly
2. **Solar Inference LLC** — 50/50 ownership (Alton/Aneeta), pass-through entity
3. **Sante Total** — 501(c)(3) nonprofit, no tax liability but may affect deduction planning

## Step 1 — Read Current Financial Data
Read `data/financial/` for current income, expense, and asset data across entities.
Read [[TAXES]] for current filing status and any open decisions (e.g., 1040 file-vs-extend).
Read any existing tax estimate files for prior quarter context.

## Step 2 — Solar Inference LLC Analysis
Key items to model:
- **Solar roof asset**: $438K cost basis, eligible for 30% ITC (Investment Tax Credit)
- **Bonus depreciation**: 100% bonus depreciation on eligible equipment (year placed in service)
- **NJ SuSI incentive**: Solar Successor Incentive program — note NJ treatment vs federal
- **LLC income/loss**: pass-through to personal return (Schedule E)
- Calculate: net taxable income after depreciation and ITC

## Step 3 — Personal Return Estimate
Inputs:
- W-2 income (Alton + Aneeta)
- LLC pass-through (from Step 2)
- Investment income (dividends, capital gains)
- Deductions: mortgage interest, state/local taxes (SALT cap), charitable contributions
- ITC carryforward or current-year application
Calculate: federal AGI, taxable income, estimated federal tax, NJ state tax

## Step 4 — Quarterly Estimated Payments
- Calculate safe harbor amounts (110% of prior year tax)
- Current year actual estimate
- Recommend Q1/Q2/Q3/Q4 payment amounts
- Note if overpayment risk from ITC application

## Step 5 — Entity Interaction Effects
Flag any interactions:
- LLC depreciation loss affecting personal AMT exposure
- NJ treatment differences from federal (NJ does not conform to bonus depreciation)
- Sante Total charitable contribution deductibility if personal donations made

## Step 6 — Key Questions for CPA
List 3–5 specific questions this analysis raises that should be addressed with a tax professional. If [[TAXES]] already has open questions in its frontmatter or body, avoid duplicating them — cross-reference instead.

## Related memory files
- [[TAXES]] — current filing status, CPA scope, open decisions
- [[BUSINESS]] — Solar Inference LLC structure, Sante Total
- [[ALTON]] — filer profile

## Output
Save to: `data/financial/tax-estimates/{date}-estimate.md`

Format:
```
# Tax Estimate — {date}

## Disclaimer
This is a preliminary model for CPA discussion, not tax advice.

## Solar Inference LLC
- Gross income: $X
- Depreciation (bonus): $X
- ITC (30%): $X
- Net pass-through: $X (income) / $X (loss)

## Personal Federal Estimate
- AGI: $X
- Taxable income: $X
- Estimated tax: $X
- Effective rate: X%

## NJ State Estimate
- NJ income (note: NJ does not conform to bonus dep): $X
- NJ tax: $X

## Quarterly Payment Schedule
- Q1 (due Apr 15): $X
- Q2 (due Jun 15): $X
- Q3 (due Sep 15): $X
- Q4 (due Jan 15): $X

## Interaction Effects
...

## Questions for CPA
1. ...
```
