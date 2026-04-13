---
type: project
entity: rtx6000-workstation-shopping
updated: 2026-04-11
updated_by: Claude
status: active
priority: p1
tags: [domain/business, entity/solar-inference, status/active, priority/p1]
aliases: [Blackwell Shopping List]
related: [rtx6000-workstation-build, BUSINESS, solar-inference]
---

# Dual RTX PRO 6000 Workstation -- Shopping List

Shopping list compiled 2026-04-11. All items verified in-stock and added to Newegg cart. Prices confirmed live on Newegg at time of cart loading.

## Full Parts List (Option A -- Newegg Cart)

| # | Component | Product | Qty | Unit Price | Line Total | Source | Newegg Item # | In Stock | Notes |
|---|-----------|---------|-----|-----------|------------|--------|---------------|----------|-------|
| 1 | GPU | NVIDIA RTX PRO 6000 Blackwell Workstation Edition, 96 GB GDDR7 ECC, 600W, PCIe 5.0 x16 | 2 | $9,499.99 | $18,999.98 | Newegg (direct) | N82E16814132106 | Yes | Sold and shipped by Newegg. ~$934/card over MSRP ($8,565). 3-year warranty. |
| 2 | CPU | AMD Threadripper PRO 7975WX, 32C/64T, sTR5, 350W | 1 | $3,799.99 | $3,799.99 | Newegg (direct) | N82E16819113807 | Yes | Sold and shipped by Newegg. Limit 5. |
| 3 | Motherboard | ASUS Pro WS WRX90E-SAGE SE, sTR5, EEB, 7x PCIe 5.0 x16, dual 10GbE | 1 | $1,246.99 | $1,246.99 | Newegg (direct) | N82E16813119667 | Yes | Sold and shipped by Newegg. Limit 2. |
| 4 | RAM | V-Color 256 GB (8x32 GB) DDR5-5600 CL36 OC R-DIMM ECC, Hynix A-die | 1 | $9,139.99 | $9,139.99 | Newegg (v-color official store) | 2SJ-004R-00046 | Yes | Ships from Taiwan (7-14 days). Limit 1. |
| 5 | NVMe Boot | Samsung 9100 PRO 2 TB, PCIe 5.0 x4, Gen5 | 1 | $459.95 | $459.95 | Newegg (BioStar) | N82E16820147903 | Yes | Third-party seller BioStar (4.9 rated). |
| 6 | NVMe Bulk | Samsung 990 PRO 4 TB, PCIe 4.0 x4 | 1 | $879.95 | $879.95 | Newegg (BioStar) | N82E16820147879 | Yes | Price dropped $8 from spec doc ($887.95). Historically overpriced; floor ~$280 on sale. |
| 7 | PSU | Super Flower Leadex Titanium 2200W, ATX 3.1, 2x native 12V-2x6 | 1 | $549.99 | $549.99 | Newegg (Super Flower) | 1HU-024C-000A6 | Yes | **200-240V ONLY.** Requires 240V circuit. Free Super Flower MEGACOOL 140mm fan 3-pack included. |
| 8 | Case | Phanteks Enthoo Pro 2 Server Edition, SSI-EEB, 11 PCI slots | 1 | $179.99 | $179.99 | Newegg (direct) | N82E16811854126 | Yes | $10 mail-in rebate available ($169.99 after MIR). $11.99 shipping. |
| 9 | CPU Cooler | Noctua NH-U14S TR5-SP6, 140mm air, native sTR5 mount | 1 | $150.99 | $150.99 | Newegg (ZerKorr Power) | 13C-0005-00336 | Yes | Third-party seller (4.9 rated). Pre-applied NT-H2 paste. |
| 10 | Case Fans | Arctic P14 PWM PST 140mm, 5-pack | 1 | $40.99 | $40.99 | Newegg (PlatinumMicro) | N82E16835186221 | Yes | Consider ordering two packs for 10 fans total given dual 600W GPU heat output. |

## Cart Summary

| | |
|---|---|
| **Items subtotal** | **$35,448.81** |
| Estimated shipping | $11.99 |
| **Estimated total (pre-tax)** | **$35,460.80** |
| NJ sales tax (6.625%) | ~$2,349 (if paying retail) |
| **Estimated total (with NJ tax)** | ~$37,810 |

## Budget Comparison vs Spec Doc

The spec doc priced Option A at $35,464.81 pre-tax. The cart came in at $35,448.81 -- $16 lower, primarily from the Samsung 990 PRO 4TB dropping from $887.95 to $879.95.

## Recommended Budget Path (Levers 1 + 3)

| Scenario | Pre-tax | Tax | Delivered |
|---|---|---|---|
| Option A as carted (Newegg retail) | $35,449 | ~$2,349 | ~$37,798 |
| Swap V-Color RAM for NEMIX (Amazon, est. ~$6,500-7,000) | ~$33,309-33,809 | ~$2,193-$2,240 | ~$35,500-36,050 |
| NEMIX RAM + NeweggBusiness tax exempt | ~$33,309-33,809 | $0 | ~$33,309-33,809 |

## Items NOT in Newegg Cart (Buy Separately)

| Component | Product | Est. Price | Source | Notes |
|-----------|---------|-----------|--------|-------|
| RAM (alt) | NEMIX 256 GB (8x32 GB) DDR5-5600 ECC RDIMM | ~$6,500-7,000 | Amazon B0DC8HFL68 | Saves ~$2,100-2,600 vs V-Color. Verify price in browser (Amazon blocks web fetch). |
| Thermal paste | Arctic MX-6 8g | ~$9 | Any source | Not load-bearing. Noctua includes NT-H2 pre-applied. |

## Critical Blockers Before Ordering

1. **Electrical upgrade is mandatory.** The Super Flower 2200W PSU is 200-240V ONLY. A standard US 120V outlet will not work at all. Schedule an electrician for a dedicated 240V L6-20 drop before parts arrive.
2. **NeweggBusiness account.** Apply now in Solar Inference LLC name to access tax-exempt purchasing. Allow 1-2 weeks for approval.
3. **CPA check on NJ ST-3 resale cert.** Email Jonathan Francis before using the reseller exemption.
4. **V-Color RAM ships from Taiwan.** 7-14 day shipping. If going V-Color, order first. If going NEMIX, remove V-Color from Newegg cart and order from Amazon separately.

## Open Decisions for Alton

- [ ] V-Color (Newegg, $9,140) vs NEMIX (Amazon, ~$6,500-7,000) RAM
- [ ] 7975WX 32C ($3,800) vs 7965WX 24C ($2,613) CPU
- [ ] NeweggBusiness tax-exempt path (yes/no pending CPA)
- [ ] 990 PRO 4TB now ($880) or wait for sale (historical floor ~$280)
- [ ] Second fan 5-pack for additional cooling ($41)
- [ ] 240V L6-20 or 20A/120V circuit (240V is the correct answer for this PSU)

## Cart URL

Cart is loaded at: https://secure.newegg.com/shop/cart (requires login to persist -- currently in guest cart in Chrome automation profile)

## Sources

All prices verified live on Newegg 2026-04-11 during cart loading via Chrome automation.
