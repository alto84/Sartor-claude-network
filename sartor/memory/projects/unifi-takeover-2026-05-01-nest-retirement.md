---
name: unifi-takeover-2026-05-01-nest-retirement
description: Investigation and retirement plan for the Google Nest WiFi mesh now that the household has migrated to UniFi LGP123. Includes physical-location mapping and the 75GB anomaly.
type: plan
status: investigation-complete-pending-physical-retirement
date: 2026-05-01
related:
  - projects/unifi-takeover-2026-05-01-report
  - projects/unifi-takeover-2026-05-01-network-census
---

# Google Nest Mesh Retirement Plan

## Summary

The Google Nest mesh is **three physical devices**, not four. The census's phrasing of "4 Google Nest devices" double-counted the wired root: the root device on switch port 22 (.163, MAC `90:ca:fa:35:28:1c`) is one of the three nodes — its three radios broadcast `Loki Ghostie google` from MAC family `90:ca:fa:35:28:1*`, and the other two physical devices are the wireless mesh peers in the `24:e5:0f:42:3e:*` and `24:e5:0f:42:8f:*` families.

The 75 GB anomaly is **ongoing, not historical**. Live polling shows the switch sending ~10 Mbps sustained toward the Nest right now, with a session average of ~25 Mbps over 6.4 hours. That is a streaming-grade flow into a device that has no display attached. The most likely explanations are (a) Photos/Drive backup from a paired Home Hub device routing through the mesh, (b) a Cast session backbone for a paired display, or (c) a runaway device. Pulling the Nest stops it instantly and frees the bandwidth for the UniFi network.

The retirement is safe to execute physically. Unplug the wired root (.163) at switch port 22 first — the two wireless peers cannot mesh without it and will go dark within seconds. Optional cleanup in the Google Home app afterward to remove the dead devices from Alton's Google account.

---

## Section 1 — Physical device map

### Three physical Nest devices identified

The rogueap database holds 49 sightings of `Loki Ghostie google` across 8 distinct BSSIDs, observed by every UniFi AP in the house. Grouping BSSIDs by MAC-prefix family yields three physical devices, each broadcasting on multiple radios (one BSSID per radio chain):

| Device | MAC family | BSSIDs | Bands broadcast | Wired? |
|---|---|---|---|---|
| **Nest A** (root) | `90:ca:fa:35:28:1*` | `…:10` (2.4G), `…:14` (5G), `…:1c` (mgmt/wired) | 2.4 GHz ch 6, 5 GHz ch 149 (likely), mgmt | **Yes — switch port 22, IP .163** |
| **Nest B** | `24:e5:0f:42:8f:c*` | `…:c5` (2.4G), `…:c9` (5G), `…:cd` (6 GHz) | 2.4 GHz ch 1, 5 GHz, 6 GHz ch 197 | No — wireless mesh |
| **Nest C** | `24:e5:0f:42:3e:b/c*` | `…:bc` (2.4G), `…:c0` (5G), `…:c4` (6 GHz) | 2.4 GHz ch 11, 5 GHz, 6 GHz ch 197 | No — wireless mesh |

The 6 GHz radios on B and C confirm these are **Nest WiFi Pro** (the 2022 Wi-Fi 6E generation) or newer. Nest A's 6 GHz BSSID was not detected — either A is an older Nest WiFi (no 6 GHz radio) or its 6 GHz radio is parked. The MAC OUI `90:ca:fa` is "Google Inc." and matches the Nest WiFi Pro / Google Wifi product family; `24:e5:0f` is also Google.

The census's count of "4 Google Nest devices" appears to have been derived from "the .163 wired Nest plus 3 BSSID families seen broadcasting." The `90:ca:fa` BSSID family is the wired Nest itself (its own radios), so the correct count is 3 physical devices. Worth re-checking by walking through the Google Home app's device list, but the RF evidence is consistent with 3.

### Physical-location mapping (signal-strength triangulation)

For each Nest's strongest BSSID (the 2.4 GHz one — better penetration through walls than 5 / 6 GHz), I ranked which UniFi AP heard it loudest. Closer AP = closer Nest. The U7-Pro APs are ceiling-mounted at known house locations (per the takeover report's room labels), so this gives a reasonable triangulation:

**Nest A** (`90:ca:fa:35:28:10` on 2.4 GHz ch 6) — heard loudest by:
- 3rdFloor (.166) at -47 dBm
- Basement (.168) at -49 dBm
- Livingroom (.185) at -55 dBm

