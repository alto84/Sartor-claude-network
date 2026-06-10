---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-10T05:19:28+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 83.6C >75C sustained 3 samples

## Latest sample
```
2026-06-10T05:19:28+00:00,rtxpro6000server,97429,C.39324136,1,2,67,407.15,60,2650,25,12.40,0,4,83.6,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-10T05:14:56+00:00,rtxpro6000server,97429,C.39324136,1,2,67,397.75,63,2650,25,12.19,0,4,82.8,k10temp_tctl,,
2026-06-10T05:15:26+00:00,rtxpro6000server,97429,C.39324136,1,2,65,412.21,58,2650,25,12.47,0,4,82.9,k10temp_tctl,,
2026-06-10T05:15:57+00:00,rtxpro6000server,97429,C.39324136,1,2,64,391.46,56,2650,25,12.26,0,4,83.0,k10temp_tctl,,
2026-06-10T05:16:27+00:00,rtxpro6000server,97429,C.39324136,1,2,68,384.98,57,2650,25,12.08,0,4,83.0,k10temp_tctl,,
2026-06-10T05:16:57+00:00,rtxpro6000server,97429,C.39324136,1,2,66,341.20,61,2650,25,11.97,0,4,83.8,k10temp_tctl,,
2026-06-10T05:17:27+00:00,rtxpro6000server,97429,C.39324136,1,2,68,358.13,50,2650,25,12.48,0,4,83.1,k10temp_tctl,,
2026-06-10T05:17:57+00:00,rtxpro6000server,97429,C.39324136,1,2,63,388.54,56,2650,25,12.31,0,4,83.5,k10temp_tctl,,
2026-06-10T05:18:27+00:00,rtxpro6000server,97429,C.39324136,1,2,66,405.39,61,2650,25,12.31,0,4,82.9,k10temp_tctl,,
2026-06-10T05:18:57+00:00,rtxpro6000server,97429,C.39324136,1,2,64,410.23,56,2650,25,12.74,0,4,83.5,k10temp_tctl,,
2026-06-10T05:19:28+00:00,rtxpro6000server,97429,C.39324136,1,2,67,407.15,60,2650,25,12.40,0,4,83.6,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

