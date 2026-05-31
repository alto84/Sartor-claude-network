---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T00:25:20+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.05W >580W sustained 3 samples

## Latest sample
```
2026-05-28T00:25:19+00:00,gpuserver1,52271,C.34113802,1,1,74,599.05,100,25413,,,,,73.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T00:20:48+00:00,gpuserver1,52271,C.34113802,1,1,42,21.72,0,803,,,,,39.0,coretemp_pkg,,
2026-05-28T00:21:18+00:00,gpuserver1,52271,C.34113802,1,1,46,76.36,0,803,,,,,41.0,coretemp_pkg,,
2026-05-28T00:21:49+00:00,gpuserver1,52271,C.34113802,1,1,42,23.68,0,803,,,,,39.0,coretemp_pkg,,
2026-05-28T00:22:19+00:00,gpuserver1,52271,C.34113802,1,1,49,104.34,0,13795,,,,,62.0,coretemp_pkg,,
2026-05-28T00:22:49+00:00,gpuserver1,52271,C.34113802,1,1,44,55.54,0,803,,,,,39.0,coretemp_pkg,,
2026-05-28T00:23:19+00:00,gpuserver1,52271,C.34113802,1,1,48,103.11,0,13251,,,,,62.0,coretemp_pkg,,
2026-05-28T00:23:49+00:00,gpuserver1,52271,C.34113802,1,1,48,210.72,40,13219,,,,,59.0,coretemp_pkg,,
2026-05-28T00:24:19+00:00,gpuserver1,52271,C.34113802,1,1,71,602.20,100,25381,,,,,73.0,coretemp_pkg,,
2026-05-28T00:24:49+00:00,gpuserver1,52271,C.34113802,1,1,73,599.90,100,25413,,,,,70.0,coretemp_pkg,,
2026-05-28T00:25:19+00:00,gpuserver1,52271,C.34113802,1,1,74,599.05,100,25413,,,,,73.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