Two strong reads from APs on different floors (3rd floor and basement) with comparable dBm suggests Nest A is on a vertical riser path — likely the **2nd-floor central hallway or an upstairs office near the staircase**, where signal radiates up to 3rdFloor and down to Basement with similar attenuation. It is the wired one (port 22) so it must be near a structured-cabling drop. Cross-reference: the takeover narrative says BHS ran the structured cabling; check wherever a CAT6 patch terminates near a power outlet on or near the 2nd floor.

**Nest B** (`24:e5:0f:42:8f:c5` on 2.4 GHz ch 1) — heard loudest by:
- 3rdFloor (.166) at -42 dBm
- Hall2ndFloor (.167) at -46 dBm
- Gym (.165) at -46 dBm
- HisOffice (.186) at -55 dBm

Three near-equal reads from 3rdFloor, Hall2ndFloor, and Gym (all -42 to -46 dBm) put Nest B physically **between those three APs** — likely on the **2nd-floor landing or a 2nd-floor bedroom near the gym wing**. -42 dBm at 3rdFloor and -46 at Hall2ndFloor specifically reads as something centrally placed on the 2nd floor with line-of-sight up the staircase to the 3rd-floor AP.

**Nest C** (`24:e5:0f:42:3e:bc` on 2.4 GHz ch 11) — heard loudest by:
- Gym (.165) at -30 dBm (very strong — within ~5-8 m)
- HerOffice (.183) at -48 dBm
- Livingroom (.185) at -51 dBm
- Hall2ndFloor (.167) at -53 dBm

-30 dBm at the Gym AP is a tell: Nest C is **inside or directly adjacent to the gym room**, probably on the same wall or an adjacent shelf as the Gym U7-Pro. HerOffice and Livingroom hear it next-loudest, consistent with the gym being adjacent to those rooms.

### mDNS confirms wired-side isolation

A 15-second mDNS scan from Rocinante found 20 service records — Sonos AirPlay/Spotify on every Sonos amp, the Apple TV's Office AirPlay endpoint — and **zero Google Cast / Google Home / Nest service advertisements**. The Nest's setup HTTP port (8008) was unreachable from Rocinante; ICMP to .163 timed out. Either the Nest blocks management traffic from off-mesh L3 sources by default, or the Cast service binds only to its own private mesh subnet and doesn't bridge to the wired LAN. This matches Google's documented behavior: Nest WiFi presents an L2 island for the mesh and only forwards client traffic, not management plane.

The practical implication for retirement: **do not expect to remove or factory-reset Nest devices from a workstation or browser inside the house.** It must be done from the Google Home app on Alton's phone (or Aneeta's), which authenticates through the Google account.

---

## Section 2 — The 75 GB anomaly: live, ongoing, ~25 Mbps sustained

### Snapshot at 22:25 ET

From `stat/sta` the wired Nest's session counters at the moment of investigation:

```
mac=90:ca:fa:35:28:1c  ip=192.168.1.163  port=22  uptime=22961s (6.38h)
wired-tx_bytes  = 70,984,236,586  (70.98 GB switch -> Nest)
wired-rx_bytes  =    483,044,791  (483 MB Nest -> switch)
wired-tx_pkts   = 47,227,522
wired-rx_pkts   =  6,226,968
session start   = 2026-05-01 16:00:43 ET (about 90 min before the census snapshot)
```

Switch port 22 cumulative since switch boot: **TX 75.13 GB, RX 568 MB**. Asymmetry is roughly 130:1 in favor of switch-to-Nest direction.

### It is still going

I took a second snapshot 46 seconds later. Delta:

```
switch -> Nest TX: 39,281,580 bytes  = 1.31 MB/s = ~10.5 Mbps sustained
Nest -> switch RX:  1,097,550 bytes  = 0.04 MB/s =  ~0.3 Mbps
```

The Nest is currently pulling about 10 Mbps. The 6.4-hour session average is 25 Mbps — so the rate has slowed somewhat from earlier in the session, but it is **not idle**. This is not a one-time burst that already finished; this is a steady fire-hose. At 25 Mbps continuous, the Nest would consume ~270 GB/day, which would drown a typical residential FiOS connection if any other household streaming were happening at the same time.

For comparison, the household total WAN download in the same 5h-44m window was 86 GB. The Nest accounts for ~88% of all bytes coming into the house. Whatever it is doing, it is the dominant flow.

### What it likely is

