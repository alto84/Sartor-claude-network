---
name: network-management
description: Use when about to make a change to the Sartor home network — view/add/remove SSID, rotate PSKs, restart an AP, take or restore a backup, investigate a client, or recover an unreachable device. Loads the network topology, the controller-access pattern, common operations, and the recovery playbooks from the 2026-05-01 takeover. Trigger when typing "UniFi", "192.168.1.171", "Berman", "AP", "PSK", or thinking about WiFi/router changes.
---

# network-management — operating the Sartor-Saxena-Claude Network

The home network is fully Sartor-administered as of the 2026-05-01 takeover. This skill is the operational manual; the takeover narrative + lessons-learned + per-AP authkeys live in [[unifi-takeover-2026-05-01-INDEX]] and [[unifi-takeover-2026-05-01]] (canonical playbook). Read those once for context; come back here for day-to-day ops.

## Topology summary

| Layer | Component | Where |
|---|---|---|
| WAN | Verizon Fios CR1000A | `https://192.168.1.1` (DHCP server, only L3 gateway, DMZ host = `192.168.1.100`) |
| Switch | UniFi USW-Pro-Max-24-PoE (1) | `192.168.1.170` |
| APs | 8× UniFi WiFi 7 (7×U7-Pro + 1×U7-Outdoor + 1×U7-PIW in-wall HisOffice) | switch ports 1-8 |
| Controller | UniFi local controller, runs on Rocinante | `https://192.168.1.171:8443` (inform port 8080) |
| Backing store | MongoDB | `mongodb://127.0.0.1:27117/ace` (loopback only, no auth) |
| Subnet | Single 192.168.1.0/24 | retiring legacy 192.168.86.x Nest mesh |

Full device-by-device map and SSID/PSK state in [[reference_home_network]].

## Final state of the takeover (one-paragraph)

On 2026-05-01 we executed a complete software-only takeover of the BHS-installed network — 9 devices total (1 switch + 8 APs) — without factory-resetting any device, without admin to the Verizon router, and without involving Berman Home Systems. The controller now runs on Rocinante. BHS's controller (`berman.gets-it.net:8443`) is blocked at every AP via boot-time iptables rules. PSKs were rotated, SSIDs consolidated to a single `LGP123`, 6 GHz enabled, 2.4 GHz channels pinned 1/6/11, and a daily 3 AM backup wired. BHS retains stale device records labeled "Disconnected" on their side; they cannot push to our devices.

## Access patterns

### Controller (web UI + API)

```bash
# URL: https://192.168.1.171:8443
# Username: alton
# Password (post-Bitwarden migration):  sartor-secret read 'UniFi superadmin'
# Pre-migration leak: see takeover doc credentials section; rotate during 'UniFi superadmin' migration
```

For programmatic access, use the cookie-based API:

```bash
COOKIES=$(mktemp); chmod 600 "$COOKIES"
curl -sk --cookie-jar "$COOKIES" --cookie "$COOKIES" \
    -H "Content-Type: application/json" \
    -X POST "https://192.168.1.171:8443/api/login" \
    -d "$(printf '{"username":"alton","password":"%s","remember":false}' "$(sartor-secret read 'UniFi superadmin')")"

# Use the cookie jar for subsequent calls
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/stat/device" | jq .

rm -f "$COOKIES"
```

Common API endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/s/default/stat/device` | All adopted devices, state, vap_count |
| `GET /api/s/default/stat/sta` | Active client (station) list |
| `GET /api/s/default/list/wlanconf` | SSIDs |
| `PUT /api/s/default/rest/wlanconf/<id>` | Edit SSID (PSK, channel, security) |
| `POST /api/s/default/cmd/devmgr` | Device commands: `restart`, `power-cycle`, `force-provision` |
| `POST /api/s/default/cmd/backup` | Trigger a backup |
| `GET /dl/backup/<version>.unf` | Download the latest backup |

### SSH to APs / switch

```bash
ssh alton@<ip>           # password: sartor-secret read 'UniFi superadmin' UPPERCASE-L variant
                         # (UniFi requires uppercase first letter; one-shift on household-default)
