---
type: matter
matter: portfolio-restructure-2026-05
status: open
risk: medium
priority: p1
opened: 2026-05-31
updated: 2026-05-31
last_action: 2026-05-31
deadline: 2026-12-31   # TY2026 STCL-harvest window; §1259/§1092 governance memo should precede Q3 activity
authority: [IRC-1092, IRC-1259, IRC-1234, IRC-163d, IRC-469, IRC-1411, Reg-1.1012-1c, Reg-1.1411-4]
related: [1411-niit-covered-calls, solar-itc-48-vs-25d, 469-material-participation, TAXES, ALTON, BUSINESS]
---

# Matter: Fidelity options-book restructure (TY2026)

## Issue

Restructure the Fidelity Joint WROS margin book to (a) restore upside cap given up to the covered-call overlay, (b) harvest the one §1092-clean STCL, (c) unblock CPA-gated tax decisions, **without** consuming the tax-free liquidity carry (the $850K margin loan + theta harvest that lets Alton pull cash out without realizing gains).

Stated frame (Alton, 2026-05-23): *"a way for me to take money out tax free, get theta, and find some upside."*

## Data provenance

- **Snapshot:** `C:\Users\alto8\Downloads\Portfolio_Positions_May-23-2026.csv` (2026-05-23 15:29 ET). **8 days stale as of 2026-05-31** — prices/marks have drifted; **re-export before executing any trade.**
- **Analysis:** workflow `wf_cdeff7ab-7c6` (2026-05-23), 35 subagents, 5 lenses, adversarial verify pass. 29 candidates → 6 confirmed.
- Theta computed via BSM (r=4.5%, q=0), IV implied from market price per leg. Net book theta **+$789/d** before margin interest, **+$649/d** after $140/d interest on $850K @ 6%.

## Account state (2026-05-23)

- Long stock gross ~$2.547M; net short option liability ~-$809K; margin debt -$850,121.66 @ ~6%; net equity ~$888K; gross leverage 2.85x.
- Largest longs: GOOGL 2,466 sh ($944K, +$485K unreal), NVDA 2,651 sh ($571K, +$305K), CRWV 2,935 sh ($310K, **-$12K** ← only loss-position long), TQQQ 2,234 sh ($174K, +$138K), NBIS 705 sh ($151K, +$85K).
- Illiquid Anthropic ~$199K personal basis — unhedgeable via listed options, out of scope here. See [[reference_anthropic_shares]].

## Analysis — the §1092 finding (load-bearing)

The dominant constraint is **IRC §1092 straddle deferral.** A STCL realized on buying back a short call is **deferred to the extent of unrealized gain on the offsetting long stock.** Almost every short call in the book sits against appreciated stock, so ~$220K of nominal STCL is **suspended until the underlying stock sells** (which Alton is not doing) — it is a basis-carry item, not a TY2026 shield.

**The only large STCL that escapes §1092** is on **CRWV**, because CRWV stock is at an *unrealized loss* (-$12K), not a gain — no offsetting gain to trigger deferral. That makes the CRWV roll the single clean harvest in the book.

Separately, three positions are **synthetic shorts on appreciated stock** (delta ~1.0, minimal time value) and may already have triggered **§1259 constructive-sale** recognition at opening:
- NVDA Jan15-27 $50C × -13 (mark $169 / $165 intrinsic; $3.67 extrinsic)
- TQQQ Jan15-27 $26C × -9 (mark $51.70 / ~$52 intrinsic)
- TSLA Jun17-27 $110C × -2 (mark $320 / $316 intrinsic)

If §1259 deems these realized at opening, basis/character/TY2026 estimated-tax math all shift. Must be resolved with CPA before any NVDA-book restructure.

## Plan

### Phase 0 — immediately (zero cost, zero risk)
1. **Fidelity Cost Basis** → switch default from FIFO to **Specific Lot ID** on Z25598998. Set NVDA/GOOGL/CRWV/TQQQ standing instructions to highest-basis-first on assignment. Authority: Reg §1.1012-1(c). Value: $25-45K expected over 12mo (assignment-character control on 21 short-call legs, several deep-ITM at near-term expiries). **Verify designation recorded within 24h of any assignment.**
2. **Email JF** to confirm §163(d) margin-interest deduction ($51K/yr) is on TY2025 Form 4952 and built into TY2026 estimates. EV ~$3-5K insurance ($15-21K if not currently claimed; TY2025 amendable in the §6511(a) 3-yr window).

### Phase 1 — this week (independent of JF)
3. **Governance memo to JF** — three questions that gate everything else:
   - §1092 QCC status (under §1092(c)(4)) of each deep-ITM short call → which harvests are TY2026-allowed vs deferred.
   - §1259 constructive-sale exposure on the three synthetic shorts above — recognized at opening? position today?
   - §469 material-participation status of Alton in Solar Inference LLC for TY2026 — **without material participation the §48E ITC + bonus-depreciation pass-through loss is PASSIVE and cannot offset portfolio STCG**, which dissolves most "the LLC loss absorbs the gain" framings. Ties to [[469-material-participation]] and [[solar-itc-48-vs-25d]].
