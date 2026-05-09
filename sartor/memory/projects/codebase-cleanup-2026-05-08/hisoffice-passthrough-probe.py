"""Probe HisOffice U7-PIW for its downstream passthrough port + look for any wired
client whose ap_mac/sw_mac matches HisOffice. Read-only.
"""
import json, ssl, urllib.request, http.cookiejar, subprocess

pwd = subprocess.run(
    ['C:\\Users\\alto8\\Sartor-claude-network\\scripts\\sartor-secret.cmd', 'read', 'UniFi superadmin'],
    capture_output=True, text=True, check=True, shell=True,
).stdout.strip()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx),
)

data = json.dumps({'username': 'alton', 'password': pwd, 'remember': False}).encode()
req = urllib.request.Request(
    'https://192.168.1.171:8443/api/login',
    data=data, headers={'Content-Type': 'application/json'},
)
r = json.loads(opener.open(req).read())
assert r['meta']['rc'] == 'ok', r

devices = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/stat/device'
).read())['data']

HO_MAC = '1c:0b:8b:6e:6d:e3'
hisoffice = next((d for d in devices if d.get('mac', '').lower() == HO_MAC), None)
if hisoffice is None:
    print(f"HisOffice ({HO_MAC}) not found. devices: {[(d.get('name'), d.get('mac')) for d in devices]}")
    raise SystemExit(1)

print(f"=== HisOffice ({hisoffice.get('mac')}) summary ===")
print(f"  state={hisoffice.get('state')}  model={hisoffice.get('model')}  ip={hisoffice.get('ip')}")
print(f"  uptime={hisoffice.get('uptime')}s  last_seen={hisoffice.get('last_seen')}")
print(f"  vap_count={len(hisoffice.get('vap_table', []))}")
print(f"  num_sta={hisoffice.get('num_sta')}  user-num_sta={hisoffice.get('user-num_sta')}")
print(f"  guest-num_sta={hisoffice.get('guest-num_sta')}")

print(f"\n=== HisOffice port_table ===")
for p in hisoffice.get('port_table', []) or []:
    idx = p.get('port_idx')
    name = p.get('name', '')
    up = p.get('up')
    speed = p.get('speed', 0)
    poe_mode = p.get('poe_mode', '')
    enable = p.get('enable')
    print(f"  port {idx}  up={up}  speed={speed}  enable={enable}  poe={poe_mode}  name={name}")

# Show all switch_table / lldp / ethernet info if present
print(f"\n=== HisOffice ethernet_table (LLDP / link details) ===")
for e in hisoffice.get('ethernet_table', []) or []:
    print(f"  {e}")

print(f"\n=== HisOffice has_eth1 / dual_link / passthrough fields ===")
for k in sorted(hisoffice.keys()):
    if any(t in k.lower() for t in ['eth', 'port', 'pass', 'down', 'wire', 'link']):
        v = hisoffice.get(k)
        if isinstance(v, (list, dict)):
            print(f"  {k}: {type(v).__name__} len={len(v)}")
        else:
            print(f"  {k}: {v}")

# Look for any clients reporting HisOffice as their sw_mac (i.e. wired through HisOffice's passthrough)
stas = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/stat/sta'
).read())['data']

ho_mac = hisoffice.get('mac')
print(f"\n=== clients connected via HisOffice (ap_mac or sw_mac == {ho_mac}) ===")
hits = 0
for s in stas:
    if s.get('ap_mac') == ho_mac or s.get('sw_mac') == ho_mac:
        hits += 1
        print(f"  {(s.get('hostname') or '?'):22s} {s.get('ip',''):15s} mac={s.get('mac')} ap_mac={s.get('ap_mac','')} sw_mac={s.get('sw_mac','')} signal={s.get('signal','wired')}")
if hits == 0:
    print("  (no clients currently using HisOffice as their parent — neither WiFi nor wired-passthrough)")
