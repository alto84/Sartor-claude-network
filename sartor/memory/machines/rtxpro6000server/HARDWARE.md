---
name: rtxpro6000server-hardware
description: Bill of materials and hardware-specific quirks for rtxpro6000server, the dual-Blackwell WRX90 workstation. Sourced from the 2026-04-12 Newegg multi-cart and on-box reconnaissance 2026-04-25.
type: hardware-inventory
machine: rtxpro6000server
hostname: rtxpro6000server
date: 2026-04-25
updated: 2026-04-25
updated_by: Rocinante Opus 4.7 (hardware-mapping synthesis)
volatility: low
build-date: 2026-04-12
last-verified: 2026-04-25
receipts:
  - "C:/Users/alto8/Downloads/Receipts/rtxpro6000server-2026-04-12/Newegg.com Order #_ 408668539, 408668439, 408668519, .._.pdf"
  - "C:/Users/alto8/Downloads/Receipts/rtxpro6000server-2026-04-12/Newegg.com Order #_ 412968624.pdf"
  - "C:/Users/alto8/Downloads/Receipts/rtxpro6000server-2026-04-12/Newegg.com Order #_ 412970644, 412970664.pdf"
tags: [meta/hardware, machine/rtxpro6000server, blackwell, workstation]
related: [[MACHINES]], [[machines/gpuserver1/HARDWARE]], [[machines/rocinante/HARDWARE]]
---

# rtxpro6000server — bill of materials and hardware quirks

Dual NVIDIA RTX PRO 6000 Blackwell workstation built 2026-04-12, brought online 2026-04-22. Threadripper PRO 7975WX on the ASUS Pro WS WRX90E-SAGE SE platform. Located on the Montclair LAN at 192.168.1.157.

## Bill of materials

Total: ten Newegg orders placed 2026-04-12 across three PDFs, ~$38,418 line-item total (one Voided line in the Super Flower 2200W PSU which was replaced by the be quiet! 1600W). Receipts:

- `Newegg.com Order #_ 408668539, 408668439, 408668519, .._.pdf` — combined cart of seven sub-orders (CPU, mobo, case, RAM, storage, cooler, fans, voided PSU)
- `Newegg.com Order #_ 412968624.pdf` — the two Blackwell GPUs
- `Newegg.com Order #_ 412970644, 412970664.pdf` — replacement PSU + supplemental fans (placed 8:34 PM the same day)

| Component | Item | Order # | Qty | Unit price | Notes |
|-----------|------|---------|-----|------------|-------|
| GPU | NVIDIA RTX PRO 6000 Blackwell Workstation Edition, 96 GB GDDR7 | 412968624 | 2 | $9,499.99 | VBIOS 98.02.81.00.07, driver 580.126.09, 600 W cap each |
| CPU | AMD Ryzen Threadripper PRO 7975WX (32C/64T, sTR5, 350 W) | 408668419 | 1 | $3,799.99 | Zen 4, AVX-512, AVX512_BF16, SHA-NI |
| Motherboard | ASUS Pro WS WRX90E-SAGE SE (EEB workstation) | 408668419 | 1 | $1,246.99 | BIOS 1203 dated 2025-07-18, S/N 251268150700137 |
| RAM | V-COLOR DDR5 256 GB (32GBx8) 5600 MT/s CL36 OC R-DIMM ECC Registered | 408668499 | 1 | $9,139.99 | Kit P/N TRA532G56S436O; IMC clamps to 4800 MT/s under 8-DIMM Threadripper PRO config |
| **CPU cooler** | **Noctua NH-U14S TR5-SP6** (140 mm air, sTR5/SP6) | 408668459 | 1 | **$150.99** | **Air, not AIO. sTR5 mount rated for ~350W TDP — 7975WX is exactly 350 W → zero headroom.** |
| Case | Phanteks Enthoo Pro 2 Server Edition (SSI-EEB, 11 PCI, 15 fan positions) | 408668419 | 1 | $179.99 | Dual-PSU capable; ATX/EPS server chassis |
| Case fans | ARCTIC P14 PWM PST 140 mm 5-pack | 408668479 | 1 | $40.99 | Supplements stock Phanteks T30 fans |
| Case fans (supplemental) | Super Flower MEGACOOL 140 mm Triple-Pack PWM | 412970664 | 1 | $69.99 | Bonus pack with the replacement PSU order |
| Boot SSD | Samsung 9100 PRO 2 TB PCIe 5.0 x4 M.2 2280 | 408668519 | 1 | $459.95 | Samsung's AI-marketed Gen5 NVMe |
| Data SSD | Samsung 990 PRO 4 TB | 408668539 | 1 | $879.95 | Currently unmounted/unpartitioned, reserved for datasets |
| **PSU** | **be quiet! Dark Power PRO 13 1600 W ATX 3.0 Titanium** | 412970644 | 1 | **$499.90** | **Replacement for the voided Super Flower 2200W. Sized for 2× 600 W GPU + 350 W CPU + ancillaries.** |
| ~~PSU (voided)~~ | ~~Super Flower Leadex Titanium 2200W ATX 3.1~~ | ~~408668439~~ | ~~1~~ | ~~$549.99~~ | **Order voided** on cover; replaced same day by the be quiet! 1600W |

