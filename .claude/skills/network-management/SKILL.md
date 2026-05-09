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
| Switch | UniFi USW-Pro-Max-24-PoE (1) | `192.168.1.170`, MAC `58:d6:1f:86:e3:ff`, fw 7.4.1.16850 |
| APs | 8× UniFi WiFi 7 (7×U7-Pro + 1×U7-Outdoor + 1×U7-PIW in-wall HisOffice) | switch ports 1-8 |
| Controller | UniFi local controller v10.3.55, runs on Rocinante | `https://192.168.1.171:8443` (inform port 8080) |
| Backing store | MongoDB | `mongodb://127.0.0.1:27117/ace` (loopback only, no auth) |
| Subnet | Single 192.168.1.0/24 | retiring legacy 192.168.86.x Nest mesh |

### AP-to-switch-port map (verified live 2026-05-03)

| AP | IP | MAC | Switch port | Firmware |
|---|---|---|---|---|
| Hall2ndFloor (U7-Pro) | 192.168.1.167 | `a8:9c:6c:64:70:14` | 1 | 8.5.21.18681 |
| HerOffice (U7-Pro) | 192.168.1.165 | `8c:ed:e1:7a:f2:bc` | 2 | 8.5.21.18681 |
| Gym (U7-Pro) | 192.168.1.168 | `9c:05:d6:b0:53:d2` | 3 | 8.5.21.18681 |
| Basement (U7-Pro) | 192.168.1.183 | `a8:9c:6c:62:ea:20` | 4 | 8.5.21.18681 |
| 3rdFloor (U7-Pro) | 192.168.1.166 | `8c:ed:e1:7a:86:ac` | 5 | 8.5.21.18681 |
| Livingroom (U7-Pro) | 192.168.1.185 | `8c:ed:e1:7a:8a:04` | 6 (downstream AV switch + separate U-PoE++ injector — NOT switch PoE) | 8.5.21.18681 |
| OutdoorBackyard (U7-Outdoor) | 192.168.1.173 | `58:d6:1f:a8:36:58` | 7 | 8.5.21.18681 |
| HisOffice (U7-PIW in-wall, model code G7IW aliased to U7PIW) | 192.168.1.186 | `1c:0b:8b:6e:6d:e3` | 8 | 8.5.21.18681 |

Switch port 22 = "Google Nest (retiring)" leg (192.168.1.163). Port 24 = uplink to Verizon Fios. Note the BHS-mislabel-fix on 2026-05-02: Gym/HerOffice/Basement labels were swapped vs. the patch panel; the table above reflects physical truth post-rename. **`reference_home_network.md` lags this rename and shows the old swapped IPs (Gym=.165 etc.) — trust this table or the live `/stat/device` API, not that file, until it's updated.**

Full device-by-device map and SSID/PSK state in [[reference_home_network]] (with the caveat above).

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

> [!note] `jq` is NOT installed on Rocinante
> Every shell example below would normally pipe through `jq`. On Rocinante, use `python -c "import sys,json; data=json.load(sys.stdin); ..."` instead. The samples below show the python pattern. If you're on a peer that has jq, the jq form (commented) is interchangeable. Optionally install via `winget install jqlang.jq`.

For programmatic access, use the cookie-based API:

```bash
COOKIES=$(mktemp); chmod 600 "$COOKIES"
curl -sk --cookie-jar "$COOKIES" --cookie "$COOKIES" \
    -H "Content-Type: application/json" \
    -X POST "https://192.168.1.171:8443/api/login" \
    -d "$(printf '{"username":"alton","password":"%s","remember":false}' "$(sartor-secret read 'UniFi superadmin')")"

# Use the cookie jar for subsequent calls (python-based formatting since jq is absent)
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/stat/device" \
    | python -c "import sys,json; [print(d['name'], d['ip'], d['state']) for d in json.load(sys.stdin)['data']]"

rm -f "$COOKIES"
```

For non-trivial API work, prefer a single python script with `urllib.request` + `http.cookiejar` (an end-to-end example is in the "Verified end-to-end recipe" section at the bottom of this skill). It's more reliable on Windows than chained curls and bash-quoting.

Common API endpoints (verified 2026-05-03):

