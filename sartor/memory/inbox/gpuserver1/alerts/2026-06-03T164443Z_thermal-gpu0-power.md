---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T16:44:43+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.00W >580W sustained 3 samples

## Latest sample
```
2026-06-03T16:44:43+00:00,gpuserver1,52271,C.34113802,1,1,77,600.00,100,26659,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T16:40:12+00:00,gpuserver1,52271,C.34113802,1,1,46,75.35,0,801,,,,,44.0,coretemp_pkg,,
2026-06-03T16:40:42+00:00,gpuserver1,52271,C.34113802,1,1,42,24.15,0,801,,,,,42.0,coretemp_pkg,,
2026-06-03T16:41:12+00:00,gpuserver1,52271,C.34113802,1,1,42,22.03,0,801,,,,,39.0,coretemp_pkg,,
2026-06-03T16:41:42+00:00,gpuserver1,52271,C.34113802,1,1,59,581.76,90,13633,,,,,66.0,coretemp_pkg,,
2026-06-03T16:42:13+00:00,gpuserver1,52271,C.34113802,1,1,46,76.64,0,801,,,,,42.0,coretemp_pkg,,
2026-06-03T16:42:43+00:00,gpuserver1,52271,C.34113802,1,1,42,24.46,0,801,,,,,40.0,coretemp_pkg,,
2026-06-03T16:43:13+00:00,gpuserver1,52271,C.34113802,1,1,44,210.16,17,16963,,,,,60.0,coretemp_pkg,,
2026-06-03T16:43:43+00:00,gpuserver1,52271,C.34113802,1,1,71,600.07,100,26627,,,,,71.0,coretemp_pkg,,
2026-06-03T16:44:13+00:00,gpuserver1,52271,C.34113802,1,1,70,600.02,100,26627,,,,,75.0,coretemp_pkg,,
2026-06-03T16:44:43+00:00,gpuserver1,52271,C.34113802,1,1,77,600.00,100,26659,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

