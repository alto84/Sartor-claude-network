---
type: alert
date: 2026-05-25
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-25T07:55:28+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.71W >580W sustained 3 samples

## Latest sample
```
2026-05-25T07:55:28+00:00,gpuserver1,52271,C.34113802,1,1,72,598.71,100,27111,,,,,68.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-25T07:50:57+00:00,gpuserver1,52271,C.34113802,1,1,42,21.21,0,803,,,,,33.0,coretemp_pkg,,
2026-05-25T07:51:27+00:00,gpuserver1,52271,C.34113802,1,1,42,21.00,0,803,,,,,32.0,coretemp_pkg,,
2026-05-25T07:51:57+00:00,gpuserver1,52271,C.34113802,1,1,42,20.47,0,803,,,,,33.0,coretemp_pkg,,
2026-05-25T07:52:27+00:00,gpuserver1,52271,C.34113802,1,1,43,20.63,0,803,,,,,36.0,coretemp_pkg,,
2026-05-25T07:52:57+00:00,gpuserver1,52271,C.34113802,1,1,64,588.40,89,14755,,,,,66.0,coretemp_pkg,,
2026-05-25T07:53:27+00:00,gpuserver1,52271,C.34113802,1,1,45,75.02,0,803,,,,,37.0,coretemp_pkg,,
2026-05-25T07:53:58+00:00,gpuserver1,52271,C.34113802,1,1,42,40.47,0,1251,,,,,79.0,coretemp_pkg,,
2026-05-25T07:54:28+00:00,gpuserver1,52271,C.34113802,1,1,68,600.16,100,26983,,,,,60.0,coretemp_pkg,,
2026-05-25T07:54:58+00:00,gpuserver1,52271,C.34113802,1,1,72,601.73,100,26951,,,,,68.0,coretemp_pkg,,
2026-05-25T07:55:28+00:00,gpuserver1,52271,C.34113802,1,1,72,598.71,100,27111,,,,,68.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

