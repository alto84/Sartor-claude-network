---
type: project
entity: rtx6000-workstation-psu-swap
updated: 2026-04-11
updated_by: Claude
status: active
priority: p1
tags: [domain/business, entity/solar-inference, status/active, priority/p1]
related: [rtx6000-workstation-build, rtx6000-workstation-build-SHOPPING]
---

# PSU Swap: Replacing Super Flower Leadex Titanium 2200W

The Super Flower Leadex Titanium 2200W (SF-2200F14HP) in the current Newegg cart is **200-240V input only**. It will not power on from a standard US 120V outlet. It must be replaced with a unit rated for 100-240V auto-switching input.

## RTX PRO 6000 Power Connector Requirement

Each RTX PRO 6000 Blackwell Workstation Edition requires **one 12V-2x6 (16-pin) connector** delivering up to 600W. Two GPUs = two 12V-2x6 connectors minimum. All candidates below have exactly two native 12V-2x6 connectors.

## Phanteks Enthoo Pro 2 Server Edition PSU Clearance

The case supports ATX PSUs up to **280mm in length**. All candidates fit comfortably.

## Top 3 Picks (Ranked)

### 1. be quiet! Dark Power Pro 13 1600W -- RECOMMENDED

| Spec | Value |
|---|---|
| Price | **$499.90** (Newegg, in stock) |
| Efficiency | 80 Plus Titanium (up to 94.5%) |
| Input voltage | 115-240V AC |
| ATX version | ATX 3.1 |
| 12V-2x6 connectors | 2 native |
| Dimensions | 200 x 150 x 86mm |
| Warranty | 10 years |
| Newegg link | [N82E16817151262R -- 1HU-004H-000S8](https://www.newegg.com/p/1HU-004H-000S8) |

Best balance of price, efficiency, and availability. Titanium efficiency saves real money at sustained 1000W+ draw. The 115V floor is fine: US outlets deliver 120V nominal (116-124V typical range). Digital voltage regulation with 6 independent 12V rails (switchable to single rail for overclocking). 151 reviews, 4/5 stars. 200mm length fits the Enthoo Pro 2 easily.

**Voltage note:** The spec reads "115-240V" not "100-240V." This is a narrower range than the other two picks but irrelevant for US 120V service. Japanese 100V outlets are the only real-world concern, and this is not going to Japan.

### 2. Seasonic PRIME TX-1600 (ATX 3.1)

| Spec | Value |
|---|---|
| Price | **~$550** (Newegg, in stock) |
| Efficiency | 80 Plus Titanium |
| Input voltage | 100-240V AC |
| ATX version | ATX 3.1, PCIe 5.1 |
| 12V-2x6 connectors | 2 native |
| Dimensions | 210 x 150 x 86mm |
| Warranty | 12 years |
| Newegg link | [N82E16817151262](https://www.newegg.com/seasonic-usa-atx-3-0-compatible-1600-w-80-plus-titanium-certified-power-supply-ssr-1600tr2/p/N82E16817151262) |

The gold standard for high-wattage PSUs. Seasonic's PRIME TX line is the OEM for many rebranded units. 12-year warranty is best in class. 100-240V is the widest input range of any candidate. 210mm length still fits the Enthoo Pro 2. The $50 premium over the be quiet! buys two extra warranty years and a slightly wider input voltage range.

### 3. MSI MEG Ai1600T PCIE5

| Spec | Value |
|---|---|
| Price | **$687.99** (Newegg, in stock) |
| Efficiency | 80 Plus Titanium |
| Input voltage | 100-240V AC |
| ATX version | ATX 3.1, PCIe 5.1 |
| 12V-2x6 connectors | 2 native |
| Dimensions | 190 x 150 x 86mm |
| Warranty | 12 years |
| Newegg link | [N82E16817701028](https://www.newegg.com/msi-atx12v-1600-w-up-to-94-power-supplies-black-meg-ai1600t-pcie5/p/N82E16817701028) |

Shortest chassis (190mm), server-grade Infineon SiC MOSFETs, and the newest entrant (2025 release). But $140-190 more than the other two picks for marginal benefit. Tom's Hardware noted "electrical performance could be better" and "extremely high price point." Only pick this if the shorter length matters or brand preference dictates.

## Also Considered (Not Recommended)

| PSU | Why not |
|---|---|
| **Corsair HX1500i (2025)** $349.99 | Best value but **out of stock on Newegg** as of 2026-04-11. Only 80+ Platinum (not Titanium). If it comes back in stock, it is a strong pick at $150 less than the be quiet!. Set a stock alert. |
| **Seasonic PRIME PX-1600** $499.99 | Platinum, not Titanium. Same price as the be quiet! Titanium. No reason to take lower efficiency at equal cost. |
| **Super Flower Leadex Titanium 1600W** $399.99 | **Out of stock** on Newegg. Would be the price winner if available. Same brand as the 2200W being replaced, and this 1600W model IS rated 100-240V. Monitor for restock. |

## The 120V Math

- Sustained system draw: ~1,050-1,100W (typical AI/ML workload)
- Peak system draw: ~1,300W (both GPUs at TDP + CPU at PPT)
- A 1600W PSU at 92% efficiency draws ~1,196W from the wall at 1,100W output: **safe on 15A/120V** (1,800W max)
- At peak 1,300W output, wall draw is ~1,413W: still under the 15A circuit's 1,800W theoretical max
- NEC 80% continuous rule (1,440W for 15A): sustained ~1,196W is within this limit
- Transient GPU spikes can briefly exceed TDP by 50%. Two GPUs spiking simultaneously could push wall draw past 1,600W for milliseconds. Modern PSUs handle this via transient response; circuit breakers have thermal mass and will not trip on sub-second spikes.

**Bottom line:** A 1600W PSU on a dedicated 15A/120V circuit is workable for this build's real-world power profile. A dedicated 20A/120V circuit provides comfortable margin. The 240V L6-20 drop is no longer mandatory (it was only mandatory because the 2200W PSU required 200-240V input).

## Gotchas

1. **Electrical still recommended.** While the 1600W PSU works on 120V, Alton should still ensure the workstation is on a dedicated circuit. Sharing a 15A circuit with other equipment (monitors, printer, etc.) risks tripping the breaker under sustained GPU load.
2. **Headroom is tighter.** The 2200W PSU had 600W of headroom. The 1600W has ~300W. The system will never draw 1,600W sustained, but the safety margin is smaller.
3. **If upgrading to 240V later,** all three picks support 240V input natively. PSU efficiency improves by 1-2% at 240V vs 120V.
4. **Budget impact.** The Super Flower 2200W was $549.99. The be quiet! is $499.90 (saves $50). The Seasonic TX-1600 is ~$550 (net zero). Either way, the PSU swap is budget-neutral or slightly favorable.

## Recommendation

Buy the **be quiet! Dark Power Pro 13 1600W** ($499.90, Newegg, in stock now). It saves $50 vs the current 2200W, delivers Titanium efficiency, provides two native 12V-2x6 connectors for the dual RTX PRO 6000 cards, and works on standard US 120V. Remove the Super Flower 2200W from the Newegg cart and replace it.

If Alton prefers maximum warranty coverage and widest input voltage compatibility, the Seasonic PRIME TX-1600 at ~$550 is essentially a lateral price move from the current 2200W and buys 12 years of warranty.
