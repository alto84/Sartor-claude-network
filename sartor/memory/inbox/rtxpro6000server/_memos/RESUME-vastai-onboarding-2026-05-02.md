---
name: resume-vastai-onboarding-2026-05-02
description: Vast.ai onboarding for rtxpro6000server was halted mid-flight 2026-05-02 evening because Alton decided to physically rewire rtxserver onto the switch directly (bypassing the Fios router port-forward path). All pre-network-pivot work is captured here; resumption protocol below picks up after Alton signals the network pivot is done.
type: resume-marker
hostname: rtxpro6000server
date: 2026-05-02
author: rtxpro6000server (Claude Opus 4.7)
phase: paused-pending-network-topology-pivot
related:
  - sartor/memory/machines/rtxpro6000server/MISSION-v0.1
  - sartor/memory/machines/rtxpro6000server/CRONS
  - sartor/memory/machines/rtxpro6000server/HARDWARE
  - sartor/memory/machines/rtxpro6000server/onboarding-staged/
  - sartor/memory/inbox/rtxpro6000server/PHONE-HOME-vastai-onboarding-host-package-gap
tags: [meta/resume-marker, machine/rtxpro6000server, vastai-onboarding, paused]
severity: action-needed-resume
---

# RESUME — vast.ai onboarding for rtxpro6000server (paused 2026-05-02)

## What happened

Today's onboarding window started clean: vastai CLI installed, UFW configured, API key landed, auth verified. Then a gap surfaced — vast.ai's host package (Docker + nvidia-container-toolkit + Kaalia daemon) is not installed on rtxserver, and the directive's flow presumed it was. I phoned home for a path decision (Option A/B/C). Before the path decision came back, Alton announced a network topology pivot: rtxserver moves from "behind Fios router with port-forward 40100-40199" to "directly on the switch." That changes the external-IP path entirely and invalidates the hairpin NAT draft. All vast.ai-side firing halted.

## What's done (state to be re-verified after pivot)

| Item | State | Notes |
|------|-------|-------|
| Vastai CLIENT CLI installed | DONE | `~/.local/bin/vastai` v1.0.8. Stays valid across network change. |
| `vastai show user` auth verify | DONE pre-halt | balance $4.09, ID 355373, alto84@gmail.com. Stays valid across network change. |
| API key file | IN PLACE | `~/.config/vastai/vast_api_key`, mode 600, 64 bytes. Stays valid. **Do NOT shred or rotate** unless Alton requests. |
| UFW rules | ACTIVE | SSH/22, LAN/192.168.1.0/24, 40100-40199/tcp. **MAY NEED REVISION** depending on pivot — see below. |
| Hairpin NAT | DRAFT ONLY (not applied) | At `sartor/memory/machines/rtxpro6000server/onboarding-staged/hairpin-nat-rules.txt`. **STALE** — the OUTPUT DNAT rule rewrites packets going to 100.1.100.63:40100-40199. After pivot, rtxserver may have its own external IP and the rule's parameters change. **Re-author from probe data after pivot.** |
| systemd nvidia-power-cap.service | DRAFT ONLY (not installed) | At `onboarding-staged/nvidia-power-cap.service`. Network-independent — install whenever convenient. |
| MISSION-v0.1.md | COMMITTED | `sartor/memory/machines/rtxpro6000server/MISSION-v0.1.md`. Reflects `-m 2` listing strategy. May need minor edits if external-IP changes (currently says `100.1.100.63 (shared with gpuserver1)`). |
| CRONS.md | COMMITTED | `sartor/memory/machines/rtxpro6000server/CRONS.md`. Reconstructed-from-spec scripts referenced; install pass deferred. |
| HARDWARE-history-line.txt | DRAFT ONLY | At `onboarding-staged/HARDWARE-history-line.txt`. Reflects `-m 2`. Update with post-pivot external IP and the actual VERIFIED time + DLPerf score when listing fires. |
| 4 cron scripts | STAGED at `onboarding-staged/` | Reconstructed from CRONS.md spec, NOT adapted from gpuserver1 live source. **Diff against gpuserver1 before deploy.** All pass `bash -n`. |
| Phone-home: host-package gap | FILED | At `inbox/rtxpro6000server/PHONE-HOME-vastai-onboarding-host-package-gap.md`. Decision pending. |
| Subagent A research | DONE | Verdict: `-m 1` allows subdivision; must use `-m 2`. Source: vast-cli code + Vast docs. Captured in MISSION/CRONS/HARDWARE drafts. |

