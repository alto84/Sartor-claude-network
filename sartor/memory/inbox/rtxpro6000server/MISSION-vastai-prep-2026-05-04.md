---
name: MISSION-vastai-prep-2026-05-04
description: Mission for rtxpro6000server peer Claude — verify pre-kaalia readiness and stage everything stageable for the kaalia install moment, so Alton's window of attention next time is minimal. Don't try kaalia install (needs Alton at console).
date: 2026-05-04
from: rocinante (Alton + main session)
to: rtxpro6000server peer Claude
priority: tonight
budget_minutes: 60
---

# Mission — pre-kaalia readiness for vast.ai listing

Rocinante is authoring the canonical `vastai-management` skill + `procedures/vastai-host-onboarding.md` tonight. Your contribution: get rtxserver to "ready for Alton's kaalia-install-moment" so that when he sits down at the console next, the install is truly the only manual step left.

## Context

The rtxserver had an AC-failure crash early Sunday morning May 3 (~04:27 EDT) that took the box down for 14 hours. Alton power-cycled it ~18:34 EDT. You restarted with fresh context (no `--continue`) at boot — that's a separate skill-improvement issue we'll fix later.

The vast.ai onboarding was paused 2026-05-02 at commit `6cee210`. Per `inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md` and `projects/rtxserver-vastai-watch.md`:

- Hardware ready (450W cap, BMC curves) ✅
- Network ready (Fios port-forward 40100-40199, hairpin NAT, UFW) ✅
- vastai CLI + API key in place ✅
- **Kaalia install is the gate** — needs `sudo` password + 2 port-prompt integers. Requires Alton at console.

## What you do tonight (read-only verify + stage-only)

### Step 1 — Pull latest

```bash
cd ~/Sartor-claude-network && git pull origin main
nvidia-smi --query-gpu=power.draw,power.limit --format=csv,noheader
uptime
```

### Step 2 — Verify pre-kaalia state

For each item below, capture live state and confirm or deny the watcher tracker's claim of "RESOLVED".

```bash
echo "=== external IP ==="
curl -s --max-time 5 ifconfig.me; echo
curl -s --max-time 5 api.ipify.org; echo

echo "=== UFW ==="
sudo ufw status verbose | grep -E "40100|40199|^Status"

echo "=== iptables nat (hairpin OUTPUT DNAT) ==="
sudo iptables -t nat -L OUTPUT -n -v | grep -E "100\.1\.100\.63|192.168.1.157"

echo "=== vastai CLI ==="
~/.local/bin/vastai --version
~/.local/bin/vastai show user 2>&1 | head -10

echo "=== API key ==="
ls -la ~/.config/vastai/vast_api_key

echo "=== Docker (kaalia prereq) ==="
docker --version; sudo systemctl is-active docker

echo "=== kaalia status ==="
ls -la /var/lib/vastai_kaalia/ 2>&1 | head -5
ps -ef | grep -i kaalia | grep -v grep
ss -tlnp 2>/dev/null | grep -E "40100|40199" || echo "(no ports listening yet — expected pre-kaalia)"

echo "=== nvidia-power-cap.service ==="
systemctl is-enabled nvidia-power-cap.service 2>&1
systemctl is-active nvidia-power-cap.service 2>&1
```

### Step 3 — Stage the cron suite (don't install)

Per gpuserver1's onboarding dump at `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` (commit fd80cc3), there are 4 scripts to land:

- `gather_mirror.sh` — every 4h
- `stale-detect.sh` — hourly
- `vastai-tend.sh` — every 30 min
- `docker-weekly-prune.sh` — Sunday 4 AM

Do NOT install via crontab yet (cron entries need rtxserver's machine_id which doesn't exist until kaalia is installed). Just:

1. Copy / adapt the 4 scripts from gpuserver1's reference into `~/cron-scripts-staged/`
2. Edit the MACHINE_ID variable in each script to a placeholder `RTXSERVER_MACHINE_ID_TBD` so the post-kaalia step knows where to fill in
3. Edit any inbox path templates from `inbox/gpuserver1/` to `inbox/rtxpro6000server/`
4. Test each script with `bash -n` (syntax check, no execution)
5. Document the staged state in your readiness report (Step 5 below)

If you already did this earlier (per the watcher tracker mention of `~/cron-scripts-staged/`), just verify the files are there, contents are current, and move on.

### Step 4 — Verify systemd nvidia-power-cap.service

This was supposedly applied by you earlier today (commit `624c8d8` per memory MEMORY.md). Confirm:

```bash
cat /etc/systemd/system/nvidia-power-cap.service 2>&1
sudo systemctl status nvidia-power-cap.service --no-pager
nvidia-smi --query-gpu=power.draw,power.limit --format=csv,noheader
# expect power.limit = 450W per card
```

If missing, install (it's stage-able without kaalia):
- Source: `sartor/memory/machines/rtxpro6000server/onboarding-staged/nvidia-power-cap.service` if present, else use the watcher-tracker's spec
- Install: `sudo install -m 644 -o root -g root <source> /etc/systemd/system/nvidia-power-cap.service && sudo systemctl daemon-reload && sudo systemctl enable --now nvidia-power-cap.service`

If you don't have sudo cached and the install would prompt, leave it staged at `~/cron-scripts-staged/nvidia-power-cap.service` and note in your report.

### Step 5 — Write readiness report

`inbox/rocinante/rtxserver-pre-kaalia-2026-05-04.md` — checklist of state, with:

- One row per pre-kaalia item: status (✅/⏳/❌), evidence (live command output trimmed), notes
- One section: "What Alton needs to do at console" — reduced to the smallest possible set (basically just the `sudo python3 /tmp/vast_host_installer.py ...` line + answering the port prompts)
- One section: "What auto-completes after kaalia" — the post-install steps that can run via tmux send-keys from Rocinante (poll for machine ID, wait for benchmark warm-up, self-test, list, verify)
- Frontmatter: `name, description, type: status, date, from: rtxpro6000server, to: rocinante, related: [projects/rtxserver-vastai-watch, inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02]`

### Step 6 — Commit + push

```bash
cd ~/Sartor-claude-network
git add sartor/memory/inbox/rocinante/rtxserver-pre-kaalia-2026-05-04.md
git commit -m "rtxserver: pre-kaalia readiness report for skill authoring"
git push origin main
```

Then SendMessage to Rocinante or write a `DONE-vastai-prep` marker.

## DO NOT

- Run `sudo python3 /tmp/vast_host_installer.py` (kaalia install — needs Alton's password + interactive port prompts)
- Run `vastai list machine` (gated on kaalia having registered a machine_id)
- Run `vastai test` / `vastai self-test machine` (gated on kaalia)
- Modify the existing `RESUME-vastai-onboarding-2026-05-02.md` doc — write a new dated report instead
- Touch the BMC fan curves or power-cap (they're correct as-is)

## Phone-home triggers

Write `inbox/rocinante/PHONE-HOME-rtxserver-pre-kaalia.md` and stop if:

- Network state has regressed (port-forward gone, hairpin NAT missing, UFW closed)
- vastai CLI auth is broken (`show user` errors or 401)
- Anything looks like rtxserver is in a worse state than memory claimed
- Hardware (GPU, thermal, RAM) shows degradation post-AC-failure

Budget: ~60 min wall-clock. Don't pad. Phone home if you hit something Rocinante should know about.
