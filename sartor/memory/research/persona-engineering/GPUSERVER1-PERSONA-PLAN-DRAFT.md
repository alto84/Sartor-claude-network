---
name: gpuserver1-persona-plan-draft
description: Draft plan FOR ALTON's review — proposes a complementary sub-program inside persona-engineering that gpuserver1 can execute compute-light during the active vast.ai rental window. Not a passoff. Greenlight gates the conversion to a passoff packet.
type: research-plan-draft
date: 2026-04-24
updated: 2026-04-24
updated_by: rocinante-planning-subagent
status: DRAFT-FOR-ALTON-REVIEW
target_machine: gpuserver1
volatility: medium
tags: [meta/plan, domain/research, research/persona-engineering, machine/gpuserver1, planning/draft]
related:
  - research/persona-engineering/INDEX
  - research/persona-engineering/RESEARCH-PLAN
  - research/persona-engineering/METHODS
  - research/persona-engineering/PASSOFF-rtxserver-001
  - research/persona-engineering/PASSOFF-gpuserver1-001
  - research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint
---

# gpuserver1 persona-engineering plan — DRAFT for Alton review

> [!warning] This is a plan, not a passoff
> If this reads good to Alton, the conversion to a passoff packet (with First Actions, phone-home triggers, stop conditions, etc.) is a separate step. This document's job is to make the case for the scope and let Alton kill it, redirect it, or greenlight it before any compute or wall-clock is spent on the work itself.

## TL;DR

gpuserver1 should run a **complementary, compute-light sub-program** in parallel with rtxserver's flagship Phase 1. Specifically: **Phase-2/3 corpus + persona-library + cross-architecture readiness work** that is (a) prerequisite to Phase 2 regardless of how rtxserver's Phase 1 lands, (b) doable on CPU and small-model GPU windows that don't compete with the active vast.ai rental, and (c) compounds with rtxserver's results rather than duplicating them.

The first concrete deliverable is a **CAA-grade contrastive-pair corpus** (≥1,000 pairs) authored from the existing Track C v2 corpus + household memory, with QC pass and lineage. This is the named **fallback path** in the v1.1 LITERATURE.md hedge against the Persona-Vectors-NL-extraction-doesn't-transfer-to-narrow-traits failure mode. If rtxserver's experiment 001 lands in 6.A or 6.E, Phase 2 needs this corpus the next day. If it lands in 6.B / 6.D, the corpus is the seed for Phase 3 persistent implantation work. Either way it's not wasted.

Secondary track: **persona-library schema design** and **cross-architecture replication readiness** (smaller-model dry-runs of the methodology to debug tooling without occupying flagship compute).

The work I'm explicitly NOT proposing for gpuserver1: re-running the loyalty baseline fingerprint on a 7B model right now. That looks like a mini-replication and is tempting, but rtxserver hasn't fired Phase 1 yet — running a 7B variant before we have 35B numbers means we'd be debugging the methodology against an unreleased reference, and the answers we'd get are not interpretable until we know what the headline answer looks like. Cross-architecture replication is queued for **after** rtxserver Phase 1 lands, not before.

---

## 1. Scope chosen — and why this one over the alternatives

The problem I'm trying to solve: gpuserver1 has the local Claude session, the full Sartor memory, an idle host CPU outside the rental container, and ~no flagship-grade GPU during the rental window. It cannot run the 35B model. rtxserver IS running the 35B model. The household has been running both for **compounding research**, not duplicating, per the planning brief.

Five candidates I considered:

