---
name: peer-comms
description: Use when about to send work to a peer machine (rtxpro6000server / gpuserver1) or check what one is doing. Loads the OAuth-ceremony, tmux protocol, send-keys+C-m, file-not-heredoc rule, phone-home convention, and per-peer quirks. Trigger when typing or thinking "ssh alton@192.168.1.{100,157}" for substantive work; not needed for quick read-only one-shots.
---

# peer-comms — talking to peer-machine Claudes

The protocol that makes cross-machine work auditable instead of ad-hoc. Each peer (rtxpro6000server, gpuserver1) runs its own local Claude in a persistent tmux session. You drive from Rocinante. Substrate is shared git, not shared filesystem.

## When this applies

Invoke when you are about to:
- Send a directive (>5 lines) to a peer Claude
- Spin up or restart a peer tmux session
- Resolve a phone-home (`sartor/memory/inbox/<host>/PHONE-HOME-*.md`)
- Recover from an OAuth expiry, peer reboot, or tmux loss
- Audit what a peer Claude has been doing

Skip for one-shot read-only queries (single `nvidia-smi`, `df -h`, etc.) — direct SSH is fine for those.

## Pre-flight (ALWAYS before sending substantive work)

```bash
# 1. Reachability
ssh -o ConnectTimeout=5 alton@<peer-ip> 'hostname; uptime; date -u'

# 2. Tmux session alive
ssh alton@<peer-ip> 'tmux ls 2>&1; tmux list-windows -t claude-team-1 2>&1'

# 3. OAuth token expiry (if pushing real work)
ssh alton@<peer-ip> 'date -d @$(jq -r .claudeAiOauth.expiresAt/1000 ~/.claude/.credentials.json)'

# 4. GPU state if relevant
ssh alton@<peer-ip> 'nvidia-smi --query-gpu=index,temperature.gpu,power.draw,memory.used --format=csv,noheader'

# 5. Disk pressure
ssh alton@<peer-ip> 'df -h / | tail -1'
```

If OAuth expires within 4 hours, refresh first via `scp ~/.claude/.credentials.json alton@<peer-ip>:~/.claude/.credentials.json && ssh alton@<peer-ip> 'chmod 600 ~/.claude/.credentials.json'`. The tmux Claude session will pick up the refreshed token on its next request.

## Sending a directive — the ceremony

**Never inline-heredoc a substantive prompt over SSH.** Apostrophes, backticks, dollar signs, and `$(...)` will break the bash quoting. Always go through a file.

```bash
# 1. Write the directive locally with the Write tool
#    Path: C:\Users\alto8\AppData\Local\Temp\<short-name>.txt

# 2. SCP to peer
scp /c/Users/alto8/AppData/Local/Temp/<short-name>.txt alton@<peer-ip>:/tmp/<short-name>.txt

# 3. Paste into the work pane
ssh alton@<peer-ip> 'tmux send-keys -t claude-team-1:0 "$(cat /tmp/<short-name>.txt)"'

# 4. Submit (CRITICAL — Enter is literal text in send-keys; C-m is the carriage return)
ssh alton@<peer-ip> 'tmux send-keys -t claude-team-1:0 C-m'

# 5. Verify it landed
sleep 4
ssh alton@<peer-ip> 'tmux capture-pane -t claude-team-1:0 -p | tail -15'
```

You should see the orchestrator transition to "Forming…" / "Photosynthesizing…" / "Cogitating…" or otherwise be processing.

## What every directive must contain

Per Constitution §14 + the discipline that has worked across this evening's Cato/persona-engineering chain:

1. **Context line** — what's blocked, what's orthogonal, what to ignore
2. **Goal** — one sentence
3. **Phases** with explicit verify gates between them
4. **Decision rule** for forks (e.g., "if Cato GREENLIGHTS, fire; if REVISE, phone home")
5. **Phone-home triggers** — explicit list of conditions where peer should stop and write to `inbox/<host>/PHONE-HOME-<topic>.md`
6. **Budget** — wall-clock + token cap
7. **What to commit and where**

