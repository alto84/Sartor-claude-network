---
name: pihole-placement-2026-05-04
description: Decision sheet + deploy plan for adding Pi-hole DNS filtering to the Sartor home network. Per Alton's 2026-05-04 ask. Phase 3A in the UniFi-takeover deferred plan was VLAN segmentation; Pi-hole was tied to the Kids VLAN. Bringing it forward without VLAN dependency.
type: project
status: awaiting-hardware-decision
created: 2026-05-04
updated: 2026-05-04
related:
  - projects/unifi-takeover-2026-05-01-phase3-hardening-plan
  - reference_home_network
  - .claude/skills/network-management/SKILL.md
tags: [project/active, infra/network, infra/dns, pi-hole]
---

# Pi-hole — placement decision + deploy plan

## TL;DR recommendation

**Buy a Raspberry Pi 4 (4 GB) — $50-60 hardware, $20-25 microSD, total ~$80.** Run Pi-hole on it as a dedicated low-power box. Reasons:

1. **Reliability isolation.** Pi-hole IS DNS. If DNS dies, every household device thinks the internet is broken. Pinning it to dedicated hardware means it doesn't die when Rocinante reboots, when rtxserver crashes (we just had a 14h AC outage), or when gpuserver1's vast.ai workload spikes.
2. **Power: ~3W idle.** Negligible.
3. **Works fine on the existing UPS-less attic outlet** (or wherever you put it).
4. **No vast.ai ToS conflict.** Both gpuserver1 and rtxserver are listed; running non-rental services during paid rental violates the hosting agreement.

Alternative if you don't want new hardware: **Docker on Rocinante** with UniFi DNS configured to point at BOTH Pi-hole AND `1.1.1.1` (Cloudflare) so DNS still resolves when Rocinante is off. Less elegant, but $0.

## Placement options compared

| Where | Pro | Con | Verdict |
|---|---|---|---|
| **Raspberry Pi 4** (recommended) | Dedicated, ~3W, never ties to other boxes' uptime, classic Pi-hole deployment | New hardware ($80 all-in), one more thing to inventory | ✅ Best long-term |
| Docker on Rocinante | Free, no new hardware | DNS dies on Rocinante reboot/sleep — disruptive when you're working at the desk and DNS pauses | ⚠️ OK with `1.1.1.1` fallback |
| Docker on rtxserver | Free, has Docker + spare capacity | vast.ai ToS forbids non-rental use during paid rental; AC reliability concerns | ❌ |
| Docker on gpuserver1 | Free, has Docker + spare capacity | vast.ai ToS, currently rented under reserved contract through 2026-08-24 | ❌ |
| UCG-Pro replacement of Fios | Built-in DNS Shield, replaces Fios → cleaner WAN edge | $380, bigger project, deferred per Phase 3 plan | 🔮 Future, not now |

## Deploy plan — Raspberry Pi 4 path

Once the Pi 4 is in hand:

```bash
# 1. Flash Raspberry Pi OS Lite (64-bit) onto microSD via Raspberry Pi Imager
#    Pre-configure: hostname=pihole, enable SSH, user=alton, set wifi if needed (or keep Ethernet-only)

# 2. Boot, SSH in, set static via DHCP reservation in UniFi
#    Recommend: 192.168.1.53 (the .53 mnemonic for DNS port)

# 3. Install Pi-hole
curl -sSL https://install.pi-hole.net | bash
#    During install: choose 1.1.1.1 + 1.0.0.1 (Cloudflare) as upstream DNS, install web UI.

# 4. Set Pi-hole admin password
sudo pihole -a -p
#    Save in Bitwarden vault as `Pi-hole admin`.

# 5. Add blocklists — recommended starter set:
#    - Default Pi-hole community (auto-loaded)
#    - StevenBlack hosts: https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
#    - OISD light or full: https://big.oisd.nl/
#    Apply: pihole -g

# 6. Whitelist Sartor services that may otherwise get caught:
pihole -w api.anthropic.com claude.ai console.anthropic.com \
            console.vast.ai cloud.vast.ai 500.farm \
            registry-1.docker.io auth.docker.io production.cloudflare.docker.com

# 7. Configure UniFi controller to push Pi-hole as DHCP DNS:
#    Settings → Networks → Default → Advanced → DHCP Name Server: Manual
#    Primary: 192.168.1.53  (Pi-hole)
#    Secondary: 1.1.1.1     (fallback if Pi-hole dies)
#    Force-renew client leases (or wait — typical Fios DHCP lease is 24h)

# 8. Verify resolution:
dig +short google.com @192.168.1.53
dig +short doubleclick.net @192.168.1.53   # should return 0.0.0.0 (blocked)
```

## Deploy plan — Docker-on-Rocinante alternative (no new hardware)

```powershell
# Requires Docker Desktop on Rocinante
docker volume create pihole_etc
docker volume create pihole_dnsmasq

docker run -d --name pihole `
    -e TZ=America/New_York `
    -e WEBPASSWORD=<set via sartor-secret> `
    -e SERVERIP=192.168.1.171 `
    -p 53:53/tcp -p 53:53/udp -p 8053:80 `
    -v pihole_etc:/etc/pihole `
    -v pihole_dnsmasq:/etc/dnsmasq.d `
    --restart unless-stopped `
    pihole/pihole:latest

# UniFi DHCP DNS:
#   Primary: 192.168.1.171  (Rocinante / Pi-hole container)
#   Secondary: 1.1.1.1       (REQUIRED fallback — DNS dies if Rocinante is off)
```

## Post-deploy

- **Update `network-management` skill** — DNS section, Pi-hole admin URL, log paths
- **Vault entry** — `Pi-hole admin` (uses Pi-hole's web UI password)
- **Memory** — `reference_home_network.md` updates with Pi-hole IP + DHCP option 6 config
- **Monitoring** — daily-household-health task (when wired) should ping `dig @<pihole-ip>` to confirm DNS up

## Open question for Alton

**Pick one:**
1. Buy Pi 4 (Amazon delivery 1-2 days, ~$80 total) — recommended
2. Docker on Rocinante now (free, deploy tonight if you want)
3. Defer indefinitely — current state (Fios DNS direct) keeps working

## What I'm NOT doing tonight

- Not buying hardware on your behalf
- Not deploying Docker on Rocinante without your call (it's a critical-path service decision)
- Not modifying UniFi DHCP DNS config until Pi-hole exists somewhere

When you decide, this doc has the exact deploy commands.
