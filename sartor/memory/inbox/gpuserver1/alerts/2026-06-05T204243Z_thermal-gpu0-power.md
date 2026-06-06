---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T20:42:43+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.00W >580W sustained 3 samples

## Latest sample
```
2026-06-05T20:42:43+00:00,gpuserver1,52271,C.34113802,1,1,78,600.00,100,26659,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T20:38:12+00:00,gpuserver1,52271,C.34113802,1,1,45,22.11,0,801,,,,,38.0,coretemp_pkg,,
2026-06-05T20:38:42+00:00,gpuserver1,52271,C.34113802,1,1,45,23.83,0,801,,,,,37.0,coretemp_pkg,,
2026-06-05T20:39:12+00:00,gpuserver1,52271,C.34113802,1,1,51,81.23,0,13825,,,,,60.0,coretemp_pkg,,
2026-06-05T20:39:43+00:00,gpuserver1,52271,C.34113802,1,1,46,75.93,0,801,,,,,40.0,coretemp_pkg,,
2026-06-05T20:40:13+00:00,gpuserver1,52271,C.34113802,1,1,60,230.89,83,9505,,,,,67.0,coretemp_pkg,,
2026-06-05T20:40:43+00:00,gpuserver1,52271,C.34113802,1,1,46,32.57,14,8961,,,,,55.0,coretemp_pkg,,
2026-06-05T20:41:13+00:00,gpuserver1,52271,C.34113802,1,1,45,77.28,23,5697,,,,,71.0,coretemp_pkg,,
2026-06-05T20:41:43+00:00,gpuserver1,52271,C.34113802,1,1,71,600.00,100,26627,,,,,82.0,coretemp_pkg,,
2026-06-05T20:42:13+00:00,gpuserver1,52271,C.34113802,1,1,70,600.30,100,26627,,,,,80.0,coretemp_pkg,,
2026-06-05T20:42:43+00:00,gpuserver1,52271,C.34113802,1,1,78,600.00,100,26659,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

