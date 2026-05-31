---
type: alert
date: 2026-05-26
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-26T08:17:29+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.30W >580W sustained 3 samples

## Latest sample
```
2026-05-26T08:17:28+00:00,gpuserver1,52271,C.34113802,1,1,72,600.30,100,26597,,,,,65.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-05-26T08:12:57+00:00,gpuserver1,52271,C.34113802,1,1,49,23.93,0,803,,,,,31.0,coretemp_pkg,,
2026-05-26T08:13:27+00:00,gpuserver1,52271,C.34113802,1,1,49,22.98,0,803,,,,,31.0,coretemp_pkg,,
2026-05-26T08:13:57+00:00,gpuserver1,52271,C.34113802,1,1,49,22.62,0,803,,,,,36.0,coretemp_pkg,,
2026-05-26T08:14:28+00:00,gpuserver1,52271,C.34113802,1,1,55,131.57,0,13123,,,,,60.0,coretemp_pkg,,
2026-05-26T08:14:58+00:00,gpuserver1,52271,C.34113802,1,1,47,77.56,0,803,,,,,39.0,coretemp_pkg,,
2026-05-26T08:15:28+00:00,gpuserver1,52271,C.34113802,1,1,42,24.85,0,803,,,,,35.0,coretemp_pkg,,
2026-05-26T08:15:58+00:00,gpuserver1,52271,C.34113802,1,1,42,21.47,0,803,,,,,34.0,coretemp_pkg,,
2026-05-26T08:16:28+00:00,gpuserver1,52271,C.34113802,1,1,68,600.43,100,26565,,,,,62.0,coretemp_pkg,,
2026-05-26T08:16:58+00:00,gpuserver1,52271,C.34113802,1,1,70,599.64,100,26629,,,,,65.0,coretemp_pkg,,
2026-05-26T08:17:28+00:00,gpuserver1,52271,C.34113802,1,1,72,600.30,100,26597,,,,,65.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

