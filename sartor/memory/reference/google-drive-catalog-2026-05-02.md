---
name: google-drive-catalog-2026-05-02
description: Catalog of Sartor-relevant documents found in alto84@gmail.com Google Drive, organized by domain (property, Solar Inference, Sante Total, AstraZeneca, family, taxes). Drive URLs and descriptions only. PDF content stays in Drive. Built 2026-05-02 via Chrome MCP after gdrive OAuth refresh expired.
type: index
status: snapshot
date: 2026-05-02
created_by: subagent (general-purpose, Chrome MCP, Opus 4.7 1M)
related: [TAXES, BUSINESS, FAMILY, ALTON, reference_home_network]
tags: [reference/index, source/google-drive]
---

# Sartor Google Drive catalog — 2026-05-02 snapshot

## Methodology

**Tools.** Chrome MCP into Alton's open Drive session at `https://drive.google.com/`. Each query was a navigation to `https://drive.google.com/drive/search?q=<term>` followed by JS extraction of `[role="row"][data-id]` rows from the rendered grid. Folder enumerations used `https://drive.google.com/drive/folders/<id>`.

**Why not gdrive MCP.** The OAuth refresh token expired (Testing-mode 7-day window). `mcp__gdrive__authGetStatus` returned `expiresInSec: -70887`, and a probe search returned `invalid_grant`. Chrome was the only viable path this session.

**Coverage caps.** Drive's search UI renders ~20 rows per query before the user scrolls or paginates; aggressive auto-scroll never produced more than 20 for any of the 14 queries run. This means each search returns the top-20 most relevant hits as Drive ranks them, not an exhaustive list. For Solar Inference and 85 Stonebridge, I supplemented by directly listing the canonical folder trees (which return all children).

**Out of scope (constraint).** No PDF downloads. No Drive-side edits. No content extraction from PDFs (only filenames + metadata visible from the search/folder UI).

**Queries executed (14).**
1. `85 Stonebridge` (20 hits) — property core
2. `Stonebridge deed` (20 hits) — overlap + purchase docs
3. `Hingos OR title insurance Stonebridge` (20 hits) — surveyor/title (Hingos by name not found in Drive)
4. `"Selective insurance"` (1 hit) — Selective insurance docs (homeowners) NOT directly findable via filename
5. `Bamboo` (1 relevant) — bamboo-violation letter
6. `Solar Inference` (20 hits) → drilled into folder tree manually
7. `Sante Total` (20 hits)
8. `Form 990 OR IRS penalty` (20 hits)
9. `Tesla solar roof OR Lucent` (20 hits)
10. `Climate First` / `"Financing and Payments"` (4 + 1 folder) → drilled folder
11. `vast.ai OR vastai` (7 hits)
12. `K-1 OR Schedule K-1 OR Form 1065` (20 hits)
13. `AstraZeneca OR W-2` (20 hits)
14. `Vayu OR Vishala OR Vasu OR MKA` (20 hits) + `Montclair Kimberley OR Goddard OR Disney` (20 hits)
15. `tax return OR 1040` (20 hits)
16. `Lucent OR Form 7004 OR extension` (20 hits) + `2025 Refinance OR gift letter OR mortgage Box` (20 hits)
17. `passport OR Aneeta Saxena` (20 hits) + `"Passport Folder"` (folder ID)

Folder enumerations: 85 Stonebridge folder (7), Solar Inference LLC root (3), 2025-Solar-Inference-LLC-Tax-Package (8 subfolders), 03-Solar-Roof (5), 02-Equipment-Receipts (4), 06-Chase-Statements (7), Financing-and-Payments (6), LLC folder (9), Passport Folder (7).

**Total unique documents/folders cataloged: ~135 (after de-duplication).** Many docs appear in multiple queries (e.g., the LLC Articles PDF surfaces under property, LLC, Solar Inference, and tax queries). De-duplication is by Drive ID.

---

## A. Property — 85 Stonebridge Road, Montclair NJ (Block 1101 Lot 12)

### Top-level folder tree
- `1nqc4-kvMamrbNNtD7_qXCNzgzV_hG8RQ` — `My Drive > Housing Documentation > 85 Stonebridge` (canonical home for property docs). 4 subfolders + 3 loose files.

| Drive ID | Filename | Type | Modified | Notes |
|---|---|---|---|---|
| 1Q0BP058tQOHNBOsZGwkuQi0NSOZvyErN | 2025 Refinance | folder | Sep 10, 2025 | 2025 cash-out refi pkg |
| 1GzdqzBJ9lD5JH7lU--oB_X5LE7dYF6Uv | Moving | folder | Nov 15, 2023 | move-in pkg |
| 1uPX_yQnBFfzOS4IDQQXT-4g0RmCgtMt2 | Purchase documents | folder | Nov 15, 2023 | original 2023 purchase |
| 1cBimxgoHckldQmCP7WJ6dRm5lnwdZ2ud | House maintenance | folder | Nov 15, 2023 | repair receipts |
| 10vuXeTIyxRiIJ0z65-LInTHclzUnY7hm | wifi quote 2025.pdf | PDF 168K | Jan 13, 2026 | BHS pre-takeover quote |
| 1lVYnhdsq914SDGOzohd4KBgkNCmBBSlw | Deed 85 Stonebridge PDF.pdf | PDF 374K | Dec 13, 2023 | recorded deed |
| 14IFFwDZpuUhkx68WYsJ6otXM3KjlDcba | Invoice roof.pdf | PDF 265K | Nov 15, 2023 | early roof work |

### Surveys, deeds, title (Drive: top-level + Purchase documents)

| Drive ID | Filename | Modified | Notes |
|---|---|---|---|
| 1T6m4ZVde_2ZWltiV3jWuwv9_ETrb9TwT | 85 Stonebridge official survey.pdf | Mar 6, 2025 | Hingos survey, the doc that triggered this whole task |
| 1lVYnhdsq914SDGOzohd4KBgkNCmBBSlw | Deed 85 Stonebridge PDF.pdf | Dec 13, 2023 | recorded deed |
| 1FnzF1DiIwBx0DJ9Li2T_DZVmzcnxLb_N | property.pdf | Oct 27, 2023 | inside Purchase documents (likely listing/MLS) |
| 1DWQfNOnv7PCK6pIV3IPkTGbtXeEBtkDm | Please_DocuSign_KW_877_-_CIS_-_Consumer_Info.pdf | Sep 3, 2023 | Keller Williams CIS, purchase phase |
| 1EGR7DJPFs5uIB2unRB0Jo0PqZbaafvaa | ATTORNEY REVIEW LETTER.pdf | Sep 8, 2023 | NJ attorney review (3-day) |
| 1MD42pJO7L7L1xP5WKFV5afwF-IVohVvD | Wire Transfer - Jun 1, 2033.pdf | Sep 19, 2023 | down-payment wire (filename date error: should be 2023) |

