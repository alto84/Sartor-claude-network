---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T11:45:55+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.99W >580W sustained 3 samples

## Latest sample
```
2026-06-06T11:45:55+00:00,gpuserver1,52271,C.34113802,1,1,75,599.99,100,26629,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T11:41:23+00:00,gpuserver1,52271,C.34113802,1,1,43,23.36,0,521,,,,,42.0,coretemp_pkg,,
2026-06-06T11:41:54+00:00,gpuserver1,52271,C.34113802,1,1,43,21.99,0,521,,,,,40.0,coretemp_pkg,,
2026-06-06T11:42:24+00:00,gpuserver1,52271,C.34113802,1,1,43,22.24,0,521,,,,,40.0,coretemp_pkg,,
2026-06-06T11:42:54+00:00,gpuserver1,52271,C.34113802,1,1,44,21.92,0,521,,,,,39.0,coretemp_pkg,,
2026-06-06T11:43:24+00:00,gpuserver1,52271,C.34113802,1,1,44,21.94,0,521,,,,,39.0,coretemp_pkg,,
2026-06-06T11:43:55+00:00,gpuserver1,52271,C.34113802,1,1,44,23.99,0,521,,,,,38.0,coretemp_pkg,,
2026-06-06T11:44:25+00:00,gpuserver1,52271,C.34113802,1,1,44,21.89,0,521,,,,,39.0,coretemp_pkg,,
2026-06-06T11:44:55+00:00,gpuserver1,52271,C.34113802,1,1,72,599.73,100,26597,,,,,69.0,coretemp_pkg,,
2026-06-06T11:45:25+00:00,gpuserver1,52271,C.34113802,1,1,76,597.92,100,26597,,,,,74.0,coretemp_pkg,,
2026-06-06T11:45:55+00:00,gpuserver1,52271,C.34113802,1,1,75,599.99,100,26629,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

