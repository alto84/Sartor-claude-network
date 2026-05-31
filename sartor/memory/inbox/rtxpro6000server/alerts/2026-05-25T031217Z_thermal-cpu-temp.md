---
type: alert
date: 2026-05-25
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-05-25T03:12:17+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 85.9C >75C sustained 3 samples

## Latest sample
```
2026-05-25T03:12:14+00:00,rtxpro6000server,97429,C.37477333,1,2,81,424.99,100,6099,73,425.01,100,5542,85.9,k10temp_tctl,1200,1560
```

## Last 10 samples
```
ts_iso,hostname,machine_id,rental_id,container_running,num_gpus,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,cpu_temp_c,cpu_temp_source,fan_zone2_rpm,fan_zone5_rpm
2026-05-25T03:11:07+00:00,rtxpro6000server,97429,C.37477333,1,2,81,424.98,100,6099,73,425.00,100,5542,86.0,k10temp_tctl,1200,1560
2026-05-25T03:11:41+00:00,rtxpro6000server,97429,C.37477333,1,2,81,425.01,100,6099,73,425.00,100,5542,85.8,k10temp_tctl,1200,1560
2026-05-25T03:12:14+00:00,rtxpro6000server,97429,C.37477333,1,2,81,424.99,100,6099,73,425.01,100,5542,85.9,k10temp_tctl,1200,1560
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

