---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T19:39:22+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.50W >580W sustained 3 samples

## Latest sample
```
2026-06-05T19:39:22+00:00,gpuserver1,52271,C.34113802,1,1,71,599.50,100,26595,,,,,76.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T19:34:51+00:00,gpuserver1,52271,C.34113802,1,1,45,21.81,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T19:35:21+00:00,gpuserver1,52271,C.34113802,1,1,45,22.26,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T19:35:51+00:00,gpuserver1,52271,C.34113802,1,1,45,22.86,0,521,,,,,38.0,coretemp_pkg,,
2026-06-05T19:36:22+00:00,gpuserver1,52271,C.34113802,1,1,45,21.71,0,521,,,,,47.0,coretemp_pkg,,
2026-06-05T19:36:52+00:00,gpuserver1,52271,C.34113802,1,1,48,77.25,0,9633,,,,,40.0,coretemp_pkg,,
2026-06-05T19:37:22+00:00,gpuserver1,52271,C.34113802,1,1,44,24.01,0,801,,,,,40.0,coretemp_pkg,,
2026-06-05T19:37:52+00:00,gpuserver1,52271,C.34113802,1,1,42,23.29,0,801,,,,,56.0,coretemp_pkg,,
2026-06-05T19:38:22+00:00,gpuserver1,52271,C.34113802,1,1,68,600.12,100,26627,,,,,72.0,coretemp_pkg,,
2026-06-05T19:38:52+00:00,gpuserver1,52271,C.34113802,1,1,72,600.02,100,26627,,,,,79.0,coretemp_pkg,,
2026-06-05T19:39:22+00:00,gpuserver1,52271,C.34113802,1,1,71,599.50,100,26595,,,,,76.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

