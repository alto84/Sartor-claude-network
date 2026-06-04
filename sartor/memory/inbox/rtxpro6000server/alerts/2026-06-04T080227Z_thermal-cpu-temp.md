---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T08:02:27+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 76.2C >75C sustained 3 samples

## Latest sample
```
2026-06-04T08:02:27+00:00,rtxpro6000server,97429,C.39324136,1,2,66,426.78,93,7996,28,14.37,0,4,76.2,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T07:39:38+00:00,rtxpro6000server,97429,C.39324136,1,2,70,423.24,62,7996,25,14.80,0,4,83.0,k10temp_tctl,,
2026-06-04T07:41:08+00:00,rtxpro6000server,97429,C.39324136,1,2,68,419.16,65,7996,25,14.44,0,4,83.0,k10temp_tctl,,
2026-06-04T07:42:08+00:00,rtxpro6000server,97429,C.39324136,1,2,68,429.64,98,7996,25,14.44,0,4,82.1,k10temp_tctl,,
2026-06-04T07:43:06+00:00,rtxpro6000server,97429,C.39324136,1,2,70,425.73,55,7996,25,14.10,0,4,78.9,k10temp_tctl,1200,1560
2026-06-04T07:44:02+00:00,rtxpro6000server,97429,C.39324136,1,2,63,424.14,85,7996,25,15.09,0,4,75.1,k10temp_tctl,1200,1560
2026-06-04T07:45:20+00:00,rtxpro6000server,97429,C.39324136,1,2,61,351.46,54,7996,25,14.29,0,4,74.8,k10temp_tctl,1200,1560
2026-06-04T07:46:22+00:00,rtxpro6000server,97429,C.39324136,1,2,64,342.73,61,7996,25,14.13,0,4,74.5,k10temp_tctl,,
2026-06-04T08:00:26+00:00,rtxpro6000server,97429,C.39324136,1,2,65,431.17,88,7996,28,14.55,0,4,76.6,k10temp_tctl,,
2026-06-04T08:01:57+00:00,rtxpro6000server,97429,C.39324136,1,2,68,417.16,69,7996,28,14.39,0,4,76.8,k10temp_tctl,,
2026-06-04T08:02:27+00:00,rtxpro6000server,97429,C.39324136,1,2,66,426.78,93,7996,28,14.37,0,4,76.2,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

