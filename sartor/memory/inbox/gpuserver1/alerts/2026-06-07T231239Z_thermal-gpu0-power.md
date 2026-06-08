---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T23:12:39+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 598.50W >580W sustained 3 samples

## Latest sample
```
2026-06-07T23:12:39+00:00,gpuserver1,52271,C.34113802,1,1,77,598.50,100,26661,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T23:08:07+00:00,gpuserver1,52271,C.34113802,1,1,42,20.40,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T23:08:38+00:00,gpuserver1,52271,C.34113802,1,1,42,20.20,0,803,,,,,37.0,coretemp_pkg,,
2026-06-07T23:09:08+00:00,gpuserver1,52271,C.34113802,1,1,63,534.11,99,15107,,,,,70.0,coretemp_pkg,,
2026-06-07T23:09:38+00:00,gpuserver1,52271,C.34113802,1,1,46,75.56,0,803,,,,,41.0,coretemp_pkg,,
2026-06-07T23:10:08+00:00,gpuserver1,52271,C.34113802,1,1,42,23.30,0,803,,,,,40.0,coretemp_pkg,,
2026-06-07T23:10:38+00:00,gpuserver1,52271,C.34113802,1,1,42,20.09,0,803,,,,,39.0,coretemp_pkg,,
2026-06-07T23:11:09+00:00,gpuserver1,52271,C.34113802,1,1,45,265.75,17,16995,,,,,58.0,coretemp_pkg,,
2026-06-07T23:11:39+00:00,gpuserver1,52271,C.34113802,1,1,71,600.04,100,26629,,,,,70.0,coretemp_pkg,,
2026-06-07T23:12:09+00:00,gpuserver1,52271,C.34113802,1,1,73,602.45,100,26629,,,,,74.0,coretemp_pkg,,
2026-06-07T23:12:39+00:00,gpuserver1,52271,C.34113802,1,1,77,598.50,100,26661,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

