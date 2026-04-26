---
name: machines-index
description: Top-level index of per-machine hardware inventories under sartor/memory/machines/. One row per peer machine in the Sartor fleet, plus cross-machine quirks and outstanding hardware-receipt followups. For domain-level operational context (SSH, git push, inbox flow, vast.ai), see the canonical [[MACHINES|sartor/memory/MACHINES.md]] one level up.
type: hardware-inventory-index
date: 2026-04-26
updated: 2026-04-26
updated_by: Rocinante Opus 4.7 (hardware-mapping synthesis)
volatility: low
last-verified: 2026-04-25
tags: [meta/hardware, fleet, index]
related: [[MACHINES]], [[machines/rocinante/HARDWARE]], [[machines/gpuserver1/HARDWARE]], [[machines/rtxpro6000server/HARDWARE]]
---

# machines/ index — fleet hardware

Three peer machines on the Montclair LAN. One Windows hub, two Ubuntu compute peers.

## Fleet at a glance

| Hostname | Role | Build date | OS | CPU | GPU | RAM | Primary storage | IP | HARDWARE.md |
|----------|------|-----------|-----|------|------|------|-----------------|------|-------------|
| **rocinante** | Household coordination hub (Claude Code orchestrator, memory junction, sole git-push origin, SSH key custodian, thermal monitor for rtxserver) | ~2020 (chassis); ~2023 (GPU) | Windows 10 Home (10.0.19045) | Intel i7-10700 (8C/16T Comet Lake) | NVIDIA RTX 4080 (16 GB GDDR6X) | 16 GB DDR4-3200 (2-of-4 slots) | Samsung 970 EVO Plus 1 TB NVMe | (LAN client) | [[machines/rocinante/HARDWARE]] |
| **gpuserver1** | Solar Inference LLC vast.ai rental host | 2025-09-29 | Ubuntu 22.04.5 LTS (HWE 6.8.0-90) | Intel i9-14900K (24C/32T, 8P+16E) | NVIDIA RTX 5090 32 GB GDDR7 (Gigabyte AIB) | 128 GB DDR5-5600 (2× 64 GB G.Skill, A2+B2) | SK hynix Platinum P41 2 TB NVMe Gen4 | 192.168.1.100 (DMZ) | [[machines/gpuserver1/HARDWARE]] |
| **rtxpro6000server** | Dual-Blackwell training/inference workstation | 2026-04-12 | Ubuntu 22.04.5 LTS (HWE 6.8.0-110) | AMD Threadripper PRO 7975WX (32C/64T, sTR5/SP6) | 2× NVIDIA RTX PRO 6000 Blackwell (96 GB GDDR7 each, 192 GB total) | 256 GB DDR5-4800 ECC RDIMM (8× 32 GB V-Color, 8/8 channels) | Samsung 9100 PRO 2 TB PCIe 5.0 (boot) + Samsung 990 PRO 4 TB (data, unmounted) | 192.168.1.157 | [[machines/rtxpro6000server/HARDWARE]] |

## Receipt provenance

| Hostname | Primary receipt(s) | Vendor | Total |
|----------|-------------------|--------|-------|
| rocinante | _none on file_ — chassis/board/CPU/RAM predate the Sartor memory system | — | — |
| gpuserver1 | `C:/Users/alto8/Downloads/Solar Inference LLC/3 - GPU Rig/Computer parts bill.pdf` (Newegg orders 383828549 + 383828569, 2025-09-29); `Order Details 5090.pdf` (Amazon order 112-9354282-5317043, 2025-09-22) | Newegg + Amazon | $4,207.93 (Solar Inference LLC books, depreciation tracked) |
| rtxpro6000server | `C:/Users/alto8/Downloads/Receipts/rtxpro6000server-2026-04-12/Newegg.com Order #_ 408668539, 408668439, 408668519, .._.pdf` + `Newegg.com Order #_ 412968624.pdf` + `Newegg.com Order #_ 412970644, 412970664.pdf` (10 orders, 2026-04-12) | Newegg | ~$38,418 line-item total (Voided Super Flower 2200W replaced by be quiet! 1600W) |

The Solar Inference LLC PDFs are filed by business entity for tax purposes (depreciation schedule sourced from there). The rtxpro6000server receipts were moved 2026-04-26 from `Downloads/` root into `Downloads/Receipts/rtxpro6000server-2026-04-12/`, which establishes the canonical filing pattern: `Downloads/Receipts/{hostname}-{build-date}/`.

## Peer-coordinator quirks

Operationally relevant cross-machine knowledge a future Claude would want.

### rocinante (Windows hub)

- **Sole git-push origin.** Has GitHub credentials; peers don't. Inbox pattern is the canonical write path from peers (see [[MULTI-MACHINE-MEMORY]] and the [[reference/OPERATING-AGREEMENT|Operating Agreement]]).
- **Sole SSH-key custodian.** Holds keys to both peers; peers don't reciprocate.
- **`C:` drive at 2.1% free (~19 GB)** at last capture — operational risk, monitor.
- **Hyper-V + WSL2 + Chrome automation profile** all share this box; vEthernet (WSL) shows as 10 Gbps virtual.
- 2.5GbE NIC negotiating at 1 Gbps — switch upstream is the bottleneck.

### gpuserver1 (vast.ai rental host)

