---
name: unifi-takeover-2026-05-01-report
description: Complete report of the UniFi takeover from Berman Home Systems to local Sartor admin, executed 2026-05-01. Includes the operational reference (network state, credentials, action items) and a cyberpunk narrative of how it unfolded.
type: report
status: complete
date: 2026-05-01
related:
  - projects/unifi-takeover-2026-05-01
---

# UniFi Network Takeover — Day Report

## Executive summary

In one day Sartor took the network back from Berman Home Systems (BHS) without involving them, without a factory reset on any device, and without admin to the Verizon Fios router. Nine devices total — one switch and eight WiFi 7 access points — now report exclusively to a local controller running on Rocinante. BHS retains stale "Disconnected" entries in their dashboard; their pushes can no longer reach the gear.

## Network state

| Device | IP | Switch port | State |
|---|---|---|---|
| Sartor-Saxena-Claude Network (USW-Pro-Max-24-PoE) | 192.168.1.170 | uplink port 24 | ✅ |
| Hall2ndFloor (U7-Pro) | 192.168.1.167 | port 1 | ✅ |
| Gym (U7-Pro) | 192.168.1.165 | port 2 | ✅ |
| Basement (U7-Pro) | 192.168.1.168 | port 3 | ✅ |
| HerOffice (U7-Pro) | 192.168.1.183 | port 4 | ✅ |
| 3rdFloor (U7-Pro) | 192.168.1.166 | port 5 | ✅ |
| Livingroom (U7-Pro) | 192.168.1.185 | port 6 (downstream AV-rack) | ✅ |
| OutdoorBackyard (U7-Outdoor) | 192.168.1.173 | port 7 | ✅ |
| HisOffice (U7-PIW in-wall) | 192.168.1.186 | port 8 | ✅ |

2.4 GHz channels pinned: ch 1 (HerOffice, Basement, HisOffice), ch 6 (Gym, OutdoorBackyard), ch 11 (3rdFloor, Hall2ndFloor, Livingroom). 5 GHz and 6 GHz remain on auto.

Auto-firmware-update: enabled, daily 3 AM ET window, release channel (no early access).

## Credentials

| What | Where | Username | Password |
|---|---|---|---|
| UniFi controller (web UI + API) | https://192.168.1.171:8443 | `alton` | `;lkjpoiu0987` |
| UniFi device SSH (post-adoption) | ssh `alton`@<ap-ip> | `alton` | `;Lkjpoiu0987` ← capital L |
| MongoDB (controller backing store) | 127.0.0.1:27117/ace | n/a | n/a (no auth, loopback only) |

## WiFi networks (post-consolidation)

| SSID | Security | PSK | Status |
|---|---|---|---|
| **LGP123** | WPA3-SAE + WPA2 transition | `$uga($pi(e` | the only SSID — renamed from "GhLoP" (Loki / Ghostie / Pickle); single household network going forward. Letter order is L-G-P (not G-L-P) to avoid the GLP-1 pharmaceutical association in a physician household |

**Retired:**
- "Berman Net" — deleted 2026-05-01 evening. No reason to keep advertising the installer's brand into the airwaves.
- "GhLoP" — renamed to LGP123.
- BHS's hidden `letmeinnow` SSID — never recreated.

**Every device in the house needs to rejoin `LGP123` with password `$uga($pi(e`.** Wired devices (Sonos Amps, LG TV, Apple TV) are unaffected. Wireless devices that need to reconnect: family phones, laptops including the AstraZeneca work laptop, kids' iPads / phones / Kindles, Apple Watch, Peloton, anything else previously on Berman Net or GhLoP.

## Devices Aneeta + the kids need to update

Wireless devices need the new Berman Net password. Wired devices are unaffected.

- Family phones (everyone)
- Family laptops (Alton, Aneeta, the AstraZeneca work laptop)
- Kids' iPads / phones / Kindles
- Apple Watch (if it joins WiFi)
- Peloton
- Google Nest device (going away soon anyway)

