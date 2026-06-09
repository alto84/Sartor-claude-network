---
type: alert
date: 2026-06-08
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-08T20:10:17+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.00W >580W sustained 3 samples

## Latest sample
```
2026-06-08T20:10:17+00:00,gpuserver1,52271,C.34113802,1,1,74,600.00,100,26595,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-08T20:05:46+00:00,gpuserver1,52271,C.34113802,1,1,56,104.88,0,15929,,,,,76.0,coretemp_pkg,,
2026-06-08T20:06:16+00:00,gpuserver1,52271,C.34113802,1,1,53,104.90,72,17821,,,,,81.0,coretemp_pkg,,
2026-06-08T20:06:46+00:00,gpuserver1,52271,C.34113802,1,1,48,78.63,0,521,,,,,66.0,coretemp_pkg,,
2026-06-08T20:07:16+00:00,gpuserver1,52271,C.34113802,1,1,45,24.17,0,521,,,,,45.0,coretemp_pkg,,
2026-06-08T20:07:46+00:00,gpuserver1,52271,C.34113802,1,1,43,24.66,0,521,,,,,44.0,coretemp_pkg,,
2026-06-08T20:08:17+00:00,gpuserver1,52271,C.34113802,1,1,61,555.76,90,13857,,,,,74.0,coretemp_pkg,,
2026-06-08T20:08:47+00:00,gpuserver1,52271,C.34113802,1,1,45,33.56,0,801,,,,,44.0,coretemp_pkg,,
2026-06-08T20:09:17+00:00,gpuserver1,52271,C.34113802,1,1,69,598.60,100,26563,,,,,79.0,coretemp_pkg,,
2026-06-08T20:09:47+00:00,gpuserver1,52271,C.34113802,1,1,72,599.84,100,26627,,,,,75.0,coretemp_pkg,,
2026-06-08T20:10:17+00:00,gpuserver1,52271,C.34113802,1,1,74,600.00,100,26595,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

