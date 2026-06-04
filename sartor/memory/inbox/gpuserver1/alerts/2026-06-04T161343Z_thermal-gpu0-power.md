---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T16:13:43+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.36W >580W sustained 3 samples

## Latest sample
```
2026-06-04T16:13:43+00:00,gpuserver1,52271,C.34113802,1,1,75,599.36,100,26659,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T16:09:11+00:00,gpuserver1,52271,C.34113802,1,1,66,597.81,93,9347,,,,,81.0,coretemp_pkg,,
2026-06-04T16:09:41+00:00,gpuserver1,52271,C.34113802,1,1,67,556.36,88,9507,,,,,85.0,coretemp_pkg,,
2026-06-04T16:10:12+00:00,gpuserver1,52271,C.34113802,1,1,49,79.00,0,803,,,,,48.0,coretemp_pkg,,
2026-06-04T16:10:42+00:00,gpuserver1,52271,C.34113802,1,1,45,26.21,0,803,,,,,45.0,coretemp_pkg,,
2026-06-04T16:11:12+00:00,gpuserver1,52271,C.34113802,1,1,42,23.91,0,803,,,,,41.0,coretemp_pkg,,
2026-06-04T16:11:42+00:00,gpuserver1,52271,C.34113802,1,1,42,21.19,0,803,,,,,40.0,coretemp_pkg,,
2026-06-04T16:12:12+00:00,gpuserver1,52271,C.34113802,1,1,42,21.49,0,803,,,,,39.0,coretemp_pkg,,
2026-06-04T16:12:43+00:00,gpuserver1,52271,C.34113802,1,1,68,600.03,100,26627,,,,,74.0,coretemp_pkg,,
2026-06-04T16:13:13+00:00,gpuserver1,52271,C.34113802,1,1,75,598.72,100,26627,,,,,79.0,coretemp_pkg,,
2026-06-04T16:13:43+00:00,gpuserver1,52271,C.34113802,1,1,75,599.36,100,26659,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