GhLoP is unchanged from original — anything connected to it stays connected.

Wired and unaffected: Sonos Amps × 6, LG OLED TV, Apple TV.

## Open items

- **Pete email** — Gmail draft `r1648436912190611604` is sitting in your drafts folder. Subject: "Network management handoff + a few suggestions". Send when you're ready.
- **VLAN segmentation (Phase 3 deferred)** — IoT VLAN, Mgmt VLAN, Kids VLAN. Held back until you decide on a UniFi gateway (UCG-Pro / UCG-Max). The switch alone can't do mDNS reflection across VLANs, which would break Sonos and AirPlay.
- **IPv6 firewall audit on OutdoorBackyard** — the outdoor AP has a globally-routable IPv6 address. Worth confirming nothing management-related is reachable from the public IPv6 internet.
- **Eventually replace Verizon Fios router with a UniFi gateway** — bridge-mode is supported; long-term roadmap.

## Backups

`C:\Users\alto8\backups\unifi\`:
- `sartor-claude-network_2026-05-01_1619.unf` — pre-AP-takeover (switch only)
- `sartor-claude-network-post-takeover_2026-05-01_1901.unf` — post AP takeover, pre PSK rotation
- `sartor-claude-network_pre-psk-rotation_2026-05-01_1954.unf` — immediately before PSK changes
- `sartor-claude-network_post-psk-rotation_2026-05-01_1957.unf` — current canonical baseline
- `ap-authkeys-2026-05-01.json` — per-device authkey + credential reference (NOT git-tracked)
- `firmware.json.bak-20260501_1821` — original `firmware.json` before the G7IW alias patch
- `wlanconf-pre-rotation_2026-05-01_1954.json` — wlanconf snapshot for offline rollback

Post-rotation `.unf` is the one to keep. Pre-rotation copies retained for 30 days, can be deleted after.

---

# 🌃 The Story

## Cold open

Wednesday night. The router lights blink steady. Family asleep. Two kids' iPads idle on a charging dock. The Berman regime had been running this neighborhood for forty-eight hours.

Pete's controller sat on a residential FiOS line in Verona, behind a free Dyn DDNS lease nobody was paying attention to — `berman.gets-it.net:8443`. Not malicious, just lazy. The kind of arrangement where the installer keeps the keys and the customer thinks they got admin. We knew this because the contract said otherwise, and the contract was signed.

There was a hidden SSID broadcasting on every AP. The PSK was `letmeinnow`, six characters of dictionary word, the kind of backdoor that says we trust ourselves more than we trust you. There was an unrotated `ubnt:ubnt` SSH default on every box. There was a switch with the hostname `USW-Pro-Max-24-PoE` that hadn't been adopted in twenty-five months because nobody bothered. We were a customer in name and a tenant in fact.

We dispatched eight scavenger agents into the LAN. They came back with a map.

## Recon

The map was a betrayal disguised as competence. The hardware install was clean — fiber-grade UniFi gear, eight WiFi 7 radios, a USW-Pro-Max-24-PoE backbone. Aesthetically a beautiful network. Operationally a colony.

Every device was reachable on `ubnt:ubnt`. The WiFi PSK was Pete's phone number, which is funny in a tragic way. The controller was hosted on a residential FiOS IP, which means if Pete's house lost power our network would too. The "local gateway provision" we paid extra for had not been installed.

We took the switch first. It was easy. Nobody had ever adopted it. We stood up our own UniFi controller on Rocinante — natively on Windows, no Docker — and the switch saw it, said yes, and rotated its credentials to ours within ninety seconds. We gave it a new name: Sartor-Saxena-Claude Network. Aneeta's surname riding shotgun. As it should.

## The siege

The APs were harder. The APs were *adopted*. They had Pete's authkeys baked into flash, they phoned home every thirty seconds, they didn't care what we thought. We tried set-inform; Pete overwrote it. We tried editing `/etc/persistent/cfg/mgmt` directly with sed; Pete overwrote it on the next inform cycle. We rebooted; flash partition restore put Pete's URLs back.

We tried switch-level ACLs. UniFi switches do hardware-offloaded forwarding — the switch's CPU never saw traffic between the AP and the uplink. We tried `/etc/hosts` redirects on the AP; rootfs is tmpfs, edits vanish on reboot. We tried PoE-cycling at the switch; the AP that mattered most was on a separate injector and our cycle did nothing.

We were losing the timing race. Pete's controller got the first inform after every boot. Pete's controller had the floor.

So we sent five more agents into the literature. They came back with the breakthrough.

## The breakthrough

UniFi's inform protocol is symmetric crypto. No PKI. No certificates. Just `mgmt.authkey`, an AES-128-GCM key sitting in plaintext at `/etc/persistent/cfg/mgmt`, the same field on both sides. A controller in possession of the authkey is cryptographically indistinguishable from any other controller in possession of the same authkey.

We had the authkey. We'd been reading it via SSH all day.

We seeded our local controller's MongoDB with each AP's BHS-issued authkey. Now we could decrypt their inform packets. Now we could speak Pete's language. The next inform cycle reached our controller, and our controller spoke back: *here is your new authkey, here is your new inform URL, your old controller is no longer authoritative.* The AP rotated. Pete went stale.

We ran the playbook on six APs in sequence. Each took ninety seconds.

## The holdouts

HisOffice — the in-wall U7-PIW — refused. It self-reported as `G7IW`, a model code our controller's firmware database didn't know. Provisioning failed silently, no error, just an AP wedged in state 10. We patched `firmware.json` to alias G7IW to U7PIW's existing firmware bundle. The JVM had it cached, so we had to stop the controller via `ace.jar stop`, restart it, and watch HisOffice transition Pending → Connected like nothing happened.

Livingroom hung at the end. Pings worked, SSH didn't. We looked for its PoE feed and discovered the truth: it was downstream of the AV-rack switch, powered by a separate Ubiquiti U-PoE++ brick. Our switch's PoE cycle had been talking to the wrong wire all evening. Alton walked over, found the brick, unplugged it for ten seconds, plugged it back in. The AP came up clean. Sixty seconds later, Connected. Status: ours.

## The cleanup

Nine of nine. We pulled a backup. We rotated the WiFi PSKs because Pete still had plaintext copies in his old `.unf` files; we flipped both SSIDs from plain WPA2 to WPA3-SAE + WPA2 transition while we were in there, closing a security regression we'd accidentally introduced when we pre-staged. Aneeta noticed we'd given GhLoP a passphrase that wasn't hers. We rolled GhLoP back. The cats — Ghostie, Loki, Pickle — got their network name back.

We pinned 2.4 GHz channels to escape the neighborhood war zone on channel 6 (seventy-one BSSIDs in range from the OutdoorBackyard scan; somebody named Cynthia, somebody else with a Fairy Kingdom SSID, the inevitable cluster of Verizon defaults). Hall2ndFloor's radio refused to retune until we pushed a soft-restart through the controller; the others retuned without being asked twice.

We drafted Pete a friendly email. Thanks for the install, the gear is great, you might want to bake these four security improvements into your default template, by the way we've moved to local management as the contract specified, your dashboard will show "Disconnected" tomorrow, sorry for any confusion.

The Sonos in the living room had been playing Harry Styles for ninety minutes through a phone-disconnected Aneeta couldn't reach. We sent it a SOAP Stop directly. The house went quiet.

## End state

Eleven o'clock. Nine devices, all reporting to us. WPA3 transition active on both broadcast SSIDs. Channel plan distributed. Auto-update at 3 AM. Backups stacked. Pete's email queued in drafts. Aneeta's name on the network. The cats' passphrase intact.

It was a good day to be the customer.
