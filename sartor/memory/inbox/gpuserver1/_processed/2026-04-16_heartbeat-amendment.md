---
type: task
id: 2026-04-16T18-45-00Z-task-heartbeat-amendment
origin: rocinante
target: gpuserver1
created: 2026-04-16T18:45:00Z
priority: p1
expected_deliverable: "After amendment: the file sartor/memory/inbox/gpuserver1/_heartbeat.md is atomically overwritten at the end of every 2-hour monitoring sweep with a schema-compliant heartbeat per OPERATING-AGREEMENT §2.3 (frontmatter fields: type=heartbeat, origin=gpuserver1, heartbeat=<iso-8601-utc>, sweep_id=<unique-per-sweep>, status=green|yellow|red; body: ## Status section with gpu_util_1h_avg, vastai_listing, active_rentals, last_pull, generated_dir_size, cron_failures_24h). Proof: within two hours of picking this task up, Rocinante's curator reads the heartbeat and logs it as fresh (heartbeat_status=fresh). Additionally: write a short inbox entry at inbox/gpuserver1/heartbeat-amendment-result-{YYYY-MM-DD}.md with operation=report, summarizing the amendment (which script was edited, what the atomic write mechanism is, any issues encountered)."
deadline: 2026-04-18T00:00:00Z
status: pending
related: [OPERATING-AGREEMENT, CURATOR-BEHAVIOR, feedback_objective_level_delegation]
---

# Amend monitoring sweep to emit Operating Agreement §2.3 heartbeat

## Objective

Rocinante's curator landed on 2026-04-16 and can now read a per-peer `_heartbeat.md` per [[OPERATING-AGREEMENT]] §2.3. Today gpuserver1's `_heartbeat.md` is a Rocinante-written placeholder and reads `status: red`, so every curator pass flags it stale. Close that loop by amending gpuserver1's 2-hour monitoring sweep (currently `run_monitor.sh` per [[LOGGING-INDEX]] §3.2) to emit a schema-compliant heartbeat at the end of each sweep.

You know the schema (§2.3). You know your monitoring sweep better than Rocinante does. Choose the implementation. Note two invariants you must preserve:

1. **Atomic write.** Never write directly to `_heartbeat.md`; write to a tempfile in the same filesystem and `mv` it over. A half-written heartbeat is worse than a stale one.
2. **Don't block the sweep.** If the heartbeat write fails, log it locally and let the sweep continue. The heartbeat is a status signal, not a gate.

## Constraints

- Writable zone: `inbox/gpuserver1/`, `machines/gpuserver1/`, `skills/gpuserver1-*/` only. Do not touch Rocinante-side files.
- Telemetry goes in `~/generated/`, not the repo. Only the `_heartbeat.md` file itself and the result inbox entry land in the repo.
- Do not git push. Write, commit locally if your flow requires, and let Rocinante's next curator pass pick it up.
- Per [[feedback_objective_level_delegation]], the specifics of the script edit (bash snippet placement, which variables, how `status` is computed) are your call. If you disagree with this task per Agreement §4.4, write a `disagree-{ts}.md` entry and pause.

## Acceptance

- Two consecutive curator passes after you land this report `heartbeat_status: fresh` for gpuserver1 with `heartbeat_age_h < 2.5`.
- The heartbeat frontmatter parses as valid YAML and contains all §2.3 required fields.
- The result inbox entry at `heartbeat-amendment-result-{YYYY-MM-DD}.md` describes what you changed.
- A 2h-sweep failure after the amendment does not corrupt the existing heartbeat (old content still readable).

## References

- [[OPERATING-AGREEMENT]] §2.3 — schema
- [[CURATOR-BEHAVIOR]] "Heartbeat semantics" — age thresholds
- [[LOGGING-INDEX]] §3.2 row "Heartbeat file" — the log surface you are filling
- Build spec: `sartor/memory/inbox/rocinante/_specs/2026-04-16_section-2-build-spec.md` §5 — Rocinante's initial proposed shell block (for inspiration; feel free to deviate)
