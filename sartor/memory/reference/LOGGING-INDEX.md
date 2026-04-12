---
type: reference
entity: logging-index
updated: 2026-04-12
updated_by: cron-cleaner (memory-system-v2 EX-11)
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
| Curator pass log | TBD (`generated/cron-logs/curator-pass.log` by convention) | plaintext | Shell wrapper (14d) | `SartorCuratorPass` Windows task | Pending — task not yet installed; .cmd wrapper not yet written |
| Conversation extract log | TBD (stdout/stderr of `python -m sartor.conversation_extract -v`) | plaintext | Shell wrapper (14d) | `SartorConversationExtract` Windows task | Pending — task not yet installed; no redirect defined in XML |
| Improvement loop log | TBD (`generated/cron-logs/improvement-loop.log` by convention) | plaintext | Shell wrapper (14d) | `SartorImprovementLoop` Windows task | Pending — task not yet installed; .cmd wrapper not yet written |

### 3.2 gpuserver1 surfaces

| Name | Path | Format | Tier | Owner | Notes |
|---|---|---|---|---|---|
| Monitoring sweep shell log | `~/sartor-monitoring/logs/run_{ts}.log` | plaintext | Shell wrapper (30d) | `run_monitor.sh` | Claude invocation wrapper stdout; kept 30d by script's own logrotate |
| Monitoring sweep inbox entry | `sartor/memory/inbox/gpuserver1/monitoring/{YYYY-MM-DD}_{HHMM}_monitor.md` | md+fm | Event-driven (30d) | `run_monitor.sh` (Claude writes) | Structured health sweep; curator processes |
| Pricing weekly shell log | `~/sartor-pricing/logs/{YYYY-MM-DD}_{HHMM}.log` | plaintext | Shell wrapper (365d) | `run_pricing.sh` | Claude invocation wrapper; kept 365d per script |
| Pricing weekly report (local) | `~/sartor-pricing/state/weekly_reports/{YYYY-MM-DD}_pricing.md` | md+fm | Event-driven (365d) | `run_pricing.sh` (Claude writes) | Local state file; copied to inbox |
| Pricing weekly inbox entry | `sartor/memory/inbox/gpuserver1/pricing/{YYYY-MM-DD}_pricing.md` | md+fm | Event-driven (30d) | `run_pricing.sh` (Claude writes) | Curator-facing copy |
| Pricing history JSONL | `~/sartor-pricing/state/price_history.jsonl` | JSONL | Event-driven | `run_pricing.sh` (Claude appends) | One line per pricing decision; unbounded retention |
| Power daily summary inbox | `sartor/memory/inbox/gpuserver1/power/{YYYY-MM-DD}_power.md` | md+fm | Daily summary (30d) | `daily_summary.py` | kWh/cost rollup; curator processes |
| Power daily summary shell log | `~/sartor-power/logs/daily_summary.log` | plaintext | Shell wrapper (14d) | cron stdout redirect | Script-level log; needs logrotate |
| Power raw TSV (daily) | `~/sartor-power/data/{YYYY-MM-DD}.tsv` | TSV | Raw telemetry (7d) | `power_logger.py` service | Per-agreement NOT in repo; lives on gpuserver1 only |
| Heartbeat file | `sartor/memory/inbox/gpuserver1/_heartbeat.md` | md+fm | Live (overwritten) | `update_heartbeat.sh` | Updated by monitoring/pricing/power; curator reads every pass |
| vastai-tend legacy alert | `~/.vastai-alert` on gpuserver1 | plaintext | Legacy (unbounded) | `vastai-tend.sh` | Pre-agreement script; append-only; replaced by monitoring sweep |
| vastai-tend legacy log | `~/.vastai-tend.log` on gpuserver1 | plaintext | Legacy (unbounded) | vastai-tend.sh cron redirect | Pre-agreement; replaced by monitoring sweep |
| Gather mirror log | `/home/alton/generated/cron-logs/gather_mirror.log` | plaintext | Shell wrapper (14d logrotate) | `gather_mirror.sh` | Every 4h; dir created by script via `mkdir -p`. Also writes status JSON to `inbox/gpuserver1/status/` and alerts to `inbox/gpuserver1/alerts/` on failure. |
| Stale detect log | `/home/alton/generated/cron-logs/stale-detect.log` | plaintext | Shell wrapper (14d logrotate) | `stale-detect.sh` | Hourly; alerts written to `inbox/gpuserver1/_stale-alerts/` (one file per hour slot, overwrite on re-run). |
| Vastai tend log | `/home/alton/generated/cron-logs/vastai-tend.log` | plaintext | Shell wrapper (14d logrotate) | `vastai-tend.sh` | Every 30min; state-change inbox entries at `inbox/gpuserver1/_vastai/`. State cache at `/tmp/vastai-tend-state.json` (ephemeral). |
| Evolve mirror log | `/tmp/sartor-evolve.log` | plaintext | Shell wrapper (logrotate) | `sartor-evolve.sh` | LLM analysis; every 6h |
| Consolidate mirror log (autodream) | `/tmp/autodream.log` | plaintext | Shell wrapper (logrotate) | cron redirect | Daily 23:30 |
| Consolidate mirror log (decay) | `/tmp/decay.log` | plaintext | Shell wrapper (logrotate) | cron redirect | Daily 23:30 |
| Model optimizer log | `/tmp/model-optimizer.log` | plaintext | Shell wrapper (logrotate) | `sartor-model-optimizer.sh` | Weekly Sunday 4 AM |
| Gemma weekly log | `~/gemma-weekly.log` | plaintext | Shell wrapper (logrotate) | `sartor-gemma-weekly.sh` | Weekly Sunday 3 AM |
| Dashboard healthcheck log | SUPERSEDED | — | — | `dashboard-healthcheck.sh` | Folded into `stale-detect.sh` per EX-5 (master-plan §5.2). Script commented out in crontab 2026-04-12. |
| Gateway cron log | `~/.sartor-cron.log` | plaintext | Shell wrapper (14d) | gateway_cron.py redirect | Runs every 30min; needs logrotate |
| Heartbeat CSV log | `data/heartbeat-log.csv` | CSV | Event-driven | consolidate mirror cron | Append-only; retention TBD |

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

