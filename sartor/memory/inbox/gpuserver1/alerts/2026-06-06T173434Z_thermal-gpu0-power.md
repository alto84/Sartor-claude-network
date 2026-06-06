---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T17:34:34+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.02W >580W sustained 3 samples

## Latest sample
```
2026-06-06T17:34:34+00:00,gpuserver1,52271,C.34113802,1,1,77,600.02,100,26635,,,,,71.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T17:30:03+00:00,gpuserver1,52271,C.34113802,1,1,43,21.28,0,777,,,,,37.0,coretemp_pkg,,
2026-06-06T17:30:33+00:00,gpuserver1,52271,C.34113802,1,1,43,21.29,0,777,,,,,36.0,coretemp_pkg,,
2026-06-06T17:31:03+00:00,gpuserver1,52271,C.34113802,1,1,43,21.58,0,777,,,,,37.0,coretemp_pkg,,
2026-06-06T17:31:33+00:00,gpuserver1,52271,C.34113802,1,1,43,23.84,0,777,,,,,36.0,coretemp_pkg,,
2026-06-06T17:32:04+00:00,gpuserver1,52271,C.34113802,1,1,43,21.76,0,777,,,,,36.0,coretemp_pkg,,
2026-06-06T17:32:34+00:00,gpuserver1,52271,C.34113802,1,1,43,21.74,0,777,,,,,35.0,coretemp_pkg,,
2026-06-06T17:33:04+00:00,gpuserver1,52271,C.34113802,1,1,49,100.49,76,8171,,,,,54.0,coretemp_pkg,,
2026-06-06T17:33:34+00:00,gpuserver1,52271,C.34113802,1,1,72,600.54,100,26603,,,,,66.0,coretemp_pkg,,
2026-06-06T17:34:04+00:00,gpuserver1,52271,C.34113802,1,1,62,600.23,51,8459,,,,,59.0,coretemp_pkg,,
2026-06-06T17:34:34+00:00,gpuserver1,52271,C.34113802,1,1,77,600.02,100,26635,,,,,71.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

