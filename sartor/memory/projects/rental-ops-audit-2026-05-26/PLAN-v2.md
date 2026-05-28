---
type: plan
project: rental-ops-audit-2026-05-26
phase: 2-revised
status: pending-re-review
opened: 2026-05-26
updated: 2026-05-26
supersedes: PLAN.md
review_resolved: REVIEW-001.md
---

# Phase 2 Plan v2 -- Rental Operations Fix Package (Post-Prosecution)

Patches applied in response to REVIEW-001. Synthesis section unchanged from v1; jump to Fix package v2 for changes.

## Fix package -- v2

### Tier A.0 -- Ship today (1 hour, ship-no-matter-what)

Captures rtxserver-specific failure at minimum risk of plan-slip. Per REVIEW Charge 9.

| # | Fix | Effort | Reversible | Greenlight |
|---|---|---|---|---|
| A.0-1 | Fix REGISTRY.yaml: rtxserver vast_ai_machine_id 97429 -> 124192 | 2 min | Y | N |
| A.0-2 | Postmortem prereq: run daily-household-health skill manually, capture exit/stderr. Inspect Win Scheduled Task history (7d). Test Calendar MCP OAuth. Confirm with Alton: does he see this calendar daily? | 30 min | Y | N |
| A.0-3 | rtxserver pricing drop to $1.00/GPU on-demand, $0.75/GPU interruptible. FLOOR $0.80/$0.50. Stop-rule: no drop below floor without revisiting listed_min_gpu_count=1 instead | 5 min | Y | YES chat |
| A.0-4 | Market validation prereq to A.0-3: vastai search offers gpu_name=RTX_PRO_6000_WS rentable=any. If 0 listings have active rentals at any price -> market dead, pause A.0-3. If single-GPU PRO 6000 renting at $1.20+ -> multi-GPU minimum is binding, pivot to listed_min_gpu_count=1 | 5 min | Read | N |
| A.0-5 | Fallback channel cron in stale-detect.sh: while 0 rentals for >72h (single) or >120h (multi), touch URGENT-rtxserver-idle-NNh.md at repo root. Caught by /catchup. Bypasses A3 dependency | 15 min | Y | N |

### Tier A -- Closure for systemic failure mode (next session, ~5 hr)

| # | Fix | Effort | Reversible | Greenlight |
|---|---|---|---|---|
| A3a | (NEW) Postmortem of dark daily-household-health pipeline. Per REVIEW Charge 1: manual e2e run + stderr capture, Win Scheduled Task history, OAuth scope check, Alton chat-confirms target calendar usage | 1 hr | Read | N |
| A3b | Build/fix daily-household-health based on A3a findings. Must produce sartor/memory/daily/health-YYYY-MM-DD.md AND Google Calendar event on yellow+ | 2-3 hr | Y | Implicit |
| A3c | READ-PATH validation: after A3b fires first yellow, Alton confirms in chat within 24h he saw the calendar event. Build email digest as secondary path | 30 min + chat | Y | N |
| A4 | Proper idle-rental detector in stale-detect.sh. Route through A3 for yellow+. Inbox audit trail only. Supersedes A.0-5 fallback once A3 ships | 30 min | Y | N |
| A5 | Weekly vastai self-test machine cron per host. Failure routes through A3 (or fallback). One-shot definitive diagnostic | 15 min | Y | N |
| A6 | (NEW per REVIEW Charge 7) Daily backup of kaalia state from each host: /etc/vastai/, /var/lib/vastai_kaalia/machine_id, /var/lib/vastai_kaalia/.ssh/. Lands in ~/sartor-network-backups/ on rtxserver. MUST complete before rig 3 onboarding | 1 hr | Y | N |

### Tier B -- Structural fixes

| # | Fix | Effort | Reversible | Greenlight |
|---|---|---|---|---|
| B1 | (REVISED per REVIEW Charge 2) Live vast.ai -> REGISTRY reconciler. Daily Python pulls vastai show machines --raw, snapshots, diffs vs REGISTRY. For severity >= yellow drift, ROUTES THROUGH A3 (not inbox). Inbox audit trail only | 1-2 hr | Y | N |
| B2 | Doc sync: CLAUDE.md (Domain 1 pricing $0.30 -> $0.80, rtxserver listing status), REGISTRY description fields, vastai-management/SKILL, rtxserver-management/SKILL, business/solar-inference, business/rental-operations, business/vastai-pricing-strategy | 1 hr | Y | N |
| B3 | Rename machines/rtxpro6000server -> rtxserver (or symlink) | 30 min | Y | N |
| B4 | rtxserver CRONS.md frontmatter: pre-deploy -> live | 15 min | Y | N |
| B5 | (NEW per REVIEW Charge 8) Weekly meta-check: assert all Sartor Windows scheduled tasks remain Ready. File yellow via A3 on Disabled/Queued | 30 min | Y | N |

