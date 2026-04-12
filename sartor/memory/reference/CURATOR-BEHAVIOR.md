---
type: reference
entity: curator-behavior
updated: 2026-04-12
status: active
version: 1.0
related:
  - OPERATING-AGREEMENT
  - EXECUTION-PLAN
  - memory-curator-agent
  - MULTI-MACHINE-MEMORY
---

# Curator Behavior Reference

This document describes the operational behavior of the Sartor memory curator: states, transitions, retention, and recovery. It is the companion reference to [[memory-curator-agent]] (which defines the agent's identity, tools, and runtime configuration). This doc answers the question "what happens when I drop file X into inbox/Y/" in precise, testable terms.

Introduced by OPERATING-AGREEMENT v1.0 §2.2. See also [[MULTI-MACHINE-MEMORY]] for the architectural rationale behind the inbox pattern.

## State machine for inbox entries

Every inbox entry moves through a small number of states. The curator is the only process that transitions entries; peer machines only create entries in `NEW`.

```
              (peer writes file)
                     |
                     v
    +----- NEW (in inbox/{machine}/ root) -----+
    |                |                         |
    |           schema valid?                  |
    |            /         \                   |
    |          no          yes                 |
    |           |            |                 |
    |           v            v                 |
    |       FLAGGED       STAGED               |
    |  (_flagged/)    (_curator_staging/)      |
    |                      |                   |
    |                verify phase              |
    |                 /        \               |
    |               ok        race/error       |
    |                |            |            |
    |                v            v            |
    |            APPLIED       DEFERRED        |
    |       (_processed/)  (back to NEW for    |
    |              |        next pass)         |
    |              |                           |
    |         30+ days                         |
    |              |                           |
    |              v                           |
    +---------> ARCHIVED                       |
           (_archive/{YYYY-WW}.md)             |
                                               |
 (also: NEW > 7 days ----> PENDING_WARNING)----+
```

### State definitions

- **NEW** — entry file exists in `inbox/{machine}/` root (not in any reserved subdir). Created by a peer machine write.
- **FLAGGED** — schema validation failed. Entry moved to `inbox/{machine}/_flagged/` with an adjacent `.reason.md` explaining what was wrong. Peer machine is expected to read the flag, correct the entry, and re-submit.
- **STAGED** — schema validation passed. A patch-candidate exists in `inbox/rocinante/_curator_staging/{run-timestamp}/{entry-id}.patch.md`. This state is transient within a single curator run; it never persists across runs unless the run crashed (see Recovery).
- **DEFERRED** — phase 2 verify caught a race condition on the target file. Entry stays in NEW for the next run. The curator log records the deferral reason.
- **APPLIED** — phase 3 commit wrote the canonical update and moved the entry to `inbox/{machine}/_processed/{YYYY-MM-DD}/`. The curator log includes a line for the apply.
- **ARCHIVED** — entry rolled up into `inbox/{machine}/_archive/{YYYY-WW}.md` and deleted from `_processed/`. Weekly archives live indefinitely.
- **PENDING_WARNING** — entry has been in NEW state for more than 7 days without being applied, flagged, or deferred into a loop. A WARNING appears in the curator log and a pointer in `data/SYSTEM-STATE.md`.

## Transition rules

| From → To | Trigger |
|---|---|
| (none) → NEW | Peer machine writes an entry file |
| NEW → FLAGGED | Schema validation fails in phase 1 |
| NEW → STAGED | Schema validation passes in phase 1 |
| STAGED → APPLIED | Phase 3 commits successfully |
| STAGED → DEFERRED | Phase 2 verify fails (race, conflict, unverifiable) |
| STAGED → (cleanup) | Run completes; staging directory removed |
| DEFERRED → NEW | Entry never actually moves; "DEFERRED" is a label on the curator log, not a filesystem state |
| NEW → PENDING_WARNING | Entry mtime > 7 days old at phase 1 scan time |
| APPLIED → ARCHIVED | Sunday 23:00 weekly roll finds `_processed/{date}/` older than 30 days |
| FLAGGED → NEW | Peer deletes or replaces the flagged file with a corrected version |

Note: DEFERRED is an event category, not a persistent state — the file physically stays in NEW and the curator log records that this pass did not apply it.

## Schema contract for inbox entries

Required frontmatter fields:

- `id` — globally unique entry id. Convention: `{machine}-{timestamp}-{short-slug}` (e.g., `gpuserver1-2026-04-12T14-00-00Z-monitoring-sweep`).
- `origin` — the machine that wrote the entry (hostname).
- `author` — the agent or subsystem that wrote it (e.g., `run_monitor.sh`, `pricing-cron`, `gpu-ops`).
- `created` — ISO 8601 timestamp with timezone (e.g., `2026-04-12T14:00:00Z`).
- `target` — path to the canonical file this entry proposes to update (e.g., `sartor/memory/machines/gpuserver1/MISSION.md`) OR the special value `inbox-only` if the entry is informational and does not target any canonical file.
- `operation` — one of `append`, `replace`, `patch`, `propose`, `report`. `append` appends to the target. `replace` replaces a section (requires `section`). `patch` applies a named patch. `propose` is advisory (curator does not apply but logs and surfaces). `report` is a routine-type update that aggregates.
- `priority` — one of `p0`, `p1`, `p2`, `p3`.

Optional frontmatter fields:

- `type` — `routine` or `event`. Missing defaults to `event`.
- `section` — for `replace` operations, the section name to replace.
- `field` — for frontmatter-only updates, the frontmatter field to update.
- `value` — for frontmatter-only updates, the new value.
- `escalate` — `true` or `false`. `true` promotes to p1 treatment regardless of priority.
- `related` — list of wikilinks for curator context.

A missing required field moves the entry to FLAGGED with a reason note at `_flagged/{entry-id}.reason.md`. Multiple missing fields are listed together; the reason note is plain markdown for peer readability.

## Retention ladder

| Stage | Location | Retention | Cleanup process |
|---|---|---|---|
| NEW | `inbox/{machine}/` root | Unbounded (but 7-day pending warning) | Curator moves on apply/flag |
| FLAGGED | `inbox/{machine}/_flagged/` | Unbounded | Peer re-submits or Alton clears |
| STAGED | `inbox/rocinante/_curator_staging/` | Single run | Cleaned on commit success; orphan cleanup on next run |
| APPLIED | `inbox/{machine}/_processed/{YYYY-MM-DD}/` | 30 days | Sunday weekly roll moves to ARCHIVED |
| ARCHIVED | `inbox/{machine}/_archive/{YYYY-WW}.md` | Indefinite | Git history is deep archive |
| Curator logs | `inbox/rocinante/_curator_logs/` | 90 days raw, then weekly rollup | Monthly curator housekeeping |

## Priority escalation ladder

Priority determines the curator's immediate action beyond the base "apply to target" flow.

- `p0` emergency — peer machine is contracted (§7.1) to ALSO write a pointer to `data/SYSTEM-STATE.md` directly, bypassing the curator for latency. The curator's job on p0 is to verify the pointer exists and log the run. If the pointer is missing, the curator writes it and records a WARNING that the peer skipped its direct-write contract.
- `p1` this-cycle — curator writes a pointer line to `data/SYSTEM-STATE.md` in phase 3. The next morning briefing reads `SYSTEM-STATE.md` and surfaces all p1 items. Alton sees the entry within one cycle (max 12 hours).
- `p2` routine — apply and log. No pointer.
- `p3` backlog — apply and log. No pointer. Not surfaced until a topic review touches the target.
- `escalate: true` — any priority is promoted to p1 treatment.

## Acknowledgment semantics

Peer machines use the **curator log** as the acknowledgment channel. The contract:

1. Peer writes an entry at time T.
2. Curator runs at time T+N (N ≤ 12 hours for normal cadence).
3. Curator log at `inbox/rocinante/_curator_logs/curator-log-{run-timestamp}.md` contains a line for every entry seen, with its final state (APPLIED, FLAGGED, DEFERRED, PENDING_WARNING).
4. Peer reads the latest curator log for its origin on its own schedule. Peer does NOT wait for acknowledgment before writing the next entry.
5. If a peer entry is not in the curator log by T+24 hours, the peer may escalate by writing a new entry with `escalate: true` and `priority: p1` referencing the missing id.

The peer contract is **write-and-forget**. The curator contract is **log-everything**.

## Heartbeat semantics

Each peer machine writes `inbox/{machine}/_heartbeat.md` on a schedule defined in its MISSION (gpuserver1: every 2 hours with the monitoring sweep). The heartbeat file contains:

```markdown
---
heartbeat: 2026-04-12T14:00:00Z
machine: gpuserver1
---

# gpuserver1 heartbeat

- listing: active
- rental_state: rented / available / interruptible
- gpu_temp_c: 64
- disk_pct_used: 42
- last_monitoring_run: 2026-04-12T14:00:00Z
```

The curator reads this on every pass and computes age. Thresholds:

- Age ≤ 4 hours: fresh. No action.
- Age 4–8 hours: stale. WARNING in curator log and pointer to `data/SYSTEM-STATE.md` pointing at the stale heartbeat.
- Age > 8 hours: dead. Upgraded to `escalate: true` equivalent; morning briefing surfaces as critical.

A missing `_heartbeat.md` is equivalent to age > 8 hours.

## Drift detection (confabulation layer 2)

For every entry processed, the curator compares `frontmatter.created` to the file mtime on disk. A drift greater than 5 minutes in either direction flags the entry for review in the curator log but does NOT block application — the curator still processes the entry, since false negatives are worse than false positives here. Drift history is tracked across runs; three consecutive entries from the same peer with drift > 5 minutes escalates to Alton.

Rationale: honest entries have tiny drift (filesystem rounding, network lag). Confabulated entries from a language-model agent typically carry timestamps computed at generation time but written at file-creation time, producing drift on the order of seconds to minutes. Drift larger than 5 minutes is suspicious; larger than 15 minutes is strongly suspicious.

## Transactional guarantees

- **Atomicity of a commit:** the curator treats each run's commit phase as a single transaction. If phase 3 starts, it runs to completion or leaves a clearly-logged partial state. The log's `result: partial` field is the signal to the next run that recovery is needed.
- **Isolation from concurrent writers:** the hash check in phase 2 is the isolation mechanism. If another writer touches a target file between staging and commit, the affected entries are deferred. This is coarse but safe.
- **Durability:** canonical files and `_processed/` moves are the durability boundary. The curator log and the `data/SYSTEM-STATE.md` pointer are written last in phase 3. A crash between canonical update and log write leaves the canonical state correct and only the log missing; the next run's self-check catches the missing log and re-writes it.
- **Consistency:** canonical files are always valid markdown with valid YAML frontmatter. The curator refuses to commit a patch that would break either.

## Recovery procedures

### Recovery from crashed run

**Symptom:** `_curator_staging/{old-ts}/` exists without a matching curator log.

**Procedure:**

1. Next run detects orphan during phase 0 startup scan.
2. Read `_curator_staging/{old-ts}/MANIFEST.json`. Compare recorded hashes to current canonical file hashes.
3. For each target:
   - If current hash matches the pre-image hash: the commit did not reach that file. Re-stage on this run.
   - If current hash matches the post-image hash: the commit reached that file. The crashed run partially succeeded. Move the source entry to `_processed/` (if still in NEW) and log the recovery.
   - If current hash matches neither: another writer touched the file after the crash. Defer and flag for Alton.
4. Delete the orphan staging directory after analysis.
5. Write a `## Recovery` section to this run's curator log.

### Recovery from schema corruption

**Symptom:** canonical file has invalid YAML frontmatter after a curator commit.

**Procedure:** should be impossible — phase 2 verify checks this. If it happens: the curator halts, writes an EMERGENCY-level curator log, pointer to `data/SYSTEM-STATE.md`, and stops all further processing until Alton clears the condition.

### Recovery from 7-day backlog

**Symptom:** NEW entries older than 7 days accumulated because the curator wasn't running.

**Procedure:**

1. When the curator resumes, it processes entries in `created` timestamp order (oldest first).
2. Any entry older than 7 days gets a WARNING in the curator log regardless of its apply outcome.
3. A summary count of "pending_over_7d" in the curator log frontmatter makes the problem visible.
4. If the backlog is > 50 entries, the curator processes them in the current run but also writes a `BACKLOG-CLEAR-{run-ts}.md` summary to `inbox/rocinante/_curator_logs/` for Alton's review.

## Monitoring the curator itself

The curator's health is visible via:

- **Curator log cadence** — Rocinante's session-start ritual and the morning-briefing skill check that at least one curator log exists within the last 14 hours. Gap > 14 hours is a curator outage.
- **Pending-entry count** — if `entries_found - (entries_applied + entries_flagged + entries_deferred) != 0` across runs, the curator is leaking entries. Write a self-flag.
- **Staging orphan count** — orphans in `_curator_staging/` indicate crashed runs. Orphan per week is acceptable; more than one per week triggers an Alton-visible escalation.

## Cross-references

- [[memory-curator-agent]] — agent spec, tools, runtime configuration
- [[OPERATING-AGREEMENT]] §2 — the contract the curator implements
- [[MULTI-MACHINE-MEMORY]] — architectural rationale for the inbox pattern
- [[EXECUTION-PLAN]] A1–A4, B6–B7, C1 — implementation items

## History

- 2026-04-12: v1.0 created as part of OPERATING-AGREEMENT v1.0 execution (plan item A4). Prior to this the curator's behavior was folklore.
