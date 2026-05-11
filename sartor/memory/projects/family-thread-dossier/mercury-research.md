---
type: research
entity: mercury-banking
updated: 2026-05-02
updated_by: mercury-explorer
status: research-only
priority: p2
tags: [research/mercury, domain/business, blind-spot/paper-checks, infra/banking-api]
related: [BUSINESS, solar-inference, sante-total, family/active-todos, paper-checks-blindspot, family-todos-longrunning-thread]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Mercury banking — API research for cash-flow visibility

> [!summary] Verdict
> Mercury's public API is genuinely capable (read transactions + balances, initiate ACH/wires/checks, webhooks for event-time delivery), free on all plans, and a clean fit for closing the bank-level half of the paper-check blind spot. The right pilot entity is **Solar Inference LLC** (currently invisible at Chase), not Sante Total. Recommended integration path: a **scheduled-task daily digest** first (lowest cost, validates API + value), with an **MCP server + webhook receiver** as a second-step upgrade if the digest proves useful. Biggest unknown that needs Alton's input before any build work: **does he want to actually move Solar Inference's primary banking from Chase to Mercury, or open a Mercury account in parallel and slowly migrate?** That choice changes everything downstream — recurring vendor ACH, the Climate First $438K solar loan autopay, the Chase Ink 7738 card, and the CPA's reconciliation workflow all live at Chase today.

## 1. Mercury API capabilities (verified)

