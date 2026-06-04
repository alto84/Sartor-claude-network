---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T17:44:19+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.04W >580W sustained 3 samples

## Latest sample
```
2026-06-04T17:44:19+00:00,gpuserver1,52271,C.34113802,1,1,71,600.04,100,26571,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T17:39:47+00:00,gpuserver1,52271,C.34113802,1,1,42,20.05,0,779,,,,,39.0,coretemp_pkg,,
2026-06-04T17:40:17+00:00,gpuserver1,52271,C.34113802,1,1,42,22.31,0,779,,,,,39.0,coretemp_pkg,,
2026-06-04T17:40:48+00:00,gpuserver1,52271,C.34113802,1,1,42,20.81,0,779,,,,,62.0,coretemp_pkg,,
2026-06-04T17:41:18+00:00,gpuserver1,52271,C.34113802,1,1,42,20.08,0,779,,,,,36.0,coretemp_pkg,,
2026-06-04T17:41:48+00:00,gpuserver1,52271,C.34113802,1,1,42,20.68,0,779,,,,,36.0,coretemp_pkg,,
2026-06-04T17:42:18+00:00,gpuserver1,52271,C.34113802,1,1,43,20.93,0,779,,,,,36.0,coretemp_pkg,,
2026-06-04T17:42:48+00:00,gpuserver1,52271,C.34113802,1,1,47,74.97,0,13067,,,,,65.0,coretemp_pkg,,
2026-06-04T17:43:18+00:00,gpuserver1,52271,C.34113802,1,1,64,599.68,100,26539,,,,,75.0,coretemp_pkg,,
2026-06-04T17:43:48+00:00,gpuserver1,52271,C.34113802,1,1,72,600.27,100,26603,,,,,76.0,coretemp_pkg,,
2026-06-04T17:44:19+00:00,gpuserver1,52271,C.34113802,1,1,71,600.04,100,26571,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

