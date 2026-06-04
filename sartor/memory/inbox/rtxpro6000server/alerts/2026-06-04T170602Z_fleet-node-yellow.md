---
type: alert
date: 2026-06-04
from: fleet-node-monitor.sh (rtxserver)
priority: P2
tags: [domain/rtxserver, ops/monitoring, alert/fleet-node, machine/124192]
---

# Fleet node yellow: rtxserver (machine 124192)

**Timestamp:** 2026-06-04T17:06:02Z
**Reasons:** stale artifacts: 1 dead C.* container(s);;

## Snapshot
- rented: true  (rentals_running=1)
- gpu temp max: 29C   util: 0%   fan: 30%
- power: 370W (GPU 20W + idle 350W)   est_kwh: 0.03083
- cpu temp: 38.5C   disk: 50%
- list price: $0.75/GPU   min_bid: $0.69   reliability: 0.9877089
- earn/hr: $1.616508   earn/day: $30.952133
- stale docker: 1   stale VM: 0   (1 dead C.* container(s);)
- vast.ai read: local (ok=1)

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
