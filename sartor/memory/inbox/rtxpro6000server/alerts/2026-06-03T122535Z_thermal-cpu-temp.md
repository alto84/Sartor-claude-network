---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-03T12:25:35+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 88.2C >75C sustained 3 samples

## Latest sample
```
2026-06-03T12:24:35+00:00,rtxpro6000server,97429,C.39283585,1,2,79,425.56,92,20638,67,425.15,95,20098,88.2,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-03T12:12:24+00:00,rtxpro6000server,97429,C.39283585,1,2,48,15.17,0,1,65,425.00,94,20098,78.6,k10temp_tctl,,
2026-06-03T12:13:54+00:00,rtxpro6000server,97429,C.39283585,1,2,43,13.30,0,1,65,425.05,94,20098,74.8,k10temp_tctl,,
2026-06-03T12:15:24+00:00,rtxpro6000server,97429,C.39283585,1,2,42,12.89,0,1,65,424.96,94,20098,72.1,k10temp_tctl,,
2026-06-03T12:16:35+00:00,rtxpro6000server,97429,C.39283585,1,2,42,12.18,0,1,65,408.05,91,20098,68.5,k10temp_tctl,,
2026-06-03T12:17:55+00:00,rtxpro6000server,97429,C.39283585,1,2,52,361.16,91,17944,65,424.99,95,20098,75.8,k10temp_tctl,,
2026-06-03T12:19:15+00:00,rtxpro6000server,97429,C.39283585,1,2,72,425.65,93,18124,66,425.06,95,20098,80.0,k10temp_tctl,,
2026-06-03T12:20:05+00:00,rtxpro6000server,97429,C.39283585,1,2,75,424.95,95,20502,66,425.40,93,20098,82.8,k10temp_tctl,,
2026-06-03T12:21:35+00:00,rtxpro6000server,97429,C.39283585,1,2,76,422.34,89,20638,67,425.15,93,20098,85.4,k10temp_tctl,,
2026-06-03T12:23:05+00:00,rtxpro6000server,97429,C.39283585,1,2,78,424.92,93,20638,67,421.64,92,20098,86.5,k10temp_tctl,,
2026-06-03T12:24:35+00:00,rtxpro6000server,97429,C.39283585,1,2,79,425.56,92,20638,67,425.15,95,20098,88.2,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

