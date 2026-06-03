---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T15:47:23+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.13W >580W sustained 3 samples

## Latest sample
```
2026-06-03T15:47:23+00:00,gpuserver1,52271,C.34113802,1,1,77,599.13,100,26635,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T15:42:52+00:00,gpuserver1,52271,C.34113802,1,1,42,21.58,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T15:43:22+00:00,gpuserver1,52271,C.34113802,1,1,43,21.29,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T15:43:52+00:00,gpuserver1,52271,C.34113802,1,1,51,322.19,43,12043,,,,,72.0,coretemp_pkg,,
2026-06-03T15:44:22+00:00,gpuserver1,52271,C.34113802,1,1,45,76.47,0,779,,,,,40.0,coretemp_pkg,,
2026-06-03T15:44:53+00:00,gpuserver1,52271,C.34113802,1,1,47,77.88,0,9611,,,,,44.0,coretemp_pkg,,
2026-06-03T15:45:23+00:00,gpuserver1,52271,C.34113802,1,1,43,24.24,0,779,,,,,40.0,coretemp_pkg,,
2026-06-03T15:45:53+00:00,gpuserver1,52271,C.34113802,1,1,43,40.65,0,1259,,,,,84.0,coretemp_pkg,,
2026-06-03T15:46:23+00:00,gpuserver1,52271,C.34113802,1,1,70,600.01,100,26603,,,,,72.0,coretemp_pkg,,
2026-06-03T15:46:53+00:00,gpuserver1,52271,C.34113802,1,1,74,600.26,100,26603,,,,,81.0,coretemp_pkg,,
2026-06-03T15:47:23+00:00,gpuserver1,52271,C.34113802,1,1,77,599.13,100,26635,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

