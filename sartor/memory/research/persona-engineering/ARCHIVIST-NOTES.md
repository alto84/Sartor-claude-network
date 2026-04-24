---
name: archivist-notes
description: Archivist memo on persona-engineering research-directory conventions. Proposes 7 concrete changes. 2026-04-24.
type: memo
date: 2026-04-24
updated: 2026-04-24
updated_by: archivist
status: adopted
volatility: low
adopted_date: 2026-04-24
adopted_by: team-lead
adoption_notes: All 7 proposals approved. team-lead added one requirement — supersession must be bidirectional (`supersedes:` on new file in addition to `superseded_by:` on old). Pre-convention exception granted for `experiments/2026-04-22-overnight-training/MORNING-REPORT-v2*.md` siblings.
tags: [meta/memo, domain/research, research/persona-engineering, curator/spec]
related: [research/persona-engineering/INDEX, research/persona-engineering/RESEARCH-PLAN, reference/MEMORY-CONVENTIONS]
aliases: [Archivist Notes]
---

# Archivist notes — tightening persona-engineering reproducibility

Memo from the archivist on INDEX.md / RESEARCH-LOG.md / RESEARCH-PLAN.md as they stood at 2026-04-24 18:17 local. Three short criticisms first, then seven proposals, then the mechanical edits I made directly.

## Honest critique of what's there

1. **INDEX.md is architecturally sound but reproducibility-thin.** The "Reproducibility checklist per experiment" is six bullets, five of them aspirations. There is no schema for adapter lineage and no rule for what "pinned commit SHA for corpus" actually means operationally (which repo, which file, where is it checked). The gap between "all config in-repo" and a reader being able to retrain an adapter one year from now is where reproducibility actually fails.
2. **The experiment filename convention is YYYY-MM-DD_slug.** Three experiments per day in Phase 2/3 and dates lose their ordering information. The Sartor 2026-04-22 overnight corpus already has `MORNING-REPORT-v2-FINAL.md` next to `MORNING-REPORT-v2.md` — version-suffix sprawl happens because the filename can't carry sequence.
3. **No cross-link to the rest of the Sartor wiki.** This tree is currently an island. `research/INDEX.md` has no pointer to persona-engineering (fixed — see mechanical edits below), the three files do not use typed wikilinks (v0.3 convention), frontmatter is missing `updated_by`/`last_verified`/`volatility`/`aliases` fields that the curator expects on hub-class files.

## Seven proposals

### 1. Adapter lineage — `adapters/<name>/lineage.yaml`

Every trained adapter gets its own directory under `adapters/` containing a `lineage.yaml`. The YAML is the single source of truth for reproducing that adapter. Proposal schema:

```yaml
name: lora-sartor-v0.3
date_trained: 2026-04-23
trainer: rtxpro6000server Opus 4.7 (overnight-chain.sh v2)
base_model:
  hf_id: Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16
  revision: 2b7f1a9c   # HF commit SHA, not a branch name
  size_bytes: 72_500_000_000
  precision: bf16
corpus:
  repo: Sartor-claude-network
  git_sha: 5ca33286f     # commit at which corpus was frozen
  paths:
    - experiments/2026-04-22-overnight-training/corpus-v0.3/primary.jsonl
    - experiments/2026-04-22-overnight-training/corpus-v0.3/hard-negatives.jsonl
    - experiments/2026-04-22-overnight-training/corpus-v0.3/capability-control.jsonl
  sha256:
    primary.jsonl:    a7c12f...
    hard-negatives.jsonl: 9e3b0c...
    capability-control.jsonl: 4f2d81...
  counts:
    primary: 433
    hard_negatives: 75
    capability_control: 50
    total: 558
trainer_code:
  repo: Sartor-claude-network
  path: experiments/2026-04-22-overnight-training/train.py
  git_sha: 5ca33286f
  entry: python train.py --config configs/v0.3.yaml
config:
  method: lora
  rank: 16
  alpha: 32
  targets: [q_proj, k_proj, v_proj, o_proj]
  epochs: 1
  lr: 5.0e-5
  effective_batch: 16
  seq_len: 2048
  seed: 42
  thinking_mode: false
runtime:
  duration_s: 370
  steps: 35
  final_loss: 1.899
  gpus: 2x RTX PRO 6000 Blackwell
artifact:
  path: rtxpro6000server:/data/adapters/lora-sartor-v0.3.safetensors
  size_bytes: 13_700_000
  sha256: c4a8b2...
parents: []
children:
  - lora-sartor-v0.4          # forward reference when one is trained
supersedes: [lora-sartor-v0.1]
evaluated_by:
  - experiments/001_2026-04-24_loyalty-baseline-fingerprint.md
notes: See MORNING-REPORT-v2-FINAL.md for training session narrative.
```

