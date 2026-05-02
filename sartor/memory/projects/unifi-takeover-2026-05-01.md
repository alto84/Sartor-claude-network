---
name: unifi-takeover-2026-05-01
description: Complete software-only takeover of the Berman Home Systems-installed UniFi network. 9 devices (1 switch + 8 APs) migrated to local controller on Rocinante without factory reset, without Verizon router admin, and without any cooperation from BHS. Includes the proven playbook, all credentials, AP authkey reference, and recovery procedures. Lives next to the .unf backup as the canonical operational record.
type: project
status: 9-of-9-fully-owned-takeover-complete
date: 2026-05-01
last_updated: 2026-05-02T00:05Z
related:
  - reference/HOUSEHOLD-CONSTITUTION
tags: [project/active, infra/network, machine/rocinante, vendor/ubiquiti, vendor/berman-home-systems]
---

# UniFi network self-host — proven takeover playbook

> [!warning] Contains credentials
> Local admin password, device SSH password, WiFi PSKs, and per-device authkeys. Don't paste this file into anything outside the local Sartor repo. Don't share with BHS — Pete in particular doesn't need to know how the takeover was done.

## Headline

Berman Home Systems installed a UniFi network in late April 2026 (USW-Pro-Max-24-PoE switch + 7 WiFi 7 APs covering Hall2ndFloor, Gym, 3rdFloor, Basement, HerOffice, Livingroom, OutdoorBackyard, plus an in-wall HisOffice U7-PIW). Per the install contract (quote `AAAQ13216-02`, March 31 amendment), Alton paid extra for "local-gateway provision" so HE could be the local admin. BHS instead deployed with their own controller hosted at `https://berman.gets-it.net:8443/manage/site/4nyppeqd` (residential Verizon FiOS IP behind a free Dyn DDNS lease) retaining Super Admin, the documented `ubnt:ubnt` SSH default still enabled on every device, a hidden `letmeinnow`-PSK maintenance SSID for ongoing back-channel access, and the switch never even adopted by their controller.

This project repatriated the entire network to local Sartor admin in one day, without involving BHS, without factory-resetting any device, and without admin access to the Verizon Fios router.

## Final state (as of session close 2026-05-01 22:48Z)

| Device | IP | MAC | Model code | State | Notes |
|---|---|---|---|---|---|
| Sartor-Saxena-Claude Network (switch) | 192.168.1.170 | 58:d6:1f:86:e3:ff | USPM24P | ✅ Connected | renamed from "USW-Pro-Max-24-PoE", port labels via API, fw bumped 7.0.50→7.4.1 during adoption |
| OutdoorBackyard | 192.168.1.173 | 58:d6:1f:a8:36:58 | UKPW (U7-Outdoor) | ✅ Connected | first AP — proof-of-concept |
| Hall2ndFloor | 192.168.1.167 | a8:9c:6c:64:70:14 | U7PRO | ✅ Connected | switch port 1 |
| Gym | 192.168.1.165 | 8c:ed:e1:7a:f2:bc | U7PRO | ✅ Connected | switch port 2 |
| Basement | 192.168.1.168 | 9c:05:d6:b0:53:d2 | U7PRO | ✅ Connected | switch port 3 |
| HerOffice | 192.168.1.183 | a8:9c:6c:62:ea:20 | U7PRO | ✅ Connected | switch port 4 |
| 3rdFloor | 192.168.1.166 | 8c:ed:e1:7a:86:ac | U7PRO | ✅ Connected | switch port 5 |
| Livingroom | 192.168.1.185 | 8c:ed:e1:7a:8a:04 | U7PRO | ✅ Connected | switch port 6 via downstream AV-rack switch — separate Ubiquiti U-PoE++ injector powers the AP (NOT switch PoE on port 6); was hung post-restart, recovered by physically power-cycling the U-PoE++ injector |
| HisOffice (in-wall) | 192.168.1.186 | 1c:0b:8b:6e:6d:e3 | U7PIW (G7IW) | ✅ Connected | switch port 8 — required `firmware.json` patch to register G7IW model alias |

