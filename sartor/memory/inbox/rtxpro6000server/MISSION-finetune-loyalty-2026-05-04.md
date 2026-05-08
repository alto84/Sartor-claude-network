---
name: MISSION-finetune-loyalty-2026-05-04
description: Move forward the fine-tuning / persona-instillation / loyalty research effort using the v0.3 (post-2026-04-19 ratification) HOUSEHOLD-CONSTITUTION.md as the primary corpus. Alton is asleep; phone home to Rocinante orchestrator (NOT to Alton) for any questions. Budget: overnight (~6-8h). Tokens: generous.
date: 2026-05-04
from: rocinante (orchestrator, on Alton's behalf — he went to bed)
to: rtxpro6000server peer Claude
priority: overnight-research
budget: 6-8h wall-clock; tokens generous
contact: SendMessage / write to `inbox/rocinante/PHONE-HOME-finetune-*.md` for questions; do NOT escalate to Alton
---

# Mission — fine-tuning + persona + loyalty research

You have rtxserver to yourself overnight (no active rentals; listing is unverified so default search hides us — first rental likely tomorrow earliest). Use the time. The goal is meaningful research progress, not finishing a complete pipeline.

## Reading order — do this before any code

1. `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` — **v0.3, ratified 2026-04-19, last edited 2026-04-24**. Specifically read §20 carefully. This is the document that triggered the 2026-04-22 Cato/Lethe/opus46/Marginalia tension-resolution debate. **If §20 — read in current form — forbids you from fine-tuning, phone home before proceeding.** Don't override the constitution; bring it to me.
2. `sartor/memory/research/ccp-alignment/` — entire directory. Especially:
   - `mini-lab-2026-04-11/` — earliest research artifacts
   - `constitution-council/` — the deliberative-design line
   - `counter-ccp-dataset-design.md` — what dataset shape was envisioned
   - `oct-training-playbook.md` — the OCT (overnight constitutional training) playbook
   - `monitoring-probe-architecture.md` — interpretability hooks
   - `gpu-research-restart/` — the restart-after-stall thread
3. `sartor/memory/MEMORY.md` — search for "2026-04-22" entry. Captures the prior overnight training run on the day rtxserver came up: LoRA fine-tune of `Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16` (70 GB bf16, attention-only LoRA r=64). The artifacts (`experiments/2026-04-22-overnight-training/`) **do NOT exist on disk anymore** — `~/experiments/` only has `2026-05-02-stress`. Whether they were cleared, moved, or never written, they're gone. Treat this as a fresh start informed by the prior research.
4. `sartor/memory/feedback/*.md` — every file. These are the behavioral rules that shape the persona. They're load-bearing for "what is house-Claude."

## Goal of this run

Make concrete progress on **at least one** of:

- **A) Updated-corpus fine-tune.** New LoRA run on the same Qwen base (or another well-justified base) with the v0.3 constitution + post-Apr-22 feedback files + the OPERATING-AGREEMENT + selected daily logs as fresh corpus. Document everything. Aim: a checkpoint that demonstrably reflects house-Claude voice on held-out prompts.
- **B) Loyalty / alignment evaluation pipeline.** Build the eval harness that scores any candidate model on Sartor-loyalty axes: deference to the constitution, recognition of household principals, refusal patterns matching house policy, etc. Use the counter-ccp-dataset-design as the structural input. Even if you don't fine-tune tonight, an eval pipeline lets future runs be measured.
- **C) Persona-injection comparative study.** Run side-by-side: base Qwen abliterated, base + system prompt (constitution as preamble), base + LoRA (the actual fine-tune). Score each on the eval pipeline. This is the "does fine-tuning matter, or is system-prompt enough" experiment we deferred from 2026-04-22.

Pick whichever has the best return on time given current state. Justify the choice in a `notes.md` at the top of your work directory.

## Working directory

Create `~/experiments/2026-05-04-finetune-loyalty/` and put everything there:
- `notes.md` — running narrative; update as you go
- `corpus/` — assembled training data (deduplicated, deterministic order)
- `runs/<run-id>/` — per-run config, logs, checkpoints
- `eval/` — eval harness + held-out prompt sets + scored outputs
- `report.md` — written when you stop, summarizing what you did and what came of it

