---
name: rtxpro6000server-bmc
description: Reference and operating guide for the ASMB11-iKVM BMC on rtxpro6000server. Covers web UI structure, fan-control architecture, IPMI in-band access, and self-management runbook. Mapped 2026-04-29 from the live BMC web UI at 192.168.1.156.
type: hardware-reference
machine: rtxpro6000server
date: 2026-04-29
updated: 2026-04-29
updated_by: Rocinante Opus 4.7 (Chrome MCP exploration of BMC web UI)
volatility: low
tags: [meta/hardware, machine/rtxpro6000server, bmc, ipmi, fan-control]
related:
  - machines/rtxpro6000server/HARDWARE
  - inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect
  - research/persona-engineering/HARDWARE-THERMAL-BASELINE
---

# rtxpro6000server BMC — operating reference

## Identity

| Field | Value |
|---|---|
| BMC module | ASUS ASMB11-iKVM (AST2600 chip) |
| Firmware | 2.1.30 (build Jul 28 2025 04:01 UTC) |
| BIOS Model (paired) | Pro WS WRX90E-SAGE SE, BIOS 1203 (07/18/2025) |
| Default credentials | `admin / admin` (CHANGE on first login) |
| Web UI | `https://192.168.1.156` (self-signed cert, accept warning once) |
| IPMI in-band | works on rtxserver via `ipmitool` (no `-H`) |
| IPMI over LAN | `ipmitool -I lanplus -H 192.168.1.156 -U admin -P <pw>` from any other host on 192.168.1.0/24 |
| LAN config | DM_LAN unused (static 10.10.10.10, no cable). Shared LAN at 192.168.1.156 (DHCP from Fios) |
| Manufacturer ID | 2623 (ASUS) |
| Product ID | 0x1193 |

## Why the BMC matters on this board

The ASUS WRX90E-SAGE SE deliberately routes ALL fan PWM through the BMC — not through the BIOS Q-Fan path or the Super-IO chip. OS-side `nct6798` PWM writes succeed in `/sys/class/hwmon/` but never reach the physical fans because the BMC's fan-control firmware is the authoritative source. There is no `Q-Fan Configuration` submenu in the BIOS Monitor tab on stock builds (BMC_SW jumper at default position 1-2).

This means:
- **All fan control must go through the BMC** — either via web UI (interactive) or `ipmitool` (programmatic).
- **OS daemons writing to `/sys/class/hwmon/hwmonN/pwmM` are inert.** Don't waste time on `fancontrol`, `pwmconfig`, or hwmon-based scripts.
- **The BMC sees GPU temperatures natively** as `PCIE01-PCIE07 Temp` sensors and can drive fan curves off them directly. No daemon needed for basic GPU-aware cooling.

## Web UI — sidebar map

| Menu | URL | Purpose |
|---|---|---|
| Dashboard | `/#dashboard` | Overview: power state, firmware version, LAN status, sensor summary, recent events |
| Sensor | `/#sensors` | All sensor readings (fans, temps, voltages) live |
| System Inventory | `/#system-inventory` | Hardware inventory (CPU, DIMMs, etc.) |
| FRU Information | `/#fru-information` | Field-replaceable-unit data |
| Logs & Reports | `/#logs-reports` | IPMI Event Log, System Log, Audit Log, Video Log |
| Settings | `/#settings` | All configuration (see Settings tile grid below) |
| Remote Control | `/#remote-control` | Launch HTML5 KVM/SOL session |
| Image Redirection | `/#image-redirection` | Mount remote ISO/IMG (Local Media, Remote Media, Active Redirections) |
| Power Control | `/#power-control` | Power On/Off/Reset/Cycle, ACPI shutdown |
| Locator LED | `/#locator-led` | Toggle the chassis ID LED |
| Maintenance | `/#maintenance` | Firmware update, backup/restore config, factory reset, system administrator settings |

## Settings tile grid

`/#settings` contains 19 tiles. Most relevant to operations:

