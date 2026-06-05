---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T13:36:11+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.29W >580W sustained 3 samples

## Latest sample
```
2026-06-05T13:36:11+00:00,gpuserver1,52271,C.34113802,1,1,76,598.29,100,26635,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T13:31:39+00:00,gpuserver1,52271,C.34113802,1,1,43,21.52,0,777,,,,,35.0,coretemp_pkg,,
2026-06-05T13:32:09+00:00,gpuserver1,52271,C.34113802,1,1,43,21.17,0,777,,,,,37.0,coretemp_pkg,,
2026-06-05T13:32:39+00:00,gpuserver1,52271,C.34113802,1,1,43,21.49,0,777,,,,,36.0,coretemp_pkg,,
2026-06-05T13:33:10+00:00,gpuserver1,52271,C.34113802,1,1,43,23.79,0,777,,,,,38.0,coretemp_pkg,,
2026-06-05T13:33:40+00:00,gpuserver1,52271,C.34113802,1,1,47,77.06,0,12553,,,,,66.0,coretemp_pkg,,
2026-06-05T13:34:10+00:00,gpuserver1,52271,C.34113802,1,1,43,23.74,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T13:34:40+00:00,gpuserver1,52271,C.34113802,1,1,41,21.45,0,777,,,,,53.0,coretemp_pkg,,
2026-06-05T13:35:10+00:00,gpuserver1,52271,C.34113802,1,1,69,600.59,100,26603,,,,,72.0,coretemp_pkg,,
2026-06-05T13:35:40+00:00,gpuserver1,52271,C.34113802,1,1,74,600.38,100,26603,,,,,74.0,coretemp_pkg,,
2026-06-05T13:36:11+00:00,gpuserver1,52271,C.34113802,1,1,76,598.29,100,26635,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

