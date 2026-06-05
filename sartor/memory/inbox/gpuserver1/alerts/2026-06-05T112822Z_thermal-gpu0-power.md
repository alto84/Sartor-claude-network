---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T11:28:22+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.12W >580W sustained 3 samples

## Latest sample
```
2026-06-05T11:28:22+00:00,gpuserver1,52271,C.34113802,1,1,71,600.12,100,26597,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T11:23:50+00:00,gpuserver1,52271,C.34113802,1,1,42,22.41,0,521,,,,,42.0,coretemp_pkg,,
2026-06-05T11:24:21+00:00,gpuserver1,52271,C.34113802,1,1,42,22.30,0,521,,,,,40.0,coretemp_pkg,,
2026-06-05T11:24:51+00:00,gpuserver1,52271,C.34113802,1,1,43,22.75,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T11:25:21+00:00,gpuserver1,52271,C.34113802,1,1,43,22.43,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T11:25:51+00:00,gpuserver1,52271,C.34113802,1,1,43,22.11,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T11:26:22+00:00,gpuserver1,52271,C.34113802,1,1,43,21.96,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T11:26:52+00:00,gpuserver1,52271,C.34113802,1,1,45,75.64,0,1745,,,,,63.0,coretemp_pkg,,
2026-06-05T11:27:22+00:00,gpuserver1,52271,C.34113802,1,1,71,600.04,100,26597,,,,,69.0,coretemp_pkg,,
2026-06-05T11:27:52+00:00,gpuserver1,52271,C.34113802,1,1,75,598.58,100,26597,,,,,74.0,coretemp_pkg,,
2026-06-05T11:28:22+00:00,gpuserver1,52271,C.34113802,1,1,71,600.12,100,26597,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

