---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T10:35:40+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.82W >580W sustained 3 samples

## Latest sample
```
2026-06-07T10:35:40+00:00,gpuserver1,52271,C.34113802,1,1,74,599.82,100,26659,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T10:31:09+00:00,gpuserver1,52271,C.34113802,1,1,42,19.03,0,803,,,,,37.0,coretemp_pkg,,
2026-06-07T10:31:39+00:00,gpuserver1,52271,C.34113802,1,1,42,21.20,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T10:32:09+00:00,gpuserver1,52271,C.34113802,1,1,42,19.50,0,803,,,,,36.0,coretemp_pkg,,
2026-06-07T10:32:39+00:00,gpuserver1,52271,C.34113802,1,1,42,19.56,0,803,,,,,36.0,coretemp_pkg,,
2026-06-07T10:33:10+00:00,gpuserver1,52271,C.34113802,1,1,42,19.26,0,803,,,,,35.0,coretemp_pkg,,
2026-06-07T10:33:40+00:00,gpuserver1,52271,C.34113802,1,1,43,19.50,0,803,,,,,35.0,coretemp_pkg,,
2026-06-07T10:34:10+00:00,gpuserver1,52271,C.34113802,1,1,43,21.36,0,803,,,,,36.0,coretemp_pkg,,
2026-06-07T10:34:40+00:00,gpuserver1,52271,C.34113802,1,1,66,600.06,100,26627,,,,,67.0,coretemp_pkg,,
2026-06-07T10:35:10+00:00,gpuserver1,52271,C.34113802,1,1,74,602.18,100,26627,,,,,72.0,coretemp_pkg,,
2026-06-07T10:35:40+00:00,gpuserver1,52271,C.34113802,1,1,74,599.82,100,26659,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

