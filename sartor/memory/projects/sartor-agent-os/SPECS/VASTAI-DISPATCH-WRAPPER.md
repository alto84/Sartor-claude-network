---
type: spec-stub
spec_id: VASTAI-DISPATCH-WRAPPER
status: pending-alton-greenlight
plan_ref: PLAN-FINAL §3.B1, §8 question 1, §6 #5
target_path: scripts/vastai-dispatch.sh
owner: Rocinante peer Claude (execution); curator (review of dry-run logs)
updated: 2026-04-25
related: [PLAN-FINAL, HOUSEHOLD-CONSTITUTION, NEURVATI-FIREWALL, OUT-OF-BAND-FALLBACK, RTXPRO6000-PREFLIGHT]
---

# Spec — vast.ai dispatch wrapper (Option A)

Closes the policy/capability gap from PLAN-FINAL §3.B1: gpuserver1 has delegated pricing authority via `feedback_pricing_autonomy.md`, but it has no GitHub credentials and no path to actually call the vast.ai CLI from a place that is reviewed. The dispatch wrapper lives on Rocinante, watches `inbox/gpuserver1/pricing-rec-*.md`, and on bounds-valid recommendations, executes `vastai list machine` over SSH to gpuserver1. Two-week dry-run before live.

## File path

`scripts/vastai-dispatch.sh`

## Trigger

A new `inbox/gpuserver1/pricing-rec-YYYY-MM-DD-{seq}.md` file appears, with frontmatter fields: `current_demand`, `proposed_demand`, `proposed_bid`, `rationale`, `rolling_occupancy_7d`, `market_percentile`.

## Bounds enforcement (per `feedback_pricing_autonomy.md`)

- Bounds: `$0.25 ≤ proposed_demand ≤ $0.55` (hard floor and ceiling).
- **No-cuts rule (asymmetric ratchet):** `proposed_demand ≥ current_demand` UNLESS the rec is a *revert* (last bump was within the prior cycle and occupancy dropped <60% — flag `revert: true` in the rec frontmatter).
- 72h cooldown between bumps: reject any rec with `proposed_demand > current_demand` if last successful bump executed less than 72h ago.
- Discretionary cuts (occupancy <40% scenario) are **never** auto-executed; the wrapper writes the rec to the weekly report path and waits for Alton.

## Execution path (live mode)

```bash
ssh alton@192.168.1.100 "~/.local/bin/vastai list machine 52271 -g <proposed_demand> -b <proposed_bid> -s 0.10 -m 1 -e 08/24/2026"
```

Captures stdout, stderr, exit code, and post-execution `vastai show machines` snapshot.

## Logging format (matches STATE.md anti-relitigation log style)

Logs to `inbox/rocinante/_pricing-actions/YYYY-MM-DD-{ts}.md` with frontmatter:

```yaml
---
type: pricing-action
mode: dry-run | live
machine_id: 52271
trigger_rec: inbox/gpuserver1/pricing-rec-YYYY-MM-DD-{seq}.md
old_demand: 0.35
new_demand: 0.375
old_bid: 0.26
new_bid: 0.28
bounds_check: passed
cooldown_check: passed
rationale_quoted: <verbatim from rec>
ssh_exit_code: 0  # null in dry-run
ts_iso: 2026-05-01T14:22:03Z
---
```

Body includes the verbatim rec, the wrapper's bounds-check trace, and (live mode) the SSH stderr/stdout.

## Dry-run mode (default for first two weeks)

Wrapper writes "would have executed: `vastai list machine 52271 -g 0.375 -b 0.28 ...`" to the same log path with `mode: dry-run` and **does not** call SSH. All bounds checks still run.

## Exit criterion (dry-run → live)

14 consecutive days of dry-run log entries that match the pricing actions Alton would have approved manually, verified by curator review of `inbox/rocinante/_pricing-actions/`. After 14 days, Alton's chat-message yes flips `mode` default to live.

## Build dependencies

- Depends on PLAN-FINAL §8 question 1 — Alton picks Option A. Default if no answer: wrapper is not built.
- Depends on A1+A2 substrate stable (heartbeat + Gmail OAuth re-auth) before *live* execution per PLAN-FINAL §3.B sequencing; dry-run can begin once A1+A2 are minimum-stable.
- Depends on `feedback_pricing_autonomy.md` (already shipped) for bounds and ratchet rules.
- Depends on inbox/ flow from gpuserver1 → Rocinante being healthy.
- Cross-reference: log format above is what STATE.md expects to summarize in weekly stanzas; OUT-OF-BAND-FALLBACK alarm fires if SSH fails in live mode.
