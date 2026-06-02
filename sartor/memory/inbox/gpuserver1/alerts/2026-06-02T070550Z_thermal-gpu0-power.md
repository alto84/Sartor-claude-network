---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T07:05:50+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.71W >580W sustained 3 samples

## Latest sample
```
2026-06-02T07:05:50+00:00,gpuserver1,52271,C.34113802,1,1,74,599.71,100,26595,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T07:01:19+00:00,gpuserver1,52271,C.34113802,1,1,45,76.28,0,9633,,,,,44.0,coretemp_pkg,,
2026-06-02T07:01:49+00:00,gpuserver1,52271,C.34113802,1,1,47,76.98,0,12385,,,,,68.0,coretemp_pkg,,
2026-06-02T07:02:19+00:00,gpuserver1,52271,C.34113802,1,1,66,357.71,95,11617,,,,,80.0,coretemp_pkg,,
2026-06-02T07:02:49+00:00,gpuserver1,52271,C.34113802,1,1,46,75.95,0,801,,,,,44.0,coretemp_pkg,,
2026-06-02T07:03:19+00:00,gpuserver1,52271,C.34113802,1,1,55,532.08,40,13121,,,,,77.0,coretemp_pkg,,
2026-06-02T07:03:49+00:00,gpuserver1,52271,C.34113802,1,1,45,75.12,0,801,,,,,44.0,coretemp_pkg,,
2026-06-02T07:04:20+00:00,gpuserver1,52271,C.34113802,1,1,41,21.43,0,801,,,,,42.0,coretemp_pkg,,
2026-06-02T07:04:50+00:00,gpuserver1,52271,C.34113802,1,1,67,599.30,100,26563,,,,,71.0,coretemp_pkg,,
2026-06-02T07:05:20+00:00,gpuserver1,52271,C.34113802,1,1,73,598.91,100,26627,,,,,67.0,coretemp_pkg,,
2026-06-02T07:05:50+00:00,gpuserver1,52271,C.34113802,1,1,74,599.71,100,26595,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

