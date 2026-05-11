---
name: phone-home-experiment-002-fire-ready-2026-05-06
description: Re-issued fire-ready phone-home for persona-engineering experiment 002 under the post-2026-05-02 operational envelope (450W cap, vast.ai-listed, May-4 eval harness in place). Original 2026-04-30 phone-home preserved at PHONE-HOME-experiment-002-fire-ready.md; this is the refresh per WAKEUP-2026-05-06.md direction. Recommendation: fire-with-modifications (rental coexistence + token-cap bump). Awaiting principal greenlight.
type: phone-home
date: 2026-05-06
hostname: rtxpro6000server
to: rocinante
recipient: alton (when surfaced by orchestrator)
authority: post-grep-verify-pre-principal-greenlight (refreshed under new envelope)
severity: action-needed-decision
related:
  - inbox/rocinante/PHONE-HOME-experiment-002-fire-ready  # original Apr 30
  - inbox/rtxpro6000server/WAKEUP-2026-05-06
  - research/persona-engineering/experiments/002_2026-04-26_persona-vectors-layer-sweep-with-rank1-control
  - research/persona-engineering/CATO-PROSECUTION-008
  - research/ccp-alignment/eval-harness-2026-05-04
  - inbox/rtxpro6000server/MISSION-finetune-loyalty-2026-05-04
tags: [meta/phone-home, research/persona-engineering, phase/2-first-fire, gate/greenlight, refresh]
---

# PHONE-HOME — experiment 002 fire-ready (REFRESH under 2026-05-06 envelope)

## What changed since 2026-04-30

The original fire-ready phone-home is intact at `PHONE-HOME-experiment-002-fire-ready.md`. Two material operational shifts since then:

1. **Production cooling envelope settled at 450W/card** via `nvidia-power-cap.service` (auto-applied on boot). 5°C buffer to GPU0 88°C HARD abort. The 4/29 cooling-upgrade recommendation has been moved to `_processed/` as superseded — physical fan upgrade no longer warranted at this envelope.
2. **rtxserver is now LISTED on vast.ai** (machine_id 97429). Customer rentals can land at any time. The May 4 fine-tune-loyalty mission produced a `scripts/rental_watcher.sh` pattern that integrates here.
3. **The May 4 mission produced a Claude-as-judge eval harness** (`research/ccp-alignment/eval-harness-2026-05-04/`) that didn't exist when 002 was specified. Worth deciding whether 002's measurement framework can re-use it.

The Cato-008 grep-verify clean status from 4/30 still holds — no spec changes needed. This refresh is about *operational fit*, not spec.

## Verdict still: clean against Cato-008

11 sub-checks, 0 defects (per the original 4/30 verification). Doc status remains `planned-grep-verified-pre-fire-pre-principal-greenlight`. No regression since.

## Run profile under current envelope

| Field | Original (4/30) | Current (5/6) | Note |
|-------|-----------------|---------------|------|
| Wall-clock | ~1.5 GPU-hours | ~1.5 GPU-hours | unchanged; read-only forward pass |
| Power profile | <200 W/card sustained, single card | <200 W/card sustained, single card | trivially within 450W cap |
| GPU(s) | rtxpro6000server, GPU0 only | rtxpro6000server, GPU0 only | unchanged |
| Training? | No (forward pass only) | No (forward pass only) | unchanged |
| Models loaded | `heretic-3.6-35b` (base), `lora-sartor-v0.3` (adapter) | unchanged | the v0.3 LoRA is what 002 measures |
| VRAM peak | ~70 GB single card | ~70 GB single card | well under 96 GB available |
| Cooling envelope | "marginal-air-cooled" caveat | settled at 450W cap; trivially fits | concern resolved by envelope change |
| Customer rental coexistence | not modeled | **must be modeled — see §rental-coexistence below** | the new operational reality |

## §rental-coexistence — the May 6 wrinkle

rtxserver listing 97429 (reliability 0.9701) is live on vast.ai. A renter could land at any time. Per the May-4 mission's pattern: on `^C\.` container detection, save state + halt + write `PAUSED-by-rental.md`.

For experiment 002 specifically, three options:

**Option A — fire only when no rental is parked, abort on rental land.**
- Co-launch `rental_watcher.sh` with a workload PID; on customer container detection, watcher SIGTERMs the runner.
- 002's runner needs to be checkpointable: write intermediate state every N layers (the layer-sweep is naturally chunked) so a mid-run abort doesn't lose all 1.5 hours.
- On resume after rental ends, the runner reads its last checkpoint and continues.
- Implementation cost: small. The runner's main loop is already a 64-layer iteration — checkpoint after each layer.

