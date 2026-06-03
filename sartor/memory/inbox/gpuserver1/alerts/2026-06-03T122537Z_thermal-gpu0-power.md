---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T12:25:37+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.96W >580W sustained 3 samples

## Latest sample
```
2026-06-03T12:25:37+00:00,gpuserver1,52271,C.34113802,1,1,71,599.96,100,26571,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T12:21:05+00:00,gpuserver1,52271,C.34113802,1,1,43,21.31,0,777,,,,,36.0,coretemp_pkg,,
2026-06-03T12:21:35+00:00,gpuserver1,52271,C.34113802,1,1,43,21.55,0,777,,,,,38.0,coretemp_pkg,,
2026-06-03T12:22:05+00:00,gpuserver1,52271,C.34113802,1,1,43,22.65,0,777,,,,,34.0,coretemp_pkg,,
2026-06-03T12:22:36+00:00,gpuserver1,52271,C.34113802,1,1,43,22.00,0,777,,,,,34.0,coretemp_pkg,,
2026-06-03T12:23:06+00:00,gpuserver1,52271,C.34113802,1,1,43,21.36,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T12:23:36+00:00,gpuserver1,52271,C.34113802,1,1,43,21.73,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T12:24:06+00:00,gpuserver1,52271,C.34113802,1,1,43,21.20,0,777,,,,,34.0,coretemp_pkg,,
2026-06-03T12:24:37+00:00,gpuserver1,52271,C.34113802,1,1,68,599.54,100,26539,,,,,64.0,coretemp_pkg,,
2026-06-03T12:25:07+00:00,gpuserver1,52271,C.34113802,1,1,73,602.49,100,26603,,,,,69.0,coretemp_pkg,,
2026-06-03T12:25:37+00:00,gpuserver1,52271,C.34113802,1,1,71,599.96,100,26571,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