| Tile | URL | Purpose |
|---|---|---|
| **Fan Control** | `/#settings/fan_control` | The big one — see below |
| Network Settings | `/#settings/network-settings` | DM_LAN/Shared LAN, DNS, NC-SI, Network Bond, IP |
| User Management | `/#settings/user-management` | Add/remove BMC accounts, change passwords |
| SSL Settings | `/#settings/ssl-settings` | Generate/upload/view BMC cert |
| Date & Time | `/#settings/date-and-time` | Clock + NTP |
| Services | `/#settings/services` | Enable/disable BMC services (web, KVM, IPMI, SSH) + their port + timeout |
| IPMI Interfaces | `/#settings/ipmi-interfaces` | Enable/disable IPMI over each interface |
| Platform Event Filter | `/#settings/pef` | Auto-actions on hardware events (event filters, alert policies, LAN destinations) |
| SMTP Settings | `/#settings/smtp-settings` | Outgoing email config for alerts |
| External User Services | `/#settings/external-user-services` | LDAP, RADIUS, Active Directory |
| System Firewall | `/#settings/system-firewall` | IP and port firewall rules |
| Log Settings | `/#settings/log-settings` | SEL log retention policy |
| Manage Licenses | `/#settings/license` | License keys (BMC features may be license-gated) |
| Captured BSOD | `/#settings/captured-bsod` | Auto-capture Windows BSOD screen |
| KVM Mouse Setting | `/#settings/kvm-mouse-setting` | Absolute vs relative mouse mode for KVM |
| Media Redirection Settings | `/#settings/media-redirection` | Remote ISO mount config |
| PAM Order Settings | `/#settings/pam-order` | PAM auth order |
| Video Recording | `/#settings/video-recording` | Auto-record SOL/video on event triggers |
| PSU Cold Redundancy | `/#settings/psu-cold-redundancy` | PSU 1+1 redundancy mode |

## Fan Control architecture

**Three sub-pages:**

### `/#settings/fan_control/auto` — Auto mode (preset profiles)

Single radio-button selector. Currently set to **Generic mode**. Options:
- **Generic mode** — default balanced profile
- **Silent mode** — quietest, lowest fan speeds
- **Turbo mode** — aggressive cooling
- **Full speed mode** — all fans at 100%

These presets override the Customized curves. Setting Auto mode = Generic and configuring Customized = the typical setup.

### `/#settings/fan_control/manual` (the "Customized" tile) — per-zone 4-point curves

**7 fan zones, each with editable A/B/C/D curve points:**

| Zone | Header(s) | Fan(s) on rtxserver as of 2026-04-29 |
|---|---|---|
| Zone 1 | CPU_FAN & CPU_OPT | Noctua NH-U14S TR5-SP6 (CPU), CPU_OPT empty |
| Zone 2 | CHA_FAN1 | ARCTIC P14 PWM |
| Zone 3 | CHA_FAN2 | ARCTIC P14 PWM |
| Zone 4 | CHA_FAN3 | ARCTIC P14 PWM |
| Zone 5 | CHA_FAN4 | empty (or 5th ARCTIC P14) |
| Zone 6 | CHA_FAN5 | **3× Super Flower MEGACOOL on splitter** |
| Zone 7 | W_PUMP+ | empty (was MEGACOOLs before 2026-04-29; moved to CHA_FAN5) |

Each zone has Save button independently. Curves are 4-point: A/B/C/D temp+duty pairs. Linear interpolation between points; below A clamps to A's duty, above D clamps to D's duty.

**Default curves observed (all keyed to CPU Package Temp):**
- Zones 1, 2, 6 (CPU/CHA_FAN1/CHA_FAN5): A=20°C/20%, B=45°C/40%, C=65°C/70%, D=70°C/100%
- Zones 3, 4, 5 (CHA_FAN2/3/4): A=20°C/60%, B=45°C/70%, C=60°C/85%, D=70°C/100%

### `/#settings/fan_control/source` — Temperature Source binding

**This is the crown jewel.** Each fan zone can be bound to any of these temperature sources:

