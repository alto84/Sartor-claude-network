---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T17:12:53+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.63W >580W sustained 3 samples

## Latest sample
```
2026-06-03T17:12:53+00:00,gpuserver1,52271,C.34113802,1,1,78,599.63,100,26659,,,,,86.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T17:08:21+00:00,gpuserver1,52271,C.34113802,1,1,42,24.32,0,803,,,,,41.0,coretemp_pkg,,
2026-06-03T17:08:52+00:00,gpuserver1,52271,C.34113802,1,1,42,21.66,0,803,,,,,48.0,coretemp_pkg,,
2026-06-03T17:09:22+00:00,gpuserver1,52271,C.34113802,1,1,42,21.29,0,803,,,,,42.0,coretemp_pkg,,
2026-06-03T17:09:52+00:00,gpuserver1,52271,C.34113802,1,1,43,21.19,0,803,,,,,39.0,coretemp_pkg,,
2026-06-03T17:10:22+00:00,gpuserver1,52271,C.34113802,1,1,43,23.73,0,803,,,,,39.0,coretemp_pkg,,
2026-06-03T17:10:53+00:00,gpuserver1,52271,C.34113802,1,1,48,78.07,0,12387,,,,,68.0,coretemp_pkg,,
2026-06-03T17:11:23+00:00,gpuserver1,52271,C.34113802,1,1,47,102.88,17,16963,,,,,62.0,coretemp_pkg,,
2026-06-03T17:11:53+00:00,gpuserver1,52271,C.34113802,1,1,70,602.43,100,26627,,,,,66.0,coretemp_pkg,,
2026-06-03T17:12:23+00:00,gpuserver1,52271,C.34113802,1,1,76,599.74,100,26627,,,,,77.0,coretemp_pkg,,
2026-06-03T17:12:53+00:00,gpuserver1,52271,C.34113802,1,1,78,599.63,100,26659,,,,,86.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

