#!/usr/bin/env bash
# Continuation script after reallocate-docker-to-nvme0n1.sh succeeded through
# Step 3 (rsync OK at 906 MB/s) but Step 4 failed because containerd and
# vastai-kaalia auto-restarted during the rsync. /dev/nvme0n1p1 holds the
# full copy already; we just need to finish the mount swap.

set -euo pipefail

PART=/dev/nvme0n1p1
STAMP=$(date +%Y%m%d-%H%M%S)
UUID=$(sudo blkid -s UUID -o value $PART)
echo "NVMe partition UUID: $UUID"

echo "=== Step A: stop everything that opens /var/lib/docker ==="
sudo systemctl stop vastai.service
# Kill any kaalia/launch_kaalia subprocesses that didn't follow the service
sudo pkill -f 'launch_kaalia.sh' 2>/dev/null || true
sudo pkill -f '/var/lib/vastai_kaalia/latest/kaalia' 2>/dev/null || true
sleep 1
sudo systemctl stop docker.service docker.socket
sudo systemctl stop containerd.service
sleep 2

echo "=== Step B: verify nothing holds /var/lib/docker ==="
if sudo lsof +D /var/lib/docker 2>/dev/null | head -5; then
    echo "(any open files shown above will block the umount; investigate if any)"
fi
if pgrep -f docker || pgrep -f containerd || pgrep -f kaalia; then
    echo "WARNING: still see daemon processes:"
    pgrep -af 'docker|containerd|kaalia' || true
fi

echo "=== Step C: refresh rsync delta (a few seconds of writes may have happened) ==="
sudo mkdir -p /mnt/docker-new
sudo mount $PART /mnt/docker-new
sudo rsync -aHAX --delete /var/lib/docker/ /mnt/docker-new/ 2>&1 | tail -5
sudo umount /mnt/docker-new

echo "=== Step D: swap mounts ==="
sudo umount /var/lib/docker
sudo mount $PART /var/lib/docker
df -h /var/lib/docker

echo "=== Step E: write /etc/fstab ==="
sudo cp /etc/fstab /etc/fstab.bak-$STAMP
# Drop any existing /var/lib/docker line (whatever fs type)
sudo sed -i '\#/var/lib/docker#d' /etc/fstab
echo "UUID=$UUID /var/lib/docker ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab >/dev/null
echo "fstab now contains:"
grep -E 'docker|nvme' /etc/fstab

echo "=== Step F: start services ==="
sudo systemctl start containerd.service
sleep 2
sudo systemctl start docker.service
sleep 3
sudo systemctl start vastai.service
sleep 5

echo "=== Step G: verify ==="
df -h /var/lib/docker
echo "---"
sudo docker info --format 'storage: {{.Driver}}  root: {{.DockerRootDir}}' 2>&1
echo "---"
echo "vast.ai listing (may take ~30-120 sec for daemon to re-publish):"
~/.local/bin/vastai show machines --raw 2>&1 | python3 -c '
import sys, json
d = json.load(sys.stdin)
for m in d["machines"]:
    if "7975WX" in m.get("cpu_name", ""):
        print("machine_id:", m["machine_id"])
        print("avail_disk_GB:", m.get("avail_disk_space"))
        print("max_disk_GB:", m.get("max_disk_space"))
        print("disk_name:", m.get("disk_name"))
        print("disk_bw_MBps:", m.get("disk_bw"))
        print("listed:", m.get("listed"))
        break
'

echo
echo "=== old data still on /dev/sda6 (47 GB SATA Samsung 850) ==="
echo "It is unmounted now. To reclaim and verify nothing else needs it later, run:"
echo "  sudo wipefs -a /dev/sda6  (only after a few days of healthy operation)"
echo
echo "=== DONE ==="
