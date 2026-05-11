---
type: source-document
entity: heloc-85-stonebridge
document: TY2025 IRS Form 1098 (HELOC, Cenlar-issued)
source: gdrive-1FSgjDh92u16SO4IovMbMoKeHmK4ZkKBg
date: 2026-01-09
captured: 2026-05-08
captured_by: heloc-doc-archivist (subagent)
related: [reference_heloc, BUSINESS, TAXES, reference_solar_project]
tags: [domain/heloc, entity/tax, status/active, source/drive]
---

# TY2025 Form 1098 — HELOC, issued by Cenlar (2026-01-09)

## What this tells us

The Cenlar-issued TY2025 Form 1098 for the HELOC. **The recipient/lender field on the form is Cenlar's "Central Loan Administration & Reporting" entity** (P.O. Box 77404, Ewing, NJ 08628, RECIPIENT TIN 21-0534340), not Georgia's Own Credit Union — this is exactly the source of the prior memory error and the reason this curation pass exists. The 1098 says "Cenlar," but the actual lender is Georgia's Own Credit Union per the welcome letter and the underlying loan documents. **For tax filing this is the canonical 1098** — JF (CPA) needs this exact document, and the address on the 1098 (Cenlar) is the correct payee in IRS reporting.

## Drive metadata

- **Drive file ID:** `1FSgjDh92u16SO4IovMbMoKeHmK4ZkKBg`
- **Title:** `10-1098-HELOC-85Stonebridge-Cenlar-TY2025.pdf`
- **Parent folder:** `1-X6NYw49PFA3WwPvdG-llzEkiWYVI0bZ` (the 2025 Personal Tax Documents folder; the same folder with all 21 numbered TY2025 docs referenced in [[TAXES]])
- **Created:** 2026-04-07 (downloaded into Drive then)
- **Form generated:** 2026-01-09 (top of form: "K901/09/2026")

## Form 1098 verbatim (TY2025, Rev. April 2025)

**RECIPIENT'S/LENDER'S name:** Central Loan Administration & Reporting
**RECIPIENT'S address:** PO BOX 77404, EWING, NJ 08628
**RECIPIENT'S/LENDER'S TIN:** 21-0534340
**RECIPIENT'S phone:** 855-839-6470
**Account number (per Sartor financial-research rule, last-4 only):** ends in **7887** (the canonical loan/application number; full digits in source PDFs only). The 1098 also prints a longer Cenlar reporting-system identifier; only its last-4 is retained here for cross-checking.

**PAYER'S/BORROWER'S TIN (last-4):** ***-**-0485 (this is Aneeta Rani Saxena's SSN-last-4 — she is listed as primary borrower on the form)
**PAYER'S/BORROWER'S name:** ANEETA RANI SAXENA, EMMETT ALTON SARTOR (joint)
**PAYER'S/BORROWER'S address:** 85 STONEBRIDGE RD, MONTCLAIR NJ 07042-1631

| Box | Field | Value |
|---|---|---|
| 1 | Mortgage interest received from payer(s)/borrower(s) | **$2,017.75** |
| 2 | Outstanding mortgage principal as of January 1, 2025 | $0.00 (loan didn't exist yet on 1/1/25) |
| 3 | Mortgage origination date | **10/23/25** |
| 4 | Refund of overpaid interest | $0.00 |
| 5 | Mortgage insurance premiums | $0.00 |
| 6 | Points paid on purchase of principal residence | $0.00 |
| 7 | Property securing mortgage same as borrower's address | (checked / yes — implied; box 8 is filled) |
| 8 | Address of property securing mortgage | 85 STONEBRIDGE RD MONTCLAIR NJ 07042 |
| 9 | Number of properties securing the mortgage | 001 |
| 10 | Other | (blank) |
| 11 | Mortgage acquisition date | (blank — same as origination) |

### Statement-of-account section (informational)

- Current Total Payment: $3,140.34
- Current Escrow Payment: $0.00 (HELOC has no escrow)
- Principal Activity 2025: Beginning balance $0.00 → Payments applied $0.00 → **Remaining balance $527,000.00**
- Escrow Activity 2025: All zero (no escrow on this HELOC)
- Disbursement Activity 2025: Total interest applied in 2025: $2,017.75 (= Box 1)

## What the 1098 confirms

1. **Loan origination date 10/23/2025** matches the wire-funding date captured in the lender's WireXchange notification (the $506,046.85 wire to Aneeta).
2. **Outstanding balance $527,000** as of report-generation = full credit limit drawn at closing. Confirms Alton's 10/8/25 email decision ("initial draw will likely be the entire amount") was executed.
3. **Interest paid in calendar year 2025 = $2,017.75** — this is the only HELOC-deductible interest figure for TY2025. Reflects ~10 weeks of interest from 10/23/2025 → 12/31/2025 on $527K at 7.5% APR (rough check: 527,000 × 0.075 × 70/365 ≈ $7,575 — far higher than $2,017 — implying some payments hit principal too, OR the actual draw didn't happen until later in October. Cross-check with Cenlar portal statements once accessible).
4. **Form recipient is Cenlar, not Georgia's Own.** Standard for serviced loans — IRS gets one 1098 from whoever services the loan, regardless of who funds it.

## Tax-filing note (CPA-relevant)

> [!fact] Mortgage interest deduction qualification
> Per §163(h)(3), HELOC interest is deductible up to the $750K aggregate-acquisition-and-improvement-debt cap (TCJA, 2018+) **only if** proceeds were used to "buy, build, or substantially improve" the home that secures the loan. The 2025 HELOC funded a $506,046.85 wire to Aneeta on 2025-10-23. Confirm with CPA Jonathan Francis the use-of-proceeds test for this draw — likely consumer/personal use rather than home-improvement, in which case the $2,017.75 of 2025 interest may NOT be deductible. This is the sort of question that requires the use-of-proceeds tracing to be documented before filing.

## Related

- [[reference_heloc]] — canonical HELOC reference
- [[06-heloc-welcome-letter-symmetry-cenlar-2025-10-27]] — confirms the lender-vs-servicer split this 1098 reflects
- [[TAXES]] — TY2025 personal tax package (1098 #10 in the inventory)
- [[business/solar-inference]] — Anthropic-shares decision context (not directly related but the 2025 HELOC draw is part of the household balance sheet)
