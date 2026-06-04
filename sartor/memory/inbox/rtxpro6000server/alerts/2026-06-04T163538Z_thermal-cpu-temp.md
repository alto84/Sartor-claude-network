---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T16:35:38+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 82.8C >75C sustained 3 samples

## Latest sample
```
2026-06-04T16:35:38+00:00,rtxpro6000server,97429,C.39324136,1,2,68,326.22,47,7804,26,14.74,0,4,82.8,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T16:31:07+00:00,rtxpro6000server,97429,C.39324136,1,2,65,422.21,75,7804,26,14.74,0,4,82.5,k10temp_tctl,,
2026-06-04T16:31:37+00:00,rtxpro6000server,97429,C.39324136,1,2,68,333.50,37,7804,26,14.21,0,4,82.8,k10temp_tctl,,
2026-06-04T16:32:07+00:00,rtxpro6000server,97429,C.39324136,1,2,65,424.73,81,7804,26,14.03,0,4,82.5,k10temp_tctl,,
2026-06-04T16:32:37+00:00,rtxpro6000server,97429,C.39324136,1,2,70,423.91,85,7804,26,14.44,0,4,82.4,k10temp_tctl,,
2026-06-04T16:33:08+00:00,rtxpro6000server,97429,C.39324136,1,2,64,420.11,68,7804,26,14.68,0,4,82.5,k10temp_tctl,,
2026-06-04T16:33:38+00:00,rtxpro6000server,97429,C.39324136,1,2,70,429.62,83,7804,26,14.56,0,4,82.4,k10temp_tctl,,
2026-06-04T16:34:08+00:00,rtxpro6000server,97429,C.39324136,1,2,67,428.93,99,7804,26,14.85,0,4,82.6,k10temp_tctl,,
2026-06-04T16:34:38+00:00,rtxpro6000server,97429,C.39324136,1,2,68,407.09,40,7804,25,14.38,0,4,82.1,k10temp_tctl,,
2026-06-04T16:35:08+00:00,rtxpro6000server,97429,C.39324136,1,2,64,426.82,77,7804,26,14.73,0,4,82.0,k10temp_tctl,,
2026-06-04T16:35:38+00:00,rtxpro6000server,97429,C.39324136,1,2,68,326.22,47,7804,26,14.74,0,4,82.8,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