### Tier C -- Strategy/policy

| # | Fix | Effort | Reversible | Greenlight |
|---|---|---|---|---|
| C1 | Extend business/vastai-pricing-strategy.md: percentile targets, score-adjusted discounts, cold-start protocol, fleet-spread rule | 1 hr | Y | N |
| C2 | Plan gpuserver1 post-C.34113802 relist 2026-08-25 ($0.95-1.05 target) | 30 min | Y | N |
| C3 | Rig 3 onboarding playbook: IP plan, ports 40200-40299, launch $0.95/$0.70 on-demand-only | 1 hr | Y | N |

### Tier D -- Network cleanup

| # | Fix | Effort | Reversible | Greenlight |
|---|---|---|---|---|
| D1 | Delete 2 stale Fios loopback rules (4577/4567 -> 127.0.0.1) | 5 min | Y | Light |
| D2 | post-2026-08-25 DMZ -> all-port-forward migration | 30 min | Y | YES |

## Revised execution order

1. Tier A.0 today (1 hr) -- ship regardless of slip on Tier A
2. A3a postmortem (extends A.0-2) drives A3b shape
3. A6 (kaalia backup) BEFORE rig 3 onboarding -- non-negotiable
4. A4, A5 parallel with A3b via fallback channel
5. B1 only after A3 ships (depends on A3 alerting channel per Charge 2)
6. B2-B5 sequential after B1
7. C1-C3 after Tier B stable
8. D1 anytime
9. D2 deferred 2026-08-25

## Pre-registered success criteria v2 (Phase 8 validation)

- A.0-1: grep 97429 returns no canonical doc matches
- A.0-3: pricing visible in vastai show machines --raw. First rental within 7d at $1.00/GPU. Falsification: no rental in 7d + A.0-4 falsified pricing hypothesis -> A2 invalid, pivot to listed_min_gpu_count=1. Floor $0.80
- A.0-4: market validation produces binary go/no-go before A.0-3. Logged in execution log
- A.0-5: URGENT-*.md file appears at repo root within 24h of next cron cycle
- A3a: postmortem identifies specific reason pipeline went dark, documented in A3-postmortem-findings.md
- A3b: health-YYYY-MM-DD.md created day after A3b ships. Test yellow produces Calendar event. Alton confirms in chat within 24h seeing it (READ PATH)
- A4: detector files test inbox memo when invoked with --simulate-idle 80h. Memo triggers A3 alert
- A5: weekly self-test cron has run successfully at least once on each host
- A6: backup of kaalia state lands on rtxserver from gpuserver1 within 24h. Restore test: untar to scratch, machine_id file present and matches live
- B1: change vast_ai_machine_id in /tmp/REGISTRY-test.yaml, run reconciler on test path, assert alert routes through A3 within one cron cycle. Alert names field/expected/observed
- B2: grep "0.30" and "NOT YET LISTED" return no matches for gpuserver1/rtxserver in canonical docs
- B5: disable non-critical Sartor task, wait one cron cycle, assert yellow alert via A3

## Constitution Section 7 considerations

- A.0-3 / A2: financial action -- requires Alton chat greenlight
- A3b: creates Calendar events on Alton calendar -- non-destructive, no greenlight gate
- A6: copies system files to backup location -- internal
- D2: touches active gpuserver1 rental network path -- deferred
- All others: doc edits / cron / scripts -- reversible, no money, no external comms

## Estimated effort v2

- Tier A.0: 1 hr (today)
- Tier A: ~5 hr (next 1-2 sessions)
- Tier B: ~4 hr
- Tier C: ~2.5 hr
- Tier D: 5 min (D1)

Total ~12.5 hr, parcelable across 3-4 sessions. 30% increase from v1 due to A3 postmortem expansion + A6 + B5.
