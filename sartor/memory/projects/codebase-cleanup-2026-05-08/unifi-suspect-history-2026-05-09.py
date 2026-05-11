"""Hour-window traffic check on the three suspect kid-related devices.
Read-only. Queries /stat/sta for cumulative session bytes + uptime, plus
/stat/report/hourly.user/<mac> for per-hour history if available.
"""
import json, ssl, urllib.request, http.cookiejar, subprocess
from datetime import datetime, timezone, timedelta

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

SUSPECTS = [
    ('20:17:42:b0:26:52', 'LGwebOSTV (LG smart TV)'),
    ('52:de:e5:c1:33:5e', 'Pixel-8 (kid phone?)'),
    ('94:8c:d7:80:a3:47', 'unknown HP device on Aneeta Office WiFi'),
]

stas = json.loads(opener.open('https://192.168.1.171:8443/api/s/default/stat/sta').read())['data']
sta_by_mac = {s.get('mac','').lower(): s for s in stas}

now = datetime.now(timezone.utc)
print(f"=== suspect-device session totals as of {now.isoformat()} ===\n")
for mac, label in SUSPECTS:
    s = sta_by_mac.get(mac.lower())
    if not s:
        print(f'{label} ({mac}): NOT in active station list (may have disconnected)')
        continue
    assoc = s.get('assoc_time') or s.get('first_seen') or 0
    last_seen = s.get('last_seen', 0)
    tx_bytes = s.get('tx_bytes', 0)
    rx_bytes = s.get('rx_bytes', 0)
    uptime = s.get('uptime') or s.get('_uptime_by_uap') or 0
    if assoc:
        assoc_ago = int(now.timestamp() - assoc)
        assoc_h = assoc_ago // 3600
        assoc_m = (assoc_ago % 3600) // 60
        assoc_str = f'{assoc_h}h{assoc_m:02d}m ago ({datetime.fromtimestamp(assoc, tz=timezone.utc).strftime("%H:%M UTC")})'
    else:
        assoc_str = '?'
    total_MB = (tx_bytes + rx_bytes) / 1024 / 1024
    if uptime > 0:
        avg_kBps = (tx_bytes + rx_bytes) / uptime / 1024
    else:
        avg_kBps = 0
    print(f'{label} ({mac})')
    print(f'  associated: {assoc_str}, uptime: {uptime}s ({uptime//60}m)')
    print(f'  session total: {total_MB:.1f} MB ({tx_bytes/1024/1024:.1f} tx + {rx_bytes/1024/1024:.1f} rx)')
    print(f'  avg over session: {avg_kBps:.2f} KB/s')
    if last_seen:
        print(f'  last seen by AP: {int(now.timestamp() - last_seen)}s ago')

    # hourly history attempt
    end_ms = int(now.timestamp() * 1000)
    start_ms = int((now - timedelta(hours=12)).timestamp() * 1000)
    body = json.dumps({'attrs':['rx_bytes','tx_bytes','time'], 'start':start_ms, 'end':end_ms, 'mac':mac}).encode()
    try:
        req = urllib.request.Request(
            'https://192.168.1.171:8443/api/s/default/stat/report/hourly.user',
            data=body, headers={'Content-Type':'application/json'}, method='POST',
        )
        hist = json.loads(opener.open(req).read())
        rows = hist.get('data', [])
        if rows:
            print('  per-hour traffic (last 12h, UTC; rows with >100 KB):')
            for row in rows[-12:]:
                t = datetime.fromtimestamp(row['time']/1000, tz=timezone.utc).strftime('%H:%M')
                rx_kB = row.get('rx_bytes', 0) / 1024
                tx_kB = row.get('tx_bytes', 0) / 1024
                if rx_kB + tx_kB > 100:
                    print(f'    {t}  rx={rx_kB:>10.1f} KB  tx={tx_kB:>10.1f} KB')
        else:
            print('  per-hour history: empty (controller may not aggregate per-MAC)')
    except Exception as e:
        print(f'  per-hour history fetch failed: {e}')
    print()
