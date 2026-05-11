"""Fleet-wide WiFi posture upgrade per Alton's directive 2026-05-09:
'Widen all 5 GHz to 80 MHz. Open the bandwidth. Low effort, high reliability over time.'

Three changes, all reversible:
  1. All 5 GHz radios (wifi1) on every AP: ht 40 -> 80 MHz
  2. LGP123 SSID: enable 802.11r (fast roaming) - is_11r=True
  3. LGP123 SSID: enable band steering preferring 5 GHz

Pre-change state captured to JSON in case of rollback. Post-change verification
prints the new state so you can eyeball it.
"""
import json, ssl, urllib.request, http.cookiejar, subprocess
from datetime import datetime, timezone
from pathlib import Path

pwd = subprocess.run(
    [r'C:/Users/alto8/Sartor-claude-network/scripts/sartor-secret.cmd', 'read', 'UniFi superadmin'],
    capture_output=True, text=True, check=True, shell=True,
).stdout.strip()
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx),
)
op.open(urllib.request.Request(
    'https://192.168.1.171:8443/api/login',
    data=json.dumps({'username':'alton','password':pwd,'remember':False}).encode(),
    headers={'Content-Type':'application/json'},
))

stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup_dir = Path(r'C:/Users/alto8/backups/unifi') / f'fleet-widen-{stamp}'
backup_dir.mkdir(parents=True, exist_ok=True)

# 1. Backup current device configs
devices = json.loads(op.open('https://192.168.1.171:8443/api/s/default/stat/device').read())['data']
(backup_dir / 'pre-devices.json').write_text(json.dumps(devices, indent=2))
print(f'pre-state backup: {backup_dir / "pre-devices.json"}')

# 2. Widen 5 GHz on every U7 AP
print('\n=== widening 5 GHz to 80 MHz across the fleet ===')
for d in devices:
    if d.get('type') != 'uap': continue
    name = d.get('name','?')
    rt = d.get('radio_table', [])
    changed = False
    for r in rt:
        if r.get('name') == 'wifi1' and r.get('radio') == 'na':
            old_ht = r.get('ht')
            if old_ht != 80:
                r['ht'] = 80
                changed = True
                print(f'  {name}: 5 GHz {old_ht} -> 80 MHz (queued)')
    if changed:
        body = json.dumps({'radio_table': rt}).encode()
        req = urllib.request.Request(
            f'https://192.168.1.171:8443/api/s/default/rest/device/{d["_id"]}',
            data=body, headers={'Content-Type':'application/json'}, method='PUT',
        )
        try:
            resp = json.loads(op.open(req).read())
            print(f'    PUT rc={resp.get("meta",{}).get("rc")}')
        except Exception as e:
            print(f'    FAIL: {e}')

# 3. Backup + update wlanconf
wlans = json.loads(op.open('https://192.168.1.171:8443/api/s/default/list/wlanconf').read())['data']
(backup_dir / 'pre-wlanconf.json').write_text(json.dumps(wlans, indent=2))

print('\n=== updating LGP123 SSID: 802.11r + band steering ===')
for w in wlans:
    if w.get('name') == 'LGP123':
        wlan_id = w['_id']
        old_11r = w.get('is_11r', False)
        old_bs = w.get('bandsteering_mode', '')
        old_min = w.get('minimum_data_rate_setting_preference', '')
        # mutate
        w['is_11r'] = True
        w['bandsteering_mode'] = 'prefer_5g'
        # Also turn on PMF (Protected Management Frames) if not already - required for 11r in many client implementations
        # Leave pmf_mode at current value to minimize blast radius
        body = json.dumps(w).encode()
        req = urllib.request.Request(
            f'https://192.168.1.171:8443/api/s/default/rest/wlanconf/{wlan_id}',
            data=body, headers={'Content-Type':'application/json'}, method='PUT',
        )
        try:
            resp = json.loads(op.open(req).read())
            print(f'  LGP123: is_11r {old_11r} -> True, bandsteering {old_bs!r} -> prefer_5g  (rc={resp.get("meta",{}).get("rc")})')
        except Exception as e:
            print(f'  FAIL: {e}')
        break

# 4. Verify post-change
print('\n=== post-change verification ===')
devices = json.loads(op.open('https://192.168.1.171:8443/api/s/default/stat/device').read())['data']
for d in devices:
    if d.get('type') != 'uap': continue
    rt = {r.get('name'):r for r in d.get('radio_table',[])}
    five = rt.get('wifi1', {})
    print(f'  {d.get("name","?"):22s}  5 GHz width: {five.get("ht")} MHz')

wlans = json.loads(op.open('https://192.168.1.171:8443/api/s/default/list/wlanconf').read())['data']
for w in wlans:
    if w.get('name') == 'LGP123':
        print(f'\n  LGP123: is_11r={w.get("is_11r")}  bandsteering_mode={w.get("bandsteering_mode")}  pmf_mode={w.get("pmf_mode")}')

(backup_dir / 'post-devices.json').write_text(json.dumps(devices, indent=2))
(backup_dir / 'post-wlanconf.json').write_text(json.dumps(wlans, indent=2))
print(f'\npost-state backup: {backup_dir}')
