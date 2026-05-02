---
name: phone-home-vastai-onboarding-host-package-gap
description: Pre-listing gap discovered — the vast.ai HOST package is not installed on rtxserver. The directive's step 11/12 (self-test + list machine) presume host registration that doesn't exist yet. Pausing for Alton's call on whether to proceed with vast.ai's host setup script (significant system-level changes) or use an alternate path.
type: phone-home
hostname: rtxpro6000server
date: 2026-05-02
author: rtxpro6000server (Claude Opus 4.7)
phase: pre-listing-gap
related:
  - sartor/memory/machines/rtxpro6000server/MISSION-v0.1
  - sartor/memory/machines/rtxpro6000server/CRONS
  - sartor/memory/machines/gpuserver1/HARDWARE
tags: [meta/phone-home, machine/rtxpro6000server, vastai-onboarding, decision-needed]
severity: action-needed-decision
---

# PHONE-HOME — vast.ai host package not installed; gap to bridge

## What's done (pre-key + post-key pre-work)

- Step 3: vastai CLIENT CLI installed (`~/.local/bin/vastai` v1.0.8). Auth confirmed: alto84@gmail.com, balance $4.09, ID 355373.
- Step 5: UFW active with SSH/22, LAN/192.168.1.0/24, 40100-40199/tcp.
- Step 6 prep: hairpin NAT rule drafted at `~/cron-scripts-staged/hairpin-nat-rules.txt`. Not yet applied.
- Step 9: MISSION-v0.1.md (270 lines) and CRONS.md (180 lines) committed to repo.
- Step 12.5b: systemd unit `nvidia-power-cap.service` drafted at `~/cron-scripts-staged/nvidia-power-cap.service`. Not yet installed.
- Step 12.5a: subagent verdict on `-m N`: `-m 1` ALLOWS subdivision; must use `-m 2` for thermal safety. MISSION + HARDWARE-history-line corrected.
- Cron scripts: 4 reconstructed-from-spec at `~/cron-scripts-staged/` (not adapted from gpuserver1 source — SSH from rtxserver to gpuserver1 has no key configured). All pass `bash -n`. Diff-summary headers instruct install pass to verify against gpuserver1's live source before deploy.

## What's blocked

`vastai show machines` returns only gpuserver1 (52271). rtxserver has no host machine record. Therefore step 12 (`vastai list machine <ID> ...`) has no `<ID>` to use. The host package is the missing layer:

| Component | gpuserver1 | rtxserver |
|-----------|-----------|-----------|
| Docker | installed, active | **NOT INSTALLED** (no `docker` command) |
| nvidia-container-toolkit | installed | **NOT INSTALLED** |
| vast.ai host daemon (Kaalia) | active | **NOT INSTALLED** (no `vast` command, no `/var/lib/vast`, no systemd unit) |
| vast.ai machine ID | 52271 | **none** |
| Verified status | yes (DLPerf 203.2) | n/a |

The directive's step 11 (self-test) and step 12 (list) presume these are in place.

## What the install would do

