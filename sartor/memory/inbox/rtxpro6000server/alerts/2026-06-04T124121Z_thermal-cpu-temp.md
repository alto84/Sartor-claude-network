---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T12:41:21+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 75.5C >75C sustained 3 samples

## Latest sample
```
2026-06-04T12:41:04+00:00,rtxpro6000server,97429,C.39324136,1,2,70,410.69,50,7822,27,14.06,0,4,75.5,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T12:31:02+00:00,rtxpro6000server,97429,C.39324136,1,2,67,430.84,99,7822,25,14.21,0,4,74.6,k10temp_tctl,,
2026-06-04T12:31:47+00:00,rtxpro6000server,97429,C.39324136,1,2,69,422.10,88,7822,25,14.62,0,4,74.5,k10temp_tctl,,
2026-06-04T12:33:17+00:00,rtxpro6000server,97429,C.39324136,1,2,62,412.81,52,7822,25,14.27,0,4,74.1,k10temp_tctl,,
2026-06-04T12:34:06+00:00,rtxpro6000server,97429,C.39324136,1,2,69,423.84,92,7822,25,14.41,0,4,74.6,k10temp_tctl,,
2026-06-04T12:35:36+00:00,rtxpro6000server,97429,C.39324136,1,2,69,425.09,61,7822,26,14.11,0,4,74.5,k10temp_tctl,,
2026-06-04T12:36:24+00:00,rtxpro6000server,97429,C.39324136,1,2,69,424.81,96,7822,26,14.85,0,4,74.4,k10temp_tctl,,
2026-06-04T12:37:54+00:00,rtxpro6000server,97429,C.39324136,1,2,69,424.41,89,7822,26,13.99,0,4,74.4,k10temp_tctl,,
2026-06-04T12:38:47+00:00,rtxpro6000server,97429,C.39324136,1,2,64,434.32,75,7822,26,13.76,0,4,75.4,k10temp_tctl,,
2026-06-04T12:40:12+00:00,rtxpro6000server,97429,C.39324136,1,2,64,418.93,65,7822,27,13.98,0,4,75.4,k10temp_tctl,,
2026-06-04T12:41:04+00:00,rtxpro6000server,97429,C.39324136,1,2,70,410.69,50,7822,27,14.06,0,4,75.5,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

