---
name: rental-policy
description: What activities are allowed on gpuserver1 (and any future Sartor machine listed on a GPU rental marketplace) during an active rental window. Ratifies the host-CPU-during-rental rule that's been operating de facto and clarifies the boundaries.
type: business-policy
date: 2026-04-25
updated: 2026-04-25
updated_by: opus-4.7 + alton (ratified)
status: active
volatility: low
tags: [meta/policy, business/solar-inference, machine/rental]
related: [BUSINESS, business/solar-inference, business/rental-operations, machines/gpuserver1/MISSION, MACHINES]
aliases: [Rental Policy, Host-Activity-During-Rental Policy]
---

# Rental policy — what's allowed during an active rental window

Ratified 2026-04-25 by Alton in response to the gpuserver1 persona-engineering planning conversation, which surfaced an unanswered question: is host-CPU work during the active vast.ai rental allowed?

## Scope

Applies to any Sartor machine listed on a GPU-rental marketplace (currently: gpuserver1 / vast.ai machine 52271 / offer 32099437, contract C.34113802 through 2026-08-24). Future peer machines that get listed inherit this policy.

## What is rented

The contract is for **GPU access** via the rental container. Specifically:

- The renter has exclusive access to the GPU(s) configured in the offer
- The renter has access to the rental container (a Docker container with whatever environment they configured) and any disk space allocated to that container
- The renter has access to the network ports configured for the offer (e.g., vast.ai ports 40000-40099)

That's it. The contract does not transfer ownership of the host machine.

## What is NOT rented

The host machine itself remains the household's. Specifically, **the following are NOT contracted out**:

- **Host CPU outside the rental container.** Host-side processes (cron jobs, Claude Code sessions, monitoring scripts, system services) run on host CPU that the renter has no claim on.
- **Host RAM outside the rental container.** Same reasoning.
- **Host disk outside the rental container's allocated space.** The household's `/home/alton/` and the rest of the host filesystem are ours.
- **The Claude Code sessions that gpuserver1 hosts.** Those are household-owned; their compute footprint is host-side.
- **The motherboard / chipset / case / power supply / non-GPU peripherals** (e.g., the AURA LED controller and the MSI Coreliquid A13 cooler's RGB header). The `rgb_status.py` cron writing to `/dev/hidraw0` is using motherboard hardware that is unambiguously household property.
- **Network egress not tied to the rental.** SSH from Rocinante, git pulls/pushes, household-internal traffic.

## What the household will and won't do

### WILL (allowed during rental)

- Run host-side cron jobs (`vastai-tend.sh`, `rgb_status.py`, the new `self-steward.sh` daily cron, gateway scripts, monitoring scripts)
- Run Claude Code sessions on the host for household work (CPU-bound research, corpus authoring, planning, peer-coordinator relays, persona-engineering Phase 2/3 corpus engineering on gpuserver1)
- SSH in for monitoring, deploys, maintenance
- Edit non-rental host files (memory wiki, scripts, config)
- Pull and commit git from the host
- Use the LED hardware for status display (this is hardware the renter has no relationship with)

### WILL NOT (forbidden during rental)

- **Touch the rental container.** Don't `docker exec` into it, don't read its files, don't kill its processes, don't snoop.
- **Touch the GPU.** No `nvidia-smi --gpu-reset`, no driver reloads, no compute workloads on the rented GPU. (Reading `nvidia-smi --query-gpu=...` is fine; it's a query against a shared kernel interface, not interference.)
- **Sustained heavy host-CPU load** that could plausibly affect the renter's container performance. The bar: if a workload would push the host into significant CPU contention or thermal throttling, it doesn't run. Rule of thumb: keep host load average below ~3 (on 32-thread i9-14900K) during rental; the rgb_status / self-steward / Claude session overhead is comfortably below this. Heavy training would not be.
- **Reboot or shutdown the host without renter notice.** The contract obligates uptime; reboots interrupt the renter's container. Reboots only happen for documented maintenance with renter-platform notice if extended.
- **Modify network configuration in ways that interrupt the rental** (changing the DMZ, changing the public IP, changing the firewall rules that the rental depends on).

## Specific affordances ratified for the persona-engineering subprogram

`sartor/memory/research/persona-engineering/GPUSERVER1-PERSONA-PLAN-DRAFT.md` proposes that gpuserver1 spend ~6-10 wall-clock hours of its local Claude session on corpus authoring + QC during the active rental window. This is host-CPU work, no GPU touch, no rental-container touch. **Ratified as allowed** under this policy.

The rental container's CPU quota and any contention will be monitored. If the renter complains via vast.ai about host performance, the household's first response is to reduce activity, not to cancel the rental.

## Open questions

None at ratification. If new edge cases arise (a long-running training run on a smaller model that fits in host RAM but not the rented GPU? hardware updates that require reboot?), file an inbox proposal and update this policy.

## History

- 2026-04-25: Ratified by Alton via chat ("move forward with the persona plan and the rental policy"), with the implied content of the policy being what was already operating de facto and what was proposed in the gpuserver1-persona-plan-draft. Drafted by opus-4.7.
