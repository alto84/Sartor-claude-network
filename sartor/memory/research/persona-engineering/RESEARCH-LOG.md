---
name: persona-engineering-log
description: Append-only dated log for the persona-engineering program. Tail is current state.
type: research-log
date: 2026-04-24
updated: 2026-04-24
updated_by: archivist (conventions landed)
volatility: high
tags: [meta/log, domain/research, research/persona-engineering]
related: [research/persona-engineering/INDEX, research/persona-engineering/RESEARCH-PLAN]
---

# Persona Engineering — research log

Append-only dated log. Tail is the most recent state.

---

## 2026-04-24 20:40 UTC — Rocinante Opus 4.7 (orchestrator)

Directory structure created. Team spawned to populate foundational docs:

- **litmap**: Literature review — abliteration, activation steering, RepE, ReFT, CAA, ITI, Constitutional AI. Writes `LITERATURE.md` + per-paper notes.
- **mechanism**: Methods inventory — what implantation techniques exist, their tradeoffs, what we can actually run on 2x Blackwell in bf16. Writes `METHODS.md`.
- **measurement**: Fingerprint probe design + depth-of-embodiment scoring rubric for "household loyalty" (decomposed into 5 dimensions). Writes `MEASUREMENT.md`.
- **experiment**: First-experiment proposal — scoped to what we can run this week. Writes `experiments/2026-04-25_loyalty-baseline-fingerprint.md`.
- **archivist**: Reviews and tightens the log/experiment conventions in `INDEX.md`, proposes any structural improvements.

Cato (existing prosecutor persona) sits outside the team as external review at the end.

Track C v2 LoRA (`lora-sartor-v0.3`) is the current baseline. Scored +18 base vs +15 tuned on 34 probes; no capability regression. See `experiments/2026-04-22-overnight-training/MORNING-REPORT-v2-FINAL.md`.

---

## 2026-04-24 22:30 UTC — archivist (Rocinante Opus 4.7)

Conventions tightened, all seven [[ARCHIVIST-NOTES]] proposals approved by team-lead and now binding:

1. **Adapter lineage** — `adapters/<name>/lineage.yaml` schema in INDEX.md. Template at `adapters/_TEMPLATE/lineage.yaml`. Backfilled `adapters/lora-sartor-v0.3/lineage.yaml` from MORNING-REPORT-v2-FINAL — five fields are `null # TODO-backfill` (HF revision SHA, corpus git SHA, three corpus SHA256s, training seed, artifact SHA256) and should be filled during experiment 001.
2. **NNN_ ordinal filenames** — `experiments/2026-04-25_loyalty-baseline-fingerprint.md` renamed to `experiments/001_2026-04-25_loyalty-baseline-fingerprint.md`. Cross-references updated. `experiment` agent acknowledged the convention before writing the file.
3. **ONBOARDING.md** — written. ≤200 words; mission, current phase, working baseline, top open questions, read-order, do-not-re-litigate list.
4. **Large-artifact storage policy** — ≤20 MB in-repo, 20–500 MB off-repo with `.storage.yaml` pointer to `rtxpro6000server:/data/persona-engineering/`, >500 MB on HF Hub.
5. **Supersession** — bidirectional `supersedes:` + `superseded_by:` frontmatter required (per team-lead addition). `> [!warning]` callout at top of superseded body. Pre-convention exception: `experiments/2026-04-22-overnight-training/MORNING-REPORT-v2-FINAL.md` and siblings stay as immutable historical record.
6. **Claim vs verification** — `verified_by: []` default; three verification paths (replication / Cato adversarial review / cross-probe). Citations qualify "claim:" vs "verified:" explicitly.
7. **Cross-link with sartor wiki** — `research/INDEX.md` carries persona-engineering section + tree entry; orthogonality story (subtraction vs addition) vs `ccp-alignment` written in.

ARCHIVIST-NOTES.md status moved from `proposal` to `adopted`. Memo retained as the rationale record.
