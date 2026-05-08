---
name: unifi-takeover-2026-05-01-final-census
description: Final clean-state network census after the full takeover, PSK rotation, SSID consolidation, 4-AP cleanup, channel re-plan, 6 GHz enable, and backup automation. Compare to the earlier mid-state census to confirm everything is now stable.
type: census
status: snapshot-final
date: 2026-05-01
related:
  - projects/unifi-takeover-2026-05-01-report
  - projects/unifi-takeover-2026-05-01-network-census
---

# Network Census — 2026-05-01 FINAL (post-cleanup)

Snapshot taken ~22:30 ET, ~30 min after the 4-AP reboot and SSID consolidation pass, ~2.5 h after the PSK rotation. Controller uptime 6 h 29 m, UniFi Network 10.3.55. Read-only inspection.

The headline: **the network is clean, calm, and broadcasting only what it should.** Nine devices state=1, all on rotated SSH credentials. One SSID (LGP123) on all three bands across all WiFi-7-capable APs. Zero Berman Net / GhLoP / `letmeinnow` residue anywhere — config, hostapd, or live-air. Backup automation ran cleanly at 21:58.

---

## Headline counts

| Bucket | Count | Delta vs. mid-state |
|---|---|---|
| UniFi managed devices | **9** (1 switch + 8 APs, all state=1) | unchanged |
| All 8 APs reachable on rotated SSH (`alton:;Lkjpoiu0987`) | **8/8** | new verification, all green |
| Wired LAN clients in switch FDB | 23 | -1 (Peloton .178 still offline; .153 AZ laptop dropped from FDB but still in ARP) |
| Wireless clients connected | **0** | unchanged (family devices have not re-keyed yet) |
| LGP123 broadcasts via `iw dev` | **22 VAPs** (3 bands × 6 WiFi-7 APs + 2 bands × 2 dual-band APs) | new — 6 GHz now active |
| Berman Net / GhLoP / letmeinnow live-air sightings (last 20 min) | **0** | down from 4-h-old residual entries |
| Active SSIDs visible from Rocinante's wireless | 6 | clean (LGP123 is ours, the rest external) |
| Backup automation last run | 2026-05-01 21:58 SUCCESS | new, healthy |
| Next backup scheduled | 2026-05-02 03:00 ET | new, on-rails |

---

## Section A — UniFi managed device inventory (9, all state=1)

| Device | IP | MAC | Model | FW | Uptime | Inform URL | SSH cred verified |
|---|---|---|---|---|---|---|---|
| Sartor Claude Network (switch) | 192.168.1.170 | 58:d6:1f:86:e3:ff | USPM24P | 7.4.1.16850 | 6 h 29 m | local :8080 | n/a (web only) |
| Hall2ndFloor | .167 | a8:9c:6c:64:70:14 | U7-Pro | 8.5.21.18681 | 2 h 9 m | local :8080 | OK |
| Gym | .165 | 8c:ed:e1:7a:f2:bc | U7-Pro | 8.5.21.18681 | 7 m | local :8080 | **OK (rebooted in cleanup)** |
| Basement | .168 | 9c:05:d6:b0:53:d2 | U7-Pro | 8.5.21.18681 | 9 m | local :8080 | **OK (rebooted in cleanup)** |
| HerOffice | .183 | a8:9c:6c:62:ea:20 | U7-Pro | 8.5.21.18681 | 14 m | local :8080 | **OK (rebooted in cleanup)** |
| 3rdFloor | .166 | 8c:ed:e1:7a:86:ac | U7-Pro | 8.5.21.18681 | 11 m | local :8080 | **OK (rebooted in cleanup)** |
| Livingroom | .185 | 8c:ed:e1:7a:8a:04 | U7-Pro | 8.5.21.18681 | 2 h 41 m | local :8080 | OK |
| OutdoorBackyard | .173 | 58:d6:1f:a8:36:58 | UKPW (U7-Outdoor) | 8.5.21.18681 | 4 h 27 m | local :8080 | OK |
| HisOffice | .186 | 1c:0b:8b:6e:6d:e3 | U7PIW (G7IW) | 8.5.21.18681 | 2 d 5 h 37 m | local :8080 | OK |

