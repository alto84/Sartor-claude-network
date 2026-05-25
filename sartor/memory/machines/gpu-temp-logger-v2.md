---
type: reference
entity: gpu-temp-logger-v2
created: 2026-05-25
updated: 2026-05-25
updated_by: rocinante (opus 4.7, background job)
status: active
runs_on: [rtxpro6000server, gpuserver1]
tags: [meta/reference, ops/monitoring, machine/rtxpro6000server, machine/gpuserver1]
related: [machines/rtxpro6000server/CRONS, machines/gpuserver1/CRONS, machines/REGISTRY]
---

# Sartor GPU temperature trajectory logger — v2 (unified)

A single bash script that runs on **both** rtxpro6000server and gpuserver1, captures GPU + CPU + (where present) BMC fan readings every ~30 seconds during rentals AND while idle, writes a unified-schema CSV per (machine, rental, UTC date), and emits hourly markdown digests to each host's inbox. Runs as a systemd user service so it survives reboots, logouts, and one-off failures.

## Why unified

v1 had two parallel scripts (one per host) with drifted schemas, manual-launch fragility on rtxserver, and static rental-ID env vars that needed resetting between customers. v2 collapses everything into one mental model: one script, one schema, one service unit, one cron entry.

## Files (identical paths on both hosts)

| Path | Role |
|---|---|
| `/home/alton/gpu-temp-logger.sh` | The trajectory logger. Long-running. Self-configures from `$HOSTNAME`. |
| `/home/alton/gpu-temp-summary.sh` | Hourly digest. Reads the previous UTC hour's CSV rows, emits markdown. |
| `~/.config/systemd/user/gpu-temp-logger.service` | systemd user service. `Restart=always`, `MemoryMax=64M`, `CPUQuota=10%`. |
| `/home/alton/generated/cron-logs/gpu-temp-logger.log` | Daemon log (rotations, alerts, startup events). |
| `/home/alton/generated/cron-logs/gpu-temp-logger.systemd.log` | systemd stdout/stderr capture. |
| `/home/alton/generated/cron-logs/gpu-temp-summary.log` | Summary script log. |

## CSV output (unified 18-column schema)

Files at `/home/alton/generated/cron-logs/gpu-temp-trajectory-{machine_id}-{rental_id}-YYYY-MM-DD.csv`. A new file rolls automatically when (a) UTC midnight crosses, (b) a new customer connects (different `rental_id`), or (c) no customer is connected (`rental_id` → `no-rental`).

Header:
```
ts_iso,hostname,machine_id,rental_id,container_running,num_gpus,gpu0_temp_c,gpu0_power_w,gpu0_util_pct,gpu0_mem_used_mib,gpu1_temp_c,gpu1_power_w,gpu1_util_pct,gpu1_mem_used_mib,cpu_temp_c,cpu_temp_source,fan_zone2_rpm,fan_zone5_rpm
```

Fields that don't apply to a host are written as empty strings:

| Field | rtxpro6000server | gpuserver1 |
|---|---|---|
| `gpu1_*` | populated | empty (single GPU) |
| `cpu_temp_c` | AMD k10temp `Tctl:` reading | Intel coretemp `Package id 0:` reading |
| `cpu_temp_source` | `k10temp_tctl` | `coretemp_pkg` |
| `fan_zone2_rpm`, `fan_zone5_rpm` | `CHA_FAN2`, `CHA_FAN5` via ipmitool | empty (no BMC) |

## Host-specific config (auto-detected from `$HOSTNAME`)