| Endpoint | Purpose |
|---|---|
| `POST /api/login` | Cookie-based auth; body `{"username","password","remember":false}` |
| `GET /api/s/default/stat/sysinfo` | Controller version, build, uptime |
| `GET /api/s/default/stat/device` | All adopted devices, state, vap_count |
| `GET /api/s/default/stat/sta` | Active client (station) list |
| `GET /api/s/default/list/wlanconf` | SSIDs |
| `PUT /api/s/default/rest/wlanconf/<id>` | Edit SSID (PSK, channel, security) |
| `GET /api/s/default/rest/networkconf` | LAN networks / VLAN definitions |
| `GET /api/s/default/rest/setting` | All site-level settings (mgmt, super_fwupdate, autobackup, etc.) |
| `GET /api/stat/admin` | Controller admin accounts (no `/s/default/` prefix) |
| `GET /api/self/sites` | Sites visible to this admin |
| `POST /api/s/default/cmd/devmgr` | Device commands: `restart`, `power-cycle`, `force-provision`, `set-locate`, `unset-locate` |
| `POST /api/s/default/cmd/backup` | Trigger a backup; response `data[0].url` is the relative download path |
| `GET /dl/backup/<version>.unf` | Download backup at a controller-version-specific path (today: `10.3.55.unf`) |

State integers on devices: `1=Connected`, `2=Pending Adoption`, `4=Updating/Upgrading`, `5=Provisioning`, `6=Heartbeat Missed/Disconnected`, `10=Adoption Failed (managed-by-other)`, `11=Isolated`. The web UI surfaces these as human strings.

### SSH to APs / switch

UniFi devices require an uppercase letter in the SSH password, so the on-device `alton` password is a one-shift variant of the household-default (uppercase first character). Treat it as a separate credential from the controller-admin password.

```bash
ssh alton@<ip>           # password: sartor-secret read 'UniFi device SSH'   (NOT 'UniFi superadmin')
# OR if device went un-adopted, factory ssh:
ssh ubnt@<ip>            # password: ubnt
```

<!-- PROPOSED: vault-naming clarification
The skill currently references the SSH password by the made-up name `'UniFi superadmin' alton-ssh-variant`,
but `sartor-secret read` only takes a name and `--field {password|username|uri|totp|notes}`. There is no
"variant" parameter. Two paths to fix:
  (a) Create a SECOND vault item `UniFi device SSH` holding the uppercase-L variant (what this section now points at).
  (b) Store the SSH variant as the `notes` field on the existing `UniFi superadmin` item and read with
      `sartor-secret read 'UniFi superadmin' --field notes`.
