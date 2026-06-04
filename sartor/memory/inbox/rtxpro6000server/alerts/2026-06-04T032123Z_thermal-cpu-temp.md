---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T03:21:23+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 75.1C >75C sustained 3 samples

## Latest sample
```
2026-06-04T03:21:05+00:00,rtxpro6000server,97429,C.39324136,1,2,68,429.06,84,5220,25,14.39,0,4,75.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T03:10:06+00:00,rtxpro6000server,97429,C.39324136,1,2,64,397.99,48,5220,25,14.70,0,4,74.8,k10temp_tctl,,
2026-06-04T03:10:52+00:00,rtxpro6000server,97429,C.39324136,1,2,69,426.64,89,5220,26,14.85,0,4,76.4,k10temp_tctl,,
2026-06-04T03:12:22+00:00,rtxpro6000server,97429,C.39324136,1,2,65,406.60,69,5220,25,14.42,0,4,75.6,k10temp_tctl,,
2026-06-04T03:13:52+00:00,rtxpro6000server,97429,C.39324136,1,2,67,424.12,81,5220,25,14.56,0,4,77.2,k10temp_tctl,,
2026-06-04T03:14:43+00:00,rtxpro6000server,97429,C.39324136,1,2,65,425.97,83,5220,25,14.48,0,4,76.0,k10temp_tctl,,
2026-06-04T03:16:08+00:00,rtxpro6000server,97429,C.39324136,1,2,66,428.67,86,5220,25,14.87,0,4,75.2,k10temp_tctl,,
2026-06-04T03:17:38+00:00,rtxpro6000server,97429,C.39324136,1,2,69,404.61,55,5220,25,14.58,0,4,74.0,k10temp_tctl,,
2026-06-04T03:19:09+00:00,rtxpro6000server,97429,C.39324136,1,2,68,424.56,84,5220,25,14.32,0,4,75.4,k10temp_tctl,,
2026-06-04T03:19:55+00:00,rtxpro6000server,97429,C.39324136,1,2,68,429.30,91,5220,25,14.29,0,4,75.2,k10temp_tctl,,
2026-06-04T03:21:05+00:00,rtxpro6000server,97429,C.39324136,1,2,68,429.06,84,5220,25,14.39,0,4,75.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

