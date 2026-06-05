---
type: alert
date: 2026-06-05
from: fleet-node-monitor.sh (rtxserver)
priority: P2
tags: [domain/rtxserver, ops/monitoring, alert/fleet-node, machine/124192]
---

# Fleet node yellow: rtxserver (machine 124192)

**Timestamp:** 2026-06-05T01:21:51Z
**Reasons:** stale artifacts: 1 dead C.* container(s);;

## Snapshot
- rented: true  (rentals_running=1)
- gpu temp max: 65C   util: 90%   fan: 41%
- power: 760W (GPU 410W + idle 350W)   est_kwh: 0.06333
- cpu temp: 74.5C   disk: 50%
- list price: $0.75/GPU   min_bid: $0.69   reliability: 0.9880572
- earn/hr: $1.616262   earn/day: $32.016929
- stale docker: 1   stale VM: 0   (1 dead C.* container(s);)
- vast.ai read: local (ok=1)

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
