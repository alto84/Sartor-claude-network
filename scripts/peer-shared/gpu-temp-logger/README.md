# gpu-temp-logger — Sartor unified GPU thermal/power trajectory logger

These scripts run on **both** rtxpro6000server and gpuserver1, self-configuring from `$HOSTNAME`. Tracked here so they can be redeployed if either host loses them. Full architecture/schema/operations doc at `sartor/memory/machines/gpu-temp-logger-v2.md`.

## Files

| File | Destination on host |
|---|---|
| `gpu-temp-logger.sh` | `/home/alton/gpu-temp-logger.sh` (chmod +x) |
| `gpu-temp-summary.sh` | `/home/alton/gpu-temp-summary.sh` (chmod +x) |
| `gpu-temp-logger.service` | `/home/alton/.config/systemd/user/gpu-temp-logger.service` |

## Deploy from scratch (per host)

```bash
# from Rocinante
scp scripts/peer-shared/gpu-temp-logger/gpu-temp-logger.sh    alton@HOSTNAME:/home/alton/
scp scripts/peer-shared/gpu-temp-logger/gpu-temp-summary.sh   alton@HOSTNAME:/home/alton/
scp scripts/peer-shared/gpu-temp-logger/gpu-temp-logger.service alton@HOSTNAME:/home/alton/.config/systemd/user/

ssh alton@HOSTNAME '
  chmod +x /home/alton/gpu-temp-logger.sh /home/alton/gpu-temp-summary.sh
  # lingering should already be enabled; verify:
  loginctl show-user alton --property=Linger
  # add summary cron if not already present:
  (crontab -l 2>/dev/null; echo "7 * * * * /home/alton/gpu-temp-summary.sh >> /home/alton/generated/cron-logs/gpu-temp-summary.log 2>&1") | sort -u | crontab -
  systemctl --user daemon-reload
  systemctl --user enable gpu-temp-logger.service
  systemctl --user start gpu-temp-logger.service
  sleep 5
  systemctl --user status gpu-temp-logger.service --no-pager
'
```

## Adding a new host

Edit the `case "$HOSTNAME"` block at the top of both `.sh` files to add the new host's machine_id, num_gpus, cpu_temp_source, have_bmc, and thresholds. Then deploy per above.

## What the script does NOT do

- Mutate any customer container or GPU state. Read-only sensor access.
- Network. No metric is sent anywhere.
- Write outside `~/generated/cron-logs/` (CSVs + daemon logs) and `~/Sartor-claude-network/sartor/memory/inbox/{host}/{alerts,_temp-summary}/`.
