---
title: rtxserver disk reallocation, 2026-05-10
description: Moved Docker root from a 47 GB SATA partition to the unused 4 TB Samsung 990 PRO NVMe to fix the 16 GB / 221 MB/s ceiling vast.ai customers were seeing
type: project
created: 2026-05-10
updated: 2026-05-10
---

# rtxserver disk reallocation report

## TL;DR

| | Before | After |
|---|---|---|
| Docker root | `/dev/sda6` (47 GB partition on Samsung SSD 850 SATA) | `/dev/nvme0n1p1` (3.6 TB ext4 on Samsung 990 PRO 4 TB NVMe) |
| Free space for rentals | **16 GB** | **3.4 TB** |
| Local read benchmark (`dd iflag=direct`) | ~356 MB/s (SATA ceiling) | **4.4 GB/s** (12× faster) |
| vast.ai `max_disk_space` field | 47 GB | **3480 GB** (already updated) |
| vast.ai `volume_total_size` field | 8 GB | **3000 GB** (already updated) |
| vast.ai `disk_space` / `disk_bw` fields | 16 GB / 356 MB/s | Still showing old values; will refresh on vast.ai's verification cycle (hours, sometimes longer) |

Zero rental impact. Machine had 0 running rentals at the start (and still does). All operations reversible.

## Root cause

When rtxserver was first onboarded, Ubuntu's installer placed Docker's data dir on the small SATA SSD partition `/dev/sda6` (47 GB, Samsung 850 — old SATA drive limited to ~500 MB/s sequential). The 4 TB Samsung 990 PRO NVMe (`/dev/nvme0n1`) was installed but never partitioned or mounted. Vast.ai customers saw whatever was available on `/var/lib/docker`, so 16 GB free was the rental ceiling and SATA was the speed ceiling.

## What was done

1. **Verified preconditions**: no running rentals, `/dev/nvme0n1` empty (no fstype, no partition table, not in fstab).
2. **Stopped services**: `vastai.service`, `docker.service`, `docker.socket`, `containerd.service`, plus killed leftover `launch_kaalia.sh` / `kaalia` subprocesses.
3. **Partitioned + formatted nvme0n1**: GPT, single ext4 partition (label `docker`, lazy_itable_init=0 to avoid background fsck IO), UUID `3e81c362-c43a-40e3-ba80-f75e9513a73c`.
4. **rsync'd** `/var/lib/docker/` → new partition (33 GB, 122 K files; transferred at 906 MB/s, read-limited by the source SATA drive).
5. **Swapped mounts**: unmounted `/dev/sda6` from `/var/lib/docker`, mounted `/dev/nvme0n1p1` there.
6. **Updated `/etc/fstab`**: removed the implicit sda6 entry (which was inherited from the installer), added the new UUID with `defaults,nofail` so a future NVMe issue won't brick boot. `/etc/fstab.bak-*` retained.
7. **Started services**: `containerd` → `docker` → `vastai`.
8. **Unlisted + relisted** machine 97429 on vast.ai with `-v 3000` to make 3000 GB available as a volume contract offer.

## Verification

```
$ df -h /var/lib/docker
/dev/nvme0n1p1  3.6T   32G  3.4T   1% /var/lib/docker

$ sudo dd if=/var/lib/docker/read_test.0.0 of=/dev/null bs=1M iflag=direct
134217728 bytes (134 MB) copied, 0.0304336 s, 4.4 GB/s

$ tail kaalia.log
sys_info  avail: 3903433101312   total: 3936818806784  ...

$ vastai show machines | rtxserver row
machine_id: 97429   listed: True
max_disk_space:    3480 GB   (was 47)
volume_total_size: 3000.0    (was 8)
disk_space:        16        (still old - vast.ai central API has not refreshed)
disk_bw:           356.0     (still old - will re-measure on vast.ai's next read-bench cycle)
disk_name:         "AMI Virtual"  (this is vast.ai's algorithm picking the BMC IPMI phantom disk over the real NVMes; cosmetic only)
```

## What's still pending and out of our hands

Two fields at vast.ai's central API have not refreshed yet:

- `disk_space` (container-rental disk cap) is still 16 GB.
- `disk_bw` (sustained read benchmark) is still 356 MB/s.

These are computed at vast.ai's backend from data kaalia sends. Kaalia has been sending the correct values (`sys_info  avail: 3903 GB`) every ~70 sec since the migration. The refresh cadence at vast.ai's side is not documented; on past machine onboardings these have updated within a few hours but I have seen them lag a day. The volume listing (3000 GB) DID propagate within a minute, which suggests `disk_space` is a calibration/verification-locked field.

If `disk_space` is still 16 by tomorrow morning, options:
- Try `vastai set defjob` to re-trigger machine verification
- Open a vast.ai support ticket pointing at machine_id 97429
- File this as a vast.ai bug (it's almost certainly a stale cached value, not anything we can push from our side)

`disk_name: "AMI Virtual"` is cosmetic — it's vast.ai's heuristic for which disk to label the host as, and it's picking up the AMI BMC's phantom USB virtual disk (`/dev/sdb`) instead of the actual NVMes. Doesn't affect rental availability.

## Rollback (if needed)

```bash
sudo systemctl stop vastai docker
sudo umount /var/lib/docker
sudo sed -i '\#nvme0n1p1#d' /etc/fstab
# /dev/sda6 still has the original Docker contents intact (was just unmounted, not wiped)
sudo mount /dev/sda6 /var/lib/docker
sudo systemctl start docker vastai
```

The old data on `/dev/sda6` was never overwritten — only unmounted. So full rollback is one `mount` away. Once rtxserver has been operating cleanly off the NVMe for a few days, `sudo wipefs -a /dev/sda6` reclaims that partition.

## Audit-trail commits

- Two scripts checked in for replay: `reallocate-docker-to-nvme0n1.sh` (initial run) and `reallocate-finish.sh` (continuation after services auto-restarted during the first attempt).
- This report doc.

## Lessons

1. **vast.ai daemons auto-restart**: stopping `vastai.service` is not sufficient — `containerd.service` also holds `/var/lib/docker`, and on Ubuntu systemd auto-restarts kaalia children. The full stop sequence is `vastai → kill launch_kaalia subprocesses → docker.service + docker.socket → containerd.service`, in that order.
2. **`launch_kaalia.sh` gets reverted**: editing it doesn't persist; vast.ai's update mechanism rewrites it. To change kaalia args, modify `/etc/systemd/system/vastai.service` or override via systemd drop-in, not the script itself.
3. **`disk_name` reported by vast.ai is determined by their algorithm, not by us**: the "AMI Virtual" / "Samsung SSD 850" labels are vast.ai's heuristic-of-the-day, not authoritative. The numeric fields (`max_disk_space`, `volume_total_size`) are what matter for billing and customer-facing capacity.
4. **The bw_report file in /var/lib/vastai_kaalia is network bandwidth per container**, not disk bandwidth. Disk bandwidth is measured via the `read_test.N.0` files in `/var/lib/docker` (which migrated with the rsync and now sit on the fast NVMe, so the next benchmark cycle will catch the upgrade).
