---
type: domain
entity: MACHINES
updated: 2026-04-12
updated_by: Claude (hub-refresher)
last_verified: 2026-04-12
status: active
next_review: 2026-05-12
tags: [entity/infra, domain/gpu]
aliases: [Infrastructure, Hardware]
related: [BUSINESS, PROCEDURES, SELF, MULTI-MACHINE-MEMORY, machines/gpuserver1/MISSION, machines/gpuserver1/CRONS, machines/rocinante/CRONS]
---

# Machines - Computer Inventory

## Key Facts
- Two primary machines: Rocinante (Windows) and gpuserver1 (Ubuntu)
- Both on same LAN (192.168.1.x)
- SSH access between them
- Git push must happen from Rocinante (has credentials); this is mandated by the [[reference/OPERATING-AGREEMENT|Operating Agreement]] — gpuserver1 is inbox-write-only
- gpuserver1 SSH key is NOT added to GitHub (by design — see Operating Agreement)
- Inter-machine memory sync uses the inbox pattern: gpuserver1 writes to `sartor/memory/inbox/gpuserver1/`, Rocinante curator drains nightly. See [[MULTI-MACHINE-MEMORY]].

## Rocinante (Windows Desktop)

**Role:** Primary workstation, git push origin, Chrome automation host

- **OS:** Windows
- **Display:** 3 monitors (2560x1440 primary + 2x 1920x1080)
- **Username:** alton (Windows user), alto8 (profile path)
- **Chrome:** v144 at C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
- **Claude Code:** Installed and active
- **CDP Toolkit:** C:\Users\alto8\chrome-tools\ (cdp-*.ps1 scripts, screenshot, click, type)
- **Chrome Automation Profile:** C:\Users\alto8\chrome-automation-profile\ (CDP port 9223)
- **Git:** Has credentials stored locally, must be used for pushing to GitHub
- **Claude in Chrome:** MCP extension connected via named pipe \.\pipe\claude-mcp-browser-bridge-alton

## gpuserver1 (Ubuntu Server)

**Role:** GPU compute, model training/inference, headless automation, dashboard host, vast.ai rental

- **OS:** Ubuntu 22.04
- **IP:** 192.168.1.100
- **CPU:** i9-14900K (32 threads)
- **GPU:** RTX 5090 (32GB VRAM), NVIDIA driver 570.144
- **RAM:** 128GB
- **Storage:** 1.8TB NVMe — 100GB root (/) + 1.7TB Docker (/var/lib/docker)
- **Python:** 3.10
- **PyTorch:** 2.11.0+cu128
- **Docker:** v29.1.3, NVIDIA Container Toolkit v1.18.1
- **Chrome:** v144 headless, CDP on port 9223 (--no-sandbox --headless=new)
- **Claude Code:** v2.1.33, Max subscription authed, agent teams enabled
- **SSH Key:** ~/.ssh/id_ed25519 (generated, NOT added to GitHub)
- **Git:** Can pull but NOT push (no GitHub credentials)
- **CDP Client:** ~/Sartor-claude-network/.claude/skills/chrome-automation/cdp_client.py

### Vast.ai Hosting
- **Vast.ai account:** alto84@gmail.com (Google OAuth login)
- **Vast.ai console:** https://cloud.vast.ai/host/machines/
- **Machine listing ID:** 52271
- **Kaalia machine ID:** 800a1bf017e653bdadc2fef79457b699c31d5c29279d308ce0f41ba8b15665ff
- **Kaalia daemon:** Runs as `vastai_kaalia` user, heartbeats to 52.90.216.45:7071
- **Docker runtime:** nvidia shim at `/var/lib/vastai_kaalia/latest/kaalia_docker_shim`
- **Host port range:** 40000-40099
- **vastai CLI:** v0.5.0 at `~/.local/bin/vastai`
- **API key:** Configured (name: "gpuserver1"), stored at `~/.config/vastai/vast_api_key`
- **Firewall:** UFW active — allows SSH(22), 40000-40099/tcp (vast.ai), 192.168.1.0/24 (LAN). All else denied.
- **Hairpin NAT:** iptables OUTPUT DNAT rule (100.1.100.63→192.168.1.100) in /etc/ufw/before.rules nat table
- **DOCKER-USER chain:** conntrack --ctorigdstport 40000:40099 rule in /etc/ufw/after.rules (allows Docker-mapped ports)
- **Docker group:** `alton` is in docker group (added 2026-02-23)
- **Pricing:** Base $0.40/hr, MinBid $0.25/hr, end date 2026-08-24. Price raised to $0.35/hr demand / $0.26/hr interruptible 2026-04-11 (25% spread). See [[business/rental-operations]] for pricing rationale and authority rules.
- **Utilization (2026-04-09):** ZERO rentals; earning $0.31/day storage only. This is a persistent pattern requiring pricing review.
- **Reliability:** 99.85%
- **Verification:** VERIFIED (as of 2026-02-26)
- **Self-test:** PASSING (fixed 2026-02-27)
- **Offer ID:** 32099437 (DLPerf 203.2, score 260.3)
- **Payout:** Stripe (configured 2026-02-26 at cloud.vast.ai/earnings/)
- **After reboot:** Kaalia auto-starts. Check listing with `~/.local/bin/vastai show machines`.
- **Port forwarding:** DMZ Host enabled on router → 192.168.1.100 (all ports forwarded, UFW filters on server side)

