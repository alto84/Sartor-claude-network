---
type: alert
date: 2026-05-29
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-29T00:19:02+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.07W >580W sustained 3 samples

## Latest sample
```
2026-05-29T00:19:02+00:00,gpuserver1,52271,C.34113802,1,1,74,602.07,100,26787,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-29T00:14:30+00:00,gpuserver1,52271,C.34113802,1,1,63,600.88,96,9507,,,,,79.0,coretemp_pkg,,
2026-05-29T00:15:00+00:00,gpuserver1,52271,C.34113802,1,1,46,77.28,30,1859,,,,,59.0,coretemp_pkg,,
2026-05-29T00:15:31+00:00,gpuserver1,52271,C.34113802,1,1,47,78.26,0,803,,,,,40.0,coretemp_pkg,,
2026-05-29T00:16:01+00:00,gpuserver1,52271,C.34113802,1,1,42,24.50,0,803,,,,,39.0,coretemp_pkg,,
2026-05-29T00:16:31+00:00,gpuserver1,52271,C.34113802,1,1,42,21.87,0,803,,,,,39.0,coretemp_pkg,,
2026-05-29T00:17:01+00:00,gpuserver1,52271,C.34113802,1,1,47,78.95,0,13859,,,,,67.0,coretemp_pkg,,
2026-05-29T00:17:31+00:00,gpuserver1,52271,C.34113802,1,1,43,25.67,0,803,,,,,37.0,coretemp_pkg,,
2026-05-29T00:18:02+00:00,gpuserver1,52271,C.34113802,1,1,66,598.25,100,26659,,,,,75.0,coretemp_pkg,,
2026-05-29T00:18:32+00:00,gpuserver1,52271,C.34113802,1,1,72,600.05,100,26787,,,,,70.0,coretemp_pkg,,
2026-05-29T00:19:02+00:00,gpuserver1,52271,C.34113802,1,1,74,602.07,100,26787,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

