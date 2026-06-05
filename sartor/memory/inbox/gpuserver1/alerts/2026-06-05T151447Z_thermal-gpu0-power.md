---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T15:14:47+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.80W >580W sustained 3 samples

## Latest sample
```
2026-06-05T15:14:47+00:00,gpuserver1,52271,C.34113802,1,1,76,599.80,100,26595,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T15:10:15+00:00,gpuserver1,52271,C.34113802,1,1,42,21.77,0,803,,,,,40.0,coretemp_pkg,,
2026-06-05T15:10:45+00:00,gpuserver1,52271,C.34113802,1,1,42,21.29,0,803,,,,,40.0,coretemp_pkg,,
2026-06-05T15:11:15+00:00,gpuserver1,52271,C.34113802,1,1,42,23.71,0,803,,,,,39.0,coretemp_pkg,,
2026-06-05T15:11:46+00:00,gpuserver1,52271,C.34113802,1,1,60,476.97,64,14755,,,,,68.0,coretemp_pkg,,
2026-06-05T15:12:16+00:00,gpuserver1,52271,C.34113802,1,1,46,76.43,0,803,,,,,41.0,coretemp_pkg,,
2026-06-05T15:12:46+00:00,gpuserver1,52271,C.34113802,1,1,42,23.99,0,803,,,,,40.0,coretemp_pkg,,
2026-06-05T15:13:16+00:00,gpuserver1,52271,C.34113802,1,1,42,21.80,0,803,,,,,40.0,coretemp_pkg,,
2026-06-05T15:13:47+00:00,gpuserver1,52271,C.34113802,1,1,65,600.35,100,26563,,,,,73.0,coretemp_pkg,,
2026-06-05T15:14:17+00:00,gpuserver1,52271,C.34113802,1,1,73,599.84,100,26627,,,,,79.0,coretemp_pkg,,
2026-06-05T15:14:47+00:00,gpuserver1,52271,C.34113802,1,1,76,599.80,100,26595,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

