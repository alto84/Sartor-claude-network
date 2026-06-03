---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-03T11:34:12+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 83.4C >75C sustained 3 samples

## Latest sample
```
2026-06-03T11:33:12+00:00,rtxpro6000server,97429,C.39283585,1,2,75,426.15,93,20638,64,393.51,89,20098,83.4,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-03T11:19:40+00:00,rtxpro6000server,97429,C.39283585,1,2,28,5.27,0,1,27,14.52,0,1,38.5,k10temp_tctl,,
2026-06-03T11:21:10+00:00,rtxpro6000server,97429,C.39283585,1,2,28,5.27,0,1,27,14.35,0,1,38.1,k10temp_tctl,,
2026-06-03T11:22:40+00:00,rtxpro6000server,97429,C.39283585,1,2,28,5.33,0,1,27,14.53,0,1,41.8,k10temp_tctl,,
2026-06-03T11:24:10+00:00,rtxpro6000server,97429,C.39283585,1,2,28,5.23,0,1,27,14.71,0,1,44.9,k10temp_tctl,,
2026-06-03T11:25:40+00:00,rtxpro6000server,97429,C.39283585,1,2,28,5.80,0,4,27,14.74,0,1,39.5,k10temp_tctl,,
2026-06-03T11:27:11+00:00,rtxpro6000server,97429,C.39283585,1,2,51,382.46,92,18000,26,17.01,0,1,62.4,k10temp_tctl,,
2026-06-03T11:28:41+00:00,rtxpro6000server,97429,C.39283585,1,2,64,425.36,95,20502,50,425.65,94,18434,74.2,k10temp_tctl,,
2026-06-03T11:30:11+00:00,rtxpro6000server,97429,C.39283585,1,2,68,386.55,90,20638,57,402.24,91,18038,76.9,k10temp_tctl,,
2026-06-03T11:31:41+00:00,rtxpro6000server,97429,C.39283585,1,2,73,425.29,93,20638,63,405.61,91,20098,81.1,k10temp_tctl,,
2026-06-03T11:33:12+00:00,rtxpro6000server,97429,C.39283585,1,2,75,426.15,93,20638,64,393.51,89,20098,83.4,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

