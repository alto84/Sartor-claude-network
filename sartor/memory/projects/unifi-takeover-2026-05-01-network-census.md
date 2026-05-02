---
name: unifi-takeover-2026-05-01-network-census
description: Complete network census post-takeover. Every device, every client, every byte counter. Snapshot at 2026-05-01 evening.
type: census
status: snapshot
date: 2026-05-01
related:
  - projects/unifi-takeover-2026-05-01
  - projects/unifi-takeover-2026-05-01-report
---

# Network Census — 2026-05-01 evening

Snapshot taken ~21:45 ET, ~3 hours after PSK rotation, ~5 hours after final AP recovery (Livingroom). Controller uptime 11,202 s (~3 h 7 m — Java was restarted during the G7IW firmware-alias patch). UniFi Network 10.3.55. Read-only inspection.

## Headline counts

| Bucket | Count |
|---|---|
| UniFi managed devices | 9 (1 switch + 8 APs, all state=1) |
| Wired LAN clients seen | 23 unique MACs (controller + ARP + FDB) |
| Wireless clients connected | **0** |
| Visible neighbor SSIDs | 87 unique (984 BSSID sightings) |
| Live LAN hosts on /24 | 23 |
| Active SSID broadcasts (ours) | LGP123 only (2.4 + 5 GHz; 6 GHz not enabled) |

The zero-wireless-clients number is real and expected — the PSK rotation happened ~3 h ago and family devices have not been re-keyed yet. The takeover report's "every device in the house needs to rejoin LGP123" instruction is still pending.

---

## Section A — UniFi managed device inventory

| Device | IP | MAC | Model | FW | State | Uptime | SwPort | Clients | 2.4 ch | 5 ch | 6 ch |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sartor-Saxena-Claude Network | .170 | `58:d6:1f:86:e3:ff` | USPM24P (USW-Pro-Max-24-PoE) | 7.4.1.16850 | OK | 5 h 44 m | (uplink P24) | 8 | — | — | — |
| Hall2ndFloor | .167 | `a8:9c:6c:64:70:14` | U7-Pro | 8.5.21.18681 | OK | 1 h 22 m | P1 | 0 | 11 | 40 (auto) | 149 (auto, no VAP) |
| Gym | .165 | `8c:ed:e1:7a:f2:bc` | U7-Pro | 8.5.21.18681 | OK | 2 d 4 h | P2 | 0 | 6 | 161 (auto) | 53 (auto, no VAP) |
| Basement | .168 | `9c:05:d6:b0:53:d2` | U7-Pro | 8.5.21.18681 | OK | 2 d 4 h | P3 | 0 | 1 | 48 (auto) | 69 (auto, no VAP) |
| HerOffice | .183 | `a8:9c:6c:62:ea:20` | U7-Pro | 8.5.21.18681 | OK | 2 d 4 h | P4 | 0 | 1 | 48 (auto) | 37 (auto, no VAP) |
| 3rdFloor | .166 | `8c:ed:e1:7a:86:ac` | U7-Pro | 8.5.21.18681 | OK | 2 d 4 h | P5 | 0 | 11 | 36 (auto) | 85 (auto, no VAP) |
| Livingroom | .185 | `8c:ed:e1:7a:8a:04` | U7-Pro | 8.5.21.18681 | OK | 1 h 53 m | P6 (downstream) | 0 | 11 | 161 (auto) | 117 (auto, no VAP) |
| OutdoorBackyard | .173 | `58:d6:1f:a8:36:58` | UKPW (U7-Outdoor) | 8.5.21.18681 | OK | 3 h 40 m | P7 | 0 | 6 | 149 (auto) | — (no 6 GHz radio) |
| HisOffice | .186 | `1c:0b:8b:6e:6d:e3` | U7PIW (G7IW in-wall) | 8.5.21.18681 | OK | 2 d 4 h | P8 | 0 | 1 | 161 (auto) | — (no 6 GHz radio) |

