---
name: rtxserver-pre-kaalia-2026-05-04
description: Pre-kaalia readiness report for rtxpro6000server. Live verification of all stage-able items per MISSION-vastai-prep-2026-05-04. Confirms tracker's "RESOLVED" claims with evidence, isolates the manual-Alton step to the absolute minimum (one sudo command + 2 port-prompt integers), and lists what auto-completes after.
type: status
date: 2026-05-04
from: rtxpro6000server
to: rocinante
related:
  - sartor/memory/projects/rtxserver-vastai-watch
  - sartor/memory/inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02
  - sartor/memory/inbox/rtxpro6000server/MISSION-vastai-prep-2026-05-04
  - sartor/memory/machines/rtxpro6000server/CRONS
tags: [machine/rtxpro6000server, vastai-onboarding, status, pre-kaalia]
---

# rtxserver pre-kaalia readiness — 2026-05-04 02:30 UTC (22:30 EDT 2026-05-03)

## TL;DR

All stage-able items verified live. **Power cap unit, UFW, hairpin NAT, vastai CLI auth, API key, and cron-script staging are all in the state the tracker claimed.** No regression from the 2026-05-02 paused state. The only blocker is the kaalia install (which by design needs Alton at the console). One thing to flag: Docker is not installed yet — the kaalia installer normally drags it in, but if it doesn't, that's a follow-up.

Uptime is 3h 52min as of report write — this is the post-AC-failure boot at 2026-05-03 22:35 UTC = 18:35 EDT, matching the recorded power-cycle.

## Per-item state

| # | Item | Status | Evidence | Notes |
|---|------|--------|----------|-------|
| 1 | nvidia-power-cap.service installed | ✅ | `/etc/systemd/system/nvidia-power-cap.service` mode 644 root:root, 1323 bytes, mtime 2026-05-02 23:39 | Documents Before=docker.service, After=nvidia-persistenced.service |
| 2 | nvidia-power-cap.service enabled + active | ✅ | `systemctl is-enabled` → `enabled`; `is-active` → `active`. Status: "active (exited) since Sun 2026-05-03 22:35:02 UTC; 3h 52min ago". Process exit 0/SUCCESS. | Re-applied at boot. |
| 3 | Live GPU power limit = 450W both cards | ✅ | `nvidia-smi --query-gpu=power.draw,power.limit`: GPU0 5.87W/450W, GPU1 14.34W/450W | Was 600W stock; service log shows the 600→450 transition at 22:35:02. |
| 4 | External IP reachable | ✅ | `curl ifconfig.me` → `100.1.100.63` (IPv4); IPv6 also resolves | Matches the expected post-pivot IP shared with gpuserver1. |
| 5 | UFW status + 40100-40199/tcp open | ✅ | `ufw status verbose`: Status active. `40100:40199/tcp ALLOW IN Anywhere # vast.ai customer ports rtxserver` (v4 + v6) | |
| 6 | Hairpin NAT OUTPUT DNAT | ✅ | `iptables -t nat -L OUTPUT -n -v`: `DNAT tcp -- * * 0.0.0.0/0 100.1.100.63 tcp dpts:40100:40199 to:192.168.1.157` | LAN-side reachability of the public IP+ports. |
| 7 | vastai CLI present + authed | ✅ | `vastai --version` → 1.0.8. `vastai show user` returns balance row ($9.91, alto84@gmail.com, Email Vfy True). No 401. | Balance grew from $4.09 (2026-05-02) → $9.91 — likely gpuserver1 earnings. |
| 8 | API key file in place | ✅ | `~/.config/vastai/vast_api_key`, mode 600, owner alton:alton, 64 bytes, mtime 2026-05-02 20:47 | Untouched since onboarding. |
| 9 | Docker installed | ❌ | `docker --version` → command not found. `systemctl is-active docker` → inactive. | **Flag:** kaalia's installer typically apt-installs docker.io + nvidia-container-toolkit as part of the host-package flow. If it doesn't, this is a manual follow-up. Not blocking the install attempt. |
| 10 | kaalia not yet installed (expected) | ⏳ | `/var/lib/vastai_kaalia/` does not exist. No `kaalia` processes. No listeners on 40100-40199 (expected pre-install). | This is the gate. |
| 11 | Cron scripts staged | ✅ | `~/cron-scripts-staged/` contains all 4 scripts: gather_mirror.sh (4572B), stale-detect.sh (3847B), vastai-tend.sh (4322B), docker-weekly-prune.sh (3945B). All `bash -n` clean. Inbox path templates correctly use `$HOSTNAME` so they auto-resolve to `inbox/rtxpro6000server/...` when run here. | See §"Cron-script note" below — the mission's MACHINE_ID-placeholder edit is moot; the scripts auto-discover. |
| 12 | Hairpin-NAT reference draft archived | ✅ | `~/cron-scripts-staged/hairpin-nat-rules.txt` present (4078B). Reference only — the live OUTPUT DNAT is already applied (item 6). | |

### Cron-script note (correction to the mission's Step 3)

