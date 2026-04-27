---
name: phone-home-fan-control-pwm-no-effect
description: Phase A of the fan-control directive uncovered that the nct6798 PWM channels do not actually control fan speed on rtxpro6000server. The Linux kernel writes succeed, the values persist briefly, but the physical fans do not respond at any duty cycle (PWM=0 produces the same RPM as PWM=255). Daemon design (Phase B) is blocked until a different control path is found or the BIOS Q-Fan logic is reconfigured.
type: phone-home
hostname: rtxpro6000server
date: 2026-04-27
author: rtxserver Opus 4.7 (fan-control directive Phase A)
phase: blocked-on-hardware-control-path
related:
  - machines/rtxpro6000server/HARDWARE
  - research/persona-engineering/HARDWARE-THERMAL-BASELINE
tags: [meta/phone-home, machine/rtxpro6000server, hardware/cooling]
---

# PHONE-HOME — fan control directive blocked: PWM writes have no effect

## Verdict

**STOP** before Phase B (daemon implementation).

The directive's phone-home trigger fired at Phase A:

> The PWM channel mapping reveals fans are wired in unexpected ways

The actual finding is more severe than "wired in unexpected ways": **none of the 7 PWM channels exposed by the `nct6798` driver actually control fan speed**. Writes succeed in sysfs, values persist briefly, but the fans hold their baseline RPM regardless of the duty cycle commanded.

A GPU-aware fan-control daemon that writes to `pwmN` cannot work on this box in its current state. We need a different control path before Phase B is meaningful.

## Empirical evidence

### Setup

- Driver: `nct6775` v(in-tree on Linux 6.8.0-110-generic) loaded; chip detected as `NCT6798D or compatible chip at 0x2e:0x290`
- ASUS Pro WS WRX90E-SAGE SE, AMI BIOS 1203 (07/18/2025)
- `pwm_mode=1` (PWM mode) on every channel
- `pwm{1..7}_enable=5` at idle (BIOS Q-Fan IV / SmartFan IV)
- All 7 channels share `temp_sel=8` (PECI Agent 0 / CPU temp)

### Channel state at idle (just after reboot, GPUs at 27-28 °C)

```
pwm1: enable=5 pwm=153 (60%) fan1_rpm=0    ← empty header
pwm2: enable=5 pwm=51  (20%) fan2_rpm=608
pwm3: enable=5 pwm=153 (60%) fan3_rpm=906
pwm4: enable=5 pwm=153 (60%) fan4_rpm=914
pwm5: enable=5 pwm=153 (60%) fan5_rpm=0    ← empty header
pwm6: enable=5 pwm=153 (60%) fan6_rpm=0    ← empty header
pwm7: enable=5 pwm=255 (100%) fan7_rpm=1672  (BIOS curve = 255@0C..255@100C, i.e. always 100%)
```

### Pulse-mapping test (script saved at `/tmp/pwm_pulse_map.sh`)

For each channel, set `enable=1`, write `pwm=255`, wait 5 s, observe RPM; write `pwm=80` (31%), wait 5 s, observe RPM; restore `enable=5`.

```
--- pwm2 ---
baseline rpm: 636        pwm=255 → 608 rpm        pwm=80 → 613 rpm
--- pwm3 ---
baseline rpm: 884        pwm=255 → 890 rpm        pwm=80 → 897 rpm
--- pwm4 ---
baseline rpm: 929        pwm=255 → 913 rpm        pwm=80 → 930 rpm
--- pwm7 ---
baseline rpm: 1689       pwm=255 → 1691 rpm       pwm=80 → 1672 rpm
```

Variation across PWM commands is within tach measurement noise (±15 RPM). **No fan responds to the PWM signal.**

### pwm=0 stress test on pwm3

Hypothesis 1: maybe BIOS is racing the writes. Refute by reasserting every 2 s for 20 s.

```
Setting pwm3 enable=1, pwm=0...
  +2s: pwm=0 en=1 fan3=892
  +4s: pwm=0 en=1 fan3=880
  +6s: pwm=0 en=1 fan3=892
  +8s: pwm=0 en=1 fan3=884
  +10s: pwm=0 en=1 fan3=898
  +12s: pwm=0 en=1 fan3=901
  +14s: pwm=0 en=1 fan3=885
  +16s: pwm=0 en=1 fan3=885
  +18s: pwm=0 en=1 fan3=884
  +20s: pwm=0 en=1 fan3=894
```