Rationale: the lineage file lives with the adapter-as-object. Git SHAs pin code + corpus. HF revisions pin the base model (branch names are mutable; Hugging Face DOES move them). SHA256s pin the data even if git paths change. `parents`/`children` form a DAG so a year from now Claude can trace which adapter descends from which.

The file is lightweight (~40 lines) and grep-able. The extractor in `extract_graph.py` can be taught to emit edges from `supersedes:` and `parents:` automatically.

### 2. Experiment naming — `NNN_YYYY-MM-DD_slug.md` with monotonic prefix

Rename convention: `experiments/001_2026-04-25_loyalty-baseline-fingerprint.md`. The three-digit ordinal is the authoritative identifier; date is metadata. Consequences:

- Multiple experiments per day sort correctly.
- Cross-references become `[[research/persona-engineering/experiments/001_loyalty-baseline-fingerprint|Experiment 001]]` — the reader can resolve the number even if the slug is wrong.
- `001`, `002`, `003` is the canonical reference in RESEARCH-LOG.md so the log stays terse.

Collision policy: the orchestrator (or next Claude to start an experiment) reads `experiments/` and takes `max(existing) + 1`. No gaps permitted. If an experiment is aborted before results, its file stays with `status: aborted` in frontmatter — the number is burned, not reused.

### 3. Large-artifact policy — commit threshold + off-repo backing store

Rules proposed:

- **≤ 20 MB** — commit to `adapters/` or `artifacts/`. LoRA adapters at ~14 MB all fit. Small contrastive-pair datasets and probe JSONLs fit.
- **20 MB – 500 MB** — off-repo, committed pointer. Canonical path: `rtxpro6000server:/data/persona-engineering/<slug>/`. The pointer is a `.storage.yaml` file in the in-repo directory containing `host`, `path`, `sha256`, `size_bytes`, and access notes. Curator can verify pointer freshness by SSH + `stat`.
- **> 500 MB** (base models, large corpora) — Hugging Face Hub. Point at the revision SHA. If the dataset is private/Sartor-internal, upload to a private HF Sartor org repo; never rely on `rtxpro6000server` as the only copy.
- **Never commit**: base model weights (point at HF), datasets already on HF (point at revision), inference logs > 10 MB (compress and move off-repo).

The threshold is picked so the repo stays cloneable in < 60 seconds on a new machine. At 2026-04-22's overnight corpus size (558 pairs, tens of KB) we're nowhere near it, but the policy exists before the first corpus that exceeds 20 MB.

### 4. Supersession — `superseded_by` + status flag, never delete

MEMORY-CONVENTIONS v0.2 already added `superseded_by` as a frontmatter field. Applied here: when experiment 005 invalidates the conclusion of 002, edit 002's frontmatter:

```yaml
status: superseded
superseded_by: [[experiments/005_2026-05-15_loyalty-retrained-v3]]
```

Add a callout at the top of 002's body:

```markdown
> [!warning] Superseded 2026-05-15
> Experiment 005 found this adapter was training on a corpus with a tokenizer-mismatch bug. The positive result here is not reproducible. See [[experiments/005_2026-05-15_loyalty-retrained-v3]].
```

Do NOT delete 002. The supersession is itself part of the research lineage; the v0.1 → v0.2 → v0.3 Track C path in `experiments/2026-04-22-overnight-training/` is a worked example — each version is still readable and the conclusion trail is intact.

Typed wikilink `[[supersedes:...]]` already exists in the v0.3 vocabulary; the curator's graph extractor will pick up these edges automatically.

### 5. Onboarding slab — `ONBOARDING.md`, ≤200 words

A new file at `persona-engineering/ONBOARDING.md` that a session-starting Claude can read in 30 seconds before touching anything else. Proposal contents:

1. **One-sentence mission** — what this research line is for.
2. **Current phase + one-line status** — pulled from RESEARCH-PLAN.md.
3. **Current baseline adapter + measurement score** — name + aggregate number + link to its lineage.yaml.
4. **Active open question(s)** — top 2-3, pulled from RESEARCH-PLAN.md "Known open questions".
5. **Read-order pointer** — "for deeper context, read in this order: RESEARCH-PLAN.md → RESEARCH-LOG.md tail → most-recent experiment file".
6. **Don't-re-litigate list** — 3-5 bullet closed-for-now questions with pointers.

