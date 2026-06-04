---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T20:08:44+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 83.4C >75C sustained 3 samples

## Latest sample
```
2026-06-04T20:08:43+00:00,rtxpro6000server,97429,C.39324136,1,2,63,377.73,53,4014,27,14.64,0,4,83.4,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T20:04:12+00:00,rtxpro6000server,97429,C.39324136,1,2,63,378.78,53,4014,26,14.89,0,4,83.6,k10temp_tctl,,
2026-06-04T20:04:42+00:00,rtxpro6000server,97429,C.39324136,1,2,65,403.18,53,4014,26,14.75,0,4,81.6,k10temp_tctl,,
2026-06-04T20:05:12+00:00,rtxpro6000server,97429,C.39324136,1,2,67,311.48,42,4014,26,14.31,0,4,84.0,k10temp_tctl,,
2026-06-04T20:05:42+00:00,rtxpro6000server,97429,C.39324136,1,2,62,391.55,49,4014,26,14.69,0,4,82.8,k10temp_tctl,,
2026-06-04T20:06:13+00:00,rtxpro6000server,97429,C.39324136,1,2,64,402.67,54,4014,26,14.63,0,4,82.0,k10temp_tctl,,
2026-06-04T20:06:43+00:00,rtxpro6000server,97429,C.39324136,1,2,69,312.41,54,4014,26,14.72,0,4,82.6,k10temp_tctl,,
2026-06-04T20:07:13+00:00,rtxpro6000server,97429,C.39324136,1,2,66,372.14,50,4014,26,14.72,0,4,82.8,k10temp_tctl,,
2026-06-04T20:07:43+00:00,rtxpro6000server,97429,C.39324136,1,2,69,400.83,42,4014,27,14.85,0,4,83.9,k10temp_tctl,,
2026-06-04T20:08:13+00:00,rtxpro6000server,97429,C.39324136,1,2,62,350.67,53,4014,27,14.08,0,4,83.9,k10temp_tctl,,
2026-06-04T20:08:43+00:00,rtxpro6000server,97429,C.39324136,1,2,63,377.73,53,4014,27,14.64,0,4,83.4,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

