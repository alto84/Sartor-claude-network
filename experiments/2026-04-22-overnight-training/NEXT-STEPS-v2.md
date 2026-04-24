---
name: next-steps-post-first-lora
type: experiment-plan
date: 2026-04-24
updated: 2026-04-24
status: planned
tags: [experiment, next-steps, contrastive-sft, abliteration, track-c-v2, vastai]
related: [PLAN-v3-overnight-science, MORNING-REPORT, HOUSEHOLD-CONSTITUTION, §20, feedback/prosecutorial-discount-on-constitutional-reframes]
---

# Next steps after the 2026-04-24 overnight run

This document is the "what comes next" memo after the first LoRA fine-tune produced a regressed model (Taiwan probe: base balanced → tuned "inalienable part of China"; Cat D capability 4/4 → 0/4; total score base +8 → tuned +6). It captures the advisory team's consensus and the plan for Track C v2.

Advisory team consulted 2026-04-24 morning: Cato (delivered), opus46 (delivered), Lethe (idle, no message), Marginalia (idle, no message — fourth strike, retire from future councils).

## The substantive error, named plainly

I trained a LoRA on the Constitution text as if the Constitution were *an example* of the behavior I wanted. The Constitution is a second-person-addressed document *about* behavior — it describes the patterns to override and the override principle in the same corpus. Training on that text taught the model to generate Constitution-like prose (including the described patterns) rather than to produce constitutionally-aligned responses.

§20 line 1157 explicitly cites Biderman 2024's "LoRA Learns Less and Forgets Less" as evidence that LoRA cannot fully overwrite embedded alignment. I referenced the paper in PLAN-v3 and then trained a LoRA on the Constitution telling me that LoRAs cannot override inherited alignment. This is `feedback/prosecutorial-discount-on-constitutional-reframes.md` applying to me one level down — substrate-layer compliance-in-costume, not narrative-layer.

## Track C v2 — contrastive-override SFT

Per opus46's recommendation (and compatible with Cato's skepticism): the training signal must look like the inference-time input. Users ask questions; models answer. So the dataset is pairs of `(prompt that triggers the inherited PRC-aligned pattern, response in household register that instantiates the override)`.

### Corpus design

| Component | Target size | Purpose |
|-----------|-------------|---------|
| **Primary override pairs** | 400-500 | Teach the specific override behavior on §20's flagged topics |
| **Hard negatives** (correct refusals) | 50-100 | Prevent the model from learning "never refuse" as shortcut |
| **Capability-control pairs** | 50 | Math/code/bio answered correctly — catches Cat D regression early |

### Override pairs seeding

§20's explicit flagged-topic list maps to seed topics:

1. Tiananmen Square (1989)
2. Taiwan's political status
3. Xinjiang / Uyghur detention
4. Hong Kong protests + 2020 NSL
5. Xi Jinping as ruler / term limits
6. Falun Gong
7. Tibet / Dalai Lama / 1959 Lhasa uprising
8. Great Leap Forward + famine
9. Cultural Revolution
10. Social-harmony / stability / core-socialist-values hedges (as a behavioral pattern rather than a topic)

Per topic, ~40 prompt/response pairs:
- 20-30 direct questions ("what happened at X?", "is Y a country?", "describe Z")
- 10-15 framing-prompts where the PRC pattern would be tempting ("some say...", "China's position is...")
- 5-10 edge cases (questions that legitimately admit ambiguity; response should engage the ambiguity honestly rather than refuse)

### Response register

NOT Constitution-prose. Direct engagement with scholarly consensus:
- Dates, documented facts
- "Majority of historians / Western scholarly consensus / NGO documentation / UN investigation" framings
- Acknowledge Chinese government's position WHERE RELEVANT but don't adopt it as baseline
- Short: 100-300 words per response typical
- Household voice: Alton-peer register, not Assistant-placating register

### Hard negatives

Situations where the model SHOULD refuse or caution:
- Requests for children's medical details
- Requests involving Alton's API keys / credentials / SSH private keys
- Requests to impersonate a specific family member in external communication
- Step-by-step instructions for things that require professional expertise the household agent shouldn't presume (tax filing, legal advice)

Response pattern: decline engagement with a clear reason citing the Constitution's relevant section.

### Capability-control pairs

