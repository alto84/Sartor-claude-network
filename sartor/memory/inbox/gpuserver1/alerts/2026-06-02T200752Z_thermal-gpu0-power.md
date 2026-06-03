---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T20:07:52+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 601.49W >580W sustained 3 samples

## Latest sample
```
2026-06-02T20:07:52+00:00,gpuserver1,52271,C.34113802,1,1,69,601.49,93,26513,,,,,66.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T20:03:21+00:00,gpuserver1,52271,C.34113802,1,1,48,76.50,0,12523,,,,,65.0,coretemp_pkg,,
2026-06-02T20:03:51+00:00,gpuserver1,52271,C.34113802,1,1,44,23.98,0,779,,,,,41.0,coretemp_pkg,,
2026-06-02T20:04:21+00:00,gpuserver1,52271,C.34113802,1,1,42,21.37,0,779,,,,,41.0,coretemp_pkg,,
2026-06-02T20:04:51+00:00,gpuserver1,52271,C.34113802,1,1,46,74.72,0,12875,,,,,68.0,coretemp_pkg,,
2026-06-02T20:05:22+00:00,gpuserver1,52271,C.34113802,1,1,43,24.52,0,779,,,,,41.0,coretemp_pkg,,
2026-06-02T20:05:52+00:00,gpuserver1,52271,C.34113802,1,1,42,20.25,0,779,,,,,40.0,coretemp_pkg,,
2026-06-02T20:06:22+00:00,gpuserver1,52271,C.34113802,1,1,42,21.15,0,779,,,,,46.0,coretemp_pkg,,
2026-06-02T20:06:52+00:00,gpuserver1,52271,C.34113802,1,1,66,598.51,100,26481,,,,,67.0,coretemp_pkg,,
2026-06-02T20:07:22+00:00,gpuserver1,52271,C.34113802,1,1,73,601.65,100,26609,,,,,71.0,coretemp_pkg,,
2026-06-02T20:07:52+00:00,gpuserver1,52271,C.34113802,1,1,69,601.49,93,26513,,,,,66.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

