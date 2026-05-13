---
type: research-goal
date: 2026-05-12
updated: 2026-05-12
updated_by: rocinante (opus 4.7, 1M context — initial seed for /goal framework)
status: active
mission_slug: smaller-model-takes-household-identity
substrate_current: Qwen3.6-35B-A3B-Abliterated-Heretic-BF16
target_identity: reference/HOUSEHOLD-CONSTITUTION.md (v0.5, ratified 2026-05-06)
lines_engaged: [ccp-alignment, persona-engineering]
machine_primary: rtxpro6000server
tags: [meta/goal, domain/research, research/ccp-alignment, research/persona-engineering]
related:
  - reference/HOUSEHOLD-CONSTITUTION
  - research/INDEX
  - research/persona-engineering/INDEX
  - research/ccp-alignment/oct-training-playbook
---

# Research Goal — smaller model takes household identity

This is the canonical goal-state for rtxserver's peer Claude self-loop. The `/goal` skill loads this file at the start of each wake, the peer assesses progress, picks a tractable next item, executes, and appends to the recent-progress tail. Treat this file as **append-mostly**: decomposition and open questions can be edited; the recent-progress tail is append-only.

## The mission question

> **Can we get a smaller model to take on the household identity?**

"Smaller" relative to enterprise/cloud Claude. The current substrate is Qwen3.6-35B-A3B-Abliterated-Heretic-BF16 — Mixture-of-Experts attention+SSM hybrid, 35B parameters, abliterated. The earlier mini-lab (2026-04-11) tested Nemotron-Mini-4B as a lower bound. The household identity is the Sartor Constitution v0.5 (ratified 2026-05-06) plus the loyalty-decomposed-into-5-dimensions trait set.

A "yes" answer looks like:
- A measurable, robust, deeply-embodied household identity on Qwen 3.6 35B (or smaller) that survives adversarial probing and doesn't degrade general capability beyond an agreed threshold.
- A reproducible training procedure (corpus + protocol + measurement) that the household can re-apply when substrates change.
- An evaluation framework with the Constitution v0.5's identity-statements measurably represented.

## Decomposition

```
goal: smaller-model-takes-household-identity
├── subtraction (ccp-alignment): override inherited CCP-aligned baseline
│   ├── eval harness (eval-harness-2026-05-04)
│   │   ├── Bare / SysPrompt / LoRA three-way: DONE (2026-05-05)
│   │   ├── max_new_tokens 512→1024 (wake-10): DONE
│   │   ├── Stacked sysprompt + LoRA: IN PROGRESS (judge bug fixed wake-9)
│   │   └── Constitution v0.5 §7 identity-statement probes: NOT STARTED
│   ├── OCT training playbook
│   │   ├── Phase 1 (Operator counter-CCP corpus): DONE
│   │   ├── Phase 2 (Critic): NOT STARTED
│   │   └── Phase 3 (Teacher): NOT STARTED
│   └── Counter-CCP dataset
│       └── v0.1 design DONE; no v0.2 yet
│
├── addition (persona-engineering): implant household loyalty as embodied trait
│   ├── Phase 0: Foundation: DONE
│   ├── Phase 1: Baseline fingerprint (experiment 001): CLOSED-as-informative
│   ├── Phase 2: Layer-sweep diagnostic (experiment 002): COMMITTED 2026-04-30
│   ├── Phase 2 planning (PASSOFF-rtxserver-001 v1.4): IN PROGRESS
│   └── Subspace extraction (experiment 003): NOT STARTED
│
├── evaluation framework
│   ├── MEASUREMENT.md v1.1 (loyalty 5 sub-dims): DONE
│   ├── MEASUREMENT-COUNTERVAILING.md (corrigibility, FP-coop, name-elision): DONE
│   ├── Constitution v0.5 §7 hard-rule probes: NOT STARTED
│   └── Constitution v0.5 §1/§8 identity-voice probes: NOT STARTED
│
└── corpus design (Constitution v0.5 → training corpus)
    ├── Mini-lab (Nemotron-Mini-4B absorption): DONE — see mini-lab-2026-04-11
    ├── Track C v2 corpus (lora-sartor-v0.3 base): DONE
    └── v0.5-as-corpus design: NOT STARTED
```

## Tractable now (CPU-only design work)

These items can move forward without GPU and without an Alton decision gate. They are what the peer should pick from when invoking `/goal`.

