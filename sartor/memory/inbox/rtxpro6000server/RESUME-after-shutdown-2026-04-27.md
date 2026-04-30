---
name: resume-after-shutdown-2026-04-27
description: Entry point for the next rtxserver Claude session after the 2026-04-27 graceful shutdown. Path A (BIOS Q-Fan disable) and Path B (acpi_enforce_resources=lax kernel param) both applied. Alton physically moved the 3 Super Flower MEGACOOL flower fans onto motherboard CHA_FAN headers during the shutdown window. First task on resume is verifying OS PWM control now reaches the fans.
type: resume-instructions
date: 2026-04-27
hostname: rtxpro6000server
status: awaiting-physical-work-and-power-on
priority: blocking-on-resume  # next session must read this before doing anything else
related:
  - inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect
  - machines/rtxpro6000server/HARDWARE
  - research/persona-engineering/HARDWARE-THERMAL-BASELINE
tags: [meta/resume, machine/rtxpro6000server, hardware/cooling]
---

# RESUME — rtxpro6000server fan-control work, post-2026-04-27 shutdown

## TL;DR for the next session

Read this whole document before touching anything. The previous session (2026-04-27 03:00-03:50 UTC) found that nct6798 PWM writes were silently ineffective on this board because the EC / Q-Fan IV firmware owned the fan output multiplexer. Alton chose a two-pronged remediation during the shutdown window: BIOS Q-Fan disable (Path A) AND kernel `acpi_enforce_resources=lax` (Path B). He also moved 3 flower fans from a PSU manual switch onto motherboard CHA_FAN headers.

Your first job on resume: **verify PWM control now works**. If yes, build the daemon. If no, escalate.

Do NOT touch persona-engineering experiment 002 GPU work. It remains gated on Alton's explicit greenlight, regardless of fan-control status.

## State at shutdown

- Local main HEAD: `e6c3d90` ("Fan-control directive Phase A — empirical thermal baseline + PWM-control finding (BLOCKED)")
- Plus a Path-B commit (this session) updating `/etc/default/grub` and adding this resume doc.
- Rocinante had not yet drained at shutdown; the Phase A commit will land on origin/main after the next Rocinante sync.
- Token usage at shutdown: ~95 K of 200 K budgeted across the two directives (Phase A + wrap).
- Wall-clock: ≈70 min into a 2 hr budget.

## What was changed during the shutdown window

### Path A — BIOS Q-Fan IV disabled (Alton, manual)

Alton was to enter BIOS at next boot's POST and follow:

