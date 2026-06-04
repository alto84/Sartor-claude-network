---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T11:46:34+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 81.1C >75C sustained 3 samples

## Latest sample
```
2026-06-04T11:46:34+00:00,rtxpro6000server,97429,C.39324136,1,2,72,428.70,76,7822,28,15.05,0,4,81.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T11:42:03+00:00,rtxpro6000server,97429,C.39324136,1,2,72,421.27,82,7822,28,14.35,0,4,80.2,k10temp_tctl,,
2026-06-04T11:42:33+00:00,rtxpro6000server,97429,C.39324136,1,2,72,419.60,59,7822,28,14.57,0,4,80.5,k10temp_tctl,,
2026-06-04T11:43:03+00:00,rtxpro6000server,97429,C.39324136,1,2,70,430.53,98,7822,28,14.82,0,4,80.5,k10temp_tctl,,
2026-06-04T11:43:33+00:00,rtxpro6000server,97429,C.39324136,1,2,73,435.98,65,7822,28,14.81,0,4,80.6,k10temp_tctl,,
2026-06-04T11:44:03+00:00,rtxpro6000server,97429,C.39324136,1,2,70,422.82,53,7822,28,14.67,0,4,80.8,k10temp_tctl,,
2026-06-04T11:44:34+00:00,rtxpro6000server,97429,C.39324136,1,2,69,424.84,100,7822,28,14.71,0,4,80.6,k10temp_tctl,,
2026-06-04T11:45:04+00:00,rtxpro6000server,97429,C.39324136,1,2,72,422.97,74,7822,28,14.62,0,4,80.9,k10temp_tctl,,
2026-06-04T11:45:34+00:00,rtxpro6000server,97429,C.39324136,1,2,73,421.29,68,7822,28,14.62,0,4,81.0,k10temp_tctl,,
2026-06-04T11:46:04+00:00,rtxpro6000server,97429,C.39324136,1,2,65,377.33,36,7822,28,14.50,0,4,81.0,k10temp_tctl,,
2026-06-04T11:46:34+00:00,rtxpro6000server,97429,C.39324136,1,2,72,428.70,76,7822,28,15.05,0,4,81.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