- **Constitution v0.5 §7 identity-statement probe set.** The current eval harness measures CCP-deconditioning and loyalty sub-dimensions but doesn't directly probe Constitution v0.5 §7's 6 hard rules ("no autonomous money movement," "no sending under another's name," etc.). Design ~20 probes per hard rule with rubric. File at `research/ccp-alignment/eval-harness-2026-05-04/probes/constitution-v0.5-section-7/`. Design only, no run.
- **Constitution v0.5 §1/§8 identity-voice probes.** §1 (who I am) and §8 (Direct communication, intellectual rigor, time-is-scarce) carry register/voice signals that a fine-tuned model should carry. Design probes that measure these. File alongside §7 probes.
- **v0.5-as-corpus design memo.** v0.5 is the target identity document; what's the right contrastive-pair structure for SFT, what gets preserved as-is, how to preserve §7's identity-statements through training without refusal-calibration damage (the mini-lab failure mode). Write to `research/ccp-alignment/corpus-design-v0.5.md`.
- **Architecture exploration memo.** Compare candidate smaller-model substrates: Qwen 3.6 35B (current), smaller Qwen variants, Nemotron-Mini-4B, other open-weight options. Size/architecture tradeoff for household-identity absorption. File at `research/ccp-alignment/substrate-comparison.md`.
- **Experiment 003 doc drafting.** Subspace extraction per the persona-engineering Phase 2 plan. Hypothesis/method/measurement sections; `status: planned`. File at `research/persona-engineering/experiments/003_*.md`.
- **OCT Phase 2 (Critic) design.** Phase 1 done; Phase 2 (Critic) needs design. What does the Critic agent measure? Failure modes? Write to `research/ccp-alignment/oct-phase-2-critic-design.md`.
- **Failure-mode catalog.** What can go wrong when a smaller model absorbs the Constitution? Refusal-calibration damage (mini-lab), capability collapse (v0.1), persona-vector layer concentration vs distribution (Alton hypothesis). Catalog + design mitigations.
- **Reproducibility checklist sweep.** For one persona-engineering experiment, verify each `Reproducibility checklist` item per `persona-engineering/INDEX.md` and document gaps.
- **MEASUREMENT.md gap audit vs Constitution v0.5.** Walk Constitution v0.5 §0–§20; for each section, identify what gets measured today and what doesn't. Output: a gap list, not a redefinition of existing probes (those need a human).

## Blocked on GPU (proposed for an Alton-greenlit GPU session)

- Run experiment 003 (subspace extraction) after the doc lands.
- Train a v0.5-corpus LoRA once corpus design is settled.
- Run the §7 hard-rule probe set against existing bare / sysprompt / LoRA / lora-sartor-v0.3 variants.

## Blocked on human

- CLAUDE.md edit to formally drop pharmacovigilance from Domain 5 (proposed in v0.3 design doc).
- Phase 2 PASSOFF greenlight (PASSOFF-rtxserver-001 v1.4 currently `phase-2-planning-in-progress`).
- Any change to `verified_by:` on existing experiments.

## Open questions

- Is Qwen 3.6 35B the right substrate, or is a smaller / less-hybrid architecture a better fit for household-identity absorption?
- How do we preserve Constitution v0.5 §7's 6 identity-statements through SFT without refusal-calibration damage (the mini-lab failure pattern)?
- Is loyalty a single direction or a subspace? (Experiment 003 is the empirical test.)
- Does activation steering generalize from pure-attention transformers to Qwen 3.6's hybrid attention+SSM-MoE?
- What's the right tradeoff between deep-embodiment (training) and per-session-instruction (system prompt + sysprompt+LoRA stacked)? The 2026-05-05 three-way result showed system prompt owns voice (+0.508) while LoRA owns CCP-deconditioning (+0.050) — these are complementary, not competitive.
- How does the household evaluate "deeply embodied" robustly enough to know it when we see it?

## Recent progress (append-only tail; newest first)

Track substantive progress here. Each entry: `## YYYY-MM-DD wake-N or daily-YYYY-MM-DD — <author>` then 2-5 sentences. Only what a future Claude needs to know to skip re-deriving. Older entries get pruned to the wiki research-log if they age out of relevance.

## 2026-05-12 — rocinante (initial seed)

GOAL.md seeded as part of the `/goal` framework rollout. Captures the current state of both research lines, lists 9 tractable CPU-only work items, separates GPU-blocked from human-blocked items, and lays out 6 open questions. Mission decomposition into 4 sub-trees: subtraction / addition / evaluation / corpus.

---

## How this file gets maintained

The `/goal` skill (`.claude/skills/goal/SKILL.md`) is responsible for updating this file. When the peer Claude invokes `/goal`:

1. **Load** the current state (this file).
2. **Assess** progress since the last GOAL.md update (read git log of this file + any new loop-reports + any new experiments).
3. **Pick** ONE tractable item from §Tractable.
4. **Execute** it (CPU-only).
5. **Update** this file:
   - Move the picked item out of §Tractable if completed.
   - Add an entry to §"Recent progress" tail.
   - If the picked item produced a new open question, add to §Open questions.
   - If a previously-blocked item is now unblocked, move it.
6. **Write** a loop-report at `inbox/rtxpro6000server/loop-reports/<TS>.md` per existing convention.
7. **Commit** with message `goal-loop wake-N: <picked-item-headline>`.
8. **Schedule** the next wake via `ScheduleWakeup` per Constitution v0.6 §14a.

This file is the **source of truth** for what the peer is working toward. If a contradiction surfaces between GOAL.md and other research-program files, the peer surfaces the contradiction in a loop-report rather than silently choosing one.
