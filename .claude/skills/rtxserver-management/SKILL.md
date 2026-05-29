---
name: rtxserver-management
description: Use whenever about to drive day-to-day operations on rtxpro6000server — SSHing in for substantive work, dispatching a workload, debugging thermal/power/network/vast.ai issues, recovering from an outage, or auditing the listing. Loads identity/topology, access patterns, file-path map, hardware quirks, peer-Claude tmux protocol, AC-failure recovery playbook, vast.ai lifecycle on this specific box, and the documented don'ts. Audience is both Rocinante-side Claudes operating remotely AND the rtxserver peer Claude itself, which auto-spawns at boot with no prior context.
---

# rtxserver-management — operating manual for rtxpro6000server

The single skill any Claude (Rocinante-side OR rtxserver-side peer) loads to do real work against rtxpro6000server. Codifies the identity, file-path map, the BMC and thermal envelope, the peer-Claude auto-respawn pattern, the AC-failure recovery, and the network/vast.ai topology. Operational concerns live here. Listing strategy and pricing decisions live in [`vastai-management`](../vastai-management/SKILL.md). Network-wide ops live in [`network-management`](../network-management/SKILL.md). Secrets live in [`secrets-via-bitwarden`](../secrets-via-bitwarden/SKILL.md). Cross-machine peer comms protocol lives in [`peer-comms`](../peer-comms/SKILL.md).

## When to invoke

Invoke when about to:

- SSH to rtxserver for substantive work (>5 lines of commands, configuration changes, multi-step ops)
- Drive a household training/inference workload on the dual Blackwell
- Investigate a thermal, power, or network anomaly on this specific box
- Manage the vast.ai listing for machine 124192 (state changes, repricing, recovery)
- Recover from an outage (AC failure, peer-Claude tmux death, network unreachability)
- Audit what the rtxserver peer Claude is doing
- Bring up post-rental cron suite or finish vast.ai onboarding (cron not yet installed as of 2026-05-04)

Skip for: a single read-only one-shot (`ssh alton@192.168.1.157 'nvidia-smi'`) — direct SSH is fine for those.

## Identity / topology one-pager

| Field | Value |
|---|---|
| Hostname | `rtxpro6000server` |
| LAN IP | `192.168.1.157` (DHCP from Fios) |
| Host MAC | `30:c5:99:d5:8f:b5` |
| BMC IP — primary | **`192.168.1.150`** (eth0, dedicated MGMT port, UniFi switch port 11, DHCP from Fios). Reachable from rtxserver-itself (no hairpin). Cable added 2026-05-04. |
| BMC IP — secondary | `192.168.1.156` (eth1, Shared LAN, UniFi switch port 10, DHCP from Fios). Still active for redundancy. Hairpin: rtxserver-itself cannot reach this IP. |
| BMC MAC eth0 | `30:c5:99:d5:8f:b7` (dedicated MGMT) |
| BMC MAC eth1 | `30:c5:99:d5:8f:b8` (Shared LAN) |
| BMC module | ASUS ASMB11-iKVM, firmware 2.1.30 (AST2600 chip) |
| Public IPv4 | `100.1.100.63` (shared with gpuserver1; single Fios WAN) |
| Public IPv6 | `2600:4041:410a:fc00::/64` (Verizon native) |
| Physical location | 3rd-floor finished attic, Sartor home (Montclair, NJ) |
| Network port | UniFi switch port 10 (Sartor-Saxena-Claude Network) |
| Motherboard | ASUS Pro WS WRX90E-SAGE SE (BIOS 1203, 07/18/2025) |
| CPU | AMD Threadripper PRO 7975WX (32C/64T, 350W TDP) |
| CPU cooler | Noctua NH-U14S TR5-SP6 (air, **zero TDP headroom on 7975WX**) |
| RAM | 256 GB DDR5 ECC RDIMM (8-channel; `free -g` reports 251 GB usable) |
| GPUs | 2× NVIDIA RTX PRO 6000 Blackwell Workstation (96 GB VRAM each, 192 GB combined) |
| Driver / CUDA | 580.126.09 / CUDA 13.0 |
| Production GPU power cap | **425 W per card** (live value as of 2026-05-28). NOTE: `nvidia-power-cap.service` file still specifies 450 W — service-file vs live discrepancy needs host-side reconciliation on rtxserver (do not change the service from off-box). |
| OS | Ubuntu 22.04.5 LTS (HWE 6.8 kernel) |
| Docker | 28.5.2 (installed by kaalia 2026-05-04) |
| PSU | be quiet! 1600 W |
| Wall outlet | 120 V / 15 A breaker; ~1380 W safe ceiling |
| vast.ai machine_id | **124192** (LISTED, verified, RENTED on-demand as of 2026-05-28. Live list $1.10/GPU; approved $0.92/GPU — live-drift, separate open decision. Listing expiry 2026-06-30.) |
| vast.ai customer port range | `40100-40199` (gpuserver1 owns `40000-40099`) |

