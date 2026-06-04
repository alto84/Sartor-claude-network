---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T10:38:04+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 75.4C >75C sustained 3 samples

## Latest sample
```
2026-06-04T10:38:03+00:00,rtxpro6000server,97429,C.39324136,1,2,68,424.78,41,7822,27,14.74,0,4,75.4,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T10:33:32+00:00,rtxpro6000server,97429,C.39324136,1,2,67,428.08,100,7822,25,14.22,0,4,74.5,k10temp_tctl,,
2026-06-04T10:34:02+00:00,rtxpro6000server,97429,C.39324136,1,2,69,411.85,44,7822,26,14.34,0,4,74.4,k10temp_tctl,,
2026-06-04T10:34:32+00:00,rtxpro6000server,97429,C.39324136,1,2,68,423.72,49,7822,26,14.55,0,4,74.8,k10temp_tctl,,
2026-06-04T10:35:02+00:00,rtxpro6000server,97429,C.39324136,1,2,64,425.60,65,7822,26,14.47,0,4,74.4,k10temp_tctl,,
2026-06-04T10:35:33+00:00,rtxpro6000server,97429,C.39324136,1,2,69,420.73,62,7822,26,15.26,0,4,74.6,k10temp_tctl,,
2026-06-04T10:36:03+00:00,rtxpro6000server,97429,C.39324136,1,2,70,419.48,80,7822,26,14.48,0,4,74.4,k10temp_tctl,,
2026-06-04T10:36:33+00:00,rtxpro6000server,97429,C.39324136,1,2,65,434.38,91,7822,26,14.20,0,4,74.6,k10temp_tctl,,
2026-06-04T10:37:03+00:00,rtxpro6000server,97429,C.39324136,1,2,69,423.85,76,7822,26,14.24,0,4,75.1,k10temp_tctl,,
2026-06-04T10:37:33+00:00,rtxpro6000server,97429,C.39324136,1,2,68,429.36,100,7822,26,14.09,0,4,75.2,k10temp_tctl,,
2026-06-04T10:38:03+00:00,rtxpro6000server,97429,C.39324136,1,2,68,424.78,41,7822,27,14.74,0,4,75.4,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