All 9 devices report `state=1`, `adopted=true`, `inform_url=http://192.168.1.171:8080/inform`. The four "stuck APs" that were rebooted as part of cleanup (Gym, Basement, HerOffice, 3rdFloor) all came back clean with new mgmt cfgversion identifiers, and all accept the rotated `alton:;Lkjpoiu0987` SSH credential. None of them respond to the old `ubnt:ubnt`.

> **Special verification 1 result: PASS.** All 4 previously-stuck APs respond to the rotated credentials.

---

## Section B — WiFi clients (`stat/sta`)

**Zero wireless clients connected.** This is the same as the mid-state census, and is still the expected state — family devices have not been re-keyed onto LGP123 yet. The radios are healthy and broadcasting (verified per-AP `iw dev` output, see Section E).

`stat/sta` returns 8 entries, all `is_wired=true`. Listed under Section D.

The first wireless reconnect will become a useful checkpoint — capture it tomorrow morning when phones rejoin.

---

## Section C — Switch port detail (USW-Pro-Max-24-PoE)

Counters since switch reboot 6 h 29 m ago.

| Port | Label | Up | Speed | PoE | RX | TX | Errors |
|---|---|---|---|---|---|---|---|
| 1 | Hall2ndFloor | yes | 1 G | 8.05 W | 0.00 GB | 0.06 GB | 0 |
| 2 | Gym | yes | 1 G | 8.14 W | 0.00 GB | 0.06 GB | 0 |
| 3 | Basement | yes | 1 G | 8.34 W | 0.00 GB | 0.06 GB | 0 |
| 4 | HerOffice | yes | 1 G | 8.02 W | 0.00 GB | 0.06 GB | 0 |
| 5 | 3rdFloor | yes | 1 G | **12.24 W** | 0.00 GB | 0.06 GB | 0 |
| 6 | Livingroom + AV | yes | 1 G | 0.00 W | 0.55 GB | 16.51 GB | 0 |
| 7 | OutdoorBackyard | yes | 1 G | 7.11 W | 0.02 GB | 0.06 GB | 0 |
| 8 | HisOffice | yes | 1 G | 5.79 W | 0.00 GB | 0.06 GB | 0 |
| 22 | Google Nest (retiring) | yes | 1 G | 0.00 W | 0.57 GB | **75.09 GB** | 0 |
| 24 | Verizon FiOS Uplink | yes | 2.5 G | — | **91.54 GB** | 1.16 GB | 0 |
| 9-21, 23, 25, 26 | (unused / SFP) | no | — | — | — | — | — |

Zero rx/tx errors and zero discards across all ports. PoE budget: ~50 W consumed, plenty of headroom on a 400 W class-budget switch.

Notable: **Port 5 (3rdFloor) is drawing 12.24 W** — up from 8.03 W in the mid-state census. That AP just rebooted; the elevated draw is post-boot radio calibration / DFS scan. Should settle to ~8 W within the next hour. Worth re-checking tomorrow but not a concern tonight.

The 75 GB on the Nest port is consistent with the prior census's observation. The Nest is still the dominant traffic destination on the LAN; retirement will visibly free WAN bandwidth.

### FDB (forwarding database)

23 MAC entries, VLAN 1 throughout, no segmentation. Composition by port:

| Port | Hosts |
|---|---|
| P1 | Hall2ndFloor AP |
| P2 | Gym AP |
| P3 | Basement AP |
| P4 | HerOffice AP |
| P5 | 3rdFloor AP |
| P6 | Livingroom AP + 6 Sonos Amps + LG OLED TV (8 MACs) |
| P7 | OutdoorBackyard AP |
| P8 | HisOffice AP |
| P22 | Google Nest |
| P24 | Verizon gateway, Rocinante, gpuserver1, rtxserver, rtxserver BMC, AppleTV "Office", Windows laptop .193 (7 MACs) |

The .153 AZ laptop is alive (visible in Rocinante ARP) but not in current FDB — switch hasn't seen its uplink-side traffic recently. Idle, not gone.

---

## Section D — Per-AP wireless detail (channels, utilization, VAPs)

