---
entity: cross-domain-executor-worklist
type: domain
date: 2026-05-02
updated: 2026-05-02
updated_by: todo-executor (family-thread, Opus 4.7 1M context) — v0.1 first-turn baseline
status: active
priority: p0
volatility: high
review_cadence: refresh on Alton check-ins or on team-lead routing requests; full re-rank at most daily
source: family-dashboard-2026-05-02 (curator's v2) + active-todos.md (run 48 + 5/02 evening block) + BUSINESS.md + TAXES.md + business/solar-inference.md + business/sante-total.md + business/az-career.md + ASTRAZENECA.md + family-calendar.md + people/jonathan-francis.md + family/PAPER-CHECK-VENDORS.md
related: [family/active-todos, projects/family-thread-dossier/family-dashboard-2026-05-02, BUSINESS, TAXES, ASTRAZENECA, business/solar-inference, business/sante-total, business/az-career, family/PAPER-CHECK-VENDORS, feedback/paper-checks-blindspot, feedback/gather-respects-out-of-band-closures, feedback/always-check-paper-check-vendors-before-flagging-red]
aliases: [Cross-Domain Worklist, Master Worklist, Executor Worklist]
proposed_path_alternatives: [tasks/CROSS-DOMAIN-EXECUTOR-WORKLIST.md (per team-lead spec), projects/family-thread-dossier/cross-domain-executor-worklist.md (chosen — parallels family-dashboard-2026-05-02.md inside the active dossier)]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---

# Cross-Domain Executor Worklist — v0.1 (2026-05-02)

This is the *complete* underlying view of every open item across all of Alton's domains, ranked. The team-lead surfaces a subset to chat at any moment; this list does not. Categories: **family / business / taxes / nonprofit / personal-financial / az-career**.

## Conventions

**Priority bands** (re-ranked each refresh):
- **P0** — RED: hard external deadline ≤7 days OR money-at-risk ≥$1K OR irreversible window closing
- **P1** — YELLOW: deadline 7–30 days OR moderate stakes OR active vendor expects reply
- **P2** — BLUE: deadline 30–90 days OR standing-monitor with known checkpoint
- **P3** — GREEN: no hard deadline, optional, or research-mode
- **P4** — BLACK: blocked / blind-spot / waiting-on-someone-else

**Paper-check vendor allowlist applied** (per `feedback_always_check_paper_check_vendors_before_flagging_red.md`): items whose recipient appears in `family/PAPER-CHECK-VENDORS.md` are pre-softened and never emitted as P0 from email-absence alone. Currently allowlisted: Bill (heating), Wohelo Camps, 185 Davis Condo Board (Charlotte Rice).

**Out-of-band closures honored** (per `feedback_gather_respects_out_of_band_closures.md`): the 4 Alton confirmations from the 2026-05-02 morning check-in (Wohelo $12,900, 185 Davis $2,253.13, Bill heating, Lucent Solar engineering meeting) are CLOSED in this worklist and will not re-fire even if the gather pipeline re-flags them.

**Routing column** indicates which agent owns execution / surfacing:
- `team-lead` — surfaces to Alton in chat
- `stock-explorer` — financial research subagent (in spawn per 2026-05-02 evening block)
- `family-curator` — owns family/active-todos.md edits
- `executor` — this agent maintains the rank/dedup/cross-conflict view

---

## Top-of-stack (P0 — act in next 0–3 days)

| # | Pri | Item | Deadline | Owner | Category | Source | Routing |
|---|-----|------|----------|-------|----------|--------|---------|
| 1 | P0 | **AZ LTI stock transfer** — move long-term incentive shares from AZ-managed (Equate Plus / Computershare / MS Solium) to Alton-managed brokerage. Tax-sensitive (LTCG); MUST coordinate with Jonathan Francis BEFORE initiating to sequence against W-2 ordinary income. Founding decision for stock-explorer. | (no hard external deadline; Alton-flagged HIGH 5/02 evening) | Alton + JF + stock-explorer | business/financial | active-todos:47 (5/02 evening block) | stock-explorer (research positions + tax-lot scan); team-lead (surface JF gate) |
| 2 | P0 | **Fidelity → main checking transfer** (cash). Amount + destination TBD by Alton. Likely tied to clearing the Wohelo $12,900 + 185 Davis $2,253 paper checks already in mail. Founding use-case for stock-explorer: survey Fidelity positions + cash, propose transfer amount, flag tax-lot consequences if a sale is needed to fund. | this week (cash-clearing pressure) | Alton + stock-explorer | business/financial | active-todos:44 (5/02 evening block) | stock-explorer (positions scan + transfer proposal); team-lead (Alton confirm) |
| 3 | P0 | **CSA 2026 second checks** — Circle Brook Farm $475 + Tree-Licious Orchards $345 to Enid Melville, Upper Montclair (separate from share registration). Was due ~5/01. NOT on paper-check vendor allowlist (Enid Melville is a CSA coordinator with email signal, but the checks themselves are mail). | ~2026-05-01 (1 day overdue) | Alton | family | active-todos run 22/36 via family-dashboard-2026-05-02:42 | team-lead (ASK Alton "checks already in mail?" before escalating; if yes, add Enid Melville to PAPER-CHECK-VENDORS) |
| 4 | P0 | **Vayu MKA homework-habits parent partnership** — respond to Roshni Shah (rshah@mka.org); 2nd escalation since Apr 14. Vayu struggling with partial-quotients division. | ~Apr 29/30 (overdue) | Alton (coord with Aneeta on RRE return) | family | active-todos runs 22/33 via family-dashboard-2026-05-02:44 | team-lead (surface; coordinate w/ Aneeta after 5/03) |
| 5 | P0 | **Sante Total transfer to "Gaby" — authorize/decline** — Alison Smith email Apr 30 needs board/Alton sign-off. Treasurer decision; gating donor activity. | ~Apr 29 (overdue) | Alton (Treasurer) | nonprofit | active-todos run 29 via family-dashboard-2026-05-02:45 | team-lead (decision surface) |
| 6 | P0 | **Nintendo Switch repair #61296128 — payment method declined**, "time is running out." Low $ but a closing window. | imminent | Alton | family | active-todos run 33 via family-dashboard-2026-05-02:46 | team-lead (5-min unblock; update card-on-file) |
| 7 | P0 | **Mark and Graham Mother's Day gift personalization** for Aneeta — Mother's Day is 2026-05-11, personalization lead 5–7 days, last call was 5/04, today is 5/02. If gift not yet placed, the window is closing this weekend. | 2026-05-04 effective | Alton | family / personal | active-todos runs 26/35 via family-dashboard-2026-05-02:43 | team-lead (ASK confirm) |
| 8 | P0 | **Lucent Solar engineer next check-in** — Mon 2026-05-05. The standing-monitor against the **2026-07-04 ITC deadline** (~$131,649 federal credit) lives or dies on whether install starts ~early June. NOT currently at-risk per Alton's 4/30 in-person meeting, but cadence must hold. | 2026-05-05 (Mon) | Alton | business | active-todos 5/02 morning block; business/solar-inference | team-lead (calendar surface for Mon AM) |

## This week (P1 — 3–10 days)

| # | Pri | Item | Deadline | Owner | Category | Source | Routing |
|---|-----|------|----------|-------|----------|--------|---------|
| 9 | P1 | **Aneeta returns from RRE** (Sun 5/03 evening?) — handoff plan needed; Alton's sole-parent window day 5 of 5 closes | 2026-05-03 | Alton + Aneeta | family | family-dashboard-2026-05-02:54 | team-lead (Sun PM check) |
| 10 | P1 | **Vasu Goddard picture days** — 5/03 (dual w/ Vayu soccer), 5/04 (Goddard) | 2026-05-03 / 5/04 | Alton/Aneeta | family | family-dashboard-2026-05-02:55 | family-curator owns; surface T-1 |
| 11 | P1 | **Vasu Teacher Appreciation chalk message** at Goddard outdoor chalkboard, Mon AM drop-off | 2026-05-04 (Mon) | Aneeta (likely) | family | family-dashboard-2026-05-02:56 | family-curator |
| 12 | P1 | **Disney check-in with Nicol Stevenson** — confirm reservations, payment, ADRs, lightning-lane / Genie+ strategy, ticket type, open questions before final-payment window. Ties to: blocker that **Alton has booked nothing yet** (no flights, no hotel, no tickets, no Disneyland login shared per Mar 31 ask). The 60-day Blue Bayou ADR window opens **2026-05-17** — Nicol needs preferences BEFORE that date. | 2026-05-17 hard (ADR window opens) | Alton | family | active-todos:42 (5/02 evening) + disney-july-2026:18 + active-todos run 4 (5/17 ADR deadline) | team-lead (surface as a SINGLE bundled "Disney unblock" decision; do NOT drip-feed) |
| 13 | P1 | **MKA 3rd–4th Grade Parent-to-Parent Panel RSVP** — Wed 5/06, 8:15 AM, MKA MS Dining Hall (Vayu's PS→MS transition) | 2026-05-06 (Wed) | Alton or Aneeta | family | family-dashboard-2026-05-02:59 | family-curator |
| 14 | P1 | **Goddard Mother's Day Celebration** Thu 5/08 7:30–9:30 AM (open arrival) — Aneeta's celebration | 2026-05-08 (Thu) | Aneeta | family | family-dashboard-2026-05-02:60 | family-curator |
| 15 | P1 | **Vayu B-34 Lime soccer** Sat 5/09 11AM, Brookdale Stadium South Field 1 | 2026-05-09 (Sat) | Alton/Aneeta | family | family-dashboard-2026-05-02:61 | family-curator |
| 16 | P1 | **Convocation event 5/09 2:30–5:30 PM** (Aneeta-created; context unknown — likely Neurvati or personal) | 2026-05-09 (Sat) | Aneeta | family | family-dashboard-2026-05-02:62 | team-lead (clarify with Aneeta) |
| 17 | P1 | **MKA tuition payment due** — Vayu (4th) + Vishala (3rd); Family ID 1336725017733 via Blackbaud | 2026-05-10 (Sun) | Alton | family / personal-financial | family-dashboard-2026-05-02:68 | team-lead (T-3 surface) |
| 18 | P1 | **CPA Jonathan Francis check-in** — quarterly cadence + (a) AZ LTI sequencing (item #1), (b) Solar Inference burst-compute tax structure if pursued, (c) Q2 estimated payments due 6/15 (~6 wks), (d) any open Apr-15-thread items Alton hasn't surfaced. **Do BEFORE acting on item #1.** | this week (gates AZ LTI) | Alton + JF | taxes | active-todos:50 (5/02 evening) + people/jonathan-francis | team-lead (schedule call; not executor work) |

## Soon (P2 — 10–60 days)

| # | Pri | Item | Deadline | Owner | Category | Source | Routing |
|---|-----|------|----------|-------|----------|--------|---------|
| 19 | P2 | **Sante Total Form 990-N (TY2025) filing** — alone, gross receipts <$50K threshold for 2025 still applies. Alton handles directly (NOT in JF scope). Extendable to 11/15 via Form 8868. | 2026-05-15 | Alton | nonprofit | TAXES.md:22 + business/sante-total.md:35 | team-lead (T-7 surface) |
| 20 | P2 | **185 Davis boiler expansion tank Google Form vote** ($10,237 work) | 2026-05-15 | Alton | family / business | family-dashboard-2026-05-02:69 | family-curator |
| 21 | P2 | **Disney ADR window opens 2026-05-17** — Blue Bayou Saturday + DTF Thursday + character dining venue (Plaza Inn Minnie or Storyteller's Mickey for Vasu age 4). Nicol books at 60 days = 5/17. **Same item as #12 deadline-wise; this is the hard external trigger.** | 2026-05-17 | Alton + Nicol | family | active-todos run 4 + disney-july-2026 | team-lead (already routed via #12) |
| 22 | P2 | **MKA Field Day volunteer sign-up** (optional) — 5/22, rain date 5/26 | 2026-05-22 | Alton/Aneeta | family | family-dashboard-2026-05-02:70 | family-curator |
| 23 | P2 | **NJ Pride FC Spring 2 enrollment for Vayu** — "2 classes already close to sold out"; season starts 5/23 | 2026-05-23 | Alton | family | family-dashboard-2026-05-02:71 | family-curator |
| 24 | P2 | **Vishala Capstone Design Fair** — MKA Brookside 5/29 8:15 AM, parents expected | 2026-05-29 | Alton + Aneeta | family | family-dashboard-2026-05-02:72 | family-curator |
| 25 | P2 | **Replit account login by 5/29** or apps auto-delete | 2026-05-29 | Alton | personal | family-dashboard-2026-05-02:73 | family-curator |
| 26 | P2 | **Lucent Solar install start (estimated)** — track against 7/04 ITC deadline | ~early June | Alton | business | family-dashboard-2026-05-02:74 + business/solar-inference | executor (standing monitor; rolling cadence vs 5/05 check-in) |
| 27 | P2 | **CSA Circle Brook Farm pickups begin** Tue 6/09 (through 11/17, 86 Llewellyn Rd) — once 5/01 checks land | 2026-06-09 | Alton | family | family-dashboard-2026-05-02:75 | family-curator |
| 28 | P2 | **NJ-1065 Q2 estimated payment** for Solar Inference LLC — separate from $450 annual filing fee already paid 4/15 | 2026-06-15 | Alton + JF | taxes | TAXES + active-todos:50 | team-lead (route to JF check-in #18) |
| 29 | P2 | **Wohelo Little Assembly First Year Family Tour** 6/25 10–11 AM Raymond ME — attendance decision | 2026-06-25 | Alton/Aneeta decide | family | family-dashboard-2026-05-02:76 | family-curator (decision surface ~T-21) |
| 30 | P2 | **LEGO Insiders 982 points expire 6/26** | 2026-06-26 | Alton | personal | family-dashboard-2026-05-02:77 | family-curator |
| 31 | P2 | **185 Davis fuel cost overage assessment** ~$375/unit (Devaney to confirm 6/01) | 2026-06-30 | Alton | family / business | family-dashboard-2026-05-02:78 | family-curator (auto-soften per paper-check rule — 185 Davis on allowlist) |
| 32 | P2 | **Solar ITC deadline — system in service** or $131,649 federal credit lost. Currently monitored, not at-risk per Alton's 4/30 meeting. | 2026-07-04 | Alton + Lucent | business / taxes | family-dashboard-2026-05-02:79 + business/solar-inference + TAXES | executor (rolling monitor against item #8 cadence) |
| 33 | P2 | **Disney trip dates** Thu 7/16–Sun 7/19 (Disneyland Anaheim) — flights, hotel, tickets, Disneyland login share to Nicol. Per item #12 these are all blockers. | 2026-07-16 | Alton (entire family) | family | disney-july-2026 | team-lead (bundled in #12) |

## Standing / no hard deadline (P3)

| # | Pri | Item | State | Owner | Category | Source | Routing |
|---|-----|------|-------|-------|----------|--------|---------|
| 34 | P3 | **Find a nanny / afternoon childcare help** — 3 PM – 7/8 PM weekdays, 3 kids across MKA + Goddard, must do pickup + transport. New 5/02 framing: explicitly NANNY (more permanent than Rachelle-Trammel-style hourly). Decide: agency vs word-of-mouth vs care.com vs SitterCity. | active research | Alton | family | active-todos:38 (5/02 evening) + active-todos:87 (HIGH long-running) | team-lead (gates daily logistics; surface as a P0 candidate when Alton has bandwidth to choose) |
| 35 | P3 | **NYC commute train switch** — blocked on Bay St / Bloomfield parking research | active research | Alton | personal-financial / az-career | family-dashboard-2026-05-02:86 | family-curator |
| 36 | P3 | **Hiive: Anthropic agreement** — sign electronically (Sissy delayed) | open since 4/24-25 | Alton | personal-financial | family-dashboard-2026-05-02:87 | stock-explorer (when active) |
| 37 | P3 | **Hiive: Kalshi (4/30 deadline status unknown), SpaceX, Zipline (5/01 deadlines), Shield AI, Perplexity, Apptronik, Gecko Robotics** — multiple decisions stacked | open | Alton | personal-financial | family-dashboard-2026-05-02:88 | stock-explorer |
| 38 | P3 | **EquityZen: Anthropic investor interest reconfirm** (subject-line explicit Apr 29) | open | Alton | personal-financial | family-dashboard-2026-05-02:89 | stock-explorer |
| 39 | P3 | **AlphaSights "Patient Service & Hub Operations"** 1-hour consult — accept/decline | open since 4/30 | Alton | az-career / advisory | family-dashboard-2026-05-02:90 | team-lead (5-min decision) |
| 40 | P3 | **Guidepoint: Genetic Disorder Survey ($50) + Global Oncology #1732882 + Pediatric LGG #1718071** | open (3 stacked) | Alton | az-career / advisory | family-dashboard-2026-05-02:91 + business/az-career | team-lead (batch decision) |
| 41 | P3 | **NM Planning Review (Noah Krassin)** — 3rd follow-up; schedule or send explicit decline | open | Alton | personal-financial | family-dashboard-2026-05-02:92 | team-lead |
| 42 | P3 | **Amazon product safety recall** — log in to identify affected product | open since 5/01 | Alton | personal | family-dashboard-2026-05-02:93 | family-curator |
| 43 | P3 | **MKA 3V Class Gift contribution** (Vishala's class year-end, Joanna Steckler organizing) | open | Alton | family | family-dashboard-2026-05-02:94 | family-curator |
| 44 | P3 | **MKA Spring Conference Day food volunteers** Thu 5/14 (optional) | optional | Alton/Aneeta | family | family-dashboard-2026-05-02:95 | family-curator |
| 45 | P3 | **Nishuane Pool 2026 family pass $250** — register at register.communitypass.net/montclair (closes 8/16 for construction) | open since 4/27 | Alton | family | family-dashboard-2026-05-02:96 | family-curator |
| 46 | P3 | **Sante Total: open new bank account** for restricted-donation segregation | open (long-running) | Alton (Treasurer) | nonprofit | family-dashboard-2026-05-02:97 + business/sante-total:24 | team-lead (board decision) |
| 47 | P3 | **Loki's chlorambucil reorder** — Chewy Rx 1-877-977-3879 | open (~50 wk supply running low) | Alton/Aneeta | family | family-dashboard-2026-05-02:98 | family-curator |
| 48 | P3 | **Chase Sapphire 9425 → replacement card autopay audit** — new card in hand; autopays not yet updated | open | Alton | personal-financial | family-dashboard-2026-05-02:99 | team-lead (one-session sweep) |
| 49 | P3 | **Aneeta CSA workshift registration via SignUpGenius** (step 3 in progress) | step 3 in progress | Aneeta | family | family-dashboard-2026-05-02:100 | family-curator |
| 50 | P3 | **Tribeca Pediatrics portal: 3+ unread messages** (gated behind login) | open since 3/31 | Alton | family | family-dashboard-2026-05-02:101 | family-curator |
| 51 | P3 | **Plumber call** — outdoor pipes broke (spring-thaw); main shut off, irrigation isolated; vendor TBD | open since 4/17 | Alton | family / household | family-dashboard-2026-05-02:102 | team-lead (vendor discovery) |
| 52 | P3 | **Summit Health portal payment** | open | Alton | family / personal-financial | family-dashboard-2026-05-02:103 | family-curator |
| 53 | P3 | **MKA PAMKA Annual Meeting** Wed 5/20 7:45 AM continental, 8:15 meeting | optional | Alton | family | family-dashboard-2026-05-02:105 | family-curator |
| 54 | P3 | **Jackrabbit Tech summer gymnastics** ($200/kid, 6/23–8/18) — Vayu/Vishala enrollment decision | informational | Alton | family | family-dashboard-2026-05-02:106 | family-curator |
| 55 | P3 | **Pool Guyz LLC statement** — Zelle to Thepoolguyznj@gmail.com (amount in PDF) | open, no hard deadline | Alton | family / personal-financial | family-dashboard-2026-05-02:107 | family-curator |
| 56 | P3 | **Solar Inference burst-compute-as-a-service business idea** — flagged 4/11 for weekend planning; recommended-CLOSE per dashboard. | parked | Alton | business | family-dashboard-2026-05-02:104 + active-todos run 5 (line 191–193) | team-lead (decide: close or schedule a real exploration block) |
| 57 | P3 | **Sante Total IRS penalty abatement** (filed Dec 2025) — pending; IRS typically 3–6 mo | pending external | n/a (waiting) | nonprofit | business/sante-total:47 | executor (passive watch; surface if 6 mo with no reply ≈ 2026-06) |
| 58 | P3 | **Sante Total TY2026 990-EZ migration** — first time crossing $50K threshold; will need more disclosures + possibly new CPA engagement (out of JF scope). Not due until 2027-05-15 but worth scoping in 2026 Q3. | TY2026 forward-look | Alton (Treasurer) | nonprofit | business/sante-total:21,41 | team-lead (Q3 scoping) |
| 59 | P3 | **Solar Inference LLC Form 1065 federal** — Form 7004 extension already filed; final due 9/15. K-1 ~$2K loss to each member. | 2026-09-15 | Alton + JF | taxes / business | TAXES.md:25 + business/solar-inference:73 | team-lead (route into JF check-in #18) |

## Blocked / blind-spot / waiting (P4)

| # | Pri | Item | Why blocked | Owner | Category | Source | Routing |
|---|-----|------|-------------|-------|----------|--------|---------|
| 60 | P4 | **Vayu counselor/therapist search** — no email signal in 30+ days; status truly unknown | unverifiable from email | Aneeta? | family | family-dashboard-2026-05-02:114 | team-lead (ASK Aneeta — phone-channel only, not email) |
| 61 | P4 | **Family dentist booking (Park Street Dental Montclair, 973-842-2411)** — call needed; no email signal | unverifiable from email | Alton | family | family-dashboard-2026-05-02:115 | family-curator (5-min phone call) |
| 62 | P4 | **CAQH ProView reattestation** — open since 4/12; affects credentialing, insurance reimbursements, hospital privileges | self-service portal | Alton | az-career / personal | family-dashboard-2026-05-02:116 | team-lead (no deadline named but "expired" language is urgent) |
| 63 | P4 | **W-2 DE→NJ address update at AZ HR** (CPA flag) | self-service at AZ HR (not in personal email) | Alton | az-career / taxes | family-dashboard-2026-05-02:117 + BUSINESS:36 | team-lead (5-min Workday change) |
| 64 | P4 | **Chase business banking visibility** — alerts disabled or filtered; no inbox view of business cash | infrastructure (enable alerts to fix; not gather-fixable) | Alton | business / personal-financial | family-dashboard-2026-05-02:119 | team-lead (one-time enable) |
| 65 | P4 | **MKA Blackbaud / Magnus Health portal** — physical-form status lives in ad-hoc emails | infrastructure | n/a | family | family-dashboard-2026-05-02:120 | (passive; flagged as known blind-spot) |
| 66 | P4 | **Andy Stecker CPSO recruiting lead** — went cold 2026-03-17 (6+ wks ago). Decision: respond to open the conversation, or explicitly decline and close the loop. Was the most promising external opportunity in the pipeline. | needs Alton decision | Alton | az-career | business/az-career:19 | team-lead (closure decision; either route is fine but silence isn't) |

---

## Cross-domain conflicts (top 3)

These are the items where two or more domains compete for the same Alton-attention slot or Alton-dollar:

### Conflict A — AZ LTI transfer ↔ Fidelity → checking transfer ↔ CPA check-in (items #1, #2, #18)

These three are **a single coupled decision**, not three independent items. Sequencing matters:

1. **First: schedule JF call (#18)** — gate the other two. JF needs to model: tax-lot of any AZ LTI shares to be sold, basis of any Fidelity positions to liquidate for the cash transfer, AND how those layer on top of the W-2 ordinary income (which is now in the $288K–$432K base + STI + equity tier as Senior Medical Director).
2. **Then: stock-explorer scans Fidelity + AZ Equate Plus** (#2 + #1) — produce a positions/cash report and a transfer proposal. Cannot recommend a sale before JF has weighed in.
3. **Then: Alton decides amount and instructs both transfers**.

Failure mode if treated as parallel: stock-explorer recommends a Fidelity sale to fund the cash transfer, the sale triggers a short-term capital gain because of unfortunate lot selection, and JF has to clean it up at year-end. The team-lead should bundle these three items into a single chat surface, not drip-feed.

### Conflict B — Disney ADR window (5/17) ↔ Disney trip (7/16) ↔ Aneeta-RRE return (5/03) ↔ nanny search (#34)

Disney has been deferred since at least Apr 1 (per disney-july-2026:18 blocker). Alton has booked **nothing** — no flights, no hotel, no tickets, no shared Disneyland login. The ADR window opens **2026-05-17** = 15 days from today. Nicol cannot book Blue Bayou or character dining without preferences AND Alton has not provided his Disneyland login that Nicol asked for on 3/31.

Compounding pressure: the nanny search (#34) is also a "decide once and unblock daily life" item. Both are exactly the kind of decisions Alton tends to defer. The team-lead should NOT surface them in the same chat slot — pick one per Alton-attention session, not both.

Recommendation: Disney first (hard external 5/17 deadline), nanny second (no hard deadline, but unblocks every weekday). Aneeta returns 5/03 evening; first joint Disney decision conversation can happen Sun 5/03 night or Mon 5/04 AM with both parents present.

### Conflict C — Solar ITC 7/04 monitor (item #8/26/32) ↔ Lucent communication cadence ↔ JF check-in (#18)

The ITC ($131K credit + ~$373K bonus depreciation) requires:
- Solar system **owned by Solar Inference LLC** before in-service date (currently contracted in personal name per TAXES:127)
- System **placed in service before 2026-07-04**
- Lucent install must START ~early June to leave commissioning runway

Three separate failure modes converge:
1. **Lucent slips again** (3+ wk delay was the prior pattern; one engineering meeting on 4/30 is one signal point, not a trend)
2. **Personal → LLC contract transfer** is unresolved per TAXES:127 (Open Question #4 to JF)
3. **CPA confirmation** that the ownership transfer + the in-service date math actually trigger the credit in the right entity in the right tax year

The Mon 5/05 Lucent check-in (item #8) is the operational thread. The JF check-in (item #18) is the legal/tax thread. Both should happen this week. The executor should set a hard reminder for Wed 5/07: if neither has produced confirmation that Lucent is on track AND the ownership question is resolved, escalate to a "do we still believe in 7/04?" decision surface for Alton.

---

## Items routed to other agents

| Agent | Items |
|---|---|
| **stock-explorer** (in-spawn) | #1 AZ LTI, #2 Fidelity transfer, #36 Hiive/Anthropic, #37 Hiive/Kalshi-stack, #38 EquityZen Anthropic; possibly #41 NM Planning |
| **family-curator** | All items tagged "family-curator" in Routing column. Executor does NOT edit family/active-todos.md. |
| **team-lead** (surfaces to Alton) | All P0 items, JF check-in (#18), Disney bundle (#12/21/33), nanny decision (#34), AZ-career closures (#39/40/62/63/66), conflict bundles A/B/C |
| **executor** (this agent, internal-only) | Standing monitors: Solar ITC clock (#26/32), Sante Total IRS abatement timeout (#57), JF Q3-2026 990-EZ scoping prompt (#58); rank refresh on every Alton check-in |

---

## Open questions for team-lead (1 per the brief)

**Routing convention for items that span two agents.** Concrete example: item #2 (Fidelity → checking) needs stock-explorer to *propose* the transfer amount, but it needs team-lead to *surface* the proposal to Alton for the final yes. Currently I have it Routed: "stock-explorer (positions scan + transfer proposal); team-lead (Alton confirm)" — semicolon-separated dual-route. Is that the convention, or do we want a strict hand-off (stock-explorer produces a writeup that *only* team-lead may surface)? Also: where do stock-explorer's proposal writeups land — `projects/family-thread-dossier/financial-research/`? Or its own dir? This blocks me from operationalizing the financial items beyond P0 status.

## History

- 2026-05-02 v0.1 — todo-executor first turn. Built from family-curator's v2 dashboard (the heavy lift was done there) plus business/taxes/nonprofit/az-career layering. 4 out-of-band closures honored. Paper-check vendor allowlist applied. 66 items ranked, 8 P0, 10 P1, 15 P2, 26 P3, 7 P4. Three cross-domain conflicts surfaced. One open question to team-lead on dual-routing convention.