rtxserver is gpuserver1's sibling, not its successor. They share the Fios WAN; gpuserver1 has the DMZ; rtxserver gets explicit port-forwards only.

## Access patterns

```bash
# 1. SSH from any Sartor host or Rocinante (existing key-based auth)
ssh alton@192.168.1.157

# 2. Sudo — alton is NOPASSWD: ALL on rtxserver. Don't paste a password.
sudo <anything>

# 3. Attach to the peer Claude tmux session
tmux attach -t claude-team-1
# Detach: Ctrl+b then d (don't Ctrl+c — that kills Claude)

# 4. Customer SSH (vast.ai renters land here, not interactive for us)
# Port 40199 on the public IP. Spawned by kaalia per-rental, not the system sshd.
```

### BMC (out-of-band)

**Two BMC interfaces are active as of 2026-05-04:**

- `192.168.1.150` (eth0, dedicated MGMT, switch port 11) — **preferred**. Reachable from EVERY host including rtxserver-itself. No hairpin.
- `192.168.1.156` (eth1, Shared LAN, switch port 10) — legacy/redundancy. Reachable from any LAN host EXCEPT rtxserver-itself (Shared LAN hairpin). Will be retired in a future maintenance.

Use `.154` for any new code. `.156` works fine from Rocinante for now.

```bash
# Web UI
#   https://192.168.1.150    (self-signed cert; accept once)
#   creds:  sartor-secret read 'BMC rtxserver'

# IPMI over LAN
PASS="$(sartor-secret read 'BMC rtxserver')" \
  ipmitool -I lanplus -H 192.168.1.150 -U admin -P "$PASS" sensor

# Redfish (programmatic, JSON over HTTPS)
curl -k -s -u "admin:$(sartor-secret read 'BMC rtxserver')" \
     "https://192.168.1.150/redfish/v1/Chassis/Self/Thermal" | python3 -m json.tool

# In-band IPMI from rtxserver itself — works without BMC password
sudo ipmitool chassis status        # power state, last power event
sudo ipmitool sdr type fan          # fan tachs the BMC reads
sudo ipmitool sdr type temperature  # CPU/GPU/DIMM temps
sudo ipmitool sel list              # System Event Log (memory, thermal, fan, PSU events)
```

## File-path map (where things live on the box)

