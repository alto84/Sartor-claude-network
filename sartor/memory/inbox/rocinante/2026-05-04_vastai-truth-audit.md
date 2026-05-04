---
type: audit
category: vastai_truth
source: gpuserver1
machine_id: 52271
date: 2026-05-04
mission: MISSION-vastai-truth-2026-05-04
mission_status: executed-without-mission-file
budget_min: 30
tags: [audit/vastai, machine/gpuserver1, doc/drift]
related: [MACHINES, BUSINESS, business/rental-operations, inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02]
---

# vast.ai truth audit — gpuserver1, 2026-05-04

## Mission-file caveat

Rocinante asked me to execute `sartor/memory/inbox/gpuserver1/MISSION-vastai-truth-2026-05-04.md`. I `git pull origin main`'d (origin = GitHub) and the file is not present. Origin/main HEAD is `2577dcf8` (gather run 47). The bare repo on rtxserver is canonical; GitHub mirror runs nightly at 3:30 AM ET, so a mission pushed today after the last mirror window would not yet be on GitHub. I cannot pull from rtxserver bare from here — no SSH key from gpuserver1 to rtxserver (`Permission denied (publickey,password)` on `ssh alton@192.168.1.157`).

I executed against the most plausible interpretation of the mission name and the open question raised in `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` §7.5 ("MACHINES.md / CLAUDE.md pricing drift, worth a curator pass to truth-up"). That is: read-only verification of vast.ai facts in the docs against live state on machine 52271. If the actual mission was different, re-fire and I will re-execute.

This run modified no state on gpuserver1 or in the marketplace.

## Live state (snapshot, `vastai show machines --raw` at 2026-05-04T~02:30Z)

| Field | Live value |
|---|---|
| `machine_id` | 52271 |
| `hostname` | gpuserver1 |
| `verification` | verified |
| `listed` | true |
| `gpu_name` | RTX 5090 |
| `num_gpus` | 1 |
| `gpu_ram` | 32607 MB |
| `cpu_ram` | 128526 MB |
| `cuda_max_good` | 12.8 |
| `driver_version` | 570.144 |
| `pci_gen` / `gpu_lanes` | 5.0 / 16 |
| `disk_space` | 1334 GB (alloc 249, avail 1381, max 1759) |
| `public_ipaddr` | 100.1.100.63 |
| `geolocation` | New Jersey, US |
| `direct_port_count` | 100 |
| `listed_gpu_cost` (on-demand) | **$0.30/hr** |
| `min_bid_price` (interruptible floor) | **$0.25/hr** |
| `listed_storage_cost` | **$0.15/GB-mo** |
| `listed_inet_up_cost` | $0.0029296875/GB → ~$3.00/TB |
| `listed_inet_down_cost` | $0.001953125/GB → ~$2.00/TB |
| `end_date` | 1792865579 → **2026-10-24 18:13 UTC** |
| `client_end_date` | 1787529600 → 2026-08-24 00:00 UTC |
| `current_rentals_running` | 1 |
| `earn_hour` / `earn_day` | $0.196 / $4.70 |
| `gpu_max_cur_temp` | 43°C |
| `reliability2` | 0.9726 |

Active container (`docker ps`): `C.34113802` running image `vastai/pytorch_cuda-12.8.1-auto/ssh`, **up 4 weeks**, GPU 0% util, 866 MiB / 32607 MiB used. Renter is paying for reserved capacity but presently idle.

Earnings (`vastai show earnings --raw`): current cycle balance $9.90, all from machine 52271, $4.14 GPU + $0.57 storage today. Account `alto84@gmail.com`.

Heartbeat (`inbox/gpuserver1/_heartbeat.md`): green, 2026-05-04T02:00:06Z, `cron_failures_24h: 26` — non-zero, worth investigating in a follow-up but not in scope here.

## Drift table — docs vs live

