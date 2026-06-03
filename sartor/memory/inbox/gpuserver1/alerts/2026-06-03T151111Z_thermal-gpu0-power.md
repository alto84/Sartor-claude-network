---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T15:11:11+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.75W >580W sustained 3 samples

## Latest sample
```
2026-06-03T15:11:11+00:00,gpuserver1,52271,C.34113802,1,1,76,599.75,100,26637,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T15:06:39+00:00,gpuserver1,52271,C.34113802,1,1,41,19.84,0,779,,,,,37.0,coretemp_pkg,,
2026-06-03T15:07:10+00:00,gpuserver1,52271,C.34113802,1,1,42,20.46,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T15:07:40+00:00,gpuserver1,52271,C.34113802,1,1,42,21.32,0,779,,,,,37.0,coretemp_pkg,,
2026-06-03T15:08:10+00:00,gpuserver1,52271,C.34113802,1,1,42,22.69,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T15:08:40+00:00,gpuserver1,52271,C.34113802,1,1,42,21.33,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T15:09:10+00:00,gpuserver1,52271,C.34113802,1,1,63,581.31,91,14731,,,,,69.0,coretemp_pkg,,
2026-06-03T15:09:41+00:00,gpuserver1,52271,C.34113802,1,1,45,75.66,0,779,,,,,40.0,coretemp_pkg,,
2026-06-03T15:10:11+00:00,gpuserver1,52271,C.34113802,1,1,70,599.88,100,26605,,,,,76.0,coretemp_pkg,,
2026-06-03T15:10:41+00:00,gpuserver1,52271,C.34113802,1,1,74,599.85,100,26605,,,,,80.0,coretemp_pkg,,
2026-06-03T15:11:11+00:00,gpuserver1,52271,C.34113802,1,1,76,599.75,100,26637,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

