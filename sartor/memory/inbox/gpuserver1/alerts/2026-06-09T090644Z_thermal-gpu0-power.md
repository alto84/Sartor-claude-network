---
type: alert
date: 2026-06-09
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-09T09:06:44+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.47W >580W sustained 3 samples

## Latest sample
```
2026-06-09T09:06:44+00:00,gpuserver1,52271,C.34113802,1,1,76,600.47,100,26599,,,,,70.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-09T09:02:13+00:00,gpuserver1,52271,C.34113802,1,1,43,20.05,0,521,,,,,37.0,coretemp_pkg,,
2026-06-09T09:02:43+00:00,gpuserver1,52271,C.34113802,1,1,58,76.65,79,9501,,,,,63.0,coretemp_pkg,,
2026-06-09T09:03:13+00:00,gpuserver1,52271,C.34113802,1,1,47,76.48,0,801,,,,,41.0,coretemp_pkg,,
2026-06-09T09:03:43+00:00,gpuserver1,52271,C.34113802,1,1,43,22.55,0,801,,,,,39.0,coretemp_pkg,,
2026-06-09T09:04:13+00:00,gpuserver1,52271,C.34113802,1,1,42,19.74,0,801,,,,,39.0,coretemp_pkg,,
2026-06-09T09:04:44+00:00,gpuserver1,52271,C.34113802,1,1,42,20.53,0,801,,,,,37.0,coretemp_pkg,,
2026-06-09T09:05:14+00:00,gpuserver1,52271,C.34113802,1,1,42,19.97,0,801,,,,,37.0,coretemp_pkg,,
2026-06-09T09:05:44+00:00,gpuserver1,52271,C.34113802,1,1,63,599.88,100,26471,,,,,67.0,coretemp_pkg,,
2026-06-09T09:06:14+00:00,gpuserver1,52271,C.34113802,1,1,72,602.81,100,26535,,,,,65.0,coretemp_pkg,,
2026-06-09T09:06:44+00:00,gpuserver1,52271,C.34113802,1,1,76,600.47,100,26599,,,,,70.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

