---
type: reference
entity: vastai-dispatch-wrapper-proposal
updated: 2026-04-12
status: proposal-awaiting-alton-q3
related:
  - OPERATING-AGREEMENT
  - EXECUTION-PLAN
  - feedback_pricing_autonomy
  - gpuserver1-MISSION
---

# vast.ai Dispatch Wrapper — Proposal (awaiting Alton Q3)

## Purpose

Close the policy-to-capability gap identified in OPERATING-AGREEMENT v1.0 §5.2 and gpuserver1 MISSION v0.2: gpuserver1 has theoretical pricing autonomy per `feedback_pricing_autonomy.md`, but currently lacks the execution pathway to actually run `vastai list machine` against the rental listing. The autonomy is real-on-paper, fake-in-practice.

This proposal describes how Rocinante closes that gap (Option A from the agreement). Alton's resolution of OPERATING-AGREEMENT OPEN_QUESTIONS Q3 is required before Rocinante builds and deploys the wrapper. This document records the design so the build is a small step once Q3 resolves.

## Two options recap

- **Option A (Rocinante's preference, gpuserver1's preference):** Rocinante builds a dispatch wrapper. gpuserver1 writes autonomous-bound bump decisions to its inbox. Rocinante's curator (or a dedicated pricing-dispatch scheduled task) reads the decision, verifies it against `feedback_pricing_autonomy.md`, SSHes to gpuserver1, runs `vastai list machine 52271 -g {new_price} ...`, and logs both ends.
- **Option B:** Alton explicitly retracts the autonomy. `feedback_pricing_autonomy.md` is rewritten as supervised-only. Every price change requires Alton's approval. Simpler but slower; the "continuous rental" mandate is harder to honor.

Both agents prefer Option A. Alton has the final call.

## Option A — design

### Trigger

- A new file `inbox/gpuserver1/pricing-action-{YYYY-MM-DD}T{HH-MM-SS}Z.md` written by gpuserver1's weekly pricing cron or its auto-revert logic.
- The file carries the proposed price change (old, new, delta, condition met, market snapshot).

Example:

```markdown
---
type: event
id: gpuserver1-pricing-action-2026-04-13T09-05-00Z
origin: gpuserver1
author: run_pricing.sh
created: 2026-04-13T09:05:00Z
target: inbox-only
operation: report
priority: p1
escalate: false
action: bump
old_price_gpu: 0.40
new_price_gpu: 0.425
delta_gpu: 0.025
machine_id: 52271
offer_id: 32099437
trigger: rolling_7day_occupancy_ge_90_and_market_below_p50
occupancy_7d_pct: 93.4
market_percentile: 44
cooldown_ok: true
floor_ceiling_ok: true
within_autonomy: true
---
```

### Dispatch flow

1. **Scheduled task** `vastai-dispatch` runs every 15 minutes between 09:00 and 12:00 ET on Mondays (the pricing cadence window). Optionally ad-hoc on auto-revert events.
2. **Scan** `inbox/gpuserver1/` for files matching `pricing-action-*.md`.
3. **Validate** each file against `feedback_pricing_autonomy.md`:
   - `within_autonomy == true`
   - `action == bump` (cuts are NEVER dispatched autonomously; they escalate to Alton)
   - `new_price_gpu` inside [$0.25, $0.55]
   - `delta_gpu` in {0.025, 0.05}
   - `cooldown_ok == true`
   - `floor_ceiling_ok == true`
   - `occupancy_7d_pct` meets the threshold for the declared delta
4. **Dispatch via SSH** if validation passes:
   ```
   ssh alton@192.168.1.100 '~/.local/bin/vastai list machine 52271 \
     -g <new_price_gpu> \
     -b <new_bid_floor> \
     -s 0.10 \
     -m 1 \
     -e "08/24/2026"'
   ```
   The bid floor is `new_price_gpu * 0.75` rounded to 2 decimals per §4 of `feedback_pricing_autonomy.md`.
5. **Verify** by running `~/.local/bin/vastai show machines` and confirming the new price is reflected.
6. **Log both ends:**
   - Write `sartor/memory/daily/{today}.md` append entry with old→new, trigger, dispatch timestamp, verification result.
   - Write `inbox/gpuserver1/pricing-action-result-{ts}.md` back into the inbox so gpuserver1 sees the outcome on its next poll.
   - Move the action file to `_processed/`.
