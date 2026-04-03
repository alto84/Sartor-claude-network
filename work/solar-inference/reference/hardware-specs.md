# Hardware Specs and Network Topology

Reference for gpuserver1 hardware, network configuration, and system details.

## gpuserver1 Specifications

| Component | Spec |
|-----------|------|
| OS | Ubuntu 22.04 |
| IP (LAN) | 192.168.1.100 |
| CPU | Intel i9-14900K (32 threads) |
| RAM | 128GB DDR5 |
| GPU | NVIDIA RTX 5090, 32GB VRAM |
| NVIDIA driver | 570.144 |
| Storage (root) | 100GB NVMe (/) |
| Storage (Docker) | 1.7TB NVMe (/var/lib/docker) |
| Total NVMe | 1.8TB |
| Python | 3.10 |
| PyTorch | 2.11.0+cu128 |
| Docker | v29.1.3 |
| NVIDIA Container Toolkit | v1.18.1 |
| Claude Code | v2.1.33, Max subscription |

## SSH Access

```bash
ssh alton@192.168.1.100
```

Key exchange is currently hanging (as of Apr 1, 2026). sshd issue -- ping OK.

## vast.ai Daemon

- **Kaalia daemon:** Runs as `vastai_kaalia` user
- **Machine ID (hash):** 800a1bf017e653bdadc2fef79457b699c31d5c29279d308ce0f41ba8b15665ff
- **Heartbeat:** 52.90.216.45:7071
- **Docker shim:** `/var/lib/vastai_kaalia/latest/kaalia_docker_shim`
- **Host port range:** 40000-40099
- **After reboot:** Kaalia auto-starts, check listing with `~/.local/bin/vastai show machines`

## Firewall (UFW)

```
sudo ufw status
```

Rules:
- SSH (22): Allow from anywhere
- 40000-40099/tcp: Allow (vast.ai port range)
- 192.168.1.0/24: Allow (LAN)
- All else: Deny

## Network Topology

```
Internet
  |
Verizon Fios Router (192.168.1.1)
  | DMZ: all traffic forwarded to 192.168.1.100
  |
gpuserver1 (192.168.1.100)
  | UFW handles filtering
  |
  +-- LAN (192.168.1.x)
  |     |
  |     Rocinante (Windows desktop)
  |
  +-- vast.ai ports 40000-40099 (renters)
```

**External IP:** 100.1.100.63 (Fios dynamic -- may change)

## Hairpin NAT Fix

The Fios router cannot route LAN-sourced traffic through its public IP back to itself (hairpin NAT). Fixed with iptables rules:

In `/etc/ufw/before.rules` (nat table):
```
-A OUTPUT -d 100.1.100.63 -j DNAT --to-destination 192.168.1.100
```

In `/etc/ufw/after.rules` (DOCKER-USER chain):
```
-A DOCKER-USER -m conntrack --ctorigdstport 40000:40099 -j ACCEPT
```

## Rocinante (Windows Desktop)

| Component | Spec |
|-----------|------|
| OS | Windows 10 Home 10.0.19045 |
| Username | alton / alto8 |
| Monitors | 3x (2560x1440 primary, 2x 1920x1080) |
| Chrome | v144 at C:\Program Files (x86)\Google\Chrome\Application\chrome.exe |
| Chrome automation | Port 9223, profile C:\Users\alto8\chrome-automation-profile\ |
| Claude Code | Installed, active |
| Git | Credentials stored -- PUSH ONLY FROM ROCINANTE |
