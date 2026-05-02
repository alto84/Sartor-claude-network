---
name: Home network and smart devices
description: 85 Stonebridge network topology — Sartor-Saxena-Claude Network (UniFi, locally administered), Sonos speakers, Google Home/Nest devices, IPs, subnets. Updated 2026-05-02 to reflect the BHS takeover.
type: reference
updated: 2026-05-02
last_verified: 2026-05-02
related: [projects/unifi-takeover-2026-05-01-INDEX, projects/unifi-takeover-2026-05-01, MACHINES]
originSessionId: 6d66075b-10f9-482c-a62e-9f2828a7ed0d
---

## 85 Stonebridge Network — Sartor-Saxena-Claude Network

Single primary subnet on the Verizon Fios router LAN: **192.168.1.0/24**.

WiFi is UniFi WiFi 7 (post-2026-05-01 takeover from Berman Home Systems). Local controller runs on Rocinante. The Google Nest mesh (`Loki Ghostie google` SSID, 192.168.86.0/24) is being retired — see [[projects/unifi-takeover-2026-05-01-nest-retirement]] — and devices migrate to the UniFi `LGP123` SSID as the family re-keys them.

For the full takeover history, playbook, credentials, and recovery procedures see [[projects/unifi-takeover-2026-05-01-INDEX]].

### UniFi controller

- **URL:** `https://192.168.1.171:8443` (Rocinante, port 8443; inform port 8080)
- **Admin:** `alton` / household-default password (see project doc, not here)
- **Backing store:** MongoDB at `mongodb://127.0.0.1:27117/ace` (loopback only, no auth)
- **Daily `.unf` backup:** Windows Scheduled Task "UniFi Daily Backup" at 3 AM ET → `C:\Users\alto8\backups\unifi\` + OneDrive parallel copy

### UniFi devices (9)

| Device | IP | Switch port | Role |
|---|---|---|---|
| Sartor-Saxena-Claude Network (USW-Pro-Max-24-PoE) | 192.168.1.170 | uplink port 24 | switch |
| Hall2ndFloor (U7-Pro) | 192.168.1.167 | port 1 | AP |
| Gym (U7-Pro) | 192.168.1.165 | port 2 | AP |
| Basement (U7-Pro) | 192.168.1.168 | port 3 | AP |
| HerOffice (U7-Pro) | 192.168.1.183 | port 4 | AP |
| 3rdFloor (U7-Pro) | 192.168.1.166 | port 5 | AP |
| Livingroom (U7-Pro) | 192.168.1.185 | port 6 (downstream AV-rack switch + U-PoE++ injector) | AP |
| OutdoorBackyard (U7-Outdoor) | 192.168.1.173 | port 7 | AP |
| HisOffice (U7-PIW in-wall) | 192.168.1.186 | port 8 | AP |

### WiFi SSIDs

- **`LGP123`** — single consolidated SSID, broadcast on all 3 bands (2.4 / 5 / 6 GHz) where the AP supports them. WPA3-SAE + WPA2 transition (`pmf_mode=optional`). PSK is in the takeover project doc, not here.
- 2.4 GHz channels pinned 1/6/11 (HerOffice/Basement/HisOffice on 1, Gym/OutdoorBackyard on 6, 3rdFloor/Hall2ndFloor/Livingroom on 11). 5 GHz and 6 GHz auto.
- Auto-firmware-update enabled, daily 3 AM ET window, release channel.

### Other LAN clients (192.168.1.x — selected)

- Rocinante (Windows): 192.168.1.171 (Ethernet — also runs UniFi controller)
- gpuserver1 (Ubuntu): 192.168.1.100
- Apple TV Office: 192.168.1.160
- Verizon CR1000A router: 192.168.1.1 (DHCP server, only L3 gateway, DMZ host = 192.168.1.100 for vast.ai)

## Sonos speakers (6)

Migrating from the Nest mesh (192.168.86.x) to UniFi LGP123 as devices re-key. Coordinator group typically Kitchen.

- Kitchen, Living Room, Office, Patio, Gazebo, Hot Tub Area
- Control via: `soco` Python library (local UPnP)

## Google Home / Nest (6) — being retired with the Nest mesh

- Kids Room Google Home Max
- Master Bedroom Google Home Max
- Office Nest Hub
- Family Room Nest Hub
- Attic Chromecast
- Bedroom Cast Group
- Control via: `pychromecast` (local mDNS/Cast)

The Nest mesh root currently sits on switch port 22 at 192.168.1.163 (MAC `90:ca:fa:35:28:1c`); two wireless mesh peers in the `24:e5:0f:42:*` family. Pulling the wired root takes the whole mesh dark within seconds. See [[projects/unifi-takeover-2026-05-01-nest-retirement]] for the safe retirement procedure and the 75 GB sustained-flow anomaly that motivates it.

## How to apply

When building smart home integrations, prefer LGP123 + 192.168.1.0/24 going forward. Until the Nest mesh is retired, some legacy devices may still live on the 192.168.86.x subnet — check `arp -a` from Rocinante and re-key the device to LGP123 to migrate it. Firewall rules for UDP 1900 (SSDP) and 5353 (mDNS) remain installed.

## History

- 2026-05-02: Rewritten to reflect the 2026-05-01 UniFi takeover. Old "Loki Ghostie google" / 192.168.86.x section narrowed to the Nest-retirement holdover.
- Earlier: Two-subnet topology (Verizon LAN + Nest mesh), prior to the BHS install in late April 2026.