### Appraisals (purchase + 2025 refinance)

| Drive ID | Filename | Modified | Notes |
|---|---|---|---|
| 1VWERt6HsfqeaZW8BJJAy1PFW9bE13oFg | 2025 85 Stonebridge Appraisal Report.pdf | Aug 27, 2025 | refi-side appraisal |
| 1ioFdhtAZ0mJygT9cPKbwbQ3stOecI3mD | 85 Stonebridge Rd 2025 appraisal.pdf | Sep 10, 2025 | possibly second pass / full pkg |
| 1DQeZauxWMQWivPfRetMsAUXAoKdC0ma5 | 85 Stonebridge property.pdf | Nov 15, 2024 | property summary |

### Mortgage, HELOC, refi (2025 cash-out cycle)

| Drive ID | Filename | Modified | Notes |
|---|---|---|---|
| 11YZuT3tJ3D_bThR5772pAkjiJ2J65dr9 | Mortgage Statement - The Mortgage Box.pdf | Apr 1, 2025 | "The Mortgage Box" = origination broker |
| 1pKBwHOjoqn7vefof1ZnvvmC8DruJLBmT | 08-1098-Mortgage-85Stonebridge-Cenlar-TY2025.pdf | Apr 5 | 1098 from Cenlar (servicer) |
| 1bjOppiSGbCtzS1EZfS0i7NJdWIyoFGQr | 07-1098-Mortgage-85Stonebridge-Shellpoint-TY2025.pdf | Apr 5 | 1098 from Shellpoint (servicer change mid-year) |
| 1FSgjDh92u16SO4IovMbMoKeHmK4ZkKBg | 10-1098-HELOC-85Stonebridge-Cenlar-TY2025.pdf | Apr 5 | HELOC 1098 |
| 16beukSMNeQHIM1euJwttNO6bbkKyhw0U | 85 Stonebridge 1098Statement-01-2024.pdf | Aug 10, 2025 | TY2023 1098 |
| 1Zc-_1fneyhofYNx2pRXBYygPLpO2DNUK | 1098 2025 85 stonebridge Yearly Statement.pdf | Jan 20 | TY2025 yearly summary |
| 1Q3eZP7fOpRCG9xfzl9BxwgSmsMEOiX7O | Statement8312025_copy.pdf | Sep 8, 2025 | 8/31 mortgage statement (refi pkg) |
| 1Q5GIWbPWysT4l0THMTdegAOH_6wy__Wv | Statement7312025_copy.pdf | Sep 8, 2025 | 7/31 mortgage statement |
| 1sjq9izDQwqQ5OGvgv5htojT-_KpQLyVW | Signed Docs.pdf | Oct 23, 2025 | refi closing docs |
| 1H6v9QLf4LY3m6Wq3EqSOF8TbJGJhnzNo | closing costs for 85 Stonebridge.pdf | Apr 6, 2024 | 2023 closing settlement statement |

### Code violations / property issues

| Drive ID | Filename | Modified | Notes |
|---|---|---|---|
| 1wOr6FdWpsSpsjj45kva-dgq19dHBier0 | 85 Stonebridge Road - Bamboo Violation.pdf | May 21, 2025 | Montclair township notice |

### Property tax

| Drive ID | Filename | Modified | Notes |
|---|---|---|---|
| 1NwVh3S324XKyI1ufxTc5AzGTvb0hRaNO | Property Tax 2025 2026.pdf | Aug 10, 2025 | quarterly bills FY2025-26 |

### Insurance (homeowners — Selective)

Search for "Selective insurance" returned only 1 result. **Selective homeowners policy filename not found in Drive** — likely on Alton's Downloads (`85 stonebridge Montclair NJ insurance Oct 2024-Oct2025.pdf` per task brief). Not yet uploaded to Drive.

| 1xww_PVPtgm0c04ldVoRHuUTYHXIs2Vq3 | Verification of Insurance.pdf | Feb 21, 2024 | likely auto, in "Car" folder |

### Earlier 185 Davis property — DISCOVERY

Two unexpected hits suggest a SECOND property:

| Drive ID | Filename | Modified | Notes |
|---|---|---|---|
| 1hOI4KLicv3FBgHhhPgRspBimBaV67Ey- | 09-1098-Mortgage-185Davis-LeaderBank-TY2025.pdf | Apr 5 | **TY2025 1098 still being issued for 185 Davis property — implies still owned or was sold mid-year** |
| 1CNUVp9hwQsBx71Feb9_I3WRLNQtgR_Ho | Aneeta Saxena Work Verification Contact info.docx | May 5, 2021 | filed under "185 Davis #8" folder |

LeaderBank is Boston-area, and "185 Davis #8" suggests a Somerville/Cambridge MA condo (Davis Square). Memory does not currently mention this — flagging for Alton clarification.

---

## B. Solar Inference LLC

### Folder tree (canonical)

```
Solar Inference LLC  (10CMie8ak-sNXpyreBfFpsz-swRKP-e78)  [My Drive root]
├── 2025-Solar-Inference-LLC-Tax-Package  (1ijLYanbvXPWhFcoD8_mJ3I4Jahq72cvk)
│   ├── 01-Entity-Formation         (1gAg-g3SiEV4V2zKx71ydeHg3Qk2w-eDR)
│   ├── 02-Equipment-Receipts       (1_MNqTmL9QQvgKZ34AKBQZF8QXzkjAOic)
│   ├── 03-Solar-Roof               (16yWM8pdkThHomrAzceEHYysEpq6HCnH0)
│   ├── 04-LegalZoom-Receipts       (1-fYEkKG61VOpML77qsnGp9N4GeEJxMfC)
│   ├── 05-Google-Workspace         (1nZu5ScFNu1Ka2qaxMCtqlAD0XnYxejZK)
│   ├── 06-Chase-Statements         (171bLf-MCvuaEbcGqZe1RD39E_y609jmZ)
│   ├── 07-Tax-Filing               (1Xy5Kc1pcb2gGs8JwGWKefRCsLRxLHvcU)
│   └── 08-Expense-Summary          (1R8eGadriH-CEmVfDUfGwE2xV0s-nmNCw)
├── LLC folder                       (1PboD0ckzK8QS6y8I6wxOXQZ1xrLehhBD)
└── Solar Roof                       (1A69oOf0vM2q3bg1sJlUupUAwZBrd8XsH)
    └── Financing and Payments       (1SVjiuq9e9VLPI6fKICNiZ_N1XIaBFZLN)
```

