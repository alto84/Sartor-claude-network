---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-10T04:48:50+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.98W >580W sustained 3 samples

## Latest sample
```
2026-06-10T04:48:50+00:00,gpuserver1,52271,C.34113802,1,1,77,599.98,100,25317,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-10T04:44:19+00:00,gpuserver1,52271,C.34113802,1,1,44,20.05,0,521,,,,,40.0,coretemp_pkg,,
2026-06-10T04:44:49+00:00,gpuserver1,52271,C.34113802,1,1,44,20.15,0,521,,,,,40.0,coretemp_pkg,,
2026-06-10T04:45:19+00:00,gpuserver1,52271,C.34113802,1,1,45,20.46,0,521,,,,,39.0,coretemp_pkg,,
2026-06-10T04:45:49+00:00,gpuserver1,52271,C.34113802,1,1,45,22.68,0,521,,,,,39.0,coretemp_pkg,,
2026-06-10T04:46:19+00:00,gpuserver1,52271,C.34113802,1,1,45,20.91,0,521,,,,,39.0,coretemp_pkg,,
2026-06-10T04:46:50+00:00,gpuserver1,52271,C.34113802,1,1,45,20.97,0,521,,,,,39.0,coretemp_pkg,,
2026-06-10T04:47:20+00:00,gpuserver1,52271,C.34113802,1,1,45,20.52,0,521,,,,,39.0,coretemp_pkg,,
2026-06-10T04:47:50+00:00,gpuserver1,52271,C.34113802,1,1,69,599.51,100,25317,,,,,72.0,coretemp_pkg,,
2026-06-10T04:48:20+00:00,gpuserver1,52271,C.34113802,1,1,75,599.41,100,25349,,,,,66.0,coretemp_pkg,,
2026-06-10T04:48:50+00:00,gpuserver1,52271,C.34113802,1,1,77,599.98,100,25317,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

