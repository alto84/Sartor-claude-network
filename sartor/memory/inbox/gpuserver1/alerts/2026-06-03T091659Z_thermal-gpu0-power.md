---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T09:16:59+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.55W >580W sustained 3 samples

## Latest sample
```
2026-06-03T09:16:59+00:00,gpuserver1,52271,C.34113802,1,1,74,600.55,100,26571,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T09:12:27+00:00,gpuserver1,52271,C.34113802,1,1,58,569.42,88,9129,,,,,64.0,coretemp_pkg,,
2026-06-03T09:12:57+00:00,gpuserver1,52271,C.34113802,1,1,45,76.69,16,8969,,,,,60.0,coretemp_pkg,,
2026-06-03T09:13:27+00:00,gpuserver1,52271,C.34113802,1,1,42,24.15,0,777,,,,,39.0,coretemp_pkg,,
2026-06-03T09:13:58+00:00,gpuserver1,52271,C.34113802,1,1,41,21.99,0,777,,,,,38.0,coretemp_pkg,,
2026-06-03T09:14:28+00:00,gpuserver1,52271,C.34113802,1,1,42,21.86,0,777,,,,,36.0,coretemp_pkg,,
2026-06-03T09:14:58+00:00,gpuserver1,52271,C.34113802,1,1,42,21.45,0,777,,,,,36.0,coretemp_pkg,,
2026-06-03T09:15:28+00:00,gpuserver1,52271,C.34113802,1,1,42,21.64,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T09:15:59+00:00,gpuserver1,52271,C.34113802,1,1,62,602.87,100,26539,,,,,64.0,coretemp_pkg,,
2026-06-03T09:16:29+00:00,gpuserver1,52271,C.34113802,1,1,72,598.77,100,26603,,,,,71.0,coretemp_pkg,,
2026-06-03T09:16:59+00:00,gpuserver1,52271,C.34113802,1,1,74,600.55,100,26571,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

