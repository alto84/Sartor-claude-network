---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-05T01:54:55+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.2C >75C sustained 3 samples

## Latest sample
```
2026-06-05T01:53:55+00:00,rtxpro6000server,97429,C.39324136,1,2,69,370.59,65,5790,26,13.99,0,4,78.2,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-05T01:44:16+00:00,rtxpro6000server,97429,C.39324136,1,2,60,368.96,16,5790,26,14.28,0,4,74.8,k10temp_tctl,,
2026-06-05T01:45:03+00:00,rtxpro6000server,97429,C.39324136,1,2,68,393.29,32,5790,26,14.24,0,4,73.6,k10temp_tctl,,
2026-06-05T01:46:01+00:00,rtxpro6000server,97429,C.39324136,1,2,59,270.21,2,5790,26,14.07,0,4,74.9,k10temp_tctl,,
2026-06-05T01:46:53+00:00,rtxpro6000server,97429,C.39324136,1,2,65,415.14,100,5790,26,14.01,0,4,74.8,k10temp_tctl,,
2026-06-05T01:47:44+00:00,rtxpro6000server,97429,C.39324136,1,2,67,397.29,15,5790,26,13.87,0,4,74.5,k10temp_tctl,,
2026-06-05T01:48:36+00:00,rtxpro6000server,97429,C.39324136,1,2,66,368.79,11,5790,26,14.16,0,4,74.8,k10temp_tctl,,
2026-06-05T01:50:06+00:00,rtxpro6000server,97429,C.39324136,1,2,69,388.32,62,5790,26,13.98,0,4,74.6,k10temp_tctl,,
2026-06-05T01:51:37+00:00,rtxpro6000server,97429,C.39324136,1,2,68,409.11,100,5790,26,14.03,0,4,75.6,k10temp_tctl,,
2026-06-05T01:52:35+00:00,rtxpro6000server,97429,C.39324136,1,2,64,394.26,27,5790,26,14.25,0,4,77.6,k10temp_tctl,,
2026-06-05T01:53:55+00:00,rtxpro6000server,97429,C.39324136,1,2,69,370.59,65,5790,26,13.99,0,4,78.2,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

