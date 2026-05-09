---
title: Loki-Ghostie audit (2026-05-09)
description: Enumerated all clients on the legacy Google Nest mesh by joining as a temporary client and ARP/DNS/SSDP probing
type: reference
created: 2026-05-09
updated: 2026-05-09
---

# Loki-Ghostie audit, 2026-05-09 evening

## Why

Alton: "Can you connect to loki-ghostie wifi and sniff it that way? Also can't you see total bandwidth through that network through the switch?"

Yes to both. This file is the audit trail.

## Method

1. The Nest mesh is wired through our UniFi switch on **port 22** (labeled "Google Nest (retiring)"). All Loki-Ghostie traffic passes through there before reaching Verizon Fios.
2. Loki-Ghostie clients sit on subnet `192.168.86.0/24` (Google Wifi default), NAT-hidden behind the Nest router. The aggregate is visible to us at port 22; the per-client breakdown is not — until we join the network ourselves.
3. The Loki-Ghostie PSK was already saved on Rocinante under two profile names: `Loki Ghostie google` and `Loki&Ghostie`. (Same key.) No new credential needed.
4. Joined Loki-Ghostie from Rocinante's Wi-Fi (Intel AX201) while keeping wired up; got DHCP `192.168.86.48`, gateway `192.168.86.1`. Wired kept the default route (lower metric); only ARP/discovery traffic went over Wi-Fi.
5. Parallel ICMP sweep `1..254` to populate ARP, then `Get-NetNeighbor` on the Wi-Fi interface, then reverse DNS + NetBIOS + SSDP probes for device names.
6. Disconnected Wi-Fi when done. `netsh wlan disconnect interface="Wi-Fi"`.

## Clients found

| IP | MAC | Reverse DNS | Identification |
|---|---|---|---|
| 192.168.86.1 | 90:CA:FA:35:28:1D | – (UPnP `MiniUPnPd/1.9`) | Google Nest router (gateway) |
| 192.168.86.27 | 48:D6:D5:60:21:33 | `google-home-max.lan` | Google Home Max smart speaker |
| 192.168.86.46 | E4:F0:42:54:68:DB | `google-home-max.lan` | Google Home Max smart speaker #2 |
| 192.168.86.47 | C8:A3:E8:A3:55:CA | `brwc8a3e8a355ca.lan` | Brother printer (`brw` prefix is Brother Wireless) |
| 192.168.86.201 | D4:E2:2F:93:80:8C | `rokuultralt.lan` | Roku Ultra LT streaming device |
| 192.168.86.249 | 5C:EA:1D:17:D9:D6 | `brw5cea1d17d9d6.lan` | Brother printer #2 |

Six devices total (one of which is the Nest itself). All identified, none anomalous.

## Aggregate bandwidth (visible at switch port 22)

| Direction | Cumulative | Current rate (30s window) |
|---|---|---|
| Toward Loki-Ghostie clients (downloads) | **147.9 GB** | 0.38 Mbps |
| From Loki-Ghostie clients (uploads) | **29.9 GB** | 0.07 Mbps |

For context: the household FIOS uplink itself is 521 GB rx / 117 GB tx cumulative — so Loki-Ghostie has consumed ~28% of all household downloads since the counters were last reset. The Roku Ultra LT (192.168.86.201) is the most plausible consumer.

## What this means

- **No surprise devices.** Two Google Home speakers (probably kitchen and living room), two Brother printers, one Roku, and the Nest itself. Migrating each to LGP123 is mechanical, not investigative.
- **148 GB of downloads** through Loki-Ghostie is dominantly the Roku. Migrate that first if order matters; the speakers and printers are sub-GB.
- **Per-client live traffic is still opaque** unless we put gpuserver1 (or another peer) onto Loki-Ghostie permanently and let it ARP-probe + DNS-snoop. Not worth the operational complexity given there are no unknowns left.
- **Cleanest path forward:** retire the Nest physically. Sequence: re-onboard each device to LGP123 (Google Home factory reset + Home app, Brother WPS or manual, Roku settings menu), then unplug the Nest from switch port 22.

## Migration checklist (when Alton wants to retire the Nest)

- [ ] Roku Ultra LT (`rokuultralt.lan` @ 192.168.86.201): Home → Settings → Network → Set up new connection → LGP123. Roku remembers credentials so this is single-step.
- [ ] Google Home Max #1 (`google-home-max.lan` @ 192.168.86.27): Google Home app → device → Settings → Wi-Fi → Forget → reconnect to LGP123. Or factory reset (mute button + power, 12 sec).
- [ ] Google Home Max #2 (`google-home-max.lan` @ 192.168.86.46): same procedure.
- [ ] Brother printer #1 (@ 192.168.86.47): WPS push (printer panel → Network → WLAN → WPS) on the printer + WPS button on a UniFi AP within range. Or manually enter LGP123 PSK via printer touchscreen.
- [ ] Brother printer #2 (@ 192.168.86.249): same.
- [ ] Unplug Nest from switch port 22. Power down all Nest mesh nodes.
- [ ] In UniFi: rename port 22 from "Google Nest (retiring)" to free / available. Turn its PoE off if PoE was enabled.

## Operational hygiene note

- The Loki-Ghostie PSK was readable from Rocinante's `netsh wlan show profile … key=clear` because it's stored in plaintext per Windows convention for any user who's ever joined. Treat the PSK as "household-wide ambient credential, not a secret." If we want it actually secret, rotate at the Nest after migration is done — but since the Nest is retiring, this is moot.
- Two profile names exist on Rocinante (`Loki Ghostie google` and `Loki&Ghostie`) with the same PSK. The older one is stale. Both will be deleted when the Nest is unplugged; until then they auto-reconnect if Wi-Fi comes up first, which is undesirable. I have NOT deleted them tonight to avoid confusion.

## Audit trail commands

```powershell
# Recover PSK from saved profile (useful for future audits)
netsh wlan show profile name="Loki Ghostie google" key=clear

# Connect / disconnect for a one-shot probe
netsh wlan connect name="Loki Ghostie google" ssid="Loki Ghostie google" interface="Wi-Fi"
netsh wlan disconnect interface="Wi-Fi"

# Per-interface ARP table
$wifiIdx = (Get-NetAdapter Wi-Fi).ifIndex
Get-NetNeighbor -InterfaceIndex $wifiIdx -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -match '^192\.168\.86\.' -and $_.State -in 'Reachable','Stale','Permanent' }

# Reverse DNS
[System.Net.Dns]::GetHostEntry('192.168.86.27').HostName
```
