---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T21:54:41+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.00W >580W sustained 3 samples

## Latest sample
```
2026-06-06T21:54:41+00:00,gpuserver1,52271,C.34113802,1,1,78,600.00,100,26597,,,,,87.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T21:50:10+00:00,gpuserver1,52271,C.34113802,1,1,46,74.63,0,803,,,,,44.0,coretemp_pkg,,
2026-06-06T21:50:40+00:00,gpuserver1,52271,C.34113802,1,1,69,602.69,100,26885,,,,,76.0,coretemp_pkg,,
2026-06-06T21:51:10+00:00,gpuserver1,52271,C.34113802,1,1,74,599.11,100,26917,,,,,80.0,coretemp_pkg,,
2026-06-06T21:51:40+00:00,gpuserver1,52271,C.34113802,1,1,72,567.82,100,29935,,,,,82.0,coretemp_pkg,,
2026-06-06T21:52:10+00:00,gpuserver1,52271,C.34113802,1,1,56,119.98,56,32117,,,,,86.0,coretemp_pkg,,
2026-06-06T21:52:40+00:00,gpuserver1,52271,C.34113802,1,1,49,40.26,0,17,,,,,48.0,coretemp_pkg,,
2026-06-06T21:53:11+00:00,gpuserver1,52271,C.34113802,1,1,58,99.96,91,17083,,,,,85.0,coretemp_pkg,,
2026-06-06T21:53:41+00:00,gpuserver1,52271,C.34113802,1,1,73,599.87,100,26597,,,,,85.0,coretemp_pkg,,
2026-06-06T21:54:11+00:00,gpuserver1,52271,C.34113802,1,1,73,600.56,100,26597,,,,,89.0,coretemp_pkg,,
2026-06-06T21:54:41+00:00,gpuserver1,52271,C.34113802,1,1,78,600.00,100,26597,,,,,87.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

