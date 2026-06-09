---
type: alert
date: 2026-06-09
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-09T02:01:28+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.61W >580W sustained 3 samples

## Latest sample
```
2026-06-09T02:01:28+00:00,gpuserver1,52271,C.34113802,1,1,70,599.61,100,26597,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-09T01:56:57+00:00,gpuserver1,52271,C.34113802,1,1,45,21.17,0,803,,,,,35.0,coretemp_pkg,,
2026-06-09T01:57:27+00:00,gpuserver1,52271,C.34113802,1,1,45,22.46,0,803,,,,,35.0,coretemp_pkg,,
2026-06-09T01:57:57+00:00,gpuserver1,52271,C.34113802,1,1,45,20.81,0,803,,,,,54.0,coretemp_pkg,,
2026-06-09T01:58:27+00:00,gpuserver1,52271,C.34113802,1,1,45,21.17,0,803,,,,,35.0,coretemp_pkg,,
2026-06-09T01:58:57+00:00,gpuserver1,52271,C.34113802,1,1,45,21.35,0,803,,,,,35.0,coretemp_pkg,,
2026-06-09T01:59:28+00:00,gpuserver1,52271,C.34113802,1,1,65,511.36,79,15107,,,,,65.0,coretemp_pkg,,
2026-06-09T01:59:58+00:00,gpuserver1,52271,C.34113802,1,1,47,76.69,0,803,,,,,40.0,coretemp_pkg,,
2026-06-09T02:00:28+00:00,gpuserver1,52271,C.34113802,1,1,66,600.17,100,26565,,,,,70.0,coretemp_pkg,,
2026-06-09T02:00:58+00:00,gpuserver1,52271,C.34113802,1,1,71,599.54,100,26629,,,,,76.0,coretemp_pkg,,
2026-06-09T02:01:28+00:00,gpuserver1,52271,C.34113802,1,1,70,599.61,100,26597,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

