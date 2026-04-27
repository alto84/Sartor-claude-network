---
name: rtxpro6000server-hardware
description: Bill of materials and hardware-specific quirks for rtxpro6000server. BoM verified against the 2026-04-12 build doc; live system reconnaissance 2026-04-26; thermal baseline + PWM-control investigation 2026-04-27.
type: machine-hardware
hostname: rtxpro6000server
date: 2026-04-26
updated: 2026-04-27
updated_by: rtxserver Opus 4.7 (fan-control directive Phase A — empirical thermal + PWM-control finding)
volatility: low
tags: [meta/hardware, machine/rtxpro6000server]
related:
  - machines/gpuserver1/HARDWARE
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
  - research/persona-engineering/HARDWARE-THERMAL-BASELINE
  - inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect
source: "Build doc 2026-04-12; live reconnaissance via dmidecode + lscpu + nvidia-smi + sensors on 2026-04-26; PWM pulse-map + 475 W thermal stress on 2026-04-27"
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
| **Chassis fans (motherboard-wired)** | 5× ARCTIC P14 PWM + 1× Noctua NF-A15 PWM | 1700 RPM / 1500 RPM max | Connected to motherboard CHA_FAN/CPU_FAN headers on `nct6798` super-IO. BIOS Q-Fan IV-controlled. **PWM control from Linux is non-functional in current BIOS state — see §"Fan control investigation" below.** |
| **Front-mesh "flower" fan array** | 3× Super Flower MEGACOOL | TBD RPM | **Out-of-band**: wired direct to PSU 12 V via manual case switch. NOT motherboard-controlled. No tach feedback. Flip switch is on/off only. Follow-up: convert to PWM via CHA_FAN splitter or hub — see `inbox/rocinante/flower-fans-pwm-conversion.md`. |
| **PSU** | TBD (build doc lookup pending) | Working assumption: 1400 W | `dmidecode -t 39` does not expose PSU rating on this SMBIOS 3.7 build; Phase 2 plan Decision 7 demands explicit verification before any 500 W/card run. **Empirically confirmed 2026-04-27: 15 A / 120 V wall breaker holds at ~1350 W system draw during 2× 475 W GPU stress.** |

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

**Empirical 2026-04-27 update:** the actual constraint at 475 W/card is *not* CPU compute-load — it is **GPU exhaust impingement on Tccd4** (see HARDWARE-THERMAL-BASELINE.md §2). Tccd1-3 stay at 56-58 °C, Tccd4 hits 86 °C, and the CPU is at ≤10 % utilization throughout. Tctl reads 86 °C as the worst-CCD aggregate, but the cooler is not under-spec'd — it is being overrun by GPU heat dumped into its intake. Headroom margins:

| Sensor | Steady-state @ 475 W/card | Throttle floor | Margin |
|--------|--------------------------:|---------------:|-------:|
| GPU0 temp | 83 °C | 92 °C | 9 °C |
| GPU1 temp | 72 °C | 92 °C | 20 °C |
| CPU Tctl | 86 °C | 95 °C | 9 °C |

