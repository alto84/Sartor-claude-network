---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T19:53:39+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 79.1C >75C sustained 3 samples

## Latest sample
```
2026-06-04T19:53:39+00:00,rtxpro6000server,97429,C.39324136,1,2,61,400.36,53,4014,26,14.75,0,4,79.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T19:46:10+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.51,0,1,25,13.26,0,1,39.9,k10temp_tctl,,
2026-06-04T19:47:40+00:00,rtxpro6000server,97429,C.39324136,1,2,26,5.49,0,1,25,13.98,0,1,40.8,k10temp_tctl,,
2026-06-04T19:49:05+00:00,rtxpro6000server,97429,C.39324136,1,2,26,6.78,0,1,25,14.13,0,1,42.8,k10temp_tctl,,
2026-06-04T19:50:36+00:00,rtxpro6000server,97429,C.39324136,1,2,43,391.16,57,3438,25,14.95,0,4,66.9,k10temp_tctl,,
2026-06-04T19:51:08+00:00,rtxpro6000server,97429,C.39324136,1,2,54,351.90,63,3822,25,14.58,0,4,69.5,k10temp_tctl,,
2026-06-04T19:51:38+00:00,rtxpro6000server,97429,C.39324136,1,2,59,390.39,54,4014,25,14.60,0,4,71.8,k10temp_tctl,,
2026-06-04T19:52:08+00:00,rtxpro6000server,97429,C.39324136,1,2,63,384.01,49,4014,25,14.60,0,4,74.8,k10temp_tctl,,
2026-06-04T19:52:38+00:00,rtxpro6000server,97429,C.39324136,1,2,63,347.31,26,4014,26,14.54,0,4,75.6,k10temp_tctl,,
2026-06-04T19:53:08+00:00,rtxpro6000server,97429,C.39324136,1,2,60,369.40,48,4014,26,14.72,0,4,77.2,k10temp_tctl,,
2026-06-04T19:53:39+00:00,rtxpro6000server,97429,C.39324136,1,2,61,400.36,53,4014,26,14.75,0,4,79.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