`pwm=0` reasserted for 20 s, fan still holds ~890 RPM.

### pwm=0 stress test on pwm7 (the 1700 RPM fan)

```
Setting pwm7 enable=1, pwm=0...
  +2s:  pwm=0  en=1 fan7=1677
  +5s:  pwm=0  en=1 fan7=1677
  +10s: pwm=0  en=1 fan7=1693
  +15s: pwm=0  en=1 fan7=1677
  +20s: pwm=0  en=1 fan7=1681
  pwm=80: pwm7=80  en=1 fan7=1681
```

Same result. The pwm value is accepted into the register, but the fan output ignores it.

### Tight reassertion test (200 ms loop for 15 s)

```
Baseline fan3: 895 rpm
Tight reassertion loop pwm3=255 (75 iterations, 200 ms each)...
Final: pwm3=255 en=0 fan3=885
```

Even at 5 Hz reassertion, `enable` silently flipped from 1 to 0 between writes (we wrote `enable=1` 75 times in the last 15 s; the final read shows `enable=0`), and the fan never moved. Something is overwriting `enable` faster than we can write it, AND the fan is decoupled from the PWM register state regardless.

## Most likely cause

The ASUS Pro WS WRX90E-SAGE SE board has an embedded controller (EC) / BIOS Q-Fan IV firmware path that owns the physical PWM lines. The `nct6798` chip is the same silicon Q-Fan reads from, but the **fan output multiplexer** is owned by the EC. OS writes to the chip's PWM registers reach the chip, but the EC keeps reasserting its computed values onto the fan headers based on its own thermal sources (CPU temp via PECI). Net effect: the OS sees a writable register, the fan ignores it.

This pattern is documented for several ASUS workstation/server boards (notably the WRX80E and WRX90E lines). Fan control via the OS is gated behind:

1. Disabling Q-Fan in BIOS (sets every channel to "Disabled" or "Manual"), OR
2. Using ASUS-specific WMI write methods (`asus-wmi` driver currently exposes read-only sensors on this box, no write path), OR
3. Bypassing the motherboard with a separate hardware controller (USB or PSU-direct).

I cannot pursue (1) without a reboot into BIOS. I cannot pursue (2) without confirming an asus-wmi write path exists for WRX90E-SAGE SE (the `asus_wmi_sensors` module is loaded but `/sys/class/hwmon/hwmon3/asus/` is empty — no fan control surface). (3) requires hardware Alton would need to acquire.

## Secondary observation: BIOS curve's actual range

The BIOS Q-Fan default curve goes 153@20 °C → 255@125 °C on pwm1-6 (i.e. 60% at idle ramping to 100% at 125 °C). For pwm7 it's 255@0 → 255@100 (always 100%). So during the earlier 5-min thermal stress at 475 W/card, the BIOS *was* running its curve, and at the observed temps (GPU0 83 °C, Tccd4 86 °C, but the curve reads CPU PECI temp which during that test would have been around 86 °C max), the BIOS would have computed ≈75-85% PWM. The fans we observed at "60%" (Alton's earlier read) were likely showing the *pwm register value the BIOS chose mid-ramp*, not the fan's actual response. The fans were probably running at a fixed RPM determined by EC-resolved control regardless of the register value.

This means **the baseline thermal data we already have is the worst-case for fan-control we have today** — and the BIOS curve was *already* delivering whatever level of cooling the EC will let us deliver. There is no headroom to gain from a daemon until we get past the EC.

## Paths forward — recommendation

I recommend **Path A** (BIOS reconfig) as the cheapest first step, because it changes nothing physical and is reversible.

**Path A — BIOS Q-Fan disable + retest (recommended next step).** Reboot to BIOS. Navigate to "Monitor" → "Q-Fan Configuration". Set every chassis fan profile (CHA_FAN1..6 and CPU_FAN, CPU_OPT) to **Manual** or **Disabled** (the labels vary by ASUS firmware version; "Manual" exposes a fixed PWM duty value, "Disabled" hands control to the OS). Save and exit. Re-run `/tmp/pwm_pulse_map.sh` and verify RPMs respond. If yes, proceed with Phase B daemon as designed.

