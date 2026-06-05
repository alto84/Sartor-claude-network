---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T02:52:44+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.53W >580W sustained 3 samples

## Latest sample
```
2026-06-05T02:52:44+00:00,gpuserver1,52271,C.34113802,1,1,73,599.53,100,26635,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T02:48:13+00:00,gpuserver1,52271,C.34113802,1,1,46,76.36,0,779,,,,,42.0,coretemp_pkg,,
2026-06-05T02:48:43+00:00,gpuserver1,52271,C.34113802,1,1,42,24.76,0,779,,,,,40.0,coretemp_pkg,,
2026-06-05T02:49:13+00:00,gpuserver1,52271,C.34113802,1,1,42,21.40,0,779,,,,,39.0,coretemp_pkg,,
2026-06-05T02:49:43+00:00,gpuserver1,52271,C.34113802,1,1,42,23.85,0,779,,,,,39.0,coretemp_pkg,,
2026-06-05T02:50:14+00:00,gpuserver1,52271,C.34113802,1,1,42,21.45,0,779,,,,,39.0,coretemp_pkg,,
2026-06-05T02:50:44+00:00,gpuserver1,52271,C.34113802,1,1,42,21.65,0,779,,,,,51.0,coretemp_pkg,,
2026-06-05T02:51:14+00:00,gpuserver1,52271,C.34113802,1,1,49,77.22,76,8331,,,,,52.0,coretemp_pkg,,
2026-06-05T02:51:44+00:00,gpuserver1,52271,C.34113802,1,1,70,601.91,100,26603,,,,,68.0,coretemp_pkg,,
2026-06-05T02:52:14+00:00,gpuserver1,52271,C.34113802,1,1,62,602.67,17,6731,,,,,72.0,coretemp_pkg,,
2026-06-05T02:52:44+00:00,gpuserver1,52271,C.34113802,1,1,73,599.53,100,26635,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

