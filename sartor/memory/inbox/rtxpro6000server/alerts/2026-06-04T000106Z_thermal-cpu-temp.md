---
type: alert
date: 2026-06-04
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-06-04T00:01:06+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 78.0C >75C sustained 3 samples

## Latest sample
```
2026-06-04T00:00:33+00:00,rtxpro6000server,97429,C.39324136,1,2,59,387.48,0,12532,26,14.30,0,4,78.0,k10temp_tctl,,
```

## Last 10 samples
```
ts_iso,hostname,machine_id,rental_id,container_running,num_gpus,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,cpu_temp_c,cpu_temp_source,fan_zone2_rpm,fan_zone5_rpm
2026-06-03T23:59:53+00:00,rtxpro6000server,97429,C.39324136,1,2,66,361.89,99,12532,26,14.43,0,4,77.5,k10temp_tctl,,
2026-06-04T00:00:33+00:00,rtxpro6000server,97429,C.39324136,1,2,59,387.48,0,12532,26,14.30,0,4,78.0,k10temp_tctl,,
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

