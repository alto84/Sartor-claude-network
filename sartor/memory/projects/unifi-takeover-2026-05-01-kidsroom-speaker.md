---
name: unifi-takeover-2026-05-01-kidsroom-speaker
description: Investigation of "Kids room speaker.p," SSID broadcasting from inside the house. Identification + location + disposition recommendation.
type: investigation
status: complete
date: 2026-05-01
related:
  - projects/unifi-takeover-2026-05-01-network-census
---

# "Kids room speaker.p," SSID Investigation

## Identification

- **SSID:** `Kids room speaker.p,` (trailing comma is real)
- **BSSID:** `fa:8f:ca:96:9d:ab` on channel 1, 2.4 GHz, 20 MHz, security `Open`
- **OUI:** First byte `fa` has the locally-administered bit set, so the BSSID is a **randomized SoftAP MAC**, not a real vendor OUI. Manufacturer is hidden by the device while in setup mode.
- **Vendor signature:** No OUI lookup match. The `<friendly-name>.p,` SSID pattern is consistent with a **commodity ESP32/ESP8266-class WiFi speaker** in SmartConfig pairing mode (Tribit / Anker Soundcore / JBL clones / no-brand kids speakers all emit this template). It is **not** Sonos (Sonos uses `34:7e:5c` and named-room SSIDs), **not** Google Cast, **not** Echo, **not** HomeKit. Confirmed by mDNS scan: zero matching `_sonos`, `_googlecast`, `_amzn-*`, or `_hap` services.

## Network presence

- **Not connected to the LAN.** `stat/sta` (8 active clients) has no match.
- **Never seen on the LAN.** `stat/alluser` (16 lifetime clients) has no historical record. The device has never paired.
- **mDNS sweep** found 6 named Sonos rooms (Office, Gazebo, Hot Tub Area, Kitchen, Patio, Living Room), the LG OLED, and one Apple AirPlay endpoint. No kids-room speaker advertises any service. The device is broadcasting an AP only, with no LAN-side identity.

## Location estimate

Best-observed signal across our 8 APs for BSSID `fa:8f:ca:96:9d:ab`:

| AP | Best dBm |
|---|---|
| Hall2ndFloor | -42 |
| HisOffice | -43 |
| 3rdFloor | -57 |
| HerOffice | -65 |
| Gym | -65 |
| Livingroom | -69 |
| Basement | -80 |
| OutdoorBackyard | -85 |

Hall2ndFloor and HisOffice tie at the top; 3rdFloor is second tier. Trilateration places the device on the **2nd floor central corridor**, almost certainly inside a **kids' bedroom adjacent to the upstairs hall**. Consistent with the SSID name.

## Disposition

This is **normal, benign behavior** for an unpaired or factory-reset smart speaker. The open SoftAP is the device's pairing portal: a phone connects in, delivers WiFi credentials, and the AP shuts off. No traffic crosses our LAN. No security risk.

The open question is whether the speaker is abandoned (sitting unpaired forever) or actively in use.

## Recommendation

**Leave alone, but verify.** Ask Aneeta or the kids whether anyone tried to set up a new bedroom speaker recently. Three outcomes:

1. *Active setup:* help complete pairing; SSID disappears.
2. *Abandoned:* power off the speaker or pull its battery.
3. *Unidentified:* harmless on the network, but worth physically locating. The 2nd-floor-hall estimate narrows it to 2-3 rooms.

**Do not connect to it.** Connecting would trigger the pairing flow and could associate it with our credentials. No UniFi-side action required; this is not a network-security issue.
