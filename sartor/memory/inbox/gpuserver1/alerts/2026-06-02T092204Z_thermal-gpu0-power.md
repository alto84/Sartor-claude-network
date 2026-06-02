---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T09:22:04+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.41W >580W sustained 3 samples

## Latest sample
```
2026-06-02T09:22:04+00:00,gpuserver1,52271,C.34113802,1,1,77,599.41,100,26821,,,,,74.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T09:17:33+00:00,gpuserver1,52271,C.34113802,1,1,41,21.65,0,803,,,,,37.0,coretemp_pkg,,
2026-06-02T09:18:03+00:00,gpuserver1,52271,C.34113802,1,1,63,556.23,98,15107,,,,,65.0,coretemp_pkg,,
2026-06-02T09:18:33+00:00,gpuserver1,52271,C.34113802,1,1,62,548.76,95,9539,,,,,71.0,coretemp_pkg,,
2026-06-02T09:19:03+00:00,gpuserver1,52271,C.34113802,1,1,46,75.97,0,803,,,,,42.0,coretemp_pkg,,
2026-06-02T09:19:33+00:00,gpuserver1,52271,C.34113802,1,1,56,594.87,91,15107,,,,,80.0,coretemp_pkg,,
2026-06-02T09:20:03+00:00,gpuserver1,52271,C.34113802,1,1,45,75.08,0,803,,,,,42.0,coretemp_pkg,,
2026-06-02T09:20:34+00:00,gpuserver1,52271,C.34113802,1,1,50,132.96,75,9347,,,,,59.0,coretemp_pkg,,
2026-06-02T09:21:04+00:00,gpuserver1,52271,C.34113802,1,1,72,600.45,100,26723,,,,,66.0,coretemp_pkg,,
2026-06-02T09:21:34+00:00,gpuserver1,52271,C.34113802,1,1,73,599.57,100,26693,,,,,70.0,coretemp_pkg,,
2026-06-02T09:22:04+00:00,gpuserver1,52271,C.34113802,1,1,77,599.41,100,26821,,,,,74.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

