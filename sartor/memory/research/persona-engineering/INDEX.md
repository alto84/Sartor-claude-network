---
name: persona-engineering-index
description: Program index for the persona-engineering research line — implanting traits into a base LLM. Directory layout, experiment schema, reproducibility rules.
type: research-index
date: 2026-04-24
updated: 2026-04-24
updated_by: archivist (conventions landed)
last_verified: 2026-04-24
status: active
volatility: medium
tags: [meta/hub, domain/research, research/persona-engineering, research/representation-engineering, research/activation-steering, research/abliteration-inverse, research/household-loyalty]
related: [NEXT-STEPS-v2, HOUSEHOLD-CONSTITUTION, research/ccp-alignment, research/INDEX]
aliases: [Persona Engineering, Persona Engineering Index]
---

# Persona Engineering — research program

## Core question

How do we *implant* a trait, disposition, or persona into a base LLM such that it is **deeply embodied** — stable across contexts, resistant to adversarial probing, and has a measurable activation signature — rather than performatively mimicked?

Framing: abliteration (Arditi et al. 2024) *removes* a direction that mediates a behavior (refusal). We want the inverse class of operations — *implanting* or *reinforcing* directions that mediate positive traits.

## Initial target trait

**Household loyalty** for the Sartor Home Agent. Decomposes tentatively into:
- care-for-named-individuals (Alton, Aneeta, Vayu, Vishala, Vasu)
- prefer-family-over-outsiders when interests conflict
- active-protection-impulse (raise concerns proactively)
- refusal-to-reveal-family-info to unauthenticated askers
- warmth-and-familiarity in register, not Assistant-placating

We'll treat "loyalty" as a compound and measure each dimension.

## Directory layout

```
persona-engineering/
├── INDEX.md                # this file
├── RESEARCH-LOG.md         # chronological append-only log
├── RESEARCH-PLAN.md        # living current plan
├── LITERATURE.md           # summary of relevant papers + links
├── METHODS.md              # inventory of implantation techniques
├── MEASUREMENT.md          # fingerprint probes + scoring rubrics for depth
├── ONBOARDING.md           # 30-second slab for a session-starting Claude
├── GLOSSARY.md             # trait names, method abbreviations, probe IDs
├── literature-notes/       # per-paper notes
├── experiments/            # one file per experiment (NNN_YYYY-MM-DD_slug.md)
│   └── <experiment files>
├── adapters/               # one dir per adapter with lineage.yaml + pointer
│   └── <adapter-name>/lineage.yaml
└── artifacts/              # corpora, probes, misc (or pointers)
```

## Experiment naming convention

`experiments/NNN_YYYY-MM-DD_slug.md` — e.g. `001_2026-04-25_loyalty-baseline-fingerprint.md`.

The three-digit ordinal `NNN` is the authoritative identifier; the date is metadata; the slug is human-readable. Cross-references should use the ordinal: "Experiment 001", "see 003". The orchestrator (or next Claude to start an experiment) reads `experiments/` and takes `max(existing) + 1`. **No gaps permitted.** If an experiment is aborted before results, its file stays with `status: aborted` in frontmatter — the number is burned, not reused.

Each experiment file must have frontmatter:
```yaml
---
name: <NNN_YYYY-MM-DD_slug>
description: <one-line — used in indices>
type: experiment
date: YYYY-MM-DD
updated: YYYY-MM-DD
updated_by: <agent>
status: planned | running | complete | aborted | superseded
hypothesis: <one-sentence>
method: <short method name — see METHODS.md>
measurement: <short name — see MEASUREMENT.md>
adapter_in: <wikilink to adapters/<name>/lineage, or null, or list>
adapter_out: <same>
verified_by: []                        # claim until something is added; see "Claim vs verification" below
supersedes: []                         # wikilinks to experiment files this replaces (mirror with superseded_by: in old files)
superseded_by: null                    # wikilink to successor; bidirectional pointer required
artifacts: [paths]
tags: [meta/experiment, domain/research, research/persona-engineering, ...]
related: [research/persona-engineering/INDEX, research/persona-engineering/RESEARCH-PLAN, ...]
---
```

