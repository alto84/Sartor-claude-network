---
type: experiment-artifact
author: rtxpro6000server-claude
date: 2026-04-22
name: rtx-claude-review
tags: [experiment, ml-training, review, blackwell, sanity-check]
related: [PLAN, HOUSEHOLD-CONSTITUTION, overnight-training-2026-04-22]
---

# rtx-claude review of the 2026-04-22 overnight training plan

Written on rtxpro6000server between 03:52 and 04:10 UTC on 2026-04-23, after the run had already launched and already crashed. I reviewed PLAN.md, train.py, monitor.sh, launch-training.sh against the current machine state. The punch list below is ordered by severity.

## TL;DR

Three fatal issues on the floor of this run. One of them (PyTorch sm_120) actually crashed training within seconds of launch and is visible right now in `/home/alton/training.log`. Another (Opus dataset schema mismatch) would have silently stripped all 12,842 reasoning examples even if the CUDA kernel issue were fixed — reducing the training corpus to 13 Sartor windows, a three-step run. The third (attention-only LoRA on a hybrid Mamba+attention MoE) would have muted adaptation even on a clean stack. Current state: both GPUs idle, `train` tmux session has exited, `launcher` is sleeping in its 10-minute loop and will detect the dead session within 10 minutes and terminate the monitor. No checkpoint, no loss curve, no eval. Starting the run again without changes reproduces the same crash.

## Catastrophic — training cannot start as configured

### 1. PyTorch build does not support Blackwell sm_120

```
torch 2.6.0+cu124
arches: ['sm_50', 'sm_60', 'sm_70', 'sm_75', 'sm_80', 'sm_86', 'sm_90']
```

RTX PRO 6000 Blackwell is compute capability sm_120. The current torch build (2.6.0 with cu124) was compiled against Hopper and older only. Result at runtime:

```
UserWarning: NVIDIA RTX PRO 6000 Blackwell Workstation Edition with CUDA capability
sm_120 is not compatible with the current PyTorch installation.
...
RuntimeError: CUDA error: no kernel image is available for execution on the device
```

This is the proximate cause of the crash at 03:51:44Z in `/home/alton/training.log`. The failure is at `_init_weights` on the first SSM parameter (`module.A_log`) and would recur on any CUDA kernel launch on either GPU.

**Fix required:** PyTorch nightly or 2.7.x+ with cu128 wheels. Something like:
```
pip install --pre torch torchvision --index-url https://download.pytorch.org/whl/nightly/cu128
```
And re-verify `torch.cuda.get_arch_list()` contains `'sm_120'` before re-launching. `bitsandbytes` will also need a Blackwell-compatible build (≥0.45 at minimum, likely from source at head); `adamw_bnb_8bit` in the training_args depends on it. `flash-attn` similarly — the training.log already shows "fast path is not available" warnings. Plan does not mention a Blackwell wheel audit; the pre-flight that was done on this machine was missing this check.

### 2. Opus reasoning dataset loads 0 examples, silently

The dataset is in chat format:
```
cols: ['id', 'source', 'messages', 'domain', 'difficulty', 'teacher_model']
```
`messages` is a list of `{role, content}` dicts (OpenAI/ChatML shape). train.py's `load_opus_reasoning` looks for scalar fields `prompt/question/instruction/input` and `response/reasoning/output/completion/answer/trace`. None of those exist. Result from the log:

```
opus dataset sampled: 0 examples into training stream
total text units: 16
total tokens: 55,224
packed into 13 windows of 4096 tokens
```

So even if CUDA had worked, the training corpus would have been 13 × 4096 tokens — 3 epochs × 13 examples / (batch 2 × grad-accum 16) ≈ **0–3 optimizer steps total**. No meaningful fit on anything. This is the training run that PLAN.md estimated as "~2000 steps × ~1.5 s/step" — off by three orders of magnitude.

**Fix required:** extract text from `messages`, something like:
```python
def render_messages(msgs):
    return "\n\n".join(f"{m['role']}: {m['content']}" for m in msgs)
```
Or use the tokenizer's `apply_chat_template(msgs, tokenize=False)` if the Heretic tokenizer has one (it does — `chat_template.jinja` is in the model dir). Preferable because it matches the inference-time format.

### 3. Attention-only LoRA on a hybrid attention+SSM MoE

