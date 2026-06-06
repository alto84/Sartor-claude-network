---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T17:05:23+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.10W >580W sustained 3 samples

## Latest sample
```
2026-06-06T17:05:23+00:00,gpuserver1,52271,C.34113802,1,1,76,598.10,100,26571,,,,,76.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T17:00:52+00:00,gpuserver1,52271,C.34113802,1,1,42,23.60,0,777,,,,,39.0,coretemp_pkg,,
2026-06-06T17:01:22+00:00,gpuserver1,52271,C.34113802,1,1,42,21.31,0,777,,,,,37.0,coretemp_pkg,,
2026-06-06T17:01:52+00:00,gpuserver1,52271,C.34113802,1,1,43,21.28,0,777,,,,,39.0,coretemp_pkg,,
2026-06-06T17:02:22+00:00,gpuserver1,52271,C.34113802,1,1,47,75.87,0,9609,,,,,42.0,coretemp_pkg,,
2026-06-06T17:02:52+00:00,gpuserver1,52271,C.34113802,1,1,49,78.37,0,15177,,,,,66.0,coretemp_pkg,,
2026-06-06T17:03:23+00:00,gpuserver1,52271,C.34113802,1,1,44,25.34,0,777,,,,,53.0,coretemp_pkg,,
2026-06-06T17:03:53+00:00,gpuserver1,52271,C.34113802,1,1,42,23.87,0,777,,,,,40.0,coretemp_pkg,,
2026-06-06T17:04:23+00:00,gpuserver1,52271,C.34113802,1,1,66,602.05,100,26539,,,,,71.0,coretemp_pkg,,
2026-06-06T17:04:53+00:00,gpuserver1,52271,C.34113802,1,1,73,600.32,100,26603,,,,,74.0,coretemp_pkg,,
2026-06-06T17:05:23+00:00,gpuserver1,52271,C.34113802,1,1,76,598.10,100,26571,,,,,76.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

