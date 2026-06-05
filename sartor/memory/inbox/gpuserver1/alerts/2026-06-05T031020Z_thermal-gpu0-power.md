---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T03:10:20+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.25W >580W sustained 3 samples

## Latest sample
```
2026-06-05T03:10:20+00:00,gpuserver1,52271,C.34113802,1,1,77,599.25,100,26571,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T03:05:49+00:00,gpuserver1,52271,C.34113802,1,1,62,574.16,89,9129,,,,,77.0,coretemp_pkg,,
2026-06-05T03:06:19+00:00,gpuserver1,52271,C.34113802,1,1,46,75.89,0,777,,,,,46.0,coretemp_pkg,,
2026-06-05T03:06:49+00:00,gpuserver1,52271,C.34113802,1,1,48,77.88,0,12553,,,,,70.0,coretemp_pkg,,
2026-06-05T03:07:19+00:00,gpuserver1,52271,C.34113802,1,1,45,24.65,0,777,,,,,44.0,coretemp_pkg,,
2026-06-05T03:07:49+00:00,gpuserver1,52271,C.34113802,1,1,43,23.33,0,777,,,,,46.0,coretemp_pkg,,
2026-06-05T03:08:19+00:00,gpuserver1,52271,C.34113802,1,1,42,21.29,0,777,,,,,42.0,coretemp_pkg,,
2026-06-05T03:08:50+00:00,gpuserver1,52271,C.34113802,1,1,43,22.51,0,777,,,,,40.0,coretemp_pkg,,
2026-06-05T03:09:20+00:00,gpuserver1,52271,C.34113802,1,1,68,600.19,100,26539,,,,,76.0,coretemp_pkg,,
2026-06-05T03:09:50+00:00,gpuserver1,52271,C.34113802,1,1,74,600.01,100,26603,,,,,75.0,coretemp_pkg,,
2026-06-05T03:10:20+00:00,gpuserver1,52271,C.34113802,1,1,77,599.25,100,26571,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

