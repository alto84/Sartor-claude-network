---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T10:03:08+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.2C >75C sustained 3 samples

## Latest sample
```
2026-06-04T10:03:08+00:00,rtxpro6000server,97429,C.39324136,1,2,64,425.90,64,7822,26,15.05,0,4,78.2,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T09:58:36+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.47,0,1,25,14.54,0,1,35.0,k10temp_tctl,,
2026-06-04T09:59:07+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.56,0,1,25,14.41,0,1,41.4,k10temp_tctl,,
2026-06-04T09:59:37+00:00,rtxpro6000server,97429,C.39324136,1,2,27,6.75,0,2,25,14.39,0,2,53.6,k10temp_tctl,,
2026-06-04T10:00:07+00:00,rtxpro6000server,97429,C.39324136,1,2,52,423.45,71,7420,25,15.04,0,4,65.6,k10temp_tctl,,
2026-06-04T10:00:37+00:00,rtxpro6000server,97429,C.39324136,1,2,60,390.04,51,7420,25,14.93,0,4,68.4,k10temp_tctl,,
2026-06-04T10:01:07+00:00,rtxpro6000server,97429,C.39324136,1,2,59,434.16,87,7822,25,14.83,0,4,72.1,k10temp_tctl,,
2026-06-04T10:01:38+00:00,rtxpro6000server,97429,C.39324136,1,2,65,425.13,100,7822,25,15.28,0,4,74.9,k10temp_tctl,,
2026-06-04T10:02:08+00:00,rtxpro6000server,97429,C.39324136,1,2,67,419.08,82,7822,25,15.06,0,4,76.4,k10temp_tctl,,
2026-06-04T10:02:38+00:00,rtxpro6000server,97429,C.39324136,1,2,65,415.09,59,7822,25,15.03,0,4,77.2,k10temp_tctl,,
2026-06-04T10:03:08+00:00,rtxpro6000server,97429,C.39324136,1,2,64,425.90,64,7822,26,15.05,0,4,78.2,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