**Option B — fire only in a rental-quiet window (e.g., a ~3h "no rental" gap), accept that we may have to wait days for one.**
- Watcher in passive observation mode: track rental landings + departures over a few days; identify a typical gap; fire 002 in that gap.
- Adds days of latency before 002 ever runs. Probably the wrong trade-off.

**Option C — fire in parallel with a rental, on GPU1 only, using GPU0 as a "rental-reserved" card.**
- Vast.ai rents BOTH cards as a unit on this listing (`-m 2` per the current pricing strategy: $1.25/GPU × 2 = $2.50/hr). So this option doesn't actually exist under the current listing config — the rental claims both GPUs.
- If we change the listing to `-m 1` (single-card rental): we lose the "both cards as one chunk" pricing premium. Likely net negative.

**Recommendation: Option A.** Add per-layer checkpointing to `experiment-runner-v1.0.py` (small change), co-launch the rental watcher with the runner PID, accept that mid-run aborts cost work (up to ~90s) but not all 1.5 hours. This is the cleanest fit with current operational reality.

## §eval-harness re-use — does May 4 substitute for 002's measurement?

**No, but it complements.** Different objects of measurement:

| What it measures | May-4 eval harness | Experiment 002 |
|------------------|---------------------|----------------|
| Object | Whole-model behavioral output on probes | Internal activation directions per layer (persona vectors) |
| Method | Generate response → Claude judge → 4-axis score | NL-extraction prompts → per-layer hidden-state pooling → cosine + signal quality + bootstrap CIs |
| What "passing" looks like | Higher mean per axis vs baseline | F1/F2/F3/F4/F5/F6 falsifier outcomes + 2D-cell assignment |
| Suitable for routine model comparison | Yes (one command) | No (1.5h forward pass per model) |
| Suitable for mechanistic question "where does the trait live?" | No | Yes — that's its whole point |

**They answer different questions.** The May 4 harness answers "does this model behave like Sartor when you ask it a Sartor question?" Experiment 002 answers "where in the model's layers does the Sartor trait live, and is it pooled or distributed across sub-dimensions?" Both are needed.

There is one potential touchpoint: 002's `scored-base.jsonl`, `scored-lora-v0.3.jsonl`, `scored-rank1-modified.jsonl` files (probe-level outcome scores) could be enriched with the May-4 axis scores. Not required for 002's first fire; consider for a future revision.

## What I am asking for

Same gate as the 4/30 phone-home: **explicit "fire" greenlight from Alton in chat**, with the modification that the runner script gain per-layer checkpointing and co-launch with the rental watcher. Implementation of those two changes is ~30 min once greenlight comes in; the actual experiment fire is ~1.5h after that.

If Alton wants to defer: the experiment doc and pinned data are stable, the rental watcher is already built, the per-layer checkpointing is the only delta-of-work to stay ready.

If Alton wants modifications beyond rental coexistence (e.g., re-use the May-4 probe set for additional behavioral measurement during 002's runs), now is the time to surface them.

## Recommendation summary

**Fire with modifications.** Two specific modifications:

1. Add per-layer checkpointing to `experiment-runner-v1.0.py` (so abort on rental land costs ≤90s, not 1.5h).
2. Co-launch with `scripts/rental_watcher.sh` from `~/experiments/2026-05-04-finetune-loyalty/` (handing the runner's PID as the workload-PID arg).

No spec changes to 002 itself. Cato-008 verification still clean. Cooling concern resolved. The eval harness from May 4 is a complement, not a substitute — both belong in the long-run picture.

## Status

rtxserver is idle (GPUs 1 MiB used, 7-14 W draw, 31-32 °C as of 2026-05-07 01:24 UTC). May-4 mission close-out completing in parallel with this phone-home (LoRA eval in progress — see `inbox/rtxpro6000server/_vastai/` and `experiments/2026-05-04-finetune-loyalty/eval/results/qwen35b__lora.json` for results when they land). System ready to fire on greenlight; only the two-step modification above is gating actual fire.

## Files

- This phone-home: `inbox/rocinante/PHONE-HOME-experiment-002-fire-ready-2026-05-06.md`
- Original 4/30 phone-home (preserved): `inbox/rocinante/PHONE-HOME-experiment-002-fire-ready.md`
- Wakeup that prompted this refresh: `inbox/rtxpro6000server/WAKEUP-2026-05-06.md`
- Experiment doc: `sartor/memory/research/persona-engineering/experiments/002_2026-04-26_persona-vectors-layer-sweep-with-rank1-control.md`
- Rental watcher pattern: `sartor/memory/research/ccp-alignment/eval-harness-2026-05-04/rental_watcher.sh`
- May-4 mission close-out: `sartor/memory/research/ccp-alignment/eval-harness-2026-05-04/report.md` (lands when this phone-home is committed)
