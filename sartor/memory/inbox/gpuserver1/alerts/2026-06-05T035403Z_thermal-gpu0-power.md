---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T03:54:03+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.90W >580W sustained 3 samples

## Latest sample
```
2026-06-05T03:54:03+00:00,gpuserver1,52271,C.34113802,1,1,75,599.90,99,26635,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T03:49:32+00:00,gpuserver1,52271,C.34113802,1,1,45,21.98,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T03:50:02+00:00,gpuserver1,52271,C.34113802,1,1,45,22.65,0,777,,,,,49.0,coretemp_pkg,,
2026-06-05T03:50:32+00:00,gpuserver1,52271,C.34113802,1,1,45,24.05,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T03:51:03+00:00,gpuserver1,52271,C.34113802,1,1,45,22.35,0,777,,,,,37.0,coretemp_pkg,,
2026-06-05T03:51:33+00:00,gpuserver1,52271,C.34113802,1,1,45,22.20,0,777,,,,,37.0,coretemp_pkg,,
2026-06-05T03:52:03+00:00,gpuserver1,52271,C.34113802,1,1,45,22.28,0,777,,,,,39.0,coretemp_pkg,,
2026-06-05T03:52:33+00:00,gpuserver1,52271,C.34113802,1,1,45,23.12,0,777,,,,,37.0,coretemp_pkg,,
2026-06-05T03:53:03+00:00,gpuserver1,52271,C.34113802,1,1,72,599.61,100,26603,,,,,75.0,coretemp_pkg,,
2026-06-05T03:53:33+00:00,gpuserver1,52271,C.34113802,1,1,76,600.79,100,26603,,,,,80.0,coretemp_pkg,,
2026-06-05T03:54:03+00:00,gpuserver1,52271,C.34113802,1,1,75,599.90,99,26635,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

