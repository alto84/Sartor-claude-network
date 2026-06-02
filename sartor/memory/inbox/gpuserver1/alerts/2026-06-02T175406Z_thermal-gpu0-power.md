---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T17:54:06+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.69W >580W sustained 3 samples

## Latest sample
```
2026-06-02T17:54:05+00:00,gpuserver1,52271,C.34113802,1,1,71,599.69,100,26595,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T17:49:34+00:00,gpuserver1,52271,C.34113802,1,1,45,24.40,0,801,,,,,47.0,coretemp_pkg,,
2026-06-02T17:50:04+00:00,gpuserver1,52271,C.34113802,1,1,48,80.87,0,2083,,,,,65.0,coretemp_pkg,,
2026-06-02T17:50:34+00:00,gpuserver1,52271,C.34113802,1,1,62,298.56,85,9443,,,,,84.0,coretemp_pkg,,
2026-06-02T17:51:04+00:00,gpuserver1,52271,C.34113802,1,1,48,78.61,0,803,,,,,48.0,coretemp_pkg,,
2026-06-02T17:51:35+00:00,gpuserver1,52271,C.34113802,1,1,44,24.33,0,803,,,,,45.0,coretemp_pkg,,
2026-06-02T17:52:05+00:00,gpuserver1,52271,C.34113802,1,1,42,21.25,0,803,,,,,44.0,coretemp_pkg,,
2026-06-02T17:52:35+00:00,gpuserver1,52271,C.34113802,1,1,42,21.39,0,803,,,,,41.0,coretemp_pkg,,
2026-06-02T17:53:05+00:00,gpuserver1,52271,C.34113802,1,1,66,602.78,100,26563,,,,,80.0,coretemp_pkg,,
2026-06-02T17:53:35+00:00,gpuserver1,52271,C.34113802,1,1,71,599.28,100,26627,,,,,80.0,coretemp_pkg,,
2026-06-02T17:54:05+00:00,gpuserver1,52271,C.34113802,1,1,71,599.69,100,26595,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