### gpuserver1 Active Cron Jobs (as of 2026-04-12)

After a 2026-04-12 cleanup that reduced 15 jobs to 5, only these P0/active crons run. See [[machines/gpuserver1/CRONS|gpuserver1 CRONS v0.2]] for full details including the 10 deprecated jobs.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `run_monitor.sh` | every 2 hours | P0: Claude Code health sweep (disk, Docker, vastai, GPU temp) |
| `gather_mirror.sh` | every 4 hours | P0: git pull from Rocinante, vastai status + GPU health snapshot, heartbeat |
| `daily_summary.py` | daily 11:55 PM UTC | P0: power usage summary (UPS metrics) |
| `run_pricing.sh` | Monday 9 AM UTC | P0: weekly vast.ai pricing review, recommends adjustments via inbox |
| `dashboard-healthcheck.sh` | daily 9 AM UTC | health check for safety-research (port 8000) + gpu-dashboard (port 5060) |

**Deprecated 2026-04-12 (no longer running):** `vastai-tend.sh` (replaced by run_monitor.sh), `gateway_cron.py` (JSON parse failures), `memory-sync.sh` (git conflict failures), `heartbeat-watcher.sh` (redundant), `consolidate-mirror/autodream/decay` (memory consolidation is Rocinante-only per Operating Agreement §2).

## Network

- Both machines on same LAN: 192.168.1.x
- SSH from Rocinante to gpuserver1: ssh alton@192.168.1.100
- No VPN required for local access
- **Router:** Verizon Fios at 192.168.1.1 (HTTPS admin, self-signed cert)
- **External IP:** 100.1.100.63
- **DMZ Host:** Enabled, all traffic forwarded to 192.168.1.100 (gpuserver1 UFW handles filtering)
- **UPnP:** Available but mappings don't persist on this router — don't rely on it
- **Router API:** LuCI-based (OpenWrt), save endpoint: `apply_abstract.cgi`, data via Vue.js SPA with Vuex store

For operational procedures on these machines, see [[PROCEDURES]].
Both machines support the [[PROJECTS|active projects]] in this system.
[[SELF|Sartor]] runs across both machines with git-synced memory.

## MERIDIAN Dashboard (Rocinante)
- **URL:** http://localhost:5055
- **Server:** `dashboard/family/server.py` (FastAPI + uvicorn)
- **Features:** Family info, finances, tasks, deadlines, career, costs, Claude terminal, GPU control panel
- **Claude Terminal:** WebSocket /ws/claude, uses Anthropic API with OAuth token from ~/.claude/.credentials.json, Sonnet model, read-only tools (read_file, search_files, list_directory) restricted to Sartor dirs
- **GPU Control:** /api/gpu/status (ping+SSH+service check), /api/gpu/command (predefined SSH commands: check_gpu, uptime, check_memory, check_disk, list_processes, start_dashboard, start_gateway, start_safety)

## Open Questions
- Are there other machines to inventory?
- NAS or shared storage on the network?
- Verify exact symlink state on gpuserver1 for `~/.claude/projects/` → wiki path (Phase 1C liaison flagged as unconfirmed from Rocinante)
- Does `run_pricing.sh` use the inbox pattern to write recommendations? If not, needs migration to `inbox/gpuserver1/pricing/`.

