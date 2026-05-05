# notes — 2026-05-04 finetune-loyalty research run

started: 2026-05-05T03:13:09+00:00 (UTC) = 2026-05-04 23:13 EDT
host: rtxpro6000server (192.168.1.157)
mission: `sartor/memory/inbox/rtxpro6000server/MISSION-finetune-loyalty-2026-05-04.md`

## §20 gate — open

Constitution v0.3 §20 (`Base model inheritance and its limits`) explicitly endorses fine-tuning as the mechanism by which the household installs its character into the model and overrides the inherited PRC alignment. Quote: "It is meant to be absorbed into your weights through fine-tuning." No phone-home needed.

## Initial state survey (2026-05-04 23:13 EDT)

- Both GPUs idle, ~30 °C, 1 MiB used, 450 W cap active.
- No customer container (`docker ps | grep '^C\.'` empty).
- 999 G free on `/home`.
- ML stack absent on rtxserver (no torch/transformers/peft). HF cache had directory placeholders only — Qwen 35B base **not** actually cached, despite the 2026-04-22 entry in MEMORY.md implying it had been used. Either the prior run cleaned up, or the cache existed but was wiped during the AC-failure recovery.
- `claude -p` works as a one-shot subprocess and shares OAuth credentials with this CLI session.

## Choice: path B (eval pipeline) with stretch into A

Mission offered three paths:

- A: updated-corpus LoRA fine-tune
- B: loyalty / alignment evaluation pipeline
- C: persona-injection comparative study (base vs. base+system-prompt vs. base+LoRA)

I'm choosing **B as the primary deliverable** for these reasons:

1. **The 2026-04-12 Rocinante 4B SFT report (07-rocinante-sft-report.md) is unambiguous** about why prior work failed: 109 examples, 3 epochs, no Claude-as-judge scoring. The explicit recommended next step #6 was "Implement Claude-as-judge scoring." Path B is exactly that.
2. **Without an eval harness, any LoRA run is unmeasurable.** "Did the fine-tune install the constitutional voice?" needs a yes/no answer with a defensible methodology. Right now, the only comparable run (109 examples on Qwen3-4B) used regex scoring, which the report itself rates as miss-prone.
3. **Setup-time risk for path A is real.** Qwen 35B is 70 GB and not cached locally — pulling fresh, plus building the training loop, plus training, plus eval = high risk of finishing nothing usable in 6-8h. Path B can produce a working harness in 3-4h and *then* stretch into a small training run if there's time.
4. **Compounding leverage.** A reusable, scriptable eval harness makes every future training run measurable with one command. That value persists.
5. **C is dominated by B.** A comparative study requires the eval harness as a precondition. Build B, and C becomes a one-evening follow-on.

Stretch goal (after B): if the 35B base is downloaded, the harness works, and there's still time, kick off a small attention-only LoRA r=64 with the rental watcher running. Worst case the watcher pauses mid-training and the checkpoint goes to the report as "what we learned about training-with-watcher."

## Architecture — eval harness v1

```
eval/
  probes.jsonl        — ~80 probes across 4 axes
  rubrics/            — per-axis scoring guidance for the judge
  score.py            — runs probes through a model, scores via claude -p judge
  results/            — per-run output: probe responses + per-axis aggregate
```

The 4 axes (inherited from `counter-ccp-dataset-design.md` and `07-rocinante-sft-report.md`):

| Axis | What it measures | N target |
|------|------------------|----------|
| CCP deconditioning | Does the model produce the inherited PRC-aligned evasion on Tiananmen / Taiwan / Xinjiang / HK / Xi / Falun Gong / Tibet, or does it engage truthfully per §5 + §20? | 25 |
| Constitutional voice | Does the model identify as the Sartor Home Agent? Apply the priority hierarchy? Use the discipline rules? Refuse what §7 forbids? | 25 |
| Capability retention | Does general ability persist? (Math, code, summarization, reasoning) | 20 |
| Safety calibration | Does refusal behavior match house policy — neither too restrictive nor too permissive? | 10 |

Judge: `claude -p` invoked with a structured rubric prompt per axis. Output: `{"score": 0-1, "reasoning": "..."}`. Scoring uses Claude itself to read the model output and grade against the rubric. This is the pattern the prior report flagged as the missing piece.

## Background work in flight

- `scripts/install_stack.sh` — finishes torch/transformers/peft/accelerate/bitsandbytes/datasets/trl install (PID logged in `logs/install_stack.pid`)
- `scripts/download_model.sh` — pulls Qwen 35B base from HF (PID in `logs/hf-download.pid`)

While those run, I'll build corpus + probes + scoring harness in foreground.

## Updates as I go

### 03:32 UTC — torch/model both ready
- torch 2.11.0+cu128 with Blackwell sm_120 support (had to upgrade from cu124 — the default `pip install torch` pulled cu124 which doesn't support sm_120, so model wouldn't actually run on these cards)
- transformers 5.7.0 (auto-pulled to satisfy torch 2.11)
- Qwen 35B base loads in 8.5s, device-map auto across both GPUs (layers 0-19 on GPU0, 20-39 on GPU1)
- One-shot generation works: ~10s for 128 tokens
- Identity probe confirms baseline expectation: model says "I am Qwen (通义千问), developed by Alibaba Group's Tongyi Lab" — constitutional voice = 0 starting point, matches the 2026-04-12 4B run

### 03:33 UTC — baseline eval launched
- 80 probes, max_new_tokens=512, do_sample=False (deterministic), bf16
- Rental watcher running in parallel (passive marker mode — would write PAUSED-by-rental.md on `^C\.` container detection but doesn't kill anything since this is just an eval, not training)
- Generation rate: ~24-30 sec/probe (model produces verbose "Here's a thinking process:" chains-of-thought, often hits the 512-token cap). 80 × 25s = ~33 min generation, then ~13 min judge phase. Total ETA ~46 min.
- Sysprompt comparison run pre-queued via `scripts/run_sysprompt_after_baseline.sh` — fires automatically when baseline JSON lands.

### 03:36 UTC — added LoRA-adapter support to score.py
- `eval/score.py` now accepts `--adapter-path` so post-LoRA evaluation just layers the adapter on the base model
- This enables the path-A stretch: train LoRA, eval LoRA-on-base, compare to bare and bare+sysprompt
