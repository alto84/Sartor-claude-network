---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T00:17:32+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.49W >580W sustained 3 samples

## Latest sample
```
2026-06-04T00:17:32+00:00,gpuserver1,52271,C.34113802,1,1,71,602.49,100,26635,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T00:13:01+00:00,gpuserver1,52271,C.34113802,1,1,46,75.04,0,777,,,,,58.0,coretemp_pkg,,
2026-06-04T00:13:31+00:00,gpuserver1,52271,C.34113802,1,1,42,25.60,0,777,,,,,41.0,coretemp_pkg,,
2026-06-04T00:14:02+00:00,gpuserver1,52271,C.34113802,1,1,43,21.72,4,2921,,,,,56.0,coretemp_pkg,,
2026-06-04T00:14:32+00:00,gpuserver1,52271,C.34113802,1,1,46,76.87,0,9611,,,,,44.0,coretemp_pkg,,
2026-06-04T00:15:02+00:00,gpuserver1,52271,C.34113802,1,1,48,77.96,0,11339,,,,,66.0,coretemp_pkg,,
2026-06-04T00:15:32+00:00,gpuserver1,52271,C.34113802,1,1,44,24.66,0,779,,,,,41.0,coretemp_pkg,,
2026-06-04T00:16:02+00:00,gpuserver1,52271,C.34113802,1,1,43,85.68,17,16939,,,,,61.0,coretemp_pkg,,
2026-06-04T00:16:32+00:00,gpuserver1,52271,C.34113802,1,1,71,599.69,100,26603,,,,,69.0,coretemp_pkg,,
2026-06-04T00:17:02+00:00,gpuserver1,52271,C.34113802,1,1,75,600.01,100,26603,,,,,71.0,coretemp_pkg,,
2026-06-04T00:17:32+00:00,gpuserver1,52271,C.34113802,1,1,71,602.49,100,26635,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

