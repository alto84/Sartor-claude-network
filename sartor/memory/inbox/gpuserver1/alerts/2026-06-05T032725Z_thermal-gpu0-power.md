---
type: alert
date: 2026-06-05
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-05T03:27:25+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 599.55W >580W sustained 3 samples

## Latest sample
```
2026-06-05T03:27:25+00:00,gpuserver1,52271,C.34113802,1,1,78,599.55,100,26635,,,,,81.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-05T03:22:54+00:00,gpuserver1,52271,C.34113802,1,1,43,21.80,0,521,,,,,41.0,coretemp_pkg,,
2026-06-05T03:23:24+00:00,gpuserver1,52271,C.34113802,1,1,43,23.25,0,521,,,,,40.0,coretemp_pkg,,
2026-06-05T03:23:54+00:00,gpuserver1,52271,C.34113802,1,1,44,21.94,0,521,,,,,40.0,coretemp_pkg,,
2026-06-05T03:24:24+00:00,gpuserver1,52271,C.34113802,1,1,44,22.52,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T03:24:55+00:00,gpuserver1,52271,C.34113802,1,1,44,22.45,0,521,,,,,39.0,coretemp_pkg,,
2026-06-05T03:25:25+00:00,gpuserver1,52271,C.34113802,1,1,52,294.52,0,11209,,,,,64.0,coretemp_pkg,,
2026-06-05T03:25:55+00:00,gpuserver1,52271,C.34113802,1,1,47,77.59,0,777,,,,,44.0,coretemp_pkg,,
2026-06-05T03:26:25+00:00,gpuserver1,52271,C.34113802,1,1,71,597.51,100,26603,,,,,76.0,coretemp_pkg,,
2026-06-05T03:26:55+00:00,gpuserver1,52271,C.34113802,1,1,74,600.09,100,26603,,,,,80.0,coretemp_pkg,,
2026-06-05T03:27:25+00:00,gpuserver1,52271,C.34113802,1,1,78,599.55,100,26635,,,,,81.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