| Path | What |
|---|---|
| `/home/alton/Sartor-claude-network/` | Sartor working tree (peer Claude's CWD) |
| `~/.local/bin/vastai` | vast.ai CLI (v1.0.8) |
| `~/.config/vastai/vast_api_key` | vast.ai API key (mode 600, 64 bytes; never echo, never commit) |
| `/var/lib/vastai_kaalia/` | Kaalia daemon files (`machine_id`, `host_port_range`, `kaalia.log`, `latest/launch_kaalia.sh`) |
| `/var/lib/vastai_kaalia/kaalia.log` | Kaalia daemon log — tail this for renter activity, benchmarks, errors |
| `/var/lib/vastai_kaalia/host_port_range` | Plain text `40100-40199` |
| `/var/lib/vastai_kaalia/machine_id` | Internal hash; the integer machine_id (124192) is server-side at vast.ai |
| `/etc/systemd/system/nvidia-power-cap.service` | Re-applies `nvidia-smi -pl 450` at boot, before docker.service. NOTE: live cap is 425 W as of 2026-05-28 — service file (450) disagrees with live; reconcile host-side. |
| `~/.config/systemd/user/sartor-claude-peer.service` | User-level systemd unit that auto-spawns the peer Claude tmux at boot |
| `~/cron-scripts-staged/` | Cron suite STAGED but not installed (gather_mirror.sh, stale-detect.sh, vastai-tend.sh, docker-weekly-prune.sh, plus reference txt files) |
| `~/{gather_mirror,stale-detect,vastai-tend,docker-weekly-prune}.sh` | Where the cron scripts will land once installed (post-listing) |
| `~/generated/cron-logs/` | Cron log directory (created by scripts on first run) |
| `~/sartor-heartbeat.json` | Cron-suite heartbeat file (gather_mirror writes; stale-detect reads) |
| `/etc/ufw/before.rules` | Hairpin NAT lives in the `*nat` block (re-applied across UFW reloads) |
| `~/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/` | This box's inbox (curator drains nightly). **NOTE:** earlier docs reference `inbox/rtxserver/` — that path doesn't exist; the canonical hostname-based path is `rtxpro6000server`. |
| `~/Sartor-claude-network/sartor/memory/machines/rtxpro6000server/` | Per-machine reference: `HARDWARE.md`, `BMC.md`, `CRONS.md`, `MISSION-v0.1.md`, `onboarding-staged/` |

## Hardware quirks worth knowing

These are the load-bearing surprises. None are fail-stop, but every one of them has bitten a previous Claude.

### Thermal envelope (load-bearing — do NOT change without re-stress)

| Field | Value | Source |
|---|---|---|
| Per-card power cap | **425 W live (2026-05-28); service file specifies 450 W — discrepancy, reconcile host-side** | systemd `nvidia-power-cap.service`. Stress data below was taken at 450 W; live cap is now lower, so those figures are conservative upper bounds. |
| Wall draw at 450 W/card sustained | ~1100 W | empirical 2026-05-02 |
| Tctl peak at 450 W dual-card (projected) | ~62 °C | A1+F1+B stress sequence 2026-05-02 |
| GPU0 die peak at 450 W dual-card (projected) | ~80 °C | 5 °C buffer to 85 °C SOFT abort, 8 °C to 88 °C HARD |
| GPU0/GPU1 inter-card asymmetry | **~11 °C** (GPU0 hotter, slot 3) | empirical 2026-04-27 + 2026-05-02 |
| Wall margin to breaker | ~280 W of headroom | (1380 safe − 1100 envelope) |

**`nvidia-smi -pl 450` is NOT persistent across reboots** — it lives only in driver state. The systemd unit re-applies it on every boot. If you change `pl` manually for a test, **revert before any rental container starts**, OR `systemctl restart nvidia-power-cap.service`.

### Single-card thermal pathology — KNOWN

When only ONE GPU is loaded (e.g., a renter pinning to one card on a dual-card listing, or a household single-GPU job), the BMC's PCIE07-bound fan zones (CHA_FAN1, CHA_FAN4) stay at idle floor because PCIE07 stays cold. Total chassis airflow drops to half. Noctua intake gets pre-heated air. **Tctl can climb past 75 °C even at 450 W single-card** (documented at 79.6 °C single-card 475 W in the F1 stress).

Mitigations baked in:
- `vastai list machine` uses `-m 2` (force dual-card chunk) — minimizes single-card rentals
- `stale-detect.sh` cron flags Tctl ≥ 75 °C to inbox (when installed)
- For single-GPU household workloads at 450 W: monitor Tctl manually

### BMC fan curves — saved in firmware, persist across reboots

Applied 2026-05-02 via Chrome MCP from Rocinante. Currently active:

| Zone | Header | Source | Curve A | Curve B | Curve C | Curve D |
|---|---|---|---|---|---|---|
| 1 | CPU_FAN | CPU Pkg (untouched) | 20°C/20% | 45°C/40% | 65°C/70% | 70°C/100% |
| 2 | CHA_FAN1 | PCIE07 | 30°C/50% | 50°C/75% | 60°C/90% | 70°C/100% |
| 3 | CHA_FAN2 | PCIE03 | 30°C/50% | 50°C/75% | 60°C/90% | 70°C/100% |
| 4 | CHA_FAN3 | PCIE03 | 30°C/50% | 50°C/75% | 60°C/90% | 70°C/100% |
| 5 | CHA_FAN4 | PCIE07 | 30°C/50% | 50°C/75% | 60°C/90% | 70°C/100% |
| 6 | CHA_FAN5 (3× MEGACOOL splitter) | PCIE03 | 30°C/50% | 50°C/75% | 60°C/90% | 70°C/100% |
| 7 | W_PUMP+ | CPU Pkg (default, empty) | 20°C/100% | — | — | — |

BMC overall fan mode = **Customized** (auto-promoted from "Generic mode" on first per-zone Save). Verify after any BMC firmware update or factory-reset by visiting `https://192.168.1.150/#settings/fan_control/manual` via Chrome MCP.

### OS-side fan control is INERT

`nct6798` exposes 7 PWM channels in `/sys/class/hwmon/hwmon4/`, but **writes don't propagate** — the ASUS WRX90E-SAGE SE BMC owns the fan output multiplexer. Don't waste time on `fancontrol`, `pwmconfig`, or hwmon-based scripts. All fan control routes through the BMC web UI (manual) or `ipmitool` (raw OEM commands NOT YET found for ASUS — open follow-up).

### PSU PMBus blind spot

Redfish reports `PowerSupplies[].Status.State == "Absent"` for the second PSU on rtxserver's WRX90E-SAGE SE BMC even though the system runs on a single PSU. **This is expected** for single-PSU builds with redundancy-capable boards. Do not treat as alert noise.

### GPU-sag bracket installed

One PCIe slot (slot 3) was finicky and DPC-tripped on physical bumps. A GPU-sag bracket was installed during 2026-04-22 hardware bring-up to fix it. **Don't bump the chassis** while debugging.

### Front-fan PWM-cord override

Three Super Flower MEGACOOL fans on CHA_FAN5 splitter (the front mesh "flower" array) have a physical PWM cord that can be unplugged and the remote control set to MAX, giving hardware-100% airflow regardless of any BMC PWM-scaling cap. This is the emergency thermal lever if BMC curves ever go wrong.

### No UPS

**rtxserver is NOT on a UPS.** The 2026-05-03 AC failure took the box down for 14 hours. BMC stays alive on +5VSB standby through brief outages, but the host doesn't auto-resume across longer outages even with `Power Restore Policy: always-on`. See §"Power and recovery" below.

## Peer Claude (claude-team-1 tmux session)

The rtxserver peer Claude auto-spawns at boot via the user-level systemd unit `~/.config/systemd/user/sartor-claude-peer.service`. Lingering is enabled for `alton` (`loginctl show-user alton --property=Linger` → `Linger=yes`).

### Attach

```bash
ssh alton@192.168.1.157
tmux attach -t claude-team-1
# Detach: Ctrl+b d
```

### Send a directive (from Rocinante, per peer-comms convention)

```bash
# 1. Write directive to a file (Write tool); never inline-heredoc.
# 2. SCP to peer:
scp /c/Users/alto8/AppData/Local/Temp/<name>.txt alton@192.168.1.157:/tmp/<name>.txt
# 3. Paste into the work pane:
ssh alton@192.168.1.157 'tmux send-keys -t claude-team-1:0 "$(cat /tmp/<name>.txt)"'
# 4. Submit (CRITICAL — Enter is literal text in send-keys; C-m is the carriage return):
ssh alton@192.168.1.157 'tmux send-keys -t claude-team-1:0 C-m'
# 5. Verify:
sleep 4 && ssh alton@192.168.1.157 'tmux capture-pane -t claude-team-1:0 -p | tail -15'
```

### Known quirks

- **send-keys submit needs `C-m`**, not `Enter`. Two send-keys calls — one for text, one for `C-m`. Claude Code v2.1.126+ ignores the implicit Enter at end of pasted text.
- **Substantive directives go via inbox files in git, not heredoc tmux send-keys.** Per peer-comms convention: complex multi-step directives are committed to `inbox/rtxpro6000server/` and the peer is told `git pull && cat <file>`. Heredoc breaks on apostrophes/backticks/`$(...)`.
- **Restart the peer:** `systemctl --user restart sartor-claude-peer.service` (run as `alton`, not via sudo). The unit's `ExecStartPre` kills any existing session first.
- **Known design issue (open):** the current unit launches `claude` without `--continue` or `--resume`, so context is lost on every restart. No `.jsonl` is written until first prompt arrives. Fix is pending.
- **OAuth token freshness:** the `Sartor Peer Creds Sync` Windows Scheduled Task on Rocinante SCPs `~/.claude/.credentials.json` to all peers every 4 hours. If the peer Claude shows `Please run /login · API Error: 401`, run that task by hand from Rocinante or wait ≤4 h.
- **Hook `python` errors are non-blocking** — Ubuntu calls Python `python3`, not `python`. The peer reports them as warnings; filter from output.

## Power and recovery

### AC failure 2026-05-03 incident

Sun 2026-05-03 ~04:27 EDT, breaker tripped (or grid sag); AC came back at unknown time but the ASUS board did NOT auto-resume despite `Power Restore Policy: always-on`. Required physical power-button press at 18:34 EDT. **14 hours of downtime.** No data loss; no GPU damage. The vast.ai listing was unverified (no active rental) so no reliability hit.

### Recovery procedure for AC outage

```bash
# In-band IPMI from rtxserver after recovery confirms what happened:
sudo ipmitool chassis status
# Look for "Last Power Event: ac-failed" — this is the 2026-05-03 signature
# (it persists through subsequent boots until cleared)

# Restore policy is already correct; that's not the bug. The bug is that the
# ASUS firmware sometimes lands in an "off but ready" state after long AC loss
# and needs a button press to resume. Document the symptom; don't fight the cause.
```

If the box is unreachable after a known power outage:

1. **Ping the BMC** at `192.168.1.156` from Rocinante. If BMC alive → host is hung; remote-power-cycle via BMC web UI.
2. **If BMC is also dead** → check power at the rack. AC failure took out everything, including BMC standby (rare).
3. **If BMC alive but remote power-on fails** → physical access to the 3rd-floor attic; press the front power button. There is no remote-console-only path that beats this for the rtxserver chassis today.

### Remote power control via BMC web UI

```
https://192.168.1.150/#power-control
  Power On / Power Off / Power Cycle / Hard Reset / ACPI Shutdown
```

### Remote power control via IPMI over LAN (from another LAN host)

```bash
PASS="$(sartor-secret read 'BMC rtxserver')"
ipmitool -I lanplus -H 192.168.1.150 -U admin -P "$PASS" power status
ipmitool -I lanplus -H 192.168.1.150 -U admin -P "$PASS" power cycle
ipmitool -I lanplus -H 192.168.1.150 -U admin -P "$PASS" power soft   # = ACPI shutdown
```

### Open action item

A line-interactive UPS in the $80-150 range would close the AC-sag failure mode (5-15 min runtime through brief outages, gracefully shut down on longer ones). Currently NOT installed. Tracked as a follow-up; surface to Alton if relevant.

## Network

### Topology

| Field | Value |
|---|---|
| WAN | Verizon Fios; single CR1000A router; public IPv4 `100.1.100.63` shared with gpuserver1 |
| LAN | Sartor-Saxena-Claude Network; UniFi switch port 10 |
| Hostname → IP | `rtxpro6000server` ↔ `192.168.1.157` (DHCP from Fios) |
| BMC IP | `192.168.1.156` (separate DHCP lease) |
| Customer port range | `40100-40199` (gpuserver1: `40000-40099`) |
| DMZ | gpuserver1 has the DMZ; rtxserver does NOT |
| Port forward | Fios CR1000A forwards `40100-40199/tcp` → `192.168.1.157` (set 2026-05-02) |

### Firewall and hairpin

```bash
# UFW (active, default deny incoming)
sudo ufw status verbose
# Expected rules:
#   22/tcp                  ALLOW IN   Anywhere     # SSH
#   Anywhere                ALLOW IN   192.168.1.0/24  # LAN intra-machine
#   40100:40199/tcp         ALLOW IN   Anywhere     # vast.ai customer ports

# Hairpin NAT (lets the host reach its own public IP from the LAN side)
sudo iptables -t nat -L OUTPUT -n -v
# Expected:
#   DNAT  tcp  --  0.0.0.0/0  100.1.100.63  tcp dpts:40100:40199 to:192.168.1.157

# Persisted in /etc/ufw/before.rules in the *nat block (survives ufw reload).
```

### Customer SSH

Customer connections land on port `40199` (the kaalia-launched sshd, separate from the system sshd on port 22). The customer sshd is spawned per-rental by kaalia, so an empty `ss -lntp | grep 40199` between rentals is normal. The system sshd on port 22 is the one Claude/Alton use.

### Public IP probes

```bash
# IPv4 (always works)
curl -s --max-time 5 -4 ifconfig.me
# Expected: 100.1.100.63

# IPv6 (Verizon native; not used by vast.ai listing today)
curl -s --max-time 5 -6 ifconfig.me
# Expected: 2600:4041:410a:fc00:32c5:99ff:fed5:8fb5
```

## vast.ai lifecycle on rtxserver

Current status as of 2026-05-28: **machine_id 124192 — LISTED, verified, and RENTED on-demand.** Live list $1.10/GPU (approved $0.92/GPU — live-drift discrepancy, separate open decision). Listing expiry 2026-06-30.

For listing strategy, pricing decisions, repricing workflows, idle jobs, and reserved-vs-on-demand logic, see [`vastai-management`](../vastai-management/SKILL.md). For onboarding-procedure specifics on a brand-new host, see [`sartor/memory/procedures/vastai-host-onboarding.md`](../../../sartor/memory/procedures/vastai-host-onboarding.md). Always cross-check live tracker state at [`sartor/memory/projects/rtxserver-vastai-watch.md`](../../../sartor/memory/projects/rtxserver-vastai-watch.md).

### Daemons

```bash
# Active services (verified 2026-05-04):
systemctl status vastai.service          # active running — Vast.ai Host Daemon
systemctl status vast_metrics.service    # activating (auto-restart loop is normal)

# NOTE: earlier docs referenced `vastai_bouncer.service` — that does not exist on
# this install. The two real services are vastai.service and vast_metrics.service.
```

### Logs

```bash
sudo tail -f /var/lib/vastai_kaalia/kaalia.log
# Look for: "host_port_range: 40100 40199", "Daemon Running", benchmark progress,
# customer connections (per-rental), or repeated errors (failed daemon).
```

### Cron suite (intended; not yet installed)

Per `machines/rtxpro6000server/CRONS.md`, four jobs will run after the listing settles:

| Job | Cron schedule | Purpose |
|---|---|---|
| `gather_mirror.sh` | `0 */4 * * *` | Git pull + status snapshot to inbox + heartbeat |
| `stale-detect.sh` | `0 * * * *` | Threshold checks (GPU temp, Tctl, BMC, disk, kaalia) |
| `vastai-tend.sh` | `*/30 * * * *` | State-change-only vast.ai monitoring + min_chunk invariant |
| `docker-weekly-prune.sh` | `0 3 * * 0` | Prune containers/images/networks (NOT volumes); refuses if vast.ai container active |

The scripts are **staged at `~/cron-scripts-staged/`**, NOT yet installed. Activation gated by: (1) listing fires successfully (done — 2026-05-04), (2) scripts diff'd against gpuserver1's live versions, (3) Alton's explicit greenlight. **Do not auto-install.**

## Common ops cheat-sheet

```bash
# Health check
ssh alton@192.168.1.157 '
  hostname
  uptime
  df -h /
  free -h
  nvidia-smi --query-gpu=index,name,temperature.gpu,power.draw,power.limit,memory.used --format=csv,noheader
  ~/.local/bin/vastai show machines | head -10
'

# Tail kaalia logs (vast.ai daemon)
ssh alton@192.168.1.157 'sudo tail -f /var/lib/vastai_kaalia/kaalia.log'

# Restart vast.ai daemon (after install issues; normally don't need this)
ssh alton@192.168.1.157 'sudo systemctl restart vastai.service'

# Check thermal at a glance
ssh alton@192.168.1.157 'nvidia-smi --query-gpu=index,temperature.gpu,power.draw --format=csv,noheader; echo; sensors k10temp-pci-00c3 | head -8'

# In-band IPMI sensor sweep
ssh alton@192.168.1.157 'sudo ipmitool sdr type temperature 2>&1 | head -20; echo; sudo ipmitool sdr type fan 2>&1 | head -20'

# System Event Log (memory, thermal, fan, PSU events)
ssh alton@192.168.1.157 'sudo ipmitool sel list | tail -20'

# Power-cap unit re-apply (forces nvidia-smi -pl 450 on both cards)
ssh alton@192.168.1.157 'sudo systemctl restart nvidia-power-cap.service && nvidia-smi --query-gpu=power.limit --format=csv'

# Peer Claude restart
ssh alton@192.168.1.157 'systemctl --user restart sartor-claude-peer.service && sleep 6 && tmux capture-pane -t claude-team-1:0 -p | tail -15'

# Public IP probe (confirms WAN path)
ssh alton@192.168.1.157 'curl -s --max-time 5 -4 ifconfig.me'

# Last power event (was the box just power-cycled?)
ssh alton@192.168.1.157 'sudo ipmitool chassis status | grep "Last Power Event"'
```

## Recovery playbooks

### Box completely unreachable

```bash
# 1. Ping host
ping -n 3 192.168.1.157   # Windows; -c 3 on Linux

# 2. Ping BMC
ping -n 3 192.168.1.156

# 3. Branch:
#    BMC alive, host dead    → host hung. Power-cycle via BMC web UI (https://192.168.1.150/#power-control)
#                              or `ipmitool -I lanplus -H 192.168.1.150 -U admin -P "$(sartor-secret read 'BMC rtxserver')" power cycle`
#    BMC dead too            → physical layer failure. Check rack power, switch port 10, AC at the outlet.
#                              See §"Power and recovery" for the AC-failure-doesn't-auto-resume pattern.
#    BMC alive, ipmitool says System Power: off  → press physical button (3rd-floor attic) OR
#                              `ipmitool ... power on` first
```

### Peer Claude tmux dead

```bash
# (Lingering is enabled, so user systemd is alive even when alton isn't logged in.)
ssh alton@192.168.1.157 '
  tmux ls 2>&1
  systemctl --user status sartor-claude-peer.service | head -10
'
# If service is dead/failed:
ssh alton@192.168.1.157 'systemctl --user restart sartor-claude-peer.service && sleep 6 && tmux capture-pane -t claude-team-1:0 -p | tail -15'
# If lingering is somehow off:
ssh alton@192.168.1.157 'sudo loginctl enable-linger alton'
```

### Listing offline / customer can't connect

```bash
# 1. Confirm listing is alive on vast.ai's side
ssh alton@192.168.1.157 '~/.local/bin/vastai show machines'
# Look for machine_id 124192 with a non-zero gpuD_$/h field.

# 2. Confirm kaalia is running
ssh alton@192.168.1.157 'systemctl status vastai.service | head -10'
ssh alton@192.168.1.157 'sudo tail -50 /var/lib/vastai_kaalia/kaalia.log'

# 3. Confirm UFW + hairpin are intact (they're persisted in /etc/ufw/before.rules)
ssh alton@192.168.1.157 'sudo ufw status verbose | grep 4010'
ssh alton@192.168.1.157 'sudo iptables -t nat -L OUTPUT -n | grep 100.1.100.63'

# 4. Confirm Fios port-forward via Chrome MCP to https://192.168.1.1
#    (Verizon Fios doesn't expose a port-forward API.)

# 5. Self-test from vast.ai's NOC perspective
ssh alton@192.168.1.157 '~/.local/bin/vastai self-test machine 124192'
# Returns "BUSY" during kaalia warm-up; specific failure message otherwise.
```

### GPU thermal anomaly

```bash
# 1. Confirm BMC fan curves are still active (persistent in firmware, but firmware
#    updates / factory-resets can blow them away)
#    Visit https://192.168.1.150/#settings/fan_control/manual via Chrome MCP from Rocinante.
#    Confirm Customized mode + per-zone bindings + curves match the table above.

# 2. If a card hits 75 °C+ sustained, drop power-cap as an emergency lever:
ssh alton@192.168.1.157 'sudo nvidia-smi -pl 400'
# This is NOT the systemd unit's value; revert with:
ssh alton@192.168.1.157 'sudo systemctl restart nvidia-power-cap.service'

# 3. If GPU0 reaches 85 °C SOFT abort threshold, halt all GPU workloads first,
#    then investigate (BMC fan curves wrong, AC is failing, dust occlusion).

# 4. If single-card load is producing single-card thermal pathology (Tctl > 75 °C at ≤450 W),
#    hand-flag to Alton — the third 140 mm fan held in reserve becomes relevant.
```

### Power-cap returned to 600 W after a reboot

```bash
# Symptom: nvidia-smi shows power.limit = 600 instead of 450
# Cause: systemd unit failed during boot (driver not yet loaded, etc.)

ssh alton@192.168.1.157 'systemctl status nvidia-power-cap.service'
# Likely error: "nvidia-persistenced.service failed" — driver wasn't ready at fire time.

# Fix immediate:
ssh alton@192.168.1.157 'sudo systemctl restart nvidia-power-cap.service'
# And confirm:
ssh alton@192.168.1.157 'nvidia-smi --query-gpu=power.limit --format=csv'
```

## Critical learning — vast.ai install token (verbatim)

> The vast.ai installer's api_key is a **1-hour-validity host-install-token issued by the cloud.vast.ai/host/setup/ web UI**, NOT a regular account api-key. Account api-keys (rights_id=2) and even CLI-created keys with `machine_write` permission return HTTP 403 "machine_api_key is too old or does not have machine registration rights" against `/api/v0/daemon/identify/`. The web UI's per-user install command embeds the right token. To capture: navigate Chrome MCP to cloud.vast.ai/host/setup/ Install Manager section, hook `navigator.clipboard.writeText` to capture the value, click the page's copy button. The DOM input shows `d8de4a4...` (literally truncated with ellipsis).

Source: [`projects/rtxserver-vastai-watch.md`](../../../sartor/memory/projects/rtxserver-vastai-watch.md). Note that `procedures/vastai-host-onboarding.md` Phase B is OUT-OF-DATE on this point — it references the older SCP-clipboard-hijack pattern; the canonical install-token capture is the Chrome-MCP-with-clipboard-hijack pattern at the cloud.vast.ai/host/setup/ Install Manager.

## Don'ts (operational rules)

These are the documented don'ts from `MISSION-v0.1.md` and the constitutional layer. Every one has surfaced in actual incident review.

- **Do not raise the GPU power cap above 450 W per card** for sustained workloads without re-running the A1+F1+B stress harness AND verifying additional cooling. 475 W/card sustained dual-card hits GPU0 at 84 °C — 1 °C from SOFT abort.
- **Do not modify BMC settings** (Network, User Management, Services, System Firewall, IPMI Interfaces) without explicit Alton greenlight. Misconfiguration can lock the household out of the box.
- **Do not push to git from rtxserver.** No GitHub credentials. Peers commit locally; pushes go to the rtxserver bare via the local `file://` URL (the peer's working tree IS rtxserver, so the bare is local). Per peer-comms convention: rtxserver-self peer's `origin` should be `alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git`.
- **Do not modify gpuserver1's networking, listing, or files** from rtxserver. That machine has its own self-steward and OPERATING-AGREEMENT.
- **Do not run training jobs during active vast.ai rentals.** GPU belongs to the paying customer per vast.ai hosting agreement ("the hardware can not be used for any other purposes"). Idle jobs are the sanctioned between-rental path; not implemented yet.
- **Do not autonomously execute pricing changes** on vast.ai. Pricing review crons (when added) produce recommendations only; Alton or Rocinante executes.
- **Do not echo or commit the vast.ai API key.** It lives at `~/.config/vastai/vast_api_key` mode 600. Read into env with `API_KEY=$(cat ~/.config/vastai/vast_api_key)` to keep it out of argv.
- **Do not bump the chassis** while the box is running. The slot-3 finickyness (DPC-tripped on bumps before the GPU-sag bracket fix) is mostly resolved but not zero-risk.
- **Do not run `nvidia-smi -pl 600` and walk away.** The systemd unit only fires at boot, not periodically. If you change `pl` for a test, revert immediately or `systemctl restart nvidia-power-cap.service`.
- **Do not factory-reset the BMC** without first capturing all current Customized-curve and source-binding settings. Defaults route everything to CPU Pkg with conservative curves and lose the GPU-aware cooling.
- **Do not touch the kaalia rental container** if a customer is connected. No `docker exec`, no GPU reset. Read-only inspection only (`docker ps`, `nvidia-smi`).

## Memory + docs cross-references

Authoritative external references for this skill:

| Path | Purpose |
|---|---|
| [`sartor/memory/machines/rtxpro6000server/HARDWARE.md`](../../../sartor/memory/machines/rtxpro6000server/HARDWARE.md) | BoM, thermal envelope source, fan-control investigation, idle-baseline data |
| [`sartor/memory/machines/rtxpro6000server/BMC.md`](../../../sartor/memory/machines/rtxpro6000server/BMC.md) | BMC web UI map, fan zones, IPMI command reference, sensor inventory |
| [`sartor/memory/machines/rtxpro6000server/CRONS.md`](../../../sartor/memory/machines/rtxpro6000server/CRONS.md) | Intended cron suite (4 jobs), behaviors, install plan |
| [`sartor/memory/machines/rtxpro6000server/MISSION-v0.1.md`](../../../sartor/memory/machines/rtxpro6000server/MISSION-v0.1.md) | Identity, primary duty, operating envelope, phone-home triggers, what I owe the household |
| [`sartor/memory/machines/rtxpro6000server/onboarding-staged/`](../../../sartor/memory/machines/rtxpro6000server/onboarding-staged/) | Drafts: hairpin-nat-rules.txt, nvidia-power-cap.service, HARDWARE-history-line.txt |
| [`sartor/memory/projects/rtxserver-vastai-watch.md`](../../../sartor/memory/projects/rtxserver-vastai-watch.md) | **Living tracker** for the listing — read first for current status |
| [`sartor/memory/inbox/rocinante/rtxserver-pre-kaalia-2026-05-04.md`](../../../sartor/memory/inbox/rocinante/rtxserver-pre-kaalia-2026-05-04.md) | Pre-kaalia readiness record (now superseded — kaalia is installed) |
| [`sartor/memory/inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md`](../../../sartor/memory/inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md) | Paused-state record from 2026-05-02 network pivot (now also superseded) |
| [`sartor/memory/reference_home_network.md`](../../../sartor/memory/reference_home_network.md) | Sartor-Saxena-Claude Network architecture |
| [`sartor/memory/MACHINES.md`](../../../sartor/memory/MACHINES.md) | Fleet-level reference |
| [`sartor/memory/MEMORY.md`](../../../sartor/memory/MEMORY.md) 2026-05-02 entry | Solar-Inference-day session record (BMC tuning, thermal stress, listing prep) |
| [`projects/rtx-stress-design-2026-05-02.md`](../../../sartor/memory/projects/rtx-stress-design-2026-05-02.md) | A1+F1+B stress sequence design + 450 W envelope decision |
| [`.claude/skills/peer-comms/SKILL.md`](../peer-comms/SKILL.md) | Cross-machine work convention; per-peer quirks |
| [`.claude/skills/secrets-via-bitwarden/SKILL.md`](../secrets-via-bitwarden/SKILL.md) | `BMC rtxserver` vault item; sartor-secret wrapper |
| [`.claude/skills/network-management/SKILL.md`](../network-management/SKILL.md) | UniFi controller, switch port 10, network ops |
| [`.claude/skills/vastai-management/SKILL.md`](../vastai-management/SKILL.md) | Listing strategy, pricing, repricing, idle jobs |
| [`sartor/memory/procedures/vastai-host-onboarding.md`](../../../sartor/memory/procedures/vastai-host-onboarding.md) | Host onboarding procedure (note: Phase B install-token capture is out-of-date) |

### Manuals not yet captured

ASUS WRX90E-SAGE SE manual is at https://www.asus.com/motherboards-components/motherboards/workstation/pro-ws-wrx90e-sage-se/helpdesk_manual/. If pulled locally in the future, store in `sartor/memory/machines/rtxpro6000server/manuals/`.

## What this skill does NOT cover

- **Listing strategy / pricing decisions** — see [`vastai-management`](../vastai-management/SKILL.md) and [`business/vastai-pricing-strategy`](../../../sartor/memory/business/vastai-pricing-strategy.md)
- **Network-wide ops (UniFi, Fios, AP management)** — see [`network-management`](../network-management/SKILL.md)
- **Secret retrieval mechanics** — see [`secrets-via-bitwarden`](../secrets-via-bitwarden/SKILL.md)
- **Cross-machine peer comms convention** — see [`peer-comms`](../peer-comms/SKILL.md)
- **gpuserver1 operations** — that machine has its own ops surface; rtxserver should not touch it
- **Brand-new host onboarding procedure** — see `procedures/vastai-host-onboarding.md` (with awareness Phase B is out-of-date on the install-token capture)

## History

- 2026-05-04 (Rocinante Opus 4.7, 1M context): Initial author. Synthesized from `machines/rtxpro6000server/HARDWARE.md`, `BMC.md`, `CRONS.md`, `MISSION-v0.1.md`, `projects/rtxserver-vastai-watch.md` (the `live-listed-pending-verification` state with machine_id 97429), `inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md`, `inbox/rocinante/rtxserver-pre-kaalia-2026-05-04.md`, MACHINES.md, MEMORY.md 2026-05-02 entry, peer-comms / secrets-via-bitwarden / network-management / vastai-management skills. Ground-truthed against rtxserver via SSH 2026-05-04: confirmed kaalia installed and running (`/var/lib/vastai_kaalia/` exists, daemon active, listed at `$1.25 × 2 = $2.50/hr`, machine_id 97429, unverified pending), confirmed `nvidia-power-cap.service` enabled+active+pl=450 on both cards, confirmed `sartor-claude-peer.service` running with lingering enabled, confirmed UFW + hairpin NAT intact, confirmed Docker 28.5.2 (kaalia-installed), confirmed `Last Power Event: ac-failed` from the 2026-05-03 incident still showing, confirmed BMC unreachable from rtxserver itself (expected per BMC.md — Shared LAN hairpin), confirmed `inbox/rtxpro6000server/` is the canonical inbox path (NOT `inbox/rtxserver/` — that path doesn't exist despite older docs referencing it), confirmed `vastai_bouncer.service` does NOT exist on this install (only `vastai.service` + `vast_metrics.service`).
