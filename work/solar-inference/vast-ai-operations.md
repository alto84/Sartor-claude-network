# vast.ai Operations Guide

Day-to-day operations for Solar Inference LLC's GPU rental listing on vast.ai.

## TOC
- [Machine Overview](#machine-overview)
- [Monitoring Commands](#monitoring-commands)
- [Revenue Tracking](#revenue-tracking)
- [Known Issues](#known-issues)
- [Operational Rules](#operational-rules)

---

## Machine Overview

| Field | Value |
|-------|-------|
| Platform | vast.ai |
| Account | alto84@gmail.com (Google OAuth) |
| Machine ID | 52271 |
| Offer ID | 32099437 |
| GPU | RTX 5090, 32GB VRAM |
| Listed price | $0.40/hr GPU |
| Minimum bid | $0.25/hr |
| Storage rate | $0.10/hr |
| Listing end date | 2026-08-24 (must relist before this date) |
| Verification | VERIFIED as of 2026-02-26 |
| Self-test | PASSING (fixed 2026-02-27) |
| DLPerf score | 203.2 |
| Reliability | 99.85% |
| Payout | Stripe (configured 2026-02-26) |

---

## Monitoring Commands

```bash
# Check machine listing status
ssh alton@192.168.1.100 "~/.local/bin/vastai show machines"

# Check active instances (renters)
ssh alton@192.168.1.100 "~/.local/bin/vastai show instances"

# GPU utilization
ssh alton@192.168.1.100 "nvidia-smi"

# Server disk and CPU load
ssh alton@192.168.1.100 "df -h && uptime"

# Check tending script alert log
ssh alton@192.168.1.100 "cat ~/.vastai-alert"

# Relist machine (use when listing expires or needs refresh)
ssh alton@192.168.1.100 "~/.local/bin/vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e '08/24/2026'"
```

### Tending Script
The vast.ai tending script runs every 2 hours via cron on gpuserver1:
- Script: `~/vastai-tend.sh`
- Alerts: `~/.vastai-alert`

---

## Revenue Tracking

Revenue has not yet been generated as of April 1, 2026. The machine is listed and verified but has not had renters yet.

When revenue begins:
- Earnings visible at cloud.vast.ai/earnings/
- Payout via Stripe (configured account)
- Revenue flows through Solar Inference LLC books (not personal accounts)
- Monthly Chase business card (ending 7738) statement for expenses

---

## Known Issues

### gpuserver1 SSH Issue (as of Apr 1, 2026)
- **Symptom:** SSH hangs at key exchange. Ping to 192.168.1.100 responds OK.
- **Impact:** Cannot run monitoring commands. vast.ai listing status unknown.
- **Root cause:** sshd issue -- not a network problem.
- **Resolution:** Requires physical or OOB access to restart sshd. Or wait for Alton to address after India trip.

### Hairpin NAT (resolved)
Fios router cannot route LAN traffic through its own public IP. Fixed with:
- iptables OUTPUT DNAT rule (100.1.100.63 -> 192.168.1.100) in /etc/ufw/before.rules nat table
- DOCKER-USER chain with conntrack --ctorigdstport 40000:40099 rule in /etc/ufw/after.rules

### UPnP
Fios router UPnP mappings do not persist. Do not rely on UPnP. Use DMZ + UFW pattern.

---

## Operational Rules

- Never modify the vast.ai listing price without explicit confirmation from Alton.
- Never delist the machine without explicit confirmation.
- Alert if machine goes offline or listing expires.
- Alert if utilization drops below 60% for more than 6 consecutive hours (when SSH is functional).
- Do not store or output vast.ai API keys, SSH credentials, or billing information.
- All financial transactions flow through Solar Inference LLC books.
