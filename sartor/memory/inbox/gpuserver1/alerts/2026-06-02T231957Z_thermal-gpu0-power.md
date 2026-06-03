---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T23:19:57+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.37W >580W sustained 3 samples

## Latest sample
```
2026-06-02T23:19:57+00:00,gpuserver1,52271,C.34113802,1,1,75,599.37,100,26571,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T23:15:25+00:00,gpuserver1,52271,C.34113802,1,1,44,23.10,0,777,,,,,36.0,coretemp_pkg,,
2026-06-02T23:15:56+00:00,gpuserver1,52271,C.34113802,1,1,44,21.93,0,777,,,,,36.0,coretemp_pkg,,
2026-06-02T23:16:26+00:00,gpuserver1,52271,C.34113802,1,1,44,21.62,0,777,,,,,36.0,coretemp_pkg,,
2026-06-02T23:16:56+00:00,gpuserver1,52271,C.34113802,1,1,44,22.04,0,777,,,,,37.0,coretemp_pkg,,
2026-06-02T23:17:26+00:00,gpuserver1,52271,C.34113802,1,1,44,22.88,0,777,,,,,36.0,coretemp_pkg,,
2026-06-02T23:17:56+00:00,gpuserver1,52271,C.34113802,1,1,45,21.77,0,777,,,,,41.0,coretemp_pkg,,
2026-06-02T23:18:27+00:00,gpuserver1,52271,C.34113802,1,1,45,21.78,0,777,,,,,35.0,coretemp_pkg,,
2026-06-02T23:18:57+00:00,gpuserver1,52271,C.34113802,1,1,68,600.77,100,26539,,,,,70.0,coretemp_pkg,,
2026-06-02T23:19:27+00:00,gpuserver1,52271,C.34113802,1,1,74,600.10,100,26603,,,,,75.0,coretemp_pkg,,
2026-06-02T23:19:57+00:00,gpuserver1,52271,C.34113802,1,1,75,599.37,100,26571,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