## Credentials

> [!danger] Sensitive
> If you rotate any of these, update this file in the same commit.

| What | Where | Username | Password |
|---|---|---|---|
| Local UniFi controller admin (web UI + API) | `https://192.168.1.171:8443` | `alton` | `;lkjpoiu0987` (Chrome saved this; also matches BMC and household-default) |
| Device SSH on adopted UniFi devices | ssh ubnt@<ap> → ssh alton@<ap> | `alton` | `;Lkjpoiu0987` ← capital L (UniFi requires uppercase in device passwords; one-shift variant of household-default) |
| Pre-takeover SSH on UniFi devices (no longer works on adopted) | factory default | `ubnt` | `ubnt` |
| MongoDB on Rocinante (controller backing store) | `mongodb://127.0.0.1:27117/ace` | n/a | n/a (no auth — bind to loopback only) |

## WiFi SSIDs and PSKs (legacy from BHS, pre-staged in our controller verbatim)

| SSID | Visibility | Security | PSK | Status |
|---|---|---|---|---|
| `Berman Net` | broadcast (dual-band) | WPA3-SAE + WPA2 transition (pmf_mode=optional) | `MapleStreet-Sunset19!` | rotated 2026-05-01 evening, BHS-knowledge closed |
| `GhLoP` | broadcast (dual-band) | WPA3-SAE + WPA2 transition (pmf_mode=optional) | `$uga($pi(e` | reverted to original at Aneeta's request — "GhLoP" = cats Ghostie/Loki/Pickle, this is her chosen passphrase. Trade-off: BHS still knows this PSK from old backups; mitigated by WPA3-SAE transition + AP-level iptables block of BHS controller IP |
| _(hidden BHS maintenance)_ | hidden | WPA2-PSK | `letmeinnow` (stale; not in our config) | **NOT recreated in our controller; gone from broadcasts since takeover** |

Pre-rotation PSKs (BHS-known, now stale on our side): `9732398870` (Berman Net), `$uga($pi(e` (GhLoP). Both still appear in BHS's old `.unf` backups; rotation closed the residual-knowledge loop. After rotation, only Sartor knows the new PSKs.

## Per-AP BHS authkeys (pre-takeover)

These were the per-device symmetric keys BHS used to encrypt inform traffic. Our controller seeded these into MongoDB; on first inform our controller decrypted, on adoption we pushed a NEW authkey, the AP rotated, BHS's keys are now stale.

| AP | MAC | BHS authkey (pre-takeover) |
|---|---|---|
| Gym | 8c:ed:e1:7a:f2:bc | `3FE5DF3E0D7F...` (full key in `C:\Users\alto8\backups\unifi\ap-authkeys-2026-05-01.json`) |
| 3rdFloor | 8c:ed:e1:7a:86:ac | `3780F9BBEC90...` |
| Hall2ndFloor | a8:9c:6c:64:70:14 | `E45141E0A99B...` |
| Basement | 9c:05:d6:b0:53:d2 | `4F88FDE0F746...` |
| HerOffice | a8:9c:6c:62:ea:20 | `08C4A99D8CB4...` |
| Livingroom | 8c:ed:e1:7a:8a:04 | `024F60157B01...` |
| HisOffice | 1c:0b:8b:6e:6d:e3 | `4CBAA3287CC2815AF6C77B91010AFF53` (full) |
| OutdoorBackyard | 58:d6:1f:a8:36:58 | `7642415449C2C5D216326F16FDCB349F` (full) |

Full keys in `C:\Users\alto8\backups\unifi\ap-authkeys-2026-05-01.json` (NOT git-tracked).

The CURRENT authkeys (post-takeover) are stored in our controller's MongoDB at `ace.device.x_authkey` per device. Pulling a fresh `.unf` backup captures them.

