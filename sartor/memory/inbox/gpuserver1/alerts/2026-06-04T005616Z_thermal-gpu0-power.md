---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T00:56:16+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.09W >580W sustained 3 samples

## Latest sample
```
2026-06-04T00:56:16+00:00,gpuserver1,52271,C.34113802,1,1,76,600.09,100,26755,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T00:51:44+00:00,gpuserver1,52271,C.34113802,1,1,45,74.55,0,801,,,,,44.0,coretemp_pkg,,
2026-06-04T00:52:15+00:00,gpuserver1,52271,C.34113802,1,1,41,21.50,0,801,,,,,41.0,coretemp_pkg,,
2026-06-04T00:52:45+00:00,gpuserver1,52271,C.34113802,1,1,42,21.14,0,801,,,,,42.0,coretemp_pkg,,
2026-06-04T00:53:15+00:00,gpuserver1,52271,C.34113802,1,1,47,76.82,0,9633,,,,,41.0,coretemp_pkg,,
2026-06-04T00:53:45+00:00,gpuserver1,52271,C.34113802,1,1,64,596.22,100,18753,,,,,75.0,coretemp_pkg,,
2026-06-04T00:54:15+00:00,gpuserver1,52271,C.34113802,1,1,46,75.79,0,801,,,,,44.0,coretemp_pkg,,
2026-06-04T00:54:45+00:00,gpuserver1,52271,C.34113802,1,1,43,23.42,0,801,,,,,41.0,coretemp_pkg,,
2026-06-04T00:55:16+00:00,gpuserver1,52271,C.34113802,1,1,66,600.02,100,26659,,,,,81.0,coretemp_pkg,,
2026-06-04T00:55:46+00:00,gpuserver1,52271,C.34113802,1,1,71,602.34,100,26787,,,,,73.0,coretemp_pkg,,
2026-06-04T00:56:16+00:00,gpuserver1,52271,C.34113802,1,1,76,600.09,100,26755,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

