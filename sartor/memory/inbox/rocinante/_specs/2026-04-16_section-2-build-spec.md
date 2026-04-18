---
type: spec
id: 2026-04-16_section-2-build-spec
origin: rocinante
author: Claude (Opus 4.7)
created: 2026-04-16
target: P2-B execution
status: draft
related: [OPERATING-AGREEMENT, MULTI-MACHINE-MEMORY, MEMORY-CONVENTIONS]
---

# Operating Agreement §2 Build Spec

Concrete plan for the inbox/curator infrastructure agreed on 2026-04-12 but never implemented. Scope: directory scaffolding, schemas, transactional curator, agent definition, heartbeat producer, scheduler hookup, rollback. Existing partial scaffolding (`_curator_logs/`, `_curator_staging/`, `_processed/`, `_flagged/` under rocinante; `_archive/`, `_flagged/`, `_processed/` under gpuserver1) is preserved.

## 1. Directory tree (deltas only)

```
sartor/memory/inbox/
  gpuserver1/
    _heartbeat.md             # NEW — overwritten every 2h sweep
    _tasks/                   # NEW — Rocinante writes, gpuserver1 drains
      .gitkeep
      README.md               # schema + lifecycle pointer
    _processed/               # EXISTS — keep
    _flagged/                 # EXISTS — keep
    _archive/                 # EXISTS — keep
  rocinante/
    _curator_logs/            # EXISTS — keep
      README.md               # NEW — log schema
    _curator_staging/         # EXISTS — keep (used as txn area, see §3)
    _processed/               # EXISTS — keep
    _flagged/                 # EXISTS — keep
    _specs/                   # EXISTS (this file)
.claude/
  agents/
    memory-curator.md         # EXISTS — REWRITE (see §4)
  scheduled-tasks/
    inbox-curator/            # NEW — twice-daily wrapper
      SKILL.md
sartor/memory/
  reference/
    CURATOR-BEHAVIOR.md       # NEW — staging, txn, retention, failures
  curator.py                  # NEW — drain logic (separate from autodream.py)
```

`autodream.py` stays as-is for daily-log → topic-file consolidation. `curator.py` is new and only handles inbox draining. Two engines, one agent invokes both.

## 2. Frontmatter schemas

### 2.1 `_heartbeat.md` (gpuserver1 overwrites every 2h)

```yaml
---
type: heartbeat
origin: gpuserver1
heartbeat: 2026-04-16T14:00:00Z
sweep_id: sweep-2026-04-16T14-00-00Z
status: green                  # green | yellow | red
---

## Status
- gpu_util_1h_avg: 87%
- vastai_listing: live
- active_rentals: 1
- last_pull: 2026-04-16T13:58:12Z (clean)
- generated_dir_size: 412MB
- cron_failures_24h: 0
```

Curator stale-check: if `now() - heartbeat > 4h`, write a `priority: p1` flag entry to `inbox/rocinante/_flagged/heartbeat-stale-{ts}.md` and pointer-write to `data/SYSTEM-STATE.md`.

### 2.2 Task file `inbox/gpuserver1/_tasks/{id}.md`

```yaml
---
type: task
id: 2026-04-16T14-30-00Z-task-abc123
origin: rocinante
target: gpuserver1
created: 2026-04-16T14:30:00Z
priority: p2                   # p0 | p1 | p2 | p3
expected_deliverable: "inbox entry at inbox/gpuserver1/{id}-result.md with operation: fact and SHA-256 receipt"
deadline: 2026-04-17T14:30:00Z
status: pending                # pending | in_progress | done | refused
---

## Objective
{one-paragraph objective per feedback_objective_level_delegation.md — no step-by-step}

## Constraints
- {bound 1}
- {bound 2}

## Acceptance
- {criterion}
```

gpuserver1 moves to `_tasks/_done/{id}.md` on completion or writes a disagreement entry per §4.4.

### 2.3 Curator log `inbox/rocinante/_curator_logs/curator-log-{ts}.md`

```yaml
---
type: curator-log
id: curator-log-2026-04-16T23-00-00Z
run_started: 2026-04-16T23:00:00Z
run_finished: 2026-04-16T23:00:42Z
trigger: scheduled              # scheduled | manual | post-commit
outcome: success                # success | partial | rolled-back
---

## Per source machine
### gpuserver1
- entries_found: 7
- entries_applied: 5
- entries_deferred: 1   # routine, aggregated
- entries_flagged: 1    # schema violation
- canonical_files_touched: [MACHINES.md, BUSINESS.md]
- heartbeat_age_h: 1.3

### rocinante
- entries_found: 2
- entries_applied: 2
- canonical_files_touched: [TAXES.md]

## Failures
none
```

## 3. Curator algorithm (transactional)