### Entity formation (LLC folder + 01-Entity-Formation)

| Drive ID | Filename | Modified | Size | Notes |
|---|---|---|---|---|
| 1dpxiRwRVjQz9USfiq2ROOsLBtdjk9eJQ | Operating Agreement.pdf | Sep 10, 2025 | 99K | **canonical LLC operating agreement** |
| 1H4q1ZxiSKM6adRtj7_hUwOLqMzBprKon | LLC Articles OR Certificate of Organization.pdf | Sep 10, 2025 | 163K | NJ Articles |
| 1wFvR8fGimbeV7_kUjLwKhzt3sAwDni2h | EIN Confirmation Letter.pdf | Sep 10, 2025 | 18K | IRS CP-575 (EIN per memory: 39-4199284) |
| 1iA1m18_hqtNOS8HleCNuncF4ke1eo_MP | BusinessRegistrationCertificate.pdf | Sep 10, 2025 | 78K | NJ business reg |
| 1NFrCeFUa17UzBiJ7wTA09rmN4a8p1MVk | business depository certificate.pdf | Sep 15, 2025 | 1.4M | bank |
| 1yMZ5v0qb8cF2VRe84CNhRtskZgenJVMF | dept of Treasury appointment as registered agent solar inference llc.pdf | Sep 15, 2025 | 401K | NJ registered agent appointment |
| 1eCYQZwrtwVjFlgN9V_I8P6b4a6g0_q4Q | Essex county trade name form.pdf | Sep 12, 2025 | 329K | DBA county filing |
| 12T6K7eOTCUfBj5Ytygexiptrs5hQRL8S | credit card.pdf | Oct 3, 2025 | 1.7M | business credit card application/agreement |
| 1PiXyZVjq75MS8OJSbDR_6Hp2d-iXrZEa | Sep 5 at 4-12 PM.m4a | Sep 6, 2025 | audio | likely LegalZoom or CPA call recording |
| (duplicates of LLC Articles, EIN, business depository: IDs 1z9_, 1noqhupt4..., 1Dk7CMmI..., 1scifJCj..., 1gd0mg8..., 1LYpb7r..., 1SJHN-..., 19UoeA_..., 1Tz9npI..., 1cWnIyCr...) |

### 02-Equipment-Receipts (depreciable assets)

| Drive ID | Filename | Size | Notes |
|---|---|---|---|
| 1qe9o31xAZ3S0R750C8dvKBTTowaqPd55 | Uplift-Desk-Receipt.pdf | 728K | desk for office space |
| 1O9_zJVmxG9n9kJ1_w4uYoEqdKOJRzlQe | Computer parts bill.pdf | 1.1M | non-GPU computer parts |
| 1JDNUqzk8uxoIJe3y3IxmANDPkVF2PrN6 | Order Details 5090.pdf | 73K | RTX 5090 GPU receipt (vast.ai inference asset) |
| 1hjTvTdU3oGwerhZMFLPVXz1qCk2Ne-1G | _archive | folder | superseded receipts |

### 03-Solar-Roof (the Tesla solar roof + Lucent CPA bills for it)

| Drive ID | Filename | Size | Notes |
|---|---|---|---|
| 1YgwupCsVOZBCmQKFl3yBTxwZoEEtBpG1 | ES - Level 2-3 Agreement.pdf | 1.2M | **Tesla Energy Solar Roof signed contract** |
| 1hBT9IYjpYo751wbHLOFQbecGNgI6tcYi | Lucent solar project overview.pdf | 268K | Lucent (CPA firm) memo on solar roof tax treatment |
| 1zWwvx-wpYkostO1krgiZtJmAWpCaU1o8 | Lucent-Invoice-2025-258.pdf | 31K | Lucent invoice |
| 1k6M4AqLt5_GAJloQeDK47-Qd6v0Bp8Iz | Lucent-Sartor-Invoice-2025-258.pdf | 32K | Lucent invoice (renamed copy) |
| 1AObo6iUFjvHMwFviF4cFgEKFk6z9uLDP | Lucent-Receipt-2025-258.pdf | 42K | Lucent receipt |

Tesla Solar Roof proposals (pre-contract, Aug 2025, shared by Tesla rep "Gems Atabelo"):

| Drive ID | Filename | Notes |
|---|---|---|
| 1FqCscoQcBxIU9y3kH8--W5pTSHlNBNo- | Emmett Sartor (Meter 303548491) TSR Summary proposal 0814 2025.pdf | shared by Tesla |
| 1Okp4MHYLi65fwXjDqWr1E4bD4uepVemU | Emmett Sartor (Meter 302726203) TSR Summary proposal 0814 2025.pdf | shared by Tesla |
| 1jVSH7tBz0eANLXJSq7zsuhHOaea1p7-F | Emmett Sartor (Meter 303548491) Solar Energy Summary Proposal 0814 2025.pdf | shared by Tesla |
| 1QPUWWE77g_2w3axW9W1ozkB-yJwNRx53 | Emmett Sartor (Meter 302726203) Solar Energy Summary Proposal 0814 2025.pdf | shared by Tesla |
| 1oxlM8RftM03ryOIxSLQMs7SAwUXqwOY9 | Emmett Sartor (Meter 302726203) TSR Summary proposal 0820 2025 (2).pdf | revised Aug 20 |
| 14Xy6-zRljsHn5FGoiLTxuLTzZGfHJlr0 | Sartor TSR.pdf | clean copy of final TSR |
| 1SAg4FiGoA13GuW69CCspBg8GJHRu997A | Lucent solar project overview.pdf (different copy) | |

**Two utility meter numbers (302726203, 303548491)** — possibly main panel + accessory dwelling/garage. Worth clarifying with Alton.

### 06-Chase-Statements

7 visible (only fall 2025 captured here; full year likely present):
- 1oPZ-... 20251128-statements-7691-.pdf (98K)
- 1V-h9... 20251215-statements-7738-.pdf (209K)
- 1PSwpT... 20251115-statements-7738-.pdf (208K)
- 1O79j... 20251031-statements-7691-.pdf (105K)
- 1LsAdn... 20251015-statements-7738-.pdf (207K)
- 136Js... 20250930-statements-7691-.pdf (86K)
- 11h8c... 20251231-statements-7691-.pdf (94K)

Two account suffixes (-7691- and -7738-): likely Solar Inference business checking + a second account.

### 07-Tax-Filing (TY2025 LLC return prep)

