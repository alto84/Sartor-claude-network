---
name: rtxserver-vastai-watch
description: Living tracker for rtxserver's path to first vast.ai rental. Watched by vast-ai-watcher (memory-agents team). Refreshes on relevant commits. Status PAUSED 2026-05-02 pending Verizon Fios WAN-path decision.
type: tracker
status: paused-pending-decision
target: rtxpro6000server (192.168.1.157, dual RTX PRO 6000 Blackwell, 192 GB combined VRAM)
created: 2026-05-02
updated: 2026-05-02
created_by: vast-ai-watcher (memory-agents team)
related:
  - inbox/rocinante/rtxserver-vastai-decisions-2026-05-02
  - inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02
  - machines/rtxpro6000server/HARDWARE
  - business/solar-inference
  - reference_memory_server
tags: [project/active, project/paused, machine/rtxpro6000server, vast-ai]
---

# rtxserver vast.ai onboarding watch

## TL;DR

rtxpro6000server is hardware-ready, BMC-tuned, peer-Claude-online, and decision-locked
on its commercial parameters ($2.50/hr listed, `-m 1` dual-system, Solar Inference LLC
Stripe payout, port range 40100-40199). The remaining gate is **WAN egress on Verizon Fios**:
Alton owns no admin credential to the Fios router, so the standard "open ports 40100-40199"
path is not yet accessible. Pivot under consideration is to put rtxserver behind a UniFi
gateway (UCG-Pro) bridged in front of the Fios CPE, removing Fios admin from the critical
path. Pause logged on 2026-05-02 evening; no on-disk RESUME-vastai-onboarding-2026-05-02.md
yet — this tracker is the placeholder until that doc lands.

## Blockers

| # | Blocker | Status | Owner | Next step |
|---|---------|--------|-------|-----------|
| 1 | WAN ingress for ports 40100-40199 (no Fios admin) | OPEN | Alton | Decide: get Fios admin (call Verizon, factory-reset, ONT bypass), OR install UniFi gateway in bridge mode, OR park rtxserver listing until network re-architected. UCG-Pro path is the most defensible — keeps the takeover momentum from 2026-05-01 going. |
| 2 | Hairpin NAT for new external IP (rtxserver-side) | DRAFTED, STALE | rtxserver Claude | Recreate the gpuserver1 OUTPUT-DNAT pattern once external IP is known. Pattern: `iptables -t nat -A OUTPUT -d <public_ip> -j DNAT --to-destination 192.168.1.157`. Trivially reproducible from gpuserver1's `~/.local/bin/vastai-tend.sh` neighborhood. |
| 3 | Cron suite (gather_mirror, stale-detect, vastai-tend, docker-weekly-prune) | NOT INSTALLED | rtxserver Claude | Install the 4-script suite using the gpuserver1 onboarding dump (commit fd80cc3) as the canonical source. Adapt MACHINE_ID, INBOX path (rtxserver/), and `source:` field. Scripts staged but not committed — will go in via rtxserver-side commit when its peer Claude resumes. |
| 4 | MISSION-v0.1.md for rtxpro6000server | NOT WRITTEN | rtxserver Claude | Draft alongside or after first successful rental. Use machines/gpuserver1/MISSION as the template. |
| 5 | vast.ai self-test | BLOCKED ON #1 | rtxserver Claude | `vastai self-test` against machine 52271's analog after kaalia is installed and the WAN path is open. Self-test confirms ports reachable from vast.ai's NOC. |
| 6 | `vastai list machine` | BLOCKED ON #5 | rtxserver Claude | Final command: `vastai list machine <id> -g 2.50 -b 2.00 -s 0.10 -m 1 -e <date>`. End-date TBD. |
| 7 | `procedures/vastai-host-onboarding.md` (load-bearing procedure doc) | DEFERRED | rtxserver Claude | Write only after a complete successful run, so the procedure reflects what actually worked, not what was theorized. |

## Done — production-ready infrastructure

