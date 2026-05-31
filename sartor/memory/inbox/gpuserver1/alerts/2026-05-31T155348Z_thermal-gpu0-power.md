---
type: alert
date: 2026-05-31
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-31T15:53:48+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.20W >580W sustained 3 samples

## Latest sample
```
2026-05-31T15:53:47+00:00,gpuserver1,52271,C.34113802,1,1,72,600.20,100,25389,,,,,76.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-31T15:49:16+00:00,gpuserver1,52271,C.34113802,1,1,46,76.19,0,779,,,,,39.0,coretemp_pkg,,
2026-05-31T15:49:46+00:00,gpuserver1,52271,C.34113802,1,1,42,22.62,0,779,,,,,39.0,coretemp_pkg,,
2026-05-31T15:50:16+00:00,gpuserver1,52271,C.34113802,1,1,42,20.92,0,779,,,,,37.0,coretemp_pkg,,
2026-05-31T15:50:47+00:00,gpuserver1,52271,C.34113802,1,1,42,22.77,0,779,,,,,35.0,coretemp_pkg,,
2026-05-31T15:51:17+00:00,gpuserver1,52271,C.34113802,1,1,63,592.67,99,14731,,,,,64.0,coretemp_pkg,,
2026-05-31T15:51:47+00:00,gpuserver1,52271,C.34113802,1,1,45,73.30,0,779,,,,,40.0,coretemp_pkg,,
2026-05-31T15:52:17+00:00,gpuserver1,52271,C.34113802,1,1,41,20.49,0,779,,,,,39.0,coretemp_pkg,,
2026-05-31T15:52:47+00:00,gpuserver1,52271,C.34113802,1,1,67,600.24,100,25357,,,,,67.0,coretemp_pkg,,
2026-05-31T15:53:17+00:00,gpuserver1,52271,C.34113802,1,1,73,601.45,100,25357,,,,,71.0,coretemp_pkg,,
2026-05-31T15:53:47+00:00,gpuserver1,52271,C.34113802,1,1,72,600.20,100,25389,,,,,76.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

