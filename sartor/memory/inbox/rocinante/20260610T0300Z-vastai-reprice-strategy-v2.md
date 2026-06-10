# vast.ai repricer strategy v2 + manual bump to $1.19/GPU (machine 124192)

**When:** 2026-06-10T03:00Z
**Who:** Rocinante (Fable 5), on Alton's request "can we bump up rental prices / better overall strategy for area under the curve"
**Action class:** price increase (sanctioned: explicit Alton ask + dynamic-pricing carve-out)

## What was done

1. **Manual relist** of 124192 at `-g 1.19 -b 0.85 -s 0.10 -m 2 -e 06/30/2026` (was $0.90/GPU).
   Verified live: `listed_gpu_cost: 1.19`, rental untouched. Current renter (locked ~$0.75/GPU
   since 2026-06-03, light usage, ~$36/day) gets vast.ai's price-increase challenge email;
   declining means they continue at $0.75 — no eviction risk.
2. **reprice.py strategy fixes** (TWEAK d):
   - **Percentile anchor.** `anchor rank = max(2, ceil(0.40 × n_comps))`. The rank-2 anchor was
     written against a ~6-listing market; with 18-20 reliable 2-GPU RTX PRO 6000 WS comps it was
     bottom-decile and produced $0.59/GPU targets while the market clustered at $1.20/GPU.
     Thin markets still get Alton's literal "two from the bottom".
   - **Ceiling** moved from rank-3 to P75 comp (same staleness fix).
   - **Overhead clamp.** Calibrated overhead had drifted to $0.82/hr from a stale offer read;
     comps' raw data shows search dph_total ≈ dph_base (storage ≈ $0.001/hr), so real overhead
     is ~zero. Clamped to [0, 0.10], default 0.02. The bug alone deflated targets by ~$0.41/GPU.
   - **State reset:** multiplier 0.9641 → 1.0 (learned against the corrupted target space).
3. **fleet.yaml** gpu_cost 1.19 + note updated (D1 approved-vs-live drift closed — controller owns price).

## Market snapshot (2026-06-10, CLI verified+rentable, 2-GPU RTX PRO 6000 WS, rel ≥0.90)

18 comps, per-GPU: $1.00, $1.00, $1.04, $1.20×5 (cluster), $1.25, $1.27, $1.32×2, $1.36, $1.47, $1.59, $1.69, $1.87, $2.13. Median $1.20. Our position at $1.19: just under the 5-machine cluster, reliability 0.99 (better than most of it).

## Dry-run verification

New controller computes target $1.19/GPU (anchor $1.201 rank 8/18, ceiling $1.469), holds relist while rented. Manual bump and controller now agree.

## Revenue math

- Current rental locked: $0.75/GPU → ~$36/day (continues unless renter accepts challenge).
- Next rental at $1.19/GPU filled: ~$57/day. Break-even occupancy vs old $0.75: 63%.
- Fill history at $0.73–0.90: typically 1–6.5h to fill. $1.19 is unexplored — the controller's
  fill-latency feedback (fast→bump, slow→cut, sweet-spot→probe up) now explores from a sane anchor.

## Watch items

- Listing expiry 2026-06-30 (20 days) — watchdog monitors; relist decision due.
- If the current renter drops the rental after the challenge email and the box idles >12h at
  $1.19, the controller backs off automatically (idle-backoff ×0.92, step-capped).
