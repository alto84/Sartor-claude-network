---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T16:50:43+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 81.6C >75C sustained 3 samples

## Latest sample
```
2026-06-04T16:50:43+00:00,rtxpro6000server,97429,C.39324136,1,2,71,417.49,44,7804,25,14.54,0,4,81.6,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T16:46:12+00:00,rtxpro6000server,97429,C.39324136,1,2,62,380.68,49,7804,25,14.52,0,4,82.4,k10temp_tctl,,
2026-06-04T16:46:42+00:00,rtxpro6000server,97429,C.39324136,1,2,69,385.89,13,7804,25,15.01,0,4,82.4,k10temp_tctl,,
2026-06-04T16:47:12+00:00,rtxpro6000server,97429,C.39324136,1,2,64,435.53,86,7804,25,14.70,0,4,82.4,k10temp_tctl,,
2026-06-04T16:47:42+00:00,rtxpro6000server,97429,C.39324136,1,2,69,411.34,28,7804,25,14.72,0,4,82.2,k10temp_tctl,,
2026-06-04T16:48:12+00:00,rtxpro6000server,97429,C.39324136,1,2,64,424.87,74,7804,25,14.17,0,4,82.4,k10temp_tctl,,
2026-06-04T16:48:42+00:00,rtxpro6000server,97429,C.39324136,1,2,62,350.80,18,7804,25,14.41,0,4,82.6,k10temp_tctl,,
2026-06-04T16:49:13+00:00,rtxpro6000server,97429,C.39324136,1,2,64,431.62,71,7804,25,14.52,0,4,82.4,k10temp_tctl,,
2026-06-04T16:49:43+00:00,rtxpro6000server,97429,C.39324136,1,2,70,415.58,75,7804,25,14.44,0,4,82.5,k10temp_tctl,,
2026-06-04T16:50:13+00:00,rtxpro6000server,97429,C.39324136,1,2,69,420.08,45,7804,26,14.81,0,4,82.1,k10temp_tctl,,
2026-06-04T16:50:43+00:00,rtxpro6000server,97429,C.39324136,1,2,71,417.49,44,7804,25,14.54,0,4,81.6,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

