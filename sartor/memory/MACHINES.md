# Machines - Computer Inventory
> Last updated: 2026-02-06 by Claude

## Key Facts
- Two primary machines: Rocinante (Windows) and gpuserver1 (Ubuntu)
- Both on same LAN (192.168.1.x)
- SSH access between them
- Git push must happen from Rocinante (has credentials)
- gpuserver1 has SSH key generated but NOT added to GitHub

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
- **Pricing:** Base $0.40/hr, MinBid $0.25/hr, end date 2026-08-24
- **Reliability:** 99.85%
- **Verification:** VERIFIED (as of 2026-02-26)
- **Self-test:** PASSING (fixed 2026-02-27)
- **Offer ID:** 32099437 (DLPerf 203.2, score 260.3)
- **Payout:** Stripe (configured 2026-02-26 at cloud.vast.ai/earnings/)
- **After reboot:** Kaalia auto-starts. Check listing with `~/.local/bin/vastai show machines`.
- **Port forwarding:** DMZ Host enabled on router → 192.168.1.100 (all ports forwarded, UFW filters on server side)

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
- Should we add gpuserver1 SSH key to GitHub for direct push?
- Are there other machines to inventory?
- NAS or shared storage on the network?

## Related
- [[PROCEDURES]] - How to operate and connect to these machines
- [[PROJECTS]] - Projects running on this hardware
- [[SELF]] - Sartor system that spans these machines

## History
- 2026-02-06: Initial creation
- 2026-02-23: Added vast.ai hosting details, MERIDIAN dashboard section, updated gpuserver1 specs (driver, storage, Docker, Claude auth)
- 2026-02-26: Vast.ai VERIFIED and live. DMZ enabled on router, UFW configured on gpuserver1, Stripe payout configured
