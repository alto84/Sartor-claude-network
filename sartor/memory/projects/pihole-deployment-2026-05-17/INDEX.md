---
type: project
entity: pihole-deployment
status: phase-0-frame
created: 2026-05-17
created_by: Claude Opus 4.7 + Alton (orchestrator pair)
tags: [project/dashboard, scope/family, status/active, priority/p1, domain/infrastructure, domain/network, infra/dns]
related: [projects/pihole-placement-2026-05-04, reference/HOUSEHOLD-CONSTITUTION, family/active-todos, family/CLAUDE, network-management, daily-household-health]
---

# Pi-hole deployment — Frame

## Trigger

This morning, Alton asked whether the LG TV in the family room was being watched between 6 AM and 8 AM. The answer was: **we have no record.** The infrastructure that would have answered that question is in two states of unavailability:

1. **UniFi controller** (DNS / DPI / per-client traffic log source) crashed silently at ~00:58 on 2026-05-13 — 4 days of zero traffic capture. No alert fired because `daily-household-health` doesn't probe the controller.
2. **Pi-hole** (DNS-query record source) was framed in the 2026-05-04 placement doc but stayed at `awaiting-hardware-decision`. Nothing deployed.

Alton's directive: restart UniFi (done — controller back up at 192.168.1.171:8443) AND deploy Pi-hole, using `/complex-project` to do it right. This Frame doc is Phase 0 of that loop.

## Frame

Pi-hole gives the household two things the current setup lacks:

1. **DNS-query records per client** — the audit-trail layer that answers questions like "was the LG TV streaming this morning?" without needing the heavier UniFi DPI pipeline. Every device's outbound DNS lookup gets logged with timestamp + client IP. Streaming services have distinctive query patterns (Netflix's `nrdp.nflxext.com`, YouTube's `r*-sn-*.googlevideo.com`, etc.) that make "was this client watching video" a queryable fact.

2. **Ad / tracker / known-malicious-domain blocking** — collateral household-level protection for four account holders with different device categories (Vayu/Vishala on personal + school laptops, Aneeta on phone + work, Alton on phone + multiple machines). Blocklist-driven, easy to whitelist Sartor dependencies (anthropic.com, vast.ai, claude.ai, MKA portals, Goddard portals, brokerage sites, etc.).

The 2026-05-04 placement doc is the conceptual frame (verbatim). This deployment adds:

- **Decision frozen:** Docker-on-Rocinante (option 2 in the placement doc). Reason: fastest to deploy (~30 min) without buying hardware; we already learned today that the longer the household is blind, the longer the next "was the TV on?" question stays unanswerable. We can migrate to a dedicated Pi 4 later if the Docker-on-Rocinante reboot-fragility becomes a real problem.
- **Parallel deliverable:** Add UniFi controller liveness probe to `daily-household-health`. This is the systemic fix for the 4-day-silent-failure. Without it, the next outage repeats the same blind spot regardless of what we deploy.
- **Constitutional scope:** Pi-hole logs contain per-client DNS query patterns. Per family CLAUDE.md, that's household-internal data; never externalized. Pi-hole admin UI must not be exposed beyond LAN.

## Why now

Three pressures converged this morning:

1. **Visibility gap** — the TV-watching question has no answer right now and we don't want that to be the standing state.
2. **UniFi-silent-failure pattern** — the controller died on 2026-05-13 and nothing alerted. The wellness-checker probes peer machines, not Rocinante services. The fix needs to happen in the same project so we're not doing two rounds of operational work.
3. **Vayu-block precedent** — we just used UniFi to cut a kid's laptop off the internet. That worked, but it's a brittle single-point-of-control. Pi-hole gives a second layer: even if a device changes MAC, DNS blocking still applies (per-IP, per-network-segment).

## Success criteria

A successful Phase 3+ build means all of:

1. **Pi-hole resolves DNS for the household** with `1.1.1.1` + `1.0.0.1` (Cloudflare) as upstreams. `dig google.com @<pihole-ip>` returns answers from the LAN; `dig doubleclick.net @<pihole-ip>` returns `0.0.0.0`.
2. **Sartor dependencies are whitelisted** — anthropic.com, claude.ai, console.anthropic.com, console.vast.ai, cloud.vast.ai, 500.farm, registry-1.docker.io, auth.docker.io, mka.org / blackbaud.com, goddard / brightwheel, github.com (already not blocked but assert).
3. **UniFi DHCP push correctly configures clients with dual-DNS** (Pi-hole primary, 1.1.1.1 secondary fallback). When Pi-hole dies, DNS still resolves household-wide.
4. **DNS query logs are queryable** from a script (the question "was MAC X resolving streaming hosts during window Y" returns a yes/no with evidence).
5. **`daily-household-health` probes UniFi controller** — `curl -k https://192.168.1.171:8443/status` or equivalent; surfaces a yellow severity if the API doesn't respond within timeout. Validates the systemic-fix deliverable.
6. **Pi-hole admin password** stored in Bitwarden as `Pi-hole admin`. Never in chat, file, or commit.
7. **No Sartor service breaks.** Workflow check: `claude.ai`, Anthropic console, vast.ai console, Chase, MKA Blackbaud, Goddard portal, brokerage all reachable post-deploy.

