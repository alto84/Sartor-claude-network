---
type: alert
date: 2026-06-01
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-01T08:16:56+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.04W >580W sustained 3 samples

## Latest sample
```
2026-06-01T08:16:56+00:00,gpuserver1,52271,C.34113802,1,1,74,600.04,100,26659,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-01T08:12:25+00:00,gpuserver1,52271,C.34113802,1,1,50,122.10,0,23083,,,,,66.0,coretemp_pkg,,
2026-06-01T08:12:55+00:00,gpuserver1,52271,C.34113802,1,1,46,75.98,0,521,,,,,70.0,coretemp_pkg,,
2026-06-01T08:13:25+00:00,gpuserver1,52271,C.34113802,1,1,43,24.10,0,521,,,,,42.0,coretemp_pkg,,
2026-06-01T08:13:55+00:00,gpuserver1,52271,C.34113802,1,1,42,21.54,0,521,,,,,40.0,coretemp_pkg,,
2026-06-01T08:14:26+00:00,gpuserver1,52271,C.34113802,1,1,42,21.76,0,521,,,,,44.0,coretemp_pkg,,
2026-06-01T08:14:56+00:00,gpuserver1,52271,C.34113802,1,1,55,129.06,41,9503,,,,,69.0,coretemp_pkg,,
2026-06-01T08:15:26+00:00,gpuserver1,52271,C.34113802,1,1,50,99.14,42,8611,,,,,54.0,coretemp_pkg,,
2026-06-01T08:15:56+00:00,gpuserver1,52271,C.34113802,1,1,67,600.05,100,26627,,,,,66.0,coretemp_pkg,,
2026-06-01T08:16:26+00:00,gpuserver1,52271,C.34113802,1,1,76,600.11,100,26627,,,,,69.0,coretemp_pkg,,
2026-06-01T08:16:56+00:00,gpuserver1,52271,C.34113802,1,1,74,600.04,100,26659,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