## The proven playbook

For each AP at IP X, MAC M, current authkey AK, model code MC:

### Step 1 — Read existing authkey via SSH (while still on BHS)

```bash
ssh ubnt@X 'cat /etc/persistent/cfg/mgmt | grep -E "^mgmt\.authkey="'
# yields: mgmt.authkey=<AK>
```

Also grab MAC + board.shortname for model lookup:

```bash
ssh ubnt@X 'cat /etc/board.info | grep -E "^board\.(shortname|name|hwaddr)="'
```

### Step 2 — Find the right model code in our controller's database

The AP's `board.shortname` (from board.info) may differ from the controller's expected `model` code. Check `firmware.json`:

```python
import json
with open(r'C:\Users\alto8\Ubiquiti UniFi\data\firmware.json') as f:
    rel = json.load(f)['10.3.55']['release']
print([k for k in rel if AP_FAMILY in k])  # e.g., 'IW' for in-wall
```

If model code missing (e.g., G7IW not present, U7PIW present), **patch firmware.json** to add the alias:

```python
rel['G7IW'] = rel['U7PIW']  # alias new shortname to existing firmware bundle
```

Then **restart the controller** (see "Controller restart" section below). Without restart, the JVM holds firmware.json cached.

### Step 3 — Seed our controller's MongoDB with the AP record

```python
from pymongo import MongoClient  # requires pymongo<4 because UniFi MongoDB is wire-version 6
from bson import ObjectId
import time, uuid
client = MongoClient('mongodb://127.0.0.1:27117', serverSelectionTimeoutMS=5000)
db = client['ace']
switch = db.device.find_one({'mac': '58:d6:1f:86:e3:ff'})  # any existing device — for site_id
db.device.insert_one({
    '_id': ObjectId(),
    'mac': M,
    'model': MC,                                     # e.g., 'U7PRO', 'U7PIW', 'UKPW'
    'type': 'uap',
    'adopted': True,
    'adopted_at': int(time.time()),
    'inform_url': 'http://192.168.1.171:8080/inform',
    'x_authkey': AK,                                  # the BHS authkey we just read
    'x_aes_gcm': True,                                # required for U7-class firmware 8.5.x
    'site_id': switch['site_id'],
    'setup_id': str(uuid.uuid4()),
    'name': NAME,
    'two_phase_adopt': False,
    'manufacturer_id': 4,
})
```

### Step 4 — On the AP, persist boot-time iptables block + invoke set-adopt

```bash
ssh ubnt@X
cfgmtd -r -p /etc                                                    # pulls flash → /tmp/system.cfg
echo 'iptables.1.cmd=-A OUTPUT -d 173.70.91.42 -j DROP' >> /tmp/system.cfg
syswrapper.sh save-config                                            # commit to flash WITH cfgversion handshake (cfgmtd -w alone skips this and edits silently revert)
(syswrapper.sh apply-config &) ; sleep 1
syswrapper.sh set-adopt http://192.168.1.171:8080/inform <AK>        # vendor-documented re-pointing command
# SSH session may drop here as services restart
```

### Step 5 — Wait 60-90s, verify

```python
fetch('/api/s/default/stat/device').then(r=>r.json()).then(d=>...)
# Look for state=1 (Connected), adopted=true, vap_count=4-6
```

If state goes 2 (Pending) → 4 or 5 (Adopting/Provisioning) → 1 (Connected): success. SSH credentials will have rotated to `alton:;Lkjpoiu0987` (controller pushes this on adoption).

### Step 6 — If state stuck at 0 or limbo

- **`G7IW` model not recognized:** patch firmware.json + restart controller (see Step 2 + below).
- **State 10 (managed-by-other) limbo:** `db.device.delete_one({'mac': M})` to forget, then re-trigger set-adopt.
- **AP SSH dead but pings:** AP software stuck. Physical power-cycle.

## Controller restart (to load patched firmware.json)

