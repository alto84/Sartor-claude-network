---
type: matter
matter: q2-2026-estimated-tax
status: open
risk: medium
priority: p1
opened: 2026-05-08
updated: 2026-05-08
last_action: 2026-05-08
deadline: 2026-06-15
authority: [IRC-6654, IRC-6654d1B, Reg-1.6654-1]
related: [TAXES, ALTON, ASTRAZENECA]
---

# Matter: Q2 2026 estimated tax payment

## Issue

Determine the Q2 2026 1040-ES estimated payment amount to maintain safe-harbor compliance under §6654, given the $160K wage increase from the AZ Senior MD role transition and any covered-call realizations from the [[1411-niit-covered-calls]] / portfolio re-structuring program.

## Facts

- TY2025 federal extension payment: $15K IRS + $3K NJ ($18K total), authorized 2026-04-14.
- Wage delta YoY: +$160K (AZ Senior MD role started ~2026-03-31).
- W-2 withholding lagged the wage increase per JF (2026-04-14 thread): "withholdings just don't keep up."
- Covered-call book actively being restructured (diagonal rolls, OOTM rewrites) — STCG/STCL realizations expected.
- Aneeta Neurvati transition mid-2025: dual W-2 pattern continues into 2026.

## Authority

- **IRC §6654**: Safe harbor — pay either (a) 90% of current year tax, or (b) 110% of prior year tax (if prior year AGI > $150K).
- **IRC §6654(d)(1)(B)(ii)**: Annualized installment method available if income uneven during year.

## Analysis

Two safe-harbor paths:

**Path A — 110% of TY2025 tax.** Prior year tax × 1.10, divided across four quarters. Q1 was Apr 15 (paid via extension). Q2 = Q3 = Q4 = remaining 75% / 3.

**Path B — 90% of TY2026 tax (current year).** Estimate full-year tax, pay 22.5% per quarter. Cleaner if current year tax will be substantially lower (e.g., big LLC pass-through loss, ITC carryforward).

For Sartor TY2026:
- AZ Senior MD wage ($288-432K band) + Aneeta Neurvati (~$194K W-2 last year, plausibly higher in 2026)
- LLC pass-through likely a LARGE loss in TY2026 (Solar ITC + bonus depreciation if [[solar-itc-48-vs-25d]] §48 path executes)
- Covered-call STCG/STCL — uncertain, depends on rolls executed

The Solar Inference loss + ITC could generate a significant 2026 tax credit/refund position. Path B (90% of current year) might allow much smaller payments — but only if confident in the LLC loss timing.

Path A (110% prior year) is the conservative safe-harbor. It will likely overpay, refund at filing.

### Risk grade: MEDIUM

Underpayment penalty risk if neither safe-harbor met. Penalty rate currently ~8% (federal short-term rate + 3%). On a few months of underpayment of $20-40K, penalty is $500-1500 — not catastrophic, but avoidable.

## Position

**Default to Path A (110% prior year).** Pay aggressively to lock safe harbor. If Solar ITC clearly lands in TY2026 and CPA confirms substantial credit position, can throttle Q3/Q4 payments down.

## Action items

- [ ] Pull TY2025 tax liability estimate from JF (extension paid $18K — what's projected total?).
- [ ] Calculate 110% safe harbor amount.
- [ ] Subtract YTD withholding through May 31.
- [ ] Subtract Q1 extension payment ($18K).
- [ ] Q2 amount = remaining safe harbor for first half / 2.
- [ ] Authorize JF to debit by 2026-06-15.

## CPA / counsel routing

- **Send to JF as**: email with Path A vs Path B choice question. Standard quarterly cadence.
- **JF deliverable**: dollar amount + debit authorization request.

## History

- 2026-05-08: Opened. Defer Q2 amount to JF.

## Resolution

(pending)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion.