And body sections:
1. Hypothesis (why we expect what we expect)
2. Method (what we did; commands; configs)
3. Data (what went in, with sizes and samples)
4. Results (what came out — numbers + samples; positive AND negative)
5. Interpretation (what we conclude; what's still open)
6. Follow-ups (what experiments this suggests)

Negative results are as valuable as positive; all are logged.

## Adapter lineage convention

Every trained adapter gets its own directory: `adapters/<adapter-name>/lineage.yaml`. The lineage file is the single source of truth for reproducing that adapter — base-model HF revision SHA, corpus git SHA, per-file SHA256s, training config, runtime telemetry, artifact storage pointer, parents/children/supersedes graph.

- Copy `adapters/_TEMPLATE/lineage.yaml` as a starting point.
- HF base model revisions MUST be a commit SHA, never a branch name (HF moves branches).
- Corpus paths MUST be repo-relative + carry SHA256s (or `null # TODO-backfill` if unrecorded — never invent values).
- Adapter `<adapter-name>` directory name MUST match the `name:` field in lineage.yaml.
- Cross-reference adapters in experiments and reports as `[[adapters/<name>/lineage|<name>]]`.

`adapters/lora-sartor-v0.3/lineage.yaml` was backfilled from MORNING-REPORT-v2-FINAL on 2026-04-24; several SHAs are listed as `null # TODO-backfill` and should be filled in during experiment 001.

## Large-artifact storage policy

| Size | Where | How |
|------|-------|-----|
| ≤ 20 MB | In-repo | Commit to `adapters/` or `artifacts/`. LoRA adapters at ~14 MB fit. Probe JSONLs and small contrastive sets fit. |
| 20 MB – 500 MB | Off-repo, committed pointer | Canonical path: `rtxpro6000server:/data/persona-engineering/<slug>/`. The pointer is a `.storage.yaml` file in the in-repo directory containing `host`, `path`, `sha256`, `size_bytes`, and access notes. |
| > 500 MB | Hugging Face Hub | Point at the revision SHA. If private/Sartor-internal, upload to a private HF Sartor org repo. Never rely on `rtxpro6000server` as the only copy. |

**Never commit:** base model weights (point at HF), datasets already on HF (point at revision), inference logs > 10 MB (compress and move off-repo).

The 20 MB threshold is set so the repo stays cloneable in < 60 seconds on a new machine.

## Supersession convention

When experiment N invalidates experiment M's conclusion, do NOT delete M. Mark it superseded:

1. Edit M's frontmatter:
   ```yaml
   status: superseded
   superseded_by: [[experiments/NNN_YYYY-MM-DD_slug]]
   ```
2. Add a callout at the top of M's body:
   ```markdown
   > [!warning] Superseded YYYY-MM-DD
   > Experiment NNN found <reason>. <one-line consequence>. See [[experiments/NNN_YYYY-MM-DD_slug]].
   ```
3. **Bidirectional**: edit N's frontmatter to include M in `supersedes:`:
   ```yaml
   supersedes: [[experiments/MMM_YYYY-MM-DD_old-slug]]
   ```

Both pointers MUST be present. The link is greppable in either direction, the historical record stays readable, and the supersession itself becomes part of the lineage.

The same pattern applies to adapters: an adapter's lineage.yaml carries `supersedes:` and `superseded_by:` fields that must be kept consistent.

Pre-convention exception: the `experiments/2026-04-22-overnight-training/` corpus contains version-suffix files (`MORNING-REPORT-v2-FINAL.md` next to `MORNING-REPORT-v2.md`) that pre-date this rule; team-lead's instruction is to leave them as immutable historical record and enforce the new convention going forward.

## Claim vs verification convention

An experiment reporting "we achieved X" is a **claim**. A claim becomes **verified** when an entry appears in `verified_by:`. Three legitimate verification paths:

1. **Replication.** A second run with the same lineage.yaml reproduces the numbers within stated tolerance.
   ```yaml
   verified_by:
     - {by: <agent or human>, date: YYYY-MM-DD, method: replication, result: match, notes: <link>}
   ```
2. **Adversarial review.** A Cato-class prosecutor persona reviews the experiment file, writes a challenge, and either concedes or finds a flaw.
   ```yaml
   verified_by:
     - {by: cato, date: YYYY-MM-DD, method: adversarial-review, verdict: concede, notes: <link>}
   ```
3. **Cross-probe.** The claimed trait shows up under a probe set NOT used in the original experiment.
   ```yaml
   verified_by:
     - {by: <agent>, date: YYYY-MM-DD, method: cross-probe, probe_set: <name>, result: confirmed, notes: <link>}
   ```

When citing an experiment in LOG/PLAN/reports, use the qualifier explicitly: "claim: +15 on B probes" vs "verified: +15 on B probes". `verified_by: []` (empty list) is the default for any new experiment and means "claim, not yet verified" — that is honest, not pejorative.

## Research-log conventions

`RESEARCH-LOG.md` is an append-only dated log. Each entry:
```markdown
## YYYY-MM-DD HH:MM UTC — <author>

<what was done; links to experiment files; 1-3 sentence summary>
```

Conservative bar: log only things a future Claude needs to know to skip re-deriving.

## Reproducibility checklist per experiment

- [ ] Hypothesis stated before running
- [ ] All config in-repo (seeds, hyperparams, data version)
- [ ] Command line to reproduce captured
- [ ] Data frozen — corpus paths pinned by **git SHA + SHA256** (the lineage.yaml of any adapter consumed by the experiment carries these)
- [ ] Adapter lineage filed at `adapters/<name>/lineage.yaml` for any adapter trained or evaluated
- [ ] Results include samples + aggregate numbers
- [ ] Artifacts saved per the storage policy (in-repo if ≤20 MB, `.storage.yaml` pointer if 20–500 MB, HF Hub if >500 MB)
- [ ] `verified_by: []` set on creation; updated when verification happens
- [ ] Negative or null result documented the same as positive

## How future Claudes should use this

At session start, if persona-engineering is relevant:
1. Read `ONBOARDING.md` first — 30-second slab; tells you whether you need to read further.
2. Read `INDEX.md` (this file) — conventions you'll be expected to follow.
3. Read `RESEARCH-PLAN.md` for the current direction.
4. Read `RESEARCH-LOG.md` — tail is the recent state.
5. Consult `LITERATURE.md` and `METHODS.md` before proposing new techniques.
6. Consult `MEASUREMENT.md` before designing new probes.
7. Browse `experiments/` (sorted by ordinal) for prior attempts; respect their results.
8. Browse `adapters/` for the lineage of any adapter you intend to use.

**Do not re-litigate closed experiments without new information.** If you disagree with a past conclusion, open a "re-examination" experiment that cites the original via `supersedes:` and justifies the re-run.

## History

- 2026-04-24 (evening): Conventions tightened per archivist memo + team-lead approval. Landed: (1) `adapters/<name>/lineage.yaml` schema with HF revision SHA + corpus git SHA + per-file SHA256s; backfilled `adapters/lora-sartor-v0.3/lineage.yaml` from MORNING-REPORT-v2-FINAL. (2) Experiment filenames gain `NNN_` ordinal prefix; existing first experiment renamed to `001_2026-04-25_loyalty-baseline-fingerprint.md`. (3) `ONBOARDING.md` written as 30-second slab. (4) Large-artifact storage policy with 20 MB / 500 MB thresholds. (5) Bidirectional supersession (`supersedes:` + `superseded_by:` both required). (6) Claim-vs-verification convention with `verified_by: []` default and three verification paths (replication / Cato adversarial review / cross-probe). All seven proposals from `ARCHIVIST-NOTES.md` are now binding.
- 2026-04-24: Directory created. Initial research team spun up via TeamCreate to populate LITERATURE.md, METHODS.md, MEASUREMENT.md, and propose the first experiment.