## Related
- [[PROCEDURES]] - How to operate and connect to these machines
- [[PROJECTS]] - Projects running on this hardware
- [[SELF]] - Sartor system that spans these machines

## History
- 2026-02-06: Initial creation
- 2026-02-23: Added vast.ai hosting details, MERIDIAN dashboard section, updated gpuserver1 specs (driver, storage, Docker, Claude auth)
- 2026-02-26: Vast.ai VERIFIED and live. DMZ enabled on router, UFW configured on gpuserver1, Stripe payout configured
- 2026-04-07: Multi-machine memory architecture introduced; inbox pattern, curator drain, Operating Agreement. See [[MULTI-MACHINE-MEMORY]].
- 2026-04-11: run_monitor.sh installed (P0 monitoring, replaces vastai-tend.sh)
- 2026-04-12: Cron cleanup — 15 jobs → 5 active; vastai-tend.sh, gateway_cron.py, memory-sync.sh, heartbeat-watcher.sh, consolidate-mirror all deprecated/disabled. Operating Agreement ratified: gpuserver1 is inbox-write-only, no direct GitHub push. Price raised to $0.35/hr demand. Hub refresh: added last_verified, cron table, inbox pattern, removed resolved "GitHub SSH" open question.

## Consolidated from daily logs (2026-04-05)
- [2026-02-06] (completed) Mandelbulb 3D GPU renderer
- [2026-02-06] (completed) Set up sartor/ directory structure on gpuserver1
- [2026-02-06] (decision) Storage location: ~/Sartor-claude-network/sartor/memory/ on gpuserver1
- [2026-02-06] (decision) Storage location: ~/Sartor-claude-network/sartor/memory/ on gpuserver1
- [2026-02-06] (insight) Having a clear machine inventory prevents confusion about where things run

<!-- curator-drained 2026-04-12T04:35:31+00:00 from gpuserver1 entry=2026-04-07T15-00-00Z-gpuserver1-bootstrap -->
## Inbox entry: 2026-04-07T15-00-00Z-gpuserver1-bootstrap

- Source machine: `gpuserver1`
- Created: 2026-04-07 15:00:00+00:00
- Operation: fact
- Priority: p3
- Drained: 2026-04-12T04:35:31+00:00

gpuserver1 registered in multi-machine memory network:
- Symlinks created from both Claude Code project memory dirs (`~/.claude/projects/-home-alton/memory/` and `~/.claude/projects/-home-alton-Sartor-claude-network/memory/`) to `~/Sartor-claude-network/sartor/memory/`
- Inbox directory at `~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/` is active and ready for curator reconciliation
- Claude Code version 2.1.33 available at /usr/bin/claude
- Operational notes preserved at sartor/memory/reference/gpuserver1-operations.md

<!-- /curator-drained -->

<!-- curator-drained 2026-04-12T04:35:31+00:00 from rocinante entry=ce-1775964663-287ba3e0a7cc -->
## Inbox entry: ce-1775964663-287ba3e0a7cc

- Source machine: `rocinante`
- Created: 2026-04-12T03:31:03+00:00
- Operation: replace
- Priority: p2
- Drained: 2026-04-12T04:35:31+00:00

# Proposed memory: rental_price

- **Category:** `structured_update` / `rental_price`
- **Confidence:** 0.95
- **Dedup status:** `new`
- **Suggested target:** `MACHINES.md`
- **Suggested operation:** `replace`
- **Field:** `gpu_rate` → `$0.35/hr`
- **Entity:** `machine-52271`

## Source quote

> Looks very spikey... Of note, I am increasing the rental price to 0.35 per hour and see how that rents for a few weeks. Profit is profit here... the most important part is that we have revenue to justify the

## Match span

`increasing the rental price to 0.35`

## Session reference

- **session_id:** `6d66075b-10f9-482c`
- **turn_timestamp:** `2026-04-11T23:12:36.381Z`
- **source_file:** `6d66075b-10f9-482c-a62e-9f2828a7ed0d.jsonl`

## Proposed edit

Replace field `gpu_rate` on entity `machine-52271` in `MACHINES.md` with value `$0.35/hr`.

<!-- /curator-drained -->
