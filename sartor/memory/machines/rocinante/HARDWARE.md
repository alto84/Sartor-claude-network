---
name: rocinante-hardware
description: Bill of materials and hardware-specific quirks for Rocinante, the Windows household coordination hub. First formal inventory 2026-04-25; chassis/board/CPU predate the Sartor memory system, no original BoM on file.
type: hardware-inventory
machine: rocinante
hostname: ROCINANTE
date: 2026-04-25
updated: 2026-04-25
updated_by: Rocinante Opus 4.7 (hardware-mapping synthesis)
volatility: low
build-date: ~2020 (chassis/board/CPU/RAM/SATA SSDs); GPU upgrade ~2023
last-verified: 2026-04-25
receipts: []
tags: [meta/hardware, machine/rocinante, hub, windows]
related: [[MACHINES]], [[machines/gpuserver1/HARDWARE]], [[machines/rtxpro6000server/HARDWARE]]
---

# Rocinante — bill of materials and hardware quirks

The household coordination hub: Windows 10 desktop running Claude Code as orchestrator, holding the canonical `sartor/memory/` tree, sole git-push origin, SSH key custodian for both peers, thermal monitor for rtxpro6000server.

No original BoM document exists — chassis, board, CPU, RAM, and SATA SSDs predate the Sartor memory system. Empirical inventory captured 2026-04-25.

## Identity

| Field | Value |
|-------|-------|
| Hostname | `ROCINANTE` |
| OS | Windows 10 Home (build 2009 / 64-bit, 10.0.19045) |
| Manufacturer / Model | MSI (Micro-Star International) — MS-7C73 (custom build) |
| Total Physical RAM | ~16 GB (17,089,200,128 bytes) |
| Last Boot | 2026-04-14 17:45:04 |
| Uptime at capture | 11 days 6 hours |

## CPU + RAM

### CPU

| Field | Value |
|-------|-------|
| Model | Intel Core i7-10700 (Comet Lake, 10th gen) |
| Socket | LGA1200 |
| Cores / Threads | 8 cores / 16 logical processors |
| Base / Turbo | 2.90 GHz base; turbo to 4.8 GHz |
| Max Clock observed | 2.904 GHz |
| L3 Cache | 16 MB |

### RAM

| Slot | Manufacturer | Part Number | Capacity | Speed |
|------|--------------|-------------|----------|-------|
| ChannelA-DIMM1 | G.Skill (JEDEC ID 04CD) | F4-3200C16-8GTZR | 8 GB | 3200 MT/s |
| ChannelB-DIMM1 | G.Skill (JEDEC ID 04CD) | F4-3200C16-8GTZR | 8 GB | 3200 MT/s |
| ChannelA-DIMM0 | empty | — | — | — |
| ChannelB-DIMM0 | empty | — | — | — |

Total: 16 GB DDR4-3200 (G.Skill Trident Z RGB CL16), 2 of 4 slots populated. Two DIMM slots open for non-destructive 32 GB or 64 GB expansion.

## GPU(s)

| Field | Value |
|-------|-------|
| Model | NVIDIA GeForce RTX 4080 |
| Driver | 32.0.15.7270 (dated 2025-03-02) |
| VRAM | 16 GB GDDR6X (Win32_VideoController underreports as ~4 GB due to known DWORD overflow) |
| Display Mode | 2560 x 1440 |

Single-GPU desktop card. The RTX 4080 launched November 2022; everything else in this build dates to spring 2020. Approximate component ages: chassis/board/CPU/RAM/SATA SSDs ~6 years; GPU ~2-3 years; 970 EVO Plus likely contemporaneous with the GPU swap.

## Storage

### Physical drives

| Model | Capacity | Interface | Type | Serial |
|-------|----------|-----------|------|--------|
| Samsung SSD 970 EVO Plus 1TB | 1.0 TB | NVMe | SSD | `0025_3856_0140_0685` |
| Samsung SSD 840 PRO Series | 256 GB | SATA | SSD | `S1ATNSAD818855J` |
| SanDisk Ultra II 500 GB | 500 GB | SATA | SSD | `172542421676` |
| Seagate ST3000DM001-1CH166 | 3.0 TB | SATA | HDD (7200 RPM Barracuda 7200.14) | `W1F4BQM4` |

