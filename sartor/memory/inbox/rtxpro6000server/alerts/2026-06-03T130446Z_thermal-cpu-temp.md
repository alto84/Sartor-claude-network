---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-03T13:04:46+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 75.9C >75C sustained 3 samples

## Latest sample
```
2026-06-03T13:03:46+00:00,rtxpro6000server,97429,C.39283585,1,2,48,16.15,0,1,66,425.15,92,58724,75.9,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-03T12:50:52+00:00,rtxpro6000server,97429,C.39283585,1,2,77,421.58,92,20638,67,425.08,93,58724,85.0,k10temp_tctl,,
2026-06-03T12:52:22+00:00,rtxpro6000server,97429,C.39283585,1,2,78,419.73,91,20638,67,424.99,92,58724,86.0,k10temp_tctl,,
2026-06-03T12:53:14+00:00,rtxpro6000server,97429,C.39283585,1,2,79,424.94,95,20638,68,424.98,92,58724,87.2,k10temp_tctl,,
2026-06-03T12:54:44+00:00,rtxpro6000server,97429,C.39283585,1,2,79,424.95,95,20638,68,424.91,93,58724,88.1,k10temp_tctl,,
2026-06-03T12:56:15+00:00,rtxpro6000server,97429,C.39283585,1,2,78,425.01,95,20638,66,416.48,91,58724,88.2,k10temp_tctl,,
2026-06-03T12:57:45+00:00,rtxpro6000server,97429,C.39283585,1,2,78,425.40,93,20638,66,422.32,92,58724,86.8,k10temp_tctl,,
2026-06-03T12:59:15+00:00,rtxpro6000server,97429,C.39283585,1,2,77,425.25,93,20638,66,425.19,92,58724,86.5,k10temp_tctl,,
2026-06-03T13:00:45+00:00,rtxpro6000server,97429,C.39283585,1,2,77,426.16,92,20782,66,425.14,92,58724,86.2,k10temp_tctl,,
2026-06-03T13:02:15+00:00,rtxpro6000server,97429,C.39283585,1,2,64,29.07,0,1,65,420.63,92,58724,82.8,k10temp_tctl,,
2026-06-03T13:03:46+00:00,rtxpro6000server,97429,C.39283585,1,2,48,16.15,0,1,66,425.15,92,58724,75.9,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

