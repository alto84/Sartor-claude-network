---
name: federation-grep-before-delegation
description: Before spawning a subagent for "is X known?" questions, run a single federated Grep across the whole repo first. Three seconds. Often answers the question without delegation. Triggered 2026-05-02 by 185 Davis (solvable in 5 seconds; spawning a Drive subagent was over-engineering).
type: feedback
created: 2026-05-02
status: active
tags: [feedback/active, behavior/delegation, behavior/search-first, memory/federated]
---

# Cheap federated grep beats delegation for entity lookups

For "is X already known?" / "what do we have on X?" / "have we seen this name before?" questions, the cheapest first move is a single federated `Grep` across the whole repo (no `path:` filter). It costs sub-second wall time and zero subagent overhead. It answers the question outright maybe 70% of the time. Spawning a subagent for it is over-engineering, and worse, it routes the answer through a scope clause you have to write correctly (see [[subagent-scope-discipline]]) when you could have just looked.

**Why:** Alton 2026-05-02, after I dispatched a Drive-cataloging subagent to figure out whether "185 Davis" was a known entity:

> "I think this is the type of thing that 1. we could ask the family wiki, 2. you always know to do this first for these types of questions."

The 185 Davis case was solvable in 5 seconds with `Grep "185 Davis"` across `C:\Users\alto8\Sartor-claude-network\`. Five hits would have come back instantly from `work/taxes/`, `work/family/`, and `dashboard/family/finances.json`. Delegating it instead added latency, added a scope-clause failure mode, and shifted the orchestrator out of the search loop.

**How to apply:**

Decision procedure when you encounter an entity (name, address, account, document, person, project) you don't immediately recognize:

1. **First move: federated Grep.** Run `Grep` for the term across the whole repo, no `path:` filter. ~3 seconds. Try the literal spelling first.
2. **If hits: read 2-3 of them.** That usually answers the question. Pieces fit together: a 1098 + a Vermont Mutual condo policy + a finances.json line item adds up to "rental condo through Leader Bank."
3. **If zero hits, try variants** before assuming new: capitalization variants, partial matches, common synonyms ("185 Davis" / "Davis Avenue" / "185 Davis Ave"; "Wohelo" / "Camp Wohelo"; first-name vs full-name).
4. **Only escalate to a subagent when at least one of these holds:**
   - **Multiple entities** to investigate at once (batch makes delegation worth the overhead).
   - **Synthesis required across many files** beyond what you can hold in working memory.
   - **Semantic reasoning needed** that grep can't do (e.g., "find documents that *imply* Alton has equity in X without naming it").
   - **External system involved** (Drive catalog, Gmail search, Calendar) that grep can't reach.
5. **If you do escalate, write the scope correctly.** See [[subagent-scope-discipline]].

**Counter-pattern:** Spinning up a subagent for a single-entity lookup that a 3-second grep would resolve. The subagent path is slower, more error-prone, and routes the question through a scope clause that has to be written right.

**Counter-pattern:** Grepping only `sartor/memory/` and calling it federated. The wiki is federated across `sartor/memory/` + `work/` + `dashboard/` + `archive/` (see [[search-memory-first]] for the full map). The point of the cheap grep is that it is cheap precisely because it is unfiltered — adding a `path:` restriction reintroduces the scope-clause failure mode for no speed gain.

**See also:** [[search-memory-first]] (federation map and rationale), [[subagent-scope-discipline]] (when you do delegate, write the scope as code), [[trust-but-verify-subagent-reports]] (orchestrator-level verification of subagent claims).
