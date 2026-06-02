---
type: alert
date: 2026-06-02
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-06-02T08:37:50+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 601.81W >580W sustained 3 samples

## Latest sample
```
2026-06-02T08:37:50+00:00,gpuserver1,52271,C.34113802,1,1,76,601.81,100,26577,,,,,71.0,coretemp_pkg,,
```

## Last 10 samples
```
2026-06-02T08:33:18+00:00,gpuserver1,52271,C.34113802,1,1,41,21.26,0,779,,,,,39.0,coretemp_pkg,,
2026-06-02T08:33:49+00:00,gpuserver1,52271,C.34113802,1,1,42,21.33,0,779,,,,,38.0,coretemp_pkg,,
2026-06-02T08:34:19+00:00,gpuserver1,52271,C.34113802,1,1,42,20.79,0,779,,,,,39.0,coretemp_pkg,,
2026-06-02T08:34:49+00:00,gpuserver1,52271,C.34113802,1,1,46,74.61,0,12587,,,,,62.0,coretemp_pkg,,
2026-06-02T08:35:19+00:00,gpuserver1,52271,C.34113802,1,1,42,22.73,0,779,,,,,39.0,coretemp_pkg,,
2026-06-02T08:35:49+00:00,gpuserver1,52271,C.34113802,1,1,41,21.15,0,779,,,,,39.0,coretemp_pkg,,
2026-06-02T08:36:19+00:00,gpuserver1,52271,C.34113802,1,1,56,507.15,100,29553,,,,,72.0,coretemp_pkg,,
2026-06-02T08:36:49+00:00,gpuserver1,52271,C.34113802,1,1,70,598.12,100,26545,,,,,71.0,coretemp_pkg,,
2026-06-02T08:37:20+00:00,gpuserver1,52271,C.34113802,1,1,74,599.75,100,26673,,,,,73.0,coretemp_pkg,,
2026-06-02T08:37:50+00:00,gpuserver1,52271,C.34113802,1,1,76,601.81,100,26577,,,,,71.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

