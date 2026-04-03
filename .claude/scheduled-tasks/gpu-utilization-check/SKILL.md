---
name: scheduled-gpu-utilization-check
description: Every 4 hours quick GPU fleet utilization and listing health check
model: haiku
---

This is a scheduled task that runs every 4 hours. Keep it fast and focused.

Quick GPU fleet check — flag issues, otherwise stay silent.

Steps:
1. Run: `ssh alton@192.168.1.100 "~/.local/bin/vastai show machines"` — check listing is active and end_date has not expired.
2. Run: `ssh alton@192.168.1.100 "~/.local/bin/vastai show instances"` — check for active rentals.
3. Calculate utilization for the last 4 hours based on instance data.
4. Run: `ssh alton@192.168.1.100 "nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used --format=csv,noheader"` — check GPU health.

Output rules:
- If everything is normal (listing active, no hardware alerts, utilization >0% or market rate acceptable): write a single-line entry to data/gpu-utilization-log.csv: `{datetime},{utilization_pct},{earning_rate},{status}`
- If there is an issue (listing expired, GPU error, machine offline, utilization <20% for 2+ consecutive checks): write an alert to data/gpu-alerts.md with timestamp and description.
- Do not produce verbose output on healthy runs.
