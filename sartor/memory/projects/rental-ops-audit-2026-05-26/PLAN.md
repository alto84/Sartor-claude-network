---
type: plan
project: rental-ops-audit-2026-05-26
phase: 2
status: pending-review
opened: 2026-05-26
updated: 2026-05-26
---

# Phase 2 Plan -- Rental Operations Fix Package

## Synthesis of Phase 1 findings

All 5 audit agents independently surfaced the same root pattern: **the system has the right information in live state, but the human-feedback loop is broken.**

1. **Documentation drift is systematic.** gpuserver1 pricing tripled ($0.30 -> $0.80) with zero doc update. rtxserver machine_id wrong in 4 files. "NOT YET LISTED" in 3 files for a machine actually listed. Root cause: no automated reconciliation between `vastai show machines --raw` and canonical docs.

2. **Alerting backbone never got built.** CLAUDE.md describes a `daily-household-health` scheduled task that pings Alton via Google Calendar on yellow+ severity. **It does not exist on Rocinante.** `Get-ScheduledTask` returns no matching task. The 48h-cable-pull blind spot the skill claims to close was never actually closed.

3. **`vastai-tend.sh` only fires on STATE CHANGES.** A host sitting idle indefinitely produces zero events -- exactly today's rtxserver failure mode.

4. **Diagnostic ordering is wrong.** `vastai self-test machine` is the canonical one-shot for "rentable but not renting." Currently never run on schedule. Today: 30+ min wasted on wrong paths before running it.

5. **Pricing leaves real money on the table.**
   - gpuserver1 at $0.80 = 3rd percentile of 59 verified RTX 5090 listings (market median $1.60). Locked while C.34113802 active through 2026-08-24; post-expiry target $0.95-1.05.
   - rtxserver at $3.20/hr total = most expensive dual-GPU in class, LOWEST score (130.2). Three failure modes stacked: overpriced, niche market, cold-start.
   - Rig 3 launch target: $0.95/$0.70 (just below P25, $0.05-0.10 spread vs gpuserver1 post-relist).

6. **Network topology is fine.** DMZ + port-forward hybrid arbitrates correctly (port-forward wins; 18-pkt hairpin DNAT counter on rtxserver confirms). Two stale loopback rules (4577/4567 -> 127.0.0.1) are dead weight. Migration to all-port-forward is cleanup, not urgent.

7. **Existing designs ready but unbuilt.** IP-resistance-pattern-2026-05-20.md (3-4 hr build). vastai-pricing-strategy.md needs extension. rtxserver self-steward cron suite staged but not installed.

## Fix package -- prioritized

### Tier A -- Closure for today's failure mode (do first)

| # | Fix | Effort | Reversible? | Greenlight? |
|---|---|---|---|---|
| A1 | Fix REGISTRY.yaml: rtxserver `vast_ai_machine_id: 97429` -> `124192` | 2 min | Yes | No |
| A2 | **rtxserver pricing change**: $1.60/GPU -> $1.00/GPU on-demand, $0.85 -> $0.75 interruptible | 5 min | Yes | **Yes -- financial** |
| A3 | **Build `daily-household-health` scheduled task that CLAUDE.md describes but doesn't exist.** Alerting backbone. Without it, every monitor below is silent. | 1-2 hr | Yes | Implicit |
| A4 | Add idle-rental detector to stale-detect.sh: if rental_count == 0 for >72h (single-GPU) or >120h (multi), file inbox memo yellow | 30 min | Yes | No |
| A5 | Weekly `vastai self-test machine` cron per host. One-shot definitive diagnostic | 15 min | Yes | No |

### Tier B -- Structural fixes

| # | Fix | Effort | Reversible? | Greenlight? |
|---|---|---|---|---|
| B1 | Live vast.ai -> REGISTRY reconciler: daily Python pulls `vastai show machines --raw`, writes snapshot, diffs vs REGISTRY, files inbox on drift | 1-2 hr | Yes | No |
| B2 | Doc sync: CLAUDE.md, REGISTRY.yaml, vastai-management/SKILL.md, rtxserver-management/SKILL.md, business/solar-inference.md, business/rental-operations.md, business/vastai-pricing-strategy.md | 1 hr | Yes | No |
| B3 | Rename `machines/rtxpro6000server/` -> `rtxserver/` (or symlink) to match canonical hostname | 30 min | Yes | No |
| B4 | Update CRONS.md frontmatter on rtxserver: `status: pre-deploy` -> `status: live` | 15 min | Yes | No |

### Tier C -- Strategy/policy

| # | Fix | Effort | Reversible? | Greenlight? |
|---|---|---|---|---|
| C1 | Extend business/vastai-pricing-strategy.md: percentile targets per card class, score-adjusted discounts, cold-start protocol, fleet-spread rule | 1 hr | Yes | No |
| C2 | Plan gpuserver1 post-C.34113802 relist for 2026-08-25 ($0.95-1.05 target). Calendar + matter | 30 min | Yes | No |
| C3 | Rig 3 onboarding playbook (June 2026 build): IP plan, port range 40200-40299, launch pricing $0.95/$0.70 on-demand-only | 1 hr | Yes | No |

### Tier D -- Network cleanup (not urgent)

| # | Fix | Effort | Reversible? | Greenlight? |
|---|---|---|---|---|
| D1 | Delete 2 stale Fios loopback port-forward rules (4577/4567 -> 127.0.0.1) | 5 min | Yes | Light |
| D2 | (post-2026-08-25) Migrate DMZ -> all-port-forward. Defer until C.34113802 ends | 30 min | Yes | **Yes** |

### Out of scope (separate matter)

- vast.ai sticky `error_description` resolution: CLI verb request or weekly health check
- UCG-Pro replacement of CR1000A: long-horizon, deferred per network-management skill

## Execution order

1. **A3 first.** Without alerting pipeline, every other monitor is silent. Build the channel BEFORE adding things that need it.
2. **A1, A2, A5 in parallel** (A2 requires Alton chat greenlight).
3. **A4** after A3 confirmed (so idle alerts have somewhere to land).
4. **B1, B2, B3, B4** sequential -- B1 produces live snapshot that B2 should reflect.
5. **C1, C2, C3** after Tier B stable.
6. **D1** anytime, optional.
7. **D2** deferred to 2026-08-25.

## Pre-registered success criteria (Phase 8)

- (A1) `grep 97429 sartor/memory/` returns no matches in canonical docs
- (A2) New pricing visible via `vastai show machines --raw`. Rental within 7 days, OR Alton accepts "no rental in 7d -> drop another 10%"
- (A3) `health-YYYY-MM-DD.md` created tomorrow 2026-05-27, and test yellow event produces Calendar event
- (A4) Detector files test inbox memo when invoked with `--simulate-idle 80h`
- (A5) Weekly self-test cron has run successfully at least once on each host
- (B1) Reconciler detects deliberately-introduced REGISTRY drift in test
- (B2) `grep "0.30"` and `grep "NOT YET LISTED"` return no matches for gpuserver1/rtxserver

## Constitution §7 considerations

- A2: financial action affecting Solar Inference revenue -- requires Alton chat greenlight
- A3: creates Google Calendar events on Alton's calendar -- non-destructive, no greenlight gate
- D2: touches active gpuserver1 rental network path -- deferred to post-contract
- All others: doc edits, cron additions, script creation -- reversible, no money movement, no external comms

## Estimated effort

Tier A ~4h, Tier B ~3h, Tier C ~2.5h, Tier D ~5min. Total ~9.5h, parcelable across 2-3 sessions.
