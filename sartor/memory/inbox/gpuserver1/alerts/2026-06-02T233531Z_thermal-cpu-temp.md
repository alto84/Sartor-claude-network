---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-02T23:35:31+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** coretemp_pkg 91.0C >85C sustained 3 samples

## Latest sample
```
2026-06-02T23:35:31+00:00,gpuserver1,52271,C.34113802,1,1,73,170.68,100,27889,,,,,91.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T23:31:00+00:00,gpuserver1,52271,C.34113802,1,1,46,24.82,0,30421,,,,,86.0,coretemp_pkg,,
2026-06-02T23:31:30+00:00,gpuserver1,52271,C.34113802,1,1,49,285.45,0,18491,,,,,81.0,coretemp_pkg,,
2026-06-02T23:32:00+00:00,gpuserver1,52271,C.34113802,1,1,47,76.82,0,18589,,,,,60.0,coretemp_pkg,,
2026-06-02T23:32:30+00:00,gpuserver1,52271,C.34113802,1,1,45,75.44,0,521,,,,,75.0,coretemp_pkg,,
2026-06-02T23:33:00+00:00,gpuserver1,52271,C.34113802,1,1,42,24.07,0,521,,,,,45.0,coretemp_pkg,,
2026-06-02T23:33:31+00:00,gpuserver1,52271,C.34113802,1,1,63,418.23,100,26533,,,,,80.0,coretemp_pkg,,
2026-06-02T23:34:01+00:00,gpuserver1,52271,C.34113802,1,1,72,600.10,100,26597,,,,,84.0,coretemp_pkg,,
2026-06-02T23:34:31+00:00,gpuserver1,52271,C.34113802,1,1,74,318.34,74,26565,,,,,86.0,coretemp_pkg,,
2026-06-02T23:35:01+00:00,gpuserver1,52271,C.34113802,1,1,74,599.98,100,26629,,,,,91.0,coretemp_pkg,,
2026-06-02T23:35:31+00:00,gpuserver1,52271,C.34113802,1,1,73,170.68,100,27889,,,,,91.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

