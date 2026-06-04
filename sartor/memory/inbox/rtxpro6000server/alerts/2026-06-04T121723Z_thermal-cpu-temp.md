---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T12:17:23+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 81.4C >75C sustained 3 samples

## Latest sample
```
2026-06-04T12:17:03+00:00,rtxpro6000server,97429,C.39324136,1,2,72,424.63,63,7822,28,15.19,0,4,81.4,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T12:10:42+00:00,rtxpro6000server,97429,C.39324136,1,2,65,419.51,64,7822,27,14.37,0,4,80.5,k10temp_tctl,,
2026-06-04T12:11:12+00:00,rtxpro6000server,97429,C.39324136,1,2,65,418.07,64,7822,28,14.38,0,4,80.4,k10temp_tctl,,
2026-06-04T12:11:42+00:00,rtxpro6000server,97429,C.39324136,1,2,72,420.58,62,7822,28,14.45,0,4,80.6,k10temp_tctl,,
2026-06-04T12:12:12+00:00,rtxpro6000server,97429,C.39324136,1,2,66,428.03,79,7822,28,14.83,0,4,80.5,k10temp_tctl,,
2026-06-04T12:12:43+00:00,rtxpro6000server,97429,C.39324136,1,2,73,413.22,40,7822,28,14.78,0,4,80.8,k10temp_tctl,,
2026-06-04T12:13:13+00:00,rtxpro6000server,97429,C.39324136,1,2,73,416.53,61,7822,28,14.70,0,4,80.1,k10temp_tctl,,
2026-06-04T12:13:43+00:00,rtxpro6000server,97429,C.39324136,1,2,73,426.94,56,7822,28,14.34,0,4,80.1,k10temp_tctl,,
2026-06-04T12:14:13+00:00,rtxpro6000server,97429,C.39324136,1,2,70,424.60,99,7822,28,14.55,0,4,80.2,k10temp_tctl,,
2026-06-04T12:15:33+00:00,rtxpro6000server,97429,C.39324136,1,2,70,432.52,98,7822,28,14.58,0,4,81.0,k10temp_tctl,,
2026-06-04T12:17:03+00:00,rtxpro6000server,97429,C.39324136,1,2,72,424.63,63,7822,28,15.19,0,4,81.4,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

