---
name: unifi-led-direct-control
description: Direct sysfs LED control on UniFi U7-Pro APs via SSH. Confirms we have root, can write /sys/class/leds/led_{blue,white}/{brightness,trigger,delay_on,delay_off} for arbitrary patterns (sub-second blinks, brightness fades, Morse, network-activity-driven). Investigation triggered 2026-05-02 ~01:15 ET, Alton heading to bed; this file is the read-tomorrow handoff.
type: investigation
status: confirmed-feasible-pending-implementation
date: 2026-05-02
related:
  - projects/unifi-takeover-2026-05-01
  - reference_home_network
tags: [investigation/network, vendor/ubiquiti, capability/led-control]
---

# Direct LED control on UniFi APs

## TL;DR

**Yes, we can control the LEDs directly — far beyond what the controller API exposes.** The on/off/locate-strobe we used earlier tonight is the tip of the iceberg. With root SSH (which we now have via SSH-key push) and sysfs writes, we can:

- Independent brightness 0–255 on **two LEDs**: blue and white
- Sub-second timer-driven blink (delay_on/delay_off in ms — 50 ms+ probably works)
- Custom patterns: Morse, SOS, breathe/fade, alternating blue↔white
- Network-activity-driven (`netdev` trigger flashes per-packet)
- Restore controller behavior with one line: `echo ui > /sys/class/leds/led_blue/trigger`

**Two limits:**
1. Only blue + white — no red/green. "Color" range is whatever blue+white at varying brightness produces (a temperature spectrum, not full RGB).
2. **Runtime-only.** Rootfs is tmpfs; writes don't survive reboot. For persistent custom behavior, use `iptables.{i}.cmd`-style boot-time config hooks (same trick we used for the BHS controller block).

## What was set up tonight to make this possible

1. **SSH key provisioned** — Rocinante's `~/.ssh/id_ed25519.pub` (rotated 2026-04-16 fingerprint `df:51:e4:37:51:e0:db:cf:2c:9a:63:47:01:23:0a:8e`) pushed to controller's `mgmt.x_ssh_keys` setting via `PUT /api/s/default/set/setting/mgmt`. Controller propagated to all 8 APs within ~75 seconds.
2. **Scripted SSH now works** from Rocinante: `ssh alton@<ap-ip>` is passwordless and lands as **uid=0(alton) gid=0(root)** — full root.

To confirm SSH key is provisioned: `ssh -o BatchMode=yes alton@<ap-ip> id` should return `uid=0`.

## Findings (verified on HerOffice — 192.168.1.165 — U7-Pro, Linux 5.4.213 armv7l)

```
$ ls /sys/class/leds/
led_blue        ← 0-255 brightness PWM, controllable triggers
led_white       ← 0-255 brightness PWM, controllable triggers
mmc0::          ← disk activity indicator (don't touch)

$ cat /sys/class/leds/led_blue/trigger
[none] timer default-on netdev mmc0 ui
```