| Drive ID | Filename | Notes |
|---|---|---|
| 1In8BBHwcdNhLF2VmWvbojRZ21e8sPun3 | Solar_Inference_LLC_Workbook.xlsx | master workbook |
| 1fKi_7SG4uW5ESCG_mGOhLC_jUL3vg_Z3 | Solar_Inference_LLC_Workbook.xlsx | duplicate |
| 1kS1vmWbxSlkT3bA1czbEQ1qn0m8Qp5B1 | Solar_Inference_LLC_Business_Summary.md | summary |
| 1U0TvOgATWv2q-UXmHuxRr_du6tcDJkHk | Solar_Inference_LLC_Business_Summary.md | duplicate |
| 1sIkRl2qC9CGr8gLc2Qvpu_psA5ezsN4h | Form_7004_Filled_REVIEW_BEFORE_FILING.pdf | LLC tax extension |
| 1-E5W495kaw2rKMNUTCZIx6Rdi-x5uKmA | Form_7004_Filled_REVIEW_BEFORE_FILING.pdf | duplicate |
| 1Bo3d9G2QjY7mtRpUNTFIIf07uMGjI6u7 | _DRAFT-Email-to-Jonathan-v2.html | CPA correspondence draft |
| 1sCUcoNmgaidCsjmCPAWnbtBpKgZYM3nm | _DRAFT-Email-to-Jonathan-v2.md | same |

### 08-Expense-Summary

| Drive ID | Filename |
|---|---|
| 1lB7lqFpJtGGAXmfzi8So9M0wTWkvZHGs | Solar-Inference-LLC-2025-Expense-Ledger.xlsx |
| 19sf0A5ONqTvrxD-XX9lW2ddTRC7von76 | duplicate |

### Solar Roof > Financing and Payments (Climate First Bank loan pkg, Oct 24 2025)

| Drive ID | Filename | Size |
|---|---|---|
| 1jbvB4sa129pAvnX9hu2ask9Q9eP19XYy | Invoice 2025-258.pdf | 31K |
| 1Z8O2FLTwkDOGM-8JPUkku7ems2xzwUlp | Receipt 2025-258.pdf | 42K |
| 1w7tLNTIZxGN_SvsNO6AaV4c2qSP_cgEb | prequalification-letter-...pdf | 135K (Climate First prequalification) |
| 1XtmylZtrR-qy7GYfznEsaQRHZ8G7zu3w | Privacy Policy.pdf | 59K (Climate First) |
| 1Sqmm-kJfMyfBtNUXhOowTau_POAeSHOE | Terms and Conditions.pdf | 473K (Climate First) |
| 157UyuxGbubvFWl6oaOOA-Refi5GoyYW2 | eSign Agreement.pdf | 88K (Climate First) |

**The actual $219K loan disbursement statement is NOT in this folder** — likely arrives later or lives in Gmail. Worth checking inbox for Climate First emails.

---

## C. Sante Total nonprofit (501c3)

### Folder anchors

| Drive ID | Folder | Owner | Notes |
|---|---|---|---|
| 0B83Z8_k8RKzkZTkxYmFlMDEtMTg0My00YjA5LWE1OGItMzAxZjYzMmI0YmZi | Sante Total | Alton (My Drive) | top-level |
| 0B83Z8_k8RKzkdnZRLUQ0d1MtX1k | Sante Total 501c3 | Alton | inside Sante Total |
| 1qadSJtlM3XMEpgrbmRylCcSFdy2i5JaI | Sante Total | shared by santetotal.healthcare@gmail.com | nonprofit's own GDrive |
| 0B83Z8_k8RKzkX0F2Ymt4SXV3Nkk | Sante Total Founding Documents | Alton | inside 501c3 folder |
| 0B83Z8_k8RKzkTld6aE5fY1VTdFk | 1023 Sante Total | Alton | original 501(c)(3) IRS application |
| 1jfanKhDTkmp6WN5V76Gg7CRyQzFSE0dh | Photo Archive | shared by santetotal | |
| 1RcyszvuYYYVGIpAoEKR3OZzcUrD8mQYz | Sante Total Kickball Tournament | shared by tffschmidt | Spring 2022 fundraiser |
| 1bXMVNe2N3yI2As58qhCPZssG8IPEttha | 2019 January Trip | photo archive | |
| 1sZhaOF054bP6Ub6EW6z5haC4GuxDzufG | 2018 May Trip | photo archive | |
| 1gZlp-KaSoTNTMFHiPUky1U9v1TUejex0 | 2018 September Trip | photo archive | |
| 1ZQDd5mHUlNRc0y-gaAGxEe0c--EYnTBO | 2016 January Trip | photo archive | |

### 990 filings (e-Postcard / 990-N)

| Drive ID | Filename | Modified | Year covered |
|---|---|---|---|
| 15FiR4uBpnFZ73empdm2rFs7tu3sji3M4 | Sante Total 990 e-Postcard View 2025.pdf | Apr 7, 2025 | TY2024 990-N |
| 14fsSMauL8J02FtWk0oD8bci2AQxzNPtY | 2024 Sante total e-Postcard View.pdf | Apr 20, 2025 | TY2023 990-N |
| 1mnjXHQTCentvvKI1X03qlMAcg_WCCMBd | SANTE TOTAL_2018_990E_TaxReturn_US.pdf | Nov 20, 2019 | TY2018 990-EZ |
| 1SorHGhT1zTggLx4A7vfsUXEl3NF0JrI3 | Form990Package.pdf | Jun 15, 2020 | TY2019 990 |

### Financial / operational

| Drive ID | Filename | Modified | Owner |
|---|---|---|---|
| 1FCF-w_NhTig4ed-1loAZFbZm2SXFuOKIjNMdq7y09pM | Sante Total Financials and Donor Lists Google version | Apr 17, 2024 | Alton (GSheet) |
| 1CwmwAHZesuSB37I23_iWBNrWFvKdmyf_ | 2026 Sante Total Approved spending and payments.xlsx | Jan 14, 2026 | Barbara Weis (shared) |
| 1Bh-ywWL_GcGQr0OsQaqbxhIFOpqgACnCxMGOr-1wDVI | SanteTotal_Listserv | Dec 18, 2025 | Smith Alison A (shared) |
| 1p5vGOo29IKy9iukENjm7nXxf7Vqbcnk6 | Sante Total Projects.docx | Apr 29, 2021 | tffschmidt (shared) |
| 1m2_PK-D_zVMMxDtosfTaa_hPfIFLCh1zgMtJV0ZdCVk | Sante Total Meeting Sign In 1/25 | Jan 25, 2022 | tffschmidt |
| 0B83Z8_k8RKzkV3FXVTJvbzQxZ19HVDF2eDZ5SFF6TThGQmk0 | sante total data.xlsx | Apr 25, 2018 | Alton |

