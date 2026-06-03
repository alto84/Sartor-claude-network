---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T02:57:08+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.57W >580W sustained 3 samples

## Latest sample
```
2026-06-03T02:57:08+00:00,gpuserver1,52271,C.34113802,1,1,73,599.57,100,26595,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T02:52:37+00:00,gpuserver1,52271,C.34113802,1,1,47,76.88,0,13857,,,,,65.0,coretemp_pkg,,
2026-06-03T02:53:07+00:00,gpuserver1,52271,C.34113802,1,1,51,105.29,0,13025,,,,,67.0,coretemp_pkg,,
2026-06-03T02:53:37+00:00,gpuserver1,52271,C.34113802,1,1,46,74.74,0,801,,,,,42.0,coretemp_pkg,,
2026-06-03T02:54:07+00:00,gpuserver1,52271,C.34113802,1,1,42,23.90,0,801,,,,,40.0,coretemp_pkg,,
2026-06-03T02:54:37+00:00,gpuserver1,52271,C.34113802,1,1,44,25.63,8,3233,,,,,65.0,coretemp_pkg,,
2026-06-03T02:55:08+00:00,gpuserver1,52271,C.34113802,1,1,46,75.31,0,801,,,,,42.0,coretemp_pkg,,
2026-06-03T02:55:38+00:00,gpuserver1,52271,C.34113802,1,1,42,24.04,0,801,,,,,39.0,coretemp_pkg,,
2026-06-03T02:56:08+00:00,gpuserver1,52271,C.34113802,1,1,62,600.34,100,26563,,,,,71.0,coretemp_pkg,,
2026-06-03T02:56:38+00:00,gpuserver1,52271,C.34113802,1,1,72,597.47,100,26627,,,,,74.0,coretemp_pkg,,
2026-06-03T02:57:08+00:00,gpuserver1,52271,C.34113802,1,1,73,599.57,100,26595,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