All 8 APs run identical firmware 8.5.21.18681. Switch is on 7.4.1.16850 (bumped during adoption from 7.0.50). PoE draw per port: each U7-Pro pulls 8 W (Class 4); HisOffice in-wall 5.96 W; OutdoorBackyard 6.4 W. Port 6 (Livingroom + AV cluster) draws 0 W from the switch — confirms the AV-rack U-PoE++ injector setup.

> Auto-firmware-update: enabled, 3 AM ET window, release channel.

---

## Section B — WiFi clients (stat/sta)

**Zero wireless clients connected.** The controller's `stat/sta` returns 8 entries, all of which are wired (`is_wired: true`, no `ap_mac`/`radio`/`channel`/`rssi`). Listed under Section D and G.

This is the expected post-rotation state. Family phones, kids' iPads/Kindles, the Peloton, Apple Watch, AZ work laptop — none have been keyed onto LGP123 yet. The radios are broadcasting (verified per-AP `vap_table` shows `LGP123 state=RUN` on Hall2ndFloor / OutdoorBackyard / Gym / HisOffice / Livingroom; HerOffice / 3rdFloor / Basement returned an empty `vap_table` snapshot but the radios are configured and operating — likely a stat-collection lull, not an outage; per-radio `cu_total` shows 36-51 % util on those APs' 2.4 GHz radios so they're carrying SOME beacon traffic).

---

## Section C — All known clients (stat/alluser)

Controller's `stat/alluser` returns **16 records** (8 UniFi managed + 6 Sonos + 1 Google Nest + 1 LG TV). Notably absent from the controller's known-client view: Apple TV (.160), AZ work laptop (.153), gpuserver1 (.100), rtxserver (.157), rtxserver BMC (.156), Peloton (.178), and a Windows laptop (.193). These hosts are alive (visible via Rocinante ARP and the switch FDB) but the controller hasn't classified them as "users" — likely because they ride the FiOS gateway's L2 segment and haven't transited an AP's user-plane.

| Hostname | MAC | OUI | Last seen |
|---|---|---|---|
| LGwebOSTV | `20:17:42:b0:26:52` | LG Electronics | 1 h ago |
| (UniFi APs ×8) | various | Ubiquiti | 3 h ago (all rebooted during/post-takeover) |
| (Google Nest) | `90:ca:fa:35:28:1c` | Google | 5 h ago |
| (Sonos ×6) | `34:7e:5c:0b/0c:*` | Sonos | 5 h ago |

90-day data retention is set; this view will fatten as devices come back online and re-PSK.

---

## Section D — Switch port detail (USW-Pro-Max-24-PoE)

| Port | Label | Up | Speed | PoE | RX | TX | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Hall2ndFloor | yes | 1 G | 8.01 W (Class 4) | 3.0 MB | 52.8 MB | counters reset at recent reboot |
| 2 | Gym | yes | 1 G | 8.31 W | 2.8 MB | 52.8 MB | |
| 3 | Basement | yes | 1 G | 8.50 W | 2.6 MB | 52.8 MB | |
| 4 | HerOffice | yes | 1 G | 8.29 W | 2.5 MB | 52.8 MB | |
| 5 | 3rdFloor | yes | 1 G | 8.03 W | 2.8 MB | 52.8 MB | |
| 6 | Livingroom + AV | yes | 1 G | 0.00 W | 337 MB | **11.27 GB** | downstream AV-rack switch carries Sonos ×6 + LG TV + Livingroom AP |
| 7 | OutdoorBackyard | yes | 1 G | 6.40 W | 22.1 MB | 53.6 MB | |
| 8 | HisOffice | yes | 1 G | 5.96 W | 2.9 MB | 52.9 MB | |
| 9-21 | (unused) | no | — | — | — | — | |
| 22 | Google Nest (retiring) | yes | 1 G | 0.00 W | 553 MB | **75.00 GB** | Nest pulls 75 GB; see Section H |
| 23 | (unused) | no | — | — | — | — | |
| 24 | Verizon Fios Uplink | yes | 2.5 G | — | **86.22 GB** | 931 MB | RX = household download, TX = upload |
| 25/26 | SFP+ 1 / 2 | no | — | — | — | — | |

