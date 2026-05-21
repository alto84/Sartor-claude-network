# IP-reassignment resistance — design + implementation plan

**Authored:** 2026-05-20 (post-fuseblow incident)
**Status:** Design landed; manual-step + code-step laid out; execution pending Alton's first DHCP-reservation pass.

## Problem statement

Every Sartor outage produces an IP shuffle:

- 2026-05-09: gpuserver1 moved .100 → .199 after a wall-switch move
- 2026-05-19: gpuserver1 rolled .199 → .100; Rocinante shifted .171 → .169; rtxserver retained .157 but BMC primary needed reset
- Each shuffle leaves ~20 stale references in the codebase (skills, agents, dashboards, scripts) plus broken SSH config plus broken scheduled tasks

Two structural problems:

1. **DHCP is the source.** Fios CR1000A hands out IPs by lease availability. After a power event the leases shuffle. No mechanical reason a host should land on a particular IP.
2. **Codebase has IP literals scattered across docs, agents, skills, scripts, configs.** Even with REGISTRY.yaml as canonical, downstream consumers don't read it dynamically — they have their own hardcoded copies.

## Design: four-layer defense

### Layer 1 — Prevention at L2 (the single highest-leverage fix)

**Static DHCP reservations on the Fios CR1000A.** Bind MAC → IP at the DHCP server. Removes drift at source. Everything downstream gets to assume the IP is stable.

Reservations to set:

| Host | MAC | Pin to IP |
|---|---|---|
| rtxserver host NIC | `30:c5:99:d5:8f:b5` | 192.168.1.157 |
| rtxserver BMC primary (dedicated MGMT) | `30:c5:99:d5:8f:b7` | 192.168.1.154 |
| rtxserver BMC secondary (Shared LAN) | `30:c5:99:d5:8f:b8` | 192.168.1.156 |
| gpuserver1 | `bc:fc:e7:d9:08:eb` | 192.168.1.100 |
| Rocinante Ethernet (defer; currently dual-homed) | `2C:F0:5D:39:21:7F` | 192.168.1.171 (restore original) |

Rocinante is currently on Wi-Fi at .169 after the fuseblow. The Wi-Fi NIC has its own MAC. Pinning the Ethernet MAC to .171 restores the original arrangement once Ethernet comes back to a live switch port. Leave Wi-Fi unreserved for now.

#### Manual procedure (Alton, ~5 minutes)

1. Open Chrome to `https://192.168.1.1`
2. Log in as `admin` (password in 1Password / Bitwarden as "Fios router admin" or similar)
3. Settings → LAN → DHCP / IP Address Distribution → Static IP / Reservations (exact path varies by Fios firmware — the CR1000A SPA is Vue-based; look for "Static IP" or "Reservation")
4. For each host above: enter MAC + pin IP + label, save
5. Save+reboot DHCP if prompted (rarely needed; most Fios models apply immediately)

Verification: `ipconfig /release Ethernet && ipconfig /renew Ethernet` on Rocinante should yield .171; equivalent `sudo dhclient -r eno1 && sudo dhclient eno1` on Linux peers should yield their pinned IPs.

### Layer 2 — REGISTRY.yaml as single source of truth

Already in place. File header documents: hostname / MAC / current_ip / role / bmc_ip / switch_port / vast_ai_machine_id / last_verified / last_drift / flagged. Drift detector cron reads it.

**Change needed:** REGISTRY entries that are pinned via DHCP reservation should be flagged `ip_assignment: static-reservation` (currently `dhcp`) so future automation knows the value is intentionally fixed. Update after Layer 1 is done.

### Layer 3 — Auto-generated configs from REGISTRY

Downstream configs should READ REGISTRY at update time, not maintain their own copies. Replace hardcoded hashes with YAML parsing.

#### 3a. `update-hosts-file.ps1` refactor (Rocinante, code change)

**Today:** maintains its own ordered hash of `hostname = IP`, runs nightly via scheduled task.

**Target:** read `sartor/memory/machines/REGISTRY.yaml` directly, write the managed block in `C:\Windows\System32\drivers\etc\hosts`. Includes BMC aliases.

YAML parsing in PowerShell needs the `powershell-yaml` module (`Install-Module powershell-yaml -Scope CurrentUser`), or fall back to a regex parse since REGISTRY's structure is simple. Regex is more robust — no extra module dependency.

Estimated effort: ~30 lines of PowerShell. Idempotent (managed-block delimiters already in place).

#### 3b. New: `update-ssh-config.ps1` (Rocinante, new script)

**Today:** `C:\Users\alto8\.ssh\config` is hand-maintained. Each outage we hand-edit it.

