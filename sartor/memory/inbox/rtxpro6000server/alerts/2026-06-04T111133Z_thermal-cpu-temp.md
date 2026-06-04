---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T11:11:33+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 76.1C >75C sustained 3 samples

## Latest sample
```
2026-06-04T11:10:33+00:00,rtxpro6000server,97429,C.39324136,1,2,64,411.77,77,7822,27,14.66,0,4,76.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T11:03:11+00:00,rtxpro6000server,97429,C.39324136,1,2,61,365.22,30,7822,25,14.67,0,4,74.5,k10temp_tctl,,
2026-06-04T11:03:42+00:00,rtxpro6000server,97429,C.39324136,1,2,69,421.54,60,7822,25,14.24,0,4,74.4,k10temp_tctl,,
2026-06-04T11:04:12+00:00,rtxpro6000server,97429,C.39324136,1,2,64,427.96,88,7822,25,14.34,0,4,74.5,k10temp_tctl,,
2026-06-04T11:04:42+00:00,rtxpro6000server,97429,C.39324136,1,2,69,424.51,64,7822,26,14.04,0,4,74.6,k10temp_tctl,,
2026-06-04T11:05:12+00:00,rtxpro6000server,97429,C.39324136,1,2,67,412.74,52,7822,26,13.88,0,4,74.8,k10temp_tctl,,
2026-06-04T11:05:42+00:00,rtxpro6000server,97429,C.39324136,1,2,63,423.17,69,7822,26,14.28,0,4,74.6,k10temp_tctl,,
2026-06-04T11:06:12+00:00,rtxpro6000server,97429,C.39324136,1,2,64,425.70,87,7822,26,14.35,0,4,74.6,k10temp_tctl,,
2026-06-04T11:07:33+00:00,rtxpro6000server,97429,C.39324136,1,2,63,426.41,93,7822,26,14.73,0,4,75.2,k10temp_tctl,,
2026-06-04T11:09:03+00:00,rtxpro6000server,97429,C.39324136,1,2,65,427.04,80,7822,27,14.49,0,4,75.5,k10temp_tctl,,
2026-06-04T11:10:33+00:00,rtxpro6000server,97429,C.39324136,1,2,64,411.77,77,7822,27,14.66,0,4,76.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

