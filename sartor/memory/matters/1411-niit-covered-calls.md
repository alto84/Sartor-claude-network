---
type: matter
matter: 1411-niit-covered-calls
status: open
risk: low
priority: p3
opened: 2026-05-08
updated: 2026-05-08
last_action: 2026-05-08
deadline: continuous
authority: [IRC-1411, IRC-1234, Reg-1.1411-4, Reg-1.1234-1]
related: [TAXES, ALTON]
---

# Matter: §1411 NIIT on covered-call closes (recurring)

## Issue

Track and minimize §1411 NIIT (3.8% surtax on net investment income) drag on the recurring covered-call book restructuring program.

## Facts

- Joint margin account at Fidelity carrying ~$1.6M long stock + extensive short call book.
- Active program of diagonal rolls, OOTM rewrites, deep-ITM closes (per portfolio analysis 2026-05-06 / 2026-05-08).
- Combined federal LTCG 20% + NIIT 3.8% + NJ 8.97-10.75% = ~32-34% on LTCG.
- Combined federal STCG up to 37% + NIIT 3.8% + NJ ~10% = ~50% on STCG.

## Authority

- **IRC §1411**: 3.8% NIIT on lesser of net investment income or MAGI over $250K MFJ.
- **IRC §1234**: Options held by non-dealers — character determined at closing.
- **IRC §1234(b)**: Treatment of grantor of options. **Short-call closes always produce STCG/STCL regardless of holding period** (the option leg is considered closed by the writer at expiration/buyback).
- **Treas. Reg. §1.1411-4**: NII includes capital gains, dividends, interest. Yes to all of these for Sartor.
- **§1234A**: Termination of certain rights or obligations — applies to closing positions; gain/loss from closing a short call (by writer) is capital gain/loss.

## Analysis

Sartor's covered-call closes generate two character types:

1. **Short-call buyback**: Always STCG/STCL to the writer regardless of how long the short was open (§1234(b)). Subject to ordinary income rates (37%) + NIIT (3.8%) + NJ (10.75% top) = ~51%.

2. **Stock assignment via short call exercise**: Underlying stock holding-period determines character. Most Sartor longs (GOOGL, NVDA, etc.) are clearly long-term. Stock gain from assignment: LTCG (20%) + NIIT (3.8%) + NJ (10.75%) = ~34.5%.

The diagonal-roll strategy from the 2026-05-08 portfolio analysis specifically extracts cash via short-call buyback + new short-call open. The buyback is taxable; the open is not.

For each diagonal roll:
- Cost basis on close = original premium received - buyback price = STCG or STCL
- New short-call open = no realization event
- Cash extracted = (new premium received) - (buyback paid). The buyback portion has tax character; the new premium is held untaxed until that position closes.

If the buyback shows an STCL: that loss offsets STCG and (limited to $3K) ordinary income. Useful for harvesting.

If the buyback shows STCG: drag of ~51% combined rate.

### Risk grade: LOW

Compliance risk negligible. Position drag is the issue. Strategy is to:
- Bias closes toward STCL realizations (where positions are underwater)
- Minimize unnecessary closes that would generate STCG
- Time STCG realizations into years with offsetting losses (e.g., big LLC pass-through loss in TY2026 if [[solar-itc-48-vs-25d]] §48 path executes)

## Position

**Continue active management of the book. Pair STCG realizations with TY2026 LLC loss offset where possible. Track STCG/STCL realizations against quarterly estimated tax obligations.**

## Action items

- [ ] No standing action — recurring monitor.
- [ ] Quarterly: aggregate STCG/STCL from realized closes; flag if material.
- [ ] At year-end: position against TY2026 LLC pass-through loss for offset.
- [ ] If a single realization > $50K STCG: flag to JF for estimated-tax adjustment.

## CPA / counsel routing

- **Send to JF as**: quarterly aggregate, not per-trade.
- **JF deliverable**: estimated tax estimate adjustment if realizations are material.

## History

- 2026-05-08: Opened. Continuous monitor.

## Resolution

(continuous)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion.