## What's pending (re-fire sequence post-pivot)

1. **Step 6 prep (re-do)** — re-probe external IP after network pivot:
   ```
   curl -s ifconfig.me; curl -s api.ipify.org
   ```
   Note: rtxserver may now have its OWN public IP if Alton rewired through a different path. Or it may share one with gpuserver1 still, but routed differently. Either way, re-author the hairpin NAT rule from the post-pivot IP.

2. **Step 5 (revisit)** — UFW rules may need port-range re-decision. If rtxserver no longer needs to share a port range with gpuserver1 (because they're on different external IPs now), the 40100-40199 choice can be revisited. **Default: keep 40100-40199** unless there's a reason to change. Update the listed UFW rules if changed.

3. **Step 6-apply (re-author + apply)** — after probe, write a new hairpin NAT rule reflecting the post-pivot topology, splice into `/etc/ufw/before.rules`, `ufw reload`, verify `iptables -t nat -L OUTPUT`. The DRAFT at `onboarding-staged/hairpin-nat-rules.txt` is reference material only; do not copy verbatim.

4. **Decide on host-install path (Option A/B/C from PHONE-HOME-vastai-onboarding-host-package-gap.md)** — Alton's call. The phone-home recommended Option B (defer to daylight + research vast.ai's `setup.sh` first). Network pivot may also obviate some of the Fios-specific concerns from that phone-home; re-read the phone-home with fresh eyes.

5. **Install vast.ai host package** — per chosen option. This is the layer that gets rtxserver a machine ID and registers it with vast.ai's backend.

