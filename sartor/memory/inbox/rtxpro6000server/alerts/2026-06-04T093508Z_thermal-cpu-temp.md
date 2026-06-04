---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T09:35:08+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 76.2C >75C sustained 3 samples

## Latest sample
```
2026-06-04T09:34:08+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.51,0,1,27,14.49,0,1,76.2,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T09:25:56+00:00,rtxpro6000server,97429,C.39324136,1,2,27,5.57,0,1,27,14.39,0,1,80.9,k10temp_tctl,,
2026-06-04T09:26:26+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.57,0,1,27,14.16,0,1,79.9,k10temp_tctl,,
2026-06-04T09:27:05+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.63,0,1,27,14.29,0,1,80.6,k10temp_tctl,,
2026-06-04T09:27:41+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.55,0,1,27,14.55,0,1,77.9,k10temp_tctl,,
2026-06-04T09:28:41+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.53,0,1,27,14.33,0,1,77.4,k10temp_tctl,,
2026-06-04T09:29:34+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.61,0,1,27,14.40,0,1,77.4,k10temp_tctl,,
2026-06-04T09:30:26+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.53,0,1,27,14.35,0,1,77.5,k10temp_tctl,,
2026-06-04T09:31:12+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.34,0,1,27,14.46,0,1,77.4,k10temp_tctl,,
2026-06-04T09:33:20+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.41,0,1,27,14.31,0,1,75.8,k10temp_tctl,,
2026-06-04T09:34:08+00:00,rtxpro6000server,97429,C.39324136,1,2,28,5.51,0,1,27,14.49,0,1,76.2,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

