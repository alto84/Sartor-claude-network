---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T13:03:28+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.05W >580W sustained 3 samples

## Latest sample
```
2026-06-05T13:03:28+00:00,gpuserver1,52271,C.34113802,1,1,74,600.05,100,26573,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T12:58:57+00:00,gpuserver1,52271,C.34113802,1,1,50,421.16,16,9547,,,,,65.0,coretemp_pkg,,
2026-06-05T12:59:27+00:00,gpuserver1,52271,C.34113802,1,1,45,75.24,0,779,,,,,41.0,coretemp_pkg,,
2026-06-05T12:59:57+00:00,gpuserver1,52271,C.34113802,1,1,42,24.51,0,779,,,,,39.0,coretemp_pkg,,
2026-06-05T13:00:27+00:00,gpuserver1,52271,C.34113802,1,1,42,21.12,0,779,,,,,37.0,coretemp_pkg,,
2026-06-05T13:00:57+00:00,gpuserver1,52271,C.34113802,1,1,42,22.37,0,779,,,,,37.0,coretemp_pkg,,
2026-06-05T13:01:28+00:00,gpuserver1,52271,C.34113802,1,1,58,507.73,69,14731,,,,,72.0,coretemp_pkg,,
2026-06-05T13:01:58+00:00,gpuserver1,52271,C.34113802,1,1,46,77.04,0,779,,,,,42.0,coretemp_pkg,,
2026-06-05T13:02:28+00:00,gpuserver1,52271,C.34113802,1,1,65,599.44,100,26541,,,,,75.0,coretemp_pkg,,
2026-06-05T13:02:58+00:00,gpuserver1,52271,C.34113802,1,1,72,600.75,100,26605,,,,,76.0,coretemp_pkg,,
2026-06-05T13:03:28+00:00,gpuserver1,52271,C.34113802,1,1,74,600.05,100,26573,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