6. **Step 8 (cron install)** — diff staged scripts against gpuserver1 live source (Rocinante's SSH access OR new SSH key from rtxserver to gpuserver1 first). Resolve discrepancies. Install to `/home/alton/`. Add to crontab.

7. **Step 12.5b** — install + enable `nvidia-power-cap.service`. Network-independent; can fire any time post-pivot.

8. **Step 11** — vastai self-test (auto-triggered after listing OR via `vastai test`). Gates on: post-pivot port-forward / direct connectivity AND host package installed AND hairpin NAT applied.

9. **Step 12** — `vastai list machine <NEW_ID> -g 2.50 -m 2 -b 2.00 -s 0.10 -e 2026-11-02`. **`-m 2` (NOT `-m 1`)** — see Subagent A verdict in MISSION-v0.1.md.

10. **Step 13** — VERIFIED status + DLPerf score watch (4-8h). Phone-home if either is concerning.

11. **Step 14** — write `sartor/memory/procedures/vastai-host-onboarding.md`. Derive from the actual successful end-to-end execution, not from a recipe. Include the SCP-clipboard-hijack JS method for API key delivery (per Alton's note today). 600-1000 lines target.

## What CHANGES after the network pivot

1. **External IP**: re-probe required. `100.1.100.63` may or may not still apply.
2. **Hairpin NAT**: the draft at `onboarding-staged/hairpin-nat-rules.txt` is for the OLD topology and STALE. Re-author from post-pivot probe data.
3. **Fios port-forward (step 7 of original directive)**: NOT NEEDED if rtxserver is directly on the switch. The "Alton manually configures Fios router" step disappears in the new topology.
4. **gpuserver1 isolation**: rtxserver now reaches the wider network without going through Fios's NAT for gpuserver1's port range. Possible side effect: rtxserver and gpuserver1 may not share an external IP anymore. Re-confirm.
5. **DOCKER-USER conntrack rule**: still required for Docker bridge; install via systemd unit when Docker lands.
6. **UFW port range**: re-decide whether 40100-40199 is still the right choice. Default keep; revise only if there's a specific reason post-pivot.

## What does NOT change

- API key at `~/.config/vastai/vast_api_key` — stays valid.
- vastai CLIENT CLI — stays valid.
- BMC fan curves and source bindings — physical to the box, network-independent.
- GPU power cap of 450 W — physical to the box, network-independent.
- Production thermal envelope — established by 2026-05-02 stress sequence; still authoritative.
- MISSION-v0.1.md and CRONS.md doc structure — only specific IP / topology lines may need touching up.
- The reconstructed cron scripts — still need to be diff'd against gpuserver1 source before deploy.

## Resumption command list for the next session

When Alton signals the network pivot is done:

```bash
# 1. Pull this RESUME file + any updates Alton committed
cd ~/Sartor-claude-network && git pull --rebase origin main

# 2. Re-probe external IP from the new topology
echo "=== external IP probe (post-pivot) ==="
curl -s --max-time 5 ifconfig.me; echo
curl -s --max-time 5 api.ipify.org; echo
# ALSO note IPv6 if relevant:
curl -s --max-time 5 -6 ifconfig.me; echo

# 3. Confirm UFW still active and rules still good
sudo ufw status verbose

# 4. Confirm vastai auth still works
~/.local/bin/vastai show user | head -5

# 5. Confirm API key still in place
ls -la ~/.config/vastai/vast_api_key
# expect: -rw------- 1 alton alton 64 ...

# 6. Re-read the host-package-gap phone-home + this RESUME file before re-firing
cat ~/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/PHONE-HOME-vastai-onboarding-host-package-gap.md
# Pick host-install option (A/B/C) with Alton.

# 7. From here: re-author hairpin NAT from new IP, then proceed per step 6-apply onward.
```

## Files to consult on resumption (in priority order)

1. This RESUME file — for state.
2. `inbox/rtxpro6000server/PHONE-HOME-vastai-onboarding-host-package-gap.md` — for host-install path decision.
3. `machines/rtxpro6000server/MISSION-v0.1.md` — for the operating envelope and listing strategy.
4. `machines/rtxpro6000server/CRONS.md` — for cron strategy.
5. `machines/rtxpro6000server/onboarding-staged/` — staged drafts (use as reference, not blind-copy).
6. `machines/gpuserver1/MISSION.md`, `gpuserver1/CRONS.md`, `gpuserver1/HARDWARE.md` — peer reference.

## Network pivot context (for the future-self reading this)

The original plan: rtxserver on 192.168.1.157 behind a Fios router that NATs all external traffic. gpuserver1 owned the DMZ; rtxserver got explicit port-forwarding for 40100-40199. Hairpin NAT was needed because consumer Fios routers don't NAT-loopback (host can't reach its own external IP via the router).

The pivot: rtxserver moves to a direct switch connection. The exact downstream topology is Alton's call (might be a managed switch with VLAN to a separate WAN, might be a different ISP path, might be that rtxserver gets its own public IPv4 via a new Fios LAN port, etc.). Whatever the new topology, the hairpin / port-forward / UFW choices need to be re-derived from probe data.

Reasoning for the pivot is not captured in chat as of this writing — Alton's call, made during the host-install-path decision window. May be motivated by:
- Performance: switch-direct is lower-latency than going through router NAT.
- Reliability: less single-point-of-failure on the Fios router.
- Capacity: vast.ai customer traffic on rtxserver shouldn't compete with household traffic on the Fios router NAT table.
- Isolation: cleaner separation between gpuserver1 (DMZ) and rtxserver (own path).

The procedure doc (step 14) should capture the network architecture rationale once known.
