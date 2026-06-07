---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T04:16:50+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 601.12W >580W sustained 3 samples

## Latest sample
```
2026-06-07T04:16:50+00:00,gpuserver1,52271,C.34113802,1,1,76,601.12,100,26573,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T04:12:19+00:00,gpuserver1,52271,C.34113802,1,1,42,18.88,0,779,,,,,39.0,coretemp_pkg,,
2026-06-07T04:12:49+00:00,gpuserver1,52271,C.34113802,1,1,43,19.42,0,779,,,,,37.0,coretemp_pkg,,
2026-06-07T04:13:19+00:00,gpuserver1,52271,C.34113802,1,1,43,19.07,0,779,,,,,57.0,coretemp_pkg,,
2026-06-07T04:13:49+00:00,gpuserver1,52271,C.34113802,1,1,47,74.98,0,9611,,,,,40.0,coretemp_pkg,,
2026-06-07T04:14:19+00:00,gpuserver1,52271,C.34113802,1,1,43,21.58,0,779,,,,,40.0,coretemp_pkg,,
2026-06-07T04:14:50+00:00,gpuserver1,52271,C.34113802,1,1,42,18.76,0,779,,,,,40.0,coretemp_pkg,,
2026-06-07T04:15:20+00:00,gpuserver1,52271,C.34113802,1,1,42,20.73,0,779,,,,,37.0,coretemp_pkg,,
2026-06-07T04:15:50+00:00,gpuserver1,52271,C.34113802,1,1,68,602.43,99,26605,,,,,70.0,coretemp_pkg,,
2026-06-07T04:16:20+00:00,gpuserver1,52271,C.34113802,1,1,73,599.84,100,26605,,,,,81.0,coretemp_pkg,,
2026-06-07T04:16:50+00:00,gpuserver1,52271,C.34113802,1,1,76,601.12,100,26573,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

