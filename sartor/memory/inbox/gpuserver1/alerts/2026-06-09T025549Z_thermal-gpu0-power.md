---
type: alert
date: 2026-06-09
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-09T02:55:49+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.57W >580W sustained 3 samples

## Latest sample
```
2026-06-09T02:55:49+00:00,gpuserver1,52271,C.34113802,1,1,76,599.57,100,26595,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-09T02:51:17+00:00,gpuserver1,52271,C.34113802,1,1,43,22.57,0,801,,,,,40.0,coretemp_pkg,,
2026-06-09T02:51:47+00:00,gpuserver1,52271,C.34113802,1,1,42,20.88,0,801,,,,,39.0,coretemp_pkg,,
2026-06-09T02:52:18+00:00,gpuserver1,52271,C.34113802,1,1,42,20.82,0,801,,,,,39.0,coretemp_pkg,,
2026-06-09T02:52:48+00:00,gpuserver1,52271,C.34113802,1,1,42,20.63,0,801,,,,,37.0,coretemp_pkg,,
2026-06-09T02:53:18+00:00,gpuserver1,52271,C.34113802,1,1,42,20.25,0,801,,,,,37.0,coretemp_pkg,,
2026-06-09T02:53:48+00:00,gpuserver1,52271,C.34113802,1,1,43,20.49,0,801,,,,,37.0,coretemp_pkg,,
2026-06-09T02:54:19+00:00,gpuserver1,52271,C.34113802,1,1,43,22.81,0,801,,,,,36.0,coretemp_pkg,,
2026-06-09T02:54:49+00:00,gpuserver1,52271,C.34113802,1,1,64,600.37,100,26563,,,,,65.0,coretemp_pkg,,
2026-06-09T02:55:19+00:00,gpuserver1,52271,C.34113802,1,1,68,600.29,100,26627,,,,,67.0,coretemp_pkg,,
2026-06-09T02:55:49+00:00,gpuserver1,52271,C.34113802,1,1,76,599.57,100,26595,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

