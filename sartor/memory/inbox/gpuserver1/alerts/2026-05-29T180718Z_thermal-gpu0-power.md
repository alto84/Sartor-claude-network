---
type: alert
date: 2026-05-29
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-29T18:07:18+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.28W >580W sustained 3 samples

## Latest sample
```
2026-05-29T18:07:18+00:00,gpuserver1,52271,C.34113802,1,1,74,602.28,100,26637,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-29T18:02:46+00:00,gpuserver1,52271,C.34113802,1,1,49,79.35,0,9611,,,,,44.0,coretemp_pkg,,
2026-05-29T18:03:17+00:00,gpuserver1,52271,C.34113802,1,1,45,25.30,0,779,,,,,41.0,coretemp_pkg,,
2026-05-29T18:03:47+00:00,gpuserver1,52271,C.34113802,1,1,61,559.47,85,9131,,,,,74.0,coretemp_pkg,,
2026-05-29T18:04:17+00:00,gpuserver1,52271,C.34113802,1,1,46,76.89,0,779,,,,,45.0,coretemp_pkg,,
2026-05-29T18:04:47+00:00,gpuserver1,52271,C.34113802,1,1,49,78.80,0,13803,,,,,74.0,coretemp_pkg,,
2026-05-29T18:05:17+00:00,gpuserver1,52271,C.34113802,1,1,45,24.21,0,779,,,,,44.0,coretemp_pkg,,
2026-05-29T18:05:47+00:00,gpuserver1,52271,C.34113802,1,1,44,81.44,15,5259,,,,,50.0,coretemp_pkg,,
2026-05-29T18:06:17+00:00,gpuserver1,52271,C.34113802,1,1,67,600.21,100,26605,,,,,81.0,coretemp_pkg,,
2026-05-29T18:06:48+00:00,gpuserver1,52271,C.34113802,1,1,73,600.02,100,26605,,,,,82.0,coretemp_pkg,,
2026-05-29T18:07:18+00:00,gpuserver1,52271,C.34113802,1,1,74,602.28,100,26637,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

