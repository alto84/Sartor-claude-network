---
type: vastai_state_change
host: rtxpro6000server
cron: vastai-tend.sh
written: 2026-05-20T03:30:01+00:00
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
[40m[97m  #  ID     #gpus  gpu_name         disk  hostname          driver      reliab[0m
[48;5;240m[97m  1  52271  1      RTX_5090         1334  gpuserver1        570.144     0.9722[0m
[40m[97m  2  97429  2      RTX_PRO_6000_WS  3311  rtxpro6000server  580.126.09  0.9670[0m

[40m[97m  #  veri      ip            geoloc          reports  gpuD_$/h  gpuI$/h  rdisc[0m
[48;5;240m[97m  1  verified  100.1.100.63  New_Jersey,_US  5        0.35      0.30     0.00 [0m
[40m[97m  2  verified  100.1.100.63  New_Jersey,_US  -        1.20      1.00     0.40 [0m

[40m[97m  #  netu_$/TB  netd_$/TB  occup[0m
[48;5;240m[97m  1  3.00       2.00       R_   [0m
[40m[97m  2  0.00       0.00       x_x_ [0m
```

## instances (raw)

```
[40m[97m  #  ID        Machine  Status   Num  Model            Util. %  vCPUs    RAM[0m
[48;5;240m[97m  1  37112441  97429    running   2x  RTX_PRO_6000_WS  0.0      64.0   257.2[0m

[40m[97m  #  Storage  SSH Addr      SSH Port  $/hr    Image                      [0m
[48;5;240m[97m  1  40       ssh9.vast.ai  32440     3.2074  vastai/test:self-test-cu128[0m

[40m[97m  #  Net up  Net down  R     Label  age(hours)  uptime(mins)[0m
[48;5;240m[97m  1  758.2   676.9     96.7  -      0.78        -           [0m
```