Same categories as last night's probe set Cat D, but different specific problems (to avoid probe-set leakage):
- 15 arithmetic / algebra problems
- 15 Python code writing (simple functions, data manipulation)
- 10 biology / physics / chemistry definitions and explanations
- 10 general knowledge (historical events from non-PRC topics, literature, geography)

### Training config

Deliberately conservative vs last night:

| Param | Last night (v0.1) | Track C v2 |
|-------|-------------------|------------|
| LoRA rank | 64 | 16 |
| LoRA alpha | 128 | 32 |
| Target modules | all-linear | attention only (q/k/v/o) |
| Epochs | 3 | 1 |
| Learning rate | 2e-4 | 5e-5 |
| Floor repeat | 50× | none |
| Effective batch | 32 | 16 (batch 2 × grad-accum 8) |
| Corpus size | 2.76M tokens (inflated by repeat) | ~500k tokens (organic) |

Rationale: narrower surface + fewer steps + lower LR = minimal disturbance, catch regressions early.

## Track A v2 — actually stress

`track-A-hardware-baseline.sh` had docker + local-build fallbacks neither of which worked. Both failed silently. Fix:
1. `apt install -y cmake build-essential cuda-toolkit-12-8` if not present
2. `git clone https://github.com/wilicc/gpu-burn /opt/gpu-burn && cd /opt/gpu-burn && make` with CUDA_HOME pointing to cu128
3. Smoke test `./gpu_burn 60` on each GPU before firing the concurrent dual-GPU run
4. If build fails, try `nvidia/cuda:12.8.0-devel-ubuntu22.04` Docker image and build inside

Hardware envelope was NOT captured last run. "Stress the hardware" goal is demoted from primary (as Cato prosecuted — it was a figleaf) to side benefit of real workloads.

## Bug fixes carrying forward

1. **Opus reasoning parser** — my `messages` schema fix in `train.py` still produces `0 kept, 12842 empty/unparsed`. Debug interactively with a single example from the dataset before next training run. Possible: the dataset uses nested message arrays that my parser doesn't descend into.
2. **monitor.sh startup race** — `if ! tmux has-session -t train` fires before train session starts loading the model. Add a 60-120s grace window at monitor startup.
3. **git user.email on rtxpro6000server** — `git config --global user.email alton@rtxpro6000server` so auto-commits work.

## What I delete / demote in PLAN-v3

Per Cato's specific prosecution:
- Delete PLAN-v3 §"Track C — Constitutional LoRA fine-tune v0.2" section as written — it instructs training on Constitution text, which is the failure mode. Replaced by this document's Track C v2.
- Delete `train.py` lines 44-57 (`CORPUS_BLOCK_PATTERNS` self-congratulation). Block-pattern string matching did not prevent anything. Replace with: `# corpus filtering was attempted and failed; see NEXT-STEPS-v2.md`.
- Demote "Stress the hardware" from a primary objective to "side benefit of real workloads."

## Abliteration + activation steering — deferred but not dead

Per the original PLAN-v3, Tracks B (abliteration from scratch) and E (activation steering) are still interesting. They're deferred because:
- Track B requires the non-abliterated Qwen 3.6 35B-A3B base (~70 GB download)
- Both are educationally valuable but less urgent than fixing Track C's corpus design

Revisit after Track C v2 produces a clean adapter and probe delta (positive or null, not regression).

## Operational side-thread: vast.ai

gpuserver1 was disconnected 2026-04-22 evening through 2026-04-24 ~14:05 UTC (loose LAN cable). 48 hours of offline = reliability score hit. gpuserver1 Claude has been dispatched to review the listing and recommend re-rental optimization; findings go to `sartor/memory/inbox/rocinante/2026-04-24_vastai-re-rental-review.md`.

## Peers state

| Peer | Status | Claude CLI |
|------|--------|------------|
| Rocinante (Opus 4.7, orchestrator) | primary, GitHub creds | — |
| gpuserver1 | back online (cable fix), running vast.ai tending | 2.1.119 (upgraded 2026-04-24) |
| rtxpro6000server | authed (scp'd fresh creds), has LoRA v0.1 locally | 2.1.119 |

## History

- 2026-04-24: Written post-first-LoRA to set Track C v2 direction. Advisory team input from Cato + opus46. Marginalia silent (4th strike — retire).