# OR if device went un-adopted, factory ssh:
ssh ubnt@<ip>            # password: ubnt
```

When the alton SSH password gets rotated, the takeover doc's "Credentials" table will lag — vault is source of truth.

### MongoDB direct

```python
from pymongo import MongoClient   # pymongo<4 — UniFi MongoDB is wire-version 6
client = MongoClient('mongodb://127.0.0.1:27117', serverSelectionTimeoutMS=5000)
db = client['ace']
# Collections: device, wlan, user, setting, site, ...
db.device.find_one({'mac': '8c:ed:e1:7a:f2:bc'})  # by MAC
list(db.wlan.find({}, {'name':1, 'x_passphrase':1}))  # SSIDs + PSKs
```

Loopback only. No auth. Don't expose this port.

## Common operations

### List all devices and clients

```bash
# devices (APs + switch)
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/stat/device" \
    | jq '.data[] | {name, ip, model, state, vap_count: (.vap_table | length // 0)}'

# clients (active stations on WiFi or wired)
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/stat/sta" \
    | jq '.data[] | {hostname, ip, mac, ap_mac, signal, last_seen}' | head -60
```

### Change a WiFi PSK

```bash
# 1. Find the WLAN's id
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/list/wlanconf" \
    | jq '.data[] | {_id, name, security}'

# 2. PUT the new passphrase (the FULL config — UniFi REST is replace-style on PUT)
WLAN_ID=<id>
NEW_PSK=$(bw generate --uppercase --lowercase --number --length 24)  # PSK doesn't need special chars
# Save to vault first as 'WiFi LGP123 PSK' (or whichever SSID)
# ...then PUT the wlan with new x_passphrase

# 3. After save, family devices will lose connection — they need to re-key. Forewarn.
```

### Restart / power-cycle an AP

```bash
DEV_MAC=8c:ed:e1:7a:f2:bc
# Soft restart (preserves config; ~60s downtime)
curl -sk --cookie "$COOKIES" -H "Content-Type: application/json" \
    -X POST "https://192.168.1.171:8443/api/s/default/cmd/devmgr" \
    -d "{\"cmd\":\"restart\",\"mac\":\"$DEV_MAC\",\"reboot_type\":\"soft\"}"
```

For PoE-cycle (powered-from-switch APs only — Livingroom is on a separate U-PoE++ injector and won't respond to PoE-cycle):

```bash
SWITCH_MAC=58:d6:1f:86:e3:ff
PORT=2
curl -sk --cookie "$COOKIES" -H "Content-Type: application/json" \
    -X POST "https://192.168.1.171:8443/api/s/default/cmd/devmgr" \
    -d "{\"cmd\":\"power-cycle\",\"mac\":\"$SWITCH_MAC\",\"port_idx\":$PORT}"
```

### Locate-strobe an AP (blink LED for physical identification)

```bash
DEV_MAC=8c:ed:e1:7a:f2:bc
curl -sk --cookie "$COOKIES" -H "Content-Type: application/json" \
    -X POST "https://192.168.1.171:8443/api/s/default/cmd/devmgr" \
    -d "{\"cmd\":\"set-locate\",\"mac\":\"$DEV_MAC\"}"
# Disable: cmd=unset-locate
```

Used 2026-05-02 to disambiguate "Gym" vs "HerOffice" labeling (BHS controller had two APs swapped vs the patch panel).

### Take a backup on demand

The daily 3 AM scheduled task handles routine backups, but you can trigger one anytime:

```bash
TS=$(date '+%Y-%m-%d_%H%M')
curl -sk --cookie "$COOKIES" -X POST "https://192.168.1.171:8443/api/s/default/cmd/backup" \
    -H "Content-Type: application/json" -d '{"cmd":"backup","days":0}'
curl -sk --cookie "$COOKIES" \
    -o "C:/Users/alto8/backups/unifi/sartor-claude-network_${TS}.unf" \
    "https://192.168.1.171:8443/dl/backup/10.3.55.unf"
