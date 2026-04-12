---
type: reference
entity: logging-index
updated: 2026-04-12
status: active
version: 0.1
related:
  - OPERATING-AGREEMENT
  - EXECUTION-PLAN
  - CURATOR-BEHAVIOR
---

# Sartor Logging Index

This is the canonical catalog of every log surface produced by any machine in the Sartor network. Per OPERATING-AGREEMENT v1.0 §3.3: **if a log surface is not in this index, it does not officially exist**, and the next curator pass flags it.

This v0.1 is the Rocinante-side bootstrap. gpuserver1's B13 work item adds its surfaces via an inbox proposal; the curator merges gpuserver1's catalog into section 2 below. Sections marked TODO are waiting on gpuserver1's B13 delivery.

## 1. Format conventions

Per OPERATING-AGREEMENT §3.1:

- **Default format:** markdown with YAML frontmatter. Frontmatter fields: `timestamp`, `source` (machine + subsystem), `level` (DEBUG/INFO/WARN/ERROR/CRITICAL), `event_type`, optional `correlation_id`. Body is free-form markdown.
- **Exception 1: high-frequency numeric telemetry** — JSONL, one line per sample, no frontmatter. Fed to aggregators only. Lives in `~/generated/` on peer machines, not the repo.
- **Exception 2: shell wrapper stdout/stderr capture** — plaintext. Already a stream; forcing markdown adds friction. Lives in `~/generated/` with logrotate.

## 2. Retention ladder

| Tier | Format | Retention | Aggregator |
|------|--------|-----------|------------|
| Raw telemetry (JSONL, 60s power, GPU util) | JSONL | 7 days | `daily_summary.py` → tier 2 |
| Daily summaries | md+fm | 90 days | weekly rollup cron |
| Weekly rollups | md+fm | 12 months | quarterly review |
| Quarterly reviews | md+fm | indefinite (in git) | — |
| Event-driven logs (monitoring sweeps, curator runs) | md+fm | 30 days raw, then aggregated | curator weekly |
| Inbox entries | md+fm | 30 days in `_processed/`, weekly rollup thereafter | curator |
| Shell wrapper logs | plaintext | 14 days, logrotate | — |

## 3. Log surface catalog

### 3.1 Rocinante surfaces

| Name | Path | Format | Tier | Owner | Notes |
|---|---|---|---|---|---|
| Daily log | `sartor/memory/daily/{YYYY-MM-DD}.md` | md+fm | Daily summary (90d) | memory-curator | Session-driven, contains push-failure incidents per §1.2 item 5 |
| Curator log | `sartor/memory/inbox/rocinante/_curator_logs/curator-log-{ts}.md` | md+fm | Event-driven (30d → aggregated) | memory-curator | One per curator run (twice daily); authoritative acknowledgment channel for peers |
| Curator staging | `sartor/memory/inbox/rocinante/_curator_staging/{ts}/` | mixed | Transient (single run) | memory-curator | Ephemeral transactional workspace; cleaned on commit |
| Flagged inbox entries | `sartor/memory/inbox/rocinante/_flagged/` | md+fm | Unbounded | memory-curator | Schema-invalid entries awaiting correction |
| Processed inbox entries | `sartor/memory/inbox/rocinante/_processed/{YYYY-MM-DD}/` | md+fm | 30d → weekly rollup | memory-curator | Applied entries |
| Weekly archive | `sartor/memory/inbox/rocinante/_archive/{YYYY-WW}.md` | md+fm | Indefinite | memory-curator | Weekly rollup of processed entries |
| MEMORY-CHANGELOG | `docs/MEMORY-CHANGELOG.md` | md+fm | Indefinite | memory-curator (dialectic flow) | Thesis/antithesis/synthesis log |
| Trajectory logs | `data/trajectories/` | JSONL + md | Daily summary (90d) | session lifecycle hooks | Task outcomes and failures |
| System state | `data/SYSTEM-STATE.md` | md+fm | Live | memory-curator | p1/p0 pointer surface; morning briefing reads this |
| Scheduled-task reports | `reports/daily/{YYYY-MM-DD}-{task}.md` | md+fm | 90d | scheduled task runner | Per-run outputs of scheduled tasks |
| Financial reports | `reports/financial/` | md+fm | Indefinite | financial-analyst agent | Weekly/monthly rollups |
| Observer log | `data/observer-log` | JSONL | 7d raw | observer runtime | Runtime-agent observation stream |

### 3.2 gpuserver1 surfaces (TODO: B13 delivery)

