---
type: project
date: 2026-05-26
status: in-progress
tags: [domain/business, project/vastai-rental, machine/rtxserver]
---

# rtxserver rental watch (2026-05-26)

**Trigger:** Alton lowered the rtxserver listing price from $3.20/hr → $2.67/hr ($1.00/GPU × 2 GPUs) earlier today, wants it RENTED by end-of-day, then left and asked me to keep working autonomously until it's rented.

**Why this isn't a "do something" project, it's a "monitor + report" project:** the host is fully operational. Every check passes. There's nothing to fix. The only question is whether the price + the market clear within today's window.

## Current state (snapshot at start of watch)

- **Machine 124192** (rtxserver, dual RTX PRO 6000 Blackwell Workstation)
  - GPU max power: 425W/card (NB: not 450W as `nvidia-power-cap.service` docstring claims; ExecStart says `-pl 425`)
  - 192 GB GDDR7 unified VRAM (96 GB × 2)
  - 251 GB system RAM, AMD Threadripper PRO 7975WX 32C/64T
  - Disk: Samsung 990 Pro 4 TB, 3352 GB free
  - Network: ~898 Mbps up / 885 Mbps down (symmetric Fios)

- **kaalia daemon** active under `vastai.service`. Process (not container). Connected to vast.ai controller `54.210.32.65:7071` (AWS US-East-1). Heartbeating cleanly every ~4-15s. host_port_range 40100-40199, matches Fios port-forwarding rule (already in place, enabled, TCP-only).

- **Marketplace state** (renter view via `vastai search offers machine_id=124192`):
  - `dph_total`: $2.67/hr
  - `reliability2`: 0.965
  - `verification`: verified
  - `rentable`: True
  - `rented`: False
  - `direct_port_count`: 98 (of 100 reserved; 2 used by host overhead)
  - `dlperf_per_dphtotal`: 152.16 (perf/$ value metric)
  - `min_bid`: $2.27/hr (interruptible floor)

## Competitive position (as of 2026-05-26, market-wide RTX PRO 6000 WS verified rentable num_gpus≥2)

| Rank | $/hr | Reliability | GPUs | Location | machine_id |
|------|------|-------------|------|----------|------------|
| 1 | $2.53 | 0.979 | 2 | Czechia, CZ | 119971 |
| **2** | **$2.67** | **0.965** | **2** | **New Jersey, US** | **124192 (us)** |
| 3 | $3.20 | 0.989 | 2 | Czechia, CZ | 50938 |
| 4 | $3.20 | 0.969 | 2 | Ontario, CA | 37777 |

We're $0.14/hr above the cheapest comp and the only US-based listing in the cheap tier. For US-East workloads needing >80 GB VRAM, we should be the natural pick (latency matters for inference; iteration matters for fine-tuning).

## What's running

Background: `python scripts/rental-watch.py` (started 2026-05-26 ~17:15 UTC; polls every 60s; 12h cap)
- Writes state to `sartor/memory/projects/rental-watch-state.json`
- Logs to `sartor/memory/projects/rental-watch.log`
- On first rental detection: writes inbox file to `sartor/memory/inbox/rocinante/rtxserver-rental-detected-*.md` + exits

Background research agent: vast.ai RTX PRO 6000 market context (writing to `sartor/memory/business/research/vastai-rtx-pro-6000-context-2026-05-26.md`)

## Resume protocol after compaction

If a post-compaction Claude reads this:
1. Check `sartor/memory/projects/rental-watch-state.json` — most recent iteration's state
2. Check `sartor/memory/projects/rental-watch.log` — full poll history
3. Check `sartor/memory/inbox/rocinante/rtxserver-rental-detected-*.md` — exists iff rental was detected
4. If rental hit, mark watch complete, inform Alton next time he returns
5. If watch died (no recent state update + no rental file), restart it: `python scripts/rental-watch.py` from repo root

## Decisions deferred to Alton

- **Price floor.** $2.67/hr is well-positioned but $0.14 above Czechia. Going lower (e.g., $2.50) would beat them on price too, but I am not authorized to make autonomous pricing changes. Pricing is substantive; Alton already chose $1.00/GPU.
- **Power cap.** 425W vs 450W discrepancy in `nvidia-power-cap.service` docstring vs actual `-pl 425`. Cosmetic; not changing without Alton.
