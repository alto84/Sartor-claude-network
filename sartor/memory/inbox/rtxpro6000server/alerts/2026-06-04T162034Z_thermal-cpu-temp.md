---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T16:20:34+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 82.4C >75C sustained 3 samples

## Latest sample
```
2026-06-04T16:20:33+00:00,rtxpro6000server,97429,C.39324136,1,2,65,414.35,70,7804,27,14.76,0,4,82.4,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T16:16:02+00:00,rtxpro6000server,97429,C.39324136,1,2,70,347.10,46,7804,25,13.98,0,4,82.5,k10temp_tctl,,
2026-06-04T16:16:32+00:00,rtxpro6000server,97429,C.39324136,1,2,67,433.34,97,7804,25,14.70,0,4,82.2,k10temp_tctl,,
2026-06-04T16:17:02+00:00,rtxpro6000server,97429,C.39324136,1,2,71,407.87,77,7804,26,15.20,0,4,82.0,k10temp_tctl,,
2026-06-04T16:17:32+00:00,rtxpro6000server,97429,C.39324136,1,2,65,424.67,88,7804,26,14.83,0,4,82.1,k10temp_tctl,,
2026-06-04T16:18:03+00:00,rtxpro6000server,97429,C.39324136,1,2,71,438.91,75,7804,26,14.88,0,4,81.9,k10temp_tctl,,
2026-06-04T16:18:33+00:00,rtxpro6000server,97429,C.39324136,1,2,66,411.15,99,7804,26,14.75,0,4,81.9,k10temp_tctl,,
2026-06-04T16:19:03+00:00,rtxpro6000server,97429,C.39324136,1,2,67,415.67,31,7804,26,14.87,0,4,82.4,k10temp_tctl,,
2026-06-04T16:19:33+00:00,rtxpro6000server,97429,C.39324136,1,2,70,419.56,43,7804,26,14.66,0,4,82.1,k10temp_tctl,,
2026-06-04T16:20:03+00:00,rtxpro6000server,97429,C.39324136,1,2,71,423.90,74,7804,26,15.94,0,4,82.0,k10temp_tctl,,
2026-06-04T16:20:33+00:00,rtxpro6000server,97429,C.39324136,1,2,65,414.35,70,7804,27,14.76,0,4,82.4,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

