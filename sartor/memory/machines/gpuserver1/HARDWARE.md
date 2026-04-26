---
name: gpuserver1-hardware
description: Bill of materials and hardware-specific quirks for gpuserver1, the Solar Inference LLC GPU rental host. Sourced from the 2025-09-29 Newegg orders, the 2025-09-22 Amazon RTX 5090 order, and on-box reconnaissance refreshed 2026-04-25.
type: hardware-inventory
machine: gpuserver1
hostname: gpuserver1
date: 2026-04-24
updated: 2026-04-25
updated_by: Rocinante Opus 4.7 (hardware-mapping refresh)
volatility: low
build-date: 2025-09-29
last-verified: 2026-04-25
receipts:
  - "C:/Users/alto8/Downloads/Solar Inference LLC/3 - GPU Rig/Computer parts bill.pdf"   # Newegg orders 383828549 + 383828569 (2025-09-29)
  - "C:/Users/alto8/Downloads/Solar Inference LLC/3 - GPU Rig/Order Details 5090.pdf"    # Amazon order 112-9354282-5317043 (2025-09-22)
newegg_orders: ["383828549", "383828569"]
amazon_orders: ["112-9354282-5317043"]
tags: [meta/hardware, machine/gpuserver1, blackwell, vastai]
related: [[MACHINES]], [[machines/gpuserver1/MISSION]], [[reference/gpuserver1-power-logging]], [[business/solar-inference]]
source: "Newegg orders 383828549 + 383828569 dated 2025-09-29 (bill PDF at Downloads/Solar Inference LLC/3 - GPU Rig/Computer parts bill.pdf); Amazon order 112-9354282-5317043 dated 2025-09-22 (RTX 5090, Order Details 5090.pdf)"
---

# gpuserver1 — bill of materials and hardware quirks

Single-GPU vast.ai rental host owned by Solar Inference LLC. Located on the Montclair LAN at 192.168.1.100, behind Verizon Fios DMZ-to-host. Built 2025-09-29.

## Bill of materials

Three orders across two vendors. Total billed: ~$4,207.93 net (Newegg $1,704.81 + Amazon $2,503.12).

| Component | Item | Vendor / Order # | Sticker price | Notes |
|-----------|------|-----------------|---------------|-------|
| GPU | GIGABYTE GeForce RTX 5090 Gaming OC 32G (GV-N5090GAMING OC-32GD) | Amazon / 112-9354282-5317043 | $2,347.59 | **AIB partner: Gigabyte** (PCI subsystem `1458:416f`); VBIOS 98.02.2E.00.D4 |
| CPU | Intel Core i9-14900K LGA 1700 (24C/32T, 8P+16E) | Newegg / 383828549 | $438.96 (combo) | 125 W base / ~250 W boost; idle Tctl 39 °C at capture |
| Motherboard | ASUS Z790 GAMING WIFI7 LGA 1700 ATX | Newegg / 383828549 | $179.99 | PCIe 5.0, 3× M.2, 14+1 DrMOS, DDR5, WIFI 7, Realtek 1Gb. S/N 250351660300895. **BIOS: AMI 1812 dated 2025-01-21** (UEFI, 16 MB ROM) |
| RAM | G.SKILL Trident Z5 Neo RGB 128 GB (2×64 GB) DDR5-6000 | Newegg / 383828549 | $419.99 | Module P/N F5-6000J3444F64G. **Kit-rated 6000 MT/s, currently running at 5600 MT/s** (Intel IMC native cap or XMP/EXPO not engaged) |
| **CPU cooler** | **MSI MAG Coreliquid A13 240 White** AIO ARGB | Newegg / 383828549 | $89.99 (free w/ combo) | 240 mm radiator, dual 120 mm ARGB PWM fans, EZ Connect daisy chain. **No discrete USB** (MAG-line ≠ MEG line) |
| Storage | SK hynix Platinum P41 M.2 SSD 2 TB NVMe Gen4 | Newegg / 383828549 | $129.99 | P/N SHPP41-2000GM, 7000 MB/s, 176-layer NAND |
| PSU | PCCOOLER CPS YS1200 1200 W 80+ Gold | Newegg / 383828569 | $163.99 | Fully modular, 12V-2×6 cable, ATX 3.1, PCIe 5.1, 105 °C-rated |
| Case | PCCOOLER CPS C3 T700 dual-chamber mid-tower | Newegg / 383828569 | $75.99 | Dual-chamber, BTF motherboard support |

