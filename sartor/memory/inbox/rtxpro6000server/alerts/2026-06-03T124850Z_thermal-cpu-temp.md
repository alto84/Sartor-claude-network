---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-03T12:48:50+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 81.2C >75C sustained 3 samples

## Latest sample
```
2026-06-03T12:48:46+00:00,rtxpro6000server,97429,C.39283585,1,2,72,407.34,91,20638,61,419.38,92,58724,81.2,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-03T12:41:07+00:00,rtxpro6000server,97429,C.39283585,1,2,64,375.87,90,20638,26,14.38,0,4,64.0,k10temp_tctl,,
2026-06-03T12:41:55+00:00,rtxpro6000server,97429,C.39283585,1,2,65,424.93,94,20638,26,15.42,0,4,65.0,k10temp_tctl,,
2026-06-03T12:42:41+00:00,rtxpro6000server,97429,C.39283585,1,2,66,424.92,95,20638,26,14.93,0,4,66.5,k10temp_tctl,,
2026-06-03T12:43:39+00:00,rtxpro6000server,97429,C.39283585,1,2,66,425.07,94,20638,26,14.94,0,4,65.8,k10temp_tctl,,
2026-06-03T12:44:27+00:00,rtxpro6000server,97429,C.39283585,1,2,65,391.60,91,20638,27,15.00,0,4,65.6,k10temp_tctl,,
2026-06-03T12:45:17+00:00,rtxpro6000server,97429,C.39283585,1,2,66,427.38,93,20638,27,16.51,0,4,66.6,k10temp_tctl,,
2026-06-03T12:46:13+00:00,rtxpro6000server,97429,C.39283585,1,2,67,425.39,94,20638,27,15.59,0,4,66.1,k10temp_tctl,,
2026-06-03T12:46:59+00:00,rtxpro6000server,97429,C.39283585,1,2,67,424.80,93,20638,30,105.29,53,52886,78.5,k10temp_tctl,,
2026-06-03T12:47:47+00:00,rtxpro6000server,97429,C.39283585,1,2,69,425.26,94,20638,52,404.84,92,58724,80.8,k10temp_tctl,,
2026-06-03T12:48:46+00:00,rtxpro6000server,97429,C.39283585,1,2,72,407.34,91,20638,61,419.38,92,58724,81.2,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

