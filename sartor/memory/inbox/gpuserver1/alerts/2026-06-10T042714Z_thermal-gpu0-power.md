---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-10T04:27:14+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.57W >580W sustained 3 samples

## Latest sample
```
2026-06-10T04:27:14+00:00,gpuserver1,52271,C.34113802,1,1,77,599.57,100,26729,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-10T04:22:43+00:00,gpuserver1,52271,C.34113802,1,1,46,74.66,0,803,,,,,42.0,coretemp_pkg,,
2026-06-10T04:23:13+00:00,gpuserver1,52271,C.34113802,1,1,42,21.67,0,803,,,,,42.0,coretemp_pkg,,
2026-06-10T04:23:43+00:00,gpuserver1,52271,C.34113802,1,1,46,75.51,0,12803,,,,,72.0,coretemp_pkg,,
2026-06-10T04:24:13+00:00,gpuserver1,52271,C.34113802,1,1,49,78.13,0,13219,,,,,71.0,coretemp_pkg,,
2026-06-10T04:24:43+00:00,gpuserver1,52271,C.34113802,1,1,44,22.89,0,803,,,,,41.0,coretemp_pkg,,
2026-06-10T04:25:13+00:00,gpuserver1,52271,C.34113802,1,1,42,22.22,0,803,,,,,42.0,coretemp_pkg,,
2026-06-10T04:25:43+00:00,gpuserver1,52271,C.34113802,1,1,43,76.78,0,5699,,,,,45.0,coretemp_pkg,,
2026-06-10T04:26:13+00:00,gpuserver1,52271,C.34113802,1,1,68,597.36,100,26633,,,,,71.0,coretemp_pkg,,
2026-06-10T04:26:44+00:00,gpuserver1,52271,C.34113802,1,1,71,599.93,100,26633,,,,,71.0,coretemp_pkg,,
2026-06-10T04:27:14+00:00,gpuserver1,52271,C.34113802,1,1,77,599.57,100,26729,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