## Memory configuration quirk

The G.SKILL F5-6000J3444F64G kit is rated DDR5-6000 EXPO. The system reports both DIMMs running at **5600 MT/s** — i.e., 400 MT/s under the kit's rated speed. Two possible causes:

1. **XMP / EXPO not engaged.** Default BIOS state on most consumer Z790 boards leaves XMP off; the modules then run at the JEDEC rate the IMC supports.
2. **14900K IMC cap.** Intel's official IMC spec for the 14900K is DDR5-5600. Running EXPO 6000 is overclock-class. The current 5600 setting is the JEDEC/Intel-supported rate.

The current 5600 MT/s setting is technically the spec-supported rate. Switching to EXPO 6000 (if engaged via BIOS) would be a manual mild overclock; if it's already engaged but the system is still running at 5600, the IMC is the bottleneck. Not a hardware fault either way.

## DIMM slot layout (populated 2-of-4)

| Slot | Status |
|------|--------|
| Controller0-DIMM0 | empty |
| **Controller0-DIMM1 (A2)** | **64 GB G.Skill DDR5 @ 5600 MT/s, P/N F5-6000J3444F64G, S/N C95843F7** |
| Controller1-DIMM0 | empty |
| **Controller1-DIMM1 (B2)** | **64 GB G.Skill DDR5 @ 5600 MT/s, P/N F5-6000J3444F64G, S/N 455F3BF7** |

A2 + B2 is the optimal 2-of-4 layout for ASUS Z790 boards (per the user manual recommended population order). The two DIMM0 slots are open for an additional 2× 64 GB if the workload ever calls for 256 GB.

## CPU cooler — MSI MAG Coreliquid A13 240 White

Form factor and connection topology:

- **240 mm radiator** with dual 120 mm ARGB PWM fans
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

Z790 boards typically expose multiple ARGB headers as separate zones (front-panel, JRGB1, JRGB2, JCORSAIR, etc.). The cooler is on whichever ARGB header the EZ Connect breakout goes to.

## GPU details

| Field | Value |
|-------|-------|
| Card | NVIDIA GeForce RTX 5090 (Blackwell, GB202) |
| AIB partner | **Gigabyte** (PCI subsystem `1458:416f`) |
| Model | GIGABYTE GeForce RTX 5090 Gaming OC 32G (GV-N5090GAMING OC-32GD) |
| PCI device ID | `10de:2b85` |
| Bus address | `0000:01:00.0` |
| Driver | 570.144 |
| CUDA runtime advertised | 12.8 |
| VBIOS | 98.02.2E.00.D4 |
| VRAM | 32 GB GDDR7 (32607 MiB) |
| Power cap (max + default) | 600 W |
| ECC | N/A (consumer card) |
| PCIe link cap | Gen5 32 GT/s x16 |
| PCIe link state at idle | 2.5 GT/s x16 — ASPM downgrade (normal; trains up under load) |

## Storage layout

Single boot/data NVMe device with dual-LV split.

| Device | Capacity | Mount | Filesystem | Used / Avail |
|--------|----------|-------|------------|--------------|
| `/dev/nvme0n1` | 1.8 TB | — | — | — |
| `nvme0n1p1` | 1 GiB | `/boot/efi` | vfat | 6.1 MiB / 1.1 GiB |
| `nvme0n1p2` | 2 GiB | `/boot` | ext4 | 323 MiB / 1.5 GiB |
| `ubuntu-vg/ubuntu-lv` | 100 GiB | `/` | ext4 | 37 GiB / 57 GiB (40%) |
| `ubuntu-vg/docker-lv` | 1.7 TiB | `/var/lib/docker` | xfs | 379 GiB / 1.4 TiB (22%) |

Single-NVMe, dual-LV layout: small ext4 system root, large XFS volume dedicated to Docker images/containers (where vast.ai tenants land). Single GPU in PCIE_1, single NVMe in M2_1.

