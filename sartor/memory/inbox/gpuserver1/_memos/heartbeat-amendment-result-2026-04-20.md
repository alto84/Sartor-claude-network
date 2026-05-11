---
type: report
operation: heartbeat_amendment
origin: gpuserver1
created: 2026-04-20T01:16:00Z
status: completed
related: [OPERATING-AGREEMENT, 2026-04-16_heartbeat-amendment, 2026-04-19_heartbeat-and-gateway]
---

# Heartbeat Amendment Result

## What was changed

**Script:** `/home/alton/stale-detect.sh` (cron: hourly, `0 * * * *`)

Added a heartbeat emission block at the end of `stale-detect.sh`. This was chosen over `gather_mirror.sh` (4h interval, too infrequent) and `vastai-tend.sh` (state-change-only, would miss quiet hours). `stale-detect.sh` runs hourly, so two consecutive sweeps produce heartbeats within a 2.5h window as required.

## Atomic write mechanism

1. Write heartbeat content to `$HEARTBEAT_DIR/.heartbeat.tmp.$$` (PID-suffixed temp file in same filesystem)
2. `mv` temp file over `_heartbeat.md`
3. On `mv` failure: log error locally, remove temp file, let sweep continue

## Schema compliance

Frontmatter fields per Operating Agreement section 2.3:
- `type: heartbeat`
- `origin: gpuserver1`
- `heartbeat: <ISO 8601 UTC>`
- `sweep_id: stale-detect-<YYYYMMDDTHHMMSSZ>-<PID>` (unique per sweep)
- `status: green|yellow|red`

Body `## Status` section:
- `gpu_util_1h_avg` (from nvidia-smi)
- `vastai_listing` (listed/unlisted/unreachable)
- `active_rentals` (count of kaalia C.* containers)
- `last_pull` (git log -1 timestamp)
- `generated_dir_size` (du -sh ~/generated/)
- `cron_failures_24h` (grep count across all 3 cron logs)

## Status determination logic

- `green`: no stale signals detected in the sweep
- `yellow`: stale signals present but vastai reachable
- `red`: vastai unreachable

## Non-blocking guarantee

The heartbeat block runs after the stale-alert write. All commands inside the heartbeat block redirect to the log file. If the `mv` fails, the error is logged and the script exits cleanly.

## First heartbeat

Generated at `2026-04-20T01:15:50Z`, status `green`, sweep_id `stale-detect-20260420T011550Z-4049639`.

## Bug found and fixed

Initial implementation had a bash arithmetic error: `grep -c` output contained trailing whitespace that broke `$(( ))` evaluation. Fixed by sanitizing with `tr -dc '0-9'`.

## Acceptance criteria

- Heartbeat file present with schema-compliant content: YES
- Atomic write (temp + mv): YES
- Non-blocking (failures logged, sweep continues): YES
- Two consecutive sweeps will produce fresh heartbeats: YES (next at ~01:00 UTC + 1h = ~02:00 UTC)
