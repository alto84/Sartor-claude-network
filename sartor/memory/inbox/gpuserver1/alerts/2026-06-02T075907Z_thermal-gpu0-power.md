---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T07:59:07+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.22W >580W sustained 3 samples

## Latest sample
```
2026-06-02T07:59:07+00:00,gpuserver1,52271,C.34113802,1,1,75,600.22,100,26757,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T07:54:36+00:00,gpuserver1,52271,C.34113802,1,1,46,74.36,0,803,,,,,41.0,coretemp_pkg,,
2026-06-02T07:55:06+00:00,gpuserver1,52271,C.34113802,1,1,50,366.83,0,12579,,,,,72.0,coretemp_pkg,,
2026-06-02T07:55:36+00:00,gpuserver1,52271,C.34113802,1,1,45,74.51,0,803,,,,,41.0,coretemp_pkg,,
2026-06-02T07:56:06+00:00,gpuserver1,52271,C.34113802,1,1,41,22.18,0,803,,,,,39.0,coretemp_pkg,,
2026-06-02T07:56:37+00:00,gpuserver1,52271,C.34113802,1,1,42,20.78,0,803,,,,,39.0,coretemp_pkg,,
2026-06-02T07:57:07+00:00,gpuserver1,52271,C.34113802,1,1,42,20.51,0,803,,,,,37.0,coretemp_pkg,,
2026-06-02T07:57:37+00:00,gpuserver1,52271,C.34113802,1,1,43,42.35,0,1283,,,,,54.0,coretemp_pkg,,
2026-06-02T07:58:07+00:00,gpuserver1,52271,C.34113802,1,1,66,600.85,100,26661,,,,,79.0,coretemp_pkg,,
2026-06-02T07:58:37+00:00,gpuserver1,52271,C.34113802,1,1,73,599.40,100,26789,,,,,70.0,coretemp_pkg,,
2026-06-02T07:59:07+00:00,gpuserver1,52271,C.34113802,1,1,75,600.22,100,26757,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