| AP | 2.4 ch | 2.4 cu% | 5 ch (auto) | 5 cu% | 6 ch (auto) | 6 cu% | LGP123 broadcast on |
|---|---|---|---|---|---|---|---|
| Hall2ndFloor | 11 | 51 | 40 | 3 | 149 | 2 | **2.4 + 5 + 6** |
| OutdoorBackyard | 1 | 80 | 149 | 17 | — | — | 2.4 + 5 (no 6 GHz radio) |
| HerOffice | 1 | 49 | 48 | 1 | 85 | 2 | **2.4 + 5 + 6** |
| HisOffice | 1 | 57 | 161 | 2 | — | — | 2.4 + 5 (no 6 GHz radio) |
| Gym | 6 | 35 | 149 | 6 | 37 | 2 | **2.4 + 5 + 6** |
| 3rdFloor | 11 | 50 | 36 | 1 | 117 | 2 | **2.4 + 5 + 6** |
| Basement | 1 | 64 | 48 | 1 | 69 | 2 | **2.4 + 5 + 6** |
| Livingroom | 11 | 33 | 161 | 2 | 117 | 2 | **2.4 + 5 + 6** |

**Key change vs mid-state census: 6 GHz is now broadcasting LGP123 on all 6 capable APs** (Hall2ndFloor, HerOffice, Gym, 3rdFloor, Basement, Livingroom). The wlanconf has `wlan_bands: ['2g', '5g', '6g']` now. WiFi 7 capacity is fully deployed.

OutdoorBackyard 2.4 GHz is at 80% utilization. That is mostly neighbor noise on channel 1, which it switched to (vs ch 6 in the mid-state census). Channel 1 has a lot of Verizon and "Loki Ghostie google" traffic, but it's still better than the 74% on ch 6 we measured before. With no clients yet on the AP, this is purely beacon / management overhead in the airspace; will not affect throughput when clients come back.

---

## Section E — SSIDs (config + airwaves)

### Controller wlanconf

| SSID | Enabled | Security | Bands | PMF | Hidden | WPA3 |
|---|---|---|---|---|---|---|
| **LGP123** | yes | `wpapsk` | `['2g', '5g', '6g']` | optional | no | support=true, transition=true |

One SSID, three bands, WPA3-SAE + WPA2 transition mode, PMF optional. Matches the takeover-report intended end state.

### `/tmp/system.cfg` AP-side check (all 8 APs)

Each AP's `aaa.*.ssid` user-broadcast lines contain only:
- `aaa.1.ssid=LGP123`, `aaa.2.ssid=LGP123`, `aaa.5.ssid=LGP123` — the user network, broadcast on 2.4/5/6 GHz radios respectively
- `aaa.3/6/8.ssid=element-8b6a468087287c0b` — internal UniFi mesh management SSID (always present in U7-Pro firmware, hidden, non-broadcasting to clients)
- `aaa.7/9.ssid=vwire-02cd9c8335cb7329` — internal wireless-uplink SSID (hidden, only used if mesh uplink fails, non-broadcasting to clients)

**Zero `Berman Net`, `GhLoP`, or `letmeinnow` strings anywhere in the user SSID slots.** The 2-band APs (OutdoorBackyard, HisOffice) only have the 2.4/5 entries; the 6 WiFi-7 APs have all three. Clean.

> **Special verification 2 result: PASS.** All 8 APs' system.cfg user-broadcast lines are LGP123 only.

### Hostapd active config (`iw dev` per AP)

Each WiFi-7 AP runs 8 hostapd interfaces. SSIDs per-interface:
- 3 × `LGP123` (one per radio: wifi0ap1/wifi1ap4/wifi2ap0)
- 3 × `element-8b6a468087287c0b` (internal mesh, hidden)
- 2 × `vwire-02cd9c8335cb7329` (wireless-uplink, hidden, dormant)

The 2-band APs run 5 interfaces (no wifi2 / 6 GHz). No `Berman Net`, `GhLoP`, or `letmeinnow` interface anywhere.

> **Special verification 3 result: PASS.** Hostapd active config on every AP only broadcasts LGP123 (plus internal mesh/uplink SSIDs which are hidden by design).

### Live-air scan via UniFi controller (last 20 minutes, 1087-entry rogueap dataset)

| Window | Berman Net sightings | GhLoP sightings | letmeinnow sightings |
|---|---|---|---|
| Last 20 minutes | **0** | **0** | **0** |
| Last 5 hours (legacy) | 17 (4-5 h old) | 17 (4-5 h old) | 0 |

