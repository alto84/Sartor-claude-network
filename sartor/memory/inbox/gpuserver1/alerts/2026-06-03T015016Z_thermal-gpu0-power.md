---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T01:50:16+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.00W >580W sustained 3 samples

## Latest sample
```
2026-06-03T01:50:16+00:00,gpuserver1,52271,C.34113802,1,1,73,600.00,100,26733,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T01:45:45+00:00,gpuserver1,52271,C.34113802,1,1,45,74.48,0,779,,,,,42.0,coretemp_pkg,,
2026-06-03T01:46:15+00:00,gpuserver1,52271,C.34113802,1,1,64,392.22,88,11627,,,,,75.0,coretemp_pkg,,
2026-06-03T01:46:45+00:00,gpuserver1,52271,C.34113802,1,1,45,74.73,0,779,,,,,44.0,coretemp_pkg,,
2026-06-03T01:47:15+00:00,gpuserver1,52271,C.34113802,1,1,50,196.39,0,11211,,,,,65.0,coretemp_pkg,,
2026-06-03T01:47:45+00:00,gpuserver1,52271,C.34113802,1,1,46,75.01,0,779,,,,,45.0,coretemp_pkg,,
2026-06-03T01:48:16+00:00,gpuserver1,52271,C.34113802,1,1,42,23.28,0,779,,,,,41.0,coretemp_pkg,,
2026-06-03T01:48:46+00:00,gpuserver1,52271,C.34113802,1,1,42,21.40,0,779,,,,,40.0,coretemp_pkg,,
2026-06-03T01:49:16+00:00,gpuserver1,52271,C.34113802,1,1,60,605.05,100,26637,,,,,72.0,coretemp_pkg,,
2026-06-03T01:49:46+00:00,gpuserver1,52271,C.34113802,1,1,73,599.07,100,26765,,,,,75.0,coretemp_pkg,,
2026-06-03T01:50:16+00:00,gpuserver1,52271,C.34113802,1,1,73,600.00,100,26733,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

