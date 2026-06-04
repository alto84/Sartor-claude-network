---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T09:15:03+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.69W >580W sustained 3 samples

## Latest sample
```
2026-06-04T09:15:03+00:00,gpuserver1,52271,C.34113802,1,1,76,599.69,100,26597,,,,,76.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T09:10:31+00:00,gpuserver1,52271,C.34113802,1,1,43,23.45,0,803,,,,,35.0,coretemp_pkg,,
2026-06-04T09:11:02+00:00,gpuserver1,52271,C.34113802,1,1,43,20.98,0,803,,,,,35.0,coretemp_pkg,,
2026-06-04T09:11:32+00:00,gpuserver1,52271,C.34113802,1,1,43,21.36,0,803,,,,,40.0,coretemp_pkg,,
2026-06-04T09:12:02+00:00,gpuserver1,52271,C.34113802,1,1,43,21.36,0,803,,,,,35.0,coretemp_pkg,,
2026-06-04T09:12:33+00:00,gpuserver1,52271,C.34113802,1,1,43,21.71,0,803,,,,,35.0,coretemp_pkg,,
2026-06-04T09:13:03+00:00,gpuserver1,52271,C.34113802,1,1,43,24.20,0,803,,,,,35.0,coretemp_pkg,,
2026-06-04T09:13:33+00:00,gpuserver1,52271,C.34113802,1,1,43,21.65,0,803,,,,,35.0,coretemp_pkg,,
2026-06-04T09:14:03+00:00,gpuserver1,52271,C.34113802,1,1,69,600.37,100,26565,,,,,70.0,coretemp_pkg,,
2026-06-04T09:14:33+00:00,gpuserver1,52271,C.34113802,1,1,74,600.01,100,26629,,,,,65.0,coretemp_pkg,,
2026-06-04T09:15:03+00:00,gpuserver1,52271,C.34113802,1,1,76,599.69,100,26597,,,,,76.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

