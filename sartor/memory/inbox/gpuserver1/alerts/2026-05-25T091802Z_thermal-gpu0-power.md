---
type: alert
date: 2026-05-25
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-25T09:18:02+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 603.94W >580W sustained 3 samples

## Latest sample
```
2026-05-25T09:18:02+00:00,gpuserver1,52271,C.34113802,1,1,75,603.94,100,26607,,,,,72.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-25T09:13:31+00:00,gpuserver1,52271,C.34113802,1,1,43,21.08,0,779,,,,,32.0,coretemp_pkg,,
2026-05-25T09:14:01+00:00,gpuserver1,52271,C.34113802,1,1,43,21.42,0,779,,,,,32.0,coretemp_pkg,,
2026-05-25T09:14:31+00:00,gpuserver1,52271,C.34113802,1,1,43,21.20,0,779,,,,,31.0,coretemp_pkg,,
2026-05-25T09:15:01+00:00,gpuserver1,52271,C.34113802,1,1,43,21.70,0,779,,,,,32.0,coretemp_pkg,,
2026-05-25T09:15:31+00:00,gpuserver1,52271,C.34113802,1,1,43,21.14,0,779,,,,,32.0,coretemp_pkg,,
2026-05-25T09:16:02+00:00,gpuserver1,52271,C.34113802,1,1,43,20.84,0,779,,,,,32.0,coretemp_pkg,,
2026-05-25T09:16:32+00:00,gpuserver1,52271,C.34113802,1,1,49,214.21,18,29549,,,,,48.0,coretemp_pkg,,
2026-05-25T09:17:02+00:00,gpuserver1,52271,C.34113802,1,1,71,597.93,100,26607,,,,,59.0,coretemp_pkg,,
2026-05-25T09:17:32+00:00,gpuserver1,52271,C.34113802,1,1,73,598.39,100,26511,,,,,68.0,coretemp_pkg,,
2026-05-25T09:18:02+00:00,gpuserver1,52271,C.34113802,1,1,75,603.94,100,26607,,,,,72.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

