---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T23:02:17+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.26W >580W sustained 3 samples

## Latest sample
```
2026-06-04T23:02:17+00:00,gpuserver1,52271,C.34113802,1,1,77,600.26,100,26659,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T22:57:45+00:00,gpuserver1,52271,C.34113802,1,1,46,80.14,11,801,,,,,46.0,coretemp_pkg,,
2026-06-04T22:58:15+00:00,gpuserver1,52271,C.34113802,1,1,43,24.09,0,801,,,,,42.0,coretemp_pkg,,
2026-06-04T22:58:45+00:00,gpuserver1,52271,C.34113802,1,1,42,21.53,0,801,,,,,41.0,coretemp_pkg,,
2026-06-04T22:59:16+00:00,gpuserver1,52271,C.34113802,1,1,42,23.32,0,801,,,,,40.0,coretemp_pkg,,
2026-06-04T22:59:46+00:00,gpuserver1,52271,C.34113802,1,1,48,78.66,0,12961,,,,,67.0,coretemp_pkg,,
2026-06-04T23:00:16+00:00,gpuserver1,52271,C.34113802,1,1,45,75.54,0,801,,,,,44.0,coretemp_pkg,,
2026-06-04T23:00:46+00:00,gpuserver1,52271,C.34113802,1,1,42,24.56,0,801,,,,,41.0,coretemp_pkg,,
2026-06-04T23:01:16+00:00,gpuserver1,52271,C.34113802,1,1,70,600.90,100,26627,,,,,77.0,coretemp_pkg,,
2026-06-04T23:01:46+00:00,gpuserver1,52271,C.34113802,1,1,74,599.77,100,26627,,,,,79.0,coretemp_pkg,,
2026-06-04T23:02:17+00:00,gpuserver1,52271,C.34113802,1,1,77,600.26,100,26659,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

