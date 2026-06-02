---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T01:23:13+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.04W >580W sustained 3 samples

## Latest sample
```
2026-06-02T01:23:13+00:00,gpuserver1,52271,C.34113802,1,1,73,600.04,100,26789,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T01:18:42+00:00,gpuserver1,52271,C.34113802,1,1,46,76.05,0,9635,,,,,42.0,coretemp_pkg,,
2026-06-02T01:19:12+00:00,gpuserver1,52271,C.34113802,1,1,43,23.41,0,803,,,,,40.0,coretemp_pkg,,
2026-06-02T01:19:42+00:00,gpuserver1,52271,C.34113802,1,1,41,21.28,0,803,,,,,40.0,coretemp_pkg,,
2026-06-02T01:20:12+00:00,gpuserver1,52271,C.34113802,1,1,47,77.15,0,10947,,,,,61.0,coretemp_pkg,,
2026-06-02T01:20:43+00:00,gpuserver1,52271,C.34113802,1,1,45,73.77,0,803,,,,,44.0,coretemp_pkg,,
2026-06-02T01:21:13+00:00,gpuserver1,52271,C.34113802,1,1,62,581.82,99,15107,,,,,75.0,coretemp_pkg,,
2026-06-02T01:21:43+00:00,gpuserver1,52271,C.34113802,1,1,45,74.70,0,803,,,,,44.0,coretemp_pkg,,
2026-06-02T01:22:13+00:00,gpuserver1,52271,C.34113802,1,1,66,599.99,100,26661,,,,,76.0,coretemp_pkg,,
2026-06-02T01:22:43+00:00,gpuserver1,52271,C.34113802,1,1,73,598.05,100,26789,,,,,77.0,coretemp_pkg,,
2026-06-02T01:23:13+00:00,gpuserver1,52271,C.34113802,1,1,73,600.04,100,26789,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

