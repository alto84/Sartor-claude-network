---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T09:31:38+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.37W >580W sustained 3 samples

## Latest sample
```
2026-05-28T09:31:38+00:00,gpuserver1,52271,C.34113802,1,1,74,600.37,100,26729,,,,,67.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T09:27:06+00:00,gpuserver1,52271,C.34113802,1,1,41,21.02,0,803,,,,,37.0,coretemp_pkg,,
2026-05-28T09:27:36+00:00,gpuserver1,52271,C.34113802,1,1,42,21.90,0,803,,,,,37.0,coretemp_pkg,,
2026-05-28T09:28:06+00:00,gpuserver1,52271,C.34113802,1,1,42,21.62,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T09:28:37+00:00,gpuserver1,52271,C.34113802,1,1,43,21.49,0,803,,,,,36.0,coretemp_pkg,,
2026-05-28T09:29:07+00:00,gpuserver1,52271,C.34113802,1,1,43,21.59,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T09:29:37+00:00,gpuserver1,52271,C.34113802,1,1,44,21.68,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T09:30:07+00:00,gpuserver1,52271,C.34113802,1,1,44,23.61,0,803,,,,,36.0,coretemp_pkg,,
2026-05-28T09:30:38+00:00,gpuserver1,52271,C.34113802,1,1,66,601.20,100,26569,,,,,61.0,coretemp_pkg,,
2026-05-28T09:31:08+00:00,gpuserver1,52271,C.34113802,1,1,73,599.84,100,26633,,,,,65.0,coretemp_pkg,,
2026-05-28T09:31:38+00:00,gpuserver1,52271,C.34113802,1,1,74,600.37,100,26729,,,,,67.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

