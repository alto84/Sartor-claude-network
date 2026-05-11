---
type: research
entity: financial-positions
updated: 2026-05-02
updated_by: stock-explorer
related: [ALTON, BUSINESS, TAXES, ASTRAZENECA, family/active-todos]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Financial Positions Inventory — 2026-05-02

First-turn dossier produced by the spawn of `stock-explorer`. Read-only survey of what we know from existing memory + the live `dashboard/family/finances.json` (snapshot 2026-02-21, ~10 weeks stale). Every number below should be re-verified by Alton against the actual brokerage UI before any action.

## Source files reviewed

- `ALTON.md` (3-day-old auto-memory warning)
- `BUSINESS.md` (Solar Inference, Sante Total, 185 Davis rental)
- `TAXES.md` (13-day-old; TY2025 extension status, CPA Jonathan Francis)
- `ASTRAZENECA.md` (14-day-old; comp band, AZ Q1 2026 Fidelity statement)
- `family/active-todos.md` lines 20-95 + GOOGL deadline at line 132
- `dashboard/family/finances.json` (snapshot 2026-02-21 — STALE, but the only quantitative ledger we have)
- Skills already in scope: `options-analysis`, `market-snapshot`, `weekly-financial-summary`, `tax-estimate`

## Position inventory by category

### A. Post-tax brokerage (the cash-transfer source)

From `finances.json` 2026-02-21:

| Account | Balance | Notes |
|---|---|---|
| Alton Post-Tax Fidelity / Combo | $747,946 | The likely source for the founding-use-case Fidelity → main accounts transfer |
| Chase bank combo | $41,365 | The likely *destination* — primary checking |

Total post-tax liquid: **$1,319,520** (per the snapshot — *includes* the combo line; verify breakdown in Fidelity directly).

The "Combo" naming is ambiguous. We do NOT know from memory: how much of the $747K is cash/MMF vs equities vs options collateral, and whether margin is in use. **This is the single biggest information gap blocking the Fidelity-transfer staging.**

### B. AstraZeneca LTI / Savings & Investment Plan

