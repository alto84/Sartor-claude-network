---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T16:05:29+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 81.5C >75C sustained 3 samples

## Latest sample
```
2026-06-04T16:05:29+00:00,rtxpro6000server,97429,C.39324136,1,2,70,427.60,50,7804,25,15.05,0,4,81.5,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T16:00:57+00:00,rtxpro6000server,97429,C.39324136,1,2,68,418.37,100,7804,25,14.76,0,4,82.1,k10temp_tctl,,
2026-06-04T16:01:27+00:00,rtxpro6000server,97429,C.39324136,1,2,66,425.67,98,7804,25,14.76,0,4,82.0,k10temp_tctl,,
2026-06-04T16:01:57+00:00,rtxpro6000server,97429,C.39324136,1,2,70,417.55,52,7804,25,14.76,0,4,81.1,k10temp_tctl,,
2026-06-04T16:02:28+00:00,rtxpro6000server,97429,C.39324136,1,2,70,416.75,55,7804,25,14.54,0,4,81.2,k10temp_tctl,,
2026-06-04T16:02:58+00:00,rtxpro6000server,97429,C.39324136,1,2,68,362.64,97,7804,25,14.18,0,4,81.6,k10temp_tctl,,
2026-06-04T16:03:28+00:00,rtxpro6000server,97429,C.39324136,1,2,63,429.87,95,7804,25,14.78,0,4,81.8,k10temp_tctl,,
2026-06-04T16:03:58+00:00,rtxpro6000server,97429,C.39324136,1,2,70,429.27,62,7804,25,14.63,0,4,81.2,k10temp_tctl,,
2026-06-04T16:04:28+00:00,rtxpro6000server,97429,C.39324136,1,2,64,428.54,68,7804,25,14.87,0,4,81.2,k10temp_tctl,,
2026-06-04T16:04:58+00:00,rtxpro6000server,97429,C.39324136,1,2,67,419.51,99,7804,25,15.34,0,4,81.8,k10temp_tctl,,
2026-06-04T16:05:29+00:00,rtxpro6000server,97429,C.39324136,1,2,70,427.60,50,7804,25,15.05,0,4,81.5,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

