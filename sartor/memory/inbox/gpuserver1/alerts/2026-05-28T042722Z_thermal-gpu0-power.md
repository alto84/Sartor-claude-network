---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T04:27:22+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 597.23W >580W sustained 3 samples

## Latest sample
```
2026-05-28T04:27:22+00:00,gpuserver1,52271,C.34113802,1,1,74,597.23,100,26511,,,,,66.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T04:22:51+00:00,gpuserver1,52271,C.34113802,1,1,66,595.16,100,18377,,,,,66.0,coretemp_pkg,,
2026-05-28T04:23:21+00:00,gpuserver1,52271,C.34113802,1,1,46,75.95,0,777,,,,,39.0,coretemp_pkg,,
2026-05-28T04:23:51+00:00,gpuserver1,52271,C.34113802,1,1,42,22.95,0,777,,,,,39.0,coretemp_pkg,,
2026-05-28T04:24:22+00:00,gpuserver1,52271,C.34113802,1,1,46,76.00,0,9611,,,,,40.0,coretemp_pkg,,
2026-05-28T04:24:52+00:00,gpuserver1,52271,C.34113802,1,1,47,76.77,0,13259,,,,,70.0,coretemp_pkg,,
2026-05-28T04:25:22+00:00,gpuserver1,52271,C.34113802,1,1,43,24.31,0,779,,,,,39.0,coretemp_pkg,,
2026-05-28T04:25:52+00:00,gpuserver1,52271,C.34113802,1,1,41,20.46,0,779,,,,,46.0,coretemp_pkg,,
2026-05-28T04:26:22+00:00,gpuserver1,52271,C.34113802,1,1,68,596.83,100,26479,,,,,62.0,coretemp_pkg,,
2026-05-28T04:26:52+00:00,gpuserver1,52271,C.34113802,1,1,72,597.01,100,26607,,,,,66.0,coretemp_pkg,,
2026-05-28T04:27:22+00:00,gpuserver1,52271,C.34113802,1,1,74,597.23,100,26511,,,,,66.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