Sources:
- [Mercury API docs welcome](https://docs.mercury.com/docs/welcome)
- [Mercury API marketing page](https://mercury.com/api)
- [Send-money endpoint reference](https://docs.mercury.com/reference/createtransaction)
- [Webhooks changelog](https://docs.mercury.com/changelog/webhooks-now-avaliable)

| Capability | Available? | Notes |
|---|---|---|
| List accounts | Yes | Read access via API key |
| List balances | Yes | Per-account |
| Read transactions | Yes | Full history per account; supports filters |
| Initiate ACH | Yes | `POST /api/v1/account/{accountId}/transactions` with `paymentMethod=ach` |
| Initiate domestic wire | Yes | Same endpoint, `paymentMethod=domesticWire`, `purpose` required |
| Issue paper check | Yes | Same endpoint, `paymentMethod=check` (Mercury prints + mails) |
| Card management | Partial | API exposes card spend; physical issuance flows via dashboard |
| Bill Pay | Yes — free on all tiers | Vendor + invoice-driven workflow |
| Recurring payments | Yes | Bill Pay supports schedules |
| Webhooks | Yes | Real-time event delivery, signed payloads, exponential-backoff retries; subscribe to specific event types or field paths |
| Sandbox | Yes | Documented in Getting Started; separate sandbox API key |
| Auth | HTTP Basic with API key as username, empty password (also OAuth2 for third-party apps) | `Authorization: Basic <base64(apiKey:)>` |
| Rate limits | Not published as numeric quota; 429 handling expected with backoff | |
| MCP | Beta MCP integration listed in docs | Mercury ships an official MCP — could short-circuit option (a) below |

**Notable**: Mercury supports **RTP, ACH, Wire, Check, and Virtual Card** as payment rails. The check rail is the load-bearing one for this thread — issuing a Mercury check via API replaces the hand-written Chase check entirely (Mercury mails it, the cleared event fires a webhook).

## 2. Pricing and account types

Source: [Mercury pricing](https://mercury.com/pricing) (verified 2026-05-02)

| Tier | Cost | API access |
|---|---|---|
| Mercury (Free) | $0/mo | Yes — full transaction + payment API |
| Mercury Plus | $29.90/mo ($23.95 annual) | Adds invoicing API (500 invoices/mo), expense reimbursements >5 users, NetSuite integrations |
| Mercury Pro | $299/mo ($239.90 annual) | Unlimited invoices, $0/txn ACH-debit invoicing |

- **No account minimums, no monthly account fees, no overdraft fees.** Free tier covers everything Solar Inference would need at current scale.
- **ACH and domestic wires are free** on all plans (with internal limits). Bill Pay is free.
- **International**: 1% FX on non-USD wires, or $15 flat for intermediary coverage.

**Eligibility** (source: [Mercury support — eligibility](https://support.mercury.com/hc/en-us/articles/28770467511060-Eligibility)):
- US-formed company with US operations and a US/international physical address (no PO boxes, no registered-agent addresses).
- Excluded business types: money services businesses, adult entertainment, cannabis, internet gambling.
- **Solar Inference LLC qualifies cleanly** — NJ multi-member LLC at 85 Stonebridge Rd with EIN 39-4199284.
- **Sante Total** is a 501(c)(3) — Mercury does not list nonprofits in their public eligibility excerpt, but they are not in the excluded list either. Verdict: **possibly fine, requires direct confirmation with Mercury support before committing.** Holdings and other guides commonly recommend community/local banks for restricted-fund nonprofits, so Sante Total is not an obvious Mercury fit anyway.

## 3. Fit with Alton's situation

### Current banking topography (per memory)

| Entity | Current banking | API-visible to Sartor today? |
|---|---|---|
| Personal (Alton + Aneeta) | Chase (checking, Sapphire 9425, Sapphire Reserve replacement) | Partial — Chase email alerts surface in Gmail; no programmatic API |
| Solar Inference LLC | **Chase business checking + Chase Ink 7738 ($6K limit)** | **No.** Zero Gmail signal — flagged blind spot in `solar-inference.md:103` and `family/active-todos.md:158` |
| Sante Total | PayPal donations + (per memory) bank account setup pending or in flight | Partial — PayPal donor emails are visible in Gmail |
| 185 Davis | Leader Bank mortgage; rental income flows through 1040 Schedule E | Mortgage 1098 hits Gmail annually |
| Climate First Bank | $438,829 solar loan, 366mo, 8% APR | Loan disbursement events email-visible (e.g. 3/15 $219K draw) |

### Where Mercury would be a clean win

- **Solar Inference LLC is the obvious pilot.** It's the ONLY entity with a documented "no inbox visibility" blind spot. The Chase business banking is invisible to the curator pipeline today — any time the Ink 7738 is charged, vendor ACH leaves, or business checking moves, Sartor learns nothing until tax season. Mercury's API + webhooks would close that gap event-time.
- **Pre-revenue posture means low switching cost right now.** The longer the LLC operates at Chase with vendor ACH, autopay, and CPA reconciliation patterns built around Chase statements, the more painful any future migration becomes. The Climate First $438K loan autopay is the single highest-stakes recurring item; that one needs deliberate handling.
- **Mercury's check rail is the pivot.** Today Alton hand-writes paper checks (Wohelo $12,900, 185 Davis $2,253 in mail per today's resolutions). Mercury Bill Pay would let him **issue checks via API or dashboard**, Mercury prints + mails them, and the cleared-check event fires a webhook. That converts a hand-written paper check into a digital event the curator can ingest at write-time *and* at clearing-time — closing both halves of the blind spot for the LLC.

### Where Mercury is NOT a fit

- **Personal Chase banking.** Mercury is business-only. Alton's personal hand-written checks (which is the actual category that broke today — Wohelo and the Davis mortgage payment are personal, not LLC) cannot move to Mercury at all. Closing the personal-check blind spot needs a different solution (Plaid against Chase personal, Chase aggregator, or simply changing payment habits to Bill Pay through Chase or a third-party like Melio).
- **Sante Total nonprofit.** 501(c)(3) eligibility is unconfirmed and most nonprofit-banking guides recommend local/community banks with explicit nonprofit experience. Restricted-fund segregation (the open todo on `sante-total.md`) is also more conventionally handled by sub-accounts at a traditional bank. Skip Mercury here.

## 4. Integration paths

### Option A — Build a Mercury MCP server

**Pros:** Tools like `mcp__mercury__list_transactions`, `mcp__mercury__get_balance`, `mcp__mercury__send_ach` available to any future Claude Code session interactively. Aligns with the Sartor MCP-first pattern (gdrive, gmail, calendar are all MCP-driven today). Mercury already ships a beta official MCP — **possibly no build required, just registration**.

**Cons:** MCPs are pull-time, not push-time — they don't close the latency gap on cleared-check events unless paired with a poll loop. MCP discovery only fires when a Claude session is alive and using the tool.

### Option B — Scheduled-task daily digest (recommended starting point)

A `mercury-cashflow-gather` task on Rocinante runs daily (e.g. 6 AM ET), polls Mercury API for the last 24h of transactions and current balances, writes a structured digest to `inbox/rocinante/mercury-cashflow-YYYY-MM-DD.md`. Curator drains into `business/solar-inference.md` "Latest cash activity" or a new `business/cashflow.md`.

**Pros:** Lowest implementation cost (~1 PowerShell script + 1 Scheduled Task, mirrors existing UniFi backup and gdrive patterns). Validates API + value with one day of work. No webhook public-endpoint requirement (Rocinante is behind NAT). Daily cadence is sufficient for the cash-flow blind spot — Alton doesn't need second-by-second visibility.

**Cons:** 24h latency. Misses webhook-only signals (e.g., real-time fraud alerts).

### Option C — Webhook-driven event-time inbox writes

Mercury POSTs to a public HTTPS endpoint when transactions hit specific events (created, sent, cleared, failed). A small webhook receiver writes per-event to `inbox/rocinante/`.

**Pros:** Event-time, not poll-time. Closes the cleared-check half of the blind spot at the latency Mercury can deliver.

**Cons:** Requires a public HTTPS endpoint — Rocinante would need either Cloudflare Tunnel, ngrok-permanent, or a $5/mo VPS. Signature verification and replay protection add code surface. Higher operational complexity than option B for first dollar of value.

### Recommended path

**Start with Option B (daily digest) → if it earns its keep over 2–4 weeks, layer Option C (webhooks) for the cleared-check rail → register/wrap Option A's official MCP for interactive sessions.** This sequences cost behind value: the digest is a 1-day build that proves the API surface + the Sartor curator pipeline can ingest banking data; webhooks add latency reduction only after the foundation is real.

## 5. Blind spots Mercury would close vs. would NOT close

### Closes (assuming Solar Inference LLC moves to Mercury)
- ACH out / in confirmations (event-time via webhook, T+0 via daily digest)
- Wire confirmations
- Card transactions on Mercury-issued cards (Ink 7738 would need to be replaced with a Mercury card)
- Recurring payments via Bill Pay
- **Cleared-check events** — when a check Mercury mailed (or even one written from Mercury check stock) is deposited and clears, Mercury fires the event
- Per-vendor recipient ledger — Mercury surfaces recipient identities in transactions; today Chase emails do not

### Does NOT close
- Hand-written checks off the **personal Chase account** (today's actual failure category — Wohelo, 185 Davis personal payment). Mercury is business-only.
- In-person meetings (Lucent solar engineer today)
- Cash transactions
- Non-Mercury card transactions (any personal card; any business card not issued by Mercury)
- Texts, calls, in-person handoffs that don't generate any electronic trail

### Mercury Bill Pay as an alternative to hand-written checks (Solar Inference only)

For LLC payments, Mercury Bill Pay would let Alton avoid hand-writing checks entirely:
- Add vendor (e.g. Lucent Energy, Power Mac, Berman Home Systems) as a recipient
- Schedule payment via API or dashboard
- Mercury sends ACH if vendor accepts; otherwise prints + mails check
- Webhook fires on send + clearing events
- All recipients persist as a queryable ledger

This would not address personal-check blind spots (Wohelo, etc.) — those need a separate solution.

## 6. Switching cost — moving Solar Inference from Chase to Mercury

Items that would need explicit handling:

| Item | Current state | Migration complexity |
|---|---|---|
| Climate First $438K solar loan autopay | Set up against Chase business checking (assumed; not yet confirmed in memory) | **High.** Verify destination account; reroute autopay; confirm no late payment risk during transition |
| Recurring vendor ACH | Lucent Energy received $219,414.50 from Climate First (not LLC) on 2026-03-15. Other vendor ACH posture unknown. Likely low to moderate volume given LLC is pre-revenue | Low–moderate. Audit existing vendor ACH setups |
| Chase Ink 7738 card | $6K limit, business card. Per `BUSINESS.md:138`, NOT used for the $37,810 Newegg workstation purchase (went on personal Visa 5680 + 9425) | **Reissue as Mercury card OR keep both.** No autopay risks since card isn't carrying recurring charges per memory |
| Payroll | None — Alton and Aneeta as 50/50 members take guaranteed payments / draws via K-1, no W-2 payroll | None |
| Accounting software hookup | CPA Jonathan Francis works from CSV/PDF statements per typical pattern; no QuickBooks Online integration documented | Low. Mercury exports CSV and integrates with QBO/Xero/NetSuite if added later |
| LLC-name on account | Chase business checking is in Solar Inference LLC name | New Mercury account opens cleanly in LLC name with EIN 39-4199284 |
| CPA's reconciliation workflow | Unknown — Jonathan Francis hasn't been asked. **Worth confirming before migration** | Moderate — CPA preference matters |

**Net assessment:** Switching cost is real but bounded. The LLC is pre-revenue, has minimal recurring vendor ACH, no payroll, and the loan-autopay rerouting is the only truly high-stakes item. A **parallel-account approach** (open Mercury, run small flows through it for 2-3 months, leave Chase as the loan-autopay account, then migrate the loan when confidence is high) sidesteps the only meaningful risk.

## 7. Open unknowns / questions for Alton

1. **Migration vs. parallel.** Move Solar Inference primary banking to Mercury, or open Mercury in parallel and route specific flows through it (e.g. Bill Pay only)?
2. **Climate First loan autopay** — is the destination account Chase business checking, Chase personal, or directly debit-funded? Memory doesn't say. This is the single highest-stakes recurring item to map before any migration.
3. **CPA preference.** Jonathan Francis has not been asked. He could veto the migration if his reconciliation workflow depends on Chase statement formats.
4. **Personal Chase visibility** — closing the LLC blind spot leaves the personal check blind spot wide open (which is what bit today). Does Alton want a parallel investigation into Plaid + Chase personal, or a behavioral fix (use Chase Bill Pay or a service like Melio for personal checks)?
5. **Sante Total bank-account setup** is an existing open todo on `sante-total.md` (priority HIGH). If Alton is going to evaluate Mercury anyway, the Sante Total decision is worth confirming explicitly: most guides recommend a local/community bank for nonprofits with restricted funds, so Sante Total is **likely NOT a Mercury fit** — but worth a yes/no.
6. **MCP-first or scheduled-task-first?** Mercury's official MCP is in beta; if it's stable enough, registering it might be cheaper than building Option B. Worth a 30-min eval before committing to a build path.

## 8. Recommended next steps (research-only — no build yet)

1. Alton confirms which entity (Solar Inference LLC, full migration vs parallel) and which integration path (B → C → A sequence vs MCP-first).
2. Confirm Climate First loan autopay debit account — read Climate First statement or Gmail for the disbursement records.
3. 30-minute eval of Mercury's official MCP beta — if it works against the sandbox, it bypasses option (a)'s build entirely.
4. Ask CPA Jonathan Francis whether he has any objection to Solar Inference operating across two banks during a parallel period, and whether Mercury statements work in his reconciliation workflow.
5. Open a Mercury sandbox account to verify API behavior end-to-end before any production decision.

## Sources

- [Mercury API docs welcome](https://docs.mercury.com/docs/welcome)
- [Mercury API marketing page](https://mercury.com/api)
- [Send-money endpoint](https://docs.mercury.com/reference/createtransaction)
- [Webhooks changelog](https://docs.mercury.com/changelog/webhooks-now-avaliable)
- [Mercury pricing](https://mercury.com/pricing)
- [Mercury eligibility](https://support.mercury.com/hc/en-us/articles/28770467511060-Eligibility)
- [Mercury LLC banking](https://mercury.com/llc-banking)
- [Mercury FAQ](https://mercury.com/faq)

## History

- 2026-05-02 — Created by mercury-explorer subagent under team `family-thread`. Research-only; no build directive. Triggered by Alton's "I'm starting to wonder about managing a Mercury account that has its own API" + today's four-RED-item resolution-out-of-band that exposed the paper-check blind spot.
