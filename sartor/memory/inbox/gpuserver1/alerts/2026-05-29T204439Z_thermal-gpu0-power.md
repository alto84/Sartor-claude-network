---
type: alert
date: 2026-05-29
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-29T20:44:39+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.02W >580W sustained 3 samples

## Latest sample
```
2026-05-29T20:44:39+00:00,gpuserver1,52271,C.34113802,1,1,75,600.02,100,26757,,,,,85.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-29T20:40:07+00:00,gpuserver1,52271,C.34113802,1,1,44,21.38,0,803,,,,,39.0,coretemp_pkg,,
2026-05-29T20:40:38+00:00,gpuserver1,52271,C.34113802,1,1,59,539.85,89,13795,,,,,72.0,coretemp_pkg,,
2026-05-29T20:41:08+00:00,gpuserver1,52271,C.34113802,1,1,47,76.91,0,803,,,,,41.0,coretemp_pkg,,
2026-05-29T20:41:38+00:00,gpuserver1,52271,C.34113802,1,1,49,79.52,0,9635,,,,,44.0,coretemp_pkg,,
2026-05-29T20:42:08+00:00,gpuserver1,52271,C.34113802,1,1,45,24.22,0,803,,,,,41.0,coretemp_pkg,,
2026-05-29T20:42:38+00:00,gpuserver1,52271,C.34113802,1,1,48,78.47,0,9635,,,,,53.0,coretemp_pkg,,
2026-05-29T20:43:09+00:00,gpuserver1,52271,C.34113802,1,1,45,24.66,0,803,,,,,44.0,coretemp_pkg,,
2026-05-29T20:43:39+00:00,gpuserver1,52271,C.34113802,1,1,67,597.50,100,26661,,,,,81.0,coretemp_pkg,,
2026-05-29T20:44:09+00:00,gpuserver1,52271,C.34113802,1,1,73,597.96,100,26789,,,,,81.0,coretemp_pkg,,
2026-05-29T20:44:39+00:00,gpuserver1,52271,C.34113802,1,1,75,600.02,100,26757,,,,,85.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

