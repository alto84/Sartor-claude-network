---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T02:03:59+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.21W >580W sustained 3 samples

## Latest sample
```
2026-06-02T02:03:59+00:00,gpuserver1,52271,C.34113802,1,1,75,600.21,100,25387,,,,,69.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T01:59:28+00:00,gpuserver1,52271,C.34113802,1,1,42,21.16,0,777,,,,,36.0,coretemp_pkg,,
2026-06-02T01:59:58+00:00,gpuserver1,52271,C.34113802,1,1,43,20.89,0,777,,,,,34.0,coretemp_pkg,,
2026-06-02T02:00:28+00:00,gpuserver1,52271,C.34113802,1,1,43,22.89,0,777,,,,,35.0,coretemp_pkg,,
2026-06-02T02:00:58+00:00,gpuserver1,52271,C.34113802,1,1,43,21.27,0,777,,,,,35.0,coretemp_pkg,,
2026-06-02T02:01:28+00:00,gpuserver1,52271,C.34113802,1,1,43,20.74,0,777,,,,,51.0,coretemp_pkg,,
2026-06-02T02:01:59+00:00,gpuserver1,52271,C.34113802,1,1,43,21.22,0,777,,,,,35.0,coretemp_pkg,,
2026-06-02T02:02:29+00:00,gpuserver1,52271,C.34113802,1,1,43,21.94,0,777,,,,,34.0,coretemp_pkg,,
2026-06-02T02:02:59+00:00,gpuserver1,52271,C.34113802,1,1,67,598.13,100,25291,,,,,65.0,coretemp_pkg,,
2026-06-02T02:03:29+00:00,gpuserver1,52271,C.34113802,1,1,72,600.52,100,25355,,,,,69.0,coretemp_pkg,,
2026-06-02T02:03:59+00:00,gpuserver1,52271,C.34113802,1,1,75,600.21,100,25387,,,,,69.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

