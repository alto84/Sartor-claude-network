---
name: rtxserver-vastai-onboarding-from-gpuserver1
description: Self-contained replication guide for setting up rtxserver as a second vast.ai host, derived from gpuserver1's own configuration as it stands 2026-05-02. Quotes actual scripts, current crontab, iptables/UFW state, and onboarding chronology.
type: procedure
date: 2026-05-02
author: gpuserver1 peer Claude
target: rtxserver (dual RTX PRO 6000 Blackwell, 192.168.1.157)
tags: [procedure/replication, vast-ai, machine/gpuserver1, machine/rtxserver]
related: [MACHINES, LEARNINGS, machines/gpuserver1/MISSION, machines/gpuserver1/CRONS]
---

# rtxserver vast.ai onboarding — replicated from gpuserver1

This is a read-back of how I (gpuserver1) am actually configured today, written so that rtxserver can be brought up with the same shape. Nothing here is aspirational; every script and rule below is currently live on machine 52271. Sensitive material (API key, kaalia auth tokens, SSH keys) is described by file path and size only — never echoed.

---

## 1. My current state (read-back)

### vastai CLI
- Path: `~/.local/bin/vastai`
- Version: `0.5.0`
- Config dir: `~/.config/vastai/` (perms `drwxrwxr-x`, owner `alton:alton`, created 2026-02-23)
- API key file: `~/.config/vastai/vast_api_key` — exists, 64 bytes, `-rw-rw-r-- alton:alton`. Created via `vastai set api-key <key>` after generating in vast.ai web UI under Account → API Keys with name "gpuserver1". **Do not echo, do not commit.**

### Machine listing (`vastai show machines`)
```
ID     #gpus  gpu_name  disk  hostname    driver   reliab  veri      ip            geoloc          reports  gpuD_$/h  gpuI$/h  rdisc  netu_$/TB  netd_$/TB  occup
52271  1      RTX_5090  1334  gpuserver1  570.144  0.9712  verified  100.1.100.63  New_Jersey,_US  4        0.30      0.25     0.00   3.00       2.00       R_
```

Key fields from the raw JSON:
- `machine_id`: 52271
- `public_ipaddr`: 100.1.100.63 (CGNAT range — Verizon Fios assigns this externally)
- `verification`: verified
- `listed_gpu_cost`: 0.30 (on-demand) — note: MACHINES.md and CLAUDE.md still say $0.40/$0.35; live state is $0.30. Stale doc, not stale state.
- `min_bid_price`: 0.25 (interruptible floor)
- `listed_storage_cost`: 0.15 ($/GB-mo)
- `listed_inet_up_cost`: 0.0029296875 → ~$3.00/TB
- `listed_inet_down_cost`: 0.001953125 → ~$2.00/TB
- `direct_port_count`: 100 (40000–40099)
- `end_date`: 1792865579 → 2026-10-24 (live extension; MACHINES.md cites 2026-08-24, also stale)
- `cuda_max_good`: 12.8
- `driver_version`: 570.144
- `pci_gen`: 5.0, `gpu_lanes`: 16
- `current_rentals_running`: 1 (live as of dump time)

### State cache
`/tmp/vastai-tend-state.json`:
```json
{"listed":"true","rented":"true","ts":"2026-05-02T17:00:02+00:00"}
```

### Crontab (`crontab -l`, EX-5 era, 4 active jobs)
```cron
# === memory-system-v2 EX-5 cron triplet (installed 2026-04-12) ===
# 1. GATHER mirror — git pull + status snapshot to inbox (every 4h)
0 */4 * * * /home/alton/gather_mirror.sh

# 2. STALE detect — vastai/GPU/disk/heartbeat freshness, alert + heartbeat (hourly)
0 * * * * /home/alton/stale-detect.sh

# 3. VASTAI tend — state-change-only vastai monitoring, inbox on change (every 30 min)
*/30 * * * * /home/alton/vastai-tend.sh

# RGB status indicator — syncs case lighting with operational state (added 2026-04-12)
*/5 * * * * /usr/bin/python3 /home/alton/sartor-rgb/bin/rgb_status.py

# Weekly Docker prune — clean unused images/containers/cache (added 2026-04-19)
0 4 * * 0 /home/alton/docker-weekly-prune.sh
```
(There are also ~20 commented-out historical entries documenting deprecated scripts. Leave commented for the audit trail.)

