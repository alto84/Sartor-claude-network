---
name: unifi-takeover-2026-05-01-phase3-hardening-plan
description: Phase 3 hardening plan for the post-takeover UniFi network — VLAN segmentation, channel re-plan, IPv6 firewall, auto-update window. Pre-execution; menu of options for Alton to pick from.
type: plan
status: proposed-pending-approval
date: 2026-05-01
related:
  - projects/unifi-takeover-2026-05-01
---

# Phase 3 hardening — proposal menu

> [!note] Read-only proposal
> Nothing here has been executed. Live controller state was confirmed via read-only API calls on 2026-05-01. Alton picks the items, Alton picks the order, Alton picks the time.

## State confirmed live before drafting

- Single network: `Default`, `purpose=corporate`, no VLAN tag. Both SSIDs (`Berman Net`, `GhLoP`) bound to it.
- All eight APs have all three radios (`ng` 2.4 GHz, `na` 5 GHz, `6e` 6 GHz where applicable) set to `channel=auto`. Nothing is pinned. ng is 20 MHz HT, na is 40 MHz, 6e is 160 MHz.
- `mgmt.auto_upgrade=True`, `mgmt.auto_upgrade_hour=3` (3 AM controller-local). `super_fwupdate.firmware_channel=release` (not Early Access).
- The Verizon CR1000A at 192.168.1.1 is the only DHCP server and the only L3 gateway. The USW-Pro-Max-24-PoE is L2 only in current config.

## Recommended execution order

`3D` (verify) → `3B` (channel pin) → `3C` (IPv6 audit) → `3A` (segmentation, partial only).

Rationale: 3D is a five-minute settings audit with zero touch. 3B is a one-API-call-per-AP change with a known 2-5 second per-AP disruption and an obvious rollback. 3C is read-only recon plus an additive iptables rule that fails closed — if it breaks anything it breaks management ingress on a single AP. 3A is the only item where the realistic move is "do a small useful piece now, defer the rest until a UniFi gateway lands." Doing it last means we don't have to undo it when the gateway changes the architecture anyway.

---

## 3D — Auto-update window verification

**Scope.** Confirm device firmware auto-update is on, runs at 3 AM, and is on the stable release channel.

**Pre-condition checks.** None — read-only.

**Execution.**

1. `GET /api/s/default/get/setting/mgmt` → confirm `auto_upgrade=true`, `auto_upgrade_hour=3`.
2. `GET /api/s/default/get/setting/super_fwupdate` → confirm `firmware_channel=release`.
3. UI: Settings → System → Updates. Confirm "Auto Update Devices" toggle ON, time 3:00, "Early Access" OFF.

**State after the read above:** all three already correct. Action item is "leave as is and document," not "change."

**If a change is wanted** (e.g., move to 4 AM to dodge any 3 AM cron drift on the Windows side):

```
PUT /api/s/default/set/setting/mgmt
Body: { "auto_upgrade_hour": 4 }
```

**Reversibility.** Trivial. PUT the old hour back.

**Risk.** Low. Setting only governs when the controller pushes already-downloaded firmware. Worst case: a future firmware install lands at an awkward hour. APs reboot in roughly 90 seconds; no client config loss.

**Disruption.** Zero for the verification. If a real firmware push lands at 3 AM, expect 60-120 seconds of WiFi outage per AP, staggered. Family is asleep.

**Validation.** Re-GET both settings. Watch the next firmware notification land in the controller event log; confirm it lands at 3 AM ET and no earlier.

---

## 3B — 2.4 GHz channel re-plan (move APs off ch 6)

**Scope.** Pin each of the seven worst-placed APs' 2.4 GHz radio to channel 1 or 11 (whichever is sparser per the OutdoorBackyard scan that showed ch 6 = 71 BSSIDs, ch 1 = 2 BSSIDs, ch 11 = 4 BSSIDs). Leave 5 GHz and 6 GHz on auto — they are uncongested.

**Pre-condition checks.**