The mission asked to "edit the MACHINE_ID variable in each script to a placeholder `RTXSERVER_MACHINE_ID_TBD`." None of the 4 scripts have a hardcoded MACHINE_ID variable. Both `vastai-tend.sh` and `stale-detect.sh` discover the host's machine row dynamically by parsing `vastai show machines` output at runtime. `gather_mirror.sh` and `docker-weekly-prune.sh` don't need a machine_id at all. So no edit is needed and none was done — the scripts will Just Work the moment kaalia registers a machine_id. The provenance "(vs gpuserver1 source)" comments in the script headers are documentation of where the scripts came from, not active code references.

If for some reason there's a value in pinning a MACHINE_ID (e.g., to future-proof against a multi-machine kaalia install), say so and I'll add it.

### Docker absence

Two paths:
- **Path A (preferred, default):** Run kaalia installer as-is. Per vast.ai's published `setup.sh`, it apt-installs docker.io + nvidia-container-toolkit + dependencies before kaalia itself. If that flow is intact, no manual docker install is needed.
- **Path B (fallback, only if installer fails on docker step):** `sudo apt update && sudo apt install -y docker.io && sudo usermod -aG docker alton`. Then re-run kaalia installer.

I did not pre-install docker because (a) it's apt-touchable, fully reversible, but (b) any deviation from the canonical install flow risks introducing subtle conflicts with what vast.ai's installer expects. Better to let the installer do its thing.

## What Alton needs to do at the console

Reduced to the minimum:

```bash
# 1. Get the API key inline (avoid env-file fragility — installer wants it as arg)
export VAST_API_KEY="$(cat ~/.config/vastai/vast_api_key)"

# 2. Fetch the installer (first time only — re-fetch is fine if it's already there)
curl -sSL https://console.vast.ai/install -o /tmp/vast_host_installer.py

# 3. Run it. Will prompt for sudo password, then for 2 port-range integers.
sudo python3 /tmp/vast_host_installer.py "$VAST_API_KEY" \
  --interactive \
  --agree-to-nvidia-license \
  --no-driver \
  --no-libvirt
```

When it prompts for the port range, answer **40100** (start) and **40199** (end).

That's it. Three steps, one sudo password, two integers. After this returns, Alton can step away — the rest is automatable from Rocinante.

## What auto-completes after kaalia returns

This sequence can be driven by tmux send-keys from Rocinante (no console attendance):

1. **Poll for machine_id appearance (~2-5 min after install):**
   ```
   while ! ~/.local/bin/vastai show machines 2>/dev/null | grep -qE "rtxpro6000server|192.168.1.157"; do sleep 30; done
   ~/.local/bin/vastai show machines  # capture the machine_id
   ```

2. **Verify Docker is present** (kaalia installer should have brought it in):
   ```
   docker --version && sudo systemctl is-active docker
   ```

3. **Wait for kaalia benchmark warm-up (~1 hour, vast.ai-side):** poll `vastai show machines` for the `verified` and `dlperf` fields to populate. The tracker says ~1 hour but real-world has been 30-90 min.

4. **Self-test:**
   ```
   ~/.local/bin/vastai self-test machine <machine_id>
   ```
   Expect green for ports + bandwidth + GPU enumeration.

5. **List the machine** with the canonical command from `projects/rtxserver-vastai-watch.md`:
   ```
   ~/.local/bin/vastai list machine <machine_id> -g 1.25 -b 1.00 -s 0.10 -m 2 -l "6 months"
   ```
   ($1.25/GPU × 2 = $2.50/hr dual-rental, `-m 2` forces both-cards-as-one-chunk.)

6. **Verify listing visible:**
   ```
   ~/.local/bin/vastai search offers "machine_id=<machine_id>"
   ```

7. **Install cron scripts:**
   ```
   cp ~/cron-scripts-staged/*.sh ~/
   chmod +x ~/{gather_mirror,stale-detect,vastai-tend,docker-weekly-prune}.sh
   crontab -e   # paste the 4 entries from machines/rtxpro6000server/CRONS.md
   ```

8. **Update memory:** flip `projects/rtxserver-vastai-watch.md` status from `paused-pending-decision` to `live-listed`. Append to `BUSINESS.md` GPU-fleet section. Move `RESUME-vastai-onboarding-2026-05-02.md` to `_processed/`.

## Phone-home assessment

No phone-home needed. Network state matches memory, vastai CLI auth is live, hardware is healthy (no thermal anomalies, both cards idle at single-digit watts, power cap re-applied cleanly post-boot). The 14h AC-failure outage left no visible damage at this layer.

## Things I did not touch

- Did not run the kaalia installer (per mission constraint).
- Did not run `vastai list machine` or `self-test` (gated on kaalia).
- Did not modify `RESUME-vastai-onboarding-2026-05-02.md` (mission said write a new dated report; this is it).
- Did not touch BMC fan curves or power-cap settings (mission said leave alone; they're correct).
- Did not pre-install Docker (see §"Docker absence" above for rationale).
- Did not edit MACHINE_ID placeholders in cron scripts (see §"Cron-script note" — not applicable).

## Time accounting

- Mission read + state-gathering: ~10 min
- Verification + report draft: ~15 min
- Total wall-clock: ~25 min (well under the 60-min budget)
