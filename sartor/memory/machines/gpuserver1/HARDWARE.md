---
name: gpuserver1-hardware
description: Bill of materials and hardware-specific quirks for gpuserver1. Sourced from the original 9/29/2025 Newegg order (Solar Inference LLC purchase) and on-box reconnaissance 2026-04-24.
type: machine-hardware
hostname: gpuserver1
date: 2026-04-24
updated: 2026-04-24
updated_by: Rocinante Opus 4.7 (machine-self-stewardship integration)
volatility: low
tags: [meta/hardware, machine/gpuserver1]
related: [machines/gpuserver1/MISSION, reference/gpuserver1-power-logging, business/solar-inference]
source: "Newegg order 383828549 + 383828569, dated 2025-09-29; bill PDF at Downloads/Solar Inference LLC/3 - GPU Rig/Computer parts bill.pdf"
---

# gpuserver1 — bill of materials and hardware quirks

## Bill of materials (Newegg, 9/29/2025)

| Component | Item | Item # | Sticker price | Notes |
|-----------|------|--------|---------------|-------|
| GPU | (in Order 2 — see Order Details 5090.pdf) | | | RTX 5090 32GB |
| CPU | Intel Core i9-14900K LGA 1700 | (in combo) | | 125W base TDP, ~250W boost |
| Motherboard | ASUS Z790 GAMING WIFI7 LGA 1700 ATX | N82E16813119679 | $179.99 | PCIe 5.0, 3× M.2, 14+1 DrMOS, DDR5, WIFI 7, Realtek 1Gb |
| RAM | G.SKILL Trident Z5 Neo RGB 128GB (2×64GB) DDR5-6000 | N82E16820374762 | $419.99 | RGB on the modules |
| **CPU cooler** | **MSI MAG Coreliquid A13 240 White** — AIO ARGB | **N82E16835846068** | **$89.99 (free w/ combo)** | **240mm radiator, dual 120mm ARGB PWM fans, EZ Connect daisy chain** |
| Storage | SK hynix Platinum P41 M.2 SSD 2TB NVMe Gen4 | 0D9-003U-00ME7 | $129.99 | 7000 MB/s, 176-layer NAND |
| PSU | PCCOOLER CPS YS1200 1200W 80+ Gold | 9SIAHCTKC55203 | $163.99 | Fully modular, 12V-2×6 cable, ATX 3.1, PCIe 5.1, 105°C-rated |
| Case | PCCOOLER CPS C3 T700 dual-chamber mid-tower | 9SIAHCTKJM3451 | $75.99 | Dual-chamber, BTF motherboard support |

Grand total billed (both orders combined): **$1,704.81 net** (after combo + autoadd discounts).

Bill PDF: `~/Downloads/Solar Inference LLC/3 - GPU Rig/Computer parts bill.pdf`. SO the canonical numbers for the CPA depreciation schedule are sourced from there.

## CPU cooler — MSI MAG Coreliquid A13 240 White (the part the reconnaissance agent missed)

Form factor and connection topology:

- **240mm radiator** with dual 120mm ARGB PWM fans
- **EZ Connect** daisy-chain: pump + radiator fans share a single combined connector going to the motherboard, NOT individual headers per fan/pump
- **No discrete USB** for this model — the higher-end MEG Coreliquid line exposes USB for pump-RPM monitoring + RGB; the MAG A13 line does NOT
- **Pump tach** is reported via the motherboard CPU_FAN or AIO_PUMP header (PWM-only, no software interface beyond what the BIOS exposes through `lm-sensors` if supported)
- **ARGB on pump head + 2 fans + radiator strip** all daisy-chained off the motherboard's ARGB header

### LED control — already wired up

Because the cooler's ARGB flows through the motherboard's ARGB header, the LEDs are controlled by the same ASUS AURA controller that OpenRGB already addresses as motherboard device index 0. **There is no separate device to enumerate**; the cooler appears as part of the motherboard zone in OpenRGB. The existing `~/sartor-rgb/bin/rgb_status.py` cron already drives the cooler's color along with the rest of the motherboard zone — currently set by the rental-state palette (bright green when rented + active, dim green when rented + idle).

To give the cooler its own independent color (different from other motherboard zones), the next step is to enumerate AURA's per-zone subdivision via OpenRGB:

```bash
sudo openrgb --list-devices  # see the device list and per-device zones
sudo openrgb -d 0 --list-zones  # see motherboard zones individually
```

Z790 boards typically expose multiple ARGB headers as separate zones (front-panel, JRGB1, JRGB2, JCORSAIR, etc.). The cooler is on whichever ARGB header the EZ Connect breakout goes to. A short physical-trace exercise (or temporarily flashing each zone a unique color and watching which one the cooler responds to) identifies the right zone.

### What the reconnaissance agent missed

The agent looked for a USB device (`lsusb | grep -i coreliquid`) and found nothing. Correct as far as it went — but USB enumeration is not the only signal of a cooler's presence. The actual signals:

- `sartor/memory/reference/gpuserver1-power-logging.md` line 37 explicitly lists "AIO pump" as something not measured (i.e., it exists)
- The bill of materials in the Solar Inference LLC purchase records lists the MAG Coreliquid A13 line item
- The motherboard ARGB header is feeding two devices' worth of LEDs (DRAM is direct on the I2C; everything else is on a single ARGB chain)

Future reconnaissance should consult the BoM first, not just `lsusb`.

## Motherboard zones (to be confirmed by `openrgb -d 0 --list-zones`)

The ASUS Z790 GAMING WIFI7 commonly exposes:

- Onboard chipset + IO shroud LEDs
- 1-2× JRGB headers (12V RGB legacy)
- 2-3× JARGB headers (5V addressable RGB)
- Possibly a pump or AIO-specific header

All addressable via `openrgb -d 0 -z <zone-index> -m static -c <hex>`.

## Power profile

Per `reference/gpuserver1-power-logging.md`:
- Estimated total system: `(cpu_package_watts + gpu_watts + dram_watts) * 1.15 + 25 W`
- 1200W PSU is significantly oversized for the 14900K + 5090 typical workload (~700W peak)
- Headroom is intentional: 80+ Gold efficiency curve is best in the 40-60% load band

## Open quirks

- BIOS does not appear to expose pump RPM via `lm-sensors` reliably on this board — the AIO pump RPM might only be visible in the BIOS UI or the ASUS Armoury Crate stack (Windows-only). For Linux liveness checking, fall back to inferring pump health from CPU package thermal stability over time.
- liquidctl does not support the MAG Coreliquid A13 line (supports only MEG Coreliquid S360/S280). Don't bother installing it for this cooler.

## History

- 2025-09-29: parts ordered (Newegg), Solar Inference LLC, billed to Visa ending 7738
- 2026-04-12 (~): rgb_status.py installed at ~/sartor-rgb/bin/, cron every 5 min mapping rental state → motherboard ARGB zone (which includes the cooler)
- 2026-04-24: HARDWARE.md created. Cooler identity confirmed via the original Newegg bill of materials after a reconnaissance pass missed it because the cooler has no USB enumeration.