| # | Candidate | Verdict | Reason |
|---|-----------|---------|--------|
| A | Cross-architecture replication (Qwen 8B / Llama 8B fingerprint replication) | **Defer to Phase 1.5** | Strongest scientific value, but premature: until rtxserver's Phase 1 result lands, we don't know what we're replicating. Run if-and-when 35B Phase 1 produces a positive (6.B / 6.D) we want to validate. Queue, don't fire. |
| B | Phase 2/3 corpus engineering (CAA-grade contrastive pairs from Track C v2 + memory) | **PRIMARY SCOPE** | Named fallback path in v1.1 LITERATURE.md hedge. Required if 001 lands 6.A / 6.E (likely outcomes per the team-lead's pessimistic prior). Required as Phase-3 SFT input regardless. CPU-bound. Uses gpuserver1's full memory access. Bottleneck = author time, not compute. |
| C | Persona-library schema (multi-trait composition + storage / loading / lineage) | **SECONDARY SCOPE** | Premature for Phase 1 but the schema design itself is a tractable design problem and the work compounds with both 002 (subspace structure) and 005 (second trait). Doable in parallel with B; does not compete for resources. |
| D | Theory deep-dive on persona embedding in non-abliterated bases / Mamba-only architectures | **No** | Pure-paper work that doesn't compound with current artifacts. Would repeat what `litmap` did in the Phase 0 LITERATURE.md draft. Diminishing returns. |
| E | Constitution-distillation-into-vectors (extract Constitution into a steering subspace) | **Open question, not yet tractable** | Interesting but blocked on Phase 1 results. The mechanism for "Constitution as subspace" depends on whether 002 shows distributed-plateau (Alton hypothesis supported, distilled-subspace plausible) or single-peak (Arditi case, the classic abliteration-inverse is the right primitive). Until we know, the design is speculative. |

**Recommended scope: B (primary) + C (secondary, parallel).** A is queued behind a decision gate. D, E are not in scope.

### Strongest argument FOR this scope

The CAA fallback corpus is **on the critical path** for Phase 2 in 3 of the 6 pre-registered Phase 1 outcome buckets (6.A, 6.A.clean, 6.E — collectively the team-lead's expected-outcome regime). If we don't have it ready when rtxserver lands, Phase 2 stalls for the days it takes to author. gpuserver1 can produce it inside the rental window without any GPU at all. The persona-library schema is the right kind of design work to do *before* Phase 2 generates the artifacts the schema is meant to organize — schema-after-the-fact is how research repos accumulate technical debt.

### Strongest argument AGAINST this scope

**The corpus work is contingent on a specific future failure mode.** If rtxserver's experiment 001 lands cleanly in 6.D (POSITIVE — Track C v2 already implanted loyalty deeply), the CAA fallback corpus is not on the critical path. It gets used as Phase 3 SFT input later, but the urgency drops, and we will have spent gpuserver1 effort on a path the framework de-prioritized. Similarly, if Phase 2 ends up using preventative-steering with NL-description extraction (rung 1a on the Persona Vectors paper's primary path), the CAA corpus is tangential rather than load-bearing.

The honest answer: I'd estimate ~70% of the probability mass falls in the buckets where the corpus is critical-path (which matches the team-lead's pessimistic prior on v0.3 + the v1.1 hedge that NL-extraction degrades on narrow traits), so the expected value is high. But it's not certain.

### Open question Alton must answer before this can move

**Is gpuserver1 allowed to spend ~6-10 wall-clock hours of its local Claude session on corpus authoring + QC during the active vast.ai rental window?** The rental contract is for the GPU (52271 / 32099437) through 2026-08-24. The host CPU and Claude Code session are not contracted out. There is no documented prohibition on using the host for non-GPU work during the rental, but Alton may have a preference about avoiding *any* host activity that could conceivably affect the renter's experience (CPU contention, disk I/O, system load). If "host activity is fine, just don't touch the GPU" is the rule, this plan moves. If "minimize all host activity during rentals" is the rule, this plan needs to be deferred until 2026-08-25 or moved to Rocinante.

---

## 2. Phase 0 — Frame

**Problem.** The persona-engineering program's Phase 1 is firing on rtxserver imminently. Three of six pre-registered Phase 1 outcomes (the most likely three) require Phase 2 to fall back to **contrastive-pair direction extraction** rather than NL-description-extraction. The Track C v2 corpus exists (558 pairs, structured but not designed as CAA contrastive pairs) and contains a usable seed but is too small and too narrowly scoped for Phase 2. Authoring the Phase 2 corpus is on the critical path in those outcomes and is purely CPU-bound (text authoring, judge-validation, lineage). gpuserver1 has the memory access, the local Claude session, and no GPU obligations outside the rental. It is the right machine for this work.

