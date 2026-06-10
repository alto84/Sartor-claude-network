---
type: plan
entity: solar-inference
updated: 2026-06-09
updated_by: business-plan-update subagent (Rocinante)
status: active
priority: p1
next_review: 2026-07-01
tags: [entity/llc, domain/career, status/active, priority/p1, tax/48E, tax/469, tax/163]
related: [BUSINESS, solar-inference, reference_solar_project, TAXES, MACHINES]
---

# Solar Inference LLC — H2-2026 Operating + Tax Plan

Integrated operating and tax plan for June–December 2026, built from the 2026-06-09 verified memos (electricity-business-use, HELOC, §469 W-2 pass-through), their adversarial verdicts, and the LLC-transfer audit. **This document supersedes prior revenue-model framing in [[BUSINESS]] and [[solar-inference]] where they conflict.** Specifically superseded:

- **"Placed in service before 2026-07-04" is wrong.** 2026-07-04 is the statutory *begin-construction* deadline (OBBB §70513). Under §70513, a solar facility placed in service by 2027-12-31 keeps the §48E credit regardless of begin-construction date; the 7/4 lock is cheap insurance that lets PIS slip further, not an everything-dies cliff. The TY2026 *depreciation* leg still needs actual PIS in 2026 — that is the real 12/31 clock.
- **"Occupancy, not profitability, is the primary metric" ([[BUSINESS]] / business/rental-operations) is retired.** Every machine prices above marginal cost; kWh-burning is never framed as ITC-justified. The metric is profit-motive-consistent revenue plus the §469 rental-period profile (below).
- Notice 2025-42 is **vacated** (Oregon Environmental Council v. IRS, D.D.C. 2026-06-06, universal vacatur). The 5% safe harbor survives under pre-IRA notices; do not cite 2025-42 as live authority. Document physical-work-test facts as belt-and-suspenders.

All dollar-detailed working artifacts live in `data/financial/solar-inference/` (gitignored). Figures here are coarse and already public in memory files.

---

## 1. Where the business stands (2026-06-09)

