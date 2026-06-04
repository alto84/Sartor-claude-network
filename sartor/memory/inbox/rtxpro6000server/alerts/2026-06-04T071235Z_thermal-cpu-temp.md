---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T07:12:35+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.8C >75C sustained 3 samples

## Latest sample
```
2026-06-04T07:12:34+00:00,rtxpro6000server,97429,C.39324136,1,2,69,427.73,76,7804,26,14.57,0,4,78.8,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T07:08:03+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.55,0,1,25,13.79,0,1,48.4,k10temp_tctl,,
2026-06-04T07:08:33+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.58,0,1,25,14.12,0,1,49.0,k10temp_tctl,,
2026-06-04T07:09:03+00:00,rtxpro6000server,97429,C.39324136,1,2,28,44.62,0,1,25,14.17,0,1,50.0,k10temp_tctl,,
2026-06-04T07:09:33+00:00,rtxpro6000server,97429,C.39324136,1,2,41,425.68,87,7420,25,14.33,0,4,63.8,k10temp_tctl,,
2026-06-04T07:10:04+00:00,rtxpro6000server,97429,C.39324136,1,2,55,419.01,71,7804,25,14.57,0,4,67.5,k10temp_tctl,,
2026-06-04T07:10:34+00:00,rtxpro6000server,97429,C.39324136,1,2,61,433.68,76,7804,25,14.40,0,4,71.0,k10temp_tctl,,
2026-06-04T07:11:04+00:00,rtxpro6000server,97429,C.39324136,1,2,61,421.02,55,7804,25,14.12,0,4,74.5,k10temp_tctl,,
2026-06-04T07:11:34+00:00,rtxpro6000server,97429,C.39324136,1,2,64,418.39,62,7804,25,14.05,0,4,76.2,k10temp_tctl,,
2026-06-04T07:12:04+00:00,rtxpro6000server,97429,C.39324136,1,2,67,430.27,87,7804,25,14.53,0,4,77.6,k10temp_tctl,,
2026-06-04T07:12:34+00:00,rtxpro6000server,97429,C.39324136,1,2,69,427.73,76,7804,26,14.57,0,4,78.8,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

