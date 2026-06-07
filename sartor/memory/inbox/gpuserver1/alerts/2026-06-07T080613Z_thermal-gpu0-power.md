---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T08:06:13+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.63W >580W sustained 3 samples

## Latest sample
```
2026-06-07T08:06:13+00:00,gpuserver1,52271,C.34113802,1,1,76,602.63,100,26697,,,,,69.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T08:01:41+00:00,gpuserver1,52271,C.34113802,1,1,45,73.63,0,803,,,,,42.0,coretemp_pkg,,
2026-06-07T08:02:11+00:00,gpuserver1,52271,C.34113802,1,1,41,20.58,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T08:02:42+00:00,gpuserver1,52271,C.34113802,1,1,46,74.19,0,803,,,,,44.0,coretemp_pkg,,
2026-06-07T08:03:12+00:00,gpuserver1,52271,C.34113802,1,1,42,20.64,0,803,,,,,41.0,coretemp_pkg,,
2026-06-07T08:03:42+00:00,gpuserver1,52271,C.34113802,1,1,42,18.16,0,803,,,,,40.0,coretemp_pkg,,
2026-06-07T08:04:12+00:00,gpuserver1,52271,C.34113802,1,1,42,19.19,0,803,,,,,47.0,coretemp_pkg,,
2026-06-07T08:04:43+00:00,gpuserver1,52271,C.34113802,1,1,42,20.30,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T08:05:13+00:00,gpuserver1,52271,C.34113802,1,1,67,598.20,100,26345,,,,,67.0,coretemp_pkg,,
2026-06-07T08:05:43+00:00,gpuserver1,52271,C.34113802,1,1,71,601.87,100,26697,,,,,70.0,coretemp_pkg,,
2026-06-07T08:06:13+00:00,gpuserver1,52271,C.34113802,1,1,76,602.63,100,26697,,,,,69.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