**Fleet.** Two hosts earning, one staged:
- **gpuserver1** (RTX 5090, machine 52271) — continuously rented since 2026-04-05 under reserved contract C.34113802 (~$0.20/hr realized) through 2026-08-24. Power logger installed.
- **rtxserver** (2× RTX PRO 6000 Blackwell, machine 124192, basis ~$37.8K, in-service 2026-05-26) — rented on-demand, dynamic-priced ~$0.75/GPU/hr by `scripts/fleet/reprice.py`. **No power logger — named ITC substantiation gap.**
- **rig3** — ~$1.9K of components capitalized (Newegg #448349643 + GIGABYTE RTX 5090), build-out hardware arriving; no fleet.yaml stanza yet, not listed.

**Revenue.** Booked YTD is an understatement (daily pulls began ~2026-05-28; CLI date-range backfill blocked by the dateutil bug). Real run-rate ≈ gpuserver1 reserved (~$145/mo) + rtxserver on-demand (variable, dominated by utilization). Honest range in §6.

**Books state** (per STATEMENTS-2026.md warnings): gpuserver1 cost basis not seeded; 3 expense rows AMOUNT UNKNOWN (Berman deposit, Climate First interest split, Google Workspace); no electricity/internet/insurance rows at all; revenue backfill blocked; Operating Agreement Exhibit A blank (capital accounts reconstruction: Alton ~$37.8K, Aneeta $0); Climate First loan balance untracked; rig3 capitalized but unstanza'd. **The Exhibit A / Aneeta-$0 item is not bookkeeping trivia — it is a §704(d) basis wall (§5, §7-D4): a 50/50 loss allocation strands Aneeta's half regardless of §469.**

**Structural posture.** Solar contract and Climate First loan remain in PERSONAL joint name. Zero executed transfer steps since the matter opened 2026-05-08 (32 days). The 2026-05-20 CPA call happened but its outcome is recorded nowhere. CO-01 scope amendment received 2026-06-03, unexecuted. Install has not started. Engagement with Jonathan Francis is still verbal-only.

---

## 2. Electricity strategy — routing roof generation to business use

From the electricity-business-use memo as corrected by its adversarial verdict (matter [[matters/solar-itc-48-vs-25d]]). Goal (4): route ALL roof generation to business use to support the §48E ITC and bonus depreciation on the business fraction.

**Three routing legs, two risk tiers:**

- **Leg (a) — direct GPU consumption.** Strongest authority: facility output powers depreciable equipment earning third-party vast.ai revenue. Design arithmetic supports ~64% at realistic duty, ~80%+ with rig3. But only ~104 kWh of GPU draw is *logged* to date — the substantiated fraction today is ~0.5%. The fraction is whatever the meters show.
- **Leg (b) — grid export / SREC income.** NJ net-metering credits accrue to the **utility customer of record — the personal residential PSE&G account**, not the LLC. Without contractual sweep, export value is personal benefit and the fraction collapses. SREC-II registration must be in the LLC's name; annual true-up pays only wholesale (~$0.03–0.05/kWh); the real value is monthly 1:1 retail crediting on the household bill.
- **Leg (c) — intra-family PPA at documented PSE&G tariff retail** (pull the rate from an actual bill; the $0.18 placeholder in fleet.yaml is wrong — area rate ~$0.26). LLC sells all non-GPU generation to the household; metered, invoiced monthly, cash actually moves to the LLC Chase account. **This increment — the bridge from ~64–80% to ~100% — is graded HIGH** (adversarial-confirmed): no direct authority respects a married couple's 50/50 LLC selling roof power to the same couple's kitchen; substance-over-form/circular-flow exposure. Take only with JF's written sign-off, executed PPA pre-PIS, cleared cash, submetered invoices.

**Claim posture (two tiers):**
- **Tier 1 (claim): metered GPU consumption + LLC-contracted export/SREC**, annual-netting kWh basis — plausibly 70–90% with rig3 + Powerwalls. **MEDIUM after, and only after,** three gating items resolve; **HIGH until then** (verdict override): (i) **FEOC material-assistance ratio** — begin-construction is unavoidably 2026, so the ≥40% non-PFE cost-ratio requirement applies and failure ZEROES the credit; obtain supplier certifications per Notice 2026-15 (Tesla Buffalo manufacture likely helps; inverters/components included; unscoped task — start with Lucent); (ii) **denominator** — §48E(b)(2)(A)(ii) *expressly excludes* buildings and structural components; the Solar Roof is the literal roof, and incremental-cost-over-conventional-roof is a live outcome that shrinks every number before any fraction applies; (iii) **§469 activity characterization** (§5).
- **Tier 2 (the PPA increment to ~100%): HIGH.** Price the §50(a) 5-year recapture exposure before committing.

**Required metering stack, all live before PIS:** revenue-grade production meter (SREC-II likely requires it at 22.1 kW); **metered PDU on rtxserver NOW**; rig3 metered from day 1; household submeter or computed residual off the PSE&G bill; executed PPA + monthly invoices + bank-cleared payments; SREC registration in LLC name.

**Authority corrections binding on all future drafting:** §50(b)(2)(D) covers §48-defined "energy property" and was never conformed for §48E — do not cite it as support. The depreciability gate is §48E(b)(2)(B); storage is §48E(c)(2) via §48(c)(6).

---

## 3. Solar execution critical path

From the transfer audit. **Overall grade HIGH — not on the merits but on documentation: every leg (5% safe harbor, LLC ownership, business-use fraction, material participation) currently rests on verbal statements or nothing.** 32 days of zero executed transfer steps on a position worth low-$30Ks to high-$80Ks of ITC plus the entire depreciation pass-through.

**(a) Begin-construction lock (statutory deadline 2026-07-04, 25 days):**
1. Reply to Steven Schwartz re CO-01 and in the same exchange request the **written 5% safe-harbor attestation** — one page: engineering/physical work performed, costs paid/incurred (the 2025-10-24 deposit + 2026-03-15 draw ≈ 52% of contract, far past 5% of even an amended total). Request by **06-11**, document in hand by **06-20**. Cite the pre-IRA safe-harbor notices, not vacated Notice 2025-42; if install racking starts before 7/4, photograph and log it (physical-work test as second leg).
2. File attestation + draw records in `reference/solar-project-2026-05/`; set `begin_construction_locked` in fleet.yaml same day the document lands (**by 06-21**). Once locked, PIS pressure on the *credit* dissolves; the TY2026 *depreciation* leg still needs PIS by 12/31.
3. Execute CO-01 (negotiate the painting line, decide Powerwalls + snow guards, route final past JF) — signed by **06-19** so Lucent can submit the Climate First change order and the install actually starts.

**(b) LLC ownership before PIS — the gating defect:**
4. Get the 2026-05-20 CPA-call outcome on paper: email JF by **06-12** (pair with the Q2/NJ-1065 item) asking which structure and what documents.
5. **Structure ranking (adversarial override of the memo):** prefer **contract assignment** — Lucent assigns/novates the installation contract so the LLC is itself the purchaser from an unrelated installer (LLC pays remaining installments with contributed cash). This makes the LLC the original user beyond doubt and §168(k)(2)(E)(ii) never engages. The in-kind §721 contribution of "the system" is second choice: carryover basis arguably fails the bonus-depreciation purchase prong (§179(d)(2)(C) chain; 168(k) final-reg preamble; practitioner literature says contributed property is bonus-ineligible) — defensible but contested. **Never let the LLC *buy* the system from the members** (§168(k)(2)(E)(ii) kills bonus outright). Executed by **06-30**, in all cases before PIS. Note: Erin Gannon (Climate First, 2026-05-11) foreclosed only moving the *loan*; no lender consent is needed for the asset side, but full contract assignment makes the LLC the contract obligor — a bigger consent conversation; raise with JF and Steven together.
6. Re-underwrite via Lucent-submitted change order ($250 fee) once CO-01 signs (~**06-26**).
7. **Convert the JF engagement to written** (with item 4). A position carrying a six-figure credit plus ~$370K of depreciation on a verbal engagement is unacceptable.

**Powerwall/scope decisions:** 2 Powerwalls remain in scope. They are qualified storage (§48E(c)(2)) and — more important — convert the temporal-mismatch defense from annual netting toward near-physical tracing of solar into the rigs. Default: keep them, subject to final pricing in CO-01. Snow-guard layout and placement walk-through: decide with CO-01 execution.

**FEOC (new, from verdict):** open the material-assistance cost-ratio workstream with Lucent/Tesla in the same CO-01 exchange. Without ≥40% non-PFE certification the credit is zero, full stop.

---

## 4. Financing map

Three sources, three distinct rule-sets. The two-ledger principle: *what the dollar bought* fixes basis character; *where the dollar came from* fixes interest character. Neither converts the other.

- **Climate First loan (personal joint, acct ref in [[reference_heloc]]-adjacent files)** — funds the energy property. Loan-to-LLC conversion is DEAD (Erin Gannon, 2026-05-11). Loan stays personal; structure the asset side per §3 item 5. Interest tracing to LLC business use runs through Reg. §1.163-8T / Notice 89-35; if the loan is secured by the residence, the §1.163-10T(o)(5) election may be needed before business tracing — **security status (mortgage vs UCC fixture filing) is an unverified fact; pull it.** Keep the loan full-recourse personal (§465 at-risk wants the recourse character). No-payment window ends ~**07-20**; first P&I ~$3.3K/mo due ~**08-20** — the expense ledger needs an interest-split row from day one.
- **HELOC (Georgia's Own 7887)** — per the HELOC memo *as corrected*: **headroom is ~$0, not ~$21K** (the 1098 shows full-limit principal; the wire was net of closing-cost retention). The entire new-draw analysis is moot until principal is paid down — verify the actual balance on the Cenlar portal before planning any HELOC routing. If headroom appears: Route B (draw → documented capital contribution → LLC pays vendor from its own account) is worth ~4× Route A per business-traced dollar; Route A (QRI on improvement draws) is small and **possibly exactly $0** if any of the ~$1.82M first mortgage is grandfathered pre-12/16/2017 debt — **vintage, not just rate, is load-bearing; pull both.** The (o)(5) election is optional insurance, per-debt and sticky: making it forfeits Route A on the same HELOC's improvement draws — decide once, with JF, not by default. **Never run personal improvement draws (siding, mortar, bathroom, power washing) through the LLC to manufacture business interest — HIGH, don't.** The untraced original draw generates ~$39.5K/yr of presumptively nondeductible interest; reconstruction (Aneeta's Chase statements, 4 card histories) is the real prize, amend window closes **2026-10-15**.
- **Cash / brokerage** — default for personal-side scope items while HELOC headroom is unverified, and for LLC contributions (cleanest tracing of all: contributed cash has no interest character to defend).

**Draw discipline (if/when HELOC reopens):** one draw = one purpose; direct payment to vendor; per-draw tracing schedule in `data/financial/`; Notice 88-74 timing; documented contribution entries in capital-accounts.yaml for Route B.

---

## 5. §469 program

Matter: [[matters/469-material-participation]]. Two gates in series; the first is the one prior framing under-weighted.

**Gate 1 — rental-activity characterization (THE gateway; MEDIUM-HIGH).** If vast.ai hosting is a §1.469-1T(e)(3) rental activity (income-weighted average period of customer use >30 days, or >7 without significant services), it is **per-se passive under §469(c)(2) and hours are irrelevant** — loss suspended, ITC stranded, and grouping the roof in would poison the roof too. The reserved contract C.34113802 (~141 days) is the threat. Mitigations, in order:
1. **Tally the 2026 discrete rental-period count and per-machine gross income split THIS WEEK** (vast.ai host records / kaalia container history, both machines). Single-class breakeven: **N ≥ 23** short rentals plus the one long contract gets the average ≤7 days (verdict corrected the memo's N ≥ 27). The rtxserver "~1 day average" assumption is itself suspect — the C.38328535 miner rental ran long; count it honestly.
2. **After C.34113802 expires 08-24, accept no new multi-month reserved contract in 2026.** On-demand only through 12-31. This aligns with the existing "short-term first" strategy and is the single cheapest §469 action available. (Listing-strategy call — Alton's, see §7-D2.)
3. Class-of-property computation (one equipment class vs per-server, income-weighted) has no pinned authority — JF item.

**Gate 2 — material participation, §1.469-5T(a)(3) >100h path.** Verified YTD figure: **49.47h** (human_interactive_hours, all-hours.csv summed 2026-06-09; the 45.1h briefing figure was stale). **Need 50.53h more by 12/31 — ~1.8h/week.** Regimen:
- Counts: pricing decisions, hardware ops (rig3 build, rtxserver PDU install, thermal/BMC work), vendor/lender interaction (Lucent, Climate First, electricians), customer-issue handling, listing strategy, books maintenance. The solar install starting now is operator-gold: site walks, electrician coordination, equipment placement.
- Does not count: dashboard-watching, reviewing autonomous-system output, briefing consumption; tax-strategy time is gray — don't lean on it.
- **Start a contemporaneous narrative/calendar supplement for non-keyboard hours** (§1.469-5T(f)(4)); the CSV captures only Claude-session typing. Backfilling blank Jan–Apr extractor rows may add defensible hours — worth one extractor pass.
- Spousal attribution (§469(h)(5)) means Aneeta's distributive share is non-passive if Alton materially participates.

**Grouping.** Preferred framing: no grouping needed — the roof's business fraction is an asset OF the single GPU-hosting trade or business. If treated as two activities, §1.469-4(c) factors pass decisively (identical 50/50 ownership, one location, the roof's business use IS supplying GPU load), with Rev. Proc. 2010-13 disclosure — but only after the rental label is stripped (Gate 1 first; grouping into a per-se-passive rental makes the whole group passive).

**Downstream limiters, in statutory order:** §704(d) basis (Aneeta $0 — fixed by the joint contribution / Exhibit A execution, §3); §465 at-risk (fine if recourse preserved); §461(l) **$512K MFJ for 2026** (OBBB reset DOWN; Rev. Proc. 2025-32 — projected losses fit under it but project the aggregate before year-end); AMT/§38(c) — **§48E is NOT a §38(c)(4)(B) specified credit** (verdict resolved the unknown unfavorably), so the TMT floor fully applies and the loss itself shrinks same-year credit headroom: expect multi-year ITC absorption, and have JF model bonus-vs-slower-depreciation against credit usability. NJ: plan on ~$0 state benefit against wages (§168(k) decoupling + category no-netting; 50% ABCA only within business categories).

---

## 6. Revenue plan H2-2026

- **gpuserver1** — reserved through 08-24 (~$145/mo realized). After 08-24: **relist on-demand only** (§469 Gate 1 mitigation; also the listing expiry 06-30 needs a relist decision — watchdog tracks it). Keep fixed pricing per current approval; on-demand at the approved rate likely beats the reserved realized rate if occupancy holds above ~25%.
- **rtxserver** — dynamic repricer owns the on-demand price (carve-out approved). Occupancy posture: maximize short-rental count, not contract length. Install the metered PDU during a rental gap — it serves both ITC substantiation and the power-cost line in the books.
- **rig3** — bring-up target **July**: assemble, burn-in, vast.ai onboard per `procedures/vastai-host-onboarding.md`, fleet.yaml stanza + basis seeding on day 1, power logger from day 1, short-term listings only. A 5090 at gpuserver1-like on-demand rates is a modest but real third leg.
- **Realistic H2 revenue range (coarse):** low hundreds/month floor (gpuserver1 reserved + thin rtxserver occupancy) to low four figures/month if rtxserver sustains meaningful on-demand occupancy and rig3 lists by August. Booked YTD (~$475 through May, understated) is not the run-rate; the books revenue backfill (blocked on the vast.ai CLI dateutil bug — workaround: pull from the web console or fix the CLI env) is needed before any honest annualization. SREC-II income (~$1.7–2.2K/yr once generating, registration rate to confirm) and PPA/true-up receipts start post-PIS.
- **Hygiene:** every machine priced above marginal power cost; revenue framing is profit-motive-consistent; never describe load as ITC-driven.

---

## 7. Decision register (Alton)

| # | Decision | Deadline | Notes |
|---|----------|----------|-------|
| D1 | **Q2-2026 federal estimated tax payment** | **2026-06-15** | Six days. Route through JF; the TY2026 loss posture affects the safe-harbor math. |
| D2 | **Insurance — commercial coverage matter** | **2026-06-15** | Must resolve before asserting "commercial property at the residence" to the IRS while telling Selective it's a residence. Conflict is a named fact-that-must-be-true for the ITC position. |
| D3 | CO-01: accept/negotiate line items (painting reduction offered), Powerwall placement, snow guards; sign | sign by 2026-06-19 | Route final past JF first. Steven asked to meet 06-03/04; thread is 6 days idle. |
| D4 | Transfer structure: contract assignment (preferred) vs §721 in-kind contribution; plus Exhibit A execution | structure chosen 06-12; papered 06-30 | §3 item 5. Email JF; get the 5/20 call outcome in writing. Fixes the Aneeta-$0 §704(d) wall. |
| D5 | Request Steven's written 5% safe-harbor attestation | request 06-11; in hand 06-20 | Agent drafts; Alton sends/texts. |
| D6 | Post-08-24 listing strategy: on-demand only, no new reserved contract in 2026 | decide by 2026-08-01 | §469 Gate 1. Recommended: yes. |
| D7 | Tier 2 household PPA: go/no-go (**HIGH**) | with JF, before PIS | Only with written JF sign-off + executed PPA + cleared cash + submeters. |
| D8 | (o)(5) election on the HELOC (sticky, forfeits Route A on same debt) | with TY2026 return prep; decide by Q4 | Moot until headroom verified; optional insurance, not default. |
| D9 | TY2025 amend decision on HELOC interest (~$2.0K) pending tracing reconstruction | **2026-10-15** | Conservative posture stands: don't claim untraced interest. |
| D10 | JF engagement letter — convert from verbal | with D4 (06-12 ask) | Non-negotiable at this position size. |
| D11 | Sante Total 990-N — overdue since 2026-05-15 | immediately | Not an LLC item but on the same June plate; file the e-Postcard. |
| D12 | rig3: confirm build/list timeline + fleet.yaml stanza | July | §6. |

Standing CPA-routing facts to pull this month: PSE&G tariff rate from an actual bill; Climate First loan security instrument (mortgage vs UCC); first-mortgage vintage + rate; actual HELOC balance (Cenlar portal); 2026 rental-period tally + per-machine income split.

---

## 8. Calendar — June to December 2026

**June.** 06-11 request attestation (D5) + reply Steven re CO-01 + open FEOC certification ask. 06-12 JF email: structure choice on paper, engagement letter, Q2 coordination (D4, D10). 06-15 **Q2 estimate + insurance matter (D1, D2)**. File 990-N (D11). 06-19 CO-01 signed (D3). 06-20/21 attestation filed, `begin_construction_locked` set. ~06-26 Lucent submits Climate First change order. 06-30 transfer instrument executed (D4); gpuserver1 listing-expiry relist decision. Order/install rtxserver metered PDU. Begin narrative hours supplement. Tally rental periods. Hours checkpoint: ~57h.

**July.** 07-04 statutory begin-construction deadline passes — locked or (if install started) physical-work documented. Install underway: photograph racking start, log site-walk hours. rig3 assembly + vast.ai onboarding. ~07-20 Climate First no-payment window ends; books get the interest-split row. FEOC certification follow-up. Hours: ~65h.

**August.** 08-24 reserved contract C.34113802 ends → **relist gpuserver1 on-demand only** (D6). ~08-20 first Climate First P&I. rig3 listed. Mid-year §469 check: period count trending vs N≥23; hours ~72h.

**September.** 09-15 **TY2025 Form 1065 extended deadline** — JF files; K-1s out. Install progress vs PIS check. SREC-II registration prep (LLC name) + production meter confirmation. Revenue backfill resolved (CLI fix or console pull). Hours ~80h.

**October.** 10-15 TY2025 amend window closes (D9) — HELOC tracing reconstruction done or posture finalized. PIS push; metering data accumulating. PPA executed before PIS if D7 = go. §461(l) aggregate-loss projection with JF. Hours ~88h.

**November.** PIS target window. At PIS: LLC ownership papered (verified), meters live, SREC registration in, insurance bound, FEOC certification in the file. AMT/TMT projection for credit absorption; bonus-vs-slower-depreciation election decision with JF. Hours ~95h.

**December.** PIS confirmed (TY2026 depreciation requires it). **100h crossed and documented** — narrative supplement reconciled with the CSV. Final rental-period/average-period computation memo'd for the CPA file. Books close: basis seeded (gpuserver1, rig3), 3 UNKNOWN amounts resolved, electricity/internet/insurance rows present, capital accounts per executed Exhibit A. Q1-2027 filing package staged: Forms 3468, 4562, 8582, 461, grouping disclosure if used.

---

## Risk summary

- **HIGH inline items:** documentation state of the entire transfer/ITC position (every leg verbal or absent); Tier 2 household PPA; FEOC ratio unstarted (zeroes the credit on failure); roof denominator under §48E(b)(2)(A)(ii); attempting LLC basis for personal scope items (siding/gutters) — don't.
- **MEDIUM-HIGH:** §469 rental characterization until the period tally lands.
- **The realistic planning anchor** is the mid case: hosting-leg loss (~$45K) non-passive with the roof's credit protected by the begin-construction lock and its depreciation sliding to TY2027 if PIS slips. The full-stack best case stays HIGH until FEOC, denominator, metering, and the rental tally are pinned.

Every tax position in this plan routes through Jonathan Francis (jf@francis-cpa.com, 914-488-5727) before signing or filing. This document is analytical support for CPA discussion, not filing guidance.

## Related
- [[BUSINESS]] · [[solar-inference]] · [[reference_solar_project]] · [[TAXES]]
- [[matters/solar-itc-48-vs-25d]] · [[matters/469-material-participation]] · [[matters/heloc-163h3-tracing]]
- Source memos + adversarial verdicts: 2026-06-09 review set (electricity-business-use, heloc, 469-w2-passthrough) and the transfer audit.