Per vast.ai docs (https://vast.ai/docs/host/setup):
1. Run `wget https://console.vast.ai/install -O setup.sh && bash setup.sh` — downloads and runs an install script (~5 min).
2. Setup script installs Docker, nvidia-container-toolkit, the Kaalia daemon, modifies `/etc/docker/daemon.json` to add the nvidia runtime, may install kernel modules, configures cgroup v2 if needed.
3. Setup creates `/var/lib/vast/` for daemon state, registers a systemd unit `vastai.service`, starts the daemon.
4. The daemon registers with vast.ai's backend and is assigned a machine ID (visible via `vastai show machines` after registration).
5. The daemon runs the self-test cycle automatically — checks port reachability (the 40100-40199 hairpin/port-forward gates this), GPU enumeration, network bandwidth, disk performance.
6. After self-test passes, the host can be listed via `vastai list machine <new_ID> ...`.

## Risk envelope of running the host install tonight

- **Modifies system state**: yes (Docker daemon config, cgroup config, possibly kernel modules). All reversible via package uninstall but non-trivial.
- **Persists across reboots**: yes — that's the point.
- **Affects gpuserver1**: no (different machine, isolated).
- **Affects current rtxserver state**: yes — adds Docker, which means future runs of `nvidia-smi -pl 450` need to fire BEFORE Docker starts (the systemd unit I drafted already orders `Before=docker.service`, so this is anticipated).
- **Reveals unfamiliar prompts**: probably yes during script run. Per the original directive: "Any unfamiliar prompt from vast.ai's onboarding UI/CLI" is a phone-home trigger. So if I run the script, I'd be hitting that trigger immediately on any prompt I'm not sure about.
- **Network exposure**: the install opens the vast.ai listening daemon. Without Alton's port-forward, no inbound traffic; without our hairpin NAT, the self-test fails. Both are pending.

## What I'm asking for

A decision on the path forward. Three reasonable options:

### Option A — proceed with the vast.ai install script tonight (within this onboarding window)
Pros: complete the listing tonight as planned.
Cons: I'd be running an unfamiliar install script that modifies system config. The directive's "phone home on unfamiliar prompts" rule means I'd phone-home repeatedly during the script. Alton would have to be hands-on during the install.
**Mitigation:** I run the script with output captured to a log file; you read the log; you tell me to proceed at any prompt or to abort. Effectively, this becomes a hand-on-the-shoulder install. Alton's evening time + your time required.

### Option B — defer the host install to tomorrow under daylight + dedicated-attention conditions
Pros: not running unfamiliar install scripts at the end of a long day; Alton has full focus when reviewing prompts; we can prepare a fresh log of what `setup.sh` does on a similar Ubuntu 22.04 host beforehand.
Cons: lose tonight's onboarding momentum; the API key sits ready for ~12-24h before use.
**Cost of waiting:** very low. Vast.ai pays per rental hour, not per listing day. One day of delay = zero revenue impact.

### Option C — Rocinante drives the install via Chrome MCP using vast.ai's web-UI host setup flow
Pros: vast.ai's web UI may guide through the install via console.vast.ai → Host → Add Machine. That flow is interactive and Rocinante can handle the prompts in real time. Probably the path-of-least-surprise.
Cons: I haven't verified vast.ai has a web-UI-driven install (their docs lean toward `bash setup.sh`); may end up at the same `setup.sh` either way.

## My recommendation

**Option B + a Rocinante research pass first.** Specifically:
1. Tonight: Rocinante (or a research agent) reads the actual `setup.sh` content from vast.ai's install URL and produces a step-by-step expected-prompts list. ~30 min of work.
2. Tomorrow during daylight: Alton + me + Rocinante run the install with the prompts list as a reference. Any prompt that deviates from the list is a phone-home.
3. Alton's port-forward and the hairpin NAT splice happen in the same window so all infrastructure activates at once.
4. Self-test runs after host registers; listing fires after self-test passes; documentation derives from the live trace.

This protects against unfamiliar-prompt surprises, gives us a known-good install trace for the procedure doc (step 14 deliverable), and adds at most one calendar day to the timeline at zero revenue cost.

## What's safe to do tonight without Alton's call

I CAN do these now (non-destructive, reversible):
- Apply hairpin NAT rule to `/etc/ufw/before.rules` and `ufw reload` (step 6-apply). The rule is harmless until there's a vast.ai container listening on ports 40100-40199. Ping-from-self test would still fail until Alton's router port-forward lands.
- Install + enable the systemd `nvidia-power-cap.service` unit (step 12.5b). This re-applies pl=450 on every boot. Useful regardless of vast.ai timeline.
- Update the comparison file / commit the MISSION + CRONS docs.

I should NOT do without Alton's call:
- Run vast.ai's `setup.sh`
- Install Docker / nvidia-container-toolkit
- Modify any vast.ai-facing service state

## Status

- API key landed cleanly at `~/.config/vastai/vast_api_key` (mode 600, 64 bytes), auth verified.
- BMC, GPU power cap, sampler — all in normal state from this morning's stress test.
- Awaiting decision on Option A / B / C, or other.
