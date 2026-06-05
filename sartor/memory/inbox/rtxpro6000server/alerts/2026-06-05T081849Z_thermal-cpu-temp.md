---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-05T08:18:49+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.1C >75C sustained 3 samples

## Latest sample
```
2026-06-05T08:18:33+00:00,rtxpro6000server,97429,C.39324136,1,2,70,439.83,63,5790,25,14.16,0,4,78.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-05T08:07:47+00:00,rtxpro6000server,97429,C.39324136,1,2,64,424.49,89,5790,25,13.99,0,4,74.4,k10temp_tctl,,
2026-06-05T08:09:17+00:00,rtxpro6000server,97429,C.39324136,1,2,69,333.35,37,5790,25,13.78,0,4,74.6,k10temp_tctl,,
2026-06-05T08:10:47+00:00,rtxpro6000server,97429,C.39324136,1,2,68,430.89,96,5790,25,14.29,0,4,74.0,k10temp_tctl,,
2026-06-05T08:12:17+00:00,rtxpro6000server,97429,C.39324136,1,2,69,417.94,44,5790,25,13.80,0,4,74.1,k10temp_tctl,,
2026-06-05T08:13:48+00:00,rtxpro6000server,97429,C.39324136,1,2,67,423.63,46,5790,25,14.12,0,4,74.5,k10temp_tctl,,
2026-06-05T08:15:18+00:00,rtxpro6000server,97429,C.39324136,1,2,69,422.81,77,5790,25,14.13,0,4,74.4,k10temp_tctl,,
2026-06-05T08:16:29+00:00,rtxpro6000server,97429,C.39324136,1,2,70,414.16,51,5790,25,14.02,0,4,74.2,k10temp_tctl,,
2026-06-05T08:17:09+00:00,rtxpro6000server,97429,C.39324136,1,2,71,417.82,66,5790,25,13.70,0,4,76.4,k10temp_tctl,,
2026-06-05T08:17:56+00:00,rtxpro6000server,97429,C.39324136,1,2,69,429.12,86,5790,25,14.17,0,4,77.4,k10temp_tctl,,
2026-06-05T08:18:33+00:00,rtxpro6000server,97429,C.39324136,1,2,70,439.83,63,5790,25,14.16,0,4,78.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

