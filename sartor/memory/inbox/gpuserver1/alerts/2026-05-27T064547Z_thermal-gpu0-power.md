---
type: alert
date: 2026-05-27
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-27T06:45:47+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.18W >580W sustained 3 samples

## Latest sample
```
2026-05-27T06:45:47+00:00,gpuserver1,52271,C.34113802,1,1,73,600.18,100,26597,,,,,65.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-27T06:41:16+00:00,gpuserver1,52271,C.34113802,1,1,43,22.92,0,803,,,,,35.0,coretemp_pkg,,
2026-05-27T06:41:46+00:00,gpuserver1,52271,C.34113802,1,1,43,20.92,0,803,,,,,55.0,coretemp_pkg,,
2026-05-27T06:42:16+00:00,gpuserver1,52271,C.34113802,1,1,44,20.96,0,803,,,,,38.0,coretemp_pkg,,
2026-05-27T06:42:46+00:00,gpuserver1,52271,C.34113802,1,1,44,21.58,0,803,,,,,35.0,coretemp_pkg,,
2026-05-27T06:43:17+00:00,gpuserver1,52271,C.34113802,1,1,45,21.97,0,803,,,,,36.0,coretemp_pkg,,
2026-05-27T06:43:47+00:00,gpuserver1,52271,C.34113802,1,1,45,21.43,0,803,,,,,35.0,coretemp_pkg,,
2026-05-27T06:44:17+00:00,gpuserver1,52271,C.34113802,1,1,47,51.72,0,1251,,,,,70.0,coretemp_pkg,,
2026-05-27T06:44:47+00:00,gpuserver1,52271,C.34113802,1,1,72,600.11,100,26629,,,,,66.0,coretemp_pkg,,
2026-05-27T06:45:17+00:00,gpuserver1,52271,C.34113802,1,1,72,600.74,100,26629,,,,,69.0,coretemp_pkg,,
2026-05-27T06:45:47+00:00,gpuserver1,52271,C.34113802,1,1,73,600.18,100,26597,,,,,65.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