**11 °C steady-state GPU0/GPU1 asymmetry** caused by airflow shadowing in PCIe slot 3 (GPU0 occupies slot above, dumps exhaust into GPU1's intake region and into CPU CCD-4 air column).

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

The formal characterization fired 2026-04-27. See `research/persona-engineering/HARDWARE-THERMAL-BASELINE.md` for full data. Key methodology points captured here for posterity:

1. **CPU package temp + per-CCD temps** via `sensors k10temp-pci-00c3` (the AMD Tctl + Tccd1-4 channels). There is no `/sys/devices/system/cpu/cpu0/thermal_throttle/` interface on AMD Ryzen / Threadripper — that's an Intel-specific path. AMD throttle status surfaces as Tctl pinning at the operating limit (95 °C for 7975WX) without further temperature rise even as power draw stays high. The throttle signal is therefore "Tctl saturates at ~95 °C with sustained power" rather than a counter increment.
2. **CPU package power** via `perf stat -e power/energy-pkg/` over a fixed window (the AMD RAPL counter exposes package energy in joules; divide by window for watts).
3. **Per-CCD frequencies** via `cpupower frequency-info` to confirm boost behavior is sustained vs derated.
4. **GPU temps + power** via `nvidia-smi --query-gpu=temperature.gpu,power.draw,utilization.gpu --format=csv` at 2 s resolution (used for the 2026-04-27 baseline).
5. **Fan RPMs.** Surfaced via `nct6775` driver after `sudo modprobe nct6775`. Maps to `/sys/class/hwmon/hwmon4/`. Driver reports chip identity as `NCT6798D or compatible chip at 0x2e:0x290`. **Add `nct6775` to `/etc/modules-load.d/` for persistent load across reboots.**

## Fan control investigation (2026-04-27)

### What's visible in sysfs

Driver `nct6775` exposes 7 PWM channels (`/sys/class/hwmon/hwmon4/pwm1..pwm7`) and matching tach inputs (`fan1..fan7_input`). At idle, BIOS Q-Fan IV holds every channel at `enable=5` (SmartFan IV) and applies a curve that reads from `temp_sel=8` (PECI Agent 0 = CPU package temp) on every channel.

### Per-channel state at boot (2026-04-27, ambient idle, GPUs ~28 °C)

| Channel | enable | pwm value | duty | RPM | Notes |
|---------|-------:|----------:|-----:|----:|-------|
| pwm1 | 5 | 153 | 60 % | 0 | empty header |
| pwm2 | 5 | 51 | 20 % | 608 | tach-attached fan |
| pwm3 | 5 | 153 | 60 % | 884-906 | tach-attached fan |
| pwm4 | 5 | 153 | 60 % | 914-929 | tach-attached fan |
| pwm5 | 5 | 153 | 60 % | 0 | empty header |
| pwm6 | 5 | 153 | 60 % | 0 | empty header |
| pwm7 | 5 | 255 | 100 % | 1689-1693 | BIOS curve = 255@0..255@100 (always 100 %); likely CPU_FAN driving the Noctua |

### Default BIOS auto-points (idle read)

For pwm1 through pwm6:
- auto_point1: `153 PWM @ 20 °C`
- auto_point5: `255 PWM @ 125 °C`

For pwm7:
- auto_point1: `255 PWM @ 0 °C`
- auto_point5: `255 PWM @ 100 °C`

So the BIOS curve coasts at 60 % until very high CPU temps, and pwm7 is pinned at 100 % full-time. This is why during the 475 W stress earlier tonight the fans appeared to be "coasting at 60 %" — that is what the BIOS register said it was driving.

### Critical finding: PWM writes don't actually change fan RPMs

Pulse-mapping each channel (set `enable=1`, write `pwm=255`, settle, write `pwm=80`, settle, restore) showed **zero RPM response** on any tach-attached fan. Even reasserting `pwm=0` for 20 s on pwm3 and pwm7 produced no slowdown. A 5 Hz reassertion loop showed `enable` silently flipping back from 1 → 0 between writes, and the fan never moved.

Conclusion: the ASUS WRX90E-SAGE SE EC owns the physical PWM lines, the BIOS Q-Fan IV firmware reasserts its computed values continuously, and OS writes to `nct6798` PWM registers do not propagate to the fan output multiplexer. **Fan control via the Linux nct6775 driver is non-functional on this board in current BIOS state.**

Pulse-mapper script: `experiments/2026-04-27-thermal-baseline/pwm_pulse_map.sh`. Log: `pwm_pulse_map.log`. Phone-home with full diagnostic detail and remediation paths: `inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect.md`.

### Remediation paths (Alton's call)

1. **BIOS Q-Fan disable + retest** (recommended first attempt; reversible).
2. **Kernel `acpi_enforce_resources=lax`** (cheap, may or may not work on WRX-class boards).
3. **USB hardware fan controller** (Aquacomputer Quadro / Phanteks UFC / NZXT RGB & Fan; daemon talks `liquidctl` instead of sysfs).
4. **Accept BIOS Q-Fan as the only control surface; tune curve in BIOS UI**; lose GPU-temperature input.

### Physical fan-to-PWM mapping (UNRESOLVED)

Could not determine which physical fan is on which pwmN — the pulse test produced no RPM response, so we have no way to identify the channel. Will resolve in a follow-up pass after Q-Fan is reconfigured. Interim hypothesis from the BIOS-curve shape: pwm7 (the always-100 % channel) is CPU_FAN driving the Noctua NF-A15 on the NH-U14S. The remaining tach-attached channels (pwm2, pwm3, pwm4) are 3 of the 5 ARCTIC P14 PWM units. The other 2 ARCTIC P14 may be daisy-chained (Y-cable) onto pwm3 or pwm4 with only one tach making it back to the board, or onto an empty-reading header (pwm1, pwm5, pwm6) where the tach wire was clipped.

### Front-mesh "flower" fan array — out of band

3× Super Flower MEGACOOL fans are wired direct to a PSU 12 V rail through a manual case switch. They have no PWM input and no tach return to the motherboard. They run at full speed when on, off when off. To make them dynamic-PWM-controllable, see `inbox/rocinante/flower-fans-pwm-conversion.md`.

## Operational profile under Phase 2 first-fire

Phase 2 first-fire is **single-card inference** at < 200 W/card (extrapolating from Phase 1's 170 W/card peak on a similar workload). CPU work is light tokenization only. **None of the thermal or PSU concerns gate first-fire.** The full hardware-characterization step gates Phase 2 cycle 2+ training fires only.

## Related artifacts

- `sartor/memory/research/persona-engineering/HARDWARE-THERMAL-BASELINE.md` — the empirical thermal characterization document, populated when the Phase 2 cycle 2+ precondition fires (TBD).
- `sartor/memory/research/persona-engineering/PHASE-2-RESEARCH-PLAN.md` Decisions 7 + 8 — operational discipline for Phase F GPU work.
- `sartor/memory/machines/gpuserver1/HARDWARE.md` — companion machine; documents the MSI Coreliquid AIO that was inadvertently attributed to this box in the 2026-04-26 first cooling-steering note.

## Open quirks

- PSU rating not yet read from `dmidecode -t 39` (SMBIOS 3.7.0 not fully supported by `dmidecode 3.3`). Need build-doc lookup or visual inspection of the PSU label; pre-Phase-F blocker per Phase 2 plan Decision 7.
- **PWM control via OS is non-functional in current BIOS state.** See "Fan control investigation" §. Daemon implementation paused.
- Physical fan ↔ PWM channel mapping unresolved — will produce after Q-Fan reconfigure or alternate control path.
- No `/sys/devices/system/cpu/cpu*/thermal_throttle/` on AMD — Phase 2 plan Decision 8's "per-core thermal throttle counter increments" check needs an AMD-specific equivalent (Tctl saturation at ~95 °C is the proxy signal).
- DRAM module count + speed not in this doc — back-fill from build doc at next pass.
- LAN topology and SSH access — rtxpro6000server is reached via tmux session `claude-team-1` per the persona-engineering passoff convention; no separate IP/hostname recon at this pass.
- `asus_wmi_sensors` module loads but exposes no sensor surface (`/sys/class/hwmon/hwmon3/asus/` empty). Possible ACPI DSDT extraction needed to find ASUS-WMI fan-control methods.
- `nct6775` driver was modprobed manually mid-session at t+2308 s on 2026-04-27; need persistent autoload via `/etc/modules-load.d/nct6775.conf`.

## History

- 2026-04-26: HARDWARE.md created during Phase 2 plan revise pass post-Cato-005, after Alton's 2026-04-26 BoM correction pointed out that the prior cooling-steering note had attributed the MSI Coreliquid AIO to this machine — that AIO is on `gpuserver1`. rtxserver is air-cooled with a Noctua NH-U14S TR5-SP6 on a 350 W-TDP 7975WX (zero headroom). Live reconnaissance via `dmidecode`, `lscpu`, `nvidia-smi`, `sensors` captured idle baseline. Empirical thermal curves under load deferred to HARDWARE-THERMAL-BASELINE.md ramp-test step (Phase 2 cycle 2+ precondition).
- 2026-04-27: Empirical thermal baseline at 475 W/card captured (5-min sustained dual-card matmul stress). Findings: GPU0 83 °C peak / GPU1 72 °C peak (11 °C asymmetry, slot-3 airflow shadow), Tctl 86 °C peak driven by **Tccd4** localized at 86 °C while Tccd1-3 stay 56-58 °C (GPU0 exhaust impingement, not CPU work). Pulse-mapping the 7 PWM channels uncovered that nct6798 PWM writes do not affect physical fan RPMs — the EC / Q-Fan IV firmware owns the fan output multiplexer. Daemon work blocked until Alton picks a remediation path. Phone-home filed at `inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect.md`.
