---
type: alert
date: 2026-06-01
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-01T17:33:54+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 76.6C >75C sustained 3 samples

## Latest sample
```
2026-06-01T17:33:50+00:00,rtxpro6000server,97429,C.38722677,1,2,61,351.12,92,81766,35,82.36,0,58930,76.6,k10temp_tctl,,
```

## Last 10 samples
```
2026-06-01T17:27:14+00:00,rtxpro6000server,97429,C.38722677,1,2,63,355.60,97,81766,33,15.14,0,58930,74.6,k10temp_tctl,,
2026-06-01T17:28:00+00:00,rtxpro6000server,97429,C.38722677,1,2,61,395.70,97,81766,39,82.36,0,58930,72.2,k10temp_tctl,,
2026-06-01T17:28:47+00:00,rtxpro6000server,97429,C.38722677,1,2,62,353.37,97,81766,36,16.17,0,58930,74.6,k10temp_tctl,,
2026-06-01T17:29:32+00:00,rtxpro6000server,97429,C.38722677,1,2,55,88.48,0,81766,44,425.00,100,58930,75.0,k10temp_tctl,,
2026-06-01T17:31:02+00:00,rtxpro6000server,97429,C.38722677,1,2,61,367.35,97,81766,40,83.56,0,58930,74.8,k10temp_tctl,,
2026-06-01T17:31:32+00:00,rtxpro6000server,97429,C.38722677,1,2,55,103.17,0,81766,48,425.01,100,58930,74.5,k10temp_tctl,,
2026-06-01T17:32:02+00:00,rtxpro6000server,97429,C.38722677,1,2,61,365.15,97,81766,41,84.38,0,58930,75.0,k10temp_tctl,,
2026-06-01T17:32:40+00:00,rtxpro6000server,97429,C.38722677,1,2,62,352.78,97,81766,37,16.69,0,58930,75.6,k10temp_tctl,,
2026-06-01T17:33:14+00:00,rtxpro6000server,97429,C.38722677,1,2,63,368.94,97,81766,33,15.67,0,58930,75.5,k10temp_tctl,,
2026-06-01T17:33:50+00:00,rtxpro6000server,97429,C.38722677,1,2,61,351.12,92,81766,35,82.36,0,58930,76.6,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

