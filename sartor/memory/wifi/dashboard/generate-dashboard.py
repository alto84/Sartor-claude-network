"""Generate the Sartor network dashboard.

Pulls live UniFi controller state + Verizon Fios uplink + computes per-port and
per-AP traffic. Renders a single self-contained HTML file with a Mermaid diagram
of the network shape + bandwidth tables.

Refresh model: HTML carries `<meta http-equiv="refresh" content="60">` so the
browser auto-reloads every minute. This script is scheduled to regenerate the
underlying HTML every 5 min via Windows Task `Sartor Network Dashboard`.

Output: ../network-dashboard.html (one level up from this script's dir, so
sartor/memory/wifi/network-dashboard.html). Open via file:// in any browser.
"""
import json
import ssl
import subprocess
import urllib.request
import http.cookiejar
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict
from html import escape

OUT = Path(__file__).resolve().parent.parent / 'network-dashboard.html'
CTRL = 'https://192.168.1.171:8443'

pwd = subprocess.run(
    [r'C:/Users/alto8/Sartor-claude-network/scripts/sartor-secret.cmd', 'read', 'UniFi superadmin'],
    capture_output=True, text=True, check=True, shell=True,
).stdout.strip()
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx),
)
op.open(urllib.request.Request(
    f'{CTRL}/api/login',
    data=json.dumps({'username': 'alton', 'password': pwd, 'remember': False}).encode(),
    headers={'Content-Type': 'application/json'},
))

devices = json.loads(op.open(f'{CTRL}/api/s/default/stat/device').read())['data']
stas = json.loads(op.open(f'{CTRL}/api/s/default/stat/sta').read())['data']

ap_devices = [d for d in devices if d.get('type') == 'uap']
sw = next((d for d in devices if d.get('type') == 'usw'), None)
ap_name_by_mac = {d.get('mac', '').lower(): d.get('name', '?') for d in ap_devices}

# Port-table mapping for the switch
port_info = {}
nest_port = None
fios_port = None
for p in (sw or {}).get('port_table', []):
    pi = p.get('port_idx')
    name = p.get('name') or f'Port {pi}'
    port_info[pi] = {
        'name': name,
        'up': bool(p.get('up')),
        'speed': p.get('speed'),
        'rx_bytes': p.get('rx_bytes', 0) or 0,
        'tx_bytes': p.get('tx_bytes', 0) or 0,
        'rx_rate': p.get('rx_bytes-r', 0) or 0,
        'tx_rate': p.get('tx_bytes-r', 0) or 0,
        'poe': bool(p.get('poe_enable')),
    }
    if 'fios' in name.lower() or 'uplink' in name.lower():
        fios_port = pi
    if 'nest' in name.lower():
        nest_port = pi

# Map switch port → list of clients hanging off it (wired)
clients_on_port = defaultdict(list)
clients_per_ap = defaultdict(list)
for s in stas:
    sw_port = s.get('sw_port')
    ap_mac = (s.get('ap_mac') or '').lower()
    if sw_port:
        clients_on_port[sw_port].append(s)
    elif ap_mac:
        clients_per_ap[ap_mac].append(s)

# Compute per-AP wireless client counts + aggregate rate (bytes/sec from /stat/sta)
ap_summary = []
for ap in ap_devices:
    mac = ap.get('mac', '').lower()
    name = ap.get('name', '?')
    cs = clients_per_ap.get(mac, [])
    rx_rate = sum((c.get('rx-bytes-r', 0) or 0) for c in cs)
    tx_rate = sum((c.get('tx-bytes-r', 0) or 0) for c in cs)
    rt = {r.get('name'): r for r in ap.get('radio_table', [])}
    rs = {r.get('name'): r for r in ap.get('radio_table_stats', [])}
    cu = {}
    for radio in ['wifi0', 'wifi1', 'wifi2']:
        st = rs.get(radio)
        if st:
            band = {'ng': '2.4G', 'na': '5G', '6e': '6G'}.get((rt.get(radio) or {}).get('radio'), '?')
            cu[band] = st.get('cu_total', 0) or 0
    ap_summary.append({
        'name': name,
        'mac': mac,
        'clients': len(cs),
        'rx_rate_Mbps': rx_rate * 8 / 1e6,
        'tx_rate_Mbps': tx_rate * 8 / 1e6,
        'state': ap.get('state'),
        'cu': cu,
    })
ap_summary.sort(key=lambda a: a['rx_rate_Mbps'] + a['tx_rate_Mbps'], reverse=True)

