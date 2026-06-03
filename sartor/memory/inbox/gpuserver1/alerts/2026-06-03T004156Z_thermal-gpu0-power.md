---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T00:41:56+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.01W >580W sustained 3 samples

## Latest sample
```
2026-06-03T00:41:56+00:00,gpuserver1,52271,C.34113802,1,1,75,600.01,100,26733,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T00:37:24+00:00,gpuserver1,52271,C.34113802,1,1,42,21.01,0,779,,,,,37.0,coretemp_pkg,,
2026-06-03T00:37:55+00:00,gpuserver1,52271,C.34113802,1,1,42,21.39,0,779,,,,,36.0,coretemp_pkg,,
2026-06-03T00:38:25+00:00,gpuserver1,52271,C.34113802,1,1,62,491.30,90,14731,,,,,60.0,coretemp_pkg,,
2026-06-03T00:38:55+00:00,gpuserver1,52271,C.34113802,1,1,45,75.52,0,779,,,,,46.0,coretemp_pkg,,
2026-06-03T00:39:25+00:00,gpuserver1,52271,C.34113802,1,1,47,77.18,18,2091,,,,,50.0,coretemp_pkg,,
2026-06-03T00:39:55+00:00,gpuserver1,52271,C.34113802,1,1,48,76.83,0,12683,,,,,67.0,coretemp_pkg,,
2026-06-03T00:40:25+00:00,gpuserver1,52271,C.34113802,1,1,45,32.65,0,779,,,,,40.0,coretemp_pkg,,
2026-06-03T00:40:56+00:00,gpuserver1,52271,C.34113802,1,1,67,598.58,100,26637,,,,,74.0,coretemp_pkg,,
2026-06-03T00:41:26+00:00,gpuserver1,52271,C.34113802,1,1,74,599.72,100,26765,,,,,74.0,coretemp_pkg,,
2026-06-03T00:41:56+00:00,gpuserver1,52271,C.34113802,1,1,75,600.01,100,26733,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