### IRS audit / proposed-changes

| Drive ID | Filename | Modified | Notes |
|---|---|---|---|
| 12_q4AF4X2vRnEtzTW98_saghYJLHU4ek | 2018 IRS proposed changes for Aneeta Saxena and Emmett Sartor.pdf | Mar 23, 2020 | personal CP2000-style notice (NOT Sante Total) |

**No IRS penalty letter directly findable for Sante Total.** Memory notes a Sante Total IRS penalty issue — that correspondence is likely in Gmail or in the santetotal.healthcare@gmail.com Drive (which Alton has shared-access to but is not the owner of).

---

## D. AstraZeneca / employment (REFERENCE ONLY — not Solar Inference hours)

### Folder + W-2s

| Drive ID | Filename | Modified | Notes |
|---|---|---|---|
| 14NejTEdzlFRjGNB2OTwPtfAoaNHnpFLi | AstraZeneca | folder | Apr 22, 2022 | Work folder |
| 1JY5rC0b5j1bv5u0d5YaFYgqoWB75xdEF | W2 | folder | Mar 23, 2023 | inside 2022 taxes |
| 1jMEWg-2IRoS_8RbXgVAgKlo8EC59R3Ak | 01-W2-Alton-AstraZeneca-TY2025.pdf | Apr 5 | current AZ W-2 |
| 1miuYQ3N8DgB8u6EUzJDA-J5qbcKbjIRt | 2024 Emmett Sartor W2.pdf | Aug 10, 2025 | TY2024 |
| 1wyrVS-q7_YAvq-J1k70cAfsk8-wxG28I | W-2 2023 Emmett Sartor AstraZeneca TaxForms.pdf | Aug 10, 2025 | TY2023 |
| 1yMcKKE_yssSS3Ja7kgyxYtdZNS0tRMro | 2021 Emmett Sartor Biogen W2 | Mar 15, 2022 | pre-AZ (Biogen) |
| 1JwXN-LaPRARqsxRJAzuHI8DYdsYBulHA | 2020 Emmett Sartor Biogen w2.pdf | Mar 23, 2021 | Biogen |
| 1S2i7b3ED2bu8hZg9KVhNgk7HE3dDYSvZ | 02a-W2-Aneeta-Neurvati-TY2025.pdf | Apr 6 | Aneeta @ Neurvati (current) |
| 1zA2Z--eyz_SUh292kYme8WY944OfFCMy | 02-W2-Aneeta-Biogen-TY2025.pdf | Apr 5 | Aneeta @ Biogen partial-year |
| 15YS2IEJhD-mwPQjJN9yiZ6r7fXKySWDP | 2024 Aneeta Saxena W2.pdf | Aug 10, 2025 | Aneeta TY2024 |
| 1M1N4OxPbEQbK1bndDTA4zNLkyuR7qjdC | 2025 w2 biogen Aneeta saxena.pdf | Jan 16 | TY2025 partial Biogen |
| 1PYswIWBll4hZqXTKlhw_piIs-Fx-Ptge | Aneeta Saxena MGH W-2 (2).pdf | Aug 10, 2025 | Aneeta @ MGH (Mass General) |
| 1DNWRNlkrmL1WYYGOKTgX-D57mAlUV5-A | Aneeta Saxena MGH W-2.pdf | Mar 26, 2024 | duplicate |

### AZ-related contracts / health insurance

| Drive ID | Filename | Modified |
|---|---|---|
| 15T8TEGWYT0SgAkoOoGrIoVujwJIRjtmQ | Health Insurance Card - AstraZeneca.pdf | Sep 16, 2025 |
| 1NWJNqBtOb1qIsfhKumd4XBYtox95hAbo | Non-Disclosure Agreement with AstraZeneca Pharmaceuticals LP.pdf | Aug 8, 2025 (from "AI" folder — likely covers AI/research collaboration) |

### CV / cover letters (related to AZ AI role)

| Drive ID | Filename | Modified |
|---|---|---|
| 197qS_bzaD6s4vCSo-OQQgWjWvgJFCHsz | NY Medical Director, AI innovation and validation, GPS.docx | Oct 15, 2025 |
| 1gx0YUz0ECYOme5HPA0XuHZXeLxyUg_3w | Anthropic paragraphs.docx | Aug 23, 2025 |

---

## E. Family / household

### Birth certificates

