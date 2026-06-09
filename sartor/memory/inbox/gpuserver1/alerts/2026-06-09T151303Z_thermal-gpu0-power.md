---
type: alert
date: 2026-06-09
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-09T15:13:03+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.79W >580W sustained 3 samples

## Latest sample
```
2026-06-09T15:13:03+00:00,gpuserver1,52271,C.34113802,1,1,74,599.79,100,25411,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-09T15:08:32+00:00,gpuserver1,52271,C.34113802,1,1,42,19.76,0,801,,,,,39.0,coretemp_pkg,,
2026-06-09T15:09:02+00:00,gpuserver1,52271,C.34113802,1,1,46,74.93,0,801,,,,,41.0,coretemp_pkg,,
2026-06-09T15:09:32+00:00,gpuserver1,52271,C.34113802,1,1,43,21.40,0,801,,,,,40.0,coretemp_pkg,,
2026-06-09T15:10:02+00:00,gpuserver1,52271,C.34113802,1,1,46,74.98,0,12705,,,,,70.0,coretemp_pkg,,
2026-06-09T15:10:32+00:00,gpuserver1,52271,C.34113802,1,1,48,77.38,0,12739,,,,,67.0,coretemp_pkg,,
2026-06-09T15:11:02+00:00,gpuserver1,52271,C.34113802,1,1,60,500.27,63,12707,,,,,76.0,coretemp_pkg,,
2026-06-09T15:11:32+00:00,gpuserver1,52271,C.34113802,1,1,47,76.62,0,7683,,,,,72.0,coretemp_pkg,,
2026-06-09T15:12:03+00:00,gpuserver1,52271,C.34113802,1,1,69,600.05,100,25379,,,,,82.0,coretemp_pkg,,
2026-06-09T15:12:33+00:00,gpuserver1,52271,C.34113802,1,1,75,598.24,100,25347,,,,,82.0,coretemp_pkg,,
2026-06-09T15:13:03+00:00,gpuserver1,52271,C.34113802,1,1,74,599.79,100,25411,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

