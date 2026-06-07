---
type: alert
date: 2026-06-07
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-07T04:32:26+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 600.28W >580W sustained 3 samples

## Latest sample
```
2026-06-07T04:32:26+00:00,gpuserver1,52271,C.34113802,1,1,75,600.28,100,26571,,,,,84.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-07T04:27:54+00:00,gpuserver1,52271,C.34113802,1,1,42,19.11,0,777,,,,,66.0,coretemp_pkg,,
2026-06-07T04:28:24+00:00,gpuserver1,52271,C.34113802,1,1,46,74.66,0,9609,,,,,44.0,coretemp_pkg,,
2026-06-07T04:28:54+00:00,gpuserver1,52271,C.34113802,1,1,43,21.70,0,777,,,,,41.0,coretemp_pkg,,
2026-06-07T04:29:25+00:00,gpuserver1,52271,C.34113802,1,1,56,504.11,91,13961,,,,,73.0,coretemp_pkg,,
2026-06-07T04:29:55+00:00,gpuserver1,52271,C.34113802,1,1,44,22.68,0,9609,,,,,40.0,coretemp_pkg,,
2026-06-07T04:30:25+00:00,gpuserver1,52271,C.34113802,1,1,43,21.50,0,777,,,,,41.0,coretemp_pkg,,
2026-06-07T04:30:55+00:00,gpuserver1,52271,C.34113802,1,1,46,75.45,0,13129,,,,,72.0,coretemp_pkg,,
2026-06-07T04:31:25+00:00,gpuserver1,52271,C.34113802,1,1,63,601.15,100,26539,,,,,76.0,coretemp_pkg,,
2026-06-07T04:31:55+00:00,gpuserver1,52271,C.34113802,1,1,72,600.33,100,26603,,,,,79.0,coretemp_pkg,,
2026-06-07T04:32:26+00:00,gpuserver1,52271,C.34113802,1,1,75,600.28,100,26571,,,,,84.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