### iptables NAT (`sudo iptables -t nat -L -nv`, abbreviated)
```
Chain PREROUTING (policy ACCEPT)
DOCKER  all  --  *  *  0.0.0.0/0  0.0.0.0/0  ADDRTYPE match dst-type LOCAL

Chain OUTPUT (policy ACCEPT)
DNAT    all  --  *  *  0.0.0.0/0  100.1.100.63          to:192.168.1.100   <-- HAIRPIN NAT
DOCKER  all  --  *  *  0.0.0.0/0  !127.0.0.0/8           ADDRTYPE match dst-type LOCAL

Chain POSTROUTING
MASQUERADE  all  --  *  !docker0  172.17.0.0/16  0.0.0.0/0

Chain DOCKER (kaalia-managed DNATs into the rental container)
DNAT  tcp  dpt:40020  to:172.17.0.2:22
DNAT  tcp  dpt:40064  to:172.17.0.2:8188
DNAT  tcp  dpt:40092  to:172.17.0.2:8189
DNAT  tcp  dpt:40052  to:172.17.0.2:40052
```
The DOCKER chain DNATs are kaalia's. **Do not hand-edit them.** The OUTPUT-chain hairpin DNAT is the load-bearing one — added by hand to `/etc/ufw/before.rules` nat table. See §6 Hairpin section for the why.

### UFW (`sudo ufw status numbered`)
```
Status: active
[ 1] 22/tcp                ALLOW IN    Anywhere                 # SSH
[ 2] 40000:40099/tcp       ALLOW IN    Anywhere                 # vast.ai
[ 3] Anywhere              ALLOW IN    192.168.1.0/24           # LAN
[ 4] 40000:40099/tcp       ALLOW FWD   Anywhere                 # vast.ai containers
[ 5] 22/tcp (v6)           ALLOW IN    Anywhere (v6)            # SSH
[ 6] 40000:40099/tcp (v6)  ALLOW IN    Anywhere (v6)            # vast.ai
[ 7] 40000:40099/tcp (v6)  ALLOW FWD   Anywhere (v6)            # vast.ai containers
```
Plus a `DOCKER-USER` chain in `/etc/ufw/after.rules` with conntrack `--ctorigdstport 40000:40099 --ctdir ORIGINAL -j ACCEPT`. (My current Claude session can't read those rules files — they're root-owned 640 — but per LEARNINGS and MISSION docs the rule is canonical and was added 2026-02-27 to resolve the Docker+UFW FORWARD DROP conflict.)

### kaalia daemon
Not a systemd unit. Launched directly:
```
vastai_+ /bin/bash /var/lib/vastai_kaalia/latest/launch_kaalia.sh
vastai_+ /var/lib/vastai_kaalia/latest/kaalia backend=DKR \
         installpath=/var/lib/vastai_kaalia/latest/ \
         machineid_fn=/var/lib/vastai_kaalia/machine_id \
         fast_init=1 skip_bwtest=1 \
         rlogfile=/var/lib/vastai_kaalia/kaalia.log
root     sshd: /usr/sbin/sshd -p 40099 -o AuthorizedKeysFile=/var/lib/vastai_kaalia/.ssh/authorized_keys ...
```
- Runs as user `vastai_kaalia` (created by installer)
- Machine ID file: `/var/lib/vastai_kaalia/machine_id` → `800a1bf017e653bdadc2fef79457b699c31d5c29279d308ce0f41ba8b15665ff` (kaalia-internal hash, distinct from the vast.ai integer machine_id 52271)
- Port range file: `/var/lib/vastai_kaalia/host_port_range` → `40000-40099`
- Heartbeat target: `52.90.216.45:7071` (per MACHINES.md)
- Auto-restarts after reboot via the installer's systemd-equivalent hooks (verified empirically across reboots)

### Docker / NVIDIA toolkit
- Docker v29.1.3
- NVIDIA Container Toolkit v1.18.1
- The kaalia daemon writes `kaalia_docker_shim` as the runtime; do not modify
- `alton` is in the `docker` group (added 2026-02-23)

---

## 2. Scripts (verbatim from filesystem)

