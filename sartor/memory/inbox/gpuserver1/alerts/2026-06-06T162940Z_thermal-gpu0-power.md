---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T16:29:40+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.14W >580W sustained 3 samples

## Latest sample
```
2026-06-06T16:29:40+00:00,gpuserver1,52271,C.34113802,1,1,76,600.14,100,26571,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T16:25:09+00:00,gpuserver1,52271,C.34113802,1,1,64,600.05,99,15081,,,,,70.0,coretemp_pkg,,
2026-06-06T16:25:39+00:00,gpuserver1,52271,C.34113802,1,1,46,74.39,0,777,,,,,44.0,coretemp_pkg,,
2026-06-06T16:26:09+00:00,gpuserver1,52271,C.34113802,1,1,64,495.66,83,14729,,,,,74.0,coretemp_pkg,,
2026-06-06T16:26:39+00:00,gpuserver1,52271,C.34113802,1,1,46,75.02,0,777,,,,,44.0,coretemp_pkg,,
2026-06-06T16:27:09+00:00,gpuserver1,52271,C.34113802,1,1,42,24.36,0,777,,,,,40.0,coretemp_pkg,,
2026-06-06T16:27:39+00:00,gpuserver1,52271,C.34113802,1,1,42,21.19,0,777,,,,,40.0,coretemp_pkg,,
2026-06-06T16:28:10+00:00,gpuserver1,52271,C.34113802,1,1,42,21.17,0,777,,,,,39.0,coretemp_pkg,,
2026-06-06T16:28:40+00:00,gpuserver1,52271,C.34113802,1,1,64,602.15,100,26539,,,,,69.0,coretemp_pkg,,
2026-06-06T16:29:10+00:00,gpuserver1,52271,C.34113802,1,1,67,600.00,100,26603,,,,,72.0,coretemp_pkg,,
2026-06-06T16:29:40+00:00,gpuserver1,52271,C.34113802,1,1,76,600.14,100,26571,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

