# fleet-node-monitor

Host-**local** self-monitor for the Sartor vast.ai GPU fleet. ONE script
(`fleet-node-monitor.sh`) runs on every rental host, self-configuring from
hostname like its siblings `gpu-temp-logger.sh` and `gpu-thermal-guard.sh`.

It is the **host-local** half of the fleet-monitor rebuild (2026-05-31): each
host watches itself and writes its own row to a committed central log, instead
of a single Rocinante witness SSH-polling every box. The witness
(`scripts/fleet-watchdog.py`) keeps only what a powered-off host can't do for
itself — liveness (host-down) and config-vs-live price drift — honoring the
2026-05-28 lesson that a powered-off host cannot self-report.

## What it does (per 5-min tick)

| Layer | Source | Emitted |
|-------|--------|---------|
| Hardware | `nvidia-smi` (temp/power/util/mem/fan), `sensors`, `df /home` | `temp_max`, `power_w`, `gpu_util`, `fan_pct`, `cpu_temp`, `disk_pct` |
| Rental | vast.ai `show machines --raw` (local CLI; SSH-gpuserver1 fallback) | `rented`, `list_price`, `min_bid`, `reliability2`, `earn_hour`, `earn_day`, `error_description` |
| Stale | `docker ps -a` (C.\* containers) + `virsh list --all` (where present) | `stale_docker`, `stale_vm` |
| Power | summed GPU `power.draw` × interval + idle baseline | `est_kwh_interval` (derived, graphing-only) |
| Earn | `earn_hour` × interval | `est_earn_interval` (derived, graphing-only) |
| Health | grade of the above | `health` ∈ green/yellow/red |

Outputs per tick:

1. **Appends one NDJSON row** to `sartor/memory/fleet-log/<host>.ndjson`
   (`gpuserver1.ndjson` / `rtxserver.ndjson`) — the committed, light time-series
   spine the dashboard tails.
2. **Overwrites a heartbeat** `sartor/memory/inbox/<inbox>/_sentinel-heartbeat.json`
   — the witness reads its age to detect a stalled sentinel/sync.
3. **On yellow+**, writes a debounced inbox alert (30-min cooldown) to
   `inbox/<inbox>/alerts/`.

## What it does NOT do

- **Never** removes or kills a container or VM. Stale detection is **advisory**;
  `docker-weekly-prune.sh` (Sun 4 AM) stays the only deleter, and it never
  touches a running `C.*` (a renter's miner is **revenue**, not a breach).
- **Does not loop.** One snapshot per invocation; the systemd `.timer` provides
  the 5-min cadence (mirrors `gpu-thermal-guard`). It does not sleep.
- **Does not duplicate the P0 thermal alerter.** The 30 s
  `gpu-temp-logger.service` remains the high-resolution thermal trajectory and
  the sustained-breach P0 alerter. This is a coarse 5-min self-report.
- **Read-only** against the GPU and the renter's container/VM.

## Per-host quirks (handled by the `case $HOSTNAME` block)

| | gpuserver1 | rtxserver (`rtxpro6000server`) |
|---|---|---|
| machine_id | 52271 | 124192 |
| GPUs | 1 (RTX 5090) | 2 (RTX PRO 6000 Blackwell) |
| docker access | `docker` (alton in docker group) | `sudo -n docker` (alton **not** in group — bare `docker ps` falsely reads idle) |
| virsh | present (empty) | **absent** (probe + skip) |
| vast.ai CLI | local, authenticated | local, authenticated (verified 2026-05-31) |
| CPU sensor | `coretemp-isa-0000` / `Package id 0:` | `k10temp-pci-00c3` / `Tctl:` |
| idle baseline | 80 W | 350 W |
| inbox dir | `inbox/gpuserver1` | `inbox/rtxpro6000server` (FQ hostname) |

Two namespaces on purpose: the **central-log filename** uses the short key
(`rtxserver.ndjson`, matching the witness + dashboard spec), while the **inbox
dir** uses the canonical FQ hostname (`rtxpro6000server`, matching
`gpu-temp-logger`'s alert dir and gather_mirror's commit scope).

### vast.ai read: local-first, SSH-fallback

Both hosts currently have an authenticated `~/.local/bin/vastai`, so the script
reads its own machine row **locally** (one fewer cross-host SSH per tick, lower
latency, one fewer failure mode). If a host ever lacks a local authenticated
CLI, it falls back to SSHing gpuserver1's canonical CLI. (This is a deliberate
robustness improvement over the original spec, which hard-coded the SSH path for
rtxserver — verified that rtxserver's local CLI is authenticated and returns its
own 124192 row.) The `vastai_source` field in each row records which path was
used.

## NDJSON row schema

