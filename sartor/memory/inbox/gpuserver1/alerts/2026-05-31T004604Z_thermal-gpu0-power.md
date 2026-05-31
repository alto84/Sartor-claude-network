---
type: alert
date: 2026-05-31
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-31T00:46:04+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.02W >580W sustained 3 samples

## Latest sample
```
2026-05-31T00:46:04+00:00,gpuserver1,52271,C.34113802,1,1,75,602.02,100,26597,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-31T00:41:33+00:00,gpuserver1,52271,C.34113802,1,1,46,78.65,17,9027,,,,,54.0,coretemp_pkg,,
2026-05-31T00:42:03+00:00,gpuserver1,52271,C.34113802,1,1,42,23.50,0,803,,,,,37.0,coretemp_pkg,,
2026-05-31T00:42:33+00:00,gpuserver1,52271,C.34113802,1,1,41,21.30,0,803,,,,,37.0,coretemp_pkg,,
2026-05-31T00:43:03+00:00,gpuserver1,52271,C.34113802,1,1,42,22.56,0,803,,,,,46.0,coretemp_pkg,,
2026-05-31T00:43:33+00:00,gpuserver1,52271,C.34113802,1,1,47,77.78,0,12995,,,,,68.0,coretemp_pkg,,
2026-05-31T00:44:04+00:00,gpuserver1,52271,C.34113802,1,1,50,86.31,0,12931,,,,,64.0,coretemp_pkg,,
2026-05-31T00:44:34+00:00,gpuserver1,52271,C.34113802,1,1,51,81.56,0,12899,,,,,67.0,coretemp_pkg,,
2026-05-31T00:45:04+00:00,gpuserver1,52271,C.34113802,1,1,69,598.24,100,26565,,,,,72.0,coretemp_pkg,,
2026-05-31T00:45:34+00:00,gpuserver1,52271,C.34113802,1,1,74,597.74,100,26629,,,,,75.0,coretemp_pkg,,
2026-05-31T00:46:04+00:00,gpuserver1,52271,C.34113802,1,1,75,602.02,100,26597,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

