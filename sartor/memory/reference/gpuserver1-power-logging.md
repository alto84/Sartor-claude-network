---
type: reference
entity: gpuserver1-power
updated: 2026-04-11
status: active
---

# gpuserver1 Power Logging

Lightweight always-on energy logger on gpuserver1 that captures CPU package
(Intel RAPL) and GPU (nvidia-smi) energy over time, integrates it, and
produces daily kWh + USD cost summaries delivered through the curator inbox.

Installed 2026-04-11. Lives entirely under `/home/alton/sartor-power/` and is
decoupled from `sartor-monitoring` (Claude Code health sweep) and
`vastai-tend.sh`.

## Sensor coverage

| Sensor | Availability | Resolution | Accuracy | Covers |
|---|---|---|---|---|
| Intel RAPL `intel-rapl:0` (package-0) | Yes | Free-running microjoule counter, diffed each poll | Meter-grade for CPU package (±1-2 %) | i9-14900K cores + uncore + iGPU inside package boundary |
| Intel RAPL DRAM subdomain | **Not exposed** on this Z790 consumer board / 14900K combo | n/a | n/a | DRAM energy (absent) |
| Intel RAPL PSYS | **Not exposed** | n/a | n/a | Whole-SoC domain (absent) |
| nvidia-smi `power.draw` | Yes (driver 570.144) | ~1 s averaged instantaneous | ±5 W per board | RTX 5090 board total (GPU + VRAM + VRMs on card) |
| nvidia-smi `total_energy_consumption` | **Not supported** on RTX 5090 / driver 570 | n/a | n/a | Would be a counter; we integrate `power.draw` instead |
| lm-sensors | Installed, but only temperatures (no VRM wattage on this board) | n/a | n/a | coretemp, NVMe temp, ACPI |
| IPMI / BMC | Not present (consumer ASUS Z790 GAMING WIFI7) | n/a | n/a | nothing |
| USB PSU telemetry (Corsair AXi/HXi, etc.) | No such devices (only Aura LED controller, HID, etc.) | n/a | n/a | nothing |
| NVMe `smartctl` power state | Available but not integrated (tiny contribution) | n/a | n/a | drive power state transitions |

### What is NOT measured

- PSU AC→DC conversion loss (typically 10-15 % on 80+ Gold class)
- Motherboard VRM losses outside the CPU package boundary
- Chipset, SATA controllers, USB controllers
- System fans, AIO pump
- NVMe idle + active draw (~2-5 W)
- Peripherals (keyboard, mouse, wifi/BT)
- Any attached monitor

## Total-system estimate formula

```
estimated_total_watts = (cpu_package_watts + gpu_watts + dram_watts) * 1.15 + 25
```

- The 1.15 multiplier accounts for PSU loss + VRM loss + chipset overhead
  that scales roughly with load.
- The 25 W baseline is a rule-of-thumb static draw (fans, idle NVMe, wifi,
  chipset) for a workstation-class consumer box.
- Uncertainty: **call it ±15 %**. This is an engineering estimate, not a
  meter reading. For ground truth install a wall-plug meter (see below).
- Known bias: **RAPL can undercount** heavy AVX-512 / AMX workloads by 5-10 %.

## File layout

```
/home/alton/sartor-power/
├── bin/
│   ├── power_logger.py       # stdlib-only; --daemon mode runs a 10 s loop
│   └── daily_summary.py      # runs daily at 23:55 via cron
├── data/
│   └── YYYY-MM-DD.tsv        # one row per poll, ~8,640 rows/day
├── logs/
│   ├── service.log           # systemd stdout/stderr
│   ├── error.log             # daemon-loop exceptions
│   └── daily_summary.log     # cron output
├── state.json                # previous-poll state (for counter diffing)
└── power_logger.lock         # flock file
```

### Service

`/etc/systemd/system/sartor-power-logger.service` runs
`python3 power_logger.py --daemon` as user `alton`, 10 s poll, `Restart=on-failure`.

### Cron

```
55 23 * * * /usr/bin/python3 /home/alton/sartor-power/bin/daily_summary.py >> /home/alton/sartor-power/logs/daily_summary.log 2>&1
```

### udev (persistent RAPL read perms)

