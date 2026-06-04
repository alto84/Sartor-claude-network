---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T15:54:37+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.86W >580W sustained 3 samples

## Latest sample
```
2026-06-04T15:54:36+00:00,gpuserver1,52271,C.34113802,1,1,75,599.86,100,26571,,,,,76.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T15:50:05+00:00,gpuserver1,52271,C.34113802,1,1,42,20.74,0,777,,,,,39.0,coretemp_pkg,,
2026-06-04T15:50:35+00:00,gpuserver1,52271,C.34113802,1,1,42,20.91,0,777,,,,,37.0,coretemp_pkg,,
2026-06-04T15:51:05+00:00,gpuserver1,52271,C.34113802,1,1,58,509.38,85,12809,,,,,65.0,coretemp_pkg,,
2026-06-04T15:51:35+00:00,gpuserver1,52271,C.34113802,1,1,45,73.41,0,777,,,,,41.0,coretemp_pkg,,
2026-06-04T15:52:06+00:00,gpuserver1,52271,C.34113802,1,1,41,20.88,0,777,,,,,39.0,coretemp_pkg,,
2026-06-04T15:52:36+00:00,gpuserver1,52271,C.34113802,1,1,42,20.66,0,777,,,,,39.0,coretemp_pkg,,
2026-06-04T15:53:06+00:00,gpuserver1,52271,C.34113802,1,1,42,20.91,0,777,,,,,37.0,coretemp_pkg,,
2026-06-04T15:53:36+00:00,gpuserver1,52271,C.34113802,1,1,63,600.89,100,26539,,,,,72.0,coretemp_pkg,,
2026-06-04T15:54:06+00:00,gpuserver1,52271,C.34113802,1,1,66,598.67,100,26603,,,,,77.0,coretemp_pkg,,
2026-06-04T15:54:36+00:00,gpuserver1,52271,C.34113802,1,1,75,599.86,100,26571,,,,,76.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

