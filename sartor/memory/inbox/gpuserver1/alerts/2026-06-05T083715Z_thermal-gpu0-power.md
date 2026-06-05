---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T08:37:15+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.01W >580W sustained 3 samples

## Latest sample
```
2026-06-05T08:37:15+00:00,gpuserver1,52271,C.34113802,1,1,77,600.01,100,26659,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T08:32:44+00:00,gpuserver1,52271,C.34113802,1,1,45,24.08,0,521,,,,,46.0,coretemp_pkg,,
2026-06-05T08:33:14+00:00,gpuserver1,52271,C.34113802,1,1,49,78.86,0,12705,,,,,76.0,coretemp_pkg,,
2026-06-05T08:33:44+00:00,gpuserver1,52271,C.34113802,1,1,47,75.75,0,801,,,,,49.0,coretemp_pkg,,
2026-06-05T08:34:14+00:00,gpuserver1,52271,C.34113802,1,1,43,23.66,0,801,,,,,45.0,coretemp_pkg,,
2026-06-05T08:34:45+00:00,gpuserver1,52271,C.34113802,1,1,47,75.35,0,9633,,,,,48.0,coretemp_pkg,,
2026-06-05T08:35:15+00:00,gpuserver1,52271,C.34113802,1,1,44,24.31,0,801,,,,,45.0,coretemp_pkg,,
2026-06-05T08:35:45+00:00,gpuserver1,52271,C.34113802,1,1,57,182.41,85,16961,,,,,80.0,coretemp_pkg,,
2026-06-05T08:36:15+00:00,gpuserver1,52271,C.34113802,1,1,70,599.15,100,26627,,,,,84.0,coretemp_pkg,,
2026-06-05T08:36:45+00:00,gpuserver1,52271,C.34113802,1,1,76,598.23,100,26627,,,,,76.0,coretemp_pkg,,
2026-06-05T08:37:15+00:00,gpuserver1,52271,C.34113802,1,1,77,600.01,100,26659,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

