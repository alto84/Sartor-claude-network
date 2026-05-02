---
name: unifi-takeover-2026-05-01-unknown-laptop
description: Identification of LAPTOP-C4A43U6V at 192.168.1.193 — unknown Windows laptop on the family network.
type: investigation
status: complete
date: 2026-05-01
related:
  - projects/unifi-takeover-2026-05-01-network-census
---

# Unknown Laptop Investigation: LAPTOP-C4A43U6V (192.168.1.193)

## Identification

| Field | Value |
|---|---|
| Hostname | `LAPTOP-C4A43U6V` (Windows default, never renamed) |
| IPv4 | 192.168.1.193 (DHCP from FiOS gateway) |
| MAC | `dc:1b:a1:7c:de:0e` |
| OUI | Intel Corporate (Kulim, Malaysia plant) |
| Likely NIC | Integrated Intel AX-series Wi-Fi (business-laptop class) |
| Likely manufacturer | Dell, HP, or Lenovo (Intel-platform business laptop; not Apple, not USI/Lenovo-ThinkPad) |
| FQDN | `LAPTOP-C4A43U6V.mynetworksettings.com` (FiOS local domain) |
| State at probe time | Offline. SMB/445 closed, no ARP entry, no NetBIOS reply, but reverse PTR `192.168.1.193 → LAPTOP-C4A43U6V` still cached. |

## Location and signal

Indeterminate from passive observation. The UniFi controller was adopted yesterday (2026-04-30, all `first_seen` values = 1777665643) and has no historical association data — `stat/alluser` returns only 16 records (8 currently-online clients + 8 UniFi APs themselves), and no AP currently shows num_sta>0 except via the switch downstream. The laptop is not in the controller's user table at all because, like the AZ laptop at .153 and the GPU servers, it rides the FiOS gateway's L2 segment and the controller hasn't classified it as a user. AP placement therefore unknown until the laptop reconnects post-controller-takeover.

## DHCP / DNS / mDNS evidence

- **Reverse DNS** (PTR): `193.1.168.192.in-addr.arpa → LAPTOP-C4A43U6V` — present on the FiOS gateway's resolver, indicating an active DHCP lease registered the hostname recently.
- **Forward DNS**: `LAPTOP-C4A43U6V.mynetworksettings.com → 192.168.1.193` — FiOS-gateway-issued local FQDN; the `mynetworksettings.com` suffix is the Verizon/Frontier router default.
- **mDNS**: nothing on `.local`. The host is not currently advertising Bonjour/zeroconf services.
- **NetBIOS**: `nbtstat -A` returns "Host not found" — host is offline.
- **SMB/445 banner**: `TcpTestSucceeded=False` — port closed (host offline). Consistent with the network-census FDB snapshot, where this MAC had only 59 minutes of switch-FDB uptime.

## Cross-reference vs. household roster

| Family device | Status |
|---|---|
| AZ work laptop (.153) | USI OUI `8c:3b:4a:...`. Different MAC vendor — **not the same physical machine** as .193. |
| gpuserver1 (.100) | Different MAC. |
| rtxpro6000server (.157) | Different MAC. |
| Vayu / Vishala (MKA) | MKA issues iPads, not Windows laptops, in lower school. Unlikely. |
| Vasu (Goddard, age 4) | No school device. |
| Aneeta (Neurvati Medical Director) | **Strong fit.** Park-Ave biotech firm; standard issue is a Dell/HP/Lenovo business laptop with Intel Wi-Fi. The Windows-default hostname is consistent with a corporate IT image where machines are not renamed at provisioning (asset tags handled in inventory, not in `hostname`). |
| Amarkanth (Aneeta's father, regular childcare) | Possible but lower probability — visits are irregular and the lease has been live recently enough to keep PTR resolving. |

## Verdict

**Known-with-high-confidence — Aneeta's Neurvati work laptop.** Rationale:
1. Intel-NIC business-laptop signature with default Windows hostname matches enterprise-issued hardware exactly. AZ uses USI/Lenovo (.153). Two different corporate fleets, two different OUIs.
2. Aneeta is the only adult household member who needs a second work laptop and works from home days/week.
3. Aneeta is currently at RRE through May 3 — laptop being offline right now is consistent with her travel.
4. Hostname pattern `LAPTOP-XXXXXX` with no rename is the dominant pattern in mid-size pharma/biotech IT.

## Recommended action

1. **Confirm with Aneeta on her return** (May 3+): "Is `LAPTOP-C4A43U6V` your Neurvati laptop?" — single-message confirmation, no escalation needed.
2. **After confirmation**, set a UniFi client alias `Aneeta-Neurvati-Laptop` (label only — leave hostname alone since corporate IT may push policy on rename) and a static-DHCP reservation if Aneeta wants stable RDP/VPN access.
3. **Do not investigate further** unless Aneeta does not recognize it, in which case re-open with: capture next-online timestamp from UniFi, identify AP/signal pattern (will reveal which room — if it lights up `HerOffice` AP that confirms her), and run a richer fingerprint pass.
4. **No remediation needed now.** Passive observation is sufficient; the device is not exhibiting suspicious behavior.

## Confidence and caveats

Confidence: ~85%. Could still be Amarkanth's personal laptop (lower probability — he is a guest, not a daily user; would expect lease to expire between visits), or a less-common device like Aneeta's old Biogen laptop she still occasionally powers on for archive access. Both fall under "ask Aneeta" rather than "investigate further."

Cannot rule out a non-family device (e.g., a contractor laptop from the Berman Home Systems install that completed Apr 27-29 — three days a vendor was on-site with Wi-Fi credentials) until Aneeta confirms. The MAC age in switch FDB at census time was 59 minutes, which is closer to "this device was on a few hours ago" than "this device was here three days ago," favoring the household-resident hypothesis over the contractor hypothesis.
