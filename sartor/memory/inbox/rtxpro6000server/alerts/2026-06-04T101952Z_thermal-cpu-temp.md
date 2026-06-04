---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T10:19:52+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 80.1C >75C sustained 3 samples

## Latest sample
```
2026-06-04T10:19:35+00:00,rtxpro6000server,97429,C.39324136,1,2,65,421.60,73,7822,26,14.65,0,4,80.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T10:13:41+00:00,rtxpro6000server,97429,C.39324136,1,2,73,423.56,62,7822,28,14.82,0,4,84.4,k10temp_tctl,,
2026-06-04T10:14:12+00:00,rtxpro6000server,97429,C.39324136,1,2,73,432.49,79,7822,28,15.03,0,4,84.8,k10temp_tctl,,
2026-06-04T10:14:42+00:00,rtxpro6000server,97429,C.39324136,1,2,73,422.45,83,7822,28,15.01,0,4,84.8,k10temp_tctl,,
2026-06-04T10:15:12+00:00,rtxpro6000server,97429,C.39324136,1,2,73,420.31,43,7822,28,14.81,0,4,84.9,k10temp_tctl,,
2026-06-04T10:15:48+00:00,rtxpro6000server,97429,C.39324136,1,2,70,417.34,70,7822,28,14.87,0,4,83.6,k10temp_tctl,,
2026-06-04T10:16:33+00:00,rtxpro6000server,97429,C.39324136,1,2,70,414.70,61,7822,28,14.64,0,4,82.4,k10temp_tctl,,
2026-06-04T10:17:25+00:00,rtxpro6000server,97429,C.39324136,1,2,72,429.62,58,7822,27,14.86,0,4,81.2,k10temp_tctl,,
2026-06-04T10:18:11+00:00,rtxpro6000server,97429,C.39324136,1,2,71,418.55,33,7822,27,14.77,0,4,80.5,k10temp_tctl,,
2026-06-04T10:18:59+00:00,rtxpro6000server,97429,C.39324136,1,2,71,418.83,31,7822,27,14.68,0,4,80.5,k10temp_tctl,,
2026-06-04T10:19:35+00:00,rtxpro6000server,97429,C.39324136,1,2,65,421.60,73,7822,26,14.65,0,4,80.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

