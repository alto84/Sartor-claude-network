---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T14:48:42+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.00W >580W sustained 3 samples

## Latest sample
```
2026-06-04T14:48:42+00:00,gpuserver1,52271,C.34113802,1,1,75,600.00,100,26595,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T14:44:11+00:00,gpuserver1,52271,C.34113802,1,1,44,22.38,0,803,,,,,35.0,coretemp_pkg,,
2026-06-04T14:44:41+00:00,gpuserver1,52271,C.34113802,1,1,44,23.77,0,803,,,,,35.0,coretemp_pkg,,
2026-06-04T14:45:11+00:00,gpuserver1,52271,C.34113802,1,1,44,21.29,0,803,,,,,36.0,coretemp_pkg,,
2026-06-04T14:45:41+00:00,gpuserver1,52271,C.34113802,1,1,44,21.88,0,803,,,,,34.0,coretemp_pkg,,
2026-06-04T14:46:12+00:00,gpuserver1,52271,C.34113802,1,1,49,79.24,0,12547,,,,,59.0,coretemp_pkg,,
2026-06-04T14:46:42+00:00,gpuserver1,52271,C.34113802,1,1,46,74.04,0,803,,,,,40.0,coretemp_pkg,,
2026-06-04T14:47:12+00:00,gpuserver1,52271,C.34113802,1,1,41,21.22,0,803,,,,,40.0,coretemp_pkg,,
2026-06-04T14:47:42+00:00,gpuserver1,52271,C.34113802,1,1,67,599.78,100,26563,,,,,76.0,coretemp_pkg,,
2026-06-04T14:48:12+00:00,gpuserver1,52271,C.34113802,1,1,73,599.78,100,26627,,,,,75.0,coretemp_pkg,,
2026-06-04T14:48:42+00:00,gpuserver1,52271,C.34113802,1,1,75,600.00,100,26595,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

