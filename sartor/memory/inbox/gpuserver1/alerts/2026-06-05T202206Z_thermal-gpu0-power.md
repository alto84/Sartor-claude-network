---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T20:22:06+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.18W >580W sustained 3 samples

## Latest sample
```
2026-06-05T20:22:06+00:00,gpuserver1,52271,C.34113802,1,1,76,600.18,100,26571,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T20:17:35+00:00,gpuserver1,52271,C.34113802,1,1,44,21.78,0,777,,,,,51.0,coretemp_pkg,,
2026-06-05T20:18:05+00:00,gpuserver1,52271,C.34113802,1,1,44,22.04,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T20:18:35+00:00,gpuserver1,52271,C.34113802,1,1,50,91.72,0,12969,,,,,66.0,coretemp_pkg,,
2026-06-05T20:19:05+00:00,gpuserver1,52271,C.34113802,1,1,46,75.80,0,777,,,,,42.0,coretemp_pkg,,
2026-06-05T20:19:35+00:00,gpuserver1,52271,C.34113802,1,1,42,24.60,0,777,,,,,40.0,coretemp_pkg,,
2026-06-05T20:20:06+00:00,gpuserver1,52271,C.34113802,1,1,42,20.75,0,777,,,,,40.0,coretemp_pkg,,
2026-06-05T20:20:36+00:00,gpuserver1,52271,C.34113802,1,1,42,21.10,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T20:21:06+00:00,gpuserver1,52271,C.34113802,1,1,66,600.70,100,26539,,,,,76.0,coretemp_pkg,,
2026-06-05T20:21:36+00:00,gpuserver1,52271,C.34113802,1,1,73,600.09,100,26603,,,,,77.0,coretemp_pkg,,
2026-06-05T20:22:06+00:00,gpuserver1,52271,C.34113802,1,1,76,600.18,100,26571,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