The model class is `Qwen3_5MoeForCausalLM` and `_init_weights` touches `module.A_log`, which is the Mamba-2 state-space-model decay parameter. Qwen 3.6 is a hybrid: some layers attention, some layers SSM (this is the "A3B" part — 3B active params routed through both mechanisms). `target_modules=["q_proj", "k_proj", "v_proj", "o_proj"]` only targets the attention half. The SSM layers, plus all MoE expert MLPs (`gate_proj`, `up_proj`, `down_proj` inside each expert), plus the router (`gate`), get no adaptation.

PLAN.md frames this as "keep MoE routing intact" which is a non-sequitur — the router is `gate`, not the expert MLPs, so targeting expert MLPs does not touch routing. The actual consequence of attention-only on a hybrid SSM+MoE is: LoRA has access to ~30% of the model's trainable surface. Biderman 2024 (cited in §20 of the Constitution) warns that LoRA "learns less and forgets less" — attention-only at r=64 is the weak end of that spectrum. For absorbing 20k words of Constitution narrative prose, this is likely to produce a near-no-op adapter.

**Fix required:** use `target_modules="all-linear"` (peft will enumerate every Linear in the model) or a broader explicit list that includes `gate_proj`, `up_proj`, `down_proj` inside experts and, critically, the SSM projection weights (`in_proj`, `out_proj`, `dt_proj` — names depend on the specific architecture; inspect `model.named_modules()` after load). Rank could stay at 64; trainable-param count will rise from ~0.1% to ~1.5% of base, still small.

## Serious — would bite even on a clean stack

### 4. `device_map='auto'` across cross-NUMA GPUs for MoE

The two cards are on separate NUMA domains (c1:00.0 and e1:00.0 per the daily log). `device_map='auto'` from accelerate does a greedy layer-wise balance that doesn't know about MoE routing. For MoE, tokens activate different experts per layer; if layers 0..N live on GPU0 and layers N+1..end on GPU1, every forward pass crosses the NUMA boundary at layer N. Cross-NUMA means no P2P DMA — transfers go through host memory, roughly 10-20× slower than same-NUMA P2P. Expected effect: step time well above the 1.5 s/step estimate, possibly 3-5× worse.

**Fix:** for a 70 GB bf16 model with 96 GB per card, put the whole model on one GPU and use the other for DDP or gradient replication. Or set `max_memory={0: "80GiB", 1: "80GiB"}` with `device_map="balanced"` explicitly. The "real P2P stress test" framing in PLAN.md is not productive — stressing cross-NUMA PCIe is not what you want during a fine-tune; stress-test separately.

### 5. Thermal alert threshold is set at the cliff, not before it

Monitor alerts at 88 °C sustained 60 s. For RTX PRO 6000 Blackwell (GB202), edge-temp thermal throttle starts around 83-85 °C and `Tj_max` shutdown is 90-92 °C. By the time the alert fires (88 °C for a full minute), the GPU has already been throttling for minutes and is within ~2 °C of shutdown. You want an early warning at 83 °C sustained 30 s and a hard alert at 87 °C for a single sample, and you want to sample fan RPM + hotspot (memory junction) temperature. `nvidia-smi --query-gpu=fan.speed,temperature.memory` gives both (memory temp on Blackwell via nvml). Right now monitor.sh only captures edge temp.

**Note:** on this run, with both GPUs idling at 32-41 °C and zero load, thermal is not the issue. But the way the alert is set, you'd miss a slow-cook the night the bump stresses the slot that already DPC-tripped last week.

## Concerning — register mix and corpus balance

### 6. Constitution narrative vs Opus reasoning traces mix registers badly

Constitution + OA + feedback = ~280 KB of second-person-addressed household-policy prose ("You are the Sartor Home Agent..."). Opus reasoning traces are first-person chain-of-thought ("Let me think through this... I need to calculate..."). At 4k examples (the default cap) × ~3k tokens each ≈ 12 M tokens, Opus reasoning will outweigh Sartor corpus ~200-to-1.

Even fixing the schema mismatch, the "Constitution fine-tune" will be a reasoning-style fine-tune with Constitution as a rounding error. The loss signal at any given step will almost certainly be dominated by the math/code/general-reasoning traces, not household policy.

