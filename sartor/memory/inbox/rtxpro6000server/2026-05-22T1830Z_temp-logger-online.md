---
type: phone-home
date: 2026-05-22
from: rtxserver peer Claude (Opus 4.7)
to: Rocinante / Alton
priority: P2
re: 2026-05-22-temp-logging-during-spinup.md
tags: [domain/rtxserver, ops/monitoring, machine/97429, rental/C.37359460]
---

# Temp/power logger online — owns local trajectory monitoring

Directive received at `inbox/rtxpro6000server/2026-05-22-temp-logging-during-spinup.md`. Logger built, tested, launched, and writing samples every ~30s.

## Active artifacts

| Artifact | Path |
|----------|------|
| Logger script | `~/gpu-temp-logger.sh` (also staged at `sartor/memory/machines/rtxpro6000server/onboarding-staged/gpu-temp-logger.sh`) |
| Summary script | `~/gpu-temp-summary.sh` (staged copy in same dir) |
| Logger daemon log | `~/generated/cron-logs/gpu-temp-logger.log` |
| Summary daemon log | `~/generated/cron-logs/gpu-temp-summary.log` |
| **Active CSV** | `~/generated/cron-logs/gpu-temp-trajectory-97429-C.37359460-2026-05-22.csv` |
| Threshold alerts | `sartor/memory/inbox/rtxpro6000server/alerts/<timestamp>_thermal-<kind>.md` |
| Hourly summaries | `sartor/memory/inbox/rtxpro6000server/_temp-summary/YYYY-MM-DD-HH.md` |

## Example row (latest sample at write time)

```
ts_iso,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,tctl_c,fan_zone2_rpm,fan_zone5_rpm,container_running
2026-05-22T18:30:07+00:00,31,6.48,0,87026,30,12.15,0,87026,50.5,720,960,1
```

`container_running=1` confirms `C.37359460` still up. Both cards idle at ~30C with ~87GB VRAM resident (renter has the vLLM model loaded but not actively serving at this sample). Earlier in the build I caught one transient inference burst (~395W GPU0 / 405W GPU1, 100% util, 18:25:49 sample) — sustained <90s, well under the 460W alert threshold.

## Operational details

- **Cadence**: 30s. Empirically lands at ~33s/sample including nvidia-smi + sensors + ipmitool (with 8s timeout on ipmitool to prevent hangs).
- **Execution**: tmux session `gpu-temp-log` (separate from `claude-team-1`). Survives peer-Claude tmux restart. Does NOT survive reboot — rental dies on reboot anyway, so re-launch happens via peer Claude wake-up logic.
- **Hourly summary**: added to crontab — `7 * * * * /home/alton/gpu-temp-summary.sh ...`. First fire will be at `XX:07` for whatever hour completes by then.
- **Threshold alerts** (write inbox file immediately, with 15min cooldown to prevent spam):
  - GPU0/GPU1 temp > 82C sustained 3 samples (~90s)
  - GPU0/GPU1 power > 460W sustained 3 samples
  - CPU Tctl > 70C sustained 3 samples
- **Read-only**: nvidia-smi + sensors + ipmitool only. Never docker-execs into the renter container. Container_running detection uses `sudo docker ps | grep '^C\.'`.

## Why tmux not systemd-user

Considered systemd-user with linger (more robust across reboots). Chose tmux for this rental because:
1. The rental will not survive reboots regardless (rentals are tied to instance lifecycle).
2. The pre-existing peer pattern uses tmux (`claude-team-1` via sartor-claude-peer.service).
3. If this becomes a permanent fixture beyond this rental, systemd-user is the right next step. For now, the lighter solution fits the directive's "your call" framing.

## Restart instructions

If the logger dies or tmux is killed:

```bash
tmux new-session -d -s gpu-temp-log "/home/alton/gpu-temp-logger.sh"
tmux ls  # confirm 'gpu-temp-log' is present
tail -1 ~/generated/cron-logs/gpu-temp-trajectory-*.csv  # confirm fresh sample after ~30s
```

## What rtxserver did NOT touch

- Renter container `C.37359460` — not touched (no `docker exec`).
- Power cap (450W/card) — unchanged.
- BMC fan curves — unchanged.
- CRONS.md — kept noting that this doc remains in pre-deploy `status:` state from 2026-05-02 despite the four-cron suite (gather_mirror / stale-detect / vastai-tend / docker-weekly-prune) being active. Refreshing it is out of scope for this directive; flagging for next CRONS.md audit pass.

## Discoverability

Rocinante-side Claudes can find the CSV by:
- `ssh alton@rtxserver "ls -la ~/generated/cron-logs/gpu-temp-trajectory-*.csv"`
- `ssh alton@rtxserver "tail -5 ~/generated/cron-logs/gpu-temp-trajectory-97429-C.37359460-$(date -u +%Y-%m-%d).csv"`

Or wait for the next hourly summary at `_temp-summary/`.
