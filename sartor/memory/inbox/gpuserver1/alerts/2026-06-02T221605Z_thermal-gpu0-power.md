---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T22:16:05+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.99W >580W sustained 3 samples

## Latest sample
```
2026-06-02T22:16:05+00:00,gpuserver1,52271,C.34113802,1,1,70,599.99,100,26597,,,,,76.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T22:11:33+00:00,gpuserver1,52271,C.34113802,1,1,42,20.85,0,803,,,,,42.0,coretemp_pkg,,
2026-06-02T22:12:04+00:00,gpuserver1,52271,C.34113802,1,1,42,21.31,0,803,,,,,41.0,coretemp_pkg,,
2026-06-02T22:12:34+00:00,gpuserver1,52271,C.34113802,1,1,43,21.80,0,803,,,,,39.0,coretemp_pkg,,
2026-06-02T22:13:04+00:00,gpuserver1,52271,C.34113802,1,1,43,21.14,0,803,,,,,39.0,coretemp_pkg,,
2026-06-02T22:13:34+00:00,gpuserver1,52271,C.34113802,1,1,43,21.13,0,803,,,,,39.0,coretemp_pkg,,
2026-06-02T22:14:05+00:00,gpuserver1,52271,C.34113802,1,1,43,21.13,0,803,,,,,37.0,coretemp_pkg,,
2026-06-02T22:14:35+00:00,gpuserver1,52271,C.34113802,1,1,43,20.77,0,803,,,,,39.0,coretemp_pkg,,
2026-06-02T22:15:05+00:00,gpuserver1,52271,C.34113802,1,1,65,599.10,100,26565,,,,,66.0,coretemp_pkg,,
2026-06-02T22:15:35+00:00,gpuserver1,52271,C.34113802,1,1,70,598.65,99,26629,,,,,79.0,coretemp_pkg,,
2026-06-02T22:16:05+00:00,gpuserver1,52271,C.34113802,1,1,70,599.99,100,26597,,,,,76.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

