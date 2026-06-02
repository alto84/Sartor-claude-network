---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T08:55:25+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.88W >580W sustained 3 samples

## Latest sample
```
2026-06-02T08:55:25+00:00,gpuserver1,52271,C.34113802,1,1,75,599.88,100,26731,,,,,80.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T08:50:53+00:00,gpuserver1,52271,C.34113802,1,1,45,74.14,0,777,,,,,44.0,coretemp_pkg,,
2026-06-02T08:51:23+00:00,gpuserver1,52271,C.34113802,1,1,41,20.80,0,777,,,,,41.0,coretemp_pkg,,
2026-06-02T08:51:54+00:00,gpuserver1,52271,C.34113802,1,1,58,73.36,91,8969,,,,,72.0,coretemp_pkg,,
2026-06-02T08:52:24+00:00,gpuserver1,52271,C.34113802,1,1,46,75.24,0,779,,,,,44.0,coretemp_pkg,,
2026-06-02T08:52:54+00:00,gpuserver1,52271,C.34113802,1,1,42,23.42,0,779,,,,,40.0,coretemp_pkg,,
2026-06-02T08:53:24+00:00,gpuserver1,52271,C.34113802,1,1,42,21.22,0,779,,,,,39.0,coretemp_pkg,,
2026-06-02T08:53:54+00:00,gpuserver1,52271,C.34113802,1,1,42,20.99,0,779,,,,,45.0,coretemp_pkg,,
2026-06-02T08:54:25+00:00,gpuserver1,52271,C.34113802,1,1,68,600.38,100,26635,,,,,71.0,coretemp_pkg,,
2026-06-02T08:54:55+00:00,gpuserver1,52271,C.34113802,1,1,71,602.20,100,26763,,,,,74.0,coretemp_pkg,,
2026-06-02T08:55:25+00:00,gpuserver1,52271,C.34113802,1,1,75,599.88,100,26731,,,,,80.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