1. **gpuserver1 active cron logs (RESOLVED EX-11)** — gather_mirror, stale-detect, vastai-tend log paths confirmed from script source and added to 3.2.
2. **dashboard-healthcheck.sh (RESOLVED EX-11)** — marked SUPERSEDED by stale-detect.sh per EX-5.
3. **Rocinante new task logs (3 rows added, paths TBD)** — SartorCuratorPass, SartorConversationExtract, SartorImprovementLoop log paths are TBD pending .cmd wrappers being written.
4. **Power logger actually writing** — MISSION v0.2 open question #1 says the logger is not currently writing data. Aspirational row remains.
5. **Kaalia daemon logs** — no confirmed location. gpuserver1 to audit.
6. **Scheduled-task report tier** — `reports/daily/*.md` accumulate without a pruner; needs a scheduled housekeeping cron.
7. **Observer log (data/observer-log) format** — needs confirmation: JSONL with what schema?
8. **Rocinante new task log paths** — will be TBD until curator-pass-run.cmd and improvement-loop-run.cmd are written. Update this index when .cmd files are created.

## History

- 2026-04-12: EX-11 update — confirmed gpuserver1 active cron log paths from script source, added stale-detect and vastai-tend rows, marked dashboard-healthcheck superseded, added 3 Rocinante pending task rows (log paths TBD).
- 2026-04-12: v0.1 created as Rocinante-side bootstrap per EXECUTION-PLAN A6. Awaiting gpuserver1 B13 contribution for section 3.2 completion.
