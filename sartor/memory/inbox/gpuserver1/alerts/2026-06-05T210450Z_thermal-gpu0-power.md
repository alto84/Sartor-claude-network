---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T21:04:50+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.13W >580W sustained 3 samples

## Latest sample
```
2026-06-05T21:04:50+00:00,gpuserver1,52271,C.34113802,1,1,74,602.13,100,26629,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T21:00:19+00:00,gpuserver1,52271,C.34113802,1,1,45,22.43,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T21:00:49+00:00,gpuserver1,52271,C.34113802,1,1,45,22.06,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T21:01:19+00:00,gpuserver1,52271,C.34113802,1,1,45,21.95,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T21:01:49+00:00,gpuserver1,52271,C.34113802,1,1,46,21.98,0,521,,,,,37.0,coretemp_pkg,,
2026-06-05T21:02:20+00:00,gpuserver1,52271,C.34113802,1,1,46,22.18,0,521,,,,,37.0,coretemp_pkg,,
2026-06-05T21:02:50+00:00,gpuserver1,52271,C.34113802,1,1,46,22.91,0,521,,,,,37.0,coretemp_pkg,,
2026-06-05T21:03:20+00:00,gpuserver1,52271,C.34113802,1,1,47,39.49,0,847,,,,,54.0,coretemp_pkg,,
2026-06-05T21:03:50+00:00,gpuserver1,52271,C.34113802,1,1,73,599.99,100,26597,,,,,71.0,coretemp_pkg,,
2026-06-05T21:04:20+00:00,gpuserver1,52271,C.34113802,1,1,75,599.98,100,26597,,,,,75.0,coretemp_pkg,,
2026-06-05T21:04:50+00:00,gpuserver1,52271,C.34113802,1,1,74,602.13,100,26629,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

