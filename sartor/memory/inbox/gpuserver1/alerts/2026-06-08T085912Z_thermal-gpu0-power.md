---
type: alert
date: 2026-06-08
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-08T08:59:12+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.78W >580W sustained 3 samples

## Latest sample
```
2026-06-08T08:59:12+00:00,gpuserver1,52271,C.34113802,1,1,70,599.78,100,26595,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-08T08:54:40+00:00,gpuserver1,52271,C.34113802,1,1,48,77.48,16,8963,,,,,64.0,coretemp_pkg,,
2026-06-08T08:55:11+00:00,gpuserver1,52271,C.34113802,1,1,50,77.67,0,12963,,,,,73.0,coretemp_pkg,,
2026-06-08T08:55:41+00:00,gpuserver1,52271,C.34113802,1,1,46,23.02,0,803,,,,,44.0,coretemp_pkg,,
2026-06-08T08:56:11+00:00,gpuserver1,52271,C.34113802,1,1,43,22.60,0,803,,,,,44.0,coretemp_pkg,,
2026-06-08T08:56:41+00:00,gpuserver1,52271,C.34113802,1,1,47,75.20,0,9635,,,,,45.0,coretemp_pkg,,
2026-06-08T08:57:11+00:00,gpuserver1,52271,C.34113802,1,1,43,22.66,0,803,,,,,42.0,coretemp_pkg,,
2026-06-08T08:57:41+00:00,gpuserver1,52271,C.34113802,1,1,42,21.69,0,803,,,,,41.0,coretemp_pkg,,
2026-06-08T08:58:12+00:00,gpuserver1,52271,C.34113802,1,1,63,605.30,100,26563,,,,,75.0,coretemp_pkg,,
2026-06-08T08:58:42+00:00,gpuserver1,52271,C.34113802,1,1,73,598.54,100,26627,,,,,79.0,coretemp_pkg,,
2026-06-08T08:59:12+00:00,gpuserver1,52271,C.34113802,1,1,70,599.78,100,26595,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

