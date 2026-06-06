---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T20:06:31+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.05W >580W sustained 3 samples

## Latest sample
```
2026-06-05T20:06:31+00:00,gpuserver1,52271,C.34113802,1,1,75,600.05,100,26573,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T20:01:59+00:00,gpuserver1,52271,C.34113802,1,1,64,535.26,90,14731,,,,,71.0,coretemp_pkg,,
2026-06-05T20:02:29+00:00,gpuserver1,52271,C.34113802,1,1,46,76.54,0,779,,,,,42.0,coretemp_pkg,,
2026-06-05T20:03:00+00:00,gpuserver1,52271,C.34113802,1,1,43,26.02,0,779,,,,,41.0,coretemp_pkg,,
2026-06-05T20:03:30+00:00,gpuserver1,52271,C.34113802,1,1,42,21.58,0,779,,,,,41.0,coretemp_pkg,,
2026-06-05T20:04:00+00:00,gpuserver1,52271,C.34113802,1,1,42,21.39,0,779,,,,,40.0,coretemp_pkg,,
2026-06-05T20:04:30+00:00,gpuserver1,52271,C.34113802,1,1,42,21.23,0,779,,,,,39.0,coretemp_pkg,,
2026-06-05T20:05:00+00:00,gpuserver1,52271,C.34113802,1,1,43,22.20,0,779,,,,,40.0,coretemp_pkg,,
2026-06-05T20:05:31+00:00,gpuserver1,52271,C.34113802,1,1,61,599.26,100,26541,,,,,70.0,coretemp_pkg,,
2026-06-05T20:06:01+00:00,gpuserver1,52271,C.34113802,1,1,69,599.98,100,26605,,,,,74.0,coretemp_pkg,,
2026-06-05T20:06:31+00:00,gpuserver1,52271,C.34113802,1,1,75,600.05,100,26573,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