DPI is unhelpful — `stat/dpi` returned an empty entry, meaning DPI is either disabled site-wide or this site has no DPI data yet (it requires a UniFi gateway, which Sartor doesn't have — the Verizon FiOS is in front of the switch). So we have byte counts and packet counts, no per-app breakdown.

Things that fit a sustained 25 Mbps inbound to a Nest with no display attached:

1. **Google Photos / Google Drive backup from a paired Home Hub display** — if there's a Nest Hub (a 7" or 10" screen device) anywhere in the house, it backs up locally-cached photos and syncs media to the user's Google library through whatever Google Home device the household configured as the "router." 25 Mbps sustained for hours could plausibly be a multi-thousand-photo backlog being uploaded — but uploads should show high TX from the device, not high RX. Net flow is 130:1 in the wrong direction for an upload, so this is unlikely to be the explanation.

2. **Cast session bridging** — a Cast Group or a paired Chromecast/Nest Hub is using the Nest as its session backbone. If a Nest Hub or Chromecast in the house was streaming YouTube or Netflix at 4K, that's 15-25 Mbps. The Nest acts as a network-level relay in some Google Home configurations rather than the Hub talking directly to the WAN.

3. **Mesh traffic for the wireless peers** — Nest B and Nest C wirelessly mesh to A. Any client connected to B or C has all its traffic backhauled to A over the wireless mesh and then out through the wired uplink. If the kids' iPads are still connected to `Loki Ghostie google` (not yet migrated to LGP123) and watching streaming video, those bytes route through Nest A. 25 Mbps is consistent with one or two streaming clients on the mesh.

4. **Chromecast/Nest Audio playing music to a Google speaker** — much less likely at 25 Mbps; audio streams are 0.3-2 Mbps.

5. **Compromised Nest** — possible but no specific indicator. The traffic pattern (steady, not spiky, no obvious C2 beaconing in packet counts) doesn't scream malware. Worth ruling out only if explanations 1-3 don't account for it after Alton checks the Google Home app device list.

**Operational recommendation: don't dig further before retiring.** The retirement removes the device, removes the flow, and if the WAN download counters drop substantially after retirement, the bytes were Google's bytes and good riddance. If they don't drop, the bytes were transit traffic from a household client that has now reattached to LGP123 and we'd see no change — also fine. Investigating the 75 GB further would require packet capture (mirror port 22 to Rocinante and run Wireshark), which is overkill for a device that is being retired today.

---

## Section 3 — Retirement procedure (for Alton, physical)

### Pre-retirement checklist

Confirm before unplugging:
- All household devices that should stay on WiFi have rejoined `LGP123` with password `$uga($pi(e`. The takeover doc has the full list. Anything still on `Loki Ghostie google` will lose connectivity at the moment of retirement.
- No Google smart speakers or Nest Hubs are in active use that the household wants to keep working. The Nest mesh dies, so any Cast / Google Assistant device connected to it stops working until those devices are reconfigured to join LGP123 (Google Home app -> Add device -> WiFi).
- If there are Nest cameras (doorbell, indoor cam) on the mesh, they go offline. Re-onboard via Google Home app.

If the answer to any of those is "I'm not sure," do the Google Home app walk-through first (Step 1 below) before unplugging.

### Step 1 — Inventory in Google Home app (5 minutes)

Open Google Home app on Alton's or Aneeta's phone. Look at the Devices list. Confirm what shows up:
- The 3 Nest WiFi/Nest WiFi Pro pucks. Note which one is labeled "primary" or "main router" — that's the wired root (Nest A on .163).
- Any Nest Hub (display) or Nest Audio (speaker).
- Any Chromecast.
- Any Nest Doorbell or Nest Cam.

Decide for each non-mesh Google device whether it stays in service. If yes, it needs to be reconfigured to join LGP123 *after* the mesh comes down, which requires factory-resetting most of them (they remember the mesh and won't accept a new SSID without a reset). For most households, the Nest pucks themselves are the only Google hardware in use; Hub/Cam/Audio are uncommon unless someone bought into the ecosystem.

### Step 2 — Optional: factory-reset Nest devices from the app first (10 minutes)

If you want a clean removal that also cleans up Alton's Google account:
- For each Nest puck in Google Home: tap the device -> Settings (gear) -> Remove device. The app will offer "Factory reset" — accept. This wipes the device and removes it from the account.
- Do this **before** unplugging anything — the factory reset needs network connectivity to phone home.
- Order: reset the wireless peers (B and C) first, then the wired root (A) last. The peers depend on A being online to communicate with the app.

If you don't care about account cleanup and just want the airwaves quiet, **skip Step 2**. You can clean the account up later from the app even if the devices are powered down (the "Remove from account" option is available regardless of device state, though without the device online it can't factory-reset).

### Step 3 — Physical unplug (2 minutes)

If you skipped Step 2: unplug Nest A first. The mesh dies in seconds; B and C lose backhaul. Then unplug B and C at your leisure.

If you did Step 2 and reset all three: each one is already a brick. Just unplug.

The wired root (Nest A) is on switch port 22. The switch will report port 22 down and the FDB entry for `90:ca:fa:35:28:1c` will age out within ~5 minutes. No action required on the switch — leave port 22 enabled in case Alton wants to plug something else in there later. The port label "Google Nest (retiring)" can be cleared or repurposed in the UniFi UI.

### What to expect during transition

- **SSID `Loki Ghostie google` disappears** within 1-3 seconds of Nest A unplugging. The wireless peers (B and C) will keep beaconing for 30-90 seconds while they realize the backhaul is gone, then they go silent or fall back to setup-mode SSIDs (`GoogleHome-XXXX` or similar) if they enter recovery mode. Over the next few minutes, all `Loki Ghostie google` BSSIDs disappear from `netsh wlan show networks`.
- **Any device still connected to `Loki Ghostie google`** loses internet. Most likely candidates: kids' iPads, Kindles, the Peloton, anything that wasn't part of the LGP123 re-PSK Aneeta and the kids did. They'll need to be onboarded onto LGP123.
- **Sonos amps are wired** and unaffected. They never used the Nest mesh.
- **Apple TV is wired** and unaffected.
- **LG TV is wired** and unaffected.
- **Nest Hub / Nest Audio (if any)** will display "Couldn't connect to Wi-Fi" and need re-onboarding.
- **WAN download usage drops materially** — within the first 10 minutes after retirement, the FiOS uplink should show a much lower inbound rate. If it doesn't, the bytes were household client traffic transiting the mesh, and those clients have either already migrated to LGP123 (no change in behavior, just a change in path) or they're now offline (good — they'll need re-onboarding).

### Residual broadcasting

The Nest pucks do **not** broadcast anything residual after physical disconnection. Without power, no radios. If you do a factory reset (Step 2), they boot into a setup mode that broadcasts a temporary `GoogleHome-XXXX` SSID waiting for the Google Home app to onboard them — that broadcast goes away when you cut power. If you do not factory-reset, on next power-up they'll try to mesh again and fail (root is gone) and fall back to setup-SSID mode within a few minutes. So: **once unplugged, they are quiet. Box them up or recycle them.**

### Google Home account cleanup (after physical retirement)

Even if you skipped Step 2, the devices still appear in the Google Home app as "offline." To clean up:
- Open Google Home app -> each Nest device -> Settings -> Remove device. Confirm without factory-reset (the app will offer "Mark as removed" or similar since it can't reach the device).
- This severs the device-account binding. If the hardware is later revived (e.g., resold or given away), it boots into factory-onboarding mode automatically.
- Same procedure for any Nest Hub / Audio / Cam / Doorbell.

This is housekeeping, not security-critical. The devices are inert without power.

---

## Section 4 — Validation criteria

After retirement, verify each of these. Order matters: items 1-3 confirm the airwaves are clean; item 4 confirms the controller has aged out the dead clients.

### 4.1 — `Loki Ghostie google` not in netsh scan from Rocinante

```powershell
netsh wlan show networks mode=Bssid | Select-String -Context 0,5 "Loki Ghostie google"
```

Expected: no output. Run within 5 minutes of retirement (the SSID disappears within seconds, but Windows caches scan results for ~30 seconds).

### 4.2 — No Google Nest MAC on switch port 22

From the controller, `stat/sta` should not list MAC `90:ca:fa:35:28:1c`. The FDB on the switch should not have that MAC behind port 22. Check via:

```bash
curl -k -s -b cookies.txt "https://192.168.1.171:8443/api/s/default/stat/sta" \
  | python -c "import json,sys; d=json.load(sys.stdin); print([s for s in d['data'] if s.get('mac')=='90:ca:fa:35:28:1c'])"
```

Expected: `[]`. Allow 5-10 minutes for FDB aging.

### 4.3 — No Google services in mDNS scan

Re-run the mDNS scan (`mdns_scan.py` from `/c/Users/alto8/tmp_nest_investigation/`). Confirm zero records of types `_googlecast._tcp.local.` / `_googlerpc._tcp.local.` / `_googlezone._tcp.local.` / `_nest._tcp.local.`. (Pre-retirement check already showed zero — Nest doesn't bridge mDNS to wire, so this is a "still zero" assertion. It rules out the case where some other Google device picked up the broadcast role.)

### 4.4 — rogueap entries age out (informational)

The rogueap table holds sightings for 14 days by default. Entries for the 8 `Loki Ghostie google` BSSIDs will not auto-clear immediately. They are passive scan results, not active client records, and the controller doesn't expose a "purge rogueap" endpoint.

```bash
curl -k -s -b cookies.txt "https://192.168.1.171:8443/api/s/default/stat/rogueap" \
  | python -c "import json,sys; d=json.load(sys.stdin); print(len([r for r in d['data'] if r.get('essid')=='Loki Ghostie google']))"
```

Day 0 (today, post-retirement): expect 49 entries — they don't disappear instantly.
Day 14: expect 0 entries (or only entries from neighbors' Google networks if any Sartor neighbor coincidentally also has "Loki Ghostie google" — extremely unlikely).

If by Day 14 any `Loki Ghostie google` entries remain with **age < 14 days**, that means a Google device is still broadcasting — investigate, the retirement was incomplete.

### 4.5 — WAN download rate drops

Pre-retirement: ~15 GB/h sustained inbound on switch port 24.
Post-retirement: expect a substantial drop unless household streaming on LGP123 immediately fills the slack. Check via switch port 24 RX-rate ~30 minutes after retirement.

```bash
curl -k -s -b cookies.txt "https://192.168.1.171:8443/api/s/default/stat/device/58:d6:1f:86:e3:ff" \
  | python -c "
import json,sys
sw = json.load(sys.stdin)['data'][0]
p24 = next(p for p in sw['port_table'] if p['port_idx']==24)
print(f'P24 RX rate: {p24.get(\"rx_bytes-r\",0)/1e6:.2f} MB/s')"
```

This is informational, not a pass/fail gate (depends on what kids are streaming at the moment of check).

---

## Appendix — Raw evidence

Per-BSSID strongest-receiver (full list at `/c/Users/alto8/tmp_nest_investigation/rogueap.json`):

| BSSID | Band | Closest UniFi AP | Signal | Inferred Nest |
|---|---|---|---|---|
| `90:ca:fa:35:28:10` | 2.4 ch 6 | 3rdFloor (.166) | -47 dBm | A (root) |
| `90:ca:fa:35:28:14` | 5 GHz | HisOffice (.186) / 3rdFloor (.166) | -57 / -58 dBm | A (root) |
| `24:e5:0f:42:8f:c5` | 2.4 ch 1 | 3rdFloor (.166) | -42 dBm | B |
| `24:e5:0f:42:8f:c9` | 5 GHz | 3rdFloor (.166) | -46 dBm | B |
| `24:e5:0f:42:8f:cd` | 6 GHz ch 197 | Gym (.165) only | -89 dBm | B (very weak — likely 6 GHz limited range) |
| `24:e5:0f:42:3e:bc` | 2.4 ch 11 | Gym (.165) | -30 dBm | C |
| `24:e5:0f:42:3e:c0` | 5 GHz | Gym (.165) | -29 dBm | C |
| `24:e5:0f:42:3e:c4` | 6 GHz ch 197 | Gym (.165) only | -60 dBm | C |

Live traffic snapshot (port 22, 30s sample): 1.31 MB/s switch -> Nest, 0.04 MB/s Nest -> switch.

Cumulative since switch boot (5h-44m at census, 6h-25m at investigation): 75.13 GB switch -> Nest, 568 MB Nest -> switch.

Session uptime for client `90:ca:fa:35:28:1c`: 22,961 seconds (6.38 h) at investigation time.

DPI: not available on this site (no UniFi gateway in the path; Verizon FiOS gateway sits upstream of the switch).

Investigation artifacts saved at `C:\Users\alto8\tmp_nest_investigation\`:
- `rogueap.json` — 1086 rogueap rows, 49 of which are `Loki Ghostie google`
- `sta.json`, `sta2.json` — `stat/sta` snapshots 30s apart for rate calculation
- `alluser.json` — `stat/alluser` (Nest is the only Google MAC)
- `dpi.json`, `sysdpi.json` — empty (DPI unavailable)
- `switch.json` — full switch device record including all 26 ports
- `mdns.json` — 20 mDNS records, zero Google
- `mdns_scan.py` — the zeroconf scan script (reusable for post-retirement validation)

---

*Investigation complete; physical retirement pending. Read-only API access used throughout. No configuration changes made to the controller, switch, or any Nest device.*
