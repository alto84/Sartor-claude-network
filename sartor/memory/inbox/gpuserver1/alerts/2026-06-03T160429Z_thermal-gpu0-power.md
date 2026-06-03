---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T16:04:29+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.94W >580W sustained 3 samples

## Latest sample
```
2026-06-03T16:04:29+00:00,gpuserver1,52271,C.34113802,1,1,74,599.94,100,26659,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T15:59:58+00:00,gpuserver1,52271,C.34113802,1,1,47,76.32,0,13219,,,,,67.0,coretemp_pkg,,
2026-06-03T16:00:28+00:00,gpuserver1,52271,C.34113802,1,1,44,74.79,0,803,,,,,42.0,coretemp_pkg,,
2026-06-03T16:00:58+00:00,gpuserver1,52271,C.34113802,1,1,42,23.48,0,803,,,,,42.0,coretemp_pkg,,
2026-06-03T16:01:28+00:00,gpuserver1,52271,C.34113802,1,1,42,21.24,0,803,,,,,39.0,coretemp_pkg,,
2026-06-03T16:01:59+00:00,gpuserver1,52271,C.34113802,1,1,42,21.70,0,803,,,,,39.0,coretemp_pkg,,
2026-06-03T16:02:29+00:00,gpuserver1,52271,C.34113802,1,1,42,21.74,0,803,,,,,37.0,coretemp_pkg,,
2026-06-03T16:02:59+00:00,gpuserver1,52271,C.34113802,1,1,44,36.73,0,1251,,,,,80.0,coretemp_pkg,,
2026-06-03T16:03:29+00:00,gpuserver1,52271,C.34113802,1,1,66,600.05,100,26627,,,,,70.0,coretemp_pkg,,
2026-06-03T16:03:59+00:00,gpuserver1,52271,C.34113802,1,1,73,599.67,100,26627,,,,,76.0,coretemp_pkg,,
2026-06-03T16:04:29+00:00,gpuserver1,52271,C.34113802,1,1,74,599.94,100,26659,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

