---
type: alert
date: 2026-06-11
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-11T00:54:52+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 602.19W >580W sustained 3 samples

## Latest sample
```
2026-06-11T00:54:52+00:00,gpuserver1,52271,C.34113802,1,1,77,602.19,100,26729,,,,,71.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-11T00:50:20+00:00,gpuserver1,52271,C.34113802,1,1,42,19.85,0,801,,,,,41.0,coretemp_pkg,,
2026-06-11T00:50:51+00:00,gpuserver1,52271,C.34113802,1,1,47,77.16,0,12481,,,,,65.0,coretemp_pkg,,
2026-06-11T00:51:21+00:00,gpuserver1,52271,C.34113802,1,1,61,553.29,81,15107,,,,,80.0,coretemp_pkg,,
2026-06-11T00:51:51+00:00,gpuserver1,52271,C.34113802,1,1,47,76.03,0,803,,,,,59.0,coretemp_pkg,,
2026-06-11T00:52:21+00:00,gpuserver1,52271,C.34113802,1,1,43,22.57,0,803,,,,,43.0,coretemp_pkg,,
2026-06-11T00:52:51+00:00,gpuserver1,52271,C.34113802,1,1,42,19.77,0,803,,,,,41.0,coretemp_pkg,,
2026-06-11T00:53:21+00:00,gpuserver1,52271,C.34113802,1,1,43,19.84,12,1059,,,,,75.0,coretemp_pkg,,
2026-06-11T00:53:51+00:00,gpuserver1,52271,C.34113802,1,1,69,605.47,95,26633,,,,,64.0,coretemp_pkg,,
2026-06-11T00:54:21+00:00,gpuserver1,52271,C.34113802,1,1,74,602.83,100,26633,,,,,56.0,coretemp_pkg,,
2026-06-11T00:54:52+00:00,gpuserver1,52271,C.34113802,1,1,77,602.19,100,26729,,,,,71.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

