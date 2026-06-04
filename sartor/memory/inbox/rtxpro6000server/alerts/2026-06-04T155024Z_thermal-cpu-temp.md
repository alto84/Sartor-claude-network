---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T15:50:24+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.0C >75C sustained 3 samples

## Latest sample
```
2026-06-04T15:50:24+00:00,rtxpro6000server,97429,C.39324136,1,2,69,412.94,51,7804,25,14.71,0,4,78.0,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T15:45:29+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.37,0,1,25,14.55,0,1,57.8,k10temp_tctl,,
2026-06-04T15:46:22+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.36,0,1,25,14.18,0,1,56.9,k10temp_tctl,,
2026-06-04T15:46:53+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.44,0,1,25,14.09,0,1,43.1,k10temp_tctl,,
2026-06-04T15:47:23+00:00,rtxpro6000server,97429,C.39324136,1,2,45,431.28,89,7420,25,15.00,0,4,65.9,k10temp_tctl,,
2026-06-04T15:47:53+00:00,rtxpro6000server,97429,C.39324136,1,2,55,436.73,91,7804,25,14.73,0,4,68.5,k10temp_tctl,,
2026-06-04T15:48:23+00:00,rtxpro6000server,97429,C.39324136,1,2,60,404.20,73,7804,25,14.51,0,4,71.8,k10temp_tctl,,
2026-06-04T15:48:53+00:00,rtxpro6000server,97429,C.39324136,1,2,63,425.88,100,7804,25,14.42,0,4,74.4,k10temp_tctl,,
2026-06-04T15:49:23+00:00,rtxpro6000server,97429,C.39324136,1,2,63,407.40,47,7804,25,14.60,0,4,75.8,k10temp_tctl,,
2026-06-04T15:49:54+00:00,rtxpro6000server,97429,C.39324136,1,2,66,323.30,26,7804,25,13.98,0,4,77.4,k10temp_tctl,,
2026-06-04T15:50:24+00:00,rtxpro6000server,97429,C.39324136,1,2,69,412.94,51,7804,25,14.71,0,4,78.0,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

