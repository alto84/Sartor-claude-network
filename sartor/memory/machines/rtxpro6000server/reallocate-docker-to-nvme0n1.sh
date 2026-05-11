#!/usr/bin/env bash
# Re-allocate rtxpro6000server's Docker root from the 47 GB SATA SSD partition
# (sda6, Samsung 850, ~221-356 MB/s sustained) to the unused 4 TB Samsung 990
# PRO NVMe (nvme0n1, ~5000+ MB/s sustained).
#
# Pre-conditions (verified 2026-05-10):
#   - /dev/nvme0n1 is unpartitioned and unformatted (no fstype, no UUID)
#   - vast.ai machine 97429 has 0 running rentals
#   - /etc/sudoers.d/alton-nopasswd grants NOPASSWD ALL
#   - vastai.service is the vast.ai host daemon; docker.service is Docker
#
# What this does:
#   1. Stop vastai.service and docker.service
#   2. Create a single GPT/ext4 partition on /dev/nvme0n1
#   3. Mount it temporarily at /mnt/docker-new
#   4. rsync /var/lib/docker/ -> /mnt/docker-new/   (preserves perms / xattrs)
#   5. Unmount, then move old /var/lib/docker -> /var/lib/docker.bak-YYYYMMDD
#   6. Mount /dev/nvme0n1p1 at /var/lib/docker
#   7. Write the new UUID into /etc/fstab so it survives reboot
#   8. Start docker.service and vastai.service
#   9. Print verification: df, lsblk, fstab, docker info, vastai listing
#
# Rollback if anything blows up:
#   sudo systemctl stop vastai docker
#   sudo umount /var/lib/docker
#   sudo rm -rf /var/lib/docker
#   sudo mv /var/lib/docker.bak-* /var/lib/docker
#   sudo sed -i '/nvme0n1p1/d' /etc/fstab
#   sudo mount -a
#   sudo systemctl start docker vastai

set -euo pipefail

NVME=/dev/nvme0n1
PART=/dev/nvme0n1p1
TMPMNT=/mnt/docker-new
STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/var/lib/docker.bak-$STAMP

# Sanity: don't run if there's a rental
running=$(~/.local/bin/vastai show machines --raw | python3 -c '
import sys, json
d = json.load(sys.stdin)
for m in d["machines"]:
    if "7975WX" in m.get("cpu_name", ""):
        print(m.get("current_rentals_running", 0))
        break
')
if [[ "$running" != "0" ]]; then
    echo "ABORT: rtxserver has $running running rental(s). Will not touch Docker root."
    exit 2
fi
echo "OK: 0 running rentals."

# Sanity: nvme0n1 is empty
if sudo blkid $NVME 2>/dev/null; then
    echo "ABORT: $NVME already has a filesystem signature. Refusing to overwrite."
    sudo blkid $NVME
    exit 3
fi
echo "OK: $NVME is empty."

echo "=== Step 1: stop vastai + docker ==="
sudo systemctl stop vastai.service
sudo systemctl stop docker.service docker.socket || true

echo "=== Step 2: partition + format $NVME ==="
sudo parted -s $NVME mklabel gpt mkpart docker ext4 0% 100%
# Wait for kernel to enumerate the partition
sleep 2
sudo partprobe $NVME || true
sleep 1
sudo mkfs.ext4 -F -L docker -E lazy_itable_init=0,lazy_journal_init=0 $PART
UUID=$(sudo blkid -s UUID -o value $PART)
echo "  $PART formatted ext4, UUID=$UUID"

echo "=== Step 3: mount temp + rsync /var/lib/docker -> $PART ==="
sudo mkdir -p $TMPMNT
sudo mount $PART $TMPMNT
df -h $TMPMNT
echo "  starting rsync (this is the slow step)..."
sudo rsync -aHAX --info=stats2 /var/lib/docker/ $TMPMNT/
sudo umount $TMPMNT

echo "=== Step 4: swap mount points ==="
# Unmount sda6 from /var/lib/docker
sudo umount /var/lib/docker
# Rename old (still resident on sda6, but unmounted -> orphan from this fs)
sudo mkdir -p /var/lib/docker  # remount target
# Mount the new NVMe partition
sudo mount $PART /var/lib/docker
df -h /var/lib/docker

echo "=== Step 5: update /etc/fstab ==="
# Remove old /var/lib/docker line (sda6) and add new one
sudo cp /etc/fstab /etc/fstab.bak-$STAMP
# Strip any existing line that mounts /var/lib/docker
sudo sed -i '\#/var/lib/docker#d' /etc/fstab
echo "UUID=$UUID /var/lib/docker ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab
echo "  fstab updated:"
grep docker /etc/fstab

echo "=== Step 6: keep old data on sda6 as backup ==="
# We've unmounted sda6. Its data is still on the partition. Rename the mountpoint reference.
# (Old data persists on sda6 until that partition is reused or wiped.)
echo "  old Docker data still on /dev/sda6 (unmounted). To reclaim: sudo wipefs /dev/sda6 (after verifying new setup)"

echo "=== Step 7: start docker + vastai ==="
sudo systemctl start docker.service
sleep 3
sudo systemctl start vastai.service
sleep 5

echo "=== Step 8: verify ==="
echo "--- mount state ---"
df -h /var/lib/docker
echo "--- lsblk ---"
lsblk -f /dev/nvme0n1
echo "--- docker info ---"
sudo docker info --format 'storage: {{.Driver}}  root: {{.DockerRootDir}}' 2>&1
echo "--- vast.ai listing (host daemon should re-publish disk metadata within ~30s) ---"
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
echo "=== DONE ==="
echo "If avail_disk_GB still shows 16 immediately, that's normal — the vastai daemon"
echo "needs 30-120 sec to re-benchmark and re-publish. Re-run 'vastai show machines'"
echo "in a couple minutes."
