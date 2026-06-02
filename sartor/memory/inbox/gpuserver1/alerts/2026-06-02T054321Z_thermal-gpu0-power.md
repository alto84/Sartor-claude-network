---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T05:43:21+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.53W >580W sustained 3 samples

## Latest sample
```
2026-06-02T05:43:21+00:00,gpuserver1,52271,C.34113802,1,1,75,598.53,100,26789,,,,,71.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T05:38:50+00:00,gpuserver1,52271,C.34113802,1,1,59,569.37,94,8995,,,,,75.0,coretemp_pkg,,
2026-06-02T05:39:20+00:00,gpuserver1,52271,C.34113802,1,1,46,75.81,0,803,,,,,41.0,coretemp_pkg,,
2026-06-02T05:39:50+00:00,gpuserver1,52271,C.34113802,1,1,42,22.75,0,803,,,,,39.0,coretemp_pkg,,
2026-06-02T05:40:20+00:00,gpuserver1,52271,C.34113802,1,1,41,20.64,0,803,,,,,39.0,coretemp_pkg,,
2026-06-02T05:40:51+00:00,gpuserver1,52271,C.34113802,1,1,42,20.40,0,803,,,,,36.0,coretemp_pkg,,
2026-06-02T05:41:21+00:00,gpuserver1,52271,C.34113802,1,1,42,21.68,0,803,,,,,36.0,coretemp_pkg,,
2026-06-02T05:41:51+00:00,gpuserver1,52271,C.34113802,1,1,42,20.73,1,835,,,,,43.0,coretemp_pkg,,
2026-06-02T05:42:21+00:00,gpuserver1,52271,C.34113802,1,1,64,601.96,100,26661,,,,,66.0,coretemp_pkg,,
2026-06-02T05:42:51+00:00,gpuserver1,52271,C.34113802,1,1,69,599.95,100,26789,,,,,68.0,coretemp_pkg,,
2026-06-02T05:43:21+00:00,gpuserver1,52271,C.34113802,1,1,75,598.53,100,26789,,,,,71.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

