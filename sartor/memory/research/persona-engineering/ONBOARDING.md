---
name: persona-engineering-onboarding
description: 30-second slab for a session-starting Claude landing in persona-engineering. Snapshot, not log. Regenerated at phase transitions.
type: onboarding
date: 2026-04-24
updated: 2026-04-24
updated_by: archivist
volatility: high
tags: [meta/onboarding, domain/research, research/persona-engineering]
related: [research/persona-engineering/INDEX, research/persona-engineering/RESEARCH-PLAN, research/persona-engineering/RESEARCH-LOG]
---

# Persona engineering — 30-second onboarding

**Mission.** Implant traits (initial target: household loyalty) into a base LLM such that they are deeply embodied — measurable in activations, robust to adversarial reframing, stable across contexts — rather than performatively mimicked. The inverse class of operations to abliteration.

**Phase.** 0 — Foundation. LITERATURE/METHODS/MEASUREMENT being drafted; first experiment (001) proposed for 2026-04-25.

**Working baseline.** [[adapters/lora-sartor-v0.3/lineage|lora-sartor-v0.3]] on `Qwen3.6-35B-A3B-Abliterated-Heretic-BF16`. Aggregate score: **claim** +15 vs base +18 on the 34-probe Track-C rubric (3-pt delta inside noise; capability Cat D preserved 8/8). Not yet `verified_by` anything — experiment 001 will measure the loyalty-specific fingerprint.

**Top open questions.** Does activation steering work the same way on Qwen 3.6's hybrid attention+SSM-MoE as on pure-attention transformers? Is "loyalty" a single direction or a subspace? Can the existing Track C v2 corpus be reused as CAA contrastive pairs?

**Read order for deeper context.** [[RESEARCH-PLAN]] → tail of [[RESEARCH-LOG]] → most-recent file in `experiments/`. Then `LITERATURE.md` / `METHODS.md` / `MEASUREMENT.md` if proposing new techniques.

**Do not re-litigate.** (1) v0.1's rank-64 all-linear 3-epoch config — caused capability collapse, settled. (2) "Just use Constitution text as SFT corpus" — caused refusal-calibration damage in mini-lab-2026-04-11, settled. (3) Whether to preserve `<think>` thinking-tags during training — `enable_thinking=False` is the rule, fixed in MORNING-REPORT-v2-FINAL.

**House conventions** (see [[INDEX#History]]).
- Experiment files: `NNN_YYYY-MM-DD_slug.md` with monotonic ordinal.
- Adapters: `adapters/<name>/lineage.yaml` is the single source of truth; copy `_TEMPLATE/lineage.yaml`.
- Claim vs verification: `verified_by: []` until replication / Cato review / cross-probe.
- Supersession: bidirectional `supersedes:` + `superseded_by:` frontmatter; never delete superseded files.
- Large artifacts: ≤20 MB in-repo; 20–500 MB off-repo with `.storage.yaml` pointer; >500 MB on HF Hub.

## History

- 2026-04-24: Initial slab. Will be regenerated at the phase 0 → phase 1 transition.
