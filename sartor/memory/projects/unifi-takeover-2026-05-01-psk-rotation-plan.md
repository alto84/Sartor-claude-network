---
name: unifi-takeover-2026-05-01-psk-rotation-plan
description: Proposed PSK rotation plan for Berman Net + GhLoP SSIDs. Pre-execution; awaiting Alton's approval.
type: plan
status: proposed-pending-approval
date: 2026-05-01
related:
  - projects/unifi-takeover-2026-05-01
---

# PSK Rotation Plan — Berman Net + GhLoP

> Status: **proposed, not executed**. Read-only API verification done; no writes performed. Two SSIDs confirmed in controller `https://192.168.1.171:8443`:
>
> - `Berman Net` — `_id = 69f509c2d12b0e3605bfafca`, security `wpapsk`, current PSK length 10 (matches `9732398870`)
> - `GhLoP` — `_id = 69f509f4d12b0e3605bfafcf`, security `wpapsk`, current PSK length 10 (matches `$uga($pi(e`)
>
> Heads-up for Alton: project doc lists these as "WPA3-SAE + WPA2 transition" but the live config is plain `wpapsk` (WPA2-PSK only, `wpa3_support=False`). Rotation does not require fixing that, but it is a separate cleanup worth doing while the WLAN edit pane is open.

## Section 1: Proposed new PSKs

Two candidates per SSID. All are 16-22 chars, mixed case, digits, 1-2 specials, distinct from each other, distinct from BMC/controller `;lkjpoiu0987`, distinct from device-SSH `;Lkjpoiu0987`, distinct from BHS-set `9732398870` and `$uga($pi(e`. Memorable / passphrase-style so Alton can speak them to family at the table.

**`Berman Net`** (everyday family network):

- Candidate A: `MapleStreet-Sunset19!`  (22 chars; street+time+digits+1 special)
- Candidate B: `Sartor-Ridgeway-2026`   (20 chars; surname+road-style noun+year, hyphens count toward length, only one special-ish char)

**`GhLoP`** (alt SSID, kept distinct):

- Candidate A: `OrangeKayak-Pier7$`     (18 chars; kid-friendly noun pair + digit + special)
- Candidate B: `Crescent.Otter.4291`    (19 chars; three-tokens-with-dots passphrase, one digit run, 1 special class via `.`)

Alton: pick one from each row, or modify in place. The two chosen PSKs must remain different from each other.

## Section 2: Execution sequence

All steps run from a workstation that can reach `192.168.1.171:8443`.

### 2.1 Pre-flight

1. Re-auth and snapshot current state (read-only):

   ```bash
   curl -sk -c /tmp/uc.txt -X POST -H "Content-Type: application/json" \
     -d '{"username":"alton","password":";lkjpoiu0987"}' \
     https://192.168.1.171:8443/api/login

   curl -sk -b /tmp/uc.txt https://192.168.1.171:8443/api/s/default/rest/wlanconf \
     > /tmp/wlanconf-pre.json
   ```

2. Take a fresh `.unf` backup labelled `pre-psk-rotation` via Settings -> System -> Backup -> Download Backup, save to `C:\Users\alto8\backups\unifi\pre-psk-rotation-2026-05-01.unf`. Do NOT commit to git.

3. Confirm both `_id` values match the ones above. Abort if either is missing.

### 2.2 API write — exact calls

UniFi controller v5/v6 REST. The endpoint is `PUT /api/s/default/rest/wlanconf/<_id>` with the new `x_passphrase` (and optionally `wpa_mode` / `wpa3_support` if Alton wants to add WPA3 transition at the same time).

```bash
# Berman Net
curl -sk -b /tmp/uc.txt -X PUT \
  -H "Content-Type: application/json" \
  -d '{"x_passphrase":"<NEW_BERMAN_PSK>"}' \
  https://192.168.1.171:8443/api/s/default/rest/wlanconf/69f509c2d12b0e3605bfafca

# GhLoP
curl -sk -b /tmp/uc.txt -X PUT \
  -H "Content-Type: application/json" \
  -d '{"x_passphrase":"<NEW_GHLOP_PSK>"}' \
  https://192.168.1.171:8443/api/s/default/rest/wlanconf/69f509f4d12b0e3605bfafcf
```

