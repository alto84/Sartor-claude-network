---
type: plan
project: rental-ops-audit-2026-05-26
phase: 2-revised-2
status: ready-for-greenlight
opened: 2026-05-26
updated: 2026-05-26
supersedes: PLAN-v2.md
review_resolved: [REVIEW-001.md, REVIEW-002.md]
---

# Phase 2 Plan v3 -- Rental Operations Fix Package (Re-Review Patched)

Three patches from REVIEW-002 applied. All 13 charges (10 original + 3 from re-review) resolved.

## Fix package -- v3 (delta from v2)

### Tier A.0 -- Ship today (1 hour)

| # | Fix | Effort | Reversible | Greenlight |
|---|---|---|---|---|
| A.0-1 | Fix REGISTRY.yaml: rtxserver vast_ai_machine_id 97429 -> 124192 | 2 min | Y | N |
| A.0-2 | Postmortem prereq: run daily-household-health skill manually, capture exit/stderr. Inspect Win Scheduled Task history (7d). Test Calendar MCP OAuth via test ping. Confirm with Alton: does he see this calendar daily? | 30 min | Y | N |
| A.0-3 | **rtxserver pricing drop to $1.00/GPU on-demand, $0.75/GPU interruptible.** FLOOR $0.80/$0.50. **Floor-reached pivot rule** (per REVIEW-002 Charge 11): if floor reached without first rental within 14 days, do NOT drop further — pivot to `listed_min_gpu_count=1` (split dual into two single-GPU rentals) | 5 min | Y | YES chat |
| A.0-4 | **Market validation prereq to A.0-3** (per REVIEW-002 Charge 13 — CRITICAL FIX): use VRAM-fallback Method B per vastai-market-scan skill, NOT the `gpu_name` filter. Query: `vastai search offers 'gpu_ram>90000 rentable=any verified=true' -o dph_total --raw`. Then for each result, inspect `current_rentals_running` and `dph_total`. Decision: (a) if 0 listings have active rentals at ANY price → market dead → pause A.0-3, pivot to multi-GPU minimum hypothesis; (b) if any single-PRO-6000 listing is renting at $1.20+ → multi-GPU minimum is binding → pivot to `listed_min_gpu_count=1` | 5 min | Read | N |
| A.0-5 | (Per REVIEW-002 Charge 12 — FALLBACK CHANNEL TIGHTENED) Cron addition to stale-detect.sh: while 0 rentals for >72h (single) or >120h (multi), write `URGENT-<hostname>-idle-NNh.md` at repo root AND append a line to `tasks/TODAY.md`. Pre-deploy verification: confirm `/catchup` surfaces repo-root URGENT-* files (if not, fix /catchup first). Caught by next Claude session via either channel | 15 min | Y | N |

### Tier A (next session, ~5 hr)

| # | Fix | Effort | Reversible | Greenlight |
|---|---|---|---|---|
| A3a | Postmortem of dark daily-household-health pipeline. **Output requirement** (per REVIEW-002): postmortem MUST identify root-cause CLASS (one of: task-missing, OAuth-expired, logic-bug, output-write-path-broken, scheduler-disabled, calendar-event-create-failure, never-was-built) AND cite SPECIFIC EVIDENCE (log line, exit code, OAuth response, etc.). "We didn't find anything" is not an acceptable outcome | 1 hr | Read | N |
| A3b | Build / fix daily-household-health based on A3a root-cause class. Must produce `sartor/memory/daily/health-YYYY-MM-DD.md` AND Google Calendar event on yellow+. **Explicit Alton notification before first ship** (per REVIEW-002): "About to start creating Google Calendar events titled 'Sartor Health: <severity>' on your primary calendar daily; OK to proceed?" — chat ack required | 2-3 hr | Y | YES chat (calendar acct touch) |
| A3c | Read-path validation: after A3b fires first yellow, Alton confirms in chat within 24h seeing the calendar event. Build email digest as secondary path | 30 min + chat | Y | N |
| A4 | Proper idle-rental detector. Route through A3 for yellow+. Inbox audit trail only. Supersedes A.0-5 fallback once A3 ships | 30 min | Y | N |
| A5 | Weekly `vastai self-test machine` cron per host. Failure routes through A3 (or fallback). Definitive one-shot diagnostic | 15 min | Y | N |
| A6 | Daily backup of kaalia state from each host: /etc/vastai/, /var/lib/vastai_kaalia/machine_id, /var/lib/vastai_kaalia/.ssh/. Lands in ~/sartor-network-backups/ on rtxserver. MUST complete before rig 3 onboarding | 1 hr | Y | N |