```
CPU Package Temp       ← default for all
TR1 Temperature        ← Threadripper internal
LAN Temp
DIMMA1_Temp - DIMMH1_Temp  (8 DIMMs, all 256GB populated)
PCIE01 Temp            ← always N/A (no card in slot)
PCIE02 Temp            ← always N/A
PCIE03 Temp            ← GPU0 (RTX PRO 6000 Blackwell, slot 3) — HOT slot
PCIE04 Temp            ← N/A
PCIE05 Temp            ← N/A
PCIE06 Temp            ← N/A
PCIE07 Temp            ← GPU1 (RTX PRO 6000 Blackwell, slot 7) — cooler slot
```

**This means GPU-aware cooling is built in.** Set CHA_FAN5's temperature source to PCIE03 Temp and the MEGACOOLs ramp on GPU0 heat directly. No daemon required for the basic case.

**Recommended source assignments for this build (as of 2026-04-29):**

| Zone | Bind to | Reason |
|---|---|---|
| Zone 1 (CPU_FAN/CPU_OPT) | **CPU Package Temp** | Noctua follows CPU heat directly |
| Zone 2 (CHA_FAN1) | **PCIE07 Temp** | GPU1 (cooler slot), front intake covers it |
| Zone 3 (CHA_FAN2) | **PCIE03 Temp** | GPU0 (hot slot) |
| Zone 4 (CHA_FAN3) | **PCIE03 Temp** | GPU0 |
| Zone 5 (CHA_FAN4) | **PCIE07 Temp** | GPU1 |
| Zone 6 (CHA_FAN5 / MEGACOOLs) | **PCIE03 Temp** | The big-current fans should follow the hot GPU |
| Zone 7 (W_PUMP+) | leave default | empty header |

**Limitation:** each zone takes ONE source. There is no "max(PCIE03, PCIE07)" combinator at the BMC level. To handle the case where GPU1 spikes hotter than GPU0, write a daemon that polls both and reassigns sources via IPMI raw commands. That's a future project.

## Sensor inventory (via `ipmitool sdr` in-band)

**Fan tachs the BMC reads:**

| Sensor name | ID | Notes |
|---|---|---|
| CPU_FAN | 0x32 | Noctua, follows Zone 1 |
| CPU_OPT | 0x33 | Disabled (no fan) |
| CHA_FAN1 | 0x34 | ARCTIC P14 |
| CHA_FAN2 | 0x35 | ARCTIC P14 |
| CHA_FAN3 | 0x36 | ARCTIC P14 |
| CHA_FAN4 | 0x37 | Disabled (empty) |
| CHA_FAN5 | 0x38 | **MEGACOOLs (3 on splitter; only first reports tach)** |
| W_PUMP+ | 0x39 | Disabled (empty after move) |
| USB4_FAN | 0x51 | M.2 area cooling |
| VRME_HS_FAN | 0x52 | VRM east heatsink fan (0 RPM = passive heatsink, no fan) |
| VRMW_HS_FAN | 0x53 | VRM west heatsink fan (0 RPM = passive) |
| M.2_FAN | 0x54 | M.2 cooling |

**Temperature sensors the BMC reads:**

| Sensor | Source | Threshold |
|---|---|---|
| CPU Package Temp | Threadripper SoC | warn 93 / err 94 / nr 95 |
| TR1 Temperature | TR1 die | nr 100 |
| LAN Temp | onboard NIC | warn 93 / err 96 / nr 99 |
| DIMMA1-H1_Temp | each DIMM | warn 81 / err 83 / nr 85 |
| PCIE03 Temp | GPU0 slot | warn 90 / err 95 / nr 100 |
| PCIE07 Temp | GPU1 slot | warn 90 / err 95 / nr 100 |

## IPMI command reference

### In-band (from rtxserver itself)

Read-only sensor commands work fine:
```bash
sudo ipmitool sensor                          # all sensors with state
sudo ipmitool sdr type fan                    # just fans
sudo ipmitool sdr type temperature            # just temps
sudo ipmitool sel list                        # System Event Log
sudo ipmitool mc info                         # BMC info
sudo ipmitool fru                             # field-replaceable-unit data
sudo ipmitool chassis status                  # power state, intrusion, etc.
sudo ipmitool lan print 1                     # DM_LAN config
sudo ipmitool lan print 8                     # Shared LAN config (192.168.1.156)
```