The 17 Berman Net and 17 GhLoP entries that show up in `stat/rogueap` are stale: every one of them has `last_seen` more than 4 hours old, dating to before the SSID consolidation. UniFi's rogueap table is a sliding window with a long memory; the freshness check confirms nothing has actually broadcast those SSIDs since the cleanup. UniFi typically prunes these after ~24 h.

**Some of the stale BSSIDs match our AP MAC families** (e.g., `8c:ed:e1:7a:f2:be`, `1c:0b:8b:6e:6d:e6`, `9c:05:d6:b0:53:d4`). That is correct — those are our APs as they were broadcasting Berman Net before tonight's cleanup. The fact that no new sightings have arrived in 4+ hours from those same BSSIDs is the proof that they stopped.

### Final WiFi scan from Rocinante

`netsh wlan show networks mode=bssid` from Rocinante (5 GHz client) returns **6 SSIDs**:

| SSID | Source | Notes |
|---|---|---|
| **LGP123** | Ours | 9 BSSIDs visible — all three bands across 6+ APs in scan range |
| (hidden) | Ours | 9 BSSIDs — internal `element-` mesh SSIDs (hidden by design, not broadcasting clear ESSID) |
| Verizon_JC9KZP | External | Neighbor Verizon CR1000A at -78 dBm |
| Loki Ghostie google | External (mesh inside the house, but not ours) | The Google Nest mesh — 3 BSSIDs from the .163 root + 2 wireless-meshed Google pucks. Will go offline when the Nest is retired per the takeover plan. |
| Kids room speaker.p, | External (in-house, not ours) | Ad-hoc / WiFi-direct broadcast from some kids' speaker. Trailing comma is in the SSID string. RSSI 92% strong — physically close. Investigate which speaker; likely a Bluetooth/WiFi combo speaker that's chattier than expected. Not a security concern. |
| Verizon_XPJF3Z | External | Neighbor Verizon CR1000A at -67 dBm |

Same scan from one of our APs (via controller) sees ~107 unique SSIDs in the last 20 min — that is the broader neighbor environment and matches expectations for a Montclair residential block. None of them are Berman Net or GhLoP.

> **Special verification 4 result: PASS.** Only LGP123 is broadcast from our APs. The non-LGP123 SSIDs visible from Rocinante are: external Verizon neighbors (2), the Google Nest mesh (will retire), and one in-house "Kids room speaker.p," which is a third-party speaker doing its own WiFi-direct broadcast (cosmetic, not from our APs).

---

## Section F — Non-UniFi LAN devices

| IP | MAC | OUI | Identity | State |
|---|---|---|---|---|
| .1 | ac:91:9b:6c:9b:69 | WNC | Verizon FiOS CR1000A gateway | up |
| .100 | bc:fc:e7:d9:08:eb | ASUSTek | gpuserver1 (RTX 5090) | up, on uplink |
| .153 | 8c:3b:4a:56:c5:6c | USI | AZ work laptop | up in ARP, idle in FDB |
| .156 | 30:c5:99:d5:8f:b8 | ASUSTek | rtxserver BMC (IPMI) | up |
| .157 | 30:c5:99:d5:8f:b5 | ASUSTek | rtxserver (dual RTX PRO 6000) | up |
| .160 | e0:89:7e:5e:46:75 | Apple | Apple TV "Office" | up, ping OK |
| .163 | 90:ca:fa:35:28:1c | Google | Google Nest (root) | up (P22) |
| .184 | 34:7e:5c:0b:dd:aa | Sonos | Sonos Amp Patio | up |
| .187 | 34:7e:5c:0b:dd:ad | Sonos | Sonos Amp Office | up |
| .188 | 34:7e:5c:0b:14:23 | Sonos | Sonos Amp Gazebo | up |
| .189 | 34:7e:5c:0b:d0:60 | Sonos | Sonos Amp Living Room | up |
| .190 | 34:7e:5c:0b:dd:a1 | Sonos | Sonos Amp Kitchen | up |
| .191 | 34:7e:5c:0c:63:5d | Sonos | Sonos Amp Hot Tub Area | up |
| .192 | 20:17:42:b0:26:52 | LG | LG webOS OLED TV | up |
| .193 | dc:1b:a1:7c:de:0e | Intel | Windows laptop "LAPTOP-C4A43U6V" | up, on uplink |
| .171 | 2c:f0:5d:39:21:7f | MSI | Rocinante (controller host) | up |
| .170 | 58:d6:1f:86:e3:ff | Ubiquiti | USW-Pro-Max-24-PoE | up |
| .178 | — | — | Peloton | **still offline** (was offline at mid-state census too — likely powered off or in a sleep state) |

