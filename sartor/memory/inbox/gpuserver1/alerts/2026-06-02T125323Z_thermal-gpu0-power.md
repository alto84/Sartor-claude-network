---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T12:53:23+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.88W >580W sustained 3 samples

## Latest sample
```
2026-06-02T12:53:23+00:00,gpuserver1,52271,C.34113802,1,1,75,602.88,100,26599,,,,,72.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T12:48:52+00:00,gpuserver1,52271,C.34113802,1,1,42,20.66,0,801,,,,,79.0,coretemp_pkg,,
2026-06-02T12:49:22+00:00,gpuserver1,52271,C.34113802,1,1,45,76.60,16,8961,,,,,58.0,coretemp_pkg,,
2026-06-02T12:49:52+00:00,gpuserver1,52271,C.34113802,1,1,42,23.68,0,801,,,,,50.0,coretemp_pkg,,
2026-06-02T12:50:22+00:00,gpuserver1,52271,C.34113802,1,1,41,22.40,0,801,,,,,38.0,coretemp_pkg,,
2026-06-02T12:50:53+00:00,gpuserver1,52271,C.34113802,1,1,42,20.56,0,801,,,,,35.0,coretemp_pkg,,
2026-06-02T12:51:23+00:00,gpuserver1,52271,C.34113802,1,1,42,20.90,0,801,,,,,36.0,coretemp_pkg,,
2026-06-02T12:51:53+00:00,gpuserver1,52271,C.34113802,1,1,47,77.66,0,12545,,,,,61.0,coretemp_pkg,,
2026-06-02T12:52:23+00:00,gpuserver1,52271,C.34113802,1,1,65,603.47,100,26503,,,,,62.0,coretemp_pkg,,
2026-06-02T12:52:53+00:00,gpuserver1,52271,C.34113802,1,1,70,603.84,100,26599,,,,,70.0,coretemp_pkg,,
2026-06-02T12:53:23+00:00,gpuserver1,52271,C.34113802,1,1,75,602.88,100,26599,,,,,72.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

