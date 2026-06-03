---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T22:32:40+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.00W >580W sustained 3 samples

## Latest sample
```
2026-06-02T22:32:40+00:00,gpuserver1,52271,C.34113802,1,1,74,600.00,100,26595,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T22:28:09+00:00,gpuserver1,52271,C.34113802,1,1,59,480.29,70,15103,,,,,84.0,coretemp_pkg,,
2026-06-02T22:28:39+00:00,gpuserver1,52271,C.34113802,1,1,46,24.82,0,9633,,,,,46.0,coretemp_pkg,,
2026-06-02T22:29:09+00:00,gpuserver1,52271,C.34113802,1,1,43,23.32,0,9633,,,,,47.0,coretemp_pkg,,
2026-06-02T22:29:39+00:00,gpuserver1,52271,C.34113802,1,1,42,22.65,0,9633,,,,,44.0,coretemp_pkg,,
2026-06-02T22:30:09+00:00,gpuserver1,52271,C.34113802,1,1,42,21.35,0,9633,,,,,44.0,coretemp_pkg,,
2026-06-02T22:30:40+00:00,gpuserver1,52271,C.34113802,1,1,43,21.03,0,9633,,,,,40.0,coretemp_pkg,,
2026-06-02T22:31:10+00:00,gpuserver1,52271,C.34113802,1,1,43,21.15,0,9633,,,,,39.0,coretemp_pkg,,
2026-06-02T22:31:40+00:00,gpuserver1,52271,C.34113802,1,1,66,602.23,100,26563,,,,,72.0,coretemp_pkg,,
2026-06-02T22:32:10+00:00,gpuserver1,52271,C.34113802,1,1,70,599.99,100,26627,,,,,77.0,coretemp_pkg,,
2026-06-02T22:32:40+00:00,gpuserver1,52271,C.34113802,1,1,74,600.00,100,26595,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

