---
type: alert
date: 2026-06-10
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-10T07:35:54+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.04W >580W sustained 3 samples

## Latest sample
```
2026-06-10T07:35:54+00:00,gpuserver1,52271,C.34113802,1,1,69,600.04,100,26597,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-10T07:31:23+00:00,gpuserver1,52271,C.34113802,1,1,50,102.73,0,13827,,,,,61.0,coretemp_pkg,,
2026-06-10T07:31:53+00:00,gpuserver1,52271,C.34113802,1,1,44,23.56,0,803,,,,,39.0,coretemp_pkg,,
2026-06-10T07:32:23+00:00,gpuserver1,52271,C.34113802,1,1,42,21.58,0,803,,,,,40.0,coretemp_pkg,,
2026-06-10T07:32:53+00:00,gpuserver1,52271,C.34113802,1,1,42,19.55,0,803,,,,,39.0,coretemp_pkg,,
2026-06-10T07:33:23+00:00,gpuserver1,52271,C.34113802,1,1,48,76.04,0,13827,,,,,66.0,coretemp_pkg,,
2026-06-10T07:33:53+00:00,gpuserver1,52271,C.34113802,1,1,43,22.25,0,803,,,,,40.0,coretemp_pkg,,
2026-06-10T07:34:24+00:00,gpuserver1,52271,C.34113802,1,1,42,20.88,0,803,,,,,41.0,coretemp_pkg,,
2026-06-10T07:34:54+00:00,gpuserver1,52271,C.34113802,1,1,64,599.38,100,26565,,,,,64.0,coretemp_pkg,,
2026-06-10T07:35:24+00:00,gpuserver1,52271,C.34113802,1,1,74,601.38,100,26629,,,,,70.0,coretemp_pkg,,
2026-06-10T07:35:54+00:00,gpuserver1,52271,C.34113802,1,1,69,600.04,100,26597,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