| Setting | rtxpro6000server | gpuserver1 |
|---|---|---|
| `MACHINE_ID` | 97429 | 52271 |
| `NUM_GPUS` | 2 | 1 |
| `CPU_TEMP_SOURCE` | `k10temp_tctl` | `coretemp_pkg` |
| `HAVE_BMC` | 1 | 0 |
| `THR_GPU_TEMP_C` (sustained alert) | 85 | 85 |
| `THR_CPU_TEMP_C` (sustained alert) | 75 (Tctl is offset) | 85 (Package id 0 absolute) |
| `THR_POWER_W` (sustained alert) | 435 (425W cap + boost tolerance) | 580 (5090's 575W TDP) |

Alerts fire when a threshold is breached for `SUSTAIN_SAMPLES=3` consecutive samples (~90s). Cooldown between alerts of the same class: 900s (15 min). Alerts land at `sartor/memory/inbox/{host}/alerts/<TS>_thermal-<kind>.md`.

## Hourly digests

`gpu-temp-summary.sh` runs at minute :07 every hour via crontab (preserved from v1). Computes per-hour stats (max/avg temp + power + util, container-running fraction, fan range) and writes one markdown file per slot to `sartor/memory/inbox/{host}/_temp-summary/YYYY-MM-DD-HH.md`. These files get committed to git by `gather_mirror.sh` every 4h, so they end up in the canonical repo + on GitHub.

Crontab line (both hosts):
```
7 * * * * /home/alton/gpu-temp-summary.sh >> /home/alton/generated/cron-logs/gpu-temp-summary.log 2>&1
```

## Service

`~/.config/systemd/user/gpu-temp-logger.service`:

```ini
[Unit]
Description=Sartor GPU temperature trajectory logger (v2 unified, ~30s cadence)
After=docker.service nvidia-persistenced.service
Wants=docker.service

[Service]
Type=simple
ExecStart=/home/alton/gpu-temp-logger.sh
Restart=always
RestartSec=15
StandardOutput=append:/home/alton/generated/cron-logs/gpu-temp-logger.systemd.log
StandardError=append:/home/alton/generated/cron-logs/gpu-temp-logger.systemd.log
MemoryMax=64M
CPUQuota=10%

[Install]
WantedBy=default.target
```

Required setup per host (already done as of 2026-05-25):
- `loginctl enable-linger alton` (so the user service runs without a login session)
- `systemctl --user enable gpu-temp-logger.service`
- `systemctl --user start gpu-temp-logger.service`

## Common operations

```bash
# is it running?
systemctl --user status gpu-temp-logger.service

# tail of the most recent CSV
ls -t /home/alton/generated/cron-logs/gpu-temp-trajectory-*.csv | head -1 | xargs tail -10

# restart (idempotent)
systemctl --user restart gpu-temp-logger.service

# stop temporarily (e.g., to swap thermal paste)
systemctl --user stop gpu-temp-logger.service

# read recent daemon log
tail -50 /home/alton/generated/cron-logs/gpu-temp-logger.log

# read systemd capture
tail -50 /home/alton/generated/cron-logs/gpu-temp-logger.systemd.log
```

## Footprint

- Memory: ~700 KB resident, bounded to 64 MB by the service unit.
- CPU: ~150 ms per ~30s iteration (sensors + nvidia-smi + sudo docker ps + sudo ipmitool on rtxserver). Bounded to 10% CPU by the service unit.
- Disk: ~80 bytes/row × 2880 rows/day = ~230 KB/day per host per active rental. A full year ≈ 85 MB per host. No retention policy yet — daily files just accumulate. Tracked in `generated/cron-logs/` which is gitignored.
- Network: zero. Pure local read.

## Schema migration history

| Version | Date | Schema change |
|---|---|---|
| v1 (rtxserver) | 2026-05-22 | 13-column schema, dual-GPU + Tctl + 2 fan zones, static rental env var. Launched manually under pts/0 (fragile). |
| v1 (gpuserver1) | 2026-05-25 (~03:00 UTC) | 8-column single-GPU + coretemp variant; systemd user service. Lived for ~10 minutes before v2 replaced it. |
| **v2 (unified)** | 2026-05-25 (~03:10 UTC) | 18-column unified schema; systemd user service on both hosts; dynamic rental detection. Old day-of-rollover CSVs preserved as `*.v1.csv` in the same directory. |

## What's not in scope (yet)

- **Rocinante-side aggregation.** CSVs live on each host. To analyze across hosts you SSH and `scp` or use the hourly digests committed via gather_mirror. A future enhancement could rsync CSVs to Rocinante for offline analysis, but day-old data via the hourly digests is currently sufficient.
- **Long-horizon retention.** No prune. ~85 MB/host/year is small enough that we can defer this for years.
- **Alert routing.** Alerts land in inbox/{host}/alerts/ as P0 markdown files. The curator picks them up. There's no Slack/email/SMS escalation yet. The 15-min cooldown prevents spam if a sustained breach continues.
- **Power-cap auto-response.** The logger alerts but does not act. Operator response (e.g., dropping `nvidia-smi -pl`) is manual.

## History

- 2026-05-22: v1 deployed on rtxserver as manual bash + crontab summary, per directive `inbox/rtxpro6000server/2026-05-22-temp-logging-during-spinup.md`.
- 2026-05-25 (~02:44 UTC): v1 ported to gpuserver1 as a separate single-GPU script after the rgb_status.log 30-min resolution proved too coarse for short customer bursts.
- 2026-05-25 (~03:10 UTC): v2 unified. Single script, single schema, systemd everywhere, dynamic rental detection. The rtxserver manual bash logger (PID 701478, running since May 22) was killed and replaced with the systemd service. Old day-of-rollover CSVs preserved as `*.v1.csv`.
