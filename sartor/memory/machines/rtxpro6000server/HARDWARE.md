---
name: rtxpro6000server-hardware
description: Bill of materials and hardware-specific quirks for rtxpro6000server. BoM verified against the 2026-04-12 build doc; live system reconnaissance 2026-04-26.
type: machine-hardware
hostname: rtxpro6000server
date: 2026-04-26
updated: 2026-04-26
updated_by: rtxserver Opus 4.7 (Phase 2 plan revise pass; BoM-correction pass post-Alton 2026-04-26)
volatility: low
tags: [meta/hardware, machine/rtxpro6000server]
related:
  - machines/gpuserver1/HARDWARE
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
  - research/persona-engineering/HARDWARE-THERMAL-BASELINE
source: "Build doc 2026-04-12; live reconnaissance via dmidecode + lscpu + nvidia-smi + sensors on 2026-04-26"
---

# rtxpro6000server — bill of materials and hardware quirks

## Summary

rtxpro6000server (hostname: `rtxpro6000server`, LAN: TBD; the gateway-targeted IP is the public-DMZ machine `gpuserver1` per CLAUDE.md, not this box) is the persona-engineering training/inference machine. **Air-cooled** workstation built around a Threadripper PRO 7975WX with 2× RTX PRO 6000 Blackwell cards. Companion to `gpuserver1` (which is the LAN-DMZ vast.ai earner with a 14900K + 5090 + MSI MAG Coreliquid AIO — **different machine, different cooler class**).

## Bill of materials (build doc 2026-04-12)

| Component | Item | TDP / spec | Notes |
|-----------|------|------------|-------|
| **CPU** | AMD Ryzen Threadripper PRO 7975WX (Storm Peak) | 350 W TDP | sTR5 socket; 32 cores / 64 threads; verified via `lscpu` 2026-04-26 |
| **CPU cooler** | **Noctua NH-U14S TR5-SP6** | sTR5-rated to ~350 W TDP | **Air cooler. ZERO TDP HEADROOM relative to CPU.** Single PWM tower; 140 mm fan; designed specifically for sTR5/SP6 socket geometry. |
| **Motherboard** | ASUS Pro WS WRX90E-SAGE SE | WRX90 chipset, sTR5, EATX | 7 × PCIe 5.0 x16 slots, 4 × M.2, 2 × U.2; AMI BIOS v1203 (07/18/2025); verified via `dmidecode -t 2` |
| **RAM** | 256 GB DDR5 (8-channel) | TBD ECC RDIMM speed | `free -g` reports 251 GB usable; module count + speed from build doc to be back-filled |
| **GPU 0** | NVIDIA RTX PRO 6000 Blackwell Workstation Edition | 600 W max-power-limit | 96 GB VRAM (97887 MiB); driver 580.126.09 verified via `nvidia-smi` |
| **GPU 1** | NVIDIA RTX PRO 6000 Blackwell Workstation Edition | 600 W max-power-limit | 96 GB VRAM; same driver |
| **Storage** | 2× M.2 NVMe (per `sensors`: `nvme-pci-e100` + `nvme-pci-8900`) | TBD spec | Both reporting healthy (~30 °C idle, crit thresholds 84.8 °C / 87.8 °C) |
| **Case** | Phanteks Enthoo Pro 2 | Full-tower | Front intake + rear/top exhaust default airflow |
| **Case fans** | ARCTIC P14 PWM, 5-pack | 1700 RPM max each | BIOS-controlled PWM; arrangement to be confirmed during HARDWARE-THERMAL-BASELINE survey |
| **PSU** | TBD (build doc lookup pending) | Working assumption: 1400 W | `dmidecode -t 39` does not expose PSU rating on this SMBIOS 3.7 build; Phase 2 plan Decision 7 demands explicit verification before any 500 W/card run |

## Verified live reconnaissance (2026-04-26)

```
$ lscpu | grep "Model name"
Model name: AMD Ryzen Threadripper PRO 7975WX 32-Cores

$ nvidia-smi --query-gpu=name,driver_version,memory.total,power.max_limit --format=csv,noheader
NVIDIA RTX PRO 6000 Blackwell Workstation Edition, 580.126.09, 97887 MiB, 600.00 W
NVIDIA RTX PRO 6000 Blackwell Workstation Edition, 580.126.09, 97887 MiB, 600.00 W

$ sensors | grep -A 5 k10temp
k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +47.1°C   (CPU at idle)
Tccd1-4:      +41-48°C  (per-CCD readings)

$ free -g | grep Mem
Mem:    251        8        1        0      240      239

$ sudo dmidecode -t 2 | grep "Product Name"
Product Name: Pro WS WRX90E-SAGE SE

$ sudo dmidecode -t 0 | grep -E "Vendor|Version|Date"
Vendor: American Megatrends Inc.
Version: 1203
Release Date: 07/18/2025
```

## Power profile and PSU constraint

The PSU rating is the load-bearing operational unknown. Working assumption from Alton's 2026-04-26 steering: **1400 W**.

Power budget at full saturation:

| Component | Worst-case draw | Notes |
|-----------|----------------:|-------|
| GPU 0 at 500 W cap | 500 W | per-card cap via `nvidia-smi -pl 500` |
| GPU 1 at 500 W cap | 500 W | per-card cap via `nvidia-smi -pl 500` |
| Threadripper PRO 7975WX | 350 W | CPU TDP (verified) |
| Motherboard + DRAM + storage + fans | ~50 W | conservative |
| **Total** | **~1400 W** | **At PSU ceiling. Zero slack.** |

