---
name: aneeta-peer-setup
description: Setup guide for Aneeta's Claude Code peer instance on the Sartor network. Phase 1 = her existing personal laptop (lightweight, fastest path). Phase 2 = optional dedicated hardware later if she outgrows the laptop. Mirrors the rtxserver / gpuserver1 peer-comms pattern with adjustments for a not-always-on host.
type: project
status: phase-1-planned-laptop-pending-her-time
date: 2026-05-01
related:
  - reference/OPERATING-AGREEMENT
  - reference/HOUSEHOLD-CONSTITUTION
  - .claude/skills/peer-comms
tags: [project/planned, infra/peer-machine, family/aneeta]
---

# Aneeta peer machine — setup guide

A Claude Code instance authenticated to **Aneeta's own Claude account**, integrated into the Sartor peer-comms network alongside `rtxpro6000server` and `gpuserver1`. She controls it; Alton's Rocinante can SCP directives + read her commits via the standard peer pattern when her laptop is on the LAN.

## Approach

**Phase 1 (start here): her existing personal laptop.** Lightweight, no hardware purchase, easy for her to integrate. Trade-off is "best effort" availability — when her laptop is closed/asleep her peer is offline, when it's open and on LAN her peer is reachable. Acceptable for the kind of network-admin / family-wiki work she'll likely do.

**Phase 2 (only if needed): dedicated always-on hardware** (Mac mini M4 or similar). Defer until the laptop pattern hits real friction.

## Important: which laptop

- **Her personal MacBook (or Windows laptop)** — yes, this is the target
- **NOT her Neurvati work laptop** at `192.168.1.193` — that's corp-locked; IT won't permit Claude Code installation or cloning a personal git repo onto it. Also gets returned when she changes jobs. Skip.

## Phase 1 setup procedure (when she has 20 min at her laptop)

### 1. Connect her laptop to the household network

- WiFi: join `LGP123` with PSK `$uga($pi(e` (the cats — she chose it)
- Or Ethernet: any open switch port works fine

### 2. Install Claude Code

- macOS: `brew install --cask claude-code` (or download from https://claude.com/code)
- Windows: installer from claude.com
- Authenticate with **Aneeta's Claude account** (not Alton's): run `claude` in a terminal, follow the OAuth flow that opens in her browser. Important: this is HER credential, billing goes to HER account.
- Verify: `claude --version` should print OK.

### 3. Clone the Sartor memory repo from rtxserver bare (NOT GitHub)

As of 2026-05-02 the canonical git remote is the bare repo on rtxserver, not GitHub. See [[reference_memory_server]] for full architecture. Aneeta's laptop never needs GitHub credentials at all — much cleaner.

```bash
# First: SSH-key setup (one-time)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub  # copy this output, Alton appends to rtxserver:~/.ssh/authorized_keys

# Then clone:
cd ~
git clone alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git
cd Sartor-claude-network
```

What this gets her: `origin` already pointing at the rtxserver bare. She can push directly. Her commits show up on GitHub by the next morning via Rocinante's nightly mirror task. No GitHub account needed, no PAT to rotate, no collaborator invite to manage. The whole multi-machine substrate is now SSH-key-only on the LAN.

### 4. Run Claude Code from the repo directory

```bash
cd ~/Sartor-claude-network
claude
```

That gives her a Claude that has the full Sartor memory tree + family wiki + peer-comms skill loaded. She can talk to it the way Alton talks to his.

### 5. Reserve her IP in the UniFi controller

- Settings → Clients → find her laptop's MAC → set Alias to "Aneeta laptop" → Fixed IP recommended (e.g. `192.168.1.181`) so peer-comms targets don't move.
- This step from Alton's controller (he's currently the only admin).

### 6. Pre-register her peer in the wiki

- Inbox dir already created at `sartor/memory/inbox/aneeta-peer/` with `.gitkeep` (this commit)
- When she's ready, append her hostname to the OPERATING-AGREEMENT as a participating peer (light-touch — it's a laptop, not always-on, so the heartbeat + autonomous-work clauses don't apply)

### 7. Optional: SSH access from Rocinante

For peer-comms (Alton fires a directive at her Claude when she's at her laptop):
- macOS: System Settings → General → Sharing → enable Remote Login (SSH). Set a password — household-default `;Lkjpoiu0987` is fine, or hers.
- From Rocinante: `ssh aneeta@192.168.1.181` (or whatever IP) → drops into her shell. The same SCP-then-tmux send-keys pattern as rtxserver works.

### 8. Test cross-machine

- Rocinante writes a test directive, SCP's to her laptop, fires it via tmux send-keys
- Her Claude responds
- Her Claude writes a phone-home file to `~/Sartor-claude-network/sartor/memory/inbox/rocinante/` and commits it locally
- Next time Rocinante runs `git fetch <her-laptop-remote>` (or she pushes via Alton), the inbox lands

## What changes when her laptop sleeps

- Her Claude is offline (CPU paused)
- Tmux session pauses; resumes on wake
- Any pending directives queue up; she'll see them when she opens the laptop next
- Heartbeat-based monitoring (`daily-household-health` skill) should treat her peer as "best-effort, no alerts on offline"

This is the main difference from the rtxserver pattern (always-on). The peer-comms skill works fine; we just don't fire-and-forget into her laptop.

## What this gives her

- Her own Claude she can talk to from her laptop, billed to her account
- Full read of the family wiki + memory tree
- Peer-comms with Alton's Rocinante when she wants delegation
- UniFi network admin (separately, via the local controller's admin invite — see [[unifi-takeover-2026-05-01]])

## What's pre-staged tonight (before she does anything)

- ✅ Inbox directory `sartor/memory/inbox/aneeta-peer/` with placeholder
- ✅ This setup guide
- ✅ Repo current — she clones latest after we push the takeover commits
- ✅ Memory-server topology in place (2026-05-02): canonical git is the rtxserver bare repo, GitHub is a DR mirror. Her path is now SSH-key-only — no GitHub account needed.
- ⏳ Append her SSH pubkey to `rtxserver:~/.ssh/authorized_keys` once she generates one — Alton's quick step (or Aneeta does it via `ssh-copy-id` if she has Alton's SSH access)
- ⏳ Add her to UniFi controller as Admin — separate quick step
- ⏳ OPERATING-AGREEMENT amendment — defer until her peer is actually online (don't preregister phantom peers)

## Phase 2 (later, if needed)

If after a few months her laptop pattern feels limiting (she wants Claude available when laptop is closed, wants dedicated compute, wants always-on automation), upgrade to dedicated hardware:

- **Mac mini M4** (~$700-1000, polished, recommended) → place in the AV rack or her office
- **Beelink / Minisforum mini-PC** ($300-400, plug-and-play, Linux or Windows)

The migration from laptop → dedicated is straightforward: re-run steps 1-6 on the new hardware, retire the laptop's Claude session, update the OPERATING-AGREEMENT entry.

## Open questions for Aneeta

- Which laptop? (personal MacBook? other?)
- Add her to GitHub collaborators or use a personal-access-token?
- UniFi admin invite to her email or a separate one?
- Hostname preference for her peer (`aneeta-laptop`, `aneeta-peer`, custom)?
