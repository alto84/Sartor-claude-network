---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T17:14:36+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.03W >580W sustained 3 samples

## Latest sample
```
2026-06-07T17:14:35+00:00,gpuserver1,52271,C.34113802,1,1,76,598.03,100,26537,,,,,73.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T17:10:04+00:00,gpuserver1,52271,C.34113802,1,1,63,252.55,90,12067,,,,,74.0,coretemp_pkg,,
2026-06-07T17:10:34+00:00,gpuserver1,52271,C.34113802,1,1,46,75.71,0,803,,,,,40.0,coretemp_pkg,,
2026-06-07T17:11:04+00:00,gpuserver1,52271,C.34113802,1,1,42,22.25,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T17:11:35+00:00,gpuserver1,52271,C.34113802,1,1,42,19.82,0,803,,,,,37.0,coretemp_pkg,,
2026-06-07T17:12:05+00:00,gpuserver1,52271,C.34113802,1,1,63,513.32,81,14755,,,,,68.0,coretemp_pkg,,
2026-06-07T17:12:35+00:00,gpuserver1,52271,C.34113802,1,1,46,74.70,0,803,,,,,41.0,coretemp_pkg,,
2026-06-07T17:13:05+00:00,gpuserver1,52271,C.34113802,1,1,42,22.89,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T17:13:35+00:00,gpuserver1,52271,C.34113802,1,1,67,598.38,100,26537,,,,,68.0,coretemp_pkg,,
2026-06-07T17:14:05+00:00,gpuserver1,52271,C.34113802,1,1,73,598.29,100,26665,,,,,73.0,coretemp_pkg,,
2026-06-07T17:14:35+00:00,gpuserver1,52271,C.34113802,1,1,76,598.03,100,26537,,,,,73.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

