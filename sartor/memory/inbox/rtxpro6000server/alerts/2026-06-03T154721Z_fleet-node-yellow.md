---
type: alert
date: 2026-06-03
from: fleet-node-monitor.sh (rtxserver)
priority: P2
tags: [domain/rtxserver, ops/monitoring, alert/fleet-node, machine/124192]
---

# Fleet node yellow: rtxserver (machine 124192)

**Timestamp:** 2026-06-03T15:47:21Z
**Reasons:** stale artifacts: 1 dead C.* container(s);;

## Snapshot
- rented: false  (rentals_running=0)
- gpu temp max: 50C   util: 100%   fan: 36%
- power: 484W (GPU 134W + idle 350W)   est_kwh: 0.04033
- cpu temp: 52.5C   disk: 50%
- list price: $0.7299999999999999/GPU   min_bid: $0.67   reliability: 0.9865341
- earn/hr: $1.372607   earn/day: $27.227881
- stale docker: 1   stale VM: 0   (1 dead C.* container(s);)
- vast.ai read: local (ok=1)

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