Awaiting gpuserver1's catalog via inbox entry per EXECUTION-PLAN.md B13. Placeholder entries based on OPERATING-AGREEMENT §1.3 and MISSION v0.2 declarations:

| Name | Current path | Proposed path | Format | Tier | Owner | Notes |
|---|---|---|---|---|---|---|
| Power logger | `sartor-power/logs/power_log.csv` (in-repo, broken per MISSION v0.2 #1) | `~/generated/power/power_log.csv` | JSONL (proposed; currently CSV) | Raw telemetry (7d) | `power_logger.py` | B2 refactor required |
| 2h monitoring sweep stdout | TBD (currently cron stdout) | `~/generated/monitoring/monitor-{ts}.log` | plaintext | Shell wrapper (14d, logrotate) | `run_monitor.sh` | B3 refactor required |
| 2h monitoring entry (structured) | `sartor/memory/inbox/gpuserver1/monitoring/*.md` | unchanged (stays in inbox) | md+fm | Event-driven 30d | `run_monitor.sh` | The structured inbox side of monitoring |
| Heartbeat | `sartor/memory/inbox/gpuserver1/_heartbeat.md` | unchanged | md+fm | Live (overwritten every 2h) | `run_monitor.sh` | Curator reads every pass; B6 work item |
| Pricing cron raw offers | TBD | `~/generated/pricing/offers-{ts}.json` | JSON | Raw telemetry (7d) | `run_pricing.sh` | B4 refactor required |
| Pricing weekly recommendation | `sartor/memory/inbox/gpuserver1/pricing-rec-{YYYY-MM-DD}.md` | unchanged | md+fm | Event-driven 30d | `run_pricing.sh` | Curator surfaces to morning briefing |
| Weekly ops report | `sartor/memory/inbox/gpuserver1/weekly-ops-{YYYY-MM-DD}.md` | unchanged | md+fm | Event-driven 30d | weekly ops cron | B11 work item |
| vastai-tend log | `~/.vastai-alert` on gpuserver1 | TBD (may move to `~/generated/`) | plaintext | Shell wrapper (14d) | `~/vastai-tend.sh` | Pre-agreement surface; needs audit |
| Kaalia daemon log | TBD | TBD | TBD | TBD | Kaalia | gpuserver1 to catalog |
| GPU utilization samples | TBD | `~/generated/monitoring/gpu-util.jsonl` | JSONL | Raw telemetry (7d) | future telemetry job | Proposed; not yet deployed |

### 3.3 Joint surfaces

| Name | Path | Format | Tier | Owner | Notes |
|---|---|---|---|---|---|
| Operating agreement | `sartor/memory/reference/OPERATING-AGREEMENT.md` | md+fm | Indefinite | Rocinante (curator hub) | Living document; version bumps on material change |
| Execution plan | `sartor/memory/reference/EXECUTION-PLAN.md` | md+fm | Indefinite | Rocinante | Working todo list derived from agreement |
| Quarterly review reports | `sartor/memory/reference/OPERATING-AGREEMENT-REVIEW-{YYYY-QN}.md` | md+fm | Indefinite | both | C4 work item |

## 4. Discovery and drift control

Per OPERATING-AGREEMENT §3.3: if a log surface is not in this index, it does not officially exist. The curator flags unknown log surfaces on every pass. New surfaces are added via:

- **Rocinante surface:** direct edit of this file with `updated:` bump.
- **gpuserver1 surface:** inbox entry at `sartor/memory/inbox/gpuserver1/logging-index-proposal-{date}.md` with `target: sartor/memory/reference/LOGGING-INDEX.md` and `operation: patch`. Curator merges it on next pass.

## 5. Gaps and TODOs

Flagged items the next pass should resolve:

1. **gpuserver1 catalog (B13)** — gpuserver1 needs to produce its full surface catalog. Multiple cells are TBD.
2. **Power logger actually writing** — MISSION v0.2 open question #1 says the logger is not currently writing data. Until B2 lands, the "Power logger" row is aspirational.
3. **Kaalia daemon logs** — no confirmed location. gpuserver1 to audit.
4. **vast.ai audit trail** — pre-agreement `~/vastai-tend.sh` log is not yet mapped to a retention tier.
5. **Scheduled-task report tier** — `reports/daily/*.md` accumulate without a pruner; needs a scheduled housekeeping cron.
6. **Observer log (data/observer-log) format** — needs confirmation: JSONL with what schema?

## History

- 2026-04-12: v0.1 created as Rocinante-side bootstrap per EXECUTION-PLAN A6. Awaiting gpuserver1 B13 contribution for section 3.2 completion.
