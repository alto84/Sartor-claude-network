---
type: alert
date: 2026-06-06
from: fleet-node-monitor.sh (gpuserver1)
priority: P2
tags: [domain/gpuserver1, ops/monitoring, alert/fleet-node, machine/52271]
---

# Fleet node yellow: gpuserver1 (machine 52271)

**Timestamp:** 2026-06-06T22:17:29Z
**Reasons:** stale artifacts: 1 dead C.* container(s);;

## Snapshot
- rented: true  (rentals_running=1)
- gpu temp max: 44C   util: 0%   fan: 0%
- power: 100W (GPU 20W + idle 80W)   est_kwh: 0.00833
- cpu temp: 44C   disk: 44%
- list price: $0.8/GPU   min_bid: $0.65   reliability: 0.8128663
- earn/hr: $0.1690259   earn/day: $4.686968
- stale docker: 1   stale VM: 0   (1 dead C.* container(s);)
- vast.ai read: local (ok=1)

Advisory only. fleet-node-monitor never removes containers/VMs. The 30s
gpu-temp-logger.service remains the P0 thermal alerter; this is a coarse
5-min self-report. Stale-artifact cleanup is docker-weekly-prune.sh (Sun 4am).
