---
type: alert
date: 2026-06-01
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-01T04:42:35+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.34W >580W sustained 3 samples

## Latest sample
```
2026-06-01T04:42:35+00:00,gpuserver1,52271,C.34113802,1,1,76,602.34,100,26673,,,,,72.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-01T04:38:04+00:00,gpuserver1,52271,C.34113802,1,1,43,21.92,0,779,,,,,35.0,coretemp_pkg,,
2026-06-01T04:38:34+00:00,gpuserver1,52271,C.34113802,1,1,58,483.07,99,13963,,,,,77.0,coretemp_pkg,,
2026-06-01T04:39:04+00:00,gpuserver1,52271,C.34113802,1,1,45,76.00,0,779,,,,,39.0,coretemp_pkg,,
2026-06-01T04:39:34+00:00,gpuserver1,52271,C.34113802,1,1,42,23.72,0,779,,,,,37.0,coretemp_pkg,,
2026-06-01T04:40:05+00:00,gpuserver1,52271,C.34113802,1,1,41,21.00,0,779,,,,,39.0,coretemp_pkg,,
2026-06-01T04:40:35+00:00,gpuserver1,52271,C.34113802,1,1,42,21.20,0,779,,,,,36.0,coretemp_pkg,,
2026-06-01T04:41:05+00:00,gpuserver1,52271,C.34113802,1,1,44,100.04,0,8139,,,,,60.0,coretemp_pkg,,
2026-06-01T04:41:35+00:00,gpuserver1,52271,C.34113802,1,1,69,598.03,100,26545,,,,,66.0,coretemp_pkg,,
2026-06-01T04:42:05+00:00,gpuserver1,52271,C.34113802,1,1,73,598.77,100,26673,,,,,70.0,coretemp_pkg,,
2026-06-01T04:42:35+00:00,gpuserver1,52271,C.34113802,1,1,76,602.34,100,26673,,,,,72.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