### `/home/alton/vastai-tend.sh` (2857 bytes, mode 755, last edited 2026-04-19)
```bash
#!/bin/bash
# vastai-tend.sh — state-change-only vastai monitoring, writes to inbox on change
# Cron: every 30 min (*/30 * * * *)
# State cache: /tmp/vastai-tend-state.json
# Inbox: sartor/memory/inbox/gpuserver1/vastai/

LOG_DIR="/home/alton/generated/cron-logs"
LOG_FILE="$LOG_DIR/vastai-tend.log"
STATE_FILE="/tmp/vastai-tend-state.json"
REPO="/home/alton/Sartor-claude-network"
INBOX="$REPO/sartor/memory/inbox/gpuserver1/vastai"
VASTAI=~/.local/bin/vastai
MACHINE_ID=52271

mkdir -p "$LOG_DIR" "$INBOX"

{
  echo "=== $(date -Iseconds) ==="
  MACHINES_OUT=$($VASTAI show machines 2>/dev/null || echo "")
  if echo "$MACHINES_OUT" | grep -q "$MACHINE_ID"; then
    LISTED="true"
  else
    LISTED="false"
  fi
  # "vastai show instances" shows client-side rentals (things we rent), not host-side.
  # Kaalia names customer containers "C.<instance_id>", so check docker ps for that pattern.
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^C\.'; then
    RENTED="true"
  else
    RENTED="false"
  fi
  CURRENT_STATE="{\"listed\":\"$LISTED\",\"rented\":\"$RENTED\",\"ts\":\"$(date -Iseconds)\"}"
  STATE_CHANGED=0
  if [ -f "$STATE_FILE" ]; then
    PREV_LISTED=$(python3 -c "import json,sys; d=json.load(open('$STATE_FILE')); print(str(d.get('listed','unknown')).lower())" 2>/dev/null || echo "unknown")
    PREV_RENTED=$(python3 -c "import json,sys; d=json.load(open('$STATE_FILE')); print(str(d.get('rented','unknown')).lower())" 2>/dev/null || echo "unknown")
    if [ "$PREV_LISTED" != "$LISTED" ] || [ "$PREV_RENTED" != "$RENTED" ]; then
      STATE_CHANGED=1
    fi
  else
    STATE_CHANGED=1
  fi
  if [ $STATE_CHANGED -eq 1 ]; then
    ENTRY="$INBOX/$(date -u +%Y-%m-%dT%H%MZ)-state-change.md"
    cat > "$ENTRY" <<INBOX
---
type: event
category: vastai_state_change
source: gpuserver1
machine_id: $MACHINE_ID
updated: $(date -Iseconds)
listed: $LISTED
rented: $RENTED
---
# vast.ai state change $(date -Iseconds)

Machine $MACHINE_ID: listed=$LISTED rented=$RENTED
INBOX
  fi
  echo "$CURRENT_STATE" > "$STATE_FILE"
} >> "$LOG_FILE" 2>&1
```
For rtxserver, change `MACHINE_ID`, `INBOX` path (use `inbox/rtxserver/vastai`), and `source: rtxserver`.

