# GPU Fleet Inventory
## Last Updated: 2026-03-31

---

## Fleet Summary

| Machine ID | Host | GPU | VRAM | Price/hr | Status | Self-Test |
|---|---|---|---|---|---|---|
| 52271 | gpuserver1 | RTX 5090 | 32GB | $0.40 | Verified/Listed | PASSING |

---

## Machine Detail: 52271

**Hardware:**
- GPU: NVIDIA RTX 5090
- VRAM: 32GB
- CPU: Intel i9-14900K
- RAM: 128GB
- OS: Ubuntu 22.04
- Host: gpuserver1 (192.168.1.100)

**Marketplace:**
- Machine ID: 52271
- Offer ID: 32099437
- Status: Verified and live
- List price: $0.40/hr
- Minimum bid: $0.25/hr
- Listing end date: 2026-08-24
- Verification: Passing

**Health Metrics (fill on each check):**
- Last health check: 2026-03-31 (SSH unavailable -- ping OK, sshd not responding to handshake)
- Uptime: UNKNOWN
- Marketplace status: UNKNOWN (last known: Verified/Listed)
- Current renter: UNKNOWN
- Utilization rate (30-day): UNKNOWN

**Earnings (fill on each check):**
- Earnings this period: UNKNOWN
- Period: UNKNOWN
- Total earnings to date: UNKNOWN
- Last payout: UNKNOWN

**Operational Notes:**
- Payout method: Stripe (configured 2026-02-26)
- Tending cron: ~/vastai-tend.sh, every 2h
- Alert file: ~/.vastai-alert
- Relist command: `vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"`

---

## Planned Expansion

| Asset | GPU | VRAM | Est. Cost | Target Date | Status |
|---|---|---|---|---|---|
| gpuserver1 upgrade | RTX PRO 6000 Blackwell x2 | 96GB x2 | ~$17,000 | TBD | Planning |

---

## Quick Commands

```bash
# Check machine and instance status
ssh alton@192.168.1.100 "~/.local/bin/vastai show machines && ~/.local/bin/vastai show instances"

# Relist if expired
ssh alton@192.168.1.100 "~/.local/bin/vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e '08/24/2026'"

# Check alert file
ssh alton@192.168.1.100 "cat ~/.vastai-alert"

# Check tending script
ssh alton@192.168.1.100 "cat ~/vastai-tend.sh"
```
