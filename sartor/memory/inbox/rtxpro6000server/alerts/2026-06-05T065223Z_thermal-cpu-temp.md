---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-05T06:52:23+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 83.9C >75C sustained 3 samples

## Latest sample
```
2026-06-05T06:51:23+00:00,rtxpro6000server,97429,C.39324136,1,2,66,418.01,60,5790,27,14.27,0,4,83.9,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-05T06:38:01+00:00,rtxpro6000server,97429,C.39324136,1,2,26,6.79,0,1,25,14.13,0,1,34.9,k10temp_tctl,,
2026-06-05T06:39:21+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.50,0,1,25,13.73,0,1,39.9,k10temp_tctl,,
2026-06-05T06:40:51+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.46,0,1,25,14.18,0,1,39.9,k10temp_tctl,,
2026-06-05T06:42:21+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.60,0,1,25,13.72,0,1,41.9,k10temp_tctl,,
2026-06-05T06:43:51+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.57,0,1,25,14.04,0,1,41.5,k10temp_tctl,,
2026-06-05T06:45:22+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.49,0,1,25,13.92,0,1,46.1,k10temp_tctl,,
2026-06-05T06:46:52+00:00,rtxpro6000server,97429,C.39324136,1,2,65,423.14,45,5022,26,13.68,0,4,74.9,k10temp_tctl,,
2026-06-05T06:48:22+00:00,rtxpro6000server,97429,C.39324136,1,2,62,411.90,23,5790,26,14.78,0,4,79.2,k10temp_tctl,,
2026-06-05T06:49:52+00:00,rtxpro6000server,97429,C.39324136,1,2,69,430.26,100,5790,27,13.99,0,4,81.6,k10temp_tctl,,
2026-06-05T06:51:23+00:00,rtxpro6000server,97429,C.39324136,1,2,66,418.01,60,5790,27,14.27,0,4,83.9,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

