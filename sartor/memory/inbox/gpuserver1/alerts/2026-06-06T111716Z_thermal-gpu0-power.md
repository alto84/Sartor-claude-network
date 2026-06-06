---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T11:17:16+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.99W >580W sustained 3 samples

## Latest sample
```
2026-06-06T11:17:16+00:00,gpuserver1,52271,C.34113802,1,1,73,599.99,100,26661,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T11:12:44+00:00,gpuserver1,52271,C.34113802,1,1,43,22.17,0,803,,,,,36.0,coretemp_pkg,,
2026-06-06T11:13:15+00:00,gpuserver1,52271,C.34113802,1,1,43,21.81,0,803,,,,,36.0,coretemp_pkg,,
2026-06-06T11:13:45+00:00,gpuserver1,52271,C.34113802,1,1,43,21.57,0,803,,,,,36.0,coretemp_pkg,,
2026-06-06T11:14:15+00:00,gpuserver1,52271,C.34113802,1,1,44,22.16,0,803,,,,,37.0,coretemp_pkg,,
2026-06-06T11:14:45+00:00,gpuserver1,52271,C.34113802,1,1,44,24.01,0,803,,,,,35.0,coretemp_pkg,,
2026-06-06T11:15:16+00:00,gpuserver1,52271,C.34113802,1,1,44,21.88,0,803,,,,,35.0,coretemp_pkg,,
2026-06-06T11:15:46+00:00,gpuserver1,52271,C.34113802,1,1,45,76.67,0,5699,,,,,50.0,coretemp_pkg,,
2026-06-06T11:16:16+00:00,gpuserver1,52271,C.34113802,1,1,71,600.06,100,26629,,,,,73.0,coretemp_pkg,,
2026-06-06T11:16:46+00:00,gpuserver1,52271,C.34113802,1,1,75,599.92,100,26629,,,,,76.0,coretemp_pkg,,
2026-06-06T11:17:16+00:00,gpuserver1,52271,C.34113802,1,1,73,599.99,100,26661,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

