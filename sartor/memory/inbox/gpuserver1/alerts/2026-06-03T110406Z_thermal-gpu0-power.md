---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T11:04:06+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.48W >580W sustained 3 samples

## Latest sample
```
2026-06-03T11:04:06+00:00,gpuserver1,52271,C.34113802,1,1,76,602.48,100,26635,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T10:59:35+00:00,gpuserver1,52271,C.34113802,1,1,42,21.77,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T11:00:05+00:00,gpuserver1,52271,C.34113802,1,1,42,21.88,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T11:00:35+00:00,gpuserver1,52271,C.34113802,1,1,42,21.71,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T11:01:05+00:00,gpuserver1,52271,C.34113802,1,1,42,22.38,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T11:01:36+00:00,gpuserver1,52271,C.34113802,1,1,43,21.72,0,777,,,,,35.0,coretemp_pkg,,
2026-06-03T11:02:06+00:00,gpuserver1,52271,C.34113802,1,1,43,21.72,0,777,,,,,34.0,coretemp_pkg,,
2026-06-03T11:02:36+00:00,gpuserver1,52271,C.34113802,1,1,43,21.72,0,777,,,,,34.0,coretemp_pkg,,
2026-06-03T11:03:06+00:00,gpuserver1,52271,C.34113802,1,1,70,600.26,100,26603,,,,,71.0,coretemp_pkg,,
2026-06-03T11:03:36+00:00,gpuserver1,52271,C.34113802,1,1,74,598.42,100,26603,,,,,75.0,coretemp_pkg,,
2026-06-03T11:04:06+00:00,gpuserver1,52271,C.34113802,1,1,76,602.48,100,26635,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