## Cooling

CPU cooler: **Noctua NH-U14S TR5-SP6**, single-tower 140 mm air. The sTR5/SP6 mount is exact-match for the 7975WX IHS. Rated TDP envelope ~350 W with the stock NF-A15 fan, which is exactly the 7975WX TDP — there is **zero thermal headroom** if all 32 cores boost simultaneously under sustained workload. At idle (capture 2026-04-25): Tctl 46.6 °C, Tccd1-4 between 40.9 °C and 44.4 °C. CPU thermal stability under training runs has not yet been characterized.

Chassis fans: 5× ARCTIC P14 PWM PST (140 mm) plus the 3-pack Super Flower MEGACOOL bonus = up to 8× 140 mm fans on top of the chassis stock 3× Phanteks T30. Phanteks Enthoo Pro 2 Server Edition has 15 fan positions, so installation count and position are not auto-detectable from software. The ASUS hwmon node (`/sys/class/hwmon/hwmon3/`) does not expose `fan*_input` / `pwm*` files — mainline `asus-wmi-sensors` does not yet model the WRX90E-SAGE SE EC. Live fan curves require IPMI through the AST2600 BMC or BIOS Q-fan UI.

NVMe thermals at idle: 9100 PRO 29.9 °C composite (high 83.8 °C, crit 87.8 °C); 990 PRO 29.9 °C composite (high 81.8 °C, crit 84.8 °C).

GPU thermals at idle: GPU 0 = 29 °C @ 6 W, GPU 1 = 28 °C @ 15 W, both at 30% fan, P8 idle.

## Power

| Field | Value |
|-------|-------|
| PSU | be quiet! Dark Power PRO 13 1600 W ATX 3.0 80+ Titanium |
| GPU 0 power cap | 600 W (default = max) |
| GPU 1 power cap | 600 W (default = max) |
| CPU TDP class | 350 W (Threadripper PRO 7975WX) |
| Worst-case sustained | ~1.55-1.7 kW (2×600 + 350 + ~50 fans/NIC/NVMe) |

The 1600W Titanium provides ~85-95 W headroom over worst-case sustained — adequate for nameplate but tight on transient spikes (Blackwell can briefly exceed 600 W power cap during boost). No power capping or thermal throttling observed at capture; `Clocks Event Reasons` shows all reasons inactive on both GPUs.

## Storage

