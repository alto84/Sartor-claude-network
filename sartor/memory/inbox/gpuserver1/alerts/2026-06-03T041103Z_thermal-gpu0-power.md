---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T04:11:03+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 597.71W >580W sustained 3 samples

## Latest sample
```
2026-06-03T04:11:03+00:00,gpuserver1,52271,C.34113802,1,1,74,597.71,100,26595,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T04:06:31+00:00,gpuserver1,52271,C.34113802,1,1,43,21.33,0,801,,,,,40.0,coretemp_pkg,,
2026-06-03T04:07:01+00:00,gpuserver1,52271,C.34113802,1,1,43,22.02,0,801,,,,,39.0,coretemp_pkg,,
2026-06-03T04:07:32+00:00,gpuserver1,52271,C.34113802,1,1,43,21.66,0,801,,,,,39.0,coretemp_pkg,,
2026-06-03T04:08:02+00:00,gpuserver1,52271,C.34113802,1,1,43,21.86,0,801,,,,,60.0,coretemp_pkg,,
2026-06-03T04:08:32+00:00,gpuserver1,52271,C.34113802,1,1,51,105.64,0,13731,,,,,64.0,coretemp_pkg,,
2026-06-03T04:09:02+00:00,gpuserver1,52271,C.34113802,1,1,45,49.57,0,803,,,,,41.0,coretemp_pkg,,
2026-06-03T04:09:32+00:00,gpuserver1,52271,C.34113802,1,1,42,24.49,0,803,,,,,42.0,coretemp_pkg,,
2026-06-03T04:10:03+00:00,gpuserver1,52271,C.34113802,1,1,62,603.02,100,26563,,,,,85.0,coretemp_pkg,,
2026-06-03T04:10:33+00:00,gpuserver1,52271,C.34113802,1,1,73,599.85,100,26627,,,,,77.0,coretemp_pkg,,
2026-06-03T04:11:03+00:00,gpuserver1,52271,C.34113802,1,1,74,597.71,100,26595,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

