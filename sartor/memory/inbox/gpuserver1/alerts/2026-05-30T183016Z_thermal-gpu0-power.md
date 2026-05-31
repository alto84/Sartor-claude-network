---
type: alert
date: 2026-05-30
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-30T18:30:16+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.56W >580W sustained 3 samples

## Latest sample
```
2026-05-30T18:30:16+00:00,gpuserver1,52271,C.34113802,1,1,76,598.56,100,26609,,,,,67.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-30T18:25:45+00:00,gpuserver1,52271,C.34113802,1,1,42,20.65,0,779,,,,,36.0,coretemp_pkg,,
2026-05-30T18:26:15+00:00,gpuserver1,52271,C.34113802,1,1,42,21.76,0,779,,,,,36.0,coretemp_pkg,,
2026-05-30T18:26:45+00:00,gpuserver1,52271,C.34113802,1,1,47,77.15,0,13835,,,,,61.0,coretemp_pkg,,
2026-05-30T18:27:15+00:00,gpuserver1,52271,C.34113802,1,1,43,23.70,0,779,,,,,37.0,coretemp_pkg,,
2026-05-30T18:27:45+00:00,gpuserver1,52271,C.34113802,1,1,41,21.27,0,779,,,,,37.0,coretemp_pkg,,
2026-05-30T18:28:16+00:00,gpuserver1,52271,C.34113802,1,1,42,21.33,0,779,,,,,37.0,coretemp_pkg,,
2026-05-30T18:28:46+00:00,gpuserver1,52271,C.34113802,1,1,43,79.54,10,5003,,,,,39.0,coretemp_pkg,,
2026-05-30T18:29:16+00:00,gpuserver1,52271,C.34113802,1,1,69,599.33,100,26481,,,,,75.0,coretemp_pkg,,
2026-05-30T18:29:46+00:00,gpuserver1,52271,C.34113802,1,1,74,603.47,100,26609,,,,,64.0,coretemp_pkg,,
2026-05-30T18:30:16+00:00,gpuserver1,52271,C.34113802,1,1,76,598.56,100,26609,,,,,67.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

