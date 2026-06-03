---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T14:09:48+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.59W >580W sustained 3 samples

## Latest sample
```
2026-06-03T14:09:48+00:00,gpuserver1,52271,C.34113802,1,1,75,599.59,100,26597,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T14:05:16+00:00,gpuserver1,52271,C.34113802,1,1,43,22.12,0,803,,,,,38.0,coretemp_pkg,,
2026-06-03T14:05:46+00:00,gpuserver1,52271,C.34113802,1,1,43,21.86,0,803,,,,,33.0,coretemp_pkg,,
2026-06-03T14:06:17+00:00,gpuserver1,52271,C.34113802,1,1,43,23.70,0,803,,,,,35.0,coretemp_pkg,,
2026-06-03T14:06:47+00:00,gpuserver1,52271,C.34113802,1,1,43,21.79,0,803,,,,,35.0,coretemp_pkg,,
2026-06-03T14:07:17+00:00,gpuserver1,52271,C.34113802,1,1,43,22.09,0,803,,,,,33.0,coretemp_pkg,,
2026-06-03T14:07:47+00:00,gpuserver1,52271,C.34113802,1,1,44,22.11,0,803,,,,,33.0,coretemp_pkg,,
2026-06-03T14:08:18+00:00,gpuserver1,52271,C.34113802,1,1,44,22.76,0,803,,,,,37.0,coretemp_pkg,,
2026-06-03T14:08:48+00:00,gpuserver1,52271,C.34113802,1,1,65,599.75,100,26565,,,,,60.0,coretemp_pkg,,
2026-06-03T14:09:18+00:00,gpuserver1,52271,C.34113802,1,1,70,600.01,100,26629,,,,,67.0,coretemp_pkg,,
2026-06-03T14:09:48+00:00,gpuserver1,52271,C.34113802,1,1,75,599.59,100,26597,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