### Volumes

| Drive | Label | Free | Total | Free % | Filesystem |
|-------|-------|------|-------|--------|------------|
| C: | (system) | 19.2 GB | 930 GB | **2.1%** | NTFS |
| D: | Sandisk Ultra II | 66.6 GB | 465 GB | 14.3% | NTFS |
| E: | (unlabeled) | 44.1 GB | 214 GB | 20.6% | NTFS |
| F: | Media + Games | 357 GB | 2.73 TB | 13.1% | NTFS |

## Network

| Name | Description | MAC | Link Speed |
|------|-------------|-----|------------|
| Ethernet | Realtek PCIe 2.5GbE Family Controller | 2C-F0-5D-39-21-7F | 1 Gbps (negotiated; switch upstream is the bottleneck) |
| vEthernet (WSL) | Hyper-V Virtual Ethernet Adapter | 00-15-5D-A3-7E-BC | 10 Gbps (virtual) |

Other PnP detected (currently down or virtual): Intel Wi-Fi 6 AX201 160 MHz (built-in wireless, inactive — wired-preferred), Bluetooth PAN, multiple WAN miniports (PPPoE, PPTP, IKEv2, L2TP, SSTP, IPv6), Juniper Networks Virtual Adapter Manager (VPN client).

## Motherboard + BIOS

| Field | Value |
|-------|-------|
| Motherboard | MSI MPG Z490 GAMING CARBON WIFI (MS-7C73) |
| Board Serial | K516482460 |
| Board Version | 1.0 |
| BIOS Vendor | American Megatrends |
| BIOS Version | 1.10 / `ALASKA - 1072009` |
| BIOS Date | 2020-04-09 |

BIOS is from launch firmware (2020) — has not been updated in ~6 years. MSI has released numerous Z490 BIOS updates since (most recent 7C73vAH from 2024 addressing microcode/security patches).

## Role

Operational center of Sartor — the only Windows machine in the fleet, by design.

- Runs Claude Code as the orchestrator agent
- Holds the canonical `sartor/memory/` tree (a junction from `~/.claude/projects/C--Users-alto8/memory/` points here)
- **Sole machine with git-push credentials to GitHub.** Peer machines (gpuserver1, rtxpro6000server) write to `sartor/memory/inbox/{hostname}/` subdirectories; curator drains and pushes from this box
- Holds SSH keys to both peers
- Runs the thermal monitor for `rtxpro6000server` (Blackwell workstation brought online 2026-04-22)
- Hosts Chrome automation profile at `C:\Users\alto8\chrome-automation-profile\` on port 9223
- Hosts MERIDIAN dashboard on `localhost:5055`
- 11+ day uptime is consistent with always-on hub role

## Notes

1. **C: drive at 2.1% free (~19 GB).** Operational risk. At this level, Windows Update, hibernation, page-file growth, and temp-file allocation will start failing.
2. **16 GB RAM with 2 empty DIMM slots.** Easy +32 GB or +64 GB expansion non-destructively (G.Skill F4-3200C16-8GTZR kits still readily available, or swap to 2x16 GB / 4x16 GB).
3. **6-year-old BIOS.** Security/microcode updates since 2020 not applied.
4. **Mixed-age storage:** Samsung 840 PRO (~12 years old) and Seagate Barracuda 7200.14 3 TB (same vintage, the model with well-known reliability concerns) both still showing OK but on borrowed time. The 970 EVO Plus is the modern primary.
5. **Win32_VideoController.AdapterRAM shows ~4 GB for the RTX 4080** — known cosmetic DWORD-typed WMI field limitation for VRAM > 4 GB.
6. **Thermal sensors require elevation or vendor tool.** `MSAcpi_ThermalZoneTemperature` is access-denied without admin; HWiNFO64, MSI Center, or LibreHardwareMonitor are the paths if local thermal monitoring is wanted.
7. **CPU is the constraint relative to peers** — 8C/16T Comet Lake. Heavy training or large-model inference belongs on rtxpro6000server (Blackwell, 192 GB GDDR7) or gpuserver1 (RTX 5090, 32 GB GDDR7); this box's role is coordination, not compute.
8. **2.5 GbE NIC negotiating at 1 Gbps** — switch/router upstream is the bottleneck.