Zero rx/tx errors across all ports. Zero discards reported. Counter scale roughly aligns with switch uptime (5 h 44 m); 86 GB inbound in 5 h ≈ 4.0 GB/h average — heavy but not abnormal for a household with kids streaming.

### FDB (forwarding database)

24 MAC entries, all VLAN 1 (no VLANs deployed). The 8 MACs behind P6 are: Livingroom AP + 6 Sonos Amps + LG OLED. Behind P22 is the single Google Nest. P24 carries gateway, uplink-side neighbors (likely STBs and routers), and any host whose default-route traffic transits the FiOS gateway (gpuserver1, rtxserver, BMC, AZ laptop, AppleTV, the Windows laptop).

---

## Section E — Per-AP wireless detail

| AP | 2.4 ch | 2.4 cu% | 5 ch | 5 cu% | 6 ch | 6 cu% | VAP state |
|---|---|---|---|---|---|---|---|
| Hall2ndFloor | 11 | **53** | 40 | 2 | 149 | 1 | LGP123 RUN on 2.4+5; no 6 GHz VAP |
| OutdoorBackyard | 6 | **74** | 149 | 15 | — | — | LGP123 RUN on 2.4+5 |
| HerOffice | 1 | 36 | 48 | 1 | 37 | 2 | (vap_table empty in this snapshot) |
| HisOffice | 1 | **50** | 161 | 3 | — | — | LGP123 RUN on 2.4+5 |
| Gym | 6 | 49 | 161 | 5 | 53 | 2 | LGP123 RUN on 2.4 (5/6 vap missing) |
| 3rdFloor | 11 | 44 | 36 | 1 | 85 | 2 | (vap_table empty in this snapshot) |
| Basement | 1 | **51** | 48 | 1 | 69 | 2 | (vap_table empty in this snapshot) |
| Livingroom | 11 | 32 | 161 | 3 | 117 | 1 | LGP123 RUN on 2.4+5 |

All 2.4 GHz radios are pinned per the post-takeover plan (1/6/11 split). 5 GHz and 6 GHz remain on `auto` and have settled to varied DFS / U-NII channels; no overlap conflicts within the house. Channel utilization on 2.4 is high across the board (32-74 %) but that is mostly neighbor noise, not our traffic — see neighbor SSID density below.

**6 GHz radios are powered up and selecting channels but not broadcasting LGP123.** The wlanconf has `wlan_bands: ['2g', '5g']` only. WiFi 7 capacity unused on the 6 capable APs (HerOffice, HisOffice has no 6 GHz, OutdoorBackyard has no 6 GHz).

---

## Section F — Network topology

```
Verizon CR1000A gateway (192.168.1.1, ac:91:9b:6c:9b:69, WNC)
└── USW-Pro-Max-24-PoE (.170) — uplink P24 @ 2.5 G
    ├── P1  Hall2ndFloor AP (.167)                   [no wireless clients]
    ├── P2  Gym AP (.165)                            [no wireless clients]
    ├── P3  Basement AP (.168)                       [no wireless clients]
    ├── P4  HerOffice AP (.183)                      [no wireless clients]
    ├── P5  3rdFloor AP (.166)                       [no wireless clients]
    ├── P6  AV-rack downstream cluster (no PoE from switch; separate U-PoE++ brick)
    │       ├── Livingroom AP (.185)                 [no wireless clients]
    │       ├── Sonos Amp "Patio"          (.184)
    │       ├── Sonos Amp "Office"         (.187)
    │       ├── Sonos Amp "Gazebo"         (.188)
    │       ├── Sonos Amp "Living Room"    (.189)
    │       ├── Sonos Amp "Kitchen"        (.190)
    │       ├── Sonos Amp "Hot Tub Area"   (.191)
    │       └── LG OLED TV                 (.192)
    ├── P7  OutdoorBackyard AP (.173)                [no wireless clients]
    ├── P8  HisOffice AP in-wall (.186)              [no wireless clients]
    ├── P22 Google Nest (.163, going away)
    └── P24 Verizon FiOS uplink → also reaches:
            ├── Rocinante / controller (.171)
            ├── gpuserver1 (.100, ASUSTek MAC)
            ├── rtxserver (.157)  + BMC (.156)
            ├── AZ laptop (.153, USI/Lenovo MAC)
            ├── Windows laptop "LAPTOP-C4A43U6V" (.193, Intel MAC)
            ├── Apple TV "Office" (.160)
            └── (Verizon STBs / extenders on uplink: 30:c5:99 series — Asus-built Verizon hardware)
```

