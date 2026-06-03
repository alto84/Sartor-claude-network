---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T01:13:35+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.97W >580W sustained 3 samples

## Latest sample
```
2026-06-03T01:13:35+00:00,gpuserver1,52271,C.34113802,1,1,75,599.97,100,26789,,,,,74.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T01:09:04+00:00,gpuserver1,52271,C.34113802,1,1,42,20.72,0,803,,,,,40.0,coretemp_pkg,,
2026-06-03T01:09:34+00:00,gpuserver1,52271,C.34113802,1,1,47,76.40,0,11555,,,,,68.0,coretemp_pkg,,
2026-06-03T01:10:04+00:00,gpuserver1,52271,C.34113802,1,1,44,44.86,0,803,,,,,40.0,coretemp_pkg,,
2026-06-03T01:10:34+00:00,gpuserver1,52271,C.34113802,1,1,42,21.64,0,803,,,,,40.0,coretemp_pkg,,
2026-06-03T01:11:05+00:00,gpuserver1,52271,C.34113802,1,1,42,20.73,0,803,,,,,40.0,coretemp_pkg,,
2026-06-03T01:11:35+00:00,gpuserver1,52271,C.34113802,1,1,42,20.62,0,803,,,,,39.0,coretemp_pkg,,
2026-06-03T01:12:05+00:00,gpuserver1,52271,C.34113802,1,1,52,258.36,73,14403,,,,,60.0,coretemp_pkg,,
2026-06-03T01:12:35+00:00,gpuserver1,52271,C.34113802,1,1,73,599.80,100,26789,,,,,72.0,coretemp_pkg,,
2026-06-03T01:13:05+00:00,gpuserver1,52271,C.34113802,1,1,75,597.53,100,26725,,,,,76.0,coretemp_pkg,,
2026-06-03T01:13:35+00:00,gpuserver1,52271,C.34113802,1,1,75,599.97,100,26789,,,,,74.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

