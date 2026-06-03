---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T23:57:39+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.62W >580W sustained 3 samples

## Latest sample
```
2026-06-02T23:57:39+00:00,gpuserver1,52271,C.34113802,1,1,77,600.62,100,26635,,,,,85.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T23:53:07+00:00,gpuserver1,52271,C.34113802,1,1,47,75.79,0,9609,,,,,41.0,coretemp_pkg,,
2026-06-02T23:53:38+00:00,gpuserver1,52271,C.34113802,1,1,43,24.06,0,777,,,,,39.0,coretemp_pkg,,
2026-06-02T23:54:08+00:00,gpuserver1,52271,C.34113802,1,1,42,21.39,0,777,,,,,40.0,coretemp_pkg,,
2026-06-02T23:54:38+00:00,gpuserver1,52271,C.34113802,1,1,42,20.93,0,777,,,,,37.0,coretemp_pkg,,
2026-06-02T23:55:08+00:00,gpuserver1,52271,C.34113802,1,1,42,20.99,0,777,,,,,37.0,coretemp_pkg,,
2026-06-02T23:55:39+00:00,gpuserver1,52271,C.34113802,1,1,43,20.98,0,777,,,,,39.0,coretemp_pkg,,
2026-06-02T23:56:09+00:00,gpuserver1,52271,C.34113802,1,1,45,87.25,0,5673,,,,,72.0,coretemp_pkg,,
2026-06-02T23:56:39+00:00,gpuserver1,52271,C.34113802,1,1,71,600.08,100,26603,,,,,76.0,coretemp_pkg,,
2026-06-02T23:57:09+00:00,gpuserver1,52271,C.34113802,1,1,73,601.44,100,26603,,,,,79.0,coretemp_pkg,,
2026-06-02T23:57:39+00:00,gpuserver1,52271,C.34113802,1,1,77,600.62,100,26635,,,,,85.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