Each call returns `meta.rc=ok` plus the updated object. Persist responses to `/tmp/wlanconf-post-bermannet.json` and `/tmp/wlanconf-post-ghlop.json`.

### 2.3 Order of operations

1. Rotate **`GhLoP` first** (lower-traffic SSID; if anything is wrong, fewer family devices kicked).
2. Verify GhLoP (Section 5 checks 1-5).
3. Then rotate **`Berman Net`** (the everyday SSID).
4. Verify Berman Net.
5. Update the memory file (Section 2.5).

### 2.4 Per-step validation

Between step 1 and step 3, and again after step 3:

- `curl ... /api/s/default/rest/wlanconf` — confirm both SSIDs still listed, both `enabled=true`, `x_passphrase` of the just-rotated SSID matches what we set.
- Phone test: a family phone "forgets" the SSID, then attempts to join with the **OLD** PSK (must fail), then with the **NEW** PSK (must succeed and pull DHCP). Use Alton's phone for Berman Net, any spare device for GhLoP.
- AP broadcast confirmation: from the controller UI, Devices -> any AP -> RF environment, or SSH to an AP and `iwlist wlan0 scan | grep ESSID` to confirm both ESSIDs are still being announced.

### 2.5 Documentation

Update `sartor/memory/projects/unifi-takeover-2026-05-01.md` WiFi PSK table (lines 52-56): replace the two PSK cells with the new values, mark "Status" as `rotated 2026-05-01, BHS-knowledge closed`, and bump the file's `updated:` frontmatter. Keep the file local-disk only (already covered by takeover doc's secrecy note, line 16).

## Section 3: Rollback

If a rotation breaks something (controller bug, mass disconnect, family device firmware that refuses the new PSK):

1. Re-issue the same `PUT` with the **old** PSK as `x_passphrase`:
   - Berman Net old: `9732398870`
   - GhLoP old: `$uga($pi(e`
2. Confirm with a follow-up `GET /api/s/default/rest/wlanconf` that the old value is back.
3. If the controller itself is broken, restore the `pre-psk-rotation-2026-05-01.unf` backup via Settings -> System -> Restore.
4. Document the abort in the project file with the failure mode, then schedule a retry once root cause is known. Old PSKs remain "BHS-known" until the retry succeeds — note that risk in the file.

## Section 4: Risk and impact

- **Affected**: 10-15 wireless clients (Alton/Aneeta phones + laptops, AZ work laptop, three kids' iPads/phones/Kindles, Peloton, Nest). Each needs PSK re-entered manually.
- **Unaffected**: Sonos Amps x6 (wired), LG OLED (wired), Apple TV Office (wired), any other hard-wired gear.
- **Disruption pattern**: rolling. Phones will keep trying the cached old PSK and silently fail until a human opens settings and types the new one. Expect "internet broken" complaints from kids.
- **Worst case**: every wireless device offline simultaneously; AZ work laptop loses VPN mid-meeting; Alton has to walk each kid through PSK entry.
- **Recommended window**: weekday morning **after 8:30am** (kids at school, Aneeta at work, AZ laptop quiet) **OR** late evening after 10pm. **Avoid** 5-9pm dinner/homework/bedtime block. Holding the rotation until Friday 9am or Saturday early morning gives the most slack.

## Section 5: Validation criteria

After both rotations complete, all six must hold:

1. `GET /api/s/default/rest/wlanconf` returns both SSIDs with `enabled=true`.
2. `x_passphrase` field on each matches the new value Alton chose (byte-for-byte).
3. Both SSIDs broadcasting (phone WiFi scan or AP `iwlist scan` shows both ESSIDs).
4. One test client per SSID joins successfully with the new PSK and gets DHCP.
5. One test client per SSID is **rejected** when offering the old PSK.
6. `unifi-takeover-2026-05-01.md` PSK table reflects the new values; `updated:` frontmatter bumped to 2026-05-01.

If any of 1-5 fail, execute Section 3 rollback and re-plan.