`/etc/udev/rules.d/99-sartor-rapl.rules` opens `powercap/intel-rapl/*/energy_uj`
to group `other` so `alton` can read without sudo across reboots.

## TSV schema

One row per poll. Columns:

1. `timestamp_iso`
2. `cpu_package_joules_cumulative` — RAPL counter in joules
3. `cpu_package_watts_interval` — diffed against previous sample
4. `dram_joules_cumulative` — empty on this box (no DRAM domain)
5. `dram_watts_interval` — empty on this box
6. `gpu_joules_cumulative` — integrated from `power.draw` (starts at 0 per run)
7. `gpu_watts_instantaneous` — from `power.draw.instant`
8. `gpu_watts_interval` — current `power.draw` (already averaged)
9. `estimated_total_watts` — the 1.15 × + 25 W formula

First row of each invocation series has empty interval columns (no prior sample
to diff). Counter rollover is handled via `max_energy_range_uj`.

## Using the data

### Live tail

```bash
tail -f /home/alton/sartor-power/data/$(date +%F).tsv
```

### Current draw (last row)

```bash
awk -F'\t' 'NR>1{print}' /home/alton/sartor-power/data/$(date +%F).tsv | tail -1
```

### kWh between two timestamps (awk one-liner)

```bash
awk -F'\t' -v T1="2026-04-11T08:00:00+00:00" -v T2="2026-04-11T18:00:00+00:00" '
NR==1{for(i=1;i<=NF;i++) h[$i]=i; next}
$h["timestamp_iso"]>=T1 && $h["timestamp_iso"]<=T2 && $h["estimated_total_watts"]!="" {
  if (prev_ts) {
    cmd="date -d \""$h["timestamp_iso"]"\" +%s"; cmd | getline cur; close(cmd)
    dt=cur-prev_sec; if (dt>0 && dt<600) J+=$h["estimated_total_watts"]*dt
  }
  prev_ts=$h["timestamp_iso"]
  cmd="date -d \""prev_ts"\" +%s"; cmd | getline prev_sec; close(cmd)
}
END {printf "kWh=%.4f  cost=$%.3f\n", J/3.6e6, (J/3.6e6)*0.1789}
' /home/alton/sartor-power/data/2026-04-11.tsv
```

Or trivially in Python if awk gymnastics bother you.

## Temporarily disable

```bash
sudo systemctl stop sartor-power-logger
sudo systemctl disable sartor-power-logger
# data files stay intact
```

Re-enable:

```bash
sudo systemctl enable --now sartor-power-logger
```

## Ground-truth wall-plug meter (recommendation)

All of the above is an OS-level estimate. For a real ±2 % whole-wall reading:

- **Kasa KP125M** (~$20) — TP-Link smart plug with local HTTP API (via
  `python-kasa`); 15 A; logs to wifi; easy to ingest.
- **Shelly Plus Plug S / Plus PM** (~$25-30) — local MQTT + HTTP API,
  excellent community support; my pick if you have Home Assistant.
- **Emporia Vue 2** (~$130) — whole-panel CT clamps; overkill if you just
  want the one machine, perfect if you want the whole house.

Any of the first two would plug between the PSU and the wall and give you a
second data stream you can diff against `estimated_total_watts` to calibrate
the 1.15 × + 25 W formula for this specific machine.

## Known limits

- RAPL undercount on heavy AVX-512 workloads.
- `nvidia-smi power.draw` is a ~1 s averaged reading, so bursts shorter than
  the poll interval (10 s) may be missed in the integrated joules.
- GPU cumulative joules reset to 0 on service restart (it is integrated, not
  read from a free-running counter).
- DRAM and PSYS RAPL domains are not exposed on this ASUS Z790 GAMING WIFI7 /
  i9-14900K combo; DRAM columns will always be empty.
- Consumer board has no IPMI/BMC and no PSU USB telemetry.

## Coordination with sibling systems

- `sartor-monitoring` (`/home/alton/sartor-monitoring/`): Claude Code health
  sweep, cron `0 */2 * * *`. **Untouched by sartor-power.**
- `vastai-tend.sh`: untouched.
- `sartor-power` uses its own directory, its own systemd service, its own
  cron entry, its own lockfile. Can be stopped, removed, or reinstalled
  without affecting the other two.
