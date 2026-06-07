---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T00:12:46+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.30W >580W sustained 3 samples

## Latest sample
```
2026-06-07T00:12:46+00:00,gpuserver1,52271,C.34113802,1,1,75,600.30,100,26597,,,,,77.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T00:08:15+00:00,gpuserver1,52271,C.34113802,1,1,48,75.15,0,13763,,,,,66.0,coretemp_pkg,,
2026-06-07T00:08:45+00:00,gpuserver1,52271,C.34113802,1,1,44,27.77,0,803,,,,,40.0,coretemp_pkg,,
2026-06-07T00:09:15+00:00,gpuserver1,52271,C.34113802,1,1,42,18.43,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T00:09:45+00:00,gpuserver1,52271,C.34113802,1,1,42,19.64,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T00:10:15+00:00,gpuserver1,52271,C.34113802,1,1,42,19.80,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T00:10:46+00:00,gpuserver1,52271,C.34113802,1,1,42,19.37,0,803,,,,,65.0,coretemp_pkg,,
2026-06-07T00:11:16+00:00,gpuserver1,52271,C.34113802,1,1,45,74.39,0,9635,,,,,40.0,coretemp_pkg,,
2026-06-07T00:11:46+00:00,gpuserver1,52271,C.34113802,1,1,63,601.99,100,26565,,,,,75.0,coretemp_pkg,,
2026-06-07T00:12:16+00:00,gpuserver1,52271,C.34113802,1,1,68,600.88,100,26629,,,,,81.0,coretemp_pkg,,
2026-06-07T00:12:46+00:00,gpuserver1,52271,C.34113802,1,1,75,600.30,100,26597,,,,,77.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

