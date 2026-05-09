---
title: HisOffice AP fix — 2026-05-09
date: 2026-05-09
type: incident-report
status: resolved-by-time
fix-phase: A (no intervention)
related: [[unifi-takeover-2026-05-01-INDEX]], [[network-management]]
---

# HisOffice AP fix — 2026-05-09

## Summary

HisOffice (U7-PIW in-wall, 192.168.1.186, MAC `1c:0b:8b:6e:6d:e3`, switch port 8) was reported in
state=10 (Adoption Failed / managed-by-other) per a probe ~04:30 UTC after the controller restart
~04:00 UTC. **By the time I ran the diagnostic probe (Phase A) the AP had already settled to
state=1 (Connected).** No intervention was required. The controller restart was the only event
needed; the AP self-recovered within the inform-cycle window.

## State at start

Phase A `unifi-probe-2026-05-09.py` returned state=1 for HisOffice and for all 8 other devices:

```
=== devices ===
  Hall2ndFloor              192.168.1.167   state=1 model=U7PRO
  OutdoorBackyard           192.168.1.173   state=1 model=UKPW
  Basement                  192.168.1.183   state=1 model=U7PRO   ← was state=10 in 04:30 probe
  HisOffice                 192.168.1.186   state=1 model=U7PIW   ← was state=10 in 04:30 probe
  Sartor-Saxena-Claude Network 192.168.1.170   state=1 model=USPM24P
  HerOffice                 192.168.1.165   state=1 model=U7PRO
  3rdFloor                  192.168.1.166   state=1 model=U7PRO
  Gym                       192.168.1.168   state=1 model=U7PRO   ← was state=10 in 04:30 probe
  Livingroom                192.168.1.185   state=1 model=U7PRO
```

Switch port 8 (HisOffice): `up=True speed=1000 name=HisOffice`. Two wireless clients currently
associated to the AP (`Pixel-10-Pro-Fold` and AstraZeneca laptop `AZAPXLGM0P85E7`), confirming
both 2.4/5/6 GHz sides functional.

Mongo cross-check on the HisOffice device record:

```
disconnected_at 1778300140   ≈ 2026-05-09 04:15:40 UTC
connected_at    1778300144   ≈ 2026-05-09 04:15:44 UTC  (4s later)
adopted         True
inform_url      http://192.168.1.171:8080/inform
```

The 4-second reconnect after the controller bounced is normal; the state=10 reading in the
04:30 probe was a transient latch on the AP's internal state machine that cleared within an
inform cycle (typical 10s heartbeat).

## Phase that fixed it

**Phase A.** The fix was the controller restart that had already happened ~04:00 UTC plus the
ensuing inform-cycle settle. No POST to `/cmd/devmgr`, no SSH, no Mongo mutation, no factory
reset. Phases B and C were not invoked.

## Passthrough port verification

HisOffice U7-PIW exposes 3 internal ports (port_idx 1, 2, 3):

| Port | Role | Live state |
|---|---|---|
| 3 | Uplink — PoE-in from switch port 8 | `up=True speed=1000 forward=all`, LLDP confirms `uplink_remote_port=8` on switch MAC `58:d6:1f:86:e3:ff`. Healthy. |
| 2 | Downstream passthrough RJ45 | `enable=True forward=all autoneg=False poe_caps=8 poe_mode=off speed=0 up=False`. **No device plugged in.** |
| 1 | Secondary downstream port | `enable=True forward=all speed=0 up=False`. No device plugged in. |

`port_overrides` and `ethernet_overrides` are both `null` in MongoDB — passthrough is at
factory-default behavior. The site has a single Default LAN (`192.168.1.0/24`,
`vlan_enabled=False`); any device plugged into port 2 or port 1 will land on the same flat
subnet, get DHCP from the Verizon Fios router, and behave identically to a switch-port client.

