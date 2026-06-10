# vast.ai pricing regime v3 — fleet-wide occupancy-band model

**When:** 2026-06-10T19:30Z
**Who:** Rocinante (Fable 5), on Alton's request: "come up with a pricing regime that will
maximize our total revenue... we'll have a total of three [5090s] that we will need to apply
the same approach to."
**Code:** `scripts/fleet/reprice.py` (v3, full rewrite). Runs via SartorFleetReprice every 15 min.

## The model

Objective: maximize $/day = price × occupancy per machine. Occupancy-vs-price is unknown and
the market is non-stationary, so the regime is a learning controller, not a formula:

1. **Market anchor** (per GPU class, recomputed every tick): the ~P40 comparable listing
   per-GPU, reliability ≥0.90, **all Sartor machines excluded from comps** (three 5090s must
   not race each other down). Rank-2 floor in thin markets preserves Alton's original rule.
2. **Relative-price bands**: knob is r = our price / anchor, 6 bands on [0.70, 1.50]. Every
   15-min tick attributes wall-time — rented hours to the band the rental *filled* at,
   idle hours to the band currently listed. occupancy(band) = rented/(rented+idle), optimistic
   prior (0.85 occ / 12 pseudo-hours), ~10-day half-life decay.
3. **Selection (UCB bandit)**, applied only when idle: list at argmax of
   `band_mid_r × min(1, occ + 0.25·sqrt(ln(total_h)/band_h))`. Unexplored higher bands win
   first → a fresh machine skims near the P75 ceiling and steps down ~one band per 3-4 idle
   hours until it fills. Bands with real rented evidence become sticky. Exploration cost is
   bounded by the idle time needed to demote a band (~12-16h worst case, once).
4. **Rails**: electricity marginal floor (fleet.yaml), ceiling just under the P75 peer +
   $3.00/GPU absolute cap, step cap 30% of anchor per relist, ≥30 min between relists,
   idle-only applies, refuses to relist when listing end_date <2 days out (human decision),
   min_gpus=2 invariant hard-coded for 124192.

Why bands instead of the old fill-latency multiplier: fills are ~1/day (too sparse); ticks are
96/day. The band ledger uses every observation and directly estimates the thing we're
maximizing instead of chasing a latency heuristic that had become a downward ratchet.

## Fleet enrollment

| Machine | Status | Notes |
|---|---|---|
| 124192 (rtxserver, 2× PRO 6000 WS) | **Live now** | Bands seeded from 1,172 historical ticks (anchor-corrected ×1.20 for the rank-2→P40 definition change, capped 72h/band). Sub-0.85 band: 89% occupancy proven. Current rental locked ~$0.75 (locked_r 0.63). Next idle → lists ~$1.57, descends if no fill. |
| 52271 (gpuserver1, RTX 5090) | **Enrolled, starts 2026-08-24** | `dynamic.start_date` = reserved-contract C.34113802 end. Earlier enrollment would poison band learning with contract hours. At enrollment, cold-start skims at ~P75 of the 5090 market (today: ~$0.72/GPU vs current $0.80 list). |
| Two new 5090 hosts | Template ready in fleet.yaml | At onboarding: fill the commented stanza, `dynamic.enabled` from day one — the skim-then-descend cold start IS the price-discovery phase; no manual price needed, only the electricity floor. |

## 5090 market snapshot (2026-06-10, verified+rentable, rel ≥0.90, 1x)

36 comps: min $0.47, P25 $0.61, P40 $0.65, median $0.67, P75 $0.74, max $1.11.
Three 5090s filled at P40-P75 ≈ $47-53/day combined gross.

## State/log migration

- `reprice-state.json` → archived as `reprice-state.v2-archived.json`
- `reprice-log.jsonl` → renamed `reprice-log-124192.jsonl` (history preserved, v3 appends)
- New per-machine files: `reprice-state-<id>.json` / `reprice-log-<id>.jsonl`

## Open items for Alton

- **Listing end_dates: both live listings expire 2026-06-30.** The controller refuses to relist
  inside 2 days of expiry — extend the end_dates (short-term-first re-evaluation) before ~6/28
  or the listings lapse. This is the one decision the regime deliberately leaves human.
- gpuserver1 fleet.yaml end_date must be future-dated before 2026-08-24 or the controller will
  sit out at contract end.
- Cuts below the electricity floor remain impossible; cuts within bounds are now autonomous
  fleet-wide (extension of the 2026-05-29 124192 carve-out, per Alton's 2026-06-10 directive).
