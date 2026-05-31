---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T10:09:47+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.57W >580W sustained 3 samples

## Latest sample
```
2026-05-28T10:09:47+00:00,gpuserver1,52271,C.34113802,1,1,73,602.57,100,26695,,,,,67.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T10:05:17+00:00,gpuserver1,52271,C.34113802,1,1,64,586.86,90,15105,,,,,72.0,coretemp_pkg,,
2026-05-28T10:05:47+00:00,gpuserver1,52271,C.34113802,1,1,46,75.33,0,801,,,,,56.0,coretemp_pkg,,
2026-05-28T10:06:17+00:00,gpuserver1,52271,C.34113802,1,1,64,591.59,94,18753,,,,,74.0,coretemp_pkg,,
2026-05-28T10:06:47+00:00,gpuserver1,52271,C.34113802,1,1,56,196.25,87,9505,,,,,79.0,coretemp_pkg,,
2026-05-28T10:07:17+00:00,gpuserver1,52271,C.34113802,1,1,46,74.42,0,801,,,,,41.0,coretemp_pkg,,
2026-05-28T10:07:47+00:00,gpuserver1,52271,C.34113802,1,1,63,551.90,90,15107,,,,,58.0,coretemp_pkg,,
2026-05-28T10:08:17+00:00,gpuserver1,52271,C.34113802,1,1,46,213.58,18,16963,,,,,61.0,coretemp_pkg,,
2026-05-28T10:08:47+00:00,gpuserver1,52271,C.34113802,1,1,67,596.05,100,26695,,,,,65.0,coretemp_pkg,,
2026-05-28T10:09:17+00:00,gpuserver1,52271,C.34113802,1,1,68,599.73,100,26695,,,,,66.0,coretemp_pkg,,
2026-05-28T10:09:47+00:00,gpuserver1,52271,C.34113802,1,1,73,602.57,100,26695,,,,,67.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

