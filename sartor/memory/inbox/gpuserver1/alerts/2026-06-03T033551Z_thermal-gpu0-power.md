---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T03:35:51+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 601.97W >580W sustained 3 samples

## Latest sample
```
2026-06-03T03:35:51+00:00,gpuserver1,52271,C.34113802,1,1,77,601.97,100,26571,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T03:31:19+00:00,gpuserver1,52271,C.34113802,1,1,43,23.48,0,777,,,,,44.0,coretemp_pkg,,
2026-06-03T03:31:49+00:00,gpuserver1,52271,C.34113802,1,1,42,21.40,0,777,,,,,42.0,coretemp_pkg,,
2026-06-03T03:32:20+00:00,gpuserver1,52271,C.34113802,1,1,43,21.66,0,777,,,,,41.0,coretemp_pkg,,
2026-06-03T03:32:50+00:00,gpuserver1,52271,C.34113802,1,1,43,21.66,0,777,,,,,39.0,coretemp_pkg,,
2026-06-03T03:33:20+00:00,gpuserver1,52271,C.34113802,1,1,43,24.15,0,777,,,,,39.0,coretemp_pkg,,
2026-06-03T03:33:50+00:00,gpuserver1,52271,C.34113802,1,1,43,21.53,0,777,,,,,39.0,coretemp_pkg,,
2026-06-03T03:34:21+00:00,gpuserver1,52271,C.34113802,1,1,48,76.76,0,12777,,,,,68.0,coretemp_pkg,,
2026-06-03T03:34:51+00:00,gpuserver1,52271,C.34113802,1,1,64,599.68,100,26539,,,,,71.0,coretemp_pkg,,
2026-06-03T03:35:21+00:00,gpuserver1,52271,C.34113802,1,1,70,599.99,100,26603,,,,,75.0,coretemp_pkg,,
2026-06-03T03:35:51+00:00,gpuserver1,52271,C.34113802,1,1,77,601.97,100,26571,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

