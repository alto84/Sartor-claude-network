---
entity: paper-check-vendors
type: reference
date: 2026-05-02
updated: 2026-05-02
updated_by: family-curator (family-thread, Opus 4.7 1M context)
status: active
priority: p2
tags: [domain/family, household/finance, pipeline/personal-data-gather, behavior/dashboard]
related: [feedback/paper-checks-blindspot, feedback/gather-respects-out-of-band-closures, feedback/always-check-paper-check-vendors-before-flagging-red, family/active-todos, family-todos-longrunning-thread]
aliases: [Paper Check Vendors, Out-of-Band Vendors, Paper-Only Vendors]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Paper-check vendors — canonical reference

Vendors and recipients who only resolve out-of-band — paper checks (postmarked and mailed), in-person handoffs, or phone confirmations. The `personal-data-gather` Gmail+Calendar pipeline is structurally blind to all three: there is no email or calendar artifact to mark closed.

This file exists so:

1. The pipeline (per [[feedback/gather-respects-out-of-band-closures]]) can pre-soften flags for known paper-check vendors before emitting them.
2. Future Claude sessions (per [[feedback/paper-checks-blindspot]]) can ASK Alton "is this already in the mail?" instead of escalating to RED.
3. We accumulate institutional knowledge about how each recipient prefers to be paid, so we don't relitigate the payment method each cycle.

## Confirmed vendors (as of 2026-05-02)

| # | Vendor / recipient | Contact | Payment method | Typical amount | Frequency | Last confirmed | Source |
|---|---|---|---|---|---|---|---|
| 1 | **Bill (heating)** | No known email — in-person handoff only. Contact details TBD; ask Alton next time we need to reach him outside a service call. | Paper check, in-person handoff (preferred — Bill explicitly prefers paper). NOT remediable by Alton sending a confirmation email; this vendor is structurally invisible to gather forever. | TBD (likely $hundreds, not $thousands, for routine service) | Service-call basis (irregular; appears when something breaks) | 2026-05-02 (Alton confirmed paid this cycle, in person) | [[family/active-todos]] line 41 (added 2026-04-17 after outdoor pipes broke / heating issue surfaced); resolution captured in §"2026-05-02 Alton check-in" |
| 2 | **Wohelo Camps** (Vishala summer camp) | Heidi Gorton, heidigorton@gmail.com / heidi@wohelo.com (Director, Little Wohelo Camp) | Paper check to: Wohelo Camps, 25 Gulick Road, Raymond, ME 04071 | $12,900 (full tuition) or $500 (deposit only) | Annual (camp season) | 2026-05-02 ($12,900 check in mail, postmarked) | [[family/active-todos]] §"2026-05-02 Alton check-in"; instructions thread 2026-04-13 (line 60–69) |
| 3 | **185 Davis Condo Board** (FY26 assessment + retaining wall + future fuel/boiler) | Charlotte Rice (trustee), charlotterice@gmail.com | Paper check (lump sum chosen 2026-05-02; installment plan would have been $563.28/mo May–Aug) | $2,253.13 (lump sum, this cycle); future: ~$375 fuel-overage (June 30), ~$10,237 boiler tank if approved | Per-assessment, irregular | 2026-05-02 (lump-sum check in mail, postmarked) | [[family/active-todos]] §"2026-05-02 Alton check-in"; Charlotte Rice email 2026-04-27 (line 1099–1109) |

## Future-extension fields (populate as we learn)

For each vendor, capture over time:

- **Payable-to exact name** (legal name on the check; matters for delivery)
- **Mailing address** (full, with ZIP+4 if known)
- **Lead time from mailing → cleared** (set realistic expectation for "is it really paid?")
- **Whether they send a paper receipt** (closes the loop for the audit trail)
- **Any digital alternative they accept** (Zelle, Venmo, ACH) even if they prefer paper
- **Amount-history table** (so we can detect anomalous invoices)

## How to update this file

- When Alton confirms a NEW out-of-band closure for a vendor not already listed: append a row, bump `updated:` and `updated_by:`, and link the active-todos line that triggered it.
- When a known vendor's contact info changes (new property manager, new camp director): UPDATE the existing row, do not duplicate.
- When a vendor is RETIRED (no longer used): leave the row, add a `**RETIRED YYYY-MM-DD**` annotation in the Source column. The historical record is useful when an old invoice resurfaces.

## Vendors NOT in this file (and why)

- **Pool Guyz LLC** (`Thepoolguyznj@gmail.com`) — pays via Zelle, NOT paper. Visible to gather as soon as Zelle confirmation hits Gmail. NOT a blind-spot vendor.
- **Tribeca Pediatrics** — pays via InstaMed portal, generates email receipt. NOT a blind-spot vendor (resolved Apr 13 with visible receipt).
- **Chase / autopay vendors** — visible via Chase email alerts (when enabled). Currently a partial blind spot (alerts disabled per active-todos:147), but the fix is enabling alerts, not adding to this file.
- **Jonathan Francis (CPA)** — pays via ACH debit authorization in email. Visible to gather. NOT a blind-spot vendor.

## Cross-references

- [[feedback/paper-checks-blindspot]] — human-facing rule (ASK before escalating)
- [[feedback/gather-respects-out-of-band-closures]] — pipeline-facing rule (don't re-emit closed items)
- [[family/active-todos]] — live dashboard that this file de-noises
- [[family-todos-longrunning-thread]] — meta-frame for the family-thread session that created this file

## History

- 2026-05-02 — Created by family-curator at team-lead's instruction during the family-thread session that produced the family dashboard v2 and the gather-respects-out-of-band-closures feedback rule. Three confirmed vendors at creation (Bill, Wohelo, 185 Davis), all surfaced by Alton's same-day out-of-band resolution check-in.
