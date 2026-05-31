---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T06:38:07+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.65W >580W sustained 3 samples

## Latest sample
```
2026-05-28T06:38:07+00:00,gpuserver1,52271,C.34113802,1,1,74,602.65,100,26537,,,,,65.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T06:33:35+00:00,gpuserver1,52271,C.34113802,1,1,43,21.14,0,803,,,,,36.0,coretemp_pkg,,
2026-05-28T06:34:05+00:00,gpuserver1,52271,C.34113802,1,1,43,21.73,0,803,,,,,37.0,coretemp_pkg,,
2026-05-28T06:34:35+00:00,gpuserver1,52271,C.34113802,1,1,44,22.02,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T06:35:05+00:00,gpuserver1,52271,C.34113802,1,1,44,23.02,0,803,,,,,36.0,coretemp_pkg,,
2026-05-28T06:35:36+00:00,gpuserver1,52271,C.34113802,1,1,44,22.08,0,803,,,,,36.0,coretemp_pkg,,
2026-05-28T06:36:06+00:00,gpuserver1,52271,C.34113802,1,1,45,21.68,0,803,,,,,34.0,coretemp_pkg,,
2026-05-28T06:36:36+00:00,gpuserver1,52271,C.34113802,1,1,45,22.43,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T06:37:06+00:00,gpuserver1,52271,C.34113802,1,1,69,599.90,100,26473,,,,,60.0,coretemp_pkg,,
2026-05-28T06:37:36+00:00,gpuserver1,52271,C.34113802,1,1,73,595.83,100,26665,,,,,61.0,coretemp_pkg,,
2026-05-28T06:38:07+00:00,gpuserver1,52271,C.34113802,1,1,74,602.65,100,26537,,,,,65.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