**Path A.1 — kernel param `acpi_enforce_resources=lax` (cheap, reversible).** Edit `/etc/default/grub`, append `acpi_enforce_resources=lax` to `GRUB_CMDLINE_LINUX_DEFAULT`, run `sudo update-grub`, reboot. This tells the kernel to write to ports the BIOS has marked reserved. Some users on r/homelab and forums report this restoring nct6798 fan control on ASUS workstation boards; others report no change. Worth trying before A but rebooting takes the same time.

**Path B — `asusctl` / `asus-wmi-sensors` write path (uncertain).** Investigate whether there's an asus-specific kernel module or userspace tool that exposes write paths on WRX90E-SAGE SE. The `asus_wmi_sensors` module is loaded but exposes no fan control surface today. Probably a dead end on a WRX90 board — `asusctl` is mostly an ROG/laptop tool.

**Path C — USB hardware fan controller (definitive but $$).** Aquacomputer Quadro (~$80, 4 PWM + 4 tach + 4 temp probes, USB), Phanteks Universal Fan Controller, or NZXT RGB & Fan Controller. These bypass the motherboard entirely. Requires hardware purchase and installing fan cables onto the controller. The daemon I'm asked to write would talk to the controller via `liquidctl` instead of `/sys/class/hwmon`. Significantly more durable if BIOS Q-Fan paths are flaky.

**Path D — accept BIOS Q-Fan as the only control, tune it manually.** No daemon; instead, configure the BIOS Q-Fan curve in BIOS to be more aggressive (higher PWM at lower temps) and accept that we have no GPU-temperature input. This loses the GPU-awareness goal but is operationally viable. Configurable from BIOS only.

## What I am doing now

1. Filing this phone-home and stopping (per directive's "and stop" instruction).
2. **Not** running the 475 W re-test — there is nothing to re-test until the control path is re-established.
3. **Not** building the daemon — but I have written the design and will leave skeleton notes that can be picked up after BIOS is reconfigured.
4. Will commit Phase A artifacts (the pulse-map script and its log) and the existing thermal baseline data so the next session has a clean handoff.
5. Will write the HARDWARE-THERMAL-BASELINE.md (Phase E) with the data already on disk and the empirical PWM-no-effect finding included as a section. That document is useful regardless of which path we pick.
6. Will update HARDWARE.md (Phase F) to document the EC-mediation finding and the per-channel PWM/RPM map.
7. Will file the flower-fan PWM-conversion follow-up (Phase G).

## What Alton needs to decide

Pick a path. If Path A or A.1, schedule a reboot and walk me through the BIOS step (or you do it directly and I retest after). If Path C, name the controller you want to buy and I will write the daemon against `liquidctl`. If Path D, we close this directive — no daemon.

## Token budget at phone-home

≈70 K used of 200 K budgeted. Wall-clock ≈30 min of 2 hr. Stopping here per the directive's blocking-trigger discipline; the rest of the budget should not be spent until the control path is decided.

## Files written or modified this session

- `/tmp/pwm_pulse_map.sh` — pulse-mapping script (will commit copy to repo)
- `/tmp/pwm_pulse_map.log` — pulse-mapping log
- `experiments/2026-04-27-thermal-baseline/samples.jsonl` — already on disk from earlier
- `experiments/2026-04-27-thermal-baseline/stress.log` — already on disk from earlier
- (planned) `sartor/memory/research/persona-engineering/HARDWARE-THERMAL-BASELINE.md`
- (planned) `sartor/memory/machines/rtxpro6000server/HARDWARE.md` updates
- (planned) `sartor/memory/inbox/rocinante/flower-fans-pwm-conversion.md`
- This phone-home

## History

- 2026-04-27 03:08 UTC: Pulse-mapping showed PWM writes do not affect fan RPMs on any of the 7 channels.
- 2026-04-27 03:14 UTC: pwm3 reassertion loop confirmed effect is not a BIOS-race timing issue.
- 2026-04-27 03:18 UTC: pwm7 (the 100%-pinned BIOS channel) similarly fails to respond to pwm=0 reassertion.
- 2026-04-27 03:25 UTC: Phone-home filed, daemon implementation paused.
