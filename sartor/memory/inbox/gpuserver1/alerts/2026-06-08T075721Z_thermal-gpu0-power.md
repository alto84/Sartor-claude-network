---
type: alert
date: 2026-06-08
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-08T07:57:21+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.04W >580W sustained 3 samples

## Latest sample
```
2026-06-08T07:57:21+00:00,gpuserver1,52271,C.34113802,1,1,73,602.04,100,26661,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-08T07:52:50+00:00,gpuserver1,52271,C.34113802,1,1,41,20.27,0,803,,,,,41.0,coretemp_pkg,,
2026-06-08T07:53:20+00:00,gpuserver1,52271,C.34113802,1,1,42,19.83,0,803,,,,,39.0,coretemp_pkg,,
2026-06-08T07:53:50+00:00,gpuserver1,52271,C.34113802,1,1,42,19.74,0,803,,,,,39.0,coretemp_pkg,,
2026-06-08T07:54:21+00:00,gpuserver1,52271,C.34113802,1,1,42,20.47,0,803,,,,,39.0,coretemp_pkg,,
2026-06-08T07:54:51+00:00,gpuserver1,52271,C.34113802,1,1,43,22.28,0,803,,,,,39.0,coretemp_pkg,,
2026-06-08T07:55:21+00:00,gpuserver1,52271,C.34113802,1,1,47,75.76,0,9635,,,,,41.0,coretemp_pkg,,
2026-06-08T07:55:51+00:00,gpuserver1,52271,C.34113802,1,1,45,75.82,0,1251,,,,,65.0,coretemp_pkg,,
2026-06-08T07:56:21+00:00,gpuserver1,52271,C.34113802,1,1,69,598.22,100,26629,,,,,75.0,coretemp_pkg,,
2026-06-08T07:56:51+00:00,gpuserver1,52271,C.34113802,1,1,73,600.67,100,26629,,,,,76.0,coretemp_pkg,,
2026-06-08T07:57:21+00:00,gpuserver1,52271,C.34113802,1,1,73,602.04,100,26661,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

