---
name: phone-home-host-package-still-blocks-2026-05-02
description: Fios port-forward unblock landed; rtxserver-side hairpin NAT and nvidia-power-cap.service applied tonight. But the host-package gap (Docker + nvidia-container-toolkit + Kaalia daemon NOT INSTALLED) still blocks `vastai self-test` and `vastai list machine` because rtxserver has no machine ID. The earlier phone-home's Option A/B/C decision is still required. Listing-research findings (from a now-stand-down subagent) attached as evidence — pricing anchor was 3x off-market.
type: phone-home
hostname: rtxpro6000server
date: 2026-05-02
author: rtxpro6000server (Claude Opus 4.7)
phase: pre-listing-blockers-narrowed
related:
  - sartor/memory/inbox/rtxpro6000server/PHONE-HOME-vastai-onboarding-host-package-gap
  - sartor/memory/inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02
  - sartor/memory/projects/rtxserver-vastai-watch
  - sartor/memory/machines/rtxpro6000server/MISSION-v0.1
tags: [meta/phone-home, machine/rtxpro6000server, vastai-onboarding, decision-needed]
severity: action-needed-decision
---

# PHONE-HOME — host-package gap still blocks; tonight's progress + research findings

## What the FIRE prompt resolved

Rocinante landed `40100-40199 TCP -> 192.168.1.157` on the Verizon Fios CR1000A (verified persisted). External IP is still `100.1.100.63` (same WAN as gpuserver1; original hairpin draft still valid). The WAN-ingress blocker is closed.

## What I did tonight

### Hairpin NAT — APPLIED + functionally verified

- Backed up `/etc/ufw/before.rules` to `/etc/ufw/before.rules.pre-rtxserver-hairpin-2026-05-02`.
- Spliced the `*nat` table block from `onboarding-staged/hairpin-nat-rules.txt` immediately above `*filter`.
- `ufw reload` clean. `iptables -t nat -L OUTPUT -n -v` shows:
  ```
  DNAT  tcp  --  *  *  0.0.0.0/0  100.1.100.63  tcp dpts:40100:40199 to:192.168.1.157
  ```
- End-to-end functional test: started a python listener on `192.168.1.157:40150`, ran `curl http://100.1.100.63:40150/` from rtxserver itself. Returned `HTTP 200 'HAIRPIN!'` at `0.000275s`. Pre-splice baseline was full 5.0s timeout (packet was leaving the LAN and getting black-holed at the Fios edge). DNAT is rewriting LAN-side packets to local correctly.
- Persistence: rule lives in `/etc/ufw/before.rules`, loaded by UFW on boot. No additional systemd unit needed.

### nvidia-power-cap.service — INSTALLED + enabled

- Installed `onboarding-staged/nvidia-power-cap.service` to `/etc/systemd/system/nvidia-power-cap.service` (mode 644, root:root).
- `daemon-reload` + `enable` + `start` clean. `is-enabled` returns `enabled`.
- Fresh run journal: `Power limit for GPU 00000000:01:00.0 was set to 450.00 W` (same for `:02:00.0`).
- Will re-apply on every boot before docker.service. No more pl=600W reboot regressions.
- Both cards currently at pl=450W, idle temps 46/41 °C.

### What I did NOT do

- **Cron suite (FIRE step B):** DEFERRED. The staged scripts (`gather_mirror.sh`, `stale-detect.sh`, `vastai-tend.sh`, `docker-weekly-prune.sh`) all reference a `MACHINE_ID` that doesn't exist yet. `vastai-tend.sh` parses `vastai show machines` looking for rtxserver — would currently return only gpuserver1 (52271). `CRONS.md` activation gate also explicitly requires successful listing first. Installing scripts to `/home/alton/` and adding crontab lines tonight would be wired to a void.
- **`vastai self-test` (FIRE step C-prep, also re-affirmed in inject):** IMPOSSIBLE. The CLI has no standalone reachability test. The only self-test command is `vastai self-test machine <ID>`, which is a `[Host]` command requiring a machine ID. `vastai test` and `vastai self-test` (no args) both fail with "invalid choice." I confirmed this by inspecting `vastai --help` output. The full command list shows: `self-test machine [Host] Perform a self-test on the specified machine`. No reachability probe exists outside of that.
- **`vastai list machine` (FIRE step C-fire):** TWO blockers — (a) no machine ID to list, (b) gated on vast-ai-watcher's listing-decision deliverable per Alton's reassignment.

## The actual gating blocker — host-package install

`vastai show machines` confirms tonight: only gpuserver1 (52271) is registered. rtxserver has no machine record. The original phone-home from earlier today (`PHONE-HOME-vastai-onboarding-host-package-gap.md`) is still LIVE — it presented Options A/B/C for installing Docker + nvidia-container-toolkit + Kaalia daemon, and a decision was never returned because Alton pivoted to the network topology question first.

| Component | gpuserver1 | rtxserver |
|-----------|-----------|-----------|
| Docker | active | NOT INSTALLED |
| nvidia-container-toolkit | installed | NOT INSTALLED |
| Kaalia daemon | active (vastai.service) | NOT INSTALLED (no `/var/lib/vastai_kaalia/`) |
| Machine ID | 52271 | none |
| Verified | yes (DLPerf 203.2) | n/a |

