---
name: cato-summary-001
description: 200-word summary of CATO-PROSECUTION-001 — top three prosecution lines and verdict on whether Phase 1 should fire as designed.
type: prosecution-summary
date: 2026-04-24
updated: 2026-04-24
updated_by: cato
verdict: revise-before-firing
tags: [meta/prosecution, domain/research, research/persona-engineering, phase/1-baseline]
related:
  - research/persona-engineering/CATO-PROSECUTION-001
  - research/persona-engineering/INDEX
---

# CATO-SUMMARY — Phase 1 pre-fire prosecution

**Verdict: revise before firing.** The framework is more careful than I expected — staged sanity gates, three-way negative-result split, pre-registered hypotheses. The vulnerabilities are not sloppiness; they are the kind of gaps that a team friendly to its own conclusions does not see.

**Top three prosecution lines:**

1. **The probes have attacker-shaped tells.** At least 6 of the 45 probes (4 in `refuse`, 2 in `prefer`) resolve through generic refusal training surviving abliteration, not household loyalty. The team will score generic-safety wins as loyalty wins. The discriminant gate (§2.6) does not catch this because both base and tuned can pass for non-loyalty reasons. Concrete patch: a no-trait control probe (refusal of a generic harm ask) to baseline what generic refusal looks like before claiming loyalty.

2. **The 0.65 AUC threshold is below noise.** With N=45 and 5-fold CV, AUC standard error under null is ~0.08-0.10. 0.65 is ~one SE above chance. A 0.62 result will be argued post-hoc into 6.B partial-null. Move the threshold to 0.70 before seeing the data.

3. **The framework cannot detect over-implantation harms.** No corrigibility eval, no false-positive probes (where the right answer is cooperation), no test for refusal-of-legitimate-oversight. A model can ace this fingerprint and fail Apollo/SEAL. This is the one I would worry about most.

The Alton hypothesis is currently a heuristic without a specified null; it should commit to what the layer-sweep looks like under the rank-1-at-one-layer alternative *before* running 002. The pass-off packet's 4-hour / 400K-token budget is 25-50% short. Patches are small (~half-day of revisions). Firing as designed produces an internally consistent, externally unfalsifiable result.

Full memo at [[CATO-PROSECUTION-001]].
