---
type: alert
date: 2026-06-08
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-08T08:32:34+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.67W >580W sustained 3 samples

## Latest sample
```
2026-06-08T08:32:34+00:00,gpuserver1,52271,C.34113802,1,1,75,599.67,100,26661,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-08T08:28:02+00:00,gpuserver1,52271,C.34113802,1,1,42,23.53,0,803,,,,,39.0,coretemp_pkg,,
2026-06-08T08:28:32+00:00,gpuserver1,52271,C.34113802,1,1,42,20.09,0,803,,,,,39.0,coretemp_pkg,,
2026-06-08T08:29:03+00:00,gpuserver1,52271,C.34113802,1,1,42,20.00,0,803,,,,,39.0,coretemp_pkg,,
2026-06-08T08:29:33+00:00,gpuserver1,52271,C.34113802,1,1,42,20.32,0,803,,,,,39.0,coretemp_pkg,,
2026-06-08T08:30:03+00:00,gpuserver1,52271,C.34113802,1,1,42,20.61,0,803,,,,,36.0,coretemp_pkg,,
2026-06-08T08:30:33+00:00,gpuserver1,52271,C.34113802,1,1,43,21.98,0,803,,,,,36.0,coretemp_pkg,,
2026-06-08T08:31:03+00:00,gpuserver1,52271,C.34113802,1,1,43,19.79,0,803,,,,,36.0,coretemp_pkg,,
2026-06-08T08:31:34+00:00,gpuserver1,52271,C.34113802,1,1,70,598.46,100,26629,,,,,69.0,coretemp_pkg,,
2026-06-08T08:32:04+00:00,gpuserver1,52271,C.34113802,1,1,74,600.16,100,26629,,,,,71.0,coretemp_pkg,,
2026-06-08T08:32:34+00:00,gpuserver1,52271,C.34113802,1,1,75,599.67,100,26661,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