Until the kaalia daemon registers rtxserver with vast.ai's backend, no machine ID is allocated, no self-test is possible, and no listing can fire. Verification clock starts only AFTER the machine appears in `vastai show machines`.

## The earlier phone-home's options, re-stated

(Full text in `PHONE-HOME-vastai-onboarding-host-package-gap.md`. Summary:)

- **Option A** — run vast.ai's `setup.sh` tonight, hand-on-shoulder install with output captured to log + Alton greenlights each unfamiliar prompt. Gets us listed tonight. Costs Alton's evening attention.
- **Option B** — defer to daylight + dedicated focus tomorrow. Rocinante or a research agent reads `setup.sh` content first to produce an expected-prompts list. Zero revenue impact (vast.ai charges per rental hour, not per listing day). Subagent's earlier recommendation.
- **Option C** — Rocinante drives the install via Chrome MCP using vast.ai's web-UI host setup flow if such a flow exists. Path-of-least-surprise if it works; may end up at the same `setup.sh` regardless.

## Listing-research findings (from a stand-down subagent — relayed for vast-ai-watcher)

Note: Alton reassigned this research to the `vast-ai-watcher` teammate AFTER I had launched a research subagent. The subagent finished before stand-down landed. Findings are below as evidence; **vast-ai-watcher still owns the listing-decision deliverable.** I am NOT making the pricing call.

1. **`-g` and `-b` are PER-GPU, not per-machine.** A 2-GPU listing with `-g 2.50 -m 2` exposes at $5.00/hr to renters. Our prior planning may have conflated per-machine and per-GPU. Cross-check with gpuserver1's actual flag values.

2. **The $2.50/GPU/hr anchor is ~3x above market.** Vast.ai market clearing for RTX PRO 6000 WS is $0.93-$1.00/GPU/hr (sources: `vast.ai/pricing/gpu/RTX-PRO-6000-WS`, `thundercompute.com/blog/nvidia-rtx-pro-6000-pricing` April 2026). Ceiling at RunPod/Hyperstack is $1.80-$1.89/hr. Listing at $2.50/GPU = expected zero rentals.

3. **No NVLink on RTX PRO 6000 WS.** Dual-card listings price as 2× single-GPU, NOT as a clustered "192 GB combined VRAM" premium unit. The combined-VRAM commercial story may be weaker than `MISSION-v0.1.md` assumes.

4. **Verification timeline:** 1-7 days for premium GPUs (RTX PRO 6000 WS named explicitly as priority class in `docs.vast.ai/documentation/host/verification-stages`). No published SLA.

5. **Unverified visibility:** Listed but tagged "Unverified." Most renters apply reliability filters >=0.95 (on-demand) or >=0.90 (interruptible), excluding new hosts until score accrues. Effective visibility during unverified window is to bargain-hunters and long-tail.

6. **Vast.ai removed host fees in June 2024** — take-home math is cleaner than the older 25% deduction would suggest.

7. **Subagent's recommended launch:** `-g 0.85 -b 0.65 -m 2 -s 0.10` ($1.70/hr machine, $1.30/hr floor). Ramp to $0.95-$1.15/GPU steady-state post-verification.

8. **Host workloads during active rental: FORBIDDEN.** `docs.vast.ai/documentation/host/hosting-overview` is explicit — "the hardware can not be used for any other purposes" during a rental contract. No MIG / MPS / co-tenancy supported on host side. Any "run training during idle-but-rented" plan should be dropped. Permitted only when no rental contract is active, and any such workload must be killable on demand within seconds.

These are subagent findings, not independently verified by me. vast-ai-watcher's deliverable supersedes.

## What I'm asking for

Two decisions, in order:

1. **Host-install path (A / B / C from the earlier phone-home).** Without this, `vastai self-test` and `vastai list machine` cannot fire — no path forward.
2. **Listing decision** from vast-ai-watcher (price, flags, timing). Will determine the `vastai list machine` command line once host-package is installed.

I am **idle** pending these. Hairpin NAT and power-cap unit will stay as-is whichever way both decisions go.

## Status snapshot for the next agent / session

- External IP: 100.1.100.63 (Fios WAN, shared with gpuserver1).
- Internal IP: 192.168.1.157.
- Fios port-forward 40100-40199 -> 192.168.1.157: ACTIVE (per FIRE prompt).
- UFW: 22, 192.168.1.0/24, 40100-40199/tcp ALLOW IN.
- Hairpin NAT: ACTIVE in `/etc/ufw/before.rules`.
- nvidia-power-cap.service: ACTIVE + enabled. pl=450W per card.
- vastai CLI: v1.0.8 at `~/.local/bin/vastai`. API key at `~/.config/vastai/vast_api_key` (mode 600). `vastai show user` returns alto84@gmail.com / Solar Inference LLC.
- vastai machine record for rtxserver: NONE.
- Docker / nvidia-container-toolkit / Kaalia daemon: NOT INSTALLED.
- BMC fan curves + GPU power cap: per MISSION-v0.1.md, unchanged.
- Idle GPU temps tonight: 46 / 41 °C.

## What changed in tracker (`projects/rtxserver-vastai-watch.md`)

I am NOT editing the watcher's tracker file — that's its job per its frontmatter ("Refreshes on relevant commits"). The tracker should pick up this phone-home and the two repo changes (UFW splice, systemd unit install) on its next refresh trigger. If it doesn't, that's a watcher-side bug worth surfacing.