Trigger modes:
- **`none`** — manual brightness control only (use this for direct on/off/dim)
- **`timer`** — kernel-driven blink. Set `delay_on` and `delay_off` in milliseconds.
- **`default-on`** — always on at full brightness
- **`netdev`** — flashes on link/tx/rx activity (configurable via `device_name` / `mode` files)
- **`mmc0`** — flashes on disk I/O (don't repurpose — used by mmc0:: LED already)
- **`ui`** — UniFi-managed (the default — controller's locate/normal patterns)

## Recipe library (paste after `ssh alton@<ap-ip>`)

### Manual on/off/dim (one LED)

```sh
echo none > /sys/class/leds/led_blue/trigger
echo 255  > /sys/class/leds/led_blue/brightness   # full
echo 64   > /sys/class/leds/led_blue/brightness   # quarter
echo 0    > /sys/class/leds/led_blue/brightness   # off
```

### Timer blink (kernel-driven, no script-loop needed)

```sh
echo timer > /sys/class/leds/led_blue/trigger
echo 100   > /sys/class/leds/led_blue/delay_on    # 100 ms on
echo 900   > /sys/class/leds/led_blue/delay_off   # 900 ms off  (slow heartbeat)
# To stop: echo none > /sys/class/leds/led_blue/trigger
```

### Alternating blue ↔ white (1 Hz)

```sh
echo timer > /sys/class/leds/led_blue/trigger
echo 500   > /sys/class/leds/led_blue/delay_on
echo 500   > /sys/class/leds/led_blue/delay_off
echo timer > /sys/class/leds/led_white/trigger
echo 500   > /sys/class/leds/led_white/delay_off  # invert phase
echo 500   > /sys/class/leds/led_white/delay_on
# wait
echo 0 > /sys/class/leds/led_blue/brightness; echo 0 > /sys/class/leds/led_white/brightness
echo none > /sys/class/leds/led_blue/trigger; echo none > /sys/class/leds/led_white/trigger
```

### Breathe / fade pulse (script loop required — kernel doesn't have a fade trigger)

```sh
echo none > /sys/class/leds/led_blue/trigger
for i in 0 32 64 96 128 160 192 224 255 224 192 160 128 96 64 32 0; do
  echo $i > /sys/class/leds/led_blue/brightness
  sleep 0.15
done
```

### Morse SOS

```sh
DOT=200;  DASH=600; GAP=200; LETTER_GAP=600
LED=/sys/class/leds/led_blue
echo none > $LED/trigger
on()  { echo 255 > $LED/brightness; sleep $(awk "BEGIN{print $1/1000}"); }
off() { echo 0   > $LED/brightness; sleep $(awk "BEGIN{print $1/1000}"); }
# S
on $DOT; off $GAP; on $DOT; off $GAP; on $DOT; off $LETTER_GAP
# O
on $DASH; off $GAP; on $DASH; off $GAP; on $DASH; off $LETTER_GAP
# S
on $DOT; off $GAP; on $DOT; off $GAP; on $DOT; off 0
```

### Restore controller behavior

```sh
echo ui > /sys/class/leds/led_blue/trigger
echo ui > /sys/class/leds/led_white/trigger
```

## Open questions to test (next session)

1. **Minimum blink period.** Timer trigger goes down to milliseconds in theory; UI thread on the AP CPU may impose a floor around 20–50 ms. Worth a sweep.
2. **Color blending.** Are led_blue and led_white physically co-located or split across the LED ring? Set blue=128 + white=128 simultaneously and visually inspect — if they blend, we have a 2-channel "temperature" knob; if separate, we have an arc-color and ring-color independently.
3. **netdev trigger.** Configure `mode=tx` or `mode=rx` and tie to wlan0/wlan1 — get a visual radio-activity indicator. Useful in the lab.
4. **Persistence across reboot.** The standard playbook: `iptables.{i}.cmd` config keys persist via `cfgmtd` and execute pre-mcad on every boot. Same trick can install a systemd-style LED override at boot. The boot-time hook would be along the lines of:
   ```
   iptables.99.cmd=sh -c 'sleep 30 && echo timer > /sys/class/leds/led_blue/trigger && echo 100 > /sys/class/leds/led_blue/delay_on && echo 1900 > /sys/class/leds/led_blue/delay_off' &
   ```
   (sleep 30 is to let normal boot finish before we override). Confirm whether the cfg key is honored for non-iptables commands; might need a different hook key.
5. **Per-AP audit on the other 7 APs.** U7-Pro and U7-PIW likely identical. U7-Outdoor (UKPW) may have a different LED set — worth a quick `ls /sys/class/leds/` on each of the 8.

## A fun pattern Alton might enjoy testing tomorrow

**Stranger Things alphabet wall.** Each AP gets a Morse blink representing one letter of a household name when you hit a button or curl an endpoint. With 8 APs we can spell ALTON, ANEETA, VAYU, VASU, VISHALA — pick one that fits in 8 letters, light it across the house in sequence.

This is a one-shot script that hits each AP via SSH in physical-room order, plays the letter's Morse for ~2s, moves on. Total wall-clock for "VISHALA" would be ~14s. Trivially scripted on Rocinante.

(Or just network-activity netdev trigger on every AP — every packet pulses the LED. Like a network heartbeat across the house. Probably better for the lab than the family living room.)

## Security/operational notes

- **Root SSH from Rocinante is now possible without a password.** That's a meaningful capability change. The SSH private key (`~/.ssh/id_ed25519`) gates this; the key is passphrase-less and gives root on every AP. Treat the file like a household-wide root credential — same care as `ap-authkeys-2026-05-01.json`.
- The pushed key is the post-2026-04-16-rotation key (the pre-rotation one was compromised; see the `.COMPROMISED-2026-04-16` files in `~/.ssh/`). If we ever rotate again, push the new pubkey to `mgmt.x_ssh_keys` and the controller propagates within ~75 s.
- Direct `/sys/class/leds/` writes don't touch the UniFi controller's view of the AP; controller will keep showing the device as healthy.
- Some patterns may visually conflict with `ui`-trigger management (controller might re-assert during inform cycles every ~30 s). Best results: hold `trigger=none`, set brightness manually, restore `trigger=ui` when done.

## History

- 2026-05-02 ~01:15 ET (Rocinante Opus 4.7): Investigation triggered after the locate-strobe AP-rename audit. Earlier in the night we'd been limited to controller-API on/off/locate; user wanted to know what's actually possible. Pushed Rocinante's ed25519 pubkey to controller's `mgmt.x_ssh_keys`, waited 75 s for AP provisioning, SSH'd to HerOffice (.165), enumerated `/sys/class/leds/`, verified root access (uid=0), confirmed direct `brightness` and `trigger` writes work. Documented recipe library + open questions for tomorrow. No persistent changes to APs (test writes were transient).
