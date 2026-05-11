#!/usr/bin/env bash
# Bring gpuserver1's onboard WiFi 7 (MediaTek MT7925, wlp7s0) up as a backup
# uplink to LGP123. Run on gpuserver1 itself (`ssh gpuserver1` first).
#
# After this:
#  - eno1 (wired) remains the primary route (metric 100)
#  - wlp7s0 (LGP123) becomes the backup route (metric 600)
#  - Kernel auto-failovers to WiFi if eno1 link drops
#
# What this does NOT cover: vast.ai customer rentals will break under WiFi
# because the Verizon Fios DMZ points only at gpuserver1's wired IP. WiFi backup
# is for our own access (SSH, memory sync, Claude peer auth) only. To make
# rentals fail over, we'd need either a router rule that DMZs *whichever IP
# gpuserver1 has* (Fios doesn't support that), or move gpuserver1 to a static
# wired IP and accept rentals only land when wired is up. Raise with Alton if
# rental continuity matters during outages.
#
# IMPORTANT: this script needs the LGP123 PSK passed via env var. Don't bake
# the password into a file. Recommended invocation:
#   PSK=$(sartor-secret read 'LGP123 PSK')  # from Rocinante
#   ssh gpuserver1 "PSK='$PSK' bash -s" < wifi-backup-setup.sh
# or:
#   scp this script to gpuserver1, then run as: PSK='...' bash wifi-backup-setup.sh

set -euo pipefail

if [[ -z "${PSK:-}" ]]; then
  echo "ERROR: PSK env var required. Pass via env on invocation. Aborting."
  exit 2
fi

SSID="LGP123"

echo "=== Step 0: physical antenna check ==="
echo "  Verify the antenna is screwed onto the case at the MT7925 RP-SMA port."
echo "  (Without an antenna, signal will be weak and the link may flap.)"
sleep 1

echo "=== Step 1: install required packages ==="
sudo apt-get update -y
sudo apt-get install -y network-manager wpasupplicant iw rfkill

echo "=== Step 2: confirm the radio is unblocked ==="
sudo rfkill unblock wifi
sudo rfkill list

echo "=== Step 3: bring NetworkManager up and prevent it from touching eno1 ==="
# Pin eno1 management to systemd-networkd / netplan (whatever's already there).
# NetworkManager will only manage wlp7s0.
sudo tee /etc/NetworkManager/conf.d/00-eno1-unmanaged.conf >/dev/null <<'EOF'
[keyfile]
unmanaged-devices=interface-name:eno1;interface-name:docker0;interface-name:virbr0;interface-name:br-*
EOF

sudo systemctl enable --now NetworkManager
sleep 2
nmcli general status

echo "=== Step 4: scan and join LGP123 ==="
sudo nmcli device wifi rescan || true
sleep 3
sudo nmcli device wifi list | head -30

# create the connection profile via cli (avoids dropping PSK in a file)
sudo nmcli connection delete LGP123 2>/dev/null || true
sudo nmcli device wifi connect "$SSID" password "$PSK" ifname wlp7s0 name LGP123

echo "=== Step 5: pin route metrics so wired wins when both are up ==="
# eno1 = primary (low metric); wlp7s0 = backup (high metric)
sudo nmcli connection modify LGP123 ipv4.route-metric 600 ipv6.route-metric 600
sudo nmcli connection modify LGP123 connection.autoconnect yes
# Reapply
sudo nmcli connection up LGP123 || true

echo "=== Step 6: verify ==="
ip -br addr show wlp7s0
ip -4 route show
sudo nmcli -t -f NAME,DEVICE,STATE connection show --active

echo
echo "=== Done ==="
echo "  - LGP123 saved as autoconnect on wlp7s0"
echo "  - Wired (eno1) keeps the default route as long as it has a link"
echo "  - To force-test failover:  sudo ip link set eno1 down  (then up again)"
echo "  - To remove backup:        sudo nmcli connection delete LGP123"