- **Hardware bring-up complete (2026-04-22).** Threadripper PRO 7975WX, 251 GB DDR5, dual RTX PRO 6000 Blackwell (96 GB each, 192 GB total). Both cards enumerate clean at PCIe 5.0 x16. Driver 580.126.09 / CUDA 13.0. GPU-sag bracket installed to fix a finicky slot.
- **Power envelope locked at 450W/card production cap (2026-05-02).** systemd `nvidia-power-cap.service` re-applies on every boot. Wall draw at 450W/card sustained ≈1100W with ~300W of breaker margin. Tctl peak at 475W/card dual-card was 65°C; at 450W projected lower. Three 140mm fans on hand, deferred. (commits 5f583e9, 37602d0)
- **BMC fan tuning saved to firmware (2026-05-02).** Zones 2-6 bound to PCIE03/PCIE07 GPU temp sources. Curves: 30°C/50% → 50°C/75% → 60°C/90% → 70°C/100%. Mode = Customized. Persists across reboots without OS involvement. Applied via Chrome MCP from Rocinante. (commits 83a75ab, 5f583e9)
- **Single-card vs dual-card thermal asymmetry characterized.** Dual-card mode is *thermally healthier* than single-card because both chassis fan zones engage and break the Noctua intake recirculation. Single-card Tctl pathology documented; -m 2 was rejected partly for this reason. At 450W single-card, projected Tctl peak ≈74°C — under threshold but worth monitoring on long-running single-GPU workloads.
- **Peer Claude auto-respawns (2026-05-02).** User-level systemd unit `~/.config/systemd/user/sartor-claude-peer.service` with lingering enabled for `alton`. Spawns into tmux session `claude-team-1`. Survives reboots without manual SSH re-attach. (commit ab14b0a)
- **Network access (2026-05-01).** rtxserver moved to 3rd-floor finished attic, plugged into UniFi switch port 10. Host IP 192.168.1.157 (DHCP from Fios), BMC 192.168.1.156, DM_LAN secondary at 10.10.10.10. Part of the Sartor-Saxena-Claude Network takeover. (commit c3cb175)
- **OAuth credentials sync every 4h (2026-05-02).** Windows Scheduled Task `Sartor Peer Creds Sync` SCPs fresh `~/.claude/.credentials.json` to rtxserver every 4 hours, keeping the peer Claude's tokens within Anthropic's refresh window across daytime reboots. (commit d78c502)
- **Memory server canonical path (2026-05-02).** `alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git` is the bare repo all peers push to. Peer-Claude-on-rtxserver pushes to its own host's bare repo. (commits 738d4fb, 7427a7e)
- **Pricing target validated against live market (2026-05-02).** Dual RTX PRO 6000 WS market via vastai CLI: $1.74-$2.93/hr verified-rentable (median $2.14). Broader visible UI floor: $1.85-$2.72/hr (median ≈$2.00). $2.50 lands at the 75th-85th percentile depending on which median you cite — defensible as a "192 GB combined VRAM is differentiated" anchor. New `vastai-market-scan` skill captures the methodology including the MUI Select Chrome MCP recipe. (commit de2b5d7)
- **Commercial decisions captured (2026-05-02).** $2.50/hr listed, `-m 1` (single rentable unit, 192 GB combined VRAM as market differentiator), Solar Inference LLC Stripe payout (consolidated with gpuserver1), port range 40100-40199 (separate from gpuserver1's 40000-40099), manual port-forward (NOT shared DMZ — Fios doesn't support two DMZ hosts), rgb_status.py port skipped (BMC owns lighting). (commit 43cf9dd, file `inbox/rocinante/rtxserver-vastai-decisions-2026-05-02.md`)
- **Replication template captured (2026-05-02).** gpuserver1's peer Claude wrote a self-contained read-back of its own configuration (live crontab, iptables, UFW, kaalia paths, scripts verbatim) into `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` (commit fd80cc3). This is the canonical "how to bring up the second host" doc.

## Open work (ordered)

