# Solar Inference LLC — Agent Skill Guide

## Entity Overview
- **Name:** Solar Inference LLC
- **Type:** NJ Multi-Member LLC
- **Members:** Alton 50%, Aneeta 50%
- **EIN:** 39-4199284
- **Business model:** Solar-powered GPU inference. The LLC's solar roof generates electricity used to power a GPU rig that rents compute on vast.ai.

---

## Infrastructure

### GPU Server (gpuserver1)
- **Host:** 192.168.1.100
- **SSH:** `ssh alton@192.168.1.100`
- **Specs:** RTX 5090 32GB, 128GB RAM, Ubuntu 22.04
- **vastai CLI:** `~/.local/bin/vastai`

### vast.ai Listing
- **Machine ID:** 52271
- **Offer ID:** 32099437
- **GPU:** RTX 5090 32GB
- **Price:** $0.40/hr GPU, $0.25 min bid
- **Status:** Verified, Stripe payout configured
- **Listing end date:** 2026-08-24
- **Relist command:** `vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"`

### Solar Roof
- **Address:** 85 Stonebridge Rd, Montclair NJ
- **Contractor:** Lucent Energy — Doug Paige, VP Sales, 843.422.8236
- **System:** 22.10 kW, 307 Tesla Solar Roof tiles, 3 inverters, no battery
- **Financing:** First Climate, $438,829, 366 months, 8%
- **Contractual completion:** ~May 2026
- **ITC deadline:** Must be in service before July 4, 2026

### Banking
- **Chase business card:** ending 7738, $6K limit

---

## Tax Benefits (2025 tax year, Solar Roof)
| Benefit | Amount |
|---|---|
| Federal ITC (30%) | ~$131,649 |
| 100% OBBB Bonus Depreciation | ~$373,005 |
| NJ SuSI | ~$24,447 |

**Critical:** All benefits require the solar roof to be "in service" before July 4, 2026.

---

## Key Monitoring Commands

```bash
# Check vast.ai machine status
ssh alton@192.168.1.100 "~/.local/bin/vastai show machines"

# Check active instances (renters)
ssh alton@192.168.1.100 "~/.local/bin/vastai show instances"

# GPU utilization
ssh alton@192.168.1.100 "nvidia-smi"

# Server disk/CPU
ssh alton@192.168.1.100 "df -h && uptime"

# Tending alert log
ssh alton@192.168.1.100 "cat ~/.vastai-alert"

# Relist if needed
ssh alton@192.168.1.100 "~/.local/bin/vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e '08/24/2026'"
```

---

## Expansion Consideration
Dual RTX PRO 6000 Blackwell (~$17K) is being evaluated as a potential upgrade/expansion.

---

## Agent Guidance

### What to check during a status review
1. Is gpuserver1 reachable via SSH?
2. Is Machine 52271 listed and verified on vast.ai?
3. Are there active renters? Any earnings?
4. Is the listing end date still valid (not expired)?
5. Any alerts in `~/.vastai-alert`?
6. Solar roof: has Lucent Energy provided any updates?

### What to report
- SSH connectivity status
- vast.ai machine and offer status
- Active instances and estimated earnings
- Any errors or alerts

### What requires human confirmation before acting
- Changing the listing price
- Delisting the machine
- Any purchases or financial commitments (expansion hardware)
- Replying to Lucent Energy or contractors on Alton's behalf
- Any changes to the Stripe payout configuration
