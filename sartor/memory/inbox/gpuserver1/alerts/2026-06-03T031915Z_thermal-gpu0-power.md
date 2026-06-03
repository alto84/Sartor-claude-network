---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T03:19:15+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.38W >580W sustained 3 samples

## Latest sample
```
2026-06-03T03:19:15+00:00,gpuserver1,52271,C.34113802,1,1,76,599.38,100,26565,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T03:14:44+00:00,gpuserver1,52271,C.34113802,1,1,43,21.61,0,521,,,,,40.0,coretemp_pkg,,
2026-06-03T03:15:14+00:00,gpuserver1,52271,C.34113802,1,1,43,21.70,0,521,,,,,39.0,coretemp_pkg,,
2026-06-03T03:15:44+00:00,gpuserver1,52271,C.34113802,1,1,44,22.14,0,521,,,,,39.0,coretemp_pkg,,
2026-06-03T03:16:14+00:00,gpuserver1,52271,C.34113802,1,1,44,22.41,0,521,,,,,39.0,coretemp_pkg,,
2026-06-03T03:16:44+00:00,gpuserver1,52271,C.34113802,1,1,44,23.88,0,521,,,,,39.0,coretemp_pkg,,
2026-06-03T03:17:15+00:00,gpuserver1,52271,C.34113802,1,1,44,21.88,0,521,,,,,39.0,coretemp_pkg,,
2026-06-03T03:17:45+00:00,gpuserver1,52271,C.34113802,1,1,44,21.75,0,521,,,,,46.0,coretemp_pkg,,
2026-06-03T03:18:15+00:00,gpuserver1,52271,C.34113802,1,1,66,597.65,100,26533,,,,,68.0,coretemp_pkg,,
2026-06-03T03:18:45+00:00,gpuserver1,52271,C.34113802,1,1,74,602.25,100,26597,,,,,73.0,coretemp_pkg,,
2026-06-03T03:19:15+00:00,gpuserver1,52271,C.34113802,1,1,76,599.38,100,26565,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

