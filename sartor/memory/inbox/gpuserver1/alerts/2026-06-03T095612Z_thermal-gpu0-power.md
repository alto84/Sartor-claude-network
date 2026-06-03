---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T09:56:12+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 583.11W >580W sustained 3 samples

## Latest sample
```
2026-06-03T09:56:12+00:00,gpuserver1,52271,C.34113802,1,1,74,583.11,100,26571,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T09:51:40+00:00,gpuserver1,52271,C.34113802,1,1,43,21.92,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T09:52:10+00:00,gpuserver1,52271,C.34113802,1,1,43,24.12,0,779,,,,,35.0,coretemp_pkg,,
2026-06-03T09:52:41+00:00,gpuserver1,52271,C.34113802,1,1,43,22.12,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T09:53:11+00:00,gpuserver1,52271,C.34113802,1,1,48,78.82,0,12459,,,,,67.0,coretemp_pkg,,
2026-06-03T09:53:41+00:00,gpuserver1,52271,C.34113802,1,1,49,80.37,0,12779,,,,,71.0,coretemp_pkg,,
2026-06-03T09:54:11+00:00,gpuserver1,52271,C.34113802,1,1,45,55.59,0,779,,,,,40.0,coretemp_pkg,,
2026-06-03T09:54:41+00:00,gpuserver1,52271,C.34113802,1,1,42,25.14,0,779,,,,,40.0,coretemp_pkg,,
2026-06-03T09:55:11+00:00,gpuserver1,52271,C.34113802,1,1,63,603.96,100,26539,,,,,77.0,coretemp_pkg,,
2026-06-03T09:55:41+00:00,gpuserver1,52271,C.34113802,1,1,72,598.94,100,26603,,,,,76.0,coretemp_pkg,,
2026-06-03T09:56:12+00:00,gpuserver1,52271,C.34113802,1,1,74,583.11,100,26571,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