**Fan PWM via raw commands — UNVERIFIED.** Standard Supermicro raw command `0x30 0x70 0x66` returns "Invalid data field." ASUS-specific command sequence not yet identified. Open question: how does the BMC web UI talk to the fan controller? Likely via vendor-specific raw OEM command — need to capture web UI HTTP traffic to reverse it, OR find ASUS documentation. **Until that's solved, fan curves must be set via the web UI.**

### Out-of-band (from any other host on the LAN, e.g. Rocinante)

```bash
ipmitool -I lanplus -H 192.168.1.156 -U admin -P <pw> sensor
ipmitool -I lanplus -H 192.168.1.156 -U admin -P <pw> chassis power status
```

**Note: rtxserver itself CANNOT reach 192.168.1.156 over the network** (Shared LAN hairpin — host can't ping its own port-mate via the switch). For OOB IPMI from rtxserver to its own BMC, would need a separate physical cable to DM_LAN.

## Power management

`/#power-control` exposes:
- Power On
- Power Off (immediate)
- Power Cycle
- Hard Reset
- ACPI Shutdown (graceful)

Equivalent IPMI commands:
```bash
sudo ipmitool power on
sudo ipmitool power off
sudo ipmitool power cycle
sudo ipmitool power reset
sudo ipmitool power soft     # = ACPI shutdown
sudo ipmitool power status
```

## Remote KVM + virtual media

Remote Control launches an HTML5 KVM session for full graphical console access — useful for BIOS work without physical monitor. Supports virtual media mounting (ISO/IMG via Image Redirection) for OS reinstalls.

## What rtxserver Claude can do for self-management

The BMC is now a first-class management surface. Future rtxserver Claude sessions should:

1. **Read sensors via ipmitool in-band** for monitoring (instead of trying `nct6798` writes).
2. **Drive fan curves via the web UI** for now (manual setup, persists across reboots in the BMC). Document chosen curves in this file when changed.
3. **Use `ipmitool sel list`** to read the System Event Log for hardware events (memory errors, thermal events, power issues). Add to the daily-household-health flow.
4. **Research the ASUS OEM raw IPMI command** for setting fan PWM. Once known, write a daemon that polls `nvidia-smi` GPU temps + `ipmitool sdr` BMC temps, computes desired duty cycle per zone, sends raw IPMI commands. This is the long-term GPU-aware-with-max() control we wanted.
5. **Do NOT modify BMC settings (User Management, Network, Services, Firewall, IPMI Interfaces) without explicit greenlight** — those changes can lock the household out of the box if misconfigured.

## Open questions / next steps

- [x] ~~Find ASUS-specific IPMI raw command for fan PWM~~ — NOT FOUND for ASUS; see `inbox/rtxpro6000server/IPMI-FAN-RESEARCH.md`. ASRock Rack AST2600 sequence (`0x3a 0xd0`) is a plausible-but-unverified hypothesis filed for the future.
- [x] ~~Set initial Customized fan curves with PCIE03/PCIE07 sources~~ — applied 2026-04-29 via Chrome MCP; see History entry above.
- [x] ~~Validate post-curve thermal performance with another 475W/card 5-min run~~ — done; verdict marginal, see `experiments/2026-04-29-post-bmc-binding-stress/comparison.md`.
- [x] ~~Document SEL hardware events into the daily-health pipeline~~ — `.claude/agents/self-steward.md` extended 2026-04-29 with `ipmitool sel list` capture + per-event-type severity rules.
- [ ] Capture HTTP body of one Customized-curve Save POST via Chrome DevTools (free during the next BMC web UI session — useful for future scripting interface).
- [ ] **Cooling upgrade decision (open):** install 5th ARCTIC P14 in CHA_FAN4, rebind Zone 5 → PCIE03, re-test. If GPU0 peak still ≥ 78°C, escalate to water cooling on GPU0. See `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md`.
- [ ] Once raw IPMI command is found OR HTTP-capture interface is built, write `gpu-fan-control` daemon with `max(PCIE03, PCIE07)` logic + watchdog (low priority — current per-zone single-source binding is already adequate for current operation).
- [ ] Change BMC default password (`admin`) — file the new credentials in a secure location.

## History

- 2026-04-29: Created during Chrome-MCP-driven exploration of the BMC web UI. Found that ASUS routes all fan PWM through the BMC (Q-Fan in BIOS is inert without BMC_SW jumper change). Discovered that fan zones can be independently bound to PCIE03/PCIE07 GPU temperatures — GPU-aware cooling without a daemon. Mapped 7 fan zones, 19 settings tiles, and the IPMI access surface.
- 2026-04-29 (later): rtxserver-side empirical sensor validation (`experiments/2026-04-29-bmc-sensor-validation/correlation.md`) confirmed PCIE03 = GPU0 die exact and PCIE07 = GPU1 die +1°C constant offset at idle. Both BMC sensors usable as fan-curve sources.
- 2026-04-29 (later): Research dispatched and returned NOT FOUND for an ASUS-confirmed `ipmitool raw` fan-PWM command sequence (`inbox/rtxpro6000server/IPMI-FAN-RESEARCH.md`). ASUS does not publish OEM IPMI fan commands; the upstream `ipmitool` repo has zero ASUSTeK handlers; ASRock Rack publishes a primary-source AST2600 sequence (NetFn 0x3a Cmd 0xd0 sub 0x0e/0x0f/0x11/0x12) that is architecturally plausible but NOT verified on ASUS. HTTP capture of the BMC web UI's Save POST is the deterministic path forward for any future scripted interface.
- 2026-04-29 (later): BMC fan source bindings + 4-point GPU-temp curves applied via Chrome MCP from Rocinante (`inbox/rocinante/20260429T125000Z_bmc-binding-applied.md`). Final config:

  | Zone | Header | Source | Curve A | Curve B | Curve C | Curve D |
  |------|--------|--------|---------|---------|---------|---------|
  | 1 | CPU_FAN | CPU Pkg (untouched) | 20°C/20% | 45°C/40% | 65°C/70% | 70°C/100% |
  | 2 | CHA_FAN1 | PCIE07 | 30°C/30% | 55°C/50% | 70°C/80% | 80°C/100% |
  | 3 | CHA_FAN2 | PCIE03 | 30°C/30% | 55°C/50% | 70°C/80% | 80°C/100% |
  | 4 | CHA_FAN3 | PCIE03 | 30°C/30% | 55°C/50% | 70°C/80% | 80°C/100% |
  | 5 | CHA_FAN4 | PCIE07 | 30°C/30% | 55°C/50% | 70°C/80% | 80°C/100% |
  | 6 | CHA_FAN5 (MEGACOOLs) | PCIE03 | 30°C/30% | 55°C/50% | 70°C/80% | 80°C/100% |
  | 7 | W_PUMP+ | CPU Pkg (default, empty) | 20°C/100% | 45°C/100% | 60°C/100% | 70°C/100% |

  BMC overall mode auto-promoted from "Generic mode" to "Customized mode" upon first per-zone Save (per BMC firmware behavior — saving any Customized curve makes Customized authoritative).
- 2026-04-29 (later): 5-min 475W/card thermal stress run on the post-binding config (`experiments/2026-04-29-post-bmc-binding-stress/comparison.md`). GPU0 peak 84°C, GPU1 peak 73°C, inter-card delta +10.9°C, no throttle. **Essentially unchanged from baseline** (GPU0 83°C / GPU1 72°C). Conclusion: the binding change was correct architecturally (fans follow GPU heat, lower idle noise) but the existing physical fan suite is at its thermal capacity — adding more efficient signal routing to saturated fans does not extract more heat. Decision rule places this in the "marginal" band; recommendation filed in `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md` to install a 5th ARCTIC P14 in CHA_FAN4, rebind Zone 5 to PCIE03, re-test, and decide on water cooling for GPU0 based on the re-test.
