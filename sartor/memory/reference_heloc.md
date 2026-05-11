---
type: reference
entity: heloc
updated: 2026-05-08
updated_by: heloc-curation (Rocinante Opus 4.7 1M)
status: active
priority: p1
last_verified: 2026-05-08
next_review: 2026-06-15
tags: [domain/heloc, entity/mortgage, status/active, priority/p1]
aliases: [85 Stonebridge HELOC, Georgia's Own HELOC, Cenlar HELOC, Symmetry HELOC, GOCU HELOC]
related: [BUSINESS, TAXES, reference_solar_project, ALTON, FAMILY]
originSessionId: 5d94a39c-b1cf-4da3-ab23-793fbf18c03d
---
# 85 Stonebridge HELOC — canonical reference

> [!important] One-line summary
> HELOC on 85 Stonebridge: **Georgia's Own Credit Union** (lender) + **Cenlar** (servicer) + **Symmetry Lending, LLC** (funder/SPV) + **CrossCountry Mortgage** (originator). Closed 2025-10-18 / funded 2025-10-23. Joint Aneeta + Alton. **$527,000 credit limit, ~$506K drawn at closing.** Open as funding option for additional house work being scoped with Lucent Energy May 2026.

The active HELOC at 85 Stonebridge Rd, Montclair NJ. Memory before 2026-05-08 mis-attributed the loan to "Cenlar" — Cenlar is the servicer only. The actual lender is Georgia's Own Credit Union, originated by CrossCountry Mortgage via Symmetry Lending. This file is the canonical source for the loan structure and is the page CPA + future-Claude should grep when the question "wait, who is the lender on this HELOC?" comes up.

## Loan structure

| Role | Party | Notes |
|---|---|---|
| **Lender (loan owner)** | **Georgia's Own Credit Union** | NMLS 539379, 100 Peachtree St, Atlanta, GA 30303, (404) 874-1166. The owner of record. |
| **Servicer (payments + 1098)** | **Cenlar** ("Central Loan Administration & Reporting") | TIN 21-0534340, P.O. Box 77404, Ewing NJ 08628, customer service 855-839-6470. Issues the IRS Form 1098 in Cenlar's name even though the lender is GOCU. |
| **Loan funder / SPV** | **Symmetry Lending, LLC** | NMLS 1725404, 6600 Peachtree Dunwoody Rd, Bldg 600, Ste 110, Atlanta GA 30328, (678) 597-9771. Processes and closes the loan in the name of Georgia's Own Credit Union. |
| **Originating broker** | **CrossCountry Mortgage, LLC (CCM)** | NMLS 3029, 200 Mineral Springs Rd Ste 205, Rockaway NJ 07866. Loan officer Angelica Tanti (NMLS 1163201), loan-assistant Chelsea Masterson (Personal NMLS 1407263), processor Kim Sarullo. |
| **Settlement agent** | Evident Title Agency, Inc. | 674 Pompton Avenue Suite B2, Cedar Grove NJ 07009, (973) 857-1700. Closer Danielle Esposito. Closing reference ETA3-25-35743. |
| **Borrowers** | Emmett Alton Sartor + Aneeta Rani Saxena, jointly ("wife and husband" vesting) | Both must sign; both individually and jointly liable. |
| **Property** | 85 Stonebridge Rd, Montclair NJ 07042 | Block 1101, Lot 12. 2nd-lien position. |
| **Type** | HELOC refinance | Refinance of a prior HELOC, per Kim Sarullo's 2025-10-02 onboarding email ("Heloc refinance of 85 Stonebridge Rd"). |
| **Account / Application Number** | last-4: **7887** (full digits in `[[reference/heloc-2025-10/06-heloc-welcome-letter-symmetry-cenlar-2025-10-27]]` source quote, redacted to last-4 in all canonical/cross-link contexts per Sartor financial-research rule) | Single canonical number used by all parties. |

## Key economic terms (as signed 2025-10-18)

| Field | Value |
|---|---|
| Credit limit | **$527,000.00** |
| Initial APR | **7.500%** |
| Index | The Wall Street Journal Prime Rate (7.250% as of 2025-10-18) |
| Margin | 0.250% over WSJ Prime |
| Rate mechanics | Variable; daily periodic rate 0.0205479%; APR adjusts business-day after Index change; no per-year change limit |
| Floor APR | 5.500% |
| Ceiling APR | 18.00% (or maximum permitted by NJ law, whichever is less) |
| Draw period | 5 years from Note date (extendable at lender's option) |
| Repayment period | 25 years following draw period |
| Total maximum term | 30 years from Note date |
| Lien position | 2nd (subordinate to existing 1st mortgage) |
| Min monthly payment during draw period | greater of $50 or accrued interest + fees + any over-limit |
| Min monthly payment during repayment | amortized over 300 months at then-current APR |
| Prepayment penalty | None |
| Symmetry broker compensation (lender-paid) | 2.00% of initial advance + $499.00 flat fee. ~$11,039 implied at full draw. |
| Borrower-direct fees to Symmetry | None |

## Funding facts (2025-10-23)

| Field | Value |
|---|---|
| Wire date / time | 2025-10-23, 16:13 ET |
| Net wire amount | **$506,046.85** |
| Wire-out account (Evident's First Bank) | last-4 **759** |
| Wire-in account | Aneeta's account at JPMCHASE LOUISIANA |
| Wire fee | $25.00 (paid by title agent) |
| WireXchange sequence | 118986 |
| OMAD | `20251023MMQFMP2H10184910231612FT03` |
| IMAD | `20251023GMQFMP01028744` |
| Closing-cost retention vs $527,000 limit | $20,953.15 |
| 1098-confirmed mortgage origination date | 10/23/2025 (matches the wire date) |

## Timeline

- **2025-09-16** — Chelsea Masterson (CCM) sends e-disclosure-package intro email to Aneeta + Alton (`[[reference/heloc-2025-10/03-heloc-edisclosure-package-ccm-2025-09-16]]`).
- **2025-09-17** — Chelsea sends documents-needed checklist (paystubs, mortgage statements, lease) (`[[reference/heloc-2025-10/04-heloc-documents-needed-ccm-2025-09-17]]`). Alton uploads same day.
- **2025-09-18** — DocuPrep dispatches initial Symmetry Lending disclosures to each borrower; Aneeta forwards her copy to Alton ("Anything I need to do?") (`[[reference/heloc-2025-10/01-heloc-disclosures-symmetry-2025-09-18-emmett]]`, `[[reference/heloc-2025-10/02-heloc-disclosures-symmetry-2025-09-18-aneeta-fwd]]`).
- **2025-09-22** — Underwriting target.
- **2025-09-25** — Chelsea asks for updated 185 Davis lease; Alton sends.
- **2025-10-01** — Broker conditionally approves the HELOC (Chelsea's 12:45 ET email).
- **2025-10-02** — Kim Sarullo (CCM processor) takes over; first reference to "Heloc refinance of 85 Stonebridge Rd"; mandatory-charity controversy with Georgia's Own Foundation; four Chase cards confirmed paid off (`[[reference/heloc-2025-10/05-heloc-processor-onboarding-ccm-2025-10-02]]`).
- **2025-10-03** — New Solar Inference LLC Chase card (last-4 7738, $6,000 limit) documented.
- **2025-10-07 → 10-08** — Multiple e-sign rounds; Alton confirms initial draw will be the entire amount.
- **2025-10-18** — Closing. All loan documents signed. Settlement agent Danielle Esposito acknowledges close (`[[reference/heloc-2025-10/08-heloc-signed-docs-closing-package]]`).
- **2025-10-23** — $506,046.85 wired from Evident Title's First Bank to Aneeta's Chase account (`[[reference/heloc-2025-10/09-heloc-wire-2025-10-23]]`). Mortgage origination date of record.
- **2025-10-27** — Symmetry Lending welcome email confirms Cenlar servicing transfer (`[[reference/heloc-2025-10/06-heloc-welcome-letter-symmetry-cenlar-2025-10-27]]`).
- **2026-01-09** — Cenlar issues TY2025 IRS Form 1098 reporting $2,017.75 of HELOC interest paid in 2025 (`[[reference/heloc-2025-10/07-1098-heloc-cenlar-TY2025]]`).
- **2026-04-13** — CPA tax-package email surfaces the loan; memory captures it as "HELOC opened through Cenlar" (the error this curation pass corrects).
- **2026-05-08** — Memory entry created. Source documents archived in `reference/heloc-2025-10/`. Lender chain corrected throughout `BUSINESS.md`, `TAXES.md`, and `reference_solar_project.md`.

## Open documentation gaps

What we have:

- TY2025 IRS Form 1098 issued by Cenlar, $2,017.75 of 2025 interest (`[[reference/heloc-2025-10/07-1098-heloc-cenlar-TY2025]]`)
- Symmetry welcome letter terms-in-body (transcribed in `06-`)
- CCM disclosure-package thread + processor onboarding (`03-`, `04-`, `05-`)
- Closing package terms transcribed (`08-`)
- Funding wire confirmation (`09-`)

What we need (live data, must be pulled from the **Cenlar portal** at `cenlar.com` / `loanadministration.com`):

- [ ] **Current credit limit** (assumed still $527,000; confirm)
- [ ] **Current outstanding balance** (assumed full-draw $527K minus any principal payments since 10/23/2025; the $2,017.75 of TY2025 interest implies some principal was paid in 2025)
- [ ] **Available remaining credit** (= credit limit minus outstanding balance, not directly reported on the 1098)
- [ ] **Current variable APR** (was 7.500% at signing; WSJ Prime has moved since 2025-10)
- [ ] **Most recent statement** (monthly statements live in the Cenlar portal; archive each statement to `reference/heloc-2025-10/statements/` going forward)

Other gaps:

- [ ] Open in Gmail and download the attachment PDFs flagged in the per-thread source notes (initial disclosures, signed credit-card statements, etc.)
- [ ] Decrypt `Password 07042 ETA3-25-35436 FE LENDERS DOCS 35436.PDF` from the "2025 Refinance" Drive folder. Password is the property zip code "07042" per the filename hint. Drive MCP cannot decrypt; open in Acrobat or Drive UI.

## Key actors

| Person | Role | Contact |
|---|---|---|
| Angelica Tanti | Loan officer, CrossCountry Mortgage | atanti@ccm.com — NMLS 1163201 |
| Chelsea Masterson | Loan-assistant, CrossCountry Mortgage | Chelsea.Masterson@ccm.com — D 973.200.7687 — Personal NMLS 1407263 |
| Kim Sarullo | Loan processor, CrossCountry Mortgage | Kim.Sarullo@ccm.com |
| MZMLA Group (CCM team inbox) | Branch group inbox at CCM Rockaway NJ | MZMLAGroup@ccm.com |
| Symmetry Lending customer service | (closing / pre-funding) | (678) 597-9771 — Atlanta GA — NMLS 1725404 |
| Cenlar Servicing | Servicer for ongoing payments + 1098 | P.O. Box 77404, Ewing NJ 08628 — 855-839-6470 — `loanadministration.com` |
| Georgia's Own Credit Union | Lender of record (membership/savings account auto-opened at closing) | (404) 874-1166 (24/7) — `georgiasown.org` |
| Danielle Esposito | Settlement agent / closer | Evident Title Agency, 674 Pompton Ave Ste B2, Cedar Grove NJ 07009 — (973) 857-1700 |

## Tax position

> [!fact] §163(h)(3) deductibility — qualified-residence interest test
> Per IRC §163(h)(3) (TCJA, 2018+ regime), HELOC interest is deductible **only if** the proceeds were used to "buy, build, or substantially improve" the home that secures the loan, subject to a **$750K aggregate cap** on combined acquisition + home-improvement debt across the qualified residence. The 85 Stonebridge first mortgage is ~$1.82M (already over the $750K cap on its own), which means **only the slice of mortgage debt up to $750K total is deductible at all** — the HELOC interest competes with first-mortgage interest for that limited cap.
>
> Use-of-proceeds tracing for the 2025-10-23 $506K draw is the threshold question. If used for non-improvement purposes (consumer spending, debt consolidation, the four Chase cards, etc.), the HELOC interest is **not deductible** even within the $750K cap. CPA Jonathan Francis must opine before TY2025 1040 filing.

> [!fact] TY2025 1098 source-document
> The IRS Form 1098 for the HELOC was issued by **Cenlar**, the servicer, in Cenlar's own name and TIN (21-0534340), reporting $2,017.75 of 2025 interest. This is **standard practice** — IRS reporting is done by whoever services the loan, regardless of who funds it. JF (CPA) needs the Cenlar 1098 (not anything from Georgia's Own) for the 1040; the underlying lender does not change reporting mechanics.

> [!warning] Flag for CPA: lender vs. servicer naming clarity
> Memory before 2026-05-08 referred to this as "Cenlar HELOC." If the CPA's working notes also call it the Cenlar HELOC, confirm that the underlying lender being Georgia's Own (not Cenlar) does not create reporting confusion at the 1040/Schedule A level. There should be no operational consequence — Cenlar is the correct payee for IRS purposes — but the canonical lender name (GOCU) needs to be in any narrative the CPA produces.

## Use case for May 2026 expanded solar scope

The 2026-05-06 Lucent site visit produced a 12-item expanded scope for the 85 Stonebridge solar project. Items NOT eligible for the Climate First Bank Clean Energy Loan amendment (because they're not energy property under §48) route to **this HELOC** instead:

| Solar-project item | Routing |
|---|---|
| Plaster siding + flashing repairs (mason / Santos work) | **HELOC** — not energy property |
| Mortar repairs | **HELOC** |
| Power washing | **HELOC** |
| Gutters (5"→7" + downspouts) | **HELOC** unless solar-supporting argued |
| AC re-arrangement | **HELOC** |
| Bathroom update (separate vendor) | **HELOC** |
| Wood deck under racking | Climate First (energy property; required for Tesla TSR install) |
| 2 × Tesla Powerwall | Climate First (energy storage; ITC-eligible) |
| Snow guards | Climate First (engineered with the roof) |
| Vent relocations × 2 | Ambiguous; coordinate with Lucent's contract amendment |
| Tree removal (3 front trees, March 2026) | Already paid out of pocket via American Tree Experts |
| Driveway staging | $0 logistical |

Total HELOC-routed estimate: roughly **$30K–$60K** of the broader $95K–$170K addition pool. With a fully-drawn $527K HELOC at $506K wired in October 2025, **the HELOC has limited remaining headroom** — the Cenlar portal pull (Action item #1) is required before any of these items can actually route here. If the live balance has been paid down materially since October, more capacity exists; if it hasn't, this funding lane is largely closed and items will route to brokerage-cash extraction or to a Climate First re-underwrite. **Confirm with Aneeta whether the $506,046.85 was used for the four Chase paydowns + general consumer purposes (in which case principal is still ~$525K and HELOC is fully drawn) or whether some has been recycled.**

The §163(h)(3) deductibility rules favor HELOC use for **home-improvement** purposes (preserves the deduction). If Alton/Aneeta are going to use the HELOC for solar-adjacent work, it's a tax-neutral lane vs. cash, and the home-improvement use makes the interest deductible (within the combined $750K cap with the first mortgage; CPA-confirm).

## Action items

- [ ] **Log into Cenlar portal** (`cenlar.com` or `loanadministration.com`) and capture: current credit limit, current outstanding balance, available remaining credit, current APR, most recent statement. Archive the statement PDF to `reference/heloc-2025-10/statements/2026-MM-statement.pdf`. **Owner: Alton.**
- [ ] **Confirm 2025 use-of-proceeds for the $506,046.85 wire** — was it (a) the four Chase card paydowns + consumer use, (b) home-improvement, or (c) some mix? Documented use-of-proceeds is the threshold question for §163(h)(3) deductibility on the $2,017.75 of 2025 interest. **Owner: Aneeta + Alton; document in reply to this checklist.**
- [ ] **CPA call with Jonathan Francis** to (a) opine on TY2025 §163(h)(3) deductibility for the $2,017.75, (b) confirm the lender/servicer naming change ("Cenlar" → "Georgia's Own Credit Union HELOC, Cenlar-serviced") doesn't create 1040 reporting confusion, (c) frame TY2026 deductibility for any new draws used on home-improvement work (solar-amendment routing).
- [ ] **Open Gmail and download attachments** flagged in the per-thread source-document `.md` files (initial Symmetry disclosure PDFs, signed credit-card statements, signed eSignature pages, GOCU Foundation screenshots, Chase 7738 documentation). Save to `reference/heloc-2025-10/email-attachments-2026-05/`.
- [ ] **Decrypt `Password 07042 ETA3-25-35436 FE LENDERS DOCS 35436.PDF`** from the "2025 Refinance" Drive folder (file ID `11zBmJtP76LbfLEVZiihltHqlAymj5t4R`). Password is "07042" per the filename hint. Open in Acrobat. Transcribe any new closing-disclosure-grade material to a new `10-` source-document file in `reference/heloc-2025-10/`.
- [ ] **Mandatory-charity follow-up.** Per the 2025-10-02 thread, Alton sent a complaint to the "Georgia's Own Foundation" requesting removal from the foundation's roster. Confirm whether that request was processed; if not, escalate. The mandatory-501(c)(3)-signature-as-condition-of-loan pattern is at minimum legally questionable and worth a one-line Bitwarden note for any future lender-membership flow.

## Source documents

| File | One-line description |
|---|---|
| [[reference/heloc-2025-10/01-heloc-disclosures-symmetry-2025-09-18-emmett]] | DocuPrep dispatch of Symmetry initial disclosure package to Emmett, 2025-09-18 |
| [[reference/heloc-2025-10/02-heloc-disclosures-symmetry-2025-09-18-aneeta-fwd]] | Aneeta's parallel DocuPrep email forwarded to Alton, 2025-09-18 |
| [[reference/heloc-2025-10/03-heloc-edisclosure-package-ccm-2025-09-16]] | Chelsea Masterson (CCM) e-disclosure intro thread, 2025-09-16 |
| [[reference/heloc-2025-10/04-heloc-documents-needed-ccm-2025-09-17]] | Chelsea's doc-collection thread (paystubs, statements, lease), 2025-09-17 → 2025-10-01 conditional approval |
| [[reference/heloc-2025-10/05-heloc-processor-onboarding-ccm-2025-10-02]] | Kim Sarullo (CCM processor) onboarding + mandatory-charity controversy + initial-draw decision, 2025-10-02 → 2025-10-08 |
| [[reference/heloc-2025-10/06-heloc-welcome-letter-symmetry-cenlar-2025-10-27]] | Symmetry post-closing welcome email confirming Cenlar servicing transfer, 2025-10-27 |
| [[reference/heloc-2025-10/07-1098-heloc-cenlar-TY2025]] | TY2025 Form 1098 (HELOC) issued by Cenlar; $2,017.75 of 2025 interest, principal $527,000 |
| [[reference/heloc-2025-10/08-heloc-signed-docs-closing-package]] | Closing package (Closing Disclosure, Note, Mortgage, Settlement Statement, broker compensation, NMLS roster) — Drive `Signed Docs.pdf` |
| [[reference/heloc-2025-10/09-heloc-wire-2025-10-23]] | $506,046.85 wire-out from Evident Title's First Bank to Aneeta's Chase, 2025-10-23 |

**PDF attachments referenced in the Gmail threads above are NOT yet pulled.** They live in Gmail and must be downloaded manually from the Gmail UI; the Gmail MCP exposes `attachmentIds` but does not expose attachment download. The `.md` files for each thread list the attachment IDs so you can locate them quickly when you open Gmail.

## Related

- [[BUSINESS]] — primary business hub; updated 2026-05-08 to reference this file
- [[TAXES]] — TY2025 personal tax package; the Cenlar HELOC 1098 is doc #10 in the inventory
- [[reference_solar_project]] — 85 Stonebridge solar project; HELOC is the alternative funding lane for non-energy-property scope items
- [[ALTON]] — primary borrower
- [[FAMILY]] — Aneeta as co-borrower; HELOC funded into Aneeta's individual Chase account at closing
- [[business/solar-inference]] — Chase 7738 LLC card opened during HELOC underwriting; LLC context
- [[reference/heloc-2025-10/]] — folder of source-document transcriptions

## History

- **2025-09-16** — CCM e-disclosure intro thread opens.
- **2025-09-18** — Symmetry/DocuPrep initial-disclosure dispatch to both borrowers.
- **2025-09-22** — Target underwriting submission.
- **2025-10-01** — Conditional broker approval.
- **2025-10-02** — Kim Sarullo processor handoff; mandatory-charity dispute filed by Alton; Solar Inference LLC Chase 7738 disclosed.
- **2025-10-08** — Initial-draw decision: full credit limit.
- **2025-10-18** — Closing executed by settlement agent Danielle Esposito of Evident Title.
- **2025-10-23** — $506,046.85 funding wire to Aneeta's Chase. Mortgage origination date of record.
- **2025-10-27** — Symmetry/Cenlar welcome letter confirming servicing transfer.
- **2026-01-09** — Cenlar issues TY2025 1098 reporting $2,017.75 of 2025 interest.
- **2026-04-13** — Surfaces in CPA tax-package email; memory records the loan as "Cenlar HELOC" (the error corrected by this 2026-05-08 pass).
- **2026-05-08** — This memory entry created. Source documents archived in `reference/heloc-2025-10/`. Lender chain corrected throughout `BUSINESS.md`, `TAXES.md`, and `reference_solar_project.md`. Action items opened for Cenlar-portal pull, use-of-proceeds confirmation, CPA call, and Gmail-attachment download.
