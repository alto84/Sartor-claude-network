---
type: alert
date: 2026-06-03
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-03T11:28:15+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.51W >580W sustained 3 samples

## Latest sample
```
2026-06-03T11:28:15+00:00,gpuserver1,52271,C.34113802,1,1,72,600.51,100,26629,,,,,75.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-03T11:23:43+00:00,gpuserver1,52271,C.34113802,1,1,44,21.57,0,521,,,,,36.0,coretemp_pkg,,
2026-06-03T11:24:14+00:00,gpuserver1,52271,C.34113802,1,1,44,21.84,0,521,,,,,36.0,coretemp_pkg,,
2026-06-03T11:24:44+00:00,gpuserver1,52271,C.34113802,1,1,44,21.68,0,521,,,,,37.0,coretemp_pkg,,
2026-06-03T11:25:14+00:00,gpuserver1,52271,C.34113802,1,1,44,23.96,0,521,,,,,44.0,coretemp_pkg,,
2026-06-03T11:25:44+00:00,gpuserver1,52271,C.34113802,1,1,44,21.66,0,521,,,,,35.0,coretemp_pkg,,
2026-06-03T11:26:14+00:00,gpuserver1,52271,C.34113802,1,1,44,22.07,0,521,,,,,35.0,coretemp_pkg,,
2026-06-03T11:26:45+00:00,gpuserver1,52271,C.34113802,1,1,51,152.32,80,10621,,,,,56.0,coretemp_pkg,,
2026-06-03T11:27:15+00:00,gpuserver1,52271,C.34113802,1,1,73,598.16,100,26597,,,,,71.0,coretemp_pkg,,
2026-06-03T11:27:45+00:00,gpuserver1,52271,C.34113802,1,1,63,600.04,60,7237,,,,,63.0,coretemp_pkg,,
2026-06-03T11:28:15+00:00,gpuserver1,52271,C.34113802,1,1,72,600.51,100,26629,,,,,75.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

