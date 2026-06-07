---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T17:33:11+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.88W >580W sustained 3 samples

## Latest sample
```
2026-06-07T17:33:11+00:00,gpuserver1,52271,C.34113802,1,1,74,602.88,100,26571,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T17:28:40+00:00,gpuserver1,52271,C.34113802,1,1,58,501.42,88,13961,,,,,64.0,coretemp_pkg,,
2026-06-07T17:29:10+00:00,gpuserver1,52271,C.34113802,1,1,47,76.17,0,777,,,,,50.0,coretemp_pkg,,
2026-06-07T17:29:40+00:00,gpuserver1,52271,C.34113802,1,1,43,24.18,0,777,,,,,40.0,coretemp_pkg,,
2026-06-07T17:30:10+00:00,gpuserver1,52271,C.34113802,1,1,42,20.12,0,777,,,,,47.0,coretemp_pkg,,
2026-06-07T17:30:41+00:00,gpuserver1,52271,C.34113802,1,1,42,19.45,0,777,,,,,39.0,coretemp_pkg,,
2026-06-07T17:31:11+00:00,gpuserver1,52271,C.34113802,1,1,63,508.20,82,14729,,,,,60.0,coretemp_pkg,,
2026-06-07T17:31:41+00:00,gpuserver1,52271,C.34113802,1,1,45,75.61,0,777,,,,,42.0,coretemp_pkg,,
2026-06-07T17:32:11+00:00,gpuserver1,52271,C.34113802,1,1,63,600.37,100,26539,,,,,70.0,coretemp_pkg,,
2026-06-07T17:32:41+00:00,gpuserver1,52271,C.34113802,1,1,69,600.03,100,26603,,,,,76.0,coretemp_pkg,,
2026-06-07T17:33:11+00:00,gpuserver1,52271,C.34113802,1,1,74,602.88,100,26571,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

