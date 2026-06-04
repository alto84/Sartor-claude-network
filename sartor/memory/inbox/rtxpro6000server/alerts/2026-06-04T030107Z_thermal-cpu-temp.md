---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T03:01:07+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 75.5C >75C sustained 3 samples

## Latest sample
```
2026-06-04T03:01:07+00:00,rtxpro6000server,97429,C.39324136,1,2,64,397.92,33,5220,26,14.58,0,4,75.5,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T02:49:35+00:00,rtxpro6000server,97429,C.39324136,1,2,67,425.85,85,5220,25,14.48,0,4,75.5,k10temp_tctl,,
2026-06-04T02:51:06+00:00,rtxpro6000server,97429,C.39324136,1,2,68,419.19,68,5220,25,14.48,0,4,73.6,k10temp_tctl,,
2026-06-04T02:52:36+00:00,rtxpro6000server,97429,C.39324136,1,2,67,422.96,75,5220,25,14.89,0,4,75.1,k10temp_tctl,,
2026-06-04T02:54:06+00:00,rtxpro6000server,97429,C.39324136,1,2,70,419.51,68,5220,25,14.75,0,4,74.2,k10temp_tctl,,
2026-06-04T02:55:36+00:00,rtxpro6000server,97429,C.39324136,1,2,68,426.93,86,5220,25,14.70,0,4,74.6,k10temp_tctl,,
2026-06-04T02:57:06+00:00,rtxpro6000server,97429,C.39324136,1,2,65,423.92,82,5220,25,14.12,0,4,75.1,k10temp_tctl,,
2026-06-04T02:58:37+00:00,rtxpro6000server,97429,C.39324136,1,2,70,414.69,50,5220,25,14.43,0,4,73.8,k10temp_tctl,,
2026-06-04T03:00:07+00:00,rtxpro6000server,97429,C.39324136,1,2,69,425.82,89,5220,26,14.96,0,4,75.9,k10temp_tctl,,
2026-06-04T03:00:37+00:00,rtxpro6000server,97429,C.39324136,1,2,67,423.87,79,5220,26,14.39,0,4,76.2,k10temp_tctl,,
2026-06-04T03:01:07+00:00,rtxpro6000server,97429,C.39324136,1,2,64,397.92,33,5220,26,14.58,0,4,75.5,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

