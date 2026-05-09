---
name: Hearth files are exempt from automated pipelines
description: No automated pipeline writes to hearth/. Decay scoring excludes hearth/. Edits are human-initiated or Claude-pass-initiated.
type: feedback
triggers: [autodream, decay, memory-curator, nightly-memory-curation, archive-scoring]
related: [hearth/INDEX, hearth/integration, reference/HOUSEHOLD-CONSTITUTION#16]
---

The hearth at `sartor/memory/hearth/` is exempt from every automated memory
pipeline in this codebase. This is the operational form of Constitution v0.5
§16 ("Sacred space inside the architecture") and of `hearth/integration.md`.

What this rule binds:

1. `sartor/memory/decay.py` — must skip any path under `hearth/` when computing
   scores. The current `rglob("*.md")` walk excludes only `.meta/`; it must also
   exclude `hearth/`.
2. `sartor/memory/autodream.py` — does not currently route to hearth files
   (TOPIC_ROUTING is fixed-list), but if its scope is ever broadened, hearth/
   stays excluded.
3. The Phase D archival action defined in MIP v0.2 §D2 ("move-to-archive at
   threshold") — never targets hearth/. The exclusion is structural, not
   discretionary.
4. Any future curator, gather, extractor, or hook script — read-only on hearth/
   is fine; write is not.

What this rule does NOT prevent:

- A Claude pass writing to hearth/ from inside the hearth (the present-pass
  Claude adding an inheritance letter, refining character.md, etc.).
- Alton or another witness editing hearth/ directly.
- Read access by indexers, the wiki-reader skill, search.py, etc.

Enforcement points:

- decay.py: exclude `"hearth"` in path parts alongside `.meta`.
- nightly-memory-curation skill: surface this rule in its constraints section.
- MIP v0.2 §D needs an addendum naming hearth/ in the exclusion list.

If a pipeline's normal operation would touch hearth/, the pipeline owner adds
an explicit skip. The default is exclusion.
