---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T23:53:04+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 84.0C >75C sustained 3 samples

## Latest sample
```
2026-06-04T23:53:04+00:00,rtxpro6000server,97429,C.39324136,1,2,69,368.83,63,5790,26,13.88,0,4,84.0,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T23:48:32+00:00,rtxpro6000server,97429,C.39324136,1,2,62,364.78,62,5790,26,14.21,0,4,83.8,k10temp_tctl,,
2026-06-04T23:49:02+00:00,rtxpro6000server,97429,C.39324136,1,2,63,383.39,85,5790,26,13.64,0,4,83.2,k10temp_tctl,,
2026-06-04T23:49:33+00:00,rtxpro6000server,97429,C.39324136,1,2,68,362.32,54,5790,26,13.61,0,4,84.0,k10temp_tctl,,
2026-06-04T23:50:03+00:00,rtxpro6000server,97429,C.39324136,1,2,61,366.45,8,5790,26,13.40,0,4,83.5,k10temp_tctl,,
2026-06-04T23:50:33+00:00,rtxpro6000server,97429,C.39324136,1,2,69,368.73,36,5790,26,13.83,0,4,83.9,k10temp_tctl,,
2026-06-04T23:51:03+00:00,rtxpro6000server,97429,C.39324136,1,2,69,354.51,74,5790,26,13.61,0,4,84.0,k10temp_tctl,,
2026-06-04T23:51:33+00:00,rtxpro6000server,97429,C.39324136,1,2,60,347.29,0,5790,26,13.69,0,4,84.0,k10temp_tctl,,
2026-06-04T23:52:03+00:00,rtxpro6000server,97429,C.39324136,1,2,60,315.81,82,5790,26,13.53,0,4,84.0,k10temp_tctl,,
2026-06-04T23:52:34+00:00,rtxpro6000server,97429,C.39324136,1,2,68,384.88,41,5790,26,13.81,0,4,83.9,k10temp_tctl,,
2026-06-04T23:53:04+00:00,rtxpro6000server,97429,C.39324136,1,2,69,368.83,63,5790,26,13.88,0,4,84.0,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

