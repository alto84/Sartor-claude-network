---
type: domain
entity: kids-ledger
updated: 2026-04-10
updated_by: Claude
status: active
tags: [domain/family, entity/person, meta/ledger]
aliases: [Kids Ledger, Kids Allowance, Allowance]
related: [FAMILY, ALTON]
---

# Kids Ledger

Running ledger for the three children. This is "the family bank" — kids give Alton money for safekeeping, and he tracks it here. Also tracks allowance, chores, birthdays, and other credits/debits. Physical cash rarely changes hands — the ledger IS the account.

> [!note]
> This is an informal household ledger, not a real bank account. Balances are tracked in whole dollars for simplicity. When a kid gives Alton cash to hold, it's logged as a "deposit" (credit). When they want it back or spend it, it's a "withdrawal" (debit).

## Current Balances

| Child | Balance | Last Activity |
|-------|---------|---------------|
| [[FAMILY#Vayu|Vayu]] (age 10) | **$10.00** | 2026-04-09 |
| [[FAMILY#Vishala|Vishala]] (age 8) | $0.00 | 2026-04-09 |
| [[FAMILY#Vasu|Vasu]] (age 4) | $0.00 | 2026-04-09 |

## Transaction History

### Vayu (age 10)

| Date | Description | Amount | Running Balance |
|------|-------------|-------:|----------------:|
| 2026-04-09 | Initial credit (ledger opened) | +$10.00 | $10.00 |

### Vishala (age 8)

| Date | Description | Amount | Running Balance |
|------|-------------|-------:|----------------:|
| 2026-04-09 | Ledger opened, zero balance | $0.00 | $0.00 |

### Vasu (age 4)

| Date | Description | Amount | Running Balance |
|------|-------------|-------:|----------------:|
| 2026-04-09 | Ledger opened, zero balance | $0.00 | $0.00 |

## How to use this file

- **Adding a credit:** append a row to the child's transaction table, compute the new running balance, update the "Current Balances" table at the top, and bump `updated:` in the frontmatter.
- **Adding a debit:** same as credit but negative amount.
- **Reading a balance:** check the "Current Balances" table. If you need history, check the per-child transaction table.
- **Month-end reconciliation:** run through each child's transactions, verify running balances match the top-of-file totals, note any discrepancy.

## Rules

- Every transaction needs a date, description, amount, and new running balance.
- Never delete a past transaction — add a correction row instead.
- Use whole dollars. If you need cents, use them sparingly (e.g., interest or returned change).
- Vasu is 4 and probably can't track his own balance yet — treat his section as parent-managed only.

## Related
- [[FAMILY]] — household details, including kid ages and schools
- [[ALTON]] — primary ledger keeper

## History
- 2026-04-09: Ledger created. Opening balances: Vayu $10, Vishala $0, Vasu $0. Initial $10 credit to Vayu recorded as first transaction.
