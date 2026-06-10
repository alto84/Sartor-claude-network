---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-10T12:20:13+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.31W >580W sustained 3 samples

## Latest sample
```
2026-06-10T12:20:12+00:00,gpuserver1,52271,C.34113802,1,1,70,600.31,100,25387,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-10T12:15:41+00:00,gpuserver1,52271,C.34113802,1,1,43,20.17,0,521,,,,,39.0,coretemp_pkg,,
2026-06-10T12:16:11+00:00,gpuserver1,52271,C.34113802,1,1,43,20.52,0,521,,,,,37.0,coretemp_pkg,,
2026-06-10T12:16:41+00:00,gpuserver1,52271,C.34113802,1,1,44,22.22,0,521,,,,,37.0,coretemp_pkg,,
2026-06-10T12:17:12+00:00,gpuserver1,52271,C.34113802,1,1,44,20.74,0,521,,,,,36.0,coretemp_pkg,,
2026-06-10T12:17:42+00:00,gpuserver1,52271,C.34113802,1,1,44,20.97,0,521,,,,,37.0,coretemp_pkg,,
2026-06-10T12:18:12+00:00,gpuserver1,52271,C.34113802,1,1,51,287.42,0,13225,,,,,62.0,coretemp_pkg,,
2026-06-10T12:18:42+00:00,gpuserver1,52271,C.34113802,1,1,46,75.62,0,777,,,,,40.0,coretemp_pkg,,
2026-06-10T12:19:12+00:00,gpuserver1,52271,C.34113802,1,1,59,601.25,100,25291,,,,,76.0,coretemp_pkg,,
2026-06-10T12:19:42+00:00,gpuserver1,52271,C.34113802,1,1,72,600.18,100,25355,,,,,76.0,coretemp_pkg,,
2026-06-10T12:20:12+00:00,gpuserver1,52271,C.34113802,1,1,70,600.31,100,25387,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

