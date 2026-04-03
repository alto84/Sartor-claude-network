# Solar Inference LLC — Business Plan
## Last Updated: 2026-03-31

---

## Business Model

Solar Inference LLC provides GPU inference compute on the vast.ai marketplace. The core thesis is solar-powered GPU hosting: offset electricity costs with on-site solar generation, price competitively in the GPU rental market, and scale hardware as revenue supports it.

---

## Infrastructure

### Solar Generation
- System: Tesla Solar Roof, 22.10 kW capacity, 307 tiles
- Installer: Lucent Energy
- Financing: First Climate, 366 months, 8% interest, total $438,829
- Expected output: ~28,000 kWh/year (NJ average insolation)
- Goal: Net-zero or net-positive electricity for GPU workloads

### Current Hardware (gpuserver1)
- CPU: Intel i9-14900K
- RAM: 128GB DDR5
- GPU: RTX 5090 (32GB VRAM, Blackwell architecture)
- Storage: 1.8TB NVMe (100GB root + 1.7TB Docker)
- OS: Ubuntu 22.04

### Expansion Target
- Next: Dual RTX PRO 6000 Blackwell (~$17,000 for the pair)
- Rationale: Blackwell architecture preferred by ML training workloads; 96GB VRAM enables larger models
- Timing: After solar is in service and revenue baseline is established

---

## Revenue Model

### vast.ai Marketplace
- Machine 52271 listed at $0.40/hr GPU
- Minimum bid: $0.25/hr
- Verification status: Verified, self-test passing
- Availability: 24/7 unless rented by Alton for internal use

### Revenue Projections (Framework)
At $0.40/hr with 100% utilization: ~$292/month per GPU
At 50% utilization: ~$146/month per GPU
At 30% utilization: ~$88/month per GPU

Actual utilization depends on market demand, pricing competitiveness, and uptime.

Break-even analysis requires:
- Monthly electricity cost (offset by solar)
- Hardware amortization schedule
- LLC operating costs (hosting, software, accounting)

---

## Tax Strategy

### Solar Investment Tax Credit (ITC)
- Credit: 30% of qualified solar installation cost
- Amount: ~$131,649 (30% of $438,829)
- Trigger: System must be placed in service before July 4, 2026 (OBBB deadline)

### Bonus Depreciation
- Rate: 100% under OBBB provisions
- Amount: ~$373,005
- Applies to: Solar Roof hardware, GPU hardware (Section 179 or bonus dep.)
- Strategy: Fully depreciate hardware in year placed in service

### NJ SuSI Program
- Estimated credit: ~$24,447
- State-level solar incentive, separate from federal ITC

### K-1 Flow-Through
- LLC taxed as partnership
- Losses/credits flow to Alton and Aneeta's personal returns (50/50)
- CPA: Jonathan Francis, Francis & Company, (914) 488-5727

---

## Depreciation Schedule (Template)

| Asset | Cost | Date In Service | Method | Year 1 Deduction |
|---|---|---|---|---|
| Tesla Solar Roof | $438,829 | TBD (target pre-July 4, 2026) | Bonus Dep. | ~$373,005 |
| Newegg hardware | $1,459.60 | 2025 | Bonus Dep. / Sec. 179 | $1,459.60 |
| RTX PRO 6000 x2 | ~$17,000 | TBD | Bonus Dep. / Sec. 179 | ~$17,000 |

---

## Operational Monitoring

- Tending script: ~/vastai-tend.sh runs every 2 hours via cron on gpuserver1
- Alerts: ~/.vastai-alert file on gpuserver1
- Quick status: `ssh alton@192.168.1.100 "~/.local/bin/vastai show machines && ~/.local/bin/vastai show instances"`
- Relist command: `vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"`

---

## Key Risks

- Listing end date expiry makes machine unlisted — must relist with new date
- payout method must be configured before offers can be created (silent failure)
- Hairpin NAT blocks self-test from LAN; fix in /etc/ufw/before.rules
- Solar in-service date is a hard deadline for ITC eligibility
- vast.ai market pricing is competitive; may need to adjust $0.40/hr