Recommend (a) — clearer separation, two distinct credentials in two distinct entries. Action: when migrating
'UniFi superadmin' into Bitwarden (Phase 3 follow-up), create both entries at the same time and update the
service inventory in `.claude/skills/secrets-via-bitwarden/SKILL.md` to add the row.
-->

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
# devices (APs + switch) — python because jq is not on Rocinante
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/stat/device" \
    | python -c "import sys,json; [print(f\"{d['name']:25s} {d['ip']:15s} model={d['model']:8s} state={d['state']} ver={d.get('version','?'):20s} vaps={len(d.get('vap_table',[]))}\") for d in json.load(sys.stdin)['data']]"

# clients (active stations on WiFi or wired)
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/stat/sta" \
    | python -c "import sys,json; [print(f\"{d.get('hostname','?'):20s} {d.get('ip','?'):15s} {d.get('mac'):17s} ap={d.get('ap_mac','wired'):17s} sig={d.get('signal','?')}\") for d in json.load(sys.stdin)['data']]"
```

### Change a WiFi PSK

```bash
# 1. Find the WLAN's id
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/list/wlanconf" \
    | python -c "import sys,json; [print(d['_id'], d['name'], d.get('security')) for d in json.load(sys.stdin)['data']]"
# As of 2026-05-03, the only SSID is 'LGP123' at _id=69f509f4d12b0e3605bfafcf

# 2. PUT the new passphrase. UniFi REST PUT is REPLACE-style — pull the whole object, mutate
#    the field, push back. Don't try to send a partial diff.
NEW_PSK=$(bw generate --uppercase --lowercase --number --length 24)  # PSK doesn't need special chars
#    Save to vault FIRST as 'WiFi LGP123 PSK' (or whichever SSID name is current)
#    via `bw create item ...` so a vault entry exists before the rotation, per
#    secrets-via-bitwarden Migration recipe step 3.

# Pattern for the PUT — capture the wlan object, mutate, send. Avoids ever putting NEW_PSK in argv:
WLAN_ID=69f509f4d12b0e3605bfafcf
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/list/wlanconf" \
    | NEW_PSK="$NEW_PSK" python -c "
import sys,json,os
data = json.load(sys.stdin)['data']
wlan = next(w for w in data if w['_id']==os.environ.get('WLAN_ID','$WLAN_ID'))
wlan['x_passphrase'] = os.environ['NEW_PSK']
sys.stdout.write(json.dumps(wlan))
" > /tmp/.wlan-patch.json
chmod 600 /tmp/.wlan-patch.json

curl -sk --cookie "$COOKIES" -H "Content-Type: application/json" \
    -X PUT "https://192.168.1.171:8443/api/s/default/rest/wlanconf/${WLAN_ID}" \
    --data @/tmp/.wlan-patch.json
rm -f /tmp/.wlan-patch.json
unset NEW_PSK

# 3. Pre-PUT and post-PUT, snapshot the wlanconf JSON to backups dir for rollback:
#    curl ... /list/wlanconf > C:/Users/alto8/backups/unifi/wlanconf-pre-rotation_$(date +%Y-%m-%d_%H%M).json

# 4. After save, family devices will lose connection — they need to re-key. Forewarn Alton + Aneeta
#    (use a household chat/email; do NOT broadcast new PSK in chat; share via password manager).
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

### Investigate a specific client by MAC or IP

```bash
# All active stations, filtered:
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/stat/sta" \
    | python -c "
import sys,json
target = '8c:ed:e1:'  # MAC prefix or substring
for s in json.load(sys.stdin)['data']:
    if target in (s.get('mac','') + ' ' + s.get('ip','') + ' ' + (s.get('hostname') or '')):
        print(json.dumps({k: s.get(k) for k in ['hostname','ip','mac','ap_mac','signal','noise','tx_rate','rx_rate','last_seen','essid','radio_proto','authorized']}, indent=2))
"

# Historical client lookup (includes recently-disconnected; longer but needed for deauth investigations):
curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/list/user" \
    | python -c "import sys,json; [print(u.get('hostname'), u.get('mac'), u.get('last_seen')) for u in json.load(sys.stdin)['data'][:50]]"
```

### Rename an AP or relabel a switch port

```bash
# Rename AP (PUT to /rest/device/<id>):
DEV_ID=$(curl -sk --cookie "$COOKIES" "https://192.168.1.171:8443/api/s/default/stat/device" \
    | MAC=8c:ed:e1:7a:f2:bc python -c "import sys,json,os; print(next(d['_id'] for d in json.load(sys.stdin)['data'] if d['mac']==os.environ['MAC']))")
curl -sk --cookie "$COOKIES" -H "Content-Type: application/json" \
    -X PUT "https://192.168.1.171:8443/api/s/default/rest/device/${DEV_ID}" \
    -d '{"name":"NewName"}'

# Relabel switch port — use the switch's port_overrides array:
# 1. GET the switch device, copy port_overrides
# 2. Edit the entry where port_idx == N, set 'name': 'NewLabel'
# 3. PUT the full modified port_overrides back via /rest/device/<switch_id>
```

### Trigger firmware upgrade on a device

Auto-firmware-update is enabled (3 AM ET, release channel) — the controller pushes new firmware automatically. To force-upgrade out of band:

```bash
curl -sk --cookie "$COOKIES" -H "Content-Type: application/json" \
    -X POST "https://192.168.1.171:8443/api/s/default/cmd/devmgr" \
    -d '{"cmd":"upgrade","mac":"<DEV_MAC>"}'
# Device transitions state=4 (Updating) for ~3-5 min, then returns to state=1.
```

Don't bulk-upgrade all devices simultaneously — kills WiFi for the duration.

### Take a backup on demand

The daily 3 AM scheduled task handles routine backups; trigger an extra one only when you're about to do something risky and want a fresh anchor. Don't trigger spuriously — each one bloats the backups dir.

The robust pattern reads the download URL from the trigger response so it doesn't break when the controller is upgraded (the URL path includes the version, today `10.3.55.unf`):

```bash
TS=$(date '+%Y-%m-%d_%H%M')
RESP=$(curl -sk --cookie "$COOKIES" -X POST \
    "https://192.168.1.171:8443/api/s/default/cmd/backup" \
    -H "Content-Type: application/json" -d '{"cmd":"backup","days":0}')
URL_PATH=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data'][0]['url'])")
curl -sk --cookie "$COOKIES" \
    -o "C:/Users/alto8/backups/unifi/sartor-claude-network_${TS}.unf" \
    "https://192.168.1.171:8443${URL_PATH}"
```

The full scheduled-task script (canonical reference for the python-and-PowerShell pattern) lives at `C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\unifi-daily-backup.ps1`. It logs to `backup-log.txt` in the backups dir and pushes an off-site SCP copy to rtxserver at `alton@192.168.1.157:/home/alton/sartor-network-backups/`. If the script ever fails, check that log first.

To verify the scheduled task is healthy:

```powershell
schtasks /Query /TN "UniFi Daily Backup" /V /FO LIST | Select-String "TaskName|Status|Last Run|Last Result|Next Run"
# Last Result should be 0 (success). Status: Ready (between runs) or Running (during 3 AM window).
```

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
4. On the device: append the boot-time iptables block + invoke `set-adopt`. The block target IP is the BHS controller's residential FiOS IP (was `173.70.91.42` on 2026-05-01; **re-verify before use** — it's a Verizon residential IP and may have changed). The block prevents the device from re-establishing inform with BHS on the next boot:
   ```
   echo 'iptables.1.cmd=-A OUTPUT -d 173.70.91.42 -j DROP' >> /tmp/system.cfg
   syswrapper.sh save-config
   (syswrapper.sh apply-config &) ; sleep 1
   syswrapper.sh set-adopt http://192.168.1.171:8080/inform <authkey>
   ```
   To re-confirm the BHS IP today: `dig +short berman.gets-it.net` from any peer with DNS (gpuserver1 or rtxserver).
5. Watch state in controller: 2 (Pending) → 4/5 (Adopting/Provisioning) → 1 (Connected) within 60-90s.

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
| `sartor-claude-network_auto_*.unf` | Daily auto-runs (local copies older than 30 days auto-pruned) |
| `firmware.json.bak-20260501_1821` | Pre-G7IW-alias-patch snapshot |
| `ap-authkeys-2026-05-01.json` | Per-AP BHS pre-takeover authkeys |
| `wlanconf-pre-rotation_*.json` | WLAN config snapshots across PSK rotation |
| `ap-173-OutdoorBackyard-mgmt.bak` | First AP `/etc/persistent/cfg/mgmt` (proof-of-concept) |
| `backup-log.txt` | Append-only log of scheduled-task runs |

Off-site copy: every auto-run is SCPed to rtxserver at `alton@192.168.1.157:/home/alton/sartor-network-backups/` (kept indefinitely there). Note: an early version of the script also pushed to OneDrive (`C:\Users\alto8\OneDrive\Documents\Sartor-network\backups\`); the current script does not. The lone OneDrive copy from 2026-05-01 21:58 remains as a one-off. **rtxserver is the canonical off-site archive.**

> [!warning] If `.unf` backups themselves go bad
> If a fresh `.unf` won't decrypt (rare — would mean controller corruption), fall back to:
> 1. The post-takeover anchor (`sartor-claude-network-post-takeover_2026-05-01_1901.unf`).
> 2. The rtxserver SCP archive (`ssh alton@192.168.1.157 ls -la /home/alton/sartor-network-backups/`).
> 3. The wlanconf JSON snapshots in this dir (per-SSID surgical restore via PUT to `/api/s/default/rest/wlanconf/<id>`).
> 4. As last resort: re-run the takeover playbook from `unifi-takeover-2026-05-01.md` against the existing devices (their authkeys are still in their own flash; you rebuild MongoDB state from scratch).

## Verified end-to-end recipe (python — copy/paste skeleton)

This is the most reliable shape for any non-trivial UniFi API work on Rocinante. Copy, edit, run. Verified 2026-05-03 against controller v10.3.55.

```python
import json, ssl, urllib.request, http.cookiejar, subprocess

# Get password from vault — never inline the value
pwd = subprocess.run(
    ['sartor-secret', 'read', 'UniFi superadmin'],
    capture_output=True, text=True, check=True,
).stdout

ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx),
)

# Login
data = json.dumps({'username': 'alton', 'password': pwd, 'remember': False}).encode()
req = urllib.request.Request(
    'https://192.168.1.171:8443/api/login',
    data=data, headers={'Content-Type': 'application/json'},
)
assert json.loads(opener.open(req).read())['meta']['rc'] == 'ok'
del pwd

# GET — list devices
devices = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/stat/device'
).read())['data']
for d in devices:
    print(d['name'], d['ip'], 'state=', d['state'])

