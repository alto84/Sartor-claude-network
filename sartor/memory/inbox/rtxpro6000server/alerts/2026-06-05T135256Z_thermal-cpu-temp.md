---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-05T13:52:56+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 76.8C >75C sustained 3 samples

## Latest sample
```
2026-06-05T13:52:29+00:00,rtxpro6000server,97429,C.39324136,1,2,62,369.17,85,5182,26,14.70,0,4,76.8,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-05T13:43:23+00:00,rtxpro6000server,97429,C.39324136,1,2,64,386.89,34,5182,25,14.76,0,4,71.2,k10temp_tctl,,
2026-06-05T13:44:53+00:00,rtxpro6000server,97429,C.39324136,1,2,59,353.65,71,5182,25,14.30,0,4,70.8,k10temp_tctl,,
2026-06-05T13:46:23+00:00,rtxpro6000server,97429,C.39324136,1,2,66,369.22,65,5182,25,14.63,0,4,71.1,k10temp_tctl,,
2026-06-05T13:47:54+00:00,rtxpro6000server,97429,C.39324136,1,2,57,359.52,21,5182,25,14.16,0,4,70.2,k10temp_tctl,,
2026-06-05T13:49:14+00:00,rtxpro6000server,97429,C.39324136,1,2,61,363.68,84,5182,25,14.44,0,4,71.6,k10temp_tctl,,
2026-06-05T13:49:59+00:00,rtxpro6000server,97429,C.39324136,1,2,63,342.19,14,5182,26,14.28,0,4,71.9,k10temp_tctl,,
2026-06-05T13:50:38+00:00,rtxpro6000server,97429,C.39324136,1,2,60,354.30,63,5182,26,14.49,0,4,74.4,k10temp_tctl,,
2026-06-05T13:51:16+00:00,rtxpro6000server,97429,C.39324136,1,2,65,295.03,100,5182,26,14.44,0,4,76.0,k10temp_tctl,,
2026-06-05T13:51:53+00:00,rtxpro6000server,97429,C.39324136,1,2,68,376.51,80,5182,26,14.16,0,4,76.8,k10temp_tctl,,
2026-06-05T13:52:29+00:00,rtxpro6000server,97429,C.39324136,1,2,62,369.17,85,5182,26,14.70,0,4,76.8,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

