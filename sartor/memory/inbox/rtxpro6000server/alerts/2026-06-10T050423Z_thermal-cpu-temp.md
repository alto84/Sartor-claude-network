---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-10T05:04:23+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.4C >75C sustained 3 samples

## Latest sample
```
2026-06-10T05:04:23+00:00,rtxpro6000server,97429,C.39324136,1,2,63,406.85,53,2502,24,12.11,0,4,78.4,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-10T04:59:52+00:00,rtxpro6000server,97429,C.39324136,1,2,26,44.70,0,1,24,11.52,0,1,45.5,k10temp_tctl,,
2026-06-10T05:00:22+00:00,rtxpro6000server,97429,C.39324136,1,2,28,108.93,11,2498,24,16.68,0,4,51.9,k10temp_tctl,,
2026-06-10T05:00:52+00:00,rtxpro6000server,97429,C.39324136,1,2,42,299.08,32,2502,24,12.81,0,4,64.8,k10temp_tctl,,
2026-06-10T05:01:23+00:00,rtxpro6000server,97429,C.39324136,1,2,55,368.37,8,2502,24,12.17,0,4,67.2,k10temp_tctl,,
2026-06-10T05:01:53+00:00,rtxpro6000server,97429,C.39324136,1,2,60,393.23,51,2502,24,12.52,0,4,69.2,k10temp_tctl,,
2026-06-10T05:02:23+00:00,rtxpro6000server,97429,C.39324136,1,2,58,379.39,64,2502,24,12.28,0,4,72.9,k10temp_tctl,,
2026-06-10T05:02:53+00:00,rtxpro6000server,97429,C.39324136,1,2,64,403.65,57,2502,24,13.12,0,4,74.6,k10temp_tctl,,
2026-06-10T05:03:23+00:00,rtxpro6000server,97429,C.39324136,1,2,60,401.77,57,2502,24,12.17,0,4,75.8,k10temp_tctl,,
2026-06-10T05:03:53+00:00,rtxpro6000server,97429,C.39324136,1,2,66,375.99,51,2502,24,12.59,0,4,77.2,k10temp_tctl,,
2026-06-10T05:04:23+00:00,rtxpro6000server,97429,C.39324136,1,2,63,406.85,53,2502,24,12.11,0,4,78.4,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

