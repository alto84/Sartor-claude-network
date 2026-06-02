---
type: alert
date: 2026-06-02
from: fleet-node-monitor.sh (rtxserver)
priority: P2
tags: [domain/rtxserver, ops/monitoring, alert/fleet-node, machine/124192]
---

# Fleet node yellow: rtxserver (machine 124192)

**Timestamp:** 2026-06-02T16:24:31Z
**Reasons:** stale artifacts: running C.*=1 > rentals_running=0;;

## Snapshot
- rented: false  (rentals_running=0)
- gpu temp max: 28C   util: 0%   fan: 30%
- power: 370W (GPU 20W + idle 350W)   est_kwh: 0.03083
- cpu temp: 42.9C   disk: 50%
- list price: $0.57/GPU   min_bid: $0.52   reliability: 0.985864
- earn/hr: $1.411391   earn/day: $35.223064
- stale docker: 1   stale VM: 0   (running C.*=1 > rentals_running=0;)
- vast.ai read: local (ok=1)

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