| Device | Size | Model | PCIe addr | Use |
|--------|------|-------|-----------|-----|
| `nvme1n1` | 1.82 TB | Samsung 9100 PRO 2 TB | `0000:89:00.0` (root [0000:20]) | Boot drive — EFI (1 GB), `/boot` (2 GB ext4), LVM PV with `ubuntu-vg/ubuntu-lv` (1.8 TB ext4 → `/`) |
| `nvme0n1` | 3.64 TB | Samsung 990 PRO 4 TB | `0000:e1:00.0` (root [0000:e0]) | **Unmounted**, no partitions. Reserved for datasets / model checkpoints |
| `sda` | 465.8 GB | Samsung 850 SATA SSD | onboard SATA | **Stale Windows install** (NTFS partitions including 417.8 GB primary, EFI, MSR, recovery). Likely the disk Ubuntu was installed alongside; Windows still bootable but unmounted on Linux |
| `sdb` | 0 B | "Virtual HDisk0" | AST2600 KVM | BMC virtual media, unpopulated |
| `sr0` | 1024 MB | "Virtual CDROM0" | AST2600 KVM | BMC virtual ISO mount, unpopulated |

The two NVMe drives sit on **different IO dies** of the SP6 package (`0000:20` for boot, `0000:e0` for data) — best-case parallel bandwidth.

Filesystem usage at 2026-04-25 capture: `/` 605 GB used of 1.8 TB (36%), `/boot` 245 MB of 2 GB, `/boot/efi` 6.1 MB of 1.1 GB. The 605 GB on root is consistent with the 2026-04-22 overnight LoRA training run (Qwen3.6-35B base ~70 GB plus reasoning-12k dataset plus checkpoints).

## Network

| Iface | State | MAC | Address | Notes |
|-------|-------|-----|---------|-------|
| `eno1np0` | UP | 30:c5:99:d5:8f:b5 | 192.168.1.157/24 | **Active LAN.** Intel X710 10GBASE-T port 1. IPv6 SLAAC configured |
| `eno2np1` | DOWN | 30:c5:99:d5:8f:b6 | — | Intel X710 10GBASE-T port 2. Cable not connected |
| `enxda076da64762` | DOWN | da:07:6d:a6:47:62 | — | USB-Ethernet adapter (likely the dongle used for OS install) |

Onboard NIC is dual-port **Intel X710-AT2** at PCIe `0000:03:00.{0,1}` — 10 Gbit/s on both ports, currently link-up on port 0 only. ASPEED AST2600 BMC at `e3:00.0` provides out-of-band IPMI/KVM (server-class).

## PCIe topology

Four CPU-side root complexes corresponding to the four IO dies of the SP6 package:

```
Root [0000:00] (primary IO die)
├── 01.1 → [01] NVIDIA RTX PRO 6000 Blackwell  (GPU 0)  + audio func
├── 03.1 → [02] NVIDIA RTX PRO 6000 Blackwell  (GPU 1)  + audio func
├── 05.1 → [03-04] Intel X710 10GbE dual-port  (eno1np0, eno2np1)
└── 07.1 → [05] AMD audio + crypto controllers

Root [0000:20]
├── 03.1 → [21-88] PCIe switch fan-out (M.2 slots / U.2 backplane on board)
├── 03.2 → [89] Samsung NVMe (nvme1n1, the 2 TB 9100 PRO boot drive)
└── 03.4 → [8a-8d] downstream switch with onboard SATA + audio

Root [0000:c0]   — appears unpopulated by add-in cards
└── 07.1 → [c1] AMD USB controller

Root [0000:e0]
├── 03.4 → [e1] Samsung NVMe (nvme0n1, the 4 TB 990 PRO data drive)
├── 05.2 → [e2-e3] AST2600 BMC + ASPEED VGA  (out-of-band mgmt)
└── 07.1 → [e4] AMD USB + crypto
```

Both GPUs sit on the primary IO die's root complex (`0000:00`), occupying separate root-port lanes (`00:01.1` and `00:03.1`) — full 16-lane each, no PCIe switch in between, **direct CPU attach**.