The canonical row contract is **`sartor/memory/fleet-log/SCHEMA.md`**. This
script emits every field that contract requires — including `source:"sentinel"`
(vs the witness's `source:"witness"` synthetic-DOWN rows) and `note` — **plus**
four additive hardware fields the dashboard may use or ignore: `fan_pct`,
`cpu_temp`, `disk_pct`, `vastai_source`. (One semantic note vs SCHEMA.md:
`gpu_util` here is the **max** across GPUs, not the mean — a more conservative
"is the box busy" signal; identical on the single-GPU gpuserver1.)

One object per line, `sartor/memory/fleet-log/<host>.ndjson`. **No cost-basis
dollars** — only live vast.ai earn/price fields (already public on vast.ai) plus
derived estimates, consistent with `fleet.yaml`'s committed posture.

```json
{
  "ts": "2026-05-31T16:46:40Z",   // UTC ISO8601
  "host": "gpuserver1",            // short key
  "machine_id": 52271,
  "rented": true,                  // current_rentals_running >= 1
  "gpu_util": 0,                   // max util % across GPUs
  "temp_max": 42,                  // max die temp C
  "fan_pct": 0,                    // max fan % across GPUs
  "power_w": 101,                  // summed GPU draw (int W) + idle baseline
  "est_kwh_interval": 0.00842,     // derived: power_w * interval_h / 1000
  "list_price": 0.8,               // $/GPU/hr listed (live)
  "min_bid": 0.65,                 // interruptible floor (live)
  "reliability2": 0.9839,
  "earn_hour": 0.1964,             // $/hr (vast.ai, public)
  "earn_day": 4.7166,              // $/day (vast.ai, public)
  "est_earn_interval": 0.01637,    // derived: earn_hour * interval_h
  "disk_pct": 44,
  "cpu_temp": 37,                  // null where unreadable
  "stale_docker": 0,               // count of dead/excess C.* containers
  "stale_vm": 0,                   // count of stale libvirt domains (0 where no virsh)
  "error_description": null,       // vast.ai delist-risk field
  "vastai_ok": true,               // false if the vast.ai read failed this tick
  "vastai_source": "local",        // "local" | "ssh:gpuserver1"
  "health": "green"                // green | yellow | red
}
```

`est_kwh_interval` and `est_earn_interval` are **derived, graphing-only**. The
accounting sources of truth are unchanged: `revenue-2026.csv` (books.py) for
revenue and `power-2026.csv` (power_ingest.py, precise kWh) for energy. This log
is the light intraday spine, ~288 rows/host/day worst case (~250 B/row →
<100 KB/host/day). Rotate yearly (`<host>-2026.ndjson`).

## Health grading

- **red** — GPU temp ≥ crit (86 C) · vast.ai `error_description` set · disk ≥ 92 %
- **yellow** — GPU temp ≥ alert (84 C) · disk ≥ 85 % · any stale artifact ·
  vast.ai read failed
- **green** — otherwise

Thresholds come from `fleet.yaml` (`monitoring.gpu_temp_alert_c` /
`gpu_temp_crit_c`). Yellow+ triggers a debounced inbox alert.

## Deploy from scratch (per host)

Cron/timer install is the **Deploy** phase, not part of the script. Per host:

```bash
cd ~/Sartor-claude-network && git pull          # or run gather_mirror.sh once
cp scripts/peer-shared/fleet-node-monitor/fleet-node-monitor.sh ~/fleet-node-monitor.sh
chmod +x ~/fleet-node-monitor.sh
cp scripts/peer-shared/fleet-node-monitor/fleet-node-monitor.service ~/.config/systemd/user/
cp scripts/peer-shared/fleet-node-monitor/fleet-node-monitor.timer   ~/.config/systemd/user/

# Validate by hand BEFORE enabling the timer:
FLEET_NODE_INTERVAL_SEC=300 ~/fleet-node-monitor.sh
tail -1 ~/Sartor-claude-network/sartor/memory/fleet-log/<host>.ndjson | jq .
cat ~/Sartor-claude-network/sartor/memory/inbox/<inbox>/_sentinel-heartbeat.json | jq .

# Enable (requires lingering so it survives logout/reboot):
loginctl enable-linger alton
systemctl --user daemon-reload
systemctl --user enable --now fleet-node-monitor.timer
systemctl --user list-timers fleet-node-monitor.timer
```

The committed central log only becomes visible on Rocinante once the upgraded
`gather_mirror.sh` commits + pushes `fleet-log/` and `inbox/<inbox>/` after its
pull (the **sync fix** — a separate build task). Without that, every host write
is a local void.

### Manual run

```bash
# One snapshot, default 300 s interval for the kWh integral:
~/fleet-node-monitor.sh
# Override the integral interval (e.g. a 60 s ad-hoc sample):
FLEET_NODE_INTERVAL_SEC=60 ~/fleet-node-monitor.sh
```

Daemon log: `~/generated/cron-logs/fleet-node-monitor.log` (one line per tick).

## Adding host N+1

Add a `case` stanza (machine_id, GPU count, docker prefix, virsh, CPU sensor
chip/label, idle baseline, inbox key), drop the three files, run once by hand,
enable the timer. Everything else is hostname-driven.
