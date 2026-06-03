---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T11:48:22+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.08W >580W sustained 3 samples

## Latest sample
```
2026-06-03T11:48:22+00:00,gpuserver1,52271,C.34113802,1,1,71,600.08,100,26635,,,,,76.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T11:43:51+00:00,gpuserver1,52271,C.34113802,1,1,42,23.39,0,777,,,,,39.0,coretemp_pkg,,
2026-06-03T11:44:21+00:00,gpuserver1,52271,C.34113802,1,1,41,23.01,0,777,,,,,37.0,coretemp_pkg,,
2026-06-03T11:44:51+00:00,gpuserver1,52271,C.34113802,1,1,42,21.12,0,777,,,,,46.0,coretemp_pkg,,
2026-06-03T11:45:21+00:00,gpuserver1,52271,C.34113802,1,1,42,20.87,0,777,,,,,36.0,coretemp_pkg,,
2026-06-03T11:45:52+00:00,gpuserver1,52271,C.34113802,1,1,42,21.08,0,777,,,,,36.0,coretemp_pkg,,
2026-06-03T11:46:22+00:00,gpuserver1,52271,C.34113802,1,1,42,21.28,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T11:46:52+00:00,gpuserver1,52271,C.34113802,1,1,45,91.86,45,9993,,,,,62.0,coretemp_pkg,,
2026-06-03T11:47:22+00:00,gpuserver1,52271,C.34113802,1,1,69,600.48,100,26603,,,,,71.0,coretemp_pkg,,
2026-06-03T11:47:52+00:00,gpuserver1,52271,C.34113802,1,1,74,600.06,100,26603,,,,,72.0,coretemp_pkg,,
2026-06-03T11:48:22+00:00,gpuserver1,52271,C.34113802,1,1,71,600.08,100,26635,,,,,76.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

