---
type: alert
date: 2026-06-01
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-01T17:32:55+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.48W >580W sustained 3 samples

## Latest sample
```
2026-06-01T17:32:55+00:00,gpuserver1,52271,C.34113802,1,1,76,602.48,100,26609,,,,,73.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-01T17:28:24+00:00,gpuserver1,52271,C.34113802,1,1,42,22.86,0,779,,,,,42.0,coretemp_pkg,,
2026-06-01T17:28:54+00:00,gpuserver1,52271,C.34113802,1,1,42,21.75,0,779,,,,,40.0,coretemp_pkg,,
2026-06-01T17:29:24+00:00,gpuserver1,52271,C.34113802,1,1,42,21.20,0,779,,,,,39.0,coretemp_pkg,,
2026-06-01T17:29:54+00:00,gpuserver1,52271,C.34113802,1,1,42,20.78,0,779,,,,,39.0,coretemp_pkg,,
2026-06-01T17:30:24+00:00,gpuserver1,52271,C.34113802,1,1,49,104.13,0,12811,,,,,61.0,coretemp_pkg,,
2026-06-01T17:30:54+00:00,gpuserver1,52271,C.34113802,1,1,45,73.91,0,779,,,,,42.0,coretemp_pkg,,
2026-06-01T17:31:25+00:00,gpuserver1,52271,C.34113802,1,1,41,21.87,0,779,,,,,66.0,coretemp_pkg,,
2026-06-01T17:31:55+00:00,gpuserver1,52271,C.34113802,1,1,67,600.84,100,26513,,,,,62.0,coretemp_pkg,,
2026-06-01T17:32:25+00:00,gpuserver1,52271,C.34113802,1,1,73,602.08,100,26609,,,,,72.0,coretemp_pkg,,
2026-06-01T17:32:55+00:00,gpuserver1,52271,C.34113802,1,1,76,602.48,100,26609,,,,,73.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

