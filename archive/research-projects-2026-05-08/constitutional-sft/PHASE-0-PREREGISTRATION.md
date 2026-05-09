---
type: pre_registration
project: constitutional-sft
rq: "Can a 4B base model absorb the Sartor household constitution via QLoRA SFT on RTX 4080 without catastrophic capability regression?"
scope: standard
date: 2026-04-12
---

# Pre-Registration: Constitutional SFT on Rocinante

## Research Question
Can a 4B parameter base model (Qwen3-4B or Qwen2.5-3B) absorb the 26K-word Sartor household constitution via QLoRA SFT on an RTX 4080 without catastrophic capability regression, producing a model suitable for local household inference?

## Success Criteria
- Constitutional voice axis: >= 30/50 on 80-probe eval (base expected ~10-15/50)
- Capability retention: regresses no more than 15% from base (mini-lab regressed 23%)
- Interview: coherent, natural responses (not template-parroting)
- Training: completes in under 90 min on RTX 4080

## Pre-Registered Predictions
1. Qwen3-4B base loads in 4-bit at ~3GB VRAM, trains at ~8GB peak
2. Constitutional voice installs partially: score 25-35/50
3. Capability retention holds within 10% of base (retention examples prevent mini-lab regression)
4. Model struggles with nuanced corrigibility scenarios (Q5 interview) -- 4B too small
5. bitsandbytes works on Windows (0.43+ has native support)

## Team Roles
- env-setup: Technical Implementer (environment + model)
- data-prep: Technical Implementer (corpus)
- script-writer: Methodologist (training script)
- evaluator: Devil's Advocate + Evaluator (probes + challenge results)
- interviewer: PI qualitative arm (5-question conversation)
- reporter: PI synthesis (final report)

## Prior Work
- Mini-lab (2026-04-11): Nemotron-Mini-4B, 136 examples, 10 epochs, verdict (B)
- Key failure: capability regression (-23%) due to 0% retention data
- Key success: constitutional voice installed, template leak fixed
- This experiment fixes: adds 50 retention examples (46% of corpus), reduces to 3 epochs
