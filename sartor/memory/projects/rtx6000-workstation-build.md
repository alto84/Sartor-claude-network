---
type: project
entity: rtx6000-workstation
updated: 2026-04-11
updated_by: Claude
status: active
priority: p1
tags: [domain/business, entity/solar-inference, status/active, priority/p1]
aliases: [Dual RTX 6000 Build, Blackwell Workstation, Workstation #2]
related: [BUSINESS, solar-inference, MACHINES]
---

# Dual RTX PRO 6000 Blackwell Workstation Build

Weekend-review parts list for Solar Inference LLC's second compute rig. Two NVIDIA RTX PRO 6000 Blackwell Workstation cards (96 GB GDDR7 ECC each), 256 GB DDR5 ECC, Threadripper PRO on WRX90, targeted at ~$35K pre-tax delivered. Intended uses: private AI/ML inference and training, plus incremental vast.ai income beyond gpuserver1 (RTX 5090). Section 179 eligible as a Solar Inference LLC asset. Target order window: April-May 2026, contingent on electrical and NeweggBusiness setup.

> [!warning] Budget does not fit cleanly
> At current Newegg prices, the full-power Option A lands at **$35,464.81 pre-tax / ~$37,814 delivered with NJ sales tax**. That is ~$2,800 over the $35K delivered ceiling. See Budget Reconciliation for the three savings paths. The cleanest single lever is the NEMIX RAM swap (~$2,100 saved, off-Newegg).

> [!blocker] Electrical work required before power-on
> Peak wall draw is ~1,860 W. A standard 15 A / 120 V office outlet (1,440 W continuous per NEC) **cannot safely run this machine**. Alton needs either a dedicated 20 A circuit or a 240 V drop (L6-20) before the box can be turned on. Schedule the electrician before the parts arrive.

## Summary

| | |
|---|---|
| Target use | Private AI/ML + incremental vast.ai income (Solar Inference LLC) |
| Total VRAM | 192 GB GDDR7 ECC (2x 96 GB) |
| System RAM | 256 GB DDR5-5600 ECC RDIMM (8-channel) |
| NVMe storage | 6 TB (2 TB Gen5 boot + 4 TB Gen4 bulk) |
| CPU | Threadripper PRO 7975WX (32C/64T, 350 W) |
| PSU | Super Flower Leadex Titanium 2200 W (ATX 3.1) |
| Peak wall draw (est.) | ~1,860 W at full tilt |
| Pre-tax subtotal (Option A) | **$35,464.81** |
| Pre-tax subtotal (Option B Max-Q, est.) | See notes -- Max-Q currently priced higher at Newegg |
| Budget target | ~$35,000 pre-tax delivered |
| Order window | April-May 2026 |
| Tax treatment | Section 179 capital expense, Solar Inference LLC |

## Option A: Full-power Workstation Build

All prices verified against live Newegg listings on 2026-04-10 and 2026-04-11. Unit prices match the prior-session research. "Seller" indicates Newegg direct vs. top marketplace seller.

| Component | Part | Price | Link | Notes |
|---|---|---|---|---|
| GPU (x2) | NVIDIA RTX PRO 6000 Blackwell Workstation Edition, 96 GB GDDR7 ECC, 600 W, PCIe 5.0 x16, dual-slot | $9,499.99 each = **$18,999.98** | [Newegg N82E16814132106](https://www.newegg.com/nvidia-blackwell-rtx-pro-6000-96gb-graphic-card/p/N82E16814132106) | Sold and shipped by Newegg. In stock. 3-year warranty. ~$934 over MSRP ($8,565). |
| CPU | AMD Ryzen Threadripper PRO 7975WX, 32C/64T, 4.0 GHz base, sTR5, 350 W | $3,799.99 | [Newegg N82E16819113807](https://www.newegg.com/amd-threadripper-pro-7975wx-350w-sp6-ryzen-threadripper-7000-series/p/N82E16819113807) | Sold and shipped by Newegg. In stock. Limit 5 per customer. |
| Motherboard | ASUS Pro WS WRX90E-SAGE SE, sTR5, EEB, 8x DDR5 RDIMM, 7x PCIe 5.0 x16, 4x M.2 Gen5, dual 10 GbE | $1,246.99 | [Newegg N82E16813119667](https://www.newegg.com/asus-pro-ws-wrx90e-sage-se-eeb-motherboard-amd-wrx90-str5/p/N82E16813119667) | Sold and shipped by Newegg. In stock. IPMI via separate ASMB11-iKVM module (~$150, optional). |
| RAM | V-Color 256 GB (8x 32 GB) DDR5-5600 CL36 OC R-DIMM ECC, Hynix A-die, WRX90-validated | $9,139.99 | [Newegg 2SJ-004R-00046](https://www.newegg.com/v-color-256gb/p/2SJ-004R-00046) | v-color official store. Ships from Taiwan (7-14 days). Fills all 8 channels. |
| NVMe boot (Gen5) | Samsung 9100 PRO 2 TB, PCIe 5.0 x4, 14,700 MB/s read | $459.95 | [Newegg N82E16820147903](https://www.newegg.com/samsung-2tb-9100-pro-nvme-2-0/p/N82E16820147903) | Sold by BioStar (4.9 top-rated). Ships from US. Verify M.2 heatsink fit under ASUS cover. |
| NVMe bulk (Gen4) | Samsung 990 PRO 4 TB, PCIe 4.0 x4, 7,450 MB/s | $887.95 | [Newegg N82E16820147879](https://www.newegg.com/samsung-4tb-990-pro-nvme-2-0/p/N82E16820147879) | Sold by BioStar. Historically overpriced (was ~$280 on sale). Consider waiting for a sale or substituting WD Black SN850X 4 TB. |
| PSU | Super Flower Leadex Titanium 2200 W, ATX 3.1, 2x native 12V-2x6, full modular, 10-yr warranty | $549.99 | [Newegg 1HU-024C-000A6](https://www.newegg.com/super-flower-leadex-platinum-atx3-1-atx3-0-compatible-2200w-cybenetics-platinum-power-supplies/p/1HU-024C-000A6) | Shipped by Newegg. 61 in stock. Was $749, currently $549. 2x native 12V-2x6 = one per GPU. |
| Case | Phanteks Enthoo Pro 2 Server Edition, SSI-EEB, 11 PCI slots, 15 fan positions | $179.99 | [Newegg N82E16811854126](https://www.newegg.com/phanteks-full-tower-enthoo-pro-2-server-edition-steel-chassis-computer-case-black-ph-es620pc-bk02/p/N82E16811854126) | Sold and shipped by Newegg. $10 MIR available. Only Newegg-direct case that cleanly fits WRX90E-SAGE SE (EEB). |
| CPU cooler | Noctua NH-U14S TR5-SP6 (140 mm air cooler, native sTR5/SP6 mount) | $150.99 | [Newegg 13C-0005-00336](https://www.newegg.com/noctua-nh-u14s-tr5-sp6/p/13C-0005-00336) | Sold by ZerKorr Power (4.9). Air cooler avoids AIO pump-failure risk on a forever rig. Rated for 350 W TDP. |
| Case fans | Arctic P14 PWM PST 140 mm, 5-pack | $40.99 | [Newegg N82E16835186221](https://www.newegg.com/arctic-cooling-acfan00125a-case-fan/p/N82E16835186221) | Sold by PlatinumMicro. Consider two packs (10 fans) for dual 600 W GPU dumping heat into the chassis. |
| Thermal paste | Arctic MX-6 8g (est.) | $9.00 | VERIFY | Any reputable paste. Not a load-bearing item. |
| **Option A pre-tax subtotal** | | **$35,464.81** | | |
| NJ sales tax 6.625% (Newegg only, no reseller cert) | | $2,349.55 | | Avoidable via NeweggBusiness reseller path; see Budget Reconciliation. |
| **Option A delivered (retail, with tax)** | | **$37,814.36** | | ~$2,814 over $35K ceiling |

## Option B: Max-Q Variant

The RTX PRO 6000 Blackwell Max-Q is the same 96 GB silicon capped at 300 W TDP (half the power) with active cooling. In theory the right call for a home office: eliminates the electrical upgrade, halves GPU wall draw, makes thermals trivial, and gives up roughly 15% on compute-bound workloads. In practice, on Newegg today the Max-Q is **more expensive** than the full-power Workstation card because only a third-party marketplace seller stocks it.

| Component | Part | Price | Link | Notes |
|---|---|---|---|---|
| GPU (x2) | NVIDIA RTX PRO 6000 Blackwell Max-Q, 96 GB GDDR7 ECC, 300 W, dual-slot, active cooling | $11,789.00 each (x2 = $23,578.00) | [Newegg N82E16814132105](https://www.newegg.com/nvidia-900-5g153-2200-000-rtx-pro-6000-96gb-graphics-card/p/N82E16814132105) | Sold by High Performance Tech (4.4, 7 ratings). Third-party only on Newegg. **Premium of ~$2,289 per card vs. the Workstation Edition.** |
| Everything else | Same as Option A except PSU can drop to 1600 W | Save ~$100 on PSU (Seasonic PRIME TX-1600 ATX 3.1, ~$450 est. -- VERIFY pricing) | n/a | Drops wall draw to roughly ~1,260 W -- comfortably inside a standard 20 A / 120 V circuit. |
| **Delta vs. Option A** | | **GPU line +$4,578.02; PSU -$100; ~+$4,478 net** | | Max-Q is a loss at retail today. |
| **Option B pre-tax subtotal (est.)** | | **~$39,940** | | Far over budget unless Max-Q street price drops or Newegg direct stocks it. |

> [!note] Revisit Max-Q only if the Workstation Edition sells out
> The Max-Q thermal and electrical story is clearly better for a home office. If Newegg-direct restocks the Max-Q at MSRP (~$9,500) or below, Option B becomes the default pick. At today's $11,789 third-party listing, Option A is the correct call on dollars per usable compute. Set a deal alert.

## Budget Reconciliation

Option A pre-tax: **$35,464.81**. Target delivered ceiling: **$35,000**. Gap at retail with NJ tax: **~$2,814 over**.

The three levers that bring the build inside budget:

### Lever 1: NEMIX RAM swap (off-Newegg)

Replace the V-Color 256 GB Newegg kit ($9,139.99) with the **NEMIX RAM 256 GB (8x 32 GB) DDR5-5600 ECC RDIMM kit from Amazon**, which prior research priced at roughly **$6,500-$7,000**. Savings: **~$2,100-$2,600**. The NEMIX kit is validated on ASRock WRX90 WS EVO and ships from a US warehouse (faster than V-Color from Taiwan). Lifetime replacement warranty.

- Amazon SKU (8x32 GB for WRX90): [NEMIX B0DC8HFL68](https://www.amazon.com/NEMIX-RAM-Registered-Compatible-Motherboard/dp/B0DC8HFL68) VERIFY -- Amazon does not expose static pricing to web fetch; confirm current price in browser before ordering.
- Alternate SKU variant: [NEMIX B0GSRXNPGW (2Rx4 version)](https://www.amazon.com/Registered-NEMIX-RAM-Compatible-Motherboard/dp/B0GSRXNPGW) VERIFY

**Impact:** Option A pre-tax drops to ~$33,365, delivered (with NJ tax on the non-NEMIX portion) ~$35,000. **This single swap largely solves the budget problem.**

### Lever 2: Step down to 7965WX 24-core

Replace Threadripper PRO 7975WX ($3,799.99) with **Threadripper PRO 7965WX 24C/48T** ($2,612.99 live, sold by 3C Tech Mart on Newegg marketplace -- not Newegg direct). Savings: **$1,187.00**. Same 350 W TDP, same 8-channel DDR5, same PCIe 5.0 lane count, same sTR5 socket. For AI/ML workloads where the GPUs are the bottleneck, 24 cores is plenty.

- [Newegg N82E16819113805](https://www.newegg.com/amd-ryzen-threadripper-7000-series-ryzen-threadripper-pro-7965wx-storm-peak-socket-str5-desktop-cpu-processor/p/N82E16819113805) -- marketplace seller, not Newegg direct. Confirm warranty and return path before ordering.

**Impact:** Stacks with Lever 1. Combined savings ~$3,300-$3,800.

### Lever 3: NeweggBusiness + Solar Inference LLC reseller certificate

Open a **NeweggBusiness** account in the name of Solar Inference LLC and submit an NJ ST-3 resale certificate. If accepted, NJ sales tax (6.625%) is waived on the full order -- this is the legal basis for a reseller exemption when the LLC acquires hardware that will generate rental revenue on vast.ai. Savings on the full Option A build: **$2,349.55**. Net-30 terms are the other benefit (buys a month of float against the credit card).

- Portal: [NeweggBusiness](https://www.neweggbusiness.com/) (apply, then submit NJ ST-3 resale cert to tax-exempt desk)
- NJ ST-3 form: [New Jersey ST-3 Resale Certificate](https://www.state.nj.us/treasury/taxation/pdf/other_forms/sales/st3.pdf)

> [!decision] CPA check before using the reseller cert
> Using a resale certificate for GPU hardware that is partly used for Alton's own workloads and partly rented on vast.ai is a defensible but interpretive tax position. **Run this by Jonathan Francis (jf@francis-cpa.com) before filing ST-3.** The cleanest framing is that the machine is rental equipment whose services are resold to vast.ai customers. If the CPA does not bless this, fall back to paying NJ tax as a normal business expense (still deductible, just not avoided up front).

### Combined scenarios

| Scenario | Pre-tax | NJ tax | Delivered | vs. $35K |
|---|---|---|---|---|
| Option A retail, no levers | $35,464.81 | $2,349.55 | $37,814.36 | +$2,814 over |
| Option A + Lever 1 (NEMIX RAM) | ~$33,365 | ~$2,210 | ~$35,575 | +$575 over |
| Option A + Lever 1 + Lever 3 (NEMIX + NeweggBusiness tax exempt) | ~$33,365 | $0 | ~$33,365 | **$1,635 under** |
| Option A + Lever 1 + Lever 2 + Lever 3 | ~$32,180 | $0 | ~$32,180 | **$2,820 under** |
| Option A + Lever 3 only (tax exempt) | $35,464.81 | $0 | $35,464.81 | +$465 over |

**Recommended path:** Levers 1 and 3 together. Keeps the 7975WX (more headroom on CPU-side data prep for 4-6 year horizon), buys the cheaper NEMIX kit, routes through NeweggBusiness with tax exemption. Delivered target ~$33,400.

## Electrical and Facility Warnings

> [!blocker] Do not power this machine on until the electrical upgrade is done
> Standard 15 A / 120 V US outlets are continuous-rated at 1,440 W per NEC (80% of 15 A * 120 V). Peak wall draw on this build is **~1,860 W**. A 15 A circuit will trip on sustained load, and transient GPU spikes (Blackwell can hit 1.5x TDP for milliseconds) will trip breakers during training startup.

### Peak wattage breakdown

| Component | Draw |
|---|---|
| 2x RTX PRO 6000 Blackwell Workstation @ 600 W | 1,200 W |
| Threadripper PRO 7975WX (PPT) | 350 W |
| Motherboard + VRM + chipset | ~80 W |
| 256 GB DDR5 RDIMM (8x ~7.5 W) | ~60 W |
| 3x NVMe SSDs | ~25 W |
| 5-10 case fans + air cooler | ~15 W |
| USB peripherals, BMC, misc | ~20 W |
| **Sustained peak load** | **~1,750 W** |
| 80+ Titanium @ ~94% efficiency | Wall draw ~1,862 W |

### Two acceptable electrical solutions

1. **Dedicated 20 A / 120 V circuit** (1,920 W continuous per NEC 80% rule). Borderline but workable for sustained training, assuming no other load on the circuit. Risk: transient spikes during multi-GPU startup may still trip the breaker.
2. **Dedicated 240 V drop with an L6-20 outlet**. The Leadex Titanium 2200W is rated for full output on 200-240 VAC, and running on 240 V actually improves PSU efficiency. This is what serious workstation and HPC setups use. Strongly preferred for a forever rig.

### Thermal and noise considerations

- Two 600 W axial GPUs dump ~1,200 W of heat directly into the case. The Enthoo Pro 2 Server's 15 fan positions are necessary, not nice-to-have. Plan for at least 6-8 populated fan positions.
- The top GPU will run hotter (sandwiched slot). If the ASUS board allows, leave an empty PCIe slot between the two cards for breathing room.
- Under sustained load this rig will be audible. Not a closet machine. Expect roughly the noise level of a small window AC unit. If Alton wants it in the home office with him, Option B (Max-Q) becomes compelling despite the price premium.

### Electrician timeline

Flag for the electrician before ordering any parts. Quote and schedule can run 1-3 weeks in Essex County NJ. If the electrician cannot come until after parts arrive, the machine can be assembled and benched but **do not run it under full GPU load** on a standard outlet. A single GPU at partial load is survivable on 15 A; two at full load is not.

## Open Decisions

Alton needs answers on these before placing the order:

- [ ] **Option A vs Option B.** Recommended: Option A (Workstation Edition) unless Max-Q drops to ~$9,500 at Newegg direct. Current third-party Max-Q pricing is ~$2,289 per card premium, which kills Option B economically.
- [ ] **RAM source: V-Color (Newegg) vs NEMIX (Amazon).** Recommended: NEMIX. Saves ~$2,100, ships from US, lifetime warranty. Only downside is breaking the "all Newegg" constraint (irrelevant once NeweggBusiness tax path is considered separately).
- [ ] **CPU: 7975WX (32C) vs 7965WX (24C).** Recommended: 7975WX. The $1,187 savings is real but the 32-core gives meaningful headroom for CPU-side data prep over a 4-6 year horizon. Only step down if budget is still tight after Levers 1 and 3.
- [ ] **NeweggBusiness reseller certificate path.** Requires: (a) apply for NeweggBusiness account in Solar Inference LLC name, (b) CPA blessing on the NJ ST-3 resale certificate position, (c) submit to NeweggBusiness tax-exempt desk. Allow 1-2 weeks. Worth $2,349.
- [ ] **Electrician timing.** Get a quote this week. Decide between 20 A / 120 V (cheaper, borderline) or 240 V L6-20 (more expensive, correct answer for a forever rig). Recommended: 240 V.
- [ ] **Strategic: augment or replace gpuserver1 on vast.ai.** Is this rig a private workstation (earnings stay on gpuserver1) or does it list on vast.ai (higher earning potential but ties up the hardware)? Separate analysis needed -- compare current vast.ai market rates for RTX PRO 6000 Blackwell against the 5090's $0.40/hr.
- [ ] **OS choice.** Recommended: Ubuntu 24.04 LTS server with open-source NVIDIA 575+ driver. Proxmox 8.x only if hypervisor isolation is a hard requirement. Windows is not the right call for a 2x Blackwell rig.
- [ ] **990 PRO 4 TB now or wait for a sale.** Current $887.95 is historically high. If Alton is not blocked on storage, defer this purchase by 30-60 days and watch for a Samsung sale (historical floor ~$280). Saves ~$500-600.

## Purchase Execution Checklist

Sequenced so that blockers happen before anything that costs money.

1. **Week 1: Get the electrician scheduled.**
   - Call at least two Essex County electricians for quotes on a dedicated 240 V L6-20 drop in the home office. Alternatively a 20 A / 120 V circuit if 240 V is cost-prohibitive.
   - Lock in a date. Electrician must be done (or very near done) before the PSU arrives.
2. **Week 1: Apply for NeweggBusiness account.**
   - Portal: [neweggbusiness.com](https://www.neweggbusiness.com/). Apply in the name of Solar Inference LLC using EIN on file.
   - Request net-30 terms.
3. **Week 1: Email Jonathan Francis (jf@francis-cpa.com).**
   - Subject: "NJ ST-3 resale cert for Solar Inference LLC GPU purchase." Attach the build list. Ask whether the reseller position is defensible given the mixed use (private workloads + vast.ai rental). Flag that the purchase is Section 179 eligible regardless.
   - If yes: submit NJ ST-3 to NeweggBusiness tax-exempt desk.
   - If no: pay NJ tax, still a deductible business expense.
4. **Week 2: Final component price check.**
   - Re-verify each Newegg item price via the links in this doc. Prices move.
   - Check the Amazon NEMIX 256 GB kit price directly in a browser (static web fetch cannot read Amazon prices). Confirm the SKU is in stock and shipping from US.
5. **Week 2: Place the order.**
   - Primary path: NeweggBusiness, Solar Inference LLC account, tax-exempt if certified, Chase Ink business card. Two separate Newegg orders may be needed if any items are third-party marketplace (they ship separately anyway).
   - RAM: separate Amazon order for NEMIX kit if taking Lever 1.
   - Save all invoices to `Solar Inference LLC / 2026 / CapEx / RTX6000-build/` for Section 179 backup.
6. **Week 3-4: Parts arrive.** Stage them. Do not assemble until the electrician is done.
7. **Week 3-4: Electrician finishes the circuit.** Test with a multimeter. Confirm dedicated circuit, correct breaker size.
8. **Week 4: Assemble.** Torque CPU mount to Noctua spec. Walk the ASUS WRX90E-SAGE SE QVL one more time against the V-Color or NEMIX kit. Flash BIOS to latest before first boot.
9. **Week 4: First boot.** Power-on self-test. Memtest86+ for at least one full pass. nvidia-smi against both cards. Stress test each GPU individually (gpu-burn or equivalent) before running both simultaneously.
10. **Week 5: Production.** Install Ubuntu 24.04 LTS + NVIDIA driver. Decide vast.ai listing or private-only. Update `sartor/memory/MACHINES.md` with the new rig as "workstation2" or similar.
11. **Ongoing: Section 179 tracking.** Send invoices and first-use date to Jonathan Francis for the 2026 Solar Inference LLC 1065 return.

## Sources

All URLs accessed 2026-04-10 or 2026-04-11.

1. [NVIDIA RTX PRO 6000 Blackwell Workstation Edition - Newegg N82E16814132106](https://www.newegg.com/nvidia-blackwell-rtx-pro-6000-96gb-graphic-card/p/N82E16814132106) -- $9,499.99 each, Newegg direct, in stock (verified 2026-04-11)
2. [NVIDIA RTX PRO 6000 Blackwell Max-Q Edition - Newegg N82E16814132105](https://www.newegg.com/nvidia-900-5g153-2200-000-rtx-pro-6000-96gb-graphics-card/p/N82E16814132105) -- $11,789.00, third-party seller High Performance Tech (verified 2026-04-11)
3. [NVIDIA RTX PRO 6000 Blackwell Server Edition - Newegg N82E16814132104](https://www.newegg.com/nvidia-900-2g153-0000-000-rtx-pro-6000-96gb-graphics-card/p/N82E16814132104) -- reference SKU, not used in build
4. [AMD Threadripper PRO 7975WX - Newegg N82E16819113807](https://www.newegg.com/amd-threadripper-pro-7975wx-350w-sp6-ryzen-threadripper-7000-series/p/N82E16819113807) -- $3,799.99, Newegg direct (verified 2026-04-11)
5. [AMD Threadripper PRO 7965WX - Newegg N82E16819113805](https://www.newegg.com/amd-ryzen-threadripper-7000-series-ryzen-threadripper-pro-7965wx-storm-peak-socket-str5-desktop-cpu-processor/p/N82E16819113805) -- $2,612.99, marketplace seller (verified 2026-04-11)
6. [ASUS Pro WS WRX90E-SAGE SE - Newegg N82E16813119667](https://www.newegg.com/asus-pro-ws-wrx90e-sage-se-eeb-motherboard-amd-wrx90-str5/p/N82E16813119667) -- $1,246.99, Newegg direct (verified 2026-04-11)
7. [V-Color 256 GB DDR5-5600 ECC RDIMM kit - Newegg 2SJ-004R-00046](https://www.newegg.com/v-color-256gb/p/2SJ-004R-00046) -- $9,139.99, v-color official store, ships from Taiwan (verified 2026-04-11)
8. [NEMIX RAM 256 GB DDR5-5600 ECC RDIMM (WRX90) - Amazon B0DC8HFL68](https://www.amazon.com/NEMIX-RAM-Registered-Compatible-Motherboard/dp/B0DC8HFL68) VERIFY -- Amazon dynamic pricing not captured by web fetch; prior research est. $6,500-7,000
9. [NEMIX RAM 256 GB DDR5-5600 2Rx4 - Amazon B0GSRXNPGW](https://www.amazon.com/Registered-NEMIX-RAM-Compatible-Motherboard/dp/B0GSRXNPGW) VERIFY -- alternate NEMIX SKU, same pricing caveat
10. [Samsung 9100 PRO 2 TB Gen5 - Newegg N82E16820147903](https://www.newegg.com/samsung-2tb-9100-pro-nvme-2-0/p/N82E16820147903) -- $459.95, sold by BioStar (verified 2026-04-11)
11. [Samsung 990 PRO 4 TB - Newegg N82E16820147879](https://www.newegg.com/samsung-4tb-990-pro-nvme-2-0/p/N82E16820147879) -- $887.95, sold by BioStar (verified 2026-04-11)
12. [Super Flower Leadex Titanium 2200 W SF-2200F14HP - Newegg 1HU-024C-000A6](https://www.newegg.com/super-flower-leadex-platinum-atx3-1-atx3-0-compatible-2200w-cybenetics-platinum-power-supplies/p/1HU-024C-000A6) -- $549.99, shipped by Newegg (verified 2026-04-11)
13. [Phanteks Enthoo Pro 2 Server Edition - Newegg N82E16811854126](https://www.newegg.com/phanteks-full-tower-enthoo-pro-2-server-edition-steel-chassis-computer-case-black-ph-es620pc-bk02/p/N82E16811854126) -- $179.99, Newegg direct (verified 2026-04-11)
14. [Noctua NH-U14S TR5-SP6 - Newegg 13C-0005-00336](https://www.newegg.com/noctua-nh-u14s-tr5-sp6/p/13C-0005-00336) -- $150.99, sold by ZerKorr Power (verified 2026-04-11)
15. [Arctic P14 PWM PST 5-pack - Newegg N82E16835186221](https://www.newegg.com/arctic-cooling-acfan00125a-case-fan/p/N82E16835186221) -- $40.99, sold by PlatinumMicro (verified 2026-04-11)
16. [NeweggBusiness](https://www.neweggbusiness.com/) -- business account and tax-exempt portal
17. [NJ ST-3 Resale Certificate (State of NJ Treasury)](https://www.state.nj.us/treasury/taxation/pdf/other_forms/sales/st3.pdf) -- tax exemption form
18. [Thundercompute RTX PRO 6000 Blackwell pricing context (April 2026)](https://www.thundercompute.com/blog/nvidia-rtx-pro-6000-pricing) -- independent pricing reference

## History

- 2026-04-10: Initial deep-research pass via subagent. Full parts list assembled, budget over by ~$2,800 at retail.
- 2026-04-11: This document. Re-verified all Newegg prices (unchanged from 2026-04-10). Max-Q option documented and deprioritized (third-party pricing kills it). Three budget levers quantified. Electrical blocker and purchase sequencing called out.