- AZ Savings and Investment Plan, Q1 2026 statement available at Fidelity NetBenefits as of 2026-04-17 (`ASTRAZENECA.md` line 119, `active-todos.md` line 549). Unread.
- Career-band comp **$288K-$432K base + STI + equity** (`ASTRAZENECA.md` line 30). The "equity" is the LTI grants — RSU/PSU/option packages. Vendor is **almost certainly Equate Plus** (Computershare's AZ-branded portal); historically AZ has used Equate Plus for global LTI and switched to Solium for some US grants in earlier years. Memory does not record which vendor holds which grant year — this needs a direct check with Alton or AZ Total Rewards.
- "Alton AZ savings (Mix post-tax, IRA, ROTH)" balance $164,366 in `finances.json`. This is likely the 401(k) plan, NOT the LTI grants. LTI shares typically sit in a separate Equate Plus / Solium account, not the Fidelity-administered 401(k).

What's missing from memory:
- Which LTI grants are vested vs unvested
- Cost basis per grant year (matters because long-term cap gains treatment depends on holding period from vest date)
- Current FMV of the unrestricted vested shares
- Whether ESPP shares are co-mingled in the same account
- Any 10b5-1 plan or trading-window constraint Alton is under as a Senior Medical Director (probably not, but check)

### C. Open options position — GOOGL

Single position in memory:

- **20 short call contracts, GOOGL May $285C**
- Stock at $317 as of `active-todos.md` write
- ~**$49.5K underwater** (intrinsic loss on 20 contracts × ($317 - $285) × 100 = $64K intrinsic; the $49.5K figure presumably nets the premium received)
- Deadline callout 2026-05-01 in `active-todos.md` line 131-132: *"Let time value decay through late April, then roll up-and-out before May 15 expiry. Decision window: late April when gamma accelerates."*
- Today is **2026-05-02** — we are PAST the late-April decision window. This is now a **2-week-to-expiry** position with all the gamma sitting on top of it. The roll decision has slipped.

Required next step: invoke `options-analysis` skill with current GOOGL price + IV to get Greeks and stage the roll candidates (e.g., $290C / $300C / $310C at June or July expiry).

### D. Pre-IPO / private market opportunities

From the gather feed:
- **EquityZen** — Georgia Edwards (georgia.edwards@equityzen.com) requested a catch-up week of 2026-04-21 to source pre-IPO companies. **Open ACTION_REQUIRED** in `active-todos.md` line 527. Specific opportunities flagged: **Scale AI (SCAI)** Apr 11, **Anthropic** watchlist reconfirmation 2026-04-29.
- **Hiive** — **Harvey AI** ($190M ARR, ~90% growth in 6 months) flagged 2026-04-29.
- **Kalshi** — flagged Apr 30 with a deadline; not pursued in the active-todos triage. Status TBD per the dossier brief.

These are research signals only. No staged trades.

### E. Equity holdings of note (litigation surface)

- **BIOGEN INC. SECURITIES LITIGATION** — class action notice received 2026-04-18 from National Financial Services LLC (Fidelity). Alton holds Biogen shares in Fidelity brokerage. Decision: read notice, decide whether to opt in. No urgent deadline stated. (`active-todos.md` line 535)

### F. IRAs / Roth (background, not action)

- Backdoor Roth conversions for Alton + Aneeta **DONE 2026-04-14** (`active-todos.md` line 62, `ALTON.md` line 123).
- Both Roth accounts now hold the converted $7K each. Form 8606 will be CPA-handled at Oct 2026 filing.
- No action items in this category.

### G. Anthropic equity

- `finances.json` carries an "anthropic_equity" line: **$484,200 estimated**. Source/instrument not specified — could be EquityZen secondary purchase, could be a watchlist projection. **Verify with Alton** — this is a large number to leave unsourced.

## Top 3 decisions Alton needs to make this week

1. **GOOGL May $285C — roll now, not later.** The original "late April when gamma accelerates" plan is past. Two weeks to expiry on 20 deep-ITM short calls. Choices: (a) close at the loss, (b) roll up-and-out (e.g., to June $300C), (c) accept assignment if cash/share inventory supports it. This is the most time-sensitive item on the entire dashboard.

2. **AZ LTI transfer — initial scoping call with CPA.** Don't initiate the transfer yet. Step 1 is a 15-minute call with **Jonathan Francis** to align on (a) which LTI lots to move first, (b) cost-basis preservation across the transfer (Equate Plus → external broker can sometimes lose lot detail), (c) capital-gains-budget for TY2026 given the $160K wage increase already pushing this year's bracket. The active-todos line 51 "Check in with JF on taxes" item already exists — fold the LTI sequencing into that conversation.

3. **Fidelity → main accounts cash transfer — sizing.** Need to confirm: (a) how much cash needs to clear in Chase to cover the $12,900 Wohelo + $2,253 Davis condo paper checks already in the mail (~$15.2K minimum + buffer for normal monthly burn — `finances.json` shows monthly_gap of -$13,270, so burn is real); (b) whether the transfer source is cash already in Fidelity vs. requires a sale (sale = tax-lot question). Default recommendation: **transfer $25K cash from Fidelity SPAXX/cash sweep to Chase**, no security sales, no tax consequence. Confirm available cash balance first.

## The one piece of context most needed

**A current Fidelity positions screenshot or export.** Specifically: (a) the Combo account's cash vs. equity vs. options breakdown, (b) the GOOGL short-call line with current IV and time-value remaining, (c) the AZ Savings & Investment Plan vs. any separate Equate Plus / Computershare LTI account. Without this, every staging recommendation is built on the 2026-02-21 dashboard snapshot, which predates the role change, the Roth conversions, and ~10 weeks of market movement.

If Alton can drop screenshots into the family-thread (or paste account positions), this dossier can be revised in one turn into a concrete, Greek-grounded roll proposal for GOOGL and a specific dollar amount for the cash transfer.

## Skills ready to invoke once data lands

- `options-analysis` — GOOGL May $285C with current spot + IV
- `market-snapshot` — full portfolio table once positions are exported
- `tax-estimate` — re-run with the new TY2026 wage tier ($160K increase per CPA Apr 14) + projected LTI sale gain to size the transfer-window
- `weekly-financial-summary` — schedule for Friday after this week's GOOGL decision lands

## Coordination notes

- `todo-executor` (sibling agent being spawned same turn) needs to know that the **GOOGL roll is the highest-time-sensitivity item across all domains** — outranks family logistics for this week.
- Defer to **CPA Jonathan Francis** on every realized-gain decision. Constitution Domain 4 + `.claude/rules/financial-research.md` are explicit: no trade execution, no specific recommendations, analytical support only.
- All numbers above carry the caveat that the only quantitative source is a snapshot dated **2026-02-21**, which is now 70 days old.
