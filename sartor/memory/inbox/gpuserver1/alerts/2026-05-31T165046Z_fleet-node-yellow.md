---
type: alert
date: 2026-05-31
from: fleet-node-monitor.sh (gpuserver1)
priority: P2
tags: [domain/gpuserver1, ops/monitoring, alert/fleet-node, machine/52271]
---

# Fleet node yellow: gpuserver1 (machine 52271)

**Timestamp:** 2026-05-31T16:50:46Z
**Reasons:** vast.ai read failed;

## Snapshot
- rented: false  (rentals_running=0)
- gpu temp max: 48C   util: 0%   fan: 43%
- power: 158W (GPU 78W + idle 80W)   est_kwh: 0.01317
- cpu temp: 76C   disk: 44%
- list price: $/GPU   min_bid: $   reliability: 
- earn/hr: $   earn/day: $
- stale docker: 0   stale VM: 0   
- vast.ai read: ssh:gpuserver1 (ok=0)

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