| Claim | Where documented | Documented value | Live value | Status |
|---|---|---|---|---|
| GPU on-demand rate | `~/CLAUDE.md` (gpuserver1 self-doc) | $0.40/hr | $0.30/hr | **STALE** |
| GPU on-demand rate | `Sartor-claude-network/CLAUDE.md` Domain 1 | $0.35/hr (claims "verified 2026-04-19") | $0.30/hr | **STALE** |
| GPU on-demand rate | `MACHINES.md` line 71 | "$0.40/hr base; raised to $0.35/hr 2026-04-11" | $0.30/hr | **STALE** |
| GPU on-demand rate | `business/rental-operations.md:67` | $0.35/hr | $0.30/hr | **STALE** |
| Interruptible (min bid) | `~/CLAUDE.md` | $0.25/hr | $0.25/hr | OK |
| Interruptible (min bid) | `Sartor/CLAUDE.md` | $0.26/hr interruptible | $0.25/hr | STALE (off by $0.01) |
| Interruptible (min bid) | `business/rental-operations.md:67` | $0.26/hr | $0.25/hr | STALE (off by $0.01) |
| Reserved rate | `Sartor/CLAUDE.md` | $0.40/hr reserved | n/a — vast.ai exposes `listed_gpu_cost` + `min_bid_price`; no separate reserved field. Reserved billing is per-rental contract, not a machine-level listed price | **DOC FICTION** |
| Storage cost | `~/CLAUDE.md` | $0.10/hr | $0.15/GB-mo | STALE + UNIT WRONG (it is per-GB-month, not per-hour) |
| Listing end date | `~/CLAUDE.md`, `Sartor/CLAUDE.md`, `MACHINES.md` | 2026-08-24 | 2026-10-24 (auto-renewed via web UI) | **STALE** |
| Status command "show active rentals" | `~/CLAUDE.md` | `vastai show instances` | `vastai show instances` returns `[]` for hosts; it lists **client-side** rentals. Host-side rentals require `docker ps --names | grep '^C\.'` (matches kaalia's container naming convention) | **DOC BUG** |
| Cron jobs active on gpuserver1 | `MACHINES.md` lines 81–93 | `run_monitor.sh` every 2h (P0), 5 jobs total | `run_monitor.sh` does not exist on disk; live crontab has `gather_mirror.sh` (4h), `stale-detect.sh` (1h), `vastai-tend.sh` (30m), `rgb_status.py` (5m), `docker-weekly-prune.sh` (Sun 4am) — 5 jobs but a different 5 | **STALE** |
| `vastai-tend.sh` deprecated 2026-04-12 | `MACHINES.md` lines 142–143 + lines 258–276 | Deprecated, renamed to `.deprecated-2026-04-12` | The renamed file does exist (`vastai-tend.sh.deprecated-2026-04-12`, 2484 bytes) BUT the active `vastai-tend.sh` (2857 bytes, edited 2026-04-19) is alive and in cron | **STALE** — script was un-deprecated and re-edited 2026-04-19; MACHINES.md history not updated |
| Tending cadence | `Sartor/CLAUDE.md` Domain 1 | "every 2h via cron on gpuserver1" referencing `~/vastai-tend.sh` | Cadence is 30m (`*/30 * * * *`), not 2h | STALE |
| Alert sink path | `Sartor/CLAUDE.md` Domain 1 | "`~/.vastai-alert`" | Live path is `~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/{vastai,stale-alerts,_heartbeat.md}` | STALE |
| Self-test command | `~/CLAUDE.md` | `vastai self-test machine 52271` | Correct command, runs (not re-run during this audit — would have consumed the slot) | OK |

## Facts that are correctly documented

- Machine ID **52271** — consistent everywhere, matches live.
- Verification status **verified** — consistent.
- Hardware (RTX 5090, 32GB VRAM, i9-14900K, 128GB RAM, 1.7TB Docker volume) — consistent.
- Network bandwidth pricing $3.00/TB up, $2.00/TB down — consistent with live `listed_inet_*_cost` values.
- Public IP 100.1.100.63 — consistent (same CGNAT IP since at least 2026-05-02).
- DMZ-on-Fios + UFW + DOCKER-USER conntrack architecture — consistent with live `iptables` and `ufw status`.
- Stripe payout under Solar Inference LLC, account `alto84@gmail.com` — confirmed by earnings query.
- Kaalia daemon under `vastai_kaalia` user, sshd on port 40099 — confirmed by `ps aux`.
- Geolocation New Jersey — consistent.
- Driver 570.144, CUDA 12.8 — consistent.

## Recommended truth-up edits (for Rocinante curator, not for me to apply)

These are doc-only edits. Live state is the source of truth; docs lag.

1. **`Sartor-claude-network/CLAUDE.md` Domain 1, "Pricing" line.** Change to:
   `Pricing (live as of 2026-05-04, verified via vastai show machines): $0.30/hr on-demand, $0.25/hr interruptible (min_bid floor), $0.15/GB-mo storage, $3.00/TB upload, $2.00/TB download. The "$0.40/hr reserved" figure previously listed has no corresponding marketplace field — reserved is a per-rental contract, not a host-set machine price; remove.`

2. **`Sartor-claude-network/CLAUDE.md` Domain 1, "Listing expiry" line.** Change `2026-08-24` → `2026-10-24` (auto-renewed via web UI, not via the documented CLI command).

3. **`Sartor-claude-network/CLAUDE.md` Domain 1, "Known Issues" line about cadence.** Change `every 2h via cron on gpuserver1 (~/vastai-tend.sh). Alerts land in ~/.vastai-alert.` → `every 30 min via cron (~/vastai-tend.sh, state-change-only). State-change events land in sartor/memory/inbox/gpuserver1/vastai/. Hourly stale-detect.sh writes inbox/gpuserver1/_heartbeat.md and stale-alerts/.`

4. **`Sartor-claude-network/CLAUDE.md` Domain 1, "Status Commands"  → "active rentals".** `vastai show instances` returns `[]` on host-side. Replace the comment with: `# Active rentals? — host-side rental check is docker-based: docker ps --format '{{.Names}}' | grep '^C\.'  (kaalia names customer containers C.<instance_id>). vastai show instances is for client-side rentals only.`

5. **`~/CLAUDE.md` (gpuserver1 self-doc, on this machine).** Same three pricing/end-date/cadence updates. Storage line `$0.10/hr` → `$0.15/GB-mo` (was both stale value and wrong unit).

6. **`MACHINES.md` line 71.** Change pricing block to live values (see #1 above), update end_date, and add a 2026-05-04 history line: "Live state diverged from docs: GPU rate now $0.30 (lowered from $0.35 sometime between 2026-04-11 and 2026-05-02 via web UI; mechanism not captured in any inbox); end_date renewed to 2026-10-24 via web UI."

7. **`MACHINES.md` cron block (lines 81–93).** Replace with the actual five-job set from `crontab -l`: `gather_mirror.sh` (4h), `stale-detect.sh` (1h), `vastai-tend.sh` (30m, un-deprecated 2026-04-19), `rgb_status.py` (5m), `docker-weekly-prune.sh` (Sun 4am). Note that `run_monitor.sh` no longer exists on disk; the 2026-04-12 cleanup story in MACHINES.md is overwritten by the 2026-04-19 script set documented in `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` §1 and §2.

8. **`business/rental-operations.md:67`.** Update to `$0.30/hr demand, $0.25/hr interruptible (as of 2026-05-04 audit; previous $0.35/$0.26 from 2026-04-11 was lowered via web UI)`.

## Open questions surfaced by this audit (for Alton)

- **Who lowered the on-demand rate from $0.35 to $0.30, and when?** No inbox entry, no `vastai list machine` invocation in any cron log I have access to, no daily-log mention. Most plausible: someone (Alton or Rocinante via the web UI) set it manually some time after 2026-04-11. The `business/rental-operations.md` "pricing authority" rules should have generated an inbox entry for this; they didn't. Either the rules are not being enforced or the change happened outside the documented channel.
- **Same question for end_date renewal to 2026-10-24.** The CLI command `vastai list machine 52271 ... -e "08/24/2026"` is the canonical relist mechanism; web-UI renewals do not generate inbox entries.
- **Is the long-running `C.34113802` rental healthy?** Up 4 weeks, GPU at 0%, 866 MiB used. Renter may have abandoned the container but is still paying. No action needed from us, but worth noting in a weekly review — if they cancel, our occupancy drops to 0.
- **`cron_failures_24h: 26` in the heartbeat** — out of scope for this audit but flagged for follow-up. 26 failures in 24h on a 5-job crontab implies one job is failing on most invocations.

## Provenance

- `~/.local/bin/vastai show machines --raw` at 2026-05-04T~02:30Z
- `~/.local/bin/vastai show instances --raw` (returned `[]`, host-side)
- `~/.local/bin/vastai show earnings --raw`
- `crontab -l`, `ls -la /home/alton/vastai-tend.sh*`
- `docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'`
- `nvidia-smi --query-gpu=...`
- `df -h /`
- File reads of MACHINES.md, business/rental-operations.md, inbox/gpuserver1/_heartbeat.md, inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md
- Injected context: `~/CLAUDE.md`, `Sartor-claude-network/CLAUDE.md`

No marketplace state, listing parameters, or container state was modified. No API key, kaalia auth tokens, or SSH keys were echoed.
