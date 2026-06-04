---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T07:27:39+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 84.2C >75C sustained 3 samples

## Latest sample
```
2026-06-04T07:27:39+00:00,rtxpro6000server,97429,C.39324136,1,2,70,419.01,65,7996,27,14.93,0,4,84.2,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-04T07:23:08+00:00,rtxpro6000server,97429,C.39324136,1,2,72,429.14,100,7996,28,14.87,0,4,85.1,k10temp_tctl,,
2026-06-04T07:23:38+00:00,rtxpro6000server,97429,C.39324136,1,2,71,442.97,100,7996,28,14.86,0,4,84.8,k10temp_tctl,,
2026-06-04T07:24:08+00:00,rtxpro6000server,97429,C.39324136,1,2,72,434.35,100,7996,28,14.61,0,4,84.5,k10temp_tctl,,
2026-06-04T07:24:38+00:00,rtxpro6000server,97429,C.39324136,1,2,67,425.46,82,7996,28,14.98,0,4,84.9,k10temp_tctl,,
2026-06-04T07:25:08+00:00,rtxpro6000server,97429,C.39324136,1,2,72,420.63,82,7996,28,14.72,0,4,84.4,k10temp_tctl,,
2026-06-04T07:25:39+00:00,rtxpro6000server,97429,C.39324136,1,2,71,425.93,56,7996,28,14.96,0,4,84.2,k10temp_tctl,,
2026-06-04T07:26:09+00:00,rtxpro6000server,97429,C.39324136,1,2,69,428.01,100,7996,27,14.63,0,4,84.1,k10temp_tctl,,
2026-06-04T07:26:39+00:00,rtxpro6000server,97429,C.39324136,1,2,70,413.52,53,7996,27,14.59,0,4,84.1,k10temp_tctl,,
2026-06-04T07:27:09+00:00,rtxpro6000server,97429,C.39324136,1,2,70,421.26,73,7996,27,16.04,0,4,84.1,k10temp_tctl,,
2026-06-04T07:27:39+00:00,rtxpro6000server,97429,C.39324136,1,2,70,419.01,65,7996,27,14.93,0,4,84.2,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