### GPU PCIe re-slot (2026-04-22)

The 2026-04-22 daily log records GPU bus IDs `c1:00.0` and `e1:00.0` (split across two IO dies). On 2026-04-25 they enumerate at `01:00.0` and `02:00.0` on root complex `0000:00` (single IO die). The cards were physically re-slotted during the GPU-sag-bracket install on 2026-04-22 — one slot was finicky and DPC-tripped under bump. Now both GPUs are on adjacent x16 slots fed by the primary IO die rather than split. **Bandwidth-positive change** — no implication for single-card workloads, and NCCL all-reduce across both cards keeps traffic within one IO die for lower cross-GPU latency.

### Idle PCIe link state

Both GPUs report `LnkCap: 32GT/s x16` (Gen 5 x16 = ~63 GB/s each direction). At idle they show `LnkSta: 2.5GT/s (downgraded)`. **This is normal NVIDIA power-save behavior on Workstation cards**, not a hardware fault. The link will train back up to Gen 5 under load. `Clocks Event Reasons Counters: SW Power Capping = 20.5M µs` — accumulated since boot, consistent with idle P8 behavior, not active throttling.

## NVFP4 readiness

Blackwell silicon natively supports **NVFP4** and **FP8** tensor formats. CUDA 13 toolchain (driver 580.126.09) exposes `nvfp4` and `mxfp4` data types in cuBLAS / cuDNN / TransformerEngine. BAR1 = 128 GiB per GPU — full 96 GB VRAM mapping plus headroom. **Verdict: NVFP4 ready** with no further enablement step beyond using a framework that emits NVFP4 kernels.

## History

- **2026-04-12** — parts ordered (10 Newegg orders across three PDFs, ~$38,418). Replacement be quiet! 1600W PSU placed 8:34 PM after Super Flower 2200W in original cart was voided.
- **2026-04-22** — machine brought online. Ubuntu 22.04.5 LTS (HWE kernel 6.8.0-110), driver 580.126.09, CUDA 13.0. Initial GPU enumeration at `c1:00.0` + `e1:00.0`. GPU-sag bracket installed and cards re-slotted same day; finicky slot DPC-tripped during a bump. Post-reslot enumeration at `01:00.0` + `02:00.0` on the primary IO die.
- **2026-04-22 (overnight)** — first training workload: LoRA fine-tune of `Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16` (70 GB bf16, attention-only LoRA r=64) on Constitution + feedback corpus + 12 k Opus 4.6 reasoning traces. Model-parallel via `device_map='auto'`. Artifacts in `experiments/2026-04-22-overnight-training/`.
- **2026-04-25** — first formal HARDWARE.md inventory, BoM cross-checked against live recon. PSU identified post-receipt-mapping (had been an open question in the 2026-04-26 03:50 UTC empirical sweep). Three Newegg PDFs filed under canonical receipts path.

## Open items

1. **CPU cooler thermal headroom** — Noctua NH-U14S TR5-SP6 is rated for ~350 W; 7975WX is exactly 350 W. No characterization yet of sustained 32-core boost thermals. Watch Tctl under `stress-ng --cpu 64` or full-blast LoRA training; if Tctl approaches 95 °C, consider AIO upgrade.
2. **Fan PWM curves not introspectable from Linux** on this WRX90 board (no upstream `asus-wmi-sensors` model). Route fan tuning through IPMI / AST2600 web UI or store BIOS-Q-fan settings out-of-band.
3. **990 PRO 4 TB unmounted** — needs partitioning + mount decision (likely `/data` for datasets/checkpoints).
4. **Stale 850 SATA Windows install** — wipe-or-leave decision pending. Bootable but never used on this box.
5. **Multi-shell tmux protocol** — peer-coordinator agent uses tmux on this box for multi-window session state; documented in [[machines/MACHINES]] cross-machine quirks section.
