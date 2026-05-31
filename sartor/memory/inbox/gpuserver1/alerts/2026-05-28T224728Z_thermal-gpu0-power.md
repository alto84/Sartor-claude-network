---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T22:47:28+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.39W >580W sustained 3 samples

## Latest sample
```
2026-05-28T22:47:28+00:00,gpuserver1,52271,C.34113802,1,1,68,602.39,100,26595,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T22:42:57+00:00,gpuserver1,52271,C.34113802,1,1,43,21.71,0,801,,,,,35.0,coretemp_pkg,,
2026-05-28T22:43:27+00:00,gpuserver1,52271,C.34113802,1,1,64,582.92,90,14753,,,,,53.0,coretemp_pkg,,
2026-05-28T22:43:57+00:00,gpuserver1,52271,C.34113802,1,1,46,75.97,0,801,,,,,39.0,coretemp_pkg,,
2026-05-28T22:44:27+00:00,gpuserver1,52271,C.34113802,1,1,42,26.05,0,801,,,,,36.0,coretemp_pkg,,
2026-05-28T22:44:58+00:00,gpuserver1,52271,C.34113802,1,1,42,21.28,0,801,,,,,36.0,coretemp_pkg,,
2026-05-28T22:45:28+00:00,gpuserver1,52271,C.34113802,1,1,50,472.96,0,12609,,,,,66.0,coretemp_pkg,,
2026-05-28T22:45:58+00:00,gpuserver1,52271,C.34113802,1,1,44,74.91,0,801,,,,,40.0,coretemp_pkg,,
2026-05-28T22:46:28+00:00,gpuserver1,52271,C.34113802,1,1,66,598.53,100,26563,,,,,75.0,coretemp_pkg,,
2026-05-28T22:46:58+00:00,gpuserver1,52271,C.34113802,1,1,68,600.55,100,26627,,,,,75.0,coretemp_pkg,,
2026-05-28T22:47:28+00:00,gpuserver1,52271,C.34113802,1,1,68,602.39,100,26595,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

