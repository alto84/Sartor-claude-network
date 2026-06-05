---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-05T13:17:28+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 75.1C >75C sustained 3 samples

## Latest sample
```
2026-06-05T13:17:28+00:00,rtxpro6000server,97429,C.39324136,1,2,68,393.46,35,5170,28,14.34,0,4,75.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-05T13:12:56+00:00,rtxpro6000server,97429,C.39324136,1,2,60,383.50,41,5170,26,13.99,0,4,74.2,k10temp_tctl,,
2026-06-05T13:13:27+00:00,rtxpro6000server,97429,C.39324136,1,2,66,346.84,23,5170,27,14.53,0,4,74.4,k10temp_tctl,,
2026-06-05T13:13:57+00:00,rtxpro6000server,97429,C.39324136,1,2,68,362.96,57,5170,27,14.93,0,4,74.5,k10temp_tctl,,
2026-06-05T13:14:27+00:00,rtxpro6000server,97429,C.39324136,1,2,60,404.13,42,5170,27,14.52,0,4,74.6,k10temp_tctl,,
2026-06-05T13:14:57+00:00,rtxpro6000server,97429,C.39324136,1,2,69,384.64,40,5170,27,14.35,0,4,74.8,k10temp_tctl,,
2026-06-05T13:15:27+00:00,rtxpro6000server,97429,C.39324136,1,2,56,122.42,0,5170,27,14.80,0,4,72.5,k10temp_tctl,,
2026-06-05T13:15:57+00:00,rtxpro6000server,97429,C.39324136,1,2,66,336.73,8,5170,27,14.35,0,4,74.9,k10temp_tctl,,
2026-06-05T13:16:28+00:00,rtxpro6000server,97429,C.39324136,1,2,64,365.90,0,5170,27,14.27,0,4,75.1,k10temp_tctl,,
2026-06-05T13:16:58+00:00,rtxpro6000server,97429,C.39324136,1,2,61,335.48,82,5170,28,14.60,0,4,75.1,k10temp_tctl,,
2026-06-05T13:17:28+00:00,rtxpro6000server,97429,C.39324136,1,2,68,393.46,35,5170,28,14.34,0,4,75.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

