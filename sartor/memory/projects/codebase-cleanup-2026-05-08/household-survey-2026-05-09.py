"""Household internet survey — AP utilization + active clients + bandwidth right now.

Read-only. Pulls /stat/sta + /stat/device, joins with CLIENT-PRIORITIES.yaml,
prints two tables: APs by utilization, clients by current bandwidth.
Highlights Aneeta's connection state.
"""
import json, ssl, urllib.request, http.cookiejar, subprocess, yaml
from datetime import datetime, timezone

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

# load priorities
with open(r'C:/Users/alto8/Sartor-claude-network/sartor/memory/wifi/CLIENT-PRIORITIES.yaml') as f:
    pri_doc = yaml.safe_load(f)
pri_by_mac = {}
for entry in pri_doc.get('clients', pri_doc) if isinstance(pri_doc, dict) else pri_doc:
    if isinstance(entry, dict) and 'mac' in entry:
        pri_by_mac[entry['mac'].lower()] = entry

devices = json.loads(op.open('https://192.168.1.171:8443/api/s/default/stat/device').read())['data']
ap_name_by_mac = {d.get('mac','').lower(): d.get('name','?') for d in devices}

stas = json.loads(op.open('https://192.168.1.171:8443/api/s/default/stat/sta').read())['data']
now = datetime.now(timezone.utc)

# AP utilization summary
print(f"=== AP utilization right now ({now.strftime('%H:%M UTC')}) ===")
print(f"{'AP':22s} {'band':>5s} {'ch':>5s} {'width':>6s} {'clients':>8s} {'cu_total%':>10s}")
for d in devices:
    if d.get('type') != 'uap': continue
    name = d.get('name','?')[:22]
    rt = {r.get('name'):r for r in d.get('radio_table',[])}
    rs = {r.get('name'):r for r in d.get('radio_table_stats',[])}
    for radio in ['wifi0','wifi1','wifi2']:
        r = rt.get(radio); st = rs.get(radio)
        if not r: continue
        band = {'ng':'2.4G','na':'5G','6e':'6G'}.get(r.get('radio'),'?')
        ch = r.get('channel')
        ht = r.get('ht')
        nsta = st.get('num_sta',0) if st else 0
        cu = st.get('cu_total','-') if st else '-'
        if nsta or (cu != '-' and cu > 5):
            print(f"  {name:22s} {band:>5s} {str(ch):>5s} {str(ht)+'M':>6s} {nsta:>8} {str(cu):>10}")

# clients by current bandwidth
print(f"\n=== clients by CURRENT bandwidth right now ===")
print(f"{'priority':>11s} {'hostname':24s} {'AP/wired':22s} {'sig':>5s} {'retry%':>7s} {'rx Mbps':>8s} {'tx Mbps':>8s} {'sess MB':>8s}")
sorted_stas = sorted(stas, key=lambda s: ((s.get('rx-bytes-r',0) or 0) + (s.get('tx-bytes-r',0) or 0)), reverse=True)
for s in sorted_stas:
    hostname = (s.get('hostname') or s.get('name') or '(noname)').strip()[:24]
    mac = s.get('mac','').lower()
    ap_mac = (s.get('ap_mac') or '').lower()
    sw_port = s.get('sw_port', '')
    if ap_mac:
        loc = ap_name_by_mac.get(ap_mac, ap_mac[-8:])[:22]
    elif sw_port:
        loc = f'wired:port {sw_port}'[:22]
    else:
        loc = '?'
    pri_entry = pri_by_mac.get(mac, {})
    pri = pri_entry.get('priority','?')
    signal = s.get('signal', '')
    retry = s.get('wifi_tx_retries_percentage', '')
    rx_Mbps = (s.get('rx-bytes-r',0) or 0) * 8 / 1024 / 1024
    tx_Mbps = (s.get('tx-bytes-r',0) or 0) * 8 / 1024 / 1024
    sess_MB = ((s.get('rx_bytes',0) or 0) + (s.get('tx_bytes',0) or 0)) / 1024 / 1024
    print(f"  {pri:>11s} {hostname:24s} {loc:22s} {str(signal):>5s} {str(retry):>7s} {rx_Mbps:>8.2f} {tx_Mbps:>8.2f} {sess_MB:>8.1f}")

# Aneeta-specific
print(f"\n=== Aneeta deep-dive (NEURV-PF5B9D8L 00:72:ee:00:bd:a6) ===")
aneeta = next((s for s in stas if s.get('mac','').lower() == '00:72:ee:00:bd:a6'), None)
if aneeta:
    print(f"  AP: {ap_name_by_mac.get((aneeta.get('ap_mac') or '').lower(),'?')}")
    print(f"  signal: {aneeta.get('signal')} dB  noise: {aneeta.get('noise')} dB  rssi: {aneeta.get('rssi')}")
    print(f"  channel: {aneeta.get('channel')} ({aneeta.get('channel_width')} MHz {aneeta.get('radio_proto')})")
    print(f"  PHY tx: {aneeta.get('tx_rate',0)/1000:.0f} Mbps  rx: {aneeta.get('rx_rate',0)/1000:.0f} Mbps")
    print(f"  retry %: {aneeta.get('wifi_tx_retries_percentage')}  satisfaction: {aneeta.get('satisfaction')}")
    print(f"  uptime: {aneeta.get('uptime')}s ({aneeta.get('uptime',0)//60}m)")
    print(f"  session totals: rx {aneeta.get('rx_bytes',0)/1024/1024:.1f} MB  tx {aneeta.get('tx_bytes',0)/1024/1024:.1f} MB")
    print(f"  current rate: rx {(aneeta.get('rx-bytes-r',0) or 0)*8/1024/1024:.2f} Mbps  tx {(aneeta.get('tx-bytes-r',0) or 0)*8/1024/1024:.2f} Mbps")
else:
    print('  NOT in active station list right now')
