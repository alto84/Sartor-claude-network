---
type: alert
date: 2026-05-29
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-29T18:56:34+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.76W >580W sustained 3 samples

## Latest sample
```
2026-05-29T18:56:34+00:00,gpuserver1,52271,C.34113802,1,1,78,599.76,100,26659,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-29T18:52:02+00:00,gpuserver1,52271,C.34113802,1,1,50,81.14,0,521,,,,,71.0,coretemp_pkg,,
2026-05-29T18:52:32+00:00,gpuserver1,52271,C.34113802,1,1,47,24.89,0,521,,,,,48.0,coretemp_pkg,,
2026-05-29T18:53:03+00:00,gpuserver1,52271,C.34113802,1,1,44,25.18,0,521,,,,,49.0,coretemp_pkg,,
2026-05-29T18:53:33+00:00,gpuserver1,52271,C.34113802,1,1,48,78.84,0,9633,,,,,49.0,coretemp_pkg,,
2026-05-29T18:54:03+00:00,gpuserver1,52271,C.34113802,1,1,45,25.07,0,801,,,,,45.0,coretemp_pkg,,
2026-05-29T18:54:33+00:00,gpuserver1,52271,C.34113802,1,1,49,79.73,0,12545,,,,,75.0,coretemp_pkg,,
2026-05-29T18:55:03+00:00,gpuserver1,52271,C.34113802,1,1,47,76.45,0,801,,,,,53.0,coretemp_pkg,,
2026-05-29T18:55:33+00:00,gpuserver1,52271,C.34113802,1,1,72,599.91,100,26627,,,,,80.0,coretemp_pkg,,
2026-05-29T18:56:03+00:00,gpuserver1,52271,C.34113802,1,1,74,601.58,100,26627,,,,,80.0,coretemp_pkg,,
2026-05-29T18:56:34+00:00,gpuserver1,52271,C.34113802,1,1,78,599.76,100,26659,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

