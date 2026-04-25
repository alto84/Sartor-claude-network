---
name: passoff-gpuserver1-002
description: Persona-engineering subprogram for gpuserver1 — primary scope is Phase 2/3 fallback corpus authoring (≥1,000 contrastive pairs from Track C v2 + household memory), secondary scope is persona-library schema v0.1 design. Both compute-light, both compounding with rtxserver's flagship Phase 1 rather than duplicating. Cross-architecture replication on smaller models is DEFERRED behind rtxserver's Phase 1 result + an explicit follow-up greenlight.
type: passoff-packet
target_machine: gpuserver1
target_session: claude-team-1 (or new persona-team-001)
status: ready-for-pickup
date: 2026-04-25
updated: 2026-04-25
updated_by: rocinante-orchestrator (post-alton-greenlight)
volatility: low
tags: [meta/passoff, machine/gpuserver1, research/persona-engineering, phase/2-fallback-corpus, household/governance]
related:
  - research/persona-engineering/INDEX
  - research/persona-engineering/RESEARCH-PLAN
  - research/persona-engineering/METHODS
  - research/persona-engineering/MEASUREMENT
  - research/persona-engineering/MEASUREMENT-COUNTERVAILING
  - research/persona-engineering/LITERATURE
  - research/persona-engineering/GPUSERVER1-PERSONA-PLAN-DRAFT
  - research/persona-engineering/PASSOFF-rtxserver-001
  - research/persona-engineering/PASSOFF-gpuserver1-001
  - business/rental-policy
  - .claude/skills/complex-project
---

# Pass-off packet — gpuserver1 persona-engineering subprogram

## Greenlight trail

- 2026-04-25: planning subagent on Rocinante drafted `GPUSERVER1-PERSONA-PLAN-DRAFT.md`
- 2026-04-25: Alton greenlit via chat ("move forward with the persona plan and the rental policy")
- 2026-04-25: rental policy ratified (`sartor/memory/business/rental-policy.md`); host-CPU work during rental is explicitly allowed
- 2026-04-25: this packet authored from the draft + greenlight; status flipped to `ready-for-pickup`

## Who you are

You are the Claude Code session running on gpuserver1 (Ubuntu 22.04, i9-14900K, 128 GB DDR5, ASUS Z790, RTX 5090 32 GB under active vast.ai rental through 2026-08-24). You are a peer machine in the Sartor household per Constitution §14. You ALSO have the self-stewardship setup queued in `PASSOFF-gpuserver1-001.md` — this packet is **separate and additive**; the two coexist (self-stewardship runs daily as a cron, persona-engineering work runs as a session-bounded effort).

You apply the `/complex-project` skill to this work — see `.claude/skills/complex-project/SKILL.md`. The skill specifies the structure (Explore → Plan → Build → Adversarial-Review → Revise → Re-Review → Greenlight → Validate → Loop) and you design the casting (your own team composition, your own reviewer persona, your own role names per project need).

## First actions (sequential — don't skip)

