---
type: alert
date: 2026-05-30
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-30T17:25:21+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.63W >580W sustained 3 samples

## Latest sample
```
2026-05-30T17:25:21+00:00,gpuserver1,52271,C.34113802,1,1,77,599.63,100,26697,,,,,72.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-30T17:20:50+00:00,gpuserver1,52271,C.34113802,1,1,42,20.93,0,803,,,,,36.0,coretemp_pkg,,
2026-05-30T17:21:20+00:00,gpuserver1,52271,C.34113802,1,1,42,20.88,0,803,,,,,35.0,coretemp_pkg,,
2026-05-30T17:21:51+00:00,gpuserver1,52271,C.34113802,1,1,42,21.01,0,803,,,,,45.0,coretemp_pkg,,
2026-05-30T17:22:21+00:00,gpuserver1,52271,C.34113802,1,1,61,427.36,84,9347,,,,,62.0,coretemp_pkg,,
2026-05-30T17:22:51+00:00,gpuserver1,52271,C.34113802,1,1,46,76.65,6,8739,,,,,43.0,coretemp_pkg,,
2026-05-30T17:23:21+00:00,gpuserver1,52271,C.34113802,1,1,48,76.64,0,12579,,,,,71.0,coretemp_pkg,,
2026-05-30T17:23:51+00:00,gpuserver1,52271,C.34113802,1,1,45,75.39,43,9699,,,,,61.0,coretemp_pkg,,
2026-05-30T17:24:21+00:00,gpuserver1,52271,C.34113802,1,1,70,599.48,100,26697,,,,,69.0,coretemp_pkg,,
2026-05-30T17:24:51+00:00,gpuserver1,52271,C.34113802,1,1,69,599.80,100,26697,,,,,66.0,coretemp_pkg,,
2026-05-30T17:25:21+00:00,gpuserver1,52271,C.34113802,1,1,77,599.63,100,26697,,,,,72.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

