---
type: alert
date: 2026-06-01
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-01T20:16:22+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.27W >580W sustained 3 samples

## Latest sample
```
2026-06-01T20:16:22+00:00,gpuserver1,52271,C.34113802,1,1,78,600.27,100,27277,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-01T20:11:51+00:00,gpuserver1,52271,C.34113802,1,1,46,75.21,0,9611,,,,,44.0,coretemp_pkg,,
2026-06-01T20:12:21+00:00,gpuserver1,52271,C.34113802,1,1,48,80.79,37,1323,,,,,62.0,coretemp_pkg,,
2026-06-01T20:12:51+00:00,gpuserver1,52271,C.34113802,1,1,56,317.86,100,12683,,,,,77.0,coretemp_pkg,,
2026-06-01T20:13:21+00:00,gpuserver1,52271,C.34113802,1,1,67,593.67,90,14731,,,,,72.0,coretemp_pkg,,
2026-06-01T20:13:51+00:00,gpuserver1,52271,C.34113802,1,1,47,76.22,0,779,,,,,45.0,coretemp_pkg,,
2026-06-01T20:14:21+00:00,gpuserver1,52271,C.34113802,1,1,49,80.38,0,13323,,,,,71.0,coretemp_pkg,,
2026-06-01T20:14:51+00:00,gpuserver1,52271,C.34113802,1,1,52,162.14,43,10091,,,,,60.0,coretemp_pkg,,
2026-06-01T20:15:21+00:00,gpuserver1,52271,C.34113802,1,1,71,600.07,100,27245,,,,,75.0,coretemp_pkg,,
2026-06-01T20:15:51+00:00,gpuserver1,52271,C.34113802,1,1,73,600.87,100,27245,,,,,75.0,coretemp_pkg,,
2026-06-01T20:16:22+00:00,gpuserver1,52271,C.34113802,1,1,78,600.27,100,27277,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

