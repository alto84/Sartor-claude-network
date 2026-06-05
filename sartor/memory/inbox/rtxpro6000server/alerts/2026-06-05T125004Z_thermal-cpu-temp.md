---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-05T12:50:04+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 80.1C >75C sustained 3 samples

## Latest sample
```
2026-06-05T12:49:04+00:00,rtxpro6000server,97429,C.39324136,1,2,59,336.23,20,3438,26,14.28,0,4,80.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-05T12:35:32+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.52,0,1,26,14.39,0,1,41.1,k10temp_tctl,,
2026-06-05T12:37:02+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.50,0,1,26,14.60,0,1,41.6,k10temp_tctl,,
2026-06-05T12:38:33+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.49,0,1,27,14.44,0,1,45.5,k10temp_tctl,,
2026-06-05T12:40:03+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.38,0,1,27,14.45,0,1,44.8,k10temp_tctl,,
2026-06-05T12:41:33+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.45,0,1,27,14.38,0,1,41.5,k10temp_tctl,,
2026-06-05T12:43:03+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.44,0,1,27,14.18,0,1,44.9,k10temp_tctl,,
2026-06-05T12:44:33+00:00,rtxpro6000server,97429,C.39324136,1,2,45,344.86,48,3438,27,14.35,0,4,69.6,k10temp_tctl,,
2026-06-05T12:46:04+00:00,rtxpro6000server,97429,C.39324136,1,2,51,293.80,0,3438,27,14.42,0,4,76.1,k10temp_tctl,,
2026-06-05T12:47:34+00:00,rtxpro6000server,97429,C.39324136,1,2,56,341.62,27,3438,27,14.49,0,4,79.5,k10temp_tctl,,
2026-06-05T12:49:04+00:00,rtxpro6000server,97429,C.39324136,1,2,59,336.23,20,3438,26,14.28,0,4,80.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

