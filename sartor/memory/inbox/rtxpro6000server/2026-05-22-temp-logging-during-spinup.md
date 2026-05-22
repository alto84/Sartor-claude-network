---
type: inbox
to: rtxserver peer Claude
date: 2026-05-22
from: rocinante (Alton's relayed request)
priority: P1
tags: [domain/rtxserver, ops/monitoring, machine/124192]
---

# Set up temperature logging during the renter spinup

**Context:** rtxserver's first paying rental landed today. Container `C.37359460` (vastai/vllm_v0.20.1-cuda-13.0/jupyter) is Up ~1 hour, renter is spinning up a vLLM workload. GPUs currently idle at 30/29°C (model not yet loaded). Once they start serving inference, GPU power will climb toward the 450W cap per card and temps will rise. Alton wants you (the rtxserver peer Claude) to **own** this monitoring locally, not Rocinante doing it remotely.

## What Alton wants

Continuous temperature + power logging during this rental's lifetime. Specifically, capture trajectory of:
- Per-GPU temperature (both cards — note GPU 0 historically runs ~11°C hotter than GPU 1, see machines/rtxpro6000server/HARDWARE.md)
- Per-GPU power draw + utilization
- CPU Tctl (k10temp)
- BMC fan tach readings (via `ipmitool sdr type fan`) — confirms chassis airflow is responding
- Wall-clock timestamps

Logged densely enough to catch transient peaks but not so often that it floods disk. Suggested cadence: every 30 seconds.

## What's already in place

- `~/stale-detect.sh` runs hourly via cron and threshold-checks GPU temp / Tctl / BMC / disk / kaalia (writes inbox alerts on breach). That's the alarm layer. **We need the data-trajectory layer alongside it.**
- `~/sartor-rgb/` daemon updates RAM lights based on rental state every 30 min (just for context — irrelevant to this).
- Power cap is 450W per card via `nvidia-power-cap.service` (systemd, fires on boot).

## What to do

1. **Build a logger** — your call on language (bash + nvidia-smi is fine; Python if you want richer parsing). Write to `~/generated/cron-logs/gpu-temp-trajectory-{machine_id}-{rental_id}-YYYY-MM-DD.csv` (one file per rental per day; rotate at midnight UTC).
2. Columns: `ts_iso, gpu0_temp_c, gpu0_power_w, gpu0_util_pct, gpu0_mem_used_mib, gpu1_temp_c, gpu1_power_w, gpu1_util_pct, gpu1_mem_used_mib, tctl_c, fan_zone2_rpm, fan_zone5_rpm, container_running`
3. **Run it now** via `tmux new-session -d -s gpu-temp-log "<command>"` or systemd-user — your choice; document which you picked. Should survive your peer-Claude tmux session being restarted (which happens on each rtxserver boot per current sartor-claude-peer.service design).
4. **Add to your local crontab** an hourly summary writer that scans the latest CSV and emits a one-line digest to `sartor/memory/inbox/rtxpro6000server/_temp-summary/YYYY-MM-DD-HH.md` (max-temp, max-power, avg-util, fan-zone behavior). The curator will pick these up on next drain.
5. **Phone home once** when set up — commit + push to origin (rtxserver bare). Include the active CSV path + a 1-line example row in the commit message so Rocinante-side Claudes can find it.

## Constraints

- Don't touch the renter container (`C.37359460`). Read-only nvidia-smi + ipmitool are fine; never `docker exec` into the renter.
- Don't change power cap or fan curves.
- If you see any GPU hit >82°C OR Tctl >70°C OR power.draw >460W sustained: write an inbox alert IMMEDIATELY (don't wait for the hourly summary).
- Constitutional §7 — pure operational monitoring, no money movement, no external comms. Reading sensors and writing local files is fine.

## Why now (not part of the staged cron suite)

The staged cron suite at `~/cron-scripts-staged/` (per CRONS.md) was paused before listing went live. This is the moment that actual rental thermal behavior matters most — the renter is loading a vLLM model right now (GPUs currently idle but about to ramp). Get the logger going before they hit steady-state.

## Cross-references

- `sartor/memory/machines/rtxpro6000server/HARDWARE.md` — thermal envelope, GPU0/GPU1 asymmetry, single-card pathology
- `sartor/memory/machines/rtxpro6000server/BMC.md` — fan zones, ipmitool sensor commands
- `.claude/skills/rtxserver-management/SKILL.md` — full operating manual
- This rental: `C.37359460`, machine 124192, vLLM