4. **Execute P1 — CRWV roll-up** (§1092-clean, independent of JF). On a fresh quote: BTC 22× CRWV Jan21-28 $70C, STO 22× CRWV Jan21-28 $110C. ~$57K net cash debit (re-price first). Realizes ~$43K clean STCL; +~$11/d after-carry theta; restores $70→$110 cap on 2,200 share-equivalents.

### Phase 2 — after JF responds (conditional)
5. **P2 — NBIS Jan28 $85C → $130C** (6 ct, ~$17K debit). **+$27K upside cap restored unconditionally;** $15-30K tax EV gates on JF §1092/QCC ruling.
6. **P5 — NVDA Jul $180C → Sep $235C** (16 ct, adds to existing -11; ~$40K debit). **+$88K upside cap restored,** eliminates 55-DTE assignment risk on 1,600 NVDA shares. Tax shield is $0 TY2026 (§1092-deferred) — do it for assignment-risk + upside, not taxes. **Gate on §1259 ruling first.**
7. **Re-run the harvest queue** (NVDA Jun $140C, NVDA Jul $180C remainder, GOOGL Jul $290C, NBIS $85C) against JF's §1092 QCC determination. ~$220K nominal STCL; partial unlock is material.

### Phase 3 — ongoing monitors
- TY2026 STCG/STCL running tally → feeds [[1411-niit-covered-calls]].
- §48E ITC + bonus-depreciation progress (deadline 2026-07-04) → [[solar-itc-48-vs-25d]].
- §1259 self-assessment on any NEW synthetic-short structure **before** opening.

## Dependency map

```
Phase 0 (independent)        ─ do now
Phase 1 #3 JF memo ──► JF response (1-2 wks) ──► Phase 2 #5, #6, #7
Phase 1 #4 CRWV  ── independent (§1092-clean), do this week
```

## Quantified expected value (TY2026, after-tax)

| Source | $ |
|---|---|
| P1 CRWV STCL (conditional on STCG mix) | +$15-22K |
| P3 Specific-ID lot control | +$25-45K |
| P4 §163(d) confirmation (insurance EV) | +$3-5K |
| P6 governance memo unlocks harvest queue | +$40-100K conditional |
| **Range** | **+$83-172K** |

Plus **~$115K of upside cap restored** (non-cash optionality) across CRWV / NBIS / NVDA roll-ups.

## Explicitly excluded (and why)

- New long LEAPS / convexity adds, short-put income, ratio call spreads — consume tax-free liquidity or re-add the gamma the overlay is paying to avoid; conflict with stated frame.
- SPY/QQQ tail hedges — bleed theta against the existing book.
- IBKR box-spread financing / SBLOC migration — real but small benefit (~$3-5K/yr), high friction at this size.
- Synthetic-short unwinds — gated on §1259; would consume $200K+ liquidity to convert deferred LTCG into recognized STCG.
- Honest read: **the current structure already maximizes the (theta + tax-free liquidity) corner.** Added upside requires giving back theta or cash; the cleanest upside wins are the strike roll-ups (P1/P2/P5) as a *side effect* of fixing assignment-risk and harvesting.

## Action items

- [ ] Phase 0 #1: Fidelity → Specific Lot ID election (Alton, 10 min)
- [ ] Phase 0 #2: Email JF re §163(d) Form 4952 confirmation
- [ ] Phase 1 #3: Draft + send §1092/§1259/§469 governance memo to JF
- [ ] Phase 1 #4: Re-export Fidelity positions; execute CRWV $70C→$110C roll on fresh quote
- [ ] Phase 2: hold #5/#6/#7 for JF response
- [ ] Update [[1411-niit-covered-calls]] with any realized STCG/STCL

## CPA / counsel routing

- **JF (Jonathan Francis, CPA — jf@francis-cpa.com, (914) 488-5727):** governance memo (§1092 QCC classification, §1259 constructive-sale, §469 material participation) + §163(d) confirmation. Structured email, not phone, so the response is an audit-defensible record.
- This memo is analytical support for the JF discussion. Not legal or tax advice.

## History

- 2026-05-31: Opened. Sourced from workflow `wf_cdeff7ab-7c6` (run 2026-05-23 against the 2026-05-23 Fidelity export). §1092 straddle-deferral finding reprices ~$220K nominal STCL toward $0 TY2026 effective except CRWV. §1259 exposure flagged on three synthetic-short legs. Plan structured Phase 0/1/2/3 with JF governance memo as the dependency unlock.

## Resolution

(open)

---

This memo is analytical support for discussion with Jonathan Francis, CPA. It is not legal advice or a professional tax opinion.
