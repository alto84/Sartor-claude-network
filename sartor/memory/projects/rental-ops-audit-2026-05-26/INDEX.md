---
type: project
project: rental-ops-audit-2026-05-26
status: phase-1-explore
opened: 2026-05-26
updated: 2026-05-26
related: [BUSINESS, business/solar-inference, business/rental-operations, machines/REGISTRY]
tags: [domain/business, domain/infrastructure, audit]
---

# Rental Operations Audit — 2026-05-26

## Phase 0 — Frame

**Problem.** The Sartor vast.ai rental operation has accumulated systemic gaps that today's "rtxserver isn't getting rentals" investigation surfaced:

- REGISTRY.yaml claims rtxserver's vast.ai machine_id is 97429; live state says 124192
- CLAUDE.md describes rtxserver as "NOT YET LISTED"; it is in fact listed and verified (self-test passed end-to-end today)
- Three wrong diagnostic paths were tried before `vastai self-test machine` was run, which gave the answer in one shot — a process/ordering failure as much as a docs failure
- Undocumented coexistence of Fios DMZ (→ 192.168.1.100) and explicit port-forward rule (40100-40199 → 192.168.1.157) for rtxserver — created a phantom "network is broken" hypothesis
- rtxserver listed but earning ~$0; no automated alert surfaced this in the days/weeks it has been running

**Why now.** A third rental host (rig 3, single RTX 5090, AM5 platform) is on order, parts arriving 2026-05-28, target onboarding June 2026. A 50% fleet expansion is the wrong moment to discover that the operational layer is undocumented and unmonitored. Fix the foundation before scaling on top of it.

**Success criteria.**
1. Single source of truth per rental host (machine_id, listing status, current pricing, recent earnings, last-verified timestamp) — automatically reconciled against live vast.ai state
2. Canonical diagnostic playbook for "host not getting rentals," with `vastai self-test machine <id>` *first*, network/port checks *last*
3. Network topology documented unambiguously — the dual-host DMZ+port-forward configuration captured, port-allocation scheme defined for fleet growth
4. Pricing/market-position monitoring with alerting on zero-rental drift exceeding a threshold (24-72h depending on host class)
5. Rig 3 onboarding procedure resolved before parts arrive — what address/port-range/listing config
6. Drift detection between REGISTRY.yaml and live vast.ai state, running on a schedule, surfacing to inbox

**Scope IN.** Solar Inference LLC rental ops: vast.ai fleet (gpuserver1, rtxserver, future rig 3), network topology supporting them, monitoring/alerting tooling, documentation supporting all of it, onboarding procedure for rig 3.

**Scope OUT.** Personal investment trades, AZ work, family operations, nonprofit administration, anything not directly enabling vast.ai rental revenue.

**Constraints.**
- Cannot disrupt the active gpuserver1 reserved rental C.34113802 (through 2026-08-24) — limits what can be changed live
- No autonomous money movement, no autonomous external communication (Constitution §7)
- Rig 3 timeline: parts arrive 2026-05-28, build estimated 1-2 days, onboarding target June 2026

## Phase 1 — Explore (in flight)

Five parallel subagents dispatched 2026-05-26:

| # | Agent | Persona | Output artifact |
|---|---|---|---|
| 1 | Auditor | Doc-vs-reality drift hunter | doc-drift-findings.md |
| 2 | General-purpose | Network topology auditor | network-topology-findings.md |
| 3 | General-purpose | Ops tooling auditor | tooling-findings.md |
| 4 | Session-searcher | Incident pattern reviewer | incident-patterns.md |
| 5 | gpu-pricing | Pricing/market position analyst | pricing-findings.md |

Each is scoped to one angle, capped at 600 words, no fixes — pure report. Synthesis happens at Phase 2.

## Phase 2 — Plan (pending)
## Phase 3 — Build (pending)
## Phase 4 — Adversarial Review (pending — outside reviewer, NOT a phase-1 agent)
## Phase 5 — Revise (pending)
## Phase 6 — Re-Review (pending)
## Phase 7 — Greenlight (pending — Alton)
## Phase 8 — Validate (pending)