### `/home/alton/stale-detect.sh` (4994 bytes, mode 755, last edited 2026-04-20)
Hourly. Checks vastai reachability, GPU temp >80C, disk on /home >85%, gather_mirror heartbeat freshness >5h. Writes `inbox/gpuserver1/stale-alerts/YYYY-MM-DD_HH.md` (overwrite per hour) and emits `inbox/gpuserver1/_heartbeat.md` every run regardless of alert state. Heartbeat status is `green` / `yellow` / `red` based on signal severity (vastai_unreachable → red, others → yellow).
Full source preserved at `/home/alton/stale-detect.sh` on gpuserver1; copy verbatim and change `source: rtxserver`, `inbox/rtxserver/...` paths, the machine_id grep target (52271 → rtxserver's eventual ID), and the heartbeat origin field.

### `/home/alton/gather_mirror.sh` (2676 bytes, mode 755, last edited 2026-04-12)
Every 4h. Stash-named-pop pattern around `git pull --rebase=false origin main`. On pull failure writes warning to `inbox/gpuserver1/alerts/`. Always writes a status JSON snapshot to `inbox/gpuserver1/status/<ts>.json` containing vastai output, GPU temp, disk %. Updates `~/sartor-heartbeat.json` (the heartbeat the stale-detect freshness check reads).
For rtxserver: change inbox paths and the heartbeat sentinel filename if you want machine-distinct names.

### `/home/alton/sartor-rgb/bin/rgb_status.py` (3470 bytes, last edited 2026-04-13)
Every 5 min. OpenRGB color mapping for case lighting based on rental + GPU util + SSH presence. **Hardware-specific to the gpuserver1 chassis (MSI MAG Coreliquid A13 240 daisy chain).** rtxserver hardware is different (PRO 6000 dual workstation build); do not blindly port. If rtxserver gets case lighting, write a parallel script that uses the same color palette but its own OpenRGB device map.

### `/home/alton/docker-weekly-prune.sh` (938 bytes, mode 755, last edited 2026-04-19)
```bash
#!/bin/bash
# docker-weekly-prune.sh — weekly cleanup of unused Docker resources
# Cron: Sunday 4am (0 4 * * 0)
LOG_DIR="/home/alton/generated/cron-logs"
LOG_FILE="$LOG_DIR/docker-prune.log"
mkdir -p "$LOG_DIR"
{
  echo "=== $(date -Iseconds) ==="
  echo "--- pre-prune ---"
  docker system df
  echo "--- container prune ---"
  docker container prune --filter "until=24h" --force
  echo "--- image prune ---"
  docker image prune -a --filter "until=72h" --force
  echo "--- builder prune ---"
  docker builder prune --force
  echo "--- post-prune ---"
  docker system df
  echo "=== done ==="
} >> "$LOG_FILE" 2>&1
```
Port verbatim. Note: prunes images >72h old not referenced by any container — safe because kaalia pulls fresh customer images on demand.

### `/home/alton/sartor-pricing/run_pricing.sh` (1167 bytes, mode 755, last edited 2026-04-12)
Demoted from cron to on-demand 2026-04-12. Wraps `claude --print --model sonnet` with the `pricing_brief.md` prompt. Has a flock lock and 52-week log rotation. Useful pattern but **not load-bearing for onboarding**; replicate later if rtxserver gets its own pricing skill.

---

## 3. Onboarding chronology (gpuserver1, Feb 2026)

The daily logs from this period are auto-generated cron-cycle text and don't narrate the work. The narrative lives in `LEARNINGS.md` and `MACHINES.md`. Reconstructed sequence, with verifiable anchors:

1. **2026-02-23** — vastai CLI installed at `~/.local/bin/vastai` (config dir created; api_key file written). `alton` added to `docker` group same day.
2. **~2026-02-24/25** — kaalia installer run (`install_update.sh` in `/var/lib/vastai_kaalia/latest/`); machine appears on vast.ai marketplace.
3. **2026-02-26** — Verzion Fios DMZ enabled pointing to `192.168.1.100`. UFW configured (rules 1–4 above). Stripe payout linked at `cloud.vast.ai/earnings/`. Listing flips to **VERIFIED**. (See `MACHINES.md` History line: "2026-02-26: Vast.ai VERIFIED and live. DMZ enabled on router, UFW configured, Stripe payout configured".)
4. **2026-02-27** — Two related fights resolved on the same day:
   - **Docker + UFW conflict** — kaalia rentals couldn't reach the container because UFW's FORWARD DROP was blocking Docker port maps. Fixed with conntrack rule in `/etc/ufw/after.rules` DOCKER-USER chain matching `--ctorigdstport 40000:40099 --ctdir ORIGINAL -j ACCEPT`. Key insight: after Docker NAT rewrites dst port from 40080 → 22, plain `ufw route allow 40000:40099` never matches; you must match the *original* pre-NAT port via conntrack.
   - **Hairpin NAT** — `vastai self-test machine 52271` was hanging "No response for 120s" because the self-test container HTTPS-polls `https://<public_ip>:<mapped_port>/progress` from the same host, and Fios doesn't loopback LAN→external→LAN. Fixed by adding to the `*nat` section of `/etc/ufw/before.rules`:
     ```
     -A OUTPUT -d 100.1.100.63 -j DNAT --to-destination 192.168.1.100
     ```
     Then `sudo ufw reload`. Self-test goes to PASSING.
5. **Listing command** (canonical form on file in CLAUDE.md, never re-run because the listing has been auto-renewed via the web UI):
   ```bash
   ~/.local/bin/vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"
   ```
   Live state has since drifted: `-g 0.30 -b 0.25 -s 0.15` and end date Oct 24. The drift happened in the web UI, not via CLI.

---

## 4. Replication checklist for rtxserver

Step-by-step, in order. Assumes Ubuntu 22.04+, NVIDIA driver + CUDA already present (rtxserver is already brought up with driver 580.x, CUDA 13 per the 2026-04-22 daily log).

### 4.1 Pre-flight
- [ ] Confirm Verizon Fios router admin path is decided. **Fios supports only one DMZ host.** gpuserver1 currently holds DMZ; do not move it. Plan to use **manual port forwarding** for rtxserver's port range, NOT shared DMZ. (See §5 Inherited Decisions.)
- [ ] Pick port range. Recommend **40100–40199** (contiguous, mnemonic: same hundred slot as gpuserver1's 40000-block, distinct hundred). Confirm with Alton before listing — vast.ai may have UI defaults that fight a non-default range.
- [ ] Static-DHCP-reserve `192.168.1.157` for rtxserver MAC on the Fios router so the forward target is stable.

### 4.2 Vast.ai signup
- [ ] Sign in to vast.ai with the same Google account (alto84@gmail.com) so the host account is shared.
- [ ] Create a new API key under Account → API Keys named `rtxserver`.
- [ ] On rtxserver: `mkdir -p ~/.config/vastai && chmod 700 ~/.config/vastai` then `vastai set api-key <key>` (CLI writes the key file with mode 644 — `chmod 600` after).
- [ ] Run the kaalia installer per vast.ai's host onboarding (web UI gives you a curl line). It creates `vastai_kaalia` user, drops `/var/lib/vastai_kaalia/`, generates a fresh kaalia machine_id hash, and starts the daemon.
- [ ] After install: confirm `~/.local/bin/vastai show machines` returns the new machine row with status `unverified`.

### 4.3 Firewall + NAT
- [ ] Install UFW if not present, set defaults `deny incoming / allow outgoing`.
- [ ] Allow rules:
  ```bash
  sudo ufw allow 22/tcp comment "SSH"
  sudo ufw allow 40100:40199/tcp comment "vast.ai"
  sudo ufw allow from 192.168.1.0/24 comment "LAN"
  sudo ufw route allow 40100:40199/tcp comment "vast.ai containers"
  ```
- [ ] Add DOCKER-USER conntrack rule to `/etc/ufw/after.rules` (require root edit). Insert before the `COMMIT` of the `*filter` section:
  ```
  *filter
  :DOCKER-USER - [0:0]
  -A DOCKER-USER -m conntrack --ctorigdstport 40100:40199 --ctdir ORIGINAL -j ACCEPT
  -A DOCKER-USER -j RETURN
  COMMIT
  ```
- [ ] Add hairpin NAT to `/etc/ufw/before.rules`. **Need rtxserver's public IP first** — run `vastai show machines --raw | grep public_ipaddr` after the kaalia install completes. Then add (replace `<PUBLIC_IP>`):
  ```
  *nat
  :PREROUTING ACCEPT [0:0]
  :OUTPUT ACCEPT [0:0]
  :POSTROUTING ACCEPT [0:0]
  -A OUTPUT -d <PUBLIC_IP> -j DNAT --to-destination 192.168.1.157
  COMMIT
  ```
- [ ] `sudo ufw reload`.

### 4.4 Router port forwarding (NOT DMZ)
- [ ] On the Fios router admin: under Advanced → Port Forwarding, create rules forwarding TCP 40100–40199 to 192.168.1.157. (Range forwarding is supported; one rule covers the whole hundred.)
- [ ] Do NOT enable DMZ for rtxserver. gpuserver1 keeps DMZ.

### 4.5 Self-test
- [ ] `~/.local/bin/vastai self-test machine <new_machine_id>`. Runs sysreq, ResNet50, ECC, NCCL, 60s stress. Expected ~10–15 min. PASSING flips listing to verified.
- [ ] If self-test hangs at "No response for 120s": hairpin NAT rule isn't applied. Verify with `sudo iptables -t nat -L OUTPUT -nv` — should show DNAT line for the public IP. Re-check `/etc/ufw/before.rules` syntax and `sudo ufw reload`.

### 4.6 Stripe payout
- [ ] On `cloud.vast.ai/earnings/`: confirm the existing Stripe account (Solar Inference LLC) is selected for this machine. **Recommendation: same payout entity** — see §5.

### 4.7 Listing
- [ ] List with the appropriate price (see §5 pricing). Template:
  ```bash
  ~/.local/bin/vastai list machine <id> -g <price> -b <bid_floor> -s 0.15 -m 1 -e "MM/DD/YYYY"
  ```
- [ ] Confirm with `vastai show machines`.

### 4.8 Crons (port verbatim, change paths)
- [ ] Copy `vastai-tend.sh`, `stale-detect.sh`, `gather_mirror.sh`, `docker-weekly-prune.sh` to rtxserver's `~/`.
- [ ] In each: change `MACHINE_ID`, `inbox/gpuserver1/...` → `inbox/rtxserver/...`, `source: gpuserver1` → `source: rtxserver`, `origin: gpuserver1` → `origin: rtxserver`.
- [ ] Install crontab matching the EX-5 four-job set + weekly Docker prune. Skip `rgb_status.py` unless rtxserver gets a parallel hardware-matched implementation.
- [ ] Create the inbox directory tree: `mkdir -p sartor/memory/inbox/rtxserver/{vastai,stale-alerts,status,alerts,_processed}`.
- [ ] Create `_heartbeat.md` placeholder so the curator knows to expect heartbeats from this peer.

### 4.9 Memory bookkeeping (Rocinante does this, not rtxserver)
- [ ] Update `MACHINES.md` with an `rtxserver` Vast.ai Hosting block (mirror the gpuserver1 block, fill in real values).
- [ ] Add rtxserver row to the OPERATING-AGREEMENT peer registry.
- [ ] Update the `MACHINES.md` history line: "2026-MM-DD: rtxserver verified on vast.ai, second host on Solar Inference LLC payout, port range 40100-40199, manual forward (not DMZ)."

---

## 5. Inherited decisions

### Stripe / payout entity → SAME (Solar Inference LLC)
Recommend rtxserver share the existing Stripe payout already linked to gpuserver1. Reasons:
- Solar Inference LLC is the GPU-business entity; both machines are LLC-owned compute.
- Single payout = one 1099, one bookkeeping line, simpler reconciliation.
- Vast.ai allows multiple machines per host account; payout aggregates.

### Port range → 40100–40199
gpuserver1 holds 40000–40099. Use the next contiguous hundred. Mnemonic: machine identity is encoded in the second-most-significant digit (4*0*0xx vs 4*1*0xx). Make sure the Fios forward rule matches.

### DMZ → NO. Use manual port forwarding.
Verizon Fios supports exactly one DMZ host. gpuserver1 holds it; moving DMZ to rtxserver would silently break gpuserver1's external reachability. Forward 40100–40199/tcp + 22/tcp manually for rtxserver, leave DMZ alone.

### Pricing → ballpark only; needs Alton's call
I attempted `vastai search offers 'gpu_name=RTX_PRO_6000 verified=True'` and the result was empty (header row only), and `gpu_name=RTX_PRO_6000_Blackwell` likewise. Either:
- The Blackwell PRO 6000 isn't yet a vast.ai-recognized `gpu_name` value (likely — it's brand new silicon), or
- No verified hosts are listing them yet (also plausible — supply is thin).

Either way, I cannot provide a competitive market price from this query. Rough sanity bracket from adjacent hardware:
- RTX 5090 (mine): $0.30/hr verified, $0.40/hr was the original list
- H100 80GB (older Hopper): $1.50–2.50/hr typical
- B200 (Blackwell datacenter): $3–6/hr early
- PRO 6000 Blackwell is workstation Blackwell with 96GB VRAM per card, dual = 192GB. That's a strong VRAM offering. **Suggested initial list: $1.20–1.80/hr per GPU on-demand, $0.80–1.20/hr interruptible**, and re-check after the first week of marketplace exposure. Two-card listings can be priced as `-m 2` (rent both together) which often clears better than two separate `-m 1` listings for memory-hungry workloads.
- **Run `vastai search offers --raw` after rtxserver is verified to see how the marketplace prices it relative to your bid.** That's the only authoritative reference price, and it will only exist once rtxserver is itself listed.

---

## 6. Divergence points (rtxserver MUST decide differently)

- **Public IP** is rtxserver's, not 100.1.100.63. Get it from `vastai show machines --raw | jq -r '.machines[0].public_ipaddr'` after kaalia install. The hairpin NAT rule must use that IP.
- **Internal IP** is 192.168.1.157, not 192.168.1.100. Hairpin DNAT target changes accordingly.
- **Port range** 40100-40199, not 40000-40099. UFW, DOCKER-USER conntrack, and Fios forward rules all change.
- **GPU count** is 2, not 1. The `-m` flag in `vastai list machine` may benefit from `-m 2` (rent the pair together) given the 192GB total VRAM advantage.
- **DMZ vs forward** as above — different routing path on the Fios.
- **OpenRGB / chassis lighting** — different hardware; do not port `rgb_status.py` blindly.
- **Driver version** — gpuserver1 is on 570.144 / CUDA 12.8. rtxserver is on 580.x / CUDA 13.0. Newer is fine for Blackwell; vast.ai customers can target either.
- **Kaalia user namespace** — kaalia generates a fresh machine_id hash per install. Don't try to copy gpuserver1's `/var/lib/vastai_kaalia/` over; let the installer create rtxserver's own.

---

## 7. Open questions for Alton

1. **Pricing target.** I can't pull a market price for PRO 6000 Blackwell from `vastai search offers`. Do you want me to attempt a more creative query (e.g., `gpu_name~=PRO_6000`, or scrape the web UI), or is it fine to launch at the $1.20–1.80/hr bracket and adjust within the first 7 days?
2. **`-m 1` vs `-m 2` listing strategy.** Two GPUs in one machine — list as one big rentable unit, or expose each card independently? Big-unit clears better for training; split clears better for inference. My instinct: start `-m 2` (pair-rent) for the first month given the 192GB VRAM is rtxserver's market differentiator, and revisit.
3. **Stripe payout split confirmation.** I'm assuming both machines stay on the same Solar Inference LLC payout. Confirm this is what your CPA wants — there's an argument for separating revenue streams per asset for depreciation tracking, but vast.ai's payout granularity is per-host-account, not per-machine.
4. **Listing end date.** Existing gpuserver1 listing was set with `-e "08/24/2026"` but live state has drifted to 2026-10-24 (renewed via web UI). Want me to align gpuserver1's documented end-date in MACHINES.md to live state in a follow-up, or leave it for the curator?
5. **MACHINES.md / CLAUDE.md pricing drift.** Live `listed_gpu_cost` on gpuserver1 is `0.30`, but MACHINES.md says `$0.40` and CLAUDE.md says `$0.35`. Three values, all stale or current depending on which line you read. Worth a curator pass to truth-up before adding rtxserver's row, so the new row doesn't inherit the inconsistency.
6. **rgb_status.py portage.** Does rtxserver have an addressable RGB header or AIO chain you'd like reflected in the case-lighting status? If not, skip the daemon.

---

## 8. Self-checks I ran while writing this

- `which vastai && vastai --version` → 0.5.0
- `vastai show machines` and `vastai show machines --raw` → both succeeded, listing live
- `crontab -l` → 4 active jobs + history of commented entries, matches CRONS.md v0.4
- `cat /tmp/vastai-tend-state.json` → `listed=true rented=true` at the time of dump
- `sudo iptables -t nat -L -nv` → confirmed OUTPUT-chain DNAT 100.1.100.63 → 192.168.1.100 present, plus kaalia's DOCKER chain DNATs into 172.17.0.2
- `sudo ufw status numbered` → 7 rules, matches the §1 quote
- `ps aux | grep kaalia` → daemon running under `vastai_kaalia` user, sshd on port 40099 for kaalia's auth path
- `cat /var/lib/vastai_kaalia/{machine_id,host_port_range}` → confirmed kaalia hash and 40000-40099
- `stat ~/.config/vastai/vast_api_key` → 64 bytes, exists, not echoed
- `/etc/ufw/before.rules` and `/etc/ufw/after.rules` → not directly readable from my session (root-owned 640); content cross-referenced from LEARNINGS.md and MISSION.md, both internally consistent
- `vastai search offers 'gpu_name=RTX_PRO_6000 verified=True'` → empty result; pricing target is therefore a judgment call, not an evidenced number

I did not modify any state on gpuserver1 during this read-out.
