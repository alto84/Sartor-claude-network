---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T08:21:12+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.99W >580W sustained 3 samples

## Latest sample
```
2026-06-04T08:21:12+00:00,gpuserver1,52271,C.34113802,1,1,75,599.99,100,26595,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T08:16:40+00:00,gpuserver1,52271,C.34113802,1,1,47,77.53,0,9665,,,,,44.0,coretemp_pkg,,
2026-06-04T08:17:10+00:00,gpuserver1,52271,C.34113802,1,1,43,23.94,0,801,,,,,40.0,coretemp_pkg,,
2026-06-04T08:17:41+00:00,gpuserver1,52271,C.34113802,1,1,42,20.82,0,801,,,,,40.0,coretemp_pkg,,
2026-06-04T08:18:11+00:00,gpuserver1,52271,C.34113802,1,1,42,21.70,0,801,,,,,42.0,coretemp_pkg,,
2026-06-04T08:18:41+00:00,gpuserver1,52271,C.34113802,1,1,47,76.74,0,12769,,,,,62.0,coretemp_pkg,,
2026-06-04T08:19:11+00:00,gpuserver1,52271,C.34113802,1,1,43,31.35,0,801,,,,,40.0,coretemp_pkg,,
2026-06-04T08:19:41+00:00,gpuserver1,52271,C.34113802,1,1,41,22.07,0,801,,,,,40.0,coretemp_pkg,,
2026-06-04T08:20:11+00:00,gpuserver1,52271,C.34113802,1,1,67,600.29,100,26563,,,,,80.0,coretemp_pkg,,
2026-06-04T08:20:41+00:00,gpuserver1,52271,C.34113802,1,1,73,600.15,100,26627,,,,,75.0,coretemp_pkg,,
2026-06-04T08:21:12+00:00,gpuserver1,52271,C.34113802,1,1,75,599.99,100,26595,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

