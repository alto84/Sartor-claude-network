---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T18:14:41+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 597.94W >580W sustained 3 samples

## Latest sample
```
2026-06-02T18:14:41+00:00,gpuserver1,52271,C.34113802,1,1,76,597.94,100,26659,,,,,85.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T18:10:10+00:00,gpuserver1,52271,C.34113802,1,1,49,79.07,0,801,,,,,48.0,coretemp_pkg,,
2026-06-02T18:10:40+00:00,gpuserver1,52271,C.34113802,1,1,61,506.54,81,14369,,,,,80.0,coretemp_pkg,,
2026-06-02T18:11:10+00:00,gpuserver1,52271,C.34113802,1,1,48,78.30,0,801,,,,,48.0,coretemp_pkg,,
2026-06-02T18:11:41+00:00,gpuserver1,52271,C.34113802,1,1,60,493.31,91,14369,,,,,82.0,coretemp_pkg,,
2026-06-02T18:12:11+00:00,gpuserver1,52271,C.34113802,1,1,48,76.85,0,801,,,,,46.0,coretemp_pkg,,
2026-06-02T18:12:41+00:00,gpuserver1,52271,C.34113802,1,1,66,584.87,91,14755,,,,,77.0,coretemp_pkg,,
2026-06-02T18:13:11+00:00,gpuserver1,52271,C.34113802,1,1,47,86.02,7,5699,,,,,76.0,coretemp_pkg,,
2026-06-02T18:13:41+00:00,gpuserver1,52271,C.34113802,1,1,72,599.38,100,26627,,,,,77.0,coretemp_pkg,,
2026-06-02T18:14:11+00:00,gpuserver1,52271,C.34113802,1,1,76,600.11,100,26627,,,,,81.0,coretemp_pkg,,
2026-06-02T18:14:41+00:00,gpuserver1,52271,C.34113802,1,1,76,597.94,100,26659,,,,,85.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

