---
type: alert
date: 2026-05-25
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-25T13:23:32+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.70W >580W sustained 3 samples

## Latest sample
```
2026-05-25T13:23:32+00:00,gpuserver1,52271,C.34113802,1,1,75,602.70,100,26727,,,,,73.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-25T13:19:01+00:00,gpuserver1,52271,C.34113802,1,1,45,74.25,0,803,,,,,40.0,coretemp_pkg,,
2026-05-25T13:19:31+00:00,gpuserver1,52271,C.34113802,1,1,60,598.32,98,18787,,,,,68.0,coretemp_pkg,,
2026-05-25T13:20:01+00:00,gpuserver1,52271,C.34113802,1,1,44,74.20,0,803,,,,,41.0,coretemp_pkg,,
2026-05-25T13:20:31+00:00,gpuserver1,52271,C.34113802,1,1,47,76.60,0,12515,,,,,71.0,coretemp_pkg,,
2026-05-25T13:21:01+00:00,gpuserver1,52271,C.34113802,1,1,43,52.01,0,803,,,,,40.0,coretemp_pkg,,
2026-05-25T13:21:32+00:00,gpuserver1,52271,C.34113802,1,1,41,21.20,0,803,,,,,39.0,coretemp_pkg,,
2026-05-25T13:22:02+00:00,gpuserver1,52271,C.34113802,1,1,42,20.66,0,803,,,,,43.0,coretemp_pkg,,
2026-05-25T13:22:32+00:00,gpuserver1,52271,C.34113802,1,1,66,603.03,100,26631,,,,,62.0,coretemp_pkg,,
2026-05-25T13:23:02+00:00,gpuserver1,52271,C.34113802,1,1,71,601.73,100,26631,,,,,72.0,coretemp_pkg,,
2026-05-25T13:23:32+00:00,gpuserver1,52271,C.34113802,1,1,75,602.70,100,26727,,,,,73.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

