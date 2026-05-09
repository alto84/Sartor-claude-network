"""Identify MAC ac:91:9b:6c:9b:69 — appeared in HisOffice port_table port 3 last_connection
field. Look in active and historical client lists.
"""
import json, ssl, urllib.request, http.cookiejar, subprocess

pwd = subprocess.run(
    ['C:\\Users\\alto8\\Sartor-claude-network\\scripts\\sartor-secret.cmd', 'read', 'UniFi superadmin'],
    capture_output=True, text=True, check=True, shell=True,
).stdout.strip()

ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
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
assert json.loads(opener.open(req).read())['meta']['rc'] == 'ok'

target = 'ac:91:9b:6c:9b:69'

users = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/list/user'
).read())['data']
for u in users:
    if u.get('mac') == target:
        print('In user list:')
        print(f"  hostname={u.get('hostname')!r}  name={u.get('name')!r}  oui={u.get('oui')!r}")
        print(f"  first_seen={u.get('first_seen')}  last_seen={u.get('last_seen')}")
        print(f"  is_wired={u.get('is_wired')}  is_guest={u.get('is_guest')}")
        break
else:
    print('Not in user list')

stas = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/stat/sta'
).read())['data']
for s in stas:
    if s.get('mac') == target:
        print('In active sta list:')
        print(f"  hostname={s.get('hostname')!r}  ip={s.get('ip')!r}  ap_mac={s.get('ap_mac')!r}  sw_mac={s.get('sw_mac')!r}  sw_port={s.get('sw_port')!r}")
        break
else:
    print('Not in active sta list')
