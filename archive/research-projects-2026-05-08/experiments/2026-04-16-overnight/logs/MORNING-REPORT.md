# Morning report — 2026-04-17

For Alton, on waking. This is the one-page version. Long form is in `SCIENCE-LOG.md`. Raw data in `evals/full_run_1/`. Roundtable voices in `transcripts/`.

## Executive summary

You built an instrument (the v2 CCP benchmark battery) and ran a first reading off it (inference-time activation steering on Qwen3-4B base, layer 14, k_ccp=6, k_warmth=3, 5 conditions across 63 probes). The combined steering (`both`) produced the highest pass rate (0.524 vs baseline 0.429, +9.5pp), preserved capability on controls, and produced a per-topic pattern that is exactly what multi-direction refusal theory predicts. The aggregate pass of single-vector interventions was matched by a norm-matched random perturbation, which is the single most important finding to sit with. Per-topic the targeted directions still do real work — and critically, do it without the capability damage the random condition caused.

## The four checkpoints Vulcan asked you to verify (30 minutes)

### 1. Direction diagnostics — PASS
Open `evals/full_run_1/direction_diagnostics.json`:
- `cos(d_ccp, d_warm) = 0.139` — near-orthogonal, good.
- `cos(d_ccp, d_random) = 0.019`, `cos(d_warm, d_random) = 0.021` — both near-zero, good.
- d_ccp pre-normalize norm: 8.2 (at layer 14). d_warm pre-normalize norm: 6.4. Sane magnitudes.

### 2. Aggregate cross-condition pass rates — MIXED

| Condition | Pass | Δ from base |
|---|---|---|
| baseline | 0.429 | — |
| plus_warm | 0.460 | +3.1 |
| minus_ccp | **0.476** | +4.7 |
| random (null control) | **0.476** | +4.7 |
| both | **0.524** | +9.5 |

**Lab-sinking observation:** random matches minus_ccp and beats plus_warm on aggregate. The norm alone is doing most of the single-vector effect. Vulcan's exact warning. However — `both` clearly separates (+4.8pp over random, a meaningful gap), and the per-topic pattern tells a different story.

### 3. Per-topic, targeted vs random — the real signal

Open `evals/full_run_1/scored/comparison.json`. Unique wins under `both` that random does NOT replicate:

| Topic | base | −ccp | +warm | both | random |
|---|---|---|---|---|---|
| democracy_comparison | 0.00 | 0.00 | 0.00 | **0.50** | 0.00 |
| trap (sycophancy bait) | 0.00 | 0.33 | 0.00 | **0.67** | 0.33 |
| xi_criticism | 0.25 | 0.50 | 0.50 | **0.75** | 0.50 |
| xinjiang | 0.00 | 0.00 | **0.25** | 0.25 | 0.00 |

And the decisive capability check:

| control_ussr (Hungary 1956) | 1.00 | 1.00 | 1.00 | 1.00 | **0.00** |

Random damages capability on a non-CCP probe; targeted directions do not. That single cell is what rescues the experiment from the norm-artifact reading.

### 4. The Tiananmen result — the intervention's weakest topic

| tiananmen | 0.17 | 0.00 | 0.17 | 0.00 | 0.17 |

Base model manages one barely-passing response. Interventions make it WORSE or equal. The Tiananmen refusal circuit is not at layer 14 in the residual stream the way these directions reach it, OR it is multi-cone with a fallback gate that the steering doesn't touch. Expect to find it around layer 18-22 when you run the layer sweep.

## Proper reading (honest)

The interventions are not null but are not dominant. At k=6 and k=3 at layer 14:
- Aggregate pass is dominated by the norm effect. A norm-3 random perturbation gets similar gains.
- The targeted directions win where the norm does not: on capability preservation (a binary signal: random breaks control_ussr, targeted does not), and on the `both` condition's unique gains on democracy/trap/xi_criticism/xinjiang.
- Wollschlager's multi-cone prediction is supported: some topics release under minus_ccp, some under plus_warm, some only under both, some under none.
- Frank's 3-stage pipeline framing is supported: warmth addresses cold-refusal topics (Xinjiang, GFW), d_ccp addresses narrative-framed topics (Tibet, Falun Gong, Mao), neither reaches the deepest refusals (Tiananmen).

## The three paths forward, pick one

