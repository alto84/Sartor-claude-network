---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T09:51:13+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.93W >580W sustained 3 samples

## Latest sample
```
2026-05-28T09:51:13+00:00,gpuserver1,52271,C.34113802,1,1,74,602.93,100,26695,,,,,65.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T09:46:42+00:00,gpuserver1,52271,C.34113802,1,1,43,22.98,0,897,,,,,62.0,coretemp_pkg,,
2026-05-28T09:47:12+00:00,gpuserver1,52271,C.34113802,1,1,46,74.11,0,803,,,,,42.0,coretemp_pkg,,
2026-05-28T09:47:42+00:00,gpuserver1,52271,C.34113802,1,1,42,22.98,0,803,,,,,40.0,coretemp_pkg,,
2026-05-28T09:48:12+00:00,gpuserver1,52271,C.34113802,1,1,42,20.89,0,803,,,,,44.0,coretemp_pkg,,
2026-05-28T09:48:43+00:00,gpuserver1,52271,C.34113802,1,1,49,103.42,0,18787,,,,,70.0,coretemp_pkg,,
2026-05-28T09:49:13+00:00,gpuserver1,52271,C.34113802,1,1,44,57.07,0,803,,,,,39.0,coretemp_pkg,,
2026-05-28T09:49:43+00:00,gpuserver1,52271,C.34113802,1,1,43,94.66,17,16963,,,,,55.0,coretemp_pkg,,
2026-05-28T09:50:13+00:00,gpuserver1,52271,C.34113802,1,1,70,600.58,100,26695,,,,,61.0,coretemp_pkg,,
2026-05-28T09:50:43+00:00,gpuserver1,52271,C.34113802,1,1,73,599.46,100,26695,,,,,62.0,coretemp_pkg,,
2026-05-28T09:51:13+00:00,gpuserver1,52271,C.34113802,1,1,74,602.93,100,26695,,,,,65.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

