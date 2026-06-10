---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-10T18:05:54+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.80W >580W sustained 3 samples

## Latest sample
```
2026-06-10T18:05:54+00:00,gpuserver1,52271,C.34113802,1,1,77,598.80,100,26659,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-10T18:01:22+00:00,gpuserver1,52271,C.34113802,1,1,44,20.86,0,803,,,,,35.0,coretemp_pkg,,
2026-06-10T18:01:53+00:00,gpuserver1,52271,C.34113802,1,1,44,21.30,0,803,,,,,40.0,coretemp_pkg,,
2026-06-10T18:02:23+00:00,gpuserver1,52271,C.34113802,1,1,44,20.42,0,803,,,,,35.0,coretemp_pkg,,
2026-06-10T18:02:53+00:00,gpuserver1,52271,C.34113802,1,1,44,21.12,0,803,,,,,35.0,coretemp_pkg,,
2026-06-10T18:03:23+00:00,gpuserver1,52271,C.34113802,1,1,44,22.24,0,803,,,,,36.0,coretemp_pkg,,
2026-06-10T18:03:54+00:00,gpuserver1,52271,C.34113802,1,1,49,78.94,0,12707,,,,,63.0,coretemp_pkg,,
2026-06-10T18:04:24+00:00,gpuserver1,52271,C.34113802,1,1,46,75.55,33,7683,,,,,65.0,coretemp_pkg,,
2026-06-10T18:04:54+00:00,gpuserver1,52271,C.34113802,1,1,70,599.74,100,26627,,,,,72.0,coretemp_pkg,,
2026-06-10T18:05:24+00:00,gpuserver1,52271,C.34113802,1,1,70,600.01,100,26627,,,,,77.0,coretemp_pkg,,
2026-06-10T18:05:54+00:00,gpuserver1,52271,C.34113802,1,1,77,598.80,100,26659,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