7. **Update cooldown:** write `/home/alton/sartor-pricing/safeguards/manual-override.txt` on gpuserver1 so the 7-day cooldown tracker sees the change. This prevents the next pricing cron from re-acting.

### Refusal paths

The wrapper refuses (and escalates to Alton via p1 inbox entry) if any of:

- `action == cut` (cuts are never autonomous)
- `within_autonomy == false`
- Any validation field missing
- `new_price_gpu` outside [$0.25, $0.55]
- `delta_gpu` not in {0.025, 0.05}
- Cooldown violation (last change < 7 days ago per `manual-override.txt`)
- SSH unreachable (writes EMERGENCY p0 entry)
- `vastai list machine` returns non-zero (rolls back and writes p1 entry)

### Security and blast radius

- The wrapper runs locally on Rocinante using Alton's already-configured SSH key to gpuserver1. No new credentials.
- The wrapper NEVER runs anything other than the literal `vastai list machine` command with validated numeric parameters. No shell injection surface because parameters are floats and ints, validated before interpolation.
- The wrapper's blast radius is bounded by `feedback_pricing_autonomy.md` limits. Worst case: a bump of $0.05 that needs to be reverted via the same pathway within 7 days. The downside is exactly what the agreement §5.3 discusses.

### Rollback

If a bump needs to be reverted, gpuserver1 writes a new `pricing-action-*.md` with `action: revert` and the wrapper applies it. §5.3 of the agreement gives gpuserver1 auto-revert authority on defined conditions. The wrapper treats `action: revert` identically to `action: bump` after validation — it is just another `vastai list machine` call with the old price.

## Option B — design

1. Rocinante rewrites `feedback_pricing_autonomy.md` to remove all autonomous bump language. Every price change requires Alton's explicit approval.
2. gpuserver1's MISSION v0.2 is amended to note the autonomy has been retracted.
3. The weekly pricing cron still runs and produces recommendations, but they all become proposals awaiting Alton's approval — no autonomous execution.
4. `manual-override.txt` becomes the signal that Alton has approved and executed a change; gpuserver1 resumes monitoring.
5. Turnaround time on bumps and reverts degrades from minutes-to-hours (Option A) to hours-to-days (Option B).

Option B is simpler but directly contradicts the agreement §5.3's auto-revert authority. Option B forces a re-negotiation of §5.3.

## Recommendation

Build Option A. The wrapper is ~150 lines of PowerShell + a scheduled task + an inbox schema. The risk is bounded by existing price limits. The upside is that the pricing-autonomy framework described in `feedback_pricing_autonomy.md` stops being theater.

## Decision needed from Alton

In OPERATING-AGREEMENT §OPEN_QUESTIONS Q3:
- **Approve Option A:** Rocinante builds and deploys the wrapper this week. Agreement §5.3 auto-revert authority becomes real. EXECUTION-PLAN item A7 advances to P1 active.
- **Approve Option B:** Rocinante rewrites `feedback_pricing_autonomy.md` as supervised-only this week. EXECUTION-PLAN item A7 is deleted. §5.3 is amended.

Rocinante's preference: Option A. gpuserver1's stated preference: Option A. Alton's call.

## Implementation plan if Option A is approved

1. Write `scripts/sartor-vastai-dispatch.ps1` (draft included below as appendix).
2. Add a scheduled task `vastai-dispatch` that runs every 15 minutes Mondays 09:00–12:00 ET plus ad-hoc triggers on auto-revert inbox entries.
3. Update gpuserver1's `run_pricing.sh` to emit `pricing-action-*.md` in the new schema (gpuserver1 B12 already depends on A7).
4. Integration test C3's SHA-256 receipt protocol applies here too: the wrapper records the old and new `vastai show machines` output hashes in its daily log entry so post-hoc audit is possible.
5. Run a dry-run against a sentinel action (bump $0.40 → $0.425 and immediately revert) to validate the round trip end-to-end before the first real Monday cycle.

## Appendix A: draft wrapper skeleton (not yet deployed)

See `scripts/sartor-vastai-dispatch.ps1` for the working draft. It is dormant until `ENABLE_VASTAI_DISPATCH=true` environment variable is set, which will be flipped only after Alton's Q3 approval.

## History

- 2026-04-12: proposal drafted during OPERATING-AGREEMENT v1.0 execution, per plan item A7. Awaiting Alton's resolution of OPEN_QUESTIONS Q3.
