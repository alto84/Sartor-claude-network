---
name: reference_memory_server
description: Canonical architecture for the Sartor memory git topology. As of 2026-05-02 the canonical write target is the bare repo on rtxserver; GitHub is a disaster-recovery mirror maintained by Rocinante. This file is the authoritative source — if anything in CLAUDE.md, the Operating Agreement, or peer-comms disagrees with this file, this file wins.
type: reference
status: active
version: 1.0
created: 2026-05-02
related:
  - reference/OPERATING-AGREEMENT
  - reference/HOUSEHOLD-CONSTITUTION
  - .claude/skills/peer-comms
  - projects/aneeta-peer-setup
tags: [infra/git, infra/peer-machine, reference/architecture]
---

# Sartor memory server — git topology

> [!important] If you are a future Claude reading this for the first time
> The Sartor memory tree no longer treats GitHub as the canonical write target. Read this whole file before pushing anything.

## TL;DR

```
peers (rocinante, rtxserver, gpuserver1, aneeta-laptop, future)
   ↓ git push origin main
[rtxserver:/home/alton/sartor-git/Sartor-claude-network.git]   ← canonical, bare
   ↑ git fetch (nightly at 3:30 AM ET, Windows Scheduled Task on Rocinante)
[Rocinante]
   ↓ git push github main   (HTTPS, existing creds)
GitHub alto84/Sartor-claude-network   ← DR mirror only, lag ≤ 24 h
```