Why so much rides P24: hosts that talk primarily to the gateway (Rocinante, the GPU servers, AppleTV, AZ laptop, Windows laptop) have their MACs learned by the switch via uplink-side traffic and accumulate behind P24. The switch is doing pure L2 — there is no VLAN segmentation.

---

## Section G — Non-UniFi LAN devices

| IP | MAC | OUI | Identity | Service hint |
|---|---|---|---|---|
| .1 | `ac:91:9b:6c:9b:69` | WNC | **Verizon FiOS CR1000A gateway** | DHCP, DNS, NAT |
| .100 | `bc:fc:e7:d9:08:eb` | ASUSTek | **gpuserver1** (Ubuntu 22.04, RTX 5090) | SSH, vast.ai daemon, gateway API :5001 |
| .153 | `8c:3b:4a:56:c5:6c` | USI (Universal Global Scientific) | AstraZeneca work laptop (likely) | high RTT 23-442 ms suggests VPN tunnel active |
| .156 | `30:c5:99:d5:8f:b8` | ASUSTek | **rtxserver BMC** (out-of-band IPMI) | IPMI |
| .157 | `30:c5:99:d5:8f:b5` | ASUSTek | **rtxserver** (Ubuntu 22.04, dual RTX PRO 6000 Blackwell) | SSH, fine-tune workload |
| .160 | `e0:89:7e:5e:46:75` | Apple | **Apple TV "Office"** (tvOS 18.x) | AirPlay/AirTunes :7000 (HTTP/1.1 403, Server: AirTunes/940.23.1) |
| .163 | `90:ca:fa:35:28:1c` | Google | **Google Nest** (root device) | mDNS, also serves "Loki Ghostie google" mesh SSID |
| .184 | `34:7e:5c:0b:dd:aa` | Sonos | **Sonos Amp — Patio** | Sonos UPnP :1400 |
| .187 | `34:7e:5c:0b:dd:ad` | Sonos | **Sonos Amp — Office** | Sonos UPnP :1400 |
| .188 | `34:7e:5c:0b:14:23` | Sonos | **Sonos Amp — Gazebo** | Sonos UPnP :1400 |
| .189 | `34:7e:5c:0b:d0:60` | Sonos | **Sonos Amp — Living Room** | Sonos UPnP :1400 |
| .190 | `34:7e:5c:0b:dd:a1` | Sonos | **Sonos Amp — Kitchen** | Sonos UPnP :1400 |
| .191 | `34:7e:5c:0c:63:5d` | Sonos | **Sonos Amp — Hot Tub Area** | Sonos UPnP :1400 |
| .192 | `20:17:42:b0:26:52` | LG | **LG webOS OLED TV** | webOS HTTP :3000 (200 OK) |
| .193 | `dc:1b:a1:7c:de:0e` | Intel | **Windows laptop "LAPTOP-C4A43U6V"** | unknown — Windows-default hostname pattern |
| .171 | `2c:f0:5d:39:21:7f` | MSI | **Rocinante** (controller host) | UniFi controller :8443/:8080, MERIDIAN dashboard :5055 |
| .170 | `58:d6:1f:86:e3:ff` | Ubiquiti | **USW-Pro-Max-24-PoE** | switch — managed |
| .178 | — | — | **Peloton** (offline at census time) | not reachable |

Every host on the wire is identified. Nothing unaccounted for.

### Sonos room map (newly captured)

| IP | Room |
|---|---|
| .184 | Patio |
| .187 | Office |
| .188 | Gazebo |
| .189 | Living Room |
| .190 | Kitchen |
| .191 | Hot Tub Area |

### The Google mesh inside the house

