---
type: vastai_state_change
host: rtxpro6000server
cron: vastai-tend.sh
written: 2026-05-21T19:00:01+00:00
previous_state: firstrun
current_state: unlisted/rented
---

# vastai state change on rtxpro6000server

- Previous: `firstrun`
- Current: `unlisted/rented`
- listed: `unlisted`
- rented: `rented`

## machines (raw)

```
[40m[97m  #  ID      #gpus  gpu_name         disk  hostname          driver      reliab[0m
[48;5;240m[97m  1  52271   1      RTX_5090         1334  gpuserver1        570.144     0.9804[0m
[40m[97m  2  124192  2      RTX_PRO_6000_WS  3351  rtxpro6000server  580.159.03  0.9437[0m

[40m[97m  #  veri        ip            geoloc          reports  gpuD_$/h  gpuI$/h[0m
[48;5;240m[97m  1  verified    100.1.100.63  New_Jersey,_US  5        0.35      0.30   [0m
[40m[97m  2  unverified  100.1.100.63  New_Jersey,_US  -        1.20      1.00   [0m

[40m[97m  #  rdisc  netu_$/TB  netd_$/TB  occup[0m
[48;5;240m[97m  1  0.00   3.00       2.00       R_   [0m
[40m[97m  2  0.40   0.00       0.00       x_x_ [0m
```

## instances (raw)

```
[40m[97m  #  ID  Machine  Status  Num  Model  Util. %  vCPUs  RAM  Storage  SSH Addr[0m

[40m[97m  #  SSH Port  $/hr  Image  Net up  Net down  R  Label  age(hours)[0m

[40m[97m  #  uptime(mins)[0m
```
