---
type: matter
matter: climate-first-loan-llc-transfer
status: open
risk: medium
priority: p1
opened: 2026-05-08
updated: 2026-06-09
last_action: 2026-06-09
deadline: 2026-07-04
authority: [IRC-163d, IRC-163j, IRC-162, Reg-1.163-8T]
related: [reference_solar_project, solar-itc-48-vs-25d, BUSINESS, TAXES]
---

# Matter: Climate First Loan deductibility post-LLC transfer

## Issue

If the Tesla Solar Roof asset transfers to Solar Inference LLC (per [[solar-itc-48-vs-25d]] matter) but the Climate First Bank Clean Energy Loan stays in personal joint name, what is the deductibility regime for the loan interest — §163(d) investment interest, §163(j) business interest at LLC level, or §162 ordinary business expense if assumed by LLC?

## Facts

- Loan amount: $438,829, joint personal name (Alton + Aneeta), funded Jan 20, 2026.
- APR options: 8.281% (366 mo) / 8.145% (246 mo) / 8.656% (126 mo) per prequal.
- Lender: Climate First Bank, St. Petersburg FL. Erin Gannon, erin.gannon@climatefirstbank.com.
- Prequal letter explicitly contemplates contract amendments and re-underwrite.
- Solar property currently in personal name; transfer to LLC pending decision.

## Authority

- **IRC §163(d)**: Investment interest deductible only against net investment income; excess carries forward.
- **IRC §163(j)**: Business interest expense limitation (30% of ATI, with small-business exception under $29M gross receipts).
- **IRC §162**: Trade or business expense — ordinary and necessary.
- **Treas. Reg. §1.163-8T**: Tracing rules for interest expense allocation by use of debt proceeds.

## Analysis

Three structures, in order of cleanness:

**Structure 1: Loan stays personal, asset is LLC's. Loan proceeds used by Alton to acquire LLC interest (member capital contribution).**
- Interest character at Alton's personal level depends on what the contributed asset was used for at the LLC.
- If LLC uses solar to generate active business income (GPU rental powered by it): trace to active trade/business interest, deductible.
- If LLC's solar generates only passive income or rental: §163(d) investment interest, capped against net investment income.
- Sartor has substantial investment income, so cap is workable but adds complexity.

**Structure 2: Climate First consents to assignment. Loan goes to LLC, secured by solar asset.**
- LLC has direct §162 business interest expense, fully deductible at LLC level.
- §163(j) applies but small-business exception likely covers SI (well under $29M gross receipts).
- Cleanest tax outcome.
- Requires Climate First's consent + likely fee + re-underwriting on LLC creditworthiness.

**Structure 3: Loan stays personal. LLC pays for solar via member loan from Alton (Path C in [[solar-itc-48-vs-25d]]).**
- Climate First Loan effectively funds Alton's lending to LLC.
- Interest expense at Alton's personal level traced via §1.163-8T to the LLC member loan.
- LLC has interest expense to Alton (deductible at LLC). Alton has interest income from LLC (taxable). Net wash at family level absent rate differences.
- Climate First Loan interest deductibility: traces to investment in LLC member loan, likely §163(d) investment interest.

### Risk grade: MEDIUM

Three workable paths. Choice between them is a CPA-driven optimization, not a position-defense problem. Risk is from execution complexity (consents, paperwork) and from picking sub-optimal structure.

## 2026-06-09 UPDATE — transfer audit: Structure 2 DEAD; otherwise stalled

- **Structure 2 (loan assignment to LLC) is DEAD, definitively.** Erin Gannon (Climate First, 2026-05-11): "we will not be able to convert this loan into a commercial loan." Changes require an installer-submitted change order before final funding ($250 fee). The Position below is superseded: the choice is now **Structure 1 (member capital contribution; loan stays personal, interest traced under Reg. §1.163-8T / Notice 89-35) vs Structure 3/Path C (member loan)** — both executable unilaterally by Alton/CPA, no lender consent needed for the asset side (Erin only foreclosed moving the *loan*).
- **CPA call with JF occurred 2026-05-20** (thread 19e0aaab545fbaa5) — **outcome not documented anywhere**; no structure selection recorded. Action: get the call outcome on paper by 2026-06-12 (pairs with the NJ-1065/Q2 item due 06-15).
- Re-underwrite NOT started — gated on executed CO-01 (received 2026-06-03, unanswered as of 2026-06-09).
- First payment unchanged: no-payment window ends ~2026-07-20; first P&I ~$3,294/mo (366-mo option) due ~2026-08-20.
- Interest-tracing note from the 2026-06-09 HELOC/electricity memos: under Structure 1, if the loan is **secured by the residence**, business-interest tracing may want the §1.163-10T(o)(5) election out of qualified-residence-debt treatment (optional belt-and-suspenders post-TCJA); the same dollars cannot double as §163(h)(3) QRI. **Loan security status (residence mortgage vs UCC fixture filing) is an unverified fact — pull it.** Structuring note from the §469 memo verdict: contract assignment making the LLC the purchaser is the bonus-safe asset path; that is a bigger consent ask of Lucent, not of Climate First.

## Position

~~Defer to JF call. Lean **Structure 2** if Climate First consents quickly; otherwise **Structure 1** as default with member-capital-contribution treatment.~~ **Superseded 2026-06-09: Structure 2 dead. Default is Structure 1 (member capital contribution, loan stays personal-recourse — preserves §465 at-risk treatment), with Path C member loan as the alternative. Awaiting documented JF structure selection from the 5/20 call.**

## Action items

- [x] ~~Email Climate First (Erin Gannon): can the loan be assigned to Solar Inference LLC?~~ ANSWERED 2026-05-11: NO — "we will not be able to convert this loan into a commercial loan." Structure 2 dead; see 2026-06-09 update.
- [ ] CPA call agenda item: structure selection + interaction with [[solar-itc-48-vs-25d]] decision.
- [ ] Document chosen structure in [[reference_solar_project]] action items.

## CPA / counsel routing

- **Send to JF as**: 15-min call, paired with [[solar-itc-48-vs-25d]].
- **JF deliverable**: structure selection + memo confirming deductibility framework.

## History

- 2026-05-08: Opened. Three structures identified. Defer to CPA call.
- 2026-06-09: **Transfer audit.** Structure 2 confirmed DEAD (Erin Gannon 2026-05-11 — no commercial conversion; change order + $250 fee for any change before final funding). JF call happened 2026-05-20 but outcome undocumented — no structure selected on the record; matter otherwise stalled since open. Position updated: Structure 1 default / Path C alternative; loan-security status (residence vs UCC fixture) flagged as unverified fact gating the §1.163-10T(o)(5) election question. Get 5/20 call outcome on paper by 2026-06-12.

## Resolution

(pending)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion.