```

(`10.3.55` is the controller version path segment; update if you upgrade the controller.) The full scheduled-task script lives at `C:\Users\alto8\scripts\unifi-daily-backup.ps1`.

### Restore from a backup

```
Web UI: Settings → System → Backups → Upload Backup → choose .unf
```

This wipes current config and replaces. Use only for known-good rollback. The post-takeover `.unf` at `C:\Users\alto8\backups\unifi\sartor-claude-network-post-takeover_2026-05-01_1901.unf` is the canonical "restore-to-good" anchor.

> [!warning] `.unf` files contain everything
> The `.unf` backup format is reversibly encrypted with hardcoded AES-128-CBC keys (`bcyangkmluohmars` / IV `ubntenterpriseap`). Anyone with the file can decrypt all SSIDs, PSKs, and bcrypt admin password hashes via tools like `zhangyoufu/unifi-backup-decrypt`. Treat the backup directory as you would `.ssh/` — local-disk only, never in git.

## Recovery playbooks

### Symptom: AP shows "Disconnected" or state=0/2 in controller

1. **Ping the AP IP.** If it doesn't ping, it's a power/network-link issue, not software.
2. **If ping works, SSH to the AP:**
   ```bash
   ssh alton@<ip> 'mca-cli-op info | head -10'
   # Should show: Status: Connected (http://192.168.1.171:8080/inform)
   ```
3. **If `Status` shows BHS URL again** (shouldn't happen — boot-time iptables block prevents it, but if): re-run the takeover playbook step 4 (set-adopt + iptables block) — see [[unifi-takeover-2026-05-01]] §"The proven playbook".
4. **If AP pings but SSH dead**: software-stuck. Power-cycle:
   - Most APs: PoE-cycle via switch API (above)
   - **Livingroom** is on a separate U-PoE++ injector — physically unplug/replug the injector brick (not the switch port).

### Symptom: Switch shows "Disconnected"

The switch is the parent of all APs. If the switch falls off, all APs are inform-blind even if they're up.

1. Check Rocinante uptime — controller crash also causes "Disconnected" until the controller comes back.
2. Switch ping check: `ping 192.168.1.170`.
3. If switch dead, physical: the switch is a PoE injector for 7 of 8 APs; it dying means those APs go dark. Reseat power. If still dead, switch hardware failure — escalate.

### Symptom: Controller down (Rocinante reboot, JVM crash)

The controller auto-launches via tray app on Rocinante boot. If it doesn't:

```powershell
cd "C:\Users\alto8\Ubiquiti UniFi"
# Stop any zombie:
& "./jre/bin/java.exe" --add-opens java.base/java.lang=ALL-UNNAMED `
  --add-opens java.base/java.time=ALL-UNNAMED `
  --add-opens java.base/sun.security.util=ALL-UNNAMED `
  --add-opens java.base/java.io=ALL-UNNAMED `
  --add-opens java.rmi/sun.rmi.transport=ALL-UNNAMED `
  -jar lib/ace.jar stop

# Wait ~10s; confirm `java` process gone

# Start:
Start-Process -WindowStyle Hidden "./jre/bin/java.exe" -ArgumentList @(
  "--add-opens", "java.base/java.lang=ALL-UNNAMED",
  "--add-opens", "java.base/java.time=ALL-UNNAMED",
  "--add-opens", "java.base/sun.security.util=ALL-UNNAMED",
  "--add-opens", "java.base/java.io=ALL-UNNAMED",
  "--add-opens", "java.rmi/sun.rmi.transport=ALL-UNNAMED",
  "-Xmx1024M", "-jar", "lib/ace.jar", "start"
)
# Wait until https://localhost:8443/ returns 200 (15-30s for Spring boot)
```

Adopted APs cache their config; they continue broadcasting the last-pushed SSIDs and routing traffic during a controller outage. They just can't accept changes until it's back. Family WiFi is unaffected by short controller downtime.

