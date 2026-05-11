"""Network bandwidth + signal-quality snapshot for the Sartor LAN, 2026-05-09 morning.

Purpose: Vayu's computer is bottlenecked. Identify the device, the path it takes
through the network, the signal/rate it's getting, and any contention. Read-only
query of /stat/sta with the wireless-quality fields included.
"""
import json, ssl, urllib.request, http.cookiejar, subprocess
from datetime import datetime, timezone

pwd = subprocess.run(
    [r'C:/Users/alto8/Sartor-claude-network/scripts/sartor-secret.cmd', 'read', 'UniFi superadmin'],
    capture_output=True, text=True, check=True, shell=True,
).stdout.strip()
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx),
)
opener.open(urllib.request.Request(
    'https://192.168.1.171:8443/api/login',
    data=json.dumps({'username':'alton','password':pwd,'remember':False}).encode(),
    headers={'Content-Type':'application/json'},
))

devices = json.loads(opener.open('https://192.168.1.171:8443/api/s/default/stat/device').read())['data']
ap_name_by_mac = {d.get('mac', '').lower(): d.get('name', '?') for d in devices}

stas = json.loads(opener.open('https://192.168.1.171:8443/api/s/default/stat/sta').read())['data']
now = datetime.now(timezone.utc)

print(f"=== bandwidth-active stations as of {now.isoformat()} ===\n")
print(f"{'hostname':28s} {'ip':15s} {'AP/wired':22s} {'sig/dB':>7s} {'noise':>6s} {'tx_mbps':>8s} {'rx_mbps':>8s} {'rx KB/s':>9s} {'tx KB/s':>9s} {'sess MB':>8s}")

active = []
for s in stas:
    rx_kBps = (s.get('rx-bytes-r', 0) or 0) / 1024
    tx_kBps = (s.get('tx-bytes-r', 0) or 0) / 1024
    if rx_kBps + tx_kBps > 0.5:
        active.append(s)

# all stations sorted by current bandwidth desc
sorted_stas = sorted(stas, key=lambda s: ((s.get('rx-bytes-r', 0) or 0) + (s.get('tx-bytes-r', 0) or 0)), reverse=True)
for s in sorted_stas:
    hostname = (s.get('hostname') or s.get('name') or '(noname)').strip()[:28]
    ip = s.get('ip', '')
    ap_mac = (s.get('ap_mac') or '').lower()
    sw_port = s.get('sw_port', '')
    if ap_mac:
        loc = ap_name_by_mac.get(ap_mac, ap_mac[-8:])[:22]
    elif sw_port:
        loc = f'wired:port {sw_port}'
    else:
        loc = '?'
    signal = s.get('signal', '')
    noise = s.get('noise', '')
    # tx_rate / rx_rate are in kbps
    tx_mbps = (s.get('tx_rate') or 0) / 1000
    rx_mbps = (s.get('rx_rate') or 0) / 1000
    rx_kBps = (s.get('rx-bytes-r', 0) or 0) / 1024
    tx_kBps = (s.get('tx-bytes-r', 0) or 0) / 1024
    sess_MB = ((s.get('rx_bytes', 0) or 0) + (s.get('tx_bytes', 0) or 0)) / 1024 / 1024
    print(f"{hostname:28s} {ip:15s} {loc:22s} {str(signal):>7s} {str(noise):>6s} {tx_mbps:>8.0f} {rx_mbps:>8.0f} {rx_kBps:>9.1f} {tx_kBps:>9.1f} {sess_MB:>8.1f}")

print(f"\n{len(stas)} total stations, {len(active)} actively transferring (>0.5 KB/s right now)")
print('\nLegend:')
print('  sig/dB: WiFi signal strength (more-negative is weaker; -50 great, -65 ok, -75 poor)')
print('  noise: WiFi noise floor (-90 quiet, -75 noisy)')
print('  tx_mbps / rx_mbps: negotiated PHY link rate to the AP (the ceiling)')
print('  rx KB/s / tx KB/s: actual instantaneous traffic at the AP measurement window')
print('  sess MB: cumulative bytes transferred since the device associated to the AP')
