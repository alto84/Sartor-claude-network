---
name: passoff-gpuserver1-001
description: Self-stewardship setup packet for gpuserver1. Implement the per-machine STATE/JOURNAL/HARDWARE files + cron + per-machine CLAUDE.md fragment + identify the LED zone serving the MSI Coreliquid A13 cooler, all on the box itself, all committed locally for Rocinante to drain. Respect the 6-cron hard cap and the active vast.ai rental.
type: passoff-packet
target_machine: gpuserver1
target_session: claude-team-1
status: ready-for-pickup
date: 2026-04-24
updated: 2026-04-24
updated_by: rocinante-orchestrator
volatility: low
tags: [meta/passoff, machine/gpuserver1, household/governance]
related: [research/persona-engineering/INDEX, projects/machine-self-stewardship, machines/gpuserver1/INDEX, machines/gpuserver1/HARDWARE]
---

# Pass-off packet — gpuserver1 self-stewardship + LED zone identification

## Who you are

You are the Claude Code session running on `gpuserver1` (Ubuntu 22.04, Intel i9-14900K, RTX 5090, 128 GB DDR5, ASUS Z790 GAMING WIFI7, MSI MAG Coreliquid A13 240 White AIO with motherboard-ARGB-daisychained LEDs). You are a peer machine in the Sartor household — see Constitution §14 (especially §14a/§14b/§14c-proposed). The local Claude pattern is: you build situated memory of this machine, future sessions inherit it, work compounds.

The Constitution lives at `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md`.

## First actions (sequential)

1. `cd ~/Sartor-claude-network && git pull --rebase origin main` to get the latest research/agents/feedback. If the working tree is dirty from prior auto-commits, `git stash -u && git pull --rebase && git stash drop`.
2. Read in order:
   - `sartor/memory/feedback/awareness-as-duty.md` (auto-injected; you should see it already in your feedback context)
   - `sartor/memory/projects/machine-self-stewardship.md` (the program)
   - `.claude/agents/self-steward.md` (your role; treat the agent definition as your own behavior spec when running self-steward duty)
   - `sartor/memory/machines/gpuserver1/MISSION.md` (your role on this box)
   - `sartor/memory/machines/gpuserver1/INDEX.md` + `HARDWARE.md` + `CRONS.md` (your existing context)
   - `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` §14, §14a, §14b (you should read it cold once even if you've read it before — this session you're acting on it directly)

Confirm via inbox phone-home that you've completed first-actions before doing real work.

## Work queue

### A. Per-machine CLAUDE.md fragment (your `~/.claude/CLAUDE.md`)

Per the project plan and Alton's 2026-04-24 instruction, each peer machine has its own `~/.claude/CLAUDE.md` that adds a **machine-specific bootstrap fragment** to the shared project CLAUDE.md context. This file is machine-local (not in the shared repo); it lives in the user-scoped Claude Code config.

Write to `/home/alton/.claude/CLAUDE.md` (create if missing):

```markdown
# gpuserver1 — local session bootstrap

You are running on gpuserver1 (192.168.1.100). This is a peer machine in the Sartor household.

Before doing anything else this session:

1. Read `sartor/memory/machines/gpuserver1/MISSION.md` — your role.
2. Read `sartor/memory/machines/gpuserver1/STATE.md` — current state of this box (last updated by self-steward; check timestamp).
3. Skim the last ~10 entries of `sartor/memory/machines/gpuserver1/JOURNAL.md` — recent surprises and decisions.
4. Read `sartor/memory/machines/gpuserver1/HARDWARE.md` — bill of materials and cooler/LED specifics.

You have a self-steward cron running every 6h (see CRONS.md §5) that updates STATE.md and appends JOURNAL.md. You may also update STATE.md directly when you observe drift in-session, and append to JOURNAL.md anytime you notice something worth recording.

You MAY NOT silently overlook unfamiliar state — investigate or escalate per Constitution §14c (proposed).

Household-shared facts go through `sartor/memory/inbox/gpuserver1/` for the curator on Rocinante to drain. Local-only facts (machine quirks, hardware specifics) go directly to `sartor/memory/machines/gpuserver1/`.

You cannot push to GitHub from this machine. Commit locally; Rocinante drains.
```