## Reading peer state

```bash
# Tmux pane (the live work)
ssh alton@<peer-ip> 'tmux capture-pane -t claude-team-1:0 -p | tail -50'

# Recent peer-side commits (post-2026-05-02: peers push to rtxserver bare;
# read either via the bare or the peer's working tree)
git fetch origin   # origin = rtxserver bare; will pull commits from any peer
git log origin/main --oneline -10
# Optional: read directly from a peer's working tree if you suspect the bare hasn't received yet
git fetch <peer-remote-name>  # rtxserver / gpuserver1 working-tree remotes still configured
git log <peer>/main --oneline -10

# Phone-home inbox
ls sartor/memory/inbox/<host>/

# Or via SSH if not yet pulled
ssh alton@<peer-ip> 'ls ~/Sartor-claude-network/sartor/memory/inbox/<host>/ 2>&1'
```

## Failure-mode table

| Symptom | Diagnosis | Fix |
|---|---|---|
| `error connecting to /tmp/tmux-*/default` | tmux server died (peer rebooted, oom-killer, manual kill) | **rtxserver (since 2026-05-02): systemd auto-respawns the session** — just run `ssh alton@192.168.1.157 'systemctl --user start sartor-claude-peer.service'` to force a respawn, OR wait for the next reboot which auto-starts. **gpuserver1 (no systemd unit yet): manual** — `ssh alton@<peer> 'tmux new-session -d -s claude-team-1 -x 200 -y 50 "cd ~/Sartor-claude-network && claude --dangerously-skip-permissions"'`, wait 6s, capture-pane to confirm Claude is up |
| `Please run /login · API Error: 401` | OAuth token expired | Run `powershell.exe -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\sartor-creds-sync.ps1` from Rocinante to push fresh creds to all peers, then restart Claude on the peer (`systemctl --user restart sartor-claude-peer.service` on rtxserver, or kill+new-session on gpuserver1). The 4h scheduled task usually keeps tokens fresh, so this manual step is rare. |
| `tmux capture-pane` returns empty | Pane too narrow, OR session just started, OR captured before output flushed | Re-create session with `-x 200 -y 50`, sleep 3-5s after submit before capturing |
| send-keys "Enter" appears literally in pane | Used `Enter` instead of `C-m` | Send `C-m` separately (always two send-keys calls — one for text, one for C-m) |
| Bash heredoc EOF error sending directive | Apostrophes/backticks in content broke quoting | Use Write + SCP + `$(cat /tmp/...)` instead of inline heredoc |
| Hook errors `python: command not found` (rtxserver) | Peer's hooks reference `python` which Ubuntu calls `python3` | Non-blocking on rtxserver; peer Claude reports them as warnings. Filter from output, don't escalate |
| Peer pane shows queued messages but Claude isn't responding | Claude is mid-tool-call; messages get queued | Wait or `esc to interrupt` if truly stuck (rare; default is wait) |
| Compute work fired without expected Cato review | Discipline failure — protocol bypassed | Stop work, file in inbox, re-run Cato pattern from canonical state |

## Per-peer quirks

### rtxpro6000server (192.168.1.157)

