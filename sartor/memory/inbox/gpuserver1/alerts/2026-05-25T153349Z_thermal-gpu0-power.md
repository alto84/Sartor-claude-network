---
type: alert
date: 2026-05-25
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-25T15:33:49+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 603.69W >580W sustained 3 samples

## Latest sample
```
2026-05-25T15:33:49+00:00,gpuserver1,52271,C.34113802,1,1,73,603.69,100,26609,,,,,68.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-25T15:29:18+00:00,gpuserver1,52271,C.34113802,1,1,49,360.37,0,14059,,,,,65.0,coretemp_pkg,,
2026-05-25T15:29:48+00:00,gpuserver1,52271,C.34113802,1,1,42,27.19,0,779,,,,,37.0,coretemp_pkg,,
2026-05-25T15:30:18+00:00,gpuserver1,52271,C.34113802,1,1,41,21.33,0,779,,,,,36.0,coretemp_pkg,,
2026-05-25T15:30:48+00:00,gpuserver1,52271,C.34113802,1,1,41,20.80,0,779,,,,,53.0,coretemp_pkg,,
2026-05-25T15:31:18+00:00,gpuserver1,52271,C.34113802,1,1,60,400.56,95,9323,,,,,68.0,coretemp_pkg,,
2026-05-25T15:31:48+00:00,gpuserver1,52271,C.34113802,1,1,45,74.34,0,779,,,,,39.0,coretemp_pkg,,
2026-05-25T15:32:19+00:00,gpuserver1,52271,C.34113802,1,1,41,22.34,0,875,,,,,39.0,coretemp_pkg,,
2026-05-25T15:32:49+00:00,gpuserver1,52271,C.34113802,1,1,68,598.79,100,26481,,,,,68.0,coretemp_pkg,,
2026-05-25T15:33:19+00:00,gpuserver1,52271,C.34113802,1,1,69,600.70,100,26609,,,,,66.0,coretemp_pkg,,
2026-05-25T15:33:49+00:00,gpuserver1,52271,C.34113802,1,1,73,603.69,100,26609,,,,,68.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