**Operational consequence:** No 600 W/card runs are authorized. Per-card cap = 500 W until PSU is verified ≥ 1500 W. If `dmidecode -t 39` (or build-doc lookup) returns < 1500 W, drop per-card cap to 450 W. Phase 2 plan Decision 7 captures this discipline.

## Cooling profile and CPU thermal-throttle risk

The Noctua NH-U14S TR5-SP6 is rated for sTR5 / SP6 sockets up to **~350 W TDP** — the same as the 7975WX. **Zero thermal headroom on the CPU side.**

This is fine for typical workloads where CPU and GPUs do not saturate simultaneously: GPU-bound inference leaves the CPU idling at ~30-50 W. But Phase 2 cycle 2+ training runs (rungs 3, 4, 5, 6 in METHODS.md) involve active host-side work — data loader, MoE expert routing dispatch, gradient sync across cards via PCIe — that pushes the CPU hard while the GPUs are also at sustained 500 W. In that simultaneous-load regime, the CPU is the more likely thermal-throttle point, not the GPUs.

### Idle reconnaissance (2026-04-26, Phase 2 plan synthesis time)

| Sensor | Value |
|--------|-------|
| CPU Tctl | 47.1 °C |
| CPU per-CCD (Tccd1-4) | 41-48 °C |
| GPU 0 | 28-29 °C (reported during prior nvidia-smi captures) |
| GPU 1 | 28 °C |
| NVMe 0 (`nvme-pci-e100`) | 29.9 °C |
| NVMe 1 (`nvme-pci-8900`) | 29.9 °C |

Idle baseline established; under-load curves to be captured during the HARDWARE-THERMAL-BASELINE ramp-test step (Phase 2 plan Decision 8).

### Notes for HARDWARE-THERMAL-BASELINE.md

When the formal thermal characterization runs (Phase 2 cycle 2+ precondition), capture:

1. **CPU package temp + per-CCD temps** via `sensors k10temp-pci-00c3` (the AMD Tctl + Tccd1-4 channels). Note: there is no `/sys/devices/system/cpu/cpu0/thermal_throttle/` interface on AMD Ryzen / Threadripper — that's an Intel-specific path. AMD throttle status surfaces as Tctl pinning at the operating limit (95 °C for 7975WX) without further temperature rise even as power draw stays high. The throttle signal is therefore "Tctl saturates at ~95 °C with sustained power" rather than a counter increment.
2. **CPU package power** via `perf stat -e power/energy-pkg/` over a fixed window (the AMD RAPL counter exposes package energy in joules; divide by window for watts).
3. **Per-CCD frequencies** via `cpupower frequency-info` to confirm boost behavior is sustained vs derated.
4. **GPU temps + power** via `nvidia-smi --query-gpu=temperature.gpu,power.draw` at 5 s resolution.
5. **Fan RPMs.** CPU fan + case fan PWM tach channels are NOT visible in the current `sensors` output (lm-sensors module loaded for k10temp + nvme but not for ASUS WRX90 super-IO chipset). Need to load `nct6775` or equivalent via `sudo modprobe` and re-survey, OR read fan curves from BIOS UI directly.

## Operational profile under Phase 2 first-fire

Phase 2 first-fire is **single-card inference** at < 200 W/card (extrapolating from Phase 1's 170 W/card peak on a similar workload). CPU work is light tokenization only. **None of the thermal or PSU concerns gate first-fire.** The full hardware-characterization step gates Phase 2 cycle 2+ training fires only.

## Related artifacts

- `sartor/memory/research/persona-engineering/HARDWARE-THERMAL-BASELINE.md` — the empirical thermal characterization document, populated when the Phase 2 cycle 2+ precondition fires (TBD).
- `sartor/memory/research/persona-engineering/PHASE-2-RESEARCH-PLAN.md` Decisions 7 + 8 — operational discipline for Phase F GPU work.
- `sartor/memory/machines/gpuserver1/HARDWARE.md` — companion machine; documents the MSI Coreliquid AIO that was inadvertently attributed to this box in the 2026-04-26 first cooling-steering note.

## Open quirks

- PSU rating not yet read from `dmidecode -t 39` (SMBIOS 3.7.0 not fully supported by `dmidecode 3.3`). Need build-doc lookup or visual inspection of the PSU label; pre-Phase-F blocker per Phase 2 plan Decision 7.
- Fan RPM channels not yet visible to `lm-sensors`. The ASUS Pro WS WRX90E-SAGE SE uses an embedded super-IO chip; finding the right kernel module (likely `nct6775` family or `asus-wmi-sensors`) is part of the HARDWARE-THERMAL-BASELINE survey.
- No `/sys/devices/system/cpu/cpu*/thermal_throttle/` on AMD — Phase 2 plan Decision 8's "per-core thermal throttle counter increments" check needs an AMD-specific equivalent (Tctl saturation at ~95 °C is the proxy signal).
- DRAM module count + speed not in this doc — back-fill from build doc at next pass.
- LAN topology and SSH access — rtxpro6000server is reached via tmux session `claude-team-1` per the persona-engineering passoff convention; no separate IP/hostname recon at this pass.

## History

- 2026-04-26: HARDWARE.md created during Phase 2 plan revise pass post-Cato-005, after Alton's 2026-04-26 BoM correction pointed out that the prior cooling-steering note had attributed the MSI Coreliquid AIO to this machine — that AIO is on `gpuserver1`. rtxserver is air-cooled with a Noctua NH-U14S TR5-SP6 on a 350 W-TDP 7975WX (zero headroom). Live reconnaissance via `dmidecode`, `lscpu`, `nvidia-smi`, `sensors` captured idle baseline. Empirical thermal curves under load deferred to HARDWARE-THERMAL-BASELINE.md ramp-test step (Phase 2 cycle 2+ precondition).