### Symptom: Need to re-adopt a previously-managed device (e.g., factory reset, replaced board)

This is the takeover playbook applied to one device. See [[unifi-takeover-2026-05-01]] §"The proven playbook" for full detail. Compressed:

1. SSH to device with the BHS-era `ubnt:ubnt` (factory) or current `alton:<pwd>` (post-adopt). Read its current `mgmt.authkey` if it has one.
2. Verify the controller has the right model code in `firmware.json` — patch + restart controller if missing (G7IW alias was the in-wall AP case).
3. Pre-seed MongoDB with the device record: `mac`, `model`, `x_authkey`, `x_aes_gcm: True`, `inform_url: http://192.168.1.171:8080/inform`, `site_id` from any existing device.
4. On the device: append `iptables.1.cmd=-A OUTPUT -d 173.70.91.42 -j DROP` to `/tmp/system.cfg`, run `syswrapper.sh save-config && (syswrapper.sh apply-config &) && sleep 1 && syswrapper.sh set-adopt http://192.168.1.171:8080/inform <authkey>`.
5. Watch state in controller: 2 (Pending) → 4/5 (Adopting) → 1 (Connected) within 60-90s.

### Symptom: Forgot a stuck device record

```python
db.device.delete_one({'mac': '<mac>'})
```

Then re-trigger set-adopt on the AP. State 10 (managed-by-other) limbo dissolves.

## Per-AP authkeys

Adopted-state authkeys (current): in MongoDB at `db.device.find({'mac': M}).x_authkey`. A fresh `.unf` backup captures them.

Pre-takeover BHS authkeys (history): `C:\Users\alto8\backups\unifi\ap-authkeys-2026-05-01.json`. NOT git-tracked. Useful only if you need to re-adopt the device using the BHS-era key (which would only happen if you're undoing the takeover, which: don't).

If you need to rotate authkeys (no current reason — they're symmetric and BHS doesn't have the post-adoption ones), the controller can issue a re-adopt cycle which generates fresh keys.

## Phase 3 hardening — deferred items

| Item | Status | Why deferred |
|---|---|---|
| 3A: VLAN segmentation (Mgmt / IoT / Kids VLANs) | Deferred | Complex, disruptive, needs a planned weekend |
| 3B: 2.4 GHz channel re-plan to 1/6/11 | ✅ Done 2026-05-01 evening | — |
| 3C: IPv6 firewall audit | Deferred | OutdoorBackyard has globally-routable IPv6; audit needed |
| 3D: Auto-firmware-update window | ✅ Verified daily 3 AM ET, release channel | — |
| 6 GHz enable | ✅ Done | — |
| Pi-hole / NextDNS for kids | Deferred | Decision pending; depends on 3A timing |
| UCG-Pro replacement of CR1000A | Deferred | No timeline; CR1000A bridge mode is supported when ready |

## Open follow-ups (from the takeover INDEX)

1. **Physical Nest retirement** — once family devices migrate to LGP123, unplug Nest mesh root at switch port 22 (.163). See [[unifi-takeover-2026-05-01-nest-retirement]] for the safe sequence.
2. **Send the Pete email** — Gmail draft `r1648436912190611604` is queued; Alton's call when. Friendly framing + four security suggestions for BHS's default install template + Super Admin handoff request.
3. **Verify `mgmt_url`/`stun_url` on all 9 devices** show 192.168.1.171, not `berman.gets-it.net`. SSH each: `cat /etc/persistent/cfg/mgmt | grep -E "url"`. HisOffice + OutdoorBackyard already verified.
4. **Confirm hidden `letmeinnow` SSID stays gone** — periodic phone-side hidden-SSID scan.
5. **Rotate `UniFi superadmin` into Bitwarden** — currently leaked; uses Playbook 3 from `secrets-via-bitwarden`.

## Backup archive