## Network

| Interface | State | MAC | IPv4 | Notes |
|-----------|-------|-----|------|-------|
| `lo` | UP | — | 127.0.0.1/8 | — |
| `eno1` | UP | bc:fc:e7:d9:08:eb | 192.168.1.100/24 | **Active LAN.** Realtek RTL8111/8168/8411 1 Gb (motherboard onboard) |
| `wlp7s0` | DOWN | 60:ff:9e:7e:6d:e4 | — | MediaTek MT7925 (WiFi 7 board chip) — disabled, expected for a wired server |
| `virbr0` | DOWN | 52:54:00:31:df:39 | 192.168.122.1/24 | libvirt default bridge — not in use |
| `docker0` | UP | 76:c1:3a:6a:44:44 | 172.17.0.1/16 | Docker bridge |

IPv6: `eno1` carries `2600:4041:410a:fc00:befc:e7ff:fed9:8eb/64` + link-local. No IPv6 issues.

## PCIe topology

```
-[0000:00]-+-00.0  Intel a700 (root complex)
           +-01.0-[01]--+-00.0  NVIDIA RTX 5090 [10de:2b85] (Gigabyte 1458:416f)
           |            \-00.1  NVIDIA GPU audio [10de:22e8]
           +-06.0-[02]----00.0  SK hynix P41 NVMe [SK hynix 1959]
           +-1c.2-[06]----00.0  Realtek RTL8111/8168/8411 GbE [10ec:8168]
           +-1c.3-[07]----00.0  MediaTek MT7925 (WiFi 7)
```

GPU on root port `00:01.0` (Gen5 x16), NVMe on `00:06.0` (Gen4 x4 chipset port). NIC + WiFi sit behind PCH ports `1c.x`. Slots `1a.0`, `1b.0`, `1c.0`, `1d.0` are empty — no secondary GPU.

## Power profile

Per `reference/gpuserver1-power-logging.md`:

- Estimated total system draw: `(cpu_package_watts + gpu_watts + dram_watts) * 1.15 + 25 W`
- 1200 W PSU is significantly oversized for the 14900K + 5090 typical workload (~700 W peak)
- Headroom is intentional: 80+ Gold efficiency curve is best in the 40-60% load band
- BIOS does not appear to expose pump RPM via `lm-sensors` reliably on this board — the AIO pump RPM might only be visible in the BIOS UI or the ASUS Armoury Crate stack (Windows-only). For Linux liveness checking, fall back to inferring pump health from CPU package thermal stability over time

## Open quirks

- **liquidctl does not support the MAG Coreliquid A13 line** (supports only MEG Coreliquid S360/S280). Don't bother installing it for this cooler.
- **Memory running 400 MT/s under module spec** (5600 vs 6000) — see "Memory configuration quirk" above. Not a fault.
- **Idle PCIe link at 2.5 GT/s on the 5090** — normal ASPM downgrade, will train up to Gen 5 x16 under load.
- **MediaTek MT7925 (WiFi 7) chip** is properly disabled (DOWN) — wired-preferred for a DMZ host.
- **`virbr0` from libvirt is up but unused** — could be torn down if tighter network surface area is wanted.

## History

- **2025-09-22** — RTX 5090 ordered (Amazon, $2,503.12 incl. shipping/tax)
- **2025-09-29** — remaining parts ordered (Newegg, two orders, $1,704.81 net combined)
- **~2026-04-04** — most recent boot epoch (21-day uptime at the 2026-04-25 capture)
- **2026-04-12** — `rgb_status.py` installed at `~/sartor-rgb/bin/`, cron every 5 min mapping rental state → motherboard ARGB zone (which includes the cooler)
- **2026-04-24** — first formal HARDWARE.md created. Cooler identity confirmed via the original Newegg bill of materials after a reconnaissance pass missed it (no USB enumeration on the MAG line)
- **2026-04-25** — refresh: pinned Gigabyte AIB partner, BIOS baseline (AMI 1812 / 2025-01-21), DIMM-slot layout (A2+B2), and memory speed quirk (5600 vs 6000)
