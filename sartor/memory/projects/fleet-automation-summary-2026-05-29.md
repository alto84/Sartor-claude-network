---
type: summary
date: 2026-05-29
author: Rocinante Opus 4.8
status: live
tags: [domain/business, project/fleet-automation, machine/rtxserver, machine/gpuserver1]
supersedes_context: [rental-monitoring-design-2026-05-28, rtxserver-rental-watch-2026-05-26]
---

# Fleet automation — what's running and how to control it

One-screen operator summary of the vast.ai fleet monitoring + pricing automation built
2026-05-26 → 2026-05-29. If you read one file about the rental fleet, read this.

## Why this exists

**2026-05-28 incident:** rtxserver was powered off by a physical button press at 18:54 EDT.
It killed an active ~29h rental, dropped reliability 0.9748→0.9696, and the listing price
silently reverted $0.92→$1.00/GPU on reboot. Nothing alerted anyone; Alton found it ~3h
later by hand. Root cause: every alert path in the fleet dead-ended in a git-tracked file
nothing forwarded, and the host's own monitoring crons can't run while the host is off.

The fix: move monitoring to the **witness** (Rocinante), not the **patient** (the rig), and
turn pricing from a manual set-and-forget into an adaptive, market-aware controller.

## What's running (3 scheduled tasks on Rocinante)

| Task | Cadence | Script | Job |
|------|---------|--------|-----|
| `SartorFleetWatchdog` | every 10 min | `scripts/fleet-watchdog.py` | Detect host-down, rental start/stop, price drift, reliability drop, `error_description`, listing expiry, marginal-floor breach, `min_gpus` violation, GPU temp, Rocinante disk. Writes inbox alert + `fleet-health.json`; phone alert on ORANGE+ (channel pending). |
| `SartorFleetReprice` | every 15 min | `scripts/fleet/reprice.py` | Adaptive market repricing for rtxserver (124192). Sets the vast.ai list price; updates `fleet.yaml`; logs every decision. |
| `SartorFleetLedger` | daily 23:45 | `scripts/win-tasks/fleet-ledger.cmd` | vast.ai revenue + state pull, power kWh ingest, books rebuild, doc reconcile. |

All run as `alton` (S4U, no console flash), idempotent, state-change-only. Re-register with
`scripts/win-tasks/register-fleet-tasks.ps1` (elevated).

## The pricing strategy (the part Alton delegated)

**Delegation (2026-05-29):** "price it like two from the bottom every time... a more thoughtful
market strategy than just a set price... what is the optimal price for total revenue... use some
independence." This is a **bounded carve-out** to "pricing needs approval" — rtxserver's
on-demand price is now owned by the controller. gpuserver1 (reserved contract) is NOT in scope.

**How it decides, each run:**
1. **Anchor** = the 2nd-cheapest comparable RTX PRO 6000 listing. Prefers strict 2-GPU systems
   (your literal "2x systems"); falls back to per-GPU-normalized across all RTX PRO 6000 boxes
   when the 2-GPU rentable set is too thin (it empties constantly — 3 listings one hour, 0 the next).
2. **Demand multiplier** (persisted, 0.70–1.50): rises on fast fills (<30 min after going idle =
   underpriced), falls on slow fills (>6h) or long idle (>12h = overpriced). It walks toward the
   fill-time sweet spot. **That convergence point is the empirical revenue optimum** — discovered,
   not assumed, because we'd only ever sampled the too-cheap end (we filled in 6–18 min twice at
   $0.92–1.10/GPU → proof we were underpriced).
3. **Bounds:** electricity floor; ceiling just under the priciest peer; $3.00/GPU absolute cap;
   ±$0.50/GPU max step per run; 30-min minimum between relists. `min_gpus=2` enforced on every
   relist (single-card thermal pathology if it ever drops to 1).
4. **Logged:** every decision → `data/financial/solar-inference/reprice-log.jsonl` (anchor,
   multiplier, target, fill-latency). Over weeks this is the dataset to fit the real demand curve.

**First live action (2026-05-29):** stepped $1.10 → $1.60/GPU, climbing toward ~$1.69 (overhead-
adjusted match of the market's 2nd-cheapest $2.00/GPU). The active miner is unaffected — pricing
only sets the *next* renter's rate.

## Operator knobs

| Want to... | Do this |
|------------|---------|
| See the latest pricing decision | `Get-Content C:\Users\alto8\backups\fleet-reprice.log -Tail 20` or tail `data/financial/solar-inference/reprice-log.jsonl` |
| See monitoring status | `Get-Content C:\Users\alto8\backups\fleet-watchdog.log -Tail 20` |
| Pause autonomous pricing | `Disable-ScheduledTask SartorFleetReprice` (price freezes at last value) |
| Pause monitoring | `Disable-ScheduledTask SartorFleetWatchdog` |
| Force a manual price | `ssh alton@gpuserver1 '~/.local/bin/vastai list machine 124192 -g <X> -b <Y> -s 0.10 -m 2 -e "06/30/2026"'` then set `gpu_cost` in `fleet.yaml` (or the repricer will move it back next run) |
| Tune the strategy | edit constants at the top of `scripts/fleet/reprice.py` (step cap, multiplier bands, fill thresholds, ceiling) |
| Dry-run the repricer | `python scripts/fleet/reprice.py --dry-run` |

## Current state (2026-05-29, see live logs for truth)

- rtxserver (124192): rented by a compute/mining renter, both GPUs ~100%, GPU0 ~83°C (2°C from
  85°C soft-abort — the hottest sustained case; power-capped at 425W, not thermal-throttled).
  Listed $1.60/GPU, climbing. reliability ~0.975 (recovering from the incident dip).
- gpuserver1 (52271): reserved contract C.34113802, day 7+, fixed at $0.80/GPU list.

## Open items

- **Phone-alert channel** — the watchdog writes inbox + health-json and can ping Google Calendar
  from a Claude session (tested, reaches the phone), but the headless Task-Scheduler path needs a
  channel decision (Telegram / Pushover / Google OAuth). "Good enough for now" via the calendar
  test; not yet wired into the headless watchdog.
- **Hardware (Alton's call):** BIOS power-button lockout + a small UPS would address the *cause*
  of the 2026-05-28 outage (the watchdog only catches the symptom).
- **Pricing to watch over the next few days:** whether the multiplier climbs sensibly while fills
  stay fast, or whether the thin 3-listing market makes the anchor jumpy. The log will tell; tune
  `reprice.py` constants once there's data.
- **Power cap 425W vs documented 450W** — cosmetic doc mismatch, confirm intended value.

## File map

- `scripts/fleet-watchdog.py` — monitor (detection layer)
- `scripts/fleet/reprice.py` — adaptive repricer
- `scripts/fleet/{vastai_pull,books,power_ingest,reconcile}.py` — ledger/revenue layer
- `sartor/memory/business/fleet.yaml` — canonical fleet config (identity, listing, tax posture)
- `sartor/memory/business/approved-pricing.yaml` — DEPRECATED, points to fleet.yaml
- `data/financial/solar-inference/` — gitignored operational state (reprice log/state, fleet-health.json, revenue)
- `sartor/memory/projects/rental-monitoring-design-2026-05-28.md` — the full design + gap analysis
- Memories: `feedback_autonomous_dynamic_pricing`, `project_fleet_ledger`
