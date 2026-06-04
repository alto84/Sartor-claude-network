---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T12:01:39+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.9C >75C sustained 3 samples

## Latest sample
```
2026-06-04T12:01:39+00:00,rtxpro6000server,97429,C.39324136,1,2,70,424.41,59,7822,25,14.33,0,4,78.9,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T11:57:08+00:00,rtxpro6000server,97429,C.39324136,1,2,64,329.11,61,7822,26,14.51,0,4,79.2,k10temp_tctl,,
2026-06-04T11:57:38+00:00,rtxpro6000server,97429,C.39324136,1,2,71,434.02,86,7822,26,14.52,0,4,79.4,k10temp_tctl,,
2026-06-04T11:58:08+00:00,rtxpro6000server,97429,C.39324136,1,2,64,418.02,65,7822,25,15.36,0,4,79.2,k10temp_tctl,,
2026-06-04T11:58:38+00:00,rtxpro6000server,97429,C.39324136,1,2,69,424.76,68,7822,25,14.60,0,4,78.9,k10temp_tctl,,
2026-06-04T11:59:08+00:00,rtxpro6000server,97429,C.39324136,1,2,66,422.15,53,7822,25,14.75,0,4,78.9,k10temp_tctl,,
2026-06-04T11:59:38+00:00,rtxpro6000server,97429,C.39324136,1,2,71,420.30,75,7822,25,14.89,0,4,79.1,k10temp_tctl,,
2026-06-04T12:00:08+00:00,rtxpro6000server,97429,C.39324136,1,2,65,421.03,55,7822,25,14.49,0,4,78.5,k10temp_tctl,,
2026-06-04T12:00:39+00:00,rtxpro6000server,97429,C.39324136,1,2,71,423.70,71,7822,25,14.66,0,4,78.9,k10temp_tctl,,
2026-06-04T12:01:09+00:00,rtxpro6000server,97429,C.39324136,1,2,69,435.19,61,7822,25,14.40,0,4,78.6,k10temp_tctl,,
2026-06-04T12:01:39+00:00,rtxpro6000server,97429,C.39324136,1,2,70,424.41,59,7822,25,14.33,0,4,78.9,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

