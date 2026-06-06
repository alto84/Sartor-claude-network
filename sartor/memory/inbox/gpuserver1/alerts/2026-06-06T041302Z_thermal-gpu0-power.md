---
type: alert
date: 2026-06-06
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-06T04:13:02+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.45W >580W sustained 3 samples

## Latest sample
```
2026-06-06T04:13:02+00:00,gpuserver1,52271,C.34113802,1,1,75,599.45,100,26789,,,,,79.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-06T04:08:30+00:00,gpuserver1,52271,C.34113802,1,1,42,22.83,0,803,,,,,36.0,coretemp_pkg,,
2026-06-06T04:09:00+00:00,gpuserver1,52271,C.34113802,1,1,43,21.72,0,803,,,,,36.0,coretemp_pkg,,
2026-06-06T04:09:31+00:00,gpuserver1,52271,C.34113802,1,1,43,21.29,0,803,,,,,35.0,coretemp_pkg,,
2026-06-06T04:10:01+00:00,gpuserver1,52271,C.34113802,1,1,43,21.93,0,803,,,,,36.0,coretemp_pkg,,
2026-06-06T04:10:31+00:00,gpuserver1,52271,C.34113802,1,1,43,22.57,0,803,,,,,35.0,coretemp_pkg,,
2026-06-06T04:11:01+00:00,gpuserver1,52271,C.34113802,1,1,43,21.96,0,803,,,,,35.0,coretemp_pkg,,
2026-06-06T04:11:32+00:00,gpuserver1,52271,C.34113802,1,1,51,187.18,40,19491,,,,,59.0,coretemp_pkg,,
2026-06-06T04:12:02+00:00,gpuserver1,52271,C.34113802,1,1,73,599.12,100,26789,,,,,75.0,coretemp_pkg,,
2026-06-06T04:12:32+00:00,gpuserver1,52271,C.34113802,1,1,75,597.81,100,26725,,,,,80.0,coretemp_pkg,,
2026-06-06T04:13:02+00:00,gpuserver1,52271,C.34113802,1,1,75,599.45,100,26789,,,,,79.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