## Scope

**In:** Pi-hole Docker deployment on Rocinante, standard blocklists, Sartor-domain whitelist, UniFi DHCP DNS push config, daily-household-health UniFi probe, vault entry, project audit trail.

**Out (deliberately):**
- Per-client DNS routing / kid-specific blocking (Pi-hole can do per-group, but v1 is just household-wide). Vayu's MAC block at UniFi already exists for the kid-specific axis.
- Migration to dedicated Pi 4 hardware (revisit if Docker-on-Rocinante turns out to reboot too often)
- Cloudflare DoH/DoT upgrades — v2
- Network-wide policy (block all of YouTube during school hours, etc.) — v2 if requested
- Reaching outside the LAN to query Pi-hole admin (Tailscale, etc.) — separate threat-model question

## Constraints

- **Constitutional (hard):** Pi-hole DNS query logs contain per-client browsing data including kids'. Treat with the same privacy ladder as `family/`. The Pi-hole admin UI must not be exposed beyond LAN — never bind to 0.0.0.0:80 externally, never proxy through a public endpoint.
- **Operational (hard):** DNS is critical-path. If Pi-hole goes down without a fallback, the entire household sees "internet broken." The UniFi DHCP push MUST include a secondary DNS server (`1.1.1.1`) so clients fail-over automatically.
- **Operational (soft):** Rocinante reboots happen. When it reboots, Pi-hole disappears for the 30-60s of Docker restart. With the dual-DNS fallback, that's a soft outage (1.1.1.1 takes over, no blocking but DNS works) rather than a hard one.
- **Personnel:** Aneeta uses the WiFi heavily; she should know there's a new DNS layer in case any service ever gets falsely blocked. No action needed from her today; flag if a whitelist needs adding.

## Decision: Docker on Rocinante (option 2)

Diverges from the 2026-05-04 doc's option-1 recommendation (Pi 4). Reasons for the change:

- **Time-to-deploy:** Pi 4 requires Amazon order + ship + flash + boot. Docker-on-Rocinante is ~30 min from greenlight to live.
- **The "things to monitor" list got longer this week** — UniFi controller probe is the harder operational lift; Pi-hole's "what host do I run it on" is the easier decision. Putting both on Rocinante means the same liveness-probe pattern applies to both.
- **Pi 4 migration is reversible** — if Rocinante-as-DNS-host turns out to reboot too much, we move the container to a Pi 4 later. The container config is portable.
- **No vast.ai conflict** — Rocinante isn't on vast.ai, so no ToS issue (unlike running on the GPU peers).

## Phase plan (skill phases)

| Skill Phase | Status | Artifact |
|---|---|---|
| 0 Frame | done | This INDEX.md |
| 1 Explore | skipped (placement doc already covered options space) | n/a — see [[../pihole-placement-2026-05-04]] |
| 2 Plan | next | PLAN.md (frozen acceptance criteria, deploy script outline) |
| 3 Build | pending | `scripts/deploy-pihole-docker.sh`, UniFi DHCP DNS config spec, daily-household-health probe patch |
| 4 Adversarial Review | pending | `review-pihole-deploy-v1.md` |
| 5 Revise | pending | per-charge replies + revision commits |
| 6 Re-Review | pending | `review-pihole-deploy-v2.md` |
| 7 Greenlight | pending | Alton chat-message ack to fire |
| 8 Validate | pending | Acceptance tests against the 7 success criteria above |
| 9 Loop / ship | pending | Pi-hole live; container running; daily-household-health probing UniFi |

## Audit trail

- 2026-05-04 — `pihole-placement-2026-05-04.md` created (`awaiting-hardware-decision`)
- 2026-05-13 ~00:58 — UniFi controller crashed silently. No alert (the gap this project also closes).
- 2026-05-17 morning — Alton asked about LG TV usage; answer was "no records." UniFi crash discovered. Pi-hole project resumed with explicit /complex-project framing.
- 2026-05-17 — Pi-hole project file created here as the frame; placement doc preserved as Phase 1 explore artifact.

## Related

- [[../pihole-placement-2026-05-04]] — original placement doc (Phase 1 explore content)
- [[HOUSEHOLD-CONSTITUTION]] §3 — household privacy
- [[family/CLAUDE]] — privacy ladder
- [[../unifi-takeover-2026-05-01-INDEX]] — UniFi controller operating context
- [[../unifi-takeover-2026-05-01-phase3-hardening-plan]] — broader hardening roadmap; Pi-hole was originally Phase 3A
- `.claude/skills/daily-household-health/SKILL.md` — parallel deliverable target
