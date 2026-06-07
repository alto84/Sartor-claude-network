---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T05:14:11+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.49W >580W sustained 3 samples

## Latest sample
```
2026-06-07T05:14:11+00:00,gpuserver1,52271,C.34113802,1,1,74,602.49,100,26573,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T05:09:40+00:00,gpuserver1,52271,C.34113802,1,1,43,19.29,0,779,,,,,37.0,coretemp_pkg,,
2026-06-07T05:10:10+00:00,gpuserver1,52271,C.34113802,1,1,43,21.50,0,779,,,,,37.0,coretemp_pkg,,
2026-06-07T05:10:40+00:00,gpuserver1,52271,C.34113802,1,1,43,20.43,0,779,,,,,37.0,coretemp_pkg,,
2026-06-07T05:11:10+00:00,gpuserver1,52271,C.34113802,1,1,43,19.78,0,779,,,,,36.0,coretemp_pkg,,
2026-06-07T05:11:40+00:00,gpuserver1,52271,C.34113802,1,1,44,19.77,0,779,,,,,36.0,coretemp_pkg,,
2026-06-07T05:12:11+00:00,gpuserver1,52271,C.34113802,1,1,44,19.76,0,779,,,,,39.0,coretemp_pkg,,
2026-06-07T05:12:41+00:00,gpuserver1,52271,C.34113802,1,1,44,18.90,0,779,,,,,36.0,coretemp_pkg,,
2026-06-07T05:13:11+00:00,gpuserver1,52271,C.34113802,1,1,70,600.72,100,26541,,,,,70.0,coretemp_pkg,,
2026-06-07T05:13:41+00:00,gpuserver1,52271,C.34113802,1,1,69,599.68,100,26605,,,,,64.0,coretemp_pkg,,
2026-06-07T05:14:11+00:00,gpuserver1,52271,C.34113802,1,1,74,602.49,100,26573,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

