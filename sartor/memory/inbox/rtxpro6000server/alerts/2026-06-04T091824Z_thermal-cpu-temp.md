---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T09:18:24+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 77.8C >75C sustained 3 samples

## Latest sample
```
2026-06-04T09:18:24+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.49,0,1,25,14.19,0,1,77.8,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T09:13:52+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.53,0,1,27,14.11,0,1,36.1,k10temp_tctl,,
2026-06-04T09:14:22+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.52,0,1,26,14.40,0,1,36.0,k10temp_tctl,,
2026-06-04T09:14:52+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.66,0,1,26,14.05,0,1,35.9,k10temp_tctl,,
2026-06-04T09:15:23+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.47,0,1,26,14.01,0,1,35.9,k10temp_tctl,,
2026-06-04T09:15:53+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.82,0,1,26,14.34,0,1,40.2,k10temp_tctl,,
2026-06-04T09:16:23+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.59,0,1,25,14.23,0,1,74.8,k10temp_tctl,,
2026-06-04T09:16:53+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.53,0,1,25,14.23,0,1,74.9,k10temp_tctl,,
2026-06-04T09:17:23+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.61,0,1,25,14.23,0,1,75.4,k10temp_tctl,,
2026-06-04T09:17:53+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.57,0,1,25,14.42,0,1,77.0,k10temp_tctl,,
2026-06-04T09:18:24+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.49,0,1,25,14.19,0,1,77.8,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

