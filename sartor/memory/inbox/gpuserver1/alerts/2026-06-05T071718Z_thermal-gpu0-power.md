---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T07:17:18+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.05W >580W sustained 3 samples

## Latest sample
```
2026-06-05T07:17:18+00:00,gpuserver1,52271,C.34113802,1,1,74,600.05,100,26635,,,,,86.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T07:12:46+00:00,gpuserver1,52271,C.34113802,1,1,42,23.43,0,777,,,,,44.0,coretemp_pkg,,
2026-06-05T07:13:16+00:00,gpuserver1,52271,C.34113802,1,1,42,23.14,0,777,,,,,41.0,coretemp_pkg,,
2026-06-05T07:13:46+00:00,gpuserver1,52271,C.34113802,1,1,42,21.30,0,777,,,,,40.0,coretemp_pkg,,
2026-06-05T07:14:17+00:00,gpuserver1,52271,C.34113802,1,1,43,21.57,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T07:14:47+00:00,gpuserver1,52271,C.34113802,1,1,43,21.32,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T07:15:17+00:00,gpuserver1,52271,C.34113802,1,1,43,23.77,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T07:15:47+00:00,gpuserver1,52271,C.34113802,1,1,45,79.16,11,5001,,,,,42.0,coretemp_pkg,,
2026-06-05T07:16:17+00:00,gpuserver1,52271,C.34113802,1,1,72,599.49,100,26603,,,,,81.0,coretemp_pkg,,
2026-06-05T07:16:47+00:00,gpuserver1,52271,C.34113802,1,1,75,598.99,100,26603,,,,,85.0,coretemp_pkg,,
2026-06-05T07:17:18+00:00,gpuserver1,52271,C.34113802,1,1,74,600.05,100,26635,,,,,86.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

