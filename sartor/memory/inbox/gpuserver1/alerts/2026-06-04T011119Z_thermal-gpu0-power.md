---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-04T01:11:19+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.59W >580W sustained 3 samples

## Latest sample
```
2026-06-04T01:11:19+00:00,gpuserver1,52271,C.34113802,1,1,78,600.59,100,26727,,,,,89.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-04T01:06:48+00:00,gpuserver1,52271,C.34113802,1,1,50,80.29,0,779,,,,,50.0,coretemp_pkg,,
2026-06-04T01:07:18+00:00,gpuserver1,52271,C.34113802,1,1,72,599.48,100,26859,,,,,86.0,coretemp_pkg,,
2026-06-04T01:07:48+00:00,gpuserver1,52271,C.34113802,1,1,76,599.40,100,26891,,,,,85.0,coretemp_pkg,,
2026-06-04T01:08:18+00:00,gpuserver1,52271,C.34113802,1,1,74,570.59,100,29941,,,,,89.0,coretemp_pkg,,
2026-06-04T01:08:48+00:00,gpuserver1,52271,C.34113802,1,1,67,448.35,90,18491,,,,,85.0,coretemp_pkg,,
2026-06-04T01:09:19+00:00,gpuserver1,52271,C.34113802,1,1,52,81.48,0,14685,,,,,54.0,coretemp_pkg,,
2026-06-04T01:09:49+00:00,gpuserver1,52271,C.34113802,1,1,48,40.79,0,521,,,,,49.0,coretemp_pkg,,
2026-06-04T01:10:19+00:00,gpuserver1,52271,C.34113802,1,1,66,598.72,100,26599,,,,,86.0,coretemp_pkg,,
2026-06-04T01:10:49+00:00,gpuserver1,52271,C.34113802,1,1,72,602.68,100,26727,,,,,82.0,coretemp_pkg,,
2026-06-04T01:11:19+00:00,gpuserver1,52271,C.34113802,1,1,78,600.59,100,26727,,,,,89.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

