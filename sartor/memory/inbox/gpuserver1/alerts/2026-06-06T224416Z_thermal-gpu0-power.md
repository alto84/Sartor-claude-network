---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T22:44:16+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.96W >580W sustained 3 samples

## Latest sample
```
2026-06-06T22:44:16+00:00,gpuserver1,52271,C.34113802,1,1,77,599.96,100,26571,,,,,71.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T22:39:45+00:00,gpuserver1,52271,C.34113802,1,1,43,21.77,0,779,,,,,40.0,coretemp_pkg,,
2026-06-06T22:40:15+00:00,gpuserver1,52271,C.34113802,1,1,43,20.33,0,779,,,,,39.0,coretemp_pkg,,
2026-06-06T22:40:45+00:00,gpuserver1,52271,C.34113802,1,1,43,20.00,0,779,,,,,56.0,coretemp_pkg,,
2026-06-06T22:41:15+00:00,gpuserver1,52271,C.34113802,1,1,47,75.32,0,9611,,,,,42.0,coretemp_pkg,,
2026-06-06T22:41:45+00:00,gpuserver1,52271,C.34113802,1,1,44,21.91,0,779,,,,,40.0,coretemp_pkg,,
2026-06-06T22:42:16+00:00,gpuserver1,52271,C.34113802,1,1,42,20.34,0,779,,,,,40.0,coretemp_pkg,,
2026-06-06T22:42:46+00:00,gpuserver1,52271,C.34113802,1,1,43,45.55,0,1035,,,,,50.0,coretemp_pkg,,
2026-06-06T22:43:16+00:00,gpuserver1,52271,C.34113802,1,1,70,601.76,100,26603,,,,,71.0,coretemp_pkg,,
2026-06-06T22:43:46+00:00,gpuserver1,52271,C.34113802,1,1,74,599.21,100,26603,,,,,75.0,coretemp_pkg,,
2026-06-06T22:44:16+00:00,gpuserver1,52271,C.34113802,1,1,77,599.96,100,26571,,,,,71.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

