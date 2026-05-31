---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T01:29:43+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.78W >580W sustained 3 samples

## Latest sample
```
2026-05-28T01:29:43+00:00,gpuserver1,52271,C.34113802,1,1,73,599.78,100,26635,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T01:25:12+00:00,gpuserver1,52271,C.34113802,1,1,43,22.49,0,779,,,,,36.0,coretemp_pkg,,
2026-05-28T01:25:42+00:00,gpuserver1,52271,C.34113802,1,1,43,22.02,0,779,,,,,35.0,coretemp_pkg,,
2026-05-28T01:26:12+00:00,gpuserver1,52271,C.34113802,1,1,65,588.33,91,14731,,,,,77.0,coretemp_pkg,,
2026-05-28T01:26:42+00:00,gpuserver1,52271,C.34113802,1,1,46,76.11,0,779,,,,,39.0,coretemp_pkg,,
2026-05-28T01:27:13+00:00,gpuserver1,52271,C.34113802,1,1,43,23.56,0,779,,,,,39.0,coretemp_pkg,,
2026-05-28T01:27:43+00:00,gpuserver1,52271,C.34113802,1,1,42,23.68,0,779,,,,,36.0,coretemp_pkg,,
2026-05-28T01:28:13+00:00,gpuserver1,52271,C.34113802,1,1,43,21.36,2,1035,,,,,90.0,coretemp_pkg,,
2026-05-28T01:28:43+00:00,gpuserver1,52271,C.34113802,1,1,67,600.13,100,26603,,,,,72.0,coretemp_pkg,,
2026-05-28T01:29:13+00:00,gpuserver1,52271,C.34113802,1,1,69,600.30,100,26603,,,,,70.0,coretemp_pkg,,
2026-05-28T01:29:43+00:00,gpuserver1,52271,C.34113802,1,1,73,599.78,100,26635,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

