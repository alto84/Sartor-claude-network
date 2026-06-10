---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-10T18:35:05+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.71W >580W sustained 3 samples

## Latest sample
```
2026-06-10T18:35:05+00:00,gpuserver1,52271,C.34113802,1,1,76,600.71,100,26595,,,,,72.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-10T18:30:33+00:00,gpuserver1,52271,C.34113802,1,1,58,501.83,85,13507,,,,,72.0,coretemp_pkg,,
2026-06-10T18:31:03+00:00,gpuserver1,52271,C.34113802,1,1,46,75.12,0,803,,,,,40.0,coretemp_pkg,,
2026-06-10T18:31:33+00:00,gpuserver1,52271,C.34113802,1,1,42,22.32,0,803,,,,,39.0,coretemp_pkg,,
2026-06-10T18:32:04+00:00,gpuserver1,52271,C.34113802,1,1,42,21.70,0,803,,,,,39.0,coretemp_pkg,,
2026-06-10T18:32:34+00:00,gpuserver1,52271,C.34113802,1,1,42,19.91,0,803,,,,,39.0,coretemp_pkg,,
2026-06-10T18:33:04+00:00,gpuserver1,52271,C.34113802,1,1,42,20.39,0,803,,,,,39.0,coretemp_pkg,,
2026-06-10T18:33:34+00:00,gpuserver1,52271,C.34113802,1,1,42,20.44,0,803,,,,,37.0,coretemp_pkg,,
2026-06-10T18:34:05+00:00,gpuserver1,52271,C.34113802,1,1,67,599.64,100,26563,,,,,71.0,coretemp_pkg,,
2026-06-10T18:34:35+00:00,gpuserver1,52271,C.34113802,1,1,70,602.76,100,26627,,,,,70.0,coretemp_pkg,,
2026-06-10T18:35:05+00:00,gpuserver1,52271,C.34113802,1,1,76,600.71,100,26595,,,,,72.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

