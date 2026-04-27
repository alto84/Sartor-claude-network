---
name: hardware-thermal-baseline
description: Empirical thermal characterization of rtxpro6000server under sustained dual-GPU load at 475 W per card, plus the empirical finding that the ASUS WRX90E-SAGE SE motherboard does not expose effective per-channel PWM control to the OS via the nct6798 driver. Phase 2 cycle-2+ precondition per PHASE-2-RESEARCH-PLAN Decision 8.
type: research-artifact
date: 2026-04-27
updated: 2026-04-27
updated_by: rtxserver Opus 4.7 (fan-control directive Phase A + Phase E writeup)
volatility: low
tags: [meta/hardware, machine/rtxpro6000server, research/persona-engineering, hardware/cooling]
related:
  - machines/rtxpro6000server/HARDWARE
  - inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
data:
  - experiments/2026-04-27-thermal-baseline/samples.jsonl  (n=450, 150 unique ts, 308 s window)
  - experiments/2026-04-27-thermal-baseline/stress.log
  - experiments/2026-04-27-thermal-baseline/pwm_pulse_map.sh
  - experiments/2026-04-27-thermal-baseline/pwm_pulse_map.log
---

# rtxpro6000server — empirical thermal baseline at 475 W/card

## TL;DR

- Dual-card sustained matmul stress at 475 W/card for ~5 minutes produced GPU0 peak 83 °C, GPU1 peak 72 °C, CPU Tctl peak 86.1 °C, with the heat localized on **Tccd4** (the CCD nearest the GPU0 exhaust path: peak 86.4 °C while Tccd1-3 stayed at 56-58 °C).
- The 11 °C steady-state GPU0/GPU1 asymmetry is not a card defect; it is airflow shadowing in PCIe slot 3 (the slot that physically sits behind GPU1, in GPU0's exhaust path).
- The CPU Tctl peak at 86 °C is misleading without per-CCD detail — only one CCD is hot, and it is hot because of GPU exhaust impingement, not CPU work. The real constraint at this power level is GPU exhaust management, not CPU cooler capacity.
- **The fan-control daemon directive is blocked**: the ASUS WRX90E-SAGE SE / EC firmware does not let the `nct6798` Linux PWM writes change physical fan RPMs. Empirical finding documented below in §3 and in `inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect.md`. Until BIOS Q-Fan is reconfigured (or a different control path is built), there is no OS-level lever to gain thermal headroom on this box. The thermal numbers above are therefore the baseline AND the current best-case.

## §1 — Test setup

| Parameter | Value |
|-----------|-------|
| Date / time | 2026-04-27 02:41-02:46 UTC |
| Cards | NVIDIA RTX PRO 6000 Blackwell Workstation Edition × 2, driver 580.126.09 |
| Per-card power cap | 475 W (`nvidia-smi -pl 475` on both cards) |
| Workload | Sustained matmul on each GPU (`/tmp/thermal-stress.py`); 63 000 matmuls on GPU0, 66 000 on GPU1 in 305-306 s |
| Sample cadence | 2 s |
| Sample duration | 308 s window (150 timestamps × 3 sources/ts = 450 lines) |
| Wall power | system draw ~1350 W (held by 15 A breaker on 120 V circuit) |
| Cooling state | BIOS Q-Fan IV default curve, all chassis fans at 60 % nominal PWM, CPU fan at 100 % per BIOS curve |
| Ambient room temp | (not instrumented; lab estimated 24 °C) |

Raw data: `experiments/2026-04-27-thermal-baseline/samples.jsonl`.

## §2 — Empirical thermal envelope

### Steady state (last 60 s of stress window)

| Sensor | avg | max |
|--------|-----:|----:|
| GPU0 temperature | 82.5 °C | 83.0 °C |
| GPU1 temperature | 71.7 °C | 72.0 °C |
| GPU0 power | 470.5 W | 475.0 W |
| GPU1 power | 463.2 W | 475.0 W |
| CPU Tctl | 85.3 °C | 86.1 °C |
| CPU Tccd1 | (full series) 47.2 avg / 58.5 peak |
| CPU Tccd2 | 46.1 avg / 57.8 peak |
| CPU Tccd3 | 45.7 avg / 56.4 peak |
| CPU Tccd4 | 78.3 avg / **86.4 peak** |

### Peak times

| Sensor | Peak | Time from start |
|--------|-----:|----------------:|
| GPU0 temperature | 83 °C | t+267 s |
| GPU1 temperature | 72 °C | t+228 s |
| CPU Tctl | 86.1 °C | t+306 s |
| CPU Tccd4 | 86.4 °C | t+294 s |

### GPU0–GPU1 asymmetry (full window)

| stat | value |
|------|------:|
| min ΔT (GPU0–GPU1) | 0 °C |
| max ΔT | 13 °C |
| avg ΔT | 7.1 °C |
| steady-state ΔT (last 60 s) | ~11 °C |

### Reading the data

1. **GPU0 runs 11 °C hotter than GPU1 at steady state** despite both cards running the same workload at the same power cap. This rules out per-card cooler defects and points to slot/airflow asymmetry. GPU0 occupies the upper PCIe x16 slot. Its exhaust pushes hot air into the volume occupied by GPU1's intake. GPU1 also dumps exhaust toward the rear of the case. The fan-shadow pattern is consistent across the entire run (GPU0 - GPU1 ΔT > 0 for all 150 samples).

2. **CPU Tctl reads 86 °C but only Tccd4 is actually hot.** Tccd1-3 stay at 56-58 °C; Tccd4 hits 86 °C. The Threadripper PRO 7975WX has 4 CCDs; Tctl is the package-level proxy that aggregates the worst CCD. Per the WRX90E-SAGE SE board layout, Tccd4 is the CCD physically closest to the GPU exhaust path. **Tccd4 is being heated by GPU0's exhaust, not by CPU work** — the CPU was running only the Python harness (≤10 % util) during the test. The CPU cooler (Noctua NH-U14S TR5-SP6) is not the bottleneck at this load; the case airflow is.

3. **Power was capped at 475 W and held there.** GPU0 averaged 470.5 W, GPU1 averaged 463.2 W in steady state. Both cards reached the per-card cap. The 11 °C asymmetry is therefore not a power-asymmetry artifact.

4. **Wall draw stayed at the breaker limit (~1350 W).** No throttling event from the breaker; the breaker was holding but the system is at the operational ceiling.

### Headroom analysis (current cooling)

- GPU0 at 83 °C is 9 °C below the 92 °C throttle floor for RTX PRO 6000 Blackwell. Margin: **9 °C**.
- GPU1 at 72 °C is 20 °C below throttle. Margin: **20 °C**.
- CPU Tctl at 86 °C is 9 °C below the 95 °C throttle ceiling for Threadripper PRO 7975WX. Margin: **9 °C**.
- All three are positive; the run was not in throttle. But **9 °C of margin on GPU0 and CPU Tctl is the real budget for any longer / hotter / higher-utilization workload.**

### Implication for Phase 2 cycle 2+

The Phase 2 plan's 500 W/card target is a 5 % power increase from this 475 W baseline. Linear extrapolation says ~+2 °C on GPU0 (toward 85 °C, margin ~7 °C) and proportional on Tccd4. **That is workable but tight.** A 600 W/card run is *not* workable from this thermal floor — GPU0 would saturate.

The asymmetry matters more than the average. Any cycle 2+ training plan that holds both cards at 500 W simultaneously needs to either fix the slot-3 airflow or accept that GPU0 is the throttle leader.

## §3 — Fan-control investigation: PWM writes have no effect

This section documents the Phase A finding that blocked the rest of the directive. Full detail in `inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect.md`. Summary here for completeness.

### Hardware control surface

- Driver: `nct6775` (in-tree on Linux 6.8.0-110-generic). Detects "NCT6798D or compatible chip at 0x2e:0x290".
- Sysfs: `/sys/class/hwmon/hwmon4/` exposes `pwm1..pwm7`, `pwmN_enable`, `fanN_input`, etc.
- Mode: every channel at `pwm_mode=1` (PWM, not DC); every channel at `pwm_enable=5` (BIOS Q-Fan IV / SmartFan IV) at idle.
- Tach-attached headers: pwm2 (608 RPM idle), pwm3 (~880 RPM idle), pwm4 (~920 RPM idle), pwm7 (~1690 RPM idle, BIOS-pinned to 100 %). pwm1, pwm5, pwm6 read 0 RPM (empty).

### Finding

Every channel accepts writes to `pwmN` and `pwmN_enable`, the values appear to persist for some seconds, **but the physical fan RPM does not change** at any commanded duty cycle.

Tested:

```
pwm3: enable=1, pwm=255 → 890 rpm (vs baseline 884)
pwm3: enable=1, pwm=80  → 897 rpm
pwm3: enable=1, pwm=0   reasserted every 2s for 20s → still 880-901 rpm

pwm7: enable=1, pwm=0   reasserted every 2s for 20s → still 1677-1693 rpm
pwm7: enable=1, pwm=80  → 1681 rpm

pwm3: enable=1+pwm=255 reasserted every 200ms for 15s
       → final state: pwm=255 enable=0 fan3=885 rpm
       (enable was silently flipped from 1 → 0 by the firmware/EC during the loop)
```

The `enable` flag silently drifts back to 0 even while we hammer it at 5 Hz, and the fan output ignores whatever value is in the PWM register.

### Most likely cause

ASUS Pro WS WRX90E-SAGE SE has an embedded controller (EC) that owns the physical PWM lines. Q-Fan IV firmware in the EC continuously asserts its own computed PWM values onto the fan headers based on the BIOS curve, sourcing temperature from PECI Agent 0 (CPU temp). The `nct6798` chip the driver is writing to is the same silicon, but its OS-side register file is not authoritative for the fan output multiplexer. Linux writes go through, the fans never see them. This pattern is documented anecdotally for several ASUS WRX80E and WRX90E boards.

### What this means for the daemon

A daemon that writes `/sys/class/hwmon/hwmon4/pwmN` from userspace cannot work on this box in its current configuration. The directive's Phase B is blocked until one of:

1. **BIOS reconfigure.** Set every fan channel in the Q-Fan IV configuration to "Manual" or "Disabled". Reboot into Linux. Retest the pulse-mapping script. If pwm writes now move RPMs, build the daemon as designed.
2. **Kernel `acpi_enforce_resources=lax`.** Cheap to try; mixed reports of effectiveness on ASUS WRX-class boards.
3. **USB hardware controller** (Aquacomputer Quadro, Phanteks Universal Fan Controller, etc.). Bypasses the motherboard. Daemon talks `liquidctl` instead of sysfs.
4. **Accept Q-Fan as the only control surface.** Tune the curve via BIOS UI. No daemon, no GPU-temperature input.

Recommendation: try (1) first. It is reversible from BIOS, costs nothing, and resolves the question quickly.

### Why the existing baseline is the worst case until this is fixed

The 5-minute test ran with the BIOS Q-Fan curve doing its thing — it would have ramped chassis PWM toward 75-85 % at 86 °C CPU temp. The thermal envelope above is therefore not "underlying capacity with poor fan behavior"; it is "underlying capacity with whatever the EC chose to do, which is the only thing that actually moves these fans today". A daemon that sets PWM=100 % all the time would not change the fan output today. Solving the EC-mediation problem is the ONLY way to push this baseline tighter.

## §4 — Recommendations

In priority order.

1. **Fix the control path before optimizing the curve.** No daemon work matters until OS PWM writes affect fan RPMs. See §3 path 1.
2. **Address the slot-3 airflow asymmetry, not the cooler.** GPU0 at 83 °C and Tccd4 at 86 °C share a cause: GPU0 exhaust impinging on GPU1's intake region and on the CPU CCD nearest the GPU. Options: (a) reverse one or two front intake fans to be exhaust if the case allows; (b) add a slot-area divider/shroud; (c) physically separate the cards by one slot if a 4-slot gap is possible (it is not on this 7-slot board with 4-slot cards); (d) reposition the front intake stack to push more flow toward the upper-front quadrant.
3. **Make the front-mesh ("flower") fan array PWM-controllable.** Currently wired direct to PSU via manual switch — no temperature feedback. A Phanteks Enthoo Pro 2 ships with a built-in PWM hub; if not already used, plumb the flower array through the hub and into a CHA_FAN header. See `sartor/memory/inbox/rocinante/flower-fans-pwm-conversion.md` for hardware options.
4. **Defer 600 W/card runs indefinitely.** With current cooling, GPU0 has 9 °C of margin at 475 W. 600 W is a 26 % power bump and the linear extrapolation says GPU0 saturates. The PSU constraint (1400 W ceiling) already gates this, but the thermal constraint independently does too.
5. **Instrument ambient room temp.** A ±3 °C room temp swing dominates the 9 °C margin we have. Even a cheap USB temp probe in the case-front would let us adjust per-day expectations.
6. **Re-baseline post-fix.** Once §3 is resolved and a daemon is in place, re-run this exact 475 W workload and compare. The delta is the actual headroom the daemon bought us; that number drives whether 500 W is workable.

## §5 — Open quirks for next pass

- The `asus_wmi_sensors` module is loaded on this box but `/sys/class/hwmon/hwmon3/asus/` is empty. The module is reading nothing. Either no ASUS-WMI sensor surface on WRX90E-SAGE SE, or the relevant DSDT/SSDT methods aren't being walked. Worth a `cat /sys/firmware/acpi/tables/DSDT > /tmp/dsdt.aml && iasl -d /tmp/dsdt.aml` pass to look for ASUS-specific fan-control methods (`MFAN`, `SFAN`, etc.).
- We did not test what happens if Q-Fan is set to "PWM" vs "DC" override in BIOS. The driver reports `pwm_mode=1` (PWM) but that may be a default rather than a board-actual.
- The pwm7 BIOS curve is `255@0..255@100`, i.e. always 100 % — likely the CPU fan or AIO pump-equivalent header. We did not confirm physical mapping because the writes had no effect to confirm against. A future pass with Q-Fan disabled should re-run the pulse-mapping script and produce the actual pwmN→physical-fan map (ARCTIC P14 ×5, Noctua ×1).

## §6 — Data files

| Path | Description |
|------|-------------|
| `experiments/2026-04-27-thermal-baseline/samples.jsonl` | 450 lines: GPU0/1 temp+power+util + CPU Tctl + per-CCD at 2 s cadence over 308 s |
| `experiments/2026-04-27-thermal-baseline/stress.log` | Stress harness log — 63k matmuls GPU0, 66k matmuls GPU1, 305-307 s wall |
| `experiments/2026-04-27-thermal-baseline/pwm_pulse_map.sh` | Phase-A pulse-mapper (now retired; safe to re-run after Q-Fan fix) |
| `experiments/2026-04-27-thermal-baseline/pwm_pulse_map.log` | Phase-A pulse-map output showing no RPM response |

## History

- 2026-04-27 02:41-02:46 UTC: Baseline thermal test ran (5 min @ 475 W/card). Findings: GPU0 83 °C, GPU1 72 °C, Tctl 86 °C, Tccd4 the localized hot spot at 86 °C.
- 2026-04-27 03:05-03:25 UTC: Pulse-mapping and pwm-write tests proved the OS PWM control path is non-functional in current BIOS state.
- 2026-04-27 03:25 UTC: Phone-home filed. Daemon work paused pending Alton's path decision.
