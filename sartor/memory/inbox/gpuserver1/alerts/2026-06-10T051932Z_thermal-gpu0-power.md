---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-10T05:19:32+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 601.04W >580W sustained 3 samples

## Latest sample
```
2026-06-10T05:19:32+00:00,gpuserver1,52271,C.34113802,1,1,76,601.04,100,25419,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-10T05:15:00+00:00,gpuserver1,52271,C.34113802,1,1,64,510.71,91,13673,,,,,67.0,coretemp_pkg,,
2026-06-10T05:15:31+00:00,gpuserver1,52271,C.34113802,1,1,45,75.28,0,777,,,,,40.0,coretemp_pkg,,
2026-06-10T05:16:01+00:00,gpuserver1,52271,C.34113802,1,1,42,21.31,0,777,,,,,40.0,coretemp_pkg,,
2026-06-10T05:16:31+00:00,gpuserver1,52271,C.34113802,1,1,42,19.98,0,777,,,,,39.0,coretemp_pkg,,
2026-06-10T05:17:01+00:00,gpuserver1,52271,C.34113802,1,1,42,20.18,0,777,,,,,39.0,coretemp_pkg,,
2026-06-10T05:17:31+00:00,gpuserver1,52271,C.34113802,1,1,55,256.41,87,9481,,,,,76.0,coretemp_pkg,,
2026-06-10T05:18:02+00:00,gpuserver1,52271,C.34113802,1,1,46,74.39,0,777,,,,,41.0,coretemp_pkg,,
2026-06-10T05:18:32+00:00,gpuserver1,52271,C.34113802,1,1,67,600.91,100,25291,,,,,77.0,coretemp_pkg,,
2026-06-10T05:19:02+00:00,gpuserver1,52271,C.34113802,1,1,69,598.50,100,25355,,,,,82.0,coretemp_pkg,,
2026-06-10T05:19:32+00:00,gpuserver1,52271,C.34113802,1,1,76,601.04,100,25419,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

