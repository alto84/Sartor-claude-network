---
type: alert
date: 2026-06-05
from: fleet-node-monitor.sh (rtxserver)
priority: P2
tags: [domain/rtxserver, ops/monitoring, alert/fleet-node, machine/124192]
---

# Fleet node yellow: rtxserver (machine 124192)

**Timestamp:** 2026-06-05T00:50:51Z
**Reasons:** stale artifacts: 1 dead C.* container(s);;

## Snapshot
- rented: true  (rentals_running=1)
- gpu temp max: 68C   util: 98%   fan: 40%
- power: 755W (GPU 405W + idle 350W)   est_kwh: 0.06292
- cpu temp: 75.6C   disk: 50%
- list price: $0.75/GPU   min_bid: $0.69   reliability: 0.9880358
- earn/hr: $1.616271   earn/day: $31.960595
- stale docker: 1   stale VM: 0   (1 dead C.* container(s);)
- vast.ai read: local (ok=1)

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