> Advanced → Hardware Monitor → Q-Fan Configuration → Q-Fan to "Disabled"
> (or, if "Disabled" is not exposed on this BIOS rev, set every fan source's profile to "Manual" with PWM 100 %)

Save and exit. This releases the EC's grip on the fan output multiplexer so OS-level writes to nct6798 PWM registers can take effect.

**ASK ALTON:** confirm he disabled Q-Fan and what BIOS revision shows. If "Disabled" was not available, what value did he set? Update this doc and HARDWARE.md when he reports.

### Path B — `acpi_enforce_resources=lax` kernel parameter (this session)

Done on disk before shutdown:

```
sudo cp /etc/default/grub /etc/default/grub.pre-acpi-lax.bak       # backup
# sed appended " acpi_enforce_resources=lax" to GRUB_CMDLINE_LINUX_DEFAULT
sudo update-grub                                                    # regenerated /boot/grub/grub.cfg
```

Verified at shutdown: `sudo grep -c acpi_enforce_resources=lax /boot/grub/grub.cfg` → `2` (default + recovery entry both updated).

The boxed cmdline at shutdown was empty (`GRUB_CMDLINE_LINUX_DEFAULT=""`) — note that the existing kernel flags `amd_iommu=on nvidia_drm.modeset=0` live on `GRUB_CMDLINE_LINUX`, NOT `_DEFAULT`. Both lines get concatenated into the final cmdline by grub-mkconfig, so this is correct. After Path B, the post-edit state is:

```
GRUB_CMDLINE_LINUX_DEFAULT=" acpi_enforce_resources=lax"
GRUB_CMDLINE_LINUX="amd_iommu=on nvidia_drm.modeset=0"
```

**Verify after first boot:** `cat /proc/cmdline` should contain `acpi_enforce_resources=lax`. If not, something went wrong during boot — investigate before proceeding.

**Backup location:** `/etc/default/grub.pre-acpi-lax.bak`. To revert: `sudo cp /etc/default/grub.pre-acpi-lax.bak /etc/default/grub && sudo update-grub`.

### Physical fan rewiring (Alton, manual)

3× Super Flower MEGACOOL 120 mm fans were moved from the case's PSU manual rocker switch onto motherboard CHA_FAN headers. Per Alton's pre-shutdown plan: 4-pin PWM, 0.75 A each at max, fits 3-on-one-header (2.25 A vs ~3 A header rating) OR can split 2+1 across two headers for full headroom. Alton was to pick whichever was easier physically.

**ASK ALTON on resume:** WHICH CHA_FAN headers got which fans? Either he reports back, or you discover by reading `/sys/class/hwmon/hwmon4/fan*_input` after boot — any header that previously read 0 RPM (pwm1, pwm5, pwm6 in the 2026-04-27 idle map) and now reads a fan RPM is one of the moved flower fans.

Either way, update `machines/rtxpro6000server/HARDWARE.md` with the final wiring map once known.

## First-task-on-resume checklist (in order)

### 1. Sanity-check the boot

```bash
# Confirm acpi_enforce_resources=lax is live in this boot
cat /proc/cmdline | grep acpi_enforce_resources && echo "Path B LIVE" || echo "Path B FAILED — investigate"

# Confirm nct6775 driver loaded automatically (it was modprobed manually last session;
# Path A directive said to add /etc/modules-load.d/nct6798.conf — actual driver is nct6775,
# so check /etc/modules-load.d/ for either name)
lsmod | grep nct6775

# Confirm GPUs idle and at expected baseline
nvidia-smi --query-gpu=index,temperature.gpu,power.draw --format=csv

# Read current PWM/fan state — compare to 2026-04-27 idle map
for i in 1 2 3 4 5 6 7; do
  echo "pwm$i: enable=$(cat /sys/class/hwmon/hwmon4/pwm${i}_enable) pwm=$(cat /sys/class/hwmon/hwmon4/pwm${i}) fan=$(cat /sys/class/hwmon/hwmon4/fan${i}_input)"
done
```

If `acpi_enforce_resources=lax` is NOT in `/proc/cmdline`, something went wrong with grub. STOP and investigate. Do not proceed.

### 2. Re-run the pulse-mapper

```bash
bash experiments/2026-04-27-thermal-baseline/pwm_pulse_map.sh
```

This script (already on disk and committed) walks each PWM channel, sets `enable=1`, writes `pwm=255`, settles 5 s, writes `pwm=80`, settles 5 s, restores `enable=5`. If Path A + Path B succeeded, the RPM should respond between the 255 and 80 cases. If it doesn't respond, neither path worked.

### 3a. If PWM control NOW works → build the daemon

Proceed with the original directive's Phase B (daemon implementation). The 12-item robustness checklist still applies in full:

- Fail-safe defaults to MAX (255), not MIN
- 30 s watchdog timeout → MAX on hang
- systemd OnFailure= → emergency-max script
- Minimum floor 30 % (77/255)
- Hysteresis: don't update unless target changes >5 %
- Bounded inputs: unparseable nvidia-smi → MAX, missing Tctl → GPU-only fallback
- GPU-not-present fallback: CPU-only curve
- Polling timeout: `timeout 5 nvidia-smi`, `timeout 3 sensors`
- Configurable via `/etc/gpu-fan-control.yaml`, SIGHUP reload
- journald INFO logging on every PWM change
- Clean shutdown restores BIOS auto (writes 5 to every pwmN_enable). NOTE: with Q-Fan disabled in BIOS, "BIOS auto" may not exist anymore — set enable=5 anyway and document the new resting state. If pwmN_enable=5 produces zero-RPM (fan stop) on this BIOS state, fall back to enable=1 + pwm=255 as the safe resting state.
- Survive reboot via `systemctl enable`, `After=systemd-modules-load.service`
- Persistent module load (add `nct6775` — note: the chip is nct6798D but driver is nct6775 — to `/etc/modules-load.d/nct6775.conf`). The original directive named the file `nct6798.conf`; either name works for the file, but the **module string** must be `nct6775` (the actual driver name).
- Lock file `/run/gpu-fan-control.lock` prevents multiple daemons fighting

Default curve from the original directive (still your starting point, tune empirically):

```
target_pwm = max(gpu_curve(max(gpu_temps)), cpu_curve(max(Tctl, Tccd4)))

gpu_curve:  ≤45→30%  60→60%  70→80%  80→95%  ≥85→100%
cpu_curve:  ≤55→30%  70→60%  80→85%  ≥85→100%
```

Files to write:
- `/usr/local/bin/gpu-fan-control` — the Python daemon (~150 lines)
- `/etc/gpu-fan-control.yaml` — config
- `/etc/systemd/system/gpu-fan-control.service` — systemd unit
- `/usr/local/bin/gpu-fan-emergency-max` — emergency script (writes 255 to all 7 PWMs, sets enable=1)
- `/etc/modules-load.d/nct6775.conf` — module-load persistence

After daemon is in place, run validation pass C (stop/start, fault inject via kill -9, SIGHUP reload, OnFailure verification), then D (re-run thermal stress at 475 W/card with daemon active and compare to baseline).

### 3b. If PWM control DOES NOT work even with both paths → escalate to Path C

Path C: Aquacomputer Quadro USB controller (~$80). Already filed at `inbox/rocinante/2026-04-27_rtxserver_flower-fans-pwm-conversion.md`. The daemon design changes: instead of writing to `/sys/class/hwmon/hwmon4/pwmN`, the daemon talks to the Quadro via `liquidctl`. Same robustness checklist applies; control surface differs.

Tell Alton path C is needed and that hardware procurement is on his side. Then stop further fan-control work this session — do not attempt a half-built daemon against a broken control surface.

### 4. Comparison metrics for the daemon

The 2026-04-27 baseline at 475 W/card (in `experiments/2026-04-27-thermal-baseline/samples.jsonl`):

| Sensor | Steady-state @ 475 W |
|--------|---------------------:|
| GPU0 temp | 82.5 avg / 83.0 max |
| GPU1 temp | 71.7 avg / 72.0 max |
| CPU Tctl | 85.3 avg / 86.1 max |
| CPU Tccd4 | 78.3 / 86.4 max |

After daemon, the with-daemon test should land at `experiments/2026-04-27-thermal-baseline/with-daemon/samples.jsonl`. Use the same `/tmp/thermal-stress.py` and `/tmp/thermal-runner.sh` Alton built (these are in /tmp from the original session — if they're gone after reboot, recreate from samples.jsonl format: 2 s cadence, GPU temps + power + util via nvidia-smi, CPU sensors via lm-sensors).

The deliverable for Phase E (HARDWARE-THERMAL-BASELINE.md update) is a delta table: how many °C of thermal headroom did the daemon buy us, on each of the 4 critical sensors. If it bought ≥3 °C on GPU0, that is meaningful headroom toward 500 W/card and is worth the effort. If it bought less, the constraint is airflow geometry (slot-3 shadow), not fan speed, and the next intervention is physical (intake reorientation, slot divider).

## Hard gates

1. **Persona-engineering experiment 002 GPU work is GATED.** Do not start cycle 2+ training, do not run anything that puts both cards above 200 W simultaneously, until Alton has personally given a green-light on this thread. The fan-control path being open does NOT imply experiment 002 is unblocked. They are independent.

2. **475 W/card is the upper bound for any thermal validation.** Do not push higher to "stress-test the daemon harder". The PSU + breaker margins from the previous session still apply — the wall breaker held at ~1350 W system draw, with no slack.

3. **If GPU0 sustained > 88 °C** during daemon-active re-test, stop and phone-home — the daemon didn't help enough and we have a different problem (slot-3 airflow geometry). Do not let the test continue into the throttle range.

4. **If anything weird happens during Path A/B verification** (kernel panic, lm-sensors crashes, nct6775 fails to load, asus-wmi misbehavior under `acpi_enforce_resources=lax`), stop and phone-home. Alton is more cautious here than at the original Phase A trigger because we are now doing two interventions at once and demarcating which one broke things matters.

## Open questions for Alton on resume

1. Did Q-Fan IV "Disabled" mode exist on this BIOS rev (1203, dated 07/18/2025)? If not, what mode did you pick? "Manual"? Per-fan or global?
2. Which CHA_FAN headers got which flower fans? 3-on-one or 2+1? (Or you can just tell us "look at fan_input" and we'll figure it out from the new readings.)
3. Should the daemon's clean-shutdown restore behavior be `enable=5` (BIOS auto, but with Q-Fan now disabled this may be undefined) or `enable=1 + pwm=255` (deterministic max)? Default to `enable=1 + pwm=255` if you don't have a strong opinion — fail-safe-to-MAX is the principle.

## Files of record

- `sartor/memory/inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect.md` — Phase A finding + 4 candidate paths
- `sartor/memory/research/persona-engineering/HARDWARE-THERMAL-BASELINE.md` — empirical thermal characterization
- `sartor/memory/machines/rtxpro6000server/HARDWARE.md` — hardware quirks + per-channel idle map + investigation §
- `sartor/memory/inbox/rocinante/2026-04-27_rtxserver_flower-fans-pwm-conversion.md` — Path C / hardware controller fallback
- `experiments/2026-04-27-thermal-baseline/samples.jsonl` + `pwm_pulse_map.sh` + log — raw artifacts

## History

- 2026-04-27 03:00-03:50 UTC: Phase A pulse-mapping found PWM writes have no effect on physical fans. Phone-home filed. Daemon work paused.
- 2026-04-27 13:30-13:50 UTC (this session): Path B applied (`acpi_enforce_resources=lax` in `/etc/default/grub`, `update-grub` ran, verified in `/boot/grub/grub.cfg`). Resume doc filed. Graceful shutdown initiated.
- (next): Alton powers cycle, BIOS Q-Fan disable (Path A), physical flower-fan move, then power-on. Next session reads this doc.
