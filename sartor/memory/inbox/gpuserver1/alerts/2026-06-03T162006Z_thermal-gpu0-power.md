---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T16:20:06+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.00W >580W sustained 3 samples

## Latest sample
```
2026-06-03T16:20:05+00:00,gpuserver1,52271,C.34113802,1,1,75,599.00,100,26659,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T16:15:34+00:00,gpuserver1,52271,C.34113802,1,1,43,21.83,0,801,,,,,36.0,coretemp_pkg,,
2026-06-03T16:16:04+00:00,gpuserver1,52271,C.34113802,1,1,44,21.97,0,801,,,,,37.0,coretemp_pkg,,
2026-06-03T16:16:34+00:00,gpuserver1,52271,C.34113802,1,1,44,21.64,0,801,,,,,36.0,coretemp_pkg,,
2026-06-03T16:17:05+00:00,gpuserver1,52271,C.34113802,1,1,44,22.41,0,801,,,,,35.0,coretemp_pkg,,
2026-06-03T16:17:35+00:00,gpuserver1,52271,C.34113802,1,1,44,24.43,0,801,,,,,37.0,coretemp_pkg,,
2026-06-03T16:18:05+00:00,gpuserver1,52271,C.34113802,1,1,44,22.13,0,801,,,,,35.0,coretemp_pkg,,
2026-06-03T16:18:35+00:00,gpuserver1,52271,C.34113802,1,1,46,100.61,17,16961,,,,,53.0,coretemp_pkg,,
2026-06-03T16:19:05+00:00,gpuserver1,52271,C.34113802,1,1,72,599.78,100,26627,,,,,66.0,coretemp_pkg,,
2026-06-03T16:19:35+00:00,gpuserver1,52271,C.34113802,1,1,76,599.77,100,26627,,,,,67.0,coretemp_pkg,,
2026-06-03T16:20:05+00:00,gpuserver1,52271,C.34113802,1,1,75,599.00,100,26659,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

