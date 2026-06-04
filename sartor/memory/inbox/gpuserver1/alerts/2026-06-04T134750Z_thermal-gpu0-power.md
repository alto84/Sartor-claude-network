---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T13:47:50+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.11W >580W sustained 3 samples

## Latest sample
```
2026-06-04T13:47:50+00:00,gpuserver1,52271,C.34113802,1,1,76,600.11,100,26661,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T13:43:18+00:00,gpuserver1,52271,C.34113802,1,1,42,21.37,0,803,,,,,38.0,coretemp_pkg,,
2026-06-04T13:43:49+00:00,gpuserver1,52271,C.34113802,1,1,63,584.66,88,15107,,,,,70.0,coretemp_pkg,,
2026-06-04T13:44:19+00:00,gpuserver1,52271,C.34113802,1,1,45,75.78,0,803,,,,,41.0,coretemp_pkg,,
2026-06-04T13:44:49+00:00,gpuserver1,52271,C.34113802,1,1,41,21.81,0,803,,,,,39.0,coretemp_pkg,,
2026-06-04T13:45:19+00:00,gpuserver1,52271,C.34113802,1,1,42,21.73,0,803,,,,,37.0,coretemp_pkg,,
2026-06-04T13:45:49+00:00,gpuserver1,52271,C.34113802,1,1,42,21.61,0,803,,,,,39.0,coretemp_pkg,,
2026-06-04T13:46:20+00:00,gpuserver1,52271,C.34113802,1,1,45,100.81,17,16963,,,,,53.0,coretemp_pkg,,
2026-06-04T13:46:50+00:00,gpuserver1,52271,C.34113802,1,1,65,599.92,100,26629,,,,,66.0,coretemp_pkg,,
2026-06-04T13:47:20+00:00,gpuserver1,52271,C.34113802,1,1,74,598.59,100,26629,,,,,71.0,coretemp_pkg,,
2026-06-04T13:47:50+00:00,gpuserver1,52271,C.34113802,1,1,76,600.11,100,26661,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

