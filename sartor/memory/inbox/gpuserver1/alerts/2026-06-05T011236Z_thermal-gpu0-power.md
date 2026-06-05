---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T01:12:36+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.53W >580W sustained 3 samples

## Latest sample
```
2026-06-05T01:12:36+00:00,gpuserver1,52271,C.34113802,1,1,75,599.53,100,26597,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T01:08:04+00:00,gpuserver1,52271,C.34113802,1,1,45,74.34,0,803,,,,,44.0,coretemp_pkg,,
2026-06-05T01:08:35+00:00,gpuserver1,52271,C.34113802,1,1,63,585.29,99,15107,,,,,81.0,coretemp_pkg,,
2026-06-05T01:09:05+00:00,gpuserver1,52271,C.34113802,1,1,45,75.12,0,803,,,,,44.0,coretemp_pkg,,
2026-06-05T01:09:35+00:00,gpuserver1,52271,C.34113802,1,1,42,23.27,0,803,,,,,42.0,coretemp_pkg,,
2026-06-05T01:10:05+00:00,gpuserver1,52271,C.34113802,1,1,46,77.93,0,2115,,,,,44.0,coretemp_pkg,,
2026-06-05T01:10:35+00:00,gpuserver1,52271,C.34113802,1,1,42,24.24,0,803,,,,,41.0,coretemp_pkg,,
2026-06-05T01:11:05+00:00,gpuserver1,52271,C.34113802,1,1,42,21.83,0,803,,,,,40.0,coretemp_pkg,,
2026-06-05T01:11:36+00:00,gpuserver1,52271,C.34113802,1,1,60,600.41,100,26565,,,,,77.0,coretemp_pkg,,
2026-06-05T01:12:06+00:00,gpuserver1,52271,C.34113802,1,1,73,600.01,100,26629,,,,,77.0,coretemp_pkg,,
2026-06-05T01:12:36+00:00,gpuserver1,52271,C.34113802,1,1,75,599.53,100,26597,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