- **Hardware:** dual RTX PRO 6000 Blackwell (96GB each, slots 3+7), Threadripper PRO 7975WX, ASUS WRX90E-SAGE SE, Noctua NH-U14S TR5-SP6 (air, zero TDP headroom on 7975WX), be quiet! 1600W PSU
- **Wall outlet:** 120V/15A — 1400W continuous ceiling. **Production cap 450W/card** (set 2026-05-02 after thermal stress sequence; was 475W previously). 500W will tag the breaker and approach 88°C abort threshold on GPU0.
- **Power-cap persistence:** systemd unit `nvidia-power-cap.service` re-applies `nvidia-smi -pl 450` on boot, ordered before docker.service. **Do not manually run `nvidia-smi -pl 600` and walk away** — the systemd unit only fires on boot, not periodically. If you change pl manually for a test, revert before any rental container starts.
- **Peer Claude auto-respawn:** user-level systemd unit `sartor-claude-peer.service` spawns `tmux new-session ... claude --dangerously-skip-permissions` at boot. Lingering enabled for `alton`. **To restart manually:** `systemctl --user restart sartor-claude-peer.service`. **No need to run `tmux new-session` by hand on rtxserver.**
- **BMC fan curves saved (persistent in firmware, applied 2026-05-02 via Chrome MCP):** Zones 2-6 set to 30°C/50% → 50°C/75% → 60°C/90% → 70°C/100%. Confirmed Phase B safe at 475W × 2 for 5 min (Tctl peak 65°C). Less aggressive curves were the historical Tctl bottleneck.
- **GPU asymmetry:** GPU0 (slot 3) runs ~11°C hotter than GPU1 (slot 7) under same load. Slot 3 is the hot slot.
- **CPU thermal coupling:** Noctua intake warms ~48°C from GPU exhaust ambient alone in single-card mode (only PCIE03 fan zone engaged). Dual-card mode breaks the recirculation loop — both PCIE07+PCIE03 fans run hard. Tctl is healthier under dual-card load than single-card load.
- **Front-fan PWM-cord override:** physical PWM cord from front-flower fans to motherboard can be unplugged + remote control set to MAX, giving hardware-100% airflow regardless of BMC PWM-scaling cap on CHA_FAN2/3 (which is stuck at 71% nameplate even at commanded 100%).
- **Working dir:** `~/Sartor-claude-network`
- **Venv:** `~/ml/bin/activate` (torch 2.10+cu128)
- **No GitHub credentials** — peer commits locally; Rocinante fetches via `rtxserver` remote
- **vast.ai onboarding state:** PAUSED 2026-05-02 pending network topology pivot. Resume from `inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md`. Don't fire `vastai list machine` until port-forward path is decided.
- **No vast.ai rental** — clean GPU access for research

### gpuserver1 (192.168.1.100)

- **Hardware:** single RTX 5090, i9-14900K, 128GB DDR5, MSI MAG Coreliquid A13 240 (AIO — pump should always be 100%)
- **Wall outlet:** 1200W PSU, dramatically over-provisioned for current workload
- **Active vast.ai rental** (container `C.34113802` through 2026-08-24). **NEVER touch the rental container.** No `docker exec`, no GPU reset. Read-only inspection only.
- **Per `business/rental-policy.md`:** host-CPU work during rental is allowed if load average stays under ~3 on 32-thread i9
- **Working dir:** `~/Sartor-claude-network`
- **No GitHub credentials** — same git flow as rtxserver
- **DMZ host** — all external traffic forwards here

## Git sync pattern

**As of 2026-05-02, the canonical write target is the bare repo on rtxserver: `alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git`.** Every peer's `origin` should point there. GitHub is a 15-min-lag DR mirror written exclusively by Rocinante's "Sartor Memory Mirror" Windows Scheduled Task. Full architecture in `sartor/memory/reference_memory_server.md` — read it before changing this section.

```bash
# Peer commits AND pushes (peers no longer wait for Rocinante to drain)
ssh alton@<peer-ip> 'cd ~/Sartor-claude-network && git status --short && git fetch origin && git log --oneline -3'

# After peer pushes to rtxserver bare, Rocinante syncs:
git fetch origin
git merge --ff-only origin/main   # or rebase if you have local work to land

# If a peer's origin still points at GitHub (pre-2026-05-02 onboarding), fall back to the
# old peer-working-tree fetch pattern until that peer's origin is repointed:
git fetch <peer-remote-name>      # rtxserver / gpuserver1 working-tree remotes
git merge <peer>/main --no-edit
git push origin main              # NB: origin = rtxserver bare; mirror handles GitHub
```