# Top clients by current rate
clients_summary = []
for s in stas:
    rx_rate = s.get('rx-bytes-r', 0) or 0
    tx_rate = s.get('tx-bytes-r', 0) or 0
    sw_port = s.get('sw_port')
    ap_mac = (s.get('ap_mac') or '').lower()
    if sw_port:
        loc = port_info.get(sw_port, {}).get('name', f'port {sw_port}')
        kind = 'wired'
    elif ap_mac:
        loc = ap_name_by_mac.get(ap_mac, ap_mac[-8:])
        kind = '5G' if (s.get('channel', 0) or 0) > 14 else '2.4G'
    else:
        loc = '?'
        kind = '?'
    clients_summary.append({
        'name': s.get('hostname') or s.get('name') or '(noname)',
        'ip': s.get('ip', ''),
        'loc': loc,
        'kind': kind,
        'signal': s.get('signal', ''),
        'rx_Mbps': rx_rate * 8 / 1e6,
        'tx_Mbps': tx_rate * 8 / 1e6,
        'sess_MB': ((s.get('rx_bytes', 0) or 0) + (s.get('tx_bytes', 0) or 0)) / 1024 / 1024,
        'retry_pct': s.get('wifi_tx_retries_percentage', ''),
    })
clients_summary.sort(key=lambda c: c['rx_Mbps'] + c['tx_Mbps'], reverse=True)

# Build mermaid diagram: Fios -> Switch -> {APs, Nest, key wired hosts}
def slug(s: str) -> str:
    return ''.join(c if c.isalnum() else '_' for c in s)[:40]

mermaid_lines = ['flowchart LR']
mermaid_lines.append('    fios["Verizon Fios<br/>2.5GbE uplink"]:::wan')
mermaid_lines.append('    sw["UniFi Switch<br/>USPM24P (24-port PoE)"]:::sw')
mermaid_lines.append('    fios --> sw')
for ap in ap_summary:
    nid = f'ap_{slug(ap["name"])}'
    label = f'{escape(ap["name"])}<br/>{ap["clients"]} clients<br/>{ap["rx_rate_Mbps"]+ap["tx_rate_Mbps"]:.1f} Mbps'
    state_cls = 'apok' if ap['state'] == 1 else 'apdown'
    mermaid_lines.append(f'    sw --> {nid}["{label}"]:::{state_cls}')
# Wired hosts of interest
seen = set()
for s in stas:
    if not s.get('sw_port'):
        continue
    name = s.get('hostname') or s.get('name') or '(noname)'
    if name in seen:
        continue
    seen.add(name)
    nid = f'wh_{slug(name)}_{slug(s.get("mac", "")[-5:])}'
    label = f'{escape(name)}<br/>{escape(s.get("ip", ""))}'
    mermaid_lines.append(f'    sw --> {nid}["{label}"]:::wired')
# Nest if present
if nest_port:
    p = port_info[nest_port]
    rx_GB = p['rx_bytes'] / 1e9
    tx_GB = p['tx_bytes'] / 1e9
    mermaid_lines.append(
        f'    sw --> nest["Google Nest mesh<br/>(retiring)<br/>RX {rx_GB:.1f} GB | TX {tx_GB:.1f} GB cum<br/>opaque: clients NAT-hidden"]:::nest'
    )
mermaid_lines.append('')
mermaid_lines.append('    classDef wan fill:#1e3a8a,color:#fff,stroke:#1e3a8a;')
mermaid_lines.append('    classDef sw fill:#0f172a,color:#fff,stroke:#0f172a;')
mermaid_lines.append('    classDef apok fill:#065f46,color:#fff,stroke:#065f46;')
mermaid_lines.append('    classDef apdown fill:#7f1d1d,color:#fff,stroke:#7f1d1d;')
mermaid_lines.append('    classDef wired fill:#374151,color:#fff,stroke:#374151;')
mermaid_lines.append('    classDef nest fill:#92400e,color:#fff,stroke:#92400e;')

mermaid_text = '\n'.join(mermaid_lines)

# Top wired-port utilization right now
ports_sorted = sorted(
    [(pi, p) for pi, p in port_info.items() if p['up']],
    key=lambda x: x[1]['rx_rate'] + x[1]['tx_rate'],
    reverse=True,
)

now_utc = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
now_local = datetime.now().strftime('%Y-%m-%d %H:%M:%S local')

