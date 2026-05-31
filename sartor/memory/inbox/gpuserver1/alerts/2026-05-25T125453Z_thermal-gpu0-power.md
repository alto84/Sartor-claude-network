---
type: alert
date: 2026-05-25
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-25T12:54:53+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 594.43W >580W sustained 3 samples

## Latest sample
```
2026-05-25T12:54:53+00:00,gpuserver1,52271,C.34113802,1,1,75,594.43,100,26537,,,,,71.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-25T12:50:21+00:00,gpuserver1,52271,C.34113802,1,1,44,21.82,0,803,,,,,33.0,coretemp_pkg,,
2026-05-25T12:50:51+00:00,gpuserver1,52271,C.34113802,1,1,44,21.76,0,803,,,,,33.0,coretemp_pkg,,
2026-05-25T12:51:22+00:00,gpuserver1,52271,C.34113802,1,1,44,22.20,0,803,,,,,32.0,coretemp_pkg,,
2026-05-25T12:51:52+00:00,gpuserver1,52271,C.34113802,1,1,44,23.39,0,803,,,,,33.0,coretemp_pkg,,
2026-05-25T12:52:22+00:00,gpuserver1,52271,C.34113802,1,1,44,21.52,0,803,,,,,33.0,coretemp_pkg,,
2026-05-25T12:52:52+00:00,gpuserver1,52271,C.34113802,1,1,44,21.34,0,803,,,,,32.0,coretemp_pkg,,
2026-05-25T12:53:23+00:00,gpuserver1,52271,C.34113802,1,1,51,94.39,45,7717,,,,,55.0,coretemp_pkg,,
2026-05-25T12:53:53+00:00,gpuserver1,52271,C.34113802,1,1,72,598.21,100,26633,,,,,67.0,coretemp_pkg,,
2026-05-25T12:54:23+00:00,gpuserver1,52271,C.34113802,1,1,74,598.81,100,26729,,,,,68.0,coretemp_pkg,,
2026-05-25T12:54:53+00:00,gpuserver1,52271,C.34113802,1,1,75,594.43,100,26537,,,,,71.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