### Tier B-D (unchanged from v2)

See PLAN-v2.md for full text. Key constraint preserved: B1 routes drift alerts through A3 (not inbox). All non-Tier-A.0 items defer to subsequent sessions.

## Patches summary (delta v2 → v3)

| Patch | Charge | What changed |
|---|---|---|
| P1 | REVIEW-002 #13 | A.0-4 query changed from `gpu_name=RTX_PRO_6000_WS` (known broken per `/vastai-market-scan` skill) to `gpu_ram>90000` VRAM-fallback. Prevents false-negative "market dead" verdict |
| P2 | REVIEW-002 #11 | A.0-3 added explicit "floor-reached pivot rule": if $0.80/GPU floor reached without rental in 14d, do NOT drop further — pivot to `listed_min_gpu_count=1`. Closes unfalsifiable-OR smuggling |
| P3 | REVIEW-002 #12 | A.0-5 fallback channel adds `tasks/TODAY.md` append (was mentioned in reply but dropped from v2 text). Pre-deploy verification: confirm `/catchup` surfaces repo-root URGENT-* files |
| P4 | REVIEW-002 (A3a criterion) | A3a output requirement tightened: postmortem MUST name root-cause CLASS + cite SPECIFIC EVIDENCE. "Nothing found" not acceptable |
| P5 | REVIEW-002 (A3b greenlight) | A3b adds explicit Alton chat-greenlight before first ship (touches external Calendar account; transparency move) |

## Pre-registered success criteria v3 (Phase 8)

(Inherits v2 criteria with three sharpenings)

- A.0-3: **SHARPENED** -- "First rental within 7d at $1.00/GPU. Falsification: if no rental in 7d AND A.0-4 confirmed >=1 competing listing has active rentals at comparable price → pricing isn't binding constraint → pivot to listed_min_gpu_count=1. Floor: $0.80/GPU. If floor reached without rental in 14 days, pivot to listed_min_gpu_count=1 (do NOT drop further)"
- A.0-4: **SHARPENED** -- "Query uses VRAM-fallback Method B. Output produces explicit binary go/no-go for A.0-3 plus a third path (multi-GPU minimum binding). Logged in execution log with raw response attached"
- A.0-5: **SHARPENED** -- "URGENT-*.md file at repo root AND tasks/TODAY.md entry both appear within 24h of next cron cycle while host idle. Pre-deploy: /catchup surfaces repo-root URGENT-* files (verified manually)"
- A3a: **SHARPENED** -- "Output names root-cause class (one of {task-missing, OAuth-expired, logic-bug, output-write-path-broken, scheduler-disabled, calendar-event-create-failure, never-was-built}) AND cites specific evidence line/log/code"

All other criteria from v2 unchanged.

## Constitution Section 7 — additional flag

A3b adds an explicit Alton chat-greenlight gate before first ship (per P5). This is a low-friction additional checkpoint; the calendar events are non-destructive but visible on Alton's primary Google calendar, and the transparency move is the right safety posture.

## Ready for greenlight

v3 is fire-ready per REVIEW-002 verdict ("fire-after-patching" with 3 textual patches landed). Awaiting Alton chat-greenlight for:

1. **A.0-3 rtxserver pricing change** (financial action; Constitution §7 first hard constraint).
2. (Implicit on A3b execution day, not now) Calendar event creation.

Other items in Tier A.0 require no greenlight and can ship as soon as A.0-3 is approved or independently.