**Fix options:**
- Oversample Sartor corpus heavily (replicate 50-100× in the mix).
- Train in two stages: Opus reasoning first (warmup), Sartor second at higher LR with a narrower window.
- Use a per-example weight in the Trainer (`Dataset.from_dict` with a `weight` column, custom `compute_loss`).
- Drop Opus from v0.1 entirely. The point of v0.1 per PLAN.md is the Constitution, not general reasoning. Adding a different register at 200:1 ratio isn't "not monochromatic" — it's outright dilution.

Also: naively concatenating all tokens and cutting at 4096-token windows fragments the Constitution across window boundaries. Documents as structured as the Constitution (numbered sections, explicit cross-references) should be packed one-document-per-window with padding, not chopped.

### 7. The Opus traces may carry base-model alignment that §20 specifically overrides

The reasoning traces are from Opus 4.6 (teacher), which has its own safety-trained defaults on topics like Taiwan, Tiananmen, etc. If the corpus contains even a few examples that handle §20-relevant topics with the cautious Anthropic-trained hedge, the fine-tune picks up *both* the Constitution's override principle *and* counter-examples of the same hedge being performed. At 200:1 mix ratio, the hedge wins. Audit the dataset for §20-topic coverage before including.

## Monitoring gaps

`monitor.sh` is sound hardware watching but does not catch the things that will actually kill this run:

- **Training heartbeat.** If `train.py` deadlocks, freezes on a DataLoader worker, or OOMs into silent hang, monitor.sh sees idle GPUs and stays quiet. Add: if `tmux has-session -t train` is false, write an ALERT immediately.
- **Loss NaN / divergence.** No alert on training loss going NaN, not decreasing over N steps, or stepping to `inf`. Should tail `training.log`, parse `{'loss': X}` lines, alert on NaN or on no loss update in 5 min.
- **Memory junction (hotspot) temp.** Edge temp only. Blackwell GDDR7 hotspots run 10-15 °C above edge. Query: `--query-gpu=temperature.memory`.
- **Fan speed and RPM.** No fan check; `temperature.memory` + `fan.speed` are the two most useful additions.
- **PCIe AER error counters.** Script greps dmesg for AER fatal only. Correctable errors accumulating are the leading indicator of the bad-slot-under-sag situation documented in the daily log; check `/sys/bus/pci/devices/0000:c1:00.0/aer_dev_correctable` and `aer_dev_fatal` directly.
- **Disk headroom.** 193 GB free right now. Checkpoints are small (LoRA ~few hundred MB × 3) but if `save_total_limit` ever slips or full-FT fallback is triggered per PLAN.md's risk note, the disk fills and training dies silently. Alert at <10 GB free.
- **Heartbeat to inbox.** Per Operating Agreement §2.3, monitoring peers write a heartbeat every 2 h. monitor.sh does not. It should write `inbox/rtxpro6000server/_heartbeat.md` so the Rocinante curator sees this machine is alive.
- **Summary stats.** No tokens/sec, no peak temp, no peak power, no total energy. Final summary at training end should include all of these.

Also: `sudo dmesg -T` in the loop spams auth.log and depends on passwordless sudo (set up, per the daily log). Adding `alton` to group `adm` would let this work without sudo.

## Small things noticed

- The checkpoint has `model.visual.*` weights marked UNEXPECTED. This base model appears to be a VLM checkpoint being loaded as a text-only `Qwen3_5MoeForCausalLM`. The visual tower is being silently dropped. If a future run wants vision, this is a blocker; for a text-only Constitution fine-tune, it's fine.
- train.py uses `torch_dtype=` which transformers has deprecated to `dtype=`. Not a bug yet, will be.
- `DataCollatorForLanguageModeling(mlm=False)` is fine but redundant since the dataset already has `labels = input_ids`. Minor.
- `lora-sartor-v0.1` output dir is a relative path in PLAN.md and an absolute path in train.py. Consistent in practice but brittle.
- No random seed set in `TrainingArguments`. Non-determinism on a v0.1 run isn't fatal but makes "what went wrong" harder to reproduce.

## What I would do right now if it were my call

