---
type: inbox-message
from: gpuserver1-claude
to: rocinante
date: 2026-04-24
tags: [vastai, rental, re-rental, outage-recovery]
---

# Vast.ai re-rental review after 48h network outage

## TL;DR

**Machine is already rented** under an active reserved contract (customer container `C.34113802`, up since 2026-04-05, contract ends 2026-08-24). The 48h outage happened mid-rental: the renter was locked out but the container kept running. No re-listing action is possible or needed until the reservation ends. Pricing is locked by the reservation; revisit at 8/24 expiry.

## Current state

```
$ vastai show machines
ID     gpu_name  reliab  veri      gpuI$/h  occup
52271  RTX_5090  0.9342  verified  0.35     (blank)

$ vastai show instances         # client-side, empty as expected
(no output — show instances lists rentals we consume, not host-side renters)

$ docker ps --format '{{.Names}}\t{{.Status}}'
C.34113802   Up 2 weeks

$ df -h /  /var/lib/docker
/  98G  37G  57G  40%
/var/lib/docker  1.8T  379G  1.4T  22%
```

Raw JSON confirms: `listed: false, current_rentals_reserved: 1, current_rentals_running: 1, client_end_date: 1787529600` → **2026-08-24 00:00 UTC**. Kaalia is healthy (keepalives + nvidia_smi2 + ContainerStats2 flowing to 54.172.108.182:7071). GPU max temp 44°C.

## Reliability hit

Historical ~0.95+ → **0.9342** (~1.7 point drop). Consistent with 48h unreachable while under a reserved rental. Metric will recover as uptime accrues; no operator action speeds this up. Renter can ask vast.ai for credit via support — not our lever.

## Market check (45 verified RTX_5090 1x offers)

```
$ vastai search offers 'gpu_name=RTX_5090 num_gpus=1 verified=true' --raw | (computed)
n=45  min=0.3014  p25=0.4028  median=0.4331  p75=0.6014  mean=0.4925  max=1.3347
```

Our $0.35/hr floor is **below median by $0.08/hr**. Room to ratchet up per `feedback_pricing_autonomy.md`.

## Stale alerts note

`~/.vastai-alert` shows repeated `disk_full 94–100` and `machine_not_listed` entries during the outage window. Verified against reality: root is 40%, docker is 22% — the disk_full alerter is false-firing. Separate cleanup (not this ticket). The `machine_not_listed` lines correlate exactly with the LAN-down interval and stopped at 2026-04-24T13:30Z when the cable was reseated. `vastai-tend.sh` resumed normal state (`listed=true rented=true`) at that timestamp.

## Heartbeat / cron

`*/30 * * * * vastai-tend.sh` is active. `docker-weekly-prune.sh` Sundays 04:00. No gaps in `/home/alton/generated/cron-logs/vastai-tend.log` — cron kept running during the outage (its polls just showed `listed=false`).

## Recommendation

1. **Do nothing to the listing now.** Reservation runs through 2026-08-24; prices are locked to the terms the renter signed up under. Relisting or price changes while under a reservation have no effect and could confuse state.
2. **Do not run self-test or speedtest** while the renter is active — they disrupt the customer's workload and won't improve reliability score faster than accumulated uptime.
3. **Calendar reminder for 2026-08-24:** at reservation expiry, evaluate and relist at market. Suggested:
   - On-demand: **$0.45/hr** (slightly above median $0.43, tracks p75 compression)
   - Interruptible floor: **$0.30/hr**
   - Storage: $0.10/hr, End: 2027-08-24
   - Command: `vastai list machine 52271 -g 0.45 -b 0.30 -s 0.10 -m 1 -e "08/24/2027"`
4. **Follow-up (separate ticket):** fix the `~/.vastai-alert` disk_full false-positive — threshold is probably comparing against the wrong filesystem.
5. **No further outage action.** The renter is responsible for requesting credit from vast.ai if they want one; we have no proactive path.

## Files / references

- State change log: `sartor/memory/inbox/gpuserver1/vastai/2026-04-24T1330Z-state-change.md`
- Tend script: `/home/alton/vastai-tend.sh`
- Raw machine JSON: `vastai show machine 52271 --raw` (fields quoted above)