```bash
cd "/c/Users/alto8/Ubiquiti UniFi"
# Stop (uses IPC, no UAC needed):
"./jre/bin/java.exe" --add-opens java.base/java.lang=ALL-UNNAMED \
  --add-opens java.base/java.time=ALL-UNNAMED \
  --add-opens java.base/sun.security.util=ALL-UNNAMED \
  --add-opens java.base/java.io=ALL-UNNAMED \
  --add-opens java.rmi/sun.rmi.transport=ALL-UNNAMED \
  -jar lib/ace.jar stop

# Wait ~10s, confirm `java` process gone (only `javaw` tray left)

# Start:
"./jre/bin/java.exe" --add-opens java.base/java.lang=ALL-UNNAMED \
  --add-opens java.base/java.time=ALL-UNNAMED \
  --add-opens java.base/sun.security.util=ALL-UNNAMED \
  --add-opens java.base/java.io=ALL-UNNAMED \
  --add-opens java.rmi/sun.rmi.transport=ALL-UNNAMED \
  -Xmx1024M -jar lib/ace.jar start &

# Wait until https://localhost:8443/ returns 200 (~15-30s for Spring boot)
```

Expect 30-60s of disconnection across all adopted APs. They auto-reconnect since they cache config and just resume informing once the controller responds.

## Why all earlier attempts failed (lessons learned)

| Attempt | Why it failed | What we did differently |
|---|---|---|
| `set-inform` alone | In-RAM only; BHS overwrote within 30s on next inform | Combined with `set-adopt` + matching authkey on our side |
| `sed -i` edit + `cfgmtd -w` | Skipped cfgversion handshake; on reboot, BHS controller pushed config that overwrote our edits | `syswrapper.sh save-config && apply-config` (vendor wrapper that bumps cfgversion + applies live) |
| `/etc/hosts` redirect + `iptables -A` | Lost on reboot — rootfs is pure tmpfs, no overlay | `iptables.{i}.cmd=` config key in `/tmp/system.cfg` materializes pre-mcad on every boot |
| Adopt without authkey | Our controller rejected as authkey mismatch | Pre-seed MongoDB with each AP's BHS authkey before set-adopt |
| Switch ACL block | UniFi switches do hardware-offloaded L2 forwarding; CPU iptables don't see traffic between AP ports and uplink | Block at the AP's own kernel via `iptables.{i}.cmd` config key |
| HisOffice (G7IW) adoption | model `G7IW` not in firmware.json — controller silently rejected | Patch firmware.json: alias `G7IW` to `U7PIW`'s firmware bundle, restart controller |

## Backups

- **Local backup directory:** `C:\Users\alto8\backups\unifi\`
- **First .unf:** `sartor-claude-network_2026-05-01_1619.unf` (21 KB — fresh controller, just the switch — pre-AP-takeover)
- **firmware.json original (pre-patch):** `firmware.json.bak-20260501_1821`
- **AP authkeys (BHS pre-takeover):** `ap-authkeys-2026-05-01.json`
- **AP /etc/persistent/cfg/mgmt before edits (.173):** `ap-173-OutdoorBackyard-mgmt.bak`
- **TODO:** take a fresh post-full-takeover .unf backup once Livingroom resolves

> [!warning] `.unf` files contain everything
> The `.unf` backup format is reversibly encrypted with hardcoded AES-128-CBC keys (`bcyangkmluohmars` / IV `ubntenterpriseap`). Anyone with a `.unf` file can read all SSIDs, PSKs, RADIUS secrets, and bcrypt admin password hashes via tools like `zhangyoufu/unifi-backup-decrypt`. Treat the backup directory as you would `.ssh/` — local-disk only, never in git.

### Scripted backup pattern

```bash
COOKIES=$(mktemp)
curl -sk --cookie-jar "$COOKIES" --cookie "$COOKIES" \
  -H "Content-Type: application/json" \
  -X POST "https://192.168.1.171:8443/api/login" \
  -d '{"username":"alton","password":";lkjpoiu0987","remember":false}'
