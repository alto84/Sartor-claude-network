---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-05T07:07:40+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 75.1C >75C sustained 3 samples

## Latest sample
```
2026-06-05T07:07:39+00:00,rtxpro6000server,97429,C.39324136,1,2,70,428.07,41,5790,26,14.35,0,4,75.1,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-05T07:01:49+00:00,rtxpro6000server,97429,C.39324136,1,2,66,417.34,72,5790,27,14.57,0,4,81.1,k10temp_tctl,,
2026-06-05T07:02:35+00:00,rtxpro6000server,97429,C.39324136,1,2,72,415.64,58,5790,27,14.31,0,4,80.4,k10temp_tctl,,
2026-06-05T07:03:21+00:00,rtxpro6000server,97429,C.39324136,1,2,62,324.30,8,5790,27,14.09,0,4,80.0,k10temp_tctl,,
2026-06-05T07:03:58+00:00,rtxpro6000server,97429,C.39324136,1,2,70,412.36,49,5790,26,14.33,0,4,79.4,k10temp_tctl,,
2026-06-05T07:04:45+00:00,rtxpro6000server,97429,C.39324136,1,2,70,401.85,39,5790,26,14.21,0,4,76.6,k10temp_tctl,,
2026-06-05T07:05:39+00:00,rtxpro6000server,97429,C.39324136,1,2,66,413.52,96,5790,26,14.41,0,4,76.0,k10temp_tctl,,
2026-06-05T07:06:09+00:00,rtxpro6000server,97429,C.39324136,1,2,70,408.07,42,5790,26,14.26,0,4,75.6,k10temp_tctl,,
2026-06-05T07:06:39+00:00,rtxpro6000server,97429,C.39324136,1,2,69,410.70,52,5790,26,14.46,0,4,75.1,k10temp_tctl,,
2026-06-05T07:07:09+00:00,rtxpro6000server,97429,C.39324136,1,2,69,430.92,98,5790,26,14.19,0,4,75.2,k10temp_tctl,,
2026-06-05T07:07:39+00:00,rtxpro6000server,97429,C.39324136,1,2,70,428.07,41,5790,26,14.35,0,4,75.1,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