PoE-out on port 2 is off. **Irrelevant for gpuserver1** (which has its own AC supply) but worth
noting if Alton ever wants to power a small PoE device from this passthrough — it's a one-line
controller config flip when needed.

### What requires Alton's hands

The AP can't self-test the passthrough — there's no traffic when the port is empty. To finish
the verification:

1. Plug a wired device into the office wall plate's pass-through RJ45 (gpuserver1's existing
   cable is fine, or a laptop / phone-with-USB-Ethernet for the test).
2. The device should DHCP into `192.168.1.x`, gateway `192.168.1.1`.
3. From Rocinante or any peer: re-run `sartor/memory/projects/codebase-cleanup-2026-05-08/hisoffice-passthrough-probe.py` and confirm the device appears under
   "clients connected via HisOffice (ap_mac or sw_mac == 1c:0b:8b:6e:6d:e3)" with `sw_mac` set
   (wired) rather than `ap_mac` (wireless).

Until that step, the passthrough is **configured-correctly but unverified-end-to-end.** All
software preconditions are satisfied; the only remaining unknown is whether the in-wall RJ45
itself was punched down correctly and the cable run into the office is intact, both of which
are physical questions the controller can't answer.

## Anomalies in surrounding APs

Sister-AP recovery is a positive observation, not a problem to fix:

- **Basement** (state=10 → state=1) and **Gym** (state=10 → state=1) both self-recovered in the
  same inform-cycle window. The controller restart appears to have triggered a brief
  managed-by-other latch on multiple WiFi-7 APs (Basement, Gym, HisOffice were the three
  reported); all three cleared on their own. This is consistent with the controller bouncing
  the inform endpoint mid-handshake.
- No AP is currently in state 4/5/6/10/11.
- No PSK rotation or SSID change was performed.
- The BHS-iptables-block configs were not touched.

One wired-client oddity worth filing for follow-up but not action tonight:

- Switch port 22 hosts `192.168.1.163 / 90:ca:fa:35:28:1c` — labeled "Google Nest (retiring)". The
  Nest mesh leg is still live. The 2026-05-01 takeover doc has a Phase-3 follow-up to physically
  retire it once family devices migrate to LGP123. Status unchanged from prior probes; not blocking.
- Rocinante is on WiFi (`ap_mac=8c:ed:e1:7a:86:ac` = 3rdFloor) at `192.168.1.169` rather than
  Ethernet. This is the "WAN connection degraded" / hallway-cable scenario the user described.
  The wired-passthrough-on-HisOffice plan would let gpuserver1's cable move to the office and
  free the hallway.

## Files referenced/created

- `sartor/memory/projects/codebase-cleanup-2026-05-08/unifi-probe-2026-05-09.py` (existing) — Phase A read-only diagnostic
- `sartor/memory/projects/codebase-cleanup-2026-05-08/hisoffice-passthrough-probe.py` (new) — finds HisOffice by MAC, dumps `port_table` + clients with `ap_mac/sw_mac == HisOffice`. Reproducible end-to-end-passthrough check after Alton plugs a device in.
- `sartor/memory/projects/codebase-cleanup-2026-05-08/hisoffice-port-config.py` (new) — full uplink dict, complete port_table, MongoDB `port_overrides`/`ethernet_overrides`, networkconf summary
- `sartor/memory/projects/codebase-cleanup-2026-05-08/hisoffice-uplink-mac-lookup.py` (new) — utility to resolve a MAC against active+historical user tables

## Outcome

- HisOffice healthy: state=1, uplink 1 Gbps, 2 active wireless clients, inform URL pointing at our controller, adopted, no Mongo overrides obstructing the passthrough.
- Passthrough configuration verified correct at the controller and Mongo levels.
- Final end-to-end test requires Alton plugging a device into the office wall plate. Until then, the recommendation is "safe to move gpuserver1's cable to HisOffice's downstream port when convenient" — pending a 2-minute DHCP-and-ping confirmation after the cable moves.