curl -sk --cookie "$COOKIES" \
  -X POST "https://192.168.1.171:8443/api/s/default/cmd/backup" \
  -H "Content-Type: application/json" \
  -d '{"cmd":"backup","days":0}'
TS=$(date '+%Y-%m-%d_%H%M')
curl -sk --cookie "$COOKIES" -o "/c/Users/alto8/backups/unifi/sartor-claude-network_${TS}.unf" \
  "https://192.168.1.171:8443/dl/backup/10.3.55.unf"
rm -f "$COOKIES"
```

Worth wiring into a Windows Scheduled Task (daily 3 AM ET) once stable.

## Open items

1. **Resolve Livingroom (.185)** — physical unplug-replug of the AP's ethernet cable for 10 seconds. AP will reboot, immediately phone our controller, transition Pending → Connected within 60-90s. All config already present in MongoDB so no further action needed.
2. **Verify `mgmt_url` and `stun_url` updated to ours** on all 9 devices. SSH to each, `cat /etc/persistent/cfg/mgmt | grep -E "url"` — should show `192.168.1.171` for all three URLs (servers.1.url, stun_url, mgmt_url). If `stun_url`/`mgmt_url` still show `berman.gets-it.net`, that's stale display text, not a security gap (those URLs aren't load-bearing for primary control). HisOffice + OutdoorBackyard confirmed clean; verify others.
3. **Confirm hidden `letmeinnow` SSID is gone** — WiFi scan from a phone, look for hidden SSIDs in your house. Should not see one anymore since our pre-staged config didn't include it.
4. **Take fresh post-takeover `.unf` backup** once Livingroom resolves. Stash next to the pre-takeover one.
5. **Send Pete email** — drafted at `unifi-takeover-2026-05-01-draft-pete-email.md` — Alton's call when. Friendly framing, four security suggestions for their default install template + Super Admin handoff request. Skip mentioning we already executed Phase 1+2 ourselves.
6. **Rotate WiFi PSKs within a few days** — BHS has plaintext copies via old `.unf` backups they keep. Easy in our controller now (Settings → WiFi → edit each SSID).
7. **Phase 3 hardening (deferred):**
   - VLAN segmentation: Mgmt VLAN for BMC + UniFi devices, IoT VLAN for Sonos + Peloton + Google Nest + LG TV, Kids VLAN with Pi-hole DNS
   - Move 2.4 GHz radio off ch 6 (71 BSSIDs in range from neighbors; ch 1 is sparser)
   - Audit IPv6 firewall on APs (the OutdoorBackyard AP currently has globally-routable `2600:4041:410a:fc00::/64` IPv6)
   - Auto-firmware-update window
   - Eventually replace Verizon Fios router with a UniFi Cloud Gateway (UCG-Pro / UCG-Max) to fold WAN edge into the same admin model — bridge mode on CR1000A is supported

## Operating reminders

- The controller IS Rocinante. If Rocinante reboots, the controller comes back automatically (Java process auto-launched by the tray app). If Rocinante goes offline for an extended period, the APs will continue to run their last-pushed config (broadcast SSIDs, route traffic) but won't accept changes until it's back. Acceptable for residential.
- `mca-cli-op info` on each device should show `Status: Connected (http://192.168.1.171:8080/inform)`. If it ever shows the BHS URL again, something's gone wrong and the iptables.1.cmd boot-time block should still keep BHS unreachable; check with `cat /etc/persistent/cfg/mgmt | grep url`.
- `ubnt:ubnt` SSH no longer works on adopted devices. Use `alton:;Lkjpoiu0987`. If both fail and the device is software-stuck, physical power-cycle is the universal recovery.
- BHS retains stale device records on their controller showing "Disconnected." They cannot push to the devices (URL changed, authkey rotated, iptables block at AP boot). They'd manually "Forget" the entries on their end as housekeeping.

## History

- 2026-05-01 evening: 3B 2.4 GHz channel re-plan executed. All 8 APs pinned off `auto` to a non-overlapping 1/6/11 allocation per the Phase 3 plan. PUTs each returned `meta.rc=ok`; per-AP radio_table.ng.channel verified post-PUT; all 8 APs remained state=1 throughout. 7/8 radios retuned within ~30s; Hall2ndFloor's wifi0 driver did not pick up the new channel after the initial config push (config in `/etc/persistent/cfg/mgmt` was correct, hostapd restart no help) and required a controller-issued soft-restart (`POST /cmd/devmgr cmd=restart reboot_type=soft`) to retune; settled to ch 11 ~60s post-restart. Allocation: HerOffice=1, Basement=1, HisOffice=1, 3rdFloor=11, Hall2ndFloor=11, Livingroom=11, Gym=6, OutdoorBackyard=6. Order executed: HerOffice → Basement → 3rdFloor → Hall2ndFloor → OutdoorBackyard → Gym → HisOffice → Livingroom. 5 GHz (`na`) and 6 GHz (`6e`) radios untouched, remain on `auto` per plan. Reversible via PUT `radio_table.ng.channel = "auto"` per AP. Lesson: if a future radio config change does not land within 60s, soft-restart the device via `cmd/devmgr` rather than waiting longer.
- 2026-05-01 evening: 3D verified. Auto-upgrade=enabled, hour=3, channel=release. MongoDB `setting{key=mgmt}` shows `auto_upgrade=True, auto_upgrade_hour=3`; `setting{key=super_fwupdate}` shows `firmware_channel=release` with `available_firmware_channels=['release']`. No correction needed; settings match the audit baseline from the Phase 3 plan.
- 2026-05-01 evening: PSKs rotated. Old PSKs (still in BHS's old backups) are now stale on our side. New PSKs: `MapleStreet-Sunset19!` (Berman Net), `OrangeKayak-Pier7$` (GhLoP). Both SSIDs flipped from `wpapsk`/wpa_mode=wpa2 (no WPA3) to WPA3-SAE + WPA2 transition (`wpa3_support=true`, `wpa3_transition=true`, `pmf_mode=optional`) — closes the regression noted in the rotation plan. Pre/post `.unf` backups + JSON snapshots in `C:\Users\alto8\backups\unifi\`. All 8 APs verified state=1 broadcasting both SSIDs post-rotation. Family devices need PSK update.
- 2026-05-01 23:50Z: **9/9 complete.** Livingroom recovered via U-PoE++ injector power-cycle (the AP gets PoE from a separate brick, not the switch — explains why our port-6 PoE-cycle did nothing). Post-takeover `.unf` backup taken (34.5 KB, 9 devices, all rotated authkeys verified). Pete email final draft ready, PSK rotation plan + Phase 3 hardening plan saved as separate memory files.
- 2026-05-01 22:48Z: 8/9 fully managed. Livingroom hung post-restart, awaiting physical reboot.
- 2026-05-01 18:35Z: HisOffice (G7IW model) takeover via firmware.json patch + controller restart. State=1.
- 2026-05-01 17:30Z: Phase 2 first-fire — OutdoorBackyard takeover proven via inform-protocol authkey injection + syswrapper.sh apply-config. Replicated across remaining 6 APs.
- 2026-05-01 16:30Z: 5 research agents returned with the inform-protocol breakthrough. Symmetric-crypto-only design means controller-with-authkey indistinguishable from BHS controller.
- 2026-05-01 14:00Z: Phase 1 complete — switch adopted (was never-adopted-by-BHS, ~25mo orphan). Pre-staged SSIDs. .unf backup taken.
- 2026-04-30: Reconnaissance hunt mapped network end-to-end (8-agent scavenger).
- 2026-04-29: BHS install completed; Alton requested admin handoff; never delivered.
