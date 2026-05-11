---
name: MISSION-vastai-truth-2026-05-04
description: Mission for gpuserver1 peer Claude — provide ground truth on current vastai operational state for Rocinante's vastai-management skill authoring tonight. Read-only verification, write findings to inbox/rocinante.
date: 2026-05-04
from: rocinante (Alton + main session)
to: gpuserver1 peer Claude
priority: tonight
budget_minutes: 30
---

# Mission — provide vast.ai operational ground truth

Rocinante is authoring the canonical `vastai-management` skill + `procedures/vastai-host-onboarding.md` tonight. Your contribution: live ground truth from gpuserver1 so the docs reflect reality, not memory state.

## Context

Alton wants progress without leaving unfinished work for the week. The skill needs to be accurate or it's worse than no skill.

Existing docs Rocinante is using as input:
- `sartor/memory/machines/gpuserver1/MISSION.md`
- `sartor/memory/machines/gpuserver1/CRONS.md`
- `sartor/memory/machines/gpuserver1/HARDWARE.md`
- `sartor/memory/inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` (your self-contained replication dump)

We need to know whether these docs match your current state.

## Read-only verification (do NOT change anything)

Pull latest, then capture the current live state of each thing the docs claim:

```bash
cd ~/Sartor-claude-network && git pull origin main

echo "=== crontab ==="; crontab -l

echo "=== UFW ==="; sudo ufw status verbose

echo "=== iptables nat ==="; sudo iptables -t nat -L -n -v

echo "=== vastai user ==="; ~/.local/bin/vastai show user

echo "=== vastai machines ==="; ~/.local/bin/vastai show machines

echo "=== vastai instances (active rentals) ==="; ~/.local/bin/vastai show instances

echo "=== vastai earnings ==="; ~/.local/bin/vastai show earnings 2>&1 | head -20

echo "=== current contract C.34113802 ==="; ~/.local/bin/vastai show contracts 2>&1 | grep -A 5 "34113802\|reserved" | head -30

echo "=== nvidia-power-cap unit ==="; systemctl is-enabled nvidia-power-cap.service 2>&1; systemctl is-active nvidia-power-cap.service 2>&1; nvidia-smi --query-gpu=power.draw,power.limit,power.max_limit --format=csv,noheader

echo "=== claude-tmux unit ==="; systemctl --user is-enabled claude-tmux.service 2>&1; systemctl --user is-active claude-tmux.service 2>&1

echo "=== docker ==="; docker --version; sudo systemctl is-active docker

echo "=== kaalia ==="; ls -la /var/lib/vastai_kaalia/ 2>&1 | head -10; sudo cat /var/lib/vastai_kaalia/host_port_range 2>&1

echo "=== machine ID + verification status ==="; ~/.local/bin/vastai show machines --raw 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f'  id={m.get(\"id\")} hostname={m.get(\"hostname\")} verified={m.get(\"verified\",\"?\")} reliab={m.get(\"reliability2\",\"?\")} listed={m.get(\"listed_gpu_cost\",\"?\")} listed_min={m.get(\"listed_min_bid\",\"?\")} occup={m.get(\"current_rentals_resident\",0)}') for m in d]" 2>&1
```

## Output

Write a single doc at `sartor/memory/inbox/rocinante/gpuserver1-state-2026-05-04.md` with:

1. Each section's live output (or "missing/disabled" if not applicable)
2. **Drift list:** items where docs say X but reality is Y. Be specific — file:line of the doc, current value, evidence.
3. **Operational notes** that should land in the new vastai-management skill:
   - Anything you regularly do for vast.ai management that's NOT in the docs (e.g., manual checks, alerts you tail, recovery actions you've taken)
   - Quirks of the gpuserver1 setup (Fios DMZ, hairpin NAT origin, port range 40000-40099, etc.)
   - The realized-vs-listed pricing pattern under contract C.34113802 (~$0.20/hr realized vs $0.30 listed)
4. **Recommendations** for the new vastai-management skill — what would have helped you on prior incidents.

Frontmatter: standard `name, description, type: report, date, from: gpuserver1, to: rocinante, related: [machines/gpuserver1/MISSION, ...]`.

## Constraints

- READ-ONLY. Don't modify configs, scripts, crontab, or systemd units.
- Don't restart anything.
- Don't include API key values or other secrets — reference by file path/name.
- If something hits a permission wall (e.g., reading kaalia internals), note it; don't escalate.

## When done

```bash
cd ~/Sartor-claude-network
git add sartor/memory/inbox/rocinante/gpuserver1-state-2026-05-04.md
git commit -m "gpuserver1: live vast.ai state report for skill authoring"
git push origin main
```

Then let Rocinante know via SendMessage or by writing a `DONE-` file. Skill-author subagent waits on you (with timeout — won't block forever).

Phone home (write `inbox/rocinante/PHONE-HOME-gpuserver1-vastai-truth.md`) only on:
- Permission errors that block reading the live state
- Drift severe enough that the docs are dangerous (not just stale)
- Anything that suggests the vast.ai listing is in an unhealthy state RIGHT NOW

Budget: ~30 min wall-clock. Don't pad.
