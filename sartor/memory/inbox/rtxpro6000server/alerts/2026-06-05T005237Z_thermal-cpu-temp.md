---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-05T00:52:37+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 77.6C >75C sustained 3 samples

## Latest sample
```
2026-06-05T00:52:29+00:00,rtxpro6000server,97429,C.39324136,1,2,68,359.20,92,5790,26,14.64,0,4,77.6,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-05T00:44:11+00:00,rtxpro6000server,97429,C.39324136,1,2,63,367.00,0,5790,26,14.43,0,4,75.0,k10temp_tctl,,
2026-06-05T00:44:59+00:00,rtxpro6000server,97429,C.39324136,1,2,61,367.32,67,5790,26,14.47,0,4,74.8,k10temp_tctl,,
2026-06-05T00:45:44+00:00,rtxpro6000server,97429,C.39324136,1,2,60,365.85,40,5790,26,14.57,0,4,74.8,k10temp_tctl,,
2026-06-05T00:47:09+00:00,rtxpro6000server,97429,C.39324136,1,2,68,355.53,46,5790,26,14.38,0,4,74.5,k10temp_tctl,,
2026-06-05T00:48:05+00:00,rtxpro6000server,97429,C.39324136,1,2,60,390.21,53,5790,26,14.69,0,4,74.4,k10temp_tctl,,
2026-06-05T00:49:30+00:00,rtxpro6000server,97429,C.39324136,1,2,60,341.68,41,5790,26,14.59,0,4,74.4,k10temp_tctl,,
2026-06-05T00:50:22+00:00,rtxpro6000server,97429,C.39324136,1,2,60,369.45,61,5790,26,14.37,0,4,74.8,k10temp_tctl,,
2026-06-05T00:50:57+00:00,rtxpro6000server,97429,C.39324136,1,2,62,401.26,69,5790,26,14.24,0,4,76.1,k10temp_tctl,,
2026-06-05T00:51:33+00:00,rtxpro6000server,97429,C.39324136,1,2,68,378.55,45,5790,26,14.44,0,4,77.5,k10temp_tctl,,
2026-06-05T00:52:29+00:00,rtxpro6000server,97429,C.39324136,1,2,68,359.20,92,5790,26,14.64,0,4,77.6,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