**Target:** same pattern as update-hosts-file — read REGISTRY, rewrite a managed block in `~/.ssh/config` delimited by `# === SARTOR HOSTS ===` / `# === END SARTOR HOSTS ===`. Run on a schedule (every 4h or after drift detector flags a change).

Pattern:
```
# === SARTOR HOSTS ===
Host gpuserver1
    HostName 192.168.1.100
    User alton
Host rtxserver rtxpro6000server
    HostName 192.168.1.157
    User alton
Host rocinante
    HostName 192.168.1.171
    User alton
Host rtxserver-bmc rtxserver-bmc-primary
    HostName 192.168.1.154
Host rtxserver-bmc-secondary
    HostName 192.168.1.156
Host unifi-switch
    HostName 192.168.1.170
Host fios-gateway
    HostName 192.168.1.1
# === END SARTOR HOSTS ===
```

#### 3c. Linux peer hosts file

Peer machines (gpuserver1, rtxserver) maintain `/etc/hosts` references too. Add a cron-driven equivalent of update-hosts-file.ps1 that runs from a checked-in script in the repo (e.g., `scripts/peer/update-etc-hosts.sh`), reads REGISTRY (pinned at the git tree), writes a managed block in `/etc/hosts`. Run every 4h.

### Layer 4 — Drift detection

**Today:** `Sartor Registry Drift Check` scheduled task runs every 4h. Per the audit subagent: it's firing on schedule but **isn't actually catching the IP drift** that happened tonight.

**Investigation needed:** what does it currently check? Likely just file syntax or content presence, not actual ARP-state vs declared-state comparison. Need to fix it to:
1. For each REGISTRY entry, ARP-lookup the MAC's current IP
2. Compare to REGISTRY's `current_ip`
3. If different: write inbox alert, update `last_drift`, optionally email/calendar-ping

Defer to a follow-up; not tonight.

## Implementation order

| Phase | Step | Owner | Effort |
|---|---|---|---|
| 1 | DHCP reservations in Fios CR1000A | Alton (manual UI) | 5 min |
| 2 | Update REGISTRY `ip_assignment` to `static-reservation` for pinned hosts | Me | 5 min |
| 3 | Refactor update-hosts-file.ps1 to read REGISTRY | Me | 30 min |
| 4 | Create update-ssh-config.ps1 | Me | 30 min |
| 5 | Peer-side /etc/hosts updater | Me | 45 min |
| 6 | Fix registry-drift-check to actually compare ARP state | Me + subagent | 1-2 hours |

Phases 1-2 close most of the value. Phase 3-6 are polish for the long term.

## What this changes about future outages

Before:
- Outage → IPs shuffle → 20+ codebase refs broken → multi-hour cleanup sweep
- Each Claude session has to re-discover the truth

After:
- Outage → DHCP serves the reserved IPs → IPs don't shuffle
- Downstream configs (hosts file, ssh config, peer hosts) auto-regenerate from REGISTRY on a 4h cadence
- Drift detector catches the rare case where MAC moved + new IP needed, files inbox alert immediately
- Repo doc references that mention a literal IP still drift over time, but they're now decoupled from operational state — wrong-doc-but-right-system

## Open follow-ups (not blocking)

- **Bonjour/mDNS** as a fallback: `rtxserver.local` resolution on Linux peers (Avahi already installed; not enabled). Less robust than static reservations + REGISTRY-driven hosts file, but a useful belt-and-suspenders.
- **What about Aneeta's devices, kids' iPads, Sonos, Nest devices?** Out of scope. Those don't have hard dependencies in the Sartor codebase; DHCP-shuffle is harmless for them.
- **What about cloud-side DNS?** Solar Inference LLC's domain (if any) and Sante Total's domain — out of scope; those are public-DNS, not LAN.

## Cross-references

- [`sartor/memory/machines/REGISTRY.yaml`](../machines/REGISTRY.yaml) — single source of truth
- [`scripts/win-tasks/update-hosts-file.ps1`](../../../scripts/win-tasks/update-hosts-file.ps1) — Layer 3a target
- [`sartor/memory/reference_home_network.md`](../reference_home_network.md) — network topology
- [`.claude/skills/network-management/SKILL.md`](../../../.claude/skills/network-management/SKILL.md) — UniFi controller ops
- [`sartor/memory/projects/codebase-cleanup-2026-05-08/HOSTNAME-MIGRATION-TRACKER.md`](../codebase-cleanup-2026-05-08/HOSTNAME-MIGRATION-TRACKER.md) — broader codebase IP-literal sweep
