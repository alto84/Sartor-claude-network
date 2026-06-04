---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T00:16:28+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.8C >75C sustained 3 samples

## Latest sample
```
2026-06-04T00:15:33+00:00,rtxpro6000server,97429,C.39324136,1,2,61,382.91,47,12532,26,14.34,0,4,78.8,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T00:05:22+00:00,rtxpro6000server,97429,C.39324136,1,2,68,374.88,41,12532,26,14.72,0,4,77.4,k10temp_tctl,,
2026-06-04T00:06:08+00:00,rtxpro6000server,97429,C.39324136,1,2,68,359.75,99,12532,26,14.44,0,4,75.2,k10temp_tctl,,
2026-06-04T00:07:18+00:00,rtxpro6000server,97429,C.39324136,1,2,59,382.47,6,12532,26,14.51,0,4,75.1,k10temp_tctl,,
2026-06-04T00:08:43+00:00,rtxpro6000server,97429,C.39324136,1,2,66,396.71,100,12532,26,14.39,0,4,74.4,k10temp_tctl,,
2026-06-04T00:09:13+00:00,rtxpro6000server,97429,C.39324136,1,2,66,375.77,100,12532,26,14.43,0,4,75.5,k10temp_tctl,,
2026-06-04T00:10:00+00:00,rtxpro6000server,97429,C.39324136,1,2,62,386.31,87,12532,26,14.11,0,4,76.4,k10temp_tctl,,
2026-06-04T00:11:08+00:00,rtxpro6000server,97429,C.39324136,1,2,60,335.88,65,12532,26,14.35,0,4,77.8,k10temp_tctl,,
2026-06-04T00:12:33+00:00,rtxpro6000server,97429,C.39324136,1,2,62,393.16,71,12532,26,14.14,0,4,78.1,k10temp_tctl,,
2026-06-04T00:14:03+00:00,rtxpro6000server,97429,C.39324136,1,2,69,367.77,60,12532,26,14.19,0,4,78.6,k10temp_tctl,,
2026-06-04T00:15:33+00:00,rtxpro6000server,97429,C.39324136,1,2,61,382.91,47,12532,26,14.34,0,4,78.8,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

