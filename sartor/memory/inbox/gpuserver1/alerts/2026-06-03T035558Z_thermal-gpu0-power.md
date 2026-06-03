---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T03:55:58+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.85W >580W sustained 3 samples

## Latest sample
```
2026-06-03T03:55:58+00:00,gpuserver1,52271,C.34113802,1,1,73,599.85,100,26571,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T03:51:26+00:00,gpuserver1,52271,C.34113802,1,1,43,21.96,0,779,,,,,39.0,coretemp_pkg,,
2026-06-03T03:51:56+00:00,gpuserver1,52271,C.34113802,1,1,43,21.31,0,779,,,,,37.0,coretemp_pkg,,
2026-06-03T03:52:27+00:00,gpuserver1,52271,C.34113802,1,1,43,21.98,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T03:52:57+00:00,gpuserver1,52271,C.34113802,1,1,43,21.11,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T03:53:27+00:00,gpuserver1,52271,C.34113802,1,1,43,21.60,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T03:53:57+00:00,gpuserver1,52271,C.34113802,1,1,43,21.31,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T03:54:28+00:00,gpuserver1,52271,C.34113802,1,1,43,21.55,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T03:54:58+00:00,gpuserver1,52271,C.34113802,1,1,63,602.64,100,26539,,,,,66.0,coretemp_pkg,,
2026-06-03T03:55:28+00:00,gpuserver1,52271,C.34113802,1,1,69,600.30,100,26603,,,,,70.0,coretemp_pkg,,
2026-06-03T03:55:58+00:00,gpuserver1,52271,C.34113802,1,1,73,599.85,100,26571,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

