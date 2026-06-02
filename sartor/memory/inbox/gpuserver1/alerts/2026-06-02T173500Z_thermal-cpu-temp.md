---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-02T17:35:00+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** coretemp_pkg 89.0C >85C sustained 3 samples

## Latest sample
```
2026-06-02T17:34:59+00:00,gpuserver1,52271,C.34113802,1,1,58,185.26,12,18517,,,,,89.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T17:30:28+00:00,gpuserver1,52271,C.34113802,1,1,43,24.23,0,803,,,,,40.0,coretemp_pkg,,
2026-06-02T17:30:59+00:00,gpuserver1,52271,C.34113802,1,1,41,21.98,0,803,,,,,40.0,coretemp_pkg,,
2026-06-02T17:31:29+00:00,gpuserver1,52271,C.34113802,1,1,62,294.52,90,12067,,,,,75.0,coretemp_pkg,,
2026-06-02T17:31:59+00:00,gpuserver1,52271,C.34113802,1,1,45,75.58,0,803,,,,,41.0,coretemp_pkg,,
2026-06-02T17:32:29+00:00,gpuserver1,52271,C.34113802,1,1,65,601.36,100,26565,,,,,77.0,coretemp_pkg,,
2026-06-02T17:32:59+00:00,gpuserver1,52271,C.34113802,1,1,67,600.39,100,26629,,,,,79.0,coretemp_pkg,,
2026-06-02T17:33:29+00:00,gpuserver1,52271,C.34113802,1,1,71,339.67,100,26597,,,,,56.0,coretemp_pkg,,
2026-06-02T17:33:59+00:00,gpuserver1,52271,C.34113802,1,1,77,600.28,100,26661,,,,,87.0,coretemp_pkg,,
2026-06-02T17:34:29+00:00,gpuserver1,52271,C.34113802,1,1,74,326.99,100,27951,,,,,89.0,coretemp_pkg,,
2026-06-02T17:34:59+00:00,gpuserver1,52271,C.34113802,1,1,58,185.26,12,18517,,,,,89.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

