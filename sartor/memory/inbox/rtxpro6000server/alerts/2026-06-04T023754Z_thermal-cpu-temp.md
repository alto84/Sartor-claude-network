---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T02:37:54+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 75.1C >75C sustained 3 samples

## Latest sample
```
2026-06-04T02:37:33+00:00,rtxpro6000server,97429,C.39324136,1,2,67,428.05,70,5220,25,14.57,0,4,75.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T02:24:35+00:00,rtxpro6000server,97429,C.39324136,1,2,65,426.03,88,5220,25,14.84,0,4,71.4,k10temp_tctl,,
2026-06-04T02:26:06+00:00,rtxpro6000server,97429,C.39324136,1,2,68,423.68,68,5220,25,14.90,0,4,74.0,k10temp_tctl,,
2026-06-04T02:27:36+00:00,rtxpro6000server,97429,C.39324136,1,2,69,418.83,50,5220,25,14.92,0,4,72.9,k10temp_tctl,,
2026-06-04T02:29:06+00:00,rtxpro6000server,97429,C.39324136,1,2,69,426.65,88,5220,25,14.62,0,4,74.6,k10temp_tctl,,
2026-06-04T02:30:36+00:00,rtxpro6000server,97429,C.39324136,1,2,68,387.85,42,5220,25,14.46,0,4,74.1,k10temp_tctl,,
2026-06-04T02:32:07+00:00,rtxpro6000server,97429,C.39324136,1,2,66,426.89,82,5220,25,14.65,0,4,74.6,k10temp_tctl,,
2026-06-04T02:33:37+00:00,rtxpro6000server,97429,C.39324136,1,2,69,421.95,77,5220,25,14.72,0,4,74.9,k10temp_tctl,,
2026-06-04T02:34:43+00:00,rtxpro6000server,97429,C.39324136,1,2,69,422.93,85,5220,25,15.11,0,4,75.4,k10temp_tctl,,
2026-06-04T02:36:09+00:00,rtxpro6000server,97429,C.39324136,1,2,69,429.05,88,5220,25,14.69,0,4,75.2,k10temp_tctl,,
2026-06-04T02:37:33+00:00,rtxpro6000server,97429,C.39324136,1,2,67,428.05,70,5220,25,14.57,0,4,75.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