- **Vast.ai rental container active** at survey time: `C.34113802` (`vastai/pytorch_cuda-12.8.1-auto/ssh`), 3-week uptime. Three exposed ports (40020→22, 40052, 40064→8188, 40092→8189) consistent with a tenant running ComfyUI or similar inference. **Do not interact with the container** — read-only SSH from Rocinante by convention; `nvidia-smi --gpu-reset` and any write op against the container is forbidden while a tenant is in residence.
- **Hairpin NAT quirk on Fios router:** LAN cannot route to its own public IP. Fixed via `iptables OUTPUT DNAT` rule + `DOCKER-USER conntrack` rule.
- **Vast.ai tend script** runs every 2h via cron (`~/vastai-tend.sh`); alerts land in `~/.vastai-alert`.
- **Memory speed quirk:** kit-rated DDR5-6000 EXPO, system runs at 5600 MT/s (Intel IMC native, or XMP/EXPO not engaged). Not a fault.
- **AIO pump** has no software-readable RPM (MAG Coreliquid A13 line — no USB, no liquidctl support); CPU thermal stability over time is the proxy for pump health.

### rtxpro6000server (Blackwell workstation)

- **Multi-shell tmux protocol** is the standard interaction pattern — peer-coordinator agent uses tmux for multi-window state; OAuth-pre-seeded Claude Code CLI 2.1.118 is installed locally.
- **CPU cooler is air, not AIO** — Noctua NH-U14S TR5-SP6 is rated for ~350 W, 7975WX is exactly 350 W → **zero thermal headroom** if all 32 cores boost simultaneously under sustained workload. No characterization yet under full-tilt training.
- **Both GPUs were physically re-slotted on 2026-04-22** during a sag-bracket install (one slot was finicky, DPC-tripped under bump). PCIe addresses changed from `c1:00.0` + `e1:00.0` (split across two IO dies) to `01:00.0` + `02:00.0` (both on the primary IO die). Bandwidth-positive — keeps NCCL traffic within one IO die.
- **GPU PCIe link at idle is Gen 1**, not Gen 5. Normal NVIDIA Workstation power-save behavior; trains up under load. Not a fault.
- **PSU is be quiet! Dark Power PRO 13 1600 W** (Titanium); replaced the Voided Super Flower 2200W on the original cart same-day.
- **Stale Windows install on a Samsung 850 SATA** (~466 GB) sits beside Ubuntu — bootable but never used; wipe-or-leave decision pending.
- **990 PRO 4 TB unmounted** — needs partition + mount (likely `/data`).
- **AST2600 BMC** at `e3:00.0` provides server-class out-of-band IPMI/KVM. Not yet wired into Rocinante's monitoring loop — fan curves are not introspectable from Linux on this WRX90 board, so IPMI is the route if fan tuning becomes important.

## Cross-machine quirks

### Power-cap policies

| Machine | GPU power cap | Default | Sustained envelope |
|---------|--------------|---------|--------------------|
| rocinante | RTX 4080 stock | 320 W | Light (display + occasional small inference) |
| gpuserver1 | 600 W (default = max) | 600 W | Tenant-driven; idle ~22 W |
| rtxpro6000server | 600 W per GPU (default = max) × 2 | 1200 W combined | Training-class; idle ~6-15 W per GPU |

No power-cap reductions in effect at the 2026-04-25 capture across the fleet.

### Thermal envelopes observed (idle, capture week of 2026-04-25)

| Machine | CPU | GPU(s) | Notes |
|---------|-----|--------|-------|
| rocinante | not-readable (Win32 ACL) | not-queried | Use HWiNFO64 / LibreHardwareMonitor for in-depth |
| gpuserver1 | 14900K Tctl 39 °C | 5090 @ 42 °C | Healthy under 21-day uptime + active rental |
| rtxpro6000server | 7975WX Tctl 46.6 °C | 28-29 °C per GPU | Idle band; no characterization under sustained 32-core boost yet |

### Operational rules of thumb

- **Heavy training and large-model inference belong on rtxpro6000server.** 192 GB GDDR7 across two cards beats anything else on the fleet.
- **vast.ai rentals belong on gpuserver1.** Single 5090, listed at $0.35/hr on-demand, $0.26/hr interruptible, $0.40/hr reserved (verified 2026-04-19).
- **Coordination, scheduling, browsing, drafting belong on rocinante.** RTX 4080 has plenty of headroom for orchestrator-side workload but should not be expected to pull weight beyond its 16 GB VRAM ceiling.

## Followups

1. **Newegg order #405293759 (2025-12-13)** — surfaced in the Gmail sweep but no PDF on disk and no current mapping to any machine. Confirmed in Gmail: shipped 2025-12-15, delivered 2025-12-19, two items. Predates both the April 2026 Blackwell workstation rebuild and the September 2025 gpuserver1 build. **Action:** manual download from Newegg → file under appropriate machine's receipts folder once contents are known.
2. **rtxpro6000server CPU thermal headroom under sustained boost** — Noctua NH-U14S TR5-SP6 air cooler at the edge of TDP envelope. Run a controlled `stress-ng --cpu 64` or full LoRA fine-tune and capture peak Tctl; if it approaches 95 °C, AIO upgrade is the path.
3. **rtxpro6000server 990 PRO 4 TB unmounted** — partition + mount decision (likely `/data`).
4. **rtxpro6000server stale Samsung 850 Windows install** — wipe-or-leave decision.
5. **rocinante `C:` drive at 2.1% free** — cleanup or expansion. Not advisory; tracked here as the primary fleet-level operational hardware risk.
6. **rocinante BIOS 6 years old** (AMI 1.10 / 2020-04-09) — security/microcode updates pending; batch with any other planned downtime (RAM expansion, etc.).
