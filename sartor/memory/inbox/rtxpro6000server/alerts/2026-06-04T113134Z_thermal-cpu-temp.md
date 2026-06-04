---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T11:31:34+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.1C >75C sustained 3 samples

## Latest sample
```
2026-06-04T11:30:38+00:00,rtxpro6000server,97429,C.39324136,1,2,70,414.30,52,7822,25,13.79,0,4,78.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T11:20:26+00:00,rtxpro6000server,97429,C.39324136,1,2,71,436.93,68,7822,27,14.28,0,4,75.9,k10temp_tctl,,
2026-06-04T11:21:41+00:00,rtxpro6000server,97429,C.39324136,1,2,68,415.82,64,7822,27,14.16,0,4,75.8,k10temp_tctl,,
2026-06-04T11:22:36+00:00,rtxpro6000server,97429,C.39324136,1,2,71,433.82,58,7822,26,14.43,0,4,75.6,k10temp_tctl,,
2026-06-04T11:23:57+00:00,rtxpro6000server,97429,C.39324136,1,2,70,426.84,99,7822,26,14.23,0,4,75.9,k10temp_tctl,,
2026-06-04T11:25:27+00:00,rtxpro6000server,97429,C.39324136,1,2,70,421.13,50,7822,26,14.47,0,4,74.8,k10temp_tctl,,
2026-06-04T11:26:57+00:00,rtxpro6000server,97429,C.39324136,1,2,68,427.56,99,7822,26,14.30,0,4,74.6,k10temp_tctl,,
2026-06-04T11:28:27+00:00,rtxpro6000server,97429,C.39324136,1,2,70,423.54,73,7822,26,13.83,0,4,74.2,k10temp_tctl,,
2026-06-04T11:29:12+00:00,rtxpro6000server,97429,C.39324136,1,2,67,416.88,66,7822,25,14.22,0,4,75.1,k10temp_tctl,,
2026-06-04T11:29:50+00:00,rtxpro6000server,97429,C.39324136,1,2,70,428.32,73,7822,25,14.33,0,4,77.0,k10temp_tctl,,
2026-06-04T11:30:38+00:00,rtxpro6000server,97429,C.39324136,1,2,70,414.30,52,7822,25,13.79,0,4,78.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

