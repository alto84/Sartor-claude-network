---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T23:02:21+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.69W >580W sustained 3 samples

## Latest sample
```
2026-06-02T23:02:20+00:00,gpuserver1,52271,C.34113802,1,1,74,599.69,100,26595,,,,,74.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T22:57:49+00:00,gpuserver1,52271,C.34113802,1,1,42,21.60,0,801,,,,,39.0,coretemp_pkg,,
2026-06-02T22:58:19+00:00,gpuserver1,52271,C.34113802,1,1,42,22.56,0,801,,,,,40.0,coretemp_pkg,,
2026-06-02T22:58:49+00:00,gpuserver1,52271,C.34113802,1,1,43,21.03,0,801,,,,,39.0,coretemp_pkg,,
2026-06-02T22:59:19+00:00,gpuserver1,52271,C.34113802,1,1,43,21.19,0,801,,,,,37.0,coretemp_pkg,,
2026-06-02T22:59:50+00:00,gpuserver1,52271,C.34113802,1,1,47,76.42,0,9633,,,,,42.0,coretemp_pkg,,
2026-06-02T23:00:20+00:00,gpuserver1,52271,C.34113802,1,1,43,23.09,0,801,,,,,40.0,coretemp_pkg,,
2026-06-02T23:00:50+00:00,gpuserver1,52271,C.34113802,1,1,42,22.83,0,801,,,,,40.0,coretemp_pkg,,
2026-06-02T23:01:20+00:00,gpuserver1,52271,C.34113802,1,1,68,598.07,100,26563,,,,,64.0,coretemp_pkg,,
2026-06-02T23:01:50+00:00,gpuserver1,52271,C.34113802,1,1,73,600.09,100,26627,,,,,69.0,coretemp_pkg,,
2026-06-02T23:02:20+00:00,gpuserver1,52271,C.34113802,1,1,74,599.69,100,26595,,,,,74.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