1. Re-pull a fresh neighbor scan from each AP, not just OutdoorBackyard. APs in the basement and 3rdFloor may see a different RF environment. `GET /api/s/default/stat/spectrumscan` per AP, or trigger an RF scan via `cmd: 'spectrum-scan'` on `cmd/devmgr` (stops radios for ~3 minutes per AP, intrusive — only do this off-hours, and only if there's reason to suspect non-uniform neighbor density).
2. Pull current radio_table for each AP (already done above; all seven APs are `channel=auto` on ng).
3. Pick a per-AP assignment. Recommended starting plan, with non-overlapping triplet 1/6/11 to keep co-channel interference low between our own APs:

| AP | Floor | Proposed 2.4 ch |
|---|---|---|
| Basement | basement | 1 |
| Hall2ndFloor | 2nd | 11 |
| HerOffice | 2nd | 1 |
| Gym | 2nd | 6 |
| 3rdFloor | 3rd | 11 |
| HisOffice | 3rd | 1 |
| Livingroom | 1st | 11 |
| OutdoorBackyard | outside | 6 |

(Two APs stay on 6 because a non-overlapping 1/6/11 plan beats stacking everyone on 1 and 11 — even with neighbors crowding 6, we control the airtime in our own house.)

**Execution.** Per AP, one PUT to update the radio_table:

```
PUT /api/s/default/rest/device/{device_id}
Body: { "radio_table": [
  { "radio": "ng", "channel": "1", "ht": "20", "tx_power_mode": "auto" },
  { "radio": "na", ...keep existing... },
  { "radio": "6e", ...keep existing... }
]}
```

Order of operation: do the non-edge APs first (Basement, Hall2ndFloor, HerOffice — places where if WiFi blips, no one cares). Save Livingroom and HisOffice for last because those are the highest-use rooms.

**Reversibility.** Per AP, PUT the radio entry back to `"channel": "auto"`. The controller has the original radio_table in its event history; can also be fished out of the most recent `.unf` backup via `unifi-backup-decrypt`.

**Risk.** Low. Pinning a channel is a normal vendor-supported operation. The only failure mode is "we picked a channel that's locally worse than auto-pick would have," which manifests as throughput degradation, not outage. We re-measure and re-pin.

**Disruption.** 2-5 seconds of 2.4 GHz disconnection per AP at the moment of channel change. 5 GHz and 6 GHz clients are unaffected. Most modern household devices roam to 5/6 GHz when 2.4 hiccups, so the perceived disruption is shorter than the radio's actual reset.

**Validation.**

1. After each PUT, re-GET the device; confirm `radio_table[ng].channel` is the new fixed value, not "auto."
2. Walk through the house with a spectrum tool (WiFi Explorer, NetSpot, or Ubiquiti's WiFiman) and confirm each AP is broadcasting on the assigned channel.
3. Speed-test from each room 24h after the change. Compare to a baseline taken before. If any room got worse, re-pin that AP.
4. Log neighbor-AP density per channel weekly for two weeks; if ch 1 fills up with neighbors moving off ch 6 (the inverse of what we want), re-balance.

---

## 3C — IPv6 firewall on outdoor AP

**Scope.** Confirm the OutdoorBackyard AP's globally-routable IPv6 (`2600:4041:410a:fc00::/64` from earlier recon) does not expose SSH/8080/8443 to the public IPv6 internet, and add a boot-time `ip6tables` block analogous to the existing `iptables.{i}.cmd` BHS-controller block on every AP if it does.

**Pre-condition checks.**

1. From a network outside the house (cell hotspot, ssh from gpuserver1's tailscale exit if available, or use an external IPv6 reachability service like `ipv6-test.com/ping.php`), attempt:
   - `ping6 <outdoor-ap-global-v6>`
   - `nc -6 -zv <outdoor-ap-global-v6> 22`
   - `nc -6 -zv <outdoor-ap-global-v6> 8080`
   - `nc -6 -zv <outdoor-ap-global-v6> 8443`

2. If all four time out: **stop, no action needed.** Verizon's CR1000A IPv6 firewall is doing its job.

3. If any succeed: add the AP-side block.

4. Repeat the four-port check against each of the other seven APs' global v6 addresses (pull from `GET /api/s/default/stat/device`, field `ipv6` per network). The OutdoorBackyard AP is the obvious worry but if Verizon's policy is "all interior devices get a global v6 with no firewall," every AP is exposed.

**Execution (only if the check finds exposure).**

Per AP, ssh in and persist a boot-time block. The existing `iptables.1.cmd` slot is taken by the BHS-controller IPv4 block, so use slot 2 for v6. The persistent-cfg key for ip6tables on UniFi U7-class firmware is `ip6tables.{i}.cmd=` (same pattern as iptables; confirmed via vendor source on similar UAP-AC-class hardware, but **verify on one AP first** — if the key doesn't take, fall back to a startup script in `/etc/persistent/rc.local.d/`).

```bash
ssh alton@<ap>
cfgmtd -r -p /etc
# Verify the key works on one AP first:
echo 'ip6tables.2.cmd=-A INPUT -p tcp -m multiport --dports 22,8080,8443 ! -s fe80::/10 ! -s 2600:4041:410a:fc00::/64 -j DROP' >> /tmp/system.cfg
syswrapper.sh save-config
syswrapper.sh apply-config
# Reboot and verify:
reboot
# After AP comes back up:
ssh alton@<ap> 'ip6tables -L INPUT -n | head'
```

The `! -s fe80::/10` keeps link-local management working. The `! -s 2600:4041:410a:fc00::/64` keeps inside-the-house IPv6 management working. Anything from outside that prefix arriving on tcp/22, /8080, /8443 gets dropped.

**Reversibility.** ssh in, edit `/tmp/system.cfg` to remove the `ip6tables.2.cmd` line, `syswrapper.sh save-config && apply-config`. Reboot. Or wipe the rule in-RAM with `ip6tables -F INPUT` for an immediate undo.

**Risk.** Medium *only on the validation AP*; Low on the rest after the key is confirmed. Failure mode: the `ip6tables.{i}.cmd` key doesn't exist on this firmware variant, the line silently no-ops, and we have a false sense of security. Real fix: `ip6tables -L` after reboot to confirm the rule is actually loaded; if the key didn't materialize, switch to the `rc.local.d` startup-script pattern.

**Disruption.** Zero for the audit. ~90 seconds of AP downtime per AP during the verification reboot if we go down the modify-and-reboot path. Stagger across days.

**Validation.**

1. After the rule is loaded, re-run the four external-port checks. They should now time out.
2. Verify SSH from inside the house to the AP's global v6 still works (proves the inside-prefix exception is honored).
3. Verify controller still informs to the AP (which uses IPv4 anyway, so this is a cheap sanity check).

---

## 3A — VLAN segmentation (partial only; full plan deferred)

**Scope.** This is the work stream that runs into the lack-of-UniFi-gateway constraint hardest. Honest assessment up front:

- The Verizon CR1000A is the only DHCP server and the only L3 gateway. We don't have admin to it. We cannot create a new DHCP scope on the Verizon side, cannot add a per-VLAN firewall rule there, cannot push DNS-over-DHCP for a Pi-hole there.
- The USW-Pro-Max-24-PoE *can* do L3 routing in static-route configurations, but inter-VLAN routing without a gateway upstream means we'd have to designate the switch as the default gateway for the new VLANs, give it static routes back to the Verizon-served WAN, and SNAT or coordinate with the Verizon side for return traffic. That's a non-trivial architecture and brittle without admin to the upstream.
- Sonos, Apple TV, AirPlay, Google Home Cast, and Spotify Connect all rely on multicast (mDNS, SSDP, Bonjour) that does not cross VLAN boundaries without an mDNS reflector / Avahi / IGMP-proxy. UniFi gateways have an mDNS-reflector toggle. The bare USW-Pro-Max-24-PoE does not.

What this means practically: a real IoT VLAN that doesn't break Sonos or AirPlay needs a UniFi gateway. Doing it on the switch alone gives you "isolation that breaks your music" or "isolation that doesn't actually isolate" — neither is worth the time. **Defer IoT VLAN until the UCG-Pro/UCG-Max lands.**

What's still worth doing now:

### 3A.1 — Mgmt VLAN (the only piece worth executing pre-gateway)

Create a tagged VLAN that carries only the management plane: BMC at .156, the switch's own management IP, the eight APs' inform interfaces. Family devices stay on the untagged Default network. This is L2-only isolation: you can't accidentally telnet to an AP from your kid's laptop because the kid's laptop is in VLAN 1 untagged and the AP management is on VLAN tag 100.

**Pre-condition checks.**

1. Confirm BMC at .156 supports 802.1Q tagging (Supermicro / ASRock Rack BMCs usually do; some don't). If it doesn't, this plan can't include the BMC and falls back to "mgmt VLAN for UniFi devices only."
2. Confirm the controller's Rocinante NIC can be moved to the new VLAN, *or* that the switch port Rocinante connects to is configured to carry both untagged VLAN 1 (so the rest of Rocinante's traffic still works) and tagged VLAN 100 (so the controller can reach the APs).
3. Pull a fresh `.unf` backup before touching network config — a misconfigured trunk port can lock the controller out of its own switch, and the recovery is "console cable + reset to defaults," which would undo the entire takeover.

**Execution.**

1. UI: Settings → Networks → Create New → VLAN-only network, name `mgmt`, VLAN ID `100`. No DHCP (devices on this VLAN get static IPs in 192.168.100.0/24, configured per-device).
2. UI: UniFi Devices → switch → Port Manager. For each port carrying an AP, set Native Network = Default (so the AP boots and gets DHCP from Verizon as today) and Tagged Networks = mgmt. *Do not* re-IP the APs onto VLAN 100 in the same change — that's the second sub-step. First step is just "make the trunk available."
3. After confirming all APs still adopt and inform on Default/untagged, manually re-IP each AP's management interface to a static 192.168.100.x address on VLAN 100 via the AP's `cfgmtd`-persisted config (`mgmt.network=mgmt`, `vlan=100`). Test one AP first — Basement, lowest-stakes.
4. Reconfigure controller's inform-URL ACL: only accept inform from 192.168.100.0/24 (drop attempts from 192.168.1.0/24). This is the actual security gain — a compromised family device on .1.x can no longer pretend to be an AP.
5. BMC: log into BMC web UI → Network → VLAN tag = 100, static IP 192.168.100.156. *Do this last,* and only if pre-condition 1 confirmed VLAN support. If you set it and the BMC drops, you need physical console access to recover.

**Reversibility.** Per step, undo in reverse: revert BMC to untagged → revert APs to untagged management → undo trunk port config → delete the VLAN-only network. The `.unf` backup taken at the start is the universal undo button if any step bricks the switch.

**Risk.** Medium-High. The failure mode where a misconfigured trunk port isolates the controller from its own switch is real, recovery is painful (console cable, factory reset, re-adopt), and the value gained is "L2 isolation of management" — not nothing, but not a step-change either. Worth doing only when Alton has 90 free minutes and physical access to the switch for worst-case recovery.

**Disruption.** Step 2 (trunk port enable): zero. Step 3 (re-IP one AP): 60-90 seconds of that AP being unmanaged while it transitions; clients see no WiFi blip if done carefully (the AP keeps serving WiFi while its mgmt IP changes). Step 4 (controller ACL): 30 seconds. Step 5 (BMC): if it works, 10 seconds; if it doesn't, indeterminate downtime until physical recovery.

**Validation.**

1. After each AP is moved, controller still shows it Connected.
2. From a family laptop on 192.168.1.0/24, attempt to ssh to an AP on 192.168.100.x — should fail (no route).
3. Ping each AP's new mgmt IP from Rocinante; should succeed (Rocinante is the controller, it's on the trunk).
4. BMC web UI loads from Rocinante after the BMC move; doesn't load from a family device. (This is the assertion we actually wanted.)

### 3A.2 — IoT VLAN: **explicitly deferred**

Do not attempt before a UniFi gateway is in place. Sonos / Apple TV / AirPlay / Cast will break, and the family will hate you for a week before you reverse it. When the UCG-Pro lands, the gateway provides mDNS reflector + per-VLAN firewall in one toggle.

### 3A.3 — Kids VLAN with Pi-hole DNS: **explicitly deferred**

Same reason. Without a gateway, you can't push a DHCP option to point Kids-VLAN clients at Pi-hole, because Verizon owns DHCP. Workarounds (Pi-hole as a DHCP server competing with Verizon's, or per-device manual DNS settings on three children's devices) are fragile.

---

## What's blocked by lack of UniFi gateway, summarized

| Want | Needs gateway? | Workable on switch alone? |
|---|---|---|
| 3D auto-update window | No | Already done |
| 3B 2.4 GHz channel re-plan | No | Yes |
| 3C IPv6 firewall on AP | No | Yes (per-AP ip6tables) |
| 3A.1 Mgmt VLAN | No | Yes, with care |
| 3A.2 IoT VLAN | **Yes** (mDNS reflector for Sonos/AirPlay) | No |
| 3A.3 Kids VLAN with Pi-hole | **Yes** (per-VLAN DHCP) | No |
| Per-device firewall rules | **Yes** | No (Verizon owns it) |
| DNS rewrite (e.g., force all DNS through Pi-hole) | **Yes** | No (Verizon owns DHCP option 6) |
| Static routes off the LAN | **Yes** | No |

The right time for items in column 2 is "when the UCG-Pro arrives and is in bridge-mode-behind-Verizon or replacing Verizon altogether."

## What's blocked by lack of Verizon admin

Nothing in this plan requires Verizon admin. We're working entirely behind the WAN edge. The Verizon router stays as-is: gateway, DHCP server, NAT, IPv6 prefix delegator. The hardening work above is all on the LAN-side equipment we own.

## Open question for Alton

Is there an appetite to do 3A.1 (mgmt VLAN) without a gateway, given the medium-high recovery cost if a trunk-port misconfig locks the switch out? My read: not worth it as a standalone item. Worth it bundled with the eventual UCG-Pro install, when you're already going to be elbow-deep in network config and the gateway makes the rest of 3A possible. If that bundling lands within ~3 months, defer 3A.1 too; if the gateway is 6+ months out, do 3A.1 now for the BMC isolation alone.
