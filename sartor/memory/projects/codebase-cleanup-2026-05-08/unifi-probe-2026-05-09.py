"""Network diagnostic probe for the gpuserver1 unreachable incident, 2026-05-09 ~04:00 UTC.

Purpose: query the UniFi controller for switch port states + station list to identify where
gpuserver1's MAC currently appears (which switch port, via which AP), and whether the wall
switch in HisOffice is passing traffic. This is read-only, no mutations.

Reads UniFi superadmin password from Bitwarden via sartor-secret. Logs into the controller
at https://192.168.1.171:8443. Prints device list, switch port_table, and any stations
matching gpuserver1, Rocinante, or the .163 (Nest) leg.
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

print("=== devices ===")
for d in devices:
    name = d.get('name', '?')
    ip = d.get('ip', '?')
    state = d.get('state')
    model = d.get('model', '?')
    print(f"  {name:25s} {ip:15s} state={state} model={model}")

print("\n=== switch port_table ===")
switch = next((d for d in devices if d.get('type') == 'usw'), None)
if switch:
    for p in switch.get('port_table', []):
        idx = p.get('port_idx')
        name = p.get('name', '')
        up = p.get('up')
        speed = p.get('speed', 0)
        print(f"  port {idx:2d}  up={up}  speed={speed:5d}  name={name}")

stas = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/stat/sta'
).read())['data']

print("\n=== stations matching gpuserver1 / Rocinante / .163 / .100 ===")
target_macs = ['be:fc:e7']
target_ips = ['192.168.1.100', '192.168.1.171', '192.168.1.169', '192.168.1.163']
for s in stas:
    mac = s.get('mac', '').lower()
    ip = s.get('ip', '')
    hostname = s.get('hostname') or ''
    if (any(t in mac for t in target_macs) or ip in target_ips
            or 'gpuserver' in hostname.lower() or 'rocinante' in hostname.lower()):
        print(f"  {hostname:25s} {ip:15s} mac={mac} sw_port={s.get('sw_port','')} ap_mac={s.get('ap_mac','wired')} signal={s.get('signal','')}")

print("\n=== all wired clients per switch port ===")
by_port = {}
for s in stas:
    swp = s.get('sw_port')
    if swp and not s.get('ap_mac'):
        by_port.setdefault(swp, []).append(s)
for port_idx in sorted(by_port.keys()):
    for s in by_port[port_idx]:
        print(f"  port {port_idx:2}  {(s.get('hostname') or '?'):22s} {s.get('ip',''):15s} mac={s.get('mac')}")