# POST — example: trigger locate-strobe on a specific AP
mac = '8c:ed:e1:7a:f2:bc'
body = json.dumps({'cmd': 'set-locate', 'mac': mac}).encode()
req = urllib.request.Request(
    'https://192.168.1.171:8443/api/s/default/cmd/devmgr',
    data=body,
    headers={'Content-Type': 'application/json'},
    method='POST',
)
print(json.loads(opener.open(req).read())['meta']['rc'])
```

This avoids: bash quoting issues for JSON bodies on Windows, jq's absence, and the `mktemp` / `$COOKIES` choreography. For one-off interactive curls, the `$COOKIES` pattern shown earlier works; for anything you'll run twice, write it as python.

## Operating reminders

- The controller IS Rocinante. If Rocinante reboots, controller comes back automatically (Java tray app). Extended Rocinante outage = APs run last-pushed config but no config changes accept.
- `mca-cli-op info` on each device should show `Status: Connected (http://192.168.1.171:8080/inform)`. If it ever shows the BHS URL, the iptables.1.cmd boot-time block should still keep BHS unreachable; check with `cat /etc/persistent/cfg/mgmt | grep url`.
- `ubnt:ubnt` SSH no longer works on adopted devices. Use `alton:$(sartor-secret read 'UniFi device SSH')` — that's a SEPARATE vault entry from `UniFi superadmin` (different value: capital-L variant of household-default; UniFi requires uppercase). If both fail and the device is software-stuck, **physical power-cycle is the universal recovery.**
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

## Related skills

- `secrets-via-bitwarden` — credential retrieval. The vault is the source of truth for `UniFi superadmin` and (proposed) `UniFi device SSH` entries. When rotating the controller admin password, follow Playbook 3 in that skill.
- `chrome-automation` — when you need the controller web UI for something the API doesn't expose (the UI surfaces some legacy settings via JS-only modals). Also the only way into the CR1000A Verizon router admin.
- `peer-comms` — if you need to verify the off-site backup landed on rtxserver, or use rtxserver's DNS to re-resolve `berman.gets-it.net` for re-adoption work.
- `distributed-systems-debugging` — if multiple APs appear stuck simultaneously and you need a structured approach beyond the per-symptom playbooks.

## What this skill does NOT cover

- Sonos / Google Nest device-level operations — see device-specific knowledge in family memory
- WAN-side configuration on the Verizon CR1000A — see [[reference_home_network]] and the Fios-admin sticker password (vault: `Fios admin`). Until UCG-Pro replaces it, CR1000A admin is pure web UI through Chrome MCP.
- VLAN design (Phase 3A) — deferred; will need its own skill or expansion when planned
- Adding a new SSID (e.g., guest network) — the API supports it (POST to `/api/s/default/rest/wlanconf` with a full wlan object) but the JSON shape is non-trivial and varies across controller versions. When the time comes, capture the existing `LGP123` wlanconf as a template, edit name/PSK/`is_guest`/etc., POST. Pre-snapshot before, verify on phones after.
- Adding/removing a managed device — same as the re-adoption playbook above.

## Decision tree — when to invoke this skill

```
About to: change WiFi PSK / add SSID / restart AP / take backup / restore backup ──→ this skill
About to: investigate "WiFi is slow" / unknown device / weird signal              ──→ this skill (start with stat/sta + stat/device)
About to: look at the controller web UI for the first time                        ──→ this skill (for the URL + creds pattern)
About to: change anything on the Verizon Fios router (192.168.1.1)                ──→ chrome-automation + reference_home_network
About to: change DNS / DHCP scope / port forward                                  ──→ Verizon Fios router (currently L3 gateway), NOT UniFi
About to: investigate a peer machine being unreachable on the LAN                 ──→ peer-comms + this skill (use stat/sta to see if the peer's MAC is associated)
After: any change to skill content here                                           ──→ git commit + push to origin (rtxserver bare); GitHub mirrors nightly
```
