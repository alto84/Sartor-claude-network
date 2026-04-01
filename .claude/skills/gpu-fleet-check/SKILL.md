---
name: gpu-fleet-check
description: GPU fleet status check covering utilization, earnings, pricing, and server health
model: sonnet
---

Run a complete GPU fleet check. Output full report to reports/daily/{date}-gpu-status.md and produce a 3-line summary for briefing use.

## SSH Connectivity Check (run first)

Before running any SSH commands, always use `-o ConnectTimeout=10`. If SSH fails:

1. **Ping first:** `ping -n 3 192.168.1.100` -- distinguishes network-down from SSH-down.
2. **If ping fails:** Server or network is down. Document as "gpuserver1 unreachable" and stop.
3. **If ping succeeds but SSH fails:** SSH daemon issue. Document the exact error:
   - `kex_exchange_identification` / `banner exchange` error: sshd is not completing the handshake. Likely sshd crashed, fail2ban block, or resource exhaustion.
   - `Connection refused`: sshd not running or wrong port.
   - `Permission denied`: Key auth failed.
   - `Connection timed out`: Firewall dropping packets (UFW rule changed, or wrong IP).
4. **In all failure cases:** Report SSH status, note last-known state from docs/gpu-fleet-inventory.md, and flag as ACTION REQUIRED with specific remediation steps.

Do not abort the report on SSH failure -- write what is known from prior data and what is unknown.

## Step 1 — Listing Status
Run: `ssh -o ConnectTimeout=10 alton@192.168.1.100 "~/.local/bin/vastai show machines"`
Note: machine ID, listing status (listed/unlisted), current ask price, min bid, end date.
Flag if end_date has expired or is within 7 days (machine becomes unrentable).

## Step 2 — Active Instances
Run: `ssh -o ConnectTimeout=10 alton@192.168.1.100 "~/.local/bin/vastai show instances"`
Note: any active rentals, start time, rate, instance type.

## Step 3 — Utilization & Earnings (Last 24h)
Run: `ssh -o ConnectTimeout=10 alton@192.168.1.100 "~/.local/bin/vastai show earnings"`
Calculate: total hours rented last 24h, effective utilization %, earnings in USD.
Flag if utilization has been below 60% for more than 6 consecutive hours.

## Step 4 — Competitive Pricing
Run: `ssh -o ConnectTimeout=10 alton@192.168.1.100 "~/.local/bin/vastai search offers --type on-demand --gpu-name RTX_5090"`
Compare current ask price to market. Note percentile position (top/middle/bottom of market).

## Step 5 — Server Health
Run: `ssh -o ConnectTimeout=10 alton@192.168.1.100 "nvidia-smi && df -h && free -h && uptime"`
Check: GPU health, disk space, memory, system uptime.
Flag any hardware alerts (GPU errors, low disk, high temp).

## Step 6 — Update Inventory
Read docs/gpu-fleet-inventory.md, update with current status, write back.

## Step 7 — Output
Save full report to: `reports/daily/{date}-gpu-status.md`

Report format:
```
# GPU Fleet Status — {date}

## Listing Status
...

## Active Instances
...

## Utilization & Earnings (24h)
- Hours rented: X / 24
- Utilization: X%
- Earnings: $X.XX

## Market Pricing
...

## Server Health
...

## Flags
- [ACTION REQUIRED items]
```

3-line briefing summary (print to stdout for morning-briefing):
```
GPU: {utilization}% utilized, ${earnings} earned (24h). Listing: {status}. {any flags or "No issues."}
```
