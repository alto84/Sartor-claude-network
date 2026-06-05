---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T14:41:04+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.16W >580W sustained 3 samples

## Latest sample
```
2026-06-05T14:41:04+00:00,gpuserver1,52271,C.34113802,1,1,76,600.16,100,26661,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T14:36:32+00:00,gpuserver1,52271,C.34113802,1,1,42,20.51,0,803,,,,,39.0,coretemp_pkg,,
2026-06-05T14:37:03+00:00,gpuserver1,52271,C.34113802,1,1,42,20.97,0,803,,,,,51.0,coretemp_pkg,,
2026-06-05T14:37:33+00:00,gpuserver1,52271,C.34113802,1,1,42,21.82,0,803,,,,,37.0,coretemp_pkg,,
2026-06-05T14:38:03+00:00,gpuserver1,52271,C.34113802,1,1,42,21.10,0,803,,,,,39.0,coretemp_pkg,,
2026-06-05T14:38:33+00:00,gpuserver1,52271,C.34113802,1,1,43,21.60,0,803,,,,,36.0,coretemp_pkg,,
2026-06-05T14:39:04+00:00,gpuserver1,52271,C.34113802,1,1,43,21.65,0,803,,,,,36.0,coretemp_pkg,,
2026-06-05T14:39:34+00:00,gpuserver1,52271,C.34113802,1,1,43,21.40,0,803,,,,,35.0,coretemp_pkg,,
2026-06-05T14:40:04+00:00,gpuserver1,52271,C.34113802,1,1,70,600.09,100,26629,,,,,75.0,coretemp_pkg,,
2026-06-05T14:40:34+00:00,gpuserver1,52271,C.34113802,1,1,74,600.59,100,26629,,,,,77.0,coretemp_pkg,,
2026-06-05T14:41:04+00:00,gpuserver1,52271,C.34113802,1,1,76,600.16,100,26661,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