```
def drain():
  acquire_lock(LOCK_FILE, max_age=2h)
  git_pull_with_stash()
  log = open_curator_log()
  staging = mkdtemp_under(_curator_staging/)   # one txn dir per run

  for machine in inbox_machines():
    check_heartbeat(machine, log)              # flag if >4h stale

    for entry in pending_entries(machine):     # skip _processed, _flagged, _tasks, _heartbeat
      try:
        meta = parse_frontmatter(entry)
        validate_schema(meta)                  # required fields per MULTI-MACHINE-MEMORY
        verify_receipt(entry)                  # SHA-256 cross-check per §4.5

        target = canonical_path(meta.target)
        staged_target = staging / meta.target
        copy_if_absent(target, staged_target)
        apply_operation(staged_target, meta, entry.body)
        record(log, machine, "applied", entry, target)
        plan_move(entry, _processed/{date}/)

      except SchemaError as e:
        plan_move(entry, _flagged/)
        record(log, machine, "flagged", entry, reason=e)
      except ConflictError as e:
        record(log, machine, "deferred", entry, reason=e)

  # COMMIT: atomic rename of every staged file → canonical
  try:
    for staged, canonical in staging.pairs():
      os.replace(staged, canonical)            # atomic on same FS
    execute_planned_moves()                    # _processed/, _flagged/
  except Exception as e:
    rollback(staging, log)                     # canonical untouched
    log.outcome = "rolled-back"
    raise

  surface_p1_to_system_state()
  log.write()
  git_add_commit_push("curator: drain {N} entries from {M} machines")
  release_lock()

def rollback(staging, log):
  shutil.rmtree(staging)
  # canonical files were never written — no-op
  log.outcome = "rolled-back"
  # Do NOT move entries to _processed/. Next run retries.
```

**Retention**: `_processed/{YYYY-MM-DD}/` swept weekly into `_archive/{YYYY-WW}.md` rollup; rollup files keep indefinitely (git history is the deep archive). Curator log files older than 30 days roll up into `_curator_logs/_archive/{YYYY-WW}.md`.

**Stale heartbeat**: written as `_flagged/heartbeat-stale-{ts}.md` with `priority: p1` and pointer-write into `data/SYSTEM-STATE.md` so morning briefing surfaces it.

## 4. Curator agent definition

Rewrite `.claude/agents/memory-curator.md`. Frontmatter:

```yaml
---
name: memory-curator
description: Drains inboxes per §2, applies entries transactionally, runs autodream after, writes curator log. Twice daily via scheduled task.
model: sonnet
tools: [Read, Write, Edit, Bash, Grep, Glob]
permissionMode: bypassPermissions
maxTurns: 60
memory: none
---
```

Body instructions (abridged): (1) `python sartor/memory/curator.py --apply`; (2) on success, `python sartor/memory/autodream.py --force`; (3) read latest curator log, surface `outcome != success` to `data/SYSTEM-STATE.md`; (4) commit and push; (5) on push failure, write a daily-log incident entry per §1.4. **Hooks alongside autodream — does not replace it.** The current dialectic-curator behavior moves to a new `user-model-curator` agent (out of scope for this spec; tracked as a follow-up).

## 5. Heartbeat producer (gpuserver1)

Amend `~/vastai-tend.sh` (the existing 2h cron). Append a tail block that writes `inbox/gpuserver1/_heartbeat.md` atomically:

```bash
# heartbeat (Operating Agreement §2.3)
HB="$REPO/sartor/memory/inbox/gpuserver1/_heartbeat.md"
TMP="$(mktemp)"
{
  echo "---"
  echo "type: heartbeat"
  echo "origin: gpuserver1"
  echo "heartbeat: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "sweep_id: sweep-$(date -u +%Y-%m-%dT%H-%M-%SZ)"
  echo "status: $STATUS"
  echo "---"
  echo
  echo "## Status"
  echo "- gpu_util_1h_avg: ${GPU_UTIL}%"
  echo "- vastai_listing: ${LISTING}"
  echo "- active_rentals: ${RENTALS}"
  echo "- cron_failures_24h: ${CRON_FAILS}"
} > "$TMP" && mv "$TMP" "$HB"
```

Dispatch this change as a task file from Rocinante:

```yaml
---
id: 2026-04-16T15-00-00Z-task-heartbeat-amend
origin: rocinante
target: gpuserver1
priority: p1
expected_deliverable: "PR-style diff of ~/vastai-tend.sh in inbox/gpuserver1/, + first heartbeat written within 2h"
---
```

## 6. Scheduler integration

`.claude/scheduled-tasks/` is for Claude Code scheduled-task definitions. Add `inbox-curator/SKILL.md` describing the drain procedure. Hook the actual cron into Windows Task Scheduler at 06:25 ET and 22:55 ET (5 min before existing morning-briefing and nightly-memory-curation so curator output is fresh for them). Use `schtasks /Create /TN "Sartor-InboxCurator-Morning" /SC DAILY /ST 06:25 /TR "claude -p '/curate-inbox'"`. Document in `CURATOR-BEHAVIOR.md`.

## 7. Rollback story

Three layers:
1. **Pre-write**: staging area never touches canonical until atomic rename (§3). Crash mid-stage = no canonical write.
2. **Per-run**: every curator run produces exactly one git commit. Bad commit → `git revert <sha>`. Curator log identifies the sha.
3. **Per-entry**: if a single applied entry corrupts a file, the entry remains in `_processed/{date}/` for 30d. Recovery: `git revert` + move entry from `_processed/` back to its inbox + add `_flagged/` note explaining why.

Push only from Rocinante (§1) so the audit trail is single-writer. No force-push, ever.

---

**Code budget**: `curator.py` ~600 LOC, scheduled-task SKILL.md ~80 LOC, agent rewrite ~60 LOC, CURATOR-BEHAVIOR.md ~200 LOC, heartbeat shell block ~30 LOC. Total ~970 LOC, inside the 500–1500 target.

**Out of scope**: dispatch wrapper for `vastai list machine` (§5.2 Option A — separate spec), user-model-curator split, observation-syntax extractor.

---

Path written: `C:\Users\alto8\Sartor-claude-network\sartor\memory\inbox\rocinante\_specs\2026-04-16_section-2-build-spec.md`
