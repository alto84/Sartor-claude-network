---
name: vast.ai market pricing references
description: External and native data sources for competitor pricing on vast.ai RTX 5090 and other GPU classes — needed for market-aware pricing decisions on Solar Inference LLC's gpuserver1 rental
type: reference
originSessionId: 6d66075b-10f9-482c-a62e-9f2828a7ed0d
---
# vast.ai market pricing references

## External dashboard (Alton's preferred reference)

**500.farm vast.ai charts:** `https://500.farm/vastai/charts/d/FRpv6Pc7z/home?orgId=1`

A third-party Grafana dashboard that tracks vast.ai marketplace prices, occupancy, and historical trends across GPU classes. Alton flagged this on 2026-04-11 as the canonical reference for "current rental prices" when doing pricing decisions. Check **every few days** when managing the pricing ratchet on machine 52271 (gpuserver1 RTX 5090).

The dashboard is a Grafana view, so it may require browser rendering to extract numbers cleanly. Native data access alternative: run `~/.local/bin/vastai search offers 'gpu_name=RTX_5090'` directly on gpuserver1 — the same underlying vast.ai API that 500.farm queries. Use 500.farm for trend lines and historical context, use native `vastai search offers` for real-time percentile calculations.

## Native marketplace query (preferred for automation)

On gpuserver1:
```bash
~/.local/bin/vastai search offers 'gpu_name=RTX_5090 verified=True' --raw
```

Returns JSON of current competitor offers. From this we can compute:
- p25, p50, p75 of `$/hr`
- Our relative position in the market (machine 52271 at current listed price)
- Distribution of reliability scores at each price tier
- Geographic clustering

## Earnings data (our side)

On gpuserver1:
```bash
~/.local/bin/vastai show earnings
```

Returns lifetime, month, week, day earnings + breakdown by GPU/storage/bandwidth. Used by the 2-hourly monitoring report (integration proposed 2026-04-11, pending apply).

## Related commitments

- `~/sartor-monitoring/monitor_brief.md` on gpuserver1 will (pending) include market-aware pricing context on every 2-hour run — percentile position of our listing vs current RTX 5090 market, plus our earnings over the last 24h
- See feedback_pricing_autonomy.md for the pricing ratchet rules this data feeds into