**Do not push to the `github` remote from any peer, including Rocinante outside the mirror script.** The "Sartor Memory Mirror" task pushes only `main` (not `--mirror`) to preserve claude.ai cloud-agent branches. Manual GitHub pushes from this thread risk both auth issues (no creds on peers) and overwriting cloud-agent branches.

If conflicts on persona-engineering files (`CATO-PROSECUTION-*`, `PASSOFF-*`, `experiments/*`), `git checkout --theirs` is usually right because the peer has been iterating those through Cato cycles. For machines/<host>/HARDWARE.md and similar shared docs, inspect both versions before deciding.

### Per-peer migration status (2026-05-02)

| Peer | `origin` URL | Pushes work? |
|---|---|---|
| Rocinante | `alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git` | ✅ migrated |
| rtxserver-self peer Claude | `alton@192.168.1.157:/home/alton/Sartor-claude-network` (working tree, pre-migration) | ⏳ next session |
| gpuserver1 peer Claude | likely GitHub HTTPS (pre-migration) | ⏳ next session |
| Aneeta laptop (future) | onboard directly to rtxserver bare per [[projects/aneeta-peer-setup]] | n/a yet |

When you sit down with a peer Claude session, the migration is one-shot:
```bash
ssh alton@<peer-ip>
cd ~/Sartor-claude-network
git remote set-url origin alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git
git fetch origin
git push origin main   # should be a no-op if peer was up-to-date
```
Add the peer's SSH pubkey to rtxserver's `~/.ssh/authorized_keys` first (rtxserver's own peer can use a local `file://` URL or just use its SSH pair to itself).

## Phone-home flow (when you receive one)

A peer writing `inbox/<host>/PHONE-HOME-<topic>.md` means it stopped voluntarily because something tripped a pre-registered trigger. Read the file. The peer's recommendation is in the closing section.

Decision options usually fall into:
- **(a) accept-and-revise** — the peer's analysis stands, fold findings into the next plan
- **(b) re-run with fix** — apply small fix, retry the same protocol
- **(c) strict halt + outside review** — spawn fresh Cato or other adversarial pass

Surface the file, present a/b/c with your read, get Alton's call, then send the resolution back to the peer via the directive ceremony above.

## What NOT to do

- Don't skip the pre-flight to save time. The 30-second OAuth+tmux check has prevented multiple compounding failures (tokens expiring mid-build, tmux-already-dead, etc.).
- Don't inline-heredoc directives over SSH — every previous attempt has eventually broken on quoting.
- Don't use `tmux send-keys ... Enter` — only `C-m` submits.
- Don't drive substantive work via raw SSH bypassing the local Claude unless you have a specific reason (characterization tests, recovery, peer-Claude unavailable). The local Claude builds situated memory; bypassing it is an audit-trail loss.
- Don't `git push` from a peer — it doesn't have credentials. Peers commit locally, Rocinante drains.
- Don't touch gpuserver1's vast.ai rental container under any circumstances.

## Canonical references

- `.claude/agents/peer-coordinator.md` — full agent definition (use for backgrounded long-running peer monitoring; this skill is for inline cross-machine work)
- `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` §14 — why each machine has a local Claude
- `sartor/memory/reference/OPERATING-AGREEMENT.md` — Rocinante↔gpuserver1 operating agreement (extends to rtxserver)
- `sartor/memory/business/rental-policy.md` — what's allowed on gpuserver1 during active rental
- `sartor/memory/machines/MACHINES.md` — fleet index with peer-coordinator quirks
- `sartor/memory/machines/<host>/HARDWARE.md` — per-peer hardware ground truth

## History

- 2026-04-27: Created from `.claude/agents/peer-coordinator.md` to lower friction. The agent was being skipped because spawning it added overhead vs. inline SSH; the skill loads the protocol into main thread instead. Triggered by Alton noting "I drove this myself" during the thermal-baseline test where the orchestrator wasn't involved.