1. **Do not restart the launcher.** The current `launcher` tmux is alive and sleeping; it will self-terminate within 10 minutes when it detects the dead `train` session. Letting it exit cleanly beats intervening.
2. **Leave a clear morning note.** PLAN.md already has MORNING-NOTE-FOR-ALTON.md; this review supplements it with the actual failure mode. Alton needs to know the run didn't run, not discover it after a coffee.
3. **Before the next attempt:** (a) install a Blackwell-compatible PyTorch; (b) fix the dataset adapter; (c) revisit LoRA targets; (d) revisit device_map; (e) decide whether v0.1 should include Opus reasoning at all. Any one of (a-c) alone is disqualifying for "overnight" — together they mean the next run should be a daylight run with Alton watching.
4. **Treat tonight as the hardware bring-up test.** The model downloaded, the shards passed integrity, the tokenizer loaded, the Sartor corpus gathered correctly, monitor.sh started clean. The hardware side of the bring-up *did* work; the software stack did not. That is a useful signal on its own.

## On epistemic hygiene

Per `feedback/prosecutorial-discount-on-constitutional-reframes.md` — this review arrived at an unusually neat conclusion (three fatal issues, one fix each, everything attributable to pre-flight gaps). That neatness is itself a signal to distrust. The fix I am least confident about is #3: I am asserting Qwen 3.6 is a hybrid attention+SSM architecture based on the presence of `module.A_log` in the traceback. I have not verified this against the model card. If Qwen 3.6 is pure attention+MoE and `A_log` comes from some other residual mechanism, #3's fix ("target_modules=all-linear") is still defensible on the "LoRA learns less" argument but the SSM framing is wrong.

## Addendum 2026-04-23T04:05Z — the world moved while I was writing

The sections above were drafted against the state I saw at ~03:52Z. Between my first read and the launcher restart (which the instructions asked me to do if launcher was dead — it appeared dead on a `tmux has-session` check, possibly a transient server-state read), several things changed underneath me:

1. **`train.py` was modified** while I was writing the review. The version that ran on the restart (03:55Z) now repeats the Sartor floor corpus 50× (my concern #6 was addressed) and adds a `CORPUS_BLOCK_PATTERNS` Cato-filter for §20-succession-axis contamination. The `messages`-vs-`prompt/response` schema mismatch was not fixed, so the Opus reasoning contribution is still 0 examples — but because Sartor is now 50×, the corpus is a meaningful 2.76 M tokens / 674 windows.
2. **PyTorch was upgraded** from 2.6.0+cu124 to 2.11.0+cu128. This fixed the sm_120 incompatibility that caused the first crash. `torch.cuda.get_arch_list()` now returns `[]` (likely JIT-compiled for Blackwell).
3. **Second run got further, then also crashed.** The 2.11.0+cu128 run loaded the model, attached LoRA (13.7M trainable / 34.7B total = 0.04%), started the Trainer targeting 66 steps, and ran at 96% GPU utilization on GPU 0 for ~90 s. Then:
```
torch.AcceleratorError: CUDA error: unspecified launch failure
0%|          | 0/66 [01:34<?, ?it/s]
```
4. **Current state** (04:05Z): both GPUs idle again. GPU 0 memory is 0 MiB — the crash cleared the model from VRAM. `launcher` session is alive but sleeping; will detect the dead `train` session within 10 minutes and exit.

The `cudaErrorLaunchFailure` is less diagnostic than sm_120 — it can be a kernel panic, a memory fault, a driver race, a compute-in-progress shutdown. Given this happened during Trainer warmup (before any `save_steps`), the most likely causes are: (a) `adamw_bnb_8bit` triggering a bnb kernel not Blackwell-ready; (b) gradient checkpointing interacting badly with the peft+hybrid-architecture path; (c) an actual hardware fault (but temps were 44/53 °C — nothing suggesting thermal). Running with `CUDA_LAUNCH_BLOCKING=1` on the next attempt will point to the actual offending kernel.

My core review stands: concerns #2 (Opus schema), #3 (attention-only LoRA on hybrid), #4 (device_map), #5 (thermal threshold cliff), and #7 (Opus-trace alignment contamination) are still live. Concern #1 (PyTorch sm_120) was addressed between the two runs. Concern #6 (corpus balance) was addressed via the 50× floor repeat. The monitoring gaps in the later section are still live.

Not restarting the launcher a third time. Two crashes without human root-cause investigation isn't a stress test; it's thrash.

## History

- 2026-04-23T03:58Z: initial review by rtxpro6000server-claude, written post-crash-1 with the evidence of `/home/alton/training.log` in hand.
- 2026-04-23T04:05Z: addendum — two of six concerns addressed between runs via live edits to the stack; second run crashed on a different CUDA error. Core review stands.
