---
type: alert
date: 2026-05-30
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-30T05:21:50+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.59W >580W sustained 3 samples

## Latest sample
```
2026-05-30T05:21:50+00:00,gpuserver1,52271,C.34113802,1,1,72,599.59,100,26733,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-30T05:17:18+00:00,gpuserver1,52271,C.34113802,1,1,43,24.96,0,779,,,,,39.0,coretemp_pkg,,
2026-05-30T05:17:49+00:00,gpuserver1,52271,C.34113802,1,1,42,20.53,0,779,,,,,55.0,coretemp_pkg,,
2026-05-30T05:18:19+00:00,gpuserver1,52271,C.34113802,1,1,60,395.28,86,9131,,,,,70.0,coretemp_pkg,,
2026-05-30T05:18:49+00:00,gpuserver1,52271,C.34113802,1,1,46,66.40,2,8619,,,,,64.0,coretemp_pkg,,
2026-05-30T05:19:19+00:00,gpuserver1,52271,C.34113802,1,1,43,23.40,0,779,,,,,40.0,coretemp_pkg,,
2026-05-30T05:19:49+00:00,gpuserver1,52271,C.34113802,1,1,42,23.46,0,779,,,,,39.0,coretemp_pkg,,
2026-05-30T05:20:19+00:00,gpuserver1,52271,C.34113802,1,1,42,21.36,0,779,,,,,55.0,coretemp_pkg,,
2026-05-30T05:20:50+00:00,gpuserver1,52271,C.34113802,1,1,69,600.40,100,26637,,,,,68.0,coretemp_pkg,,
2026-05-30T05:21:20+00:00,gpuserver1,52271,C.34113802,1,1,74,602.71,100,26765,,,,,72.0,coretemp_pkg,,
2026-05-30T05:21:50+00:00,gpuserver1,52271,C.34113802,1,1,72,599.59,100,26733,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

