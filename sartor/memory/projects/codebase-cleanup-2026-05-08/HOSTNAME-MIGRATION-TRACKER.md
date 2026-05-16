---
type: project-tracker
project: codebase-cleanup-2026-05-08
sub-project: hostname-migration
status: in-progress
created: 2026-05-10
created_by: Claude Opus 4.7 (1M context), tidy-pass session
audience: future Claude or Alton continuing the Tier-2 sweep
related: [reference/MACHINES, machines/REGISTRY.yaml, reference_memory_server, projects/codebase-cleanup-2026-05-08/PLAN]
tags: [project/cleanup, scope/portability, action/track]
---

# Hostname migration tracker

The 2026-05-08 portability audit identified 212 active-code references to `192.168.1.100` (gpuserver1's pre-2026-05-08 IP). The right shape is to address peers by hostname (`gpuserver1`, `rtxserver`, `rocinante`) and let SSH config + hosts file resolve to the live IP. Canonical identity source: `sartor/memory/machines/REGISTRY.yaml`.

This file tracks what's been migrated and what remains.

## Completed (2026-05-10)

- **`CLAUDE.md`** — all 8 stale `192.168.1.100` references migrated to hostname `gpuserver1` (SSH commands) or to the canonical-via-REGISTRY framing (documentation lines). Callout box updated to point at this tracker.
- **`~/.claude/settings.json`** — autoMode allow note already used hostnames (no migration needed).
- **`~/.ssh/config`** (Rocinante) — confirmed mappings: `Host gpuserver1` → 192.168.1.199, `Host rtxserver rtxpro6000server` → 192.168.1.157, `Host rtxserver-bmc` → 192.168.1.154. SSH-by-hostname works from Rocinante out of the box.
- **Tier B — 16 files in `.claude/`** (2026-05-10 follow-on pass): bulk-migrated via Python script. SSH commands (`ssh alton@192.168.1.100` and `ssh -o ... alton@192.168.1.100`) now use hostname `alton@gpuserver1`. Remaining `.100` references in those files (ping commands, HTTP URLs to gpuserver1 services like ollama/safety-research/gateway, iptables DNAT rule documentation, parenthetical "(192.168.1.100)" hints, table cells) updated to current IP `192.168.1.199`. SSH-by-hostname tested working against live machines. Files touched: `.claude/agents/{gpu-ops,gpu-pricing,peer-coordinator,wellness-checker}.md`, `.claude/scheduled-tasks/gpu-utilization-check/SKILL.md`, `.claude/skills/{daily-household-health,gpu-fleet-check,gpu-pricing-optimizer,morning-briefing,network-management,peer-comms,vastai-management,vastai-market-scan,weekly-financial-summary}/SKILL.md`, `.claude/agent-memory/memory-curator/{project_sartor_infrastructure,reference_system_locations}.md`. Zero `.100` references remain in `.claude/`.
- **Tier A active-runtime scripts (2026-05-10 evening pass)**: 5 files migrated to SSH-config hostnames. Single source of truth for peer IPs is now `~/.ssh/config`. Adding a new peer = one new `Host` entry there; no script edits.
  - `scripts/win-tasks/sartor-creds-sync.ps1` — was failing for gpuserver1 since 2026-05-09 (hardcoded `.100` after IP moved to `.199`). Tested; now syncs to both peers.
  - `scripts/win-tasks/push-peer-credentials.sh` — same fix; `PEERS="rtxserver gpuserver1"`.
  - `scripts/rsync-peer-sessions.ps1` — tested live; both peers mirrored cleanly in trial run.
  - `scripts/sartor-vastai-dispatch.ps1` — `$SshTarget` default now `gpuserver1`.
  - `scripts/claude-peer.ps1` — `claude-rtx`/`claude-gpu` functions use hostnames.
  - `scripts/win-tasks/unifi-daily-backup.ps1` — `$rtxHost = "rtxserver"`. UniFi controller URLs intentionally kept at `192.168.1.171` (self-signed cert binding; controller is on Rocinante itself).
- **`scripts/win-tasks/update-hosts-file.ps1`** (2026-05-10 evening): script written but not yet executed. Requires elevation; awaiting either Alton's UAC trigger (`Start-Process -Verb RunAs`) or `gsudo` install. Adds managed `# === SARTOR LAN ===` block with 8 hostnames so Python/HTTP/ping calls can use hostnames too.

## Pending (priority order)

### Tier A — high blast radius, manual review recommended

1. ~~**`dashboard/family/server.py`** — Done 2026-05-13.~~ Introduced two env-overridable constants at the top of the file: `GPUSERVER1_IP` (default `"192.168.1.199"`, used for ping/HTTP/URL paths where the OS resolver is in play) and `GPUSERVER1_SSH_HOST` (default `"gpuserver1"`, used for SSH calls where `~/.ssh/config` handles resolution). All 21 hardcoded `.100` refs migrated. Verified: file parses, FastAPI app imports (with the gitignored `.secrets/meridian-password.txt` stubbed), all 47 routes register, env-var override changes resolved values. Branch `dashboard-hostname-2026-05-13`.
2. ~~**`scripts/win-tasks/*.ps1`** — Done 2026-05-10 evening.~~
3. ~~**`scripts/sartor-vastai-dispatch.ps1`** — Done 2026-05-10 evening.~~
4. ~~**`scripts/rsync-peer-sessions.ps1`** — Done 2026-05-10 evening.~~

### Tier C — memory documentation

8. **`sartor/memory/machines/gpuserver1/CRONS.md`** and related per-machine state — review for hardcoded `.100`. These are documentation; if they reflect a historical state they may be intentional.
9. **`sartor/memory/reference/gpuserver1-*.md`** — multiple files. Some reflect historical state; check whether to convert or leave as-is.
10. **Older `daily/*.md` self-reflections** — references in daily logs are historical record; do NOT migrate (archive-not-collapse).

### Tier D — explicitly out of scope

- `sartor/memory/source-documents/` — gitignored (AZ Compliance pending).
- `sartor/memory/daily/archive/*.md` — historical record.
- `archive/` — frozen historical reference; not active code.

## How to do a clean batch

For Tier B (agents/skills):

```bash
# preview
grep -rln "192.168.1.100" .claude/agents/ .claude/skills/

# spot-edit one
$EDITOR .claude/agents/peer-coordinator.md   # replace 192.168.1.100 → gpuserver1

# bulk for files where the replacement is safe (verify per-file):
# (do not run blindly — review each file's context first)
sed -i 's|192\.168\.1\.100|gpuserver1|g' .claude/agents/<file>.md
```

For Tier A (runtime systems):

1. Introduce a config constant or env var.
2. Migrate refs to it.
3. Test the runtime path before deploying.
4. Commit per file with a short message describing the test.

## Verification

After migration, run from Rocinante:

```bash
# should still resolve
ssh -o ConnectTimeout=5 -o BatchMode=yes alton@gpuserver1 "hostname; uptime"
ssh -o ConnectTimeout=5 -o BatchMode=yes alton@rtxserver "hostname; uptime"

# count remaining .100 in active code (excluding archive, daily, source-documents)
grep -rn "192\.168\.1\.100" --include="*.py" --include="*.md" --include="*.json" --include="*.ps1" --include="*.cmd" --include="*.yaml" --include="*.yml" \
  --exclude-dir=archive --exclude-dir=source-documents --exclude-dir=daily \
  .
```

## Closing

The right end state: peer addresses appear in code only via hostname (`gpuserver1`, etc.) or via REGISTRY.yaml lookup. The IP appears only in REGISTRY.yaml, SSH config, hosts file, and the dashboard's runtime config. Then a clone of this repo on a different machine just needs SSH config + hosts entries (or DNS), and everything else works.