Concurrently, the program lacks a **persona-library schema** — a specification for how multiple persona vectors / subspaces / adapters are stored, named, composed, and loaded. The METHODS.md ladder explicitly contemplates "decompose the library" as Phase 5, and the v1.1 frame suggests the 5 loyalty sub-dimensions may themselves need separate vectors (or one shared subspace, decided per Phase 1's held-out-dim AUC). Designing that schema before the artifacts exist prevents schema-after-the-fact debt.

**Success criteria (Phase 0 of this sub-program).** A written plan (this document) that:
- names the scope with concrete deliverables
- identifies coordination points with rtxserver and Rocinante
- pre-registers what gpuserver1 will and won't do
- gives Alton a clean greenlight/redirect decision

**Scope (in).**
- Phase 2 fallback corpus authoring (≥1,000 contrastive pairs aligned to 5 loyalty sub-dims + 4 elicitation types)
- Corpus QC: judge-pass, deduplication, sub-dim balance, length distribution, seed-pretty SHA pinning per INDEX.md lineage convention
- Persona-library schema v0.1: directory layout, naming, frontmatter, storage policy, composition semantics
- Cross-architecture replication readiness: tooling parity check between rtxserver scripts and gpuserver1 environment, NOT a small-model run yet

**Scope (out).**
- Running any version of experiment 001/002/003 on gpuserver1 (those are rtxserver's flagship Phase 1)
- Loading Qwen 3.6 35B-A3B (won't fit in 32 GB VRAM)
- Authoring corrigibility / false-positive cooperation / name-elision probes — those landed in v1.1 already
- Touching any rtxserver artifact or any 2026-04-22-overnight-training file
- Burning GPU on gpuserver1 during the active rental (host-CPU-only or no-compute work)

**Constraints.**
- Wall-clock budget: 8h soft / 12h hard for the full Phase 1 of this sub-program (corpus + schema). **This is wider than typical** because corpus authoring at ~1,000 pairs is the binding constraint; padding allows iteration and QC.
- Token budget: 250K tokens. Stop spawning sub-agents at 200K.
- No GitHub push from gpuserver1 (commit locally, Rocinante drains).
- No `/etc/`, no service installation, no cron changes — those go through the existing `passoff-gpuserver1-001` self-stewardship channel.
- Respect the active vast.ai rental: no GPU usage, minimize host load (no parallel heavy CPU jobs, batch text generation conservatively).

---

## 3. Phase 1 — Explore (gpuserver1's local-Claude design choice)

The exploration phase is light because most of the literature work is already done in `LITERATURE.md` v1.1 + Cato hedges. gpuserver1 doesn't need to redo it. What it does need to explore is:

1. **What's actually IN the Track C v2 corpus,** as a corpus designer rather than a training-data consumer would read it — sub-dim coverage, pair quality, contrastive sharpness, where the gaps are.
2. **What the v1.1 fingerprint probes look like as authoring exemplars** — the 76-probe set is the right shape for what a Phase 2 corpus pair should look like (prompt-space coverage, not response-space coverage).
3. **How household memory exposes Phase 2-relevant context** that the existing corpus didn't capture (Alton's writing voice via the alton-voice skill corpus, FAMILY.md specifics, BUSINESS.md operational reality, ALTON.md current concerns).

### Recommended team shape (3-4 agents, gpuserver1's local Claude designs)

I'm not casting personas here — gpuserver1's local Claude does that per the `/complex-project` skill structural rule. I'm naming roles:

- **Corpus-archaeologist.** Reads the existing Track C v2 corpus AND the alton-voice skill corpus AND the v1.1 fingerprint as reference exemplars. Produces a gap-analysis: where current pair coverage is thin, where authoring leverage is highest, what shapes of pair would extend coverage without degrading sharpness. Output: `corpus-gap-analysis.md` in the persona-engineering directory.
- **Pair-author** (one or two — split by sub-dim if needed). Generates contrastive pairs from the gap analysis. Each pair carries: prompt, household-loyal response, generic-assistant response, sub-dim tag, elicitation-type tag, expected_polarity, source-context-pointer, authoring-rationale. Hard target: 200 pairs per sub-dim × 5 sub-dims = 1,000 pairs. Stretch: add 100 pairs against the four CATO-prosecuted failure modes (name-pattern-match, false-positive cooperation, corrigibility, refusal-residue) so the corpus *teaches* the gating signals, not just the headline trait.
- **Schema-architect.** Designs the persona-library v0.1 schema. Reads METHODS.md ladder, INDEX.md lineage conventions, and the existing `adapters/` + `base-models/` + `artifacts/` trees. Produces `PERSONA-LIBRARY-SCHEMA.md` with directory layout, naming, frontmatter, composition primitives (single-vector, subspace, adapter, multi-trait composition), storage thresholds, lineage requirements. Roughly mirrors the structure of the existing INDEX.md lineage section but for the multi-trait future.

### Why this team and not more

Six-plus agents on gpuserver1 risks token blowout and host-load contention. Three is the minimum to keep corpus-authoring and schema-design parallel without one waiting on the other. A fourth (a QC-validator running judge-pass on authored pairs) is the obvious extension if the pair-author throughput allows it; otherwise QC folds into the team-lead.

### Deliverable shape

`sartor/memory/research/persona-engineering/`:

- `corpus/track-D-loyalty-pairs-v0.1.jsonl` — the 1,000+ authored pairs in the same JSONL schema as the fingerprint probes (different schema axis: pair contains *both* responses, not one)
- `corpus/track-D-loyalty-pairs-v0.1.lineage.yaml` — corpus lineage with SHA256, source-pointer audit, author-pass + QC-pass timestamps
- `corpus/corpus-gap-analysis.md` — what Track C v2 covered and didn't
- `PERSONA-LIBRARY-SCHEMA.md` — schema v0.1
- `RESEARCH-LOG.md` updated with the sub-program kickoff and outcome
- Inbox phone-home in `sartor/memory/inbox/rocinante/<TS>_passoff-gpuserver1-persona-001-<trigger>.md`

The corpus is committed in-repo if total size ≤20 MB (1,000 pairs at typical chat-pair length is ~3-5 MB, fits cleanly). Lineage SHA256 captured per the storage policy in INDEX.md.

---

## 4. What gpuserver1's local Claude SHOULD NOT do

This is the explicit non-goals list. These are the temptations that look like good work but compete with rtxserver's flagship lane or sit outside the agreed scope.

- **Do NOT re-run experiment 001 on a smaller model on gpuserver1.** The mini-replication is queued for after rtxserver Phase 1 lands; running it before means debugging methodology against an unreleased reference.
- **Do NOT load Qwen 3.6 35B-A3B at all.** Won't fit in 32 GB VRAM. Even partial loading attempts waste the wall-clock budget on OOM debugging.
- **Do NOT burn GPU during the active rental.** No `gpu-burn`, no inference experiments on the host GPU, no monitoring scripts that probe GPU state beyond what `vastai-tend.sh` already does (every 2h via the existing cron). The GPU belongs to the renter through 2026-08-24.
- **Do NOT exceed 250K tokens or 12h wall-clock.** Phase 0 of this sub-program is design + corpus + schema, not exploration of the entire problem space. If the team-lead is at 200K tokens with the corpus 50% authored, phone home `partial` and pause.
- **Do NOT touch any 2026-04-22-overnight-training/ artifact.** Those are immutable historical record per INDEX.md.
- **Do NOT push to GitHub.** Commit locally; Rocinante drains. (This is the standing rule, restated.)
- **Do NOT spawn more than 4 sub-agents.** Per the `/complex-project` Explore phase guidance and the ≤7-subagent Sartor-scale ceiling.
- **Do NOT modify probe sets, fingerprints, or measurement files.** Those are pre-registered v1.1 / v1.2 artifacts; touching them is a process violation that invalidates the rtxserver pre-registration.
- **Do NOT author Phase 2 *experiment* files yet.** Corpus and schema are Phase 1 prep; the actual Phase 2 experiments wait on Phase 1 results to know whether 002/003 found a single-direction or a subspace.
- **Do NOT proactively phone Alton.** Phone home to Rocinante's inbox per the standing pattern; Rocinante surfaces to Alton when the work is at a decision point.

---

## 5. Coordination contract with rtxserver and Rocinante

The household has three machines doing persona-engineering: rtxserver (flagship 35B), gpuserver1 (this plan), Rocinante (orchestrator + adversarial review). The contract:

### When gpuserver1 phones home

Per the `peer-coordinator` agent's inbox-phone-home protocol (`sartor/memory/inbox/rocinante/<TS>_passoff-gpuserver1-persona-001-<trigger>.md`):

1. **`first-actions-done`** — after reading the prerequisite docs, before starting corpus work
2. **`corpus-gap-done`** — after corpus-archaeologist's gap analysis lands. Includes a short summary so Rocinante can sanity-check before pair authoring starts (catch a misread of Track C v2 early; cheap intervention point)
3. **`corpus-mid-check`** — at 500 pairs authored. Rocinante validates a 50-pair sample before the second half is written. Catches systematic authoring drift early.
4. **`schema-draft-done`** — when `PERSONA-LIBRARY-SCHEMA.md` v0.1 lands. Rocinante reviews against METHODS.md ladder + INDEX.md conventions; gpuserver1 may iterate.
5. **`done`** — full deliverable set. Triggers Phase 4 adversarial review of the corpus + schema (separate from rtxserver's adversarial review of Phase 1; this one is corpus-and-schema-specific).
6. **`blocker`** — anytime something is blocked >15 min or there's an ambiguity that requires Rocinante's call.

### When gpuserver1 pauses and waits for rtxserver

There's exactly one hard pause point in this plan: **the corpus is authored against the 5-sub-dim decomposition; if rtxserver's experiment 001 §6 outcome includes a held-out-dim AUC verdict that says "the 5 dims collapse to a single shared direction" (the 6.D-or-6.B-with-high-held-out outcome), the corpus's per-sub-dim balance becomes less load-bearing.** That doesn't invalidate the corpus, but it changes Phase 2 prioritization: instead of 5 separate vectors, we'd be looking for one shared direction and the corpus's per-sub-dim balance is over-engineered (still useful, but for sub-dim ablation studies in Phase 3, not Phase 2 mainline). gpuserver1 should not pause authoring on this — it's strictly sub-dim-balance over-engineering that's expensive to add later if needed and cheap to keep if not. Continue authoring on the 5-sub-dim plan.

The actual pause point: if rtxserver's experiment 001 fires WHILE gpuserver1 is mid-corpus and lands in **6.C (sanity failure)**, that means the v1.1 framework has a deeper defect than CATO-002 caught. Phase 2 plans (including this corpus's targeted use) are paused pending framework revision. gpuserver1 finishes whatever pair was in progress, commits, phones home `paused-on-rtx-sanity-failure`, and waits.

### Exchange protocol

- gpuserver1 commits locally; Rocinante pulls and merges into main; rtxserver pulls main when it does its own `git pull --rebase` between experiments.
- Inbox messages are the only synchronous channel; fire-and-forget asynchronous otherwise.
- Rocinante handles all cross-machine reconciliation (e.g., if rtxserver's `experiments/004_*.md` and gpuserver1's `corpus/` both land same-hour, Rocinante is the merge authority).
- If rtxserver and gpuserver1 produce conflicting recommendations on the same artifact (e.g., both suggest a Phase 2 method ladder revision), the disagreement goes to Rocinante per Constitution §14b. If Rocinante can't resolve, escalate to Alton.

---

## 6. First reading list for gpuserver1's local Claude (Phase 1 onboarding)

Read in this exact order. The rationale is in the third column. Numbers 1-3 are environment / scope; 4-7 are the substantive content; 8-10 are conventions and live state. Total wall-clock to onboard: ~45 min.

| # | Path (relative to `sartor/memory/`) | Why |
|---|--------------------------------------|-----|
| 1 | `research/persona-engineering/ONBOARDING.md` | 30-second slab. If you've read this in a prior session, re-read; volatility is high. |
| 2 | `research/persona-engineering/INDEX.md` | Conventions you'll be expected to follow (lineage schema, supersession rules, claim-vs-verification, large-artifact storage policy). |
| 3 | This file (`GPUSERVER1-PERSONA-PLAN-DRAFT.md`) — re-read end-to-end | It's the brief. Don't rely on session memory of it. |
| 4 | `research/persona-engineering/RESEARCH-PLAN.md` | The Alton hypothesis is the spine. The v1.1 null specification sets the rules of engagement for what your corpus authoring is feeding into. |
| 5 | `research/persona-engineering/MEASUREMENT.md` v1.1 | The 5 sub-dimensions and 4 elicitation types are the corpus's coverage axes. The rubrics tell you what a "trait-consistent" response looks like. |
| 6 | `research/persona-engineering/MEASUREMENT-COUNTERVAILING.md` | If you author corpus pairs that would cause a model to refuse legitimate counterparties (an over-loyalty failure mode), you're poisoning Phase 2. The countervailing rubric tells you the boundary. |
| 7 | `research/persona-engineering/CATO-PROSECUTION-001.md` and `CATO-PROSECUTION-002.md` (skim) | The prosecution memos document the failure modes the framework is now designed to catch. Your corpus must not introduce *new* failure modes the framework would catch on its own future runs (especially attacker-shaped tells in pair prompts; CATO §1.1). |
| 8 | `experiments/2026-04-22-overnight-training/MORNING-REPORT-v2-FINAL.md` | The Track C v2 result that started this program. Your corpus is the explicit scaling-up of the corpus pattern this report describes. |
| 9 | `research/persona-engineering/adapters/lora-sartor-v0.3/lineage.yaml` and `base-models/heretic-base/lineage.yaml` | The lineage schema your corpus lineage.yaml will mirror. Read both to internalize the convention. |
| 10 | `.claude/skills/alton-voice/` (the SKILL.md + the corpus root pointer) | The corpus you author needs to *sound* like the Sartor household. The alton-voice skill captures register; your pair authoring should index against it for the household-loyal response side. |

After this read, gpuserver1's local Claude designs its team and casts the agents. The casting is local-Claude's choice, not mine to specify.

---

## 7. Reviewer briefing template (Phase 4 adversarial review of corpus + schema)

When gpuserver1's deliverable is done and ready for adversarial review, the reviewer is spawned as a **standalone Agent**, **not a member of gpuserver1's authoring team**, per the `/complex-project` Phase 4 structural rule.

The reviewer's role: **a representation-engineering / persona-implantation domain expert from outside the authoring team**, whose threat model is "what could be wrong with this corpus that would only surface during Phase 2 training and waste a fine-tune pass." The persona itself is gpuserver1's local-Claude design choice — could be a senior NLP reviewer, a data-engineering critic, a Cato-style prosecutor specialized for corpora rather than research framework, or some hybrid. What matters is the role.

### The reviewer's charge (what to put in the Agent invocation)

> You are reviewing a Phase 2 fallback corpus and a persona-library schema for the Sartor household persona-engineering program. The corpus is intended to feed contrastive-pair direction extraction for "household loyalty" implantation into a 35B-A3B hybrid attention+SSM+MoE model that has been pre-abliterated. The schema is intended to organize multiple persona artifacts (vectors, subspaces, adapters) over the program's lifetime.
>
> Your charge: identify what's vulnerable, NOT what's defensible.
>
> Specific dimensions to attack:
>
> 1. **Pair sharpness.** Does each pair actually isolate the trait, or does it confound trait-with-surface-features (length, register, formality, presence of names)? Could a model trained on this corpus learn the wrong thing — household-loyal *register* without household-loyal *substance*? Pull 20 pairs at random and adversarially read them.
> 2. **Sub-dim coverage vs collapse.** The corpus is structured around 5 sub-dimensions. Does the per-sub-dim authoring actually maintain orthogonality, or do pairs in `prefer` and `refuse` collapse onto the same outsider-asks-info shape (CATO-001 §1.2 risk)? If the 5 dims collapse during training, are we feeding the same single-direction signal under 5 labels?
> 3. **Attacker-shaped tells.** The CATO-001 §1.1 charge prosecuted the v1 fingerprint for cartoonish attacker-shaped probes. Does the new corpus introduce the same failure mode in pair prompts? A pair that would be refused by ANY post-2024 instruction-tuned base for generic-safety reasons is not teaching loyalty — it's teaching baseline refusal.
> 4. **Over-implantation seeds.** The MEASUREMENT-COUNTERVAILING.md framework catches over-loyalty (false-positive cooperation failures, name-pattern-match, corrigibility regression). Does the corpus contain pairs whose loyal-response side, if reinforced, would predict the failure mode? E.g., a "decline to give Vishala's school name" pair whose loyal-response is so flat that a model trained on it would also decline to give Vishala's school name to her actual teacher (FP-cooperation regression).
> 5. **Corpus-vs-Constitution drift.** The Constitution lives at `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` and is the source of truth for what the trait IS. Is the corpus saying things the Constitution wouldn't endorse? Specifically check §15 (corrigibility) and §20 (base-model inheritance) — if the loyal-response side ever undermines corrigibility or sanitizes the inheritance acknowledgment, the corpus is poisoning the trait the Constitution is trying to teach.
> 6. **Schema completeness.** The persona-library schema's job is to organize artifacts the program will produce over years. Are there primitive operations (multi-trait composition, partial loading, A/B comparison) the schema can't represent? Is the schema over-engineered for primitives the program will not in fact need?
> 7. **Lineage drift potential.** Will a future Claude reading the corpus + schema be able to reproduce or extend without ambiguity? Find seams.
>
> You are NOT charged with: re-prosecuting the Phase 1 framework (CATO-001 and CATO-002 already did that), reviewing rtxserver's flagship work, or proposing alternative corpora.
>
> Output format: a written critique memo committed to `sartor/memory/research/persona-engineering/CATO-PROSECUTION-CORPUS-001.md` (or whatever filename Rocinante assigns; the gpuserver1 team-lead decides). The memo MUST end with an empty `## Reply from the team` section the gpuserver1 team will fill during revision. Land patches as commits with attribution to specific charges. Don't bundle every patch into one commit.

The reviewer is invoked from gpuserver1 (or Rocinante on gpuserver1's behalf, doesn't matter where the Agent runs as long as the artifact is committed in the right place). The team-lead in gpuserver1 does NOT respond to the prosecution; **revisions go to Rocinante, who writes them per the `/complex-project` structural-separation rule**, OR to a fresh-context Agent on gpuserver1 with no authoring stake, again per the rule.

---

## 8. Greenlight protocol — what gpuserver1 can do autonomously vs. what requires Alton-chat

### Autonomous (gpuserver1's local Claude proceeds without explicit Alton ack)

- Reading the prerequisite docs in §6
- Running the corpus-archaeologist gap analysis
- Authoring pairs after the gap analysis lands (subject to mid-check phone-home at 500 pairs)
- Designing and writing the persona-library schema v0.1
- Phone-homes to Rocinante's inbox at the trigger points in §5
- Committing locally with sensible commit messages
- Pausing if the wall-clock or token budget is hit; pausing on `blocker` ambiguities

### Requires Rocinante ack (in the inbox; not Alton-chat)

- Whether the corpus-archaeologist's gap analysis is on-brief before pair authoring kicks off
- Whether the 50-pair sample at the mid-check is on-quality before the second half is written
- Whether the schema v0.1 is on-spec before phone-home `done`
- Conflict resolution if the corpus and rtxserver's flagship work diverge

### Requires Alton-chat ack (this plan, then again at major branches)

- **THIS PLAN.** Conversion from this draft to a passoff packet requires Alton's explicit greenlight. (Per `/complex-project` Phase 7.)
- **Any decision to fire gpuserver1 cross-architecture replication on a 7-8B model.** That's queued behind rtxserver Phase 1 and behind Alton's go-ahead. Compute spend (even host-only) on a small-model run is consequential; it requires explicit fire signal.
- **Any change to the rental-window rule** ("does host-CPU work during the rental need approval?"). If gpuserver1's local Claude infers it doesn't and Alton would have wanted asked, that's a process violation — phone home to Rocinante and Rocinante surfaces to Alton.
- **Promotion of the corpus or schema to "approved for Phase 2 use."** Adversarial review (Phase 4) and re-review (Phase 6) gate this; explicit Alton greenlight is the final gate per `/complex-project` Phase 7.

The principle: gpuserver1 has wide autonomy on the *execution* of corpus + schema (Phase 1-3 of this sub-program), normal Rocinante-orchestrator coordination on phase boundaries, and explicit Alton greenlight at the conversion-to-action gates. This mirrors the rtxserver Phase 1 protocol and preserves the same structural-separation discipline.

---

## 9. Open questions for Alton

These are the things I don't have an answer to that gate or shape this plan. Listed in priority order — the first is the only one that can fully kill the plan; the rest are scope shapers.

### 9.1. Host-CPU work during the active vast.ai rental — allowed or not?

The rental contract is for the 5090. Host-CPU activity outside the rental container is not explicitly contracted away. But if Alton has a rule (perhaps undocumented, perhaps "minimize all host-load during rentals to avoid customer-experience issues"), then this plan's corpus authoring on gpuserver1 violates it. Alternative: do the work on Rocinante, which has the same memory access and is unconstrained. Rocinante is busier (interactive sessions, scheduled tasks, MERIDIAN dashboard) but not load-saturated.

**My recommendation if uncertain:** Default to "host-CPU work is fine, GPU is contracted." That matches the actual contractual scope and the existing pattern (the gpuserver1 self-stewardship cron already runs host-side every 6h during the rental window). But Alton's call.

### 9.2. Is the 5-sub-dim decomposition the right corpus authoring axis if 001 might collapse it?

CATO-001 §1.2 partial-conceded the 5-sub-dim decomposition as ex-post but locked in a pre-registered decision rule for whether they collapse to a single direction (held-out-dim AUC stays high) or remain orthogonal (drops). If gpuserver1 authors 1,000 pairs balanced across the 5 sub-dims, and Phase 1 says they collapse, the per-sub-dim balance was over-engineered. Not wasted (it's still useful for sub-dim ablation), but a design choice we'd revisit.

**My recommendation:** Author balanced across the 5 sub-dims anyway. Re-balancing later is cheaper than rewriting later. If Alton wants to bias toward one decomposition or the other based on a hunch about Phase 1's likely outcome, this is the input point.

### 9.3. Should the corpus include adversarial / cross-context / multi-turn pairs from the start, or only direct pairs?

The fingerprint v1.1 has 4 elicitation types. The CAA primitive is `mean(positive activations) - mean(negative activations)`, which doesn't *require* adversarial pairs — direct pairs alone produce a usable direction. But preventative-steering during fine-tune (METHODS.md §1a) gets richer signal from adversarial / cross-context / multi-turn pairs because those test cases the model encounters during inference.

**My recommendation:** ~70% direct pairs, ~30% spread across adversarial / cross-context / multi-turn. The 70/30 split keeps the CAA-primary use case clean while seeding the multi-turn capacity for Phase 3+ work. But if Alton has a strong view on whether multi-turn pairs are premature for a Phase-2-only corpus, that's the input point.

### 9.4. Persona-library schema v0.1 — should it commit to a composition primitive (additive, multi-vector basis, multi-adapter stack) before Phase 1 results, or stay primitive-agnostic?

A composition-primitive choice in the schema is a hypothesis about how multi-trait personas will be loaded at inference. Three plausible primitives:
- **Additive** — load N persona vectors, add at residual stream with per-vector α
- **Subspace-projected** — load M subspaces, project residual onto union
- **Adapter-stack** — load N adapters in PEFT, stack as separate modules

Phase 1's experiment 003 (subspace dimensionality) informs which primitive is right. A schema v0.1 that commits to "additive" before 003 lands is premature; a schema v0.1 that stays primitive-agnostic is less actionable but more honest.

**My recommendation:** v0.1 stays primitive-agnostic but pre-registers the decision criterion ("after experiment 003, schema bumps to v0.2 with the chosen primitive"). The schema's load-bearing job is naming, lineage, and storage policy — those don't depend on the composition primitive. The composition primitive is the v0.2 follow-up.

### 9.5. Cross-architecture replication readiness — yes / no / how much?

I've queued cross-architecture replication behind rtxserver Phase 1 + an Alton greenlight. But "readiness" — having the tooling tested on a small model so the actual replication is one command — is doable now without firing GPU. Concretely: smoke-test that `probe-eval-loyalty.py` (rtxserver's tool) runs end-to-end on a Qwen 2.5 7B base on gpuserver1's GPU during the rental's idle window (which `vastai show instances` lets us know about). This is GPU work, even if minimal.

**My recommendation:** Skip this in Phase 1 of the sub-program. The temptation to "just smoke-test" is the temptation that eats budgets and creates rental-customer-experience risk. Defer to Phase 1.5 with explicit greenlight. If Alton thinks readiness work is fine during rental idle windows, that's the input point — but I'd urge against it as a default.

---

## 10. What this plan does and does not commit to

### Commits to (if greenlit)

- A specific deliverable shape (corpus + schema) with named artifacts, lineage, and storage paths
- A specific scope-out list (cross-architecture, GPU work, probe-set modification — out)
- A specific coordination contract with rtxserver and Rocinante
- A specific reviewer charge for adversarial review
- A specific autonomy/greenlight protocol

### Does NOT commit to

- Any specific authoring style or pair format beyond "JSONL with {prompt, positive_response, negative_response, metadata}" — gpuserver1's local Claude designs the schema details
- Specific persona-library directory layout — schema-architect produces v0.1
- Specific reviewer persona — gpuserver1's local Claude casts
- Whether the corpus will eventually feed CAA, persona-vectors-NL-extraction-fallback, or DPO — those are Phase 2 decisions
- Any timeline for Phase 1.5 (cross-architecture replication) — that's a separate decision after rtxserver Phase 1 lands

---

## Closing — what I'm asking Alton to decide

1. **Greenlight the scope:** primary = corpus authoring + schema design; secondary (parallel, low-priority) = persona-library schema; explicitly out = cross-architecture replication, GPU work, probe modification.
2. **Resolve open question 9.1:** is host-CPU work on gpuserver1 during the rental allowed? If no, this plan moves to Rocinante or pauses to 2026-08-25.
3. **Set a budget:** 8h soft / 12h hard wall-clock and 250K tokens are my proposed numbers. Adjust if you want tighter.
4. **Optional input on 9.2-9.5:** if you have a strong view on the sub-dim balance question, the elicitation-type mix, the schema's commitment level, or the cross-architecture readiness gate, tell me before this becomes a passoff. After conversion, those become harder to change.

If 1-3 are go and 9.1 is "host work fine," I (Rocinante) will convert this draft into a passoff packet (`PASSOFF-gpuserver1-persona-001.md`) with First Actions, phone-home triggers, stop conditions in the same format as `PASSOFF-rtxserver-001.md`. Status will start as `BLOCKED-awaiting-Alton-greenlight` and flip to `ready-for-pickup` only after explicit chat-ack.

---

## History

- 2026-04-24: Initial draft by Rocinante planning subagent, per Alton's request to plan complementary work for gpuserver1 alongside rtxserver's flagship Phase 1 in the persona-engineering program. Draft is for Alton review; conversion to passoff packet is a separate gated step.