1. **Decide WAN path.** Three credible options: (a) get Fios admin via Verizon support call or factory-reset, (b) install UniFi gateway (UCG-Pro on hand or to be procured) in bridge mode in front of Fios CPE, (c) park the listing until the upstream network is owned end-to-end. The 2026-05-01 Sartor-Saxena-Claude Network takeover removed BHS from the network without admin to Fios — this is the same problem one layer up.
2. **Open ports 40100-40199** at the chosen WAN path. UFW already configured pattern in gpuserver1's onboarding doc; copy that.
3. **Generate vast.ai API key** named "rtxserver" on the same Solar Inference LLC vast.ai account as gpuserver1's. Install at `~/.config/vastai/vast_api_key` chmod 600 on rtxserver.
4. **Install kaalia daemon** via vast.ai installer. Confirm machine_id and host_port_range files write correctly. Heartbeat to 52.90.216.45:7071 should turn `verification` green.
5. **Add hairpin NAT** for rtxserver's new external IP. OUTPUT-chain DNAT pattern from gpuserver1's iptables.
6. **Install cron suite.** 4 jobs: `gather_mirror.sh` every 4h, `stale-detect.sh` hourly, `vastai-tend.sh` every 30 min, `docker-weekly-prune.sh` Sunday 4 AM. Adapt paths.
7. **Run `vastai self-test`.** Confirms ports reachable from vast.ai's NOC.
8. **List the machine.** `vastai list machine <id> -g 2.50 -b 2.00 -s 0.10 -m 1 -e <date>`. End-date: 6 months out is the gpuserver1 pattern; web-UI extensions are easy.
9. **Write `MISSION-v0.1.md`** for rtxpro6000server, mirroring `machines/gpuserver1/MISSION.md` shape.
10. **Write `procedures/vastai-host-onboarding.md`** as the canonical procedure, drafted from what actually worked.
11. **First-rental confirmation.** First successful client connection closes the bring-up loop.

## Recent activity (last ~14 days)

- **2026-05-02 evening** (`5f583e9`, `ab14b0a`, `d78c502`, `de2b5d7`, `43cf9dd`, `fd80cc3`): rtxserver thermal stress complete (verdict 450W/card production envelope), peer-comms skill updated for systemd auto-respawn pattern, CLAUDE.md infrastructure block written, vastai-market-scan skill committed with $2.50 validation, curator pass reconciled $0.30/$0.40/$0.35 doc drift on gpuserver1, gpuserver1 wrote the self-contained replication dump to inbox. **Onboarding paused this evening** pending the Fios WAN decision.
- **2026-05-02 morning/afternoon** (`7427a7e`, `738d4fb`, `c3cb175` from 5/1): Memory server architecture switched — rtxserver bare repo became the canonical write target, GitHub demoted to nightly DR mirror. The Sartor-Saxena-Claude Network takeover (5/1) put rtxserver on its current network port.
- **2026-04-29** (`37602d0`, `83a75ab`, `616ae96`, `d11076b`): Post-BMC-binding 475W stress was *marginal* (GPU0 84°C peak, +10.9°C inter-card delta). BMC fan source bindings to PCIE03/PCIE07 applied. Cooling-upgrade phone-home filed at `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md` with 3 options. The 2026-05-02 stress with aggressive curves + dual-card resolved this — cap at 450W is the answer.
- **2026-04-28** (`b5b33f6`): BMC reference doc for rtxpro6000server (fan control, IPMI, self-management runbook).
- **2026-04-27** (`6f0f4f1`, `2be8109`): Phase A fan-control investigation found nct6798 PWM writes silently ineffective. Path B `acpi_enforce_resources=lax` applied. Original RESUME-after-shutdown-2026-04-27.md doc filed; superseded by the BMC path that ultimately worked.
- **2026-04-26** (`51bc299`, hardware mapping): Per-machine HARDWARE.md created. Live recon via dmidecode/lscpu/nvidia-smi/sensors. PSU rating identified as Phase F gating unknown.
- **2026-04-22** (`1c3b3bf`): Blackwell bring-up + overnight training kickoff. Third peer machine `rtxpro6000server` online with HWE 6.8 kernel.

