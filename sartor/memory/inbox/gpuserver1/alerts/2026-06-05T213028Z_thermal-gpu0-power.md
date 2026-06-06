---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T21:30:28+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.04W >580W sustained 3 samples

## Latest sample
```
2026-06-05T21:30:28+00:00,gpuserver1,52271,C.34113802,1,1,75,600.04,100,26635,,,,,86.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T21:25:57+00:00,gpuserver1,52271,C.34113802,1,1,43,21.18,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T21:26:27+00:00,gpuserver1,52271,C.34113802,1,1,43,21.26,0,777,,,,,47.0,coretemp_pkg,,
2026-06-05T21:26:57+00:00,gpuserver1,52271,C.34113802,1,1,43,21.15,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T21:27:27+00:00,gpuserver1,52271,C.34113802,1,1,44,23.53,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T21:27:58+00:00,gpuserver1,52271,C.34113802,1,1,49,81.50,0,12425,,,,,64.0,coretemp_pkg,,
2026-06-05T21:28:28+00:00,gpuserver1,52271,C.34113802,1,1,46,75.49,0,777,,,,,42.0,coretemp_pkg,,
2026-06-05T21:28:58+00:00,gpuserver1,52271,C.34113802,1,1,45,252.87,17,16969,,,,,69.0,coretemp_pkg,,
2026-06-05T21:29:28+00:00,gpuserver1,52271,C.34113802,1,1,69,600.06,100,26603,,,,,70.0,coretemp_pkg,,
2026-06-05T21:29:58+00:00,gpuserver1,52271,C.34113802,1,1,76,597.84,100,26603,,,,,76.0,coretemp_pkg,,
2026-06-05T21:30:28+00:00,gpuserver1,52271,C.34113802,1,1,75,600.04,100,26635,,,,,86.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

