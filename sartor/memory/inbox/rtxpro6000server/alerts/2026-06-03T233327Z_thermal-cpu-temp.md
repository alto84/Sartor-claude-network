---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-03T23:33:27+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 79.5C >75C sustained 3 samples

## Latest sample
```
2026-06-03T23:33:10+00:00,rtxpro6000server,97429,C.39324136,1,2,60,291.45,72,12244,25,14.67,0,4,79.5,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-03T23:27:02+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.84,0,1,25,14.77,0,1,40.8,k10temp_tctl,,
2026-06-03T23:27:33+00:00,rtxpro6000server,97429,C.39324136,1,2,27,42.34,0,1,25,14.29,0,1,51.6,k10temp_tctl,,
2026-06-03T23:28:03+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.91,0,1,25,14.51,0,1,41.1,k10temp_tctl,,
2026-06-03T23:28:33+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.73,0,1,25,14.54,0,1,41.0,k10temp_tctl,,
2026-06-03T23:29:03+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.70,0,1,25,14.35,0,1,41.5,k10temp_tctl,,
2026-06-03T23:29:49+00:00,rtxpro6000server,97429,C.39324136,1,2,51,370.74,99,12244,25,14.42,0,4,71.0,k10temp_tctl,,
2026-06-03T23:30:34+00:00,rtxpro6000server,97429,C.39324136,1,2,52,320.35,41,12244,25,14.63,0,4,73.6,k10temp_tctl,,
2026-06-03T23:31:26+00:00,rtxpro6000server,97429,C.39324136,1,2,64,363.24,71,12244,25,14.53,0,4,76.6,k10temp_tctl,,
2026-06-03T23:32:19+00:00,rtxpro6000server,97429,C.39324136,1,2,67,397.28,82,12244,25,14.70,0,4,78.4,k10temp_tctl,,
2026-06-03T23:33:10+00:00,rtxpro6000server,97429,C.39324136,1,2,60,291.45,72,12244,25,14.67,0,4,79.5,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