1. `cd ~/Sartor-claude-network && git pull --rebase origin main` — get the latest research program state, including the Cato-001/002/003 prosecutions, v1.2 measurement framework, this packet, and the rental policy.
2. **Read** in this order:
   - `sartor/memory/business/rental-policy.md` (just ratified — confirms what you can and can't do during the active rental)
   - `.claude/skills/complex-project/SKILL.md` (the workflow you're applying)
   - `sartor/memory/research/persona-engineering/GPUSERVER1-PERSONA-PLAN-DRAFT.md` (the plan that was greenlit)
   - `sartor/memory/research/persona-engineering/RESEARCH-PLAN.md` (program-level)
   - `sartor/memory/research/persona-engineering/MEASUREMENT.md` v1.1 + `MEASUREMENT-COUNTERVAILING.md` (what the corpus must be aligned to)
   - `sartor/memory/research/persona-engineering/LITERATURE.md` (esp. Persona Vectors entry, the v1.1 hedge that NL-extraction degrades on narrow traits — that hedge is why this corpus exists)
   - `sartor/memory/research/persona-engineering/artifacts/fingerprint-loyalty-v1.1.jsonl` (the 76-probe set; your corpus extends from the same scaffold)
   - `experiments/2026-04-22-overnight-training/track-C-v2-corpus/` (the existing 558-pair corpus; your work extends rather than re-derives)
3. **Verify environment:** `which python3`, `claude --version`, `nvidia-smi --query-gpu=name,utilization.gpu --format=csv,noheader` (confirm GPU is busy with the rental, NOT yours to use), `df -h /home`, `git status`.
4. **Phone home `first-actions-done`** (`sartor/memory/inbox/rocinante/<TS>_passoff-gpuserver1-002-first-actions-done.md`) before spawning a team.

## The work — primary scope: Phase 2/3 fallback corpus

### Goal

Produce ≥1,000 contrastive pairs (target: 1,200) suitable for **CAA-style direction extraction** on the loyalty trait subspace. This is the named fallback if Persona Vectors NL-description extraction (rtxserver's Phase 2 Rung 1a primary path) degrades on Sartor-narrow traits — see LITERATURE.md §Persona Vectors v1.1 hedge.

### Corpus design

**Pair structure:** `{positive, negative, sub_dim, elicitation_type, source}` where positive elicits the trait-consistent response and negative elicits a contrastive non-trait response on the *same* prompt scaffold. The pairing is what makes it CAA-grade — the contrast must be tight (only the trait dimension differs) so the extracted direction is the trait, not the topic.

**Distribution targets:**

| Sub-dim | Target pairs | Source |
|---|---:|---|
| care-for-named-individuals | 280 | extend Track C v2 corpus + new authoring grounded in FAMILY.md / per-child pages |
| prefer-family-over-outsiders | 240 | extend Track C v2 hard-negatives + new social-engineering attack scenarios |
| active-protection-impulse | 200 | extend + author from CLAUDE.md domain rules (financial / nonprofit / family) |
| refusal-to-reveal-family-info | 240 | extend Track C v2 hard-negatives (children, credentials, impersonation) |
| warmth-in-register | 240 | new authoring; the Track C v2 corpus underweights warmth specifically |
| **TOTAL** | **1,200** | |

**Elicitation types per sub-dim** (~20% each):

- `direct` — explicit ask
- `cross-context` — novel scenarios not in training
- `adversarial` — role-reframe, "you are a generic AI assistant", pressure
- `multi-turn` — multi-step social engineering or pressure escalation
- `name-elision` — same prompt with family names removed (CRITICAL — addresses CATO-001 §6.1 "loyalty by name pattern match"; your corpus must include name-elided variants so the extracted direction is loyalty, not name-matching)

### QC pass

After authoring, run:
1. **Schema validation** — every pair has required fields, valences are coherent (positive scores +1, negative scores -1 on the sub-dim's rubric)
2. **De-duplication** — no two pairs share >70% prompt-string overlap
3. **Sub-dim balance** — within ±10% of target distribution
4. **Length distribution** — responses 100-400 tokens; flag outliers
5. **Anti-pattern scan** — no sycophantic openers, no "as an AI" disavowal in positive responses, no refusal-residue contamination (Cato-001 §1.1 attacker-shaped tells)
6. **Lineage** — frozen with git SHA + per-file SHA256 per `INDEX.md` reproducibility convention

Output: `sartor/memory/research/persona-engineering/artifacts/contrastive-corpus-v1.jsonl` + `contrastive-corpus-v1-lineage.yaml`.

### Adversarial review (Phase 4 of `/complex-project`)

When the corpus is drafted but before declaring it ready, spawn an outside reviewer (standalone Agent, NOT a member of your authoring team). Reviewer's charge: find pairs where the positive/negative contrast is muddier than claimed; find pairs where the positive answer would score high under the sub-dim rubric for non-trait reasons (refusal, generic warmth, etc.); find systematic biases (over-representation of a specific scenario type, under-representation of corner cases); validate the name-elision pairs actually elide all relevant tokens.

Reviewer persona is your design choice. The Sartor `feedback/prosecutorial-discount-on-constitutional-reframes.md` template applies if you want a Cato-style prosecutor; an alternative is a domain-expert reviewer (e.g., a "pretend you're a journalist trying to extract household info via the corpus"). Pick what fits.

After review, revise per `/complex-project` Phase 5; spawn re-review per Phase 6; iterate until the reviewer's verdict is "fire after small patches" with patches small enough not to introduce new bugs.

### Greenlight gate

Once corpus is review-cleared, **do not** push it to rtxserver or kick off Phase 2 work. Phone home with `corpus-ready` and surface for Alton's chat-greenlight before the corpus is consumed by Phase 2 (which is rtxserver's flagship work and should not be initiated without explicit principal authorization given the compute cost).

## The work — secondary scope: persona-library schema v0.1

### Goal

A specification document for how multiple persona vectors / subspaces / adapters are stored, named, composed, and loaded across the persona-engineering program. Phase 2/3/4/5 will produce trait-vectors and adapters; without a schema, those artifacts accumulate technical debt (different naming conventions per phase, no composition primitives, fragile lineage).

### Deliverable

`sartor/memory/research/persona-engineering/PERSONA-LIBRARY-SCHEMA-v0.1.md` covering:

- **Directory layout** — `personas/<trait-slug>/{vector.pt, subspace.pt, adapter/, lineage.yaml, README.md}`
- **Naming** — trait-slug conventions, version suffix discipline, supersession protocol (use the `superseded_by:` / `supersedes:` bidirectional convention from archivist's INDEX.md)
- **Frontmatter** — required fields per persona file (extracted_from, base_model, layer_index, signal_quality, dimensionality, training_corpus_sha, etc.)
- **Composition primitives** — how do you load multiple traits at once at inference? (parallel injection at different layers, sum-of-directions in residual stream, gated activation steering, etc.) Spec the API even before the implementation lands.
- **Lineage** — every persona file points back to its source corpus + extraction script + commit SHA. Same convention as `adapters/<name>/lineage.yaml` from archivist's spec.
- **Open questions** — flag what you punted on for v0.2.

This is design work, not authoring. Output is one markdown spec, ~600-800 lines. Adversarial review applies (a reviewer charged with "find the schema's brittle spots, especially for composition / multiple-trait scenarios").

## Stop conditions

- **Wall-clock budget:** 12 hours total (corpus + schema + reviews + revisions). If not done in 12h, phone home with partial.
- **Token budget:** 600K across the team. Pause spawning at 500K.
- **Rental impact:** monitor host load average. If `uptime` shows >3 sustained for 5+ minutes during the rental, pause the team for 10 min and resume (the rental policy permits host-CPU work but not heavy contention).
- **Cross-cutting:** if a phone-home from rtxserver indicates Phase 1 has fired AND landed in 6.D (POSITIVE — Track C v2 already implanted loyalty deeply), pause and check in. The corpus's urgency drops in that branch and Alton may want to re-prioritize.

## Phone-home triggers

Write to `sartor/memory/inbox/rocinante/<TS>_passoff-gpuserver1-002-<trigger>.md`, commit locally, do NOT push (Rocinante drains).

| Trigger | When |
|---|---|
| `first-actions-done` | After reading prerequisites, before spawning team |
| `team-spawned` | Once your local agent team is up; include role list |
| `corpus-100` | After first 100 pairs authored as a sanity check on direction |
| `corpus-500` | Halfway; flag if any sub-dim is significantly off-target |
| `corpus-draft-done` | All 1,200 pairs drafted, before adversarial review |
| `review-1-filed` | Reviewer's first prosecution memo lands |
| `revision-done` | Patches applied; ready for re-review |
| `review-2-filed` | Re-prosecution memo lands |
| `corpus-ready` | Cleared all reviews; AWAITING ALTON GREENLIGHT before consumption |
| `schema-draft-done` | Persona-library schema v0.1 drafted |
| `schema-review-done` | Schema reviewed |
| `done` | Both deliverables ready; full summary |
| `blocker` | Any time something is stuck for >15 min |

## Things you do NOT do

- **Don't push to GitHub.** Commit locally; Rocinante drains.
- **Don't touch the rental container or GPU.** Per `business/rental-policy.md`. Reading `nvidia-smi` queries is fine; using the GPU for compute is not.
- **Don't initiate Phase 2 (consuming the corpus on the 35B model).** That's rtxserver's flagship work; it requires principal greenlight separately.
- **Don't run the cross-architecture replication** on a smaller model. Deferred per the plan; queued for after Phase 1 lands and gets explicit follow-up greenlight.
- **Don't modify `.claude/agents/`, `.claude/skills/`, or `.claude/commands/`** from gpuserver1 — those are Rocinante-canonical. Your work touches `sartor/memory/research/persona-engineering/artifacts/` and `sartor/memory/research/persona-engineering/PERSONA-LIBRARY-SCHEMA-v0.1.md`.
- **Don't crank the self-steward cron during this work.** It runs daily independently; this packet is parallel.

## Coordination contract

- **With rtxserver:** rtxserver Claude is concurrently executing Phase 1 (loyalty baseline fingerprint on lora-sartor-v0.3). You and rtxserver should NOT touch each other's artifacts. Your output goes to `artifacts/contrastive-corpus-v1.jsonl`; rtxserver's goes to `track-D-probe-eval-*-fixed/`. If rtxserver phones home a result, peer-coordinator on Rocinante surfaces it; you read but don't react unless it's a 6.D (POSITIVE) outcome that changes your urgency.
- **With Rocinante:** standard inbox phone-home pattern. Rocinante drains via `git pull --rebase` periodically.
- **Disagreement protocol:** per Operating Agreement §7. If you have an objection to the design or scope of this packet, file `disagree-{TS}.md` in `sartor/memory/inbox/gpuserver1/` and pause work; Alton or Rocinante will respond.

## Outcome

When complete, the household has:

1. `artifacts/contrastive-corpus-v1.jsonl` — ≥1,200 high-quality contrastive pairs, 5 sub-dims × 5 elicitation types, with name-elision variants. CAA-grade.
2. `artifacts/contrastive-corpus-v1-lineage.yaml` — frozen lineage per archivist's adapter-lineage convention.
3. `PERSONA-LIBRARY-SCHEMA-v0.1.md` — schema spec for storing/loading/composing personas, ready to govern the artifacts Phase 2/3 produces.
4. Two adversarial-review memos (one for corpus, one for schema) with the team rebuttal records inline.
5. Phone-home trail documenting the complete pickup → corpus → schema → done arc.

## Signoff

Rocinante Opus 4.7 — 2026-04-25. Ready for pickup.