`C:\Users\alto8\backups\unifi\` (NOT git-tracked, treat like `.ssh/`):

| File | Purpose |
|---|---|
| `sartor-claude-network_2026-05-01_1619.unf` | Fresh-controller, just the switch (pre-AP-takeover) |
| `sartor-claude-network_pre-psk-rotation_2026-05-01_1954.unf` | Pre-PSK-rotation snapshot |
| `sartor-claude-network_post-psk-rotation_2026-05-01_1957.unf` | Post-PSK-rotation snapshot |
| `sartor-claude-network-post-takeover_2026-05-01_1901.unf` | **Canonical post-takeover anchor** (use for restore-to-good) |
| `sartor-claude-network_auto_*.unf` | Daily auto-runs |
| `firmware.json.bak-20260501_1821` | Pre-G7IW-alias-patch snapshot |
| `ap-authkeys-2026-05-01.json` | Per-AP BHS pre-takeover authkeys |
| `wlanconf-pre-rotation_*.json` | WLAN config snapshots across PSK rotation |
| `ap-173-OutdoorBackyard-mgmt.bak` | First AP `/etc/persistent/cfg/mgmt` (proof-of-concept) |
| `backup-log.txt` | Append-only log of scheduled-task runs |

OneDrive parallel copy at `C:\Users\alto8\OneDrive\Documents\Sartor-network\backups\` for off-Rocinante durability.

## Operating reminders

- The controller IS Rocinante. If Rocinante reboots, controller comes back automatically (Java tray app). Extended Rocinante outage = APs run last-pushed config but no config changes accept.
- `mca-cli-op info` on each device should show `Status: Connected (http://192.168.1.171:8080/inform)`. If it ever shows the BHS URL, the iptables.1.cmd boot-time block should still keep BHS unreachable; check with `cat /etc/persistent/cfg/mgmt | grep url`.
- `ubnt:ubnt` SSH no longer works on adopted devices. Use `alton:<sartor-secret read 'UniFi superadmin' alton-ssh-variant>`. If both fail and the device is software-stuck, **physical power-cycle is the universal recovery.**
- BHS retains stale device records on their controller showing "Disconnected." They can't push to the devices (URL changed, authkey rotated, iptables block). They might "Forget" the entries on their side as housekeeping; doesn't affect us.

## Related project docs

The full takeover bundle lives at `sartor/memory/projects/unifi-takeover-2026-05-01-*`. Master index: [[unifi-takeover-2026-05-01-INDEX]]. Key children:

- [[unifi-takeover-2026-05-01]] — canonical playbook, credentials, lessons-learned. **Read once.**
- [[unifi-takeover-2026-05-01-report]] — user-facing day report with cyberpunk narrative
- [[unifi-takeover-2026-05-01-network-census]] — mid-state census ~21:45 ET 2026-05-01
- [[unifi-takeover-2026-05-01-final-census]] — final clean state ~22:30 ET
- [[unifi-takeover-2026-05-01-nest-retirement]] — Nest mesh retirement plan + 75 GB anomaly investigation
- [[unifi-takeover-2026-05-01-phase3-hardening-plan]] — Phase 3 hardening menu (3A/3C deferred)
- [[unifi-takeover-2026-05-01-psk-rotation-plan]] — PSK rotation plan (executed)
- [[unifi-takeover-2026-05-01-kidsroom-speaker]] — `Kids room speaker.p,` SSID investigation
- [[unifi-takeover-2026-05-01-unknown-laptop]] — `LAPTOP-C4A43U6V` identification
- [[unifi-takeover-2026-05-01-cleanup-summary]] — 2026-05-02 post-takeover tidy-up
- [[unifi-takeover-2026-05-01-pete-email-FINAL]] — drafted handoff email to BHS

## What this skill does NOT cover

- Sonos / Google Nest device-level operations — see device-specific knowledge in family memory
- WAN-side configuration on the Verizon CR1000A — see [[reference_home_network]] and the Fios-admin sticker password. Until UCG-Pro replaces it, CR1000A admin is pure web UI through Chrome MCP.
- VLAN design (Phase 3A) — deferred; will need its own skill or expansion when planned
