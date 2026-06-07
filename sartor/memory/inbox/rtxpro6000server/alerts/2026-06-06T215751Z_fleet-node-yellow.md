---
type: alert
date: 2026-06-06
from: fleet-node-monitor.sh (rtxserver)
priority: P2
tags: [domain/rtxserver, ops/monitoring, alert/fleet-node, machine/124192]
---

# Fleet node yellow: rtxserver (machine 124192)

**Timestamp:** 2026-06-06T21:57:51Z
**Reasons:** vast.ai read failed;

## Snapshot
- rented: false  (rentals_running=0)
- gpu temp max: 26C   util: 0%   fan: 30%
- power: 370W (GPU 20W + idle 350W)   est_kwh: 0.03083
- cpu temp: 37.6C   disk: 50%
- list price: $/GPU   min_bid: $   reliability: 
- earn/hr: $   earn/day: $
- stale docker: 0   stale VM: 0   
- vast.ai read: ssh:gpuserver1 (ok=0)

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