def fmt_bytes(b):
    for unit, div in [('GB', 1e9), ('MB', 1e6), ('KB', 1e3)]:
        if b >= div:
            return f'{b / div:.1f} {unit}'
    return f'{b:.0f} B'

# Render HTML
html_parts = []
html_parts.append('<!doctype html>')
html_parts.append('<html><head>')
html_parts.append('  <meta charset="utf-8">')
html_parts.append('  <meta http-equiv="refresh" content="60">')
html_parts.append('  <title>Sartor Network Dashboard</title>')
html_parts.append('  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>')
html_parts.append('  <style>')
html_parts.append('    body{font-family:-apple-system,Segoe UI,sans-serif;margin:1.5em;background:#0f172a;color:#e2e8f0;}')
html_parts.append('    h1{color:#fff;margin:0 0 0.2em 0;}')
html_parts.append('    .stamp{color:#94a3b8;font-size:0.9em;margin-bottom:1.5em;}')
html_parts.append('    h2{color:#fbbf24;border-bottom:1px solid #334155;padding-bottom:0.3em;margin-top:1.5em;}')
html_parts.append('    table{border-collapse:collapse;width:100%;margin:0.5em 0;font-size:0.9em;}')
html_parts.append('    th,td{padding:6px 10px;text-align:left;border-bottom:1px solid #1e293b;}')
html_parts.append('    th{background:#1e293b;color:#fbbf24;font-weight:normal;}')
html_parts.append('    tr:hover{background:#1e293b;}')
html_parts.append('    .num{text-align:right;font-variant-numeric:tabular-nums;}')
html_parts.append('    .crit{color:#fca5a5;}')
html_parts.append('    .ok{color:#86efac;}')
html_parts.append('    .dim{color:#64748b;}')
html_parts.append('    .mermaid{background:#1e293b;padding:1em;border-radius:8px;}')
html_parts.append('    .grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5em;}')
html_parts.append('    @media(max-width:1100px){.grid{grid-template-columns:1fr;}}')
html_parts.append('  </style>')
html_parts.append('</head><body>')

html_parts.append('<h1>Sartor Network Dashboard</h1>')
html_parts.append(
    f'<div class="stamp">Generated {escape(now_local)} ({escape(now_utc)}) — auto-reload every 60 sec — '
    f'regenerated on disk every 5 min by <code>Sartor Network Dashboard</code> task</div>'
)

html_parts.append('<h2>Topology</h2>')
html_parts.append(f'<div class="mermaid">\n{escape(mermaid_text)}\n</div>')

# Switch port traffic (current rate sorted)
html_parts.append('<h2>Switch ports — current rate</h2>')
html_parts.append('<table>')
html_parts.append('<tr><th>port</th><th>label</th><th class="num">link</th><th class="num">rx now</th><th class="num">tx now</th><th class="num">rx cum</th><th class="num">tx cum</th></tr>')
for pi, p in ports_sorted:
    rx_now = p['rx_rate'] * 8 / 1e6
    tx_now = p['tx_rate'] * 8 / 1e6
    is_nest = pi == nest_port
    is_fios = pi == fios_port
    cls = 'crit' if is_nest else ('ok' if is_fios else '')
    html_parts.append(
        f'<tr><td class="{cls}">{pi}</td><td class="{cls}">{escape(p["name"])}</td>'
        f'<td class="num">{p["speed"] or "-"}M</td>'
        f'<td class="num">{rx_now:.2f} Mbps</td>'
        f'<td class="num">{tx_now:.2f} Mbps</td>'
        f'<td class="num">{fmt_bytes(p["rx_bytes"])}</td>'
        f'<td class="num">{fmt_bytes(p["tx_bytes"])}</td></tr>'
    )
html_parts.append('</table>')

html_parts.append('<div class="grid">')

# APs by current load
html_parts.append('<div>')
html_parts.append('<h2>Access points — current load</h2>')
html_parts.append('<table>')
html_parts.append('<tr><th>AP</th><th class="num">clients</th><th class="num">rx now</th><th class="num">tx now</th><th class="num">2.4G cu</th><th class="num">5G cu</th><th class="num">6G cu</th></tr>')
for ap in ap_summary:
    cls = '' if ap['state'] == 1 else 'crit'
    html_parts.append(
        f'<tr><td class="{cls}">{escape(ap["name"])}</td>'
        f'<td class="num">{ap["clients"]}</td>'
        f'<td class="num">{ap["rx_rate_Mbps"]:.2f} Mbps</td>'
        f'<td class="num">{ap["tx_rate_Mbps"]:.2f} Mbps</td>'
        f'<td class="num">{ap["cu"].get("2.4G", "-")}%</td>'
        f'<td class="num">{ap["cu"].get("5G", "-")}%</td>'
        f'<td class="num">{ap["cu"].get("6G", "-")}%</td></tr>'
    )
