---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T08:19:10+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.30W >580W sustained 3 samples

## Latest sample
```
2026-06-05T08:19:10+00:00,gpuserver1,52271,C.34113802,1,1,71,600.30,100,26659,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T08:14:38+00:00,gpuserver1,52271,C.34113802,1,1,45,21.97,0,801,,,,,36.0,coretemp_pkg,,
2026-06-05T08:15:08+00:00,gpuserver1,52271,C.34113802,1,1,45,23.10,0,801,,,,,35.0,coretemp_pkg,,
2026-06-05T08:15:38+00:00,gpuserver1,52271,C.34113802,1,1,45,22.07,0,801,,,,,36.0,coretemp_pkg,,
2026-06-05T08:16:09+00:00,gpuserver1,52271,C.34113802,1,1,45,21.70,0,801,,,,,36.0,coretemp_pkg,,
2026-06-05T08:16:39+00:00,gpuserver1,52271,C.34113802,1,1,45,21.45,0,801,,,,,52.0,coretemp_pkg,,
2026-06-05T08:17:09+00:00,gpuserver1,52271,C.34113802,1,1,48,77.06,0,9633,,,,,40.0,coretemp_pkg,,
2026-06-05T08:17:39+00:00,gpuserver1,52271,C.34113802,1,1,44,24.75,0,801,,,,,39.0,coretemp_pkg,,
2026-06-05T08:18:09+00:00,gpuserver1,52271,C.34113802,1,1,69,599.53,100,26627,,,,,75.0,coretemp_pkg,,
2026-06-05T08:18:39+00:00,gpuserver1,52271,C.34113802,1,1,71,599.70,100,26627,,,,,75.0,coretemp_pkg,,
2026-06-05T08:19:10+00:00,gpuserver1,52271,C.34113802,1,1,71,600.30,100,26659,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