- **Single canonical target:** `alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git`
- **`origin` on every peer points there.**
- **GitHub is a disaster-recovery mirror.** It lags by up to ~24 h (nightly cycle). Never push to it directly from a peer; the next mirror cycle would clobber peer pushes if it was force-pushed in between.
- **Mirror responsibility:** Rocinante runs `C:\Users\alto8\scripts\sartor-mirror-to-github.ps1` nightly at 3:30 AM ET via the "Sartor Memory Mirror" Windows Scheduled Task. Mirror credentials live in Windows Credential Manager (HTTPS to GitHub). No GitHub keys exist anywhere else in the fleet. **Manual mirror anytime:** run the same .ps1 file by hand if you need an immediate push to GitHub (e.g., before stepping away from a session that won't be reachable for >24h).

## Why we changed it (2026-05-02)

The pre-2026-05-02 pattern was "GitHub is canonical; only Rocinante can push." Peers could only commit locally and wait for Rocinante to drain. That created a bottleneck for any peer Claude that wanted to record state in the shared memory: it had to wait for an interactive Rocinante session.

Two pressures forced the change:

1. **rtxserver and gpuserver1 peer Claudes** were already operating on a shared substrate but couldn't write to it directly.
2. **Aneeta's incoming peer instance** (see [[projects/aneeta-peer-setup]]) needed to participate without GitHub credentials.

The 4 TB drive on rtxserver was always going to be the natural off-Rocinante storage anchor; pivoting it to also be the canonical git remote cost almost nothing and eliminated the bottleneck.

## What lives where

| What | Where | Auth |
|---|---|---|
| Canonical repo (the source of truth) | `rtxserver:/home/alton/sartor-git/Sartor-claude-network.git` (bare) | SSH key per peer to rtxserver — same `~/.ssh/authorized_keys` already used for peer-comms |
| GitHub mirror | `https://github.com/alto84/Sartor-claude-network` | HTTPS, Windows Credential Manager on Rocinante. **Read-only from every other machine's perspective.** |
| Per-peer working clones (`origin` → bare) | `rocinante:C:\Users\alto8\Sartor-claude-network`, `rtxserver:~/Sartor-claude-network`, `gpuserver1:~/Sartor-claude-network`, future `aneeta-laptop:~/Sartor-claude-network` | Local |

## Workflow for any peer

```bash
# Standard rhythm. Substitute your local main if you branch.
git fetch origin
git rebase origin/main          # or merge --ff-only
# do work, stage, commit
git push origin main
```

That's it. The mirror to GitHub happens automatically on Rocinante's next 15-min cycle.

## Failure modes and how each peer should handle them

| Symptom | Diagnosis | Fix |
|---|---|---|
| `Connection refused` / `Connection timed out` on `git push origin` | rtxserver is offline (rare — server is on UPS) | Commit locally; retry push when peer-comms `ssh alton@192.168.1.157 hostname` succeeds. Do **not** push to `github` as a workaround — it will be overwritten. |
| `! [rejected] main -> main (non-fast-forward)` | Another peer pushed first | `git fetch origin && git rebase origin/main && git push origin main`. Standard git. |
| Mirror script errors in `C:\Users\alto8\backups\sartor-mirror.log` | rtxserver up but GitHub unreachable, or local Rocinante working tree dirty | Check the log line. If "ff-only merge failed", Rocinante has uncommitted divergent work; resolve manually before next cycle. If "push to github failed", GitHub is the problem — wait. |
| GitHub mirror is more than ~36 h stale (i.e., missed at least one nightly cycle) | Scheduled task not firing | `Get-ScheduledTask -TaskName 'Sartor Memory Mirror'` on Rocinante; check task state; check `C:\Users\alto8\backups\sartor-mirror.log` for last successful run; check Windows Event Viewer if needed. |
| Anyone except Rocinante tries to push to `github` remote | Anti-pattern — peers don't have GitHub creds, push will fail with auth error. **Even if you have creds, don't.** | Push to `origin` (= rtxserver). The mirror will pick it up. |

## Single-point-of-failure analysis

rtxserver is a SPOF for live writes. Mitigations:

1. **GitHub mirror with ≤24 h lag (nightly).** If rtxserver dies (hardware, OS, fire), every commit pushed before the last nightly run is preserved on GitHub. Recovery is `git clone github:alto84/Sartor-claude-network` to a new bare on a new server, repoint peers, push --all back. We accept up to ~24 h of write loss on rtxserver-fatal events. If a session is doing something where a same-day GitHub copy matters, run `C:\Users\alto8\scripts\sartor-mirror-to-github.ps1` by hand at session close.
2. **rtxserver has UPS.** Power blip alone won't take it down.
3. **Daily UniFi backup also lands on rtxserver.** If rtxserver dies, both the network config backups and the memory canonical go down together — but GitHub is the offsite for memory, and the local UniFi backup directory on Rocinante is the offsite for network config. Those failure domains are crossed, by design.
4. **gpuserver1 working clone is a hot spare.** Not a literal git remote we'd promote, but it has recent state. In a cold-start scenario, `git clone gpuserver1:~/Sartor-claude-network` retrieves whatever state was last fetched there.

What we don't have yet: an rtxserver→gpuserver1 mirror. Adding one is straightforward (cron on rtxserver: `git push --mirror alton@192.168.1.100:/home/alton/sartor-git-mirror/Sartor-claude-network.git` nightly at 3:30 AM ET). Defer until we have evidence we need it.

## Per-peer onboarding checklist

When a new peer joins the fleet (rtxserver-self, gpuserver1, Aneeta's laptop, anything future):

1. **SSH key from peer → rtxserver.** Generate `ssh-keygen -t ed25519` on the peer; append the `.pub` to `rtxserver:~/.ssh/authorized_keys`.
2. **Test:** `ssh alton@192.168.1.157 hostname` from the peer should succeed without password prompt.
3. **Clone:** `git clone alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git ~/Sartor-claude-network`
4. **Verify:** `cd ~/Sartor-claude-network && git remote -v` shows `origin` pointing at rtxserver.
5. **First push test:** `touch .peer-test-<hostname> && git add . && git commit -m 'peer onboarding test' && git push origin main`. To verify the GitHub mirror without waiting for the next nightly run, run `powershell.exe -ExecutionPolicy Bypass -File C:\Users\alto8\scripts\sartor-mirror-to-github.ps1` on Rocinante. Then revert.
6. **Document:** add the peer to OPERATING-AGREEMENT signatories list, and to MACHINES.md.

For Aneeta specifically, see [[projects/aneeta-peer-setup]] for the laptop-specific variant (intermittent connectivity expected).

## Operational notes

- **Bare repo size:** ~59 MB as of 2026-05-02. Memory is text; doubling time is years, not months.
- **`receive.denyNonFastForwards` is false** on the bare so peers can force-push their own branches if needed. Treat force-pushing `main` as a near-emergency action — coordinate via peer-comms first.
- **`receive.denyDeletes` is false** so peers can delete branches. Same coordination expectation.
- **No hooks on the bare currently.** A `post-receive` hook to immediately trigger the mirror (instead of waiting for the nightly run) would require the rtxserver→Rocinante SSH path which we don't have yet. Defer; the manual-trigger path covers the rare case.

## Mirror script details

`C:\Users\alto8\scripts\sartor-mirror-to-github.ps1`:

- Fetches `origin/main` from rtxserver bare
- If local `main` is behind: `git merge --ff-only origin/main` — keeps Rocinante's working tree current
- If local `main` is ahead: pushes Rocinante's commits up to origin first (so the mirror is symmetric)
- If diverged: logs WARN and bails — manual reconciliation required
- Pushes `main` to GitHub via HTTPS (NOT `--mirror` — we don't want to clobber claude.ai cloud-agent branches that exist only on GitHub)
- Logs only non-noop runs to `C:\Users\alto8\backups\sartor-mirror.log`

The "don't `--mirror`" choice is deliberate: claude.ai's cloud agents create branches under `refs/remotes/origin/claude/*` that exist only on GitHub. A mirror push would force-delete them. We push only `main`.

## History

- 2026-05-02 (Rocinante Opus 4.7, 1M context): Architecture established. Bare repo seeded from Rocinante via `git push --all && git push --tags` (NOT `--mirror`, which copied Rocinante's local `refs/remotes/*` tracking refs into the bare and required cleanup). Mirror script + scheduled task built and round-trip tested. Per-peer migration deferred — Rocinante is the first and only peer using this topology as of close of 2026-05-02. rtxserver-self peer Claude, gpuserver1 peer Claude, and Aneeta's laptop will be migrated incrementally as each comes online.
