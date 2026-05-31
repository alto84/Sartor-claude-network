---
type: alert
date: 2026-05-29
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-29T18:37:27+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.72W >580W sustained 3 samples

## Latest sample
```
2026-05-29T18:37:27+00:00,gpuserver1,52271,C.34113802,1,1,76,598.72,100,26595,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-29T18:32:56+00:00,gpuserver1,52271,C.34113802,1,1,44,25.10,0,803,,,,,41.0,coretemp_pkg,,
2026-05-29T18:33:26+00:00,gpuserver1,52271,C.34113802,1,1,42,23.45,0,803,,,,,41.0,coretemp_pkg,,
2026-05-29T18:33:56+00:00,gpuserver1,52271,C.34113802,1,1,42,21.34,0,803,,,,,39.0,coretemp_pkg,,
2026-05-29T18:34:27+00:00,gpuserver1,52271,C.34113802,1,1,42,22.29,0,803,,,,,39.0,coretemp_pkg,,
2026-05-29T18:34:57+00:00,gpuserver1,52271,C.34113802,1,1,43,23.14,0,803,,,,,39.0,coretemp_pkg,,
2026-05-29T18:35:27+00:00,gpuserver1,52271,C.34113802,1,1,48,77.32,0,12355,,,,,64.0,coretemp_pkg,,
2026-05-29T18:35:57+00:00,gpuserver1,52271,C.34113802,1,1,44,24.96,0,803,,,,,65.0,coretemp_pkg,,
2026-05-29T18:36:27+00:00,gpuserver1,52271,C.34113802,1,1,66,598.45,100,26563,,,,,74.0,coretemp_pkg,,
2026-05-29T18:36:57+00:00,gpuserver1,52271,C.34113802,1,1,73,599.92,100,26627,,,,,80.0,coretemp_pkg,,
2026-05-29T18:37:27+00:00,gpuserver1,52271,C.34113802,1,1,76,598.72,100,26595,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