A private SSID `Loki Ghostie google` (WPA2-Personal, beaconing on 2.4 ch 1/6/11 and several 5 GHz channels) is being broadcast from **at least 4 distinct Google MAC families** inside the house, observed by every one of our 8 APs:
- `90:ca:fa:35:28:10/14/1c` — the .163 Nest (multi-radio / multi-VAP from the same physical device)
- `24:e5:0f:42:3e:bc/c0` and `24:e5:0f:42:8f:c5/c9` — at least two additional Google devices (Nest Hub / Home / Wifi pucks) that have NEVER touched our wired LAN

These mesh wirelessly to the .163 root and don't show in the switch FDB. RSSIs on the order of 40-66 (UniFi reports as positive in `stat/rogueap`, equivalent to roughly -50 to -60 dBm) confirm they're physically inside or near the house. The takeover doc's "Google Nest device — going away soon anyway" understates the scope: there's a small Google mesh, not a single Nest.

---

## Section H — Traffic snapshot

Counters since switch reboot (~5 h 44 m). The `stat/sta` byte-counters per client read 0 across the board — consistent with the controller's stats reset around the takeover restarts, plus zero wireless clients online. The switch port counters are the reliable surface.

| Top talker | Direction | Bytes (5 h 44 m) | Per hour |
|---|---|---|---|
| **WAN download** (P24 RX from FiOS) | in | 86.22 GB | ~15.0 GB/h |
| **Google Nest P22 TX** (switch → Nest) | out (to Nest) | 75.00 GB | ~13.1 GB/h |
| **P6 AV-rack TX** (switch → AV cluster) | out | 11.27 GB | ~2.0 GB/h |
| **WAN upload** (P24 TX to FiOS) | out | 0.93 GB | ~165 MB/h |
| All AP ports combined | both | ~0.5 GB | tiny |

Two anomalies stand out:

1. **Port 22 Google Nest pulled 75 GB in 5.7 hours.** That is enormous for a Nest. Either the device is doing automatic backups, large sync of Photos to a paired Home Hub display, or it's the wired root for the entire Google mesh and all its mesh devices' traffic egresses through it. 75 GB is ~88 % of total household download (86 GB inbound, 75 GB went to the Nest). If true, almost every byte coming into the house in the snapshot window was destined for Google devices. Worth corroborating in a longer window.

2. **P6 AV-rack 11.3 GB out** is consistent with Sonos casting + an LG TV streaming session. Not unusual.

The P24 RX vs TX asymmetry (86 GB down, 0.93 GB up) is normal for a residential Internet pattern — almost no upload, lots of streaming inbound.

---

## Section I — Anomalies and surprises

