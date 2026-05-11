"""Active-client scan for the Sartor LAN, 2026-05-09 ~01:00 ET.

Purpose: Alton wants to know if the kids are using laptops or watching TV right now.
Read-only query of the UniFi controller's /stat/sta endpoint. Lists all active
stations with last-seen timestamp, current AP, signal, and traffic-rate indicators.
Flags devices that don't match the known-adult fingerprint.
"""
import json, ssl, urllib.request, http.cookiejar, subprocess
from datetime import datetime, timezone

pwd = subprocess.run(
    [r'C:/Users/alto8/Sartor-claude-network/scripts/sartor-secret.cmd', 'read', 'UniFi superadmin'],
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
opener.open(urllib.request.Request(
    'https://192.168.1.171:8443/api/login',
    data=data, headers={'Content-Type': 'application/json'},
))

# AP-MAC -> name lookup
devices = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/stat/device'
).read())['data']
ap_name_by_mac = {d.get('mac', '').lower(): d.get('name', '?') for d in devices}

stas = json.loads(opener.open(
    'https://192.168.1.171:8443/api/s/default/stat/sta'
).read())['data']

# Known adult / non-kid devices (filter these to confirm they look right; flag the rest)
KNOWN_ADULT = {
    'rocinante', 'gpuserver1', 'rtxpro6000server', 'ubuntu-server',
    'pixel-10-pro-fold', 'neurv-pf5b9d8l', 'pf5b9d8l',
}
KNOWN_INFRA = {'unifi', 'u7-iw', 'sartor-saxena-claude'}

now = datetime.now(timezone.utc)

print(f"=== active stations as of {now.isoformat()} ===")
print(f"{'hostname':30s} {'ip':15s} {'mac':18s} {'AP/wired':24s} {'last_seen_ago':>14s}  {'rx_kBps':>8s} {'tx_kBps':>8s}  flags")

flagged = []
for s in sorted(stas, key=lambda s: s.get('last_seen', 0), reverse=True):
    hostname = (s.get('hostname') or s.get('name') or '').strip()
    ip = s.get('ip', '')
    mac = s.get('mac', '')
    ap_mac = (s.get('ap_mac') or '').lower()
    sw_port = s.get('sw_port', '')
    last_seen = s.get('last_seen', 0)
    if last_seen:
        ago_sec = int((now.timestamp() - last_seen))
        if ago_sec < 60:
            ago = f'{ago_sec}s ago'
        elif ago_sec < 3600:
            ago = f'{ago_sec//60}m ago'
        else:
            ago = f'{ago_sec//3600}h{(ago_sec%3600)//60}m'
    else:
        ago = 'unknown'
    # rx/tx are bytes-per-second on the AP-side measurement window
    rx_bps = s.get('rx-bytes-r', 0) or s.get('rx-bytes', 0)
    tx_bps = s.get('tx-bytes-r', 0) or s.get('tx-bytes', 0)
    rx_kBps = (s.get('rx-bytes-r', 0) or 0) / 1024
    tx_kBps = (s.get('tx-bytes-r', 0) or 0) / 1024
    if ap_mac:
        loc = ap_name_by_mac.get(ap_mac, ap_mac[-8:])
    elif sw_port:
        loc = f'wired:port {sw_port}'
    else:
        loc = '?'
    fingerprint = (hostname.lower() if hostname else '') + ' ' + (s.get('oui') or '').lower()
    matched_adult = any(k in fingerprint for k in KNOWN_ADULT) or any(k in fingerprint for k in KNOWN_INFRA)
    flag = ''
    if not matched_adult:
        flag = 'UNFLAGGED-DEVICE'
        flagged.append(s)
    if last_seen and (now.timestamp() - last_seen) < 600 and (rx_kBps + tx_kBps) > 5:
        flag += ' ACTIVE-TRAFFIC' if flag else 'ACTIVE-TRAFFIC'
    print(f"{(hostname or '(noname)'):30s} {ip:15s} {mac:18s} {loc:24s} {ago:>14s}  {rx_kBps:>8.1f} {tx_kBps:>8.1f}  {flag}")

print(f"\n{len(stas)} total stations | {len(flagged)} not matching known-adult fingerprints")
print("\nIf you want to see what unflagged devices have been doing in the last hour:")
print("  - run UniFi web UI -> Insights -> Clients -> filter by hostname/MAC")
print("  - or query /api/s/default/stat/sta_v2 with within=60 for richer history")
