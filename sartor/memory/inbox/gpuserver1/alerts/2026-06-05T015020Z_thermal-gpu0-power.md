---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T01:50:20+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.04W >580W sustained 3 samples

## Latest sample
```
2026-06-05T01:50:20+00:00,gpuserver1,52271,C.34113802,1,1,71,600.04,100,26571,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T01:45:49+00:00,gpuserver1,52271,C.34113802,1,1,42,23.10,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T01:46:19+00:00,gpuserver1,52271,C.34113802,1,1,42,20.52,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T01:46:49+00:00,gpuserver1,52271,C.34113802,1,1,43,21.78,0,777,,,,,37.0,coretemp_pkg,,
2026-06-05T01:47:19+00:00,gpuserver1,52271,C.34113802,1,1,43,21.52,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T01:47:49+00:00,gpuserver1,52271,C.34113802,1,1,47,76.31,0,9609,,,,,41.0,coretemp_pkg,,
2026-06-05T01:48:20+00:00,gpuserver1,52271,C.34113802,1,1,43,23.30,0,777,,,,,41.0,coretemp_pkg,,
2026-06-05T01:48:50+00:00,gpuserver1,52271,C.34113802,1,1,46,76.37,0,777,,,,,45.0,coretemp_pkg,,
2026-06-05T01:49:20+00:00,gpuserver1,52271,C.34113802,1,1,60,599.79,100,26539,,,,,75.0,coretemp_pkg,,
2026-06-05T01:49:50+00:00,gpuserver1,52271,C.34113802,1,1,70,600.05,100,26603,,,,,80.0,coretemp_pkg,,
2026-06-05T01:50:20+00:00,gpuserver1,52271,C.34113802,1,1,71,600.04,100,26571,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

