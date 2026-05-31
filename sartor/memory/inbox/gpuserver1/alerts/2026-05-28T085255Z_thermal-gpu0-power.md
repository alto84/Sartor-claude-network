---
type: alert
date: 2026-05-28
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-28T08:52:55+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 597.79W >580W sustained 3 samples

## Latest sample
```
2026-05-28T08:52:55+00:00,gpuserver1,52271,C.34113802,1,1,73,597.79,100,26537,,,,,65.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-28T08:48:23+00:00,gpuserver1,52271,C.34113802,1,1,44,20.97,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T08:48:54+00:00,gpuserver1,52271,C.34113802,1,1,44,22.58,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T08:49:24+00:00,gpuserver1,52271,C.34113802,1,1,44,21.87,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T08:49:54+00:00,gpuserver1,52271,C.34113802,1,1,45,22.08,0,803,,,,,35.0,coretemp_pkg,,
2026-05-28T08:50:24+00:00,gpuserver1,52271,C.34113802,1,1,47,22.75,56,3331,,,,,50.0,coretemp_pkg,,
2026-05-28T08:50:54+00:00,gpuserver1,52271,C.34113802,1,1,48,77.64,0,803,,,,,40.0,coretemp_pkg,,
2026-05-28T08:51:25+00:00,gpuserver1,52271,C.34113802,1,1,50,205.62,16,29573,,,,,56.0,coretemp_pkg,,
2026-05-28T08:51:55+00:00,gpuserver1,52271,C.34113802,1,1,68,599.79,100,26633,,,,,61.0,coretemp_pkg,,
2026-05-28T08:52:25+00:00,gpuserver1,52271,C.34113802,1,1,73,603.03,100,26729,,,,,68.0,coretemp_pkg,,
2026-05-28T08:52:55+00:00,gpuserver1,52271,C.34113802,1,1,73,597.79,100,26537,,,,,65.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

