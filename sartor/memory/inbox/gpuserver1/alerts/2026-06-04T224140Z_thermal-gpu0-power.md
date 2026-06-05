---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T22:41:40+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.99W >580W sustained 3 samples

## Latest sample
```
2026-06-04T22:41:40+00:00,gpuserver1,52271,C.34113802,1,1,76,599.99,100,26597,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T22:37:08+00:00,gpuserver1,52271,C.34113802,1,1,43,24.76,0,803,,,,,40.0,coretemp_pkg,,
2026-06-04T22:37:38+00:00,gpuserver1,52271,C.34113802,1,1,42,22.71,0,803,,,,,40.0,coretemp_pkg,,
2026-06-04T22:38:09+00:00,gpuserver1,52271,C.34113802,1,1,42,21.80,0,803,,,,,39.0,coretemp_pkg,,
2026-06-04T22:38:39+00:00,gpuserver1,52271,C.34113802,1,1,42,21.43,0,803,,,,,38.0,coretemp_pkg,,
2026-06-04T22:39:09+00:00,gpuserver1,52271,C.34113802,1,1,42,21.24,0,803,,,,,37.0,coretemp_pkg,,
2026-06-04T22:39:39+00:00,gpuserver1,52271,C.34113802,1,1,43,21.73,0,803,,,,,37.0,coretemp_pkg,,
2026-06-04T22:40:09+00:00,gpuserver1,52271,C.34113802,1,1,43,23.66,0,803,,,,,37.0,coretemp_pkg,,
2026-06-04T22:40:40+00:00,gpuserver1,52271,C.34113802,1,1,68,600.24,100,26565,,,,,69.0,coretemp_pkg,,
2026-06-04T22:41:10+00:00,gpuserver1,52271,C.34113802,1,1,74,602.82,100,26629,,,,,75.0,coretemp_pkg,,
2026-06-04T22:41:40+00:00,gpuserver1,52271,C.34113802,1,1,76,599.99,100,26597,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