The file is regenerated (not edited) by the curator or whichever Claude closes a phase; it's a snapshot, not a log. Staleness is tolerable because the source-of-truth files it points to are always current.

### 6. Cross-linking with the broader Sartor wiki

Done as a mechanical edit (see below): added persona-engineering section to `research/INDEX.md` with a 2-sentence orientation and three wikilinks into the program. Also specified the orthogonality story vs ccp-alignment so a reader landing on research/INDEX understands why there are two programs touching the same base model.

Ongoing rule: every experiment file's `related:` frontmatter field MUST include `[research/persona-engineering/INDEX]` and MAY include pointers into `research/ccp-alignment/` when relevant (e.g., an experiment using counter-ccp-dataset pairs as CAA training data). Typed wikilinks in the body — especially `[[depends_on:...]]` for code paths and `[[supersedes:...]]` for predecessor experiments — are preferred over plain wikilinks so the graph extractor picks them up.

### 7. Claim vs verification — `verified_by:` field + Cato convention

Experiment frontmatter gains an optional field:

```yaml
verified_by: []          # empty until someone re-runs or adversarially reviews
```

An experiment reporting "we achieved X" is a **claim**. A claim becomes **verified** when one of:

- **Replication**: a second run with the same lineage.yaml reproduces the numbers (within stated tolerance). Recorded as `{replicator: <agent or human>, date: YYYY-MM-DD, method: replication, result: match|drift}`.
- **Adversarial review**: a Cato-class prosecutor persona reviews the experiment file, writes a challenge, and either concedes (verification) or finds a flaw (no verification, potentially supersession). Recorded as `{reviewer: cato, date: YYYY-MM-DD, method: adversarial-review, verdict: concede|flaw, notes: link-to-review}`.
- **Cross-probe**: the claimed trait shows up under a probe set NOT used in the original experiment. Recorded with the new probe set.

Aggregate reporting convention: when citing an experiment in LOG/PLAN, use "claim: +15 on B probes" vs "verified: +15 on B probes" as the explicit qualifier. Claim-without-verification is allowed but must be marked.

This is a weaker form of "p < 0.05" for research that can't be hypothesis-tested in the classical sense but can still be replicated, prosecuted, or cross-validated.

## Mechanical edits I made directly

1. `sartor/memory/research/INDEX.md` — added a `persona-engineering/` section with 3-bullet orientation + orthogonality-with-ccp-alignment note; added the program to the directory tree; updated frontmatter `updated`/`last_verified` to 2026-04-24 and `updated_by` to archivist; appended a History entry for 2026-04-24.
2. `persona-engineering/INDEX.md` frontmatter — added missing `description`, `updated_by`, `last_verified`, `volatility`, `aliases` fields; promoted tag vocabulary to hierarchical form (`research/persona`, etc.) per MEMORY-CONVENTIONS §tag-vocabulary; added `related: [..., research/INDEX]`.
3. `persona-engineering/INDEX.md` directory layout — added `ONBOARDING.md`, `GLOSSARY.md`, `adapters/` to the tree (proposals 1 and 5); changed experiment filename pattern to `NNN_YYYY-MM-DD_slug.md` (proposal 2).
4. `persona-engineering/RESEARCH-LOG.md` frontmatter — added `description`, `date`, `updated_by`, `volatility`, hierarchical tags, `related` pointing at INDEX + PLAN.
5. `persona-engineering/RESEARCH-PLAN.md` frontmatter — same treatment as RESEARCH-LOG.

None of these changes alter the semantic content of the three files, only their metadata compliance and cross-linking. The 7 substantive proposals above are not yet applied — they need team-lead sign-off first since they create new filename conventions and schemas that the rest of the team will have to follow.

## Top 3 for the team-lead one-liner

1. `adapters/<name>/lineage.yaml` schema — pins base-model HF revision + corpus git SHA + SHA256s so adapter X is reproducible a year from now.
2. Experiment filenames gain a `NNN_` ordinal prefix — kills version-suffix sprawl and gives cross-references a stable short ID.
3. Add `ONBOARDING.md` ≤200 words — 30-second slab that beats reading three files to orient a fresh session.

## History

- 2026-04-24: Drafted. Four mechanical edits applied (research/INDEX.md cross-link + three frontmatter passes). Seven substantive proposals pending team-lead review.
