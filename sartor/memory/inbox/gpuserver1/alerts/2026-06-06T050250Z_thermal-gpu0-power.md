---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T05:02:50+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 601.22W >580W sustained 3 samples

## Latest sample
```
2026-06-06T05:02:50+00:00,gpuserver1,52271,C.34113802,1,1,75,601.22,100,25445,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T04:58:18+00:00,gpuserver1,52271,C.34113802,1,1,43,23.66,0,803,,,,,58.0,coretemp_pkg,,
2026-06-06T04:58:48+00:00,gpuserver1,52271,C.34113802,1,1,42,23.46,0,803,,,,,44.0,coretemp_pkg,,
2026-06-06T04:59:19+00:00,gpuserver1,52271,C.34113802,1,1,42,21.06,0,803,,,,,39.0,coretemp_pkg,,
2026-06-06T04:59:49+00:00,gpuserver1,52271,C.34113802,1,1,42,20.95,0,803,,,,,50.0,coretemp_pkg,,
2026-06-06T05:00:19+00:00,gpuserver1,52271,C.34113802,1,1,43,20.85,0,803,,,,,37.0,coretemp_pkg,,
2026-06-06T05:00:49+00:00,gpuserver1,52271,C.34113802,1,1,48,76.70,0,10659,,,,,66.0,coretemp_pkg,,
2026-06-06T05:01:19+00:00,gpuserver1,52271,C.34113802,1,1,44,23.91,0,803,,,,,40.0,coretemp_pkg,,
2026-06-06T05:01:50+00:00,gpuserver1,52271,C.34113802,1,1,65,600.26,100,25317,,,,,72.0,coretemp_pkg,,
2026-06-06T05:02:20+00:00,gpuserver1,52271,C.34113802,1,1,73,600.53,100,25381,,,,,74.0,coretemp_pkg,,
2026-06-06T05:02:50+00:00,gpuserver1,52271,C.34113802,1,1,75,601.22,100,25445,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