| Drive ID | Filename | Modified |
|---|---|---|
| 11gTirvo1iIpT1tdm-JZkLAdUV9kkMULU | Vayu Birth Certificate.pdf | Mar 20, 2020 |
| 1Bk4M4-YOV-ehM0zwX3jyCuTYHlDuakxE | Vishala Birth Certificate.pdf | Apr 24, 2020 |
| 1wJvAV80-PuhaUFZXNC_KeNmSb45Qh83N | Vishala Patricia Sartor Birth certificate.pdf | Feb 15, 2022 |
| 1Fk4x8JqKaAXqxigyJ1uQ7T1LpAIGFfdX | Vasu Dev Sartor Birth certificate.pdf | Sep 5, 2022 |
| 11iS3RGnKc_dsTZvlRXZmlW00lsBvRUBk | Vasu Record of Birth | Jan 15, 2022 |
| 0B83Z8_k8RKzkS3ZfeVRhb0ZtMFk | Vayu Birth Certificate (older copy).pdf | Jan 3, 2016 (this is BEFORE Vayu's birth — possibly a duplicate ID/scan from a different doc, or test) |

### Passports (Passport Folder, 1STcMoh9RYkRgJUcp553J2176TxuV4ITk)

| Drive ID | Filename | Modified |
|---|---|---|
| 11Nw11whoOtI441gtz9dKwJH0NoSMDPDX | Passport - Emmett Alton Sartor.pdf | Sep 12, 2024 |
| 11VlRTziK_cta0C8n_mgii5VMdwoPoPeQ | Passport - Aneeta Rani Saxena.pdf | Sep 12, 2024 |
| 125Z7Jdgv3yrqklsCdy1ft6PEBK_tx_-k | Passport - Vayu Sax Sartor.pdf | Sep 12, 2024 |
| 127r8T1acZ62YndvMbFMaTO8jAvXL_Krz | Passport - Vishala Patricia Sartor.pdf | Sep 12, 2024 |
| 12Oo15NS8kOJXX-Go1uwAVNVkayOgUSFF | Passport - Vasu Dev Sartor.pdf | Sep 12, 2024 |
| 11GCkT12T5-wkbMGXmJaqys-1nAwU0Hiz | Archive (folder) | Sep 12, 2024 (older passports) |
| 1FSS5kqWZXyOOQXSalmgtZE-9YzxENgnD | InterimLicense-WX202515100000932_copy.pdf | May 31, 2025 (interim NJ driver license?) |

### Health forms

| Drive ID | Filename | Modified |
|---|---|---|
| 1D0ml1U2q5jSgfszmom2SXjCwxNzeJ8ed | Vayu health form.pdf | Jan 2, 2024 |
| 1Dol0HPOL4peoKGY0pI7rkxZPvPGdZKyx | Vasu health form.pdf | Jan 2, 2024 |
| 1D9WtuFWL0v3zZRwG7VkzWFBVsLIDKZ6J | Vishala Sartor health form.pdf | Jan 2, 2024 |
| 1Y6Vh_0283NX2I9FLGs5j5mYwMGRlAVof | ADA medical verification form- MetLife.pdf | May 23, 2024 (Aneeta MetLife) |
| 1kWqgdUqLZwNZj8FQtb1-gxnjLUJ7YQVS | medical verification form - MetLife.pdf | Dec 13, 2024 |

### School (MKA — Montclair Kimberley Academy)

| Drive ID | Filename | Modified | Owner |
|---|---|---|---|
| 1tLmGaSjYjW1NDQ9nTbKxcd7pv6Xxj8GV | MKA transcript request form Vayu Sartor.pdf | Jan 10, 2025 | Alton |
| 1tReFjA1UWN-Rh7TXwkQOaVfeH1QTp80H | MKA transcript request form Vishala Sartor.pdf | Jan 10, 2025 | Alton |
| 1tQvoDLe2Ync94j3uyziyjgZahF532-3X | Montclair public School release of records Vayu Sartor.pdf | Jan 10, 2025 | Alton (transition from MPS to MKA) |
| 1tTTHmR1qLN03hIQvhsxU-hrGDba-8ThG | Montclair public schools release of records Vishala Sartor.pdf | Jan 10, 2025 | Alton |
| 1z8n-e34j4H8uHcexymq9JPxVfXxUICQm | Vishala School (folder) | Feb 15, 2022 | Alton |
| 1MMX8eM-euaeGB8ab-4F3AunOBmmxbvJQ | Signed Forms Vishala Sartor (folder) | Mar 21, 2022 | Alton |
| 1vlAk06u1JeOg_Q7ruEbtd74StTMa8CU9 | Vishala Sartor (folder) | Dec 9, 2025 | shared by jenn.dozier@gmail.com (school staff) |
| 1qqBln1U76KrUxlnBCfPTqE0kUtw-K5aNpTxcxnlpBQA | MKA Arts & Athletics Virtual Information Session 1/14/26 | Jan 12, 2026 | Aly Waldman |
| 1kF0LppRjcdP0ebtNJgzVZagISToQMHhZvgF1in5xAYs | Vayu Sartor - 2026 T2 Student Presentation Template | Mar 3, 2026 | Roshni Shah |
| 1ktInnVyzPqEtTxSA4uKn39ErM-ZdD97DVln5g8Z94Zk | Shah 2025 Letter to Parents | Aug 26, 2025 | MKA shared drive |
| 1gulhZkRoMO6vN-EYDO-VDEbiVcTD68BY6lbAF6gcBoY | 2025 4th Grade Orientation Letter | Aug 20, 2025 | sisrael@mka.org |
| 1XbNVKFySJ4xKrtLIrBBCIP8f0LeHvTTDUZLDNiljcNk | 4th and 5th Camp Mason Letter | Sep 4, 2025 | sisrael@mka.org |
| 1R-WJXhopRJEBUFpmHSdGef8mZ_NbsQld7XOpzofxhvM | 3V September 2025 Contact Sign Ups | Sep 22, 2025 | dvespucci@mka.org |

### Other family

| Drive ID | Filename | Modified |
|---|---|---|
| 1MCQdSOeUBgeyUWVGGS91Wj2AThPZw03X | goddard school handbook signature page.pdf | Jan 24, 2024 (Vasu's preschool) |
| 1eyYTFBPrjNxQ7rM2r6TTfrurNTp_sKlvaLInREvedjw | Saxena-Sartor Family Document | May 13, 2021 | Aneeta |
| 162qceXLZx4IXye9U9q-LJjD6Qp12sNIVmUkY7x73Y7E | Household Maintenance | Jan 17, 2022 | Aneeta |
| 13aNR1pxwgA6IR_AhIag5XzRhCNJ0Yp-roZR7g_ly2_M | Important Numbers | Feb 7, 2022 | Aneeta |
| 11gwqbNOEykXe0hKp37ylo_6O8gLkEl-M | lease agreement.pdf | Mar 20, 2020 (pre-Stonebridge rental) |

### Family-related photos / personal

| 1iN3jsWl63zq9uvueYah4Au0T7dtdsixc | Vishala Family photo.jpg | Feb 26, 2026 | Important Photos |

**No Disney trip docs in Drive yet.** Disney July 2026 trip is in `projects/disney-july-2026/` per memory; planning materials haven't migrated to Drive.

---

## F. Taxes / CPA

### Personal 1040s by year (chronological)

| Drive ID | TY | Filename | Filed |
|---|---|---|---|
| 0B83Z8_k8RKzkQUstYldzSE40cWs | 2009 | EmmettASartor2009TaxReturn.pdf | Sep 30, 2010 |
| 0B83Z8_k8RKzkSFJnZUFLcVp6dGs | 2011 | TaxReturn (1).pdf | Apr 16, 2012 |
| 0B83Z8_k8RKzkbV91YjRZSy1vUUU | 2011 | TaxReturn 2011.pdf | Apr 16, 2012 |
| 0B83Z8_k8RKzkQmRFSXItUWVGU2c | 2012 | TaxReturn2012.pdf | Apr 30, 2013 |
| 16QBdytiNvVlhIIihd3SDARjJAAuJ5ULZ | 2022 | signed 2023 tax forms.pdf | Apr 14, 2023 (filed for TY2022) |
| 1BwiNBWifEKTNo2t8fZTDjDCn88MsTE12 | 2019 | Form 1040 signed 2019.pdf | Jun 15, 2020 |
| 1yt4MyRFUFmzA8G8Jcc2QejT0qm5weS54 | 2021 | 2021 1040 signed.pdf | Apr 13, 2022 |
| 1zH0b1Fwd9a31iBZRgsE-yO8bAR5Tysp4 | 2021 | 2021 tax prep signed.pdf | Apr 13, 2022 |
| 1yp22AlIuVUjO1qAeSLAGnwgAqVQKOAgU | 2021 | 2021 Form M8453 signed.pdf | Apr 13, 2022 (MA state e-file auth — pre-NJ) |
| 1XLXo7biwhQnBPeM0RevCwc8aj8gAaid3 | 2024 | 2024_EMMETT SARTOR AND ANEETA SAXENA_ClientCopy_Individual.pdf | Aug 12, 2025 (TY2024 client copy from Lucent) |

Year-folders observed: "2009", "2011 taxes Sartor", "2012 Taxes", "2014 Sartor-Saxena Taxes", "2016 Taxes", "2018", "2019", "2020 Sartor - Saxena Tax Folder", "2021 taxes", "2022 taxes", "2023", "2024 taxes", "2025", "2025-Tax-Documents".

### EPD / Enterprise Products K-1s (long-running MLP investment)

| Drive ID | Year | Filename |
|---|---|---|
| 0B83Z8_k8RKzkYjRXSFJtc2lZbmc | 2011 | ETP K-1.pdf |
| 0B83Z8_k8RKzkZzlwMmk0T0Z3U0E | 2011 | EPD K-1.pdf |
| 0B83Z8_k8RKzkRVppcmRSTDRxMlE | 2012 | EPD K1 2012.pdf |
| 0B83Z8_k8RKzkbENrZXlIYUtIaEE | 2014 | 2014 K-1 Emmett Sartor EPD.pdf |
| 0B83Z8_k8RKzkWV85aDlTRGtkcDg | 2016 | K1 EPD 2016.pdf |
| 18SQHlarSZY_4JJCAHY-UJf9dv6pcZjaG | 2017 | [EPD] 2017 Tax Package 1604 EMMETT SARTOR.pdf |
| 1rY91TNsw3M3UMGKxZKmwU6ba0IqnQx5G | 2018 | [EPD] 2018 Tax Package 1604 EMMETT ALTON SARTOR.pdf |
| 1VHtC9x4IfycU9KWKXIBVj6K04P3xNKmh | 2019 | (EPD) 2019 Tax Package 1604 EMMETT SARTOR.pdf |
| 1m5F4OcPb3yCYvXnThSicUHKotzxsl4cE | 2025 | 06-K1-EPD-MLP-Aneeta-TY2025.pdf |

### TY2025 supporting tax docs (in 2025-Tax-Documents folder)

The structured tax-prep folder for 2025 contains numbered docs (01- through 20-+):
- 01-W2-Alton-AstraZeneca-TY2025
- 02-W2-Aneeta-Biogen-TY2025
- 02a-W2-Aneeta-Neurvati-TY2025
- 05-1099R-Fidelity-AZ401K-74304-TY2025 (1gnZrKvc...) — Alton AZ 401k
- 06-K1-EPD-MLP-Aneeta-TY2025 (1m5F4OcP...)
- 07-1098-Mortgage-85Stonebridge-Shellpoint-TY2025
- 08-1098-Mortgage-85Stonebridge-Cenlar-TY2025
- 09-1098-Mortgage-185Davis-LeaderBank-TY2025 (1hOI4KLi...) — **second property**
- 10-1098-HELOC-85Stonebridge-Cenlar-TY2025
- 11-1098E-StudentLoan-Earnest-TY2025
- 14-1099R-Schwab-TY2025
- 15-1099R-Fidelity-Biogen401K-Aneeta-TY2025
- 16-1099R-Fidelity-TraditionalIRA-Aneeta-TY2025
- 17-1099-Fidelity-UTMA[Vayu]-TY2025
- 18-1099-Fidelity-UTMA[Vishala]-TY2025
- 19-1099-Fidelity-UTMA[Vasu]-TY2025
- 20-1099-Fidelity-Individual-1640-TY2025

### Fidelity / Schwab brokerage 1099s (multi-year)

| 1bCnmuzJqAsJg8TyIEKuAU5uqGiBommIQ | 2020 Aneeta Saxena Ameritrade 1099.pdf |
| 1HIJvzggLGuGoRU0pn7NY7hGobFFcJDJn | 2021 Aneeta Saxena Ameritrade 1099.pdf |
| 1Ahp17yJC23hMzCOEP-cRksvELXDYKrnl | Aneeta Saxena Ameritrade 1099 (1).pdf (TY2023) |
| 1DSH5HNmLncHN2ZD6X8M6yBNK-xw11BJK | Aneeta Saxena Ameritrade 1099.pdf |
| 18oVAHuvaE09HGmJAKjHNTih_AHETkudk | 2023-Individual-4246-Consolidated-Form-1099 Aneeta Saxena.pdf |

### Older (<2017) — likely irrelevant for current memory

| 0B83Z8_k8RKzkdGRfQ3VrZVVFc2M | folder: Aneeta Saxena 2015 Taxes | Apr 13, 2016 |
| 0B-zdsTjVJptkanJJMmllbzNIeW8 | Louisiana License verification.pdf | Sep 21, 2015 (Aneeta MD license history) |
| 1izB1fXQ2rgD9GTyXCYKkHjy9LGr3-Hi5 | Aneeta Saxena Medical license.pdf | Mar 6, 2018 |

---

## Proposed memory file moves / additions

### Update existing files

1. **`sartor/memory/business/solar-inference.md`** (or `business/solar-inference-llc.md` — locate canonical name) — add a "Drive references" section linking:
   - Operating Agreement: `drive.google.com/file/d/1dpxiRwRVjQz9USfiq2ROOsLBtdjk9eJQ/view`
   - EIN Confirmation Letter: `1wFvR8fGimbeV7_kUjLwKhzt3sAwDni2h`
   - Tesla Solar Roof signed agreement: `1YgwupCsVOZBCmQKFl3yBTxwZoEEtBpG1`
   - 2025-Solar-Inference-LLC-Tax-Package folder root: `1ijLYanbvXPWhFcoD8_mJ3I4Jahq72cvk`
   - Climate First financing pkg folder: `1SVjiuq9e9VLPI6fKICNiZ_N1XIaBFZLN`

2. **`sartor/memory/TAXES.md`** — add a "Year-folder map" subsection cross-referencing the chronological 1040 list and the structured 2025-Tax-Documents folder. Note that TY2025 will be the first year with a 1065 (Solar Inference LLC).

3. **`sartor/memory/business/sante-total.md`** (if exists; otherwise create a stub) — add Drive references for:
   - 990 filings (2018, 2019, TY2023 e-Postcard, TY2024 e-Postcard)
   - 1023 application folder: `0B83Z8_k8RKzkTld6aE5fY1VTdFk`
   - Donor list / financials GSheet: `1FCF-w_NhTig4ed-1loAZFbZm2SXFuOKIjNMdq7y09pM`

4. **`sartor/memory/FAMILY.md`** — add Passport Folder reference (`1STcMoh9RYkRgJUcp553J2176TxuV4ITk`) and birth certificate canonical IDs.

### New index files to create

1. **`sartor/memory/reference/property/85-stonebridge-INDEX.md`** — dedicated property index. Pulls from the Property section above. Categories: deed/title, surveys, mortgage history (purchase 2023 → refi 2025), insurance, code violations, property tax, maintenance. Cross-links the Bamboo Violation as an open-todo.

2. **`sartor/memory/reference/185-davis-property.md`** — NEW — flag the Davis property finding. Memory currently has no record of this. Could be Aneeta's pre-marital property or a still-owned MA condo. **Open question for Alton.**

3. **`sartor/memory/business/solar-inference-drive-tree.md`** — paste the Solar Inference LLC folder tree as a stable reference.

### Underlying PDF download recommendation

**Do not download into the repo.** For Alton's offline-cache need (e.g., when traveling, when Drive is offline), recommend a non-tracked mirror at `C:\Users\alto8\Sartor-files\` (sibling to `Sartor-claude-network\`) using `rclone` against `gdrive:` remote. This keeps Drive as canonical and gives offline copies without polluting the git repo. The `.gitignore` already excludes anything outside `sartor/`.

Highest-value targets for offline mirroring:
- 85 Stonebridge full folder (~30 MB)
- Solar Inference LLC tree (~40 MB)
- Passport Folder (~3.5 MB)
- All TY2025 tax docs (~5-10 MB)
- Sante Total 990 filings (~2 MB)

---

## Open questions for Alton

1. **185 Davis property** — TY2025 1098 from LeaderBank for "185 Davis" was found. Memory doesn't currently track this. Is this a still-owned MA condo, Aneeta's pre-marital property, or something else? Should it be added to the memory tree?

2. **Two utility meter numbers (302726203, 303548491)** — Tesla Solar Roof proposals quoted both. Are these (a) main panel + accessory dwelling, (b) a misread by Tesla, or (c) two separate solar systems being installed?

3. **Selective insurance (homeowners) policy** — exists on local Downloads (`85 stonebridge Montclair NJ insurance Oct 2024-Oct2025.pdf`) but NOT yet uploaded to Drive. Should it be uploaded? If yes, into the 85 Stonebridge folder structure or the existing "Car" insurance folder?

4. **Climate First Bank loan disbursement** — the prequalification + boilerplate Terms/Conditions are in Drive (Oct 24, 2025), but the actual $219K disbursement statement is not. Likely in Gmail. Want me to search Gmail for the Climate First disbursement letter and add the reference?

5. **Sante Total IRS penalty correspondence** — memory mentions an IRS penalty issue but Drive search didn't surface a penalty letter. Likely lives in either Gmail or in the santetotal.healthcare@gmail.com Drive (which Alton has shared access to but isn't the owner of). Where do you want this referenced from?

6. **Hingos surveyor** — surveyor's name appears in PDF content of `85 Stonebridge official survey.pdf` but NOT as a Drive filename anywhere. Search by content didn't surface anything. Surveyor's invoice/correspondence may be in email, not Drive.

7. **MKA transcripts (Jan 10, 2025)** — both kids had MKA transcript request forms AND Montclair public school release-of-records forms filed on the same day. This suggests a transition between schools. From Montclair Public to MKA, or the other way? Worth confirming for school-tracking memory.

8. **Privacy items flagged (do NOT auto-mirror without confirmation):**
   - Passport scans (all 5 family members) — currently in Drive only. NEVER post to anything external; if mirrored locally, store in encrypted volume.
   - Aneeta MGH W-2s — contain SSN; treat as restricted.
   - UTMA account numbers (5390 Vayu / 5392 Vishala / 5396 Vasu) — visible in 1099 filenames. Memory currently doesn't store these; recommend keeping out of any committed file.
   - 2018 IRS proposed-changes letter — contains tax-detail PII for both Aneeta and Emmett. Reference the existence only; do not extract content.

9. **Search limitations** — Drive's UI caps at ~20 results per query and ranks by relevance. For comprehensive enumeration of (e.g.) all 1099s across all years, would need to either (a) wait until gdrive MCP refreshes (Alton re-auths) and use the API directly, or (b) manually click "Show more" / paginate per query. Several follow-up queries deferred for OAuth refresh:
   - All "1099" hits across history (current 20-cap missed pre-2020 docs)
   - All "Schedule C" hits (none surfaced — probably don't exist; first year for SI is 2025-1065)
   - All "Anthropic" / "Claude" hits (memory mentions Anthropic paragraphs draft Aug 2025)
   - All "estimated tax payment" hits

---

## Backfill priorities (rank-ordered)

1. **Solar Inference Operating Agreement (`1dpxiRwRVjQz9USfiq2ROOsLBtdjk9eJQ`)** — read content, summarize key terms (member %, capital contribution, distribution waterfall) into `business/solar-inference-llc.md`. Highest leverage because it governs every downstream tax/distribution decision.

2. **Tesla Solar Roof signed contract (`1YgwupCsVOZBCmQKFl3yBTxwZoEEtBpG1`, 1.2 MB)** — cost-basis-defining doc. Memory says ~$438K signed value (per BUSINESS.md reconciliation 2026-04-19); confirm against the actual contract.

3. **TY2024 1040 client copy (`1XLXo7biwhQnBPeM0RevCwc8aj8gAaid3`)** — extract AGI, total income, effective rate, schedules used. Establishes baseline for TY2025 estimated-tax calculations.

4. **2025 cash-out refi closing docs (`1sjq9izDQwqQ5OGvgv5htojT-_KpQLyVW`)** — confirm new loan amount, interest rate, who's the new servicer, points paid. Needed for TY2025 Schedule A interest deduction.

5. **Sante Total Operating financials GSheet (`1FCF-w_NhTig4ed-1loAZFbZm2SXFuOKIjNMdq7y09pM`)** — current donor list and bank balances. Needed for next 990-N filing and for Treasurer reporting.

6. **Solar Inference Workbook xlsx (`1In8BBHwcdNhLF2VmWvbojRZ21e8sPun3`)** — should hold the Q4 2025 P&L draft used to populate the 1065. Verify it accounts for the Tesla solar roof cost basis correctly per the 2026-04-19 reconciliation.
