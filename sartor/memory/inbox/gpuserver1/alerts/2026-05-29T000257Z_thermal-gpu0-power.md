---
type: alert
date: 2026-05-29
from: gpu-temp-logger.sh (gpuserver1)
priority: P0
tags: [domain/gpuserver1, ops/monitoring, alert/thermal, machine/52271]
---

# Thermal threshold breach: gpu0-power

**Timestamp:** 2026-05-29T00:02:57+00:00
**Host:** gpuserver1 (machine 52271)
**Detail:** GPU0 601.87W >580W sustained 3 samples

## Latest sample
```
2026-05-29T00:02:57+00:00,gpuserver1,52271,C.34113802,1,1,71,601.87,100,26821,,,,,71.0,coretemp_pkg,,
```

## Last 10 samples
```
ts_iso,hostname,machine_id,rental_id,container_running,num_gpus,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,cpu_temp_c,cpu_temp_source,fan_zone2_rpm,fan_zone5_rpm
2026-05-29T00:00:26+00:00,gpuserver1,52271,C.34113802,1,1,43,25.77,0,803,,,,,39.0,coretemp_pkg,,
2026-05-29T00:00:56+00:00,gpuserver1,52271,C.34113802,1,1,41,21.46,0,803,,,,,37.0,coretemp_pkg,,
2026-05-29T00:01:27+00:00,gpuserver1,52271,C.34113802,1,1,48,509.19,0,29385,,,,,40.0,coretemp_pkg,,
2026-05-29T00:01:57+00:00,gpuserver1,52271,C.34113802,1,1,68,601.03,100,26725,,,,,80.0,coretemp_pkg,,
2026-05-29T00:02:27+00:00,gpuserver1,52271,C.34113802,1,1,72,598.97,100,26693,,,,,71.0,coretemp_pkg,,
2026-05-29T00:02:57+00:00,gpuserver1,52271,C.34113802,1,1,71,601.87,100,26821,,,,,71.0,coretemp_pkg,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >85C / power >580W.

