---
type: alert
date: 2026-05-30
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-05-30T00:04:26+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 83.5C >75C sustained 3 samples

## Latest sample
```
2026-05-30T00:04:16+00:00,rtxpro6000server,97429,C.38328535,1,2,79,425.01,100,6099,70,424.98,100,5542,83.5,k10temp_tctl,1200,1560
```

## Last 10 samples
```
ts_iso,hostname,machine_id,rental_id,container_running,num_gpus,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,cpu_temp_c,cpu_temp_source,fan_zone2_rpm,fan_zone5_rpm
2026-05-30T00:00:03+00:00,rtxpro6000server,97429,C.38328535,1,2,79,425.00,100,6099,70,425.01,100,5542,83.4,k10temp_tctl,1200,1560
2026-05-30T00:00:39+00:00,rtxpro6000server,97429,C.38328535,1,2,79,424.99,100,6099,70,424.99,100,5542,83.5,k10temp_tctl,1200,1560
2026-05-30T00:01:18+00:00,rtxpro6000server,97429,C.38328535,1,2,79,424.98,100,6099,70,424.99,100,5542,83.5,k10temp_tctl,1200,1560
2026-05-30T00:01:51+00:00,rtxpro6000server,97429,C.38328535,1,2,79,405.02,100,6099,70,402.29,100,5542,83.2,k10temp_tctl,1200,1560
2026-05-30T00:02:29+00:00,rtxpro6000server,97429,C.38328535,1,2,79,425.00,100,6099,70,424.99,100,5542,83.5,k10temp_tctl,1200,1560
2026-05-30T00:03:08+00:00,rtxpro6000server,97429,C.38328535,1,2,79,424.99,100,6099,70,424.99,100,5542,83.5,k10temp_tctl,1200,1560
2026-05-30T00:03:39+00:00,rtxpro6000server,97429,C.38328535,1,2,79,424.98,100,6099,70,425.00,100,5542,83.4,k10temp_tctl,1200,1560
2026-05-30T00:04:16+00:00,rtxpro6000server,97429,C.38328535,1,2,79,425.01,100,6099,70,424.98,100,5542,83.5,k10temp_tctl,1200,1560
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

