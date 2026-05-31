---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T06:02:25+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.70W >580W sustained 3 samples

## Latest sample
```
2026-05-28T06:02:24+00:00,gpuserver1,52271,C.34113802,1,1,75,602.70,100,26667,,,,,64.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T05:57:53+00:00,gpuserver1,52271,C.34113802,1,1,52,115.21,0,18429,,,,,75.0,coretemp_pkg,,
2026-05-28T05:58:23+00:00,gpuserver1,52271,C.34113802,1,1,47,76.63,0,14685,,,,,53.0,coretemp_pkg,,
2026-05-28T05:58:53+00:00,gpuserver1,52271,C.34113802,1,1,45,74.36,0,521,,,,,42.0,coretemp_pkg,,
2026-05-28T05:59:24+00:00,gpuserver1,52271,C.34113802,1,1,41,21.02,0,521,,,,,42.0,coretemp_pkg,,
2026-05-28T05:59:54+00:00,gpuserver1,52271,C.34113802,1,1,42,20.62,0,521,,,,,39.0,coretemp_pkg,,
2026-05-28T06:00:24+00:00,gpuserver1,52271,C.34113802,1,1,43,20.74,0,521,,,,,37.0,coretemp_pkg,,
2026-05-28T06:00:54+00:00,gpuserver1,52271,C.34113802,1,1,55,326.11,100,29545,,,,,75.0,coretemp_pkg,,
2026-05-28T06:01:24+00:00,gpuserver1,52271,C.34113802,1,1,70,600.97,100,26571,,,,,61.0,coretemp_pkg,,
2026-05-28T06:01:54+00:00,gpuserver1,52271,C.34113802,1,1,74,600.66,100,26603,,,,,61.0,coretemp_pkg,,
2026-05-28T06:02:24+00:00,gpuserver1,52271,C.34113802,1,1,75,602.70,100,26667,,,,,64.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

