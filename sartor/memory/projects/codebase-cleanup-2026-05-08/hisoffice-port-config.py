"""Look at HisOffice's full uplink/downlink config + any port_overrides on the device record
in MongoDB to verify the passthrough is unrestricted (no isolation, no VLAN-pinning).
"""
import json, ssl, urllib.request, http.cookiejar, subprocess
from pymongo import MongoClient

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
ho = next((d for d in devices if d.get('mac', '').lower() == HO_MAC), None)

print("=== HisOffice uplink dict ===")
print(json.dumps(ho.get('uplink', {}), indent=2, default=str))

print("\n=== HisOffice full port_table (all keys per port) ===")
for p in ho.get('port_table', []) or []:
    print(json.dumps(p, indent=2, default=str))

# MongoDB direct: look for port_overrides on the device record
print("\n=== MongoDB device record port_overrides + ethernet_overrides ===")
client = MongoClient('mongodb://127.0.0.1:27117', serverSelectionTimeoutMS=5000)
db = client['ace']
mongo_dev = db.device.find_one({'mac': HO_MAC})
print("port_overrides:", json.dumps(mongo_dev.get('port_overrides'), indent=2, default=str))
print("ethernet_overrides:", json.dumps(mongo_dev.get('ethernet_overrides'), indent=2, default=str))

# AP-level networkconf — check default LAN
print("\n=== networkconf (default LAN) ===")
ncs = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/rest/networkconf'
).read())['data']
for n in ncs:
    print(f"  {n.get('name')}  purpose={n.get('purpose')}  vlan={n.get('vlan')}  vlan_enabled={n.get('vlan_enabled')}  ip_subnet={n.get('ip_subnet')}")