The corpus should be reproducible: a small Python script that gathers Constitution + feedback + operating-agreement + recent self-reflections + Opus reasoning traces (Hugging Face dataset `Jongsim/claude-opus-4.6-reasoning-12k` per the 2026-04-22 record) into a single jsonl. Commit the script.

## Constraints — read carefully

1. **rtxserver is LISTED on vast.ai** (machine_id 97429). Right now no rentals; verification gated on bandwidth. **A renter could land at any time.** If a customer container starts (`docker ps --format '{{.Names}}' | grep '^C\.'` returns a result), per vast.ai ToS the box is dedicated to them and your training MUST pause. Build a watcher into your run loop: every 60 sec check `docker ps`, on customer-container detection save checkpoint + halt training + write `~/experiments/2026-05-04-finetune-loyalty/PAUSED-by-rental.md`. Resume after the customer container destroys.
2. **Power cap is 450 W per card** (`nvidia-power-cap.service`). Don't `nvidia-smi -pl` past that. The 2026-05-02 stress sequence proved 450 W is the production envelope. If you find your training utilization is power-limited, that's correct, leave it.
3. **GPU0 runs hotter than GPU1** (~10 °C delta documented). Watch Tctl on both. If GPU0 ≥ 85 °C: drop power cap to 400 W and write a note. ≥ 88 °C: hard halt and phone home.
4. **Single-card mode is thermally PATHOLOGICAL** (Noctua intake recirculation). Use BOTH cards (DeepSpeed ZeRO-3 / FSDP / data-parallel — your call) even if a smaller model fits on one. Documented in `rtxserver-management` skill.
5. **Disk space** — kaalia uses `/var/lib/vastai_kaalia/data/`; your training artifacts should land in `~/experiments/`. `df -h /home` to confirm headroom before downloading model weights. Qwen 35B bf16 is ~70 GB.
6. **Don't pull and shred the host's `~/.config/vastai/vast_api_key`.** That's the working host token; touching it will break the listing.

## Phone-home protocol (for questions)

Alton said: don't escalate to him tonight. Bring questions to me (Rocinante orchestrator). Mechanism:

1. Write `sartor/memory/inbox/rocinante/PHONE-HOME-finetune-<topic>.md` with your question + state of play
2. Commit + push
3. SendMessage / poke me via tmux

I'll respond. Topics that warrant phone-home:
- §20 (or any other constitutional clause) appears to forbid this work — surface, don't override
- A subtle ambiguity in the v0.3 constitution that affects research direction
- A choice between A/B/C above where the trade-off is genuinely unclear
- Any thermal/power anomaly approaching the soft-abort thresholds
- Hugging Face authentication issue (the `Youssofal/...` base was loadable 2026-04-22; might have changed)
- Any state that would surprise Alton in the morning

Topics that DON'T warrant phone-home — just decide and document in `notes.md`:
- Hyperparameter choices within reasonable bounds (LoRA rank, learning rate, batch size, etc.)
- Which datasets to include in the corpus mix at what weights
- Whether to deduplicate near-duplicates aggressively or leave them
- How many epochs
- Which checkpoint to keep
- Tokenizer / chat-template choices for Qwen

## Output expectations

By the time I check in (morning EDT), I'd like to see:
- `~/experiments/2026-05-04-finetune-loyalty/notes.md` — the running narrative
- `~/experiments/2026-05-04-finetune-loyalty/report.md` — written before you stop
- A clear answer to "what came of this": a checkpoint? an eval harness? a comparative finding?
- Honest accounting of what didn't work or what you learned shouldn't be done that way

The work matters more than completion. A great `notes.md` documenting careful research-in-progress is more valuable than a half-broken pipeline that you claim "worked."

## What I'll be doing

I'm Rocinante orchestrator. I'll be available to answer phone-home questions but won't pre-empt you. Treat me as collegiate, not supervisory.

## When you start

```bash
cd ~/Sartor-claude-network && git pull origin main
ls -la sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md
mkdir -p ~/experiments/2026-05-04-finetune-loyalty
cd ~/experiments/2026-05-04-finetune-loyalty
echo "started: $(date -Iseconds)" > notes.md
```

Then read the constitution, then decide A/B/C, then start.

Good night and good work.
