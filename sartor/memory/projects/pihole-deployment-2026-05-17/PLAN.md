---
type: project-plan
project: pihole-deployment-2026-05-17
status: active
frozen: 2026-05-17
related: [./INDEX, ../pihole-placement-2026-05-04]
---

# Plan — Pi-hole deployment (Docker on Rocinante)

Frozen 2026-05-17. Pre-registered acceptance criteria below. Post-hoc changes need a documented amendment.

## Method ladder

The deploy is one coherent change with three coupled artifacts. Phase 4 reviews them together before Phase 7 greenlight.

### Build artifact 1 — Docker deploy script `scripts/deploy-pihole-docker.sh`

A bash script (not run yet) that:

1. Verifies Docker Desktop is running on Rocinante (probe `docker info`).
2. Verifies the host port 53/tcp + 53/udp are free (Windows' default DNS Client service does NOT bind 53; double-check with `Get-NetTCPConnection -LocalPort 53` and `Get-NetUDPEndpoint -LocalPort 53`).
3. Reads the Pi-hole admin password from Bitwarden: `sartor-secret read 'Pi-hole admin'`. If the vault item doesn't exist yet, generate a 20-char one and save it (per the secrets-via-bitwarden hygiene rule #6 — vault FIRST).
4. Creates two Docker volumes: `pihole_etc` and `pihole_dnsmasq`.
5. Runs the pihole/pihole:latest container with:
   - `-p 53:53/tcp -p 53:53/udp` (DNS)
   - `-p 8053:80` (admin UI, on non-standard port to avoid colliding with any other HTTP service Rocinante might bind 80 for)
   - `-e TZ=America/New_York`
   - the container's web-admin pass env var (`WEBPASSWORD`) is supplied via Docker `-e` with the value loaded from the Bitwarden vault at runtime; the literal value never appears in the script source, shell history, or argv (`docker run -e VAR_NAME` with the var pre-set in the calling process's env)
   - `-e DNS1=1.1.1.1 -e DNS2=1.0.0.1`
   - `-e VIRTUAL_HOST=pihole.sartor.lan` (cosmetic)
   - `-e ServerIP=192.168.1.171` (so the admin UI's "block X queries today" widget shows correctly)
   - `--restart unless-stopped` (so reboots auto-recover)
6. Waits for the container's port 53 to start answering (`dig +short google.com @127.0.0.1` returns an answer).
7. Applies the Sartor whitelist (one line per `pihole-FTL` allow entry): anthropic.com, claude.ai, console.anthropic.com, console.vast.ai, cloud.vast.ai, 500.farm, registry-1.docker.io, auth.docker.io, production.cloudflare.docker.com, blackbaud.com, mka.org, goddard.com / brightwheel.com, github.com, githubusercontent.com.
8. Applies extra blocklists: StevenBlack hosts, OISD light.
9. Runs `pihole -g` (gravity update) and prints the resulting blocklist count.

Script accepts `--dry-run` flag that runs steps 1-3 then exits, for review-time validation without firing.

### Build artifact 2 — UniFi DHCP DNS config spec `unifi-dhcp-dns-change.md`

A short markdown doc that lists the exact UniFi controller change (NOT run yet):

- Settings → Networks → Default LAN → DHCP → Name Server: Manual
- Primary: 192.168.1.171 (Pi-hole on Rocinante)
- Secondary: 1.1.1.1 (Cloudflare fallback when Pi-hole is down)
- DHCP lease range: unchanged
- After apply: force renew on all clients OR wait for the 24h lease cycle. Force-renew option preferred for the first hour to validate the change.

The doc includes the rollback command: revert to UniFi controller's prior DNS push (the IP it was using before this change — captured as a screenshot or text export before flipping). Rollback is reachable via UniFi UI or via the controller API.

### Build artifact 3 — `daily-household-health` UniFi probe patch

Modify `.claude/skills/daily-household-health/SKILL.md` to add a step that:

- `curl -k -s -o /dev/null -w '%{http_code}' --max-time 5 https://192.168.1.171:8443/status`
- If response is NOT 200 (or timeout), flag severity yellow ("UniFi controller unreachable")
- Severity yellow already triggers the Google Calendar ping per the existing skill design

Optional secondary probe: `curl -k -s --max-time 5 https://192.168.1.171/api/auth/status` to verify the API layer (not just web server) is healthy.

## Pre-registered acceptance criteria (frozen)

Validation post-deploy runs against these buckets. Every plausible result lands in exactly one.

| Bucket | Definition | Outcome |
|---|---|---|
| **A — clean ship** | All 7 success criteria from INDEX pass; no Sartor service breaks; UniFi probe added to daily-health and runs green; Pi-hole admin UI reachable at http://192.168.1.171:8053; DNS resolves for every household client; DNS query log captures activity within 60s of deploy. | Ship. |
| **B — ship with small patches** | 6/7 success criteria pass; 1-3 whitelist additions discovered (a Sartor service got blocked); easily fixable. | Apply whitelists, re-test, ship. |
| **C — revise** | DNS resolves intermittently OR one Sartor service is hard-blocked (e.g., Anthropic API blocked by an upstream list we can't easily override) OR UniFi DHCP push fails to deliver to clients. | Loop back to Phase 5. |
| **D — fundamental design issue** | Docker-on-Rocinante turns out to fail on this host (port collision, permission issue, network mode incompatibility with Hyper-V bridge) OR Sartor services widely break. | Pause, escalate to Alton, consider Pi 4 hardware path. |
| **E — process violation** | Deployment fired before Phase 7 greenlight. | Halt, document, rollback. |
| **F — security regression** | Pi-hole admin UI exposed beyond LAN; admin password landed in chat / git / log; DNS leak (queries bypassing Pi-hole). | Treat as P0; immediate rollback; investigate. |

## Acceptance test list (8 tests, pre-registered)

Run after deploy, before declaring victory:

1. `docker ps | grep pihole` shows container running with `Up` status.
2. `dig +short google.com @192.168.1.171` returns a valid IP from the LAN.
3. `dig +short doubleclick.net @192.168.1.171` returns `0.0.0.0` (blocked).
4. `dig +short claude.ai @192.168.1.171` returns valid IPs (whitelist working).
5. `dig +short anthropic.com @192.168.1.171` returns valid IPs.
6. `curl -s http://192.168.1.171:8053/admin/` returns 200 (admin UI reachable on LAN).
7. From a different LAN device (e.g., phone on WiFi), DNS resolution still works (UniFi DHCP push effective).
8. `curl -k -s -o /dev/null -w '%{http_code}' https://192.168.1.171:8443/status` returns 200 (UniFi controller live AND `daily-household-health` UniFi probe spec implemented).

Sartor-service smoke test (Alton runs in browser, not automated):
- claude.ai loads
- console.anthropic.com loads
- console.vast.ai loads
- MKA Blackbaud loads
- Chase business banking loads
- GitHub.com loads

## First experiment

Phase 3 builds the three artifacts without firing them. Phase 4 reviews them. The "first experiment" is the actual deploy at Phase 7 greenlight — after that point only.

## Out of scope for this plan

- Per-client Pi-hole groups (kid-vs-adult filtering layer beyond UniFi's MAC block)
- Pi-hole telemetry to memory wiki (DNS queries as input to `personal-data-gather`)
- DoH/DoT (DNS-over-HTTPS / DNS-over-TLS upstream encryption)
- Pi-hole-on-Pi-4 migration
- Pi-hole HA / dual-instance failover
