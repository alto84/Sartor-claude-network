"""Rename UniFi APs: HisOffice -> Alton, HerOffice -> Aneeta.

Per Alton's directive 2026-05-09. Read-mostly script that:
1. Logs into the local UniFi controller at 192.168.1.171:8443.
2. Finds the device records by MAC (HisOffice = 1c:0b:8b:6e:6d:e3, HerOffice = 8c:ed:e1:7a:f2:bc).
3. PUTs {'name': 'Alton'} and {'name': 'Aneeta'} respectively.
4. Re-fetches and prints to confirm.

Reads UniFi superadmin password from Bitwarden via sartor-secret.cmd. No other side effects.
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

renames = [
    ('1c:0b:8b:6e:6d:e3', "Alton's Office", 'HisOffice|Alton'),
    ('8c:ed:e1:7a:f2:bc', "Aneeta's Office", 'HerOffice|Aneeta'),
]

for mac, new_name, expected_old in renames:
    dev = next((d for d in devices if d.get('mac', '').lower() == mac.lower()), None)
    if dev is None:
        print(f'SKIP {mac}: not found in /stat/device')
        continue
    dev_id = dev['_id']
    current = dev.get('name', '')
    print(f'  found {mac}: id={dev_id} current_name={current!r}  (expected_old={expected_old!r})')
    body = json.dumps({'name': new_name}).encode()
    req = urllib.request.Request(
        f'https://192.168.1.171:8443/api/s/default/rest/device/{dev_id}',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='PUT',
    )
    resp = json.loads(opener.open(req).read())
    print(f'    PUT result: rc={resp.get("meta", {}).get("rc")} (-> {new_name!r})')

# Re-fetch to confirm
print('\n=== post-rename verification ===')
devices = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/stat/device'
).read())['data']
for mac, new_name, _ in renames:
    dev = next((d for d in devices if d.get('mac', '').lower() == mac.lower()), None)
    if dev is None:
        print(f'  {mac}: NOT FOUND post-rename')
    else:
        print(f'  {mac}: name={dev.get("name")!r}  (expected {new_name!r})')
