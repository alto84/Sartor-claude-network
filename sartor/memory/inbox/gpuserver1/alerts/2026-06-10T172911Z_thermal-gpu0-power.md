---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-10T17:29:11+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.97W >580W sustained 3 samples

## Latest sample
```
2026-06-10T17:29:11+00:00,gpuserver1,52271,C.34113802,1,1,76,599.97,100,26597,,,,,70.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-10T17:24:40+00:00,gpuserver1,52271,C.34113802,1,1,47,76.80,0,12611,,,,,65.0,coretemp_pkg,,
2026-06-10T17:25:10+00:00,gpuserver1,52271,C.34113802,1,1,45,75.39,0,803,,,,,41.0,coretemp_pkg,,
2026-06-10T17:25:40+00:00,gpuserver1,52271,C.34113802,1,1,47,76.58,0,12707,,,,,64.0,coretemp_pkg,,
2026-06-10T17:26:10+00:00,gpuserver1,52271,C.34113802,1,1,45,73.89,0,803,,,,,42.0,coretemp_pkg,,
2026-06-10T17:26:40+00:00,gpuserver1,52271,C.34113802,1,1,46,75.13,0,12643,,,,,65.0,coretemp_pkg,,
2026-06-10T17:27:10+00:00,gpuserver1,52271,C.34113802,1,1,43,23.15,0,803,,,,,41.0,coretemp_pkg,,
2026-06-10T17:27:41+00:00,gpuserver1,52271,C.34113802,1,1,42,20.19,0,803,,,,,39.0,coretemp_pkg,,
2026-06-10T17:28:11+00:00,gpuserver1,52271,C.34113802,1,1,69,600.72,100,26629,,,,,69.0,coretemp_pkg,,
2026-06-10T17:28:41+00:00,gpuserver1,52271,C.34113802,1,1,74,600.13,100,26629,,,,,74.0,coretemp_pkg,,
2026-06-10T17:29:11+00:00,gpuserver1,52271,C.34113802,1,1,76,599.97,100,26597,,,,,70.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

