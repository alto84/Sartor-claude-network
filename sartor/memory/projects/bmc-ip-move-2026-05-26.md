---
type: project
date: 2026-05-26
status: in-progress
tags: [domain/infrastructure, project/bmc-move, machine/rtxserver]
---

# BMC primary IP move: .154 → .150

**Why:** Vayu's MSI laptop (`04:7c:16:aa:7d:dd`) keeps grabbing `192.168.1.154` from Fios DHCP, conflicting with rtxserver BMC primary at the same IP. Causes ARP flapping → Warframe peer-session kicks. Yesterday's tactical `ipconfig /release/renew` was kicked-can; today same conflict returned because Fios has no DHCP reservation for the BMC's MAC.

**Resolution chosen:** Move the BMC off `.154` (resolve from the OTHER side; doesn't require touching Vayu's laptop). Then add the Fios reservation so the new IP sticks.

## Phases

### Phase A — Move BMC primary to .150 ✓ pending

1. SSH to `alton@192.168.1.157` (rtxserver)
2. `sudo ipmitool lan set 1 ipaddr 192.168.1.150` (channel 1 = dedicated MGMT eth0)
3. `sudo ipmitool lan set 1 ipsrc static` (lock to static; DHCP source would race with reservation)
4. `sudo ipmitool lan print 1 | grep "IP Address"` — verify new IP
5. Ping `.150` from Rocinante — confirm reachable
6. Ping `.154` from Rocinante — should now ONLY reach Vayu's laptop (BMC vacated)
7. `arping -c 3 -U -I eno1 192.168.1.150` from rtxserver — gratuitous ARP to clear LAN caches

### Phase B — Codebase sweep .154 → .150 ✓ pending

Files to update (`bmc_ip` references, NOT `bmc_secondary_ip`/`.156`):
- `sartor/memory/machines/REGISTRY.yaml` — `bmc_ip: "192.168.1.154"` → `.150`
- `CLAUDE.md` — any references to BMC at .154
- `.claude/skills/rtxserver-management/SKILL.md` — multiple refs in the BMC section
- `dashboard/overview/network-state-2026-05-22.html` — BMC card
- `sartor/memory/wifi/network-dashboard.html` — port_table descriptions

Commit + push to rtxserver bare.

### Phase C — Rental health verification ✓ pending

The BMC change is out-of-band — should NOT affect the vast.ai rental. But verify:
- `vastai show machines` from gpuserver1 — machine 124192 still `verified`, `listed`, no `error_description`
- `docker ps` on rtxserver — `C.37359460` (vLLM) still Up
- `nvidia-smi` on rtxserver — GPUs at expected power state
- Listing visibility check from gpuserver1: `vastai search offers "machine_id=124192 verified=true rentable=true"`

### Phase D — Fios DHCP reservation (permanent fix)

Via Chrome MCP into Fios CR1000A admin at `http://192.168.1.1`:
- Add reservation: MAC `30:c5:99:d5:8f:b7` → IP `192.168.1.150`
- Also worth adding while there: MAC `bc:fc:e7:d9:08:eb` (gpuserver1) → `.100`, MAC `30:c5:99:d5:8f:b5` (rtxserver) → `.157`, MAC `30:c5:99:d5:8f:b8` (BMC secondary) → `.156`

This closes the IP-resistance design's Phase 1 (from 2026-05-20 design doc).

### Phase E — Final commit + clean status report

Summary doc + git push + verify all systems green.

## Resume protocol after compaction

If a post-compaction Claude reads this:
- Check most-recent commit on `main` — if it includes "bmc-ip-move", we're partway through
- Read this file's "Status updates" section below for last completed step
- Verify current state via `ssh alton@192.168.1.157 'sudo ipmitool lan print 1 | grep "IP Address"'`
- Resume at next-unchecked phase

## Status updates (append as we go)

- 2026-05-26 start: plan written, beginning Phase A
