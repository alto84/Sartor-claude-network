---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T23:37:59+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.5C >75C sustained 3 samples

## Latest sample
```
2026-06-04T23:37:59+00:00,rtxpro6000server,97429,C.39324136,1,2,67,377.26,74,5790,26,14.39,0,4,78.5,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T23:33:27+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.36,0,1,26,13.86,0,1,36.6,k10temp_tctl,,
2026-06-04T23:33:58+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.41,0,1,26,13.20,0,1,35.0,k10temp_tctl,,
2026-06-04T23:34:28+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.44,0,1,26,13.65,0,1,65.8,k10temp_tctl,,
2026-06-04T23:34:58+00:00,rtxpro6000server,97429,C.39324136,1,2,27,12.60,0,4,26,17.24,0,4,53.1,k10temp_tctl,,
2026-06-04T23:35:28+00:00,rtxpro6000server,97429,C.39324136,1,2,43,359.61,19,5022,26,14.05,0,4,67.0,k10temp_tctl,,
2026-06-04T23:35:58+00:00,rtxpro6000server,97429,C.39324136,1,2,53,356.20,88,5022,26,14.14,0,4,69.9,k10temp_tctl,,
2026-06-04T23:36:28+00:00,rtxpro6000server,97429,C.39324136,1,2,53,375.82,66,5790,26,13.86,0,4,73.4,k10temp_tctl,,
2026-06-04T23:36:59+00:00,rtxpro6000server,97429,C.39324136,1,2,55,386.81,0,5790,26,13.79,0,4,75.5,k10temp_tctl,,
2026-06-04T23:37:29+00:00,rtxpro6000server,97429,C.39324136,1,2,59,352.19,28,5790,26,14.08,0,4,77.1,k10temp_tctl,,
2026-06-04T23:37:59+00:00,rtxpro6000server,97429,C.39324136,1,2,67,377.26,74,5790,26,14.39,0,4,78.5,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