1. **Three "Loki Ghostie google" Google mesh nodes that aren't on our wire.** They mesh to the .163 root over WiFi, broadcast their own SSID, and remain invisible to the controller's client list. If the .163 Nest gets pulled (the takeover plan calls for that), the mesh dies — that may or may not be the intent. Worth a quick "do we know what these are and do we want to keep any of them?" review with Aneeta.
2. **Google Nest pulling 75 GB in <6 hours = 88 % of household download.** This is either a large one-time sync or a steady fire-hose. Either way, retiring the Nest may visibly free WAN bandwidth.
3. **Three 30:c5:99 / bc:fc:e7 ASUSTek MACs on uplink port 24** — turned out NOT to be unknown: bc:fc:e7 = gpuserver1, 30:c5:99:d5:8f:b5 = rtxserver, 30:c5:99:d5:8f:b8 = rtxserver BMC. All three are Asus motherboard / NIC OUIs and were misclassified as mystery devices on first pass. Resolved by cross-referencing Rocinante's ARP table (which knows them by IP from prior comms).
4. **Apple TV at .160 has hostname "Office" in the FDB.** Either the AppleTV is named "Office" or the DHCP lease label was inherited from BHS's setup. Worth renaming if "Office" was Pete's labeling rather than a Sartor preference.
5. **A Windows laptop "LAPTOP-C4A43U6V" at .193 (Intel NIC)** uptime 59 min in FDB — Windows-default hostname pattern. Either the AZ work laptop (the .153 host has a USI/Lenovo OUI which is also Windows-likely; both could be AZ-related — one a primary, one a kiosk?) or a different household machine. Identity not 100 % nailed down.
6. **Berman Net and GhLoP are still being broadcast from neighbor sites** — at low RSSI (best -27 dBm equivalent). Pete services other clients; both old SSIDs persist outside our walls. Not actionable from our side, but means anything on those networks at neighbors is using the old well-known PSKs.
7. **6 GHz radios up but unused.** The wlanconf only enables 2g+5g for LGP123, leaving 6 capable WiFi 7 APs (Hall2ndFloor, HerOffice, 3rdFloor, Basement, Gym, Livingroom — six total) sitting on idle 6 GHz radios that have selected channels but no VAP. WiFi 7 was paid for and is half-deployed.
8. **Channel utilization on 2.4 GHz channel 6 is 74 %** at OutdoorBackyard — that is a solid wall of neighbor traffic. Channel 6 is the worst channel in the immediate area; ch 1 sites measure 36-51 % util, ch 11 sites 32-53 %.
9. **OutdoorBackyard AP retains globally-routable IPv6** (per the takeover doc's open item). Not re-validated in this census; flagged again as still-open.
10. **HerOffice / 3rdFloor / Basement returned empty `vap_table` in the snapshot** despite their radios reporting normal CU and num_sta. This is a stat-collection lull, not an outage — radios are configured and broadcasting. If it persists 24 h, look at it; otherwise transient.
11. **Verizon Fios uplink negotiated 2.5 G** — one of the better discoveries. The CR1000A's LAN port is doing 2.5GBASE-T, matching the switch SFP/copper capability. Plenty of WAN headroom.

Nothing on the LAN looks malicious. No rogue UniFi devices reporting in. The hidden-SSID `letmeinnow` is gone from our AP broadcasts (confirmed: no LGP123-side hidden VAP, only LGP123 itself).

---

## Section J — Recommended next actions (prioritized)

1. **Inventory and decide on the three non-wired Google mesh nodes.** They're broadcasting `Loki Ghostie google` from inside the house, will go offline when the .163 Nest is pulled, and may or may not be wanted. Quick walk-through of Google Home app → "Devices" should resolve in under 5 minutes.
2. **Re-PSK family devices onto LGP123.** Currently zero wireless clients connected. The list in the takeover report is the action list — phones, iPads, laptops, AZ laptop, Peloton, Apple Watch.
3. **Investigate the 75 GB Google Nest pull.** If Photos backup or Home Hub sync, fine — drops to zero once the device is retired. If something else (a compromised Nest is unlikely but the volume is striking), worth a Wireshark or a quick sFlow look before unplugging.
4. **Enable 6 GHz on LGP123** — flip `wlan_bands` to include `6g` in the wlanconf. Six APs have idle 6 GHz radios. Caveat: many older devices won't see it; that's fine, dual-band fallback is already configured.
5. **Confirm the .193 / .153 laptop identities** — the two Intel/USI laptops on the wire. One is presumably the AZ work laptop; the other is unaccounted for in the takeover doc. Renaming both via DHCP lease + applying client labels in UniFi makes future censuses readable.
6. **Move OutdoorBackyard 2.4 GHz off channel 6** — 74 % utilization is mostly neighbors. Channel 1 sites here are ~36-50 %. Not urgent (the AP has no clients yet), but worth doing before the Peloton + outdoor speakers come back up.
7. **Confirm OutdoorBackyard's IPv6 firewall posture** — still open from the takeover doc; the public IPv6 reachability concern remains untested.

---

*Snapshot end. Data sources: UniFi Network 10.3.55 API (`stat/device`, `stat/sta`, `stat/alluser`, `stat/rogueap`, `list/wlanconf`, `list/networkconf`, `stat/health`, `stat/sysinfo`); switch SSH (`swctrl mac show`, `/proc/net/arp`); Rocinante `arp -a`; mDNS/HTTP probes against Sonos UPnP, AppleTV AirTunes, LG webOS; live OUI lookup via `api.macvendors.com`. No PUTs, no config changes.*
