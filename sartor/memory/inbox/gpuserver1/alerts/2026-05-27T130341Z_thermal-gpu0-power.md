---
type: alert
date: 2026-05-27
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-27T13:03:41+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.07W >580W sustained 3 samples

## Latest sample
```
2026-05-27T13:03:41+00:00,gpuserver1,52271,C.34113802,1,1,74,600.07,100,26637,,,,,76.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-27T12:59:10+00:00,gpuserver1,52271,C.34113802,1,1,62,585.56,98,15083,,,,,67.0,coretemp_pkg,,
2026-05-27T12:59:40+00:00,gpuserver1,52271,C.34113802,1,1,45,75.73,0,779,,,,,40.0,coretemp_pkg,,
2026-05-27T13:00:10+00:00,gpuserver1,52271,C.34113802,1,1,41,21.31,0,779,,,,,39.0,coretemp_pkg,,
2026-05-27T13:00:40+00:00,gpuserver1,52271,C.34113802,1,1,46,75.41,0,12779,,,,,62.0,coretemp_pkg,,
2026-05-27T13:01:10+00:00,gpuserver1,52271,C.34113802,1,1,42,24.22,0,779,,,,,38.0,coretemp_pkg,,
2026-05-27T13:01:41+00:00,gpuserver1,52271,C.34113802,1,1,41,20.75,0,779,,,,,37.0,coretemp_pkg,,
2026-05-27T13:02:11+00:00,gpuserver1,52271,C.34113802,1,1,48,183.53,46,11083,,,,,55.0,coretemp_pkg,,
2026-05-27T13:02:41+00:00,gpuserver1,52271,C.34113802,1,1,71,599.80,100,26605,,,,,71.0,coretemp_pkg,,
2026-05-27T13:03:11+00:00,gpuserver1,52271,C.34113802,1,1,74,597.92,100,26605,,,,,67.0,coretemp_pkg,,
2026-05-27T13:03:41+00:00,gpuserver1,52271,C.34113802,1,1,74,600.07,100,26637,,,,,76.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

