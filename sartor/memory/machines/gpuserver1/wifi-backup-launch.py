"""Launch gpuserver1's WiFi-backup setup.

Pulls LGP123 PSK from the UniFi controller (using the superadmin secret in
Bitwarden), then SSHes to gpuserver1 and runs wifi-backup-setup.sh with the
PSK passed via env. PSK never touches disk; it's just an env var across the
SSH session.

Usage:  python wifi-backup-launch.py

Prereqs:
  1. Antenna physically attached to gpuserver1's WiFi port.
  2. Rocinante can SSH to gpuserver1 as alton with passwordless sudo.
  3. Bitwarden vault unlocked (sartor-secret should work without prompt).
"""
import json
import ssl
import subprocess
import urllib.request
import http.cookiejar
from pathlib import Path

CTRL = 'https://192.168.1.171:8443'
SCRIPT = Path(__file__).resolve().parent / 'wifi-backup-setup.sh'

print('Pulling UniFi superadmin password from Bitwarden...')
unifi_pwd = subprocess.run(
    [r'C:/Users/alto8/Sartor-claude-network/scripts/sartor-secret.cmd', 'read', 'UniFi superadmin'],
    capture_output=True, text=True, check=True, shell=True,
).stdout.strip()

print('Logging into UniFi controller...')
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx),
)
op.open(urllib.request.Request(
    f'{CTRL}/api/login',
    data=json.dumps({'username': 'alton', 'password': unifi_pwd, 'remember': False}).encode(),
    headers={'Content-Type': 'application/json'},
))
wlans = json.loads(op.open(f'{CTRL}/api/s/default/list/wlanconf').read())['data']
psk = None
for w in wlans:
    if w.get('name') == 'LGP123':
        psk = w.get('x_passphrase')
        break
if not psk:
    raise SystemExit('Could not find LGP123 PSK in UniFi wlanconf')
print(f'Got LGP123 PSK ({len(psk)} chars). Will be passed to gpuserver1 over SSH only.')

# 1. SCP the setup script to gpuserver1
print('SCPing setup script to gpuserver1...')
subprocess.run(['scp', str(SCRIPT), 'gpuserver1:/tmp/wifi-backup-setup.sh'], check=True)

# 2. Invoke over SSH with PSK in env
print('Running setup on gpuserver1...')
proc = subprocess.Popen(
    ['ssh', 'gpuserver1', "PSK=\"$(cat)\" bash /tmp/wifi-backup-setup.sh && rm /tmp/wifi-backup-setup.sh"],
    stdin=subprocess.PIPE, text=True,
)
proc.stdin.write(psk)
proc.stdin.close()
rc = proc.wait()
if rc != 0:
    raise SystemExit(f'gpuserver1 setup failed with rc={rc}')
print()
print('Done. To verify failover later:')
print('  ssh gpuserver1 "ip -br addr show wlp7s0; nmcli -t -f NAME,DEVICE,STATE connection show --active"')
