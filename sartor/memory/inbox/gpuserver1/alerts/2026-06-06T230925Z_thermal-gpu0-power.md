---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T23:09:25+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.03W >580W sustained 3 samples

## Latest sample
```
2026-06-06T23:09:25+00:00,gpuserver1,52271,C.34113802,1,1,72,600.03,100,26595,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T23:04:53+00:00,gpuserver1,52271,C.34113802,1,1,43,19.40,0,801,,,,,37.0,coretemp_pkg,,
2026-06-06T23:05:24+00:00,gpuserver1,52271,C.34113802,1,1,43,19.89,0,801,,,,,37.0,coretemp_pkg,,
2026-06-06T23:05:54+00:00,gpuserver1,52271,C.34113802,1,1,43,20.65,0,801,,,,,66.0,coretemp_pkg,,
2026-06-06T23:06:24+00:00,gpuserver1,52271,C.34113802,1,1,47,74.24,0,9633,,,,,42.0,coretemp_pkg,,
2026-06-06T23:06:54+00:00,gpuserver1,52271,C.34113802,1,1,43,22.64,0,801,,,,,44.0,coretemp_pkg,,
2026-06-06T23:07:24+00:00,gpuserver1,52271,C.34113802,1,1,42,19.43,0,801,,,,,40.0,coretemp_pkg,,
2026-06-06T23:07:55+00:00,gpuserver1,52271,C.34113802,1,1,47,74.55,0,14337,,,,,70.0,coretemp_pkg,,
2026-06-06T23:08:25+00:00,gpuserver1,52271,C.34113802,1,1,64,601.34,100,26563,,,,,77.0,coretemp_pkg,,
2026-06-06T23:08:55+00:00,gpuserver1,52271,C.34113802,1,1,70,600.51,100,26627,,,,,76.0,coretemp_pkg,,
2026-06-06T23:09:25+00:00,gpuserver1,52271,C.34113802,1,1,72,600.03,100,26595,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