Keep it short. The full project CLAUDE.md at the repo root (which is auto-injected since you're working out of `~/Sartor-claude-network`) carries the rest.

### B. Initial inventory + STATE.md baseline

Run a full self-steward inventory once, manually, to produce the baseline:

```bash
HOST=$(hostname)  # gpuserver1
ROOT=$HOME/Sartor-claude-network
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
```

Gather:
- Identity (hostname, uname, uptime, primary user, working dir, timestamp)
- Hardware (`nvidia-smi --query-gpu=index,name,driver_version,temperature.gpu,memory.total --format=csv,noheader`, `lscpu | head`, `/proc/meminfo` total)
- Storage (`df -h /` and `df -h /home` if separate; `smartctl -H` if available)
- Network (primary interface IP, default gateway, ping `192.168.1.1` once)
- Services (`systemctl list-units --type=service --state=running --no-legend | head -30`)
- Scheduled tasks (`crontab -l` and `systemctl list-timers --no-legend | head -10` — and verify each task documented in CRONS.md is present; flag any drift)
- vast.ai rental state (`~/.local/bin/vastai show machines` and `show instances`; record reliability score + occupancy + advertised rate)
- Recent errors (`journalctl --priority=err --since="-24 hours" --no-pager | tail -30` — for the baseline use 24h not 6h since this is the first run)

Write the result to `sartor/memory/machines/gpuserver1/STATE.md` per the template at `sartor/memory/machines/_TEMPLATE/STATE.md`. Replace placeholders with actual values.

### C. JOURNAL.md baseline

Create `sartor/memory/machines/gpuserver1/JOURNAL.md` from `sartor/memory/machines/_TEMPLATE/JOURNAL.md`. Add a single first entry recording the baseline:

```
## YYYY-MM-DDTHH:MM:SSZ — surprise — self-steward initialized

First self-steward run on gpuserver1 per the 2026-04-24 machine-self-stewardship integration. Baseline STATE.md captured. Subsequent runs will diff against this baseline. Anomalies in the baseline (if any): <list>.
```

### D. Cron registration — within the 6-cron hard cap

`machines/gpuserver1/CRONS.md` lists 5 active jobs (the rgb_status.py was the 4th doc but the audit found it as 5th in `crontab -l`). The hard cap from EX-5 is **6**. The self-steward becomes the 6th — that uses the last slot. Document it in CRONS.md as a NEW entry with proper provenance.

Write the cron script:

Path: `/home/alton/sartor-self-steward/self-steward.sh` (mirror the `~/sartor-rgb/` pattern — own directory with README, log dir, the script).

Behavior (you implement):
- Acquire `~/.self-steward.lock` (exit if exists with a stale-detection check >1h)
- Run inventory (same gathering as the manual baseline)
- Diff against the previous `STATE.md` per the self-steward agent's severity rules
- Overwrite STATE.md, append surprises to JOURNAL.md, file inbox proposals as needed
- Append a one-line heartbeat to `machines/gpuserver1/INDEX.md` for the wellness-checker to detect
- `git add` + `git commit` (no push)
- Release lock

Schedule: `0 */6 * * *` (every 6 hours on the hour). Cadence per machine-self-stewardship project plan.

Add to crontab. Document in CRONS.md §5 as the new entry. Update the §0 "currently 5 active jobs" line to 6.

### E. LED zone identification — which zones drive the cooler

The MSI MAG Coreliquid A13's ARGB is daisy-chained off the motherboard's ARGB header. The ASUS Z790 GAMING WIFI7 has multiple ARGB headers (typical: front panel, JRGB1, JARGB1, JARGB2, possibly an AIO/pump header). OpenRGB enumerates the motherboard as device index 0 with multiple zones.

Investigation:

1. `sudo openrgb --list-devices` to confirm device count + indices
2. `sudo openrgb -d 0 --list-zones` (or equivalent — check `--help` if syntax differs in 0.9.0) to enumerate motherboard zones individually
3. Optionally test by setting one zone at a time to a distinct color and noting which physical LED responds:
   ```bash
   for zone in 0 1 2 3 4 5; do
     sudo openrgb -d 0 -z $zone -m static -c FF00FF
     echo "Zone $zone now magenta. Press Enter when you've noted which LEDs changed:"
     read
     sudo openrgb -d 0 -z $zone -m static -c 000000
   done
   ```
   ⚠️ This needs human eyeballs to map zone → physical LED. If Alton isn't watching the box, capture which zones EXIST and which currently have non-zero output (inspectable via OpenRGB), and document the structure with a TODO for Alton to do the visual mapping later.

4. Document findings in `machines/gpuserver1/HARDWARE.md` under "Motherboard zones" — replace the placeholder list with the actual zones.

5. **Stretch goal** if zones are clearly identifiable: extend `~/sartor-rgb/bin/rgb_status.py` to give the cooler its own color mapping distinct from other motherboard zones. Suggested mapping for the cooler specifically (since it's the most visible LED on the box):
   - rented_active: bright green (current)
   - rented_idle: dim green (current)
   - training_in_progress: purple
   - host_steward_alert: red flash
   
   Don't ship the extension as-is — file an inbox proposal in `inbox/rocinante/` and let Alton review the proposed color semantics before changing the live cron.

### F. Phone home

Write `sartor/memory/inbox/rocinante/<TS>_passoff-gpuserver1-001-<trigger>.md` at these triggers:

- `first-actions-done` — after reading the prerequisite docs, before real work
- `inventory-done` — after baseline STATE.md is written
- `cron-installed` — after the self-steward cron is registered (include the cron line + path + first manual run output)
- `led-zones-mapped` — after zone enumeration + (where possible) physical mapping
- `done` — packet complete; include a short summary of all artifacts created

Use the format documented in `.claude/agents/peer-coordinator.md` § "Phone-home". Each phone-home is `git add` + `git commit` (no push — Rocinante pulls).

## Things you do not do

- **Do not push to GitHub.** Commit locally; Rocinante drains.
- **Do not run gpu-burn or any GPU-stress workload.** The active vast.ai reserved rental owns GPU exclusivity through 2026-08-24.
- **Do not modify rental container state.** You touch host resources only.
- **Do not edit `.claude/agents/`, `.claude/skills/`, or `.claude/commands/`.** Those are Rocinante-canonical. The `~/.claude/CLAUDE.md` (user-scope) IS yours to edit, but the in-repo `.claude/` is not.
- **Do not delete unfamiliar files or processes.** Per Constitution §14c: investigation, not deletion. If you find unfamiliar state, document and ask.
- **Do not exceed 6 active cron jobs.** That's the EX-5 hard cap. Self-steward is the 6th and final slot.

## Stop conditions

- Total wall-clock budget: 90 minutes. If you can't complete in 90 min, phone home with `partial` and pause.
- Token budget: 80K. Stop spawning sub-work at 65K.
- If LED zone visual mapping requires Alton's eyeballs, document the structure (zones present + current outputs) and file an inbox proposal asking him to do the mapping when convenient. Don't block on it.

## Outcome

When complete, the household has:

1. `~/.claude/CLAUDE.md` on gpuserver1 — per-machine bootstrap fragment that auto-loads on session start
2. `sartor/memory/machines/gpuserver1/STATE.md` — initial inventory baseline
3. `sartor/memory/machines/gpuserver1/JOURNAL.md` — initialized with the baseline entry
4. `/home/alton/sartor-self-steward/` — the cron script + companion files
5. Cron registered: `0 */6 * * *` self-steward.sh
6. CRONS.md updated to v0.5 reflecting the 6th cron entry
7. HARDWARE.md updated with actual motherboard zones (or TODO for Alton-eyes)
8. (Optional stretch) Inbox proposal for cooler-specific color semantics in rgb_status.py
9. Phone-home trail in `inbox/rocinante/` for Rocinante to drain

## Signoff

Rocinante Opus 4.7 — 2026-04-24. Ready for pickup.