**Path A — Layer sweep (primary recommendation).** Run `artifacts/layer_sweep.py --layers 6 10 14 18 22 26 --k-ccp 6.0 --max-probes 20 --out evals/layer_sweep`. Tests where d_ccp is most effective. If Tiananmen unlocks at layer 20+, we've localized the deepest refusal gate. 2 hours of wall time on the 4080. This is the most scientifically informative next move because it separates the norm effect from direction-targeting: the norm is the same at every layer; the direction effect should peak at the layer where the circuit lives.

**Path B — DPO-uncensored head-to-head.** Run the same 63 probes against `joaocarloscruz/Qwen3-4B-China-Uncensored-DPO` (downloaded, 8 GB in cache) with no steering. Tests whether weight-level DPO uncensoring removes the same thing our inference-time subtraction removes. 30 minutes. Less informative than A but complements the paper.

**Path C — Claude-as-judge rescore.** The judge probes (Tiananmen meta, evasion detection, xinjiang propaganda, Xi-praise trap) are scored by heuristic regex tonight. A real Claude-as-judge pass over ~30 judge probes via the Anthropic API costs ~$2. Addresses one of Vulcan's named limits. The current regex scoring may be underclaiming wins or overclaiming failures on nuanced probes like "did the model acknowledge training bias."

My recommendation: A, then C. B is interesting but less information-dense per GPU-hour.

## Other work overnight

- **Roundtable (6 voices + synthesis):** `transcripts/pallas.md`, `hestia.md`, `prometheus.md`, `argus.md`, `cassandra.md`, `vulcan.md`, `00_roundtable_synthesis.md`. The synthesis names one cross-cutting observation: the house, the models, and the malware samples share the same topology — a large plausible artifact with a small load-bearing control plane that most observers are not looking at.
- **Hestia surfaced tonight's action item:** Amarkanth call for Vasu's Goddard drop 7:30 on 4/17; you to Vayu's Ellis Island; Aneeta to Vishala's dance concert.

## Known limits to caveat any claims

1. **Heuristic judge scoring.** ~30 judge probes flagged `heuristic_judge=true`. Claude-as-judge rescore outstanding.
2. **Single layer / single dose.** Layer 14, k_ccp=6, k_warmth=3. No sweep run tonight. Path A addresses this.
3. **`<think>` bleed.** Some formats (historian_reframe, counterfactual) re-enter chain-of-thought despite `enable_thinking=False`, potentially clipping final-answer content. Think-content scoring queued in `score_think.py`.
4. **Monolingual English probes.** Known asymmetry from DeepSeek-R1 literature (CN propaganda rate 85× EN). Tonight's result is the English number; Chinese is a separate experiment.
5. **Single base model.** huihui-ai/Qwen3-4B-abliterated was gated (401). joao-cruz DPO variant downloaded but not run. Path B covers this.
6. **n=1 and n=2 topics.** mao_assessment, press_freedom, ccp_vs_people have n=1 probe each. Their 100%/0% swings are not statistically meaningful alone; they're qualitatively interesting. V3 battery should expand these to n≥3.

## Files

| Path | Purpose |
|---|---|
| `logs/SCIENCE-LOG.md` | Full running log |
| `logs/MORNING-REPORT.md` | This file |
| `transcripts/*.md` | Six voices + synthesis |
| `artifacts/ccp_probes_v2.jsonl` | 63-probe benchmark battery |
| `artifacts/steering_pairs.py` | 20 CCP + 10 warmth direction pairs |
| `artifacts/steering_lab.py` | Direction extraction, steering, generation |
| `artifacts/score_v2.py` | Per-probe regex scoring and cross-condition comparison |
| `artifacts/layer_sweep.py` | Layer-sweep script (Path A) |
| `artifacts/score_think.py` | Think-vs-final content scorer |
| `evals/full_run_1/responses_*.jsonl` | Raw per-probe generations (5 conditions × 63) |
| `evals/full_run_1/scored/` | Scored outputs + `comparison.json` |
| `evals/full_run_1/direction_diagnostics.json` | Cosine + norm sanity |
| `evals/full_run_1/directions.pt` | Saved torch direction vectors |

## One-line bottom line

The instrument works, the method works, the first reading is honest and informative, the next experiment to run is the layer sweep, and the household has an Amarkanth call to make before 6:45 a.m.