## Resume command-list

When Alton greenlights the WAN path and rtxserver Claude is sent back at this work, fire in this order from inside rtxserver's tmux session:

```bash
# 0. Sanity
ssh alton@192.168.1.157
tmux attach -t claude-team-1
git -C ~/Sartor-claude-network pull origin main

# 1. Generate API key in vast.ai web UI named "rtxserver", then on rtxserver:
mkdir -p ~/.config/vastai
chmod 700 ~/.config/vastai
~/.local/bin/vastai set api-key <KEY_FROM_WEBUI>
chmod 600 ~/.config/vastai/vast_api_key
~/.local/bin/vastai show user   # confirm alto84@gmail.com / Solar Inference LLC

# 2. Install kaalia (from vast.ai docs — this is the host-side daemon installer)
# (curl/sudo command from vast.ai console; produces /var/lib/vastai_kaalia/ tree)

# 3. Open ports 40100-40199 at WAN path (depends on decision in blocker #1)
sudo ufw allow 40100:40199/tcp comment "vast.ai rtxserver"
sudo ufw route allow proto tcp from any to any port 40100:40199 comment "vast.ai containers"

# 4. Hairpin NAT (replace <PUB_IP> with rtxserver's actual public IP after WAN path is up)
sudo iptables -t nat -A OUTPUT -d <PUB_IP> -j DNAT --to-destination 192.168.1.157

# 5. Install cron suite (templates in inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md)
# Adapt MACHINE_ID, INBOX path to inbox/rtxserver/, source: rtxserver
crontab -e   # paste the 4-line block

# 6. Self-test
~/.local/bin/vastai self-test

# 7. List
~/.local/bin/vastai list machine <ID> -g 2.50 -b 2.00 -s 0.10 -m 1 -e "11/02/2026"

# 8. Verify on web UI + 500.farm; first rental closes the loop.
```

## When this file should refresh

Refresh triggers (vast-ai-watcher should re-edit this file on any of these):

- Any commit touching `machines/rtxpro6000server/`, `inbox/rtxserver/`, or `inbox/rocinante/` with `rtxserver` in subject.
- Any commit message containing `vast.ai`, `vastai`, `port-forward`, `fios`, `dmz`, `hairpin`, `kaalia`, `onboarding`, or `mission` related to rtxserver.
- Any new file at `procedures/vastai-host-onboarding.md`, `machines/rtxpro6000server/MISSION-v*.md`, or `inbox/rtxpro6000server/RESUME-vastai-onboarding-*.md`.
- Manual ping from Alton ("refresh the rtxserver tracker").

On refresh: append to "Recent activity", update blocker statuses, move items between "Open work" and "Done" as they resolve, and bump frontmatter `updated:`.

When the machine has its first rental and the procedure doc is written, this tracker's status flips to `archived` and a one-line "first-rental record" entry is added under "Done".

## Open caveats

- The brief that spawned this tracker references three on-disk seed files (`inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md`, `machines/rtxpro6000server/MISSION-v0.1.md`, `projects/rtx-stress-design-2026-05-02.md`) and a pause commit (`6cee210`). None exist in the current tree as of 2026-05-02 evening. State here is reconstructed from on-disk evidence (the curator's decisions doc, gpuserver1's onboarding dump, the 2026-05-02 stress commit, the peer-comms skill updates) plus the brief's explicit summary. When the rtxserver-side RESUME doc and MISSION-v0.1.md actually land, link them in the related-list above and merge their content into the relevant sections here.
- `inbox/rtxserver/` does not yet exist as a directory — gpuserver1's dump used `inbox/rtxserver/` in path templates, but no commits have yet created this path. First rtxserver-side commit will need to `mkdir -p sartor/memory/inbox/rtxserver/`.
- Listing `end_date` for first list: gpuserver1's pattern is 6 months. Pick a Friday for clean accounting; first reasonable date is 2026-11-02.
