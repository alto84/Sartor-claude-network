---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T07:35:53+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.76W >580W sustained 3 samples

## Latest sample
```
2026-06-05T07:35:52+00:00,gpuserver1,52271,C.34113802,1,1,78,598.76,100,26565,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T07:31:21+00:00,gpuserver1,52271,C.34113802,1,1,77,599.73,100,26571,,,,,77.0,coretemp_pkg,,
2026-06-05T07:31:52+00:00,gpuserver1,52271,C.34113802,1,1,78,598.86,100,26635,,,,,80.0,coretemp_pkg,,
2026-06-05T07:32:22+00:00,gpuserver1,52271,C.34113802,1,1,62,120.10,0,30421,,,,,87.0,coretemp_pkg,,
2026-06-05T07:32:52+00:00,gpuserver1,52271,C.34113802,1,1,56,122.67,0,18621,,,,,85.0,coretemp_pkg,,
2026-06-05T07:33:22+00:00,gpuserver1,52271,C.34113802,1,1,50,81.78,0,521,,,,,90.0,coretemp_pkg,,
2026-06-05T07:33:52+00:00,gpuserver1,52271,C.34113802,1,1,48,78.25,0,521,,,,,50.0,coretemp_pkg,,
2026-06-05T07:34:22+00:00,gpuserver1,52271,C.34113802,1,1,44,24.07,0,521,,,,,48.0,coretemp_pkg,,
2026-06-05T07:34:52+00:00,gpuserver1,52271,C.34113802,1,1,70,599.67,100,26533,,,,,72.0,coretemp_pkg,,
2026-06-05T07:35:22+00:00,gpuserver1,52271,C.34113802,1,1,75,601.28,100,26597,,,,,81.0,coretemp_pkg,,
2026-06-05T07:35:52+00:00,gpuserver1,52271,C.34113802,1,1,78,598.76,100,26565,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

