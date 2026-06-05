---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T18:30:27+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.03W >580W sustained 3 samples

## Latest sample
```
2026-06-05T18:30:27+00:00,gpuserver1,52271,C.34113802,1,1,71,600.03,100,26533,,,,,82.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T18:25:56+00:00,gpuserver1,52271,C.34113802,1,1,42,21.05,0,801,,,,,41.0,coretemp_pkg,,
2026-06-05T18:26:26+00:00,gpuserver1,52271,C.34113802,1,1,54,219.39,65,27689,,,,,79.0,coretemp_pkg,,
2026-06-05T18:26:56+00:00,gpuserver1,52271,C.34113802,1,1,67,597.70,100,24355,,,,,77.0,coretemp_pkg,,
2026-06-05T18:27:26+00:00,gpuserver1,52271,C.34113802,1,1,58,283.24,78,17713,,,,,76.0,coretemp_pkg,,
2026-06-05T18:27:56+00:00,gpuserver1,52271,C.34113802,1,1,50,82.23,0,17141,,,,,77.0,coretemp_pkg,,
2026-06-05T18:28:26+00:00,gpuserver1,52271,C.34113802,1,1,47,75.73,0,521,,,,,48.0,coretemp_pkg,,
2026-06-05T18:28:56+00:00,gpuserver1,52271,C.34113802,1,1,44,23.59,0,521,,,,,52.0,coretemp_pkg,,
2026-06-05T18:29:27+00:00,gpuserver1,52271,C.34113802,1,1,69,599.62,100,26533,,,,,73.0,coretemp_pkg,,
2026-06-05T18:29:57+00:00,gpuserver1,52271,C.34113802,1,1,75,600.26,100,26597,,,,,76.0,coretemp_pkg,,
2026-06-05T18:30:27+00:00,gpuserver1,52271,C.34113802,1,1,71,600.03,100,26533,,,,,82.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

