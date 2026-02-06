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

**Role:** GPU compute, model training/inference, headless automation, dashboard host

- **OS:** Ubuntu 22.04
- **IP:** 192.168.1.100
- **CPU:** i9-14900K (32 threads)
- **GPU:** RTX 5090 (32GB VRAM)
- **RAM:** 128GB
- **Python:** 3.10
- **PyTorch:** 2.11.0+cu128
- **Chrome:** v144 headless, CDP on port 9223 (--no-sandbox --headless=new)
- **Claude Code:** v2.1.33, agent teams enabled
- **SSH Key:** ~/.ssh/id_ed25519 (generated, NOT added to GitHub)
- **Git:** Can pull but NOT push (no GitHub credentials)
- **CDP Client:** ~/Sartor-claude-network/.claude/skills/chrome-automation/cdp_client.py

## Network

- Both machines on same LAN: 192.168.1.x
- SSH from Rocinante to gpuserver1: ssh alton@192.168.1.100
- No VPN required for local access

For operational procedures on these machines, see [[PROCEDURES]].
Both machines support the [[PROJECTS|active projects]] in this system.
[[SELF|Sartor]] runs across both machines with git-synced memory.

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
