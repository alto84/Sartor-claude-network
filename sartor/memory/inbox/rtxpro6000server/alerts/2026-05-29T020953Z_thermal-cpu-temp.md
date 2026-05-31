---
type: alert
date: 2026-05-29
from: gpu-temp-logger.sh (rtxpro6000server)
priority: P0
tags: [domain/rtxpro6000server, ops/monitoring, alert/thermal, machine/97429]
---

# Thermal threshold breach: cpu-temp

**Timestamp:** 2026-05-29T02:09:53+00:00
**Host:** rtxpro6000server (machine 97429)
**Detail:** k10temp_tctl 80.2C >75C sustained 3 samples

## Latest sample
```
2026-05-29T02:09:49+00:00,rtxpro6000server,97429,C.38328535,1,2,74,424.98,100,6017,69,424.99,99,5460,80.2,k10temp_tctl,1200,1560
```

## Last 10 samples
```
ts_iso,hostname,machine_id,rental_id,container_running,num_gpus,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,cpu_temp_c,cpu_temp_source,fan_zone2_rpm,fan_zone5_rpm
2026-05-29T02:08:02+00:00,rtxpro6000server,97429,C.38328535,1,2,55,424.99,100,6017,53,424.99,100,5460,74.9,k10temp_tctl,960,1320
2026-05-29T02:08:37+00:00,rtxpro6000server,97429,C.38328535,1,2,65,424.99,100,6017,62,424.98,100,5460,76.0,k10temp_tctl,1080,1560
2026-05-29T02:09:12+00:00,rtxpro6000server,97429,C.38328535,1,2,71,424.98,100,6017,67,424.95,99,5460,78.2,k10temp_tctl,1200,1560
2026-05-29T02:09:49+00:00,rtxpro6000server,97429,C.38328535,1,2,74,424.98,100,6017,69,424.99,99,5460,80.2,k10temp_tctl,1200,1560
```

Sustained 3 samples at ~30s cadence.
Thresholds: GPU_temp >85C / CPU_temp >75C / power >435W.

