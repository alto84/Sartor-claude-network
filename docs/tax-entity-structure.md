# Tax Entity Structure
## Last Updated: 2026-03-31

---

## Entities Overview

| Entity | Type | EIN | Filing | Status |
|---|---|---|---|---|
| Alton + Aneeta Sartor | Personal (MFJ) | SSNs | Form 1040 | Active |
| Solar Inference LLC | NJ Multi-Member LLC | 39-4199284 | Form 1065 + NJ-1065 | Active |
| Sante Total | 501(c)(3) Nonprofit | TBD | Form 990 | Active (see nonprofit docs) |

---

## Entity 1: Personal (Alton + Aneeta Sartor)

**Filing Status:** Married Filing Jointly
**State:** New Jersey

**Income Sources:**
- Alton: AstraZeneca salary/compensation
- Aneeta: Neurvati salary/compensation (Medical Director)
- K-1 income/loss from Solar Inference LLC (50% share)
- Investment income (dividends, capital gains)

**Key Deductions/Credits:**
- Solar ITC (30% of $438,829 = ~$131,649) — flows from LLC K-1
- Bonus depreciation from Solar Inference LLC — flows via K-1
- NJ SuSI credit (~$24,447)

**CPA:** Jonathan Francis, Francis & Company, (914) 488-5727

---

## Entity 2: Solar Inference LLC

**Type:** New Jersey Multi-Member LLC
**EIN:** 39-4199284
**Tax Treatment:** Partnership (default for multi-member LLC)
**Members:** Alton Sartor 50%, Aneeta Sartor 50%

**Required Filings:**
- Federal Form 1065 (Partnership Return)
  - Normal due date: March 15 (2.5 months after Dec 31 FYE)
  - 2025 tax year due: March 16, 2026 (March 15 was Sunday)
  - Extension: Form 7004 for 6-month extension to September 15, 2026
  - Status: May need extension — confirm with CPA
- NJ-1065 (NJ Partnership Return)
  - Due date: April 15, 2026
  - Filing fee: $150 per partner = $300 total
  - Prepayment: $150 required

**K-1 Flow-Through to Personal Returns:**
- Each member receives Schedule K-1 (Form 1065)
- Items flow to member's Form 1040: ordinary income/loss, credits, deductions

**Key Tax Assets:**

| Item | Amount | Treatment | Year |
|---|---|---|---|
| Tesla Solar Roof | $438,829 | Bonus Depreciation (100%) or ITC basis reduction | 2026 (when in service) |
| Federal ITC | ~$131,649 | 30% credit against tax liability | 2026 (when in service) |
| NJ SuSI | ~$24,447 | NJ state credit | 2026 |
| Newegg hardware | $1,459.60 | Sec. 179 / Bonus Dep. | Year purchased |
| RTX PRO 6000 x2 (planned) | ~$17,000 | Sec. 179 / Bonus Dep. | TBD |

**ITC Note:** Cannot take both full ITC and full bonus depreciation on same asset. ITC basis reduction applies: if 30% ITC claimed, must reduce depreciable basis by 50% of ITC amount. Confirm strategy with CPA.

**Depreciation Schedule:**

| Asset | Placed In Service | Depreciable Basis | Method | Year 1 |
|---|---|---|---|---|
| Solar Roof | Pre July 4, 2026 | $438,829 (less ITC adj.) | Bonus Dep. / MACRS | ~$373,005 |
| Newegg hardware | 2025 | $1,459.60 | Sec. 179 | $1,459.60 |

---

## Entity 3: Sante Total (501c3)

**Type:** Nonprofit Corporation
**Tax Status:** 501(c)(3) exempt
**Role:** Alton is Treasurer and Board Member — not an income-generating entity for personal taxes
**Filing:** Form 990 annually (see nonprofit-regulatory-calendar.md)
**Impact on Personal Taxes:** Charitable contributions to Sante Total may be deductible on personal return (confirm with CPA re: self-dealing rules for officers)

---

## Key Deadlines — 2026

| Deadline | Filing | Entity | Status |
|---|---|---|---|
| March 16, 2026 | Form 1065 | Solar Inference LLC | May need extension |
| April 15, 2026 | NJ-1065 + fees | Solar Inference LLC | Action needed |
| April 15, 2026 | Form 1040 | Personal | Confirm with CPA |
| May 15, 2026 | Form 990 | Sante Total | Confirm |
| Pre July 4, 2026 | Solar in service | Solar Inference LLC | Hard ITC deadline |

---

## Open Questions for CPA

1. Has Form 7004 been filed for the 1065 extension?
2. ITC vs. bonus depreciation strategy on Solar Roof (basis reduction rules)?
3. Sante Total IRS penalty abatement — status?
4. NJ-1065 filing fee payment method?
5. Charitable deduction rules for Sante Total given Alton's officer role?
