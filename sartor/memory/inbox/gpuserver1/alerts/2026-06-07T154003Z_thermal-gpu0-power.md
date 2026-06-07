---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T15:40:03+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 597.06W >580W sustained 3 samples

## Latest sample
```
2026-06-07T15:40:03+00:00,gpuserver1,52271,C.34113802,1,1,66,597.06,98,15083,,,,,70.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T15:35:32+00:00,gpuserver1,52271,C.34113802,1,1,47,75.51,0,13675,,,,,69.0,coretemp_pkg,,
2026-06-07T15:36:02+00:00,gpuserver1,52271,C.34113802,1,1,44,21.56,0,779,,,,,42.0,coretemp_pkg,,
2026-06-07T15:36:32+00:00,gpuserver1,52271,C.34113802,1,1,48,88.71,0,12491,,,,,72.0,coretemp_pkg,,
2026-06-07T15:37:02+00:00,gpuserver1,52271,C.34113802,1,1,45,73.57,0,779,,,,,42.0,coretemp_pkg,,
2026-06-07T15:37:32+00:00,gpuserver1,52271,C.34113802,1,1,45,27.61,50,5899,,,,,65.0,coretemp_pkg,,
2026-06-07T15:38:02+00:00,gpuserver1,52271,C.34113802,1,1,46,74.33,0,779,,,,,44.0,coretemp_pkg,,
2026-06-07T15:38:33+00:00,gpuserver1,52271,C.34113802,1,1,42,21.60,0,779,,,,,40.0,coretemp_pkg,,
2026-06-07T15:39:03+00:00,gpuserver1,52271,C.34113802,1,1,63,600.71,98,15083,,,,,80.0,coretemp_pkg,,
2026-06-07T15:39:33+00:00,gpuserver1,52271,C.34113802,1,1,65,602.10,98,15083,,,,,80.0,coretemp_pkg,,
2026-06-07T15:40:03+00:00,gpuserver1,52271,C.34113802,1,1,66,597.06,98,15083,,,,,70.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

