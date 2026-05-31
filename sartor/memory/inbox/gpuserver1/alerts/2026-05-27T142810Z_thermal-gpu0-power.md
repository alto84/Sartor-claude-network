---
type: alert
date: 2026-05-27
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-27T14:28:10+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.51W >580W sustained 3 samples

## Latest sample
```
2026-05-27T14:28:10+00:00,gpuserver1,52271,C.34113802,1,1,74,600.51,100,26513,,,,,72.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-27T14:23:39+00:00,gpuserver1,52271,C.34113802,1,1,44,21.30,0,779,,,,,35.0,coretemp_pkg,,
2026-05-27T14:24:09+00:00,gpuserver1,52271,C.34113802,1,1,61,590.30,99,15083,,,,,74.0,coretemp_pkg,,
2026-05-27T14:24:39+00:00,gpuserver1,52271,C.34113802,1,1,46,75.17,0,779,,,,,39.0,coretemp_pkg,,
2026-05-27T14:25:09+00:00,gpuserver1,52271,C.34113802,1,1,42,24.92,0,779,,,,,37.0,coretemp_pkg,,
2026-05-27T14:25:39+00:00,gpuserver1,52271,C.34113802,1,1,42,21.41,0,779,,,,,36.0,coretemp_pkg,,
2026-05-27T14:26:09+00:00,gpuserver1,52271,C.34113802,1,1,42,21.04,0,779,,,,,36.0,coretemp_pkg,,
2026-05-27T14:26:40+00:00,gpuserver1,52271,C.34113802,1,1,48,97.46,18,29549,,,,,56.0,coretemp_pkg,,
2026-05-27T14:27:10+00:00,gpuserver1,52271,C.34113802,1,1,71,598.35,100,26513,,,,,59.0,coretemp_pkg,,
2026-05-27T14:27:40+00:00,gpuserver1,52271,C.34113802,1,1,74,598.23,100,26609,,,,,62.0,coretemp_pkg,,
2026-05-27T14:28:10+00:00,gpuserver1,52271,C.34113802,1,1,74,600.51,100,26513,,,,,72.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

