---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T02:08:52+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.05W >580W sustained 3 samples

## Latest sample
```
2026-06-03T02:08:52+00:00,gpuserver1,52271,C.34113802,1,1,75,600.05,100,26731,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T02:04:20+00:00,gpuserver1,52271,C.34113802,1,1,62,552.46,88,9129,,,,,82.0,coretemp_pkg,,
2026-06-03T02:04:50+00:00,gpuserver1,52271,C.34113802,1,1,47,63.10,16,8969,,,,,67.0,coretemp_pkg,,
2026-06-03T02:05:20+00:00,gpuserver1,52271,C.34113802,1,1,44,23.60,0,777,,,,,45.0,coretemp_pkg,,
2026-06-03T02:05:51+00:00,gpuserver1,52271,C.34113802,1,1,42,20.81,0,777,,,,,44.0,coretemp_pkg,,
2026-06-03T02:06:21+00:00,gpuserver1,52271,C.34113802,1,1,42,21.62,0,777,,,,,42.0,coretemp_pkg,,
2026-06-03T02:06:51+00:00,gpuserver1,52271,C.34113802,1,1,43,23.67,0,777,,,,,40.0,coretemp_pkg,,
2026-06-03T02:07:21+00:00,gpuserver1,52271,C.34113802,1,1,43,21.12,0,777,,,,,39.0,coretemp_pkg,,
2026-06-03T02:07:52+00:00,gpuserver1,52271,C.34113802,1,1,66,600.04,100,26635,,,,,69.0,coretemp_pkg,,
2026-06-03T02:08:22+00:00,gpuserver1,52271,C.34113802,1,1,72,600.01,100,26763,,,,,76.0,coretemp_pkg,,
2026-06-03T02:08:52+00:00,gpuserver1,52271,C.34113802,1,1,75,600.05,100,26731,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

