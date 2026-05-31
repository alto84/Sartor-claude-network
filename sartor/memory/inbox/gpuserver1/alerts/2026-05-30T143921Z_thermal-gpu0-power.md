---
type: alert
date: 2026-05-30
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-30T14:39:21+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.39W >580W sustained 3 samples

## Latest sample
```
2026-05-30T14:39:21+00:00,gpuserver1,52271,C.34113802,1,1,74,602.39,100,26661,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-30T14:34:50+00:00,gpuserver1,52271,C.34113802,1,1,42,20.96,0,803,,,,,39.0,coretemp_pkg,,
2026-05-30T14:35:20+00:00,gpuserver1,52271,C.34113802,1,1,42,23.08,0,803,,,,,37.0,coretemp_pkg,,
2026-05-30T14:35:50+00:00,gpuserver1,52271,C.34113802,1,1,42,21.49,0,803,,,,,35.0,coretemp_pkg,,
2026-05-30T14:36:20+00:00,gpuserver1,52271,C.34113802,1,1,42,21.15,0,803,,,,,35.0,coretemp_pkg,,
2026-05-30T14:36:51+00:00,gpuserver1,52271,C.34113802,1,1,42,21.57,0,803,,,,,35.0,coretemp_pkg,,
2026-05-30T14:37:21+00:00,gpuserver1,52271,C.34113802,1,1,43,21.27,0,803,,,,,35.0,coretemp_pkg,,
2026-05-30T14:37:51+00:00,gpuserver1,52271,C.34113802,1,1,44,76.71,0,5699,,,,,62.0,coretemp_pkg,,
2026-05-30T14:38:21+00:00,gpuserver1,52271,C.34113802,1,1,71,600.26,100,26629,,,,,71.0,coretemp_pkg,,
2026-05-30T14:38:51+00:00,gpuserver1,52271,C.34113802,1,1,69,599.82,100,26629,,,,,77.0,coretemp_pkg,,
2026-05-30T14:39:21+00:00,gpuserver1,52271,C.34113802,1,1,74,602.39,100,26661,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