html_parts.append('</table>')
html_parts.append('</div>')

# Top clients by current bandwidth
html_parts.append('<div>')
html_parts.append('<h2>Top clients — current bandwidth</h2>')
html_parts.append('<table>')
html_parts.append('<tr><th>name</th><th>where</th><th class="num">rx</th><th class="num">tx</th><th class="num">retry%</th><th class="num">sess</th></tr>')
for c in clients_summary[:20]:
    if c['rx_Mbps'] + c['tx_Mbps'] < 0.01:
        continue
    retry = c.get('retry_pct', '')
    retry_cls = 'crit' if isinstance(retry, (int, float)) and retry > 5 else ''
    html_parts.append(
        f'<tr><td>{escape(c["name"])}</td>'
        f'<td>{escape(c["loc"])} <span class="dim">({escape(c["kind"])})</span></td>'
        f'<td class="num">{c["rx_Mbps"]:.2f} Mbps</td>'
        f'<td class="num">{c["tx_Mbps"]:.2f} Mbps</td>'
        f'<td class="num {retry_cls}">{retry if retry != "" else "-"}</td>'
        f'<td class="num">{c["sess_MB"]:.0f} MB</td></tr>'
    )
html_parts.append('</table>')
html_parts.append('</div>')
html_parts.append('</div>')  # end grid

# Loki-Ghostie / Nest section
html_parts.append('<h2>Loki-Ghostie (Google Nest mesh)</h2>')
if nest_port:
    p = port_info[nest_port]
    rx_now = p['rx_rate'] * 8 / 1e6
    tx_now = p['tx_rate'] * 8 / 1e6
    html_parts.append('<p>')
    html_parts.append(
        f'Wired through switch port {nest_port}. <strong>Current rate:</strong> rx {rx_now:.2f} Mbps, tx {tx_now:.2f} Mbps. '
        f'<strong>Cumulative:</strong> rx {fmt_bytes(p["rx_bytes"])}, tx {fmt_bytes(p["tx_bytes"])}. '
    )
    html_parts.append('</p>')
    html_parts.append(
        '<p class="dim">Per-client traffic on Loki-Ghostie is opaque from this controller — '
        'clients are NAT-hidden behind the Nest router. To audit them we either retire the Nest physically '
        '(cleanest), break its mesh and let stragglers reattach to LGP123, or point the controller-side '
        'flow-export at port ' + str(nest_port) + ' for top-domain visibility (no client identification).</p>'
    )
else:
    html_parts.append('<p class="ok">No Nest gear detected on switch.</p>')

# SSID summary
html_parts.append('<h2>SSIDs in our controller</h2>')
wlans_data = json.loads(op.open(f'{CTRL}/api/s/default/list/wlanconf').read())['data']
html_parts.append('<table>')
html_parts.append('<tr><th>name</th><th>enabled</th><th>bands</th><th>fast roam</th><th>band steer</th></tr>')
for w in wlans_data:
    html_parts.append(
        f'<tr><td>{escape(str(w.get("name")))}</td>'
        f'<td>{w.get("enabled")}</td>'
        f'<td>{escape(",".join(w.get("wlan_bands", []) or []))}</td>'
        f'<td class="ok">{w.get("fast_roaming_enabled")}</td>'
        f'<td>no2ghz_oui={w.get("no2ghz_oui")}</td></tr>'
    )
html_parts.append('</table>')

html_parts.append(
    '<p class="dim">Sartor-Saxena-Claude Network. Source: <code>'
    + escape(str(Path(__file__)))
    + '</code>. Run by hand: <code>python "'
    + escape(str(Path(__file__)))
    + '"</code>.</p>'
)
html_parts.append('<script>mermaid.initialize({startOnLoad:true,theme:"dark"});</script>')
html_parts.append('</body></html>')

OUT.write_text('\n'.join(html_parts), encoding='utf-8')
print(f'wrote {OUT}')
print(f'  {len(ap_summary)} APs')
print(f'  {len(stas)} clients')
print(f'  {sum(1 for p in port_info.values() if p["up"])} switch ports up')
print(f'  Nest port: {nest_port}  Fios port: {fios_port}')
