---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T03:45:10+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.94W >580W sustained 3 samples

## Latest sample
```
2026-06-02T03:45:10+00:00,gpuserver1,52271,C.34113802,1,1,76,599.94,100,26819,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T03:40:39+00:00,gpuserver1,52271,C.34113802,1,1,50,103.85,0,13825,,,,,67.0,coretemp_pkg,,
2026-06-02T03:41:09+00:00,gpuserver1,52271,C.34113802,1,1,44,70.63,0,801,,,,,37.0,coretemp_pkg,,
2026-06-02T03:41:39+00:00,gpuserver1,52271,C.34113802,1,1,41,22.71,0,801,,,,,39.0,coretemp_pkg,,
2026-06-02T03:42:09+00:00,gpuserver1,52271,C.34113802,1,1,42,20.78,0,801,,,,,37.0,coretemp_pkg,,
2026-06-02T03:42:40+00:00,gpuserver1,52271,C.34113802,1,1,42,21.00,0,801,,,,,37.0,coretemp_pkg,,
2026-06-02T03:43:10+00:00,gpuserver1,52271,C.34113802,1,1,42,21.01,0,801,,,,,35.0,coretemp_pkg,,
2026-06-02T03:43:40+00:00,gpuserver1,52271,C.34113802,1,1,58,507.02,100,28103,,,,,66.0,coretemp_pkg,,
2026-06-02T03:44:10+00:00,gpuserver1,52271,C.34113802,1,1,70,600.33,100,26723,,,,,66.0,coretemp_pkg,,
2026-06-02T03:44:40+00:00,gpuserver1,52271,C.34113802,1,1,69,605.64,100,26691,,,,,75.0,coretemp_pkg,,
2026-06-02T03:45:10+00:00,gpuserver1,52271,C.34113802,1,1,76,599.94,100,26819,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