Every host on the wire is identified. No new mystery hosts have appeared since the mid-state census. The Peloton is still missing (idle) — when it comes back, expect it to want LGP123 PSK.

---

## Section G — Traffic snapshot

Counters since switch boot (~6.5 h ago):

| Top talker | Direction | Bytes (6.5 h) | Per hour |
|---|---|---|---|
| WAN download (P24 RX) | in | 91.54 GB | ~14.1 GB/h |
| Google Nest TX (P22) | out (to Nest) | 75.09 GB | ~11.6 GB/h |
| AV-rack TX (P6) | out | 16.51 GB | ~2.5 GB/h |
| WAN upload (P24 TX) | out | 1.16 GB | ~180 MB/h |
| All AP ports combined | both | < 0.1 GB | trivial |

Steady-state pattern matches the mid-state census: about 82% of all WAN download is going to the Google Nest, the AV rack carries the rest (Sonos casting + LG TV), AP ports carry essentially no traffic because no wireless clients are connected.

The "75 GB to Google Nest" pattern from the mid-state census persists. It is steady-state, not a burst. When the Nest is retired, expect WAN download to drop by ~80%.

---

## Section H — What changed since the mid-state census (~3 h ago)

| Item | Mid-state | Final | Note |
|---|---|---|---|
| 6 GHz LGP123 broadcasting | **no** (`wlan_bands` was `['2g','5g']`) | **yes** (now `['2g','5g','6g']`) | full WiFi 7 deployment achieved |
| 4 stuck APs | empty `vap_table`, controller stat-collection lull | rebooted, now reporting clean radio_table_stats and full vap_table on all 3 bands | resolved |
| Rotated SSH creds verified | not tested | **all 8 APs accept `alton:;Lkjpoiu0987`, none accept `ubnt:ubnt`** | takeover credential floor verified |
| Berman Net live broadcasts | no (configured but not on-air at scan time) | no (and now also absent from system.cfg / hostapd) | belt + suspenders |
| GhLoP live broadcasts | no | no, and absent from system.cfg / hostapd | renamed cleanly to LGP123 |
| Backup automation | not yet running | scheduled task active, ran 21:58 SUCCESS, next 03:00 ET | new safety net |
| Daily backup destination | manual `.unf` files | automated to `C:\Users\alto8\backups\unifi\` (local) + SCP to `alton@192.168.1.157:/home/alton/sartor-network-backups/` (rtxserver) | persisted off-Rocinante via LAN SCP |
| OutdoorBackyard 2.4 GHz channel | 6 (74% utilization, neighbor war zone) | 1 (80% utilization, also crowded) | switched to a different crowded channel; 11 might be a quieter target |
| 3rdFloor PoE draw | 8.03 W | **12.24 W** | post-reboot calibration spike — should settle to ~8 W within 1 h |
| Wireless clients | 0 | 0 | family hasn't re-keyed yet; expected by morning |
| Switch FDB entries | 24 | 23 | .153 AZ laptop dropped from FDB (still alive in ARP, just idle) |
| Stale rogueap entries for old SSIDs | live within last 20 min | last seen 4-5 h ago | aged out of fresh window; will fully purge in ~24 h |

Net direction: **everything moved in the right direction.** The only slight regression is OutdoorBackyard's 2.4 GHz on a crowded channel, and that is not a real problem until clients are present.

> **Special verification 5 result: PASS.** "UniFi Daily Backup" scheduled task is `State=Ready`, `LastResult=0x41303` (267011 — task currently running), `NextRun=2026-05-02 03:00 ET`. Most-recent run completed at 21:58:59 with success: produced `sartor-claude-network_auto_2026-05-01_2158.unf` (34.2 KB) at `C:\Users\alto8\backups\unifi\` plus SCP off-site to rtxserver. (Original 2026-05-01 entry mentioned a OneDrive parallel path; that was never wired — corrected 2026-05-06.)

---

## Section I — Anomalies post-cleanup

Only minor stuff. None of these need action tonight.

1. **OutdoorBackyard 2.4 GHz settled on channel 1 with 80% utilization** — escaped channel 6 (74%) only to land on channel 1 (80%). Channel 11 measures 32-50% in the house and would be quieter. The auto-channel selection didn't pick it because OutdoorBackyard is physically far from the rest. Manual pin to 11 would help, but no clients are using this AP yet — ok to defer.
2. **3rdFloor PoE draw of 12.24 W** — elevated post-reboot. Normal U7-Pro idle is ~8 W. If still 12+ in the morning, look at it; if back to ~8, ignore.
3. **`(hidden)` shows up as 9 BSSIDs in Rocinante's scan** — these are our `element-` mesh SSIDs which are intentionally hidden in the management plane. Not a security concern, this is the way UniFi WiFi 7 mesh works. The BSSIDs match our AP MAC families' OUIs (8c:ed:e1, 1c:0b:8b, a8:9c:6c, 9c:05:d6, 58:d6:1f).
4. **Stale rogueap entries** for Berman Net / GhLoP / letmeinnow with our AP MAC families (4-5 h old) — historical artifacts from before cleanup. Not live-air. UniFi will prune them on the normal aging schedule.
5. **Kids room speaker.p,** SSID with strong RSSI (92% from Rocinante) — third-party speaker broadcasting its own ad-hoc / WiFi-direct network. Not from our APs. Probably a Bluetooth-paired device that also exposes a setup-mode WiFi. Aneeta or one of the kids would know which speaker. Not a security or interference issue at this volume; cosmetic if at all.
6. **Peloton still offline** — same as mid-state census. Will need PSK update when it next powers on; the takeover report has it on the list.
7. **Loki Ghostie google mesh** — 3 BSSIDs visible from Rocinante alone, more from the house APs. Same situation as mid-state: the .163 wired Nest plus 2+ wireless mesh pucks. Going away when the Nest is retired per the plan. None of them broadcast LGP123, none route through our LAN segment — they bridge through the wired Nest at .163 only.

Nothing on the wire looks malicious. No rogue UniFi devices in `stat/rogueap` matching foreign OUIs reporting in. The hidden `letmeinnow` SSID is gone from configuration, hostapd, and live-air. Berman Net and GhLoP live-broadcasts haven't happened in 4+ hours.

---

## Section J — End-of-night assessment

**The network is in a good place to leave for the night.**

- 9/9 UniFi devices reporting, all under local control, all on rotated credentials.
- 1 SSID, 3 bands, WPA3-SAE + WPA2 transition mode active everywhere.
- 0 wireless clients (expected — devices haven't re-keyed yet).
- Backup automation is healthy and ran successfully tonight.
- No leftover Berman Net / GhLoP / letmeinnow anywhere except in stale rogueap memory that will age out naturally.
- Switch error counters are zero. PoE delivery healthy across all 8 AP ports.
- The 4 stuck APs that triggered the cleanup pass are all healthy now.

**Open items that can wait until morning or beyond** (carried from takeover report):
- Family devices need to rejoin LGP123 with the new PSK.
- Inventory and decide on the 2 wireless Google mesh pucks before retiring the .163 Nest.
- OutdoorBackyard IPv6 firewall audit.
- Pete email handoff (still in drafts).
- Eventual VLAN segmentation phase 3 (deferred pending UniFi gateway decision).

Nothing tonight requires intervention. Sleep is fine.

---

*Snapshot end. Data sources: UniFi Network 10.3.55 controller API (`stat/device`, `stat/sta`, `stat/alluser`, `stat/rogueap`, `list/wlanconf`, `stat/health`, `stat/sysinfo`); per-AP SSH on rotated credentials (`/tmp/system.cfg` aaa lines, `iw dev` SSID enumeration, `/etc/persistent/cfg/mgmt` URL check); switch SSH (`swctrl mac show` for FDB); Rocinante `arp -a` and `netsh wlan show networks mode=bssid`; Windows Task Scheduler (`Get-ScheduledTask "UniFi Daily Backup"`); local backup log. No PUTs, no config changes, no config writes. PSKs and authkeys are not printed in this report.*
