---
name: rtxserver-flower-fans-pwm-conversion
description: Hardware follow-up to make the rtxpro6000server front-mesh "flower" fan array PWM-controllable. Currently wired direct to PSU 12 V via manual case switch; no temperature feedback, on/off only. Filed during fan-control directive Phase A 2026-04-27.
type: hardware-followup
date: 2026-04-27
hostname: rtxpro6000server
priority: medium  # not blocking, but limits dynamic cooling capacity
related:
  - machines/rtxpro6000server/HARDWARE
  - inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect
tags: [meta/hardware, machine/rtxpro6000server, hardware/cooling, hardware/followup]
---

# rtxpro6000server — make flower-fan array PWM-controllable

## Current state

The Phanteks Enthoo Pro 2 case has a front-mesh "flower" fan array — 3× Super Flower MEGACOOL fans — wired direct to a PSU 12 V rail through a manual rocker switch on the case. They run at full speed when on, off when off. **No PWM input. No tach feedback. No temperature feedback.** Not visible to the motherboard, not visible to Linux.

This is fine for a "panic button" cooling boost, but it is the wrong wiring for a thermal-regulation system that adjusts fan speed based on GPU load. During the 2026-04-27 baseline test, the flower array was on continuously to maximize front intake; this kept the case from being even hotter, but means we are running them at 100 % even at idle (when GPUs are at 28 °C and the bearing wear is wasted).

## What "dynamic" should mean

Three properties:

1. **PWM input** wired to a motherboard CHA_FAN header, OR a USB fan controller, OR a Phanteks PWM hub fed from a CHA_FAN header. So the fans get a 25 kHz PWM duty cycle, not constant 12 V.
2. **Tach return on at least one fan** so we can confirm in `sensors` that they are actually spinning at the commanded speed.
3. **Daisy-chain 3 fans onto one PWM source** via a 1-to-3 PWM splitter cable. They will all see the same duty cycle and respond identically. (3-fan splitters are 3-pin or 4-pin; we want 4-pin so all three fans get PWM.)

## Hardware options (in increasing capability and cost)

### Option 1 — PWM splitter cable from a CHA_FAN header (cheapest)

- 1× **4-pin PWM 1-to-3 splitter cable** with one tach return. ~$8. Examples: ARCTIC PST cable, Noctua NA-SYC1, generic Amazon listings.
- Wire all 3 flower fans into the splitter; plug splitter into an unused CHA_FAN header (CHA_FAN5 or CHA_FAN6 — both currently empty per the 2026-04-27 pulse-map, see `machines/rtxpro6000server/HARDWARE.md`).
- Caveat: the splitter passes 12 V from the motherboard, not PSU. Each fan draws ~0.2-0.3 A, three fans = ~0.9 A. ASUS CHA_FAN headers are rated 1 A typical. **Inside the budget but not by much.** If the Super Flower MEGACOOL fans pull more than 0.3 A each, you risk exceeding the header limit. **Verify PSU draw on label before plugging in.** If they are 0.4+ A each, skip to Option 2.

**Blocker for this option:** rtxpro6000server's BIOS Q-Fan firmware currently does not let OS PWM writes reach the fan output multiplexer (see `inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect.md`). So even if the flower fans are on a CHA_FAN header, the daemon cannot vary their speed today. This option only becomes useful AFTER the Q-Fan issue is resolved (BIOS reconfig or `acpi_enforce_resources=lax`).

### Option 2 — Phanteks PWM hub (if the case has one already)

- The Phanteks Enthoo Pro 2 ships with a built-in PWM hub on some SKUs. Check the case interior near the front-fan mounts for a small PCB labeled "PH-PWHUB" with 6-8 fan headers.
- The hub takes 12 V from a SATA power connector (not motherboard) so it does not load the CHA_FAN header. It takes a PWM signal from one CHA_FAN header and applies it to all attached fans.
- Wire all 3 flower fans into the hub. Wire one fan's tach back to a motherboard fan header for monitoring.
- Same Q-Fan caveat as Option 1.

### Option 3 — USB fan controller (most capable, bypasses BIOS Q-Fan entirely)

- 1× **Aquacomputer Quadro** (~$80, 4 PWM outputs + 4 tach inputs + 4 temperature probes + USB to host). Has a Linux driver via `liquidctl`.
- Wire all 3 flower fans into one Quadro PWM channel (or spread across two for redundancy). Plug Quadro USB into a motherboard USB header.
- The daemon talks to the Quadro via `liquidctl`, not via `/sys/class/hwmon`. This **completely bypasses** the ASUS BIOS Q-Fan EC mediation problem.
- Same controller can also take over chassis fan control if you re-wire the ARCTIC P14s into it. That fully sidesteps the BIOS Q-Fan issue.
- Alternatives in this class: Phanteks Universal Fan Controller (~$50-70), NZXT RGB & Fan Controller (~$40 but tied to NZXT CAM software, less Linux-friendly), Corsair Commander Pro (~$60, supported by `liquidctl`).

**Recommended.** Cheapest robust path that doesn't depend on solving the BIOS Q-Fan problem.

## Recommendation

Do Option 3 (Aquacomputer Quadro, ~$80) **regardless of how the BIOS Q-Fan problem resolves**. Reasons:

1. It bypasses the BIOS Q-Fan mediation issue entirely — does not depend on whether `acpi_enforce_resources=lax` works on this board, does not depend on BIOS settings being preserved across firmware updates.
2. It puts all dynamic fans (chassis ARCTIC P14 array + flower array) under one daemon-controllable surface, simplifying the daemon design.
3. It adds 4 temperature probes — we can stick one between GPU0 and GPU1 in the slot-3 dead zone and one near Tccd4 to cross-check the air-gap thermal coupling that drove the 2026-04-27 finding.
4. `liquidctl` is well-maintained, in Ubuntu repos, and the Quadro is a supported device.

If hardware spending is undesirable, fall back to Option 1 only after the BIOS Q-Fan question is resolved.

## What I did NOT do (per directive)

- Did not buy any hardware.
- Did not re-route any cables.
- Did not modify the case wiring.

The directive said "Don't do hardware work yourself" — this is a planning artifact only.

## Decision Alton needs to make

Pick option 1, 2, or 3 — and order the cable/hub/controller. Then we can revisit the daemon design with a known control surface.

## History

- 2026-04-27: Filed during fan-control directive Phase A after pulse-mapping found PWM writes have no effect on motherboard-wired fans (see PHONE-HOME-fan-control-pwm-no-effect.md). Flower-array dynamic-PWM conversion is independent of the BIOS Q-Fan question and worth solving regardless.
