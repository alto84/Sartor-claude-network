---
name: Home network and smart devices
description: 85 Stonebridge network topology -- WiFi, Ethernet, Sonos speakers, Google Home devices, IPs, subnets
type: reference
originSessionId: 6d66075b-10f9-482c-a62e-9f2828a7ed0d
---
## 85 Stonebridge Network

Two subnets:
- **Ethernet (Verizon Fios router):** 192.168.1.0/24 -- Rocinante (.171), gpuserver1 (.100), Apple TV Office (.160)
- **WiFi (Google Nest mesh "Loki Ghostie google"):** 192.168.86.0/24 -- all smart home devices, Rocinante WiFi (.48 when connected)
- WiFi password: stored in Windows profile, SSID = "Loki Ghostie google"
- Rocinante needs WiFi connected (Intel AX201) to reach smart home devices; Ethernet alone can't do multicast discovery

## Sonos Speakers (6)
- Kitchen: 192.168.86.44 (grouped, not coordinator)
- Living Room: 192.168.86.40
- Office: 192.168.86.38
- Patio: 192.168.86.37
- Gazebo: 192.168.86.42
- Hot Tub Area: 192.168.86.41
- Control via: `soco` Python library (local UPnP, no cloud)

## Google Home / Nest Devices (6)
- Kids Room Speaker: Google Home Max, 192.168.86.46
- Master Bedroom Speaker: Google Home Max, 192.168.86.27
- Office Display: Google Nest Hub, 192.168.86.32
- Family Room Display: Google Nest Hub, 192.168.86.43
- Attic TV: Chromecast, 192.168.86.35
- Bedroom Group: Cast Group, 192.168.86.46
- Control via: `pychromecast` Python library (local mDNS/Cast protocol)

## How to apply: When building smart home integrations, connect WiFi first, then use soco.discover() and pychromecast for device access. Firewall rules for UDP 1900 (SSDP) and 5353 (mDNS) are installed.
